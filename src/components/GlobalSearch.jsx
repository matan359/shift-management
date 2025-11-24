import { useState, useEffect, useRef } from 'react'
import { Search, X, Calendar, Users, Bell, FileText, Clock, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const SEARCH_ITEMS = {
  pages: [
    { path: '/manager', label: 'לוח בקרה מנהל', icon: Settings },
    { path: '/worker', label: 'לוח בקרה עובד', icon: Users },
    { path: '/schedule', label: 'לוח משמרות', icon: Calendar },
    { path: '/employees', label: 'ניהול עובדים', icon: Users },
    { path: '/notifications', label: 'התראות WhatsApp', icon: Bell },
    { path: '/announcements', label: 'הודעות ונהלי עבודה', icon: FileText },
    { path: '/tasks', label: 'משימות', icon: FileText },
    { path: '/events', label: 'אירועים', icon: Calendar },
    { path: '/attendance', label: 'נוכחות', icon: Clock },
  ],
  shortcuts: [
    { key: 'Ctrl+K', label: 'חיפוש מהיר', action: 'search' },
    { key: 'Ctrl+/', label: 'עזרה', action: 'help' },
  ]
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K or Cmd+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        setTimeout(() => inputRef.current?.focus(), 100)
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setQuery('')
      }
      // Arrow keys navigation
      if (isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault()
        if (e.key === 'ArrowDown') {
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
        } else {
          setSelectedIndex(prev => Math.max(prev - 1, 0))
        }
      }
      // Enter to select
      if (isOpen && e.key === 'Enter' && results[selectedIndex]) {
        handleSelect(results[selectedIndex])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchQuery = query.toLowerCase()
    const filtered = SEARCH_ITEMS.pages.filter(item =>
      item.label.toLowerCase().includes(searchQuery) ||
      item.path.toLowerCase().includes(searchQuery)
    )
    setResults(filtered)
    setSelectedIndex(0)
  }, [query])

  function handleSelect(item) {
    navigate(item.path)
    setIsOpen(false)
    setQuery('')
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white border border-gray-300 rounded-lg text-gray-600 hover:text-gray-800 transition text-sm font-medium shadow-sm"
        title="חיפוש מהיר (Ctrl+K)"
      >
        <Search className="w-4 h-4" />
        <span className="hidden lg:inline">חיפוש...</span>
        <kbd className="hidden lg:inline px-2 py-1 text-xs bg-gray-100 rounded border border-gray-300">Ctrl+K</kbd>
      </button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fadeIn"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Search Modal */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-2xl z-50 px-4 animate-slideUp">
        <div className="glass-effect rounded-2xl shadow-glow-lg p-4">
          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חפש דפים, תכונות..."
              className="w-full pr-12 pl-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
              autoFocus
            />
            <button
              onClick={() => setIsOpen(false)}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results */}
          {results.length > 0 ? (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {results.map((item, index) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.path}
                    onClick={() => handleSelect(item)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
                      index === selectedIndex
                        ? 'bg-green-100 border-2 border-green-300'
                        : 'bg-white hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-green-600" />
                    <span className="flex-1 text-right text-gray-800 font-medium">{item.label}</span>
                  </button>
                )
              })}
            </div>
          ) : query ? (
            <div className="text-center py-8 text-gray-500">
              <p>לא נמצאו תוצאות</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-3">קיצורי דרך:</p>
              {SEARCH_ITEMS.shortcuts.map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between p-2 text-sm text-gray-600">
                  <span>{shortcut.label}</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300">{shortcut.key}</kbd>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

