// src/store/authStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref(null)
  const errorMsg = ref('')
  const router = useRouter()

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

  return { currentUser, errorMsg, loginWithGoogle }
})
