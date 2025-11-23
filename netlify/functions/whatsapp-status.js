// Netlify Function - WhatsApp Status
// WhatsApp Web Link API is always ready - no connection needed

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

  // WhatsApp Web Link API is always ready
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: 'ready',
      isReady: true,
      message: 'WhatsApp Web Link API is ready - no connection needed'
    })
  }
}
