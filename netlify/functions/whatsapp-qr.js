// Netlify Function - WhatsApp QR Code Proxy
// This function proxies QR code requests to the WhatsApp server

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
          status: 'disconnected',
          error: 'Server not configured',
          message: 'WhatsApp server URL not configured. Please set WHATSAPP_SERVER_URL in Netlify environment variables.'
        })
      }
    }
    
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/whatsapp/qr`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`)
    }

    const data = await response.json()

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    }
  } catch (error) {
    console.error('Error proxying WhatsApp QR:', error)
    return {
      statusCode: 200, // Return 200 so frontend can handle it
      headers,
      body: JSON.stringify({ 
        status: 'disconnected',
        error: 'Failed to get QR code',
        message: error.message || 'Please ensure the WhatsApp server is running on Railway.'
      })
    }
  }
}

