// hooks/use-token-factory.ts
'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
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
  const [isCreating, setIsCreating] = useState(false);
  const [createdTokenAddress, setCreatedTokenAddress] = useState<Address | null>(null);

  const factoryAddress = chainId ? getFactoryAddress(chainId) : undefined;

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
  });

  // Read platform stats
  const { 
    data: platformStats,
    refetch: refetchStats 
  } = useReadContract({
    address: factoryAddress,
    abi: SOCIAL_TOKEN_FACTORY_ABI,
    functionName: 'getPlatformStats',
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

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      setIsCreating(false);
      // Refetch data
      refetchStats();
      refetchCreatorTokens();
      refetchTrendingTokens();
    }
  }, [isConfirmed, hash, refetchStats, refetchCreatorTokens, refetchTrendingTokens]);

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

