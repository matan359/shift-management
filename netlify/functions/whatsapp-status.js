// Netlify Function - WhatsApp Status
// Check if WhatsApp Cloud API is configured

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

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!accessToken || !phoneNumberId) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'not_configured',
        isReady: false,
        message: 'WhatsApp Cloud API not configured. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in Netlify environment variables.'
      })
    }
  }

  // Verify token is valid by checking phone number
  try {
    const apiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}`
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (response.ok) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'ready',
          isReady: true,
          message: 'WhatsApp Cloud API is configured and ready'
        })
      }
    } else {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'error',
          isReady: false,
          message: 'WhatsApp Cloud API token is invalid. Please check your access token.'
        })
      }
    }
  } catch (error) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'ready',
        isReady: true,
        message: 'WhatsApp Cloud API is configured'
      })
    }
  }
}
