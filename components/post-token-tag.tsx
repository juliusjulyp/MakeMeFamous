'use client';

import Link from 'next/link';

interface PostTokenTagProps {
  address: string;
  name?: string;
  symbol?: string;
  imageUrl?: string | null;
}

export function PostTokenTag({ address, name, symbol, imageUrl }: PostTokenTagProps) {
  const displayName = symbol || name || `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <Link
      href={`/token/${address}`}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
      onClick={(e) => e.stopPropagation()}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={displayName} className="w-3.5 h-3.5 rounded-full object-cover" />
      ) : (
        <span className="w-3.5 h-3.5 rounded-full bg-primary/30 flex items-center justify-center text-[8px] font-bold">
          {displayName.charAt(0)}
        </span>
      )}
      ${displayName}
    </Link>
  );
}
