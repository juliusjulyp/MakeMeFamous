import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role (for API routes)
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server operations');
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

// Token categories
export type TokenCategory = 'creator' | 'artist' | 'gaming' | 'meme' | 'music' | 'infrastructure' | 'ai';

export const TOKEN_CATEGORIES: { value: TokenCategory; label: string; icon: string }[] = [
  { value: 'creator', label: 'Creator', icon: 'Crown' },
  { value: 'artist', label: 'Artist', icon: 'Palette' },
  { value: 'gaming', label: 'Gaming', icon: 'Gamepad2' },
  { value: 'meme', label: 'Meme', icon: 'Smile' },
  { value: 'music', label: 'Music', icon: 'Music' },
  { value: 'infrastructure', label: 'Infrastructure', icon: 'Building2' },
  { value: 'ai', label: 'AI', icon: 'Bot' },
];

// Database types
export interface DbUser {
  id: string;
  address: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  twitter_handle: string | null;
  telegram_handle: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbUserStats {
  user_id: string;
  tokens_created: number;
  tokens_held: number;
  total_trades: number;
  total_volume: string;
  chat_messages: number;
  reputation_score: number;
  updated_at: string;
}

// Referral system types
export interface DbReferral {
  id: string;
  referrer_address: string;
  referred_address: string;
  referral_code: string;
  created_at: string;
  is_active: boolean;
}

export interface DbReferralStats {
  referrer_address: string;
  total_referrals: number;
  active_referrals: number;
  total_volume_generated: string;
  total_earnings: string;
  pending_earnings: string;
  claimed_earnings: string;
  updated_at: string;
}

export interface DbReferralEarning {
  id: string;
  referrer_address: string;
  referred_address: string;
  token_address: string;
  trade_volume: string;
  earning_amount: string;
  created_at: string;
  is_claimed: boolean;
}

// Wave 6: Discovery & Engagement types
export interface DbWatchlist {
  id: string;
  user_address: string;
  token_address: string;
  created_at: string;
}

export interface DbFollow {
  id: string;
  follower_address: string;
  followed_address: string;
  created_at: string;
}

export interface DbPriceAlert {
  id: string;
  user_address: string;
  token_address: string;
  target_price: string;
  direction: 'above' | 'below';
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
}

// Wave 7: Social Feed types
export interface DbPost {
  id: string;
  author_address: string;
  content: string;
  images: string[];
  token_tags: string[];
  link_url: string | null;
  link_title: string | null;
  link_description: string | null;
  link_image: string | null;
  repost_of: string | null;
  like_count: number;
  comment_count: number;
  repost_count: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbPostLike {
  id: string;
  post_id: string;
  user_address: string;
  created_at: string;
}

export interface DbPostComment {
  id: string;
  post_id: string;
  author_address: string;
  content: string;
  is_deleted: boolean;
  created_at: string;
}

export interface DbRepost {
  id: string;
  post_id: string;
  user_address: string;
  created_at: string;
}
