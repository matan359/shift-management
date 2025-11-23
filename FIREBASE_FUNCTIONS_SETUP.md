# הגדרת שליחה אוטומטית יומית - Firebase Cloud Functions

## איך זה עובד:

1. **הפונקציה רצה כל יום ב-07:00** (אפשר לשנות)
2. **בודקת את ההגדרות** של כל מנהל
3. **יוצרת קישורי WhatsApp** לעובדים שנבחרו
4. **שומרת את הקישורים** ב-Firestore
5. **בדף "התראות WhatsApp"** תראה הודעה עם כפתור לפתיחת הקישורים

## התקנה:

### שלב 1: התקן Firebase CLI

```bash
npm install -g firebase-tools
```

### שלב 2: התחבר ל-Firebase

```bash
firebase login
```

### שלב 3: אתחל Functions

```bash
firebase init functions
```

כשתשאל:
- **Use an existing project?** → בחר את הפרויקט שלך (`shif-2430b`)
- **Language:** JavaScript
- **ESLint:** Yes (או No אם אתה לא רוצה)
- **Install dependencies:** Yes

### שלב 4: התקן dependencies

```bash
cd functions
npm install
cd ..
```

### שלב 5: Deploy את הפונקציה

```bash
firebase deploy --only functions
```

## הגדרת שעת שליחה:

הפונקציה כבר מוגדרת לרוץ כל יום ב-07:00. כדי לשנות:

1. פתח `functions/index.js`
2. מצא את השורה:
   ```javascript
   .schedule('0 7 * * *') // כל יום ב-07:00
   ```
3. שנה לפי הפורמט:
   - `0 7 * * *` = כל יום ב-07:00
   - `0 8 * * *` = כל יום ב-08:00
   - `30 6 * * *` = כל יום ב-06:30
   - `0 7 * * 1-5` = ימים ראשון-חמישי ב-07:00

4. Deploy מחדש:
   ```bash
   firebase deploy --only functions:sendDailyWhatsAppNotifications
   ```

## איך זה עובד בדף:

1. **הגדר שליחה אוטומטית:**
   - לך לדף "התראות WhatsApp"
   - סמן "שליחה אוטומטית יומית"
   - בחר שעה (למשל 07:00)
   - בחר עובדים
   - לחץ "שמור הגדרות"

2. **הפונקציה תרוץ כל יום:**
   - ב-07:00 (או השעה שבחרת)
   - תיצור קישורי WhatsApp
   - תשמור אותם ב-Firestore

3. **בדף תראה הודעה:**
   - "📱 קישורי WhatsApp מוכנים משליחה אוטומטית!"
   - כפתור "פתח X חלונות WhatsApp"
   - לחץ על הכפתור → כל החלונות יפתחו
   - פשוט לחץ "שלח" בכל חלון

## בדיקה:

1. **בדוק שהפונקציה deployed:**
   ```bash
   firebase functions:list
   ```

2. **בדוק לוגים:**
   ```bash
   firebase functions:log
   ```

3. **הרץ ידנית (לבדיקה):**
   - לך ל-Firebase Console → Functions
   - לחץ על הפונקציה
   - לחץ "Test" או "Trigger"

## עלויות:

- **Firebase Cloud Functions:** 
  - 2 מיליון קריאות חינם בחודש
  - אחרי זה: $0.40 לכל מיליון קריאות
  - Scheduled Functions נחשבות כקריאות רגילות

- **Firestore:**
  - 50,000 קריאות/כתיבות חינם ביום
  - אחרי זה: $0.06 לכל 100,000 קריאות

**לסיכום:** אם יש לך פחות מ-50,000 עובדים, זה יהיה חינם! 🎉

## פתרון בעיות:

### הפונקציה לא רצה:
1. בדוק שהפונקציה deployed: `firebase functions:list`
2. בדוק לוגים: `firebase functions:log`
3. ודא שההגדרות נשמרו ב-Firestore

### הקישורים לא מופיעים:
1. בדוק שההגדרות נשמרו (`autoSendEnabled: true`)
2. בדוק שיש משמרות היום
3. בדוק שיש עובדים שנבחרו
4. בדוק שהפונקציה רצה (בלוגים)

### שגיאות:
- בדוק את הלוגים ב-Firebase Console
- ודא שהפונקציה deployed בהצלחה
- ודא שיש הרשאות נכונות ב-Firestore

## הערות:

- הפונקציה רצה ב-Asia/Jerusalem timezone
- הקישורים נשמרים לפי תאריך (YYYY-MM-DD)
- כל מנהל יכול להגדיר שעה שונה
- הקישורים נשארים ב-Firestore עד שתפתח אותם

