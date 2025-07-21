<template>
  <div v-if="showWarning" class="session-timeout-overlay">
    <div class="session-timeout-dialog">
      <div class="dialog-header">
        <h3>⏰ Session Timeout Warning</h3>
      </div>
      
      <div class="dialog-content">
        <p>Your session will expire in:</p>
        <div class="countdown">
          <span class="countdown-time">{{ formatTime(warningCountdown) }}</span>
        </div>
        <p>You will be automatically logged out for security purposes.</p>
      </div>
      
      <div class="dialog-actions">
        <button @click="extendSession" class="btn btn-primary">
          Stay Logged In
        </button>
        <button @click="logoutNow" class="btn btn-secondary">
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
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(2px);
}

.session-timeout-dialog {
  background: white;
  border-radius: 12px;
  padding: 30px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dialog-header {
  text-align: center;
  margin-bottom: 20px;
}

.dialog-header h3 {
  margin: 0;
  color: #e74c3c;
  font-size: 20px;
}

.dialog-content {
  text-align: center;
  margin-bottom: 25px;
}

.dialog-content p {
  margin: 10px 0;
  color: #555;
  line-height: 1.5;
}

.countdown {
  margin: 20px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e74c3c;
}

.countdown-time {
  font-size: 36px;
  font-weight: bold;
  color: #e74c3c;
  font-family: 'Courier New', monospace;
}

.dialog-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
  transform: translateY(-1px);
}

.btn:active {
  transform: translateY(0);
}
</style> 