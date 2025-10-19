"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TokenCardEnhanced } from "@/components/token-card-enhanced";
import { SocialSidebar } from "@/components/social-sidebar";
import { ActivityFeed } from "@/components/activity-feed";
import { Flame, Sparkles, Trophy, Users } from "lucide-react";

// Mock data - will be replaced with real API calls
const MOCK_TOKENS = [
  {
    id: "pepe2",
    name: "PEPE 2.0",
    symbol: "$PEPE2",
    logo: "🐸",
    priceChange24h: 420.69,
    holders: 2341,
    creator: {
      name: "@froggod",
      reputation: 5,
    },
    lastUpdate: "we're so back - 2h ago",
    liquidityLocked: true,
    social: {
      watchers: 1247,
      chatMembers: 342,
      reactions: {
        rocket: 89,
        fire: 156,
        warning: 3
      },
      isLive: true
    }
  },
  {
    id: "scamcoin",
    name: "Definitely Not A Scam",
    symbol: "$SCAM",
    logo: "💰",
    priceChange24h: -89.5,
    holders: 12,
    creator: {
      name: "@anon420",
      reputation: 0,
    },
    lastUpdate: "trust me bro - 5h ago",
    liquidityLocked: false,
    scamWarnings: [
      "Oof. Dev holds 85% of supply. That's not a red flag, that's the whole parade.",
      "Liquidity isn't locked. This dev believes in trust falls.",
    ],
    social: {
      watchers: 45,
      chatMembers: 8,
      reactions: {
        rocket: 2,
        fire: 1,
        warning: 23
      }
    }
  },
  {
    id: "moonshot",
    name: "To The Moon",
    symbol: "$MOON",
    logo: "🚀",
    priceChange24h: 156.3,
    holders: 5420,
    creator: {
      name: "@cryptokid",
      reputation: 3,
    },
    lastUpdate: "LFG! New partnership incoming - 1h ago",
    liquidityLocked: true,
    social: {
      watchers: 823,
      chatMembers: 245,
      reactions: {
        rocket: 156,
        fire: 89,
        warning: 0
      }
    }
  },
  {
    id: "doge420",
    name: "Doge 420",
    symbol: "$DOGE420",
    logo: "🐕",
    priceChange24h: -12.4,
    holders: 892,
    creator: {
      name: "@memequeen",
      reputation: 4,
    },
    lastUpdate: "Just a small correction, HODL - 3h ago",
    liquidityLocked: true,
    social: {
      watchers: 456,
      chatMembers: 123,
      reactions: {
        rocket: 34,
        fire: 67,
        warning: 5
      }
    }
  },
];

type FilterType = "trending" | "new" | "top-devs";

export default function HomePage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("trending");

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12 space-y-6">
        <div className="space-y-2">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Where Crypto Gets Social
          </h1>
          <p className="text-lg text-primary/80 font-medium">
            Join the community. Hold the token. Unlock the experience.
          </p>
        </div>
        
        <p className="text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed">
          The first platform where <strong>holding tokens = joining exclusive communities</strong>. 
          Auto-entry chats, live events, collaborative research, and creator accountability.
          <br />
          <span className="text-base text-foreground/50 mt-2 block">
            Revolutionary social infrastructure built for the crypto community.
          </span>
        </p>

        <div className="flex gap-4 justify-center pt-6">
          <Button size="lg" className="gap-2 text-base px-8 py-4">
            <Users className="h-5 w-5" />
            Join Communities
          </Button>
          <Button size="lg" variant="outline" className="gap-2 text-base px-8 py-4">
            <Sparkles className="h-5 w-5" />
            Create Token
          </Button>
        </div>

        {/* Social Proof */}
        <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-8 pt-8 text-sm text-foreground/60">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>1,247 active in chats</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Live community events</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-purple-500 rounded-full animate-pulse"></div>
            <span>23 scams detected today</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
        <Button
          variant={activeFilter === "trending" ? "primary" : "ghost"}
          onClick={() => setActiveFilter("trending")}
          className="gap-2"
        >
          <Flame className="h-4 w-4" />
          Trending
        </Button>
        <Button
          variant={activeFilter === "new" ? "primary" : "ghost"}
          onClick={() => setActiveFilter("new")}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          New
        </Button>
        <Button
          variant={activeFilter === "top-devs" ? "primary" : "ghost"}
          onClick={() => setActiveFilter("top-devs")}
          className="gap-2"
        >
          <Trophy className="h-4 w-4" />
          Top Devs
        </Button>
      </div>

        {/* Token Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MOCK_TOKENS.map((token) => (
            <TokenCardEnhanced key={token.id} token={token} />
          ))}
        </div>

      {/* CTA Section */}
      <div className="mt-12 text-center p-8 border-2 border-dashed border-primary/30 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5">
        <h3 className="text-2xl font-bold mb-2">Ready to Build Your Community?</h3>
        <p className="text-foreground/60 mb-6">
          Create tokens that come with instant social infrastructure.
          <br />
          <span className="text-sm">Auto-entry chats, live events, and community governance included.</span>
        </p>
        <div className="flex gap-4 justify-center">
          <Button className="gap-2">
            <Sparkles className="h-4 w-4" />
            Launch Token + Community
          </Button>
          <Button variant="outline" className="gap-2">
            <Users className="h-4 w-4" />
            Join Existing Communities
          </Button>
        </div>
        </div>
      </div>

      {/* Social Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <SocialSidebar />
      </div>

      {/* Activity Feed - Hidden on mobile */}
      <div className="hidden xl:block">
        <ActivityFeed />
      </div>
    </div>
  );
}
