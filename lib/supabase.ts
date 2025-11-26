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
