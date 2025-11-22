# הוראות פריסה ל-Netlify - גרסה סופית

## שלב 1: העלאה ל-GitHub

1. פתח PowerShell או Command Prompt
2. נווט לתיקיית הפרויקט:
   ```bash
   cd "C:\Users\iopio\Desktop\משמרות"
   ```

3. בדוק את הסטטוס:
   ```bash
   git status
   ```

4. הוסף את כל הקבצים:
   ```bash
   git add .
   ```

5. צור commit:
   ```bash
   git commit -m "עדכון סופי: עריכת משמרות בלייב, עיצוב משופר, WhatsApp integration"
   ```

6. דחוף ל-GitHub:
   ```bash
   git push origin main
   ```
   (או `git push origin master` אם זה השם של ה-branch שלך)

## שלב 2: פריסה ב-Netlify

### דרך 1: דרך האתר (מומלץ)

1. היכנס ל-[Netlify](https://app.netlify.com/)
2. לחץ על **"Add new site"** > **"Import an existing project"**
3. בחר **GitHub** והרשא גישה ל-repository שלך
4. בחר את ה-repository **משמרות**
5. הגדרות Build:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Node version:** `18` (או `20`)
6. לחץ על **"Deploy site"**

### דרך 2: דרך Netlify CLI

1. התקן Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. התחבר:
   ```bash
   netlify login
   ```

3. אתחל אתר חדש:
   ```bash
   netlify init
   ```

4. בנה את הפרויקט:
   ```bash
   npm run build
   ```

5. פרס:
   ```bash
   netlify deploy --prod
   ```

## שלב 3: הגדרת משתני סביבה (אם צריך)

אם יש לך משתני סביבה (כמו Firebase config), הוסף אותם ב-Netlify:

1. היכנס ל-Dashboard של האתר שלך ב-Netlify
2. לך ל-**Site settings** > **Environment variables**
3. הוסף משתנים:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - וכו' (אם אתה משתמש בהם)

## שלב 4: שרת WhatsApp (נפרד)

**חשוב:** שרת WhatsApp לא יכול לרוץ ב-Netlify כי Netlify לא תומך בשרתים ארוכי טווח.

### אפשרויות לשרת WhatsApp:

1. **Railway.app** (מומלץ - חינם):
   - היכנס ל-[Railway](https://railway.app/)
   - צור פרויקט חדש מ-GitHub
   - בחר את ה-repository שלך
   - הגדר את ה-root directory ל-`server`
   - הגדר את ה-start command ל-`npm start`
   - הוסף משתני סביבה אם צריך

2. **Render.com**:
   - היכנס ל-[Render](https://render.com/)
   - צור Web Service חדש
   - חבר ל-GitHub repository
   - הגדר:
     - Build Command: `cd server && npm install`
     - Start Command: `cd server && npm start`

3. **Heroku** (אם יש לך חשבון):
   - דומה ל-Render

## שלב 5: עדכון כתובת שרת WhatsApp

לאחר שפרסת את שרת WhatsApp, עדכן את הכתובת ב-frontend:

1. פתח את `src/pages/WhatsAppConnection.jsx`
2. עדכן את `API_URL` לכתובת של השרת שלך (מ-Railway/Render)

## הערות חשובות:

- ✅ Frontend (React) יעבוד מצוין ב-Netlify
- ✅ Firebase יעבוד מצוין (client-side)
- ⚠️ שרת WhatsApp צריך hosting נפרד (Railway/Render)
- ✅ כל הקבצים כבר מוכנים לפריסה

## בדיקות אחרונות:

לפני הפריסה, ודא:
- [ ] `npm run build` עובד ללא שגיאות
- [ ] כל הקבצים ב-`dist` נראים תקינים
- [ ] `netlify.toml` קיים ומוגדר נכון
- [ ] `.gitignore` כולל את הקבצים הנכונים

## תמיכה:

אם יש בעיות:
1. בדוק את ה-logs ב-Netlify Dashboard
2. בדוק את ה-console בדפדפן
3. ודא ש-Firebase מוגדר נכון

**בהצלחה! 🚀**

