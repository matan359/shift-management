# הגדרת שרת WhatsApp Web.js

## מה זה?
שרת WhatsApp Web.js מאפשר שליחה אוטומטית של הודעות WhatsApp דרך WhatsApp Web.

## דרישות
- Node.js 18 או יותר
- npm או yarn

## התקנה והרצה מקומית

1. **התקן את התלויות:**
```bash
cd server
npm install
```

2. **הרץ את השרת:**
```bash
npm start
```

השרת ירוץ על `http://localhost:3001`

3. **בדוק שהשרת עובד:**
פתח דפדפן וגש ל: `http://localhost:3001/api/whatsapp/status`

## הפעלה ראשונה

1. השרת יתחיל אוטומטית ויצור QR Code
2. פתח את דף ההתראות באפליקציה
3. לחץ על "התחל חיבור WhatsApp"
4. סרוק את ה-QR Code עם WhatsApp בטלפון שלך:
   - פתח WhatsApp
   - הגדרות → מכשירים מקושרים → קשר מכשיר
   - סרוק את ה-QR Code

## פריסה ל-Railway (מומלץ)

1. **צור חשבון ב-Railway:**
   - לך ל: https://railway.app
   - היכנס עם GitHub

2. **צור פרויקט חדש:**
   - לחץ על "New Project"
   - בחר "Deploy from GitHub repo"
   - בחר את ה-repository שלך

3. **הגדר את השרת:**
   - Railway יזהה אוטומטית את תיקיית `server`
   - אם לא, הגדר את Root Directory ל-`server`
   - הגדר את Start Command ל-`npm start`

4. **קבל את ה-URL:**
   - לאחר הפריסה, Railway ייתן לך URL (לדוגמה: `https://your-app.railway.app`)
   - העתק את ה-URL הזה

5. **הגדר משתנה סביבה ב-Netlify:**
   - לך ל-Netlify Dashboard
   - בחר את האתר שלך
   - Site settings → Environment variables
   - הוסף משתנה חדש:
     - Key: `WHATSAPP_SERVER_URL`
     - Value: ה-URL של Railway (לדוגמה: `https://your-app.railway.app`)

6. **Redeploy את האתר:**
   - Netlify יטען מחדש את האתר עם המשתנה החדש

## פריסה ל-Render (אלטרנטיבה)

1. **צור חשבון ב-Render:**
   - לך ל: https://render.com
   - היכנס עם GitHub

2. **צור Web Service חדש:**
   - לחץ על "New +" → "Web Service"
   - בחר את ה-repository שלך

3. **הגדר את השירות:**
   - Name: `whatsapp-server` (או כל שם אחר)
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `Node`

4. **קבל את ה-URL והגדר ב-Netlify:**
   - Render ייתן לך URL (לדוגמה: `https://your-app.onrender.com`)
   - הגדר את `WHATSAPP_SERVER_URL` ב-Netlify כמו ב-Railway

## בדיקת החיבור

1. פתח את דף ההתראות באפליקציה
2. בדוק את סטטוס החיבור:
   - ✅ מחובר ומוכן - הכל עובד!
   - 📱 סרוק QR Code - צריך לסרוק את ה-QR Code
   - 🔄 מתחבר - ממתין ל-QR Code
   - ❌ לא מחובר - לחץ על "התחל חיבור WhatsApp"

## פתרון בעיות

### השרת לא מתחבר
- ודא שהשרת רץ (בדוק ב-Railway/Render Dashboard)
- ודא שמשתנה הסביבה `WHATSAPP_SERVER_URL` מוגדר נכון ב-Netlify
- בדוק שהשרת נגיש (נסה לפתוח את ה-URL בדפדפן)

### QR Code לא מופיע
- לחץ על "רענן" בדף ההתראות
- ודא שהשרת רץ ופועל
- נסה ללחוץ על "התחל חיבור WhatsApp" שוב

### הודעות לא נשלחות
- ודא ש-WhatsApp מחובר (סטטוס: ✅ מחובר ומוכן)
- בדוק שהמספר טלפון של העובד תקין
- ודא שהשרת רץ ופועל

## הערות חשובות

- השרת צריך לרוץ כל הזמן כדי שה-WhatsApp יישאר מחובר
- אם השרת נכבה, תצטרך לסרוק QR Code שוב
- Railway ו-Render מציעים תוכניות חינמיות עם הגבלות (למשל, שירותים יכולים להירדם אחרי זמן ללא פעילות)
- לפתרון יציב יותר, שקול שירות בתשלום או VPS משלך

