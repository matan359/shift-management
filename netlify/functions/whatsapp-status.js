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
    const WHATSAPP_SERVER_URL = process.env.WHATSAPP_SERVER_URL || 'https://your-whatsapp-server.railway.app'
    
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/whatsapp/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    }
  } catch (error) {
    console.error('Error proxying WhatsApp status:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to connect to WhatsApp server',
        status: 'disconnected'
      })
    }
  }
}

