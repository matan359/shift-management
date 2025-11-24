// סקריפט ליצירת משתמש admin
// הרץ את זה בקונסול של הדפדפן (F12) אחרי שהאפליקציה נטענה

async function createAdminUser() {
  try {
    // ייבוא Firebase SDKs
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js')
    const { getAuth, createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js')
    const { getFirestore, collection, addDoc, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js')
    
    const firebaseConfig = {
      apiKey: "AIzaSyBJMOoT-m-TyiSVzCJcin60A5pog464NeU",
      authDomain: "shif-2430b.firebaseapp.com",
      projectId: "shif-2430b",
      storageBucket: "shif-2430b.firebasestorage.app",
      messagingSenderId: "904069677490",
      appId: "1:904069677490:web:3bb0123baaad6e620424ab"
    }
    
    const app = initializeApp(firebaseConfig)
    const auth = getAuth(app)
    const db = getFirestore(app)
    
    // פרטי משתמש admin
    const adminEmail = 'admin@example.com' // שנה את זה לאימייל שאתה רוצה
    const adminPassword = 'admin123456' // שנה את זה לסיסמה חזקה
    const adminName = 'מנהל ראשי'
    
    console.log('יוצר משתמש admin...')
    
    // בדוק אם כבר קיימים משתמשים
    const appId = 'shift-management-app'
    const employeesRef = collection(db, `artifacts/${appId}/employees`)
    const snapshot = await getDocs(employeesRef)
    
    if (!snapshot.empty) {
      console.warn('⚠️ כבר קיימים משתמשים במערכת. אם אתה רוצה ליצור admin נוסף, שנה את האימייל.')
    }
    
    // צור משתמש ב-Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword)
    const firebaseUser = userCredential.user
    
    console.log('✅ משתמש נוצר ב-Firebase Auth:', firebaseUser.uid)
    
    // צור משתמש ב-Firestore
    const adminData = {
      fullName: adminName,
      email: adminEmail,
      phoneNumber: '',
      role: 'manager',
      defaultShiftStart: '08:00',
      minShiftsPerWeek: 6,
      isActive: true,
      firebaseUid: firebaseUser.uid,
      createdAt: new Date().toISOString()
    }
    
    const docRef = await addDoc(employeesRef, adminData)
    
    console.log('✅ משתמש admin נוצר בהצלחה!')
    console.log('📧 אימייל:', adminEmail)
    console.log('🔑 סיסמה:', adminPassword)
    console.log('👤 שם:', adminName)
    console.log('🆔 Document ID:', docRef.id)
    console.log('🆔 Firebase UID:', firebaseUser.uid)
    
    return {
      email: adminEmail,
      password: adminPassword,
      name: adminName,
      docId: docRef.id,
      firebaseUid: firebaseUser.uid
    }
  } catch (error) {
    console.error('❌ שגיאה ביצירת משתמש:', error)
    if (error.code === 'auth/email-already-in-use') {
      console.error('⚠️ האימייל כבר קיים במערכת. נסה אימייל אחר.')
    } else if (error.code === 'auth/weak-password') {
      console.error('⚠️ הסיסמה חלשה מדי. השתמש בסיסמה של לפחות 6 תווים.')
    } else if (error.code === 'auth/invalid-email') {
      console.error('⚠️ האימייל לא תקין.')
    }
    throw error
  }
}

// הרץ את הפונקציה
createAdminUser()
  .then(result => {
    console.log('🎉 הצלחה! פרטי הכניסה:')
    console.table(result)
    alert(`משתמש admin נוצר בהצלחה!\nאימייל: ${result.email}\nסיסמה: ${result.password}`)
  })
  .catch(error => {
    console.error('שגיאה:', error)
    alert('שגיאה ביצירת משתמש: ' + error.message)
  })






