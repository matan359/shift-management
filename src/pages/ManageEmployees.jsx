import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Users, Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore'

export default function ManageEmployees() {
  const { user, db } = useAuth()
  const [employees, setEmployees] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    phoneNumber: '',
    role: 'worker',
    defaultShiftStart: '',
    minShiftsPerWeek: 6,
    isActive: true
  })

  useEffect(() => {
    if (!db || !user) return

    const dbInstance = db || getFirebaseDb()
    const appId = getAppId()
    const userId = user.uid

    const employeesRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/employees`)
    
    const unsubscribe = onSnapshot(employeesRef, (snapshot) => {
      const employeesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setEmployees(employeesData)
    })

    return () => unsubscribe()
  }, [db, user])

  function openAddModal() {
    setEditingEmployee(null)
    setFormData({
      fullName: '',
      username: '',
      password: '',
      phoneNumber: '',
      role: 'worker',
      defaultShiftStart: '',
      minShiftsPerWeek: 6,
      isActive: true,
      category: ''
    })
    setShowModal(true)
  }

  function openEditModal(employee) {
    setEditingEmployee(employee)
    setFormData({
      fullName: employee.fullName || '',
      username: employee.username || '',
      password: '',
      phoneNumber: employee.phoneNumber || '',
      role: employee.role || 'worker',
      defaultShiftStart: employee.defaultShiftStart || '',
      minShiftsPerWeek: employee.minShiftsPerWeek || 6,
      isActive: employee.isActive !== false,
      category: employee.category || ''
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

      const employeeData = {
        ...formData,
        passwordHash: formData.password || undefined, // In production, hash this
        __uid: userId // Store user ID for auth lookup
      }

      if (editingEmployee) {
        // Update existing
        const employeeRef = doc(dbInstance, `artifacts/${appId}/users/${userId}/employees/${editingEmployee.id}`)
        await updateDoc(employeeRef, employeeData)
      } else {
        // Create new
        const employeesRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/employees`)
        await addDoc(employeesRef, employeeData)
      }

      setShowModal(false)
      setFormData({
        fullName: '',
        username: '',
        password: '',
        phoneNumber: '',
        role: 'worker',
        defaultShiftStart: '',
        minShiftsPerWeek: 6,
        isActive: true
      })
    } catch (error) {
      console.error('Error saving employee:', error)
      alert('שגיאה בשמירת העובד')
    }
  }

  async function handleDelete(employeeId) {
    if (!confirm('האם אתה בטוח שברצונך למחוק עובד זה?')) return
    if (!db || !user) return

    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid

      const employeeRef = doc(dbInstance, `artifacts/${appId}/users/${userId}/employees/${employeeId}`)
      await deleteDoc(employeeRef)
    } catch (error) {
      console.error('Error deleting employee:', error)
      alert('שגיאה במחיקת העובד')
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">ניהול עובדים</h2>
          <p className="text-gray-600">הוסף, ערוך ומחק עובדים</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition flex items-center space-x-2 space-x-reverse"
        >
          <Plus className="w-5 h-5" />
          <span>הוסף עובד</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">שם מלא</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">שם משתמש</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">טלפון</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">תפקיד</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">שעת התחלה</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">מינימום משמרות</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">סטטוס</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {employees.map((employee) => (
              <tr key={employee.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{employee.fullName}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{employee.username}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{employee.phoneNumber || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    employee.role === 'manager' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {employee.role === 'manager' ? 'מנהל' : 'עובד'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{employee.category || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{employee.defaultShiftStart || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{employee.minShiftsPerWeek || 6}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {employee.isActive ? 'פעיל' : 'לא פעיל'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => openEditModal(employee)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(employee.id)}
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-800">
                {editingEmployee ? 'ערוך עובד' : 'הוסף עובד חדש'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם משתמש</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  סיסמה {editingEmployee && '(השאר ריק אם לא לשנות)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingEmployee}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מספר טלפון</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תפקיד</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="worker">עובד</option>
                  <option value="manager">מנהל</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה (לשיבוץ)</label>
                <select
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">אין</option>
                  <option value="אחראי">אחראי</option>
                  <option value="פס">פס</option>
                  <option value="מטבח">מטבח</option>
                  <option value="נוסף">נוסף</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שעת התחלה ברירת מחדל</label>
                <input
                  type="time"
                  value={formData.defaultShiftStart}
                  onChange={(e) => setFormData({ ...formData, defaultShiftStart: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מינימום משמרות בשבוע</label>
                <input
                  type="number"
                  value={formData.minShiftsPerWeek}
                  onChange={(e) => setFormData({ ...formData, minShiftsPerWeek: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
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

