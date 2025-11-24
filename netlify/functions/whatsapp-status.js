// Netlify Function - WhatsApp Status (Twilio)
// Check if Twilio is configured

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

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'not_configured',
        isReady: false,
        message: 'Twilio not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER in Netlify environment variables. See TWILIO_SETUP.md for instructions.'
      })
    }
  }

  // Twilio is configured and ready
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: 'ready',
      isReady: true,
      message: 'Twilio WhatsApp API is configured and ready for automatic message sending'
    })
  }
}




