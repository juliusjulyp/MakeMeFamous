"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPercentage, formatCompactNumber } from "@/lib/utils";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertTriangle, 
  Lock, 
  MessageCircle,
  Heart,
  Eye,
  Zap,
  Crown,
  Flame
} from "lucide-react";

interface TokenCardProps {
  token: {
    id: string;
    name: string;
    symbol: string;
    logo: string;
    priceChange24h: number;
    holders: number;
    address?: string;
    creator: {
      name: string;
      reputation: number;
    };
    lastUpdate: string;
    liquidityLocked: boolean;
    scamWarnings?: string[];
    social?: {
      watchers: number;
      chatMembers: number;
      reactions: {
        rocket: number;
        fire: number;
        warning: number;
      };
      isLive?: boolean;
    };
  };
}

export function TokenCardEnhanced({ token }: TokenCardProps) {
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const isPositive = token.priceChange24h >= 0;
  const hasWarnings = token.scamWarnings && token.scamWarnings.length > 0;

  const handleReaction = (reaction: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUserReaction(userReaction === reaction ? null : reaction);
  };

  return (
    <Link href={token.address ? `/token/${token.address}` : '#'} className="block">
      <Card
        className={`transition-all hover:scale-[1.02] group relative overflow-hidden cursor-pointer ${
          hasWarnings ? "border-red-500" : ""
        } ${token.social?.isLive ? "ring-2 ring-primary/30" : ""}`}
      >
      {/* Live Indicator */}
      {token.social?.isLive && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs z-10">
          <Zap className="h-3 w-3 animate-pulse" />
          Live
        </div>
      )}

      <Link href={`/token/${token.id}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            {/* Token Info */}
            <div className="flex items-center gap-3 flex-1">
              {/* Logo */}
              <div className="relative">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl">
                  {token.logo || token.symbol[0]}
                </div>
                {hasWarnings && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold truncate">{token.symbol}</h3>
                  {token.liquidityLocked && (
                    <Lock className="h-3 w-3 text-green-500" />
                  )}
                  {token.creator.reputation >= 4 && (
                    <Crown className="h-3 w-3 text-yellow-500" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground/60">
                  <span>by {token.creator.name}</span>
                  <span className="text-yellow-500">{"⭐".repeat(token.creator.reputation)}</span>
                </div>
                <p className="text-xs text-foreground/50 mt-1">{token.lastUpdate}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="text-right">
              <div
                className={`flex items-center gap-1 font-bold ${
                  isPositive ? "text-chart-up" : "text-chart-down"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {formatPercentage(token.priceChange24h)}
              </div>
              <div className="flex items-center gap-1 text-xs text-foreground/60 mt-1">
                <Users className="h-3 w-3" />
                {formatCompactNumber(token.holders)}
              </div>
            </div>
          </div>

          {/* Social Metrics */}
          {token.social && (
            <div className="flex items-center justify-between mb-3 p-2 bg-surface/50 rounded-lg">
              <div className="flex items-center gap-4 text-xs text-foreground/60">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {formatCompactNumber(token.social.watchers)}
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {formatCompactNumber(token.social.chatMembers)}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs">🚀 {token.social.reactions.rocket}</span>
                <span className="text-xs">🔥 {token.social.reactions.fire}</span>
                {token.social.reactions.warning > 0 && (
                  <span className="text-xs">⚠️ {token.social.reactions.warning}</span>
                )}
              </div>
            </div>
          )}

          {/* Warnings */}
          {hasWarnings && (
            <div className="mb-3 space-y-1">
              {token.scamWarnings?.map((warning, i) => (
                <div key={i} className="text-xs text-red-500 flex items-start gap-1">
                  <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Link>

      {/* Reaction Bar */}
      <div className="border-t border-border p-3 bg-surface/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className={`gap-1 ${userReaction === 'rocket' ? 'bg-blue-500/20 text-blue-400' : ''}`}
              onClick={(e) => handleReaction('rocket', e)}
            >
              🚀 <span className="text-xs">{token.social?.reactions.rocket || 0}</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={`gap-1 ${userReaction === 'fire' ? 'bg-orange-500/20 text-orange-400' : ''}`}
              onClick={(e) => handleReaction('fire', e)}
            >
              🔥 <span className="text-xs">{token.social?.reactions.fire || 0}</span>
            </Button>
            {hasWarnings && (
              <Button
                size="sm"
                variant="ghost"
                className={`gap-1 ${userReaction === 'warning' ? 'bg-red-500/20 text-red-400' : ''}`}
                onClick={(e) => handleReaction('warning', e)}
              >
                ⚠️ <span className="text-xs">{token.social?.reactions.warning || 0}</span>
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MessageCircle className="h-3 w-3" />
              Chat
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <Heart className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
    </Link>
  );
}