// Netlify Function - Send Bulk WhatsApp Messages via Meta WhatsApp Cloud API
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
    const { recipients } = JSON.parse(event.body || '{}')

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Recipients array is required'
        })
      }
    }

    const results = []
    const apiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`

    for (const recipient of recipients) {
      const { phoneNumber, message } = recipient

      if (!phoneNumber || !message) {
        results.push({
          phoneNumber: phoneNumber || 'unknown',
          success: false,
          error: 'Missing phone or message'
        })
        continue
      }

      try {
        // Format phone number
        let formattedNumber = phoneNumber.replace(/[^0-9]/g, '')

        if (formattedNumber.startsWith('0')) {
          formattedNumber = '972' + formattedNumber.substring(1)
        } else if (!formattedNumber.startsWith('972')) {
          formattedNumber = '972' + formattedNumber
        }

        // Send via Meta WhatsApp Cloud API
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
          results.push({
            phoneNumber: formattedNumber,
            success: true,
            messageId: data.messages?.[0]?.id || data.id
          })
        } else {
          results.push({
            phoneNumber: formattedNumber,
            success: false,
            error: data.error?.message || 'Failed to send'
          })
        }

        // Small delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Error sending to ${phoneNumber}:`, error)
        results.push({
          phoneNumber: phoneNumber,
          success: false,
          error: error.message
        })
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        results,
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      })
    }
  } catch (error) {
    console.error('Error sending bulk WhatsApp messages:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to send messages via Meta WhatsApp',
        details: error.message
      })
    }
  }
}

