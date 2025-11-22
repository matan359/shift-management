# מדריך מהיר - העלאה ל-Netlify

## שלב 1: דחיפה ל-GitHub

### צור repository ב-GitHub:

1. לך ל-[github.com](https://github.com) והתחבר
2. לחץ על **"+"** → **"New repository"**
3. שם: `shift-management` (או כל שם שתרצה)
4. **אל תסמן** "Initialize with README"
5. לחץ **"Create repository"**

### דחוף את הקוד:

```bash
# הוסף את כל הקבצים
git add .

# צור commit
git commit -m "Initial commit - Shift Management System"

# חבר ל-GitHub (החלף YOUR_USERNAME ו-YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# שנה את השם של ה-branch ל-main
git branch -M main

# דחוף ל-GitHub
git push -u origin main
```

**הערה:** אם GitHub מבקש username ו-password, השתמש ב-Personal Access Token במקום סיסמה.

---

## שלב 2: העלאה ל-Netlify

### דרך 1: דרך האתר (הכי קל) ⭐

1. **לך ל-[netlify.com](https://netlify.com) והתחבר**

2. **לחץ "Add new site" → "Import an existing project"**

3. **בחר "GitHub" והרשאה**

4. **בחר את הפרויקט** (`shift-management`)

5. **הגדר את ההגדרות:**
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Base directory:** (השאר ריק)

6. **לחץ "Deploy site"**

7. **הוסף משתני סביבה** (Site settings → Environment variables):
   - `VITE_FIREBASE_API_KEY` = `AIzaSyBJMOoT-m-TyiSVzCJcin60A5pog464NeU`
   - `VITE_FIREBASE_AUTH_DOMAIN` = `shif-2430b.firebaseapp.com`
   - `VITE_FIREBASE_PROJECT_ID` = `shif-2430b`
   - `VITE_FIREBASE_STORAGE_BUCKET` = `shif-2430b.firebasestorage.app`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID` = `904069677490`
   - `VITE_FIREBASE_APP_ID` = `1:904069677490:web:3bb0123baaad6e620424ab`
   - `VITE_API_URL` = `https://your-whatsapp-server.herokuapp.com` (אם יש)

8. **לחץ "Redeploy"** כדי שהשינויים ייכנסו לתוקף

### דרך 2: דרך CLI

```bash
# התקן Netlify CLI
npm install -g netlify-cli

# התחבר
netlify login

# בנה את הפרויקט
npm run build

# העלה
netlify deploy --prod
```

---

## שלב 3: בדיקות

לאחר ההעלאה:

1. ✅ בדוק שהאפליקציה נטענת
2. ✅ בדוק כניסה/יציאה
3. ✅ בדוק קריאות ל-Firebase
4. ✅ בדוק responsive במובייל

---

## URL סופי

האפליקציה תהיה זמינה ב:
`https://your-app-name.netlify.app`

---

## הערות חשובות:

- **Firebase:** ודא שהכללים ב-Firestore מאפשרים גישה
- **WhatsApp Server:** צריך להריץ על שרת נפרד (Heroku/Railway/Render)
- **משתני סביבה:** חשוב להוסיף את כל משתני Firebase ב-Netlify

