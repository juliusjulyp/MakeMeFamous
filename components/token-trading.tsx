// components/token-trading.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, Address } from 'viem';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SOCIAL_TOKEN_ABI } from '@/lib/contracts';
import { TrendingUp, TrendingDown, DollarSign, Users, ArrowUpDown, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

// Format price with max 6 decimals
const formatPrice = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num === 0) return '0';
  if (num < 0.000001) return num.toExponential(2);
  return num.toFixed(6).replace(/\.?0+$/, '');
};

// Format large numbers with commas or abbreviations
const formatNumber = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
  return num.toLocaleString();
};

type TransactionStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error';

interface TransactionState {
  status: TransactionStatus;
  message: string;
  hash?: string;
}

interface TokenTradingProps {
  tokenAddress: Address;
}

export function TokenTrading({ tokenAddress }: TokenTradingProps) {
  const { address, isConnected } = useAccount();
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [txState, setTxState] = useState<TransactionState>({ status: 'idle', message: '' });
  const [inputError, setInputError] = useState<string>('');

  // Read token info (poll every 3 seconds for live updates)
  const { data: tokenInfo, isLoading: isLoadingToken, isError: isTokenError } = useReadContract({
    address: tokenAddress,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'getTokenInfo',
    query: {
      refetchInterval: 3000,
    },
  });

  const { data: userBalance } = useReadContract({
    address: tokenAddress,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      refetchInterval: 3000,
    },
  });

  const { data: buyPrice } = useReadContract({
    address: tokenAddress,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'getBuyPrice',
    args: buyAmount ? [parseEther(buyAmount)] : [BigInt(0)],
    query: {
      refetchInterval: 2000, // Faster refresh for trading prices
    },
  });

  const { data: sellPrice } = useReadContract({
    address: tokenAddress,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'getSellPrice',
    args: sellAmount && userBalance ? [parseEther(sellAmount)] : [BigInt(0)],
    query: {
      refetchInterval: 2000,
    },
  });

  const { data: socialAccess } = useReadContract({
    address: tokenAddress,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'checkSocialAccess',
    args: address ? [address] : undefined,
    query: {
      refetchInterval: 5000,
    },
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

  const { isLoading: isBuyConfirming, isSuccess: isBuySuccess, isError: isBuyError } = useWaitForTransactionReceipt({
    hash: buyHash,
  });

  const { isLoading: isSellConfirming, isSuccess: isSellSuccess, isError: isSellError } = useWaitForTransactionReceipt({
    hash: sellHash,
  });

  // Track pending amounts for success messages
  const [pendingBuyAmount, setPendingBuyAmount] = useState('');
  const [pendingSellAmount, setPendingSellAmount] = useState('');

  // Handle transaction success/error
  useEffect(() => {
    if (isBuySuccess && buyHash && pendingBuyAmount) {
      setTxState({ status: 'success', message: `Successfully bought ${pendingBuyAmount} tokens!`, hash: buyHash });
      setBuyAmount('');
      setPendingBuyAmount('');
      setTimeout(() => setTxState({ status: 'idle', message: '' }), 5000);
    }
  }, [isBuySuccess, buyHash, pendingBuyAmount]);

  useEffect(() => {
    if (isSellSuccess && sellHash && pendingSellAmount) {
      setTxState({ status: 'success', message: `Successfully sold ${pendingSellAmount} tokens!`, hash: sellHash });
      setSellAmount('');
      setPendingSellAmount('');
      setTimeout(() => setTxState({ status: 'idle', message: '' }), 5000);
    }
  }, [isSellSuccess, sellHash, pendingSellAmount]);

  useEffect(() => {
    if (isBuyError) {
      setTxState({ status: 'error', message: 'Transaction failed. Please try again.' });
      setTimeout(() => setTxState({ status: 'idle', message: '' }), 5000);
    }
  }, [isBuyError]);

  useEffect(() => {
    if (isSellError) {
      setTxState({ status: 'error', message: 'Transaction failed. Please try again.' });
      setTimeout(() => setTxState({ status: 'idle', message: '' }), 5000);
    }
  }, [isSellError]);

  // Input validation
  const validateBuyAmount = (value: string) => {
    setInputError('');
    if (!value) return;
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      setInputError('Amount must be greater than 0');
    }
  };

  const validateSellAmount = (value: string) => {
    setInputError('');
    if (!value) return;
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      setInputError('Amount must be greater than 0');
    } else if (userBalance && num > parseFloat(formatEther(userBalance))) {
      setInputError('Insufficient balance');
    }
  };

  const handleBuy = async () => {
    if (!buyAmount || !buyPrice || inputError) return;

    setTxState({ status: 'pending', message: 'Waiting for wallet confirmation...' });
    setPendingBuyAmount(buyAmount);

    try {
      await buyTokens({
        address: tokenAddress,
        abi: SOCIAL_TOKEN_ABI,
        functionName: 'buyTokens',
        value: buyPrice,
      });
      setTxState({ status: 'confirming', message: 'Transaction submitted. Waiting for confirmation...' });
    } catch (error: any) {
      setPendingBuyAmount('');
      const errorMsg = error?.message?.toLowerCase() || '';
      const message = errorMsg.includes('user rejected') || errorMsg.includes('user denied') || errorMsg.includes('rejected')
        ? 'Transaction cancelled by user'
        : errorMsg.includes('insufficient funds') || errorMsg.includes('insufficient balance')
        ? 'Insufficient MATIC balance'
        : 'Transaction failed. Please try again.';
      setTxState({ status: 'error', message });
      setTimeout(() => setTxState({ status: 'idle', message: '' }), 5000);
    }
  };

  const handleSell = async () => {
    if (!sellAmount || inputError) return;

    setTxState({ status: 'pending', message: 'Waiting for wallet confirmation...' });
    setPendingSellAmount(sellAmount);

    try {
      await sellTokens({
        address: tokenAddress,
        abi: SOCIAL_TOKEN_ABI,
        functionName: 'sellTokens',
        args: [parseEther(sellAmount)],
      });
      setTxState({ status: 'confirming', message: 'Transaction submitted. Waiting for confirmation...' });
    } catch (error: any) {
      setPendingSellAmount('');
      const errorMsg = error?.message?.toLowerCase() || '';
      const message = errorMsg.includes('user rejected') || errorMsg.includes('user denied') || errorMsg.includes('rejected')
        ? 'Transaction cancelled by user'
        : errorMsg.includes('insufficient token balance')
        ? 'Insufficient token balance'
        : errorMsg.includes('insufficient contract')
        ? 'No liquidity available - no one has bought tokens yet'
        : 'Transaction failed. Please try again.';
      setTxState({ status: 'error', message });
      setTimeout(() => setTxState({ status: 'idle', message: '' }), 5000);
    }
  };

  const handleMaxSell = () => {
    if (userBalance) {
      const maxAmount = formatEther(userBalance);
      setSellAmount(maxAmount);
      validateSellAmount(maxAmount);
    }
  };

  const userBalanceFormatted = userBalance ? formatEther(userBalance) : '0';
  const buyPriceFormatted = buyPrice ? formatEther(buyPrice) : '0';
  const sellPriceFormatted = sellPrice ? formatEther(sellPrice) : '0';

  if (isTokenError) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <XCircle className="h-8 w-8 text-red-500 mb-4" />
          <h3 className="font-semibold mb-2">Failed to load token</h3>
          <p className="text-sm text-foreground/60 mb-4">
            Token may not exist or network error occurred.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (isLoadingToken || !tokenInfo) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-sm text-foreground/60">Loading token data...</p>
        </div>
      </Card>
    );
  }

  const [, symbol, , totalMembers] = tokenInfo;

  return (
    <div className="space-y-6">
      {/* Trading Interface */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => setActiveTab('buy')}
            className={`flex-1 ${activeTab === 'buy' ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' : ''}`}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Buy
          </Button>

          <Button
            variant="outline"
            onClick={() => setActiveTab('sell')}
            className={`flex-1 ${activeTab === 'sell' ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' : ''}`}
            disabled={!userBalance || userBalance === BigInt(0)}
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            Sell
          </Button>
        </div>

        {/* Transaction Status Notification */}
        {txState.status !== 'idle' && (
          <div className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
            txState.status === 'success' ? 'bg-green-500/10 border border-green-500/20' :
            txState.status === 'error' ? 'bg-red-500/10 border border-red-500/20' :
            'bg-blue-500/10 border border-blue-500/20'
          }`}>
            {txState.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />}
            {txState.status === 'error' && <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />}
            {(txState.status === 'pending' || txState.status === 'confirming') && (
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                txState.status === 'success' ? 'text-green-500' :
                txState.status === 'error' ? 'text-red-500' :
                'text-blue-500'
              }`}>
                {txState.message}
              </p>
              {txState.hash && (
                <a
                  href={`https://amoy.polygonscan.com/tx/${txState.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline mt-1 inline-block"
                >
                  View on PolygonScan
                </a>
              )}
            </div>
          </div>
        )}

        {/* Input Error */}
        {inputError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-500">{inputError}</span>
          </div>
        )}

        {activeTab === 'buy' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Amount to Buy
              </label>
              <input
                type="number"
                value={buyAmount}
                onChange={(e) => {
                  setBuyAmount(e.target.value);
                  validateBuyAmount(e.target.value);
                }}
                placeholder="Enter token amount"
                min="0"
                step="any"
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <Button
              onClick={handleBuy}
              disabled={!isConnected || !buyAmount || isBuying || isBuyConfirming || !!inputError}
              className="w-full bg-green-600 hover:bg-green-700"
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
              <div className="relative">
                <input
                  type="number"
                  value={sellAmount}
                  onChange={(e) => {
                    setSellAmount(e.target.value);
                    validateSellAmount(e.target.value);
                  }}
                  placeholder="Enter token amount"
                  max={userBalanceFormatted}
                  min="0"
                  step="any"
                  className="w-full px-3 py-2 pr-16 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={handleMaxSell}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium text-primary hover:text-primary/80 bg-primary/10 rounded"
                >
                  MAX
                </button>
              </div>
              <div className="text-xs text-foreground/50 mt-1">
                Balance: {parseFloat(userBalanceFormatted).toFixed(4)} {symbol}
              </div>
            </div>

            <Button
              onClick={handleSell}
              disabled={!isConnected || !sellAmount || isSelling || isSellConfirming || !!inputError}
              className="w-full bg-red-600 hover:bg-red-700"
              size="lg"
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
    </div>
  );
}