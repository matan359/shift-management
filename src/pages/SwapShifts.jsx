import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { RefreshCw, Clock, User, MessageSquare, CheckCircle, XCircle, X } from 'lucide-react'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, addDoc, query, where, getDocs, updateDoc, doc, onSnapshot } from 'firebase/firestore'
import { format, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'

export default function SwapShifts() {
  const { user, db } = useAuth()
  const [myShifts, setMyShifts] = useState([])
  const [swapRequests, setSwapRequests] = useState([])
  const [employees, setEmployees] = useState([])
  const [showSwapModal, setShowSwapModal] = useState(false)
  const [selectedShift, setSelectedShift] = useState(null)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!db || !user) return

    loadMyShifts()
    loadSwapRequests()
    loadEmployees()
  }, [db, user])

  async function loadEmployees() {
    if (!db || !user) return

    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid

      const employeesRef = collection(dbInstance, `artifacts/${appId}/employees`)
      const snapshot = await getDocs(employeesRef)
      const employeesData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(emp => emp.id !== user.id && emp.isActive !== false) // Exclude current user
      setEmployees(employeesData)
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  async function loadMyShifts() {
    if (!db || !user) return

    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid

      const shiftsRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/assignedShifts`)
      const q = query(shiftsRef, where('employeeId', '==', user.id))

      const snapshot = await getDocs(q)
      const shifts = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(shift => {
          const shiftDate = parseISO(shift.date)
          return shiftDate >= new Date()
        })
        .sort((a, b) => a.date.localeCompare(b.date))

      setMyShifts(shifts)
    } catch (error) {
      console.error('Error loading shifts:', error)
    }
  }

  function loadSwapRequests() {
    if (!db || !user) return

    const dbInstance = db || getFirebaseDb()
    const appId = getAppId()
    const userId = user.uid

    const swapsRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/swapRequests`)
    
    // Listen to requests where current user is involved
    const unsubscribe = onSnapshot(swapsRef, (snapshot) => {
      const requests = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(req => 
          req.fromEmployee === user.id || req.toEmployee === user.id
        )
        .sort((a, b) => a.date?.localeCompare(b.date) || 0)

      setSwapRequests(requests)
    })

    return () => unsubscribe()
  }

  function openSwapModal(shift) {
    setSelectedShift(shift)
    setSelectedEmployee('')
    setShowSwapModal(true)
  }

  async function requestSwap() {
    if (!db || !user || !selectedShift || !selectedEmployee) {
      alert('אנא בחר עובד להחלפה')
      return
    }

    setLoading(true)
    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid

      const swapsRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/swapRequests`)
      await addDoc(swapsRef, {
        fromEmployee: user.id,
        fromEmployeeName: user.fullName,
        toEmployee: selectedEmployee,
        toEmployeeName: employees.find(e => e.id === selectedEmployee)?.fullName || '',
        shiftId: selectedShift.id,
        date: selectedShift.date,
        startTime: selectedShift.startTime,
        endTime: selectedShift.endTime,
        shiftType: selectedShift.shiftType,
        status: 'pending',
        message: '',
        createdAt: new Date().toISOString()
      })

      setShowSwapModal(false)
      setSelectedShift(null)
      setSelectedEmployee('')
      alert('בקשת החלפה נשלחה')
    } catch (error) {
      console.error('Error requesting swap:', error)
      alert('שגיאה בשליחת הבקשה')
    } finally {
      setLoading(false)
    }
  }

  async function approveSwap(requestId) {
    if (!db || !user) return

    setLoading(true)
    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid

      const swapRequest = swapRequests.find(r => r.id === requestId)
      if (!swapRequest) return

      // Update swap request status
      const swapRef = doc(dbInstance, `artifacts/${appId}/users/${userId}/swapRequests/${requestId}`)
      await updateDoc(swapRef, {
        status: 'approved',
        approvedAt: new Date().toISOString()
      })

      // Update the shift assignment - transfer to new employee
      const shiftRef = doc(dbInstance, `artifacts/${appId}/users/${userId}/assignedShifts/${swapRequest.shiftId}`)
      await updateDoc(shiftRef, {
        employeeId: swapRequest.toEmployee,
        swapNote: `הוחלף מ-${swapRequest.fromEmployeeName}`
      })

      alert('החלפת המשמרת אושרה')
    } catch (error) {
      console.error('Error approving swap:', error)
      alert('שגיאה באישור הבקשה')
    } finally {
      setLoading(false)
    }
  }

  async function rejectSwap(requestId) {
    if (!db || !user) return

    setLoading(true)
    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid

      const swapRef = doc(dbInstance, `artifacts/${appId}/users/${userId}/swapRequests/${requestId}`)
      await updateDoc(swapRef, {
        status: 'rejected',
        rejectedAt: new Date().toISOString()
      })

      alert('בקשת ההחלפה נדחתה')
    } catch (error) {
      console.error('Error rejecting swap:', error)
      alert('שגיאה בדחיית הבקשה')
    } finally {
      setLoading(false)
    }
  }

  function getEmployeeName(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee?.fullName || 'לא ידוע'
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">החלפת משמרות</h2>
        <p className="text-gray-600">בקש להחליף משמרת או אישר בקשות החלפה</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Shifts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">המשמרות שלי</h3>
          {myShifts.length === 0 ? (
            <p className="text-gray-500">אין משמרות קרובות</p>
          ) : (
            <div className="space-y-3">
              {myShifts.map((shift) => (
                <div key={shift.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {format(parseISO(shift.date), 'dd/MM/yyyy', { locale: he })}
                      </p>
                      <p className="text-sm text-gray-600">
                        <Clock className="w-4 h-4 inline ml-1" />
                        {shift.startTime} - {shift.endTime}
                      </p>
                    </div>
                    <button
                      onClick={() => openSwapModal(shift)}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-lg transition disabled:opacity-50"
                    >
                      <RefreshCw className="w-4 h-4 inline ml-1" />
                      בקש החלפה
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Swap Requests */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">בקשות החלפה</h3>
          {swapRequests.length === 0 ? (
            <p className="text-gray-500">אין בקשות החלפה</p>
          ) : (
            <div className="space-y-3">
              {swapRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {request.date && format(parseISO(request.date), 'dd/MM/yyyy', { locale: he })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {request.fromEmployee === user.id 
                          ? `בקשתך → ${getEmployeeName(request.toEmployee)}` 
                          : `בקשה מ-${request.fromEmployeeName || getEmployeeName(request.fromEmployee)}`}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      request.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : request.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {request.status === 'approved' ? 'אושר' : request.status === 'pending' ? 'ממתין' : 'נדחה'}
                    </span>
                  </div>
                  {request.fromEmployeeName && (
                    <p className="text-xs text-gray-500 mt-1">
                      מ: {request.fromEmployeeName}
                      {request.toEmployeeName && ` → ל: ${request.toEmployeeName}`}
                    </p>
                  )}
                  {request.status === 'pending' && request.toEmployee === user.id && (
                    <div className="mt-2 space-y-2">
                      <button
                        onClick={() => approveSwap(request.id)}
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-4 rounded-lg transition disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4 inline ml-1" />
                        אישר החלפה
                      </button>
                      <button
                        onClick={() => rejectSwap(request.id)}
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded-lg transition disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4 inline ml-1" />
                        דחה
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Swap Modal */}
      {showSwapModal && selectedShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-800">בקש החלפת משמרת</h3>
              <button onClick={() => setShowSwapModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                תאריך: {format(parseISO(selectedShift.date), 'dd/MM/yyyy', { locale: he })}
              </p>
              <p className="text-sm text-gray-600">
                שעות: {selectedShift.startTime} - {selectedShift.endTime}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">בחר עובד להחלפה</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">בחר עובד...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} - {emp.role === 'manager' ? 'מנהל' : 'עובד'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-4 space-x-reverse">
              <button
                onClick={requestSwap}
                disabled={loading || !selectedEmployee}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
              >
                שלח בקשה
              </button>
              <button
                onClick={() => setShowSwapModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

