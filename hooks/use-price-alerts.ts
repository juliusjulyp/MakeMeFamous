'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';

export interface PriceAlert {
  id: string;
  user_address: string;
  token_address: string;
  target_price: string;
  direction: 'above' | 'below';
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
  tokenName: string;
  tokenSymbol: string;
  tokenImage: string | null;
}

export function usePriceAlerts() {
  const { address } = useAccount();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    if (!address) {
      setAlerts([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/alerts?user=${address}`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const createAlert = useCallback(
    async (tokenAddress: string, targetPrice: string, direction: 'above' | 'below') => {
      if (!address) return null;

      try {
        const response = await fetch('/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: address,
            tokenAddress,
            targetPrice,
            direction,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          await fetchAlerts(); // Refresh list
          return data.alert;
        }
        return null;
      } catch (error) {
        console.error('Error creating alert:', error);
        return null;
      }
    },
    [address, fetchAlerts]
  );

  const deleteAlert = useCallback(
    async (alertId: string) => {
      // Optimistic update
      setAlerts(prev => prev.filter(a => a.id !== alertId));

      try {
        const response = await fetch('/api/alerts', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: alertId }),
        });

        if (!response.ok) {
          await fetchAlerts(); // Revert by refetching
        }
      } catch {
        await fetchAlerts();
      }
    },
    [fetchAlerts]
  );

  const toggleAlert = useCallback(
    async (alertId: string, isActive: boolean) => {
      // Optimistic update
      setAlerts(prev =>
        prev.map(a => (a.id === alertId ? { ...a, is_active: isActive } : a))
      );

      try {
        const response = await fetch('/api/alerts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: alertId, is_active: isActive }),
        });

        if (!response.ok) {
          await fetchAlerts();
        }
      } catch {
        await fetchAlerts();
      }
    },
    [fetchAlerts]
  );

  const getAlertsForToken = useCallback(
    (tokenAddress: string) =>
      alerts.filter(a => a.token_address === tokenAddress.toLowerCase()),
    [alerts]
  );

  return {
    alerts,
    loading,
    createAlert,
    deleteAlert,
    toggleAlert,
    getAlertsForToken,
    activeCount: alerts.filter(a => a.is_active).length,
  };
}
