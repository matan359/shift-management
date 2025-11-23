// Netlify Function - Initialize WhatsApp
// WhatsApp Web Link API is always ready - no initialization needed

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

  // Always ready
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      status: 'ready',
      message: 'WhatsApp Web Link API is ready - no initialization needed'
    })
  }
}
