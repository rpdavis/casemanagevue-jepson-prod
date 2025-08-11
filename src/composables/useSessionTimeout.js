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
    this.lastLogTime = null
    this.router = null
    this.unsubscribeSettings = null
    
    // Activity events to monitor (removed mousemove for performance)
    this.activityEvents = [
      'mousedown', 'keypress', 'scroll', 
      'touchstart', 'click', 'keydown'
    ]
    
    this.init()
  }

  init() {
    console.log('🔧 Session timeout system initialization STARTED')
    
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
      
      // Load settings once for better performance (instead of real-time listener)
      const settingsDoc = await getDoc(settingsRef)
      
      if (settingsDoc.exists()) {
        const data = settingsDoc.data()
        this.isEnabled.value = data.sessionTimeoutEnabled || false
        this.timeoutMinutes.value = data.sessionTimeoutMinutes || 30
        
        // Restart timeout with new settings if user is logged in
        if (auth.currentUser) {
          this.resetTimeout()
        }
      } else {
        // No settings document exists, use defaults
        this.isEnabled.value = false
        this.timeoutMinutes.value = 30
      }
      
      console.log(`🔧 Session timeout settings loaded: enabled=${this.isEnabled.value}, timeout=${this.timeoutMinutes.value}min`)
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
    // Create bound handler to ensure proper cleanup
    this.boundActivityHandler = this.handleActivity.bind(this)
    this.activityEvents.forEach(event => {
      document.addEventListener(event, this.boundActivityHandler, true)
    })
  }

  handleActivity() {
    if (!this.isEnabled.value) return
    
    const now = Date.now()
    
    // Throttle activity handling more aggressively for performance
    // Only reset timeout if it's been more than 60 seconds since last reset
    if (now - this.lastActivity < 60000) {
      this.lastActivity = now
      return
    }
    
    this.lastActivity = now
    
    // Only extend session if warning is showing
    if (this.showWarning.value) {
      this.hideWarning()
      this.resetTimeout()
    } else {
      // Just update last activity without resetting timeout constantly
      // This prevents the infinite loop while still tracking activity
    }
  }

  resetTimeout() {
    
    if (!this.isEnabled.value || !auth.currentUser) {
      return
    }
    
    // Clear existing timeouts
    this.clearTimeouts()
    
    const now = Date.now()
    const timeoutMs = Math.round(this.timeoutMinutes.value * 60 * 1000)
    const warningMs = Math.max(1000, timeoutMs - (2 * 60 * 1000)) // Show warning 2 minutes before timeout, minimum 1 second
    
    // Reduce console spam - only log every 5 minutes or when warning shows
    const shouldLog = !this.lastLogTime || (now - this.lastLogTime > 300000) || this.showWarning.value
    if (shouldLog) {
      console.log(`🔒 Session timeout reset: ${this.timeoutMinutes.value} minutes (${timeoutMs}ms), warning in ${warningMs}ms`)
      this.lastLogTime = now
    }
    
    // Set warning timeout - always set if timeout is more than 10 seconds
    if (timeoutMs > 10000) {
      this.warningTimeoutId = setTimeout(() => {
        console.log('🚨 Showing session warning')
        this.showSessionWarning()
      }, warningMs)
    }
    
    // Set logout timeout
    this.timeoutId = setTimeout(() => {
      console.log('⏰ Session timeout triggered')
      this.handleSessionTimeout()
    }, timeoutMs)
  }

  showSessionWarning() {
    if (this.showWarning.value) return // Prevent multiple warnings
    
    this.showWarning.value = true
    this.warningCountdown.value = Math.min(120, Math.floor(this.timeoutMinutes.value * 60 / 2)) // 2 minutes or half the timeout, whichever is smaller
    
    console.log(`🚨 Session warning displayed, countdown: ${this.warningCountdown.value} seconds`)
    
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
    
    console.log('🔒 Handling session timeout')
    
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
      console.log('🚨 SESSION TIMEOUT LOGOUT: About to call signOut()')
      console.log('🔍 Session timeout stack trace:', new Error().stack)
      await signOut(auth)
      
      console.log('🚪 User signed out due to session timeout')
      
      // Redirect to login - let the auth guard handle the redirect
      if (this.router) {
        this.router.push('/login')
      } else {
        window.location.href = '/login'
      }
      
    } catch (error) {
      console.error('Error during session timeout:', error)
      // Force redirect even if there's an error
      window.location.href = '/login'
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
    
    // Remove activity listeners using the bound handler
    if (this.boundActivityHandler) {
      this.activityEvents.forEach(event => {
        document.removeEventListener(event, this.boundActivityHandler, true)
      })
    }
    
    // Settings loaded once, no unsubscribe needed
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