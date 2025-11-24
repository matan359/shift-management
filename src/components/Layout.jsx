import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, Calendar, Users, Settings, Menu, X, Bell, Smartphone } from 'lucide-react'
import { useState } from 'react'

export default function Layout({ children }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const isManager = user?.role === 'manager'
  const isWorker = user?.role === 'worker'

  return (
    <div className="min-h-screen relative">
      {/* Navigation Bar */}
      <nav className="glass-effect shadow-glow-lg sticky top-0 z-50 bg-gradient-to-r from-green-700 via-green-600 to-green-700">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 space-x-reverse">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              <h1 className="text-base sm:text-xl font-bold text-white drop-shadow-lg">מערכת ניהול משמרות</h1>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6 space-x-reverse">
              {isManager && (
                <>
                  <Link to="/advanced-dashboard" className="text-white hover:text-green-200 transition font-semibold drop-shadow-md">
                    דשבורד
                  </Link>
                  <Link to="/manager" className="text-white hover:text-green-200 transition font-semibold drop-shadow-md">
                    לוח בקרה
                  </Link>
                  <Link to="/schedule" className="text-white hover:text-green-200 transition font-semibold drop-shadow-md">
                    לוח משמרות
                  </Link>
                  <Link to="/employees" className="text-white hover:text-green-200 transition font-semibold drop-shadow-md">
                    <Users className="w-4 h-4 inline ml-1" />
                    עובדים
                  </Link>
                  <Link to="/events" className="text-white hover:text-green-200 transition font-semibold drop-shadow-md">
                    אירועים
                  </Link>
                  <Link to="/tasks" className="text-white hover:text-green-200 transition font-semibold drop-shadow-md">
                    משימות
                  </Link>
                  <Link to="/notifications" className="text-white hover:text-green-200 transition font-semibold drop-shadow-md">
                    <Bell className="w-4 h-4 inline ml-1" />
                    התראות WhatsApp
                  </Link>
                  <Link to="/announcements" className="text-white hover:text-green-200 transition font-semibold drop-shadow-md">
                    הודעות
                  </Link>
                  <Link to="/special-days" className="text-white hover:text-green-200 transition font-semibold drop-shadow-md">
                    ימים מיוחדים
                  </Link>
                </>
              )}
              {isWorker && (
                <>
                  <Link to="/shift-notes" className="text-white hover:text-green-200 transition font-semibold drop-shadow-md">
                    הערות
                  </Link>
                </>
              )}
              {isWorker && (
                <>
                  <Link to="/worker" className="text-white hover:text-green-200 transition font-semibold drop-shadow-md">
                    לוח בקרה
                  </Link>
                  <Link to="/schedule" className="text-white hover:text-green-200 transition font-semibold drop-shadow-md">
                    לוח משמרות
                  </Link>
                  <Link to="/availability" className="text-white hover:text-green-200 transition font-semibold drop-shadow-md">
                    הגשת זמינות
                  </Link>
                  <Link to="/swap" className="text-white hover:text-green-200 transition font-semibold drop-shadow-md">
                    החלפת משמרות
                  </Link>
                </>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1 space-x-reverse text-white hover:text-green-200 transition font-semibold drop-shadow-md"
              >
                <LogOut className="w-4 h-4" />
                <span>התנתק</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 space-y-2 pb-4">
              {isManager && (
                <>
                  <Link to="/manager" className="block py-2 text-white hover:text-green-200 transition font-semibold" onClick={() => setMobileMenuOpen(false)}>
                    לוח בקרה
                  </Link>
                  <Link to="/schedule" className="block py-2 text-white hover:text-green-200 transition font-semibold" onClick={() => setMobileMenuOpen(false)}>
                    לוח משמרות
                  </Link>
                  <Link to="/employees" className="block py-2 text-white hover:text-green-200 transition font-semibold" onClick={() => setMobileMenuOpen(false)}>
                    עובדים
                  </Link>
                  <Link to="/events" className="block py-2 text-white hover:text-green-200 transition font-semibold" onClick={() => setMobileMenuOpen(false)}>
                    אירועים
                  </Link>
                  <Link to="/tasks" className="block py-2 text-white hover:text-green-200 transition font-semibold" onClick={() => setMobileMenuOpen(false)}>
                    משימות
                  </Link>
                  <Link to="/notifications" className="block py-2 text-white hover:text-green-200 transition font-semibold" onClick={() => setMobileMenuOpen(false)}>
                    התראות WhatsApp
                  </Link>
                </>
              )}
              {isWorker && (
                <>
                  <Link to="/worker" className="block py-2 text-white hover:text-green-200 transition font-semibold" onClick={() => setMobileMenuOpen(false)}>
                    לוח בקרה
                  </Link>
                  <Link to="/schedule" className="block py-2 text-white hover:text-green-200 transition font-semibold" onClick={() => setMobileMenuOpen(false)}>
                    לוח משמרות
                  </Link>
                  <Link to="/availability" className="block py-2 text-white hover:text-green-200 transition font-semibold" onClick={() => setMobileMenuOpen(false)}>
                    הגשת זמינות
                  </Link>
                  <Link to="/swap" className="block py-2 text-white hover:text-green-200 transition font-semibold" onClick={() => setMobileMenuOpen(false)}>
                    החלפת משמרות
                  </Link>
                </>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1 space-x-reverse py-2 text-white hover:text-green-200 w-full text-right transition font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>התנתק</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 animate-fadeIn relative z-10">
        {children}
      </main>
    </div>
  )
}

