// Netlify Function - WhatsApp Send Message Proxy
// This function proxies send message requests to the WhatsApp server

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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    // Get WhatsApp server URL from environment variable
    const WHATSAPP_SERVER_URL = process.env.WHATSAPP_SERVER_URL || 'https://your-whatsapp-server.railway.app'
    
    const body = JSON.parse(event.body)
    
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/whatsapp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify(data)
    }
  } catch (error) {
    console.error('Error proxying WhatsApp send:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to send message',
        details: error.message
      })
    }
  }
}

