# הגדרת משתני סביבה ל-Twilio WhatsApp

## משתני סביבה נדרשים:

```
TWILIO_ACCOUNT_SID=<הכנס את Account SID שלך>
TWILIO_AUTH_TOKEN=<הכנס את Auth Token שלך>
TWILIO_WHATSAPP_NUMBER=whatsapp:+<מספר הטלפון שלך>
```

## איך להגדיר ב-Netlify:

1. לך ל-Netlify Dashboard
2. בחר את הפרויקט שלך
3. לך ל-**Site settings** → **Environment variables**
4. הוסף את המשתנים הבאים:
   - `TWILIO_ACCOUNT_SID` = (הכנס את הערך שלך)
   - `TWILIO_AUTH_TOKEN` = (הכנס את הערך שלך)
   - `TWILIO_WHATSAPP_NUMBER` = `whatsapp:+<מספר הטלפון שלך>`
5. שמור והפעל מחדש את הפונקציות

## איך להגדיר ב-Vercel:

1. לך ל-Vercel Dashboard
2. בחר את הפרויקט שלך
3. לך ל-**Settings** → **Environment Variables**
4. הוסף את המשתנים עם הערכים שלך
5. שמור והפעל מחדש

## איך להגדיר ב-Firebase Functions:

1. התקן Firebase CLI: `npm install -g firebase-tools`
2. התחבר: `firebase login`
3. הגדר משתנים:
   ```bash
   firebase functions:config:set twilio.account_sid="<הכנס את הערך שלך>"
   firebase functions:config:set twilio.auth_token="<הכנס את הערך שלך>"
   firebase functions:config:set twilio.whatsapp_number="whatsapp:+<מספר הטלפון שלך>"
   ```
4. Deploy מחדש: `firebase deploy --only functions`

## חשוב! 🔒

**אל תעלה את הפרטים האלה ל-GitHub!** הם נשמרים רק במשתני סביבה.

