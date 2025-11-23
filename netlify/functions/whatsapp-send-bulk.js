// Netlify Function - Send Bulk WhatsApp Messages via Web Link API
// יוצר קישורי WhatsApp Web לכל הנמענים

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
        
        // Create WhatsApp Web Link
        const encodedMessage = encodeURIComponent(message)
        const whatsappLink = `https://wa.me/${formattedNumber}?text=${encodedMessage}`
        
        results.push({ 
          phoneNumber: formattedNumber, 
          success: true, 
          whatsappLink: whatsappLink
        })
      } catch (error) {
        console.error(`Error creating link for ${phoneNumber}:`, error)
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
        failed: results.filter(r => !r.success).length,
        message: 'WhatsApp links created. Use these links to send messages.'
      })
    }
  } catch (error) {
    console.error('Error creating WhatsApp links:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Failed to create WhatsApp links',
        details: error.message 
      })
    }
  }
}
