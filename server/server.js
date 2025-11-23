import express from 'express'
import cors from 'cors'
import pkg from 'whatsapp-web.js'
const { Client, LocalAuth } = pkg
import qrcode from 'qrcode-terminal'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, mkdirSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Create .wwebjs_auth directory if it doesn't exist
const authDir = join(__dirname, '.wwebjs_auth')
if (!existsSync(authDir)) {
  mkdirSync(authDir, { recursive: true })
}

// Initialize WhatsApp client
let client = null
let qrCode = null
let isReady = false
let clientStatus = 'disconnected' // disconnected, connecting, qr, ready

function initializeWhatsApp() {
  if (client && isReady) {
    return // Already initialized
  }

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: authDir
    }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  })

  client.on('qr', async (qr) => {
    console.log('QR Code received, scan it!')
    qrCode = qr
    clientStatus = 'qr'
    
    // Generate QR code for terminal
    qrcode.generate(qr, { small: true })
    
    // Also generate QR code as data URL for web
    try {
      const QRCode = await import('qrcode')
      qrCodeDataUrl = await QRCode.default.toDataURL(qr)
      console.log('QR Code data URL generated')
    } catch (err) {
      console.error('Error generating QR code data URL:', err)
    }
  })

  client.on('ready', () => {
    console.log('WhatsApp Client is ready!')
    isReady = true
    clientStatus = 'ready'
    qrCode = null
    qrCodeDataUrl = null
  })

  client.on('authenticated', () => {
    console.log('WhatsApp Client authenticated!')
    clientStatus = 'authenticated'
  })

  client.on('auth_failure', (msg) => {
    console.error('Authentication failure:', msg)
    clientStatus = 'auth_failure'
    isReady = false
  })

  client.on('disconnected', (reason) => {
    console.log('WhatsApp Client disconnected:', reason)
    isReady = false
    clientStatus = 'disconnected'
    
    // Try to reconnect
    if (reason === 'NAVIGATION') {
      console.log('Reconnecting...')
      initializeWhatsApp()
    }
  })

  client.initialize()
}

let qrCodeDataUrl = null

// Routes

// Initialize/Reinitialize WhatsApp connection
app.post('/api/whatsapp/init', (req, res) => {
  if (client && isReady) {
    return res.json({ status: 'ready', message: 'Already connected' })
  }
  
  // Reset and reinitialize
  if (client) {
    client.destroy()
    client = null
  }
  
  clientStatus = 'connecting'
  initializeWhatsApp()
  
  res.json({ 
    status: 'connecting', 
    message: 'Initializing WhatsApp connection...' 
  })
})

// Get QR code for scanning
app.get('/api/whatsapp/qr', async (req, res) => {
  if (clientStatus === 'qr' && qrCode) {
    try {
      // If we already have the data URL, return it
      if (qrCodeDataUrl) {
        return res.json({ qr: qrCodeDataUrl, status: 'qr' })
      }
      
      // Otherwise, generate it
      const QRCode = await import('qrcode')
      const url = await QRCode.default.toDataURL(qrCode)
      qrCodeDataUrl = url // Cache it
      res.json({ qr: url, status: 'qr' })
    } catch (err) {
      console.error('Error generating QR code:', err)
      res.status(500).json({ error: 'Failed to generate QR code' })
    }
  } else if (clientStatus === 'ready' || isReady) {
    res.json({ status: 'ready', message: 'Already connected' })
  } else if (clientStatus === 'connecting') {
    res.json({ status: 'connecting', message: 'Connecting...' })
  } else {
    res.json({ status: 'disconnected', message: 'Not connected' })
  }
})

// Get connection status
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    status: clientStatus,
    isReady: isReady,
    message: isReady ? 'Connected and ready' : 'Not connected'
  })
})

// Send message
app.post('/api/whatsapp/send', async (req, res) => {
  if (!isReady || !client) {
    return res.status(400).json({ 
      error: 'WhatsApp not connected. Please scan QR code first.' 
    })
  }

  const { phoneNumber, message } = req.body

  if (!phoneNumber || !message) {
    return res.status(400).json({ error: 'Phone number and message are required' })
  }

  try {
    // Format phone number (remove +, spaces, etc.)
    let formattedNumber = phoneNumber.replace(/[^0-9]/g, '')
    
    // If starts with 0, replace with country code (972 for Israel)
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '972' + formattedNumber.substring(1)
    } else if (!formattedNumber.startsWith('972')) {
      formattedNumber = '972' + formattedNumber
    }
    
    // Add @c.us suffix for WhatsApp
    const chatId = formattedNumber + '@c.us'
    
    // Send message
    const result = await client.sendMessage(chatId, message)
    
    res.json({ 
      success: true, 
      messageId: result.id._serialized,
      message: 'Message sent successfully' 
    })
  } catch (error) {
    console.error('Error sending message:', error)
    res.status(500).json({ 
      error: 'Failed to send message', 
      details: error.message 
    })
  }
})

// Send message to multiple recipients
app.post('/api/whatsapp/send-bulk', async (req, res) => {
  if (!isReady || !client) {
    return res.status(400).json({ 
      error: 'WhatsApp not connected. Please scan QR code first.' 
    })
  }

  const { recipients } = req.body // Array of {phoneNumber, message}

  if (!Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'Recipients array is required' })
  }

  const results = []

  for (const recipient of recipients) {
    const { phoneNumber, message } = recipient
    
    if (!phoneNumber || !message) {
      results.push({ phoneNumber, success: false, error: 'Missing phone or message' })
      continue
    }

    try {
      let formattedNumber = phoneNumber.replace(/[^0-9]/g, '')
      
      if (formattedNumber.startsWith('0')) {
        formattedNumber = '972' + formattedNumber.substring(1)
      } else if (!formattedNumber.startsWith('972')) {
        formattedNumber = '972' + formattedNumber
      }
      
      const chatId = formattedNumber + '@c.us'
      const result = await client.sendMessage(chatId, message)
      
      results.push({ 
        phoneNumber, 
        success: true, 
        messageId: result.id._serialized 
      })
      
      // Small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`Error sending to ${phoneNumber}:`, error)
      results.push({ 
        phoneNumber, 
        success: false, 
        error: error.message 
      })
    }
  }

  res.json({ 
    success: true, 
    results,
    sent: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length
  })
})

// Disconnect WhatsApp
app.post('/api/whatsapp/disconnect', async (req, res) => {
  if (client) {
    try {
      await client.logout()
      isReady = false
      clientStatus = 'disconnected'
      res.json({ success: true, message: 'Disconnected successfully' })
    } catch (error) {
      res.status(500).json({ error: 'Failed to disconnect', details: error.message })
    }
  } else {
    res.json({ success: true, message: 'Already disconnected' })
  }
})

// Initialize WhatsApp on server start
initializeWhatsApp()

// Listen on all interfaces (important for Railway/Render)
// Railway uses PORT environment variable, default to 3001 for local
const HOST = process.env.HOST || '0.0.0.0'
const SERVER_PORT = process.env.PORT || PORT || 3001

app.listen(SERVER_PORT, HOST, () => {
  console.log(`WhatsApp Server running on http://${HOST}:${SERVER_PORT}`)
  console.log('Waiting for QR code...')
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`Port: ${SERVER_PORT}`)
})

