"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { MessageSquare, Trophy, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSocialFeed, FeedType } from "@/hooks/use-social-feed";
import { PostComposer } from "@/components/post-composer";
import { PostCard } from "@/components/post-card";

export default function FamePage() {
  const { isConnected } = useAccount();
  const [feedType, setFeedType] = useState<FeedType>("global");

  const {
    posts,
    loading,
    loadingMore,
    hasMore,
    fetchFeed,
    createPost,
    deletePost,
  } = useSocialFeed(feedType);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Fame Feed</h1>
              <p className="text-sm text-foreground/50">
                What&apos;s happening in web3
              </p>
            </div>
          </div>
          <Link href="/leaderboard">
            <Button variant="outline" size="sm" className="gap-2">
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Button>
          </Link>
        </div>

        {/* Feed tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          <button
            onClick={() => setFeedType("global")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              feedType === "global"
                ? "border-primary text-primary"
                : "border-transparent text-foreground/50 hover:text-foreground"
            }`}
          >
            Global
          </button>
          {isConnected && (
            <button
              onClick={() => setFeedType("following")}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                feedType === "following"
                  ? "border-primary text-primary"
                  : "border-transparent text-foreground/50 hover:text-foreground"
              }`}
            >
              Following
            </button>
          )}
        </div>

        {/* Composer */}
        {isConnected && (
          <div className="mb-6">
            <PostComposer
              onPostCreated={() => {}}
              createPost={createPost}
            />
          </div>
        )}

        {/* Feed */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-foreground/20 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No posts yet</h3>
            <p className="text-sm text-foreground/50 mb-4">
              {feedType === "following"
                ? "Follow some people to see their posts here"
                : "Be the first to share something with the community!"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onDelete={deletePost} />
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center py-4">
                <Button
                  variant="outline"
                  onClick={() => fetchFeed(true)}
                  disabled={loadingMore}
                  className="gap-2"
                >
                  {loadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {loadingMore ? "Loading..." : "Load more"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
