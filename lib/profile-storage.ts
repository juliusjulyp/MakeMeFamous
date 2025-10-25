'use client';

import { UserProfile, createDefaultProfile, ProfileUpdate } from '@/types/profile';

const STORAGE_KEY = 'makemefamous_profiles';

class ProfileStorage {
  private profiles: Map<string, UserProfile> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  // Load profiles from localStorage
  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const profilesArray: UserProfile[] = JSON.parse(stored);
        profilesArray.forEach(profile => {
          this.profiles.set(profile.address.toLowerCase(), profile);
        });
      }
    } catch (error) {
      console.error('Failed to load profiles from storage:', error);
    }
  }

  // Save profiles to localStorage
  private saveToStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      const profilesArray = Array.from(this.profiles.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profilesArray));
    } catch (error) {
      console.error('Failed to save profiles to storage:', error);
    }
  }

  // Get profile by address
  getProfile(address: string): UserProfile {
    const normalizedAddress = address.toLowerCase();
    let profile = this.profiles.get(normalizedAddress);
    
    if (!profile) {
      // Create default profile for new user
      profile = createDefaultProfile(normalizedAddress);
      this.profiles.set(normalizedAddress, profile);
      this.saveToStorage();
    }
    
    return profile;
  }

  // Update profile
  updateProfile(address: string, updates: ProfileUpdate): UserProfile {
    const normalizedAddress = address.toLowerCase();
    const currentProfile = this.getProfile(normalizedAddress);
    
    const updatedProfile: UserProfile = {
      ...currentProfile,
      ...updates,
      address: normalizedAddress, // Ensure address doesn't change
      lastActive: new Date().toISOString(),
      preferences: {
        ...currentProfile.preferences,
        ...updates.preferences,
      },
    };
    
    this.profiles.set(normalizedAddress, updatedProfile);
    this.saveToStorage();
    
    return updatedProfile;
  }

  // Update user stats (for activity tracking)
  updateStats(address: string, statUpdates: Partial<UserProfile['stats']>): UserProfile {
    const profile = this.getProfile(address);
    
    const updatedProfile: UserProfile = {
      ...profile,
      lastActive: new Date().toISOString(),
      stats: {
        ...profile.stats,
        ...statUpdates,
      },
    };
    
    // Update reputation based on activity
    updatedProfile.reputation = this.calculateReputation(updatedProfile);
    
    this.profiles.set(address.toLowerCase(), updatedProfile);
    this.saveToStorage();
    
    return updatedProfile;
  }

  // Calculate reputation score based on activity
  private calculateReputation(profile: UserProfile): number {
    const { stats } = profile;
    
    // Simple reputation formula (can be enhanced later)
    const chatScore = stats.chatCount * 1;
    const tokenScore = stats.tokensHeld * 5;
    const communityScore = stats.communitiesJoined * 3;
    const reactionScore = stats.reactionsGiven * 0.5;
    
    return Math.floor(chatScore + tokenScore + communityScore + reactionScore);
  }

  // Add badge to user
  addBadge(address: string, badge: string): UserProfile {
    const profile = this.getProfile(address);
    
    if (!profile.badges.includes(badge)) {
      profile.badges.push(badge);
      this.profiles.set(address.toLowerCase(), profile);
      this.saveToStorage();
    }
    
    return profile;
  }

  // Get all profiles (for leaderboards, etc.)
  getAllProfiles(): UserProfile[] {
    return Array.from(this.profiles.values());
  }

  // Clear all profiles (for testing)
  clearAll() {
    this.profiles.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

// Singleton instance
export const profileStorage = new ProfileStorage();