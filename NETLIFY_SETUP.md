# מדריך העלאה ל-Netlify - שלב אחר שלב

## שלב 1: התחברות ל-Netlify

1. **לך ל-[netlify.com](https://netlify.com)**
2. **לחץ "Sign up" או "Log in"**
   - אפשר להתחבר עם GitHub (מומלץ - הכי קל)

## שלב 2: ייבוא הפרויקט

1. **לחץ על "Add new site"** (כפתור ירוק גדול)
2. **בחר "Import an existing project"**
3. **לחץ על "Deploy with GitHub"** (או GitLab/Bitbucket)
4. **הרשאה ל-Netlify** - לחץ "Authorize Netlify"
5. **בחר את הפרויקט** `shift-management` מהרשימה

## שלב 3: הגדרת Build

לאחר בחירת הפרויקט, תראה מסך עם הגדרות:

**הגדר כך:**
- **Base directory:** (השאר ריק)
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Branch to deploy:** `main`

**לחץ "Deploy site"**

## שלב 4: הוספת משתני סביבה

לאחר שההעלאה מתחילה:

1. **לך ל-Site settings** (לחץ על שם האתר → Settings)
2. **לך ל-Environment variables** (בתפריט השמאלי)
3. **לחץ "Add variable"** והוסף כל אחד מהבאים:

```
Key: VITE_FIREBASE_API_KEY
Value: AIzaSyBJMOoT-m-TyiSVzCJcin60A5pog464NeU
```

```
Key: VITE_FIREBASE_AUTH_DOMAIN
Value: shif-2430b.firebaseapp.com
```

```
Key: VITE_FIREBASE_PROJECT_ID
Value: shif-2430b
```

```
Key: VITE_FIREBASE_STORAGE_BUCKET
Value: shif-2430b.firebasestorage.app
```

```
Key: VITE_FIREBASE_MESSAGING_SENDER_ID
Value: 904069677490
```

```
Key: VITE_FIREBASE_APP_ID
Value: 1:904069677490:web:3bb0123baaad6e620424ab
```

4. **לחץ "Save"**

## שלב 5: Redeploy

לאחר הוספת משתני הסביבה:

1. **לך ל-Deploys** (בתפריט העליון)
2. **לחץ על "..."** ליד ה-deploy האחרון
3. **בחר "Redeploy"**
4. **או פשוט לחץ "Trigger deploy" → "Deploy site"**

## שלב 6: בדיקות

לאחר ה-Redeploy (זה יקח 1-2 דקות):

1. ✅ לך ל-URL של האתר (מוצג בראש הדף)
2. ✅ בדוק שהאפליקציה נטענת
3. ✅ נסה להתחבר
4. ✅ בדוק שהכל עובד

## URL הסופי

האפליקציה תהיה זמינה ב:
`https://shift-management-XXXXX.netlify.app`

(ה-XXXXX הוא מספר אקראי ש-Netlify יוצר)

---

## שינוי שם האתר (אופציונלי)

אם תרצה לשנות את השם:

1. **Site settings** → **Change site name**
2. **הכנס שם חדש** (למשל: `shift-management-bagel-cafe`)
3. **האפליקציה תהיה ב:** `https://shift-management-bagel-cafe.netlify.app`

---

## הערות חשובות:

- ⚠️ **Firebase Rules:** ודא שהכללים ב-Firestore מאפשרים גישה
- ⚠️ **WhatsApp Server:** צריך להריץ על שרת נפרד (Heroku/Railway)
- ✅ **עדכונים אוטומטיים:** כל push ל-GitHub יעלה אוטומטית ל-Netlify

---

## מה הלאה?

1. ✅ האפליקציה עובדת ב-Netlify
2. 🔄 כל שינוי ב-GitHub יעלה אוטומטית
3. 📱 האפליקציה זמינה מכל מקום!

