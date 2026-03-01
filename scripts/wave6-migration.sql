-- Wave 6: Discovery & Engagement - Database Migration
-- Run this in Supabase SQL Editor

-- 1. Add category to token_metadata
ALTER TABLE token_metadata
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'meme';

-- 2. Watchlists table
CREATE TABLE IF NOT EXISTS watchlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_address TEXT NOT NULL,
  token_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_address, token_address)
);
CREATE INDEX IF NOT EXISTS idx_watchlists_user ON watchlists(user_address);
CREATE INDEX IF NOT EXISTS idx_watchlists_token ON watchlists(token_address);

-- 3. Follows table
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_address TEXT NOT NULL,
  followed_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_address, followed_address)
);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_address);
CREATE INDEX IF NOT EXISTS idx_follows_followed ON follows(followed_address);

-- 4. Price alerts table
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_address TEXT NOT NULL,
  token_address TEXT NOT NULL,
  target_price TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('above', 'below')),
  is_active BOOLEAN DEFAULT TRUE,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_address);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(is_active) WHERE is_active = TRUE;

-- 5. Performance indexes on trades table
CREATE INDEX IF NOT EXISTS idx_trades_token_created ON trades(token_address, created_at);
CREATE INDEX IF NOT EXISTS idx_trades_trader ON trades(trader_address, created_at);
