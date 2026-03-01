'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';

export function useFollows() {
  const { address } = useAccount();
  const [following, setFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch following list on mount
  useEffect(() => {
    if (!address) {
      setFollowing([]);
      return;
    }

    const fetchFollowing = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/follows?user=${address}&type=following`);
        if (response.ok) {
          const data = await response.json();
          setFollowing(data.following || []);
        }
      } catch (error) {
        console.error('Error fetching following:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowing();
  }, [address]);

  const isFollowing = useCallback(
    (creatorAddress: string) => following.includes(creatorAddress.toLowerCase()),
    [following]
  );

  const toggleFollow = useCallback(
    async (creatorAddress: string): Promise<{ followerCount: number } | null> => {
      if (!address) return null;

      const normalized = creatorAddress.toLowerCase();
      const wasFollowing = following.includes(normalized);

      // Optimistic update
      setFollowing(prev =>
        wasFollowing
          ? prev.filter(a => a !== normalized)
          : [...prev, normalized]
      );

      try {
        const response = await fetch('/api/follows', {
          method: wasFollowing ? 'DELETE' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ followerAddress: address, followedAddress: normalized }),
        });

        if (response.ok) {
          const data = await response.json();
          return { followerCount: data.followerCount };
        } else {
          // Revert on error
          setFollowing(prev =>
            wasFollowing
              ? [...prev, normalized]
              : prev.filter(a => a !== normalized)
          );
          return null;
        }
      } catch {
        // Revert on error
        setFollowing(prev =>
          wasFollowing
            ? [...prev, normalized]
            : prev.filter(a => a !== normalized)
        );
        return null;
      }
    },
    [address, following]
  );

  return {
    following,
    loading,
    isFollowing,
    toggleFollow,
    followingCount: following.length,
  };
}
