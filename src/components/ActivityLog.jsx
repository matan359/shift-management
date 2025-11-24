import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, query, orderBy, limit, onSnapshot, addDoc } from 'firebase/firestore'
import { format, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'
import { Clock, User, Calendar, Bell, FileText, Settings, Trash2, Plus, Edit } from 'lucide-react'

const ACTIVITY_TYPES = {
  shift_created: { icon: Calendar, color: 'green', label: 'משמרת נוצרה' },
  shift_updated: { icon: Calendar, color: 'blue', label: 'משמרת עודכנה' },
  shift_deleted: { icon: Trash2, color: 'red', label: 'משמרת נמחקה' },
  employee_added: { icon: User, color: 'green', label: 'עובד נוסף' },
  employee_updated: { icon: User, color: 'blue', label: 'עובד עודכן' },
  notification_sent: { icon: Bell, color: 'purple', label: 'התראה נשלחה' },
  announcement_created: { icon: FileText, color: 'orange', label: 'הודעה נוצרה' },
  task_created: { icon: Plus, color: 'teal', label: 'משימה נוצרה' },
  settings_updated: { icon: Settings, color: 'gray', label: 'הגדרות עודכנו' },
}

export function logActivity(db, userId, type, details, userRole) {
  if (!db || !userId) return

  try {
    const dbInstance = db || getFirebaseDb()
    const appId = getAppId()
    
    const activityRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/activityLog`)
    addDoc(activityRef, {
      type,
      details,
      userRole: userRole || 'unknown',
      timestamp: new Date().toISOString(),
      createdAt: new Date()
    })
  } catch (error) {
    console.error('Error logging activity:', error)
  }
}

export default function ActivityLog({ limitCount = 50 }) {
  const { user, db } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!db || !user) return

    const dbInstance = db || getFirebaseDb()
    const appId = getAppId()
    const userId = user.uid

    const activityRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/activityLog`)
    const q = query(activityRef, orderBy('timestamp', 'desc'), limit(limitCount))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activitiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setActivities(activitiesData)
      setLoading(false)
    }, (error) => {
      console.error('Error loading activities:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [db, user, limitCount])

  if (loading) {
    return (
      <div className="glass-effect rounded-2xl shadow-glow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-effect rounded-2xl shadow-glow p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-green-700 flex items-center gap-2">
          <Clock className="w-6 h-6 text-green-600" />
          היסטוריית פעילות
        </h2>
        <span className="text-sm text-gray-500">{activities.length} פעילויות</span>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">אין פעילויות עדיין</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((activity) => {
            const activityType = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.settings_updated
            const Icon = activityType.icon
            const colorClass = `text-${activityType.color}-600`
            const bgClass = `bg-${activityType.color}-50 border-${activityType.color}-200`

            return (
              <div
                key={activity.id}
                className={`border-2 rounded-xl p-4 ${bgClass} animate-fadeIn`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-white ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-800">{activityType.label}</p>
                      <span className="text-xs text-gray-500">
                        {activity.timestamp && format(parseISO(activity.timestamp), 'dd/MM/yyyy HH:mm', { locale: he })}
                      </span>
                    </div>
                    {activity.details && (
                      <p className="text-sm text-gray-600">{activity.details}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {activity.userRole === 'manager' ? '👨‍💼 מנהל' : '👤 עובד'}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

