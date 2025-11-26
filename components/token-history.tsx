'use client';

import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { formatEther, Address } from 'viem';
import { Card } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, History, Loader2 } from 'lucide-react';

interface Transaction {
  type: 'buy' | 'sell';
  userAddress: string;
  amount: string;
  ethAmount: string;
  timestamp: number;
  txHash: string;
}

interface TokenHistoryProps {
  tokenAddress: Address;
}

export function TokenHistory({ tokenAddress }: TokenHistoryProps) {
  const publicClient = usePublicClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      if (!publicClient) return;

      try {
        // Fetch all transactions from token creation
        // Use a larger block range to capture full history
        const currentBlock = await publicClient.getBlockNumber();
        // Fetch from 50,000 blocks ago (approximately 1-2 days on Polygon Amoy)
        // Or from block 0 if token is very new
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

        // Process buy transactions
        const buyTxs: Transaction[] = await Promise.all(
          buyLogs.map(async (log) => {
            const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
            return {
              type: 'buy' as const,
              userAddress: log.args.buyer as string,
              amount: formatEther(log.args.amount as bigint),
              ethAmount: formatEther(log.args.ethPaid as bigint),
              timestamp: Number(block.timestamp),
              txHash: log.transactionHash,
            };
          })
        );

        // Process sell transactions
        const sellTxs: Transaction[] = await Promise.all(
          sellLogs.map(async (log) => {
            const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
            return {
              type: 'sell' as const,
              userAddress: log.args.seller as string,
              amount: formatEther(log.args.amount as bigint),
              ethAmount: formatEther(log.args.ethReceived as bigint),
              timestamp: Number(block.timestamp),
              txHash: log.transactionHash,
            };
          })
        );

        // Combine and sort by timestamp (newest first)
        const allTxs = [...buyTxs, ...sellTxs].sort((a, b) => b.timestamp - a.timestamp);
        setTransactions(allTxs);
      } catch (error) {
        console.error('Error fetching transaction history:', error);
      } finally {
        setIsLoading(false);
      }
    }

    // Initial fetch
    fetchTransactions();

    // Poll for new transactions every 10 seconds
    const interval = setInterval(() => {
      fetchTransactions();
    }, 10000);

    return () => clearInterval(interval);
  }, [publicClient, tokenAddress]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Transaction History</h3>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-foreground/50" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center text-foreground/50 py-8">
          <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {transactions.map((tx, index) => (
            <a
              key={`${tx.txHash}-${index}`}
              href={`https://amoy.polygonscan.com/tx/${tx.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-background/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  tx.type === 'buy'
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-red-500/10 text-red-500'
                }`}>
                  {tx.type === 'buy' ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      tx.type === 'buy' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {tx.type === 'buy' ? 'Buy' : 'Sell'}
                    </span>
                    <span className="text-xs text-foreground/50">
                      {formatAddress(tx.userAddress)}
                    </span>
                  </div>
                  <div className="text-xs text-foreground/50">
                    {formatTime(tx.timestamp)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {formatAmount(tx.amount)} tokens
                </div>
                <div className="text-xs text-foreground/50">
                  {parseFloat(tx.ethAmount).toFixed(4)} MATIC
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </Card>
  );
}
