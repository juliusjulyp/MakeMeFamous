'use client';

import { ExternalLink } from 'lucide-react';

interface PostLinkPreviewProps {
  url: string;
  title?: string | null;
  description?: string | null;
  image?: string | null;
}

export function PostLinkPreview({ url, title, description, image }: PostLinkPreviewProps) {
  const domain = (() => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  })();

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-3 rounded-xl border border-border overflow-hidden hover:bg-surface/50 transition-colors"
      onClick={(e) => e.stopPropagation()}
    >
      {image && (
        <div className="aspect-[2/1] bg-surface overflow-hidden">
          <img src={image} alt={title || ''} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-center gap-1 text-xs text-foreground/50 mb-1">
          <ExternalLink className="h-3 w-3" />
          {domain}
        </div>
        {title && (
          <p className="text-sm font-medium line-clamp-1">{title}</p>
        )}
        {description && (
          <p className="text-xs text-foreground/60 line-clamp-2 mt-0.5">{description}</p>
        )}
      </div>
    </a>
  );
}
