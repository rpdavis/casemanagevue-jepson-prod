// src/guards/guardPage.js
import { auth, db } from '@/firebase'
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { USER_ROLES } from '@/config/roles' // adjust this path to wherever your roles live

export async function guardPage(allowedRoles, router, next) {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      return router.push('/login')
    }

    try {
      await getIdTokenResult(firebaseUser, true)
    } catch (err) {
      console.error('❌ Error refreshing ID token:', err)
    }

    const udoc = await getDoc(doc(db, 'users', firebaseUser.uid))
    if (!udoc.exists()) {
      alert('User not found')
      return router.push('/login')
    }

    const data = udoc.data()
    if (!allowedRoles.includes(data.role)) {
      alert('No permission')
      return router.push('/login')
    }

    // Save user globally if needed
    sessionStorage.setItem('googleAccessToken', auth.currentUser?.stsTokenManager?.accessToken)

    // Call `next()` to allow routing
    next()
  })
}
