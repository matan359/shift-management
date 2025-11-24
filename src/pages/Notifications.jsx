import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Bell, Send, Clock, Smartphone, CheckCircle, XCircle, Loader2, Calendar, ListChecks } from 'lucide-react'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { format, startOfWeek, endOfWeek, addWeeks, isWithinInterval, parseISO } from 'date-fns'
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
  const [nextWeekShifts, setNextWeekShifts] = useState([]) // משמרות השבוע הבא
  const [sendingTasks, setSendingTasks] = useState(false) // מצב שליחת משימות
  
  useEffect(() => {
    if (!db || !user) return

    loadTodayShifts()
    loadEmployees()
    loadTodayTasks()
    loadAutoSendSettings()
    loadSavedLinks()
    loadNextWeekShifts()
  }, [db, user])

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

  async function loadNextWeekShifts() {
    if (!db || !user) return

    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid

      // Calculate next week
      const now = new Date()
      const nextWeekStart = startOfWeek(addWeeks(now, 1), { locale: he })
      const nextWeekEnd = endOfWeek(addWeeks(now, 1), { locale: he })

      const shiftsRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/assignedShifts`)
      const snapshot = await getDocs(shiftsRef)

      const shiftsData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(shift => {
          const shiftDate = parseISO(shift.date)
          return isWithinInterval(shiftDate, { start: nextWeekStart, end: nextWeekEnd })
        })
        .sort((a, b) => a.date.localeCompare(b.date))

      setNextWeekShifts(shiftsData)
    } catch (error) {
      console.error('Error loading next week shifts:', error)
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

  function formatWeeklyShiftsMessage(employee, shifts) {
    let message = `שלום ${employee.fullName},\n\n`
    message += `📅 המשמרות שלך השבוע הבא:\n\n`

    // Group shifts by day
    const shiftsByDay = {}
    shifts.forEach(shift => {
      const date = shift.date
      if (!shiftsByDay[date]) {
        shiftsByDay[date] = []
      }
      shiftsByDay[date].push(shift)
    })

    // Sort days
    const sortedDays = Object.keys(shiftsByDay).sort()

    sortedDays.forEach(date => {
      const dayShifts = shiftsByDay[date]
      const shiftDate = new Date(date).toLocaleDateString('he-IL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })
      
      message += `📆 ${shiftDate}:\n`
      dayShifts.forEach(shift => {
        message += `   • ${shift.shiftType} - ${shift.startTime} עד ${shift.endTime}\n`
      })
      message += `\n`
    })

    message += `יום נעים!`
    return message
  }

  function formatTasksMessage(tasks) {
    let message = `📋 משימות היום:\n\n`

    tasks.forEach((task, index) => {
      message += `${index + 1}. ${task.title}\n`
      if (task.description) {
        message += `   ${task.description}\n`
      }
      message += `\n`
    })

    message += `יום נעים!`
    return message
  }

  function formatPhoneNumber(phoneNumber) {
    // Remove all non-digits
    let cleaned = phoneNumber.replace(/[^0-9]/g, '')
    
    // If starts with 0, replace with 972
    if (cleaned.startsWith('0')) {
      cleaned = '972' + cleaned.substring(1)
    }
    // If doesn't start with country code, add 972
    else if (!cleaned.startsWith('972')) {
      cleaned = '972' + cleaned
    }
    
    return cleaned
  }

  function createWhatsAppLink(phoneNumber, message) {
    const formattedPhone = formatPhoneNumber(phoneNumber)
    const encodedMessage = encodeURIComponent(message)
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
  }

  async function sendAllNotifications() {
    if (!db || !user) return

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
          const whatsappLink = createWhatsAppLink(employee.phoneNumber, message)
          
          return {
            phoneNumber: employee.phoneNumber,
            message: message,
            employeeName: employee.fullName,
            link: whatsappLink
          }
        }).filter(r => r !== null)

      if (recipients.length === 0) {
        alert('אין עובדים עם מספרי טלפון למשמרות היום')
        setSending(false)
        return
      }

      // Open WhatsApp Web links - FREE and EASY!
      // Open each link with a small delay to avoid popup blockers
      recipients.forEach((recipient, index) => {
        setTimeout(() => {
          window.open(recipient.link, '_blank', 'noopener,noreferrer')
        }, index * 500) // 500ms delay between each
      })

      // Mark as sent
      setResults(recipients.map(r => ({
        phoneNumber: r.phoneNumber,
        success: true,
        employeeName: r.employeeName,
        sent: true
      })))

      alert(`✅ נפתחו ${recipients.length} חלונות WhatsApp!\n\nפשוט לחץ "שלח" בכל חלון. זה חינם לחלוטין - לא צריך שום הגדרה!`)
    } catch (error) {
      console.error('Error opening WhatsApp links:', error)
      alert('שגיאה בפתיחת קישורי WhatsApp: ' + error.message)
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

    try {
      const message = formatShiftMessage(employee, shift, tasks)
      const whatsappLink = createWhatsAppLink(employee.phoneNumber, message)
      
      // Open WhatsApp Web link - FREE and EASY!
      window.open(whatsappLink, '_blank', 'noopener,noreferrer')
      
      alert(`✅ נפתח חלון WhatsApp ל-${employee.fullName}!\n\nפשוט לחץ "שלח" - זה חינם לחלוטין!`)
    } catch (error) {
      console.error('Error opening WhatsApp link:', error)
      alert('שגיאה בפתיחת קישור WhatsApp: ' + error.message)
    }
  }

  function getEmployeeName(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee?.fullName || 'לא ידוע'
  }

  async function sendWeeklyShifts() {
    if (!db || !user) return

    if (nextWeekShifts.length === 0) {
      alert('אין משמרות לשבוע הבא')
      return
    }

    setSending(true)
    setResults([])

    try {
      // Group shifts by employee
      const shiftsByEmployee = {}
      nextWeekShifts.forEach(shift => {
        if (!shiftsByEmployee[shift.employeeId]) {
          shiftsByEmployee[shift.employeeId] = []
        }
        shiftsByEmployee[shift.employeeId].push(shift)
      })

      const recipients = Object.keys(shiftsByEmployee)
        .map(employeeId => {
          const employee = employees.find(emp => emp.id === employeeId)
          if (!employee || !employee.phoneNumber) {
            return null
          }

          const employeeShifts = shiftsByEmployee[employeeId]
          const message = formatWeeklyShiftsMessage(employee, employeeShifts)
          const whatsappLink = createWhatsAppLink(employee.phoneNumber, message)

          return {
            phoneNumber: employee.phoneNumber,
            message: message,
            employeeName: employee.fullName,
            link: whatsappLink,
            shiftCount: employeeShifts.length
          }
        })
        .filter(r => r !== null)

      if (recipients.length === 0) {
        alert('אין עובדים עם מספרי טלפון למשמרות השבוע הבא')
        setSending(false)
        return
      }

      // Open WhatsApp Web links
      recipients.forEach((recipient, index) => {
        setTimeout(() => {
          window.open(recipient.link, '_blank', 'noopener,noreferrer')
        }, index * 500)
      })

      setResults(recipients.map(r => ({
        phoneNumber: r.phoneNumber,
        success: true,
        employeeName: r.employeeName,
        sent: true,
        shiftCount: r.shiftCount
      })))

      alert(`✅ נפתחו ${recipients.length} חלונות WhatsApp עם כל המשמרות של השבוע הבא!\n\nפשוט לחץ "שלח" בכל חלון.`)
    } catch (error) {
      console.error('Error opening WhatsApp links:', error)
      alert('שגיאה בפתיחת קישורי WhatsApp: ' + error.message)
    } finally {
      setSending(false)
    }
  }

  async function sendTasksOnly() {
    if (!db || !user) return

    if (tasks.length === 0) {
      alert('אין משימות היום')
      return
    }

    setSendingTasks(true)

    try {
      // Get all employees with shifts today
      const employeesWithShifts = new Set()
      todayShifts.forEach(shift => {
        employeesWithShifts.add(shift.employeeId)
      })

      if (employeesWithShifts.size === 0) {
        alert('אין עובדים עם משמרות היום')
        setSendingTasks(false)
        return
      }

      const recipients = Array.from(employeesWithShifts)
        .map(employeeId => {
          const employee = employees.find(emp => emp.id === employeeId)
          if (!employee || !employee.phoneNumber) {
            return null
          }

          const message = formatTasksMessage(tasks)
          const whatsappLink = createWhatsAppLink(employee.phoneNumber, message)

          return {
            phoneNumber: employee.phoneNumber,
            message: message,
            employeeName: employee.fullName,
            link: whatsappLink
          }
        })
        .filter(r => r !== null)

      if (recipients.length === 0) {
        alert('אין עובדים עם מספרי טלפון')
        setSendingTasks(false)
        return
      }

      // Open WhatsApp Web links
      recipients.forEach((recipient, index) => {
        setTimeout(() => {
          window.open(recipient.link, '_blank', 'noopener,noreferrer')
        }, index * 500)
      })

      alert(`✅ נפתחו ${recipients.length} חלונות WhatsApp עם משימות היום!\n\nפשוט לחץ "שלח" בכל חלון.`)
    } catch (error) {
      console.error('Error opening WhatsApp links:', error)
      alert('שגיאה בפתיחת קישורי WhatsApp: ' + error.message)
    } finally {
      setSendingTasks(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-50 to-white p-2 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 glass-effect rounded-2xl shadow-glow p-4 sm:p-6 animate-fadeIn">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-700 mb-2 flex items-center gap-3">
            <Bell className="w-8 h-8 text-green-600 animate-pulse-slow" />
            שליחת התראות WhatsApp
          </h1>
          <p className="text-gray-600 text-sm sm:text-base font-medium">
            שלח הודעות דרך WhatsApp Web - חינם לחלוטין, בלי שום הגדרה!
          </p>
        </div>

        {/* Info Box */}
        <div className="mb-6 glass-effect rounded-2xl shadow-glow p-4 sm:p-6 border-2 border-green-300 bg-green-50 animate-slideUp">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-green-700 mb-2 flex items-center gap-2">
                <span>✅ מערכת חינמית ופשוטה!</span>
              </h2>
              <p className="text-sm text-gray-700 mb-2 font-medium">
                המערכת פותחת חלונות WhatsApp Web עם ההודעות מוכנות. פשוט לחץ "שלח" בכל חלון.
              </p>
              <p className="text-xs text-green-700 font-semibold">
                💰 חינם לחלוטין • 🚀 לא צריך שום הגדרה • ⚡ פשוט וקל!
              </p>
            </div>
          </div>
        </div>

        {/* Weekly Shifts Button - Send all next week shifts */}
        <div className="mb-6 glass-effect rounded-2xl shadow-glow p-4 sm:p-6 border-2 border-green-300 bg-green-50 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-green-700 mb-1 flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                שלח כל המשמרות של השבוע הבא
              </h2>
              <p className="text-sm text-gray-600 font-medium">
                {nextWeekShifts.length > 0 
                  ? `${nextWeekShifts.length} משמרות בשבוע הבא` 
                  : 'אין משמרות לשבוע הבא'}
              </p>
              <p className="text-xs text-green-700 font-semibold mt-1">
                💡 מומלץ לשלוח במוצאי שבת - כל עובד יקבל את כל המשמרות שלו לשבוע הבא
              </p>
            </div>
            <button
              onClick={sendWeeklyShifts}
              disabled={sending || nextWeekShifts.length === 0}
              className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg disabled:transform-none flex items-center justify-center gap-2 touch-manipulation active:scale-95"
            >
              <Send className="w-5 h-5" />
              <span>{sending ? 'פותח חלונות...' : 'שלח כל המשמרות'}</span>
            </button>
          </div>
        </div>

        {/* Send All Button - Today's shifts */}
        <div className="mb-6 glass-effect rounded-2xl shadow-glow p-4 sm:p-6 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-green-700 mb-1">שלח הודעות לכל העובדים - משמרות היום</h2>
              <p className="text-sm text-gray-600 font-medium">
                {todayShifts.length > 0 
                  ? `${todayShifts.length} משמרות היום` 
                  : 'אין משמרות היום'}
              </p>
            </div>
            <button
              onClick={sendAllNotifications}
              disabled={sending || todayShifts.length === 0}
              className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg disabled:transform-none flex items-center justify-center gap-2 touch-manipulation active:scale-95"
            >
              <Send className="w-5 h-5" />
              <span>{sending ? 'פותח חלונות...' : 'פתח הכל ב-WhatsApp'}</span>
            </button>
          </div>
        </div>

        {/* Today's Shifts with Selection */}
        <div className="mb-6 glass-effect rounded-2xl shadow-glow p-4 sm:p-6 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-green-700 flex items-center gap-2">
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
              {todayShifts.map((shift, index) => {
                const employee = employees.find(emp => emp.id === shift.employeeId)
                const isSelected = selectedEmployees.has(shift.employeeId)
                
                return (
                  <div 
                    key={shift.id} 
                    className={`border-2 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200 hover:shadow-md animate-fadeIn ${
                      isSelected 
                        ? 'border-green-500 bg-green-50 shadow-md' 
                        : 'border-gray-200 bg-white hover:border-green-300'
                    }`}
                    style={{ animationDelay: `${index * 0.05}s` }}
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
                      <span>{sending ? 'פותח...' : 'פתח WhatsApp'}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="mb-6 glass-effect rounded-2xl shadow-glow p-4 sm:p-6 animate-slideUp">
            <h2 className="text-xl font-bold text-green-700 mb-4">תוצאות שליחה</h2>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
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

        {/* Today's Tasks - Separate section for sending */}
        {tasks.length > 0 && (
          <div className="glass-effect rounded-2xl shadow-glow p-4 sm:p-6 border-2 border-green-300 bg-green-50 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-green-700 mb-1 flex items-center gap-2">
                  <ListChecks className="w-6 h-6" />
                  משימות היום
                </h2>
                <p className="text-sm text-gray-600 font-medium">
                  {tasks.length} משימות היום
                </p>
              </div>
              <button
                onClick={sendTasksOnly}
                disabled={sendingTasks || tasks.length === 0}
                className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg disabled:transform-none flex items-center justify-center gap-2 touch-manipulation active:scale-95"
              >
                <Send className="w-5 h-5" />
                <span>{sendingTasks ? 'פותח חלונות...' : 'שלח משימות בלבד'}</span>
              </button>
            </div>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="border-2 border-gray-200 rounded-lg p-3 bg-white">
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

