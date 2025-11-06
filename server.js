import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server } from 'socket.io'
import { createPublicClient, http, formatEther } from 'viem'
import { polygonAmoy } from 'viem/chains'

// Social Token ABI (minimal for our needs)
const SOCIAL_TOKEN_ABI = [
  {
    inputs: [{ name: "_user", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "_user", type: "address" }],
    name: "checkSocialAccess",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "currentPrice",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
]

// Create blockchain client
const publicClient = createPublicClient({
  chain: polygonAmoy,
  transport: http()
})

// Helper function to check social access
async function checkTokenAccess(tokenAddress, userAddress) {
  try {
    // Check if user has social access via smart contract
    const hasAccess = await publicClient.readContract({
      address: tokenAddress,
      abi: SOCIAL_TOKEN_ABI,
      functionName: 'checkSocialAccess',
      args: [userAddress]
    })

    return { hasAccess, error: null }
  } catch (error) {
    console.error('Error checking token access:', error)
    return { hasAccess: false, error: error.message }
  }
}

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
    socket.on('join-token-chat', async ({ tokenAddress, userAddress }) => {
      console.log(`User ${userAddress} attempting to join chat for token ${tokenAddress}`)
      
      try {
        // Check social access via smart contract
        const { hasAccess, error } = await checkTokenAccess(tokenAddress, userAddress)
        
        if (hasAccess) {
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
            current: 0,
            reason: error || 'Insufficient token balance for social access'
          })
          console.log(`Access denied for ${userAddress} - ${error || 'insufficient token balance'}`)
        }
      } catch (error) {
        console.error('Error checking token access:', error)
        socket.emit('chat-access-denied', { 
          tokenAddress, 
          required: 10, 
          current: 0,
          reason: 'Unable to verify token balance'
        })
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
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
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