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
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          ברוך הבא, {user?.fullName}
        </h2>
        <p className="text-gray-600">לוח בקרה אישי</p>
      </div>

      <AnnouncementsBanner />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">משמרות השבוע</p>
              <p className="text-3xl font-bold text-gray-800">{shifts.length}</p>
            </div>
            <Calendar className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">משמרות קרובות</p>
              <p className="text-3xl font-bold text-gray-800">{upcomingShifts.length}</p>
            </div>
            <Clock className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">סטטוס</p>
              <p className="text-lg font-semibold text-gray-800">פעיל</p>
            </div>
            <CheckCircle className="w-12 h-12 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">פעולות מהירות</h3>
          <div className="space-y-3">
            <Link
              to="/availability"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition text-center"
            >
              הגשת זמינות שבועית
            </Link>
            <Link
              to="/swap"
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition text-center"
            >
              החלפת משמרת
            </Link>
            <Link
              to="/schedule"
              className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition text-center"
            >
              צפייה בלוח משמרות
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">משמרות קרובות</h3>
          {loading ? (
            <p className="text-gray-500">טוען...</p>
          ) : upcomingShifts.length === 0 ? (
            <p className="text-gray-500">אין משמרות קרובות</p>
          ) : (
            <div className="space-y-3">
              {upcomingShifts.map((shift) => (
                <div key={shift.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{format(parseISO(shift.date), 'dd/MM/yyyy', { locale: he })}</p>
                      <p className="text-sm text-gray-600">{shift.startTime} - {shift.endTime}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      shift.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {shift.status === 'confirmed' ? 'מאושר' : 'ממתין'}
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

