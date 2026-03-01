'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SOCIAL_TOKEN_ABI } from '@/lib/contracts';
import { CompactPrice } from '@/components/ui/price-display';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Heart,
  Share2,
  ExternalLink,
  Copy,
  Check,
  Bookmark,
  Crown,
  Palette,
  Gamepad2,
  Smile,
  Music,
  Building2,
  Bot,
} from 'lucide-react';
import Link from 'next/link';
import { formatEther, Address } from 'viem';
import type { DiscoveredToken } from '@/hooks/use-token-discovery';
import type { TokenCategory } from '@/lib/supabase';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  creator: Crown,
  artist: Palette,
  gaming: Gamepad2,
  meme: Smile,
  music: Music,
  infrastructure: Building2,
  ai: Bot,
};

const CATEGORY_COLORS: Record<string, string> = {
  creator: 'bg-yellow-500/20 text-yellow-500',
  artist: 'bg-purple-500/20 text-purple-500',
  gaming: 'bg-blue-500/20 text-blue-500',
  meme: 'bg-green-500/20 text-green-500',
  music: 'bg-pink-500/20 text-pink-500',
  infrastructure: 'bg-cyan-500/20 text-cyan-500',
  ai: 'bg-violet-500/20 text-violet-500',
};

interface TokenCardProps {
  token: DiscoveredToken;
  onWatchlistToggle?: (tokenAddress: string) => void;
  onLikeToggle?: (tokenAddress: string) => void;
}

