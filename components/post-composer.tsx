'use client';

import { useState, useRef } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Link2, Hash, Loader2, Send } from 'lucide-react';
import type { FeedPost, CreatePostData } from '@/hooks/use-social-feed';

interface TokenSearchResult {
  token_address: string;
  name: string;
  symbol: string;
  image_url: string | null;
}

interface PostComposerProps {
  onPostCreated: (post: FeedPost) => void;
  createPost: (data: CreatePostData) => Promise<FeedPost | null>;
}

export function PostComposer({ onPostCreated, createPost }: PostComposerProps) {
  const { address, isConnected } = useAccount();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [tokenTags, setTokenTags] = useState<TokenSearchResult[]>([]);
  const [showTokenSearch, setShowTokenSearch] = useState(false);
  const [tokenQuery, setTokenQuery] = useState('');
  const [tokenResults, setTokenResults] = useState<TokenSearchResult[]>([]);
  const [searchingTokens, setSearchingTokens] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isConnected) {
    return (
      <div className="border border-border rounded-xl p-6 text-center">
        <p className="text-foreground/50 text-sm">Connect your wallet to post</p>
      </div>
    );
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || images.length >= 4) return;

    const remaining = 4 - images.length;
    const filesToUpload = Array.from(files).slice(0, remaining);

    setUploading(true);
    for (const file of filesToUpload) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setImages((prev) => [...prev, data.url]);
        }
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
    setUploading(false);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const searchTokens = async (query: string) => {
    setTokenQuery(query);
    if (query.length < 2) {
      setTokenResults([]);
      return;
    }

    setSearchingTokens(true);
    try {
      const response = await fetch(`/api/posts/token-search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setTokenResults(data.tokens || []);
      }
    } catch (error) {
      console.error('Token search failed:', error);
    } finally {
      setSearchingTokens(false);
    }
  };

  const addTokenTag = (token: TokenSearchResult) => {
    if (!tokenTags.find((t) => t.token_address === token.token_address)) {
      setTokenTags((prev) => [...prev, token]);
    }
    setShowTokenSearch(false);
    setTokenQuery('');
    setTokenResults([]);
  };

  const removeTokenTag = (address: string) => {
    setTokenTags((prev) => prev.filter((t) => t.token_address !== address));
  };

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    const postData: CreatePostData = {
      content: content.trim(),
      images: images.length > 0 ? images : undefined,
      tokenTags: tokenTags.length > 0 ? tokenTags.map((t) => t.token_address) : undefined,
      linkUrl: linkUrl.trim() || undefined,
    };

    const result = await createPost(postData);
    if (result) {
      setContent('');
      setImages([]);
      setTokenTags([]);
      setLinkUrl('');
      setShowLinkInput(false);
      onPostCreated(result);
    }
    setSubmitting(false);
  };

  return (
    <div className="border border-border rounded-xl p-4">
      {/* Text area */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's happening in web3?"
        maxLength={1000}
        rows={3}
        className="w-full bg-transparent resize-none text-sm placeholder:text-foreground/40 focus:outline-none"
      />

      {/* Character count */}
      {content.length > 0 && (
        <div className="flex justify-end mb-2">
          <span
            className={`text-xs ${
              content.length > 900
                ? 'text-red-500'
                : content.length > 750
                ? 'text-yellow-500'
                : 'text-foreground/30'
            }`}
          >
            {content.length}/1000
          </span>
        </div>
      )}

      {/* Token tags */}
      {tokenTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tokenTags.map((token) => (
            <span
              key={token.token_address}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
            >
              {token.image_url && (
                <img src={token.image_url} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
              )}
              ${token.symbol}
              <button
                onClick={() => removeTokenTag(token.token_address)}
                className="ml-0.5 hover:text-red-500 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {images.map((img, i) => (
            <div key={i} className="relative rounded-lg overflow-hidden aspect-video bg-surface">
              <img src={img} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Link input */}
      {showLinkInput && (
        <div className="flex items-center gap-2 mb-3">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 bg-surface border border-border rounded-lg px-3 py-1.5 text-sm placeholder:text-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl('');
            }}
            className="text-foreground/40 hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Token search dropdown */}
      {showTokenSearch && (
        <div className="mb-3">
          <input
            type="text"
            value={tokenQuery}
            onChange={(e) => searchTokens(e.target.value)}
            placeholder="Search tokens..."
            autoFocus
            className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-sm placeholder:text-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchingTokens && (
            <div className="flex justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-foreground/40" />
            </div>
          )}
          {tokenResults.length > 0 && (
            <div className="mt-1 border border-border rounded-lg bg-background max-h-40 overflow-y-auto">
              {tokenResults.map((token) => (
                <button
                  key={token.token_address}
                  onClick={() => addTokenTag(token)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-surface/50 transition-colors"
                >
                  {token.image_url ? (
                    <img src={token.image_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-primary/20" />
                  )}
                  <span className="font-medium">{token.name}</span>
                  <span className="text-foreground/50">${token.symbol}</span>
                </button>
              ))}
            </div>
          )}
          {tokenQuery.length >= 2 && !searchingTokens && tokenResults.length === 0 && (
            <p className="text-xs text-foreground/40 mt-1 px-1">No tokens found</p>
          )}
        </div>
      )}

      {/* Actions bar */}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-1">
          {/* Image upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= 4 || uploading}
            className="p-2 text-foreground/50 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-30"
            title="Add images (max 4)"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
          </button>

          {/* Token tag */}
          <button
            onClick={() => setShowTokenSearch(!showTokenSearch)}
            className={`p-2 hover:bg-primary/10 rounded-lg transition-colors ${
              showTokenSearch ? 'text-primary bg-primary/10' : 'text-foreground/50 hover:text-primary'
            }`}
            title="Tag a token"
          >
            <Hash className="h-4 w-4" />
          </button>

          {/* Link */}
          <button
            onClick={() => setShowLinkInput(!showLinkInput)}
            className={`p-2 hover:bg-primary/10 rounded-lg transition-colors ${
              showLinkInput ? 'text-primary bg-primary/10' : 'text-foreground/50 hover:text-primary'
            }`}
            title="Add a link"
          >
            <Link2 className="h-4 w-4" />
          </button>
        </div>

        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!content.trim() || submitting}
          className="gap-2"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Post
        </Button>
      </div>
    </div>
  );
}
