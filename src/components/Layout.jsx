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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation Bar */}
      <nav className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-2xl sticky top-0 z-50 backdrop-blur-lg bg-opacity-90">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Calendar className="w-6 h-6" />
              <h1 className="text-xl font-bold">מערכת ניהול משמרות</h1>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6 space-x-reverse">
              {isManager && (
                <>
                  <Link to="/advanced-dashboard" className="hover:text-blue-200 transition">
                    דשבורד
                  </Link>
                  <Link to="/manager" className="hover:text-blue-200 transition">
                    לוח בקרה
                  </Link>
                  <Link to="/schedule" className="hover:text-blue-200 transition">
                    לוח משמרות
                  </Link>
                  <Link to="/employees" className="hover:text-blue-200 transition">
                    <Users className="w-4 h-4 inline ml-1" />
                    עובדים
                  </Link>
                  <Link to="/events" className="hover:text-blue-200 transition">
                    אירועים
                  </Link>
                  <Link to="/tasks" className="hover:text-blue-200 transition">
                    משימות
                  </Link>
                  <Link to="/notifications" className="hover:text-blue-200 transition">
                    <Bell className="w-4 h-4 inline ml-1" />
                    התראות
                  </Link>
                  <Link to="/whatsapp-connection" className="hover:text-blue-200 transition">
                    <Smartphone className="w-4 h-4 inline ml-1" />
                    WhatsApp
                  </Link>
                  <Link to="/announcements" className="hover:text-blue-200 transition">
                    הודעות
                  </Link>
                  <Link to="/special-days" className="hover:text-blue-200 transition">
                    ימים מיוחדים
                  </Link>
                </>
              )}
              {isWorker && (
                <>
                  <Link to="/shift-notes" className="hover:text-blue-200 transition">
                    הערות
                  </Link>
                </>
              )}
              {isWorker && (
                <>
                  <Link to="/worker" className="hover:text-blue-200 transition">
                    לוח בקרה
                  </Link>
                  <Link to="/schedule" className="hover:text-blue-200 transition">
                    לוח משמרות
                  </Link>
                  <Link to="/availability" className="hover:text-blue-200 transition">
                    הגשת זמינות
                  </Link>
                  <Link to="/swap" className="hover:text-blue-200 transition">
                    החלפת משמרות
                  </Link>
                </>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1 space-x-reverse hover:text-blue-200 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>התנתק</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
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
                  <Link to="/manager" className="block py-2 hover:text-blue-200" onClick={() => setMobileMenuOpen(false)}>
                    לוח בקרה
                  </Link>
                  <Link to="/schedule" className="block py-2 hover:text-blue-200" onClick={() => setMobileMenuOpen(false)}>
                    לוח משמרות
                  </Link>
                  <Link to="/employees" className="block py-2 hover:text-blue-200" onClick={() => setMobileMenuOpen(false)}>
                    עובדים
                  </Link>
                  <Link to="/events" className="block py-2 hover:text-blue-200" onClick={() => setMobileMenuOpen(false)}>
                    אירועים
                  </Link>
                  <Link to="/tasks" className="block py-2 hover:text-blue-200" onClick={() => setMobileMenuOpen(false)}>
                    משימות
                  </Link>
                  <Link to="/notifications" className="block py-2 hover:text-blue-200" onClick={() => setMobileMenuOpen(false)}>
                    התראות
                  </Link>
                  <Link to="/whatsapp-connection" className="block py-2 hover:text-blue-200" onClick={() => setMobileMenuOpen(false)}>
                    WhatsApp
                  </Link>
                </>
              )}
              {isWorker && (
                <>
                  <Link to="/worker" className="block py-2 hover:text-blue-200" onClick={() => setMobileMenuOpen(false)}>
                    לוח בקרה
                  </Link>
                  <Link to="/schedule" className="block py-2 hover:text-blue-200" onClick={() => setMobileMenuOpen(false)}>
                    לוח משמרות
                  </Link>
                  <Link to="/availability" className="block py-2 hover:text-blue-200" onClick={() => setMobileMenuOpen(false)}>
                    הגשת זמינות
                  </Link>
                  <Link to="/swap" className="block py-2 hover:text-blue-200" onClick={() => setMobileMenuOpen(false)}>
                    החלפת משמרות
                  </Link>
                </>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1 space-x-reverse py-2 hover:text-blue-200 w-full text-right"
              >
                <LogOut className="w-4 h-4" />
                <span>התנתק</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 animate-fadeIn">
        {children}
      </main>
    </div>
  )
}

