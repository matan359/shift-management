// Holiday and Special Day Detector
// Detects ראש חודש (Rosh Chodesh), holidays, and special days using Hebrew calendar

import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { HDate } from '@hebcal/core'
import { isHebrewRoshChodesh } from './hebrewDate'

// Jewish holidays (simplified - you can expand this)
const JEWISH_HOLIDAYS = {
  // Format: 'MM-DD': { name: 'Holiday Name', extraStaff: 2 }
  '09-06': { name: 'ראש השנה', extraStaff: 3 },
  '09-15': { name: 'יום כיפור', extraStaff: 2 },
  '09-20': { name: 'סוכות', extraStaff: 2 },
  '10-15': { name: 'חנוכה', extraStaff: 1 },
  '02-14': { name: 'פורים', extraStaff: 2 },
  '03-27': { name: 'פסח', extraStaff: 3 },
  '05-14': { name: 'שבועות', extraStaff: 2 },
}

// Check if date is ראש חודש (first day of Hebrew month)
export function isRoshChodesh(date) {
  return isHebrewRoshChodesh(date)
}

// Check if date is a holiday
export function isHoliday(date) {
  const dateStr = format(date, 'MM-dd')
  return JEWISH_HOLIDAYS[dateStr] || null
}

// Get special day info
export function getSpecialDayInfo(date) {
  const holiday = isHoliday(date)
  const roshChodesh = isRoshChodesh(date)
  
  let info = {
    isSpecial: false,
    name: null,
    extraStaffNeeded: 0,
    message: null
  }

  if (holiday) {
    info.isSpecial = true
    info.name = holiday.name
    info.extraStaffNeeded = holiday.extraStaff || 2
    info.message = `חג ${holiday.name} - נדרש כוח אדם נוסף: ${info.extraStaffNeeded} עובדים`
  } else if (roshChodesh) {
    info.isSpecial = true
    info.name = 'ראש חודש'
    info.extraStaffNeeded = 1
    info.message = 'ראש חודש - נדרש כוח אדם נוסף: 1 עובד'
  }

  return info
}

// Get all special days in a date range
export function getSpecialDaysInRange(startDate, endDate) {
  const specialDays = []
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    const info = getSpecialDayInfo(currentDate)
    if (info.isSpecial) {
      specialDays.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        ...info
      })
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return specialDays
}

// Check if date is weekend (Friday/Saturday in Israel)
export function isWeekend(date) {
  const day = date.getDay()
  return day === 5 || day === 6 // Friday or Saturday
}

