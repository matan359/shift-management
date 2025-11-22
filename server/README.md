# WhatsApp Server

שרת Node.js לשליחת הודעות WhatsApp דרך WhatsApp Web.

## התקנה:

```bash
cd server
npm install
```

## הרצה:

```bash
npm start
```

או למצב פיתוח (עם auto-reload):
```bash
npm run dev
```

השרת ירוץ על `http://localhost:3001`

## שימוש:

1. השרת יתחיל ויציג QR Code בטרמינל
2. סרוק את ה-QR Code עם WhatsApp שלך
3. ההתחברות תישמר אוטומטית ב-`.wwebjs_auth/`
4. האפליקציה תוכל לשלוח הודעות דרך API

## API Endpoints:

- `GET /api/whatsapp/status` - בדיקת סטטוס חיבור
- `GET /api/whatsapp/qr` - קבלת QR Code
- `POST /api/whatsapp/send` - שליחת הודעה אחת
- `POST /api/whatsapp/send-bulk` - שליחת הודעות מרובות
- `POST /api/whatsapp/disconnect` - התנתקות

## הערות:

- ההתחברות נשמרת אוטומטית - לא תצטרך לסרוק QR Code שוב
- אם התנתקת, פשוט הפעל מחדש את השרת וסרוק QR Code שוב
- ההודעות נשלחות מהטלפון שלך - ודא שיש חיבור יציב

