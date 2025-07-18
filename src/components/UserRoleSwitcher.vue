<template>
  <div class="user-role-switcher" v-if="canShowDebugMenu && isDebugMenuVisible">
    <div class="switcher-header" @click="toggleDebugMenu" :title="isDebugMenuVisible ? 'Collapse Debug Panel' : 'Expand Debug Panel'">
      <span class="debug-icon">🔧</span>
      <span class="debug-label">Debug</span>
      <button @click.stop="hideDebugMenu" class="close-debug-btn" title="Close Debug Menu">×</button>
    </div>
    
    <div class="switcher-content">
      <div class="current-user-info">
        <strong>Current User:</strong> {{ currentUser?.name || currentUser?.email || 'Unknown' }}
        <br>
        <strong>Role:</strong> <span :class="'role-' + currentUser?.role">{{ currentUser?.role || 'None' }}</span>
        <br>
        <strong>UID:</strong> {{ currentUser?.uid || 'None' }}
      </div>
      
      <div class="debug-actions">
        <button @click="refreshPage" class="debug-btn">
          🔄 Refresh Page
        </button>
        <button @click="clearLocalStorage" class="debug-btn">
          🗑️ Clear Local Storage
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useAuthStore } from '@/store/authStore'
import { useDebugMenu } from '@/composables/useDebugMenu'

export default {
  name: 'UserRoleSwitcher',
  setup() {
    const authStore = useAuthStore()
    const { isDebugMenuVisible, canShowDebugMenu, toggleDebugMenu, hideDebugMenu } = useDebugMenu()
    
    const currentUser = computed(() => authStore.user)
    
    const refreshPage = () => {
      window.location.reload()
    }
    
    const clearLocalStorage = () => {
      localStorage.removeItem('debug-user')
      console.log('🔧 DEBUG: Cleared debug user from localStorage')
    }

    return {
      isDebugMenuVisible,
      canShowDebugMenu,
      toggleDebugMenu,
      hideDebugMenu,
      currentUser,
      refreshPage,
      clearLocalStorage
    }
  }
}
</script>

<style scoped>
.user-role-switcher {
  position: fixed;
  top: 20px;
  left: 20px;
  background: #2c3e50;
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 9999;
  min-width: 300px;
  max-width: 400px;
  transition: all 0.3s ease;
}

.switcher-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #34495e;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.switcher-header:hover {
  background: #4a5f7a;
}

.debug-icon {
  font-size: 16px;
}

.debug-label {
  font-size: 12px;
  font-weight: 600;
  color: #ecf0f1;
  flex: 1;
}

.close-debug-btn {
  background: none;
  border: none;
  color: #ecf0f1;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  margin-left: 8px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  transition: background-color 0.2s;
}

.close-debug-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.switcher-content {
  padding: 16px;
}

.current-user-info {
  background: #34495e;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 12px;
  line-height: 1.4;
}

.debug-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.debug-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.debug-btn:hover {
  background: #2980b9;
}

.role-admin { color: #e74c3c; }
.role-administrator { color: #e67e22; }
.role-sped_chair { color: #9b59b6; }
.role-case_manager { color: #27ae60; }
.role-teacher { color: #3498db; }
.role-paraeducator { color: #f39c12; }
.role-service_provider { color: #1abc9c; }
</style> 