import { useState, useEffect } from 'react'
import { collection as col, getDocs as getDocsQuery } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { getFirebaseDb, getAppId, getFirebaseAuth } from '../api/firebase'
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore'
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'
import AnnouncementsBanner from '../components/AnnouncementsBanner'

export default function WorkerDashboard() {
  const { user, db } = useAuth()
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!db || !user || !user.id) return

    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid || getFirebaseAuth()?.currentUser?.uid
      
      if (!userId) return
      
      // Get shifts for current week
      const now = new Date()
      const weekStart = startOfWeek(now, { locale: he })
      const weekEnd = endOfWeek(now, { locale: he })

      const shiftsRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/assignedShifts`)
      const q = query(shiftsRef, where('employeeId', '==', user.id))

      const unsubscribe = onSnapshot(q, (snapshot) => {
      const shiftsData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(shift => {
          const shiftDate = parseISO(shift.date)
          return isWithinInterval(shiftDate, { start: weekStart, end: weekEnd })
        })
        .sort((a, b) => a.date.localeCompare(b.date))

        setShifts(shiftsData)
        setLoading(false)
      }, (error) => {
        console.error('Error loading shifts:', error)
        setLoading(false)
      })

      return () => unsubscribe()
    } catch (error) {
      console.error('Error setting up shifts listener:', error)
      setLoading(false)
    }
  }, [db, user])

  const upcomingShifts = shifts.filter(shift => {
    const shiftDate = parseISO(shift.date)
    return shiftDate >= new Date()
  }).slice(0, 5)

  return (
    <div>
      <div className="mb-4 sm:mb-6 px-2 sm:px-0">
        <h2 className="text-3xl sm:text-4xl font-bold text-green-700 mb-2">
          ברוך הבא, {user?.fullName} 👋
        </h2>
        <p className="text-sm sm:text-base text-gray-600 font-medium">לוח בקרה אישי</p>
      </div>

      <AnnouncementsBanner />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 px-2 sm:px-0">
        <div className="glass-effect rounded-2xl shadow-glow p-4 sm:p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">משמרות השבוע</p>
              <p className="text-3xl sm:text-4xl font-bold text-green-700">{shifts.length}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-lg animate-float">
              <Calendar className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-effect rounded-2xl shadow-glow p-4 sm:p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">משמרות קרובות</p>
              <p className="text-3xl sm:text-4xl font-bold text-green-700">{upcomingShifts.length}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-lg animate-float" style={{ animationDelay: '0.5s' }}>
              <Clock className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-effect rounded-2xl shadow-glow p-4 sm:p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">סטטוס</p>
              <p className="text-lg sm:text-xl font-bold text-green-700">פעיל ✅</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-lg animate-float" style={{ animationDelay: '1s' }}>
              <CheckCircle className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 px-2 sm:px-0">
        <div className="glass-effect rounded-2xl shadow-glow p-4 sm:p-6 card-hover">
          <h3 className="text-xl sm:text-2xl font-bold text-green-700 mb-4">פעולות מהירות</h3>
          <div className="space-y-3">
            <Link
              to="/availability"
              className="block w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-4 rounded-xl transition-all duration-200 text-center touch-manipulation active:scale-95 shadow-lg transform hover:scale-105"
            >
              📅 הגשת זמינות שבועית
            </Link>
            <Link
              to="/swap"
              className="block w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-4 rounded-xl transition-all duration-200 text-center touch-manipulation active:scale-95 shadow-lg transform hover:scale-105"
            >
              🔄 החלפת משמרת
            </Link>
            <Link
              to="/schedule"
              className="block w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-4 rounded-xl transition-all duration-200 text-center touch-manipulation active:scale-95 shadow-lg transform hover:scale-105"
            >
              📊 צפייה בלוח משמרות
            </Link>
          </div>
        </div>

        <div className="glass-effect rounded-2xl shadow-glow p-4 sm:p-6 card-hover">
          <h3 className="text-xl sm:text-2xl font-bold text-green-700 mb-4">משמרות קרובות</h3>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
              <p className="text-gray-500 text-sm">טוען משמרות...</p>
            </div>
          ) : upcomingShifts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">אין משמרות קרובות</p>
              <p className="text-gray-400 text-sm mt-2">הגש זמינות כדי לקבל משמרות</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingShifts.map((shift) => (
                <div key={shift.id} className="bg-gradient-to-r from-white to-blue-50 border-2 border-blue-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-gray-800 text-base sm:text-lg">{format(parseISO(shift.date), 'dd/MM/yyyy', { locale: he })}</p>
                      <p className="text-sm sm:text-base text-gray-600 font-medium">🕐 {shift.startTime} - {shift.endTime}</p>
                    </div>
                    <span className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold shadow-md ${
                      shift.status === 'confirmed' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-yellow-500 text-white'
                    }`}>
                      {shift.status === 'confirmed' ? '✅ מאושר' : '⏳ ממתין'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

