<template>
  <div v-if="showWarning" class="session-timeout-overlay">
    <div class="session-timeout-dialog">
      <div class="dialog-header">
        <Clock class="header-icon" :size="24" />
        <h3>Session Timeout</h3>
      </div>
      
      <div class="dialog-content">
        <div class="countdown-section">
          <div class="countdown-time">{{ formatTime(warningCountdown) }}</div>
          <p class="countdown-label">until automatic logout</p>
        </div>
        
        <div class="info-note">
          <Info :size="16" />
          <span>Any activity will extend your session</span>
        </div>
      </div>
      
      <div class="dialog-actions">
        <button @click="extendSession" class="btn btn-primary">
          <RotateCcw :size="16" />
          Stay Logged In
        </button>
        <button @click="logoutNow" class="btn btn-secondary">
          <LogOut :size="16" />
          Logout Now
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { signOut } from 'firebase/auth'
import { auth } from '@/firebase'
import { useRouter } from 'vue-router'
import { useSessionTimeout } from '@/composables/useSessionTimeout'
import { Clock, Info, RotateCcw, LogOut } from 'lucide-vue-next'

const router = useRouter()
const { showWarning, warningCountdown, extendSession } = useSessionTimeout()

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const logoutNow = async () => {
  try {
    await signOut(auth)
    router.push('/login')
  } catch (error) {
    console.error('Error signing out:', error)
  }
}
</script>

<style scoped>
.session-timeout-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.session-timeout-dialog {
  background: white;
  border-radius: 8px;
  padding: 24px;
  max-width: 360px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  justify-content: center;
}

.header-icon {
  color: #f59e0b;
}

.dialog-header h3 {
  margin: 0;
  color: #374151;
  font-size: 18px;
  font-weight: 600;
}

.dialog-content {
  text-align: center;
  margin-bottom: 24px;
}

.countdown-section {
  margin-bottom: 16px;
}

.countdown-time {
  font-size: 32px;
  font-weight: 700;
  color: #dc2626;
  font-family: ui-monospace, 'Courier New', monospace;
  margin-bottom: 4px;
}

.countdown-label {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.info-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #f3f4f6;
  border-radius: 6px;
  color: #4b5563;
  font-size: 14px;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 14px;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn:active {
  transform: scale(0.98);
}
</style> 