// lib/contracts.ts
import { Address } from 'viem';

// Contract addresses (update after deployment)
export const CONTRACT_ADDRESSES = {
  // Polygon Mainnet
  polygon: {
    factory: undefined as Address | undefined, // Deploy to mainnet when ready
  },
  // Polygon Amoy Testnet
  polygonAmoy: {
    factory: undefined as Address | undefined, // Add your deployed factory address
  },
} as const;

// ABI for SocialTokenFactory contract
export const SOCIAL_TOKEN_FACTORY_ABI = [
  // Contract creation
  {
    name: 'createSocialToken',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: '_name', type: 'string' },
      { name: '_symbol', type: 'string' },
      { name: '_initialSupply', type: 'uint256' },
      { name: '_description', type: 'string' },
      { name: '_imageUrl', type: 'string' },
    ],
    outputs: [{ name: '', type: 'address' }],
  },
  
  // Token info retrieval
  {
    name: 'getTokenInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_tokenAddress', type: 'address' }],
    outputs: [
      { name: 'tokenAddress', type: 'address' },
      { name: 'creator', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
      { name: 'totalVolume', type: 'uint256' },
      { name: 'memberCount', type: 'uint256' },
      { name: 'currentPrice', type: 'uint256' },
    ],
  },
  
  // Get trending tokens
  {
    name: 'getTrendingTokens',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_limit', type: 'uint256' }],
    outputs: [{ name: '', type: 'address[]' }],
  },
  
  // Get creator tokens
  {
    name: 'getCreatorTokens',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_creator', type: 'address' }],
    outputs: [{ name: '', type: 'address[]' }],
  },
  
  // Get all tokens with pagination
  {
    name: 'getAllTokens',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '_offset', type: 'uint256' },
      { name: '_limit', type: 'uint256' },
    ],
    outputs: [
      { name: 'tokens', type: 'address[]' },
      { name: 'totalCount', type: 'uint256' },
    ],
  },
  
  // Platform stats
  {
    name: 'getPlatformStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'totalTokens', type: 'uint256' },
      { name: 'totalVolume', type: 'uint256' },
      { name: 'totalRevenue', type: 'uint256' },
      { name: 'activeTokens', type: 'uint256' },
    ],
  },
  
  // Constants
  {
    name: 'CREATION_FEE',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  
  {
    name: 'PLATFORM_FEE_PERCENT',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  
  // Events
  {
    name: 'TokenCreated',
    type: 'event',
    inputs: [
      { name: 'tokenAddress', type: 'address', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'name', type: 'string', indexed: false },
      { name: 'symbol', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const;

// ABI for individual SocialToken contracts
export const SOCIAL_TOKEN_ABI = [
  // ERC20 standard functions
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  
  // Bonding curve functions
  {
    name: 'getBuyPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getSellPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'buyTokens',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'sellTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_amount', type: 'uint256' }],
    outputs: [],
  },
  
  // Social features
  {
    name: 'checkSocialAccess',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'socialMembers',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'totalMembers',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  
  // Token info
  {
    name: 'getTokenInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'totalSupply', type: 'uint256' },
      { name: 'totalMembers', type: 'uint256' },
      { name: 'creator', type: 'address' },
      { name: 'isVerified', type: 'bool' },
      { name: 'currentPrice', type: 'uint256' },
    ],
  },
  
  // Metadata
  {
    name: 'metadata',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'description', type: 'string' },
      { name: 'imageUrl', type: 'string' },
      { name: 'telegramUrl', type: 'string' },
      { name: 'twitterUrl', type: 'string' },
      { name: 'websiteUrl', type: 'string' },
      { name: 'creator', type: 'address' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'isVerified', type: 'bool' },
    ],
  },
  
  // Events
  {
    name: 'TokenPurchased',
    type: 'event',
    inputs: [
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'ethPaid', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'TokenSold',
    type: 'event',
    inputs: [
      { name: 'seller', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'ethReceived', type: 'uint256', indexed: false },
    ],
  },
] as const;

// Helper function to get contract address for current network
export function getFactoryAddress(chainId: number): Address | undefined {
  switch (chainId) {
    case 137: // Polygon Mainnet
      return CONTRACT_ADDRESSES.polygon.factory;
    case 80002: // Polygon Amoy Testnet
      return CONTRACT_ADDRESSES.polygonAmoy.factory;
    default:
      return undefined;
  }
}

// Contract configuration
export const CONTRACT_CONFIG = {
  creationFee: '0.01', // 0.01 MATIC
  platformFeePercent: 2, // 2%
  maxTokensPerUser: 5,
  minSocialAccess: '10', // $10 worth of tokens for chat access
} as const;