import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Smartphone, CheckCircle, ExternalLink, Info, Copy, Check } from 'lucide-react'
import { createWhatsAppLink, formatPhoneNumber } from '../utils/whatsappLink'

export default function WhatsAppConnectionSimple() {
  const { user } = useAuth()
  const [managerPhone, setManagerPhone] = useState('')
  const [copied, setCopied] = useState(false)

  function handleOpenWhatsApp() {
    if (!managerPhone) {
      alert('אנא הזן מספר טלפון')
      return
    }

    const formattedPhone = formatPhoneNumber(managerPhone)
    const link = `https://api.whatsapp.com/send?phone=${formattedPhone}`
    window.open(link, '_blank', 'noopener,noreferrer')
  }

  function handleCopyLink() {
    if (!managerPhone) {
      alert('אנא הזן מספר טלפון')
      return
    }

    const formattedPhone = formatPhoneNumber(managerPhone)
    const link = `https://api.whatsapp.com/send?phone=${formattedPhone}`
    
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-2 sm:p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 sm:mb-8 bg-white rounded-2xl shadow-xl p-4 sm:p-6 transform transition-all duration-300">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            שליחת הודעות WhatsApp - פתרון פשוט ומהיר! 🚀
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            פתרון חדש ונוח - ללא צורך בשרת! פשוט פתח WhatsApp Web ושלוח הודעות
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">פתרון פעיל ומוכן!</h3>
                <p className="text-xs sm:text-sm text-green-600 font-medium">
                  אין צורך בהתחברות - פשוט פתח WhatsApp Web
                </p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mb-6 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
            <div className="flex items-start space-x-3 space-x-reverse">
              <Info className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">איך זה עובד?</h4>
                <ul className="text-xs sm:text-sm text-blue-700 space-y-2 list-disc list-inside">
                  <li>הזן את מספר הטלפון שלך (המנהל)</li>
                  <li>לחץ על "פתח WhatsApp" - יפתח חלון WhatsApp Web</li>
                  <li>בדף "שליחת התראות" - כל לחיצה פותחת חלון WhatsApp עם הודעה מוכנה</li>
                  <li>פשוט לחץ "שלח" ב-WhatsApp Web - זה הכל! 🎉</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Phone Input */}
          <div className="mb-6">
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
              מספר הטלפון שלך (לבדיקה)
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="tel"
                value={managerPhone}
                onChange={(e) => setManagerPhone(e.target.value)}
                placeholder="05X-XXXXXXX"
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
              />
              <button
                onClick={handleOpenWhatsApp}
                disabled={!managerPhone}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg disabled:transform-none flex items-center justify-center space-x-2 space-x-reverse touch-manipulation active:scale-95"
              >
                <ExternalLink className="w-5 h-5" />
                <span>פתח WhatsApp</span>
              </button>
              <button
                onClick={handleCopyLink}
                disabled={!managerPhone}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg disabled:transform-none flex items-center justify-center space-x-2 space-x-reverse touch-manipulation active:scale-95"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                <span className="hidden sm:inline">{copied ? 'הועתק!' : 'העתק קישור'}</span>
              </button>
            </div>
          </div>

          {/* Success Message */}
          <div className="mt-6 p-4 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-300 shadow-lg">
            <div className="flex items-center space-x-3 space-x-reverse">
              <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 flex-shrink-0" />
              <div>
                <h4 className="text-lg sm:text-xl font-bold text-green-800 mb-2">מוכן לשימוש! 🎉</h4>
                <p className="text-sm sm:text-base text-green-700">
                  עכשיו תוכל לשלוח הודעות לעובדים ישירות מדף "שליחת התראות". 
                  כל לחיצה פותחת חלון WhatsApp Web עם הודעה מוכנה - פשוט לחץ "שלח"!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Advantages */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 sm:p-6">
          <h4 className="font-semibold text-purple-800 mb-3 text-base sm:text-lg">יתרונות הפתרון החדש:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start space-x-2 space-x-reverse">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-xs sm:text-sm text-purple-700">אין צורך בשרת חיצוני</span>
            </div>
            <div className="flex items-start space-x-2 space-x-reverse">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-xs sm:text-sm text-purple-700">עובד מיד ללא הגדרות</span>
            </div>
            <div className="flex items-start space-x-2 space-x-reverse">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-xs sm:text-sm text-purple-700">מהיר ונוח לשימוש</span>
            </div>
            <div className="flex items-start space-x-2 space-x-reverse">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-xs sm:text-sm text-purple-700">עובד על כל מכשיר</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

