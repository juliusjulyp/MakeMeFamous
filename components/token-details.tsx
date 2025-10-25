'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import Link from 'next/link';
import { TokenChat } from '@/components/chat/token-chat';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageCircle, 
  ExternalLink,
  Copy,
  Check,
  ArrowLeft
} from 'lucide-react';

interface TokenDetailsProps {
  tokenAddress: string;
}

// Demo token data - in real app this would come from APIs
const DEMO_TOKENS: Record<string, any> = {
  '0x1234567890123456789012345678901234567890': {
    name: 'MemeKing Token',
    symbol: 'MEME',
    price: 0.045,
    change24h: 12.5,
    marketCap: 1250000,
    holders: 2847,
    description: 'The ultimate meme token for the community. Join the revolution of social finance!',
    totalSupply: '1000000000',
    decimals: 18,
    verified: true,
  },
  '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd': {
    name: 'Social Token',
    symbol: 'SOCIAL',
    price: 0.12,
    change24h: -3.2,
    marketCap: 850000,
    holders: 1563,
    description: 'Building the future of social interactions on blockchain.',
    totalSupply: '500000000',
    decimals: 18,
    verified: false,
  },
};

export function TokenDetails({ tokenAddress }: TokenDetailsProps) {
  const { address: userAddress, isConnected } = useAccount();
  const [copied, setCopied] = useState(false);
  const [userTokenValue, setUserTokenValue] = useState(0);
  
  // Get demo token data
  const tokenData = DEMO_TOKENS[tokenAddress] || {
    name: 'Unknown Token',
    symbol: 'UNKNOWN',
    price: 0,
    change24h: 0,
    marketCap: 0,
    holders: 0,
    description: 'Token information not available.',
    totalSupply: '0',
    decimals: 18,
    verified: false,
  };

  // For demo purposes, simulate user token balance and value
  useEffect(() => {
    if (isConnected && userAddress) {
      // Simulate different token values for testing
      const demoValues = [5.25, 15.75, 45.30, 125.80, 0.50];
      const randomValue = demoValues[Math.floor(Math.random() * demoValues.length)];
      setUserTokenValue(randomValue);
    } else {
      setUserTokenValue(0);
    }
  }, [isConnected, userAddress, tokenAddress]);

  const copyAddress = async () => {
    await navigator.clipboard.writeText(tokenAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="space-y-8">
      {/* Back to Home Button */}
      <div className="flex items-center">
        <Link href="/">
          <Button variant="outline" className="gap-2 hover:bg-surface">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      {/* Token Header */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-2xl font-bold text-white">
                {tokenData.symbol.slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold">{tokenData.name}</h1>
                  {tokenData.verified && (
                    <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-foreground/70">
                  <span className="text-lg font-medium">{tokenData.symbol}</span>
                  <button
                    onClick={copyAddress}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <span className="text-sm">{formatAddress(tokenAddress)}</span>
                    {copied ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-foreground/80 max-w-2xl">{tokenData.description}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              View on Explorer
            </Button>
            <Button className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Trade Token
            </Button>
          </div>
        </div>
      </div>

      {/* Token Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-lg p-4 border border-border">
          <div className="text-sm text-foreground/70 mb-1">Price</div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">${tokenData.price.toFixed(4)}</span>
            <div className={`flex items-center gap-1 text-sm ${
              tokenData.change24h >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {tokenData.change24h >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {Math.abs(tokenData.change24h).toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-4 border border-border">
          <div className="text-sm text-foreground/70 mb-1">Market Cap</div>
          <div className="text-2xl font-bold">{formatNumber(tokenData.marketCap)}</div>
        </div>

        <div className="bg-surface rounded-lg p-4 border border-border">
          <div className="text-sm text-foreground/70 mb-1">Holders</div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold">{tokenData.holders.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-4 border border-border">
          <div className="text-sm text-foreground/70 mb-1">Your Holdings</div>
          <div className="text-2xl font-bold">
            {isConnected ? `$${userTokenValue.toFixed(2)}` : '--'}
          </div>
          {isConnected && (
            <div className="text-xs text-foreground/50 mt-1">
              {userTokenValue >= 10 ? 'Chat access granted' : 'Need $10+ for chat'}
            </div>
          )}
        </div>
      </div>

      {/* Chat Section */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <MessageCircle className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Community Chat</h2>
          <Badge variant="outline" className="ml-auto">
            Live
          </Badge>
        </div>

        {!isConnected ? (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-foreground/70 mb-4">
              Connect your wallet to join the {tokenData.symbol} community chat
            </p>
            <Button className="gap-2">
              Connect Wallet
            </Button>
          </div>
        ) : (
          <TokenChat
            tokenAddress={tokenAddress}
            tokenSymbol={tokenData.symbol}
            tokenValue={userTokenValue}
          />
        )}
      </div>
    </div>
  );
}