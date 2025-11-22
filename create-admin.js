// Script to create first admin user
// Run this in browser console after Firebase is initialized

// Copy and paste this into browser console (F12) when you're on the login page:

async function createFirstAdmin() {
  try {
    const { getFirestore, collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js')
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js')
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js')
    
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
    
    // Sign in anonymously first
    const { signInAnonymously } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js')
    await signInAnonymously(auth)
    
    const userId = auth.currentUser.uid
    const appId = 'shift-management-app'
    
    // Create admin user
    const adminData = {
      fullName: 'מנהל ראשי',
      username: 'admin',
      passwordHash: 'admin123', // Change this!
      phoneNumber: '',
      role: 'manager',
      defaultShiftStart: '08:00',
      minShiftsPerWeek: 6,
      isActive: true,
      __uid: userId
    }
    
    const employeesRef = collection(db, `artifacts/${appId}/users/${userId}/employees`)
    const docRef = await addDoc(employeesRef, adminData)
    
    console.log('✅ משתמש מנהל נוצר בהצלחה!')
    console.log('שם משתמש: admin')
    console.log('סיסמה: admin123')
    console.log('User ID:', docRef.id)
    
    return { username: 'admin', password: 'admin123' }
  } catch (error) {
    console.error('❌ שגיאה ביצירת משתמש:', error)
    throw error
  }
}

// Run: createFirstAdmin()

