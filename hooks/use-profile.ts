'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { UserProfile, ProfileUpdate } from '@/types/profile';
import { profileStorage } from '@/lib/profile-storage';

export function useProfile() {
  const { address, isConnected } = useAccount();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load profile when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      const userProfile = profileStorage.getProfile(address);
      setProfile(userProfile);
      setLoading(false);
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [address, isConnected]);

  // Update profile function
  const updateProfile = (updates: ProfileUpdate): UserProfile | null => {
    if (!address) return null;
    
    const updatedProfile = profileStorage.updateProfile(address, updates);
    setProfile(updatedProfile);
    return updatedProfile;
  };

  // Update stats function
  const updateStats = (statUpdates: Partial<UserProfile['stats']>): UserProfile | null => {
    if (!address) return null;
    
    const updatedProfile = profileStorage.updateStats(address, statUpdates);
    setProfile(updatedProfile);
    return updatedProfile;
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

  // Add reaction (helper for reaction activity)
  const incrementReactions = () => {
    if (!profile) return;
    
    updateStats({
      reactionsGiven: profile.stats.reactionsGiven + 1,
    });
  };

  // Format display name with fallback
  const getDisplayName = (fallbackAddress?: string): string => {
    const addr = fallbackAddress || address;
    if (!addr) return 'Unknown';
    
    // Priority: Display Name > ENS > Shortened Address
    if (profile?.displayName) return profile.displayName;
    if (profile?.ensName) return profile.ensName;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return {
    profile,
    loading,
    isConnected,
    updateProfile,
    updateStats,
    addBadge,
    incrementChatCount,
    incrementReactions,
    getDisplayName,
  };
}

// Hook for getting any user's profile (not just current user)
export function useUserProfile(address?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address) {
      const userProfile = profileStorage.getProfile(address);
      setProfile(userProfile);
      setLoading(false);
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [address]);

  return { profile, loading };
}