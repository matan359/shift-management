# מערכת ניהול משמרות - בייגל קפה רמת אשכול ☕

מערכת ניהול משמרות מתקדמת בנויה ב-React עם Firebase, המאפשרת ניהול מלא של משמרות, עובדים, אירועים ומשימות.

🌐 **Live Demo:** [האפליקציה זמינה ב-Netlify](https://your-app.netlify.app)

## תכונות עיקריות

- ✅ מערכת כניסה לעובדים ולמנהל (שם משתמש + סיסמה)
- ✅ הגשת זמינות שבועית (מינימום 6 משמרות)
- ✅ שיבוץ אוטומטי מבוסס AI
- ✅ לוח משמרות שבועי מלא
- ✅ ממשק מנהל לשליטה מלאה
- ✅ ניהול אירועים מיוחדים
- ✅ משימות שבועיות
- ✅ החלפת משמרות בין עובדים
- ✅ עיצוב רספונסיבי עם Tailwind CSS

## טכנולוגיות

- **React 18** - ספריית UI
- **Vite** - Build tool מהיר
- **Firebase Firestore** - מסד נתונים
- **Firebase Auth** - אימות משתמשים
- **Tailwind CSS** - עיצוב
- **React Router** - ניתוב
- **Lucide React** - אייקונים
- **date-fns** - ניהול תאריכים

## התקנה

1. **התקן את התלויות:**
```bash
npm install
```

2. **הגדר Firebase:**
   - פתח את `src/api/firebase.js`
   - החלף את הערכים ב-`__firebase_config` עם פרטי הפרויקט שלך:
   ```javascript
   const __firebase_config = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

3. **הגדר Firebase Console:**
   - הפעל Authentication עם Anonymous sign-in
   - צור Firestore Database
   - הגדר כללי אבטחה (rules):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /artifacts/{appId}/users/{userId}/{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

## הרצה

```bash
npm run dev
```

האפליקציה תרוץ על `http://localhost:3000`

## בנייה לפרודקשן

```bash
npm run build
```

הקבצים ייבנו לתיקייה `dist`

## מבנה הפרויקט

```
src/
  ├── api/              # Firebase configuration
  ├── components/       # קומפוננטות משותפות
  ├── contexts/         # React Contexts (Auth)
  ├── pages/            # דפי האפליקציה
  │   ├── Login.jsx
  │   ├── WorkerDashboard.jsx
  │   ├── ManagerDashboard.jsx
  │   ├── SubmitAvailability.jsx
  │   ├── SwapShifts.jsx
  │   ├── ScheduleView.jsx
  │   ├── ManageEmployees.jsx
  │   ├── ManageEvents.jsx
  │   └── ManageTasks.jsx
  └── utils/            # פונקציות עזר (שיבוץ אוטומטי)
```

## מבנה נתונים (Firestore)

כל הנתונים נשמרים תחת:
```
/artifacts/{appId}/users/{userId}/
  ├── employees/          # רשימת עובדים
  ├── shiftRequests/     # בקשות זמינות
  ├── assignedShifts/   # משמרות משובצות
  ├── swapRequests/      # בקשות החלפה
  ├── events/            # אירועים מיוחדים
  └── tasks/             # משימות שבועיות
```

## שימוש ראשוני

1. **יצירת מנהל:**
   - היכנס ל-Firebase Console
   - הוסף מסמך ב-`employees` עם:
     - `username`: שם משתמש
     - `passwordHash`: סיסמה (לעת עתה - טקסט רגיל)
     - `role`: "manager"
     - `fullName`: שם מלא
     - `isActive`: true

2. **יצירת עובדים:**
   - התחבר כמנהל
   - עבור ל"ניהול עובדים"
   - הוסף עובדים חדשים

3. **הגשת זמינות:**
   - התחבר כעובד
   - עבור ל"הגשת זמינות"
   - בחר ימים זמינים (מינימום 6)

4. **שיבוץ אוטומטי:**
   - התחבר כמנהל
   - עבור ל"לוח בקרה"
   - לחץ על "הפעל שיבוץ אוטומטי"

## הערות חשובות

- **אבטחה:** בקוד הנוכחי הסיסמאות נשמרות כטקסט רגיל. בפרודקשן יש להשתמש ב-hashing (bcrypt, etc.)
- **Firebase Rules:** ודא שהכללים מוגדרים נכון לאבטחת הנתונים
- **שיבוץ אוטומטי:** האלגוריתם מתחשב בהעדפות עובדים, זמינות, ואירועים מיוחדים

## תמיכה

לשאלות או בעיות, אנא צור issue בפרויקט.

## רישיון

MIT

