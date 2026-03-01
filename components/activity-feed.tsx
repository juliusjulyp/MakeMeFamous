'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFollows } from '@/hooks/use-follows';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Zap,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

interface ActivityItem {
  id: string;
  type: 'buy' | 'sell' | 'create';
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenImage: string | null;
  traderAddress: string;
  traderName: string | null;
  traderAvatar: string | null;
  volume: string;
  tokenAmount: string;
  txHash: string | null;
  createdAt: string;
}

type FilterType = 'all' | 'buys' | 'sells' | 'creates' | 'following';

const FILTER_TABS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'buys', label: 'Buys' },
  { value: 'sells', label: 'Sells' },
  { value: 'creates', label: 'New' },
  { value: 'following', label: 'Following' },
];

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatAmount(amount: string): string {
  const num = parseFloat(amount);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  if (num >= 1) return num.toFixed(2);
  return num.toFixed(4);
}

export function ActivityFeed() {
  const { address, isConnected } = useAccount();
  const { following } = useFollows();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivity = useCallback(
    async (loadMore = false) => {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams();
        const apiType = filter === 'following' ? 'all' : filter;
        params.set('type', apiType);
        params.set('limit', '20');

        if (filter === 'following' && following.length > 0) {
          params.set('following', following.join(','));
        }

        if (loadMore && cursor) {
          params.set('before', cursor);
        }

        const response = await fetch(`/api/activity?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          if (loadMore) {
            setItems(prev => [...prev, ...data.items]);
          } else {
            setItems(data.items);
          }
          setCursor(data.nextCursor);
          setHasMore(data.items.length >= 20);
        }
      } catch (error) {
        console.error('Error fetching activity:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filter, following, cursor]
  );

  // Fetch on mount and filter change
  useEffect(() => {
    setCursor(null);
    setHasMore(true);
    fetchActivity(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, following.length]);

  return (
    <div className="w-full max-w-md border-l border-border bg-surface/30 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Activity</h2>
          <Badge variant="primary" className="gap-1">
            <Zap className="h-3 w-3" />
            Live
          </Badge>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1">
          {FILTER_TABS.map((tab) => {
            // Hide "Following" tab if not connected or no follows
            if (tab.value === 'following' && (!isConnected || following.length === 0)) {
              return null;
            }
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  filter === tab.value
                    ? 'bg-primary text-white'
                    : 'bg-surface hover:bg-surface/80 text-foreground/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Activity Stream */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-foreground/40" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-foreground/50 text-sm">
            {filter === 'following'
              ? 'No activity from creators you follow yet'
              : 'No activity yet. Be the first to trade!'}
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {items.map((item) => (
              <Link key={item.id} href={`/token/${item.tokenAddress}`}>
                <Card className="hover:bg-surface/50 transition-colors cursor-pointer">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      {/* Token Image */}
                      <div className="flex-shrink-0">
                        {item.tokenImage ? (
                          <img
                            src={item.tokenImage}
                            alt={item.tokenName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {item.tokenSymbol.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-sm">
                          {item.type === 'buy' && (
                            <TrendingUp className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                          )}
                          {item.type === 'sell' && (
                            <TrendingDown className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                          )}
                          {item.type === 'create' && (
                            <Sparkles className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
                          )}
                          <span className="font-medium truncate">
                            {item.traderName || shortenAddress(item.traderAddress)}
                          </span>
                          <span className="text-foreground/50">
                            {item.type === 'create' ? 'created' : item.type === 'buy' ? 'bought' : 'sold'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-foreground/60 mt-0.5">
                          <span className="font-medium text-foreground/80">${item.tokenSymbol}</span>
                          {item.type !== 'create' && (
                            <>
                              <span>·</span>
                              <span>{formatAmount(item.volume)} MATIC</span>
                            </>
                          )}
                          <span>·</span>
                          <span>{timeAgo(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && items.length > 0 && (
          <div className="p-3 border-t border-border">
            <Button
              variant="ghost"
              className="w-full"
              size="sm"
              onClick={() => fetchActivity(true)}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Load more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
