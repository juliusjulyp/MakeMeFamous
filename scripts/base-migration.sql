-- Missing Tables Migration
-- Run this in Supabase SQL Editor BEFORE wave6-migration.sql
--
-- Existing tables (already in DB): auth_nonces, token_likes, token_metadata, user_stats, users
-- This script creates the 6 missing tables needed by the app

-- 1. Trades table
CREATE TABLE IF NOT EXISTS trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_address TEXT NOT NULL,
  trader_address TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  token_amount TEXT NOT NULL,
  volume TEXT NOT NULL,
  tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trades_token ON trades(token_address);
CREATE INDEX IF NOT EXISTS idx_trades_trader_address ON trades(trader_address);

-- 2. Referral codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);

-- 3. Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_address TEXT NOT NULL,
  referred_address TEXT NOT NULL UNIQUE,
  referral_code TEXT NOT NULL,
  total_volume TEXT DEFAULT '0',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_address);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_address);

-- 4. Referral stats table
CREATE TABLE IF NOT EXISTS referral_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_address TEXT NOT NULL UNIQUE,
  total_referrals INTEGER DEFAULT 0,
  active_referrals INTEGER DEFAULT 0,
  total_volume TEXT DEFAULT '0',
  total_earnings TEXT DEFAULT '0',
  pending_earnings TEXT DEFAULT '0',
  claimed_earnings TEXT DEFAULT '0',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_referral_stats_referrer ON referral_stats(referrer_address);

-- 5. Referral earnings table
CREATE TABLE IF NOT EXISTS referral_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_address TEXT NOT NULL,
  referred_address TEXT NOT NULL,
  token_address TEXT NOT NULL,
  trade_volume TEXT NOT NULL,
  earning_amount TEXT NOT NULL,
  tx_hash TEXT,
  is_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer ON referral_earnings(referrer_address);

-- 6. Referral claims table
CREATE TABLE IF NOT EXISTS referral_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  amount TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_referral_claims_address ON referral_claims(address);
