# מדריך הגדרת WhatsApp Web.js - שליחת הודעות אוטומטית

## 🎯 מה זה?
פתרון לשליחת הודעות WhatsApp אוטומטית דרך WhatsApp Web עם QR Code.

## ⚠️ חשוב לדעת
**הפתרון דורש שרת חיצוני** (Railway או Render) כי Netlify Functions לא יכול להריץ Puppeteer (נדרש ל-WhatsApp Web.js).

## 📋 שלב 1: פריסה ל-Railway (מומלץ - חינמי)

### 1.1 צור חשבון
1. לך ל: https://railway.app
2. היכנס עם GitHub

### 1.2 צור פרויקט חדש
1. לחץ על **"New Project"**
2. בחר **"Deploy from GitHub repo"**
3. בחר את ה-repository שלך
4. Railway יתחיל לבנות את הפרויקט

### 1.3 ⚠️ חשוב מאוד - הגדר Root Directory!
**Railway ינסה לבנות את כל הפרויקט!** צריך להגיד לו לבנות רק את תיקיית `server`:

1. ב-Railway Dashboard, לחץ על השרת שיצרת
2. לחץ על **"Settings"** (הגלגל שיניים)
3. גלול למטה ל-**"Root Directory"**
4. לחץ על **"Edit"**
5. הזן: `server` (רק המילה server, בלי סלאשים)
6. לחץ **"Save"**
7. Railway יתחיל לבנות מחדש - הפעם רק את תיקיית `server` ✅

**אם לא תעשה את זה, Railway ינסה לבנות את כל האתר ויכשל!**

### 1.4 הגדר Build Method (אם צריך)
אם Railway לא מזהה את ה-Dockerfile:
1. ב-Settings → **"Build Command"**
2. השאר ריק (Dockerfile יעשה את העבודה)
3. ב-**"Start Command"** - השאר: `npm start`

### 1.4 קבל את ה-URL
1. לאחר הפריסה, Railway ייתן לך URL (לדוגמה: `https://your-app.railway.app`)
2. העתק את ה-URL הזה

## 📋 שלב 2: הגדר משתנה סביבה ב-Netlify

1. לך ל-Netlify Dashboard
2. בחר את האתר שלך
3. **Site settings** → **Environment variables**
4. לחץ על **"Add variable"**
5. הוסף:
   - **Key:** `WHATSAPP_SERVER_URL`
   - **Value:** ה-URL של Railway (לדוגמה: `https://your-app.railway.app`)
6. לחץ **"Save"**

## 📋 שלב 3: Redeploy את האתר

1. ב-Netlify Dashboard, לחץ על **"Deploys"**
2. לחץ על **"Trigger deploy"** → **"Clear cache and deploy site"**
3. המתן עד שהבנייה מסתיימת

## 📋 שלב 4: חבר את WhatsApp

1. פתח את דף ההתראות באפליקציה
2. לחץ על **"התחל חיבור WhatsApp"**
3. סרוק את ה-QR Code עם WhatsApp בטלפון:
   - פתח WhatsApp
   - **הגדרות** → **מכשירים מקושרים** → **קשר מכשיר**
   - סרוק את ה-QR Code

## ✅ איך זה עובד

1. **השרת רץ על Railway** - מטפל בחיבור ל-WhatsApp Web
2. **Netlify Functions** - פועלים כפרוקסי לשרת
3. **האפליקציה** - מתחברת דרך Netlify Functions לשרת
4. **QR Code** - מוצג באפליקציה, סורקים עם הטלפון
5. **שליחה אוטומטית** - לאחר החיבור, ההודעות נשלחות אוטומטית!

## 🔧 פתרון בעיות

### השרת לא מתחבר
- ודא שהשרת רץ ב-Railway (בדוק ב-Dashboard)
- ודא שמשתנה הסביבה `WHATSAPP_SERVER_URL` מוגדר נכון ב-Netlify
- בדוק שהשרת נגיש (נסה לפתוח את ה-URL בדפדפן)

### QR Code לא מופיע
- לחץ על **"רענן"** בדף ההתראות
- ודא שהשרת רץ ופועל
- נסה ללחוץ על **"התחל חיבור WhatsApp"** שוב

### הודעות לא נשלחות
- ודא ש-WhatsApp מחובר (סטטוס: ✅ מחובר ומוכן)
- בדוק שהמספר טלפון של העובד תקין
- ודא שהשרת רץ ופועל

## 💡 הערות חשובות

- **השרת צריך לרוץ כל הזמן** כדי שה-WhatsApp יישאר מחובר
- **אם השרת נכבה**, תצטרך לסרוק QR Code שוב
- **Railway מציע תוכנית חינמית** עם הגבלות (שירות יכול להירדם אחרי זמן ללא פעילות)
- **לפתרון יציב יותר**, שקול שירות בתשלום או VPS משלך

## 🚀 אלטרנטיבה: Render

אם אתה מעדיף Render במקום Railway:

1. לך ל: https://render.com
2. היכנס עם GitHub
3. צור **Web Service** חדש
4. בחר את ה-repository
5. הגדר:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
6. קבל את ה-URL והגדר ב-Netlify כמו ב-Railway

---

**הכל מוכן!** עכשיו תוכל לשלוח הודעות WhatsApp אוטומטיות! 🎉

