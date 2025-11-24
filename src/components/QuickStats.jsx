import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'
import { TrendingUp, Users, Calendar, Clock, Zap } from 'lucide-react'

export default function QuickStats() {
  const { user, db } = useAuth()
  const [stats, setStats] = useState({
    thisWeekShifts: 0,
    todayShifts: 0,
    activeEmployees: 0,
    totalHours: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!db || !user) return
    loadStats()
  }, [db, user])

  async function loadStats() {
    if (!db || !user) return
    
    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid
      
      if (!userId) return

      const now = new Date()
      const weekStart = startOfWeek(now, { locale: he })
      const weekEnd = endOfWeek(now, { locale: he })
      const today = new Date().toISOString().split('T')[0]

      // Count employees
      const employeesRef = collection(dbInstance, `artifacts/${appId}/employees`)
      const employeesSnapshot = await getDocs(employeesRef)
      const activeEmployees = employeesSnapshot.docs.filter(doc => doc.data().isActive !== false).length

      // Count shifts
      const shiftsRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/assignedShifts`)
      const shiftsSnapshot = await getDocs(shiftsRef)
      
      let thisWeekShifts = 0
      let todayShifts = 0
      let totalHours = 0

      shiftsSnapshot.docs.forEach(doc => {
        const shift = doc.data()
        if (!shift.date) return

        const shiftDate = parseISO(shift.date)
        
        if (isWithinInterval(shiftDate, { start: weekStart, end: weekEnd })) {
          thisWeekShifts++
        }
        
        if (shift.date === today) {
          todayShifts++
        }

        // Calculate hours
        if (shift.startTime && shift.endTime) {
          try {
            const [startH, startM] = shift.startTime.split(':').map(Number)
            const [endH, endM] = shift.endTime.split(':').map(Number)
            const startMinutes = startH * 60 + startM
            const endMinutes = endH * 60 + endM
            const diffMinutes = endMinutes - startMinutes
            const hours = diffMinutes / 60
            if (hours > 0) {
              totalHours += hours
            }
          } catch (e) {
            // Ignore calculation errors
          }
        }
      })

      setStats({
        thisWeekShifts,
        todayShifts,
        activeEmployees,
        totalHours: Math.round(totalHours)
      })
      setLoading(false)
    } catch (error) {
      console.error('Error loading stats:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="glass-effect rounded-2xl shadow-glow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-effect rounded-2xl shadow-glow p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-bold text-green-700 mb-4 flex items-center">
        <Zap className="w-5 h-5 ml-2 text-green-600" />
        סטטיסטיקות מהירות
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 sm:p-4 border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">משמרות השבוע</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-700">{stats.thisWeekShifts}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 sm:p-4 border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">משמרות היום</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-700">{stats.todayShifts}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 sm:p-4 border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">עובדים פעילים</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-700">{stats.activeEmployees}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 sm:p-4 border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">סה"כ שעות</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-700">{stats.totalHours}</p>
        </div>
      </div>
    </div>
  )
}

