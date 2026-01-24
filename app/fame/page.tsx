"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Users, TrendingUp, Coins, Medal, Crown, Award, Sparkles, BarChart3 } from "lucide-react";
import Link from "next/link";

type TabType = 'referrals' | 'tokens' | 'creators';

interface ReferralEntry {
  rank: number;
  address: string;
  username: string | null;
  avatar: string | null;
  totalReferrals: number;
  totalVolume: string;
  totalEarnings: string;
}

interface TokenEntry {
  rank: number;
  tokenAddress: string;
  name: string;
  symbol: string;
  imageUrl: string;
  totalVolume: string;
  volume24h: string;
  tradeCount: number;
  holderCount: number;
}

interface CreatorEntry {
  rank: number;
  address: string;
  username: string | null;
  avatar: string | null;
  tokenCount: number;
  totalVolume: string;
  totalEarnings: string;
}

export default function FamePage() {
  const [activeTab, setActiveTab] = useState<TabType>('tokens');
  const [referrals, setReferrals] = useState<ReferralEntry[]>([]);
  const [tokens, setTokens] = useState<TokenEntry[]>([]);
  const [creators, setCreators] = useState<CreatorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('volume');

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab, sortBy]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      if (activeTab === 'referrals') {
        const res = await fetch(`/api/referrals/leaderboard?sort=${sortBy}&limit=50`);
        const data = await res.json();
        setReferrals(data.leaderboard || []);
      } else if (activeTab === 'tokens') {
        const res = await fetch(`/api/leaderboard?type=tokens&sort=${sortBy}&limit=50`);
        const data = await res.json();
        setTokens(data.leaderboard || []);
      } else if (activeTab === 'creators') {
        const res = await fetch(`/api/leaderboard?type=creators&sort=${sortBy}&limit=50`);
        const data = await res.json();
        setCreators(data.leaderboard || []);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold text-foreground/50">#{rank}</span>;
  };

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  const formatMatic = (value: string) => {
    const num = parseFloat(value);
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const getSortOptions = () => {
    switch (activeTab) {
      case 'referrals':
        return [
          { value: 'earnings', label: 'Earnings', icon: Coins },
          { value: 'referrals', label: 'Referrals', icon: Users },
          { value: 'volume', label: 'Volume', icon: TrendingUp }
        ];
      case 'tokens':
        return [
          { value: 'volume', label: 'Volume', icon: TrendingUp },
          { value: 'volume24h', label: '24h Volume', icon: BarChart3 },
          { value: 'holders', label: 'Holders', icon: Users },
          { value: 'trending', label: 'Trending', icon: Sparkles }
        ];
      case 'creators':
        return [
          { value: 'volume', label: 'Volume', icon: TrendingUp },
          { value: 'tokens', label: 'Tokens', icon: Coins },
          { value: 'earnings', label: 'Earnings', icon: Coins }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/10 rounded-full mb-6">
            <Trophy className="h-8 w-8 text-yellow-500" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Hall of Fame</h1>
          <p className="text-xl text-foreground/70">
            Top performers on MakeMeFamous
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center gap-2 mb-6">
          <Button
            variant={activeTab === 'tokens' ? 'primary' : 'outline'}
            onClick={() => { setActiveTab('tokens'); setSortBy('volume'); }}
          >
            <Coins className="h-4 w-4 mr-2" />
            Tokens
          </Button>
          <Button
            variant={activeTab === 'creators' ? 'primary' : 'outline'}
            onClick={() => { setActiveTab('creators'); setSortBy('volume'); }}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Creators
          </Button>
          <Button
            variant={activeTab === 'referrals' ? 'primary' : 'outline'}
            onClick={() => { setActiveTab('referrals'); setSortBy('earnings'); }}
          >
            <Users className="h-4 w-4 mr-2" />
            Referrers
          </Button>
        </div>

        {/* Sort Options */}
        <div className="flex gap-2 mb-6 justify-center flex-wrap">
          {getSortOptions().map(option => (
            <Button
              key={option.value}
              variant={sortBy === option.value ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSortBy(option.value)}
            >
              <option.icon className="h-4 w-4 mr-1" />
              {option.label}
            </Button>
          ))}
        </div>

        {/* Leaderboard */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-foreground/50">Loading leaderboard...</p>
              </div>
            ) : (
              <>
                {/* Tokens Leaderboard */}
                {activeTab === 'tokens' && (
                  tokens.length === 0 ? (
                    <EmptyState message="No tokens yet" link="/create" linkText="Create First Token" />
                  ) : (
                    <div className="divide-y divide-border">
                      {/* Desktop Header */}
                      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-surface/50 text-sm font-medium text-foreground/50">
                        <div className="col-span-1">Rank</div>
                        <div className="col-span-5">Token</div>
                        <div className="col-span-2 text-right">Volume</div>
                        <div className="col-span-2 text-right">24h</div>
                        <div className="col-span-2 text-right">Holders</div>
                      </div>
                      {tokens.map((token) => (
                        <Link key={token.tokenAddress} href={`/token/${token.tokenAddress}`}>
                          {/* Desktop Row */}
                          <div className={`hidden md:grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-surface/30 transition-colors cursor-pointer ${token.rank <= 3 ? 'bg-yellow-500/5' : ''}`}>
                            <div className="col-span-1 flex justify-center">
                              {getRankIcon(token.rank)}
                            </div>
                            <div className="col-span-5 flex items-center gap-3">
                              <img src={token.imageUrl} alt={token.name} className="w-10 h-10 rounded-full object-cover" />
                              <div>
                                <div className="font-medium">{token.name}</div>
                                <div className="text-sm text-foreground/50">${token.symbol}</div>
                              </div>
                            </div>
                            <div className="col-span-2 text-right font-semibold">
                              {formatMatic(token.totalVolume)} MATIC
                            </div>
                            <div className="col-span-2 text-right text-foreground/70">
                              {formatMatic(token.volume24h)} MATIC
                            </div>
                            <div className="col-span-2 text-right">
                              {token.holderCount}
                            </div>
                          </div>
                          {/* Mobile Row */}
                          <div className={`md:hidden flex items-center gap-3 p-4 hover:bg-surface/30 transition-colors cursor-pointer ${token.rank <= 3 ? 'bg-yellow-500/5' : ''}`}>
                            <div className="flex-shrink-0 w-8 flex justify-center">
                              {getRankIcon(token.rank)}
                            </div>
                            <img src={token.imageUrl} alt={token.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{token.name}</div>
                              <div className="text-sm text-foreground/50">${token.symbol}</div>
                              <div className="flex gap-4 mt-1 text-xs">
                                <span className="text-foreground/70">{formatMatic(token.totalVolume)} Vol</span>
                                <span>{token.holderCount} holders</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )
                )}

                {/* Creators Leaderboard */}
                {activeTab === 'creators' && (
                  creators.length === 0 ? (
                    <EmptyState message="No creators yet" link="/create" linkText="Be the First" />
                  ) : (
                    <div className="divide-y divide-border">
                      {/* Desktop Header */}
                      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-surface/50 text-sm font-medium text-foreground/50">
                        <div className="col-span-1">Rank</div>
                        <div className="col-span-5">Creator</div>
                        <div className="col-span-2 text-right">Tokens</div>
                        <div className="col-span-2 text-right">Volume</div>
                        <div className="col-span-2 text-right">Earnings</div>
                      </div>
                      {creators.map((creator) => (
                        <div key={creator.address}>
                          {/* Desktop Row */}
                          <div className={`hidden md:grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-surface/30 transition-colors ${creator.rank <= 3 ? 'bg-yellow-500/5' : ''}`}>
                            <div className="col-span-1 flex justify-center">
                              {getRankIcon(creator.rank)}
                            </div>
                            <div className="col-span-5 flex items-center gap-3">
                              {creator.avatar ? (
                                <img src={creator.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                                  {creator.address.slice(2, 4).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{creator.username || formatAddress(creator.address)}</div>
                                {creator.username && (
                                  <div className="text-sm text-foreground/50 font-mono">{formatAddress(creator.address)}</div>
                                )}
                              </div>
                            </div>
                            <div className="col-span-2 text-right font-semibold">
                              {creator.tokenCount}
                            </div>
                            <div className="col-span-2 text-right text-foreground/70">
                              {formatMatic(creator.totalVolume)} MATIC
                            </div>
                            <div className="col-span-2 text-right font-semibold text-green-500">
                              {formatMatic(creator.totalEarnings)} MATIC
                            </div>
                          </div>
                          {/* Mobile Row */}
                          <div className={`md:hidden flex items-center gap-3 p-4 hover:bg-surface/30 transition-colors ${creator.rank <= 3 ? 'bg-yellow-500/5' : ''}`}>
                            <div className="flex-shrink-0 w-8 flex justify-center">
                              {getRankIcon(creator.rank)}
                            </div>
                            {creator.avatar ? (
                              <img src={creator.avatar} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                {creator.address.slice(2, 4).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{creator.username || formatAddress(creator.address)}</div>
                              <div className="flex gap-3 mt-1 text-xs">
                                <span>{creator.tokenCount} tokens</span>
                                <span className="text-green-500">{formatMatic(creator.totalEarnings)} earned</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* Referrals Leaderboard */}
                {activeTab === 'referrals' && (
                  referrals.length === 0 ? (
                    <EmptyState message="No referrers yet" link="/profile" linkText="Get Your Referral Link" />
                  ) : (
                    <div className="divide-y divide-border">
                      {/* Desktop Header */}
                      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-surface/50 text-sm font-medium text-foreground/50">
                        <div className="col-span-1">Rank</div>
                        <div className="col-span-5">Referrer</div>
                        <div className="col-span-2 text-right">Referrals</div>
                        <div className="col-span-2 text-right">Volume</div>
                        <div className="col-span-2 text-right">Earnings</div>
                      </div>
                      {referrals.map((referrer) => (
                        <div key={referrer.address}>
                          {/* Desktop Row */}
                          <div className={`hidden md:grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-surface/30 transition-colors ${referrer.rank <= 3 ? 'bg-yellow-500/5' : ''}`}>
                            <div className="col-span-1 flex justify-center">
                              {getRankIcon(referrer.rank)}
                            </div>
                            <div className="col-span-5 flex items-center gap-3">
                              {referrer.avatar ? (
                                <img src={referrer.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                                  {referrer.address.slice(2, 4).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{referrer.username || formatAddress(referrer.address)}</div>
                                {referrer.username && (
                                  <div className="text-sm text-foreground/50 font-mono">{formatAddress(referrer.address)}</div>
                                )}
                              </div>
                            </div>
                            <div className="col-span-2 text-right font-semibold">
                              {referrer.totalReferrals}
                            </div>
                            <div className="col-span-2 text-right text-foreground/70">
                              {formatMatic(referrer.totalVolume)} MATIC
                            </div>
                            <div className="col-span-2 text-right font-semibold text-green-500">
                              {formatMatic(referrer.totalEarnings)} MATIC
                            </div>
                          </div>
                          {/* Mobile Row */}
                          <div className={`md:hidden flex items-center gap-3 p-4 hover:bg-surface/30 transition-colors ${referrer.rank <= 3 ? 'bg-yellow-500/5' : ''}`}>
                            <div className="flex-shrink-0 w-8 flex justify-center">
                              {getRankIcon(referrer.rank)}
                            </div>
                            {referrer.avatar ? (
                              <img src={referrer.avatar} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                {referrer.address.slice(2, 4).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{referrer.username || formatAddress(referrer.address)}</div>
                              <div className="flex gap-3 mt-1 text-xs">
                                <span>{referrer.totalReferrals} referrals</span>
                                <span className="text-green-500">{formatMatic(referrer.totalEarnings)} earned</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Join the Leaderboard</h3>
              <p className="text-foreground/70 mb-4">
                Create tokens, refer friends, and climb the ranks to fame!
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/create">
                  <Button>Create Token</Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline">Get Referral Link</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message, link, linkText }: { message: string; link: string; linkText: string }) {
  return (
    <div className="p-8 text-center">
      <Trophy className="h-12 w-12 text-foreground/20 mx-auto mb-4" />
      <h3 className="font-semibold mb-2">{message}</h3>
      <p className="text-sm text-foreground/50 mb-4">Be the first to climb the leaderboard!</p>
      <Link href={link}>
        <Button>{linkText}</Button>
      </Link>
    </div>
  );
}
