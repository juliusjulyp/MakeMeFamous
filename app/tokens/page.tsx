// app/tokens/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTokenFactory } from '@/hooks/use-token-factory';
import { SOCIAL_TOKEN_ABI } from '@/lib/contracts';
import { TrendingUp, Users, DollarSign, Search, X, Heart, Share2, ExternalLink, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { formatEther, Address } from 'viem';

interface TokenData {
  address: string;
  name: string;
  symbol: string;
  totalSupply: bigint;
  totalMembers: bigint;
  creator: string;
  isVerified: boolean;
  currentPrice: bigint;
}

export default function TokensPage() {
  const { isConnected } = useAccount();
  const { platformStats, trendingTokens, isCreating } = useTokenFactory();
  const [searchQuery, setSearchQuery] = useState('');
  const [tokenDataMap, setTokenDataMap] = useState<Record<string, TokenData>>({});

  // Callback for TokenCard to report loaded data
  const handleTokenLoaded = useCallback((data: TokenData) => {
    setTokenDataMap(prev => ({ ...prev, [data.address]: data }));
  }, []);

  // Filter tokens based on search query
  const filteredTokens = useMemo(() => {
    if (!searchQuery.trim()) return trendingTokens;

    const query = searchQuery.toLowerCase();
    return trendingTokens.filter(address => {
      const data = tokenDataMap[address];
      if (!data) return true; // Show while loading
      return data.name.toLowerCase().includes(query) ||
             data.symbol.toLowerCase().includes(query);
    });
  }, [trendingTokens, searchQuery, tokenDataMap]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="w-full">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Discover Tokens</h1>
          <p className="text-xl text-foreground/70">
            Find and join vibrant token communities
          </p>
        </div>

        {/* Platform Stats */}
        {platformStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-foreground/60">Total Tokens</p>
                  <p className="text-2xl font-bold">{platformStats.totalTokens}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-foreground/60">Total Volume</p>
                  <p className="text-2xl font-bold">
                    {formatEther(platformStats.totalVolume)}Ⓜ
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-foreground/60">Active Tokens</p>
                  <p className="text-2xl font-bold">{platformStats.activeTokens}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-foreground/60">Platform Revenue</p>
                  <p className="text-2xl font-bold">
                    {formatEther(platformStats.totalRevenue)}Ⓜ
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Search Bar */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-foreground/50" />
            <input
              type="text"
              placeholder="Search tokens by name or symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 hover:bg-surface rounded"
              >
                <X className="h-4 w-4 text-foreground/50" />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="mt-2 text-sm text-foreground/60">
              {filteredTokens.length} token{filteredTokens.length !== 1 ? 's' : ''} found
            </div>
          )}
        </Card>

        {/* Trending Tokens Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Trending Tokens</h2>
          </div>
          
          {trendingTokens.length === 0 ? (
            <Card className="p-12 text-center">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 text-foreground/30" />
              <h3 className="text-xl font-semibold mb-2">No tokens created yet</h3>
              <p className="text-foreground/60 mb-6">
                Be the first to create a token and start building your community!
              </p>
              <Link href="/create">
                <Button size="lg">
                  Create First Token
                </Button>
              </Link>
            </Card>
          ) : filteredTokens.length === 0 ? (
            <Card className="p-12 text-center">
              <Search className="h-16 w-16 mx-auto mb-4 text-foreground/30" />
              <h3 className="text-xl font-semibold mb-2">No tokens found</h3>
              <p className="text-foreground/60 mb-6">
                Try a different search term
              </p>
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTokens.map((tokenAddress) => (
                <TokenCard
                  key={tokenAddress}
                  tokenAddress={tokenAddress}
                  onLoad={handleTokenLoaded}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Token Card Component with real blockchain data
function TokenCard({
  tokenAddress,
  onLoad
}: {
  tokenAddress: string;
  onLoad?: (data: TokenData) => void;
}) {
  const { address } = useAccount();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const { data: tokenInfo } = useReadContract({
    address: tokenAddress as Address,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'getTokenInfo',
    query: {
      refetchInterval: 5000, // Poll every 5 seconds for price updates
    },
  });

  // Fetch image from Supabase
  useEffect(() => {
    const fetchImage = async () => {
      try {
        const response = await fetch(`/api/tokens?address=${tokenAddress}`);
        if (response.ok) {
          const data = await response.json();
          setImageUrl(data.token?.image_url || null);
        } else {
          // Silently fail for tokens without metadata (old tokens)
          setImageUrl(null);
        }
      } catch (error) {
        // Silently fail - just show gradient fallback
        setImageUrl(null);
      }
    };
    fetchImage();
  }, [tokenAddress]);

  // Load likes from Supabase
  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const url = address
          ? `/api/likes?token=${tokenAddress}&user=${address}`
          : `/api/likes?token=${tokenAddress}`;

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setLikeCount(data.likeCount);
          setIsLiked(data.userLiked);
        }
      } catch (error) {
        console.error('Error fetching likes:', error);
        setLikeCount(0);
      }
    };

    fetchLikes();
  }, [tokenAddress, address]);

  // Report loaded data to parent for search filtering
  useEffect(() => {
    if (tokenInfo && onLoad) {
      const [name, symbol, totalSupply, totalMembers, creator, isVerified, currentPrice] = tokenInfo;
      onLoad({
        address: tokenAddress,
        name,
        symbol,
        totalSupply,
        totalMembers,
        creator,
        isVerified,
        currentPrice,
      });
    }
  }, [tokenInfo, tokenAddress, onLoad]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!address) {
      alert('Please connect your wallet to like tokens');
      return;
    }

    const newIsLiked = !isLiked;

    // Optimistic update
    setIsLiked(newIsLiked);
    setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);

    try {
      const method = newIsLiked ? 'POST' : 'DELETE';
      const response = await fetch('/api/likes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenAddress,
          userAddress: address,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLikeCount(data.likeCount);
        setIsLiked(data.userLiked);
      } else {
        // Revert on error
        setIsLiked(!newIsLiked);
        setLikeCount(prev => newIsLiked ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert on error
      setIsLiked(!newIsLiked);
      setLikeCount(prev => newIsLiked ? prev - 1 : prev + 1);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowShareMenu(!showShareMenu);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/token/${tokenAddress}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowShareMenu(false);
  };

  const handleTwitterShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!tokenInfo) return;
    const [name, symbol] = tokenInfo;
    const text = `Check out $${symbol} (${name}) on MakeMeFamous! 🚀`;
    const url = `${window.location.origin}/token/${tokenAddress}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    setShowShareMenu(false);
  };

  if (!tokenInfo) {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="animate-pulse">
          {/* Image skeleton */}
          <div className="aspect-[3/2] bg-surface"></div>

          {/* Content skeleton */}
          <div className="p-3 space-y-2">
            <div className="space-y-1">
              <div className="h-4 bg-surface rounded w-3/4"></div>
              <div className="h-3 bg-surface rounded w-1/2"></div>
            </div>
            <div className="h-3 bg-surface rounded w-2/3"></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-10 bg-surface rounded"></div>
              <div className="h-10 bg-surface rounded"></div>
            </div>
            <div className="h-6 bg-surface rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  const [name, symbol, totalSupply, totalMembers, creator, isVerified, currentPrice] = tokenInfo;

  // Calculate market cap
  const marketCap = Number(formatEther(currentPrice)) * Number(formatEther(totalSupply));
  const formatMarketCap = (mc: number) => {
    if (mc >= 1000000) return `${(mc / 1000000).toFixed(2)}M`;
    if (mc >= 1000) return `${(mc / 1000).toFixed(2)}K`;
    return mc.toFixed(2);
  };

  return (
    <Link href={`/token/${tokenAddress}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer relative">
        {/* Token Image */}
        <div className="relative aspect-[3/2] bg-gradient-to-br from-primary/20 to-secondary/20">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-white font-bold text-4xl">{symbol.charAt(0)}</span>
            </div>
          )}
          {isVerified && (
            <Badge variant="success" className="absolute top-2 right-2 text-xs px-1.5 py-0.5">
              ✓
            </Badge>
          )}
        </div>

        {/* Content Section */}
        <div className="p-3">
          {/* Header */}
          <div className="mb-2">
            <h3 className="font-bold text-base truncate">{name}</h3>
            <p className="text-sm text-foreground/60">${symbol}</p>
          </div>

          {/* Creator */}
          <p className="text-xs text-foreground/50 mb-2">
            by {creator.slice(0, 6)}...{creator.slice(-4)}
          </p>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-surface/50 rounded px-2 py-1">
              <span className="text-foreground/60 text-xs">MC</span>
              <p className="font-semibold text-primary text-sm">{formatMarketCap(marketCap)}</p>
            </div>
            <div className="bg-surface/50 rounded px-2 py-1">
              <span className="text-foreground/60 text-xs">Price</span>
              <p className="font-semibold text-sm">{parseFloat(formatEther(currentPrice)).toFixed(4)}</p>
            </div>
          </div>

          {/* Holders */}
          <div className="flex items-center gap-1.5 text-xs text-foreground/60 mb-2">
            <Users className="h-3 w-3" />
            <span>{Number(totalMembers)} holders</span>
          </div>

          {/* Social Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 text-xs transition-colors ${
                isLiked ? 'text-red-500' : 'text-foreground/60 hover:text-red-500'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likeCount}</span>
            </button>

            <div className="relative">
              <button
                onClick={handleShare}
                className="flex items-center gap-1 text-xs text-foreground/60 hover:text-primary transition-colors"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>

              {showShareMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-background border border-border rounded-lg shadow-lg p-2 min-w-[140px] z-10">
                  <button
                    onClick={handleTwitterShare}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-surface rounded transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Twitter
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-surface rounded transition-colors"
                  >
                    {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}