import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Bell, Send, Clock, CheckCircle, XCircle } from 'lucide-react'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore'
import { format, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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
      const statusResponse = await fetch(`${API_URL}/api/whatsapp/status`)
      const statusData = await statusResponse.json()
      
      if (statusData.status !== 'ready') {
        alert('WhatsApp לא מחובר. אנא התחבר תחילה בדף "התחברות WhatsApp"')
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
          message: message
        }
      }).filter(r => r !== null)

      if (recipients.length === 0) {
        alert('אין עובדים עם מספרי טלפון למשמרות היום')
        setSending(false)
        return
      }

      // Send bulk messages
      const response = await fetch(`${API_URL}/api/whatsapp/send-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recipients })
      })

      const data = await response.json()
      
      if (data.success) {
        setResults(data.results)
        alert(`נשלחו ${data.sent} הודעות, ${data.failed} נכשלו`)
      } else {
        alert('שגיאה בשליחת ההודעות')
      }
    } catch (error) {
      console.error('Error sending notifications:', error)
      alert('שגיאה בשליחת ההודעות: ' + error.message)
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
      const statusResponse = await fetch(`${API_URL}/api/whatsapp/status`)
      const statusData = await statusResponse.json()
      
      if (statusData.status !== 'ready') {
        alert('WhatsApp לא מחובר. אנא התחבר תחילה.')
        setSending(false)
        return
      }

      const message = formatShiftMessage(employee, shift, tasks)
      
      const response = await fetch(`${API_URL}/api/whatsapp/send`, {
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
        alert(`הודעה נשלחה ל-${employee.fullName}`)
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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">ניהול התראות</h2>
          <p className="text-gray-600">שלח הודעות יומיות לעובדים עם משמרות</p>
        </div>
        <button
          onClick={sendAllNotifications}
          disabled={sending || todayShifts.length === 0}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse"
        >
          <Send className="w-5 h-5" />
          <span>{sending ? 'שולח...' : 'שלח לכולם'}</span>
        </button>
      </div>

      {/* WhatsApp Connection Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">התחברות WhatsApp:</h3>
        <p className="text-sm text-blue-700 mb-2">
          כדי לשלוח הודעות, צריך להתחבר ל-WhatsApp שלך דרך QR Code.
        </p>
        <a 
          href="/whatsapp-connection" 
          className="text-blue-600 hover:text-blue-800 underline font-semibold"
        >
          לך לדף התחברות WhatsApp →
        </a>
        <p className="text-xs text-blue-600 mt-2">
          הערה: ודא שהשרת רץ על פורט 3001. ההתחברות נשמרת אוטומטית.
        </p>
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
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse"
                  >
                    <Send className="w-4 h-4" />
                    <span>שלח הודעה</span>
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">תוצאות שליחה</h3>
          <div className="space-y-2">
            {results.map((result, index) => (
              <div key={index} className="flex items-center space-x-2 space-x-reverse">
                {result.sent ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={result.sent ? 'text-green-700' : 'text-red-700'}>
                  {result.employee}: {result.sent ? 'נשלח בהצלחה' : 'נכשל'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

