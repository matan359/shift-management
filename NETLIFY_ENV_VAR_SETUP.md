# הוספת WHATSAPP_SERVER_URL ב-Netlify - מדריך שלב אחר שלב

## הבעיה
ההודעה: "WhatsApp server URL not configured" אומרת ש-Netlify לא יודע איפה השרת שלך רץ.

## הפתרון - הוספת Environment Variable

### שלב 1: היכנס ל-Netlify Dashboard

1. **לך ל-[app.netlify.com](https://app.netlify.com/)**
2. **התחבר** (אם אתה לא מחובר)
3. **בחר את האתר שלך:** `bagecoffe` (או השם של האתר שלך)

### שלב 2: פתח Environment Variables

1. **לחץ על "Site settings"** (בתפריט השמאלי, או לחץ על שם האתר > Settings)
2. **גלול למטה בתפריט השמאלי**
3. **לחץ על "Environment variables"** (תחת "Build & deploy")

### שלב 3: הוסף את המשתנה

1. **לחץ על הכפתור "Add variable"** (כפתור כחול/ירוק)
2. **בשדה "Key" כתוב:**
   ```
   WHATSAPP_SERVER_URL
   ```
3. **בשדה "Value" כתוב:**
   ```
   https://shift-management-production-c20e.up.railway.app
   ```
   (זה ה-URL מ-Railway - ודא שזה נכון!)
4. **לחץ "Save"** (או "Add variable")

### שלב 4: פרוס מחדש

1. **לך לטאב "Deploys"** (בתפריט העליון)
2. **לחץ על "Trigger deploy"** (כפתור כחול)
3. **בחר "Deploy site"**
4. **חכה 1-2 דקות** עד שהפריסה מסתיימת

### שלב 5: בדיקה

1. **רענן את הדף:** `https://bagecoffe.netlify.app/whatsapp-connection`
2. **ה-QR Code אמור להופיע!** 📱
3. **אם עדיין לא עובד, בדוק:**
   - שהפריסה הסתיימה (Deploys > בדוק שהסטטוס "Published")
   - שה-URL נכון (העתק מ-Railway)
   - רענן את הדף (Ctrl+F5)

## תמונות/הסבר נוסף:

### איפה נמצא Environment Variables?
- **Site settings** > **Environment variables** (בתפריט השמאלי)

### איך נראה Add Variable?
- כפתור כחול/ירוק עם טקסט "Add variable"
- או כפתור "+ Add variable"

### איך יודעים שה-URL נכון?
- לך ל-Railway Dashboard
- לך ל-Settings > Networking
- העתק את ה-URL מ-"Domain" (לדוגמה: `shift-management-production-c20e.up.railway.app`)
- הוסף `https://` בהתחלה

## פתרון בעיות:

### עדיין רואה "not configured"?
1. **ודא שהפריסה הסתיימה** - לך ל-Deploys ובדוק
2. **ודא שה-URL נכון** - נסה לגשת ישירות: `https://shift-management-production-c20e.up.railway.app/api/whatsapp/status`
3. **רענן את הדף** - Ctrl+F5 (או Cmd+Shift+R ב-Mac)

### השרת לא עובד ב-Railway?
1. **בדוק את ה-Logs ב-Railway** - לך ל-Deployments
2. **ודא שהפריסה הסתיימה בהצלחה**
3. **נסה לגשת ישירות ל-URL** - אם זה לא עובד, הבעיה ב-Railway

## סיכום:

1. ✅ **Netlify Dashboard** > **Site settings** > **Environment variables**
2. ✅ **Add variable:**
   - Key: `WHATSAPP_SERVER_URL`
   - Value: `https://shift-management-production-c20e.up.railway.app`
3. ✅ **Save**
4. ✅ **Trigger deploy** > **Deploy site**
5. ✅ **רענן את הדף**

**בהצלחה! 🚀**

