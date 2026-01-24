'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Coins,
  TrendingUp,
  Users,
  BarChart3,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface TokenStats {
  token_address: string;
  name: string;
  symbol: string;
  image_url: string;
  totalVolume: string;
  creatorEarnings: string;
  tradeCount: number;
  holderCount: number;
  recentTrades: Trade[];
}

interface Trade {
  id: string;
  trader_address: string;
  type: 'buy' | 'sell';
  token_amount: string;
  volume: string;
  created_at: string;
  tx_hash?: string;
}

interface Holder {
  rank: number;
  address: string;
  username: string | null;
  avatar: string | null;
  balance: string;
  percentage: string;
}

interface DashboardSummary {
  tokenCount: number;
  totalVolume: string;
  totalEarnings: string;
  totalTrades: number;
  pendingEarnings: string;
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [tokens, setTokens] = useState<TokenStats[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedToken, setExpandedToken] = useState<string | null>(null);
  const [holders, setHolders] = useState<Record<string, Holder[]>>({});
  const [loadingHolders, setLoadingHolders] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      fetchDashboard();
    }
  }, [address]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`/api/dashboard?address=${address}`);
      const data = await res.json();
      setTokens(data.tokens || []);
      setSummary(data.summary || null);
      setRecentTrades(data.recentTrades || []);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHolders = async (tokenAddress: string) => {
    if (holders[tokenAddress]) return;

    setLoadingHolders(tokenAddress);
    try {
      const res = await fetch(`/api/dashboard/holders?token=${tokenAddress}`);
      const data = await res.json();
      setHolders(prev => ({ ...prev, [tokenAddress]: data.holders || [] }));
    } catch (error) {
      console.error('Failed to fetch holders:', error);
    } finally {
      setLoadingHolders(null);
    }
  };

  const toggleToken = (tokenAddress: string) => {
    if (expandedToken === tokenAddress) {
      setExpandedToken(null);
    } else {
      setExpandedToken(tokenAddress);
      fetchHolders(tokenAddress);
    }
  };

  const formatMatic = (value: string) => {
    const num = parseFloat(value);
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(4);
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <Wallet className="h-16 w-16 text-foreground/20 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-foreground/60 mb-6">
            Connect your wallet to view your creator dashboard and track your token performance.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-surface rounded w-1/3"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-surface rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-surface rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Creator Dashboard</h1>
            <p className="text-sm sm:text-base text-foreground/60">Track your token performance and earnings</p>
          </div>
          <Link href="/create">
            <Button className="w-full sm:w-auto">Create New Token</Button>
          </Link>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-foreground/60 text-sm mb-1">
                  <BarChart3 className="h-4 w-4" />
                  Tokens Created
                </div>
                <div className="text-2xl font-bold">{summary.tokenCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-foreground/60 text-sm mb-1">
                  <TrendingUp className="h-4 w-4" />
                  Total Volume
                </div>
                <div className="text-2xl font-bold">{formatMatic(summary.totalVolume)} MATIC</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-foreground/60 text-sm mb-1">
                  <Coins className="h-4 w-4" />
                  Total Earnings
                </div>
                <div className="text-2xl font-bold text-green-500">{formatMatic(summary.totalEarnings)} MATIC</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-foreground/60 text-sm mb-1">
                  <Users className="h-4 w-4" />
                  Total Trades
                </div>
                <div className="text-2xl font-bold">{summary.totalTrades}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Token List */}
        {tokens.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-12 w-12 text-foreground/20 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tokens yet</h3>
              <p className="text-foreground/60 mb-6">
                Create your first social token to start earning from your community.
              </p>
              <Link href="/create">
                <Button>Create Token</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Tokens</h2>

            {tokens.map(token => (
              <Card key={token.token_address} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Token Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-surface/50 transition-colors"
                    onClick={() => toggleToken(token.token_address)}
                  >
                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img
                          src={token.image_url}
                          alt={token.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-semibold">{token.name}</div>
                          <div className="text-sm text-foreground/60">${token.symbol}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <div className="text-sm text-foreground/60">Volume</div>
                          <div className="font-semibold">{formatMatic(token.totalVolume)} MATIC</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-foreground/60">Earnings (1%)</div>
                          <div className="font-semibold text-green-500">{formatMatic(token.creatorEarnings)} MATIC</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-foreground/60">Trades</div>
                          <div className="font-semibold">{token.tradeCount}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/token/${token.token_address}`} onClick={e => e.stopPropagation()}>
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                          {expandedToken === token.token_address ? (
                            <ChevronUp className="h-5 w-5 text-foreground/60" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-foreground/60" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mobile Layout */}
                    <div className="md:hidden">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={token.image_url}
                            alt={token.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-semibold text-sm">{token.name}</div>
                            <div className="text-xs text-foreground/60">${token.symbol}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/token/${token.token_address}`} onClick={e => e.stopPropagation()}>
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                          {expandedToken === token.token_address ? (
                            <ChevronUp className="h-5 w-5 text-foreground/60" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-foreground/60" />
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-surface/50 rounded p-2">
                          <div className="text-xs text-foreground/60">Volume</div>
                          <div className="text-sm font-semibold">{formatMatic(token.totalVolume)}</div>
                        </div>
                        <div className="bg-surface/50 rounded p-2">
                          <div className="text-xs text-foreground/60">Earnings</div>
                          <div className="text-sm font-semibold text-green-500">{formatMatic(token.creatorEarnings)}</div>
                        </div>
                        <div className="bg-surface/50 rounded p-2">
                          <div className="text-xs text-foreground/60">Trades</div>
                          <div className="text-sm font-semibold">{token.tradeCount}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedToken === token.token_address && (
                    <div className="border-t border-border p-4 bg-surface/30">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Top Holders */}
                        <div>
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Top Holders
                          </h4>
                          {loadingHolders === token.token_address ? (
                            <div className="animate-pulse space-y-2">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="h-10 bg-surface rounded"></div>
                              ))}
                            </div>
                          ) : holders[token.token_address]?.length ? (
                            <div className="space-y-2">
                              {holders[token.token_address].slice(0, 5).map(holder => (
                                <div key={holder.address} className="flex items-center justify-between p-2 bg-surface/50 rounded">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-foreground/60">#{holder.rank}</span>
                                    {holder.avatar ? (
                                      <img src={holder.avatar} alt="" className="w-6 h-6 rounded-full" />
                                    ) : (
                                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"></div>
                                    )}
                                    <span className="text-sm font-mono">
                                      {holder.username || formatAddress(holder.address)}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-medium">{parseFloat(holder.balance).toFixed(2)}</div>
                                    <div className="text-xs text-foreground/60">{holder.percentage}%</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-foreground/60">No holder data available</p>
                          )}
                        </div>

                        {/* Recent Trades */}
                        <div>
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Recent Trades
                          </h4>
                          {token.recentTrades?.length ? (
                            <div className="space-y-2">
                              {token.recentTrades.slice(0, 5).map((trade, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-surface/50 rounded">
                                  <div className="flex items-center gap-2">
                                    {trade.type === 'buy' ? (
                                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                                    )}
                                    <span className="text-sm font-mono">
                                      {formatAddress(trade.trader_address)}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <div className={`text-sm font-medium ${trade.type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                                      {trade.type === 'buy' ? '+' : '-'}{parseFloat(trade.token_amount).toFixed(2)}
                                    </div>
                                    <div className="text-xs text-foreground/60">
                                      {formatMatic(trade.volume)} MATIC
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-foreground/60">No trades yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* All Recent Trades */}
        {recentTrades.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">All Recent Activity</h2>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {recentTrades.slice(0, 10).map((trade, i) => (
                    <div key={i} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        {trade.type === 'buy' ? (
                          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">
                            {trade.type === 'buy' ? 'Buy' : 'Sell'} {parseFloat(trade.token_amount).toFixed(2)} tokens
                          </div>
                          <div className="text-sm text-foreground/60">
                            by {formatAddress(trade.trader_address)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatMatic(trade.volume)} MATIC</div>
                        <div className="text-sm text-foreground/60">{formatTime(trade.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
