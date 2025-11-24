import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { MessageSquare, Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { getFirebaseDb, getAppId } from '../api/firebase'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore'
import { format, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'

export default function ShiftNotes() {
  const { user, db } = useAuth()
  const [shifts, setShifts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedShift, setSelectedShift] = useState(null)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!db || !user) return

    const dbInstance = db || getFirebaseDb()
    const appId = getAppId()
    const userId = user.uid

    // Get upcoming shifts
    const shiftsRef = collection(dbInstance, `artifacts/${appId}/users/${userId}/assignedShifts`)
    const today = format(new Date(), 'yyyy-MM-dd')
    const q = query(shiftsRef, where('date', '>=', today))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const shiftsData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => a.date.localeCompare(b.date))
      setShifts(shiftsData)
    })

    return () => unsubscribe()
  }, [db, user])

  function openNoteModal(shift) {
    setSelectedShift(shift)
    setNote(shift.note || '')
    setShowModal(true)
  }

  async function saveNote() {
    if (!db || !user || !selectedShift) return

    try {
      const dbInstance = db || getFirebaseDb()
      const appId = getAppId()
      const userId = user.uid

      const shiftRef = doc(dbInstance, `artifacts/${appId}/users/${userId}/assignedShifts/${selectedShift.id}`)
      await updateDoc(shiftRef, {
        note: note,
        noteUpdatedAt: new Date().toISOString()
      })

      setShowModal(false)
      setSelectedShift(null)
      setNote('')
    } catch (error) {
      console.error('Error saving note:', error)
      alert('שגיאה בשמירת ההערה')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">הערות למשמרות</h2>
        <p className="text-gray-600">הוסף הערות למשמרות ספציפיות</p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">תאריך</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">שעות</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">הערה</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {shifts.map((shift) => (
                <tr key={shift.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {format(parseISO(shift.date), 'dd/MM/yyyy', { locale: he })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {shift.startTime} - {shift.endTime}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {shift.note ? (
                      <span className="text-green-700">{shift.note}</span>
                    ) : (
                      <span className="text-gray-400">אין הערה</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => openNoteModal(shift)}
                      className="text-green-600 hover:text-green-900"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-800">הערה למשמרת</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">הערה</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="כתוב הערה למשמרת זו..."
              />
            </div>

            <div className="flex space-x-4 space-x-reverse">
              <button
                onClick={saveNote}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                <Save className="w-4 h-4 inline ml-2" />
                שמור
              </button>
              <button
                onClick={() => setShowModal(false)}
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

