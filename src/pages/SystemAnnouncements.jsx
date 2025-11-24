import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Megaphone, Plus, Edit, Trash2, Save, X, Search, Filter } from 'lucide-react'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { format, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'

export default function SystemAnnouncements() {
  const { user, db } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
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

  // Filter announcements
  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPriority = filterPriority === 'all' || announcement.priority === filterPriority
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && announcement.isActive) ||
                         (filterStatus === 'inactive' && !announcement.isActive)
    return matchesSearch && matchesPriority && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-50 to-white p-2 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 glass-effect rounded-2xl shadow-glow p-4 sm:p-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-green-700 mb-2 flex items-center gap-3">
                <Megaphone className="w-8 h-8 text-green-600" />
                הודעות ונהלי עבודה
              </h1>
              <p className="text-gray-600 text-sm sm:text-base font-medium">
                נהל הודעות כלליות לעובדים (חייבים חולצה, סינר, וכו')
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 touch-manipulation active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>הוסף הודעה</span>
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 glass-effect rounded-2xl shadow-glow p-4 sm:p-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="חפש בהודעות..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
              >
                <option value="all">כל העדיפויות</option>
                <option value="urgent">דחוף</option>
                <option value="important">חשוב</option>
                <option value="normal">רגיל</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
              >
                <option value="all">כל הסטטוסים</option>
                <option value="active">פעיל</option>
                <option value="inactive">לא פעיל</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Announcements Display */}
        {activeAnnouncements.length > 0 && (
          <div className="mb-6 glass-effect rounded-2xl shadow-glow p-4 sm:p-6 border-2 border-green-300 bg-green-50 animate-slideUp">
            <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-green-600" />
              הודעות פעילות ({activeAnnouncements.length})
            </h3>
            <div className="space-y-3">
              {activeAnnouncements.map((announcement, index) => (
                <div
                  key={announcement.id}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 animate-fadeIn ${
                    announcement.priority === 'urgent'
                      ? 'bg-red-50 border-red-400 shadow-md'
                      : announcement.priority === 'important'
                      ? 'bg-orange-50 border-orange-400 shadow-md'
                      : 'bg-white border-green-300 shadow-sm'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-gray-800 text-lg">{announcement.title}</h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          announcement.priority === 'urgent'
                            ? 'bg-red-100 text-red-800'
                            : announcement.priority === 'important'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {announcement.priority === 'urgent' ? 'דחוף' : announcement.priority === 'important' ? 'חשוב' : 'רגיל'}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-line leading-relaxed">{announcement.message}</p>
                      <p className="text-xs text-gray-500 mt-3">
                        עודכן: {announcement.updatedAt && format(parseISO(announcement.updatedAt), 'dd/MM/yyyy HH:mm', { locale: he })}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => openEditModal(announcement)}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition"
                        title="ערוך"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition"
                        title="מחק"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Announcements List */}
        <div className="glass-effect rounded-2xl shadow-glow p-4 sm:p-6 animate-fadeIn">
          <h2 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
            <Filter className="w-6 h-6 text-green-600" />
            כל ההודעות ({filteredAnnouncements.length})
          </h2>
          
          {filteredAnnouncements.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">אין הודעות</p>
              {searchTerm && <p className="text-gray-400 text-sm mt-2">נסה לשנות את החיפוש</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAnnouncements.map((announcement, index) => (
                <div
                  key={announcement.id}
                  className="border-2 border-gray-200 rounded-xl p-4 bg-white hover:border-green-300 hover:shadow-md transition-all duration-200 animate-fadeIn"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-bold text-gray-800 text-lg">{announcement.title}</h3>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          announcement.priority === 'urgent'
                            ? 'bg-red-100 text-red-800'
                            : announcement.priority === 'important'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {announcement.priority === 'urgent' ? 'דחוף' : announcement.priority === 'important' ? 'חשוב' : 'רגיל'}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          announcement.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {announcement.isActive ? 'פעיל' : 'לא פעיל'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{announcement.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        נוצר: {announcement.createdAt && format(parseISO(announcement.createdAt), 'dd/MM/yyyy', { locale: he })}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => openEditModal(announcement)}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition"
                        title="ערוך"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition"
                        title="מחק"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn"
            onClick={() => setShowModal(false)}
          >
            <div 
              className="glass-effect rounded-2xl shadow-glow max-w-2xl w-full p-6 animate-slideUp"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-green-700 flex items-center gap-2">
                  <Megaphone className="w-6 h-6 text-green-600" />
                  {editingAnnouncement ? 'ערוך הודעה' : 'הוסף הודעה חדשה'}
                </h3>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">כותרת</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
                    placeholder="למשל: נהלי עבודה - חולצה וסינר"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">הודעה</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows="6"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition resize-none"
                    placeholder="כתוב את ההודעה כאן..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">עדיפות</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
                    >
                      <option value="normal">רגיל</option>
                      <option value="important">חשוב</option>
                      <option value="urgent">דחוף</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-center sm:justify-start pt-8">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-gray-700">פעיל</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    שמור
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-xl transition"
                  >
                    ביטול
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

