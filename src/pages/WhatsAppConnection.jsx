import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Smartphone, CheckCircle, XCircle, RefreshCw, QrCode } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function WhatsAppConnection() {
  const [status, setStatus] = useState('disconnected')
  const [qrCode, setQrCode] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 3000) // Check every 3 seconds
    
    return () => clearInterval(interval)
  }, [])

  async function checkStatus() {
    try {
      const response = await fetch(`${API_URL}/api/whatsapp/status`)
      const data = await response.json()
      setStatus(data.status)

      if (data.status === 'qr') {
        loadQRCode()
      } else if (data.status === 'ready') {
        setQrCode(null)
      }
    } catch (error) {
      console.error('Error checking status:', error)
    }
  }

  async function loadQRCode() {
    try {
      const response = await fetch(`${API_URL}/api/whatsapp/qr`)
      const data = await response.json()
      
      if (data.qr) {
        setQrCode(data.qr)
      }
    } catch (error) {
      console.error('Error loading QR code:', error)
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
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">התחברות WhatsApp</h2>
        <p className="text-gray-600">התחבר ל-WhatsApp שלך כדי לשלוח הודעות לעובדים</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <Smartphone className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-800">סטטוס חיבור</h3>
              <p className={`text-sm font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </p>
            </div>
          </div>
          <button
            onClick={checkStatus}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {status === 'qr' && qrCode && (
          <div className="mt-6 p-6 bg-gray-50 rounded-lg">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-center">
                <QrCode className="w-5 h-5 ml-2" />
                סרוק את ה-QR Code עם WhatsApp שלך
              </h4>
              <div className="flex justify-center mb-4">
                <img 
                  src={qrCode} 
                  alt="QR Code" 
                  className="border-4 border-white shadow-lg rounded-lg"
                  style={{ maxWidth: '300px' }}
                />
              </div>
              <p className="text-sm text-gray-600">
                1. פתח WhatsApp בטלפון שלך<br />
                2. לך להגדרות → מכשירים מקושרים<br />
                3. לחץ על "קשר מכשיר"<br />
                4. סרוק את ה-QR Code למעלה
              </p>
            </div>
          </div>
        )}

        {status === 'ready' && (
          <div className="mt-6 p-6 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3 space-x-reverse">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h4 className="text-lg font-semibold text-green-800">מחובר בהצלחה!</h4>
                <p className="text-sm text-green-700">
                  WhatsApp שלך מחובר ומוכן לשליחת הודעות. ההתחברות נשמרת אוטומטית.
                </p>
              </div>
            </div>
          </div>
        )}

        {status === 'disconnected' && !qrCode && (
          <div className="mt-6 p-6 bg-red-50 rounded-lg">
            <div className="flex items-center space-x-3 space-x-reverse">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <h4 className="text-lg font-semibold text-red-800">לא מחובר</h4>
                <p className="text-sm text-red-700">
                  המתן ל-QR Code או בדוק שהשרת רץ.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">הערות חשובות:</h4>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>ההתחברות נשמרת אוטומטית - לא תצטרך לסרוק QR Code שוב</li>
          <li>ודא שהשרת רץ על פורט 3001</li>
          <li>אם התנתקת, פשוט סרוק את ה-QR Code שוב</li>
          <li>ההודעות נשלחות מהטלפון שלך - ודא שיש לך חיבור יציב</li>
        </ul>
      </div>
    </div>
  )
}

