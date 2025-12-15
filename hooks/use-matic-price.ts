import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

/**
 * Hook to fetch and track MATIC/USD price from CoinGecko
 * Only fetches on Polygon mainnet (chainId: 137)
 * Updates every 60 seconds
 * Falls back to $0.50 if API fails
 */
export function useMaticPrice() {
  const { chain } = useAccount();
  const isMainnet = chain?.id === 137; // Polygon mainnet
  const [maticUsd, setMaticUsd] = useState<number>(0.50); // Default fallback
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip price fetching on testnet
    if (!isMainnet) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchMaticPrice() {
      try {
        // CoinGecko free API - no auth required
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd',
          {
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const price = data['matic-network']?.usd;

        if (price && isMounted) {
          setMaticUsd(price);
          setError(null);
          setIsLoading(false);
          console.log('📊 MATIC Price Updated:', `$${price.toFixed(4)}`);
        }
      } catch (err) {
        console.error('Failed to fetch MATIC price:', err);
        if (isMounted) {
          setError('Failed to fetch price');
          setIsLoading(false);
          // Keep using fallback price
        }
      }
    }

    // Initial fetch
    fetchMaticPrice();

    // Update every 60 seconds
    const interval = setInterval(fetchMaticPrice, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isMainnet]);

  return { maticUsd, isLoading, error };
}

/**
 * Convert MATIC amount to USD
 */
export function maticToUsd(maticAmount: string | number, maticPrice: number): number {
  const matic = typeof maticAmount === 'string' ? parseFloat(maticAmount) : maticAmount;
  return matic * maticPrice;
}

/**
 * Format USD value with proper decimals
 */
export function formatUsd(value: number): string {
  if (value === 0) return '$0.00';
  if (value < 0.01) return `$${value.toFixed(6)}`; // Show 6 decimals for very small amounts
  if (value < 1) return `$${value.toFixed(4)}`;     // Show 4 decimals for under $1
  if (value < 1000) return `$${value.toFixed(2)}`;  // Show 2 decimals for normal amounts

  // For large amounts, use K/M notation
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;

  return `$${value.toFixed(2)}`;
}

/**
 * Format MATIC value with proper decimals
 */
export function formatMatic(value: string | number): string {
  const matic = typeof value === 'string' ? parseFloat(value) : value;
  if (matic === 0) return '0';
  if (matic < 0.000001) return matic.toExponential(2);
  if (matic < 0.01) return matic.toFixed(6);
  if (matic < 1) return matic.toFixed(4);
  return matic.toFixed(2);
}
