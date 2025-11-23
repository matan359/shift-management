// Netlify Function - Initialize WhatsApp
// Proxy to WhatsApp Web.js server to initialize connection

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
    const response = await fetch(`${serverUrl}/api/whatsapp/init`, {
      method: 'POST',
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
    console.error('Error initializing WhatsApp:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        status: 'error',
        message: 'Failed to initialize WhatsApp server.',
        error: error.message
      })
    }
  }
}
