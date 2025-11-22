# מדריך העלאה ל-Netlify

## שלב 1: הכנת הפרויקט

1. **ודא שהכל עובד מקומית:**
```bash
npm run build
```

2. **צור קובץ `.env.production`** (אופציונלי):
```
VITE_API_URL=https://your-whatsapp-server.herokuapp.com
```

## שלב 2: העלאה ל-Netlify

### דרך 1: דרך GitHub (מומלץ) ⭐

1. **דחוף את הקוד ל-GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

2. **לך ל-[netlify.com](https://netlify.com) והתחבר**

3. **לחץ "Add new site" → "Import an existing project"**

4. **בחר את הפרויקט מ-GitHub**

5. **הגדר את ההגדרות:**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Base directory: (השאר ריק)

6. **לחץ "Deploy site"**

7. **הוסף משתני סביבה** (אם צריך):
   - לך ל-Site settings → Environment variables
   - הוסף:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - וכו'...

### דרך 2: דרך Netlify CLI

1. **התקן Netlify CLI:**
```bash
npm install -g netlify-cli
```

2. **התחבר:**
```bash
netlify login
```

3. **בנה את הפרויקט:**
```bash
npm run build
```

4. **העלה:**
```bash
netlify deploy --prod
```

## שלב 3: העלאת שרת WhatsApp (אופציונלי)

השרת צריך לרוץ על שרת נפרד. אפשרויות:

### אפשרות 1: Heroku (חינמי)

1. **צור `Procfile` בתיקיית `server/`:**
```
web: node server.js
```

2. **העלה ל-Heroku:**
```bash
cd server
heroku create your-app-name
git init
git add .
git commit -m "Initial commit"
git push heroku main
```

### אפשרות 2: Railway (חינמי)

1. **לך ל-[railway.app](https://railway.app)**
2. **חבר את GitHub**
3. **New Project → Deploy from GitHub**
4. **בחר את תיקיית `server/`**

### אפשרות 3: Render (חינמי)

1. **לך ל-[render.com](https://render.com)**
2. **New → Web Service**
3. **חבר את GitHub ובחר את תיקיית `server/`**

## הערות חשובות:

1. **Firebase:** ודא שהכללים ב-Firestore מאפשרים גישה מ-Netlify
2. **CORS:** אם יש בעיות CORS, הוסף ב-`server/server.js`:
   ```js
   app.use(cors({
     origin: ['https://your-app.netlify.app', 'http://localhost:3000']
   }))
   ```
3. **משתני סביבה:** הוסף את כל משתני Firebase ב-Netlify
4. **WhatsApp Server:** השרת צריך לרוץ כל הזמן - השתמש ב-Heroku/Railway/Render

## בדיקות אחרי העלאה:

1. ✅ בדוק שהאפליקציה נטענת
2. ✅ בדוק כניסה/יציאה
3. ✅ בדוק קריאות ל-Firebase
4. ✅ בדוק responsive במובייל
5. ✅ בדוק HTTPS עובד

## URL סופי:

האפליקציה תהיה זמינה ב:
`https://your-app-name.netlify.app`

