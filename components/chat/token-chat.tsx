'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/use-chat';
import { useProfile } from '@/hooks/use-profile';
import { ProfileAvatar } from '@/components/profile/profile-avatar';
import { Button } from '@/components/ui/button';
import { Send, Users, Loader2 } from 'lucide-react';

interface TokenChatProps {
  tokenAddress: string;
  tokenSymbol: string;
}

export function TokenChat({ tokenAddress, tokenSymbol }: TokenChatProps) {
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { profile, incrementChatCount, getDisplayName } = useProfile();

  const {
    messages,
    onlineUsers,
    typingUsers,
    hasAccess,
    isConnecting,
    accessDeniedReason,
    sendMessage,
    startTyping,
    stopTyping,
  } = useChat({ tokenAddress });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    sendMessage(messageInput);
    setMessageInput('');
    handleStopTyping();
    
    // Update user's chat count
    incrementChatCount();
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
      <div className="flex items-center justify-center h-96 bg-surface rounded-lg border border-border">
        <div className="flex items-center gap-3 text-foreground/70">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Connecting to {tokenSymbol} chat...</span>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-surface rounded-lg border border-border p-6 text-center">
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
    <div className="flex flex-col h-96 bg-surface rounded-lg border border-border">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <h3 className="font-semibold">{tokenSymbol} Holders Chat</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-foreground/70">
          <Users className="h-4 w-4" />
          <span>{onlineUsers.length} online</span>
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
                  <p className="text-foreground/90 break-words">{message.message}</p>
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

      {/* Message Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-3">
          <input
            type="text"
            value={messageInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${tokenSymbol} holders...`}
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