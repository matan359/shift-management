import { createContext, useContext, useState, useEffect } from 'react'
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken,
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
        setAuth(authInstance)
        setDb(dbInstance)

        // Try to restore user session
        const currentUser = authInstance.currentUser
        if (currentUser) {
          try {
            await loadUserData(currentUser.uid, dbInstance)
          } catch (userError) {
            console.error('Error loading user data:', userError)
            // Set anonymous user if can't load user data
            setUser({
              uid: currentUser.uid,
              role: 'anonymous'
            })
          }
        } else {
          // No user, set to null so login screen shows
          setUser(null)
        }
      } catch (error) {
        console.error('Initialization error:', error)
        // Set loading to false even on error so app can render
        setUser(null)
      } finally {
        // Always set loading to false
        setLoading(false)
      }
    }

    initialize()
  }, [])

  async function loadUserData(uid, dbInstance) {
    try {
      // Try to find user in employees collection
      const appId = getAppId()
      const employeesRef = collection(dbInstance, `artifacts/${appId}/users/${uid}/employees`)
      // Note: This is a simplified lookup - in production, you'd have a better user mapping
      const employeesSnapshot = await getDocs(employeesRef)

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

  async function login(username, password) {
    if (!db || !auth) {
      throw new Error('Firebase not initialized')
    }

    try {
      // Search for user in employees collection
      const appId = getAppId()
      const userId = auth.currentUser?.uid
      if (!userId) throw new Error('User not authenticated')
      
      const employeesRef = collection(db, `artifacts/${appId}/users/${userId}/employees`)
      const employeesQuery = query(employeesRef, where('username', '==', username))
      const snapshot = await getDocs(employeesQuery)

      if (snapshot.empty) {
        throw new Error('שם משתמש או סיסמה שגויים')
      }

      const userDoc = snapshot.docs[0]
      const userData = userDoc.data()

      // Simple password check (in production, use proper hashing)
      if (userData.passwordHash !== password) {
        throw new Error('שם משתמש או סיסמה שגויים')
      }

      if (!userData.isActive) {
        throw new Error('חשבון זה אינו פעיל')
      }

      // Sign in anonymously and store user data
      await signInAnonymously(auth)
      const currentUser = auth.currentUser

      // Store user data in context
      setUser({
        id: userDoc.id,
        uid: currentUser.uid,
        ...userData
      })

      return userData
    } catch (error) {
      console.error('Login error:', error)
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

