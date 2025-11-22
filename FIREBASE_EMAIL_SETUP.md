# הגדרת אימות אימייל ב-Firebase

## שלב 1: הפעלת Email/Password Authentication

1. היכנס ל-[Firebase Console](https://console.firebase.google.com/)
2. בחר את הפרויקט שלך: `shif-2430b`
3. לך ל-**Authentication** > **Sign-in method**
4. לחץ על **Email/Password**
5. הפעל את **Email/Password** (Enable)
6. **חשוב:** הפעל גם את **Email link (passwordless sign-in)** אם תרצה (אופציונלי)

## שלב 2: הגדרת Email Templates

1. ב-**Authentication** > **Templates**
2. בחר **Email address verification**
3. התאם את התבנית:

### Sender name
```
בייגל קפה רמת אשכול
```

### From
```
noreply@shif-2430b.firebaseapp.com
```

### Reply to
```
noreply@shif-2430b.firebaseapp.com
```

### Subject
```
אמת את האימייל שלך עבור בייגל קפה רמת אשכול
```

### Message (HTML)
```html
שלום %DISPLAY_NAME%,

לחץ על הקישור הבא כדי לאמת את כתובת האימייל שלך:

<a href="%LINK%">אמת אימייל</a>

או העתק את הקישור הבא לדפדפן:
%LINK%

אם לא ביקשת לאמת כתובת זו, תוכל להתעלם מהאימייל הזה.

תודה,
צוות בייגל קפה רמת אשכול
```

### Message (Plain text)
```
שלום %DISPLAY_NAME%,

עקוב אחר הקישור הזה כדי לאמת את כתובת האימייל שלך:

%LINK%

אם לא ביקשת לאמת כתובת זו, תוכל להתעלם מהאימייל הזה.

תודה,
צוות בייגל קפה רמת אשכול
```

## שלב 3: הגדרת SMTP (אופציונלי - לשיפור)

אם תרצה לשלוח אימיילים דרך SMTP שלך (Gmail, Outlook, וכו'):

1. ב-**Authentication** > **Settings** > **SMTP settings**
2. הגדר את פרטי ה-SMTP שלך
3. זה ישפר את אמינות משלוח האימיילים

## שלב 4: בדיקה

1. נסה ליצור משתמש חדש דרך דף ההרשמה
2. בדוק את תיבת הדואר הנכנס
3. לחץ על הקישור באימייל
4. נסה להתחבר עם המשתמש החדש

## הערות חשובות:

- ✅ אימות אימייל נשלח אוטומטית בעת הרשמה
- ✅ המשתמש יכול להתחבר גם לפני אימות האימייל (אבל יקבל אזהרה)
- ✅ ניתן לאכוף אימות אימייל לפני כניסה (דורש שינוי בקוד)
- ✅ התבניות ניתנות להתאמה אישית

## אכיפת אימות אימייל (אופציונלי)

אם תרצה לאכוף אימות אימייל לפני כניסה, עדכן את `src/contexts/AuthContext.jsx`:

```javascript
// Check if email is verified
if (!firebaseUser.emailVerified) {
  await firebaseSignOut(auth)
  throw new Error('נא לאמת את האימייל שלך לפני הכניסה. בדוק את תיבת הדואר.')
}
```

