// src/store/authStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, getIdToken } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useRouter } from 'vue-router'
import { auditLogger } from '@/utils/auditLogger'

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
      // Log logout before clearing user data
      if (currentUser.value) {
        await auditLogger.logSystemAccess('logout', {
          userRole: currentUser.value.role,
          success: true
        })
      }
      
      await signOut(auth)
      currentUser.value = null
      router.push('/login')
    } catch (error) {
      console.error('❌ Logout error:', error)
      
      // Log logout error
      await auditLogger.logSystemAccess('logout_error', {
        error: error.message,
        success: false
      })
    }
  }

  // Set user manually (for debugging/testing)
  const setUser = (user) => {
    currentUser.value = user
  }

  // Force refresh user token
  const refreshToken = async () => {
    if (auth.currentUser) {
      try {
        await getIdToken(auth.currentUser, true)
        console.log('✅ Token refreshed successfully')
        return true
      } catch (error) {
        console.error('❌ Error refreshing token:', error)
        return false
      }
    }
    return false
  }

  // Computed property for user
  const user = computed(() => currentUser.value)

  // Initialize auth state when store is created
  initAuth()

  return { 
    currentUser, 
    user,
    errorMsg, 
    isLoading,
    loginWithGoogle, 
    logout,
    setUser,
    refreshToken
  }
})
