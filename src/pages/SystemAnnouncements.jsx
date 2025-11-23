import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Megaphone, Plus, Edit, Trash2, Save } from 'lucide-react'
import CloseIcon from '../components/CloseIcon'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { format, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'

export default function SystemAnnouncements() {
  const { user, db } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'normal', // normal, important, urgent
    isActive: true
  })

  useEffect(() => {
    if (!db || !user) return

    const dbInstance = db || getFirebaseDb()
    const appId = getAppId()
    const userId = user.uid

    const announcementsRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/announcements`)
    const q = query(announcementsRef, orderBy('createdAt', 'desc'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const announcementsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setAnnouncements(announcementsData)
    })

    return () => unsubscribe()
  }, [db, user])

  function openAddModal() {
    setEditingAnnouncement(null)
    setFormData({
      title: '',
      message: '',
      priority: 'normal',
      isActive: true
    })
    setShowModal(true)
  }

  function openEditModal(announcement) {
    setEditingAnnouncement(announcement)
    setFormData({
      title: announcement.title || '',
      message: announcement.message || '',
      priority: announcement.priority || 'normal',
      isActive: announcement.isActive !== false
    })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!db || !user) return

    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid

      const announcementData = {
        ...formData,
        createdAt: editingAnnouncement ? editingAnnouncement.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (editingAnnouncement) {
        const announcementRef = doc(dbInstance, `artifacts/${appId}/users/${userId}/announcements/${editingAnnouncement.id}`)
        await updateDoc(announcementRef, announcementData)
      } else {
        const announcementsRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/announcements`)
        await addDoc(announcementsRef, announcementData)
      }

      setShowModal(false)
    } catch (error) {
      console.error('Error saving announcement:', error)
      alert('שגיאה בשמירת ההודעה')
    }
  }

  async function handleDelete(announcementId) {
    if (!confirm('האם אתה בטוח שברצונך למחוק הודעה זו?')) return
    if (!db || !user) return

    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid

      const announcementRef = doc(dbInstance, `artifacts/${appId}/users/${userId}/announcements/${announcementId}`)
      await deleteDoc(announcementRef)
    } catch (error) {
      console.error('Error deleting announcement:', error)
      alert('שגיאה במחיקת ההודעה')
    }
  }

  const activeAnnouncements = announcements.filter(a => a.isActive)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">הודעות ונהלי עבודה</h2>
          <p className="text-gray-600">נהל הודעות כלליות לעובדים (חייבים חולצה, סינר, וכו')</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition flex items-center space-x-2 space-x-reverse"
        >
          <Plus className="w-5 h-5" />
          <span>הוסף הודעה</span>
        </button>
      </div>

      {/* Active Announcements Display */}
      {activeAnnouncements.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-yellow-800 mb-4 flex items-center">
            <Megaphone className="w-6 h-6 ml-2" />
            הודעות פעילות
          </h3>
          <div className="space-y-3">
            {activeAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className={`p-4 rounded-lg border-2 ${
                  announcement.priority === 'urgent'
                    ? 'bg-red-50 border-red-400'
                    : announcement.priority === 'important'
                    ? 'bg-orange-50 border-orange-400'
                    : 'bg-white border-yellow-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 mb-1">{announcement.title}</h4>
                    <p className="text-gray-700 whitespace-pre-line">{announcement.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      עודכן: {announcement.updatedAt && format(parseISO(announcement.updatedAt), 'dd/MM/yyyy', { locale: he })}
                    </p>
                  </div>
                  <div className="flex space-x-2 space-x-reverse mr-4">
                    <button
                      onClick={() => openEditModal(announcement)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Announcements List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">כותרת</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">עדיפות</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">סטטוס</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">תאריך</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {announcements.map((announcement) => (
              <tr key={announcement.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{announcement.title}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    announcement.priority === 'urgent'
                      ? 'bg-red-100 text-red-800'
                      : announcement.priority === 'important'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {announcement.priority === 'urgent' ? 'דחוף' : announcement.priority === 'important' ? 'חשוב' : 'רגיל'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    announcement.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {announcement.isActive ? 'פעיל' : 'לא פעיל'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {announcement.createdAt && format(parseISO(announcement.createdAt), 'dd/MM/yyyy', { locale: he })}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => openEditModal(announcement)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-800">
                {editingAnnouncement ? 'ערוך הודעה' : 'הוסף הודעה חדשה'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">כותרת</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="למשל: נהלי עבודה - חולצה וסינר"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">הודעה</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows="6"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="כתוב את ההודעה כאן..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">עדיפות</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">רגיל</option>
                  <option value="important">חשוב</option>
                  <option value="urgent">דחוף</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="ml-2"
                />
                <label className="text-sm font-medium text-gray-700">פעיל</label>
              </div>

              <div className="flex space-x-4 space-x-reverse">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  <Save className="w-4 h-4 inline ml-2" />
                  שמור
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

