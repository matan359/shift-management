# מדריך מהיר להגדרת שרת WhatsApp

## הבעיה
השגיאה "Server error: 500" אומרת ש-Netlify Functions לא מצליחות להתחבר לשרת WhatsApp.

## הפתרון - 2 שלבים:

### שלב 1: פריסת שרת WhatsApp ב-Railway (5 דקות)

1. **היכנס ל-[Railway.app](https://railway.app/)** והתחבר עם GitHub

2. **צור פרויקט חדש:**
   - לחץ "New Project"
   - בחר "Deploy from GitHub repo"
   - בחר את ה-repository שלך: `shift-management`

3. **הגדר את השרת:**
   - לחץ על השירות שנוצר
   - לך ל-**Settings**
   - **Root Directory:** `server`
   - **Start Command:** `npm start`
   - **Build Command:** `npm install`

4. **קבל את ה-URL:**
   - לך ל-**Settings** > **Networking**
   - לחץ "Generate Domain"
   - **העתק את ה-URL** (לדוגמה: `https://shift-management-production.up.railway.app`)

### שלב 2: הגדרת Netlify (2 דקות)

1. **היכנס ל-[Netlify Dashboard](https://app.netlify.com/)**

2. **בחר את האתר שלך**

3. **הוסף משתנה סביבה:**
   - לך ל-**Site settings** > **Environment variables**
   - לחץ **Add variable**
   - **Key:** `WHATSAPP_SERVER_URL`
   - **Value:** הדבק את ה-URL מ-Railway (לדוגמה: `https://shift-management-production.up.railway.app`)
   - לחץ **Save**

4. **פרוס מחדש:**
   - לך ל-**Deploys**
   - לחץ **Trigger deploy** > **Deploy site**

## בדיקה

אחרי 2-3 דקות:
1. רענן את הדף `https://bagecoffe.netlify.app/whatsapp-connection`
2. ה-QR Code אמור להופיע
3. סרוק עם WhatsApp

## פתרון בעיות

### עדיין מקבל שגיאה 500?
1. **בדוק שהשרת רץ ב-Railway:**
   - לך ל-Railway Dashboard
   - ודא שהשירות ירוק (Running)
   - בדוק את ה-Logs

2. **בדוק את ה-URL ב-Netlify:**
   - ודא ש-`WHATSAPP_SERVER_URL` נכון
   - ודא שאין רווחים או תווים מיותרים

3. **נסה לגשת ישירות לשרת:**
   - פתח בדפדפן: `https://your-railway-url.railway.app/api/whatsapp/status`
   - אם זה עובד, הבעיה ב-Netlify Functions
   - אם זה לא עובד, הבעיה ב-Railway

### השרת לא מתחיל ב-Railway?
- בדוק את ה-Logs ב-Railway
- ודא ש-`package.json` ב-`server/` תקין
- ודא ש-`server.js` קיים

## הערות חשובות

- ✅ השרת צריך לרוץ כל הזמן (Railway חינם עד 500 שעות/חודש)
- ✅ ההתחברות נשמרת - לא תצטרך לסרוק QR Code שוב
- ✅ אם השרת נכבה, פשוט הפעל אותו שוב ב-Railway

**בהצלחה! 🚀**

