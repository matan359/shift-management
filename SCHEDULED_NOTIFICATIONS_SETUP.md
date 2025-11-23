# הגדרת שליחה אוטומטית יומית - הוראות

## איך זה עובד:

1. **בחר עובדים** - בדף "התראות WhatsApp", בחר את העובדים שאתה רוצה לשלוח להם הודעות
2. **הפעל שליחה אוטומטית** - סמן את התיבה "שליחה אוטומטית יומית"
3. **בחר שעה** - בחר באיזו שעה לשלוח (למשל 07:00 בבוקר)
4. **שמור הגדרות** - לחץ "שמור הגדרות"

## אפשרויות לשליחה אוטומטית:

### אפשרות 1: Netlify Scheduled Functions (מומלץ)

1. **התקן את הפלאגין:**
```bash
npm install @netlify/plugin-scheduled-functions
```

2. **הוסף ל-`netlify.toml`:**
```toml
[[plugins]]
  package = "@netlify/plugin-scheduled-functions"
```

3. **צור קובץ `netlify/functions/send-daily-notifications.js`** (כבר נוצר)

4. **הוסף ל-`package.json`:**
```json
{
  "netlify": {
    "scheduledFunctions": [
      {
        "path": "netlify/functions/send-daily-notifications",
        "schedule": "0 7 * * *"
      }
    ]
  }
}
```

**הערה:** Netlify Scheduled Functions דורש תוכנית בתשלום. יש אפשרויות חינמיות אחרות.

### אפשרות 2: Vercel Cron Jobs (חינמי)

אם אתה משתמש ב-Vercel, תוכל להשתמש ב-Cron Jobs:

1. **צור `vercel.json`:**
```json
{
  "crons": [{
    "path": "/api/send-daily-notifications",
    "schedule": "0 7 * * *"
  }]
}
```

2. **צור `api/send-daily-notifications.js`** (דומה לקובץ ב-Netlify)

### אפשרות 3: Firebase Cloud Functions (מומלץ אם אתה משתמש ב-Firebase)

1. **התקן Firebase Functions:**
```bash
npm install -g firebase-tools
firebase init functions
```

2. **צור `functions/index.js`:**
```javascript
const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()

exports.sendDailyNotifications = functions.pubsub
  .schedule('0 7 * * *') // כל יום ב-7:00
  .timeZone('Asia/Jerusalem')
  .onRun(async (context) => {
    // קוד שליחת הודעות
    // (דומה ל-netlify function)
  })
```

3. **Deploy:**
```bash
firebase deploy --only functions
```

### אפשרות 4: שרת חיצוני עם Cron Job

אם יש לך שרת (VPS, Railway, וכו'), תוכל להריץ cron job:

```bash
# הוסף ל-crontab
0 7 * * * curl https://your-server.com/api/send-daily-notifications
```

## הגדרת Environment Variables:

ב-Netlify/Vercel/Firebase, הוסף:
- `WHATSAPP_SERVER_URL` - כתובת השרת WhatsApp
- כל משתני Firebase (אם צריך)

## בדיקה:

1. שמור הגדרות בדף "התראות WhatsApp"
2. בדוק שההגדרות נשמרו ב-Firestore
3. בדוק שהפונקציה רצה (בלוגים)

## הערות:

- השליחה האוטומטית תרוץ רק אם WhatsApp מחובר
- רק עובדים שנבחרו יקבלו הודעות
- ההודעות יישלחו בשעה שנבחרה כל יום

