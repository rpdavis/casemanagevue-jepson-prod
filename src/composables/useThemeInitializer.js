import { onMounted } from 'vue'
import { useThemeManager } from './useThemeManager'

export function useThemeInitializer() {
  const { loadTheme, currentTheme, isInitialized } = useThemeManager()

  onMounted(async () => {
    // Only load theme if not already initialized
    if (!isInitialized.value) {
      try {
        await loadTheme()
        console.log('Theme initialized successfully')
      } catch (error) {
        console.error('Failed to initialize theme:', error)
        // Continue with default theme
      }
    }
  })

  return {
    currentTheme,
    isInitialized
  }
} 