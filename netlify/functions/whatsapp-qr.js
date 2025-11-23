// Netlify Function - WhatsApp QR Code
// Proxy to WhatsApp Web.js server to get QR code

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
    const response = await fetch(`${serverUrl}/api/whatsapp/qr`)
    const data = await response.json()
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    }
  } catch (error) {
    console.error('Error getting QR code:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'error',
        message: 'Failed to get QR code from WhatsApp server.',
        error: error.message
      })
    }
  }
}
