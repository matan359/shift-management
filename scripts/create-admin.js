// סקריפט ליצירת משתמש admin
// הרץ: node scripts/create-admin.js

import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore'

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

// פרטי משתמש admin - שנה את זה!
const adminEmail = 'admin@example.com'
const adminPassword = 'admin123456'
const adminName = 'מנהל ראשי'

async function createAdmin() {
  try {
    console.log('🚀 מתחיל ליצור משתמש admin...')
    
    const appId = 'shift-management-app'
    const employeesRef = collection(db, `artifacts/${appId}/employees`)
    
    // בדוק אם כבר קיימים משתמשים
    const snapshot = await getDocs(employeesRef)
    if (!snapshot.empty) {
      console.log('⚠️  כבר קיימים משתמשים במערכת:', snapshot.size)
    }
    
    // צור משתמש ב-Firebase Authentication
    console.log('📧 יוצר משתמש ב-Firebase Auth...')
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword)
    const firebaseUser = userCredential.user
    console.log('✅ משתמש נוצר ב-Firebase Auth:', firebaseUser.uid)
    
    // צור משתמש ב-Firestore
    console.log('💾 שומר ב-Firestore...')
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
    
    console.log('\n🎉 משתמש admin נוצר בהצלחה!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 אימייל:', adminEmail)
    console.log('🔑 סיסמה:', adminPassword)
    console.log('👤 שם:', adminName)
    console.log('🆔 Document ID:', docRef.id)
    console.log('🆔 Firebase UID:', firebaseUser.uid)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    process.exit(0)
  } catch (error) {
    console.error('\n❌ שגיאה ביצירת משתמש:', error.message)
    if (error.code === 'auth/email-already-in-use') {
      console.error('⚠️  האימייל כבר קיים במערכת. נסה אימייל אחר.')
    } else if (error.code === 'auth/weak-password') {
      console.error('⚠️  הסיסמה חלשה מדי. השתמש בסיסמה של לפחות 6 תווים.')
    } else if (error.code === 'auth/invalid-email') {
      console.error('⚠️  האימייל לא תקין.')
    }
    process.exit(1)
  }
}

createAdmin()

