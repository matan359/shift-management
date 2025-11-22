// Auto Scheduler - AI-based shift assignment
// This implements the scheduling logic based on availability, preferences, and constraints

import { getSpecialDayInfo, getSpecialDaysInRange } from './holidayDetector'

export async function autoScheduleShifts(db, appId, userId, weekStart, weekEnd) {
  try {
    // Load all required data
    const [employees, shiftRequests, events, existingShifts] = await Promise.all([
      loadEmployees(db, appId, userId),
      loadShiftRequests(db, appId, userId, weekStart, weekEnd),
      loadEvents(db, appId, userId, weekStart, weekEnd),
      loadExistingShifts(db, appId, userId, weekStart, weekEnd)
    ])

    // Generate all dates in the week
    const dates = generateWeekDates(weekStart, weekEnd)
    
    // Calculate required shifts for each day (including special days)
    const requiredShifts = await calculateRequiredShifts(dates, events, weekStart, weekEnd)

    // Create shift assignments
    const assignments = []

    for (const date of dates) {
      const dateStr = formatDate(date)
      const required = requiredShifts[dateStr] || getDefaultRequiredStaff()
      
      // Get available employees for this date
      const availableEmployees = getAvailableEmployees(
        employees,
        shiftRequests,
        dateStr,
        existingShifts
      )

      // Sort by priority and preferences
      const sortedEmployees = sortEmployeesByPriority(
        availableEmployees,
        date,
        existingShifts
      )

      // Assign shifts
      const assigned = assignShiftsForDay(
        sortedEmployees,
        required,
        dateStr,
        existingShifts
      )

      assignments.push(...assigned)
    }

    // Ensure minimum shifts per week
    ensureMinimumShifts(assignments, employees, dates, existingShifts)

    return assignments
  } catch (error) {
    console.error('Error in auto scheduling:', error)
    throw error
  }
}

import { collection, query, where, getDocs } from 'firebase/firestore'

async function loadEmployees(db, appId, userId) {
  const employeesRef = collection(db, `artifacts/${appId}/users/${userId}/employees`)
  const snapshot = await getDocs(employeesRef)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(emp => emp.isActive !== false)
}

