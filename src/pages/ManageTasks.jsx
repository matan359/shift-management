import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CheckSquare, Plus, Edit, Trash2, Save } from 'lucide-react'
import CloseIcon from '../components/CloseIcon'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore'

const DAYS_OF_WEEK = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

export default function ManageTasks() {
  const { user, db } = useAuth()
  const [tasks, setTasks] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dayOfWeek: '0'
  })

  useEffect(() => {
    if (!db || !user) return

    const dbInstance = db || getFirebaseDb()
    const appId = getAppId()
    const userId = user.uid

    const tasksRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/tasks`)
    
    const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setTasks(tasksData)
    })

    return () => unsubscribe()
  }, [db, user])

  function openAddModal() {
    setEditingTask(null)
    setFormData({
      title: '',
      description: '',
      dayOfWeek: '0'
    })
    setShowModal(true)
  }

  function openEditModal(task) {
    setEditingTask(task)
    setFormData({
      title: task.title || '',
      description: task.description || '',
      dayOfWeek: task.dayOfWeek?.toString() || '0'
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

      const taskData = {
        ...formData,
        dayOfWeek: parseInt(formData.dayOfWeek)
      }

      if (editingTask) {
        const taskRef = doc(dbInstance, `artifacts/${appId}/users/${userId}/tasks/${editingTask.id}`)
        await updateDoc(taskRef, taskData)
      } else {
        const tasksRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/tasks`)
        await addDoc(tasksRef, taskData)
      }

      setShowModal(false)
    } catch (error) {
      console.error('Error saving task:', error)
      alert('שגיאה בשמירת המשימה')
    }
  }

  async function handleDelete(taskId) {
    if (!confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) return
    if (!db || !user) return

    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid

      const taskRef = doc(dbInstance, `artifacts/${appId}/users/${userId}/tasks/${taskId}`)
      await deleteDoc(taskRef)
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('שגיאה במחיקת המשימה')
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">ניהול משימות שבועיות</h2>
          <p className="text-gray-600">הגדר משימות שבועיות לעובדים</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition flex items-center space-x-2 space-x-reverse"
        >
          <Plus className="w-5 h-5" />
          <span>הוסף משימה</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <div key={task.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <CheckSquare className="w-8 h-8 text-green-600" />
              <div className="flex space-x-2 space-x-reverse">
                <button
                  onClick={() => openEditModal(task)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{task.title}</h3>
            <p className="text-gray-600 mb-2">{task.description}</p>
            <p className="text-sm text-gray-500">
              יום בשבוע: {DAYS_OF_WEEK[task.dayOfWeek] || 'לא מוגדר'}
            </p>
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">אין משימות</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-800">
                {editingTask ? 'ערוך משימה' : 'הוסף משימה חדשה'}
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">יום בשבוע</label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {DAYS_OF_WEEK.map((day, index) => (
                    <option key={index} value={index.toString()}>
                      {day}
                    </option>
                  ))}
                </select>
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

