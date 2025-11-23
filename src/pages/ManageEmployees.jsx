import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Users, Plus, Edit, Trash2, Save, Mail, Lock } from 'lucide-react'
import CloseIcon from '../components/CloseIcon'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore'
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth'

export default function ManageEmployees() {
  const { user, db, auth } = useAuth()
  const [employees, setEmployees] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
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

    const employeesRef = collection(dbInstance, `artifacts/${appId}/employees`)
    
    const unsubscribe = onSnapshot(employeesRef, (snapshot) => {
      const employeesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setEmployees(employeesData)
    }, (error) => {
      console.error('Error loading employees:', error)
      alert('שגיאה בטעינת העובדים: ' + error.message)
    })

    return () => unsubscribe()
  }, [db, user])

  function openAddModal() {
    setEditingEmployee(null)
    setFormData({
      fullName: '',
      email: '',
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
      email: employee.email || '',
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
    if (!db || !user || !auth) {
      alert('Firebase לא מאותחל או משתמש לא מחובר')
      return
    }

    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()

      if (editingEmployee) {
        // Update existing employee
        const { password, ...restFormData } = formData
        const employeeData = {
          ...restFormData,
          updatedAt: new Date().toISOString()
        }

        // Remove undefined fields
        Object.keys(employeeData).forEach(key => {
          if (employeeData[key] === undefined) {
            delete employeeData[key]
          }
        })

        const employeeRef = doc(dbInstance, `artifacts/${appId}/employees/${editingEmployee.id}`)
        await updateDoc(employeeRef, employeeData)
        alert('העובד עודכן בהצלחה!')
      } else {
        // Create new employee
        if (!formData.email || !formData.password) {
          alert('נא למלא אימייל וסיסמה')
          return
        }

        // Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
        const firebaseUser = userCredential.user

        // Create employee in Firestore
        const { password, ...restFormData } = formData
        const employeeData = {
          ...restFormData,
          firebaseUid: firebaseUser.uid,
          createdAt: new Date().toISOString()
        }

        const employeesRef = collection(dbInstance, `artifacts/${appId}/employees`)
        await addDoc(employeesRef, employeeData)
        alert('העובד נוצר בהצלחה!')
      }

      setShowModal(false)
      setFormData({
        fullName: '',
        email: '',
        password: '',
        phoneNumber: '',
        role: 'worker',
        defaultShiftStart: '',
        minShiftsPerWeek: 6,
        isActive: true
      })
    } catch (error) {
      console.error('Error saving employee:', error)
      let errorMessage = 'שגיאה בשמירת העובד'
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'אימייל זה כבר קיים במערכת'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'אימייל לא תקין'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'הסיסמה חלשה מדי (מינימום 6 תווים)'
      }
      alert(errorMessage + ': ' + error.message)
    }
  }

  async function handleDelete(employeeId) {
    if (!confirm('האם אתה בטוח שברצונך למחוק עובד זה?')) return
    if (!db || !user) return

    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()

      const employeeRef = doc(dbInstance, `artifacts/${appId}/employees/${employeeId}`)
      await deleteDoc(employeeRef)
      alert('העובד נמחק בהצלחה!')
    } catch (error) {
      console.error('Error deleting employee:', error)
      alert('שגיאה במחיקת העובד: ' + error.message)
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
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full min-w-[800px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">שם מלא</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">אימייל</th>
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
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">{employee.fullName}</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 break-all">{employee.email || '-'}</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">{employee.phoneNumber || '-'}</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    employee.role === 'manager' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {employee.role === 'manager' ? 'מנהל' : 'עובד'}
                  </span>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">{employee.category || '-'}</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">{employee.defaultShiftStart || '-'}</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">{employee.minShiftsPerWeek || 6}</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {employee.isActive ? 'פעיל' : 'לא פעיל'}
                  </span>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => openEditModal(employee)}
                      className="text-blue-600 hover:text-blue-900 touch-manipulation p-1 active:scale-95"
                    >
                      <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(employee.id)}
                      className="text-red-600 hover:text-red-900 touch-manipulation p-1 active:scale-95"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                {editingEmployee ? 'ערוך עובד' : 'הוסף עובד חדש'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <CloseIcon className="w-6 h-6" />
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline ml-1" />
                  אימייל
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required={!editingEmployee}
                  disabled={!!editingEmployee}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="employee@example.com"
                />
                {editingEmployee && (
                  <p className="text-xs text-gray-500 mt-1">לא ניתן לשנות אימייל</p>
                )}
              </div>

              {!editingEmployee && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Lock className="w-4 h-4 inline ml-1" />
                    סיסמה
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="מינימום 6 תווים"
                  />
                </div>
              )}

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

