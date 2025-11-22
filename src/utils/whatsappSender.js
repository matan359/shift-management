// WhatsApp/SMS Message Sender
// This uses WhatsApp Business API or Twilio for sending messages
// For development, you can use Twilio or WhatsApp Business API

export async function sendDailyShiftReminder(employee, shift, tasks) {
  try {
    const phoneNumber = employee.phoneNumber
    if (!phoneNumber) {
      console.warn(`No phone number for employee ${employee.fullName}`)
      return false
    }

    // Format message in Hebrew
    const message = formatShiftMessage(employee, shift, tasks)
    
    // Send via WhatsApp/Twilio
    // Option 1: Using Twilio WhatsApp API
    const sent = await sendViaTwilio(phoneNumber, message)
    
    // Option 2: Using WhatsApp Business API
    // const sent = await sendViaWhatsAppAPI(phoneNumber, message)
    
    return sent
  } catch (error) {
    console.error('Error sending message:', error)
    return false
  }
}

function formatShiftMessage(employee, shift, tasks) {
  const shiftDate = new Date(shift.date).toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  let message = `שלום ${employee.fullName},\n\n`
  message += `היום (${shiftDate}) את/ה במשמרת ${shift.shiftType}.\n`
  message += `שעות: ${shift.startTime} - ${shift.endTime}\n\n`

  if (tasks && tasks.length > 0) {
    message += `משימות היום:\n`
    tasks.forEach((task, index) => {
      message += `${index + 1}. ${task.title}\n`
      if (task.description) {
        message += `   ${task.description}\n`
      }
    })
  } else {
    message += `אין משימות מיוחדות היום.\n`
  }

  message += `\nיום נעים!`
  return message
}

// Twilio WhatsApp Integration
async function sendViaTwilio(phoneNumber, message) {
  // You need to install: npm install twilio
  // And set environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER
  
  try {
    const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID
    const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN
    const fromNumber = import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'

    if (!accountSid || !authToken) {
      console.warn('Twilio credentials not configured')
      return false
    }

    // Format phone number (add country code if needed)
    const formattedPhone = formatPhoneNumber(phoneNumber)
    
    const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/Messages.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(accountSid + ':' + authToken)
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: `whatsapp:${formattedPhone}`,
        Body: message
      })
    })

    if (response.ok) {
      console.log('Message sent successfully')
      return true
    } else {
      const error = await response.json()
      console.error('Twilio error:', error)
      return false
    }
  } catch (error) {
    console.error('Error sending via Twilio:', error)
    return false
  }
}

// WhatsApp Business API Integration (alternative)
async function sendViaWhatsAppAPI(phoneNumber, message) {
  // This requires WhatsApp Business API setup
  // You'll need access token and phone number ID from Meta
  
  const accessToken = import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID

  if (!accessToken || !phoneNumberId) {
    console.warn('WhatsApp API credentials not configured')
    return false
  }

  try {
    const formattedPhone = formatPhoneNumber(phoneNumber)
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: { body: message }
        })
      }
    )

    if (response.ok) {
      console.log('WhatsApp message sent successfully')
      return true
    } else {
      const error = await response.json()
      console.error('WhatsApp API error:', error)
      return false
    }
  } catch (error) {
    console.error('Error sending via WhatsApp API:', error)
    return false
  }
}

function formatPhoneNumber(phone) {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '')
  
  // If starts with 0, replace with country code (972 for Israel)
  if (cleaned.startsWith('0')) {
    cleaned = '972' + cleaned.substring(1)
  }
  
  // If doesn't start with country code, add it
  if (!cleaned.startsWith('972')) {
    cleaned = '972' + cleaned
  }
  
  return cleaned
}

// Schedule daily messages (should run on server at 4:00 AM)
export async function scheduleDailyMessages(db, appId, userId) {
  // This function should be called by a cron job or scheduled task
  // For client-side, you can use a service like Vercel Cron, Firebase Cloud Functions, etc.
  
  try {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    // Get all shifts for today
    const { collection, query, where, getDocs } = await import('firebase/firestore')
    const shiftsRef = collection(db, `artifacts/${appId}/users/${userId}/assignedShifts`)
    const shiftsQuery = query(shiftsRef, where('date', '==', todayStr))
    const shiftsSnapshot = await getDocs(shiftsQuery)
    
    // Get all employees
    const employeesRef = collection(db, `artifacts/${appId}/users/${userId}/employees`)
    const employeesSnapshot = await getDocs(employeesRef)
    const employees = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    // Get tasks for today
    const dayOfWeek = today.getDay() // 0 = Sunday, 6 = Saturday
    const tasksRef = collection(db, `artifacts/${appId}/users/${userId}/tasks`)
    const tasksQuery = query(tasksRef, where('dayOfWeek', '==', dayOfWeek))
    const tasksSnapshot = await getDocs(tasksQuery)
    const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    // Send messages to each employee with a shift today
    const results = []
    for (const shiftDoc of shiftsSnapshot.docs) {
      const shift = { id: shiftDoc.id, ...shiftDoc.data() }
      const employee = employees.find(emp => emp.id === shift.employeeId)
      
      if (employee && employee.phoneNumber) {
        const sent = await sendDailyShiftReminder(employee, shift, tasks)
        results.push({
          employee: employee.fullName,
          shift: shift.date,
          sent
        })
      }
    }
    
    return results
  } catch (error) {
    console.error('Error scheduling daily messages:', error)
    throw error
  }
}

