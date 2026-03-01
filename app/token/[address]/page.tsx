'use client';

import { useParams } from 'next/navigation';
import { Address, isAddress, formatEther } from 'viem';
import { useAccount, useReadContract } from 'wagmi';
import { useState, useEffect } from 'react';
import { TokenChat } from '@/components/chat/token-chat';
import { TokenHistory } from '@/components/token-history';
import { TokenChart } from '@/components/token-chart';
import { TokenTrading } from '@/components/token-trading';
import GraduationProgress from '@/components/graduation-progress';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PriceDisplay, MaticPriceIndicator } from '@/components/ui/price-display';
import { ArrowLeft, Bookmark, UserPlus, UserCheck, Bell, TrendingUp as TrendingUpIcon, TrendingDown, BarChart3, Users as UsersIcon } from 'lucide-react';
import Link from 'next/link';
import { SOCIAL_TOKEN_ABI } from '@/lib/contracts';
import { ShareButton } from '@/components/share-button';
import { useWatchlist } from '@/hooks/use-watchlist';
import { useFollows } from '@/hooks/use-follows';
import { usePriceAlerts } from '@/hooks/use-price-alerts';
import { useTokenAnalytics } from '@/hooks/use-token-analytics';

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
  const { isWatchlisted, toggleWatchlist } = useWatchlist();
  const { isFollowing, toggleFollow } = useFollows();
  const { createAlert, getAlertsForToken } = usePriceAlerts();
  const { analytics } = useTokenAnalytics(tokenAddress);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertDirection, setAlertDirection] = useState<'above' | 'below'>('above');

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

  // Fetch recommendations
  useEffect(() => {
    if (!tokenAddress || !isAddress(tokenAddress)) return;
    const fetchRecs = async () => {
      try {
        const response = await fetch(`/api/tokens/recommendations?token=${tokenAddress}&limit=4`);
        if (response.ok) {
          const data = await response.json();
          setRecommendations(data.recommendations || []);
        }
      } catch { /* ignore */ }
    };
    fetchRecs();
  }, [tokenAddress]);

  // Fetch token info from blockchain (poll every 45 seconds for price updates)
  const { data: tokenInfo } = useReadContract({
    address: tokenAddress as Address,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'getTokenInfo',
    query: {
      refetchInterval: 45000, // Refetch every 45 seconds to update price after trades
    },
  });

  // Fetch user balance (poll every 45 seconds)
  const { data: userBalance } = useReadContract({
    address: tokenAddress as Address,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      refetchInterval: 45000,
    },
  });

  // Fetch social access (poll every 45 seconds)
  const { data: socialAccess } = useReadContract({
    address: tokenAddress as Address,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'checkSocialAccess',
    args: address ? [address] : undefined,
    query: {
      refetchInterval: 45000,
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
                  {/* Price with USD */}
                  <div className="text-center">
                    <PriceDisplay
                      maticAmount={formatEther(tokenInfo[6] as bigint)}
                      size="md"
                      showBoth={true}
                    />
                    <div className="text-xs text-foreground/60 mt-1">Price per Token</div>
                  </div>

                  {/* Market Cap with USD */}
                  <div className="text-center">
                    <PriceDisplay
                      maticAmount={parseFloat(formatEther(tokenInfo[6] as bigint)) * parseFloat(formatEther(tokenInfo[2] as bigint))}
                      size="md"
                      showBoth={true}
                    />
                    <div className="text-xs text-foreground/60 mt-1">Market Cap</div>
                  </div>

                  <div className="text-center">
                    <div className="text-lg font-bold">{Number(tokenInfo[3])}</div>
                    <div className="text-xs text-foreground/60">Members</div>
                  </div>

                  <div className="text-center">
                    <div className="text-lg font-bold">{formatNumber(formatEther(tokenInfo[2] as bigint))}</div>
                    <div className="text-xs text-foreground/60">Supply</div>
                  </div>

                  {/* User Balance with USD */}
                  {userBalance && (
                    <div className="text-center">
                      <div className="text-lg font-bold">{formatNumber(formatEther(userBalance))}</div>
                      <div className="text-xs text-foreground/60">Your Balance</div>
                      <PriceDisplay
                        maticAmount={formatEther(userBalance)}
                        size="sm"
                        showBoth={false}
                        primaryCurrency="usd"
                        className="text-xs text-foreground/50 mt-1"
                      />
                    </div>
                  )}

                  {/* Watchlist Button */}
                  {address && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleWatchlist(tokenAddress)}
                      className="gap-1"
                    >
                      <Bookmark
                        className={`h-4 w-4 ${
                          isWatchlisted(tokenAddress)
                            ? 'fill-primary text-primary'
                            : 'text-foreground/60'
                        }`}
                      />
                    </Button>
                  )}

                  {/* Follow Creator Button */}
                  {address && metadata?.creator_address && address.toLowerCase() !== metadata.creator_address.toLowerCase() && (
                    <Button
                      variant={isFollowing(metadata.creator_address) ? 'outline' : 'ghost'}
                      size="sm"
                      onClick={async () => {
                        const result = await toggleFollow(metadata.creator_address);
                        if (result) setFollowerCount(result.followerCount);
                      }}
                      className="gap-1 text-xs"
                    >
                      {isFollowing(metadata.creator_address) ? (
                        <>
                          <UserCheck className="h-3.5 w-3.5" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3.5 w-3.5" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}

                  {/* Price Alert Button */}
                  {address && (
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAlertModal(!showAlertModal)}
                        className="gap-1"
                      >
                        <Bell className={`h-4 w-4 ${getAlertsForToken(tokenAddress).length > 0 ? 'text-primary' : 'text-foreground/60'}`} />
                      </Button>

                      {showAlertModal && (
                        <div className="absolute top-full right-0 mt-2 bg-background border border-border rounded-xl shadow-2xl p-4 w-64 z-50">
                          <h4 className="text-sm font-semibold mb-3">Set Price Alert</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs text-foreground/60 mb-1 block">Target Price (MATIC)</label>
                              <input
                                type="number"
                                value={alertPrice}
                                onChange={(e) => setAlertPrice(e.target.value)}
                                placeholder="0.000001"
                                step="any"
                                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setAlertDirection('above')}
                                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                  alertDirection === 'above'
                                    ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                                    : 'bg-surface border border-border text-foreground/60'
                                }`}
                              >
                                Above
                              </button>
                              <button
                                onClick={() => setAlertDirection('below')}
                                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                  alertDirection === 'below'
                                    ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                                    : 'bg-surface border border-border text-foreground/60'
                                }`}
                              >
                                Below
                              </button>
                            </div>
                            <Button
                              size="sm"
                              className="w-full"
                              disabled={!alertPrice}
                              onClick={async () => {
                                await createAlert(tokenAddress, alertPrice, alertDirection);
                                setAlertPrice('');
                                setShowAlertModal(false);
                              }}
                            >
                              Set Alert
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Share Button */}
                  <ShareButton
                    tokenAddress={tokenAddress}
                    tokenName={tokenInfo[0] as string}
                    tokenSymbol={tokenInfo[1] as string}
                    price={formatEther(tokenInfo[6] as bigint)}
                  />
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Graduation Progress - Prominent placement */}
        <div className="mb-6">
          <GraduationProgress tokenAddress={tokenAddress as Address} />
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-foreground/60">24h Volume</span>
              </div>
              <p className="text-sm font-bold">{analytics.volume24h.toFixed(2)} MATIC</p>
              {analytics.volumeChange24h !== 0 && (
                <p className={`text-xs ${analytics.volumeChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {analytics.volumeChange24h >= 0 ? '+' : ''}{analytics.volumeChange24h.toFixed(1)}%
                </p>
              )}
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs text-foreground/60">7d Volume</span>
              </div>
              <p className="text-sm font-bold">{analytics.volume7d.toFixed(2)} MATIC</p>
              <p className="text-xs text-foreground/50">{analytics.tradeCount7d} trades</p>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-1">
                {analytics.priceChange24h !== null && analytics.priceChange24h >= 0
                  ? <TrendingUpIcon className="h-3.5 w-3.5 text-green-500" />
                  : <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                }
                <span className="text-xs text-foreground/60">24h Price</span>
              </div>
              <p className={`text-sm font-bold ${
                analytics.priceChange24h !== null
                  ? analytics.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                  : 'text-foreground/50'
              }`}>
                {analytics.priceChange24h !== null
                  ? `${analytics.priceChange24h >= 0 ? '+' : ''}${analytics.priceChange24h.toFixed(1)}%`
                  : 'N/A'}
              </p>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <UsersIcon className="h-3.5 w-3.5 text-purple-500" />
                <span className="text-xs text-foreground/60">Holder Growth</span>
              </div>
              <p className="text-sm font-bold">
                {analytics.holderGrowth7d > 0 ? '+' : ''}{analytics.holderGrowth7d} this week
              </p>
              <p className="text-xs text-foreground/50">{analytics.holderCount} total</p>
            </Card>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground/70 mb-3">You might also like</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {recommendations.map((rec: any) => (
                <Link key={rec.tokenAddress} href={`/token/${rec.tokenAddress}`}>
                  <Card className="p-3 min-w-[180px] hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      {rec.imageUrl ? (
                        <img src={rec.imageUrl} alt={rec.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{rec.symbol.charAt(0)}</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{rec.name}</p>
                        <p className="text-xs text-foreground/50">${rec.symbol}</p>
                      </div>
                    </div>
                    <p className="text-xs text-foreground/60">
                      {rec.sharedTraders} traders in common
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

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

