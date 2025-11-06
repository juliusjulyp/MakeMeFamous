// components/token-trading.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, Address } from 'viem';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SOCIAL_TOKEN_ABI } from '@/lib/contracts';
import { TrendingUp, TrendingDown, DollarSign, Users, ArrowUpDown, Loader2 } from 'lucide-react';

interface TokenTradingProps {
  tokenAddress: Address;
}

export function TokenTrading({ tokenAddress }: TokenTradingProps) {
  const { address, isConnected } = useAccount();
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');

  // Read token info
  const { data: tokenInfo } = useReadContract({
    address: tokenAddress,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'getTokenInfo',
  });

  const { data: userBalance } = useReadContract({
    address: tokenAddress,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: buyPrice } = useReadContract({
    address: tokenAddress,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'getBuyPrice',
    args: buyAmount ? [parseEther(buyAmount)] : [BigInt(0)],
  });

  const { data: sellPrice } = useReadContract({
    address: tokenAddress,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'getSellPrice',
    args: sellAmount && userBalance ? [parseEther(sellAmount)] : [BigInt(0)],
  });

  const { data: socialAccess } = useReadContract({
    address: tokenAddress,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'checkSocialAccess',
    args: address ? [address] : undefined,
  });

  // Write functions
  const { 
    writeContract: buyTokens, 
    data: buyHash,
    isPending: isBuying 
  } = useWriteContract();

  const { 
    writeContract: sellTokens, 
    data: sellHash,
    isPending: isSelling 
  } = useWriteContract();

  const { isLoading: isBuyConfirming } = useWaitForTransactionReceipt({
    hash: buyHash,
  });

  const { isLoading: isSellConfirming } = useWaitForTransactionReceipt({
    hash: sellHash,
  });

  const handleBuy = async () => {
    if (!buyAmount || !buyPrice) return;

    try {
      await buyTokens({
        address: tokenAddress,
        abi: SOCIAL_TOKEN_ABI,
        functionName: 'buyTokens',
        value: buyPrice,
      });
    } catch (error) {
      console.error('Buy failed:', error);
    }
  };

  const handleSell = async () => {
    if (!sellAmount) return;

    try {
      await sellTokens({
        address: tokenAddress,
        abi: SOCIAL_TOKEN_ABI,
        functionName: 'sellTokens',
        args: [parseEther(sellAmount)],
      });
    } catch (error) {
      console.error('Sell failed:', error);
    }
  };

  const userBalanceFormatted = userBalance ? formatEther(userBalance) : '0';
  const buyPriceFormatted = buyPrice ? formatEther(buyPrice) : '0';
  const sellPriceFormatted = sellPrice ? formatEther(sellPrice) : '0';

  if (!tokenInfo) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Card>
    );
  }

  const [name, symbol, totalSupply, totalMembers, creator, isVerified, currentPrice] = tokenInfo;

  return (
    <div className="space-y-6">
      
      {/* Token Stats */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {symbol.charAt(0)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{name}</h2>
                {isVerified && (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-foreground/60">{symbol}</p>
            </div>
          </div>
          
          {socialAccess && (
            <Badge variant="success" className="bg-green-500/10 text-green-500 border-green-500/20">
              Chat Access ✓
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{formatEther(currentPrice)}Ⓜ</div>
            <div className="text-sm text-foreground/60">Current Price</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold">{Number(totalMembers)}</div>
            <div className="text-sm text-foreground/60">Members</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold">{(Number(formatEther(totalSupply)) / 1000000).toFixed(1)}M</div>
            <div className="text-sm text-foreground/60">Supply</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold">{userBalanceFormatted.slice(0, 8)}</div>
            <div className="text-sm text-foreground/60">Your Balance</div>
          </div>
        </div>
      </Card>

      {/* Trading Interface */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant={activeTab === 'buy' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('buy')}
            className="flex-1"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Buy
          </Button>
          
          <Button
            variant={activeTab === 'sell' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('sell')}
            className="flex-1"
            disabled={!userBalance || userBalance === BigInt(0)}
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            Sell
          </Button>
        </div>

        {activeTab === 'buy' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Amount to Buy
              </label>
              <input
                type="number"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                placeholder="Enter token amount"
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {buyAmount && buyPrice && (
              <div className="bg-surface border border-border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground/60">You pay:</span>
                  <span className="font-bold">{buyPriceFormatted} MATIC</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-foreground/60">You receive:</span>
                  <span className="font-bold">{buyAmount} {symbol}</span>
                </div>
              </div>
            )}

            <Button
              onClick={handleBuy}
              disabled={!isConnected || !buyAmount || isBuying || isBuyConfirming}
              className="w-full"
              size="lg"
            >
              {isBuying || isBuyConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isBuying ? 'Confirming...' : 'Processing...'}
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Buy Tokens
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Amount to Sell
              </label>
              <input
                type="number"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                placeholder="Enter token amount"
                max={userBalanceFormatted}
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="text-xs text-foreground/50 mt-1">
                Max: {userBalanceFormatted} {symbol}
              </div>
            </div>

            {sellAmount && sellPrice && (
              <div className="bg-surface border border-border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground/60">You sell:</span>
                  <span className="font-bold">{sellAmount} {symbol}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-foreground/60">You receive:</span>
                  <span className="font-bold">{sellPriceFormatted} MATIC</span>
                </div>
              </div>
            )}

            <Button
              onClick={handleSell}
              disabled={!isConnected || !sellAmount || isSelling || isSellConfirming}
              className="w-full"
              size="lg"
              variant="outline"
            >
              {isSelling || isSellConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isSelling ? 'Confirming...' : 'Processing...'}
                </>
              ) : (
                <>
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sell Tokens
                </>
              )}
            </Button>
          </div>
        )}

        {!isConnected && (
          <div className="text-center py-8 text-foreground/60">
            Connect your wallet to start trading
          </div>
        )}
      </Card>

      {/* Social Access Info */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Community Access</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-foreground/70">Chat Access:</span>
            <Badge variant={socialAccess ? "success" : "outline"}>
              {socialAccess ? "Granted" : "Need $10+ worth"}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-foreground/70">Community Members:</span>
            <span className="font-medium">{Number(totalMembers)}</span>
          </div>
          
          <div className="text-sm text-foreground/60">
            Hold $10+ worth of {symbol} tokens to unlock exclusive community features
          </div>
        </div>
      </Card>
    </div>
  );
}