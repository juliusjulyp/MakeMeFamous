// app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useBalance } from 'wagmi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTokenFactory } from '@/hooks/use-token-factory';
import { useProfile } from '@/hooks/use-profile';
import { SOCIAL_TOKEN_ABI, SOCIAL_TOKEN_FACTORY_ABI, getFactoryAddress } from '@/lib/contracts';
import {
  Wallet,
  Coins,
  Plus,
  ExternalLink,
  User,
  Activity,
  Copy,
  Check,
  Edit3,
  X,
  Save
} from 'lucide-react';
import Link from 'next/link';
import { formatEther, Address } from 'viem';
import { useChainId } from 'wagmi';

type TabType = 'portfolio' | 'created' | 'activity';

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: maticBalance } = useBalance({ address });
  const [activeTab, setActiveTab] = useState<TabType>('portfolio');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { profile, updateProfile } = useProfile();

  // Edit form state
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    twitter: '',
    telegram: '',
    website: '',
  });

  const factoryAddress = getFactoryAddress(chainId);

  const openEditModal = () => {
    setEditForm({
      displayName: profile?.displayName || '',
      bio: profile?.bio || '',
      twitter: profile?.socialLinks?.twitter || '',
      telegram: profile?.socialLinks?.telegram || '',
      website: profile?.socialLinks?.website || '',
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        displayName: editForm.displayName || undefined,
        bio: editForm.bio || undefined,
        socialLinks: {
          twitter: editForm.twitter || null,
          telegram: editForm.telegram || null,
          website: editForm.website || null,
        },
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
    setIsSaving(false);
  };

  // Get user's created tokens
  const { data: createdTokens } = useReadContract({
    address: factoryAddress,
    abi: SOCIAL_TOKEN_FACTORY_ABI,
    functionName: 'getCreatorTokens',
    args: address ? [address] : undefined,
  });

  // Get all tokens to check holdings
  const { trendingTokens } = useTokenFactory();

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 text-center">
            <Wallet className="h-16 w-16 mx-auto mb-4 text-foreground/30" />
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-foreground/60 mb-6">
              Connect your wallet to view your profile and portfolio.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">

        {/* Profile Header */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
              <User className="h-10 w-10 text-white" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">
                  {profile?.displayName || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                </h1>
                <button
                  onClick={copyAddress}
                  className="p-1.5 hover:bg-surface rounded transition-colors"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-foreground/50" />
                  )}
                </button>
                <button
                  onClick={openEditModal}
                  className="p-1.5 hover:bg-surface rounded transition-colors"
                >
                  <Edit3 className="h-4 w-4 text-foreground/50" />
                </button>
              </div>
              {profile?.bio && (
                <p className="text-sm text-foreground/70 mb-2">{profile.bio}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-foreground/60">
                <span>{createdTokens?.length || 0} tokens created</span>
                <span>•</span>
                <span>
                  {maticBalance ? parseFloat(formatEther(maticBalance.value)).toFixed(4) : '0'} MATIC
                </span>
              </div>
            </div>

            <Link href="/create">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Token
              </Button>
            </Link>
          </div>
        </Card>

        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Edit Profile</h2>
                <button onClick={() => setIsEditing(false)} className="p-1 hover:bg-surface rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Display Name</label>
                  <input
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                    placeholder="Your display name"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Tell us about yourself"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    rows={3}
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Twitter</label>
                  <input
                    type="text"
                    value={editForm.twitter}
                    onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })}
                    placeholder="@username"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Telegram</label>
                  <input
                    type="text"
                    value={editForm.telegram}
                    onChange={(e) => setEditForm({ ...editForm, telegram: e.target.value })}
                    placeholder="@username"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Website</label>
                  <input
                    type="text"
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    placeholder="https://yoursite.com"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={isSaving} className="flex-1">
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'portfolio' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('portfolio')}
            className="flex items-center gap-2"
          >
            <Coins className="h-4 w-4" />
            Portfolio
          </Button>
          <Button
            variant={activeTab === 'created' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('created')}
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            Created
            {createdTokens && createdTokens.length > 0 && (
              <Badge variant="outline" className="ml-1 text-xs">
                {createdTokens.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === 'activity' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('activity')}
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            Activity
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'portfolio' && (
          <PortfolioTab trendingTokens={trendingTokens} userAddress={address!} />
        )}

        {activeTab === 'created' && (
          <CreatedTab createdTokens={createdTokens as string[] | undefined} />
        )}

        {activeTab === 'activity' && (
          <ActivityTab />
        )}
      </div>
    </div>
  );
}

// Portfolio Tab - Shows user's token holdings
function PortfolioTab({
  trendingTokens,
  userAddress
}: {
  trendingTokens: readonly string[];
  userAddress: Address;
}) {
  if (trendingTokens.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Coins className="h-12 w-12 mx-auto mb-4 text-foreground/30" />
        <h3 className="text-lg font-semibold mb-2">No tokens available</h3>
        <p className="text-foreground/60">
          Explore tokens and start building your portfolio!
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trendingTokens.map((tokenAddress) => (
        <HoldingCard
          key={tokenAddress}
          tokenAddress={tokenAddress}
          userAddress={userAddress}
        />
      ))}
    </div>
  );
}

