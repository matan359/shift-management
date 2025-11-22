import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import WorkerDashboard from './pages/WorkerDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import SubmitAvailability from './pages/SubmitAvailability'
import SwapShifts from './pages/SwapShifts'
import ScheduleView from './pages/ScheduleView'
import ManageEmployees from './pages/ManageEmployees'
import ManageEvents from './pages/ManageEvents'
import ManageTasks from './pages/ManageTasks'
import ManageNotifications from './pages/ManageNotifications'
import WhatsAppConnection from './pages/WhatsAppConnection'
import SystemAnnouncements from './pages/SystemAnnouncements'
import SpecialDaysAlerts from './pages/SpecialDaysAlerts'
import ShiftNotes from './pages/ShiftNotes'
import AdvancedDashboard from './pages/AdvancedDashboard'
import AttendanceTracking from './pages/AttendanceTracking'
import Layout from './components/Layout'

function PrivateRoute({ children, requiredRole }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">טוען...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" />
  }

  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()

  // Show loading only for a short time, then show login if no user
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-xl mb-2">טוען...</div>
          <div className="text-sm text-gray-500">מתחבר ל-Firebase</div>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={!user || user.role === 'anonymous' ? <Login /> : <Navigate to={user.role === 'manager' ? '/manager' : '/worker'} />} />
      <Route path="/register" element={!user || user.role === 'anonymous' ? <Register /> : <Navigate to={user.role === 'manager' ? '/manager' : '/worker'} />} />
      
      <Route path="/" element={
        <PrivateRoute>
          <Layout>
            {user && user.role === 'manager' ? <ManagerDashboard /> : user && user.role === 'worker' ? <WorkerDashboard /> : <Navigate to="/login" />}
          </Layout>
        </PrivateRoute>
      } />

      <Route path="/worker" element={
        <PrivateRoute requiredRole="worker">
          <Layout>
            <WorkerDashboard />
          </Layout>
        </PrivateRoute>
      } />

      <Route path="/manager" element={
        <PrivateRoute requiredRole="manager">
          <Layout>
            <ManagerDashboard />
          </Layout>
        </PrivateRoute>
      } />

      <Route path="/availability" element={
        <PrivateRoute requiredRole="worker">
          <Layout>
            <SubmitAvailability />
          </Layout>
        </PrivateRoute>
      } />

      <Route path="/swap" element={
        <PrivateRoute requiredRole="worker">
          <Layout>
            <SwapShifts />
          </Layout>
        </PrivateRoute>
      } />

      <Route path="/schedule" element={
        <PrivateRoute>
          <Layout>
            <ScheduleView />
          </Layout>
        </PrivateRoute>
      } />

      <Route path="/employees" element={
        <PrivateRoute requiredRole="manager">
          <Layout>
            <ManageEmployees />
          </Layout>
        </PrivateRoute>
      } />

      <Route path="/events" element={
        <PrivateRoute requiredRole="manager">
          <Layout>
            <ManageEvents />
          </Layout>
        </PrivateRoute>
      } />

      <Route path="/tasks" element={
        <PrivateRoute requiredRole="manager">
          <Layout>
            <ManageTasks />
          </Layout>
        </PrivateRoute>
      } />

      <Route path="/notifications" element={
        <PrivateRoute requiredRole="manager">
          <Layout>
            <ManageNotifications />
          </Layout>
        </PrivateRoute>
      } />

      <Route path="/whatsapp-connection" element={
        <PrivateRoute requiredRole="manager">
          <Layout>
            <WhatsAppConnection />
          </Layout>
        </PrivateRoute>
      } />

      <Route path="/announcements" element={
        <PrivateRoute requiredRole="manager">
          <Layout>
            <SystemAnnouncements />
          </Layout>
        </PrivateRoute>
      } />

      <Route path="/special-days" element={
        <PrivateRoute requiredRole="manager">
          <Layout>
            <SpecialDaysAlerts />
          </Layout>
        </PrivateRoute>
      } />

      <Route path="/shift-notes" element={
        <PrivateRoute>
          <Layout>
            <ShiftNotes />
          </Layout>
        </PrivateRoute>
      } />

      <Route path="/advanced-dashboard" element={
        <PrivateRoute requiredRole="manager">
          <Layout>
            <AdvancedDashboard />
          </Layout>
        </PrivateRoute>
      } />

      <Route path="/attendance" element={
        <PrivateRoute>
          <Layout>
            <AttendanceTracking />
          </Layout>
        </PrivateRoute>
      } />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App

