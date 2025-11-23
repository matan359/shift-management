import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Bell, Send, Clock, CheckCircle, XCircle, AlertCircle, Smartphone, QrCode, Loader2 } from 'lucide-react'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { format } from 'date-fns'
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

export default function Notifications() {
  const { user, db } = useAuth()
  const [todayShifts, setTodayShifts] = useState([])
  const [employees, setEmployees] = useState([])
  const [tasks, setTasks] = useState([])
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState([])
  
  // WhatsApp connection state
  const [whatsappStatus, setWhatsappStatus] = useState('disconnected')
  const [qrCode, setQrCode] = useState(null)
  const [checkingStatus, setCheckingStatus] = useState(false)

  useEffect(() => {
    if (!db || !user) return

    loadTodayShifts()
    loadEmployees()
    loadTodayTasks()
    checkWhatsAppStatus()
    
    // Check WhatsApp status every 5 seconds
    const statusInterval = setInterval(checkWhatsAppStatus, 5000)
    
    return () => clearInterval(statusInterval)
  }, [db, user])

  async function checkWhatsAppStatus() {
    try {
      setCheckingStatus(true)
      const url = API_URL 
        ? `${API_URL}/api/whatsapp/status`
        : '/.netlify/functions/whatsapp-status'
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.error && data.status === 'disconnected') {
        setWhatsappStatus('disconnected')
        setQrCode(null)
        return
      }
      
      setWhatsappStatus(data.status || 'disconnected')
      
      // Load QR code if needed
      if (data.status === 'qr') {
        await loadQRCode()
      } else if (data.status === 'ready') {
        setQrCode(null)
      }
    } catch (error) {
      console.error('Error checking WhatsApp status:', error)
      setWhatsappStatus('disconnected')
    } finally {
      setCheckingStatus(false)
    }
  }

  async function loadQRCode() {
    try {
      const url = API_URL 
        ? `${API_URL}/api/whatsapp/qr`
        : '/.netlify/functions/whatsapp-qr'
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.qr) {
        setQrCode(data.qr)
      }
    } catch (error) {
      console.error('Error loading QR code:', error)
    }
  }

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

    // Check WhatsApp connection first
    if (whatsappStatus !== 'ready') {
      alert('⚠️ WhatsApp לא מחובר!\n\nאנא סרוק את ה-QR Code למעלה כדי להתחבר תחילה.')
      return
    }

    setSending(true)
    setResults([])

    try {
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
          sent: r.success,
          error: r.error
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

    // Check WhatsApp connection first
    if (whatsappStatus !== 'ready') {
      alert('⚠️ WhatsApp לא מחובר!\n\nאנא סרוק את ה-QR Code למעלה כדי להתחבר תחילה.')
      return
    }

    const employee = employees.find(emp => emp.id === shift.employeeId)
    if (!employee || !employee.phoneNumber) {
      alert('לעובד זה אין מספר טלפון')
      return
    }

    setSending(true)
    try {
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
      alert('שגיאה בשליחת ההודעה: ' + error.message)
    } finally {
      setSending(false)
    }
  }

  function getEmployeeName(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee?.fullName || 'לא ידוע'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-2 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Bell className="w-8 h-8 text-blue-600" />
            שליחת התראות WhatsApp
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            שלח הודעות אוטומטיות לעובדים עם משמרות היום
          </p>
        </div>

        {/* WhatsApp Connection Status - Simple and Clear */}
        <div className="mb-6 bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-green-600" />
              סטטוס חיבור WhatsApp
            </h2>
            <button
              onClick={checkWhatsAppStatus}
              disabled={checkingStatus}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {checkingStatus ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>רענן</span>
              )}
            </button>
          </div>

          {whatsappStatus === 'ready' ? (
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-green-800 mb-1">✅ מחובר ומוכן!</h3>
                  <p className="text-sm text-green-700">
                    WhatsApp מחובר. אפשר לשלוח הודעות עכשיו!
                  </p>
                </div>
              </div>
            </div>
          ) : whatsappStatus === 'qr' && qrCode ? (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 sm:p-6">
              <div className="text-center">
                <h3 className="text-lg font-bold text-yellow-800 mb-4 flex items-center justify-center gap-2">
                  <QrCode className="w-6 h-6" />
                  סרוק QR Code להתחברות
                </h3>
                <div className="flex justify-center mb-4">
                  <div className="bg-white p-4 rounded-xl shadow-lg">
                    <img 
                      src={qrCode} 
                      alt="QR Code" 
                      className="w-48 h-48 sm:w-64 sm:h-64 border-4 border-yellow-400 rounded-lg"
                    />
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 text-right">
                  <p className="text-sm font-semibold text-gray-800 mb-2">הוראות:</p>
                  <ol className="text-xs sm:text-sm text-gray-700 space-y-1 list-decimal list-inside">
                    <li>פתח WhatsApp בטלפון שלך</li>
                    <li>לך להגדרות → מכשירים מקושרים</li>
                    <li>לחץ על "קשר מכשיר"</li>
                    <li>סרוק את ה-QR Code למעלה</li>
                  </ol>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-red-800 mb-1">❌ לא מחובר</h3>
                  <p className="text-sm text-red-700">
                    WhatsApp לא מחובר. המתן ל-QR Code או ודא שהשרת רץ.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Send All Button */}
        <div className="mb-6 bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">שלח הודעות לכל העובדים</h2>
              <p className="text-sm text-gray-600">
                {todayShifts.length > 0 
                  ? `${todayShifts.length} משמרות היום` 
                  : 'אין משמרות היום'}
              </p>
            </div>
            <button
              onClick={sendAllNotifications}
              disabled={sending || todayShifts.length === 0 || whatsappStatus !== 'ready'}
              className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg disabled:transform-none flex items-center justify-center gap-2 touch-manipulation active:scale-95"
            >
              <Send className="w-5 h-5" />
              <span>{sending ? 'שולח...' : 'שלח הכל'}</span>
            </button>
          </div>
        </div>

        {/* Today's Shifts */}
        <div className="mb-6 bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            משמרות היום ({format(new Date(), 'dd/MM/yyyy', { locale: he })})
          </h2>
          
          {todayShifts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">אין משמרות היום</p>
          ) : (
            <div className="space-y-3">
              {todayShifts.map((shift) => {
                const employee = employees.find(emp => emp.id === shift.employeeId)
                return (
                  <div key={shift.id} className="border-2 border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-lg">{getEmployeeName(shift.employeeId)}</p>
                      <p className="text-sm text-gray-600">
                        {shift.shiftType} - {shift.startTime} עד {shift.endTime}
                      </p>
                      {employee && !employee.phoneNumber && (
                        <p className="text-xs text-red-600 mt-1">⚠ אין מספר טלפון</p>
                      )}
                    </div>
                    <button
                      onClick={() => sendToEmployee(shift)}
                      disabled={sending || !employee?.phoneNumber || whatsappStatus !== 'ready'}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm py-2 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation active:scale-95 shadow-md"
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

        {/* Results */}
        {results.length > 0 && (
          <div className="mb-6 bg-white rounded-2xl shadow-xl p-4 sm:p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">תוצאות שליחה</h2>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {result.success ? (
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  )}
                  <span className={`text-sm font-medium ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.employeeName || 'עובד'}: {result.success ? 'נשלח בהצלחה ✅' : `נכשל ❌ ${result.error || ''}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's Tasks */}
        {tasks.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">משימות היום</h2>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="border-2 border-gray-200 rounded-lg p-3">
                  <p className="font-semibold text-gray-800">{task.title}</p>
                  {task.description && (
                    <p className="text-sm text-gray-600">{task.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

