'use client';

import { useState } from 'react';
import { useReferral } from '@/hooks/use-referral';
import { Copy, Check, Users, TrendingUp, Coins, Twitter, Send, Share2, Trophy, Wallet, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function ReferralCard() {
  const { code, stats, referrals, loading, claiming, copyReferralLink, getReferralLink, claimEarnings } = useReferral();
  const [copied, setCopied] = useState(false);
  const [claimMessage, setClaimMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCopy = async () => {
    await copyReferralLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToTwitter = () => {
    const text = `Join me on MakeMeFamous! Create your own social token and earn together. Use my referral link:`;
    const url = getReferralLink();
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank'
    );
  };

  const shareToTelegram = () => {
    const text = `Join me on MakeMeFamous! Create your own social token and earn together.`;
    const url = getReferralLink();
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      '_blank'
    );
  };

  const shareNative = async () => {
    const url = getReferralLink();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join MakeMeFamous',
          text: 'Create your own social token and earn together!',
          url: url,
        });
      } catch (err) {
        // User cancelled or error
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-800 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-gray-800 rounded mb-4"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-20 bg-gray-800 rounded"></div>
          <div className="h-20 bg-gray-800 rounded"></div>
          <div className="h-20 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  const pendingEarnings = parseFloat(stats?.pending_earnings || '0');

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Your Referral Link</h3>
        <Link href="/fame" className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">
          <Trophy className="w-4 h-4" />
          Leaderboard
        </Link>
      </div>

      {/* Referral Link */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 bg-gray-800 rounded-lg px-4 py-3 font-mono text-sm text-gray-300 truncate">
          {typeof window !== 'undefined' ? `${window.location.origin}?ref=${code}` : `...?ref=${code}`}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors"
        >
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Share Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={shareToTwitter}
          className="flex-1 flex items-center justify-center gap-1 sm:gap-2 bg-gray-800 hover:bg-gray-700 text-white px-2 sm:px-3 py-2.5 rounded-lg transition-colors"
        >
          <Twitter className="w-4 h-4" />
          <span className="text-xs sm:text-sm">Twitter</span>
        </button>
        <button
          onClick={shareToTelegram}
          className="flex-1 flex items-center justify-center gap-1 sm:gap-2 bg-gray-800 hover:bg-gray-700 text-white px-2 sm:px-3 py-2.5 rounded-lg transition-colors"
        >
          <Send className="w-4 h-4" />
          <span className="text-xs sm:text-sm">Telegram</span>
        </button>
        <button
          onClick={shareNative}
          className="flex-1 flex items-center justify-center gap-1 sm:gap-2 bg-gray-800 hover:bg-gray-700 text-white px-2 sm:px-3 py-2.5 rounded-lg transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-xs sm:text-sm">Share</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-2 sm:p-4">
          <div className="flex items-center gap-1 sm:gap-2 text-gray-400 text-xs sm:text-sm mb-1">
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Referrals</span>
            <span className="sm:hidden">Refs</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-white">
            {stats?.total_referrals || 0}
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-2 sm:p-4">
          <div className="flex items-center gap-1 sm:gap-2 text-gray-400 text-xs sm:text-sm mb-1">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
            Volume
          </div>
          <div className="text-lg sm:text-2xl font-bold text-white">
            <span className="hidden sm:inline">{parseFloat(stats?.total_volume || '0').toFixed(2)} MATIC</span>
            <span className="sm:hidden">{parseFloat(stats?.total_volume || '0').toFixed(1)}</span>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-2 sm:p-4">
          <div className="flex items-center gap-1 sm:gap-2 text-gray-400 text-xs sm:text-sm mb-1">
            <Coins className="w-3 h-3 sm:w-4 sm:h-4" />
            Earnings
          </div>
          <div className="text-lg sm:text-2xl font-bold text-green-400">
            <span className="hidden sm:inline">{parseFloat(stats?.total_earnings || '0').toFixed(4)} MATIC</span>
            <span className="sm:hidden">{parseFloat(stats?.total_earnings || '0').toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Pending Earnings & Claim */}
      {pendingEarnings > 0 && (
        <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-green-400 mb-1">Pending Earnings</div>
              <div className="text-xl font-bold text-green-300">
                {pendingEarnings.toFixed(4)} MATIC
              </div>
            </div>
            <button
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
              onClick={async () => {
                const result = await claimEarnings();
                if (result.success) {
                  setClaimMessage({ type: 'success', text: result.message || `Claimed ${result.claimedAmount} MATIC!` });
                } else {
                  setClaimMessage({ type: 'error', text: result.error || 'Failed to claim' });
                }
                setTimeout(() => setClaimMessage(null), 5000);
              }}
              disabled={claiming}
            >
              {claiming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wallet className="w-4 h-4" />
              )}
              {claiming ? 'Claiming...' : 'Claim'}
            </button>
          </div>
          {claimMessage && (
            <div className={`mt-3 text-sm ${claimMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {claimMessage.text}
            </div>
          )}
        </div>
      )}

      {/* Reward Info */}
      <div className="bg-purple-900/20 border border-purple-800/50 rounded-lg p-4 mb-6">
        <p className="text-purple-300 text-sm">
          Earn <span className="font-bold text-purple-200">0.5%</span> of all trading fees from users you refer - forever!
        </p>
      </div>

      {/* Recent Referrals */}
      {referrals.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-3">Recent Referrals</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {referrals.slice(0, 5).map((ref, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-800/30 rounded-lg px-3 py-2">
                <span className="text-sm text-gray-300 font-mono">
                  {ref.referred_address.slice(0, 6)}...{ref.referred_address.slice(-4)}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(ref.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
