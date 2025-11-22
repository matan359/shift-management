# תיקון: Railway בונה את כל האפליקציה במקום רק server/

## הבעיה
Railway מציג את דף הכניסה של React במקום את שרת WhatsApp API. זה אומר ש-Railway בנה את כל הפרויקט במקום רק את תיקיית `server/`.

## הפתרון

### שלב 1: בדוק את Root Directory ב-Railway

1. **לך ל-Railway Dashboard**
2. **לחץ על השירות (Service)**
3. **לך ל-Settings**
4. **מצא "Source"** (בחלק העליון)
5. **בדוק את "Root directory":**
   - **חייב להיות:** `server` (לא `/server`, לא `./server`, רק `server`)
   - **אם זה לא נכון, שנה ל:** `server`
6. **לחץ "Update"** (בתחתית הדף)

### שלב 2: מחק את ה-Deployment הנוכחי

1. **לך לטאב "Deployments"**
2. **לחץ על ה-Deployment האחרון**
3. **לחץ על "..."** (שלוש נקודות)
4. **בחר "Delete"** (אופציונלי - רק אם צריך)

### שלב 3: Trigger Deployment חדש

1. **לך ל-Settings**
2. **גלול למטה עד "Source"**
3. **לחץ "Disconnect"** ואז "Connect Repo" שוב
4. **או פשוט:**
   - לך ל-Deployments
   - לחץ "Redeploy" (אם יש כפתור כזה)

### שלב 4: בדוק את ה-Logs

1. **לך ל-Deployments**
2. **לחץ על ה-Deployment החדש**
3. **בדוק את ה-Logs:**
   - צריך לראות: `npm install` (בתיקיית server)
   - צריך לראות: `npm start`
   - צריך לראות: `WhatsApp Server running on...`
   - **לא צריך לראות:** `vite`, `react`, `build` (אלה של ה-frontend)

### שלב 5: בדוק שהשרת עובד

1. **פתח בדפדפן:**
   ```
   https://shift-management-production-c20e.up.railway.app/api/whatsapp/status
   ```
2. **צריך לראות:**
   ```json
   {"status":"qr"} 
   ```
   או
   ```json
   {"status":"ready"}
   ```
3. **אם אתה רואה HTML (דף הכניסה), זה אומר ש-Railway עדיין בונה את כל הפרויקט**

## אם עדיין לא עובד:

### אפשרות 1: מחק וצור Service חדש

1. **מחק את השירות הנוכחי** (Delete Service)
2. **צור Service חדש:**
   - New > GitHub Repo
   - בחר את ה-repository
   - **בהגדרות הראשוניות, לפני Deploy:**
     - Root Directory: `server` (חשוב!)
     - Build Command: `npm install`
     - Start Command: `npm start`
3. **רק אחרי שתגדיר את Root Directory, לחץ Deploy**

### אפשרות 2: ודא ש-railway.json נכון

הקובץ `server/railway.json` צריך להיות:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## בדיקה סופית:

✅ **Root Directory:** `server` (לא `/server`, לא `./server`)  
✅ **Build Command:** `npm install`  
✅ **Start Command:** `npm start`  
✅ **URL:** `https://shift-management-production-c20e.up.railway.app/api/whatsapp/status` מחזיר JSON (לא HTML)  

**אם הכל נכון, השרת יעבוד! 🚀**

