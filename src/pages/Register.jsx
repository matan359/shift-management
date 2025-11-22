import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Lock, Mail, User, AlertCircle, CheckCircle } from 'lucide-react'
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore'

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    category: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { auth, db } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות לא תואמות')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים')
      setLoading(false)
      return
    }

    try {
      if (!db || !auth) {
        throw new Error('Firebase לא מאותחל. אנא רענן את הדף.')
      }

      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()

      // Check if email already exists
      const employeesRef = collection(dbInstance, `artifacts/${appId}/employees`)
      const emailQuery = query(employeesRef, where('email', '==', formData.email))
      const emailSnapshot = await getDocs(emailQuery)

      if (!emailSnapshot.empty) {
        throw new Error('אימייל זה כבר קיים במערכת')
      }

      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      const firebaseUser = userCredential.user

      // Send email verification
      await sendEmailVerification(firebaseUser)

      // Create employee in Firestore
      const employeeData = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        role: 'worker',
        category: formData.category || '',
        defaultShiftStart: '08:00',
        minShiftsPerWeek: 6,
        isActive: true,
        firebaseUid: firebaseUser.uid,
        emailVerified: false,
        createdAt: new Date().toISOString()
      }

      await addDoc(employeesRef, employeeData)

      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      console.error('Registration error:', err)
      let errorMessage = 'שגיאה בהרשמה'
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'אימייל זה כבר קיים במערכת'
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'אימייל לא תקין'
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'הסיסמה חלשה מדי (מינימום 6 תווים)'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 sm:p-8 text-center transform transition-all duration-300 animate-slideUp">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">הרשמה הושלמה בהצלחה! 🎉</h2>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-800 font-semibold mb-2">אימייל אימות נשלח!</p>
              <p className="text-xs text-blue-700">
                נא לבדוק את תיבת הדואר שלך ולאמת את האימייל לפני הכניסה למערכת.
              </p>
            </div>
            <p className="text-gray-600 mb-4">מעביר אותך לדף הכניסה...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 sm:p-8 transform transition-all duration-300 hover:scale-105 animate-slideUp">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">הרשמה למערכת</h2>
          <p className="text-gray-600 mt-2">בייגל קפה רמת אשכול</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-red-400 text-red-700 rounded-lg flex items-center space-x-2 space-x-reverse">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
              placeholder="הכנס שם מלא"
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
              placeholder="your.email@example.com"
            />
            <p className="text-xs text-gray-500 mt-1">אימייל אימות יישלח לכתובת זו</p>
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
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="מינימום 6 תווים"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock className="w-4 h-4 inline ml-1" />
              אימות סיסמה
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="הזן סיסמה שוב"
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
              placeholder="05X-XXXXXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              קטגוריה (אופציונלי)
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">בחר קטגוריה</option>
              <option value="אחראי">אחראי</option>
              <option value="פס">פס</option>
              <option value="מטבח">מטבח</option>
              <option value="נוסף">נוסף</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg disabled:transform-none"
          >
            {loading ? 'נרשם...' : 'הרשמה'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            כבר יש לך חשבון?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-semibold underline">
              התחבר כאן
            </Link>
          </p>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>שימו לב:</strong> לאחר ההרשמה, תקבלו אימייל לאימות הכתובת. יש לאמת את האימייל לפני הכניסה למערכת.
          </p>
        </div>
      </div>
    </div>
  )
}

