"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageCircle, 
  Heart, 
  Share, 
  AlertTriangle,
  Zap,
  Crown,
  Eye
} from "lucide-react";
import { formatCompactNumber, formatPercentage } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: "trade" | "launch" | "milestone" | "warning" | "event" | "content";
  user: {
    name: string;
    avatar: string;
    reputation: number;
  };
  content: string;
  token?: {
    symbol: string;
    logo: string;
    change: number;
  };
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    views?: number;
  };
  timestamp: string;
  isLive?: boolean;
}

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: "1",
    type: "trade",
    user: { name: "@whalewatcher", avatar: "🐋", reputation: 5 },
    content: "Just bought 50K $PEPE2! This community is unreal 🔥",
    token: { symbol: "$PEPE2", logo: "🐸", change: 12.5 },
    metrics: { likes: 42, comments: 8, shares: 3 },
    timestamp: "2m ago",
    isLive: true
  },
  {
    id: "2", 
    type: "warning",
    user: { name: "@rugdetector", avatar: "🕵️", reputation: 4 },
    content: "🚨 RED FLAG: $SCAM dev just moved 20% of liquidity. Community research confirms our suspicions.",
    token: { symbol: "$SCAM", logo: "💰", change: -45.2 },
    metrics: { likes: 156, comments: 34, shares: 89 },
    timestamp: "15m ago"
  },
  {
    id: "3",
    type: "milestone",
    user: { name: "@moondev", avatar: "🚀", reputation: 3 },
    content: "🎉 $MOON just hit 5000 holders! Thank you community for believing in our vision. Next stop: 10K!",
    token: { symbol: "$MOON", logo: "🌙", change: 23.8 },
    metrics: { likes: 234, comments: 67, shares: 45 },
    timestamp: "1h ago"
  },
  {
    id: "4",
    type: "event",
    user: { name: "@cryptoqueen", avatar: "👑", reputation: 5 },
    content: "Live now: Community Token Showcase! Join us for the biggest reveals and discussions 🎊",
    metrics: { likes: 89, comments: 23, shares: 12, views: 1247 },
    timestamp: "2h ago",
    isLive: true
  },
  {
    id: "5",
    type: "content",
    user: { name: "@memegod", avatar: "😂", reputation: 2 },
    content: "Created the ultimate 'How to spot a rug pull' guide. 15 red flags every degen should know! 📚",
    metrics: { likes: 445, comments: 78, shares: 234 },
    timestamp: "4h ago"
  }
];

const getActivityIcon = (type: ActivityItem["type"], isLive?: boolean) => {
  if (isLive) return <Zap className="h-4 w-4 text-red-500 animate-pulse" />;
  
  switch (type) {
    case "trade": return <TrendingUp className="h-4 w-4 text-green-500" />;
    case "launch": return <Crown className="h-4 w-4 text-yellow-500" />;
    case "milestone": return <Users className="h-4 w-4 text-blue-500" />;
    case "warning": return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case "event": return <Eye className="h-4 w-4 text-purple-500" />;
    case "content": return <MessageCircle className="h-4 w-4 text-green-500" />;
  }
};

const getActivityBg = (type: ActivityItem["type"]) => {
  switch (type) {
    case "warning": return "bg-red-500/10 border-red-500/20";
    case "milestone": return "bg-blue-500/10 border-blue-500/20";
    case "event": return "bg-purple-500/10 border-purple-500/20";
    default: return "";
  }
};

export function ActivityFeed() {
  return (
    <div className="w-96 border-l border-border bg-surface/30 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Live Activity</h2>
          <Badge variant="primary" className="gap-1">
            <Zap className="h-3 w-3" />
            Live
          </Badge>
        </div>
        <p className="text-sm text-foreground/60 mt-1">
          Real-time community updates
        </p>
      </div>

      {/* Activity Stream */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {MOCK_ACTIVITY.map((item) => (
            <Card 
              key={item.id} 
              className={`transition-all hover:bg-surface/50 ${getActivityBg(item.type)}`}
            >
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.user.avatar}</span>
                    <div className="flex items-center gap-1">
                      {getActivityIcon(item.type, item.isLive)}
                      {item.isLive && (
                        <Badge variant="primary" className="text-xs px-1 py-0">
                          Live
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.user.name}</span>
                      <span className="text-yellow-500 text-xs">
                        {"⭐".repeat(item.user.reputation)}
                      </span>
                    </div>
                    <span className="text-xs text-foreground/50">{item.timestamp}</span>
                  </div>
                </div>

                {/* Content */}
                <p className="text-sm mb-3 leading-relaxed">{item.content}</p>

                {/* Token Info */}
                {item.token && (
                  <div className="flex items-center gap-3 mb-3 p-2 bg-surface/50 rounded-lg">
                    <span className="text-lg">{item.token.logo}</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium">{item.token.symbol}</span>
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      item.token.change >= 0 ? "text-green-500" : "text-red-500"
                    }`}>
                      {item.token.change >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {formatPercentage(item.token.change)}
                    </div>
                  </div>
                )}

                {/* Metrics */}
                <div className="flex items-center justify-between text-xs text-foreground/60">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                      <Heart className="h-3 w-3" />
                      {formatCompactNumber(item.metrics.likes)}
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                      <MessageCircle className="h-3 w-3" />
                      {item.metrics.comments}
                    </button>
                    <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
                      <Share className="h-3 w-3" />
                      {item.metrics.shares}
                    </button>
                    {item.metrics.views && (
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {formatCompactNumber(item.metrics.views)}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="w-full" size="sm">
            Load more activity
          </Button>
        </div>
      </div>
    </div>
  );
}