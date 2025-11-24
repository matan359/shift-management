import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Bell, Send, Clock, Smartphone, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

export default function Notifications() {
  const { user, db } = useAuth()
  const [todayShifts, setTodayShifts] = useState([])
  const [employees, setEmployees] = useState([])
  const [tasks, setTasks] = useState([])
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState([])
  const [selectedEmployees, setSelectedEmployees] = useState(new Set()) // עובדים שנבחרו לשליחה
  const [autoSendEnabled, setAutoSendEnabled] = useState(false) // שליחה אוטומטית
  const [autoSendTime, setAutoSendTime] = useState('07:00') // שעת שליחה אוטומטית
  const [savedLinks, setSavedLinks] = useState([]) // קישורים שנשמרו משליחה אוטומטית
  const [showSavedLinks, setShowSavedLinks] = useState(false) // האם להציג קישורים שנשמרו
  
  // WhatsApp Twilio API status
  const [whatsappStatus, setWhatsappStatus] = useState('checking') // checking, ready, not_configured
  const [checkingStatus, setCheckingStatus] = useState(false)

  useEffect(() => {
    if (!db || !user) return

    loadTodayShifts()
    loadEmployees()
    loadTodayTasks()
    loadAutoSendSettings()
    loadSavedLinks()
    
    // Check Twilio status
    checkWhatsAppStatus()
    const statusInterval = setInterval(checkWhatsAppStatus, 10000) // Check every 10 seconds
    
    return () => clearInterval(statusInterval)
  }, [db, user])

  async function checkWhatsAppStatus() {
    setCheckingStatus(true)
    try {
      const statusUrl = '/.netlify/functions/whatsapp-status'
      const response = await fetch(statusUrl)
      const data = await response.json()
      
      setWhatsappStatus(data.status || 'not_configured')
    } catch (error) {
      console.error('Error checking WhatsApp status:', error)
      setWhatsappStatus('not_configured')
    } finally {
      setCheckingStatus(false)
    }
  }

  async function loadSavedLinks() {
    if (!db || !user) return
    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid
      const today = format(new Date(), 'yyyy-MM-dd')
      const { doc, getDoc } = await import('firebase/firestore')
      
      const linksRef = doc(dbInstance, `artifacts/${appId}/users/${userId}/whatsappLinks/${today}`)
      const linksDoc = await getDoc(linksRef)
      
      if (linksDoc.exists()) {
        const data = linksDoc.data()
        if (data.links && data.links.length > 0 && !data.opened) {
          setSavedLinks(data.links)
          setShowSavedLinks(true)
        }
      }
    } catch (error) {
      console.error('Error loading saved links:', error)
    }
  }

  async function openSavedLinks() {
    if (savedLinks.length === 0) return
    
    // פתח את כל הקישורים
    savedLinks.forEach((link, index) => {
      setTimeout(() => {
        window.open(link.link, '_blank', 'noopener,noreferrer')
      }, index * 500) // השהיה של 500ms בין כל קישור
    })
    
    // סמן כנפתח
    if (!db || !user) return
    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid
      const today = format(new Date(), 'yyyy-MM-dd')
      const { doc, updateDoc } = await import('firebase/firestore')
      
      const linksRef = doc(dbInstance, `artifacts/${appId}/users/${userId}/whatsappLinks/${today}`)
      await updateDoc(linksRef, {
        opened: true,
        openedAt: new Date()
      })
      
      setShowSavedLinks(false)
      alert(`נפתחו ${savedLinks.length} חלונות WhatsApp!\n\nפשוט לחץ "שלח" בכל חלון.`)
    } catch (error) {
      console.error('Error marking links as opened:', error)
    }
  }

  async function loadAutoSendSettings() {
    if (!db || !user) return
    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid
      const { doc, getDoc } = await import('firebase/firestore')
      
      const settingsRef = doc(dbInstance, `artifacts/${appId}/users/${userId}/settings/notifications`)
      const settingsDoc = await getDoc(settingsRef)
      
      if (settingsDoc.exists()) {
        const data = settingsDoc.data()
        setAutoSendEnabled(data.autoSendEnabled || false)
        setAutoSendTime(data.autoSendTime || '07:00')
        setSelectedEmployees(new Set(data.selectedEmployeeIds || []))
      } else {
        // Default: select all employees with shifts today
        const shifts = await loadTodayShifts()
        const employeeIds = shifts.map(s => s.employeeId)
        setSelectedEmployees(new Set(employeeIds))
      }
    } catch (error) {
      console.error('Error loading auto send settings:', error)
    }
  }

  async function saveAutoSendSettings() {
    if (!db || !user) return
    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid
      const { doc, setDoc } = await import('firebase/firestore')
      
      const settingsRef = doc(dbInstance, `artifacts/${appId}/users/${userId}/settings/notifications`)
      await setDoc(settingsRef, {
        autoSendEnabled,
        autoSendTime,
        selectedEmployeeIds: Array.from(selectedEmployees),
        updatedAt: new Date()
      })
      
      alert('✅ ההגדרות נשמרו בהצלחה!')
    } catch (error) {
      console.error('Error saving auto send settings:', error)
      alert('שגיאה בשמירת ההגדרות')
    }
  }

  // WhatsApp Web Link API is always ready - no functions needed

  async function loadTodayShifts() {
    if (!db || !user) return []

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
      return shiftsData
    } catch (error) {
      console.error('Error loading shifts:', error)
      return []
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

    // Check WhatsApp status
    if (whatsappStatus !== 'ready') {
      alert('⚠️ Twilio WhatsApp API לא מוגדר!\n\nאנא הגדר את TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, ו-TWILIO_WHATSAPP_NUMBER ב-Netlify Environment Variables.\n\nראה מדריך: TWILIO_SETUP.md')
      return
    }

    // Check if any employees selected
    if (selectedEmployees.size === 0) {
      alert('⚠️ לא נבחרו עובדים לשליחה!\n\nאנא בחר עובדים מהרשימה למטה.')
      return
    }

    setSending(true)
    setResults([])

    try {
      // Prepare messages only for selected employees
      const recipients = todayShifts
        .filter(shift => selectedEmployees.has(shift.employeeId)) // רק עובדים שנבחרו
        .map(shift => {
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

      // Send messages via Twilio WhatsApp API (automatic sending in background)
      const sendUrl = '/.netlify/functions/whatsapp-send-bulk'
      
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
          employeeName: recipients.find(rec => {
            const originalPhone = rec.phoneNumber.replace(/[^0-9]/g, '')
            const formattedPhone = r.phoneNumber.replace(/[^0-9]/g, '')
            return originalPhone === formattedPhone || formattedPhone.includes(originalPhone.slice(-9))
          })?.employeeName || 'עובד',
          sent: r.success,
          error: r.error,
          messageId: r.messageId
        })))
        
        const successCount = data.results.filter(r => r.success).length
        alert(`✅ נשלחו ${successCount} מתוך ${data.results.length} הודעות בהצלחה!\n\nההודעות נשלחו אוטומטית ברקע - בלי לפתוח חלונות!`)
      } else {
        alert('שגיאה בשליחת ההודעות: ' + (data.error || 'Unknown error'))
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

    // Check WhatsApp status
    if (whatsappStatus !== 'ready') {
      alert('⚠️ Twilio WhatsApp API לא מוגדר!\n\nאנא הגדר את TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, ו-TWILIO_WHATSAPP_NUMBER ב-Netlify Environment Variables.\n\nראה מדריך: TWILIO_SETUP.md')
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
      
      // Send message via Twilio WhatsApp API (automatic sending in background)
      const sendUrl = '/.netlify/functions/whatsapp-send'
      
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
        alert(`✅ הודעה נשלחה בהצלחה ל-${employee.fullName}!\n\nההודעה נשלחה אוטומטית ברקע - בלי לפתוח חלונות!`)
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-50 to-white p-2 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Bell className="w-8 h-8 text-green-600" />
            שליחת התראות WhatsApp
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            שלח הודעות אוטומטיות לעובדים עם משמרות היום
          </p>
        </div>

        {/* Saved Links from Auto-Send */}
        {showSavedLinks && savedLinks.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-green-50 border-2 border-green-300 rounded-xl p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <Bell className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-green-800 mb-2 flex items-center gap-2">
                  <span>📱 קישורי WhatsApp מוכנים משליחה אוטומטית!</span>
                </h2>
                <p className="text-sm text-green-700 mb-4">
                  נשמרו {savedLinks.length} קישורי WhatsApp משליחה אוטומטית היום. לחץ על הכפתור למטה כדי לפתוח אותם.
                </p>
                <button
                  onClick={openSavedLinks}
                  className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 touch-manipulation active:scale-95"
                >
                  <Send className="w-5 h-5" />
                  <span>פתח {savedLinks.length} חלונות WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp Status */}
        <div className="mb-6 bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-green-600" />
              סטטוס WhatsApp (Twilio)
            </h2>
            <button
              onClick={checkWhatsAppStatus}
              disabled={checkingStatus}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              {checkingStatus ? (
                <>
                  <span>בודק...</span>
                </>
              ) : (
                <>
                  <span>רענן</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-4">
            {/* Status Display */}
            <div className="flex items-center gap-3">
              {whatsappStatus === 'ready' ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-green-700 font-semibold">✅ מוכן לשליחה אוטומטית</span>
                </>
              ) : whatsappStatus === 'checking' ? (
                <>
                  <span className="text-blue-700 font-semibold">🔄 בודק...</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-600" />
                  <span className="text-red-700 font-semibold">❌ לא מוגדר</span>
                </>
              )}
            </div>

            {/* Not Configured Message */}
            {whatsappStatus === 'not_configured' && (
              <div className="p-4 bg-yellow-50 rounded-xl border-2 border-yellow-300">
                <p className="text-sm text-yellow-800 font-semibold mb-2">
                  ⚠️ Twilio WhatsApp API לא מוגדר
                </p>
                <p className="text-xs text-yellow-700 mb-3">
                  כדי לשלוח הודעות אוטומטיות, צריך להגדיר את Twilio WhatsApp API.
                </p>
                <a
                  href="https://github.com/matan359/shift-management/blob/main/TWILIO_SETUP.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition text-sm font-semibold"
                >
                  <span>מדריך הגדרה</span>
                </a>
              </div>
            )}

            {/* Ready Status Info */}
            {whatsappStatus === 'ready' && (
              <div className="p-4 bg-green-50 rounded-xl border-2 border-green-300">
                <p className="text-sm text-green-700 text-center font-semibold">
                  ✅ Twilio WhatsApp API מוגדר ומוכן! כעת תוכל לשלוח הודעות אוטומטיות - הכל עובד ברקע, בלי לפתוח חלונות!
                </p>
              </div>
            )}
          </div>
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
              disabled={sending || todayShifts.length === 0}
              className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg disabled:transform-none flex items-center justify-center gap-2 touch-manipulation active:scale-95"
            >
              <Send className="w-5 h-5" />
              <span>{sending ? 'פותח חלונות...' : 'שלח הכל'}</span>
            </button>
          </div>
        </div>

        {/* Today's Shifts with Selection */}
        <div className="mb-6 bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Clock className="w-6 h-6 text-green-600" />
              משמרות היום ({format(new Date(), 'dd/MM/yyyy', { locale: he })})
            </h2>
            {todayShifts.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const allIds = new Set(todayShifts.map(s => s.employeeId))
                    setSelectedEmployees(allIds)
                  }}
                  className="text-xs px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition"
                >
                  בחר הכל
                </button>
                <button
                  onClick={() => setSelectedEmployees(new Set())}
                  className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                >
                  בטל הכל
                </button>
              </div>
            )}
          </div>
          
          {todayShifts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">אין משמרות היום</p>
          ) : (
            <div className="space-y-3">
              {todayShifts.map((shift) => {
                const employee = employees.find(emp => emp.id === shift.employeeId)
                const isSelected = selectedEmployees.has(shift.employeeId)
                
                return (
                  <div 
                    key={shift.id} 
                    className={`border-2 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                      isSelected 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const newSet = new Set(selectedEmployees)
                          if (e.target.checked) {
                            newSet.add(shift.employeeId)
                          } else {
                            newSet.delete(shift.employeeId)
                          }
                          setSelectedEmployees(newSet)
                        }}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-lg">{getEmployeeName(shift.employeeId)}</p>
                        <p className="text-sm text-gray-600">
                          {shift.shiftType} - {shift.startTime} עד {shift.endTime}
                        </p>
                        {employee && !employee.phoneNumber && (
                          <p className="text-xs text-red-600 mt-1">⚠ אין מספר טלפון</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => sendToEmployee(shift)}
                      disabled={sending || !employee?.phoneNumber}
                      className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-sm py-2 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation active:scale-95 shadow-md"
                    >
                      <Send className="w-4 h-4" />
                      <span>{sending ? 'פותח...' : 'שלח הודעה'}</span>
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

