// Netlify Scheduled Function - שולח הודעות WhatsApp אוטומטית כל יום
// זה ירוץ אוטומטית לפי ה-schedule ב-netlify.toml

const { initializeApp } = require('firebase/app')
const { getFirestore, collection, query, where, getDocs, doc, getDoc } = require('firebase/firestore')

// Firebase config - צריך להיות מוגדר ב-environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
}

const WHATSAPP_SERVER_URL = process.env.WHATSAPP_SERVER_URL

exports.handler = async (event, context) => {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig)
    const db = getFirestore(app)
    
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const dayOfWeek = new Date().getDay() // 0 = Sunday, 6 = Saturday
    
    // Get all managers/users who have auto-send enabled
    // Note: This is a simplified version - you might need to adjust based on your data structure
    const appId = process.env.FIREBASE_APP_ID || 'default'
    
    // For each user, check if auto-send is enabled
    // This is a placeholder - you'll need to implement the actual logic to get all users
    // and check their settings
    
    // Example: Get shifts for today
    const shiftsRef = collection(db, `artifacts/${appId}/users/{userId}/assignedShifts`)
    const shiftsQuery = query(shiftsRef, where('date', '==', today))
    const shiftsSnapshot = await getDocs(shiftsQuery)
    
    // Get employees
    const employeesRef = collection(db, `artifacts/${appId}/employees`)
    const employeesSnapshot = await getDocs(employeesRef)
    const employees = {}
    employeesSnapshot.docs.forEach(doc => {
      employees[doc.id] = { id: doc.id, ...doc.data() }
    })
    
    // Get tasks for today
    const tasksRef = collection(db, `artifacts/${appId}/users/{userId}/tasks`)
    const tasksQuery = query(tasksRef, where('dayOfWeek', '==', dayOfWeek))
    const tasksSnapshot = await getDocs(tasksQuery)
    const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    // Check WhatsApp connection
    if (!WHATSAPP_SERVER_URL) {
      console.error('WHATSAPP_SERVER_URL not configured')
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'WhatsApp server not configured' })
      }
    }
    
    const statusResponse = await fetch(`${WHATSAPP_SERVER_URL}/api/whatsapp/status`)
    const statusData = await statusResponse.json()
    
    if (statusData.status !== 'ready') {
      console.error('WhatsApp not connected')
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'WhatsApp not connected' })
      }
    }
    
    // Get user settings for auto-send
    const settingsRef = doc(db, `artifacts/${appId}/users/{userId}/settings/notifications`)
    const settingsDoc = await getDoc(settingsRef)
    
    if (!settingsDoc.exists() || !settingsDoc.data().autoSendEnabled) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Auto-send disabled for this user' })
      }
    }
    
    const settings = settingsDoc.data()
    const selectedEmployeeIds = settings.selectedEmployeeIds || []
    
    // Send messages to selected employees
    const recipients = []
    shiftsSnapshot.docs.forEach(shiftDoc => {
      const shift = { id: shiftDoc.id, ...shiftDoc.data() }
      
      // Only send to selected employees
      if (!selectedEmployeeIds.includes(shift.employeeId)) {
        return
      }
      
      const employee = employees[shift.employeeId]
      if (!employee || !employee.phoneNumber) {
        return
      }
      
      // Format message
      const shiftDate = new Date(shift.date).toLocaleDateString('he-IL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      
      let message = `שלום ${employee.fullName},\n\n`
      message += `היום (${shiftDate}) את/ה במשמרת ${shift.shiftType}.\n`
      message += `שעות: ${shift.startTime} - ${shift.endTime}\n\n`
      
      if (tasks.length > 0) {
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
      
      recipients.push({
        phoneNumber: employee.phoneNumber,
        message: message
      })
    })
    
    if (recipients.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No recipients to send to' })
      }
    }
    
    // Send bulk messages
    const sendResponse = await fetch(`${WHATSAPP_SERVER_URL}/api/whatsapp/send-bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ recipients })
    })
    
    const sendData = await sendResponse.json()
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        sent: sendData.sent || 0,
        failed: sendData.failed || 0,
        message: `Sent ${sendData.sent || 0} messages`
      })
    }
  } catch (error) {
    console.error('Error in send-daily-notifications:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}

