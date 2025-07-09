import { ref, computed } from 'vue'

// Global state for debug menu visibility
const isDebugMenuVisible = ref(false)

export function useDebugMenu() {
  // Check if we're in development mode
  const isDevelopment = computed(() => {
    return import.meta.env.DEV || window.location.hostname === 'localhost'
  })

  // Only show debug menu in development mode
  const canShowDebugMenu = computed(() => isDevelopment.value)

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
    isDevelopment,
    canShowDebugMenu,
    toggleDebugMenu,
    showDebugMenu,
    hideDebugMenu
  }
} 