# מדריך חיבור Meta WhatsApp Cloud API - מספר 15558458271

## 🎯 שלב 1: אישור המספר (חשוב!)

המספר שלך נמצא בסטטוס "בהמתנה" - צריך לאשר אותו:

1. **לך ל-Meta Business Suite:**
   - https://business.facebook.com
   - היכנס לחשבון שלך

2. **לך ל-WhatsApp Manager:**
   - בתפריט השמאלי, לחץ על **"WhatsApp"** → **"WhatsApp Manager"**
   - או ישירות: https://business.facebook.com/wa/manage/home/

3. **אשר את המספר:**
   - לחץ על המספר **15558458271**
   - לחץ על **"אישור"** (Verification)
   - עקוב אחר ההוראות - תצטרך:
     - להזין קוד SMS שיישלח למספר
     - או לאשר דרך אימייל

4. **הגדר שם תצוגה:**
   - שם תצוגה: **"בלנדר נייד"** (או כל שם אחר)
   - זה השם שיראו הלקוחות כשתשלח הודעות

---

## 📋 שלב 2: קבל Access Token

1. **לך ל-Meta Developers:**
   - https://developers.facebook.com
   - היכנס עם אותו חשבון Facebook

2. **בחר את ה-App שלך:**
   - לחץ על **"My Apps"**
   - בחר את ה-App שיצרת (או צור חדש)

3. **הוסף WhatsApp Product (אם עדיין לא):**
   - בדף ה-App, לחץ **"Add Product"**
   - מצא **"WhatsApp"** ולחץ **"Set Up"**
   - בחר **"Cloud API"** (החינמי)
   - לחץ **"Next"**

4. **קבל Access Token:**
   - לך ל-**"WhatsApp"** → **"API Setup"**
   - תחת **"Temporary access token"**, לחץ **"Generate"**
   - **העתק את ה-Token** (זה חשוב! שמור אותו)

5. **צור Permanent Token (מומלץ):**
   - Temporary Token תקף רק ל-24 שעות
   - לך ל-**"WhatsApp"** → **"API Setup"** → **"Create Permanent Token"**
   - בחר את ה-System User או צור חדש
   - העתק את ה-Permanent Token

---

## 📋 שלב 3: קבל Phone Number ID

1. **בדף WhatsApp API Setup:**
   - תחת **"Phone number ID"**
   - **העתק את ה-ID** (מספר ארוך, למשל: 123456789012345)

---

## 📋 שלב 4: קבל WhatsApp Business Account ID

1. **לך ל-WhatsApp → Getting Started:**
   - תחת **"WhatsApp Business Account ID"**
   - **העתק את ה-ID**

---

## 📋 שלב 5: הגדר משתני סביבה ב-Netlify

1. **לך ל-Netlify Dashboard:**
   - https://app.netlify.com
   - בחר את הפרויקט שלך

2. **לך ל-Site settings → Environment variables:**
   - לחץ על **"Add variable"**

3. **הוסף את המשתנים הבאים:**

   ```
   WHATSAPP_ACCESS_TOKEN = <הדבק את ה-Access Token כאן>
   WHATSAPP_PHONE_NUMBER_ID = <הדבק את ה-Phone Number ID כאן>
   WHATSAPP_BUSINESS_ACCOUNT_ID = <הדבק את ה-Business Account ID כאן>
   ```

4. **שמור:**
   - לחץ **"Save"**
   - **הפעל מחדש את הפונקציות** (Redeploy)

---

## 📋 שלב 6: עדכן את הקוד (אופציונלי)

אם אתה רוצה להשתמש ב-Meta במקום Twilio:

1. **עדכן את `src/pages/ManageNotifications.jsx`:**
   - שנה את ה-URL מ-`/.netlify/functions/whatsapp-send-bulk`
   - ל-`/.netlify/functions/whatsapp-send-bulk-meta`

2. **או השאר את שניהם:**
   - המערכת תוכל להשתמש גם ב-Twilio וגם ב-Meta
   - פשוט שנה את ה-URL בדף ההתראות

---

## ✅ בדיקה

1. **בדוק שהמספר מאושר:**
   - לך ל-WhatsApp Manager
   - ודא שהמספר 15558458271 בסטטוס **"מאושר"** (לא "בהמתנה")

2. **בדוק את הפונקציות:**
   - לך ל-Netlify → Functions
   - ודא ש-`whatsapp-send-meta` ו-`whatsapp-send-bulk-meta` קיימות

3. **נסה לשלוח הודעה:**
   - לך לדף "ניהול התראות" במערכת
   - נסה לשלוח הודעה לעובד

---

## 🔧 פתרון בעיות

### שגיאה: "Phone number not verified"
- **פתרון:** המספר עדיין לא מאושר. לך ל-WhatsApp Manager ואשר אותו.

### שגיאה: "Invalid access token"
- **פתרון:** ה-Token פג תוקף (אם זה Temporary). צור Permanent Token.

### שגיאה: "Rate limit exceeded"
- **פתרון:** Meta מגביל ל-1000 הודעות בחודש בחינם. אחרי זה יש תשלום.

### שגיאה: "Recipient phone number not in allowed list"
- **פתרון:** במצב Sandbox, צריך להוסיף את מספרי הטלפון לרשימת מורשים.
- לך ל-WhatsApp → API Setup → Add phone number

---

## 💡 הערות חשובות

1. **1000 הודעות חינם בחודש** - אחרי זה יש תשלום לפי הודעה
2. **24 שעות חלון** - אפשר לשלוח הודעות רק ללקוחות שענו לך ב-24 שעות האחרונות (אלא אם יש Template Message)
3. **Template Messages** - להודעות ראשונות, צריך ליצור Template ב-WhatsApp Manager
4. **Permanent Token** - מומלץ ליצור Permanent Token במקום Temporary

---

## 🎉 מוכן!

עכשיו המערכת יכולה לשלוח הודעות דרך Meta WhatsApp Cloud API!

**מספר הטלפון:** 15558458271  
**שם תצוגה:** בלנדר נייד


