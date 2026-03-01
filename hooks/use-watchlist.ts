'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';

export function useWatchlist() {
  const { address } = useAccount();
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch watchlist on mount
  useEffect(() => {
    if (!address) {
      setWatchlist([]);
      return;
    }

    const fetchWatchlist = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/watchlist?user=${address}`);
        if (response.ok) {
          const data = await response.json();
          setWatchlist(data.watchlist.map((w: any) => w.token_address));
        }
      } catch (error) {
        console.error('Error fetching watchlist:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, [address]);

  const isWatchlisted = useCallback(
    (tokenAddress: string) => watchlist.includes(tokenAddress.toLowerCase()),
    [watchlist]
  );

  const toggleWatchlist = useCallback(
    async (tokenAddress: string) => {
      if (!address) return;

      const normalized = tokenAddress.toLowerCase();
      const wasWatchlisted = watchlist.includes(normalized);

      // Optimistic update
      setWatchlist(prev =>
        wasWatchlisted
          ? prev.filter(a => a !== normalized)
          : [...prev, normalized]
      );

      try {
        const response = await fetch('/api/watchlist', {
          method: wasWatchlisted ? 'DELETE' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userAddress: address, tokenAddress: normalized }),
        });

        if (!response.ok) {
          // Revert on error
          setWatchlist(prev =>
            wasWatchlisted
              ? [...prev, normalized]
              : prev.filter(a => a !== normalized)
          );
        }
      } catch {
        // Revert on error
        setWatchlist(prev =>
          wasWatchlisted
            ? [...prev, normalized]
            : prev.filter(a => a !== normalized)
        );
      }
    },
    [address, watchlist]
  );

  return {
    watchlist,
    loading,
    isWatchlisted,
    toggleWatchlist,
    count: watchlist.length,
  };
}
