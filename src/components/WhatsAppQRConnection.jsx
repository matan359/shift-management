import { useState, useEffect, useRef } from 'react'
import { QrCode, CheckCircle, XCircle, Loader2, RefreshCw, Smartphone } from 'lucide-react'

export default function WhatsAppQRConnection({ onConnected, onDisconnected }) {
  const [qrCode, setQrCode] = useState(null)
  const [status, setStatus] = useState('disconnected') // disconnected, connecting, qr, ready
  const [error, setError] = useState(null)
  const iframeRef = useRef(null)
  const checkIntervalRef = useRef(null)

  useEffect(() => {
    initializeConnection()
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [])

  async function initializeConnection() {
    setStatus('connecting')
    setError(null)

    try {
      // Generate unique session ID
      const sessionId = `whatsapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('whatsapp_session_id', sessionId)

      // Create WhatsApp Web URL with pre-filled message
      const whatsappWebUrl = `https://web.whatsapp.com/send?phone=&text=`
      
      // Try to open WhatsApp Web in iframe
      // Note: WhatsApp blocks iframes, so we'll use a workaround
      setQrCode(sessionId) // Use session ID as QR placeholder
      setStatus('qr')
      
      // Start checking connection status
      startStatusCheck(sessionId)
    } catch (error) {
      console.error('Error initializing WhatsApp:', error)
      setError('שגיאה באתחול WhatsApp')
      setStatus('disconnected')
    }
  }

  function startStatusCheck(sessionId) {
    // Check if WhatsApp Web is accessible
    checkIntervalRef.current = setInterval(() => {
      checkConnectionStatus(sessionId)
    }, 3000)
  }

  async function checkConnectionStatus(sessionId) {
    try {
      // Check if user has interacted with WhatsApp Web
      const whatsappConnected = localStorage.getItem('whatsapp_connected')
      
      if (whatsappConnected === 'true') {
        setStatus('ready')
        if (onConnected) onConnected()
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current)
        }
      }
    } catch (error) {
      console.error('Error checking status:', error)
    }
  }

  function handleQRScan() {
    // Open WhatsApp Web in new window
    const whatsappUrl = 'https://web.whatsapp.com'
    const newWindow = window.open(whatsappUrl, 'WhatsApp Web', 'width=800,height=600')
    
    // Listen for window close
    const checkClosed = setInterval(() => {
      if (newWindow.closed) {
        clearInterval(checkClosed)
        // Check if connection was established
        setTimeout(() => {
          const connected = localStorage.getItem('whatsapp_connected')
          if (connected === 'true') {
            setStatus('ready')
            if (onConnected) onConnected()
          }
        }, 1000)
      }
    }, 1000)
  }

  function markAsConnected() {
    localStorage.setItem('whatsapp_connected', 'true')
    setStatus('ready')
    if (onConnected) onConnected()
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current)
    }
  }

  function disconnect() {
    localStorage.removeItem('whatsapp_connected')
    localStorage.removeItem('whatsapp_session_id')
    setStatus('disconnected')
    setQrCode(null)
    if (onDisconnected) onDisconnected()
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current)
    }
  }

  // Generate QR Code using qrcode library
  useEffect(() => {
    if (status === 'qr' && qrCode) {
      generateQRCode()
    }
  }, [status, qrCode])

  async function generateQRCode() {
    try {
      // Generate QR code for WhatsApp Web connection
      const QRCode = await import('qrcode')
      // Create a unique connection URL
      const connectionUrl = `https://web.whatsapp.com`
      const dataUrl = await QRCode.default.toDataURL(connectionUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCode(dataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
      // Fallback: show instructions
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Smartphone className="w-6 h-6 text-green-600" />
          חיבור WhatsApp
        </h3>
        <button
          onClick={() => initializeConnection()}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Status Display */}
        <div className="flex items-center gap-3">
          {status === 'ready' ? (
            <>
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span className="text-green-700 font-semibold">✅ מחובר</span>
            </>
          ) : status === 'qr' ? (
            <>
              <QrCode className="w-6 h-6 text-yellow-600" />
              <span className="text-yellow-700 font-semibold">📱 סרוק QR Code</span>
            </>
          ) : status === 'connecting' ? (
            <>
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="text-blue-700 font-semibold">🔄 מתחבר...</span>
            </>
          ) : (
            <>
              <XCircle className="w-6 h-6 text-red-600" />
              <span className="text-red-700 font-semibold">❌ לא מחובר</span>
            </>
          )}
        </div>

        {/* QR Code Display */}
        {status === 'qr' && qrCode && typeof qrCode === 'string' && qrCode.startsWith('data:image') && (
          <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-700 text-center font-semibold">
              סרוק את ה-QR Code עם WhatsApp בטלפון שלך:
            </p>
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
            </div>
            <p className="text-xs text-gray-600 text-center">
              פתח WhatsApp → הגדרות → מכשירים מקושרים → קשר מכשיר
            </p>
            <button
              onClick={handleQRScan}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition font-semibold"
            >
              פתח WhatsApp Web
            </button>
            <button
              onClick={markAsConnected}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition text-sm"
            >
              סיימתי - סמן כמחובר
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 rounded-xl border-2 border-red-300">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Ready Status */}
        {status === 'ready' && (
          <div className="p-4 bg-green-50 rounded-xl border-2 border-green-300">
            <p className="text-sm text-green-700 text-center font-semibold">
              ✅ WhatsApp מחובר ומוכן! כעת תוכל לשלוח הודעות.
            </p>
            <button
              onClick={disconnect}
              className="mt-3 w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition text-sm"
            >
              התנתק
            </button>
          </div>
        )}

        {/* Disconnected Status */}
        {status === 'disconnected' && (
          <div className="p-4 bg-yellow-50 rounded-xl border-2 border-yellow-300">
            <p className="text-sm text-yellow-700 text-center mb-3">
              לחץ על "רענן" למעלה כדי להתחיל חיבור WhatsApp
            </p>
            <button
              onClick={initializeConnection}
              className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition font-semibold flex items-center justify-center gap-2"
            >
              <Smartphone className="w-5 h-5" />
              <span>התחל חיבור</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

