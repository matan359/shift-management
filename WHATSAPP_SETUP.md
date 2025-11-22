# הוראות הגדרת WhatsApp

## התקנת חבילות השרת

1. נווט לתיקיית השרת:
   ```bash
   cd server
   ```

2. התקן את החבילות:
   ```bash
   npm install
   ```

3. ודא שהחבילה `qrcode` מותקנת:
   ```bash
   npm install qrcode
   ```

## הפעלת השרת

1. הפעל את השרת:
   ```bash
   npm start
   ```
   או למצב פיתוח:
   ```bash
   npm run dev
   ```

2. השרת יעלה על פורט 3001 (או PORT שמוגדר ב-env)

## שימוש באתר

1. היכנס לדף `/whatsapp-connection` באתר
2. ה-QR Code יופיע אוטומטית בדף
3. סרוק את ה-QR Code עם WhatsApp בטלפון שלך
4. ההתחברות תישמר אוטומטית

## הגדרת כתובת השרת ב-Production

אם השרת רץ על Railway/Render/Heroku, עדכן את `VITE_API_URL` ב-Netlify:

1. היכנס ל-Netlify Dashboard
2. לך ל-Site settings > Environment variables
3. הוסף:
   - Key: `VITE_API_URL`
   - Value: `https://your-whatsapp-server.railway.app` (הכתובת של השרת שלך)

או עדכן ישירות ב-`src/pages/WhatsAppConnection.jsx`:
```javascript
const API_URL = 'https://your-whatsapp-server.railway.app'
```

## פתרון בעיות

### QR Code לא מופיע
- ודא שהשרת רץ
- בדוק את הקונסול בדפדפן לשגיאות
- ודא שה-API_URL נכון

### שגיאת CORS
- ודא שהשרת כולל `cors()` middleware
- בדוק שהשרת מאפשר requests מהדומיין שלך

### השרת לא מתחבר
- ודא ש-Puppeteer יכול לרוץ (נדרש Chrome/Chromium)
- בדוק את הלוגים של השרת

