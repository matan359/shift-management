// Netlify Function - Initialize WhatsApp Connection
// This function triggers the WhatsApp server to start initialization

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  try {
    // Get WhatsApp server URL from environment variable
    const WHATSAPP_SERVER_URL = process.env.WHATSAPP_SERVER_URL
    
    if (!WHATSAPP_SERVER_URL || WHATSAPP_SERVER_URL === 'https://your-whatsapp-server.railway.app') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'WhatsApp server URL not configured',
          message: 'Please set WHATSAPP_SERVER_URL in Netlify environment variables.'
        })
      }
    }
    
    // Try to trigger initialization (if server has this endpoint)
    // Otherwise, just check status which should trigger initialization
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/whatsapp/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`)
    }

    const data = await response.json()

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        status: data.status,
        message: data.status === 'qr' ? 'QR Code should appear soon' : data.message
      })
    }
  } catch (error) {
    console.error('Error initializing WhatsApp:', error)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Failed to initialize WhatsApp connection',
        message: error.message || 'Please ensure the WhatsApp server is running.'
      })
    }
  }
}

