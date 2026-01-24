'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useReferral } from '@/hooks/use-referral';

export function ReferralHandler() {
  const searchParams = useSearchParams();
  const { address } = useAccount();
  const { registerReferral } = useReferral();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode && address) {
      // Store in localStorage to register after wallet connect
      localStorage.setItem('pendingReferral', refCode);
      registerReferral(refCode);
    }
  }, [searchParams, address, registerReferral]);

  // Check for pending referral on wallet connect
  useEffect(() => {
    if (address) {
      const pending = localStorage.getItem('pendingReferral');
      if (pending) {
        registerReferral(pending);
        localStorage.removeItem('pendingReferral');
      }
    }
  }, [address, registerReferral]);

  return null;
}
