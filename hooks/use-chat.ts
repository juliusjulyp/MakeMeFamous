'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { socketManager } from '@/lib/socket';
import type { Socket } from 'socket.io-client';

export interface ChatMessage {
  id: string;
  message: string;
  userAddress: string;
  userEns?: string | null;
  timestamp: string;
  likes: string[]; // Array of user addresses who liked
  replyTo?: {
    id: string;
    message: string;
    userAddress: string;
  };
}

export interface ChatUser {
  userAddress: string;
  userEns?: string | null;
}

interface UseChatProps {
  tokenAddress: string;
}

export function useChat({ tokenAddress }: UseChatProps) {
  const { address } = useAccount();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [accessDeniedReason, setAccessDeniedReason] = useState<string | null>(null);

  // Connect to socket and join token chat
  useEffect(() => {
    if (!address || !tokenAddress) return;

    setIsConnecting(true);
    const socketInstance = socketManager.connect();
    setSocket(socketInstance);

    // Join token chat room
    socketInstance.emit('join-token-chat', {
      tokenAddress,
      userAddress: address,
    });

    // Listen for access granted
    socketInstance.on('chat-access-granted', ({ tokenAddress: grantedToken }) => {
      if (grantedToken === tokenAddress) {
        setHasAccess(true);
        setAccessDeniedReason(null);
        setIsConnecting(false);
      }
    });

    // Listen for access denied
    socketInstance.on('chat-access-denied', ({ required, current, reason }) => {
      setHasAccess(false);
      setAccessDeniedReason(reason || `Minimum $${required} token value required`);
      setIsConnecting(false);
    });

    // Listen for new messages
    socketInstance.on('new-message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for message sent confirmation
    socketInstance.on('message-sent', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for users joining/leaving
    socketInstance.on('user-joined', ({ userAddress }: { userAddress: string }) => {
      setOnlineUsers(prev => {
        if (!prev.find(user => user.userAddress === userAddress)) {
          return [...prev, { userAddress }];
        }
        return prev;
      });
    });

    socketInstance.on('user-left', ({ userAddress }: { userAddress: string }) => {
      setOnlineUsers(prev => prev.filter(user => user.userAddress !== userAddress));
    });

    // Listen for typing indicators
    socketInstance.on('user-typing', ({ userAddress }: { userAddress: string }) => {
      setTypingUsers(prev => {
        if (!prev.includes(userAddress)) {
          return [...prev, userAddress];
        }
        return prev;
      });
    });

    socketInstance.on('user-stopped-typing', ({ userAddress }: { userAddress: string }) => {
      setTypingUsers(prev => prev.filter(addr => addr !== userAddress));
    });

    // Listen for message likes
    socketInstance.on('message-liked', ({ messageId, userAddress: likerAddress }: { messageId: string; userAddress: string }) => {
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const likes = msg.likes || [];
          if (!likes.includes(likerAddress)) {
            return { ...msg, likes: [...likes, likerAddress] };
          }
        }
        return msg;
      }));
    });

    // Listen for message unlikes
    socketInstance.on('message-unliked', ({ messageId, userAddress: unlikerAddress }: { messageId: string; userAddress: string }) => {
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          return { ...msg, likes: (msg.likes || []).filter(addr => addr !== unlikerAddress) };
        }
        return msg;
      }));
    });

    return () => {
      socketInstance.emit('leave-token-chat', {
        tokenAddress,
        userAddress: address,
      });
      socketInstance.off('chat-access-granted');
      socketInstance.off('chat-access-denied');
      socketInstance.off('new-message');
      socketInstance.off('message-sent');
      socketInstance.off('user-joined');
      socketInstance.off('user-left');
      socketInstance.off('user-typing');
      socketInstance.off('user-stopped-typing');
      socketInstance.off('message-liked');
      socketInstance.off('message-unliked');
    };
  }, [address, tokenAddress]);

  // Send message function (with optional reply)
  const sendMessage = useCallback((message: string, replyTo?: { id: string; message: string; userAddress: string }) => {
    if (!socket || !address || !hasAccess || !message.trim()) return;

    socket.emit('send-message', {
      tokenAddress,
      message: message.trim(),
      userAddress: address,
      userEns: null, // TODO: Add ENS resolution
      replyTo,
    });
  }, [socket, address, hasAccess, tokenAddress]);

  // Like message function
  const likeMessage = useCallback((messageId: string) => {
    if (!socket || !address || !hasAccess) return;
    socket.emit('like-message', { tokenAddress, messageId, userAddress: address });
  }, [socket, address, hasAccess, tokenAddress]);

  // Unlike message function
  const unlikeMessage = useCallback((messageId: string) => {
    if (!socket || !address || !hasAccess) return;
    socket.emit('unlike-message', { tokenAddress, messageId, userAddress: address });
  }, [socket, address, hasAccess, tokenAddress]);

  // Typing indicator functions
  const startTyping = useCallback(() => {
    if (!socket || !address || !hasAccess) return;
    socket.emit('typing-start', { tokenAddress, userAddress: address });
  }, [socket, address, hasAccess, tokenAddress]);

  const stopTyping = useCallback(() => {
    if (!socket || !address || !hasAccess) return;
    socket.emit('typing-stop', { tokenAddress, userAddress: address });
  }, [socket, address, hasAccess, tokenAddress]);

  return {
    messages,
    onlineUsers,
    typingUsers,
    hasAccess,
    isConnecting,
    accessDeniedReason,
    sendMessage,
    startTyping,
    stopTyping,
    likeMessage,
    unlikeMessage,
  };
}