'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';

export interface PostComment {
  id: string;
  postId: string;
  authorAddress: string;
  authorUsername: string | null;
  authorAvatar: string | null;
  content: string;
  createdAt: string;
}

export function usePostInteractions(
  postId: string,
  initialState: {
    likeCount: number;
    commentCount: number;
    repostCount: number;
    userLiked: boolean;
    userReposted: boolean;
  }
) {
  const { address } = useAccount();
  const [likeCount, setLikeCount] = useState(initialState.likeCount);
  const [commentCount, setCommentCount] = useState(initialState.commentCount);
  const [repostCount, setRepostCount] = useState(initialState.repostCount);
  const [userLiked, setUserLiked] = useState(initialState.userLiked);
  const [userReposted, setUserReposted] = useState(initialState.userReposted);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [totalComments, setTotalComments] = useState(initialState.commentCount);

  const toggleLike = useCallback(async () => {
    if (!address) return;

    const wasLiked = userLiked;
    // Optimistic update
    setUserLiked(!wasLiked);
    setLikeCount(prev => wasLiked ? prev - 1 : prev + 1);

    try {
      const response = await fetch('/api/posts/likes', {
        method: wasLiked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userAddress: address }),
      });

      if (response.ok) {
        const data = await response.json();
        setLikeCount(data.likeCount);
      } else {
        // Revert
        setUserLiked(wasLiked);
        setLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
      }
    } catch {
      setUserLiked(wasLiked);
      setLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
    }
  }, [address, postId, userLiked]);

  const toggleRepost = useCallback(async () => {
    if (!address) return;

    const wasReposted = userReposted;
    // Optimistic update
    setUserReposted(!wasReposted);
    setRepostCount(prev => wasReposted ? prev - 1 : prev + 1);

    try {
      const response = await fetch('/api/posts/reposts', {
        method: wasReposted ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userAddress: address }),
      });

      if (response.ok) {
        const data = await response.json();
        setRepostCount(data.repostCount);
      } else {
        setUserReposted(wasReposted);
        setRepostCount(prev => wasReposted ? prev + 1 : prev - 1);
      }
    } catch {
      setUserReposted(wasReposted);
      setRepostCount(prev => wasReposted ? prev + 1 : prev - 1);
    }
  }, [address, postId, userReposted]);

  const fetchComments = useCallback(
    async (offset = 0) => {
      setCommentsLoading(true);
      try {
        const response = await fetch(
          `/api/posts/comments?post=${postId}&limit=20&offset=${offset}`
        );
        if (response.ok) {
          const data = await response.json();
          if (offset === 0) {
            setComments(data.comments || []);
          } else {
            setComments(prev => [...prev, ...(data.comments || [])]);
          }
          setTotalComments(data.totalCount || 0);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setCommentsLoading(false);
      }
    },
    [postId]
  );

  const addComment = useCallback(
    async (content: string): Promise<PostComment | null> => {
      if (!address || !content.trim()) return null;

      try {
        const response = await fetch('/api/posts/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId,
            authorAddress: address,
            content: content.trim(),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const newComment = data.comment as PostComment;
          setComments(prev => [...prev, newComment]);
          setCommentCount(prev => prev + 1);
          setTotalComments(prev => prev + 1);
          return newComment;
        }
        return null;
      } catch (error) {
        console.error('Error adding comment:', error);
        return null;
      }
    },
    [address, postId]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      if (!address) return;

      const previousComments = comments;
      setComments(prev => prev.filter(c => c.id !== commentId));
      setCommentCount(prev => prev - 1);
      setTotalComments(prev => prev - 1);

      try {
        const response = await fetch('/api/posts/comments', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ commentId, authorAddress: address }),
        });

        if (!response.ok) {
          setComments(previousComments);
          setCommentCount(prev => prev + 1);
          setTotalComments(prev => prev + 1);
        }
      } catch {
        setComments(previousComments);
        setCommentCount(prev => prev + 1);
        setTotalComments(prev => prev + 1);
      }
    },
    [address, comments]
  );

  return {
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
  };
}
