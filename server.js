const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  // Initialize Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: dev ? ['http://localhost:3000'] : [],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Join token-specific chat room
    socket.on('join-token-chat', ({ tokenAddress, userAddress, tokenValue }) => {
      console.log(`User ${userAddress} joining chat for token ${tokenAddress} with value $${tokenValue}`)
      
      // Check if user has $10+ worth of tokens
      if (tokenValue >= 10) {
        socket.join(`token-${tokenAddress}`)
        socket.to(`token-${tokenAddress}`).emit('user-joined', {
          userAddress,
          timestamp: new Date().toISOString(),
        })
        
        socket.emit('chat-access-granted', { tokenAddress })
        console.log(`Access granted for ${userAddress} to token ${tokenAddress}`)
      } else {
        socket.emit('chat-access-denied', { 
          tokenAddress, 
          required: 10, 
          current: tokenValue 
        })
        console.log(`Access denied for ${userAddress} - insufficient token value`)
      }
    })

    // Leave token chat room
    socket.on('leave-token-chat', ({ tokenAddress, userAddress }) => {
      socket.leave(`token-${tokenAddress}`)
      socket.to(`token-${tokenAddress}`).emit('user-left', {
        userAddress,
        timestamp: new Date().toISOString(),
      })
      console.log(`User ${userAddress} left chat for token ${tokenAddress}`)
    })

    // Handle chat messages
    socket.on('send-message', ({ tokenAddress, message, userAddress, userEns }) => {
      const messageData = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        message,
        userAddress,
        userEns: userEns || null,
        timestamp: new Date().toISOString(),
      }

      // Broadcast to all users in the token chat room
      socket.to(`token-${tokenAddress}`).emit('new-message', messageData)
      socket.emit('message-sent', messageData)
      
      console.log(`Message sent in token ${tokenAddress} by ${userAddress}:`, message)
    })

    // Handle typing indicators
    socket.on('typing-start', ({ tokenAddress, userAddress }) => {
      socket.to(`token-${tokenAddress}`).emit('user-typing', { userAddress })
    })

    socket.on('typing-stop', ({ tokenAddress, userAddress }) => {
      socket.to(`token-${tokenAddress}`).emit('user-stopped-typing', { userAddress })
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> Socket.io server initialized`)
    })
})