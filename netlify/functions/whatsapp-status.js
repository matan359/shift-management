// Netlify Function - WhatsApp Status
// Proxy to WhatsApp Web.js server

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

  const serverUrl = process.env.WHATSAPP_SERVER_URL || 'http://localhost:3001'
  
  try {
    const response = await fetch(`${serverUrl}/api/whatsapp/status`)
    const data = await response.json()
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    }
  } catch (error) {
    console.error('Error checking WhatsApp status:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'error',
        isReady: false,
        message: 'Failed to connect to WhatsApp server. Make sure the server is running.',
        error: error.message
      })
    }
  }
}
