<template>
  <div v-if="showDebugInfo" class="debug-access-info">
    <div class="debug-info-content">
      <span class="debug-info-icon">🔧</span>
      <span class="debug-info-text">Debug tools available - Press <kbd>Ctrl+Shift+D</kbd></span>
      <button @click="hideDebugInfo" class="debug-info-close">×</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/store/authStore'

const authStore = useAuthStore()
const showDebugInfo = ref(false)

const currentUser = computed(() => authStore.currentUser)

// Show debug info for admin users only
const canShowDebugInfo = computed(() => {
  const userRole = currentUser.value?.role
  return ['admin', 'administrator'].includes(userRole)
})

const hideDebugInfo = () => {
  showDebugInfo.value = false
  localStorage.setItem('debug-info-hidden', 'true')
}

onMounted(() => {
  // Show debug info if user can see it and hasn't hidden it
  const isHidden = localStorage.getItem('debug-info-hidden')
  if (canShowDebugInfo.value && !isHidden) {
    // Show after a delay to not interfere with page loading
    setTimeout(() => {
      showDebugInfo.value = true
    }, 3000)
  }
})
</script>

<style scoped>
.debug-access-info {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9998;
  animation: slideInUp 0.3s ease-out;
}

.debug-info-content {
  background: #2c3e50;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  max-width: 300px;
}

.debug-info-icon {
  font-size: 14px;
}

.debug-info-text {
  flex: 1;
}

.debug-info-text kbd {
  background: #34495e;
  border: 1px solid #4a5f7a;
  border-radius: 3px;
  padding: 2px 4px;
  font-size: 11px;
  font-family: monospace;
}

.debug-info-close {
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  transition: background-color 0.2s;
}

.debug-info-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 