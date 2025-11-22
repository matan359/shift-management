import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Lock, Mail, AlertCircle, CheckCircle, UserPlus, KeyRound } from 'lucide-react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { getFirebaseAuth } from '../api/firebase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const { login, auth } = useAuth()
  const navigate = useNavigate()

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberEmail')
    if (rememberedEmail) {
      setEmail(rememberedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const userData = await login(email, password)
      
      // Save remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberEmail', email)
      } else {
        localStorage.removeItem('rememberEmail')
      }
      
      // Navigation will be handled by AppRoutes based on user role
      navigate('/')
    } catch (err) {
      setError(err.message || 'שגיאה בכניסה למערכת')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setResetLoading(true)

    if (!email) {
      setError('נא להזין אימייל לשחזור סיסמה')
      setResetLoading(false)
      return
    }

    try {
      const authInstance = auth || getFirebaseAuth()
      if (!authInstance) {
        throw new Error('Firebase לא מאותחל')
      }

      await sendPasswordResetEmail(authInstance, email)
      setSuccess('אימייל לשחזור סיסמה נשלח! בדוק את תיבת הדואר שלך.')
      setShowForgotPassword(false)
    } catch (err) {
      console.error('Password reset error:', err)
      if (err.code === 'auth/user-not-found') {
        setError('אימייל זה לא קיים במערכת')
      } else if (err.code === 'auth/invalid-email') {
        setError('אימייל לא תקין')
      } else {
        setError('שגיאה בשליחת אימייל שחזור: ' + err.message)
      }
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 sm:p-8 transform transition-all duration-300 hover:scale-105 animate-slideUp">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">כניסה למערכת</h2>
          <p className="text-gray-600 mt-2">בייגל קפה רמת אשכול</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-red-400 text-red-700 rounded-lg flex items-center space-x-2 space-x-reverse animate-slideUp">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border-2 border-green-400 text-green-700 rounded-lg flex items-center space-x-2 space-x-reverse animate-slideUp">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {!showForgotPassword ? (
          <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline ml-1" />
              אימייל
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="הכנס אימייל"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                <Lock className="w-4 h-4 inline ml-1" />
                סיסמה
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
              >
                שכחתי סיסמה
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="הכנס סיסמה"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="rememberMe" className="mr-2 text-sm text-gray-700 cursor-pointer">
              זכור אותי
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg disabled:transform-none"
          >
            {loading ? 'מתחבר...' : 'התחבר'}
          </button>
        </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <KeyRound className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-800">שחזור סיסמה</h3>
              </div>
              <p className="text-sm text-blue-700">
                נשלח לך אימייל עם קישור לאיפוס הסיסמה. בדוק את תיבת הדואר הנכנס.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline ml-1" />
                אימייל
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="הכנס אימייל לשחזור"
              />
            </div>

            <div className="flex space-x-3 space-x-reverse">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false)
                  setError('')
                  setSuccess('')
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-xl transition-all duration-200"
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={resetLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg disabled:transform-none"
              >
                {resetLoading ? 'שולח...' : 'שלח אימייל'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 space-y-3">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              אין לך חשבון?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-800 font-semibold underline inline-flex items-center">
                <UserPlus className="w-4 h-4 ml-1" />
                הירשם כאן
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

