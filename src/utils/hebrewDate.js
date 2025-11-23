// Hebrew Date Utilities
// Converts Gregorian dates to Hebrew dates and formats them

import { HDate } from '@hebcal/core'

// Hebrew month names
const HEBREW_MONTHS = [
  'ניסן', 'אייר', 'סיוון', 'תמוז', 'אב', 'אלול',
  'תשרי', 'חשוון', 'כסלו', 'טבת', 'שבט', 'אדר', 'אדר א', 'אדר ב'
]

// Format Hebrew date
export function formatHebrewDate(date) {
  try {
    const hDate = new HDate(date)
    const day = hDate.day
    const month = hDate.monthName('he')
    const year = hDate.year
    
    return `${day} ב${month} ${year}`
  } catch (error) {
    console.error('Error formatting Hebrew date:', error)
    return ''
  }
}

// Format Hebrew date short (day + month)
export function formatHebrewDateShort(date) {
  try {
    const hDate = new HDate(date)
    const day = hDate.day
    const month = hDate.monthName('he')
    
    return `${day} ${month}`
  } catch (error) {
    console.error('Error formatting Hebrew date short:', error)
    return ''
  }
}

// Get Hebrew date info
export function getHebrewDateInfo(date) {
  try {
    const hDate = new HDate(date)
    return {
      day: hDate.day,
      month: hDate.monthName('he'),
      monthNum: hDate.month,
      year: hDate.year,
      full: formatHebrewDate(date),
      short: formatHebrewDateShort(date)
    }
  } catch (error) {
    console.error('Error getting Hebrew date info:', error)
    return null
  }
}

// Check if date is ראש חודש (Hebrew Rosh Chodesh)
export function isHebrewRoshChodesh(date) {
  try {
    const hDate = new HDate(date)
    return hDate.day === 1
  } catch (error) {
    console.error('Error checking Hebrew Rosh Chodesh:', error)
    return false
  }
}

