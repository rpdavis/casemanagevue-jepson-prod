import { auth } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'

// Track connection state
let isReconnecting = false

// Handle Firebase connection errors
export async function handleFirebaseError(error) {
  console.error('Firebase error:', error)

  // If already trying to reconnect, don't start another attempt
  if (isReconnecting) {
    return
  }

  isReconnecting = true

  try {
    // Get current user
    const user = auth.currentUser

    if (user) {
      // Force token refresh
      await user.getIdToken(true)
      
      console.log('🔄 Firebase token refreshed successfully')
    } else {
      console.log('⚠️ No user signed in, redirecting to login...')
      // Redirect to login page
      window.location.href = '/login'
    }
  } catch (refreshError) {
    console.error('Failed to refresh token:', refreshError)
    // Redirect to login page on failure
    window.location.href = '/login'
  } finally {
    isReconnecting = false
  }
}

// Set up auth state listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, refresh token periodically
    setInterval(async () => {
      try {
        await user.getIdToken(true)
        console.log('🔄 Token refreshed automatically')
      } catch (error) {
        console.error('Failed to refresh token:', error)
      }
    }, 30 * 60 * 1000) // Refresh every 30 minutes
  }
})

export function isFirebaseError(error) {
  return error?.message?.includes('firestore.googleapis.com') ||
         error?.message?.includes('firebase') ||
         error?.code?.includes('permission-denied')
} 