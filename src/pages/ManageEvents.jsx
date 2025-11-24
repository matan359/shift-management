import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Calendar, Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore'
import { format, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'

export default function ManageEvents() {
  const { user, db } = useAuth()
  const [events, setEvents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    extraEmployeesNeeded: 0
  })

  useEffect(() => {
    if (!db || !user) return

    const dbInstance = db || getFirebaseDb()
    const appId = getAppId()
    const userId = user.uid

    const eventsRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/events`)
    
    const unsubscribe = onSnapshot(eventsRef, (snapshot) => {
      const eventsData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => a.date.localeCompare(b.date))
      setEvents(eventsData)
    })

    return () => unsubscribe()
  }, [db, user])

  function openAddModal() {
    setEditingEvent(null)
    setFormData({
      name: '',
      date: '',
      extraEmployeesNeeded: 0
    })
    setShowModal(true)
  }

  function openEditModal(event) {
    setEditingEvent(event)
    setFormData({
      name: event.name || '',
      date: event.date || '',
      extraEmployeesNeeded: event.extraEmployeesNeeded || 0
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

      if (editingEvent) {
        const eventRef = doc(dbInstance, `artifacts/${appId}/users/${userId}/events/${editingEvent.id}`)
        await updateDoc(eventRef, formData)
      } else {
        const eventsRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/events`)
        await addDoc(eventsRef, formData)
      }

      setShowModal(false)
    } catch (error) {
      console.error('Error saving event:', error)
      alert('שגיאה בשמירת האירוע')
    }
  }

  async function handleDelete(eventId) {
    if (!confirm('האם אתה בטוח שברצונך למחוק אירוע זה?')) return
    if (!db || !user) return

    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid

      const eventRef = doc(dbInstance, `artifacts/${appId}/users/${userId}/events/${eventId}`)
      await deleteDoc(eventRef)
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('שגיאה במחיקת האירוע')
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">ניהול אירועים</h2>
          <p className="text-gray-600">הוסף אירועים מיוחדים שדורשים כוח אדם נוסף</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition flex items-center space-x-2 space-x-reverse"
        >
          <Plus className="w-5 h-5" />
          <span>הוסף אירוע</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 text-green-600" />
              <div className="flex space-x-2 space-x-reverse">
                <button
                  onClick={() => openEditModal(event)}
                  className="text-green-600 hover:text-green-900"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{event.name}</h3>
            <p className="text-gray-600 mb-2">
              תאריך: {event.date && format(parseISO(event.date), 'dd/MM/yyyy', { locale: he })}
            </p>
            <p className="text-sm text-gray-500">
              כוח אדם נוסף נדרש: {event.extraEmployeesNeeded || 0}
            </p>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">אין אירועים</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-800">
                {editingEvent ? 'ערוך אירוע' : 'הוסף אירוע חדש'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם האירוע</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">כוח אדם נוסף נדרש</label>
                <input
                  type="number"
                  value={formData.extraEmployeesNeeded}
                  onChange={(e) => setFormData({ ...formData, extraEmployeesNeeded: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-4 space-x-reverse">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
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

