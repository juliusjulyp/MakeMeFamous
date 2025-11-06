// app/tokens/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTokenFactory } from '@/hooks/use-token-factory';
import { TrendingUp, Users, DollarSign, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { formatEther } from 'viem';

export default function TokensPage() {
  const { isConnected } = useAccount();
  const { platformStats, trendingTokens, isCreating } = useTokenFactory();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Discover Tokens</h1>
            <p className="text-xl text-foreground/70">
              Find and join vibrant token communities
            </p>
          </div>
          
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="/create">
              <Button size="lg" className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Token
              </Button>
            </Link>
          </div>
        </div>

        {/* Platform Stats */}
        {platformStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-foreground/60">Total Tokens</p>
                  <p className="text-2xl font-bold">{platformStats.totalTokens}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-foreground/60">Total Volume</p>
                  <p className="text-2xl font-bold">
                    {formatEther(platformStats.totalVolume)}Ⓜ
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-foreground/60">Active Tokens</p>
                  <p className="text-2xl font-bold">{platformStats.activeTokens}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-foreground/60">Platform Revenue</p>
                  <p className="text-2xl font-bold">
                    {formatEther(platformStats.totalRevenue)}Ⓜ
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Search Bar */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-foreground/50" />
            <input
              type="text"
              placeholder="Search tokens by name or symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-lg"
            />
          </div>
        </Card>

        {/* Trending Tokens Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Trending Tokens</h2>
          </div>
          
          {trendingTokens.length === 0 ? (
            <Card className="p-12 text-center">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 text-foreground/30" />
              <h3 className="text-xl font-semibold mb-2">No tokens created yet</h3>
              <p className="text-foreground/60 mb-6">
                Be the first to create a social token and start building your community!
              </p>
              <Link href="/create">
                <Button size="lg">
                  Create First Token
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingTokens.map((tokenAddress) => (
                <TokenCard key={tokenAddress} tokenAddress={tokenAddress} />
              ))}
            </div>
          )}
        </div>

        {/* Categories - Placeholder for future */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-6 text-center cursor-pointer hover:bg-surface/80 transition-colors">
            <div className="text-2xl mb-2">🔥</div>
            <h3 className="font-semibold">Hot</h3>
            <p className="text-sm text-foreground/60">Trending now</p>
          </Card>
          
          <Card className="p-6 text-center cursor-pointer hover:bg-surface/80 transition-colors">
            <div className="text-2xl mb-2">🚀</div>
            <h3 className="font-semibold">New</h3>
            <p className="text-sm text-foreground/60">Just launched</p>
          </Card>
          
          <Card className="p-6 text-center cursor-pointer hover:bg-surface/80 transition-colors">
            <div className="text-2xl mb-2">💎</div>
            <h3 className="font-semibold">Gems</h3>
            <p className="text-sm text-foreground/60">Hidden gems</p>
          </Card>
          
          <Card className="p-6 text-center cursor-pointer hover:bg-surface/80 transition-colors">
            <div className="text-2xl mb-2">👥</div>
            <h3 className="font-semibold">Community</h3>
            <p className="text-sm text-foreground/60">Most active</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Token Card Component (placeholder for now)
function TokenCard({ tokenAddress }: { tokenAddress: string }) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
          <span className="text-white font-bold">T</span>
        </div>
        <div>
          <h3 className="font-bold">Token Name</h3>
          <p className="text-sm text-foreground/60">$SYMBOL</p>
        </div>
        <Badge variant="outline" className="ml-auto">
          New
        </Badge>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-sm text-foreground/60">Price:</span>
          <span className="font-medium">0.001 MATIC</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-foreground/60">Members:</span>
          <span className="font-medium">0</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-foreground/60">Volume:</span>
          <span className="font-medium">0 MATIC</span>
        </div>
      </div>
      
      <Button className="w-full" variant="outline">
        View Token
      </Button>
    </Card>
  );
}