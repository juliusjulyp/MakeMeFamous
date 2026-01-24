'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';

interface ReferralStats {
  total_referrals: number;
  total_volume: string;
  total_earnings: string;
  pending_earnings: string;
  claimed_earnings?: string;
}

interface Referral {
  referred_address: string;
  created_at: string;
  total_volume: string;
}

interface ClaimResult {
  success: boolean;
  claimedAmount?: string;
  error?: string;
  message?: string;
}

export function useReferral() {
  const { address } = useAccount();
  const [code, setCode] = useState<string>('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const fetchReferralData = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/referrals?address=${address}`);
      const data = await res.json();
      if (data.code) setCode(data.code);
      if (data.stats) setStats(data.stats);
      if (data.referrals) setReferrals(data.referrals);
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  const registerReferral = async (referrerCode: string) => {
    if (!address) return { success: false, error: 'Not connected' };
    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referrerCode, referredAddress: address })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to register referral' };
    }
  };

  const getReferralLink = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}?ref=${code}`;
  };

  const copyReferralLink = async () => {
    const link = getReferralLink();
    await navigator.clipboard.writeText(link);
    return link;
  };

  const claimEarnings = async (): Promise<ClaimResult> => {
    if (!address) return { success: false, error: 'Not connected' };

    setClaiming(true);
    try {
      const res = await fetch('/api/referrals/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error };
      }

      // Refresh stats after claiming
      await fetchReferralData();

      return {
        success: true,
        claimedAmount: data.claimedAmount,
        message: data.message
      };
    } catch {
      return { success: false, error: 'Failed to claim earnings' };
    } finally {
      setClaiming(false);
    }
  };

  return {
    code,
    stats,
    referrals,
    loading,
    claiming,
    getReferralLink,
    copyReferralLink,
    registerReferral,
    claimEarnings,
    refetch: fetchReferralData
  };
}

// Utility function to track referral earnings after a trade
export async function trackReferralEarnings(
  traderAddress: string,
  tokenAddress: string,
  tradeVolume: string,
  txHash?: string
): Promise<{ tracked: boolean; error?: string }> {
  try {
    const res = await fetch('/api/referrals/earnings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        traderAddress,
        tokenAddress,
        tradeVolume,
        txHash
      })
    });
    const data = await res.json();
    return { tracked: data.tracked || false };
  } catch {
    return { tracked: false, error: 'Failed to track earnings' };
  }
}
