// Netlify Function - Send Bulk WhatsApp Messages via Twilio
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

  // Use environment variables for Twilio credentials
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+19714591103'

  if (!accountSid || !authToken) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Twilio not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER in Netlify environment variables.'
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
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

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

        // Send via Twilio WhatsApp API
        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
          },
          body: new URLSearchParams({
            From: fromNumber,
            To: `whatsapp:+${formattedNumber}`,
            Body: message
          })
        })

        const data = await response.json()

        if (response.ok) {
          results.push({
            phoneNumber: formattedNumber,
            success: true,
            messageId: data.sid
          })
        } else {
          results.push({
            phoneNumber: formattedNumber,
            success: false,
            error: data.message || 'Failed to send'
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
        error: 'Failed to send messages via Twilio',
        details: error.message
      })
    }
  }
}
