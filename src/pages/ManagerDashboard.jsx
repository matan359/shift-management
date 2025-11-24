import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Users, Calendar, AlertTriangle, Settings, Zap, Megaphone } from 'lucide-react'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import AutoScheduler from '../components/AutoScheduler'
import QuickStats from '../components/QuickStats'

export default function ManagerDashboard() {
  const { user, db } = useAuth()
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeShifts: 0,
    pendingRequests: 0,
    upcomingEvents: 0
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

      // Count employees
      const employeesRef = collection(dbInstance, `artifacts/${appId}/employees`)
      const employeesSnapshot = await getDocs(employeesRef)
      const totalEmployees = employeesSnapshot.size

      // Count active shifts (this week)
      const shiftsRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/assignedShifts`)
      const shiftsSnapshot = await getDocs(shiftsRef)
      const activeShifts = shiftsSnapshot.size

      // Count pending swap requests
      const swapsRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/swapRequests`)
      const pendingSwapsQuery = query(swapsRef, where('status', '==', 'pending'))
      const pendingSwapsSnapshot = await getDocs(pendingSwapsQuery)
      const pendingRequests = pendingSwapsSnapshot.size

      // Count upcoming events
      const eventsRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/events`)
      const eventsSnapshot = await getDocs(eventsRef)
      const upcomingEvents = eventsSnapshot.size

      setStats({
        totalEmployees,
        activeShifts,
        pendingRequests,
        upcomingEvents
      })
      setLoading(false)
    } catch (error) {
      console.error('Error loading stats:', error)
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-4 sm:mb-6 px-2 sm:px-0">
        <h2 className="text-3xl sm:text-4xl font-bold text-green-700 mb-2">
          לוח בקרה - מנהל 👨‍💼
        </h2>
        <p className="text-sm sm:text-base text-gray-600 font-medium">סקירה כללית של המערכת</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 px-2 sm:px-0">
        <div className="glass-effect rounded-2xl shadow-glow p-4 sm:p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">סה"כ עובדים</p>
              <p className="text-3xl sm:text-4xl font-bold text-green-700">{loading ? '...' : stats.totalEmployees}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-lg animate-float">
              <Users className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-effect rounded-2xl shadow-glow p-4 sm:p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">משמרות פעילות</p>
              <p className="text-3xl sm:text-4xl font-bold text-green-700">{loading ? '...' : stats.activeShifts}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-lg animate-float" style={{ animationDelay: '0.3s' }}>
              <Calendar className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-effect rounded-2xl shadow-glow p-4 sm:p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">בקשות ממתינות</p>
              <p className="text-3xl sm:text-4xl font-bold text-yellow-600">{loading ? '...' : stats.pendingRequests}</p>
            </div>
            <div className="p-3 bg-yellow-500 rounded-xl shadow-lg animate-float" style={{ animationDelay: '0.6s' }}>
              <AlertTriangle className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-effect rounded-2xl shadow-glow p-4 sm:p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">אירועים קרובים</p>
              <p className="text-3xl sm:text-4xl font-bold text-green-700">{loading ? '...' : stats.upcomingEvents}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-lg animate-float" style={{ animationDelay: '0.9s' }}>
              <Calendar className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-2 sm:px-0">
        <Link
          to="/schedule"
          className="glass-effect rounded-2xl shadow-glow p-4 sm:p-6 card-hover touch-manipulation"
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-green-700">📅 לוח משמרות</h3>
            <div className="p-2 bg-green-600 rounded-lg">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
          <p className="text-sm sm:text-base text-gray-600 font-medium">צפה ונהל את לוח המשמרות השבועי</p>
        </Link>

        <Link
          to="/employees"
          className="glass-effect rounded-2xl shadow-glow p-4 sm:p-6 card-hover touch-manipulation"
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-green-700">👥 ניהול עובדים</h3>
            <div className="p-2 bg-green-600 rounded-lg">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
          <p className="text-sm sm:text-base text-gray-600 font-medium">הוסף, ערוך ומחק עובדים</p>
        </Link>

        <Link
          to="/events"
          className="glass-effect rounded-2xl shadow-glow p-4 sm:p-6 card-hover touch-manipulation"
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-green-700">🎉 ניהול אירועים</h3>
            <div className="p-2 bg-green-600 rounded-lg">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
          <p className="text-sm sm:text-base text-gray-600 font-medium">הוסף אירועים מיוחדים וצריך כוח אדם נוסף</p>
        </Link>

        <Link
          to="/tasks"
          className="glass-effect rounded-2xl shadow-glow p-4 sm:p-6 card-hover touch-manipulation"
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-green-700">✅ משימות שבועיות</h3>
            <div className="p-2 bg-green-600 rounded-lg">
              <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
          <p className="text-sm sm:text-base text-gray-600 font-medium">הגדר משימות שבועיות לעובדים</p>
        </Link>

        <Link
          to="/notifications"
          className="glass-effect rounded-2xl shadow-glow p-4 sm:p-6 card-hover touch-manipulation"
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-green-700">📱 שליחת התראות</h3>
            <div className="p-2 bg-green-600 rounded-lg">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
          <p className="text-sm sm:text-base text-gray-600 font-medium">שלח הודעות יומיות לעובדים</p>
        </Link>

        <div className="glass-effect rounded-2xl shadow-glow p-4 sm:p-6">
          <AutoScheduler />
        </div>
      </div>

      {/* Quick Stats Widget */}
      <div className="mt-6 sm:mt-8 px-2 sm:px-0">
        <QuickStats />
      </div>
    </div>
  )
}

