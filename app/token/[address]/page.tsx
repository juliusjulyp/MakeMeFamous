'use client';

import { useParams } from 'next/navigation';
import { Address, isAddress } from 'viem';
import { TokenTrading } from '@/components/token-trading';
import { TokenChat } from '@/components/chat/token-chat';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TokenPage() {
  const params = useParams();
  const tokenAddress = params.address as string;

  // Validate the address
  if (!tokenAddress || !isAddress(tokenAddress)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Token Address</h1>
          <p className="text-foreground/70 mb-6">
            The token address you provided is not valid.
          </p>
          <Link href="/tokens">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Browse Tokens
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <Link href="/tokens">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tokens
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Trading */}
          <div className="lg:col-span-2">
            <TokenTrading tokenAddress={tokenAddress as Address} />
          </div>

          {/* Right Column - Chat */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Community Chat</h3>
                <TokenChat 
                  tokenAddress={tokenAddress}
                  tokenSymbol="TOKEN" // This will be updated by the component
                />
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

