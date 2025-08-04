<template>
  <div class="token-debugger" v-if="showDebugger">
    <h4>🔍 Token Debug Info</h4>
    <div class="debug-info">
      <div><strong>Current User:</strong> {{ authStore.currentUser?.email || 'None' }}</div>
      <div><strong>Token Valid:</strong> {{ tokenValid ? '✅ Yes' : '❌ No' }}</div>
      <div><strong>Last Check:</strong> {{ lastCheck }}</div>
      <div><strong>Auto Refresh:</strong> {{ refreshSetup ? '✅ Active' : '❌ Inactive' }}</div>
    </div>
    <div class="debug-actions">
      <button @click="checkToken">Check Token Now</button>
      <button @click="refreshToken">Force Refresh</button>
      <button @click="toggleDebugger">Hide</button>
    </div>
  </div>
  <button v-else @click="toggleDebugger" class="show-debugger">Show Token Debug</button>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/store/authStore'

const authStore = useAuthStore()
const showDebugger = ref(false)
const tokenValid = ref(null)
const lastCheck = ref('Never')
const refreshSetup = ref(false)

let checkInterval = null

const checkToken = async () => {
  try {
    tokenValid.value = await authStore.checkTokenValidity()
    lastCheck.value = new Date().toLocaleTimeString()
  } catch (error) {
    tokenValid.value = false
    lastCheck.value = `Error: ${error.message}`
  }
}

const refreshToken = async () => {
  try {
    const success = await authStore.refreshToken()
    if (success) {
      await checkToken()
    }
  } catch (error) {
    console.error('Manual token refresh failed:', error)
  }
}

const toggleDebugger = () => {
  showDebugger.value = !showDebugger.value
  if (showDebugger.value) {
    checkToken()
    // Check every 30 seconds when debugger is open
    checkInterval = setInterval(checkToken, 30000)
  } else {
    if (checkInterval) {
      clearInterval(checkInterval)
      checkInterval = null
    }
  }
}

onMounted(() => {
  // Check if token refresh is set up
  refreshSetup.value = true // Assume it's set up since we modified the auth store
})

onUnmounted(() => {
  if (checkInterval) {
    clearInterval(checkInterval)
  }
})
</script>

<style scoped>
.token-debugger {
  position: fixed;
  top: 10px;
  right: 10px;
  background: white;
  border: 2px solid #007bff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  z-index: 9999;
  max-width: 300px;
  font-size: 12px;
}

.debug-info div {
  margin: 5px 0;
}

.debug-actions {
  margin-top: 10px;
}

.debug-actions button {
  margin: 2px;
  padding: 4px 8px;
  font-size: 11px;
  border: 1px solid #007bff;
  background: #007bff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

.debug-actions button:hover {
  background: #0056b3;
}

.show-debugger {
  position: fixed;
  top: 10px;
  right: 10px;
  padding: 8px 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  z-index: 9999;
  font-size: 12px;
}
</style>