import { createContext, useContext, useState, useEffect } from 'react'
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signOut as firebaseSignOut 
} from 'firebase/auth'
import { 
  getFirestore, 
  doc, 
  getDoc, 
  query, 
  where, 
  getDocs, 
  collection 
} from 'firebase/firestore'
import { initFirebase, getAppId } from '../api/firebase'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [auth, setAuth] = useState(null)
  const [db, setDb] = useState(null)

  useEffect(() => {
    async function initialize() {
      try {
        const { auth: authInstance, db: dbInstance } = await initFirebase()
        
        if (!authInstance || !dbInstance) {
          throw new Error('Firebase initialization failed')
        }
        
        setAuth(authInstance)
        setDb(dbInstance)

        // Listen to auth state changes
        const unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser) => {
          if (firebaseUser) {
            try {
              await loadUserData(firebaseUser.uid, dbInstance)
            } catch (userError) {
              console.error('Error loading user data:', userError)
              // Set anonymous user if can't load user data
              setUser({
                uid: firebaseUser.uid,
                role: 'anonymous'
              })
            }
          } else {
            // No user, set to null so login screen shows
            setUser(null)
          }
          setLoading(false)
        })

        // Set loading to false immediately if no user is logged in
        // (onAuthStateChanged will fire immediately with null if no user)
        if (!authInstance.currentUser) {
          setLoading(false)
        }

        return () => unsubscribe()
      } catch (error) {
        console.error('Initialization error:', error)
        // Set loading to false even on error so app can render
        setUser(null)
        setAuth(null)
        setDb(null)
        setLoading(false)
      }
    }

    initialize()
  }, [])

  async function loadUserData(uid, dbInstance) {
    try {
      // Find user in employees collection by Firebase Auth UID
      const appId = getAppId()
      const employeesRef = collection(dbInstance, `artifacts/${appId}/employees`)
      const employeesQuery = query(employeesRef, where('firebaseUid', '==', uid))
      const employeesSnapshot = await getDocs(employeesQuery)

      if (!employeesSnapshot.empty) {
        const userDoc = employeesSnapshot.docs[0]
        const userData = userDoc.data()
        setUser({
          id: userDoc.id,
          uid,
          ...userData
        })
        return
      }

      // If not found, set anonymous user
      setUser({
        uid,
        role: 'anonymous'
      })
    } catch (error) {
      console.error('Error loading user data:', error)
      // On error, set anonymous user so app can continue
      setUser({
        uid,
        role: 'anonymous'
      })
      // Don't throw - let the app continue
    }
  }

  async function login(email, password) {
    if (!db || !auth) {
      throw new Error('Firebase not initialized')
    }

    try {
      // Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      // Load user data from Firestore
      const appId = getAppId()
      const employeesRef = collection(db, `artifacts/${appId}/employees`)
      const employeesQuery = query(employeesRef, where('firebaseUid', '==', firebaseUser.uid))
      const snapshot = await getDocs(employeesQuery)

      if (snapshot.empty) {
        // User exists in Firebase Auth but not in Firestore - sign out
        await firebaseSignOut(auth)
        throw new Error('משתמש לא נמצא במערכת. אנא פנה למנהל.')
      }

      const userDoc = snapshot.docs[0]
      const userData = userDoc.data()

      if (!userData.isActive) {
        await firebaseSignOut(auth)
        throw new Error('חשבון זה אינו פעיל')
      }

      // Check if email is verified (optional - can be enforced)
      if (firebaseUser.emailVerified === false && userData.role === 'worker') {
        // Allow login but show warning - or enforce verification
        console.warn('Email not verified for worker')
      }

      // Store user data in context (loadUserData will be called by onAuthStateChanged)
      setUser({
        id: userDoc.id,
        uid: firebaseUser.uid,
        emailVerified: firebaseUser.emailVerified,
        ...userData
      })

      return userData
    } catch (error) {
      console.error('Login error:', error)
      // Translate Firebase errors to Hebrew
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('אימייל או סיסמה שגויים')
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('אימייל לא תקין')
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('יותר מדי ניסיונות. אנא נסה שוב מאוחר יותר.')
      }
      throw error
    }
  }

  async function signOut() {
    try {
      if (auth) {
        await firebaseSignOut(auth)
      }
      setUser(null)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  const value = {
    user,
    login,
    signOut,
    loading,
    auth,
    db
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

