// Netlify Function - WhatsApp Send Bulk Messages Proxy

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  }

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
    const WHATSAPP_SERVER_URL = process.env.WHATSAPP_SERVER_URL || 'https://your-whatsapp-server.railway.app'
    const body = JSON.parse(event.body)
    
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/whatsapp/send-bulk`, {
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
    console.error('Error proxying WhatsApp send-bulk:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to send messages',
        details: error.message
      })
    }
  }
}

