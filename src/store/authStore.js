// src/store/authStore.js
import { defineStore } from 'pinia'
import { ref, onMounted } from 'vue'
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref(null)
  const errorMsg = ref('')
  const isLoading = ref(true)
  const router = useRouter()

  // Initialize auth state listener
  const initAuth = () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      isLoading.value = true
      
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (userDoc.exists()) {
            currentUser.value = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              ...userDoc.data()
            }
            console.log('✅ User authenticated:', currentUser.value)
          } else {
            console.log('⚠️ User not found in Firestore')
            currentUser.value = null
          }
        } catch (error) {
          console.error('❌ Error fetching user data:', error)
          currentUser.value = null
        }
      } else {
        currentUser.value = null
        console.log('👤 No user authenticated')
      }
      
      isLoading.value = false
    })
  }

  const loginWithGoogle = async () => {
    errorMsg.value = ''
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (!userDoc.exists()) {
        errorMsg.value = '⚠️ User not found in system.'
        return
      }

      currentUser.value = {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        ...userDoc.data()
      }

      router.push('/')
    } catch (err) {
      console.error('❌ Login error:', err)
      errorMsg.value = err.message || 'Authentication failed.'
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      currentUser.value = null
      router.push('/login')
    } catch (error) {
      console.error('❌ Logout error:', error)
    }
  }

  // Initialize auth state when store is created
  initAuth()

  return { 
    currentUser, 
    errorMsg, 
    isLoading,
    loginWithGoogle, 
    logout 
  }
})
