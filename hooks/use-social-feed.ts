'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useFollows } from '@/hooks/use-follows';

export type FeedType = 'global' | 'following' | 'user' | 'token';

export interface FeedPost {
  id: string;
  authorAddress: string;
  authorUsername: string | null;
  authorAvatar: string | null;
  content: string;
  images: string[];
  tokenTags: string[];
  linkUrl: string | null;
  linkTitle: string | null;
  linkDescription: string | null;
  linkImage: string | null;
  repostOf: string | null;
  likeCount: number;
  commentCount: number;
  repostCount: number;
  userLiked: boolean;
  userReposted: boolean;
  createdAt: string;
  originalPost: FeedPost | null;
}

export interface CreatePostData {
  content: string;
  images?: string[];
  tokenTags?: string[];
  linkUrl?: string;
  linkTitle?: string;
  linkDescription?: string;
  linkImage?: string;
}

export function useSocialFeed(feedType: FeedType = 'global', targetAddress?: string) {
  const { address } = useAccount();
  const { following } = useFollows();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchFeed = useCallback(
    async (loadMore = false) => {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams();
        params.set('feed', feedType);
        params.set('limit', '20');

        if (address) {
          params.set('user', address);
        }

        if (targetAddress) {
          params.set('target', targetAddress);
        }

        if (feedType === 'following' && following.length > 0) {
          params.set('following', following.join(','));
        }

        if (loadMore && cursor) {
          params.set('before', cursor);
        }

        const response = await fetch(`/api/posts?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          const newPosts = data.posts || [];

          if (loadMore) {
            setPosts(prev => [...prev, ...newPosts]);
          } else {
            setPosts(newPosts);
          }

          setCursor(data.nextCursor || null);
          setHasMore(newPosts.length >= 20);
        }
      } catch (error) {
        console.error('Error fetching feed:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [feedType, address, targetAddress, following, cursor]
  );

  const createPost = useCallback(
    async (data: CreatePostData): Promise<FeedPost | null> => {
      if (!address) return null;

      try {
        const response = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            authorAddress: address,
            ...data,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const newPost = result.post as FeedPost;
          setPosts(prev => [newPost, ...prev]);
          return newPost;
        }
        return null;
      } catch (error) {
        console.error('Error creating post:', error);
        return null;
      }
    },
    [address]
  );

  const deletePost = useCallback(
    async (postId: string) => {
      if (!address) return;

      // Optimistic removal
      const previousPosts = posts;
      setPosts(prev => prev.filter(p => p.id !== postId));

      try {
        const response = await fetch('/api/posts', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId, authorAddress: address }),
        });

        if (!response.ok) {
          setPosts(previousPosts);
        }
      } catch {
        setPosts(previousPosts);
      }
    },
    [address, posts]
  );

  // Fetch on mount and when feed type or target changes
  useEffect(() => {
    setCursor(null);
    setHasMore(true);
    fetchFeed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedType, targetAddress, following.length]);

  return {
    posts,
    loading,
    loadingMore,
    hasMore,
    fetchFeed,
    createPost,
    deletePost,
    setPosts,
  };
}
