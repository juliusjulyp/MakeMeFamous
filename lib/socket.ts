'use client';

import { io, Socket } from 'socket.io-client';

class SocketManager {
  private socket: Socket | null = null;
  private static instance: SocketManager;

  private constructor() {}

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  connect(): Socket {
    if (!this.socket) {
      this.socket = io('http://localhost:3000', {
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('Connected to Socket.io server:', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from Socket.io server');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.io connection error:', error);
      });
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketManager = SocketManager.getInstance();