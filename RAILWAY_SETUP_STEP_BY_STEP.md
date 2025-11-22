# מדריך שלב אחר שלב - הגדרת Railway

## שלב 1: יצירת פרויקט ב-Railway

1. **היכנס ל-[Railway.app](https://railway.app/)**
2. **התחבר עם GitHub** (לחץ "Login with GitHub")
3. **לחץ על "New Project"** (כפתור כחול גדול)
4. **בחר "Deploy from GitHub repo"**
5. **בחר את ה-repository שלך:** `shift-management` (או השם של ה-repo שלך)
6. **לחץ "Deploy"**

## שלב 2: הגדרת ההגדרות

אחרי ש-Railway מתחיל לפרוס, תראה את השירות (Service) שנוצר.

### א. פתיחת ההגדרות:

1. **לחץ על השירות** שנוצר (Service) - זה הקופסה עם השם של הפרויקט
2. **לך לטאב "Settings"** (בתפריט העליון של השירות)

### ב. הגדרת Root Directory:

1. **גלול למטה עד שתמצא "Root Directory"**
2. **בשדה "Root Directory"** כתוב: `server`
3. **לחץ "Save"** (או זה ישמר אוטומטית)

### ג. הגדרת Build Command:

1. **באותו מסך Settings, גלול למטה**
2. **מצא את "Build Command"**
3. **בשדה "Build Command"** כתוב: `npm install`
4. **לחץ "Save"**

### ד. הגדרת Start Command:

1. **באותו מסך Settings, גלול למטה עוד יותר**
2. **מצא את "Start Command"**
3. **בשדה "Start Command"** כתוב: `npm start`
4. **לחץ "Save"**

## שלב 3: קבלת ה-URL

1. **לך לטאב "Settings"** (אם אתה לא שם)
2. **גלול למטה עד "Networking"**
3. **לחץ על "Generate Domain"** (כפתור כחול)
4. **Railway ייצור URL** (לדוגמה: `https://shift-management-production.up.railway.app`)
5. **העתק את ה-URL הזה!** - תצטרך אותו ל-Netlify

## שלב 4: בדיקה

1. **לך לטאב "Deployments"** (בתפריט העליון)
2. **תראה את ה-Deployment מתבצע**
3. **חכה עד שהוא מסתיים** (זה יכול לקחת 2-3 דקות)
4. **אם יש שגיאות, לחץ על ה-Deployment** כדי לראות את ה-Logs

## תמונות/הסבר נוסף:

### איפה נמצא Root Directory?
- **Settings** > גלול למטה > **Root Directory** (זה השדה הראשון)

### איפה נמצא Build Command?
- **Settings** > גלול למטה > **Build Command** (אחרי Root Directory)

### איפה נמצא Start Command?
- **Settings** > גלול למטה > **Start Command** (אחרי Build Command)

## פתרון בעיות:

### לא רואה את השדות?
- ודא שאתה בטאב **Settings** של השירות (לא של הפרויקט)
- גלול למטה - השדות נמצאים בחלק התחתון של הדף

### הפריסה נכשלת?
- בדוק את ה-Logs בטאב **Deployments**
- ודא ש-`server/package.json` קיים
- ודא ש-`server/server.js` קיים

### השרת לא מתחיל?
- בדוק את ה-Logs
- ודא ש-`npm start` עובד מקומית
- ודא שכל ה-dependencies מותקנות

## הערות חשובות:

- ✅ אחרי שתשנה את ההגדרות, Railway יפרוס מחדש אוטומטית
- ✅ חכה עד שהפריסה מסתיימת (2-3 דקות)
- ✅ שמור את ה-URL - תצטרך אותו ל-Netlify

**בהצלחה! 🚀**

