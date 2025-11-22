import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Lock, User, Mail } from 'lucide-react'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, addDoc, getDocs } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'

export default function CreateFirstAdmin() {
  const { user, db, auth } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullName: 'מנהל ראשי',
    email: '',
    password: '',
    phoneNumber: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!db || !auth || !auth.currentUser) {
        throw new Error('Firebase לא מאותחל. אנא רענן את הדף.')
      }

      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()

      // Check if employees already exist
      const employeesRef = collection(dbInstance, `artifacts/${appId}/employees`)
      const snapshot = await getDocs(employeesRef)

      if (!snapshot.empty) {
        throw new Error('כבר קיימים משתמשים במערכת. השתמש בדף הכניסה הרגיל.')
      }

      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      const firebaseUser = userCredential.user

      // Create admin user in Firestore
      const adminData = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        role: 'manager',
        defaultShiftStart: '08:00',
        minShiftsPerWeek: 6,
        isActive: true,
        firebaseUid: firebaseUser.uid,
        createdAt: new Date().toISOString()
      }

      await addDoc(employeesRef, adminData)

      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      console.error('Error creating admin:', err)
      setError(err.message || 'שגיאה ביצירת משתמש מנהל')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">משתמש מנהל נוצר בהצלחה!</h2>
          <p className="text-gray-600 mb-2">אימייל: <strong>{formData.email}</strong></p>
          <p className="text-gray-600 mb-4">סיסמה: <strong>{formData.password}</strong></p>
          <p className="text-sm text-gray-500">מעביר אותך לדף הכניסה...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">יצירת משתמש מנהל ראשון</h2>
          <p className="text-gray-600 mt-2">צור את המשתמש הראשון במערכת</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline ml-1" />
              שם מלא
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline ml-1" />
              אימייל
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock className="w-4 h-4 inline ml-1" />
              סיסמה
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              מספר טלפון (אופציונלי)
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'יוצר...' : 'צור משתמש מנהל'}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-500 text-center">
          זה יוצר את המשתמש הראשון במערכת. לאחר מכן תוכל להתחבר עם הפרטים שיצרת.
        </p>
      </div>
    </div>
  )
}

