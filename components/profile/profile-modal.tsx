'use client';

import { useState, useEffect, useRef } from 'react';
import { UserProfile } from '@/types/profile';
import { ProfileAvatar } from './profile-avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Edit,
  Calendar,
  MessageCircle,
  Trophy,
  Users,
  TrendingUp,
  Shield
} from 'lucide-react';

interface ProfileModalProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  isOwnProfile?: boolean;
}

export function ProfileModal({ 
  profile, 
  isOpen, 
  onClose, 
  onEdit,
  isOwnProfile = false 
}: ProfileModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const joinedDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm pt-85">
      <div 
        ref={modalRef}
        className="bg-surface border border-border rounded-lg max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold">Profile</h2>
          <div className="flex items-center gap-2">
            {isOwnProfile && onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
            <Button 
              variant="ghost" 
              onClick={onClose} 
              className="h-8 w-8 p-0 hover:bg-gray-800 border border-gray-600 hover:border-gray-500"
            >
              <X className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6 space-y-6">
          {/* Avatar and Basic Info */}
          <div className="text-center space-y-4">
            <ProfileAvatar profile={profile} size="xl" className="mx-auto" />
            
            <div>
              <h3 className="text-2xl font-bold">
                {profile.displayName || formatAddress(profile.address)}
              </h3>

              <p className="text-sm text-foreground/50 font-mono">
                {formatAddress(profile.address)}
              </p>

              {profile.bio && (
                <p className="text-foreground/80 mt-2">{profile.bio}</p>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background rounded-lg p-4 text-center">
              <MessageCircle className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{profile.stats.chatCount}</div>
              <div className="text-sm text-foreground/70">Messages</div>
            </div>

            <div className="bg-background rounded-lg p-4 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{profile.stats.tokensHeld}</div>
              <div className="text-sm text-foreground/70">Tokens</div>
            </div>

            <div className="bg-background rounded-lg p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">{profile.stats.tokensCreated}</div>
              <div className="text-sm text-foreground/70">Created</div>
            </div>

            <div className="bg-background rounded-lg p-4 text-center">
              <Trophy className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{profile.stats.totalTrades}</div>
              <div className="text-sm text-foreground/70">Trades</div>
            </div>
          </div>

          {/* Badges */}
          {profile.badges.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Badges
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.badges.map((badge, index) => (
                  <Badge key={index} variant="outline">
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Member Since */}
          <div className="flex items-center gap-2 text-sm text-foreground/70">
            <Calendar className="h-4 w-4" />
            <span>Member since {joinedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}