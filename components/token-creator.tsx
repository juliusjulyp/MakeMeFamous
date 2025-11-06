// components/token-creator.tsx
'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTokenFactory } from '@/hooks/use-token-factory';
import { CONTRACT_CONFIG } from '@/lib/contracts';
import { Loader2, Rocket, DollarSign, Users, TrendingUp } from 'lucide-react';

interface TokenFormData {
  name: string;
  symbol: string;
  initialSupply: string;
  description: string;
  imageUrl: string;
}

export function TokenCreator() {
  const { address, isConnected } = useAccount();
  const { 
    createToken, 
    isCreating, 
    creationFee, 
    platformStats,
    error 
  } = useTokenFactory();

  const [formData, setFormData] = useState<TokenFormData>({
    name: '',
    symbol: '',
    initialSupply: '1000000',
    description: '',
    imageUrl: '',
  });

  const [showForm, setShowForm] = useState(false);

  const handleInputChange = (field: keyof TokenFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      await createToken(formData);
      alert('Token created successfully!');
      setShowForm(false);
      setFormData({
        name: '',
        symbol: '',
        initialSupply: '1000000',
        description: '',
        imageUrl: '',
      });
    } catch (error) {
      console.error('Failed to create token:', error);
      alert('Failed to create token. Please try again.');
    }
  };

  const isFormValid = formData.name && formData.symbol && formData.description;

  if (!showForm) {
    return (
      <div className="space-y-6">
        {/* Platform Stats */}
        {platformStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Rocket className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-foreground/70">Total Tokens</p>
                  <p className="text-2xl font-bold">{platformStats.totalTokens}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-foreground/70">Total Volume</p>
                  <p className="text-2xl font-bold">
                    {formatEther(platformStats.totalVolume)} MATIC
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-foreground/70">Platform Revenue</p>
                  <p className="text-2xl font-bold">
                    {formatEther(platformStats.totalRevenue)} MATIC
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-foreground/70">Active Tokens</p>
                  <p className="text-2xl font-bold">{platformStats.activeTokens}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Create Token Button */}
        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <Rocket className="h-16 w-16 mx-auto text-primary" />
            <h2 className="text-2xl font-bold">Launch Your Social Token</h2>
            <p className="text-foreground/70">
              Create a token that brings your community together. Enable token-gated chats, 
              build engaged communities, and let your supporters become stakeholders.
            </p>
            
            <div className="bg-surface border border-border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold">What You Get:</h3>
              <ul className="text-sm text-foreground/70 space-y-1">
                <li>• Automatic bonding curve pricing</li>
                <li>• Token-gated community chat</li>
                <li>• Real-time member tracking</li>
                <li>• Social media integration</li>
                <li>• Revenue sharing from trades</li>
              </ul>
            </div>
            
            <div className="text-sm text-foreground/50">
              Creation fee: {creationFee ? formatEther(creationFee) : CONTRACT_CONFIG.creationFee} MATIC
            </div>
            
            <Button 
              onClick={() => setShowForm(true)}
              size="lg"
              className="w-full"
              disabled={!isConnected}
            >
              {!isConnected ? 'Connect Wallet to Create Token' : 'Create Social Token'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Create Your Social Token</h2>
          <p className="text-foreground/70">
            Fill in the details below to launch your community token
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Token Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Token Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Dogecoin Killers"
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              maxLength={50}
              required
            />
          </div>

          {/* Token Symbol */}
          <div>
            <label className="block text-sm font-medium mb-2">Token Symbol</label>
            <input
              type="text"
              value={formData.symbol}
              onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
              placeholder="e.g., DOGEK"
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              maxLength={10}
              required
            />
          </div>

          {/* Initial Supply */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Initial Supply
              <span className="text-foreground/50 text-xs ml-2">(tokens minted to creator)</span>
            </label>
            <input
              type="number"
              value={formData.initialSupply}
              onChange={(e) => handleInputChange('initialSupply', e.target.value)}
              placeholder="1000000"
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              min="0"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your token and community..."
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 h-24 resize-none"
              maxLength={500}
              required
            />
            <div className="text-xs text-foreground/50 mt-1">
              {formData.description.length}/500 characters
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Image URL
              <span className="text-foreground/50 text-xs ml-2">(optional)</span>
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => handleInputChange('imageUrl', e.target.value)}
              placeholder="https://example.com/token-image.png"
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Creation Fee Display */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Creation Fee:</span>
              <span className="font-bold">
                {creationFee ? formatEther(creationFee) : CONTRACT_CONFIG.creationFee} MATIC
              </span>
            </div>
            <div className="text-xs text-foreground/50 mt-1">
              This fee covers deployment and platform operations
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-destructive text-sm">
                Error: {error.message}
              </p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
              className="flex-1"
              disabled={isCreating}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              className="flex-1"
              disabled={!isFormValid || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Token...
                </>
              ) : (
                'Create Token'
              )}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}