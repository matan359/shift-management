import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ size = 'md', text = 'טוען...', fullScreen = false }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn">
        <div className="glass-effect rounded-2xl shadow-glow p-8 flex flex-col items-center gap-4">
          <Loader2 className={`${sizeClasses[size]} text-green-600 animate-spin`} />
          {text && <p className="text-gray-700 font-medium">{text}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-4">
      <Loader2 className={`${sizeClasses[size]} text-green-600 animate-spin`} />
      {text && <p className="text-gray-600 font-medium">{text}</p>}
    </div>
  )
}

