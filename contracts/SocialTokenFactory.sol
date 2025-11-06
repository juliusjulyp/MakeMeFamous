// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SocialToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SocialTokenFactory
 * @dev Factory contract for creating social tokens on MakeMeFamous platform
 * Handles token creation, registration, and platform fees
 */
contract SocialTokenFactory is Ownable, ReentrancyGuard, Pausable {
    
    // Platform configuration
    uint256 public constant CREATION_FEE = 0.01 ether; // 0.01 MATIC to create token
    uint256 public constant PLATFORM_FEE_PERCENT = 200; // 2% (200/10000)
    uint256 public constant MAX_TOKENS_PER_USER = 5; // Prevent spam
    
    // Token registry
    struct TokenInfo {
        address tokenAddress;
        address creator;
        string name;
        string symbol;
        uint256 createdAt;
        bool isActive;
        uint256 totalVolume;
        uint256 memberCount;
    }
    
    mapping(address => TokenInfo) public tokenRegistry;
    mapping(address => address[]) public creatorTokens;
    mapping(address => uint256) public creatorTokenCount;
    
    address[] public allTokens;
    uint256 public totalTokensCreated;
    uint256 public totalVolumeTraded;
    
    // Platform revenue tracking
    uint256 public platformRevenue;
    mapping(address => uint256) public creatorRevenue;
    
    // Events
    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 timestamp
    );
    
    event TokenTraded(
        address indexed tokenAddress,
        address indexed trader,
        uint256 amount,
        uint256 ethValue,
        bool isBuy
    );
    
    event PlatformFeeCollected(address indexed token, uint256 amount);
    event CreatorRevenueCollected(address indexed creator, uint256 amount);
    
    constructor() Ownable(msg.sender) {
        // Constructor empty - all setup done in initializer pattern if needed
    }
    
    /**
     * @dev Create a new social token
     * @param _name Token name (e.g., "Dogecoin Killers")
     * @param _symbol Token symbol (e.g., "DOGEK")
     * @param _initialSupply Initial token supply (can be 0 for pure bonding curve)
     * @param _description Token description for social features
     * @param _imageUrl IPFS or HTTP URL for token image
     */
    function createSocialToken(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply,
        string memory _description,
        string memory _imageUrl
    ) external payable nonReentrant whenNotPaused returns (address) {
        require(msg.value >= CREATION_FEE, "Insufficient creation fee");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_symbol).length > 0, "Symbol cannot be empty");
        require(creatorTokenCount[msg.sender] < MAX_TOKENS_PER_USER, "Max tokens per user exceeded");
        
        // Deploy new SocialToken contract
        SocialToken newToken = new SocialToken(
            _name,
            _symbol,
            msg.sender,
            _initialSupply,
            _description,
            _imageUrl
        );
        
        address tokenAddress = address(newToken);
        
        // Register token
        tokenRegistry[tokenAddress] = TokenInfo({
            tokenAddress: tokenAddress,
            creator: msg.sender,
            name: _name,
            symbol: _symbol,
            createdAt: block.timestamp,
            isActive: true,
            totalVolume: 0,
            memberCount: 0
        });
        
        // Update creator tracking
        creatorTokens[msg.sender].push(tokenAddress);
        creatorTokenCount[msg.sender]++;
        
        // Update global stats
        allTokens.push(tokenAddress);
        totalTokensCreated++;
        
        // Collect platform fee
        platformRevenue += msg.value;
        
        emit TokenCreated(tokenAddress, msg.sender, _name, _symbol, block.timestamp);
        
        return tokenAddress;
    }
    
    /**
     * @dev Record trading activity (called by SocialToken contracts)
     */
    function recordTrade(
        address _token,
        address _trader,
        uint256 _amount,
        uint256 _ethValue,
        bool _isBuy
    ) external {
        require(tokenRegistry[_token].tokenAddress != address(0), "Token not registered");
        require(msg.sender == _token, "Only token contract can record trades");
        
        // Update volume tracking
        tokenRegistry[_token].totalVolume += _ethValue;
        totalVolumeTraded += _ethValue;
        
        // Calculate and collect platform fee
        uint256 platformFee = (_ethValue * PLATFORM_FEE_PERCENT) / 10000;
        uint256 creatorFee = (_ethValue * PLATFORM_FEE_PERCENT) / 10000;
        
        if (platformFee > 0) {
            platformRevenue += platformFee;
            creatorRevenue[tokenRegistry[_token].creator] += creatorFee;
            
            emit PlatformFeeCollected(_token, platformFee);
        }
        
        emit TokenTraded(_token, _trader, _amount, _ethValue, _isBuy);
    }
    
    /**
     * @dev Get token info for frontend
     */
    function getTokenInfo(address _tokenAddress) external view returns (
        address tokenAddress,
        address creator,
        string memory name,
        string memory symbol,
        uint256 createdAt,
        bool isActive,
        uint256 totalVolume,
        uint256 memberCount,
        uint256 currentPrice
    ) {
        TokenInfo memory info = tokenRegistry[_tokenAddress];
        require(info.tokenAddress != address(0), "Token not found");
        
        // Get current price from token contract
        uint256 price = 0;
        if (info.isActive) {
            try SocialToken(_tokenAddress).getBuyPrice(1e18) returns (uint256 p) {
                price = p;
            } catch {
                price = 0;
            }
        }
        
        return (
            info.tokenAddress,
            info.creator,
            info.name,
            info.symbol,
            info.createdAt,
            info.isActive,
            info.totalVolume,
            info.memberCount,
            price
        );
    }
    
    /**
     * @dev Get all tokens created by a specific creator
     */
    function getCreatorTokens(address _creator) external view returns (address[] memory) {
        return creatorTokens[_creator];
    }
    
    /**
     * @dev Get paginated list of all tokens
     */
    function getAllTokens(uint256 _offset, uint256 _limit) external view returns (
        address[] memory tokens,
        uint256 totalCount
    ) {
        totalCount = allTokens.length;
        
        if (_offset >= totalCount) {
            return (new address[](0), totalCount);
        }
        
        uint256 end = _offset + _limit;
        if (end > totalCount) {
            end = totalCount;
        }
        
        tokens = new address[](end - _offset);
        for (uint256 i = _offset; i < end; i++) {
            tokens[i - _offset] = allTokens[i];
        }
        
        return (tokens, totalCount);
    }
    
    /**
     * @dev Get trending tokens (by volume or member count)
     */
    function getTrendingTokens(uint256 _limit) external view returns (address[] memory) {
        // Simple implementation - return most recent tokens
        // In production, implement proper sorting by volume/activity
        uint256 length = allTokens.length;
        uint256 returnLength = _limit > length ? length : _limit;
        
        address[] memory trending = new address[](returnLength);
        
        for (uint256 i = 0; i < returnLength; i++) {
            trending[i] = allTokens[length - 1 - i]; // Most recent first
        }
        
        return trending;
    }
    
    /**
     * @dev Verify a token (admin function)
     */
    function verifyToken(address _tokenAddress) external onlyOwner {
        require(tokenRegistry[_tokenAddress].tokenAddress != address(0), "Token not found");
        
        SocialToken(_tokenAddress).verifyToken();
    }
    
    /**
     * @dev Disable a token (admin function for moderation)
     */
    function disableToken(address _tokenAddress) external onlyOwner {
        require(tokenRegistry[_tokenAddress].tokenAddress != address(0), "Token not found");
        
        tokenRegistry[_tokenAddress].isActive = false;
    }
    
    /**
     * @dev Update platform fees (admin function)
     */
    function updateCreationFee(uint256 _newFee) external view onlyOwner {
        require(_newFee <= 0.1 ether, "Fee too high");
        // Would emit event and update constant in upgradeable version
    }
    
    /**
     * @dev Withdraw platform revenue (admin function)
     */
    function withdrawPlatformRevenue() external onlyOwner {
        uint256 amount = platformRevenue;
        require(amount > 0, "No revenue to withdraw");
        
        platformRevenue = 0;
        
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Withdraw creator revenue
     */
    function withdrawCreatorRevenue() external nonReentrant {
        uint256 amount = creatorRevenue[msg.sender];
        require(amount > 0, "No revenue to withdraw");
        
        creatorRevenue[msg.sender] = 0;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdrawal failed");
        
        emit CreatorRevenueCollected(msg.sender, amount);
    }
    
    /**
     * @dev Pause contract (emergency function)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get platform statistics
     */
    function getPlatformStats() external view returns (
        uint256 totalTokens,
        uint256 totalVolume,
        uint256 totalRevenue,
        uint256 activeTokens
    ) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < allTokens.length; i++) {
            if (tokenRegistry[allTokens[i]].isActive) {
                activeCount++;
            }
        }
        
        return (
            totalTokensCreated,
            totalVolumeTraded,
            platformRevenue,
            activeCount
        );
    }
}