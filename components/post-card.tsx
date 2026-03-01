'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Heart, MessageCircle, Repeat2, Share2, MoreHorizontal, Trash2, Loader2 } from 'lucide-react';
import { usePostInteractions } from '@/hooks/use-post-interactions';
import { PostComments } from '@/components/post-comments';
import { PostTokenTag } from '@/components/post-token-tag';
import { PostLinkPreview } from '@/components/post-link-preview';
import type { FeedPost } from '@/hooks/use-social-feed';

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

interface PostCardProps {
  post: FeedPost;
  onDelete?: (postId: string) => void;
}

export function PostCard({ post, onDelete }: PostCardProps) {
  const { address } = useAccount();
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    likeCount,
    commentCount,
    repostCount,
    userLiked,
    userReposted,
    toggleLike,
    toggleRepost,
    comments,
    commentsLoading,
    totalComments,
    fetchComments,
    addComment,
    deleteComment,
  } = usePostInteractions(post.id, {
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    repostCount: post.repostCount,
    userLiked: post.userLiked,
    userReposted: post.userReposted,
  });

  const displayPost = post.originalPost || post;
  const isRepost = !!post.repostOf;
  const isAuthor = address && address.toLowerCase() === post.authorAddress;

  const handleToggleComments = () => {
    if (!showComments && comments.length === 0) {
      fetchComments(0);
    }
    setShowComments(!showComments);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/fame?post=${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback — ignored
    }
  };

  const handleDelete = () => {
    setShowMenu(false);
    onDelete?.(post.id);
  };

  return (
    <div className="border border-border rounded-xl p-4 hover:bg-surface/30 transition-colors">
      {/* Repost indicator */}
      {isRepost && (
        <div className="flex items-center gap-1.5 text-xs text-foreground/50 mb-2 pl-8">
          <Repeat2 className="h-3 w-3" />
          <span>{post.authorUsername || shortenAddress(post.authorAddress)} reposted</span>
        </div>
      )}

      {/* Author header */}
      <div className="flex items-start gap-3">
        {displayPost.authorAvatar ? (
          <img
            src={displayPost.authorAvatar}
            alt=""
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-secondary/40 flex-shrink-0 flex items-center justify-center text-xs font-bold">
            {displayPost.authorAddress.slice(2, 4).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">
              {displayPost.authorUsername || shortenAddress(displayPost.authorAddress)}
            </span>
            {displayPost.authorUsername && (
              <span className="text-xs text-foreground/40 font-mono">
                {shortenAddress(displayPost.authorAddress)}
              </span>
            )}
            <span className="text-xs text-foreground/40">·</span>
            <span className="text-xs text-foreground/40">{timeAgo(displayPost.createdAt)}</span>

            {/* Menu */}
            {isAuthor && (
              <div className="ml-auto relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-foreground/30 hover:text-foreground/60 transition-colors p-1"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-lg shadow-lg z-20 py-1 min-w-[120px]">
                      <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-surface/50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <p className="text-sm mt-1 whitespace-pre-wrap break-words">{displayPost.content}</p>

          {/* Token tags */}
          {displayPost.tokenTags && displayPost.tokenTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {displayPost.tokenTags.map((tag) => (
                <PostTokenTag key={tag} address={tag} />
              ))}
            </div>
          )}

          {/* Image grid */}
          {displayPost.images && displayPost.images.length > 0 && (
            <div
              className={`mt-3 rounded-xl overflow-hidden grid gap-0.5 ${
                displayPost.images.length === 1
                  ? 'grid-cols-1'
                  : displayPost.images.length === 2
                  ? 'grid-cols-2'
                  : 'grid-cols-2'
              }`}
            >
              {displayPost.images.map((img, i) => (
                <div
                  key={i}
                  className={`bg-surface overflow-hidden ${
                    displayPost.images.length === 1
                      ? 'aspect-[16/9]'
                      : displayPost.images.length === 3 && i === 0
                      ? 'row-span-2 aspect-square'
                      : 'aspect-square'
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Link preview */}
          {displayPost.linkUrl && (
            <PostLinkPreview
              url={displayPost.linkUrl}
              title={displayPost.linkTitle}
              description={displayPost.linkDescription}
              image={displayPost.linkImage}
            />
          )}

          {/* Interaction bar */}
          <div className="flex items-center gap-6 mt-3 -ml-2">
            {/* Like */}
            <button
              onClick={toggleLike}
              className={`flex items-center gap-1.5 text-xs transition-colors px-2 py-1 rounded-lg hover:bg-pink-500/10 ${
                userLiked ? 'text-pink-500' : 'text-foreground/50 hover:text-pink-500'
              }`}
            >
              <Heart className={`h-4 w-4 ${userLiked ? 'fill-current' : ''}`} />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>

            {/* Comment */}
            <button
              onClick={handleToggleComments}
              className={`flex items-center gap-1.5 text-xs transition-colors px-2 py-1 rounded-lg hover:bg-blue-500/10 ${
                showComments ? 'text-blue-500' : 'text-foreground/50 hover:text-blue-500'
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              {commentCount > 0 && <span>{commentCount}</span>}
            </button>

            {/* Repost */}
            <button
              onClick={toggleRepost}
              className={`flex items-center gap-1.5 text-xs transition-colors px-2 py-1 rounded-lg hover:bg-green-500/10 ${
                userReposted ? 'text-green-500' : 'text-foreground/50 hover:text-green-500'
              }`}
            >
              <Repeat2 className="h-4 w-4" />
              {repostCount > 0 && <span>{repostCount}</span>}
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-surface/50"
            >
              <Share2 className="h-4 w-4" />
              {copied && <span className="text-green-500">Copied!</span>}
            </button>
          </div>

          {/* Comments section */}
          {showComments && (
            <PostComments
              comments={comments}
              loading={commentsLoading}
              totalCount={totalComments}
              onLoadMore={() => fetchComments(comments.length)}
              onAddComment={addComment}
              onDeleteComment={deleteComment}
            />
          )}
        </div>
      </div>
    </div>
  );
}
