import React from 'react';
import { useMaticPrice, maticToUsd, formatUsd, formatMatic } from '@/hooks/use-matic-price';
import { Loader2 } from 'lucide-react';
import { useAccount } from 'wagmi';

interface PriceDisplayProps {
  maticAmount: string | number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBoth?: boolean; // Show both USD and MATIC
  primaryCurrency?: 'usd' | 'matic'; // Which one to show prominently
  className?: string;
}

/**
 * Display price in USD (primary) and MATIC (secondary)
 *
 * Examples:
 * - Small: $0.50 (1 MATIC)
 * - Medium: $12.50 (25 MATIC)
 * - Large: $125.00 (250 MATIC)
 */
export function PriceDisplay({
  maticAmount,
  size = 'md',
  showBoth = true,
  primaryCurrency = 'usd',
  className = '',
}: PriceDisplayProps) {
  const { chain } = useAccount();
  const isMainnet = chain?.id === 137; // Polygon mainnet
  const { maticUsd, isLoading } = useMaticPrice();

  // Size classes
  const sizeClasses = {
    sm: {
      primary: 'text-sm font-semibold',
      secondary: 'text-xs text-foreground/60',
    },
    md: {
      primary: 'text-base font-bold',
      secondary: 'text-sm text-foreground/60',
    },
    lg: {
      primary: 'text-xl font-bold',
      secondary: 'text-sm text-foreground/60',
    },
    xl: {
      primary: 'text-3xl font-bold',
      secondary: 'text-base text-foreground/60',
    },
  };

  // On testnet, just show MATIC without USD conversion
  if (!isMainnet) {
    return (
      <span className={`${sizeClasses[size].primary} ${className}`}>
        {formatMatic(maticAmount)} MATIC
      </span>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-foreground/50" />
        <span className="text-sm text-foreground/50">Loading price...</span>
      </div>
    );
  }

  const usdValue = maticToUsd(maticAmount, maticUsd);
  const maticFormatted = formatMatic(maticAmount);
  const usdFormatted = formatUsd(usdValue);

  const classes = sizeClasses[size];

  if (!showBoth) {
    // Show only one currency
    return (
      <span className={`${classes.primary} ${className}`}>
        {primaryCurrency === 'usd' ? usdFormatted : `${maticFormatted} MATIC`}
      </span>
    );
  }

  // Show both currencies
  if (primaryCurrency === 'usd') {
    return (
      <div className={`flex items-baseline gap-2 ${className}`}>
        <span className={classes.primary}>{usdFormatted}</span>
        <span className={classes.secondary}>({maticFormatted} MATIC)</span>
      </div>
    );
  } else {
    return (
      <div className={`flex items-baseline gap-2 ${className}`}>
        <span className={classes.primary}>{maticFormatted} MATIC</span>
        <span className={classes.secondary}>({usdFormatted})</span>
      </div>
    );
  }
}

/**
 * Compact price display for cards/lists
 */
export function CompactPrice({ maticAmount }: { maticAmount: string | number }) {
  const { chain } = useAccount();
  const isMainnet = chain?.id === 137;
  const { maticUsd } = useMaticPrice();
  const usdValue = maticToUsd(maticAmount, maticUsd);

  // On testnet, just show MATIC
  if (!isMainnet) {
    return (
      <div className="flex flex-col">
        <span className="text-sm font-bold">{formatMatic(maticAmount)} MATIC</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <span className="text-sm font-bold">{formatUsd(usdValue)}</span>
      <span className="text-xs text-foreground/50">{formatMatic(maticAmount)} MATIC</span>
    </div>
  );
}

/**
 * Price with change indicator
 */
interface PriceWithChangeProps {
  currentMatic: string | number;
  previousMatic?: string | number;
  size?: 'sm' | 'md' | 'lg';
}

export function PriceWithChange({
  currentMatic,
  previousMatic,
  size = 'md',
}: PriceWithChangeProps) {
  const { chain } = useAccount();
  const isMainnet = chain?.id === 137;
  const { maticUsd } = useMaticPrice();
  const currentUsd = maticToUsd(currentMatic, maticUsd);

  let percentChange = 0;
  if (previousMatic) {
    const current = typeof currentMatic === 'string' ? parseFloat(currentMatic) : currentMatic;
    const previous = typeof previousMatic === 'string' ? parseFloat(previousMatic) : previousMatic;
    percentChange = ((current - previous) / previous) * 100;
  }

  const isPositive = percentChange >= 0;
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
  const changeIcon = isPositive ? '↑' : '↓';

  const sizeClass = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-xl' : 'text-base';

  return (
    <div className="flex items-center gap-3">
      <PriceDisplay maticAmount={currentMatic} size={size} />
      {previousMatic && (
        <span className={`${changeColor} text-sm font-medium`}>
          {changeIcon} {Math.abs(percentChange).toFixed(2)}%
        </span>
      )}
    </div>
  );
}

/**
 * Price range display (for buy/sell preview)
 */
interface PriceRangeProps {
  fromMatic: string | number;
  toMatic: string | number;
}

export function PriceRange({ fromMatic, toMatic }: PriceRangeProps) {
  const { chain } = useAccount();
  const isMainnet = chain?.id === 137;
  const { maticUsd } = useMaticPrice();
  const fromUsd = maticToUsd(fromMatic, maticUsd);
  const toUsd = maticToUsd(toMatic, maticUsd);

  // On testnet, just show MATIC
  if (!isMainnet) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold">{formatMatic(fromMatic)} MATIC</span>
        <span className="text-foreground/50">→</span>
        <span className="font-semibold">{formatMatic(toMatic)} MATIC</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-semibold">{formatUsd(fromUsd)}</span>
      <span className="text-foreground/50">→</span>
      <span className="font-semibold">{formatUsd(toUsd)}</span>
      <span className="text-xs text-foreground/50">
        ({formatMatic(fromMatic)} → {formatMatic(toMatic)} MATIC)
      </span>
    </div>
  );
}

/**
 * MATIC price indicator (shows current MATIC/USD rate)
 * Only shows on mainnet
 */
export function MaticPriceIndicator({ className = '' }: { className?: string }) {
  const { chain } = useAccount();
  const isMainnet = chain?.id === 137;
  const { maticUsd, isLoading, error } = useMaticPrice();

  // Don't show on testnet
  if (!isMainnet) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-1 text-xs text-foreground/50 ${className}`}>
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Loading MATIC price...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-xs text-foreground/50 ${className}`}>
        MATIC: ~$0.50 (estimated)
      </div>
    );
  }

  return (
    <div className={`text-xs text-foreground/60 ${className}`}>
      1 MATIC = ${maticUsd.toFixed(4)}
    </div>
  );
}
