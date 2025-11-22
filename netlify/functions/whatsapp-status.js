// Netlify Function - WhatsApp Status Proxy
// This function proxies requests to the WhatsApp server

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
          message: 'WhatsApp server URL not configured. Please set WHATSAPP_SERVER_URL in Netlify environment variables.',
          error: 'Server not configured'
        })
      }
    }
    
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/whatsapp/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
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
    console.error('Error proxying WhatsApp status:', error)
    return {
      statusCode: 200, // Return 200 so frontend can handle it
      headers,
      body: JSON.stringify({ 
        status: 'disconnected',
        error: 'Failed to connect to WhatsApp server',
        message: error.message || 'Please ensure the WhatsApp server is running on Railway and WHATSAPP_SERVER_URL is set correctly in Netlify environment variables.'
      })
    }
  }
}

