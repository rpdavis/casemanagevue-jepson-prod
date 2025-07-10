import { ref, computed } from 'vue'
import { isDevelopment, shouldEnableDebugMenu } from '@/utils/environment'

// Global state for debug menu visibility
const isDebugMenuVisible = ref(false)

export function useDebugMenu() {
  // Use centralized environment detection
  const isDev = computed(() => isDevelopment())
  
  // Use centralized debug menu enable check
  const canShowDebugMenu = computed(() => shouldEnableDebugMenu())

  const toggleDebugMenu = () => {
    if (canShowDebugMenu.value) {
      isDebugMenuVisible.value = !isDebugMenuVisible.value
    }
  }

  const showDebugMenu = () => {
    if (canShowDebugMenu.value) {
      isDebugMenuVisible.value = true
    }
  }

  const hideDebugMenu = () => {
    isDebugMenuVisible.value = false
  }

  return {
    isDebugMenuVisible,
    isDevelopment: isDev,
    canShowDebugMenu,
    toggleDebugMenu,
    showDebugMenu,
    hideDebugMenu
  }
} 