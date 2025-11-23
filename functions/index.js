/**
 * Firebase Cloud Functions - שליחה אוטומטית יומית של הודעות WhatsApp
 * 
 * הפונקציה רצה כל יום בשעה שנבחרה (ברירת מחדל: 07:00)
 * בודקת את ההגדרות של כל מנהל ויוצרת קישורי WhatsApp לעובדים שנבחרו
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const appId = 'shift-management-app';

/**
 * פונקציה מתוזמנת - רצה כל יום ב-07:00 (אפשר לשנות)
 * Timezone: Asia/Jerusalem
 */
exports.sendDailyWhatsAppNotifications = functions.pubsub
  .schedule('0 7 * * *') // כל יום ב-07:00 (פורמט: minute hour day month dayOfWeek)
  .timeZone('Asia/Jerusalem')
  .onRun(async (context) => {
    console.log('Starting daily WhatsApp notifications...');
    
    try {
      const db = admin.firestore();
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const dayOfWeek = new Date().getDay(); // 0 = Sunday, 6 = Saturday
      
      // קבל את כל המנהלים (users עם role = 'manager')
      const usersRef = db.collection('users');
      const usersSnapshot = await usersRef.where('role', '==', 'manager').get();
      
      if (usersSnapshot.empty) {
        console.log('No managers found');
        return null;
      }
      
      const results = [];
      
      // עבור כל מנהל
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        
        try {
          // בדוק אם יש הגדרות שליחה אוטומטית
          const settingsRef = db.doc(`artifacts/${appId}/users/${userId}/settings/notifications`);
          const settingsDoc = await settingsRef.get();
          
          if (!settingsDoc.exists) {
            console.log(`No settings found for user ${userId}`);
            continue;
          }
          
          const settings = settingsDoc.data();
          
          // בדוק אם שליחה אוטומטית מופעלת
          if (!settings.autoSendEnabled) {
            console.log(`Auto-send disabled for user ${userId}`);
            continue;
          }
          
          // בדוק אם זה הזמן הנכון לשליחה
          const autoSendTime = settings.autoSendTime || '07:00';
          const [hours, minutes] = autoSendTime.split(':').map(Number);
          const now = new Date();
          const sendTime = new Date();
          sendTime.setHours(hours, minutes, 0, 0);
          
          // אפשר חלון של 5 דקות
          const timeDiff = Math.abs(now - sendTime);
          if (timeDiff > 5 * 60 * 1000) {
            console.log(`Not time to send for user ${userId}. Scheduled: ${autoSendTime}, Current: ${now.toTimeString()}`);
            continue;
          }
          
          // קבל משמרות היום
          const shiftsRef = db.collection(`artifacts/${appId}/users/${userId}/assignedShifts`);
          const shiftsQuery = shiftsRef.where('date', '==', today);
          const shiftsSnapshot = await shiftsQuery.get();
          
          if (shiftsSnapshot.empty) {
            console.log(`No shifts today for user ${userId}`);
            continue;
          }
          
          // קבל עובדים
          const employeesRef = db.collection(`artifacts/${appId}/employees`);
          const employeesSnapshot = await employeesRef.get();
          const employees = {};
          employeesSnapshot.docs.forEach(doc => {
            employees[doc.id] = { id: doc.id, ...doc.data() };
          });
          
          // קבל משימות היום
          const tasksRef = db.collection(`artifacts/${appId}/users/${userId}/tasks`);
          const tasksQuery = tasksRef.where('dayOfWeek', '==', dayOfWeek);
          const tasksSnapshot = await tasksQuery.get();
          const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // קבל עובדים שנבחרו
          const selectedEmployeeIds = settings.selectedEmployeeIds || [];
          
          // צור קישורי WhatsApp
          const whatsappLinks = [];
          
          for (const shiftDoc of shiftsSnapshot.docs) {
            const shift = { id: shiftDoc.id, ...shiftDoc.data() };
            
            // רק לעובדים שנבחרו
            if (!selectedEmployeeIds.includes(shift.employeeId)) {
              continue;
            }
            
            const employee = employees[shift.employeeId];
            if (!employee || !employee.phoneNumber) {
              continue;
            }
            
            // צור הודעה
            const shiftDate = new Date(shift.date).toLocaleDateString('he-IL', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            
            let message = `שלום ${employee.fullName},\n\n`;
            message += `היום (${shiftDate}) את/ה במשמרת ${shift.shiftType}.\n`;
            message += `שעות: ${shift.startTime} - ${shift.endTime}\n\n`;
            
            if (tasks.length > 0) {
              message += `משימות היום:\n`;
              tasks.forEach((task, index) => {
                message += `${index + 1}. ${task.title}\n`;
                if (task.description) {
                  message += `   ${task.description}\n`;
                }
              });
            } else {
              message += `אין משימות מיוחדות היום.\n`;
            }
            
            message += `\nיום נעים!`;
            
            // צור קישור WhatsApp
            let formattedNumber = employee.phoneNumber.replace(/[^0-9]/g, '');
            if (formattedNumber.startsWith('0')) {
              formattedNumber = '972' + formattedNumber.substring(1);
            } else if (!formattedNumber.startsWith('972')) {
              formattedNumber = '972' + formattedNumber;
            }
            
            const encodedMessage = encodeURIComponent(message);
            const whatsappLink = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
            
            whatsappLinks.push({
              employeeName: employee.fullName,
              phoneNumber: formattedNumber,
              link: whatsappLink,
              shiftId: shift.id
            });
          }
          
          if (whatsappLinks.length > 0) {
            // שמור קישורים ב-Firestore
            const linksRef = db.collection(`artifacts/${appId}/users/${userId}/whatsappLinks`);
            const linkDoc = linksRef.doc(today);
            await linkDoc.set({
              date: today,
              links: whatsappLinks,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              opened: false,
              autoGenerated: true
            });
            
            console.log(`Created ${whatsappLinks.length} WhatsApp links for user ${userId}`);
            results.push({
              userId,
              linksCreated: whatsappLinks.length,
              success: true
            });
          }
        } catch (error) {
          console.error(`Error processing user ${userId}:`, error);
          results.push({
            userId,
            success: false,
            error: error.message
          });
        }
      }
      
      console.log('Daily notifications completed:', results);
      return { success: true, results };
    } catch (error) {
      console.error('Error in sendDailyWhatsAppNotifications:', error);
      throw error;
    }
  });

/**
 * פונקציה לפתיחת קישורים שנשמרו (קריאה ידנית)
 */
exports.openSavedWhatsAppLinks = functions.https.onCall(async (data, context) => {
  // דורש authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const userId = context.auth.uid;
  const { date } = data;
  
  if (!date) {
    throw new functions.https.HttpsError('invalid-argument', 'Date is required');
  }
  
  try {
    const db = admin.firestore();
    const linksRef = db.doc(`artifacts/${appId}/users/${userId}/whatsappLinks/${date}`);
    const linksDoc = await linksRef.get();
    
    if (!linksDoc.exists) {
      return { success: false, message: 'No links found for this date' };
    }
    
    const linksData = linksDoc.data();
    
    // סמן כנפתח
    await linksRef.update({
      opened: true,
      openedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      links: linksData.links || []
    };
  } catch (error) {
    console.error('Error opening saved links:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

