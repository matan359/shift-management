import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

export default function CalendarView() {
  const { user, db } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [shifts, setShifts] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!db || !user) return

    const dbInstance = db || getFirebaseDb()
    const appId = getAppId()
    const userId = user.uid

    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)

    const shiftsRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/assignedShifts`)
    
    const unsubscribe = onSnapshot(shiftsRef, (snapshot) => {
      const shiftsData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(shift => {
          if (!shift.date) return false
          const shiftDate = parseISO(shift.date)
          return shiftDate >= monthStart && shiftDate <= monthEnd
        })

      setShifts(shiftsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [db, user, currentDate])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Get first day of week for calendar grid
  const firstDayOfWeek = monthStart.getDay()
  const emptyDays = Array(firstDayOfWeek === 6 ? 0 : firstDayOfWeek + 1).fill(null)

  function getShiftsForDate(date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    return shifts.filter(shift => shift.date === dateStr)
  }

  function goToPreviousMonth() {
    setCurrentDate(subMonths(currentDate, 1))
  }

  function goToNextMonth() {
    setCurrentDate(addMonths(currentDate, 1))
  }

  function goToToday() {
    setCurrentDate(new Date())
  }

  const selectedDateShifts = selectedDate ? getShiftsForDate(selectedDate) : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-50 to-white p-2 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 glass-effect rounded-2xl shadow-glow p-4 sm:p-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-green-700 mb-2 flex items-center gap-3">
                <CalendarIcon className="w-8 h-8 text-green-600" />
                תצוגת לוח שנה
              </h1>
              <p className="text-gray-600 text-sm sm:text-base font-medium">
                צפה בכל המשמרות בלוח שנה חודשי
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={goToPreviousMonth}
                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
              >
                היום
              </button>
              <button
                onClick={goToNextMonth}
                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="mt-4 text-center">
            <h2 className="text-2xl font-bold text-green-700">
              {format(currentDate, 'MMMM yyyy', { locale: he })}
            </h2>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="glass-effect rounded-2xl shadow-glow p-4 sm:p-6 mb-6 animate-fadeIn">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((day, index) => (
              <div key={index} className="text-center font-bold text-green-700 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month start */}
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square"></div>
            ))}

            {/* Days of the month */}
            {daysInMonth.map((day) => {
              const dayShifts = getShiftsForDate(day)
              const isToday = isSameDay(day, new Date())
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`aspect-square border-2 rounded-lg p-2 transition-all hover:shadow-md ${
                    isToday
                      ? 'border-green-500 bg-green-50 font-bold'
                      : isSelected
                      ? 'border-green-400 bg-green-100'
                      : 'border-gray-200 bg-white hover:border-green-300'
                  }`}
                >
                  <div className="text-right mb-1">
                    <span className={`text-sm ${isToday ? 'text-green-700' : 'text-gray-700'}`}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayShifts.slice(0, 3).map((shift, idx) => (
                      <div
                        key={shift.id}
                        className="text-xs bg-green-200 text-green-800 rounded px-1 truncate"
                      >
                        {shift.shiftType} {shift.startTime}
                      </div>
                    ))}
                    {dayShifts.length > 3 && (
                      <div className="text-xs text-green-600 font-bold">
                        +{dayShifts.length - 3}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="glass-effect rounded-2xl shadow-glow p-4 sm:p-6 animate-slideUp">
            <h3 className="text-xl font-bold text-green-700 mb-4">
              משמרות ב-{format(selectedDate, 'dd/MM/yyyy', { locale: he })}
            </h3>
            {selectedDateShifts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">אין משמרות בתאריך זה</p>
            ) : (
              <div className="space-y-3">
                {selectedDateShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="border-2 border-green-200 rounded-xl p-4 bg-green-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-800">{shift.shiftType}</p>
                        <p className="text-sm text-gray-600">
                          {shift.startTime} - {shift.endTime}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

