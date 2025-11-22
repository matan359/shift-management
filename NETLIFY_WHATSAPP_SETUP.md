# הגדרת WhatsApp ב-Netlify - מדריך מלא

## הבעיה
Netlify לא תומך בשרתים ארוכי טווח (long-running servers), אבל שרת WhatsApp צריך לרוץ כל הזמן.

## הפתרון
נשתמש ב-Netlify Functions כפרוקסי לשרת WhatsApp חיצוני (Railway/Render - חינם).

## שלב 1: פריסת שרת WhatsApp ב-Railway (חינם)

### א. יצירת חשבון ב-Railway
1. היכנס ל-[Railway.app](https://railway.app/)
2. התחבר עם GitHub
3. לחץ על "New Project"

### ב. פריסת השרת
1. בחר "Deploy from GitHub repo"
2. בחר את ה-repository שלך: `shift-management`
3. לחץ על "Add Service"
4. בחר "GitHub Repo" שוב
5. בחר את ה-repository
6. **חשוב:** ב-Settings:
   - **Root Directory:** `server`
   - **Start Command:** `npm start`
   - **Build Command:** `npm install`

### ג. קבלת כתובת השרת
1. אחרי הפריסה, Railway יתן לך URL
2. זה ייראה כך: `https://your-app-name.railway.app`
3. **שמור את הכתובת הזו!**

## שלב 2: הגדרת Netlify Functions

### א. הוספת משתנה סביבה ב-Netlify
1. היכנס ל-[Netlify Dashboard](https://app.netlify.com/)
2. בחר את האתר שלך
3. לך ל-**Site settings** > **Environment variables**
4. לחץ על **Add variable**
5. הוסף:
   - **Key:** `WHATSAPP_SERVER_URL`
   - **Value:** `https://your-app-name.railway.app` (הכתובת מ-Railway)
6. לחץ **Save**

### ב. פריסה מחדש
1. Netlify יזהה את השינויים ויפרס אוטומטית
2. או לחץ על **Trigger deploy** > **Deploy site**

## שלב 3: בדיקה

1. היכנס ל-`https://your-site.netlify.app/whatsapp-connection`
2. ה-QR Code אמור להופיע אוטומטית
3. סרוק את ה-QR Code עם WhatsApp

## איך זה עובד?

```
דפדפן → Netlify Function → Railway Server → WhatsApp
```

1. הדפדפן שולח בקשה ל-Netlify Function
2. Netlify Function מעבירה את הבקשה לשרת ב-Railway
3. השרת ב-Railway מטפל ב-WhatsApp
4. התשובה חוזרת דרך Netlify Function לדפדפן

## פתרון בעיות

### QR Code לא מופיע
1. בדוק שהשרת רץ ב-Railway (לך ל-Railway Dashboard)
2. בדוק שה-`WHATSAPP_SERVER_URL` נכון ב-Netlify
3. בדוק את ה-logs ב-Netlify Functions

### שגיאת CORS
- Netlify Functions מטפלות ב-CORS אוטומטית
- אם יש בעיה, בדוק שה-headers נכונים

### השרת לא מתחבר
1. בדוק את ה-logs ב-Railway
2. ודא ש-Puppeteer יכול לרוץ (Railway תומך בזה)
3. בדוק שהחבילות מותקנות נכון

## עלויות

- ✅ **Netlify:** חינם (100GB bandwidth, 300 build minutes)
- ✅ **Railway:** חינם (500 שעות/חודש, $5 credit)
- ✅ **סה"כ:** חינם לחלוטין!

## הערות חשובות

1. **Railway יכול להירדם** אחרי זמן ללא שימוש (בתוכנית החינמית)
   - הפתרון: השתמש ב-[UptimeRobot](https://uptimerobot.com/) (חינם) כדי לשמור על השרת פעיל

2. **ההתחברות נשמרת** - אחרי סריקת QR Code פעם אחת, לא תצטרך לסרוק שוב

3. **ההודעות נשלחות מהטלפון שלך** - ודא שהטלפון מחובר לאינטרנט

## הגדרת UptimeRobot (אופציונלי - מומלץ)

1. היכנס ל-[UptimeRobot](https://uptimerobot.com/)
2. צור חשבון חינמי
3. לחץ על "Add New Monitor"
4. בחר "HTTP(s)"
5. הזן:
   - **URL:** `https://your-app-name.railway.app/api/whatsapp/status`
   - **Interval:** 5 minutes
6. זה ישמור על השרת פעיל

## סיכום

✅ Frontend על Netlify  
✅ WhatsApp Server על Railway (חינם)  
✅ Netlify Functions כפרוקסי  
✅ הכל עובד דרך Netlify!  

**בהצלחה! 🚀**