export function TokenCard({ token, onWatchlistToggle, onLikeToggle }: TokenCardProps) {
  const { address } = useAccount();
  const [isLiked, setIsLiked] = useState(token.isLiked);
  const [likeCount, setLikeCount] = useState(token.likeCount);
  const [isWatchlisted, setIsWatchlisted] = useState(token.isWatchlisted);
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Fetch live price from blockchain
  const { data: tokenInfo } = useReadContract({
    address: token.tokenAddress as Address,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'getTokenInfo',
    query: { refetchInterval: 45000 },
  });

  // Sync prop changes
  useEffect(() => {
    setIsLiked(token.isLiked);
    setLikeCount(token.likeCount);
    setIsWatchlisted(token.isWatchlisted);
  }, [token.isLiked, token.likeCount, token.isWatchlisted]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!address) return;

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);

    try {
      const response = await fetch('/api/likes', {
        method: newIsLiked ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAddress: token.tokenAddress, userAddress: address }),
      });
      if (response.ok) {
        const data = await response.json();
        setLikeCount(data.likeCount);
        setIsLiked(data.userLiked);
      } else {
        setIsLiked(!newIsLiked);
        setLikeCount(prev => newIsLiked ? prev - 1 : prev + 1);
      }
    } catch {
      setIsLiked(!newIsLiked);
      setLikeCount(prev => newIsLiked ? prev - 1 : prev + 1);
    }

    onLikeToggle?.(token.tokenAddress);
  };

  const handleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!address) return;

    const newState = !isWatchlisted;
    setIsWatchlisted(newState);

    try {
      const response = await fetch('/api/watchlist', {
        method: newState ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: address, tokenAddress: token.tokenAddress }),
      });
      if (!response.ok) {
        setIsWatchlisted(!newState);
      }
    } catch {
      setIsWatchlisted(!newState);
    }

    onWatchlistToggle?.(token.tokenAddress);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowShareMenu(!showShareMenu);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/token/${token.tokenAddress}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowShareMenu(false);
  };

  const handleTwitterShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const text = `Check out $${token.symbol} (${token.name}) on MakeMeFamous!`;
    const url = `${window.location.origin}/token/${token.tokenAddress}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank'
    );
    setShowShareMenu(false);
  };

  // Use blockchain data for live price, fallback to API data
  const livePrice = tokenInfo ? (tokenInfo as any)[6] : null;
  const liveTotalSupply = tokenInfo ? (tokenInfo as any)[2] : null;
  const liveTotalMembers = tokenInfo ? (tokenInfo as any)[3] : null;

  const currentPrice = livePrice ? Number(formatEther(livePrice)) : 0;
  const totalSupply = liveTotalSupply ? Number(formatEther(liveTotalSupply)) : 0;
  const marketCap = currentPrice * totalSupply;

  const formatMarketCap = (mc: number) => {
    if (mc >= 1000000) return `${(mc / 1000000).toFixed(2)}M`;
    if (mc >= 1000) return `${(mc / 1000).toFixed(2)}K`;
    return mc.toFixed(2);
  };

  const CategoryIcon = CATEGORY_ICONS[token.category] || Smile;
  const categoryColor = CATEGORY_COLORS[token.category] || CATEGORY_COLORS.meme;

  return (
    <Link href={`/token/${token.tokenAddress}`}>
      <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] cursor-pointer relative border-border/50 hover:border-primary/50 bg-gradient-to-br from-background to-surface/30">
        {/* Token Image */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
          {token.imageUrl ? (
            <>
              <img
                src={token.imageUrl}
                alt={token.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary via-primary/80 to-secondary flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <span className="text-white font-bold text-5xl drop-shadow-lg relative z-10">
                {token.symbol.charAt(0)}
              </span>
            </div>
          )}

          {/* Watchlist Bookmark - top left */}
          {address && (
            <button
              onClick={handleWatchlist}
              className="absolute top-3 left-3 z-10 p-1.5 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
            >
              <Bookmark
                className={`h-4 w-4 transition-all ${
                  isWatchlisted ? 'fill-primary text-primary' : 'text-white'
                }`}
              />
            </button>
          )}

          {/* Price Change Badge - top right */}
          <div className="absolute top-3 right-3 flex gap-2">
            {token.priceChange24h !== null && (
              <Badge
                className={`border-0 shadow-lg text-xs px-2 py-1 ${
                  token.priceChange24h >= 0
                    ? 'bg-green-500/90 text-white'
                    : 'bg-red-500/90 text-white'
                }`}
              >
                {token.priceChange24h >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1 inline" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1 inline" />
                )}
                {token.priceChange24h >= 0 ? '+' : ''}
                {token.priceChange24h.toFixed(1)}%
              </Badge>
            )}
          </div>

          {/* Quick Stats Overlay on Hover */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span className="font-medium">{formatMarketCap(marketCap)} MC</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{liveTotalMembers ? Number(liveTotalMembers) : token.holderCount} holders</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Header */}
          <div className="mb-3">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-bold text-lg truncate flex-1 group-hover:text-primary transition-colors">
                {token.name}
              </h3>
              <div className="ml-2 text-right">
                <p className="text-xs text-foreground/50">Price</p>
                <p className="font-bold text-primary text-sm">
                  {currentPrice > 0 ? currentPrice.toFixed(6) : '...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground/70">${token.symbol}</p>
              <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full ${categoryColor}`}>
                <CategoryIcon className="h-3 w-3" />
                {token.category}
              </span>
            </div>
          </div>

          {/* Creator */}
          <div className="flex items-center gap-2 mb-3 p-2 bg-surface/50 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-xs font-bold">
              {token.creatorAddress.slice(2, 4).toUpperCase()}
            </div>
            <p className="text-xs text-foreground/60 flex-1 truncate">
              {token.creatorAddress.slice(0, 6)}...{token.creatorAddress.slice(-4)}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg px-3 py-2">
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="h-3 w-3 text-primary" />
                <span className="text-foreground/60 text-xs">Market Cap</span>
              </div>
              <CompactPrice maticAmount={marketCap} />
            </div>
            <div className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
              <div className="flex items-center gap-1 mb-1">
                <Users className="h-3 w-3 text-blue-500" />
                <span className="text-foreground/60 text-xs">Holders</span>
              </div>
              <p className="font-bold text-blue-500">
                {liveTotalMembers ? Number(liveTotalMembers) : token.holderCount}
              </p>
            </div>
          </div>

          {/* Social Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm font-medium transition-all duration-200 hover:scale-110 ${
                isLiked ? 'text-red-500' : 'text-foreground/60 hover:text-red-500'
              }`}
            >
              <Heart className={`h-4 w-4 transition-all ${isLiked ? 'fill-current scale-110' : ''}`} />
              <span className="font-semibold">{likeCount}</span>
            </button>

            <div className="relative">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-sm font-medium text-foreground/60 hover:text-primary transition-all duration-200 hover:scale-110"
              >
                <Share2 className="h-4 w-4" />
                <span className="text-xs">Share</span>
              </button>

              {showShareMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-background/95 backdrop-blur-lg border border-border/50 rounded-xl shadow-2xl p-1 min-w-[160px] z-10 animate-in slide-in-from-bottom-2">
                  <button
                    onClick={handleTwitterShare}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-surface/80 rounded-lg transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-blue-400" />
                    <span>Share on Twitter</span>
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-surface/80 rounded-lg transition-colors"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="px-3 py-1 bg-primary/10 rounded-full">
              <span className="text-xs font-bold text-primary">View &rarr;</span>
            </div>
          </div>
        </div>

        {/* Shine effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </div>
      </Card>
    </Link>
  );
}
