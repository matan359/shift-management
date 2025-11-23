// Netlify Function - WhatsApp QR Code
// מאחר שאנחנו משתמשים ב-WhatsApp Web Link API, אין צורך ב-QR Code
// אבל נשמור את זה למקרה שמישהו מחפש את זה

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

  // No QR code needed for WhatsApp Web Link API
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: 'ready',
      message: 'No QR code needed - using WhatsApp Web Link API'
    })
  }
}
