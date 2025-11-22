import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Calendar, Check, X } from 'lucide-react'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { startOfWeek, endOfWeek, eachDayOfInterval, format, addWeeks } from 'date-fns'
import { he } from 'date-fns/locale'

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

export default function SubmitAvailability() {
  const { user, db } = useAuth()
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [availability, setAvailability] = useState({})
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadAvailability()
  }, [selectedWeek, user, db])

  async function loadAvailability() {
    if (!db || !user) return

    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid

      const weekStart = startOfWeek(selectedWeek, { locale: he })
      const weekEnd = endOfWeek(selectedWeek, { locale: he })

      const requestsRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/shiftRequests`)
      const q = query(
        requestsRef,
        where('employeeId', '==', user.id),
        where('date', '>=', format(weekStart, 'yyyy-MM-dd')),
        where('date', '<=', format(weekEnd, 'yyyy-MM-dd'))
      )

      const snapshot = await getDocs(q)
      const existingAvailability = {}
      snapshot.forEach((doc) => {
        const data = doc.data()
        existingAvailability[data.date] = {
          available: data.availability === 'yes',
          priority: data.priority || 'normal',
          id: doc.id
        }
      })

      setAvailability(existingAvailability)
    } catch (error) {
      console.error('Error loading availability:', error)
    }
  }

  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedWeek, { locale: he }),
    end: endOfWeek(selectedWeek, { locale: he })
  })

  function toggleAvailability(date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    setAvailability(prev => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        available: !prev[dateStr]?.available,
        priority: prev[dateStr]?.priority || 'normal'
      }
    }))
    setSaved(false)
  }

  function setPriority(date, priority) {
    const dateStr = format(date, 'yyyy-MM-dd')
    setAvailability(prev => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        available: prev[dateStr]?.available !== false,
        priority
      }
    }))
    setSaved(false)
  }

  async function saveAvailability() {
    if (!db || !user) return

    setLoading(true)
    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid

      const requestsRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/shiftRequests`)

      for (const date of weekDays) {
        const dateStr = format(date, 'yyyy-MM-dd')
        const avail = availability[dateStr]

        if (avail) {
          const requestData = {
            employeeId: user.id,
            date: dateStr,
            availability: avail.available ? 'yes' : 'no',
            priority: avail.priority || 'normal'
          }

          if (avail.id) {
            // Update existing
            await updateDoc(doc(requestsRef, avail.id), requestData)
          } else {
            // Create new
            await addDoc(requestsRef, requestData)
          }
        }
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving availability:', error)
      alert('שגיאה בשמירת הזמינות')
    } finally {
      setLoading(false)
    }
  }

  const availableCount = Object.values(availability).filter(a => a?.available).length

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">הגשת זמינות שבועית</h2>
        <p className="text-gray-600">בחר את הימים שבהם אתה זמין לעבודה</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 space-x-reverse">
            <button
              onClick={() => setSelectedWeek(addWeeks(selectedWeek, -1))}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
            >
              שבוע קודם
            </button>
            <h3 className="text-xl font-semibold">
              {format(startOfWeek(selectedWeek, { locale: he }), 'dd/MM/yyyy', { locale: he })} - {format(endOfWeek(selectedWeek, { locale: he }), 'dd/MM/yyyy', { locale: he })}
            </h3>
            <button
              onClick={() => setSelectedWeek(addWeeks(selectedWeek, 1))}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
            >
              שבוע הבא
            </button>
          </div>
          <div className="text-lg font-semibold text-blue-600">
            {availableCount} ימים זמינים
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
          {weekDays.map((date, index) => {
            const dateStr = format(date, 'yyyy-MM-dd')
            const avail = availability[dateStr]
            const isAvailable = avail?.available

            return (
              <div
                key={dateStr}
                className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                  isAvailable
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 bg-gray-50'
                }`}
                onClick={() => toggleAvailability(date)}
              >
                <div className="text-center">
                  <p className="font-semibold text-gray-800">{DAYS[index]}</p>
                  <p className="text-sm text-gray-600 mb-3">{format(date, 'dd/MM', { locale: he })}</p>
                  {isAvailable ? (
                    <Check className="w-8 h-8 text-green-600 mx-auto" />
                  ) : (
                    <X className="w-8 h-8 text-gray-400 mx-auto" />
                  )}
                  {isAvailable && (
                    <div className="mt-3 space-y-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setPriority(date, 'high')
                        }}
                        className={`w-full text-xs py-1 rounded ${
                          avail?.priority === 'high'
                            ? 'bg-red-500 text-white'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        גבוה
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setPriority(date, 'normal')
                        }}
                        className={`w-full text-xs py-1 rounded ${
                          avail?.priority === 'normal' || !avail?.priority
                            ? 'bg-blue-500 text-white'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        רגיל
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setPriority(date, 'low')
                        }}
                        className={`w-full text-xs py-1 rounded ${
                          avail?.priority === 'low'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        נמוך
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            * יש להגיש לפחות 6 משמרות זמינות בשבוע
          </p>
          <button
            onClick={saveAvailability}
            disabled={loading || availableCount < 6}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'שומר...' : saved ? 'נשמר!' : 'שמור זמינות'}
          </button>
        </div>
      </div>
    </div>
  )
}

