// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SocialToken
 * @dev ERC20 token with social features and bonding curve mechanics
 * Each token created through MakeMeFamous platform uses this template
 */
contract SocialToken is ERC20, ERC20Burnable, Ownable, ReentrancyGuard {
    
    // Token metadata for social features
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
    
    // Bonding curve parameters
    uint256 public constant CURVE_MULTIPLIER = 1000; // Price increases by 0.1% per token
    uint256 public constant INITIAL_PRICE = 1e15; // 0.001 ETH starting price
    uint256 public totalEthLiquidity;
    
    // Social features
    mapping(address => bool) public socialMembers;
    mapping(address => uint256) public membershipTimestamp;
    uint256 public totalMembers;
    
    // Events
    event TokenPurchased(address indexed buyer, uint256 amount, uint256 ethPaid);
    event TokenSold(address indexed seller, uint256 amount, uint256 ethReceived);
    event SocialMemberAdded(address indexed member);
    event SocialMemberRemoved(address indexed member);
    event MetadataUpdated(string field, string newValue);
    
    constructor(
        string memory _name,
        string memory _symbol,
        address _creator,
        uint256 _initialSupply,
        string memory _description,
        string memory _imageUrl
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
        
        
        // Mint initial supply to creator
        if (_initialSupply > 0) {
            _mint(_creator, _initialSupply);
        }
    }
    
    /**
     * @dev Calculate price for buying tokens using bonding curve
     * Price = INITIAL_PRICE * (1 + CURVE_MULTIPLIER * totalSupply / 1e18)
     */
    function getBuyPrice(uint256 _amount) public view returns (uint256) {
        if (_amount == 0) return 0;
        
        uint256 currentSupply = totalSupply();
        uint256 avgPrice = INITIAL_PRICE + 
            (CURVE_MULTIPLIER * (currentSupply + currentSupply + _amount) / 2) / 1e18;
        
        return avgPrice * _amount / 1e18;
    }
    
    /**
     * @dev Calculate price for selling tokens using bonding curve
     */
    function getSellPrice(uint256 _amount) public view returns (uint256) {
        if (_amount == 0) return 0;
        
        uint256 currentSupply = totalSupply();
        if (_amount > currentSupply) return 0;
        
        uint256 avgPrice = INITIAL_PRICE + 
            (CURVE_MULTIPLIER * (currentSupply + currentSupply - _amount) / 2) / 1e18;
        
        return avgPrice * _amount / 1e18;
    }
    
    /**
     * @dev Buy tokens with ETH using bonding curve
     */
    function buyTokens() external payable nonReentrant {
        require(msg.value > 0, "Must send ETH to buy tokens");
        
        // Calculate how many tokens can be bought with sent ETH
        uint256 tokensToBuy = _calculateTokensFromEth(msg.value);
        require(tokensToBuy > 0, "Insufficient ETH for any tokens");
        
        // Mint tokens to buyer
        _mint(msg.sender, tokensToBuy);
        
        // Add to liquidity pool
        totalEthLiquidity += msg.value;
        
        // Update social membership
        _updateSocialMembership(msg.sender);
        
        emit TokenPurchased(msg.sender, tokensToBuy, msg.value);
    }
    
    /**
     * @dev Sell tokens for ETH using bonding curve
     */
    function sellTokens(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= _amount, "Insufficient token balance");
        
        uint256 ethToSend = getSellPrice(_amount);
        require(ethToSend > 0, "No ETH available for sale");
        require(address(this).balance >= ethToSend, "Insufficient contract ETH");
        
        // Burn tokens
        _burn(msg.sender, _amount);
        
        // Send ETH to seller
        totalEthLiquidity -= ethToSend;
        (bool success, ) = msg.sender.call{value: ethToSend}("");
        require(success, "ETH transfer failed");
        
        // Update social membership
        _updateSocialMembership(msg.sender);
        
        emit TokenSold(msg.sender, _amount, ethToSend);
    }
    
    /**
     * @dev Check if user qualifies for social features (minimum $10 USD worth)
     */
    function checkSocialAccess(address _user) external view returns (bool) {
        uint256 balance = balanceOf(_user);
        if (balance == 0) return false;
        
        // For demo: assume 1 token = $1 USD, so need 10 tokens minimum
        // In production, this would integrate with price oracles
        return balance >= 10 * 1e18;
    }
    
    /**
     * @dev Update social membership based on token holdings
     */
    function _updateSocialMembership(address _user) internal {
        bool qualifiesForSocial = this.checkSocialAccess(_user);
        bool isCurrentMember = socialMembers[_user];
        
        if (qualifiesForSocial && !isCurrentMember) {
            // Add to social members
            socialMembers[_user] = true;
            membershipTimestamp[_user] = block.timestamp;
            totalMembers++;
            emit SocialMemberAdded(_user);
        } else if (!qualifiesForSocial && isCurrentMember) {
            // Remove from social members
            socialMembers[_user] = false;
            membershipTimestamp[_user] = 0;
            totalMembers--;
            emit SocialMemberRemoved(_user);
        }
    }
    
    /**
     * @dev Calculate tokens from ETH amount (simplified bonding curve)
     */
    function _calculateTokensFromEth(uint256 _ethAmount) internal view returns (uint256) {
        // Simplified calculation - in production use more sophisticated curve
        uint256 currentSupply = totalSupply();
        uint256 avgPrice = INITIAL_PRICE + (CURVE_MULTIPLIER * currentSupply) / 1e18;
        
        return (_ethAmount * 1e18) / avgPrice;
    }
    
    /**
     * @dev Update social media links (only owner)
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
     * @dev Verify token (only callable by factory or admin)
     */
    function verifyToken() external {
        // In production, this would have proper access control
        metadata.isVerified = true;
        emit MetadataUpdated("verified", "true");
    }
    
    /**
     * @dev Emergency withdrawal (only owner, with timelock in production)
     */
    function emergencyWithdraw() external onlyOwner {
        require(block.timestamp > metadata.createdAt + 7 days, "Timelock not expired");
        
        uint256 balance = address(this).balance;
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Get token info for frontend
     */
    function getTokenInfo() external view returns (
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint256 totalMembersCount,
        address creator,
        bool isVerified,
        uint256 currentPrice
    ) {
        return (
            super.name(),
            super.symbol(),
            super.totalSupply(),
            totalMembers,
            metadata.creator,
            metadata.isVerified,
            getBuyPrice(1e18) // Price for 1 token
        );
    }
}


// "factoryAddress": "0x8216A11dadb24582B429447601a4dd336AEFcC97",
//  SocialTokenFactory deployed to: 0x8216A11dadb24582B429447601a4dd336AEFcC97