// Created Tab - Shows tokens user created
function CreatedTab({ createdTokens }: { createdTokens: string[] | undefined }) {
  if (!createdTokens || createdTokens.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Plus className="h-12 w-12 mx-auto mb-4 text-foreground/30" />
        <h3 className="text-lg font-semibold mb-2">No tokens created yet</h3>
        <p className="text-foreground/60 mb-4">
          Create your first token and start building your community!
        </p>
        <Link href="/create">
          <Button>Create Token</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {createdTokens.map((tokenAddress) => (
        <CreatedTokenCard key={tokenAddress} tokenAddress={tokenAddress} />
      ))}
    </div>
  );
}

// Activity Tab - Placeholder for future
function ActivityTab() {
  return (
    <Card className="p-8 text-center">
      <Activity className="h-12 w-12 mx-auto mb-4 text-foreground/30" />
      <h3 className="text-lg font-semibold mb-2">Activity coming soon</h3>
      <p className="text-foreground/60">
        Track your trading history, earnings, and community interactions.
      </p>
    </Card>
  );
}

// Card for tokens the user created
function CreatedTokenCard({ tokenAddress }: { tokenAddress: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  const { data: tokenInfo } = useReadContract({
    address: tokenAddress as Address,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'getTokenInfo',
    query: {
      refetchInterval: 45000, // Poll every 5 seconds for price updates
    },
  });

  // Fetch image from Supabase
  useEffect(() => {
    const fetchImage = async () => {
      setImageLoading(true);
      try {
        const response = await fetch(`/api/tokens?address=${tokenAddress}`);
        if (response.ok) {
          const data = await response.json();
          const url = data.token?.image_url || null;
          setImageUrl(url);
          setImageLoading(false);
        } else {
          setImageUrl(null);
          setImageLoading(false);
        }
      } catch (error) {
        setImageUrl(null);
        setImageLoading(false);
      }
    };
    fetchImage();
  }, [tokenAddress]);

  if (!tokenInfo) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-surface rounded w-3/4"></div>
          <div className="h-4 bg-surface rounded w-1/2"></div>
          <div className="h-4 bg-surface rounded"></div>
        </div>
      </Card>
    );
  }

  const [name, symbol, , totalMembers, , , currentPrice] = tokenInfo;

  return (
    <Link href={`/token/${tokenAddress}`}>
      <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          {imageLoading ? (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-surface to-surface/50 animate-pulse"></div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-10 h-10 rounded-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">{symbol.charAt(0)}</span>
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-bold">{name}</h3>
            <p className="text-sm text-foreground/60">${symbol}</p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            Creator
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-foreground/60">Members</span>
            <span className="font-medium">{Number(totalMembers)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-foreground/60">Price</span>
            <span className="font-medium">{parseFloat(formatEther(currentPrice)).toFixed(6)} MATIC</span>
          </div>
        </div>

        <Button variant="outline" className="w-full" size="sm">
          <ExternalLink className="h-4 w-4 mr-2" />
          Manage Token
        </Button>
      </Card>
    </Link>
  );
}

// Card showing user's holdings in a token
function HoldingCard({
  tokenAddress,
  userAddress
}: {
  tokenAddress: string;
  userAddress: Address;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  const { data: tokenInfo } = useReadContract({
    address: tokenAddress as Address,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'getTokenInfo',
    query: {
      refetchInterval: 45000,
    },
  });

  const { data: userBalance } = useReadContract({
    address: tokenAddress as Address,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [userAddress],
    query: {
      refetchInterval: 45000,
    },
  });

  const { data: socialAccess } = useReadContract({
    address: tokenAddress as Address,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'checkSocialAccess',
    args: [userAddress],
    query: {
      refetchInterval: 45000,
    },
  });

  // Fetch image from Supabase
  useEffect(() => {
    const fetchImage = async () => {
      setImageLoading(true);
      try {
        const response = await fetch(`/api/tokens?address=${tokenAddress}`);
        if (response.ok) {
          const data = await response.json();
          const url = data.token?.image_url || null;
          setImageUrl(url);
          setImageLoading(false);
        } else {
          setImageUrl(null);
          setImageLoading(false);
        }
      } catch (error) {
        setImageUrl(null);
        setImageLoading(false);
      }
    };
    fetchImage();
  }, [tokenAddress]);

  // Don't show tokens user doesn't hold
  if (!userBalance || userBalance === BigInt(0)) {
    return null;
  }

  if (!tokenInfo) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-surface rounded w-3/4"></div>
          <div className="h-4 bg-surface rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  const [name, symbol, , , , , currentPrice] = tokenInfo;
  const balanceFormatted = formatEther(userBalance);
  const valueInMatic = (parseFloat(balanceFormatted) * parseFloat(formatEther(currentPrice)));

  return (
    <Link href={`/token/${tokenAddress}`}>
      <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex items-center gap-3 mb-4">
          {imageLoading ? (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-surface to-surface/50 animate-pulse"></div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-10 h-10 rounded-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">{symbol.charAt(0)}</span>
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-bold">{name}</h3>
            <p className="text-sm text-foreground/60">${symbol}</p>
          </div>
          {socialAccess && (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
              Chat
            </Badge>
          )}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-foreground/60">Balance</span>
            <span className="font-medium">{parseFloat(balanceFormatted).toFixed(2)} {symbol}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-foreground/60">Value</span>
            <span className="font-medium">{valueInMatic.toFixed(6)} MATIC</span>
          </div>
        </div>

        <Button variant="outline" className="w-full" size="sm">
          Trade
        </Button>
      </Card>
    </Link>
  );
}
