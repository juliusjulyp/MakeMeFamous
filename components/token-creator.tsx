// components/token-creator.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTokenFactory } from '@/hooks/use-token-factory';
import { CONTRACT_CONFIG } from '@/lib/contracts';
import { Loader2, Rocket, DollarSign, Users, TrendingUp, Upload, X } from 'lucide-react';

interface TokenFormData {
  name: string;
  symbol: string;
  initialSupply: string;
  description: string;
  imageUrl: string;
  imageFile: File | null;
}

export function TokenCreator() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { 
    createToken, 
    isCreating, 
    creationFee, 
    platformStats,
    createdTokenAddress,
    error 
  } = useTokenFactory();

  const [formData, setFormData] = useState<TokenFormData>({
    name: '',
    symbol: '',
    initialSupply: '1000000',
    description: '',
    imageUrl: '',
    imageFile: null,
  });

  const [showForm, setShowForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [pendingMetadata, setPendingMetadata] = useState<{
    name: string;
    symbol: string;
    description: string;
    imageUrl: string;
  } | null>(null);

  // Save metadata and redirect when token is successfully created
  useEffect(() => {
    console.log('🔄 useEffect triggered:', {
      createdTokenAddress,
      hasAddress: !!address,
      hasPendingMetadata: !!pendingMetadata
    });

    const saveMetadataAndRedirect = async () => {
      if (createdTokenAddress && address && pendingMetadata) {
        // Save metadata to database
        try {
          console.log('💾 Saving metadata to Supabase:', {
            token_address: createdTokenAddress,
            image_url: pendingMetadata.imageUrl,
          });

          const response = await fetch('/api/tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token_address: createdTokenAddress,
              creator_address: address,
              name: pendingMetadata.name,
              symbol: pendingMetadata.symbol,
              description: pendingMetadata.description,
              image_url: pendingMetadata.imageUrl,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            console.error('Failed to save metadata:', error);
          } else {
            console.log('✅ Metadata saved successfully');
          }
        } catch (error) {
          console.error('Failed to save token metadata:', error);
        }

        // Close the form and reset
        setShowForm(false);

        // Reset form data for next token creation
        setFormData({
          name: '',
          symbol: '',
          initialSupply: '1000000',
          description: '',
          imageUrl: '',
          imageFile: null,
        });
        setUploadedImageUrl('');
        setPendingMetadata(null);

        // Redirect to token page
        setTimeout(() => {
          router.push(`/token/${createdTokenAddress}`);
        }, 1500);
      }
    };

    saveMetadataAndRedirect();
  }, [createdTokenAddress, address, pendingMetadata, router]);

  const handleInputChange = (field: keyof TokenFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    setIsProcessing(true); // Start processing immediately

    try {
      let imageUrlToUse = formData.imageUrl;

      // Upload image to Cloudinary first (silently)
      if (formData.imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.imageFile);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }

        const { url } = await uploadResponse.json();
        console.log('✅ Image uploaded to Cloudinary:', url);
        setUploadedImageUrl(url);
        imageUrlToUse = url; // Use the Cloudinary URL for blockchain
      }

      // Create token on blockchain with Cloudinary URL (not base64)
      console.log('🚀 Creating token with image URL:', imageUrlToUse);
      console.log('   URL length:', imageUrlToUse.length, 'characters');
      console.log('   Initial Supply:', formData.initialSupply);
      console.log('   Name:', formData.name);
      console.log('   Symbol:', formData.symbol);

      // Store metadata for saving after token creation
      setPendingMetadata({
        name: formData.name,
        symbol: formData.symbol,
        description: formData.description,
        imageUrl: imageUrlToUse,
      });

      // Metadata will be saved in the useEffect when createdTokenAddress is set
      await createToken({
        ...formData,
        imageUrl: imageUrlToUse, // Use uploaded URL instead of base64
      });
    } catch (error: any) {
      console.error('❌ Failed to create token:', error);
      console.error('   Error type:', error.name);
      console.error('   Error message:', error.message);
      if (error.cause) {
        console.error('   Cause:', error.cause);
      }
      if (error.shortMessage) {
        console.error('   Short message:', error.shortMessage);
      }
      setIsProcessing(false);
    }
  };

  const isFormValid = formData.name && formData.symbol && formData.description && formData.imageUrl;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          imageUrl: reader.result as string,
          imageFile: file
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '', imageFile: null }));
  };

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
            <h2 className="text-2xl font-bold">Launch Your Token</h2>
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
              {!isConnected ? 'Connect Wallet to Create Token' : 'Create Token'}
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
          <h2 className="text-2xl font-bold">Create Your Token</h2>
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

          {/* Token Image */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Token Image
              <span className="text-red-500 ml-1">*</span>
            </label>
            {formData.imageUrl ? (
              <div className="relative w-32 h-32">
                <img
                  src={formData.imageUrl}
                  alt="Token preview"
                  className="w-32 h-32 rounded-lg object-cover border border-border"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="h-8 w-8 text-foreground/50 mb-2" />
                <span className="text-sm text-foreground/50">Click to upload image</span>
                <span className="text-xs text-foreground/40 mt-1">PNG, JPG up to 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
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
              disabled={isCreating || isProcessing}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              className="flex-1"
              disabled={!isFormValid || isCreating || isProcessing}
            >
              {createdTokenAddress ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Token created successfully
                </>
              ) : isCreating || isProcessing ? (
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