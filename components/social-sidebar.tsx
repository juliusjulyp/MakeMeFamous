"use client";

import { useAccount } from "wagmi";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Users,
  Crown,
  Diamond,
  Flame
} from "lucide-react";

interface ChatRoom {
  id: string;
  name: string;
  tokenSymbol: string;
  memberCount: number;
  tier: "whale" | "diamond" | "holder" | "new";
  lastMessage: string;
  timeAgo: string;
  isLive?: boolean;
}


const MOCK_CHAT_ROOMS: ChatRoom[] = [
  {
    id: "pepe2-whale",
    name: "PEPE 2.0 Whale Chat",
    tokenSymbol: "$PEPE2",
    memberCount: 42,
    tier: "whale",
    lastMessage: "Dev just confirmed binance listing talks 👀",
    timeAgo: "2m ago",
    isLive: true
  },
  {
    id: "moon-diamond",
    name: "To The Moon Diamond Hands",
    tokenSymbol: "$MOON",
    memberCount: 156,
    tier: "diamond",
    lastMessage: "Still hodling through this dip 💎🙌",
    timeAgo: "5m ago"
  },
  {
    id: "doge420-general",
    name: "Doge 420 General",
    tokenSymbol: "$DOGE420",
    memberCount: 892,
    tier: "holder",
    lastMessage: "New meme contest starting! 🎨",
    timeAgo: "12m ago"
  }
];


const getTierIcon = (tier: ChatRoom["tier"]) => {
  switch (tier) {
    case "whale": return <Crown className="h-3 w-3 text-yellow-500" />;
    case "diamond": return <Diamond className="h-3 w-3 text-blue-400" />;
    case "holder": return <Users className="h-3 w-3 text-green-500" />;
    case "new": return <Flame className="h-3 w-3 text-orange-500" />;
  }
};

const getTierColor = (tier: ChatRoom["tier"]) => {
  switch (tier) {
    case "whale": return "border-l-yellow-500";
    case "diamond": return "border-l-blue-400";
    case "holder": return "border-l-green-500";
    case "new": return "border-l-orange-500";
  }
};

export function SocialSidebar() {
  const { isConnected } = useAccount();

  return (
    <div className="w-80 border-l border-border bg-surface/30 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          <span className="font-medium">Token Chats</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {/* Live Chats Header */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-foreground/70 mb-3">Live Token Chats</h3>
            {!isConnected && (
              <p className="text-xs text-foreground/50">Connect your wallet to join token-gated chats</p>
            )}
          </div>

            {/* Chat Rooms */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground/70 mb-3">Your Chats</h3>
              {MOCK_CHAT_ROOMS.map((room) => (
                <Card 
                  key={room.id} 
                  className={`cursor-pointer hover:bg-surface transition-colors border-l-4 ${getTierColor(room.tier)}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTierIcon(room.tier)}
                        <span className="text-sm font-medium truncate">{room.tokenSymbol}</span>
                        {room.isLive && (
                          <Badge variant="primary" className="text-xs px-1 py-0">
                            Live
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-foreground/60">{room.memberCount}</span>
                    </div>
                    <p className="text-xs text-foreground/70 mb-1 line-clamp-2">
                      {room.lastMessage}
                    </p>
                    <span className="text-xs text-foreground/50">{room.timeAgo}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
        </div>
      </div>
    </div>
  );
}