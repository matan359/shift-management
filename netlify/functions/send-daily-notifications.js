// Netlify Scheduled Function - שולח הודעות WhatsApp אוטומטית כל יום
// זה ירוץ אוטומטית לפי ה-schedule ב-netlify.toml
// משתמש ב-WhatsApp Web Link API - הכל על Netlify!

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

exports.handler = async (event, context) => {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig)
    const db = getFirestore(app)
    
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const dayOfWeek = new Date().getDay() // 0 = Sunday, 6 = Saturday
    const appId = process.env.FIREBASE_APP_ID || 'default'
    
    // Get all users/managers (you'll need to adjust this based on your data structure)
    // For now, we'll process one user at a time
    
    // This is a simplified version - you might need to iterate over all users
    const userId = event.queryStringParameters?.userId || null
    
    if (!userId) {
      // If no userId provided, you might want to get all managers
      // For now, return success but log that we need userId
      console.log('No userId provided - scheduled function needs userId parameter')
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'No userId provided. This function should be called for each user with auto-send enabled.',
          note: 'Consider creating a separate function that iterates over all users'
        })
      }
    }
    
    // Get user settings for auto-send
    const settingsRef = doc(db, `artifacts/${appId}/users/${userId}/settings/notifications`)
    const settingsDoc = await getDoc(settingsRef)
    
    if (!settingsDoc.exists() || !settingsDoc.data().autoSendEnabled) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Auto-send disabled for this user' })
      }
    }
    
    const settings = settingsDoc.data()
    const selectedEmployeeIds = settings.selectedEmployeeIds || []
    const autoSendTime = settings.autoSendTime || '07:00'
    
    // Check if it's time to send (compare current time with autoSendTime)
    const now = new Date()
    const [hours, minutes] = autoSendTime.split(':').map(Number)
    const sendTime = new Date()
    sendTime.setHours(hours, minutes, 0, 0)
    
    // Allow 5 minute window
    const timeDiff = Math.abs(now - sendTime)
    if (timeDiff > 5 * 60 * 1000) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: `Not time to send yet. Scheduled for ${autoSendTime}, current time is ${now.toTimeString()}` 
        })
      }
    }
    
    // Get shifts for today
    const shiftsRef = collection(db, `artifacts/${appId}/users/${userId}/assignedShifts`)
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
    const tasksRef = collection(db, `artifacts/${appId}/users/${userId}/tasks`)
    const tasksQuery = query(tasksRef, where('dayOfWeek', '==', dayOfWeek))
    const tasksSnapshot = await getDocs(tasksQuery)
    const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    // Prepare messages for selected employees
    const whatsappLinks = []
    
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
      
      // Format phone number
      let formattedNumber = employee.phoneNumber.replace(/[^0-9]/g, '')
      if (formattedNumber.startsWith('0')) {
        formattedNumber = '972' + formattedNumber.substring(1)
      } else if (!formattedNumber.startsWith('972')) {
        formattedNumber = '972' + formattedNumber
      }
      
      // Create WhatsApp Web Link
      const encodedMessage = encodeURIComponent(message)
      const whatsappLink = `https://wa.me/${formattedNumber}?text=${encodedMessage}`
      
      whatsappLinks.push({
        employeeName: employee.fullName,
        phoneNumber: formattedNumber,
        link: whatsappLink
      })
    })
    
    // Save links to Firestore for the manager to open later
    // Or send via email/webhook (you can add this)
    const linksRef = collection(db, `artifacts/${appId}/users/${userId}/whatsappLinks`)
    const linkDoc = doc(linksRef, today)
    await linkDoc.set({
      date: today,
      links: whatsappLinks,
      createdAt: new Date(),
      opened: false
    })
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        linksCreated: whatsappLinks.length,
        message: `Created ${whatsappLinks.length} WhatsApp links. Links saved to Firestore.`,
        note: 'Manager can open these links from the notifications page'
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
