import { ref, watch, onMounted } from 'vue'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase'

// Default theme configuration
const DEFAULT_THEME = {
  // Primary Colors
  primaryColor: '#1976d2',
  primaryHover: '#1565c0',
  primaryLight: '#e3f2fd',
  primaryDark: '#0d47a1',
  
  // Secondary Colors
  secondaryColor: '#6c757d',
  secondaryHover: '#545b62',
  secondaryLight: '#f8f9fa',
  secondaryDark: '#495057',
  
  // Background Colors
  bgPrimary: '#f4f6f9',
  bgSecondary: '#ffffff',
  bgTertiary: '#f8f9fa',
  bgMuted: '#e9ecef',
  
  // Text Colors
  textPrimary: '#333333',
  textSecondary: '#666666',
  textMuted: '#999999',
  textInverse: '#ffffff',
  
  // Border Colors
  borderColor: '#dee2e6',
  borderLight: '#e9ecef',
  borderDark: '#adb5bd',
  borderFocus: '#1976d2',
  
  // Status Colors
  successColor: '#28a745',
  successHover: '#218838',
  successLight: '#d4edda',
  warningColor: '#ffc107',
  warningHover: '#e0a800',
  warningLight: '#fff3cd',
  errorColor: '#dc3545',
  errorHover: '#c82333',
  errorLight: '#f8d7da',
  infoColor: '#17a2b8',
  infoHover: '#138496',
  infoLight: '#d1ecf1',
  
  // Admin Panel Colors
  adminTabBg: '#f8f9fa',
  adminTabActive: '#2a79c9',
  adminTabHover: '#e3eaf6',
  
  // Table Colors
  tableHeaderBg: '#dfe7f3',
  tableStripeBg: '#f8fafd',
  tableBorder: '#d1d1d1',
  tableHover: '#f0f0f0',
  
  // Border Radius
  borderRadiusSm: '4px',
  borderRadiusMd: '6px',
  borderRadiusLg: '8px',
  borderRadiusXl: '12px',
  
  // Shadows
  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  shadowMd: '0 2px 4px rgba(0, 0, 0, 0.1)',
  shadowLg: '0 4px 6px rgba(0, 0, 0, 0.1)',
  shadowXl: '0 4px 20px rgba(0, 0, 0, 0.3)',
  
  // Font Family
  fontFamilyBase: "'Inter', 'Segoe UI', 'Arial', sans-serif",
  
  // Font Sizes
  fontSizeXs: '0.75rem',
  fontSizeSm: '0.875rem',
  fontSizeBase: '1rem',
  fontSizeLg: '1.125rem',
  fontSizeXl: '1.25rem',
  fontSizeXxl: '1.5rem'
}

// CSS Variable mapping
const CSS_VARIABLE_MAP = {
  primaryColor: '--primary-color',
  primaryHover: '--primary-hover',
  primaryLight: '--primary-light',
  primaryDark: '--primary-dark',
  secondaryColor: '--secondary-color',
  secondaryHover: '--secondary-hover',
  secondaryLight: '--secondary-light',
  secondaryDark: '--secondary-dark',
  bgPrimary: '--bg-primary',
  bgSecondary: '--bg-secondary',
  bgTertiary: '--bg-tertiary',
  bgMuted: '--bg-muted',
  textPrimary: '--text-primary',
  textSecondary: '--text-secondary',
  textMuted: '--text-muted',
  textInverse: '--text-inverse',
  borderColor: '--border-color',
  borderLight: '--border-light',
  borderDark: '--border-dark',
  borderFocus: '--border-focus',
  successColor: '--success-color',
  successHover: '--success-hover',
  successLight: '--success-light',
  warningColor: '--warning-color',
  warningHover: '--warning-hover',
  warningLight: '--warning-light',
  errorColor: '--error-color',
  errorHover: '--error-hover',
  errorLight: '--error-light',
  infoColor: '--info-color',
  infoHover: '--info-hover',
  infoLight: '--info-light',
  adminTabBg: '--admin-tab-bg',
  adminTabActive: '--admin-tab-active',
  adminTabHover: '--admin-tab-hover',
  tableHeaderBg: '--table-header-bg',
  tableStripeBg: '--table-stripe-bg',
  tableBorder: '--table-border',
  tableHover: '--table-hover',
  borderRadiusSm: '--border-radius-sm',
  borderRadiusMd: '--border-radius-md',
  borderRadiusLg: '--border-radius-lg',
  borderRadiusXl: '--border-radius-xl',
  shadowSm: '--shadow-sm',
  shadowMd: '--shadow-md',
  shadowLg: '--shadow-lg',
  shadowXl: '--shadow-xl',
  fontFamilyBase: '--font-family-base',
  fontSizeXs: '--font-size-xs',
  fontSizeSm: '--font-size-sm',
  fontSizeBase: '--font-size-base',
  fontSizeLg: '--font-size-lg',
  fontSizeXl: '--font-size-xl',
  fontSizeXxl: '--font-size-xxl'
}

