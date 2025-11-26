'use client';

import { useParams } from 'next/navigation';
import { Address, isAddress, formatEther } from 'viem';
import { useAccount, useReadContract } from 'wagmi';
import { useState, useEffect } from 'react';
import { TokenChat } from '@/components/chat/token-chat';
import { TokenHistory } from '@/components/token-history';
import { TokenChart } from '@/components/token-chart';
import { TokenTrading } from '@/components/token-trading';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { SOCIAL_TOKEN_ABI } from '@/lib/contracts';

interface TokenMetadata {
  token_address: string;
  creator_address: string;
  name: string;
  symbol: string;
  description: string | null;
  image_url: string | null;
  website: string | null;
  twitter: string | null;
  telegram: string | null;
  created_at: string;
}

// Format price with max 6 decimals
const formatPrice = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num === 0) return '0';
  if (num < 0.000001) return num.toExponential(2);
  return num.toFixed(6).replace(/\.?0+$/, '');
};

// Format large numbers
const formatNumber = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
  return num.toLocaleString();
};

export default function TokenPage() {
  const params = useParams();
  const tokenAddress = params.address as string;
  const { address } = useAccount();
  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);

  // Fetch token metadata from Supabase
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch(`/api/tokens?address=${tokenAddress}`);
        if (response.ok) {
          const data = await response.json();
          setMetadata(data.token);
          console.log('📄 Loaded metadata from Supabase:', data.token);
        } else {
          // Token has no metadata in Supabase (old token)
          setMetadata(null);
        }
      } catch (error) {
        setMetadata(null);
      }
    };

    if (tokenAddress && isAddress(tokenAddress)) {
      fetchMetadata();
    }
  }, [tokenAddress]);

  // Fetch token info from blockchain (poll every 3 seconds for price updates)
  const { data: tokenInfo } = useReadContract({
    address: tokenAddress as Address,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'getTokenInfo',
    query: {
      refetchInterval: 3000, // Refetch every 3 seconds to update price after trades
    },
  });

  // Fetch user balance (poll every 3 seconds)
  const { data: userBalance } = useReadContract({
    address: tokenAddress as Address,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      refetchInterval: 3000,
    },
  });

  // Fetch social access (poll every 5 seconds)
  const { data: socialAccess } = useReadContract({
    address: tokenAddress as Address,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'checkSocialAccess',
    args: address ? [address] : undefined,
    query: {
      refetchInterval: 5000,
    },
  });

  // Validate the address
  if (!tokenAddress || !isAddress(tokenAddress)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Token Address</h1>
          <p className="text-foreground/70 mb-6">
            The token address you provided is not valid.
          </p>
          <Link href="/tokens">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Browse Tokens
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="px-4 py-8">

        {/* Token Info Header */}
        <div className="mb-6">
          {tokenInfo && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Link href="/tokens">
                    <Button variant="ghost" size="sm">
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                  <div className="flex items-center gap-3">
                    {metadata?.image_url ? (
                      <img
                        src={metadata.image_url}
                        alt={tokenInfo[0] as string}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {(tokenInfo[1] as string).charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold">{tokenInfo[0] as string}</h2>
                        {tokenInfo[5] && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs">
                            Verified
                          </Badge>
                        )}
                        {socialAccess && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                            Chat Access ✓
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground/60">{tokenInfo[1] as string}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-lg font-bold">{formatPrice(formatEther(tokenInfo[6] as bigint))} MATIC</div>
                    <div className="text-xs text-foreground/60">Price</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {formatNumber(
                        parseFloat(formatEther(tokenInfo[6] as bigint)) * parseFloat(formatEther(tokenInfo[2] as bigint))
                      )} MATIC
                    </div>
                    <div className="text-xs text-foreground/60">Market Cap</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{Number(tokenInfo[3])}</div>
                    <div className="text-xs text-foreground/60">Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{formatNumber(formatEther(tokenInfo[2] as bigint))}</div>
                    <div className="text-xs text-foreground/60">Supply</div>
                  </div>
                  {userBalance && (
                    <div className="text-center">
                      <div className="text-lg font-bold">{formatNumber(formatEther(userBalance))}</div>
                      <div className="text-xs text-foreground/60">Your Balance</div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="flex gap-6">
          {/* Main Column - Chart + Trading + History */}
          <div className="flex-1">
            <div className="space-y-6">
              <TokenChart tokenAddress={tokenAddress as Address} />
              <TokenHistory tokenAddress={tokenAddress as Address} />
            </div>
          </div>

          {/* Right Column - Trading + Chat */}
          <div className="w-[480px] flex-shrink-0">
            <div className="sticky top-8 space-y-4">
              <TokenTrading tokenAddress={tokenAddress as Address} />
              <TokenChat
                tokenAddress={tokenAddress}
                tokenSymbol={tokenInfo ? (tokenInfo[1] as string) : 'TOKEN'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

