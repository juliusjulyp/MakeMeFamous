"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Video, 
  Image, 
  TrendingUp, 
  Heart, 
  MessageCircle, 
  Share,
  Eye,
  Star,
  Award,
  Filter
} from "lucide-react";
import { formatCompactNumber } from "@/lib/utils";

interface ContentItem {
  id: string;
  type: "guide" | "meme" | "analysis" | "video";
  title: string;
  author: {
    name: string;
    avatar: string;
    reputation: number;
  };
  preview: string;
  thumbnail?: string;
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  tags: string[];
  timestamp: string;
  featured?: boolean;
}

const MOCK_CONTENT: ContentItem[] = [
  {
    id: "1",
    type: "guide",
    title: "The Ultimate Guide to Spotting Rug Pulls",
    author: { name: "@rugdetector", avatar: "🕵️", reputation: 5 },
    preview: "15 red flags every crypto investor should know. From dev wallets to liquidity patterns...",
    metrics: { views: 12500, likes: 445, comments: 78, shares: 234 },
    tags: ["Education", "Safety", "Due Diligence"],
    timestamp: "2d ago",
    featured: true
  },
  {
    id: "2", 
    type: "analysis",
    title: "Why $PEPE2 Could Be the Next 100x",
    author: { name: "@cryptoanalyst", avatar: "📊", reputation: 4 },
    preview: "Deep dive into tokenomics, community growth, and market positioning...",
    metrics: { views: 8900, likes: 234, comments: 89, shares: 67 },
    tags: ["Analysis", "PEPE2", "Bullish"],
    timestamp: "1d ago"
  },
  {
    id: "3",
    type: "meme",
    title: "When You're Still Holding Through the Dip",
    author: { name: "@memequeen", avatar: "😂", reputation: 3 },
    preview: "Diamond hands meme compilation that hits different...",
    thumbnail: "🖼️",
    metrics: { views: 15600, likes: 890, comments: 156, shares: 445 },
    tags: ["Memes", "Diamond Hands", "Humor"],
    timestamp: "3h ago"
  },
  {
    id: "4",
    type: "video", 
    title: "Live: Token Launch Strategy Masterclass",
    author: { name: "@launchguru", avatar: "🎯", reputation: 5 },
    preview: "Step-by-step guide to launching your token project successfully...",
    metrics: { views: 3400, likes: 123, comments: 45, shares: 89 },
    tags: ["Education", "Launch", "Strategy"],
    timestamp: "6h ago"
  },
  {
    id: "5",
    type: "guide",
    title: "Smart Contract Security Checklist",
    author: { name: "@securitydev", avatar: "🔒", reputation: 4 },
    preview: "Essential security practices for token smart contracts...",
    metrics: { views: 5600, likes: 167, comments: 34, shares: 78 },
    tags: ["Security", "Development", "Checklist"],
    timestamp: "1w ago"
  },
  {
    id: "6",
    type: "analysis",
    title: "Market Sentiment Analysis: Bullish Signals",
    author: { name: "@marketwiz", avatar: "📈", reputation: 4 },
    preview: "Technical and social indicators pointing to potential market upturn...",
    metrics: { views: 7200, likes: 289, comments: 67, shares: 134 },
    tags: ["Market Analysis", "Sentiment", "Bullish"],
    timestamp: "2d ago"
  }
];

const getContentIcon = (type: ContentItem["type"]) => {
  switch (type) {
    case "guide": return <BookOpen className="h-4 w-4 text-blue-500" />;
    case "analysis": return <TrendingUp className="h-4 w-4 text-green-500" />;
    case "meme": return <Image className="h-4 w-4 text-purple-500" />;
    case "video": return <Video className="h-4 w-4 text-red-500" />;
  }
};

export default function ContentPage() {
  const [filter, setFilter] = useState<"all" | "guides" | "analysis" | "memes" | "videos">("all");

  const filteredContent = MOCK_CONTENT.filter(item => {
    if (filter === "all") return true;
    if (filter === "guides") return item.type === "guide";
    if (filter === "analysis") return item.type === "analysis";
    if (filter === "memes") return item.type === "meme";
    if (filter === "videos") return item.type === "video";
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">Community Content</h1>
          <p className="text-xl text-foreground/70">
            Learn, laugh, and level up your crypto game with community-created content
          </p>
        </div>
        <Button className="gap-2">
          <BookOpen className="h-4 w-4" />
          Create Content
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2">
        <Filter className="h-4 w-4 text-foreground/60" />
        <Button
          variant={filter === "all" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All Content
        </Button>
        <Button
          variant={filter === "guides" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setFilter("guides")}
          className="gap-2"
        >
          <BookOpen className="h-3 w-3" />
          Guides
        </Button>
        <Button
          variant={filter === "analysis" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setFilter("analysis")}
          className="gap-2"
        >
          <TrendingUp className="h-3 w-3" />
          Analysis
        </Button>
        <Button
          variant={filter === "memes" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setFilter("memes")}
          className="gap-2"
        >
          <Image className="h-3 w-3" />
          Memes
        </Button>
        <Button
          variant={filter === "videos" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setFilter("videos")}
          className="gap-2"
        >
          <Video className="h-3 w-3" />
          Videos
        </Button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContent.map((item) => (
          <Card 
            key={item.id} 
            className={`cursor-pointer transition-all hover:scale-[1.02] ${
              item.featured ? "ring-2 ring-yellow-500/30 bg-yellow-500/5" : ""
            }`}
          >
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getContentIcon(item.type)}
                  {item.featured && (
                    <Badge variant="primary" className="gap-1 text-xs">
                      <Star className="h-2 w-2" />
                      Featured
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-foreground/50">{item.timestamp}</span>
              </div>

              {/* Thumbnail */}
              {item.thumbnail && (
                <div className="mb-3 h-32 bg-surface rounded-lg flex items-center justify-center text-4xl">
                  {item.thumbnail}
                </div>
              )}

              {/* Content */}
              <h3 className="font-semibold mb-2 line-clamp-2">{item.title}</h3>
              <p className="text-sm text-foreground/70 mb-3 line-clamp-2">{item.preview}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-3">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
                <span className="text-lg">{item.author.avatar}</span>
                <div className="flex-1">
                  <span className="text-sm font-medium">{item.author.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500 text-xs">
                      {"⭐".repeat(item.author.reputation)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex items-center justify-between text-xs text-foreground/60">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {formatCompactNumber(item.metrics.views)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {formatCompactNumber(item.metrics.likes)}
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {item.metrics.comments}
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="h-6 px-2">
                  <Share className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Creator Spotlight */}
      <Card className="mt-12 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold">Creator Spotlight</h3>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-3xl">🏆</span>
            <div className="flex-1">
              <h4 className="font-medium">@rugdetector</h4>
              <p className="text-sm text-foreground/60">
                Top contributor this week with 3 featured guides on token safety
              </p>
            </div>
            <Button size="sm" variant="outline">
              Follow
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}