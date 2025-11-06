// app/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTokenFactory } from "@/hooks/use-token-factory";
import { useAccount } from "wagmi";
import { Flame, Sparkles, Trophy, Users, TrendingUp, DollarSign, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatEther } from "viem";

export default function HomePage() {
  const { platformStats, trendingTokens } = useTokenFactory();
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Live on Polygon Amoy</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
            Where Crypto Gets Social
          </h1>
          
          <p className="text-xl md:text-2xl text-foreground/70 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join the first platform where communities form around tokens, not just invest in them. 
            Create tokens, build communities, and unlock exclusive experiences.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/tokens">
              <Button size="lg" className="text-lg px-8 py-3">
                <Trophy className="h-5 w-5 mr-2" />
                Explore Tokens
              </Button>
            </Link>
            
            {isConnected ? (
              <Link href="/create">
                <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Token
                </Button>
              </Link>
            ) : (
              <Button size="lg" variant="outline" className="text-lg px-8 py-3" disabled>
                Connect Wallet to Create
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      {platformStats && (
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Platform Statistics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6 text-center bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <TrendingUp className="h-8 w-8 mx-auto mb-3 text-primary" />
                <div className="text-3xl font-bold mb-1">{platformStats.totalTokens}</div>
                <div className="text-sm text-foreground/60">Tokens Created</div>
              </Card>
              
              <Card className="p-6 text-center bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
                <DollarSign className="h-8 w-8 mx-auto mb-3 text-green-500" />
                <div className="text-3xl font-bold mb-1">
                  {formatEther(platformStats.totalVolume)}Ⓜ
                </div>
                <div className="text-sm text-foreground/60">Total Volume</div>
              </Card>
              
              <Card className="p-6 text-center bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
                <Users className="h-8 w-8 mx-auto mb-3 text-blue-500" />
                <div className="text-3xl font-bold mb-1">{platformStats.activeTokens}</div>
                <div className="text-sm text-foreground/60">Active Communities</div>
              </Card>
              
              <Card className="p-6 text-center bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 border-yellow-500/20">
                <Flame className="h-8 w-8 mx-auto mb-3 text-yellow-500" />
                <div className="text-3xl font-bold mb-1">
                  {formatEther(platformStats.totalRevenue)}Ⓜ
                </div>
                <div className="text-sm text-foreground/60">Platform Revenue</div>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <Card className="p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-4">1. Create Your Token</h3>
                <p className="text-foreground/70 mb-6">
                  Launch your social token with automatic bonding curve pricing. 
                  Pay just 0.01 MATIC to start building your community.
                </p>
                <div className="inline-flex items-center text-sm text-primary font-medium">
                  0.01 MATIC fee <ArrowRight className="h-4 w-4 ml-2" />
                </div>
              </div>
            </Card>

            {/* Step 2 */}
            <Card className="p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold mb-4">2. Build Community</h3>
                <p className="text-foreground/70 mb-6">
                  Holders automatically get access to exclusive chat rooms. 
                  The more tokens they hold, the deeper the access.
                </p>
                <div className="inline-flex items-center text-sm text-blue-500 font-medium">
                  $10+ for chat access <ArrowRight className="h-4 w-4 ml-2" />
                </div>
              </div>
            </Card>

            {/* Step 3 */}
            <Card className="p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-4">3. Earn Revenue</h3>
                <p className="text-foreground/70 mb-6">
                  Get 1% of all trading fees from your token. 
                  Active communities generate sustainable income.
                </p>
                <div className="inline-flex items-center text-sm text-green-500 font-medium">
                  1% trading fees <ArrowRight className="h-4 w-4 ml-2" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Live Contract Info */}
      <section className="container mx-auto px-4 py-16">
        <Card className="max-w-4xl mx-auto p-8 bg-gradient-to-r from-primary/5 via-background to-secondary/5 border-primary/20">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-500">LIVE ON POLYGON</span>
              </div>
            </div>
            
            <h3 className="text-2xl font-bold mb-4">Smart Contracts Deployed</h3>
            <p className="text-foreground/70 mb-6">
              MakeMeFamous is live on Polygon Amoy testnet with fully functional smart contracts.
            </p>
            
            <div className="bg-background/50 border border-border rounded-lg p-4 mb-6">
              <div className="font-mono text-sm text-foreground/80">
                Ready for contract deployment
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              
              <Link href="/tokens">
                <Button size="sm">
                  Start Trading
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="max-w-4xl mx-auto p-12 text-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-primary/20">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Build Your Community?
          </h2>
          <p className="text-xl text-foreground/70 mb-8 max-w-2xl mx-auto">
            Join the social finance revolution. Create tokens that bring communities together.
          </p>
          
          {isConnected ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create">
                <Button size="lg" className="text-lg px-8 py-3">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your Token
                </Button>
              </Link>
              
              <Link href="/tokens">
                <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                  <Trophy className="h-5 w-5 mr-2" />
                  Explore Existing Tokens
                </Button>
              </Link>
            </div>
          ) : (
            <div>
              <Button size="lg" className="text-lg px-8 py-3 mb-4" disabled>
                Connect Wallet to Get Started
              </Button>
              <p className="text-sm text-foreground/60">
                Connect your wallet to create tokens and join communities
              </p>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}