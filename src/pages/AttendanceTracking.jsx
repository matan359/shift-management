import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, addDoc, query, where, getDocs, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { format, isToday, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'
import { Clock, CheckCircle, XCircle, MapPin, Calendar, TrendingUp } from 'lucide-react'

export default function AttendanceTracking() {
  const { user, db } = useAuth()
  const [checkInTime, setCheckInTime] = useState(null)
  const [checkOutTime, setCheckOutTime] = useState(null)
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [attendanceHistory, setAttendanceHistory] = useState([])
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!db || !user) return
    loadTodayAttendance()
    loadAttendanceHistory()
    getCurrentLocation()
  }, [db, user])

  async function getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  async function loadTodayAttendance() {
    if (!db || !user) return

    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const today = format(new Date(), 'yyyy-MM-dd')

      const attendanceRef = collection(dbInstance, `artifacts/${appId}/attendance`)
      const q = query(
        attendanceRef,
        where('employeeId', '==', user.id),
        where('date', '==', today)
      )
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        const record = snapshot.docs[0].data()
        setCheckInTime(record.checkInTime)
        setCheckOutTime(record.checkOutTime)
        setIsCheckedIn(!!record.checkInTime && !record.checkOutTime)
      }
    } catch (error) {
      console.error('Error loading attendance:', error)
    }
  }

  async function loadAttendanceHistory() {
    if (!db || !user) return

    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()

      const attendanceRef = collection(dbInstance, `artifacts/${appId}/attendance`)
      const q = query(attendanceRef, where('employeeId', '==', user.id))
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const records = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 30) // Last 30 days
        
        setAttendanceHistory(records)
      })

      return () => unsubscribe()
    } catch (error) {
      console.error('Error loading attendance history:', error)
    }
  }

  async function handleCheckIn() {
    if (!db || !user || isCheckedIn) return

    setLoading(true)
    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const now = new Date()
      const today = format(now, 'yyyy-MM-dd')
      const time = format(now, 'HH:mm')

      const attendanceRef = collection(dbInstance, `artifacts/${appId}/attendance`)
      await addDoc(attendanceRef, {
        employeeId: user.id,
        employeeName: user.fullName,
        date: today,
        checkInTime: time,
        checkInTimestamp: now.toISOString(),
        location: location,
        status: 'present'
      })

      setIsCheckedIn(true)
      setCheckInTime(time)
      alert('נרשמת כניסה בהצלחה!')
    } catch (error) {
      console.error('Error checking in:', error)
      alert('שגיאה ברישום כניסה')
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckOut() {
    if (!db || !user || !isCheckedIn) return

    setLoading(true)
    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const today = format(new Date(), 'yyyy-MM-dd')
      const time = format(new Date(), 'HH:mm')

      const attendanceRef = collection(dbInstance, `artifacts/${appId}/attendance`)
      const q = query(
        attendanceRef,
        where('employeeId', '==', user.id),
        where('date', '==', today)
      )
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        const recordRef = doc(dbInstance, `artifacts/${appId}/attendance/${snapshot.docs[0].id}`)
        await updateDoc(recordRef, {
          checkOutTime: time,
          checkOutTimestamp: new Date().toISOString(),
          status: 'completed'
        })

        setIsCheckedIn(false)
        setCheckOutTime(time)
        alert('נרשמה יציאה בהצלחה!')
      }
    } catch (error) {
      console.error('Error checking out:', error)
      alert('שגיאה ברישום יציאה')
    } finally {
      setLoading(false)
    }
  }

  function calculateHours(checkIn, checkOut) {
    if (!checkIn || !checkOut) return '-'
    const [inHour, inMin] = checkIn.split(':').map(Number)
    const [outHour, outMin] = checkOut.split(':').map(Number)
    const totalMinutes = (outHour * 60 + outMin) - (inHour * 60 + inMin)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours}:${minutes.toString().padStart(2, '0')}`
  }

  return (
    <div className="animate-fadeIn">
      <div className="mb-6 sm:mb-8 px-2 sm:px-0">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
          מעקב נוכחות
        </h2>
        <p className="text-sm sm:text-base text-gray-600">רישום כניסה ויציאה</p>
      </div>

      {/* Check In/Out Card */}
      <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 border border-gray-200 mx-2 sm:mx-0">
        <div className="text-center mb-4 sm:mb-6">
          <div className={`inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-3 sm:mb-4 ${
            isCheckedIn 
              ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
              : 'bg-gradient-to-br from-blue-400 to-indigo-500'
          }`}>
            <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
            {isCheckedIn ? 'אתה מחובר' : 'אתה לא מחובר'}
          </h3>
          <p className="text-sm sm:text-base text-gray-600">
            {isCheckedIn 
              ? `כניסה: ${checkInTime}` 
              : 'לחץ על כפתור הכניסה כדי להתחיל'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          {!isCheckedIn ? (
            <button
              onClick={handleCheckIn}
              disabled={loading}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-200 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-base sm:text-lg touch-manipulation"
            >
              <CheckCircle className="w-5 h-5 inline ml-2" />
              {loading ? 'מתחבר...' : 'התחבר'}
            </button>
          ) : (
            <button
              onClick={handleCheckOut}
              disabled={loading}
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-200 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-base sm:text-lg touch-manipulation"
            >
              <XCircle className="w-5 h-5 inline ml-2" />
              {loading ? 'יוצא...' : 'התנתק'}
            </button>
          )}
        </div>

        {location && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center text-blue-800">
              <MapPin className="w-5 h-5 ml-2" />
              <span className="text-sm">מיקום נרשם: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 px-2 sm:px-0">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">נוכחות החודש</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800">95%</p>
            </div>
            <TrendingUp className="w-8 h-8 sm:w-12 sm:h-12 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">שעות החודש</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800">168h</p>
            </div>
            <Clock className="w-8 h-8 sm:w-12 sm:h-12 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">ימים פעילים</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800">22</p>
            </div>
            <Calendar className="w-8 h-8 sm:w-12 sm:h-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 mx-2 sm:mx-0">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">היסטוריית נוכחות</h3>
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <div className="min-w-full inline-block align-middle">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">תאריך</th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">כניסה</th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">יציאה</th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">סה״כ שעות</th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {attendanceHistory.map((record) => (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-800">
                      {format(parseISO(record.date), 'dd/MM/yyyy', { locale: he })}
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-800">{record.checkInTime || '-'}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-800">{record.checkOutTime || '-'}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-800">
                      {calculateHours(record.checkInTime, record.checkOutTime)}
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                        record.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : record.status === 'present'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {record.status === 'completed' ? 'הושלם' : record.status === 'present' ? 'פעיל' : 'חסר'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

