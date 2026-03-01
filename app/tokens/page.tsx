// app/tokens/page.tsx
'use client';

import { Suspense, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTokenFactory } from '@/hooks/use-token-factory';
import { useTokenDiscovery, SortOption } from '@/hooks/use-token-discovery';
import { TokenCard } from '@/components/token-card';
import { TOKEN_CATEGORIES, TokenCategory } from '@/lib/supabase';
import {
  TrendingUp,
  Users,
  DollarSign,
  Search,
  X,
  SlidersHorizontal,
  Crown,
  Palette,
  Gamepad2,
  Smile,
  Music,
  Building2,
  Bot,
  Trophy,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { formatEther } from 'viem';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  creator: Crown,
  artist: Palette,
  gaming: Gamepad2,
  meme: Smile,
  music: Music,
  infrastructure: Building2,
  ai: Bot,
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'trending', label: 'Trending' },
  { value: 'volume24h', label: '24h Volume' },
  { value: 'volume', label: 'Total Volume' },
  { value: 'holders', label: 'Most Holders' },
  { value: 'newest', label: 'Newest' },
  { value: 'likes', label: 'Most Liked' },
];

function TokensContent() {
  const { platformStats } = useTokenFactory();
  const {
    tokens,
    loading,
    totalCount,
    totalPages,
    page,
    category,
    search,
    sort,
    filters,
    setCategory,
    setSearch,
    setSort,
    setFilters,
    setPage,
  } = useTokenDiscovery();

  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Discover Tokens</h1>
            <p className="text-xl text-foreground/70">
              Find and join vibrant token communities
            </p>
          </div>
          <Link
            href="/leaderboard"
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-sm font-medium text-foreground/70 hover:text-foreground hover:border-primary/50 transition-all"
          >
            <Trophy className="h-4 w-4 text-yellow-500" />
            Leaderboard
          </Link>
        </div>

        {/* Platform Stats */}
        {platformStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setCategory(null)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              !category
                ? 'bg-primary text-white'
                : 'bg-surface border border-border hover:border-primary/50 text-foreground/70'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            All
          </button>
          {TOKEN_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.value];
            return (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  category === cat.value
                    ? 'bg-primary text-white'
                    : 'bg-surface border border-border hover:border-primary/50 text-foreground/70'
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search + Sort + Filter Row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <Card className="flex-1 p-3">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-foreground/50 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search by name or symbol..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm"
              />
              {search && (
                <button onClick={() => setSearch('')} className="p-1 hover:bg-surface rounded">
                  <X className="h-4 w-4 text-foreground/50" />
                </button>
              )}
            </div>
          </Card>

          {/* Sort Dropdown */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="px-4 py-3 bg-surface border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Filter Toggle */}
          <Button
            variant={showFilters ? 'primary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {(filters.minVolume > 0 || filters.minHolders > 0 || filters.maxAge > 0) && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card className="p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground/60 mb-1.5">
                  Min Volume (MATIC)
                </label>
                <input
                  type="number"
                  value={filters.minVolume || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, minVolume: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground/60 mb-1.5">
                  Min Holders
                </label>
                <input
                  type="number"
                  value={filters.minHolders || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, minHolders: parseInt(e.target.value) || 0 })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground/60 mb-1.5">
                  Max Age (days)
                </label>
                <input
                  type="number"
                  value={filters.maxAge || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, maxAge: parseInt(e.target.value) || 0 })
                  }
                  placeholder="No limit"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            {(filters.minVolume > 0 || filters.minHolders > 0 || filters.maxAge > 0) && (
              <button
                onClick={() => setFilters({ minVolume: 0, minHolders: 0, maxAge: 0 })}
                className="mt-3 text-xs text-primary hover:underline"
              >
                Clear all filters
              </button>
            )}
          </Card>
        )}

        {/* Results Info */}
        {!loading && totalCount > 0 && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-foreground/60">
              Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, totalCount)} of {totalCount} tokens
            </p>
          </div>
        )}

        {/* Token Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="animate-pulse">
                  <div className="aspect-[4/3] bg-surface" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-surface rounded w-3/4" />
                    <div className="h-4 bg-surface rounded w-1/2" />
                    <div className="h-8 bg-surface rounded" />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-12 bg-surface rounded" />
                      <div className="h-12 bg-surface rounded" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : tokens.length === 0 ? (
          <Card className="p-12 text-center">
            <Search className="h-16 w-16 mx-auto mb-4 text-foreground/30" />
            <h3 className="text-xl font-semibold mb-2">No tokens found</h3>
            <p className="text-foreground/60 mb-6">
              {search
                ? 'Try a different search term or adjust filters'
                : category
                ? `No ${category} tokens yet. Be the first to create one!`
                : 'Be the first to create a token and start building your community!'}
            </p>
            <div className="flex gap-3 justify-center">
              {(search || category || filters.minVolume > 0 || filters.minHolders > 0 || filters.maxAge > 0) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    setCategory(null);
                    setFilters({ minVolume: 0, minHolders: 0, maxAge: 0 });
                  }}
                >
                  Clear Filters
                </Button>
              )}
              <Link href="/create">
                <Button>Create Token</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tokens.map((token) => (
              <TokenCard key={token.tokenAddress} token={token} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-primary text-white'
                        : 'bg-surface hover:bg-surface/80 text-foreground/70'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TokensPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-10 bg-surface rounded w-1/3" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-24 bg-surface rounded" />
              <div className="h-24 bg-surface rounded" />
              <div className="h-24 bg-surface rounded" />
            </div>
            <div className="h-12 bg-surface rounded" />
            <div className="grid grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-64 bg-surface rounded" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <TokensContent />
    </Suspense>
  );
}
