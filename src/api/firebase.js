import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Global variables - should be set by the environment or configuration
const __app_id = 'shift-management-app'
const __firebase_config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBJMOoT-m-TyiSVzCJcin60A5pog464NeU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "shif-2430b.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "shif-2430b",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "shif-2430b.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "904069677490",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:904069677490:web:3bb0123baaad6e620424ab",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-1X0L6W5D2E"
}
const __initial_auth_token = null

let app = null
let auth = null
let db = null

export async function initFirebase() {
  if (app && auth && db) {
    return { app, auth, db }
  }

  try {
    app = initializeApp(__firebase_config)
    auth = getAuth(app)
    db = getFirestore(app)

    // Don't sign in automatically - let user login with email/password
    console.log('Firebase initialized')

    return { app, auth, db, appId: __app_id, userId: auth.currentUser?.uid }
  } catch (error) {
    console.error('Firebase initialization error:', error)
    // Return what we have even if there's an error
    if (app && auth && db) {
      return { app, auth, db, appId: __app_id, userId: null }
    }
    throw error
  }
}

export function getFirebaseApp() {
  return app
}

export function getFirebaseAuth() {
  return auth
}

export function getFirebaseDb() {
  return db
}

export function getAppId() {
  return __app_id
}

