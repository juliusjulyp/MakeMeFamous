"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Video, TrendingUp, Image, Sparkles } from "lucide-react";

export default function FamePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Fame</h1>
          <p className="text-xl text-foreground/70">
            Coming Soon
          </p>
        </div>

        {/* Coming Soon Card */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <p className="text-foreground/70 mb-6">
              We're building a space for creators to share content, gain fame, and connect with their community through guides, analysis, memes, and educational content.
            </p>

            {/* Feature Preview */}
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <span className="text-sm">Guides & Tutorials</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-sm">Token Analysis</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
                <Image className="h-5 w-5 text-purple-500" />
                <span className="text-sm">Memes & Fun</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
                <Video className="h-5 w-5 text-red-500" />
                <span className="text-sm">Video Content</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-foreground/50">
          Stay tuned for updates. In the meantime, explore tokens and join community chats!
        </p>
      </div>
    </div>
  );
}
