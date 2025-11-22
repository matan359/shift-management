import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Smartphone, CheckCircle, XCircle, RefreshCw, QrCode, Loader2, AlertCircle } from 'lucide-react'

// Use environment variable or try to detect the API URL
const API_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3001' 
    : 'https://your-whatsapp-server.railway.app') // Change this to your WhatsApp server URL

export default function WhatsAppConnection() {
  const [status, setStatus] = useState('disconnected')
  const [qrCode, setQrCode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    checkStatus()
    let interval = null
    
    if (autoRefresh) {
      interval = setInterval(() => {
        checkStatus()
      }, 2000) // Check every 2 seconds when waiting for QR
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, status])

  async function checkStatus() {
    try {
      setError(null)
      const response = await fetch(`${API_URL}/api/whatsapp/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }
      
      const data = await response.json()
      setStatus(data.status)

      if (data.status === 'qr') {
        await loadQRCode()
        setAutoRefresh(true) // Keep refreshing while waiting for scan
      } else if (data.status === 'ready') {
        setQrCode(null)
        setAutoRefresh(false) // Stop auto-refresh when connected
      } else if (data.status === 'connecting') {
        setAutoRefresh(true)
      } else {
        setAutoRefresh(true)
      }
    } catch (error) {
      console.error('Error checking status:', error)
      setError(`שגיאה בחיבור לשרת: ${error.message}. ודא שהשרת רץ על ${API_URL}`)
      setStatus('disconnected')
    }
  }

  async function loadQRCode() {
    try {
      setError(null)
      const response = await fetch(`${API_URL}/api/whatsapp/qr`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.qr) {
        setQrCode(data.qr)
      } else if (data.status === 'ready') {
        setQrCode(null)
        setStatus('ready')
      }
    } catch (error) {
      console.error('Error loading QR code:', error)
      setError(`שגיאה בטעינת QR Code: ${error.message}`)
    }
  }

  function getStatusColor() {
    switch (status) {
      case 'ready':
        return 'text-green-600'
      case 'qr':
        return 'text-yellow-600'
      case 'connecting':
        return 'text-blue-600'
      default:
        return 'text-red-600'
    }
  }

  function getStatusText() {
    switch (status) {
      case 'ready':
        return 'מחובר ומוכן'
      case 'qr':
        return 'סרוק QR Code'
      case 'connecting':
        return 'מתחבר...'
      case 'authenticated':
        return 'מאומת...'
      default:
        return 'לא מחובר'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 bg-white rounded-2xl shadow-xl p-6 transform transition-all duration-300">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            התחברות WhatsApp
          </h2>
          <p className="text-gray-600">התחבר ל-WhatsApp שלך כדי לשלוח הודעות לעובדים</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">סטטוס חיבור</h3>
                <p className={`text-sm font-medium ${getStatusColor()} flex items-center gap-2`}>
                  {status === 'connecting' && <Loader2 className="w-4 h-4 animate-spin" />}
                  {getStatusText()}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setLoading(true)
                checkStatus().finally(() => setLoading(false))
              }}
              disabled={loading}
              className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 transform hover:scale-110 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <div className="flex items-center space-x-2 space-x-reverse">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {status === 'qr' && (
            <div className="mt-6 p-8 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-300 shadow-lg">
              <div className="text-center">
                <h4 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                  <QrCode className="w-6 h-6 text-yellow-600" />
                  סרוק את ה-QR Code עם WhatsApp שלך
                </h4>
                <p className="text-sm text-gray-600 mb-6">הקוד מתעדכן אוטומטית כל 2 שניות</p>
                
                {qrCode ? (
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl mb-6 transform transition-all duration-300 hover:scale-105">
                      <img 
                        src={qrCode} 
                        alt="QR Code for WhatsApp" 
                        className="w-64 h-64 border-4 border-yellow-400 shadow-xl rounded-xl"
                      />
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-lg max-w-md">
                      <h5 className="font-semibold text-gray-800 mb-3">הוראות:</h5>
                      <ol className="text-sm text-gray-700 space-y-2 text-right list-decimal list-inside">
                        <li>פתח WhatsApp בטלפון שלך</li>
                        <li>לך להגדרות → מכשירים מקושרים</li>
                        <li>לחץ על "קשר מכשיר"</li>
                        <li>סרוק את ה-QR Code למעלה</li>
                      </ol>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-12 h-12 text-yellow-600 animate-spin mb-4" />
                    <p className="text-gray-600">ממתין ל-QR Code...</p>
                    <button
                      onClick={loadQRCode}
                      className="mt-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition"
                    >
                      רענן
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {status === 'ready' && (
            <div className="mt-6 p-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-300 shadow-lg">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="p-4 bg-green-500 rounded-full">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-green-800 mb-2">מחובר בהצלחה! 🎉</h4>
                  <p className="text-sm text-green-700">
                    WhatsApp שלך מחובר ומוכן לשליחת הודעות. ההתחברות נשמרת אוטומטית.
                  </p>
                </div>
              </div>
            </div>
          )}

          {status === 'connecting' && (
            <div className="mt-6 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-300 shadow-lg">
              <div className="flex items-center space-x-4 space-x-reverse">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <div>
                  <h4 className="text-xl font-semibold text-blue-800 mb-2">מתחבר...</h4>
                  <p className="text-sm text-blue-700">
                    ממתין ל-QR Code מהשרת...
                  </p>
                </div>
              </div>
            </div>
          )}

          {status === 'disconnected' && !qrCode && (
            <div className="mt-6 p-8 bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl border-2 border-red-300 shadow-lg">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="p-4 bg-red-500 rounded-full">
                  <XCircle className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-red-800 mb-2">לא מחובר</h4>
                  <p className="text-sm text-red-700 mb-4">
                    המתן ל-QR Code או בדוק שהשרת רץ על {API_URL}
                  </p>
                  <button
                    onClick={() => {
                      setLoading(true)
                      checkStatus().finally(() => setLoading(false))
                    }}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                  >
                    נסה שוב
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
          <h4 className="font-bold text-blue-800 mb-3 text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            הערות חשובות:
          </h4>
          <ul className="text-sm text-blue-700 space-y-2 list-disc list-inside">
            <li>ההתחברות נשמרת אוטומטית - לא תצטרך לסרוק QR Code שוב</li>
            <li>ודא שהשרת WhatsApp רץ על {API_URL}</li>
            <li>אם התנתקת, פשוט סרוק את ה-QR Code שוב</li>
            <li>ההודעות נשלחות מהטלפון שלך - ודא שיש לך חיבור יציב</li>
            <li>ה-QR Code מתעדכן אוטומטית כל 2 שניות</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

