import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Users, Calendar, AlertTriangle, Settings, Zap, Megaphone } from 'lucide-react'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import AutoScheduler from '../components/AutoScheduler'

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
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">לוח בקרה - מנהל</h2>
        <p className="text-gray-600">סקירה כללית של המערכת</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">סה"כ עובדים</p>
              <p className="text-3xl font-bold text-gray-800">{loading ? '...' : stats.totalEmployees}</p>
            </div>
            <Users className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">משמרות פעילות</p>
              <p className="text-3xl font-bold text-gray-800">{loading ? '...' : stats.activeShifts}</p>
            </div>
            <Calendar className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">בקשות ממתינות</p>
              <p className="text-3xl font-bold text-gray-800">{loading ? '...' : stats.pendingRequests}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">אירועים קרובים</p>
              <p className="text-3xl font-bold text-gray-800">{loading ? '...' : stats.upcomingEvents}</p>
            </div>
            <Calendar className="w-12 h-12 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/schedule"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">לוח משמרות</h3>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-600">צפה ונהל את לוח המשמרות השבועי</p>
        </Link>

        <Link
          to="/employees"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">ניהול עובדים</h3>
            <Users className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-600">הוסף, ערוך ומחק עובדים</p>
        </Link>

        <Link
          to="/events"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">ניהול אירועים</h3>
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-gray-600">הוסף אירועים מיוחדים וצריך כוח אדם נוסף</p>
        </Link>

        <Link
          to="/tasks"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">משימות שבועיות</h3>
            <Settings className="w-8 h-8 text-orange-600" />
          </div>
          <p className="text-gray-600">הגדר משימות שבועיות לעובדים</p>
        </Link>

        <Link
          to="/notifications"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">שליחת התראות</h3>
            <Zap className="w-8 h-8 text-pink-600" />
          </div>
          <p className="text-gray-600">שלח הודעות יומיות לעובדים</p>
        </Link>

        <div className="bg-white rounded-lg shadow-md p-6">
          <AutoScheduler />
        </div>
      </div>
    </div>
  )
}

