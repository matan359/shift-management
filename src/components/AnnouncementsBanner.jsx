import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Megaphone, X } from 'lucide-react'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, getDocs } from 'firebase/firestore'

export default function AnnouncementsBanner() {
  const { user, db } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [dismissed, setDismissed] = useState([])

  useEffect(() => {
    if (!db || !user) return

    loadAnnouncements()
  }, [db, user])

  async function loadAnnouncements() {
    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid

      const announcementsRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/announcements`)
      const snapshot = await getDocs(announcementsRef)
      
      const active = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(a => a.isActive)
        .filter(a => !dismissed.includes(a.id))
      
      setAnnouncements(active)
    } catch (error) {
      console.error('Error loading announcements:', error)
    }
  }

  function dismissAnnouncement(id) {
    setDismissed([...dismissed, id])
    setAnnouncements(announcements.filter(a => a.id !== id))
  }

  if (announcements.length === 0) return null

  return (
    <div className="space-y-2 mb-4">
      {announcements.map((announcement) => (
        <div
          key={announcement.id}
          className={`p-4 rounded-lg border-2 flex items-start justify-between ${
            announcement.priority === 'urgent'
              ? 'bg-red-50 border-red-400'
              : announcement.priority === 'important'
              ? 'bg-orange-50 border-orange-400'
              : 'bg-yellow-50 border-yellow-300'
          }`}
        >
          <div className="flex items-start space-x-3 space-x-reverse flex-1">
            <Megaphone className={`w-5 h-5 mt-0.5 ${
              announcement.priority === 'urgent'
                ? 'text-red-600'
                : announcement.priority === 'important'
                ? 'text-orange-600'
                : 'text-yellow-600'
            }`} />
            <div className="flex-1">
              <h4 className="font-bold text-gray-800 mb-1">{announcement.title}</h4>
              <p className="text-sm text-gray-700 whitespace-pre-line">{announcement.message}</p>
            </div>
          </div>
          <button
            onClick={() => dismissAnnouncement(announcement.id)}
            className="text-gray-500 hover:text-gray-700 mr-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

