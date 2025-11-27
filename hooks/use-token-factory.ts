// hooks/use-token-factory.ts
'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseEther, Address } from 'viem';
import { 
  SOCIAL_TOKEN_FACTORY_ABI, 
  getFactoryAddress, 
  CONTRACT_CONFIG 
} from '@/lib/contracts';

interface CreateTokenParams {
  name: string;
  symbol: string;
  initialSupply: string;
  description: string;
  imageUrl: string;
}

interface TokenInfo {
  tokenAddress: Address;
  creator: Address;
  name: string;
  symbol: string;
  createdAt: bigint;
  isActive: boolean;
  totalVolume: bigint;
  memberCount: bigint;
  currentPrice: bigint;
}

export function useTokenFactory() {
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const [isCreating, setIsCreating] = useState(false);
  const [createdTokenAddress, setCreatedTokenAddress] = useState<Address | null>(null);

  // Default to Polygon Amoy (80002) when no wallet connected, so users can still browse tokens
  const activeChainId = chainId || 80002;
  const factoryAddress = getFactoryAddress(activeChainId);

  // Write contract hook for creating tokens
  const { 
    writeContract, 
    data: hash,
    isPending: isWritePending,
    error: writeError 
  } = useWriteContract();

  // Wait for transaction receipt
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: receiptError 
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Read creation fee
  const { data: creationFee } = useReadContract({
    address: factoryAddress,
    abi: SOCIAL_TOKEN_FACTORY_ABI,
    functionName: 'CREATION_FEE',
    chainId: activeChainId,
  });

  // Read platform stats
  const {
    data: platformStats,
    refetch: refetchStats
  } = useReadContract({
    address: factoryAddress,
    abi: SOCIAL_TOKEN_FACTORY_ABI,
    functionName: 'getPlatformStats',
    chainId: activeChainId,
  });

  // Get creator's tokens
  const {
    data: creatorTokens,
    refetch: refetchCreatorTokens
  } = useReadContract({
    address: factoryAddress,
    abi: SOCIAL_TOKEN_FACTORY_ABI,
    functionName: 'getCreatorTokens',
    args: address ? [address] : undefined,
    chainId: activeChainId,
  });

  // Get trending tokens
  const {
    data: trendingTokens,
    refetch: refetchTrendingTokens
  } = useReadContract({
    address: factoryAddress,
    abi: SOCIAL_TOKEN_FACTORY_ABI,
    functionName: 'getTrendingTokens',
    args: [BigInt(10)], // Get top 10 trending tokens
    chainId: activeChainId,
  });

  // Create a new social token
  const createToken = async (params: CreateTokenParams) => {
    if (!factoryAddress || !address || !creationFee) {
      throw new Error('Factory not available or wallet not connected');
    }

    setIsCreating(true);
    setCreatedTokenAddress(null);

    try {
      // Convert initial supply to wei (18 decimals)
      const initialSupplyWei = parseEther(params.initialSupply || '0');

      await writeContract({
        address: factoryAddress,
        abi: SOCIAL_TOKEN_FACTORY_ABI,
        functionName: 'createSocialToken',
        args: [
          params.name,
          params.symbol,
          initialSupplyWei,
          params.description,
          params.imageUrl,
        ],
        value: creationFee, // Pay creation fee
        gas: BigInt(2200000), // Explicit gas limit based on actual estimate (~2.06M + buffer)
      });

      // Note: The actual token address will be available from the transaction receipt
      // or from listening to TokenCreated events
      
    } catch (error) {
      console.error('Error creating token:', error);
      setIsCreating(false);
      throw error;
    }
  };

  // Get token info by address (placeholder - will be implemented when needed)
  const getTokenInfo = async (tokenAddress: Address): Promise<TokenInfo | null> => {
    // This would use viem's readContract function
    // For now, returning null - will implement when we build token pages
    return null;
  };

  // Get all tokens with pagination (placeholder - will be implemented when needed)
  const getAllTokens = async (offset: number = 0, limit: number = 20) => {
    // This would use viem's readContract function
    // For now, returning empty - will implement when we build discovery
    return { tokens: [], totalCount: 0 };
  };

  // Check if creation is in progress
  const isCreationInProgress = isCreating || isWritePending || isConfirming;

  // Handle transaction confirmation and extract token address
  useEffect(() => {
    const extractTokenAddress = async () => {
      if (isConfirmed && hash && publicClient && factoryAddress) {
        setIsCreating(false);

        try {
          console.log('📦 Transaction confirmed, extracting token address...');

          // Get transaction receipt
          const receipt = await publicClient.getTransactionReceipt({ hash });

          console.log('📄 Receipt logs:', receipt.logs.length);

          // Find TokenCreated event in the logs
          // TokenCreated(address indexed tokenAddress, address indexed creator, string name, string symbol, uint256 timestamp)
          const tokenCreatedEvent = receipt.logs.find(log =>
            log.address.toLowerCase() === factoryAddress.toLowerCase()
          );

          if (tokenCreatedEvent && tokenCreatedEvent.topics[1]) {
            // Extract token address from the event (first indexed parameter)
            const tokenAddress = ('0x' + tokenCreatedEvent.topics[1].slice(26)) as Address;
            console.log('✅ Token address extracted:', tokenAddress);
            setCreatedTokenAddress(tokenAddress);
          } else {
            console.error('❌ Could not find TokenCreated event in logs');
            console.log('Available logs:', receipt.logs);
          }
        } catch (error) {
          console.error('Error extracting token address:', error);
        }

        // Refetch data
        refetchStats();
        refetchCreatorTokens();
        refetchTrendingTokens();
      }
    };

    extractTokenAddress();
  }, [isConfirmed, hash, publicClient, factoryAddress, refetchStats, refetchCreatorTokens, refetchTrendingTokens]);

  return {
    // State
    isCreating: isCreationInProgress,
    createdTokenAddress,
    factoryAddress,
    
    // Data
    creationFee,
    platformStats: platformStats ? {
      totalTokens: Number(platformStats[0]),
      totalVolume: platformStats[1],
      totalRevenue: platformStats[2],
      activeTokens: Number(platformStats[3]),
    } : null,
    creatorTokens: creatorTokens || [],
    trendingTokens: trendingTokens || [],
    
    // Actions
    createToken,
    getTokenInfo,
    getAllTokens,
    
    // Errors
    error: writeError || receiptError,
    
    // Refetch functions
    refetchStats,
    refetchCreatorTokens,
    refetchTrendingTokens,
  };
}

