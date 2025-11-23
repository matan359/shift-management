// Netlify Function - Initialize WhatsApp
// WhatsApp Cloud API doesn't need initialization - it uses API tokens

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
        success: false,
        status: 'not_configured',
        message: 'WhatsApp Cloud API not configured. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in Netlify environment variables. See WHATSAPP_CLOUD_API_SETUP.md for instructions.'
      })
    }
  }

  // WhatsApp Cloud API is always ready if configured
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      status: 'ready',
      message: 'WhatsApp Cloud API is configured and ready'
    })
  }
}
