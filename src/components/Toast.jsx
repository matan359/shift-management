import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const TOAST_TYPES = {
  success: { icon: CheckCircle, color: 'green' },
  error: { icon: XCircle, color: 'red' },
  warning: { icon: AlertCircle, color: 'yellow' },
  info: { icon: Info, color: 'blue' }
}

export function useToast() {
  const [toasts, setToasts] = useState([])

  const showToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now()
    const toast = { id, message, type, duration }
    setToasts(prev => [...prev, toast])

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return { toasts, showToast, removeToast }
}

export default function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => {
        const { icon: Icon, color } = TOAST_TYPES[toast.type] || TOAST_TYPES.info
        return (
          <div
            key={toast.id}
            className={`glass-effect rounded-xl shadow-glow p-4 flex items-center gap-3 animate-slideUp pointer-events-auto border-2 border-${color}-300 bg-${color}-50`}
          >
            <Icon className={`w-6 h-6 text-${color}-600 flex-shrink-0`} />
            <p className={`flex-1 text-${color}-800 font-medium`}>{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className={`text-${color}-600 hover:text-${color}-800 p-1 rounded-lg hover:bg-${color}-100 transition`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

