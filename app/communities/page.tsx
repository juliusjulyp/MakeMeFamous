"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MessageCircle, TrendingUp, Crown, Diamond, Flame } from "lucide-react";
import { formatCompactNumber } from "@/lib/utils";

interface Community {
  id: string;
  tokenSymbol: string;
  name: string;
  logo: string;
  memberCount: number;
  onlineCount: number;
  tier: "whale" | "diamond" | "holder" | "new";
  description: string;
  isJoined: boolean;
  requiredTokens: number;
}

const MOCK_COMMUNITIES: Community[] = [
  {
    id: "pepe2",
    tokenSymbol: "$PEPE2",
    name: "PEPE 2.0 Community",
    logo: "🐸",
    memberCount: 2341,
    onlineCount: 342,
    tier: "whale",
    description: "The OG frog is back and better than ever. Diamond hands only.",
    isJoined: true,
    requiredTokens: 100000
  },
  {
    id: "moon",
    tokenSymbol: "$MOON",
    name: "To The Moon",
    logo: "🚀",
    memberCount: 5420,
    onlineCount: 823,
    tier: "diamond",
    description: "Serious builders launching the next generation of DeFi.",
    isJoined: false,
    requiredTokens: 50000
  },
  {
    id: "doge420",
    tokenSymbol: "$DOGE420",
    name: "Doge 420 Holders",
    logo: "🐕",
    memberCount: 892,
    onlineCount: 156,
    tier: "holder",
    description: "Much wow, very community. Meme coin with real utility.",
    isJoined: true,
    requiredTokens: 1000
  }
];

const getTierIcon = (tier: Community["tier"]) => {
  switch (tier) {
    case "whale": return <Crown className="h-4 w-4 text-yellow-500" />;
    case "diamond": return <Diamond className="h-4 w-4 text-blue-400" />;
    case "holder": return <Users className="h-4 w-4 text-green-500" />;
    case "new": return <Flame className="h-4 w-4 text-orange-500" />;
  }
};

const getTierLabel = (tier: Community["tier"]) => {
  switch (tier) {
    case "whale": return "Whale Chat";
    case "diamond": return "Diamond Hands";
    case "holder": return "General";
    case "new": return "New Members";
  }
};

export default function CommunitiesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Token Communities</h1>
        <p className="text-xl text-foreground/70">
          Join exclusive communities by holding tokens. Connect with like-minded holders and builders.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary">47</div>
            <div className="text-sm text-foreground/60">Active Communities</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-500">12.4K</div>
            <div className="text-sm text-foreground/60">Total Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-500">2.1K</div>
            <div className="text-sm text-foreground/60">Online Now</div>
          </CardContent>
        </Card>
      </div>

      {/* Communities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_COMMUNITIES.map((community) => (
          <Card key={community.id} className="hover:scale-[1.02] transition-transform">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl">
                  {community.logo}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{community.tokenSymbol}</h3>
                  <p className="text-sm text-foreground/60">{community.name}</p>
                </div>
                {getTierIcon(community.tier)}
              </div>

              {/* Description */}
              <p className="text-sm text-foreground/70 mb-4">{community.description}</p>

              {/* Stats */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 text-sm text-foreground/60">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {formatCompactNumber(community.memberCount)}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    {community.onlineCount}
                  </div>
                </div>
                <Badge variant="outline">
                  {getTierLabel(community.tier)}
                </Badge>
              </div>

              {/* Requirements */}
              <div className="mb-4 p-2 bg-surface/50 rounded-lg">
                <div className="text-xs text-foreground/60 mb-1">Required to join:</div>
                <div className="text-sm font-medium">
                  {formatCompactNumber(community.requiredTokens)} {community.tokenSymbol}
                </div>
              </div>

              {/* Action */}
              <Button 
                className="w-full gap-2" 
                variant={community.isJoined ? "outline" : "primary"}
              >
                <MessageCircle className="h-4 w-4" />
                {community.isJoined ? "View Chat" : "Join Community"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 text-center p-8 border-2 border-dashed border-primary/30 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5">
        <h3 className="text-2xl font-bold mb-2">Don't see your token?</h3>
        <p className="text-foreground/60 mb-6">
          Create a community for your token and start building your social infrastructure.
        </p>
        <Button className="gap-2">
          <TrendingUp className="h-4 w-4" />
          Create Token Community
        </Button>
      </div>
    </div>
  );
}