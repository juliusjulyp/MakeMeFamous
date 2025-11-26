export interface UserProfile {
  address: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  socialLinks: {
    twitter: string | null;
    telegram: string | null;
    website: string | null;
  };
  stats: {
    tokensCreated: number;
    tokensHeld: number;
    totalTrades: number;
    totalVolume: string;
    chatCount: number;
  };
  badges: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpdate {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  socialLinks?: {
    twitter: string | null;
    telegram: string | null;
    website: string | null;
  };
}

// Default profile for new users
export const createDefaultProfile = (address: string): UserProfile => ({
  address: address.toLowerCase(),
  displayName: null,
  bio: null,
  avatarUrl: null,
  socialLinks: {
    twitter: null,
    telegram: null,
    website: null,
  },
  stats: {
    tokensCreated: 0,
    tokensHeld: 0,
    totalTrades: 0,
    totalVolume: '0',
    chatCount: 0,
  },
  badges: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});