import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Calendar, AlertTriangle, Info } from 'lucide-react'
import { getSpecialDaysInRange, getSpecialDayInfo } from '../utils/holidayDetector'
import { startOfWeek, endOfWeek, addWeeks, format, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'

export default function SpecialDaysAlerts() {
  const { user, db } = useAuth()
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [specialDays, setSpecialDays] = useState([])
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    loadSpecialDays()
  }, [currentWeek])

  function loadSpecialDays() {
    const weekStart = startOfWeek(currentWeek, { locale: he })
    const weekEnd = endOfWeek(currentWeek, { locale: he })
    
    // Get special days for next 4 weeks
    const allSpecialDays = []
    for (let i = 0; i < 4; i++) {
      const weekStartDate = addWeeks(weekStart, i)
      const weekEndDate = addWeeks(weekEnd, i)
      const days = getSpecialDaysInRange(weekStartDate, weekEndDate)
      allSpecialDays.push(...days)
    }
    
    setSpecialDays(allSpecialDays)
    
    // Generate alerts
    const alertsList = allSpecialDays.map(day => ({
      date: day.date,
      name: day.name,
      message: day.message,
      extraStaffNeeded: day.extraStaffNeeded,
      urgency: day.extraStaffNeeded >= 3 ? 'high' : day.extraStaffNeeded >= 2 ? 'medium' : 'low'
    }))
    
    setAlerts(alertsList)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">התראות ימים מיוחדים</h2>
          <p className="text-gray-600">מערכת מזהה ראש חודש וחגים שדורשים כוח אדם נוסף</p>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          <button
            onClick={() => setCurrentWeek(addWeeks(currentWeek, -1))}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
          >
            שבוע קודם
          </button>
          <div className="text-lg font-semibold">
            {format(startOfWeek(currentWeek, { locale: he }), 'dd/MM/yyyy', { locale: he })} - {format(endOfWeek(currentWeek, { locale: he }), 'dd/MM/yyyy', { locale: he })}
          </div>
          <button
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
          >
            שבוע הבא
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">אין ימים מיוחדים בתקופה הקרובה</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`border-2 rounded-lg p-6 ${
                alert.urgency === 'high'
                  ? 'bg-red-50 border-red-400'
                  : alert.urgency === 'medium'
                  ? 'bg-orange-50 border-orange-400'
                  : 'bg-yellow-50 border-yellow-400'
              }`}
            >
              <div className="flex items-start space-x-4 space-x-reverse">
                <div className={`p-3 rounded-full ${
                  alert.urgency === 'high'
                    ? 'bg-red-200'
                    : alert.urgency === 'medium'
                    ? 'bg-orange-200'
                    : 'bg-yellow-200'
                }`}>
                  <AlertTriangle className={`w-6 h-6 ${
                    alert.urgency === 'high'
                      ? 'text-red-600'
                      : alert.urgency === 'medium'
                      ? 'text-orange-600'
                      : 'text-yellow-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{alert.name}</h3>
                    <span className="text-sm text-gray-600">
                      {format(parseISO(alert.date), 'dd/MM/yyyy', { locale: he })}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{alert.message}</p>
                  <div className="flex items-center space-x-2 space-x-reverse mt-3">
                    <Info className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      מומלץ להוסיף {alert.extraStaffNeeded} עובד{alert.extraStaffNeeded > 1 ? 'ים' : ''} נוסף{alert.extraStaffNeeded > 1 ? 'ים' : ''} למשמרות ביום זה
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">איך זה עובד:</h4>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>המערכת מזהה אוטומטית ראש חודש (יום 1-2 בכל חודש)</li>
          <li>המערכת מזהה חגים יהודיים מרכזיים</li>
          <li>כל יום מיוחד מציג התראה עם כמות כוח אדם נוסף מומלצת</li>
          <li>התראות מופיעות עד 4 שבועות מראש</li>
        </ul>
      </div>
    </div>
  )
}

