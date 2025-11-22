import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Calendar, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore'
import { getSpecialDayInfo } from '../utils/holidayDetector'
import { startOfWeek, endOfWeek, eachDayOfInterval, format, addWeeks, parseISO, isWithinInterval } from 'date-fns'
import { he } from 'date-fns/locale'

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const DAYS_EN = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

// Categories for morning and evening shifts
const MORNING_CATEGORIES = ['אחראי', 'פס', 'מטבח']
const EVENING_CATEGORIES = ['אחראי', 'פס', 'מטבח', 'נוסף']

export default function ScheduleView() {
  const { user, db } = useAuth()
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [shifts, setShifts] = useState([])
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    if (!db || !user) return

    loadShifts()
    loadEmployees()
  }, [db, user, currentWeek])

  function loadShifts() {
    if (!db || !user) return

    const dbInstance = db || getFirebaseDb()
    const appId = getAppId()
    const userId = user.uid

    const weekStart = startOfWeek(currentWeek, { locale: he })
    const weekEnd = endOfWeek(currentWeek, { locale: he })

    const shiftsRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/assignedShifts`)
    
    const unsubscribe = onSnapshot(shiftsRef, (snapshot) => {
      const shiftsData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(shift => {
          if (!shift.date) return false
          const shiftDate = parseISO(shift.date)
          return isWithinInterval(shiftDate, { start: weekStart, end: weekEnd })
        })

      setShifts(shiftsData)
    })

    return () => unsubscribe()
  }

  function loadEmployees() {
    if (!db || !user) return

    const dbInstance = db || getFirebaseDb()
    const appId = getAppId()
    const userId = user.uid

    const employeesRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/employees`)
    
    const unsubscribe = onSnapshot(employeesRef, (snapshot) => {
      const employeesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setEmployees(employeesData)
    })

    return () => unsubscribe()
  }

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentWeek, { locale: he }),
    end: endOfWeek(currentWeek, { locale: he })
  })

  function getShiftsForDayAndCategory(day, category, shiftType) {
    const dayStr = format(day, 'yyyy-MM-dd')
    return shifts.filter(shift => {
      if (shift.date !== dayStr) return false
      if (shift.shiftType !== shiftType) return false
      
      // Match category based on employee role or shift category
      const employee = employees.find(emp => emp.id === shift.employeeId)
      if (!employee) return false
      
      // Map employee role to category
      if (category === 'אחראי' && (employee.role === 'manager' || shift.category === 'אחראי')) return true
      if (category === 'פס' && (employee.role === 'worker' && shift.category === 'פס')) return true
      if (category === 'מטבח' && shift.category === 'מטבח') return true
      if (category === 'נוסף' && shift.category === 'נוסף') return true
      
      // Default matching if no category specified
      if (!shift.category) {
        if (category === 'אחראי' && employee.role === 'manager') return true
        if (category === 'פס' && employee.role === 'worker') return true
      }
      
      return false
    })
  }

  function getEmployeeName(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee?.fullName || 'לא ידוע'
  }

  function formatShiftDisplay(shift) {
    const employeeName = getEmployeeName(shift.employeeId)
    const hours = shift.hours || calculateHours(shift.startTime, shift.endTime)
    return hours ? `${employeeName} ${hours}` : employeeName
  }

  function calculateHours(startTime, endTime) {
    if (!startTime || !endTime) return null
    try {
      const [startH, startM] = startTime.split(':').map(Number)
      const [endH, endM] = endTime.split(':').map(Number)
      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM
      const diffMinutes = endMinutes - startMinutes
      const hours = diffMinutes / 60
      return hours > 0 ? hours.toFixed(1) : null
    } catch {
      return null
    }
  }

  function getShiftForCell(day, category, shiftType) {
    const dayShifts = getShiftsForDayAndCategory(day, category, shiftType)
    if (dayShifts.length === 0) return null
    // Return first shift or combine if multiple
    return dayShifts[0]
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">לוח משמרות שבועי</h2>
          <p className="text-gray-600">צפה בכל המשמרות השבוע</p>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          <button
            onClick={() => setCurrentWeek(addWeeks(currentWeek, -1))}
            className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-lg font-semibold">
            {format(startOfWeek(currentWeek, { locale: he }), 'dd/MM/yyyy', { locale: he })} - {format(endOfWeek(currentWeek, { locale: he }), 'dd/MM/yyyy', { locale: he })}
          </div>
          <button
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentWeek(new Date())}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            היום
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              {/* Header row with days */}
              <tr>
                <th className="bg-red-600 text-white px-4 py-3 text-sm font-bold border border-gray-300">בוקר</th>
                {weekDays.map((day, index) => (
                  <th key={index} className="bg-red-600 text-white px-4 py-3 text-sm font-bold border border-gray-300 text-center">
                    {DAYS[index]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Morning section */}
              {MORNING_CATEGORIES.map((category) => (
                <tr key={`morning-${category}`}>
                  <td className="bg-blue-100 font-semibold px-4 py-3 border border-gray-300 text-sm">
                    {category}
                  </td>
                  {weekDays.map((day, dayIndex) => {
                    const shift = getShiftForCell(day, category, 'בוקר')
                    const isEmpty = !shift
                    return (
                      <td
                        key={`morning-${category}-${dayIndex}`}
                        className={`px-4 py-3 border border-gray-300 text-sm ${
                          isEmpty ? 'bg-gray-100' : 'bg-white'
                        }`}
                      >
                        {shift ? formatShiftDisplay(shift) : ''}
                      </td>
                    )
                  })}
                </tr>
              ))}

              {/* Separator row */}
              <tr>
                <td colSpan={8} className="bg-gray-200 h-2 border border-gray-300"></td>
              </tr>

              {/* Evening header */}
              <tr>
                <th className="bg-red-600 text-white px-4 py-3 text-sm font-bold border border-gray-300" colSpan={8}>
                  ערב
                </th>
              </tr>

              {/* Evening section */}
              {EVENING_CATEGORIES.map((category) => (
                <tr key={`evening-${category}`}>
                  <td className="bg-blue-100 font-semibold px-4 py-3 border border-gray-300 text-sm">
                    {category}
                  </td>
                  {weekDays.map((day, dayIndex) => {
                    const shift = getShiftForCell(day, category, 'ערב')
                    const isEmpty = !shift
                    return (
                      <td
                        key={`evening-${category}-${dayIndex}`}
                        className={`px-4 py-3 border border-gray-300 text-sm ${
                          isEmpty ? 'bg-gray-100' : 'bg-white'
                        }`}
                      >
                        {shift ? formatShiftDisplay(shift) : ''}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Special Days Alerts */}
      {(() => {
        const weekDays = eachDayOfInterval({
          start: startOfWeek(currentWeek, { locale: he }),
          end: endOfWeek(currentWeek, { locale: he })
        })
        const specialDaysInWeek = weekDays
          .map(day => ({ day, info: getSpecialDayInfo(day) }))
          .filter(({ info }) => info.isSpecial)
        
        if (specialDaysInWeek.length === 0) return null
        
        return (
          <div className="mt-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2 flex items-center">
              <AlertTriangle className="w-5 h-5 ml-2" />
              התראות ימים מיוחדים השבוע:
            </h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              {specialDaysInWeek.map(({ day, info }, idx) => (
                <li key={idx}>
                  <strong>{format(day, 'dd/MM/yyyy', { locale: he })}</strong> - {info.message}
                </li>
              ))}
            </ul>
          </div>
        )
      })()}

      {/* Legend */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">הסבר:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li><span className="bg-red-600 text-white px-2 py-1 rounded">בוקר/ערב</span> - כותרות משמרות</li>
          <li><span className="bg-blue-100 px-2 py-1 rounded">אחראי/פס/מטבח/נוסף</span> - קטגוריות תפקידים</li>
          <li>המספרים מייצגים שעות עבודה</li>
        </ul>
      </div>
    </div>
  )
}
