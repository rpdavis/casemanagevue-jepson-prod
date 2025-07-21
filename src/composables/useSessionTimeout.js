import { ref, watch } from 'vue'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import { useRouter } from 'vue-router'

class SessionTimeoutManager {
  constructor() {
    this.timeoutId = null
    this.warningTimeoutId = null
    this.isEnabled = ref(false)
    this.timeoutMinutes = ref(30)
    this.showWarning = ref(false)
    this.warningCountdown = ref(0)
    this.lastActivity = Date.now()
    this.router = null
    this.unsubscribeSettings = null
    
    // Activity events to monitor
    this.activityEvents = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 
      'touchstart', 'click', 'keydown'
    ]
    
    this.init()
  }

  init() {
    // Listen for settings changes from Firestore
    this.loadSettings()
    
    // Set up activity listeners
    this.setupActivityListeners()
    
    // Watch for auth state changes
    this.setupAuthWatcher()
  }

  setupAuthWatcher() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // Start timeout when user logs in
        setTimeout(() => {
          this.resetTimeout()
        }, 1000) // Small delay to ensure settings are loaded
      } else {
        // Clear timeouts when user logs out
        this.clearTimeouts()
        this.hideWarning()
      }
    })
  }

  async loadSettings() {
    try {
      const settingsRef = doc(db, 'app_settings', 'security')
      
      // Listen for real-time changes to security settings
      this.unsubscribeSettings = onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data()
          const wasEnabled = this.isEnabled.value
          this.isEnabled.value = data.sessionTimeoutEnabled || false
          this.timeoutMinutes.value = data.sessionTimeoutMinutes || 30
          
          // Restart timeout with new settings if user is logged in
          if (auth.currentUser) {
            this.resetTimeout()
          }
        } else {
          // No settings document exists, create default
          this.isEnabled.value = false
          this.timeoutMinutes.value = 30
        }
      })
    } catch (error) {
      console.error('Failed to load session timeout settings:', error)
    }
  }

  async updateSettings(enabled, minutes) {
    try {
      const settingsRef = doc(db, 'app_settings', 'security')
      await setDoc(settingsRef, {
        sessionTimeoutEnabled: enabled,
        sessionTimeoutMinutes: minutes,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.uid
      }, { merge: true })
      
    } catch (error) {
      console.error('Failed to update session timeout settings:', error)
    }
  }

  setupActivityListeners() {
    this.activityEvents.forEach(event => {
      document.addEventListener(event, this.handleActivity.bind(this), true)
    })
  }

  handleActivity() {
    if (!this.isEnabled.value) return
    
    this.lastActivity = Date.now()
    this.hideWarning()
    this.resetTimeout()
  }

  resetTimeout() {
    if (!this.isEnabled.value || !auth.currentUser) {
      return
    }
    
    // Clear existing timeouts
    this.clearTimeouts()
    
    const now = Date.now()
    const timeoutMs = Math.round(this.timeoutMinutes.value * 60 * 1000)
    const warningMs = Math.max(0, timeoutMs - (2 * 60 * 1000)) // Show warning 2 minutes before timeout, or immediately if timeout is < 2 minutes
    
    // Set warning timeout
    if (warningMs > 0 && warningMs < timeoutMs) {
      this.warningTimeoutId = setTimeout(() => {
        this.showSessionWarning()
      }, warningMs)
    } else {
      // Warning will show immediately when timeout starts
    }
    
    // Set logout timeout
    this.timeoutId = setTimeout(() => {
      this.handleSessionTimeout()
    }, timeoutMs)
    
  }

  showSessionWarning() {
    this.showWarning.value = true
    this.warningCountdown.value = 120 // 2 minutes in seconds
    
    // Start countdown
    const countdownInterval = setInterval(() => {
      this.warningCountdown.value--
      
      if (this.warningCountdown.value <= 0) {
        clearInterval(countdownInterval)
        this.handleSessionTimeout()
      }
    }, 1000)
    
    // Store interval ID for cleanup
    this.countdownInterval = countdownInterval
  }

  hideWarning() {
    this.showWarning.value = false
    this.warningCountdown.value = 0
    
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval)
      this.countdownInterval = null
    }
  }

  async handleSessionTimeout() {
    
    try {
      // Log the session timeout event
      if (auth.currentUser) {
        const logRef = doc(db, 'auditLogs', `timeout_${Date.now()}_${auth.currentUser.uid}`)
        await setDoc(logRef, {
          type: 'session_timeout',
          userId: auth.currentUser.uid,
          userEmail: auth.currentUser.email,
          timeoutMinutes: this.timeoutMinutes.value,
          lastActivity: new Date(this.lastActivity),
          timestamp: new Date(),
          userAgent: navigator.userAgent
        })
      }
      
      // Clear timeouts and hide warning
      this.clearTimeouts()
      this.hideWarning()
      
      // Sign out user
      await signOut(auth)
      
      // Show notification and redirect
      alert(`Your session has expired after ${this.timeoutMinutes.value} minutes of inactivity. Please log in again.`)
      
      if (this.router) {
        this.router.push('/login')
      } else {
        window.location.href = '/login'
      }
      
    } catch (error) {
      console.error('Error during session timeout:', error)
    }
  }

  extendSession() {
    this.hideWarning()
    this.resetTimeout()
  }

  clearTimeouts() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId)
      this.warningTimeoutId = null
    }
  }

  setRouter(router) {
    this.router = router
  }

  destroy() {
    this.clearTimeouts()
    this.hideWarning()
    
    // Remove activity listeners
    this.activityEvents.forEach(event => {
      document.removeEventListener(event, this.handleActivity.bind(this), true)
    })
    
    // Unsubscribe from settings changes
    if (this.unsubscribeSettings) {
      this.unsubscribeSettings()
    }
  }
}

// Create singleton instance
const sessionTimeoutManager = new SessionTimeoutManager()

export function useSessionTimeout() {
  const router = useRouter()
  sessionTimeoutManager.setRouter(router)
  
  return {
    isEnabled: sessionTimeoutManager.isEnabled,
    timeoutMinutes: sessionTimeoutManager.timeoutMinutes,
    showWarning: sessionTimeoutManager.showWarning,
    warningCountdown: sessionTimeoutManager.warningCountdown,
    updateSettings: sessionTimeoutManager.updateSettings.bind(sessionTimeoutManager),
    extendSession: sessionTimeoutManager.extendSession.bind(sessionTimeoutManager),
    resetTimeout: sessionTimeoutManager.resetTimeout.bind(sessionTimeoutManager)
  }
} 