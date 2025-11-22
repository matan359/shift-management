# מדריך הגדרות Railway - שלב אחר שלב

## איפה להגדיר כל דבר:

### 1. Root Directory (תיקיית הבנייה)

**Root Directory לא מופיע במסך הזה!** זה בגלל ש-Railway משתמש ב-Railway Config File.

**פתרון:**
- גלול למטה עד "Config-as-code" > "Railway Config File"
- לחץ "Add File Path"
- כתוב: `railway.json`
- או פשוט צור קובץ `railway.json` בתיקיית `server/`

**או דרך קלה יותר:**
- Railway יזהה אוטומטית את התיקייה `server/` אם יש שם `package.json`
- אבל כדי להיות בטוח, צור קובץ `railway.json` בתיקיית `server/`

### 2. Build Command (פקודת בנייה)

**איפה:** גלול למטה עד "Build" > "Custom Build Command"

**מה לכתוב:**
```
npm install
```

**איך:**
1. מצא את "Custom Build Command"
2. לחץ על השדה
3. כתוב: `npm install`
4. לחץ "Update" (בתחתית הדף)

### 3. Start Command (פקודת הפעלה)

**איפה:** גלול למטה עד "Deploy" > "Custom Start Command"

**מה לכתוב:**
```
npm start
```

**איך:**
1. מצא את "Custom Start Command"
2. לחץ על השדה
3. כתוב: `npm start`
4. לחץ "Update" (בתחתית הדף)

### 4. קבלת ה-URL (חשוב!)

**איפה:** "Networking" > "Public Networking"

**איך:**
1. מצא את "Public Networking"
2. לחץ על "Generate Domain"
3. Railway ייצור URL (לדוגמה: `https://shift-management-production.up.railway.app`)
4. **העתק את ה-URL הזה!** - תצטרך אותו ל-Netlify

## סדר הפעולות:

1. ✅ **Build Command:** `npm install`
2. ✅ **Start Command:** `npm start`
3. ✅ **Generate Domain** (ב-Networking)
4. ✅ **העתק את ה-URL**
5. ✅ **הוסף את ה-URL ב-Netlify** (Environment Variables > WHATSAPP_SERVER_URL)

## הערות חשובות:

- **Root Directory:** Railway יזהה אוטומטית את `server/` אם יש שם `package.json` ✅
- **Build Command:** `npm install` (מותקן את החבילות)
- **Start Command:** `npm start` (מריץ את השרת)
- **Domain:** צריך ליצור כדי לקבל URL

## אחרי ההגדרות:

1. Railway יתחיל לפרוס אוטומטית
2. חכה 2-3 דקות
3. בדוק את ה-Logs (בטאב "Deployments")
4. העתק את ה-URL
5. הוסף אותו ב-Netlify

**בהצלחה! 🚀**

