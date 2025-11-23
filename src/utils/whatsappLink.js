/**
 * WhatsApp Link Utility
 * שולח הודעות דרך WhatsApp Web Link - פתרון פשוט ומהיר ללא צורך בשרת!
 */

/**
 * ממיר מספר טלפון לפורמט בינלאומי
 * @param {string} phoneNumber - מספר טלפון בפורמט ישראלי (05X-XXXXXXX) או בינלאומי
 * @returns {string} - מספר טלפון בפורמט בינלאומי (972XXXXXXXXX)
 */
export function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return ''
  
  // הסר כל תווים שאינם מספרים
  let cleaned = phoneNumber.replace(/[^0-9]/g, '')
  
  // אם מתחיל ב-0, החלף ב-972
  if (cleaned.startsWith('0')) {
    cleaned = '972' + cleaned.substring(1)
  }
  // אם לא מתחיל ב-972, הוסף
  else if (!cleaned.startsWith('972')) {
    cleaned = '972' + cleaned
  }
  
  return cleaned
}

/**
 * יוצר קישור WhatsApp Web לשליחת הודעה
 * @param {string} phoneNumber - מספר טלפון
 * @param {string} message - הודעה לשליחה
 * @returns {string} - קישור WhatsApp Web
 */
export function createWhatsAppLink(phoneNumber, message = '') {
  const formattedPhone = formatPhoneNumber(phoneNumber)
  const encodedMessage = encodeURIComponent(message)
  
  if (encodedMessage) {
    return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`
  } else {
    return `https://api.whatsapp.com/send?phone=${formattedPhone}`
  }
}

/**
 * פותח חלון WhatsApp Web חדש לשליחת הודעה
 * @param {string} phoneNumber - מספר טלפון
 * @param {string} message - הודעה לשליחה
 */
export function openWhatsAppChat(phoneNumber, message = '') {
  const link = createWhatsAppLink(phoneNumber, message)
  window.open(link, '_blank', 'noopener,noreferrer')
}

/**
 * שולח הודעה לרשימת נמענים (פותח חלונות חדשים)
 * @param {Array<{phoneNumber: string, message: string}>} recipients - רשימת נמענים
 * @param {number} delay - השהיה בין הודעות (במילישניות)
 */
export async function sendBulkWhatsAppMessages(recipients, delay = 1000) {
  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i]
    if (recipient.phoneNumber && recipient.message) {
      openWhatsAppChat(recipient.phoneNumber, recipient.message)
      
      // השהיה בין הודעות כדי לא לפתוח יותר מדי חלונות בבת אחת
      if (i < recipients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
}