export function useThemeManager() {
  const currentTheme = ref({ ...DEFAULT_THEME })
  const loading = ref(false)
  const error = ref(null)
  const isInitialized = ref(false)

  // Load theme from database
  const loadTheme = async () => {
    if (loading.value) return currentTheme.value

    loading.value = true
    error.value = null
    
    try {
      const themeDocRef = doc(db, 'app_settings', 'theme')
      const docSnap = await getDoc(themeDocRef)
      
      if (docSnap.exists()) {
        const savedTheme = docSnap.data()
        currentTheme.value = { ...DEFAULT_THEME, ...savedTheme }
        console.log('Theme loaded from database:', currentTheme.value)
      } else {
        currentTheme.value = { ...DEFAULT_THEME }
        console.log('No saved theme found, using defaults')
      }
      
      isInitialized.value = true
      applyTheme(currentTheme.value)
      return currentTheme.value
    } catch (err) {
      error.value = err.message
      console.error('Error loading theme:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Save theme to database
  const saveTheme = async (theme = currentTheme.value) => {
    loading.value = true
    error.value = null
    
    try {
      const themeDocRef = doc(db, 'app_settings', 'theme')
      await setDoc(themeDocRef, {
        ...theme,
        lastUpdated: new Date().toISOString()
      })
      
      currentTheme.value = { ...theme }
      applyTheme(theme)
      console.log('Theme saved successfully')
      return true
    } catch (err) {
      error.value = err.message
      console.error('Error saving theme:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Apply theme to CSS variables
  const applyTheme = (theme) => {
    const root = document.documentElement
    
    Object.entries(CSS_VARIABLE_MAP).forEach(([themeKey, cssVar]) => {
      if (theme[themeKey] !== undefined) {
        root.style.setProperty(cssVar, theme[themeKey])
      }
    })
  }

  // Update a single theme property
  const updateThemeProperty = (property, value) => {
    currentTheme.value[property] = value
    applyTheme(currentTheme.value)
  }

  // Reset theme to defaults
  const resetTheme = async () => {
    currentTheme.value = { ...DEFAULT_THEME }
    applyTheme(currentTheme.value)
    await saveTheme(currentTheme.value)
  }

  // Preview theme without saving
  const previewTheme = (theme) => {
    applyTheme(theme)
  }

  // Revert to saved theme
  const revertTheme = () => {
    applyTheme(currentTheme.value)
  }

  // Get current CSS variable value
  const getCssVariableValue = (variableName) => {
    return getComputedStyle(document.documentElement).getPropertyValue(variableName)
  }

  // Validate color value
  const validateColor = (color) => {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$|^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/
    return colorRegex.test(color)
  }

  // Generate color variations
  const generateColorVariations = (baseColor) => {
    // Simple color variation generation
    // In a real implementation, you might want to use a color library
    return {
      light: baseColor,
      dark: baseColor,
      hover: baseColor
    }
  }

  // Initialize theme on mount
  onMounted(() => {
    if (!isInitialized.value) {
      loadTheme()
    }
  })

  return {
    currentTheme,
    loading,
    error,
    isInitialized,
    loadTheme,
    saveTheme,
    applyTheme,
    updateThemeProperty,
    resetTheme,
    previewTheme,
    revertTheme,
    getCssVariableValue,
    validateColor,
    generateColorVariations,
    CSS_VARIABLE_MAP,
    DEFAULT_THEME
  }
} 