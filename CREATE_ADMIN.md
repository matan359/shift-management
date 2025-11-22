# יצירת משתמש Admin

## שיטה 1: דרך קונסול הדפדפן (מומלץ)

1. פתח את האפליקציה בדפדפן
2. לחץ F12 כדי לפתוח את קונסול המפתחים
3. פתח את הקובץ `create-admin-script.js`
4. העתק את כל התוכן
5. הדבק בקונסול ולחץ Enter
6. המשתמש יווצר אוטומטית

## שיטה 2: דרך Firebase Console

1. היכנס ל-[Firebase Console](https://console.firebase.google.com/)
2. בחר את הפרויקט שלך
3. לך ל-Authentication > Users
4. לחץ על "Add user"
5. הזן:
   - Email: `admin@example.com` (או אימייל אחר)
   - Password: `admin123456` (או סיסמה חזקה)
6. שמור את ה-UID של המשתמש
7. לך ל-Firestore Database
8. צור מסמך חדש ב-`artifacts/shift-management-app/employees`
9. הזן את הנתונים:
   ```json
   {
     "fullName": "מנהל ראשי",
     "email": "admin@example.com",
     "phoneNumber": "",
     "role": "manager",
     "defaultShiftStart": "08:00",
     "minShiftsPerWeek": 6,
     "isActive": true,
     "firebaseUid": "UID_ששמרת_משלב_6",
     "createdAt": "2024-01-01T00:00:00.000Z"
   }
   ```

## פרטי כניסה ברירת מחדל (אחרי הרצת הסקריפט):

- **אימייל:** `admin@example.com`
- **סיסמה:** `admin123456`

**⚠️ חשוב:** שנה את האימייל והסיסמה בקובץ `create-admin-script.js` לפני הרצה!

## שינוי פרטי Admin בסקריפט:

פתח את `create-admin-script.js` ושנה את השורות:
```javascript
const adminEmail = 'admin@example.com' // שנה לכאן
const adminPassword = 'admin123456' // שנה לכאן
const adminName = 'מנהל ראשי' // שם מלא
```

