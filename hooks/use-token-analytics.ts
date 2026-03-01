'use client';

import { useState, useEffect } from 'react';

export interface TokenAnalytics {
  volume24h: number;
  volume7d: number;
  volumeChange24h: number;
  priceChange24h: number | null;
  priceChange7d: number | null;
  tradeCount24h: number;
  tradeCount7d: number;
  tradeCountTotal: number;
  holderCount: number;
  holderGrowth7d: number;
  hourlyVolume: { hour: string; volume: number }[];
}

export function useTokenAnalytics(tokenAddress: string) {
  const [analytics, setAnalytics] = useState<TokenAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenAddress) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/tokens/analytics?token=${tokenAddress}`);
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();

    // Refresh every 60 seconds
    const interval = setInterval(fetchAnalytics, 60000);
    return () => clearInterval(interval);
  }, [tokenAddress]);

  return { analytics, loading };
}