async function loadShiftRequests(db, appId, userId, weekStart, weekEnd) {
  const requestsRef = collection(db, `artifacts/${appId}/users/${userId}/shiftRequests`)
  const q = query(
    requestsRef,
    where('date', '>=', formatDate(weekStart)),
    where('date', '<=', formatDate(weekEnd))
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

async function loadEvents(db, appId, userId, weekStart, weekEnd) {
  const eventsRef = collection(db, `artifacts/${appId}/users/${userId}/events`)
  const q = query(
    eventsRef,
    where('date', '>=', formatDate(weekStart)),
    where('date', '<=', formatDate(weekEnd))
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

async function loadExistingShifts(db, appId, userId, weekStart, weekEnd) {
  const shiftsRef = collection(db, `artifacts/${appId}/users/${userId}/assignedShifts`)
  const q = query(
    shiftsRef,
    where('date', '>=', formatDate(weekStart)),
    where('date', '<=', formatDate(weekEnd))
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

function generateWeekDates(start, end) {
  const dates = []
  const current = new Date(start)
  while (current <= end) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

function formatDate(date) {
  if (typeof date === 'string') return date
  return date.toISOString().split('T')[0]
}

async function calculateRequiredShifts(dates, events, weekStart, weekEnd) {
  const required = {}
  const defaultStaff = getDefaultRequiredStaff()

  // Import holiday detector dynamically
  const { getSpecialDayInfo } = await import('./holidayDetector')

  dates.forEach(date => {
    const dateStr = formatDate(date)
    const event = events.find(e => e.date === dateStr)
    
    // Check for special days (holidays, ראש חודש)
    const specialDayInfo = getSpecialDayInfo(date)
    
    let extraStaff = 0
    
    if (event) {
      extraStaff += (event.extraEmployeesNeeded || 0)
    }
    
    if (specialDayInfo.isSpecial) {
      extraStaff += specialDayInfo.extraStaffNeeded
    } else if (isFirstOfMonth(date)) {
      extraStaff += 1 // ראש חודש
    } else if (isWeekend(date)) {
      extraStaff += 1 // Weekend
    }
    
    required[dateStr] = defaultStaff + extraStaff
  })

  return required
}

function isFirstOfMonth(date) {
  return date.getDate() === 1
}

function isWeekend(date) {
  const day = date.getDay()
  return day === 5 || day === 6 // Friday or Saturday
}

function getDefaultRequiredStaff() {
  return 3 // Default number of staff needed
}

function getAvailableEmployees(employees, shiftRequests, date, existingShifts) {
  return employees.filter(emp => {
    // Check if employee has availability request for this date
    const request = shiftRequests.find(
      r => r.employeeId === emp.id && r.date === date && r.availability === 'yes'
    )

    // Check if employee already has a shift on this date
    const hasShift = existingShifts.some(
      s => s.employeeId === emp.id && s.date === date
    )

    return request && !hasShift
  })
}

function sortEmployeesByPriority(employees, date, existingShifts) {
  return [...employees].sort((a, b) => {
    // Priority 1: Employees with default shift start matching the day
    const aHasDefault = hasDefaultShiftTime(a, date)
    const bHasDefault = hasDefaultShiftTime(b, date)
    if (aHasDefault && !bHasDefault) return -1
    if (!aHasDefault && bHasDefault) return 1

    // Priority 2: Employees with fewer shifts this week
    const aShiftCount = countShiftsThisWeek(a.id, existingShifts)
    const bShiftCount = countShiftsThisWeek(b.id, existingShifts)
    if (aShiftCount !== bShiftCount) {
      return aShiftCount - bShiftCount
    }

    // Priority 3: Random (for fairness)
    return Math.random() - 0.5
  })
}

function hasDefaultShiftTime(employee, date) {
  // Check if employee has a preferred shift start time
  // This would match against the shift time for the day
  return !!employee.defaultShiftStart
}

function countShiftsThisWeek(employeeId, existingShifts) {
  return existingShifts.filter(s => s.employeeId === employeeId).length
}

function assignShiftsForDay(availableEmployees, required, date, existingShifts) {
  const assignments = []
  const assigned = new Set()

  // Assign based on employee preferences
  const preferredEmployees = availableEmployees.filter(emp => 
    hasDefaultShiftTime(emp, date)
  )

  // Assign preferred employees first
  for (const emp of preferredEmployees) {
    if (assignments.length >= required) break
    if (assigned.has(emp.id)) continue

    assignments.push(createShiftAssignment(emp, date))
    assigned.add(emp.id)
  }

  // Fill remaining slots
  for (const emp of availableEmployees) {
    if (assignments.length >= required) break
    if (assigned.has(emp.id)) continue

    assignments.push(createShiftAssignment(emp, date))
    assigned.add(emp.id)
  }

  return assignments
}

function createShiftAssignment(employee, date) {
  const dateStr = formatDate(date)
  
  // Determine shift times based on employee preferences
  let startTime = '08:00'
  let endTime = '16:00'
  let shiftType = 'בוקר'
  let category = employee.category || 'פס'

  if (employee.defaultShiftStart) {
    startTime = employee.defaultShiftStart
    // Calculate end time (assuming 8-hour shift)
    const [hours, minutes] = startTime.split(':').map(Number)
    const endHours = (hours + 8) % 24
    endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

  // Special cases for specific employees (from requirements)
  if (employee.fullName === 'מתן') {
    startTime = '05:30'
    endTime = '13:30'
    shiftType = 'בוקר'
    category = 'אחראי'
  } else if (employee.fullName === 'אחמד') {
    startTime = '06:00'
    endTime = '14:00'
    shiftType = 'בוקר'
    category = 'מטבח'
  } else if (employee.fullName === 'שירה') {
    startTime = '07:00'
    endTime = '15:00'
    shiftType = 'בוקר'
    category = 'פס'
  } else if (employee.fullName === 'עודי') {
    startTime = '14:00'
    endTime = '21:00'
    shiftType = 'ערב'
    category = 'פס'
  } else if (employee.fullName === 'נפתלי') {
    startTime = '14:00'
    endTime = '22:00'
    shiftType = 'ערב'
    category = 'אחראי'
  }

  // Determine shift type based on start time
  if (!shiftType) {
    const hour = parseInt(startTime.split(':')[0])
    shiftType = hour < 14 ? 'בוקר' : 'ערב'
  }

  return {
    employeeId: employee.id,
    date: dateStr,
    startTime,
    endTime,
    shiftType,
    category,
    status: 'pending',
    source: 'AUTO'
  }
}

function ensureMinimumShifts(assignments, employees, dates, existingShifts) {
  employees.forEach(employee => {
    const minShifts = employee.minShiftsPerWeek || 6
    const assignedCount = assignments.filter(a => a.employeeId === employee.id).length
    const existingCount = existingShifts.filter(s => s.employeeId === employee.id).length
    const totalCount = assignedCount + existingCount

    if (totalCount < minShifts) {
      // Try to assign more shifts
      const needed = minShifts - totalCount
      const availableDates = dates.filter(date => {
        const dateStr = formatDate(date)
        return !assignments.some(a => a.employeeId === employee.id && a.date === dateStr) &&
               !existingShifts.some(s => s.employeeId === employee.id && s.date === dateStr)
      })

      for (let i = 0; i < Math.min(needed, availableDates.length); i++) {
        assignments.push(createShiftAssignment(employee, availableDates[i]))
      }
    }
  })
}

