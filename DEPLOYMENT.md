# מדריך העלאה לאתר (Deployment)

## אפשרויות העלאה:

### 1. Vercel (מומלץ - הכי קל) ⭐

**שלבים:**

1. **התקן Vercel CLI:**
```bash
npm install -g vercel
```

2. **בנה את הפרויקט:**
```bash
npm run build
```

3. **העלה ל-Vercel:**
```bash
vercel
```

4. **או דרך GitHub:**
   - דחוף את הקוד ל-GitHub
   - לך ל-[vercel.com](https://vercel.com)
   - התחבר עם GitHub
   - לחץ "New Project"
   - בחר את הפרויקט
   - Vercel יזהה אוטומטית את Vite ויעלה את האפליקציה

**הגדרת משתני סביבה ב-Vercel:**
- לך ל-Project Settings → Environment Variables
- הוסף את משתני Firebase (אם צריך)
- הוסף משתני Twilio/WhatsApp (אם משתמש)

**יתרונות:**
- חינמי ל-projects אישיים
- HTTPS אוטומטי
- CDN גלובלי
- עדכונים אוטומטיים מ-GitHub

---

### 2. Netlify

**שלבים:**

1. **התקן Netlify CLI:**
```bash
npm install -g netlify-cli
```

2. **בנה את הפרויקט:**
```bash
npm run build
```

3. **העלה ל-Netlify:**
```bash
netlify deploy --prod
```

**או דרך GitHub:**
- דחוף ל-GitHub
- לך ל-[netlify.com](https://netlify.com)
- לחץ "New site from Git"
- בחר את הפרויקט
- הגדר:
  - Build command: `npm run build`
  - Publish directory: `dist`

---

### 3. Firebase Hosting

**שלבים:**

1. **התקן Firebase Tools (אם עוד לא):**
```bash
npm install -g firebase-tools
```

2. **התחבר ל-Firebase:**
```bash
firebase login
```

3. **אתחל Firebase בפרויקט:**
```bash
firebase init hosting
```

בחר:
- Use an existing project → בחר את `shif-2430b`
- What do you want to use as your public directory? → `dist`
- Configure as a single-page app? → `Yes`
- Set up automatic builds and deploys with GitHub? → `No` (או Yes אם תרצה)

4. **בנה את הפרויקט:**
```bash
npm run build
```

5. **העלה ל-Firebase:**
```bash
firebase deploy --only hosting
```

**האפליקציה תהיה זמינה ב:**
`https://shif-2430b.web.app` או `https://shif-2430b.firebaseapp.com`

---

### 4. GitHub Pages

**שלבים:**

1. **התקן gh-pages:**
```bash
npm install --save-dev gh-pages
```

2. **עדכן package.json:**
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  },
  "homepage": "https://YOUR_USERNAME.github.io/shift-management"
}
```

3. **העלה:**
```bash
npm run deploy
```

**הערה:** צריך להגדיר base path ב-vite.config.js:
```js
export default defineConfig({
  base: '/shift-management/',
  // ...
})
```

---

## הגדרת משתני סביבה ב-Production

### Vercel/Netlify:
1. לך ל-Project Settings → Environment Variables
2. הוסף:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - וכו'...

### Firebase Hosting:
צריך להגדיר ב-`firebase.json` או להשתמש ב-Firebase Functions

---

## הגדרת Cron Job לשליחת הודעות יומיות

### אפשרות 1: Vercel Cron Jobs

1. צור קובץ `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/send-daily-messages",
    "schedule": "0 4 * * *"
  }]
}
```

2. צור API route ב-`api/send-daily-messages.js`:
```js
export default async function handler(req, res) {
  // קוד שליחת הודעות
  // ...
  res.status(200).json({ success: true })
}
```

### אפשרות 2: Firebase Cloud Functions

1. התקן Firebase Functions:
```bash
firebase init functions
```

2. צור function:
```js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.sendDailyMessages = functions.pubsub
  .schedule('0 4 * * *')
  .timeZone('Asia/Jerusalem')
  .onRun(async (context) => {
    // קוד שליחת הודעות
  });
```

3. Deploy:
```bash
firebase deploy --only functions
```

---

## המלצות:

1. **לפיתוח מהיר:** Vercel - הכי קל ומהיר
2. **אם כבר משתמש ב-Firebase:** Firebase Hosting - הכל במקום אחד
3. **לחינמי מלא:** GitHub Pages (אבל פחות נוח)

---

## בדיקות אחרי העלאה:

1. ✅ בדוק שהאפליקציה נטענת
2. ✅ בדוק כניסה/יציאה
3. ✅ בדוק קריאות ל-Firebase
4. ✅ בדוק responsive במובייל
5. ✅ בדוק HTTPS עובד

---

## תמיכה:
אם יש בעיות בהעלאה, בדוק:
- Console errors בדפדפן
- Build logs בפלטפורמה
- Firebase Console → Hosting

