"use client";

import { use } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageCircle, 
  Share, 
  Heart,
  Lock,
  Crown,
  AlertTriangle,
  ExternalLink,
  Copy
} from "lucide-react";
import { formatPercentage, formatCompactNumber } from "@/lib/utils";

interface TokenPageProps {
  params: Promise<{ id: string }>;
}

// Mock token data - in real app this would come from API
const getTokenData = (id: string) => {
  const tokens: Record<string, any> = {
    "pepe2": {
      id: "pepe2",
      name: "PEPE 2.0",
      symbol: "$PEPE2",
      logo: "🐸",
      price: "$0.000042",
      priceChange24h: 420.69,
      holders: 2341,
      marketCap: "$12.5M",
      volume24h: "$2.1M",
      creator: {
        name: "@froggod",
        reputation: 5,
      },
      description: "The OG frog is back and better than ever. PEPE 2.0 brings new utilities, stronger community, and diamond hands energy.",
      contractAddress: "0x1234...5678",
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
      },
      launchDate: "2024-01-15",
      website: "https://pepe2.com",
      twitter: "https://twitter.com/pepe2official"
    },
    "moon": {
      id: "moonshot",
      name: "To The Moon",
      symbol: "$MOON",
      logo: "🚀",
      price: "$0.0015",
      priceChange24h: 156.3,
      holders: 5420,
      marketCap: "$45.2M",
      volume24h: "$8.7M",
      creator: {
        name: "@cryptokid",
        reputation: 3,
      },
      description: "Serious builders launching the next generation of DeFi. Community-driven governance and innovative tokenomics.",
      contractAddress: "0xabcd...efgh",
      liquidityLocked: true,
      social: {
        watchers: 823,
        chatMembers: 245,
        reactions: {
          rocket: 156,
          fire: 89,
          warning: 0
        }
      },
      launchDate: "2024-02-01",
      website: "https://moontoken.io",
      twitter: "https://twitter.com/moontoken"
    }
  };
  
  return tokens[id] || null;
};

export default function TokenPage({ params }: TokenPageProps) {
  const { id } = use(params);
  const token = getTokenData(id);

  if (!token) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Token Not Found</h1>
            <p className="text-foreground/60">The token you're looking for doesn't exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPositive = token.priceChange24h >= 0;
  const hasWarnings = token.scamWarnings && token.scamWarnings.length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start gap-6 mb-8">
        {/* Token Logo */}
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl">
            {token.logo}
          </div>
          {token.social?.isLive && (
            <div className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center">
              <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
            </div>
          )}
        </div>

        {/* Token Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{token.symbol}</h1>
            <h2 className="text-xl text-foreground/70">{token.name}</h2>
            {token.liquidityLocked && (
              <Lock className="h-5 w-5 text-green-500" title="Liquidity Locked" />
            )}
            {token.creator.reputation >= 4 && (
              <Crown className="h-5 w-5 text-yellow-500" title="Top Creator" />
            )}
          </div>
          
          <p className="text-foreground/70 mb-4">{token.description}</p>
          
          {/* Creator */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground/60">Created by</span>
            <span className="font-medium">{token.creator.name}</span>
            <span className="text-yellow-500 text-sm">
              {"⭐".repeat(token.creator.reputation)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Join Chat
          </Button>
          <Button variant="outline" className="gap-2">
            <Heart className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="gap-2">
            <Share className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-foreground/60 mb-1">Price</div>
            <div className="text-xl font-bold">{token.price}</div>
            <div className={`flex items-center gap-1 text-sm ${
              isPositive ? "text-green-500" : "text-red-500"
            }`}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {formatPercentage(token.priceChange24h)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-foreground/60 mb-1">Market Cap</div>
            <div className="text-xl font-bold">{token.marketCap}</div>
            <div className="text-sm text-foreground/50">Rank #234</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-foreground/60 mb-1">24h Volume</div>
            <div className="text-xl font-bold">{token.volume24h}</div>
            <div className="text-sm text-foreground/50">+12.3%</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-foreground/60 mb-1">Holders</div>
            <div className="text-xl font-bold">{formatCompactNumber(token.holders)}</div>
            <div className="text-sm text-green-500">+5.2%</div>
          </CardContent>
        </Card>
      </div>

      {/* Social Metrics */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Community Activity</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{formatCompactNumber(token.social.watchers)}</div>
              <div className="text-sm text-foreground/60">Watchers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{formatCompactNumber(token.social.chatMembers)}</div>
              <div className="text-sm text-foreground/60">Chat Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">{token.social.reactions.rocket + token.social.reactions.fire}</div>
              <div className="text-sm text-foreground/60">Total Reactions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">98%</div>
              <div className="text-sm text-foreground/60">Sentiment</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Info */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Contract Information</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-foreground/60">Contract Address</span>
              <div className="flex items-center gap-2">
                <code className="bg-surface px-2 py-1 rounded text-sm">{token.contractAddress}</code>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground/60">Launch Date</span>
              <span>{new Date(token.launchDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground/60">Liquidity Status</span>
              <Badge variant={token.liquidityLocked ? "success" : "danger"}>
                {token.liquidityLocked ? "Locked" : "Unlocked"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Official Links</h3>
          <div className="flex gap-4">
            <Button variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Website
            </Button>
            <Button variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Twitter
            </Button>
            <Button variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Telegram
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}