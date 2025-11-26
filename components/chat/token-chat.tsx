'use client';

import { useState, useRef, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useChat } from '@/hooks/use-chat';
import { useProfile } from '@/hooks/use-profile';
import { ProfileAvatar } from '@/components/profile/profile-avatar';
import { Button } from '@/components/ui/button';
import { Send, Users, Loader2, Heart, Reply, X } from 'lucide-react';
import { useAccount } from 'wagmi';
import { SOCIAL_TOKEN_ABI } from '@/lib/contracts';
import { Address } from 'viem';

interface TokenChatProps {
  tokenAddress: string;
  tokenSymbol?: string;
}

export function TokenChat({ tokenAddress, tokenSymbol: propSymbol }: TokenChatProps) {
  // Fetch actual token symbol
  const { data: tokenInfo } = useReadContract({
    address: tokenAddress as Address,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'getTokenInfo',
  });

  // Fetch total members count
  const { data: totalMembers } = useReadContract({
    address: tokenAddress as Address,
    abi: SOCIAL_TOKEN_ABI,
    functionName: 'totalMembers',
  });

  const tokenSymbol = tokenInfo ? tokenInfo[1] : propSymbol || 'TOKEN';
  const memberCount = totalMembers ? Number(totalMembers) : 0;
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; message: string; userAddress: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { profile, incrementChatCount, getDisplayName } = useProfile();
  const { address } = useAccount();

  const {
    messages,
    typingUsers,
    hasAccess,
    isConnecting,
    accessDeniedReason,
    sendMessage,
    startTyping,
    stopTyping,
    likeMessage,
    unlikeMessage,
  } = useChat({ tokenAddress });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    sendMessage(messageInput, replyingTo || undefined);
    setMessageInput('');
    setReplyingTo(null);
    handleStopTyping();

    // Update user's chat count
    incrementChatCount();
  };

  const handleLikeToggle = (message: { id: string; likes?: string[] }) => {
    if (!address) return;
    const likes = message.likes || [];
    const hasLiked = likes.includes(address);
    if (hasLiked) {
      unlikeMessage(message.id);
    } else {
      likeMessage(message.id);
    }
  };

  const handleReply = (message: { id: string; message: string; userAddress: string }) => {
    setReplyingTo({
      id: message.id,
      message: message.message,
      userAddress: message.userAddress,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      startTyping();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 1000);
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      stopTyping();
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center h-[700px] bg-surface rounded-lg border border-border">
        <div className="flex items-center gap-3 text-foreground/70">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Connecting to {tokenSymbol} chat...</span>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[700px] bg-surface rounded-lg border border-border p-6 text-center">
        <div className="text-destructive mb-4">
          <Users className="h-12 w-12 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Chat Access Restricted</h3>
        </div>
        <p className="text-foreground/70 max-w-md">
          {accessDeniedReason || 'You need at least $10 worth of tokens to access this chat.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Messages Panel */}
      <div className="flex flex-col h-[700px] bg-surface rounded-lg border border-border">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <h3 className="font-semibold">{tokenSymbol} Holders Chat</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground/70">
            <Users className="h-4 w-4" />
            <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-foreground/50 mt-8">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <p>Welcome to the {tokenSymbol} community chat!</p>
              <p className="text-sm">Start the conversation...</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="group">
                <div className="flex items-start gap-3">
                  <ProfileAvatar address={message.userAddress} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {getDisplayName(message.userAddress)}
                      </span>
                      <span className="text-xs text-foreground/50">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    {/* Reply context */}
                    {message.replyTo && (
                      <div className="mb-1 pl-2 border-l-2 border-primary/50 text-xs text-foreground/60">
                        <span className="font-medium">{getDisplayName(message.replyTo.userAddress)}</span>
                        <p className="truncate">{message.replyTo.message}</p>
                      </div>
                    )}
                    <p className="text-foreground/90 break-words">{message.message}</p>
                    {/* Like and Reply buttons */}
                    <div className="flex items-center gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleLikeToggle(message)}
                        className={`flex items-center gap-1 text-xs ${
                          address && message.likes?.includes(address)
                            ? 'text-red-500'
                            : 'text-foreground/50 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`h-3 w-3 ${address && message.likes?.includes(address) ? 'fill-current' : ''}`} />
                        {message.likes?.length > 0 && <span>{message.likes.length}</span>}
                      </button>
                      <button
                        onClick={() => handleReply(message)}
                        className="flex items-center gap-1 text-xs text-foreground/50 hover:text-primary"
                      >
                        <Reply className="h-3 w-3" />
                        <span>Reply</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Typing Indicators */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-foreground/50">
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span>
                {typingUsers.length === 1
                  ? `${getDisplayName(typingUsers[0])} is typing...`
                  : `${typingUsers.length} people are typing...`
                }
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Send Message Panel */}
      <div className="bg-surface rounded-lg border border-border p-4">
        <h4 className="text-sm font-medium mb-3">Send Message</h4>
        {/* Reply indicator */}
        {replyingTo && (
          <div className="mb-3 p-2 bg-background rounded-md flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <span className="text-xs text-foreground/60">Replying to </span>
              <span className="text-xs font-medium">{getDisplayName(replyingTo.userAddress)}</span>
              <p className="text-xs text-foreground/50 truncate">{replyingTo.message}</p>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="ml-2 text-foreground/50 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex gap-3">
          <input
            type="text"
            value={messageInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={replyingTo ? `Reply to ${getDisplayName(replyingTo.userAddress)}...` : `Message ${tokenSymbol} holders...`}
            className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            maxLength={500}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            size="sm"
            className="px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-xs text-foreground/50 mt-2">
          Press Enter to send • {messageInput.length}/500 characters
        </div>
      </div>
    </div>
  );
}