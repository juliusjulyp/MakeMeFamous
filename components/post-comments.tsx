'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Loader2, Send, Trash2 } from 'lucide-react';
import type { PostComment } from '@/hooks/use-post-interactions';

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

interface PostCommentsProps {
  comments: PostComment[];
  loading: boolean;
  totalCount: number;
  onLoadMore: () => void;
  onAddComment: (content: string) => Promise<PostComment | null>;
  onDeleteComment: (commentId: string) => void;
}

export function PostComments({
  comments,
  loading,
  totalCount,
  onLoadMore,
  onAddComment,
  onDeleteComment,
}: PostCommentsProps) {
  const { address, isConnected } = useAccount();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    const result = await onAddComment(newComment.trim());
    if (result) {
      setNewComment('');
    }
    setSubmitting(false);
  };

  return (
    <div className="border-t border-border mt-3 pt-3">
      {/* Comment List */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-foreground/40" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-foreground/40 text-center py-3">No comments yet</p>
      ) : (
        <div className="space-y-3 mb-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              {/* Avatar */}
              {comment.authorAvatar ? (
                <img
                  src={comment.authorAvatar}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-0.5"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/40 to-secondary/40 flex-shrink-0 mt-0.5" />
              )}
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-medium truncate">
                    {comment.authorUsername || shortenAddress(comment.authorAddress)}
                  </span>
                  <span className="text-foreground/40">·</span>
                  <span className="text-foreground/40">{timeAgo(comment.createdAt)}</span>
                  {address && address.toLowerCase() === comment.authorAddress && (
                    <button
                      onClick={() => onDeleteComment(comment.id)}
                      className="ml-auto text-foreground/30 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-foreground/80 mt-0.5">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {comments.length < totalCount && (
        <button
          onClick={onLoadMore}
          className="text-xs text-primary hover:underline mb-3 block"
        >
          Load more comments ({totalCount - comments.length} remaining)
        </button>
      )}

      {/* Comment Input */}
      {isConnected ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            placeholder="Write a comment..."
            maxLength={500}
            className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm placeholder:text-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!newComment.trim() || submitting}
            className="px-3"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      ) : (
        <p className="text-xs text-foreground/40 text-center">Connect wallet to comment</p>
      )}
    </div>
  );
}
