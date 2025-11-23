import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Bell, Send, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore'
import { format, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'

// Use Netlify Functions in production, local server in development
const getAPIUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001'
  }
  if (window.location.hostname.includes('netlify.app') || window.location.hostname.includes('netlify.com')) {
    return '' // Use relative path for Netlify Functions
  }
  return import.meta.env.VITE_API_URL || 'https://your-whatsapp-server.railway.app'
}

const API_URL = getAPIUrl()

export default function ManageNotifications() {
  const { user, db } = useAuth()
  const [todayShifts, setTodayShifts] = useState([])
  const [employees, setEmployees] = useState([])
  const [tasks, setTasks] = useState([])
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState([])

  useEffect(() => {
    if (!db || !user) return

    loadTodayShifts()
    loadEmployees()
    loadTodayTasks()
  }, [db, user])

  async function loadTodayShifts() {
    if (!db || !user) return

    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid
      const today = format(new Date(), 'yyyy-MM-dd')

      const shiftsRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/assignedShifts`)
      const q = query(shiftsRef, where('date', '==', today))
      const snapshot = await getDocs(q)

      const shiftsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setTodayShifts(shiftsData)
    } catch (error) {
      console.error('Error loading shifts:', error)
    }
  }

  async function loadEmployees() {
    if (!db || !user) return

    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid

      const employeesRef = collection(dbInstance, `artifacts/${appId}/employees`)
      const snapshot = await getDocs(employeesRef)
      const employeesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setEmployees(employeesData)
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  async function loadTodayTasks() {
    if (!db || !user) return

    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid
      const dayOfWeek = new Date().getDay()

      const tasksRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/tasks`)
      const q = query(tasksRef, where('dayOfWeek', '==', dayOfWeek))
      const snapshot = await getDocs(q)

      const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setTasks(tasksData)
    } catch (error) {
      console.error('Error loading tasks:', error)
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

  async function sendAllNotifications() {
    if (!db || !user) return

    setSending(true)
    setResults([])

    try {
      // Check WhatsApp connection status
      const statusUrl = API_URL 
        ? `${API_URL}/api/whatsapp/status`
        : '/.netlify/functions/whatsapp-status'
      
      const statusResponse = await fetch(statusUrl)
      const statusData = await statusResponse.json()
      
      if (statusData.status !== 'ready') {
        alert('WhatsApp לא מחובר. אנא התחבר תחילה בדף "התחברות WhatsApp" וסרוק את ה-QR Code.')
        setSending(false)
        return
      }

      // Prepare messages for all employees with shifts today
      const recipients = todayShifts.map(shift => {
        const employee = employees.find(emp => emp.id === shift.employeeId)
        if (!employee || !employee.phoneNumber) {
          return null
        }
        
        const message = formatShiftMessage(employee, shift, tasks)
        return {
          phoneNumber: employee.phoneNumber,
          message: message,
          employeeName: employee.fullName
        }
      }).filter(r => r !== null)

      if (recipients.length === 0) {
        alert('אין עובדים עם מספרי טלפון למשמרות היום')
        setSending(false)
        return
      }

      // Send bulk messages via API
      const sendUrl = API_URL 
        ? `${API_URL}/api/whatsapp/send-bulk`
        : '/.netlify/functions/whatsapp-send-bulk'
      
      const response = await fetch(sendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recipients })
      })

      const data = await response.json()
      
      if (data.success) {
        setResults(data.results.map(r => ({
          phoneNumber: r.phoneNumber,
          success: r.success,
          employeeName: recipients.find(rec => rec.phoneNumber === r.phoneNumber)?.employeeName || 'עובד',
          sent: r.success
        })))
        
        const sentCount = data.sent || data.results.filter(r => r.success).length
        const failedCount = data.failed || data.results.filter(r => !r.success).length
        
        if (failedCount === 0) {
          alert(`✅ נשלחו ${sentCount} הודעות בהצלחה!`)
        } else {
          alert(`נשלחו ${sentCount} הודעות, ${failedCount} נכשלו. בדוק את התוצאות למטה.`)
        }
      } else {
        alert('שגיאה בשליחת ההודעות: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error sending notifications:', error)
      alert('שגיאה בשליחת ההודעות: ' + error.message + '\n\nודא שהשרת רץ ושה-WhatsApp מחובר.')
    } finally {
      setSending(false)
    }
  }

  async function sendToEmployee(shift) {
    if (!db || !user) return

    const employee = employees.find(emp => emp.id === shift.employeeId)
    if (!employee || !employee.phoneNumber) {
      alert('לעובד זה אין מספר טלפון')
      return
    }

    setSending(true)
    try {
      // Check WhatsApp connection
      const statusUrl = API_URL 
        ? `${API_URL}/api/whatsapp/status`
        : '/.netlify/functions/whatsapp-status'
      
      const statusResponse = await fetch(statusUrl)
      const statusData = await statusResponse.json()
      
      if (statusData.status !== 'ready') {
        alert('WhatsApp לא מחובר. אנא התחבר תחילה בדף "התחברות WhatsApp" וסרוק את ה-QR Code.')
        setSending(false)
        return
      }

      const message = formatShiftMessage(employee, shift, tasks)
      
      // Send message via API
      const sendUrl = API_URL 
        ? `${API_URL}/api/whatsapp/send`
        : '/.netlify/functions/whatsapp-send'
      
      const response = await fetch(sendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: employee.phoneNumber,
          message: message
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert(`✅ הודעה נשלחה בהצלחה ל-${employee.fullName}!`)
      } else {
        alert('שגיאה בשליחת ההודעה: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('שגיאה בשליחת ההודעה: ' + error.message + '\n\nודא שהשרת רץ ושה-WhatsApp מחובר.')
    } finally {
      setSending(false)
    }
  }

  function getEmployeeName(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee?.fullName || 'לא ידוע'
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">ניהול התראות</h2>
          <p className="text-gray-600">שלח הודעות יומיות לעובדים עם משמרות</p>
        </div>
        <button
          onClick={sendAllNotifications}
          disabled={sending || todayShifts.length === 0}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg disabled:transform-none flex items-center space-x-2 space-x-reverse touch-manipulation active:scale-95"
        >
          <Send className="w-5 h-5" />
          <span>{sending ? 'שולח...' : 'שלח הכל דרך WhatsApp'}</span>
        </button>
      </div>

      {/* WhatsApp Connection Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex items-start space-x-3 space-x-reverse">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-800 mb-2 text-base sm:text-lg">שליחת הודעות אוטומטית דרך WhatsApp 📱</h3>
            <p className="text-sm text-blue-700 mb-2">
              ההודעות נשלחות אוטומטית לעובדים לפי מספר הטלפון שלהם במערכת.
            </p>
            <p className="text-xs text-blue-600 mb-2">
              ⚠️ חשוב: ודא ש-WhatsApp מחובר לפני שליחת הודעות.
            </p>
            <a 
              href="/whatsapp-connection" 
              className="text-blue-600 hover:text-blue-800 underline font-semibold text-sm"
            >
              לך לדף התחברות WhatsApp →
            </a>
          </div>
        </div>
      </div>

      {/* Today's Shifts */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <Clock className="w-5 h-5 ml-2" />
          משמרות היום ({format(new Date(), 'dd/MM/yyyy', { locale: he })})
        </h3>
        
        {todayShifts.length === 0 ? (
          <p className="text-gray-500">אין משמרות היום</p>
        ) : (
          <div className="space-y-3">
            {todayShifts.map((shift) => {
              const employee = employees.find(emp => emp.id === shift.employeeId)
              return (
                <div key={shift.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{getEmployeeName(shift.employeeId)}</p>
                    <p className="text-sm text-gray-600">
                      {shift.shiftType} - {shift.startTime} עד {shift.endTime}
                    </p>
                    {employee && !employee.phoneNumber && (
                      <p className="text-xs text-red-600 mt-1">⚠ אין מספר טלפון</p>
                    )}
                  </div>
                  <button
                    onClick={() => sendToEmployee(shift)}
                    disabled={sending || !employee?.phoneNumber}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse touch-manipulation active:scale-95 shadow-md"
                  >
                    <Send className="w-4 h-4" />
                    <span>{sending ? 'שולח...' : 'שלח הודעה'}</span>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Today's Tasks */}
      {tasks.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">משימות היום</h3>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="border border-gray-200 rounded-lg p-3">
                <p className="font-semibold text-gray-800">{task.title}</p>
                {task.description && (
                  <p className="text-sm text-gray-600">{task.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">תוצאות שליחה</h3>
          <div className="space-y-2">
            {results.map((result, index) => (
              <div key={index} className="flex items-center space-x-2 space-x-reverse p-2 bg-gray-50 rounded-lg">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                )}
                <span className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                  {result.employeeName || 'עובד'}: {result.success ? 'נשלח בהצלחה ✅' : `נכשל ❌ ${result.error || ''}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

