// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SocialTokenV2
 * @dev IMPROVED ERC20 token with better bonding curve and fee distribution
 *
 * KEY IMPROVEMENTS:
 * 1. Quadratic bonding curve (price grows faster = early buyer advantage)
 * 2. Automatic fee distribution (1% creator, 2% platform)
 * 3. Fair launch (no initial supply minting)
 * 4. Integrated with factory for fee collection
 */
contract SocialTokenV2 is ERC20, ERC20Burnable, Ownable, ReentrancyGuard {

    // ========== TOKEN METADATA ==========
    struct TokenMetadata {
        string description;
        string imageUrl;
        string telegramUrl;
        string twitterUrl;
        string websiteUrl;
        address creator;
        uint256 createdAt;
        bool isVerified;
    }

    TokenMetadata public metadata;

    // ========== BONDING CURVE PARAMETERS ==========
    // IMPROVED: Quadratic curve for better price discovery
    // Formula: price = basePrice + (k * supply²)
    // This means: early buyers get much better prices!

    uint256 public constant BASE_PRICE = 1e12;        // 0.000001 MATIC (starting price)
    uint256 public constant CURVE_COEFFICIENT = 1e6;   // Controls curve steepness

    // EXPLANATION:
    // - With 1000 tokens: price ≈ 0.000002 MATIC (2x base)
    // - With 10,000 tokens: price ≈ 0.0001 MATIC (100x base)
    // - With 100,000 tokens: price ≈ 0.01 MATIC (10,000x base)
    // Early buyers get MASSIVE advantage!

    // ========== FEE STRUCTURE ==========
    uint256 public constant CREATOR_FEE_PERCENT = 100;   // 1% (100/10000)
    uint256 public constant PLATFORM_FEE_PERCENT = 200;  // 2% (200/10000)
    uint256 public constant TOTAL_FEE_PERCENT = 300;     // 3% total

    // EXPLANATION:
    // When someone buys $100 worth:
    // - $1 goes to token creator (passive income!)
    // - $2 goes to platform
    // - $97 goes to liquidity pool

    // ========== STATE VARIABLES ==========
    address public immutable factory;         // Factory contract address
    uint256 public totalEthLiquidity;         // Total MATIC in liquidity pool
    uint256 public totalVolumeTraded;         // Lifetime trading volume

    // ========== GRADUATION CONSTANTS ==========
    uint256 public constant MAX_SUPPLY = 1000000 * 1e18;           // 1M tokens total
    uint256 public constant GRADUATION_SUPPLY = 800000 * 1e18;     // 80% for bonding curve
    uint256 public constant LP_SUPPLY = 200000 * 1e18;             // 20% for QuickSwap LP
    uint256 public constant MIN_LIQUIDITY = 500 ether;             // Minimum 500 MATIC to graduate

    // QuickSwap V2 Router on Polygon Mainnet
    address public constant QUICKSWAP_ROUTER = 0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff;

    // Graduation state
    bool public hasGraduated;
    address public liquidityPool;              // QuickSwap pair address after graduation
    uint256 public graduatedAt;                // Timestamp of graduation

    // ========== SOCIAL FEATURES ==========
    mapping(address => bool) public socialMembers;
    mapping(address => uint256) public membershipTimestamp;
    uint256 public totalMembers;

    // ========== EVENTS ==========
    event TokenPurchased(
        address indexed buyer,
        uint256 tokensReceived,
        uint256 ethPaid,
        uint256 newPrice
    );

    event TokenSold(
        address indexed seller,
        uint256 tokensSold,
        uint256 ethReceived,
        uint256 newPrice
    );

    event FeesDistributed(
        uint256 creatorFee,
        uint256 platformFee,
        uint256 liquidity
    );

    event SocialMemberAdded(address indexed member);
    event SocialMemberRemoved(address indexed member);
    event MetadataUpdated(string field, string newValue);

    event Graduated(
        address indexed token,
        uint256 maticLiquidity,
        uint256 tokenLiquidity,
        uint256 lpTokensBurned,
        address indexed pair,
        uint256 timestamp
    );

    // ========== CONSTRUCTOR ==========
    constructor(
        string memory _name,
        string memory _symbol,
        address _creator,
        string memory _description,
        string memory _imageUrl,
        address _factory
    ) ERC20(_name, _symbol) Ownable(_creator) {
        metadata = TokenMetadata({
            description: _description,
            imageUrl: _imageUrl,
            telegramUrl: "",
            twitterUrl: "",
            websiteUrl: "",
            creator: _creator,
            createdAt: block.timestamp,
            isVerified: false
        });

        factory = _factory;

        // IMPORTANT: No initial supply!
        // Everyone must buy through the bonding curve
        // This ensures fair launch for all participants
    }

    // ========== BONDING CURVE PRICING ==========

    /**
     * @dev Calculate current token price using QUADRATIC bonding curve
     * @return Current price for 1 token in wei (MATIC)
     *
     * FORMULA: price = BASE_PRICE + (CURVE_COEFFICIENT * (supply / 1e18)²)
     *
     * EXPLANATION:
     * This is a quadratic curve, which means price grows FASTER as supply increases.
     *
     * Example with BASE_PRICE=0.000001, CURVE_COEFFICIENT=1e6:
     * - 0 tokens: 0.000001 MATIC
     * - 1,000 tokens: 0.000002 MATIC (2x)
     * - 10,000 tokens: 0.0001 MATIC (100x)
     * - 100,000 tokens: 0.01 MATIC (10,000x)
     *
     * This creates strong incentive to buy early!
     */
    function getCurrentPrice() public view returns (uint256) {
        uint256 supply = totalSupply();
        if (supply == 0) return BASE_PRICE;

        // Convert supply to ether units for calculation
        uint256 supplyInEth = supply / 1e18;

        // Calculate quadratic component: k * supply²
        uint256 quadraticComponent = (CURVE_COEFFICIENT * supplyInEth * supplyInEth);

        return BASE_PRICE + quadraticComponent;
    }

    /**
     * @dev Calculate cost to buy a specific amount of tokens
     * @param _amount Number of tokens to buy (in wei, e.g., 1e18 = 1 token)
     * @return Total MATIC cost including fees
     *
     * EXPLANATION:
     * We use integration to calculate the area under the bonding curve.
     * For quadratic curve y = a + bx², the integral is: ax + (b/3)x³
     *
     * We calculate:
     * 1. Cost from current supply to (current supply + amount)
     * 2. Add 3% fees on top
     */
    function getBuyPrice(uint256 _amount) public view returns (uint256) {
        if (_amount == 0) return 0;

        uint256 currentSupply = totalSupply();
        uint256 newSupply = currentSupply + _amount;

        // Calculate integral under curve from currentSupply to newSupply
        uint256 cost = _integrateCurve(currentSupply, newSupply);

        // Add 3% fees (cost * 1.03)
        uint256 costWithFees = (cost * 10300) / 10000;

        return costWithFees;
    }

    /**
     * @dev Calculate MATIC received when selling tokens
     * @param _amount Number of tokens to sell
     * @return MATIC amount seller will receive (after fees)
     *
     * EXPLANATION:
     * Same as buy, but reversed:
     * 1. Calculate value from (current supply - amount) to current supply
     * 2. Subtract 3% fees
     */
    function getSellPrice(uint256 _amount) public view returns (uint256) {
        if (_amount == 0) return 0;

        uint256 currentSupply = totalSupply();
        if (_amount > currentSupply) return 0;

        uint256 newSupply = currentSupply - _amount;

        // Calculate integral under curve from newSupply to currentSupply
        uint256 value = _integrateCurve(newSupply, currentSupply);

        // Subtract 3% fees (value * 0.97)
        uint256 valueAfterFees = (value * 9700) / 10000;

        return valueAfterFees;
    }

    /**
     * @dev Calculate definite integral of bonding curve from x1 to x2
     * @param _supplyStart Starting supply
     * @param _supplyEnd Ending supply
     * @return Area under the curve (total cost)
     *
     * MATH EXPLANATION:
     * Our curve is: y = BASE_PRICE + CURVE_COEFFICIENT * x²
     *
     * Integral: ∫(a + bx²)dx = ax + (b/3)x³
     *
     * Definite integral from x₁ to x₂:
     * [ax + (b/3)x³] evaluated from x₁ to x₂
     * = (ax₂ + (b/3)x₂³) - (ax₁ + (b/3)x₁³)
     */
    function _integrateCurve(uint256 _supplyStart, uint256 _supplyEnd) internal pure returns (uint256) {
        // Convert to ether units for calculation
        uint256 x1 = _supplyStart / 1e18;
        uint256 x2 = _supplyEnd / 1e18;

        // Calculate: BASE_PRICE * (x2 - x1)
        uint256 linearPart = BASE_PRICE * (x2 - x1);

        // Calculate: (CURVE_COEFFICIENT / 3) * (x2³ - x1³)
        uint256 x2Cubed = x2 * x2 * x2;
        uint256 x1Cubed = x1 * x1 * x1;
        uint256 cubicPart = (CURVE_COEFFICIENT * (x2Cubed - x1Cubed)) / 3;

        return linearPart + cubicPart;
    }

    // ========== TRADING FUNCTIONS ==========

    /**
     * @dev Buy tokens with MATIC
     *
     * FLOW:
     * 1. User sends MATIC
     * 2. Calculate fees (1% creator, 2% platform)
     * 3. Send fees to recipients
     * 4. Add remaining MATIC to liquidity pool
     * 5. Mint tokens to buyer
     * 6. Update social membership
     * 7. Report trade to factory
     */
    function buyTokens() external payable nonReentrant {
        require(!hasGraduated, "Token has graduated - trade on QuickSwap");
        require(msg.value > 0, "Must send MATIC to buy tokens");

        // Calculate how many tokens can be bought
        uint256 tokensToBuy = _calculateTokensFromEth(msg.value);
        require(tokensToBuy > 0, "Insufficient MATIC for any tokens");

        // Prevent buying beyond graduation supply
        require(totalSupply() + tokensToBuy <= GRADUATION_SUPPLY, "Purchase would exceed graduation supply");

        // Calculate fee distribution
        uint256 creatorFee = (msg.value * CREATOR_FEE_PERCENT) / 10000;  // 1%
        uint256 platformFee = (msg.value * PLATFORM_FEE_PERCENT) / 10000; // 2%
        uint256 liquidityAmount = msg.value - creatorFee - platformFee;   // 97%

        // Send creator fee directly
        (bool creatorSuccess, ) = metadata.creator.call{value: creatorFee}("");
        require(creatorSuccess, "Creator fee transfer failed");

        // Send platform fee to factory
        (bool platformSuccess, ) = factory.call{value: platformFee}("");
        require(platformSuccess, "Platform fee transfer failed");

        // Add to liquidity pool
        totalEthLiquidity += liquidityAmount;
        totalVolumeTraded += msg.value;

        // Mint tokens to buyer
        _mint(msg.sender, tokensToBuy);

        // Update social membership
        _updateSocialMembership(msg.sender);

        // Get new price after purchase
        uint256 newPrice = getCurrentPrice();

        emit FeesDistributed(creatorFee, platformFee, liquidityAmount);
        emit TokenPurchased(msg.sender, tokensToBuy, msg.value, newPrice);

        // Report trade to factory (for analytics)
        _reportTradeToFactory(msg.sender, tokensToBuy, msg.value, true);
    }

    /**
     * @dev Sell tokens for MATIC
     *
     * FLOW:
     * 1. Check user has tokens
     * 2. Calculate MATIC to return (after fees)
     * 3. Burn tokens
     * 4. Send MATIC to seller
     * 5. Update social membership
     * 6. Report trade to factory
     */
    function sellTokens(uint256 _amount) external nonReentrant {
        require(!hasGraduated, "Token has graduated - trade on QuickSwap");
        require(_amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= _amount, "Insufficient token balance");

        uint256 ethToReturn = getSellPrice(_amount);
        require(ethToReturn > 0, "No MATIC available for sale");
        require(totalEthLiquidity >= ethToReturn, "Insufficient liquidity");

        // Burn tokens
        _burn(msg.sender, _amount);

        // Update liquidity
        totalEthLiquidity -= ethToReturn;
        totalVolumeTraded += ethToReturn;

        // Send MATIC to seller
        (bool success, ) = msg.sender.call{value: ethToReturn}("");
        require(success, "MATIC transfer failed");

        // Update social membership
        _updateSocialMembership(msg.sender);

        // Get new price after sale
        uint256 newPrice = getCurrentPrice();

        emit TokenSold(msg.sender, _amount, ethToReturn, newPrice);

        // Report trade to factory
        _reportTradeToFactory(msg.sender, _amount, ethToReturn, false);
    }

    /**
     * @dev PUBLIC: Calculate how many tokens can be bought with given MATIC
     * @param _maticAmount Amount of MATIC to spend
     * @return Number of tokens that can be purchased
     *
     * EXPLANATION:
     * This is the INVERSE of getBuyPrice().
     * Instead of "how much MATIC for X tokens", this answers "how many tokens for X MATIC".
     *
     * Uses binary search because bonding curve makes direct calculation complex.
     *
     * EXAMPLE:
     * getTokensForMatic(5 ether) → might return 102.5 tokens
     */
    function getTokensForMatic(uint256 _maticAmount) public view returns (uint256) {
        return _calculateTokensFromEth(_maticAmount);
    }

    /**
     * @dev Helper: Calculate how many tokens can be bought with given MATIC
     * Uses binary search to find the right amount
     */
    function _calculateTokensFromEth(uint256 _ethAmount) internal view returns (uint256) {
        // Binary search to find tokens amount
        uint256 low = 0;
        uint256 high = _ethAmount * 1e18; // Max possible tokens
        uint256 result = 0;

        // Iterate to find the right amount
        for (uint256 i = 0; i < 100; i++) {
            uint256 mid = (low + high) / 2;
            uint256 cost = getBuyPrice(mid);

            if (cost <= _ethAmount) {
                result = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }

            if (low > high) break;
        }

        return result;
    }

    /**
     * @dev NEW: Buy tokens by specifying exact MATIC amount to spend
     *
     * DIFFERENCE FROM buyTokens():
     * - buyTokens(): User wants X tokens, contract calculates MATIC cost
     * - buyWithExactMatic(): User wants to spend X MATIC, contract calculates tokens received
     *
     * FLOW:
     * 1. User sends exact MATIC amount (msg.value)
     * 2. Calculate how many tokens they get
     * 3. Get actual cost for those tokens
     * 4. Refund any excess MATIC
     * 5. Distribute fees and mint tokens
     *
     * EXAMPLE:
     * User sends 5 MATIC
     * → Gets 102.5 tokens
     * → Actual cost: 4.98 MATIC
     * → Refund: 0.02 MATIC
     */
    function buyWithExactMatic() external payable nonReentrant {
        require(!hasGraduated, "Token has graduated - trade on QuickSwap");
        require(msg.value > 0, "Must send MATIC to buy tokens");

        // Calculate how many tokens for this MATIC amount
        uint256 tokensToBuy = _calculateTokensFromEth(msg.value);
        require(tokensToBuy > 0, "Insufficient MATIC for any tokens");

        // Prevent buying beyond graduation supply
        require(totalSupply() + tokensToBuy <= GRADUATION_SUPPLY, "Purchase would exceed graduation supply");

        // Get the actual cost for these tokens (might be slightly less than msg.value)
        uint256 actualCost = getBuyPrice(tokensToBuy);
        require(actualCost <= msg.value, "Price calculation error");

        // Calculate refund (due to rounding in binary search)
        uint256 refund = msg.value - actualCost;

        // Calculate fee distribution from actual cost
        uint256 creatorFee = (actualCost * CREATOR_FEE_PERCENT) / 10000;  // 1%
        uint256 platformFee = (actualCost * PLATFORM_FEE_PERCENT) / 10000; // 2%
        uint256 liquidityAmount = actualCost - creatorFee - platformFee;   // 97%

        // Send creator fee
        (bool creatorSuccess, ) = metadata.creator.call{value: creatorFee}("");
        require(creatorSuccess, "Creator fee transfer failed");

        // Send platform fee to factory
        (bool platformSuccess, ) = factory.call{value: platformFee}("");
        require(platformSuccess, "Platform fee transfer failed");

        // Add to liquidity pool
        totalEthLiquidity += liquidityAmount;
        totalVolumeTraded += actualCost;

        // Mint tokens to buyer
        _mint(msg.sender, tokensToBuy);

        // Update social membership
        _updateSocialMembership(msg.sender);

        // Refund excess MATIC if any
        if (refund > 0) {
            (bool refundSuccess, ) = msg.sender.call{value: refund}("");
            require(refundSuccess, "Refund failed");
        }

        // Get new price after purchase
        uint256 newPrice = getCurrentPrice();

        emit FeesDistributed(creatorFee, platformFee, liquidityAmount);
        emit TokenPurchased(msg.sender, tokensToBuy, actualCost, newPrice);

        // Report trade to factory (for analytics)
        _reportTradeToFactory(msg.sender, tokensToBuy, actualCost, true);
    }

    /**
     * @dev Report trade to factory for analytics and fee collection
     */
    function _reportTradeToFactory(
        address _trader,
        uint256 _amount,
        uint256 _ethValue,
        bool _isBuy
    ) internal {
        // Call factory's recordTrade function
        // This updates platform statistics and handles fee accounting
        try IFactory(factory).recordTrade(
            address(this),
            _trader,
            _amount,
            _ethValue,
            _isBuy
        ) {} catch {
            // Silently fail if factory doesn't support this
            // This ensures backward compatibility
        }
    }

    // ========== SOCIAL FEATURES ==========

    /**
     * @dev Check if user has minimum $10 worth of tokens for chat access
     *
     * CALCULATION:
     * User needs tokens worth at least $10 USD
     * Assuming 1 MATIC ≈ $0.50 (adjust as needed)
     * $10 / $0.50 = 20 MATIC worth of tokens
     */
    function checkSocialAccess(address _user) external view returns (bool) {
        uint256 balance = balanceOf(_user);
        if (balance == 0) return false;

        // Calculate value of user's tokens
        uint256 tokenValue = getSellPrice(balance);

        // Minimum 20 MATIC worth (≈$10 at $0.50/MATIC)
        uint256 minimumValue = 20 ether;

        return tokenValue >= minimumValue;
    }

    /**
     * @dev Update user's social membership status
     */
    function _updateSocialMembership(address _user) internal {
        bool qualifies = this.checkSocialAccess(_user);
        bool isMember = socialMembers[_user];

        if (qualifies && !isMember) {
            // Add to social members
            socialMembers[_user] = true;
            membershipTimestamp[_user] = block.timestamp;
            totalMembers++;
            emit SocialMemberAdded(_user);
        } else if (!qualifies && isMember) {
            // Remove from social members
            socialMembers[_user] = false;
            membershipTimestamp[_user] = 0;
            totalMembers--;
            emit SocialMemberRemoved(_user);
        }
    }

    // ========== ADMIN FUNCTIONS ==========

    /**
     * @dev Update social media links (only creator)
     */
    function updateSocialLinks(
        string memory _telegramUrl,
        string memory _twitterUrl,
        string memory _websiteUrl
    ) external onlyOwner {
        metadata.telegramUrl = _telegramUrl;
        metadata.twitterUrl = _twitterUrl;
        metadata.websiteUrl = _websiteUrl;

        emit MetadataUpdated("socialLinks", "updated");
    }

    /**
     * @dev Verify token (only factory/admin)
     */
    function verifyToken() external {
        require(msg.sender == factory || msg.sender == owner(), "Not authorized");
        metadata.isVerified = true;
        emit MetadataUpdated("verified", "true");
    }

    // ========== VIEW FUNCTIONS ==========

    /**
     * @dev Get comprehensive token info for frontend
     */
    function getTokenInfo() external view returns (
        string memory name,
        string memory symbol,
        uint256 supply,
        uint256 members,
        address creator,
        bool isVerified,
        uint256 currentPrice,
        uint256 liquidity,
        uint256 volume
    ) {
        return (
            super.name(),
            super.symbol(),
            super.totalSupply(),
            totalMembers,
            metadata.creator,
            metadata.isVerified,
            getCurrentPrice(),
            totalEthLiquidity,
            totalVolumeTraded
        );
    }

    /**
     * @dev Get price impact for buying a specific amount
     * @return percentImpact Price impact as percentage (in basis points, e.g., 250 = 2.5%)
     */
    function getBuyPriceImpact(uint256 _amount) external view returns (uint256 percentImpact) {
        uint256 currentPrice = getCurrentPrice();
        uint256 currentSupply = totalSupply();

        // Simulate price after purchase
        uint256 newSupply = currentSupply + _amount;
        uint256 newPrice = BASE_PRICE + (CURVE_COEFFICIENT * (newSupply / 1e18) * (newSupply / 1e18));

        // Calculate percentage change
        if (currentPrice == 0) return 0;
        percentImpact = ((newPrice - currentPrice) * 10000) / currentPrice;

        return percentImpact;
    }

    // ========== QUICKSWAP GRADUATION ==========

    /**
     * @dev Check if token is ready to graduate to QuickSwap
     * @return bool True if graduation criteria are met
     *
     * CRITERIA:
     * 1. Token has not already graduated
     * 2. Total supply has reached 800,000 tokens (80% of max)
     * 3. At least 500 MATIC in liquidity pool
     *
     * EXPLANATION:
     * The bonding curve phase is designed to build initial community and liquidity.
     * Once 80% of tokens are sold and sufficient liquidity exists,
     * the token "graduates" to QuickSwap for full DEX trading.
     */
    function canGraduate() public view returns (bool) {
        return (
            !hasGraduated &&
            totalSupply() >= GRADUATION_SUPPLY &&
            totalEthLiquidity >= MIN_LIQUIDITY
        );
    }

    /**
     * @dev Graduate token to QuickSwap DEX (pump.fun style)
     *
     * FLOW:
     * 1. Check graduation eligibility
     * 2. Mint 200,000 LP tokens (20% of max supply)
     * 3. Use 100% of accumulated MATIC for liquidity (0% graduation fee - Option A)
     * 4. Approve QuickSwap router
     * 5. Add liquidity to QuickSwap (creates MATIC/TOKEN pair)
     * 6. Burn LP tokens to 0xdead (permanent liquidity lock)
     * 7. Mark as graduated and disable bonding curve
     * 8. Emit graduation event
     *
     * ECONOMICS (Option A - User's Choice):
     * - 0% graduation fee
     * - 100% of MATIC goes to QuickSwap LP
     * - Platform already earned 2% on all trades during bonding curve phase
     * - This maximizes liquidity for users (competitive advantage)
     *
     * AFTER GRADUATION:
     * - Bonding curve is disabled (buying/selling reverts)
     * - All trading moves to QuickSwap
     * - Liquidity is permanently locked (can't be removed)
     * - Token becomes fully decentralized
     *
     * SECURITY:
     * - Only callable when criteria met
     * - Reentrancy protected
     * - LP tokens burned to prevent rug pull
     */
    function graduateToQuickSwap() external nonReentrant {
        require(canGraduate(), "Not ready to graduate");
        require(!hasGraduated, "Already graduated");

        // Mark as graduated FIRST to prevent reentrancy
        hasGraduated = true;
        graduatedAt = block.timestamp;

        // 1. Mint LP tokens (20% of max supply = 200,000 tokens)
        _mint(address(this), LP_SUPPLY);

        // 2. Use 100% of MATIC for LP (0% graduation fee - Option A)
        uint256 maticForLP = totalEthLiquidity;
        require(maticForLP >= MIN_LIQUIDITY, "Insufficient MATIC liquidity");

        // 3. Approve QuickSwap router to spend our tokens
        _approve(address(this), QUICKSWAP_ROUTER, LP_SUPPLY);

        // 4. Add liquidity to QuickSwap
        // This creates a MATIC/TOKEN trading pair on QuickSwap
        (uint256 tokenAmount, uint256 maticAmount, uint256 lpTokensReceived) = IQuickSwapRouter(QUICKSWAP_ROUTER)
            .addLiquidityETH{value: maticForLP}(
                address(this),           // Token address
                LP_SUPPLY,               // Token amount (200k tokens)
                0,                       // Min token amount (no slippage protection needed - we control both sides)
                0,                       // Min MATIC amount (no slippage protection needed)
                address(this),           // LP tokens sent to this contract (we'll burn them)
                block.timestamp + 300    // Deadline: 5 minutes from now
            );

        // 5. Get the QuickSwap pair address for this token
        address quickswapFactory = IQuickSwapRouter(QUICKSWAP_ROUTER).factory();
        address wmatic = IQuickSwapRouter(QUICKSWAP_ROUTER).WETH(); // QuickSwap uses WETH() for native token
        liquidityPool = IQuickSwapFactory(quickswapFactory).getPair(address(this), wmatic);

        // 6. Burn LP tokens to 0xdead (permanent liquidity lock)
        // This ensures liquidity can NEVER be removed (prevents rug pull)
        address burnAddress = 0x000000000000000000000000000000000000dEaD;
        ILPToken(liquidityPool).transfer(burnAddress, lpTokensReceived);

        // 7. Update state - zero out liquidity since it's now on QuickSwap
        totalEthLiquidity = 0;

        // 8. Emit graduation event
        emit Graduated(
            address(this),
            maticAmount,
            tokenAmount,
            lpTokensReceived,
            liquidityPool,
            block.timestamp
        );
    }

    /**
     * @dev Get graduation progress information
     * @return supplyProgress Percentage of graduation supply reached (basis points)
     * @return liquidityProgress Percentage of minimum liquidity reached (basis points)
     * @return isReady Whether token can graduate now
     * @return tokensRemaining Tokens needed to reach graduation supply
     * @return maticRemaining MATIC needed to reach minimum liquidity
     *
     * EXAMPLE:
     * If 600,000 tokens minted: supplyProgress = 7500 (75%)
     * If 400 MATIC in pool: liquidityProgress = 8000 (80%)
     * tokensRemaining = 200,000
     * maticRemaining = 100 MATIC
     */
    function getGraduationProgress() external view returns (
        uint256 supplyProgress,
        uint256 liquidityProgress,
        bool isReady,
        uint256 tokensRemaining,
        uint256 maticRemaining
    ) {
        uint256 currentSupply = totalSupply();
        uint256 currentLiquidity = totalEthLiquidity;

        // Calculate supply progress (in basis points, 10000 = 100%)
        supplyProgress = (currentSupply * 10000) / GRADUATION_SUPPLY;
        if (supplyProgress > 10000) supplyProgress = 10000;

        // Calculate liquidity progress (in basis points)
        liquidityProgress = (currentLiquidity * 10000) / MIN_LIQUIDITY;
        if (liquidityProgress > 10000) liquidityProgress = 10000;

        // Check if ready to graduate
        isReady = canGraduate();

        // Calculate remaining amounts
        tokensRemaining = currentSupply >= GRADUATION_SUPPLY ? 0 : GRADUATION_SUPPLY - currentSupply;
        maticRemaining = currentLiquidity >= MIN_LIQUIDITY ? 0 : MIN_LIQUIDITY - currentLiquidity;

        return (supplyProgress, liquidityProgress, isReady, tokensRemaining, maticRemaining);
    }

}

// ========== INTERFACES ==========

/**
 * @dev Interface for factory contract
 */
interface IFactory {
    function recordTrade(
        address token,
        address trader,
        uint256 amount,
        uint256 ethValue,
        bool isBuy
    ) external;
}

/**
 * @dev Interface for QuickSwap V2 Router
 * Based on Uniswap V2 Router interface
 */
interface IQuickSwapRouter {
    function factory() external pure returns (address);
    function WETH() external pure returns (address);

    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external payable returns (
        uint256 amountToken,
        uint256 amountETH,
        uint256 liquidity
    );
}

/**
 * @dev Interface for QuickSwap V2 Factory
 */
interface IQuickSwapFactory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

/**
 * @dev Interface for ERC20 LP tokens (for LP token transfers)
 */
interface ILPToken {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}
