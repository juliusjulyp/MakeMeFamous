"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Users, 
  Calendar, 
  TrendingUp, 
  Video, 
  Mic,
  Lock,
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

interface LiveEvent {
  id: string;
  title: string;
  type: "ama" | "launch" | "debate" | "party";
  viewers: number;
  startTime: string;
  isLive: boolean;
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

const MOCK_LIVE_EVENTS: LiveEvent[] = [
  {
    id: "community-showcase",
    title: "Community Token Showcase",
    type: "party",
    viewers: 1247,
    startTime: "Live now",
    isLive: true
  },
  {
    id: "pepe-ama",
    title: "PEPE 2.0 Dev AMA",
    type: "ama",
    viewers: 423,
    startTime: "In 30m",
    isLive: false
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
  const [activeTab, setActiveTab] = useState<"chats" | "events">("chats");

  return (
    <div className="w-80 border-l border-border bg-surface/30 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex gap-2">
          <Button
            variant={activeTab === "chats" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("chats")}
            className="flex-1 gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Chats
          </Button>
          <Button
            variant={activeTab === "events" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("events")}
            className="flex-1 gap-2"
          >
            <Calendar className="h-4 w-4" />
            Events
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "chats" ? (
          <div className="p-4 space-y-3">
            {/* Connect Wallet CTA */}
            <Card className="border-dashed border-primary/50 bg-primary/5">
              <CardContent className="p-4 text-center">
                <Lock className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium mb-2">Connect Wallet</p>
                <p className="text-xs text-foreground/60 mb-3">
                  Join token-gated chats automatically
                </p>
                <Button size="sm" className="gap-2">
                  <MessageCircle className="h-3 w-3" />
                  Connect
                </Button>
              </CardContent>
            </Card>

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
        ) : (
          <div className="p-4 space-y-3">
            {/* Live Events */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground/70 mb-3">Live & Upcoming</h3>
              {MOCK_LIVE_EVENTS.map((event) => (
                <Card key={event.id} className="cursor-pointer hover:bg-surface transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {event.type === "ama" && <Mic className="h-3 w-3 text-blue-400" />}
                        {event.type === "party" && <Video className="h-3 w-3 text-purple-400" />}
                        {event.isLive && (
                          <Badge variant="primary" className="text-xs px-1 py-0">
                            Live
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-foreground/60">
                        <Users className="h-3 w-3" />
                        {event.viewers}
                      </div>
                    </div>
                    <h4 className="text-sm font-medium mb-1">{event.title}</h4>
                    <span className="text-xs text-foreground/50">{event.startTime}</span>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Create Event CTA */}
            <Card className="border-dashed border-secondary/50 bg-secondary/5">
              <CardContent className="p-4 text-center">
                <Video className="h-6 w-6 mx-auto mb-2 text-secondary" />
                <p className="text-sm font-medium mb-2">Host an Event</p>
                <p className="text-xs text-foreground/60 mb-3">
                  Launch party, AMA, or community call
                </p>
                <Button size="sm" variant="outline" className="gap-2">
                  <Calendar className="h-3 w-3" />
                  Schedule
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}