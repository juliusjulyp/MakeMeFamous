'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseEther, formatEther, Address } from 'viem';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import type { IChartApi, Time, CandlestickData } from 'lightweight-charts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SOCIAL_TOKEN_ABI } from '@/lib/contracts';
import { TrendingUp, TrendingDown, DollarSign, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface TokenChartProps {
  tokenAddress: Address;
}

type TransactionStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error';

interface TransactionState {
  status: TransactionStatus;
  message: string;
  hash?: string;
}

export function TokenChart({ tokenAddress }: TokenChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const isFirstLoad = useRef<boolean>(true);

  const publicClient = usePublicClient();
  const { address, isConnected } = useAccount();
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [txState, setTxState] = useState<TransactionState>({ status: 'idle', message: '' });
  const [inputError, setInputError] = useState<string>('');
  const [timeframe, setTimeframe] = useState<string>('1H');
  const [pendingBuyAmount, setPendingBuyAmount] = useState('');
  const [pendingSellAmount, setPendingSellAmount] = useState('');

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

  // Write functions
  const { writeContract: buyTokens, data: buyHash, isPending: isBuying } = useWriteContract();
  const { writeContract: sellTokens, data: sellHash, isPending: isSelling } = useWriteContract();

  const { isLoading: isBuyConfirming, isSuccess: isBuySuccess, isError: isBuyError } = useWaitForTransactionReceipt({
    hash: buyHash,
  });

  const { isLoading: isSellConfirming, isSuccess: isSellSuccess, isError: isSellError } = useWaitForTransactionReceipt({
    hash: sellHash,
  });

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 900,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      localization: {
        priceFormatter: (price: number) => price.toFixed(6),
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Fetch and process price data
  useEffect(() => {
    async function fetchPriceData() {
      if (!publicClient || !candleSeriesRef.current) return;

      try {
        const currentBlock = await publicClient.getBlockNumber();
        // Fetch from 50,000 blocks ago (approximately 1-2 days on Polygon Amoy)
        const fromBlock = currentBlock > BigInt(50000) ? currentBlock - BigInt(50000) : BigInt(0);

        // Fetch buy events
        const buyLogs = await publicClient.getLogs({
          address: tokenAddress,
          event: {
            type: 'event',
            name: 'TokenPurchased',
            inputs: [
              { type: 'address', indexed: true, name: 'buyer' },
              { type: 'uint256', name: 'amount' },
              { type: 'uint256', name: 'ethPaid' },
            ],
          },
          fromBlock,
          toBlock: 'latest',
        });

        // Fetch sell events
        const sellLogs = await publicClient.getLogs({
          address: tokenAddress,
          event: {
            type: 'event',
            name: 'TokenSold',
            inputs: [
              { type: 'address', indexed: true, name: 'seller' },
              { type: 'uint256', name: 'amount' },
              { type: 'uint256', name: 'ethReceived' },
            ],
          },
          fromBlock,
          toBlock: 'latest',
        });

        // Process events into price points
        const pricePoints: { timestamp: number; price: number }[] = [];

        for (const log of buyLogs) {
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
          const amount = Number(formatEther(log.args.amount as bigint));
          const ethPaid = Number(formatEther(log.args.ethPaid as bigint));
          if (amount > 0) {
            pricePoints.push({
              timestamp: Number(block.timestamp),
              price: ethPaid / amount,
            });
          }
        }

        for (const log of sellLogs) {
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
          const amount = Number(formatEther(log.args.amount as bigint));
          const ethReceived = Number(formatEther(log.args.ethReceived as bigint));
          if (amount > 0) {
            pricePoints.push({
              timestamp: Number(block.timestamp),
              price: ethReceived / amount,
            });
          }
        }

        // Sort by timestamp
        pricePoints.sort((a, b) => a.timestamp - b.timestamp);

        // Aggregate into candles
        const candleData = aggregateToCandles(pricePoints, timeframe);

        if (candleData.length > 0) {
          candleSeriesRef.current.setData(candleData);
          // Only auto-fit on first load, don't reset user's zoom/scroll position
          if (isFirstLoad.current) {
            chartRef.current?.timeScale().fitContent();
            isFirstLoad.current = false;
          }
        } else {
          // Show current price as single candle if no trades
          if (tokenInfo) {
            const currentPrice = Math.max(0.000001, Number(formatEther(tokenInfo[6] as bigint)));
            const now = Math.floor(Date.now() / 1000);
            candleSeriesRef.current.setData([{
              time: now as Time,
              open: currentPrice,
              high: currentPrice * 1.01,
              low: currentPrice * 0.99,
              close: currentPrice,
            }]);
            // Only auto-fit on first load
            if (isFirstLoad.current) {
              chartRef.current?.timeScale().fitContent();
              isFirstLoad.current = false;
            }
          }
        }
      } catch (error) {
        console.error('Error fetching price data:', error);
      }
    }

    // Initial fetch
    fetchPriceData();

    // Poll for new data every 10 seconds
    const interval = setInterval(() => {
      fetchPriceData();
    }, 10000);

    return () => clearInterval(interval);
  }, [publicClient, tokenAddress, timeframe, tokenInfo]);

  // Reset first load flag when timeframe changes (so chart auto-fits on timeframe switch)
  useEffect(() => {
    isFirstLoad.current = true;
  }, [timeframe]);

  // Aggregate price points into OHLC candles
  function aggregateToCandles(pricePoints: { timestamp: number; price: number }[], tf: string): CandlestickData[] {
    if (pricePoints.length === 0) return [];

    const intervals: { [key: string]: number } = {
      '5M': 300,
      '15M': 900,
      '1H': 3600,
      '4H': 14400,
      '1D': 86400,
    };

    const interval = intervals[tf] || 3600;
    const candles: Map<number, CandlestickData> = new Map();

    for (const point of pricePoints) {
      const candleTime = Math.floor(point.timestamp / interval) * interval;

      if (candles.has(candleTime)) {
        const candle = candles.get(candleTime)!;
        candle.high = Math.max(candle.high, point.price);
        candle.low = Math.min(candle.low, point.price);
        candle.close = point.price;
      } else {
        candles.set(candleTime, {
          time: candleTime as Time,
          open: point.price,
          high: point.price,
          low: point.price,
          close: point.price,
        });
      }
    }

    return Array.from(candles.values()).sort((a, b) => (a.time as number) - (b.time as number));
  }

  // Transaction handlers
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
    if (isBuyError || isSellError) {
      setTxState({ status: 'error', message: 'Transaction failed. Please try again.' });
      setTimeout(() => setTxState({ status: 'idle', message: '' }), 5000);
    }
  }, [isBuyError, isSellError]);

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

  const symbol = tokenInfo ? tokenInfo[1] : 'TOKEN';
  const userBalanceFormatted = userBalance ? formatEther(userBalance) : '0';
  const buyPriceFormatted = buyPrice ? formatEther(buyPrice) : '0';
  const sellPriceFormatted = sellPrice ? formatEther(sellPrice) : '0';

  return (
    <Card className="p-4">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{symbol}/MATIC</h3>
        <div className="flex gap-1">
          {['5M', '15M', '1H', '4H', '1D'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-1 text-xs rounded ${
                timeframe === tf
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-foreground/70 hover:bg-background/80'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div ref={chartContainerRef} className="w-full" />
    </Card>
  );
}
