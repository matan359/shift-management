// Netlify Function - Send WhatsApp Message via Web Link API
// יוצר קישור WhatsApp Web ושולח אותו (או פותח אותו)

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

    // Format phone number (remove +, spaces, etc.)
    let formattedNumber = phoneNumber.replace(/[^0-9]/g, '')
    
    // If starts with 0, replace with country code (972 for Israel)
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '972' + formattedNumber.substring(1)
    } else if (!formattedNumber.startsWith('972')) {
      formattedNumber = '972' + formattedNumber
    }
    
    // Create WhatsApp Web Link
    const encodedMessage = encodeURIComponent(message)
    const whatsappLink = `https://wa.me/${formattedNumber}?text=${encodedMessage}`
    
    // Save to Firestore for scheduled sending or return link
    // For now, we'll return the link - the frontend can open it or save it
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        whatsappLink: whatsappLink,
        phoneNumber: formattedNumber,
        message: 'WhatsApp link created. Use this link to send the message.'
      })
    }
  } catch (error) {
    console.error('Error creating WhatsApp link:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Failed to create WhatsApp link',
        details: error.message 
      })
    }
  }
}
