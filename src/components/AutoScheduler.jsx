import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Zap, Calendar, Loader } from 'lucide-react'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, addDoc, doc, setDoc } from 'firebase/firestore'
import { startOfWeek, endOfWeek, format } from 'date-fns'
import { he } from 'date-fns/locale'
import { autoScheduleShifts } from '../utils/autoScheduler'

export default function AutoScheduler({ onComplete }) {
  const { user, db } = useAuth()
  const [loading, setLoading] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState(new Date())

  async function runAutoSchedule() {
    if (!db || !user) {
      alert('שגיאה: Firebase לא מאותחל')
      return
    }

    setLoading(true)
    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid

      const weekStart = startOfWeek(selectedWeek, { locale: he })
      const weekEnd = endOfWeek(selectedWeek, { locale: he })

      // Run auto scheduler
      const assignments = await autoScheduleShifts(
        dbInstance,
        appId,
        userId,
        weekStart,
        weekEnd
      )

      // Save assignments to Firestore
      const shiftsRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/assignedShifts`)

      for (const assignment of assignments) {
        // Check if shift already exists
        const shiftId = `${assignment.employeeId}_${assignment.date}`
        const shiftRef = doc(shiftsRef, shiftId)
        
        await setDoc(shiftRef, assignment, { merge: true })
      }

      alert(`שיבוץ הושלם בהצלחה! ${assignments.length} משמרות שובצו.`)
      
      if (onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error('Error running auto schedule:', error)
      alert('שגיאה בביצוע השיבוץ האוטומטי: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <Zap className="w-8 h-8 text-yellow-600" />
          <div>
            <h3 className="text-xl font-semibold text-gray-800">שיבוץ אוטומטי מבוסס AI</h3>
            <p className="text-sm text-gray-600">המערכת תשבץ משמרות אוטומטית לפי זמינות והעדפות</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          שבוע לשיבוץ
        </label>
        <input
          type="date"
          value={format(selectedWeek, 'yyyy-MM-dd')}
          onChange={(e) => setSelectedWeek(new Date(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
        />
      </div>

      <button
        onClick={runAutoSchedule}
        disabled={loading}
        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 space-x-reverse"
      >
        {loading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            <span>מבצע שיבוץ...</span>
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            <span>הפעל שיבוץ אוטומטי</span>
          </>
        )}
      </button>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>איך זה עובד:</strong>
        </p>
        <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
          <li>המערכת בודקת את הזמינות שהוגשה על ידי העובדים</li>
          <li>מתחשבת בהעדפות שעת התחלה של כל עובד</li>
          <li>מבטיחה מינימום 6 משמרות לכל עובד בשבוע</li>
          <li>מתחשבת באירועים מיוחדים שדורשים כוח אדם נוסף</li>
          <li>מחלקת משמרות בצורה הוגנת בין כל העובדים</li>
        </ul>
      </div>
    </div>
  )
}

