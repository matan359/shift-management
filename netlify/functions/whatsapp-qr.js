// Netlify Function - WhatsApp QR Code
// WhatsApp Cloud API doesn't need QR code - it uses API tokens

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

  // WhatsApp Cloud API doesn't use QR codes - it uses API tokens
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: 'ready',
      message: 'WhatsApp Cloud API uses API tokens, not QR codes. Please configure your access token in Netlify environment variables.'
    })
  }
}
