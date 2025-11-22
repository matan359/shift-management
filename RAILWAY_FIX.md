# תיקון: Railway בונה את כל האתר במקום רק server/

## הבעיה
Railway בונה את כל הפרויקט במקום רק את תיקיית `server/`.

## הפתרון - 2 אפשרויות:

### אפשרות 1: Root Directory בהגדרות Railway (הכי קל!)

1. **לך ל-Railway Dashboard**
2. **לחץ על השירות (Service)**
3. **לך ל-Settings**
4. **מצא "Source"** (בחלק העליון)
5. **מצא "Add Root Directory"** (או "Root Directory")
6. **כתוב:** `server`
7. **לחץ Save**

זה יגיד ל-Railway לבנות רק את תיקיית `server/` ולא את כל הפרויקט.

### אפשרות 2: יצירת Service נפרד (אם אפשרות 1 לא עובדת)

1. **מחק את השירות הנוכחי** (Delete Service)
2. **צור Service חדש:**
   - לחץ "New" > "GitHub Repo"
   - בחר את ה-repository
   - **בהגדרות הראשוניות, לפני הפריסה:**
     - Root Directory: `server`
     - Build Command: `npm install`
     - Start Command: `npm start`

## איפה למצוא Root Directory ב-Railway?

**אם אתה לא רואה את Root Directory:**

1. **לך ל-Settings של השירות**
2. **גלול למעלה** - זה בחלק "Source"
3. **חפש "Root Directory"** או "Add Root Directory"
4. **אם לא רואה, נסה:**
   - לחץ על "Source" > "Disconnect" > "Connect Repo" שוב
   - בהגדרות החיבור, תראה אפשרות ל-Root Directory

## בדיקה

אחרי שתגדיר Root Directory:
1. Railway יפרוס מחדש אוטומטית
2. בדוק את ה-Logs - תראה שהוא עובד מתוך `server/`
3. הפריסה צריכה להצליח

## אם עדיין לא עובד:

**צור Service חדש עם Root Directory מההתחלה:**
1. מחק את השירות הנוכחי
2. New > GitHub Repo
3. בהגדרות הראשוניות, לפני Deploy:
   - Root Directory: `server`
   - Build: `npm install`
   - Start: `npm start`

**בהצלחה! 🚀**

