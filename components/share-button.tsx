'use client';

import { useState } from 'react';
import { Share2, Twitter, Send, Copy, Check, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShareButtonProps {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  price?: string;
  className?: string;
}

export function ShareButton({ tokenAddress, tokenName, tokenSymbol, price, className }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/token/${tokenAddress}`
    : '';

  const shareText = `Check out $${tokenSymbol} (${tokenName}) on MakeMeFamous! ${price ? `Currently trading at ${price} MATIC.` : ''}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      '_blank'
    );
    setShowMenu(false);
  };

  const shareToTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      '_blank'
    );
    setShowMenu(false);
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${tokenName} ($${tokenSymbol})`,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
    setShowMenu(false);
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
        className="gap-2"
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            <button
              onClick={shareToTwitter}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface/50 transition-colors text-left"
            >
              <Twitter className="h-4 w-4 text-[#1DA1F2]" />
              <span className="text-sm">Share on Twitter</span>
            </button>
            <button
              onClick={shareToTelegram}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface/50 transition-colors text-left"
            >
              <Send className="h-4 w-4 text-[#0088cc]" />
              <span className="text-sm">Share on Telegram</span>
            </button>
            <button
              onClick={shareNative}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface/50 transition-colors text-left"
            >
              <Link2 className="h-4 w-4" />
              <span className="text-sm">More options</span>
            </button>
            <div className="border-t border-border" />
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface/50 transition-colors text-left"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-500">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span className="text-sm">Copy link</span>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
