import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Calendar, ChevronLeft, ChevronRight, AlertTriangle, Edit2, X, Save, Plus, Trash2, Clock } from 'lucide-react'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { getSpecialDayInfo } from '../utils/holidayDetector'
import { formatHebrewDateShort } from '../utils/hebrewDate'
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
  const [editingCell, setEditingCell] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCell, setSelectedCell] = useState(null)

  const isManager = user?.role === 'manager'

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

    const employeesRef = collection(dbInstance, `artifacts/${appId}/employees`)
    
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
    const timeRange = shift.startTime && shift.endTime 
      ? `${shift.startTime}-${shift.endTime}` 
      : ''
    
    if (hours && timeRange) {
      return `${employeeName}\n${timeRange}\n(${hours}ש')`
    } else if (hours) {
      return `${employeeName} (${hours}ש')`
    } else if (timeRange) {
      return `${employeeName}\n${timeRange}`
    }
    return employeeName
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
    return dayShifts[0]
  }

  async function handleCellClick(day, category, shiftType) {
    if (!isManager) return
    
    const shift = getShiftForCell(day, category, shiftType)
    const dayStr = format(day, 'yyyy-MM-dd')
    
    setSelectedCell({ day, dayStr, category, shiftType, shift })
    if (shift) {
      setEditingCell(shift)
    } else {
      setShowAddModal(true)
    }
  }

  async function handleSaveShift(shiftData) {
    if (!db || !user) return

    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid

      if (editingCell && editingCell.id) {
        // Update existing shift
        const shiftRef = doc(dbInstance, `artifacts/${appId}/users/${userId}/assignedShifts/${editingCell.id}`)
        await updateDoc(shiftRef, {
          ...shiftData,
          updatedAt: new Date().toISOString()
        })
      } else {
        // Create new shift
        const shiftsRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/assignedShifts`)
        await addDoc(shiftsRef, {
          ...shiftData,
          createdAt: new Date().toISOString()
        })
      }

      setEditingCell(null)
      setShowAddModal(false)
      setSelectedCell(null)
    } catch (error) {
      console.error('Error saving shift:', error)
      alert('שגיאה בשמירת המשמרת: ' + error.message)
    }
  }

  async function handleDeleteShift(shiftId) {
    if (!confirm('האם אתה בטוח שברצונך למחוק משמרת זו?')) return
    if (!db || !user) return

    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid

      const shiftRef = doc(dbInstance, `artifacts/${appId}/users/${userId}/assignedShifts/${shiftId}`)
      await deleteDoc(shiftRef)
      
      setEditingCell(null)
      setShowAddModal(false)
      setSelectedCell(null)
    } catch (error) {
      console.error('Error deleting shift:', error)
      alert('שגיאה במחיקת המשמרת: ' + error.message)
    }
  }

  function getCellClassName(day, category, shiftType, isEmpty) {
    const baseClasses = 'px-4 py-3 border border-gray-300 text-sm transition-all duration-200'
    const hoverClasses = isManager ? 'hover:bg-blue-50 hover:shadow-md cursor-pointer' : ''
    const emptyClasses = isEmpty ? 'bg-gray-50' : 'bg-gradient-to-br from-white to-blue-50'
    const specialDay = getSpecialDayInfo(day)
    const specialClasses = specialDay.isSpecial ? 'ring-2 ring-yellow-400' : ''
    
    return `${baseClasses} ${hoverClasses} ${emptyClasses} ${specialClasses}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-2 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with animations */}
        <div className="mb-8 bg-white rounded-2xl shadow-xl p-6 transform transition-all duration-300 hover:shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-right">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 animate-pulse">
                לוח משמרות שבועי
              </h2>
              <p className="text-gray-600">צפה וערוך את כל המשמרות השבוע</p>
              {isManager && (
                <p className="text-sm text-blue-600 mt-2 flex items-center justify-center md:justify-end gap-1">
                  <Edit2 className="w-4 h-4" />
                  לחץ על תא כדי לערוך או להוסיף משמרת
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentWeek(addWeeks(currentWeek, -1))}
                  className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 transform active:scale-95 shadow-lg touch-manipulation"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="text-sm sm:text-lg font-bold text-gray-800 bg-gray-100 px-2 sm:px-4 py-2 rounded-xl text-center">
                  <span className="hidden sm:inline">{format(startOfWeek(currentWeek, { locale: he }), 'dd/MM/yyyy', { locale: he })} - {format(endOfWeek(currentWeek, { locale: he }), 'dd/MM/yyyy', { locale: he })}</span>
                  <span className="sm:hidden">{format(startOfWeek(currentWeek, { locale: he }), 'dd/MM', { locale: he })}</span>
                </div>
                <button
                  onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                  className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 transform active:scale-95 shadow-lg touch-manipulation"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => setCurrentWeek(new Date())}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all duration-200 transform active:scale-95 shadow-lg font-semibold text-sm sm:text-base touch-manipulation"
                >
                  היום
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Table with enhanced design */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:shadow-3xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-red-500 via-red-600 to-red-700">
                  <th className="text-white px-6 py-4 text-sm font-bold border-r border-red-400 shadow-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      בוקר
                    </div>
                  </th>
                  {weekDays.map((day, index) => {
                    const specialDay = getSpecialDayInfo(day)
                    return (
                      <th 
                        key={index} 
                        className={`text-white px-4 py-4 text-sm font-bold border-r border-red-400 text-center ${
                          specialDay.isSpecial ? 'bg-gradient-to-b from-yellow-400 to-yellow-600' : ''
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span>{DAYS[index]}</span>
                          <span className="text-xs opacity-90">{format(day, 'dd/MM', { locale: he })}</span>
                          <span className="text-xs opacity-75 text-yellow-200">{formatHebrewDateShort(day)}</span>
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {/* Morning section */}
                {MORNING_CATEGORIES.map((category, catIndex) => (
                  <tr key={`morning-${category}`} className="hover:bg-blue-50 transition-colors">
                    <td className="bg-gradient-to-r from-blue-100 to-blue-200 font-bold px-3 sm:px-6 py-3 sm:py-4 border-r border-gray-300 text-xs sm:text-sm shadow-inner">
                      {category}
                    </td>
                    {weekDays.map((day, dayIndex) => {
                      const shift = getShiftForCell(day, category, 'בוקר')
                      const isEmpty = !shift
                      return (
                        <td
                          key={`morning-${category}-${dayIndex}`}
                          onClick={() => handleCellClick(day, category, 'בוקר')}
                          className={`${getCellClassName(day, category, 'בוקר', isEmpty)} touch-manipulation`}
                        >
                          {shift ? (
                            <div className="flex flex-col items-start justify-between group min-h-[60px]">
                              <div className="flex-1 w-full">
                                <div className="font-medium text-gray-800 text-xs sm:text-sm whitespace-pre-line leading-tight">
                                  {formatShiftDisplay(shift)}
                                </div>
                              </div>
                              {isManager && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingCell(shift)
                                  }}
                                  className="opacity-0 group-hover:opacity-100 sm:opacity-0 transition-opacity p-1 hover:bg-blue-200 rounded touch-manipulation mt-1 self-end"
                                >
                                  <Edit2 className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                                </button>
                              )}
                            </div>
                          ) : (
                            isManager && (
                              <div className="flex items-center justify-center text-gray-400">
                                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                              </div>
                            )
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}

                {/* Separator row */}
                <tr>
                  <td colSpan={8} className="bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 h-3 border-0"></td>
                </tr>

                {/* Evening header */}
                <tr>
                  <th className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 text-white px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold border-r border-orange-400 shadow-lg" colSpan={8}>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>ערב</span>
                    </div>
                  </th>
                </tr>

                {/* Evening section */}
                {EVENING_CATEGORIES.map((category) => (
                  <tr key={`evening-${category}`} className="hover:bg-orange-50 transition-colors">
                    <td className="bg-gradient-to-r from-orange-100 to-orange-200 font-bold px-3 sm:px-6 py-3 sm:py-4 border-r border-gray-300 text-xs sm:text-sm shadow-inner">
                      {category}
                    </td>
                    {weekDays.map((day, dayIndex) => {
                      const shift = getShiftForCell(day, category, 'ערב')
                      const isEmpty = !shift
                      return (
                        <td
                          key={`evening-${category}-${dayIndex}`}
                          onClick={() => handleCellClick(day, category, 'ערב')}
                          className={`${getCellClassName(day, category, 'ערב', isEmpty)} touch-manipulation`}
                        >
                          {shift ? (
                            <div className="flex flex-col items-start justify-between group min-h-[60px]">
                              <div className="flex-1 w-full">
                                <div className="font-medium text-gray-800 text-xs sm:text-sm whitespace-pre-line leading-tight">
                                  {formatShiftDisplay(shift)}
                                </div>
                              </div>
                              {isManager && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingCell(shift)
                                  }}
                                  className="opacity-0 group-hover:opacity-100 sm:opacity-0 transition-opacity p-1 hover:bg-orange-200 rounded touch-manipulation mt-1 self-end"
                                >
                                  <Edit2 className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                                </button>
                              )}
                            </div>
                          ) : (
                            isManager && (
                              <div className="flex items-center justify-center text-gray-400">
                                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                              </div>
                            )
                          )}
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
            <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-2xl p-6 shadow-lg animate-pulse">
              <h3 className="font-bold text-yellow-800 mb-3 flex items-center text-lg">
                <AlertTriangle className="w-6 h-6 ml-2" />
                התראות ימים מיוחדים השבוע:
              </h3>
              <ul className="text-sm text-yellow-700 space-y-2">
                {specialDaysInWeek.map(({ day, info }, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="font-bold bg-yellow-200 px-3 py-1 rounded-lg">
                      {format(day, 'dd/MM/yyyy', { locale: he })}
                    </span>
                    <span>{info.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })()}

        {/* Edit/Add Modal */}
        {(editingCell || showAddModal) && selectedCell && (
          <ShiftEditModal
            shift={editingCell}
            cell={selectedCell}
            employees={employees}
            onSave={handleSaveShift}
            onDelete={handleDeleteShift}
            onClose={() => {
              setEditingCell(null)
              setShowAddModal(false)
              setSelectedCell(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

// Shift Edit Modal Component
function ShiftEditModal({ shift, cell, employees, onSave, onDelete, onClose }) {
  const [formData, setFormData] = useState(() => ({
    employeeId: shift?.employeeId || '',
    date: cell.dayStr,
    shiftType: cell.shiftType,
    category: cell.category,
    startTime: shift?.startTime || '08:00',
    endTime: shift?.endTime || '16:00',
    hours: shift?.hours || ''
  }))

  function handleSubmit(e) {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 scale-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            {shift ? 'ערוך משמרת' : 'הוסף משמרת חדשה'}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">עובד</label>
            <select
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">בחר עובד</option>
              {employees
                .filter(emp => {
                  // Filter by category
                  if (cell.category === 'אחראי') return emp.role === 'manager' || emp.category === 'אחראי'
                  if (cell.category === 'פס') return emp.category === 'פס'
                  if (cell.category === 'מטבח') return emp.category === 'מטבח'
                  if (cell.category === 'נוסף') return emp.category === 'נוסף'
                  return true
                })
                .map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">שעת התחלה</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">שעת סיום</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Save className="w-4 h-4 inline ml-2" />
              שמור
            </button>
            {shift && (
              <button
                type="button"
                onClick={() => onDelete(shift.id)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-all duration-200"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
