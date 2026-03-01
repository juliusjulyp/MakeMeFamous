'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useSearchParams, useRouter } from 'next/navigation';
import { TokenCategory } from '@/lib/supabase';

export interface DiscoveredToken {
  tokenAddress: string;
  name: string;
  symbol: string;
  imageUrl: string | null;
  category: TokenCategory;
  creatorAddress: string;
  createdAt: string;
  totalVolume: number;
  volume24h: number;
  volume7d: number;
  tradeCount: number;
  holderCount: number;
  priceChange24h: number | null;
  trendingScore: number;
  likeCount: number;
  isWatchlisted: boolean;
  isLiked: boolean;
}

export type SortOption = 'trending' | 'volume24h' | 'volume' | 'holders' | 'newest' | 'likes';

export interface DiscoveryFilters {
  minVolume: number;
  minHolders: number;
  maxAge: number; // days, 0 = no limit
}

export function useTokenDiscovery() {
  const { address } = useAccount();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial state from URL params
  const [category, setCategory] = useState<TokenCategory | null>(
    (searchParams.get('category') as TokenCategory) || null
  );
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [sort, setSort] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'trending'
  );
  const [filters, setFilters] = useState<DiscoveryFilters>({
    minVolume: parseFloat(searchParams.get('minVolume') || '0'),
    minHolders: parseInt(searchParams.get('minHolders') || '0'),
    maxAge: parseInt(searchParams.get('maxAge') || '0'),
  });
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

  // Data state
  const [tokens, setTokens] = useState<DiscoveredToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Debounce search input
  const searchTimerRef = useRef<NodeJS.Timeout>(null);
  useEffect(() => {
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search change
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [search]);

  // Reset page when filters change
  const handleCategoryChange = useCallback((cat: TokenCategory | null) => {
    setCategory(cat);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((newSort: SortOption) => {
    setSort(newSort);
    setPage(1);
  }, []);

  const handleFiltersChange = useCallback((newFilters: DiscoveryFilters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (sort !== 'trending') params.set('sort', sort);
    if (filters.minVolume > 0) params.set('minVolume', String(filters.minVolume));
    if (filters.minHolders > 0) params.set('minHolders', String(filters.minHolders));
    if (filters.maxAge > 0) params.set('maxAge', String(filters.maxAge));
    if (page > 1) params.set('page', String(page));

    const queryString = params.toString();
    const newUrl = queryString ? `/tokens?${queryString}` : '/tokens';
    router.replace(newUrl, { scroll: false });
  }, [category, debouncedSearch, sort, filters, page, router]);

  // Fetch tokens from discovery API
  useEffect(() => {
    const fetchTokens = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category) params.set('category', category);
        if (debouncedSearch) params.set('search', debouncedSearch);
        params.set('sort', sort);
        if (filters.minVolume > 0) params.set('minVolume', String(filters.minVolume));
        if (filters.minHolders > 0) params.set('minHolders', String(filters.minHolders));
        if (filters.maxAge > 0) params.set('maxAge', String(filters.maxAge));
        params.set('page', String(page));
        params.set('limit', '20');
        if (address) params.set('user', address);

        const response = await fetch(`/api/tokens/discover?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch tokens');

        const data = await response.json();
        setTokens(data.tokens);
        setTotalCount(data.totalCount);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error('Error fetching tokens:', error);
        setTokens([]);
        setTotalCount(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [category, debouncedSearch, sort, filters, page, address]);

  return {
    // Data
    tokens,
    loading,
    totalCount,
    totalPages,
    page,

    // Current filter state
    category,
    search,
    sort,
    filters,

    // Setters
    setCategory: handleCategoryChange,
    setSearch,
    setSort: handleSortChange,
    setFilters: handleFiltersChange,
    setPage,
  };
}
