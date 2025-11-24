import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check localStorage and system preference
    const saved = localStorage.getItem('darkMode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = saved ? saved === 'true' : prefersDark
    
    setIsDark(shouldBeDark)
    updateTheme(shouldBeDark)
  }, [])

  function updateTheme(dark) {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function toggleDarkMode() {
    const newValue = !isDark
    setIsDark(newValue)
    localStorage.setItem('darkMode', newValue.toString())
    updateTheme(newValue)
  }

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition"
      title={isDark ? 'מצב בהיר' : 'מצב כהה'}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  )
}

