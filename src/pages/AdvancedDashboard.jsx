import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore'
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO, subDays } from 'date-fns'
import { he } from 'date-fns/locale'
import { 
  TrendingUp, Users, Clock, Calendar, CheckCircle, AlertCircle, 
  MessageSquare, Star, Award, Activity, BarChart3, PieChart, RefreshCw
} from 'lucide-react'

export default function AdvancedDashboard() {
  const { user, db } = useAuth()
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeShifts: 0,
    pendingRequests: 0,
    completedTasks: 0,
    attendanceRate: 0,
    weeklyHours: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!db || !user) return
    loadDashboardData()
  }, [db, user])

  async function loadDashboardData() {
    if (!db || !user) return

    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid

      // Load employees
      const employeesRef = collection(dbInstance, `artifacts/${appId}/employees`)
      const employeesSnapshot = await getDocs(employeesRef)
      const employees = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      const activeEmployees = employees.filter(emp => emp.isActive !== false)

      // Load shifts for this week
      const now = new Date()
      const weekStart = startOfWeek(now, { locale: he })
      const weekEnd = endOfWeek(now, { locale: he })
      
      const shiftsRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/assignedShifts`)
      const shiftsSnapshot = await getDocs(shiftsRef)
      const shifts = shiftsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(shift => {
          const shiftDate = parseISO(shift.date)
          return isWithinInterval(shiftDate, { start: weekStart, end: weekEnd })
        })

      // Load swap requests
      const swapsRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/swapRequests`)
      const swapsSnapshot = await getDocs(swapsRef)
      const pendingSwaps = swapsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(swap => swap.status === 'pending')

      // Load tasks
      const tasksRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/tasks`)
      const tasksSnapshot = await getDocs(tasksRef)
      const completedTasks = tasksSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(task => task.completed === true)

      // Calculate weekly hours
      const weeklyHours = shifts.reduce((total, shift) => {
        const start = new Date(`2000-01-01T${shift.startTime}`)
        const end = new Date(`2000-01-01T${shift.endTime}`)
        const hours = (end - start) / (1000 * 60 * 60)
        return total + hours
      }, 0)

      setStats({
        totalEmployees: activeEmployees.length,
        activeShifts: shifts.length,
        pendingRequests: pendingSwaps.length,
        completedTasks: completedTasks.length,
        attendanceRate: 95, // Mock data - can be calculated from attendance records
        weeklyHours: Math.round(weeklyHours)
      })

      // Load recent activity
      const activities = [
        { type: 'shift', message: 'משמרת חדשה נוספה', time: 'לפני שעה', icon: Calendar },
        { type: 'swap', message: 'בקשת החלפה חדשה', time: 'לפני 2 שעות', icon: RefreshCw },
        { type: 'task', message: 'משימה הושלמה', time: 'לפני 3 שעות', icon: CheckCircle },
        { type: 'employee', message: 'עובד חדש נוסף', time: 'לפני יום', icon: Users }
      ]
      setRecentActivity(activities)

      setLoading(false)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">טוען...</div>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      <div className="mb-6 sm:mb-8 px-2 sm:px-0">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          דשבורד מתקדם
        </h2>
        <p className="text-sm sm:text-base text-gray-600">סקירה כללית של המערכת</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="סה״כ עובדים"
          value={stats.totalEmployees}
          icon={Users}
          color="blue"
          trend="+2"
        />
        <StatCard
          title="משמרות פעילות"
          value={stats.activeShifts}
          icon={Calendar}
          color="green"
          trend="+5"
        />
        <StatCard
          title="בקשות ממתינות"
          value={stats.pendingRequests}
          icon={AlertCircle}
          color="yellow"
          trend=""
        />
        <StatCard
          title="משימות הושלמו"
          value={stats.completedTasks}
          icon={CheckCircle}
          color="purple"
          trend="+12"
        />
        <StatCard
          title="שיעור נוכחות"
          value={`${stats.attendanceRate}%`}
          icon={TrendingUp}
          color="indigo"
          trend="+3%"
        />
        <StatCard
          title="שעות שבועיות"
          value={stats.weeklyHours}
          icon={Clock}
          color="pink"
          trend="+8h"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Weekly Hours Chart */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 ml-2 text-blue-600" />
              שעות שבועיות
            </h3>
          </div>
          <div className="h-48 sm:h-64 flex items-end justify-between space-x-1 sm:space-x-2 space-x-reverse">
            {[40, 35, 45, 38, 42, 40, 35].map((height, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-400"
                  style={{ height: `${(height / 50) * 100}%` }}
                />
                <span className="text-xs text-gray-500 mt-2">
                  {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'][index]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 ml-2 text-green-600" />
              פעילות אחרונה
            </h3>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {recentActivity.map((activity, index) => {
              const Icon = activity.icon
              return (
                <div
                  key={index}
                  className="flex items-center space-x-3 space-x-reverse p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 sm:p-6 border border-blue-200">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">פעולות מהירות</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <QuickActionButton
            icon={Users}
            label="ניהול עובדים"
            color="blue"
            href="/employees"
          />
          <QuickActionButton
            icon={Calendar}
            label="לוח משמרות"
            color="green"
            href="/schedule"
          />
          <QuickActionButton
            icon={MessageSquare}
            label="הודעות"
            color="purple"
            href="/messages"
          />
          <QuickActionButton
            icon={BarChart3}
            label="דוחות"
            color="indigo"
            href="/reports"
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color, trend }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600',
    pink: 'from-pink-500 to-pink-600'
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className={`p-2 sm:p-3 bg-gradient-to-br ${colorClasses[color]} rounded-lg`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        {trend && (
          <span className="text-xs sm:text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl sm:text-3xl font-bold text-gray-800">{value}</p>
    </div>
  )
}

function QuickActionButton({ icon: Icon, label, color, href }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
    green: 'bg-green-100 text-green-600 hover:bg-green-200',
    purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
    indigo: 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
  }

  return (
    <a
      href={href}
      className={`${colorClasses[color]} p-3 sm:p-4 rounded-lg text-center transition-all duration-200 transform hover:scale-105 active:scale-95`}
    >
      <Icon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2" />
      <p className="text-xs sm:text-sm font-medium">{label}</p>
    </a>
  )
}

