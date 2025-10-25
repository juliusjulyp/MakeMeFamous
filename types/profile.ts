export interface UserProfile {
  address: string;           // Wallet address (primary key)
  displayName?: string;      // Custom display name
  bio?: string;             // Short bio (max 160 chars)
  ensName?: string;         // Resolved ENS name
  avatar?: string;          // Profile picture URL/IPFS hash
  joinedAt: string;         // ISO timestamp when first connected
  lastActive: string;       // Last activity timestamp
  reputation: number;       // Activity-based reputation score
  stats: {
    chatCount: number;      // Total messages sent
    tokensHeld: number;     // Number of different tokens held
    communitiesJoined: number; // Number of token communities
    reactionsGiven: number; // Reactions given to others
  };
  preferences: {
    showENS: boolean;       // Show ENS name instead of address
    publicProfile: boolean; // Profile visible to others
    notifications: boolean; // Enable notifications
  };
  badges: string[];         // Achievement badges earned
  tokensHeld: string[];     // Token contract addresses they hold $10+
}

export interface ProfileUpdate {
  displayName?: string;
  bio?: string;
  avatar?: string;
  preferences?: Partial<UserProfile['preferences']>;
}

// Default profile for new users
export const createDefaultProfile = (address: string): UserProfile => ({
  address: address.toLowerCase(),
  joinedAt: new Date().toISOString(),
  lastActive: new Date().toISOString(),
  reputation: 0,
  stats: {
    chatCount: 0,
    tokensHeld: 0,
    communitiesJoined: 0,
    reactionsGiven: 0,
  },
  preferences: {
    showENS: true,
    publicProfile: true,
    notifications: true,
  },
  badges: [],
  tokensHeld: [],
});