// Netlify Function - Initialize WhatsApp
// מאחר שאנחנו משתמשים ב-WhatsApp Web Link API, אין צורך באתחול

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
      success: true,
      status: 'ready',
      message: 'WhatsApp Web Link API is ready - no initialization needed'
    })
  }
}
