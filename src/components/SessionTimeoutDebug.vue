<template>
  <div class="session-debug">
    <h4><Shield :size="16" /> Session Timeout Debug</h4>
    
    <div class="debug-info">
      <div class="info-row">
        <strong>Timeout Enabled:</strong> 
        <span :class="{ 'status-active': isEnabled, 'status-inactive': !isEnabled }">
          <CheckCircle v-if="isEnabled" :size="14" /> 
          <XCircle v-else :size="14" />
          {{ isEnabled ? 'YES' : 'NO' }}
        </span>
      </div>
      
      <div class="info-row">
        <strong>Timeout Minutes:</strong> 
        <span>{{ timeoutMinutes }} minutes</span>
      </div>
      
      <div class="info-row">
        <strong>User Logged In:</strong> 
        <span :class="{ 'status-active': !!currentUser, 'status-inactive': !currentUser }">
          <CheckCircle v-if="currentUser" :size="14" /> 
          <XCircle v-else :size="14" />
          {{ currentUser ? 'YES' : 'NO' }}
        </span>
      </div>
      
      <div class="info-row">
        <strong>Warning Showing:</strong> 
        <span :class="{ 'status-warning': showWarning, 'status-inactive': !showWarning }">
          <AlertTriangle v-if="showWarning" :size="14" /> 
          <XCircle v-else :size="14" />
          {{ showWarning ? 'YES' : 'NO' }}
        </span>
      </div>
      
      <div class="info-row" v-if="showWarning">
        <strong>Countdown:</strong> 
        <span class="countdown">{{ warningCountdown }}s</span>
      </div>
    </div>
    
    <div class="debug-actions">
      <div class="timeout-setter">
        <label>
          Set Test Timeout:
          <select v-model="testTimeoutMinutes" class="timeout-select">
            <option value="0.05">3 seconds</option>
            <option value="0.17">10 seconds</option>
            <option value="0.5">30 seconds</option>
            <option value="1">1 minute</option>
            <option value="2">2 minutes</option>
            <option value="5">5 minutes</option>
          </select>
        </label>
        <button @click="setTestTimeout" class="btn btn-warning">
          Apply Test Timeout
        </button>
      </div>
      
      <div class="admin-action-btns">
        <button @click="triggerActivity" class="admin-action-btn" style="min-width: 120px; max-width: 120px;">
          Trigger Activity
        </button>
        <button @click="showConsoleInfo" class="admin-action-btn" style="min-width: 140px; max-width: 140px;">
          Show Console Info
        </button>
        <button @click="resetToOriginal" class="admin-action-btn" style="min-width: 140px; max-width: 140px;">
          Reset to Original
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSessionTimeout } from '@/composables/useSessionTimeout'
import { useAuthStore } from '@/store/authStore'
import { Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-vue-next'

const { isEnabled, timeoutMinutes, showWarning, warningCountdown, updateSettings, resetTimeout } = useSessionTimeout()
const authStore = useAuthStore()
const currentUser = computed(() => authStore.currentUser)

// Store original timeout settings
const originalEnabled = ref(false)
const originalMinutes = ref(30)
const testTimeoutMinutes = ref(0.17) // Default to 10 seconds

// Store original settings when component loads
onMounted(() => {
  originalEnabled.value = isEnabled.value
  originalMinutes.value = timeoutMinutes.value
})

const setTestTimeout = async () => {
  // Store current settings as original if not already stored
  if (!originalEnabled.value && !originalMinutes.value) {
    originalEnabled.value = isEnabled.value
    originalMinutes.value = timeoutMinutes.value
  }
  
  await updateSettings(true, testTimeoutMinutes.value)
  setTimeout(() => {
    resetTimeout()
  }, 100)
}

const resetToOriginal = async () => {
  await updateSettings(originalEnabled.value, originalMinutes.value)
  setTimeout(() => {
    resetTimeout()
  }, 100)
}

const triggerActivity = () => {
  // Simulate user activity
  document.dispatchEvent(new Event('click'))
}

const showConsoleInfo = () => {
  console.log('🔒 Session Timeout Debug Info:')
  console.log('- Enabled:', isEnabled.value)
  console.log('- Timeout Minutes:', timeoutMinutes.value)
  console.log('- Warning Showing:', showWarning.value)
  console.log('- Warning Countdown:', warningCountdown.value)
  console.log('- User Logged In:', !!currentUser.value)
  console.log('- Current User:', currentUser.value)
}
</script>

<style scoped>
.session-debug {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 15px;
  margin: 10px 0;
}

.session-debug h4 {
  margin: 0 0 15px 0;
  color: #495057;
}

.debug-info {
  margin-bottom: 15px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 5px 0;
  border-bottom: 1px solid #e9ecef;
}

.status-active {
  color: #28a745;
  font-weight: bold;
}

.status-inactive {
  color: #6c757d;
}

.status-warning {
  color: #ffc107;
  font-weight: bold;
}

.countdown {
  color: #dc3545;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.debug-actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.timeout-setter {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.timeout-setter label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.timeout-select {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn:hover {
  opacity: 0.8;
}
</style> 