'use client';

import { UserProfile } from '@/types/profile';

interface ProfileAvatarProps {
  profile?: UserProfile | null;
  address?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
};

export function ProfileAvatar({ 
  profile, 
  address, 
  size = 'md', 
  className = '' 
}: ProfileAvatarProps) {
  const addr = address || profile?.address;
  const displayName = profile?.displayName || profile?.ensName;
  
  // Generate initials from display name or address
  const getInitials = (): string => {
    if (displayName) {
      return displayName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    
    if (addr) {
      return addr.slice(2, 4).toUpperCase();
    }
    
    return '??';
  };

  // Generate consistent color based on address
  const getBackgroundColor = (): string => {
    if (!addr) return 'bg-gray-500';
    
    const colors = [
      'bg-red-500',
      'bg-blue-500', 
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];
    
    const index = parseInt(addr.slice(-2), 16) % colors.length;
    return colors[index];
  };

  if (profile?.avatar) {
    return (
      <img
        src={profile.avatar}
        alt={displayName || 'Profile'}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`
        ${sizeClasses[size]} 
        ${getBackgroundColor()} 
        rounded-full 
        flex 
        items-center 
        justify-center 
        text-white 
        font-semibold
        ${className}
      `}
    >
      {getInitials()}
    </div>
  );
}