// Netlify Function - Send WhatsApp Message via Meta WhatsApp Cloud API
// Automatic message sending - no browser windows needed!

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

  // Use environment variables for Meta WhatsApp Cloud API credentials
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID

  if (!accessToken || !phoneNumberId) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Meta WhatsApp not configured. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in Netlify environment variables.'
      })
    }
  }

  try {
    const { phoneNumber, message } = JSON.parse(event.body || '{}')

    if (!phoneNumber || !message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Phone number and message are required'
        })
      }
    }

    // Format phone number for WhatsApp Cloud API (needs country code without +)
    let formattedNumber = phoneNumber.replace(/[^0-9]/g, '')
    
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '972' + formattedNumber.substring(1)
    } else if (!formattedNumber.startsWith('972')) {
      formattedNumber = '972' + formattedNumber
    }

    // Send via Meta WhatsApp Cloud API
    const apiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedNumber,
        type: 'text',
        text: {
          body: message
        }
      })
    })

    const data = await response.json()

    if (response.ok) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          messageId: data.messages?.[0]?.id || data.id,
          message: 'Message sent successfully via Meta WhatsApp Cloud API'
        })
      }
    } else {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          success: false,
          error: data.error?.message || 'Failed to send message',
          details: data
        })
      }
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to send message via Meta WhatsApp',
        details: error.message
      })
    }
  }
}


