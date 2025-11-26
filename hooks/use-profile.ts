'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { UserProfile, ProfileUpdate } from '@/types/profile';
import { profileStorage } from '@/lib/profile-storage';

export function useProfile() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fetch profile from API
  const fetchProfile = useCallback(async (userAddress: string) => {
    try {
      const response = await fetch(`/api/users?address=${userAddress}`);
      if (response.ok) {
        const { user } = await response.json();

        // Convert API response to UserProfile format
        const apiProfile: UserProfile = {
          address: user.address,
          displayName: user.username || null,
          bio: user.bio || null,
          avatarUrl: user.avatar_url || null,
          socialLinks: {
            twitter: user.twitter_handle || null,
            telegram: user.telegram_handle || null,
            website: user.website || null,
          },
          stats: {
            tokensCreated: user.user_stats?.tokens_created || 0,
            tokensHeld: user.user_stats?.tokens_held || 0,
            totalTrades: user.user_stats?.total_trades || 0,
            totalVolume: user.user_stats?.total_volume || '0',
            chatCount: user.user_stats?.chat_messages || 0,
          },
          badges: [],
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        };

        // Update localStorage cache
        profileStorage.updateProfile(userAddress, apiProfile);
        return apiProfile;
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
    return null;
  }, []);

  // Authenticate user with wallet signature
  const authenticate = useCallback(async () => {
    if (!address) return false;

    try {
      // Get nonce
      const nonceResponse = await fetch(`/api/auth/nonce?address=${address}`);
      if (!nonceResponse.ok) return false;

      const { nonce } = await nonceResponse.json();

      // Sign message
      const signature = await signMessageAsync({ message: nonce });

      // Verify signature
      const verifyResponse = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, message: nonce, signature }),
      });

      if (verifyResponse.ok) {
        setIsAuthenticated(true);
        // Fetch full profile after auth
        const apiProfile = await fetchProfile(address);
        if (apiProfile) {
          setProfile(apiProfile);
        }
        return true;
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }
    return false;
  }, [address, signMessageAsync, fetchProfile]);

  // Load profile when wallet connects - auto-create user if doesn't exist
  useEffect(() => {
    if (isConnected && address) {
      // First load from localStorage (fast)
      const cachedProfile = profileStorage.getProfile(address);
      setProfile(cachedProfile);

      // Then fetch from API (authoritative)
      fetchProfile(address).then(async (apiProfile) => {
        if (apiProfile) {
          setProfile(apiProfile);
          setIsAuthenticated(true);
        } else {
          // User doesn't exist - create them
          try {
            const response = await fetch('/api/users', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ address }),
            });

            if (response.ok) {
              // Fetch the newly created profile
              const newProfile = await fetchProfile(address);
              if (newProfile) {
                setProfile(newProfile);
                setIsAuthenticated(true);
              }
            }
          } catch (error) {
            console.error('Error creating user:', error);
          }
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    } else {
      setProfile(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, [address, isConnected, fetchProfile]);

  // Update profile function
  const updateProfile = async (updates: ProfileUpdate): Promise<UserProfile | null> => {
    if (!address) return null;

    // Update localStorage immediately (optimistic)
    const localProfile = profileStorage.updateProfile(address, updates);
    setProfile(localProfile);

    // Sync to API
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          username: updates.displayName,
          bio: updates.bio,
          avatar_url: updates.avatarUrl,
          twitter_handle: updates.socialLinks?.twitter,
          telegram_handle: updates.socialLinks?.telegram,
          website: updates.socialLinks?.website,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to update profile:', error);
        // Revert to cached on failure
        const cachedProfile = profileStorage.getProfile(address);
        setProfile(cachedProfile);
        return cachedProfile;
      }

      // Fetch updated profile from API
      const apiProfile = await fetchProfile(address);
      if (apiProfile) {
        setProfile(apiProfile);
        return apiProfile;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }

    return localProfile;
  };

  // Update stats function
  const updateStats = async (statUpdates: Partial<UserProfile['stats']>): Promise<UserProfile | null> => {
    if (!address) return null;

    // Update localStorage immediately
    const localProfile = profileStorage.updateStats(address, statUpdates);
    setProfile(localProfile);

    // Sync specific stat to API
    try {
      for (const [key, value] of Object.entries(statUpdates)) {
        const fieldMap: Record<string, string> = {
          tokensCreated: 'tokens_created',
          tokensHeld: 'tokens_held',
          totalTrades: 'total_trades',
          chatCount: 'chat_messages',
        };

        const apiField = fieldMap[key];
        if (apiField && typeof value === 'number') {
          await fetch('/api/users/stats', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address,
              field: apiField,
              increment: 1,
            }),
          });
        }
      }
    } catch (error) {
      console.error('Error updating stats:', error);
    }

    return localProfile;
  };

  // Add badge function
  const addBadge = (badge: string): UserProfile | null => {
    if (!address) return null;

    const updatedProfile = profileStorage.addBadge(address, badge);
    setProfile(updatedProfile);
    return updatedProfile;
  };

  // Increment chat count (helper for chat activity)
  const incrementChatCount = () => {
    if (!profile) return;

    updateStats({
      chatCount: profile.stats.chatCount + 1,
    });
  };


  // Format display name with fallback
  const getDisplayName = (fallbackAddress?: string): string => {
    const addr = fallbackAddress || address;
    if (!addr) return 'Unknown';

    // Priority: Display Name > ENS > Shortened Address
    if (profile?.displayName) return profile.displayName;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return {
    profile,
    loading,
    isConnected,
    isAuthenticated,
    authenticate,
    updateProfile,
    updateStats,
    addBadge,
    incrementChatCount,
    getDisplayName,
  };
}

// Hook for getting any user's profile (not just current user)
export function useUserProfile(address?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address) {
      // First load from localStorage
      const cachedProfile = profileStorage.getProfile(address);
      setProfile(cachedProfile);

      // Then fetch from API
      fetch(`/api/users?address=${address}`)
        .then(response => response.ok ? response.json() : null)
        .then(data => {
          if (data?.user) {
            const apiProfile: UserProfile = {
              address: data.user.address,
              displayName: data.user.username || null,
              bio: data.user.bio || null,
              avatarUrl: data.user.avatar_url || null,
              socialLinks: {
                twitter: data.user.twitter_handle || null,
                telegram: data.user.telegram_handle || null,
                website: data.user.website || null,
              },
              stats: {
                tokensCreated: data.user.user_stats?.tokens_created || 0,
                tokensHeld: data.user.user_stats?.tokens_held || 0,
                totalTrades: data.user.user_stats?.total_trades || 0,
                totalVolume: data.user.user_stats?.total_volume || '0',
                chatCount: data.user.user_stats?.chat_messages || 0,
              },
              badges: [],
              createdAt: data.user.created_at,
              updatedAt: data.user.updated_at,
            };
            setProfile(apiProfile);
            profileStorage.updateProfile(address, apiProfile);
          }
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [address]);

  return { profile, loading };
}
