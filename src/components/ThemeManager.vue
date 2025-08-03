<template>
  <div class="theme-manager">
    <div class="theme-header">
      <h2>🎨 Student Page Theme Customization</h2>
      <p class="theme-description">
        Customize the visual appearance of the student page. Changes are applied in real-time and saved to the database.
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading theme settings...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button @click="loadTheme" class="btn btn-primary">Retry</button>
    </div>

    <!-- Theme Editor -->
    <div v-else class="theme-editor">
      <!-- Default Theme Selector -->
      <div class="default-themes">
        <h3>🎯 Quick Theme Selection</h3>
        <div class="theme-presets">
          <div 
            v-for="theme in defaultThemes" 
            :key="theme.name"
            @click="applyPresetTheme(theme)"
            class="theme-preset"
            :class="{ active: isCurrentTheme(theme) }"
          >
            <div class="theme-preview-colors">
              <div class="color-dot" :style="{ backgroundColor: theme.primaryColor }"></div>
              <div class="color-dot" :style="{ backgroundColor: theme.bgPrimary }"></div>
              <div class="color-dot" :style="{ backgroundColor: theme.textPrimary }"></div>
            </div>
            <div class="theme-info">
              <h4>{{ theme.name }}</h4>
              <p>{{ theme.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="theme-actions">
        <button @click="handleSaveTheme" :disabled="saving" class="btn btn-primary">
          {{ saving ? '💾 Saving...' : '💾 Save Theme' }}
        </button>
        <button @click="handleResetTheme" :disabled="saving" class="btn btn-warning">
          🔄 Reset to Default
        </button>
      </div>

      <!-- Status Message -->
      <div v-if="statusMessage" class="status-message" :class="{ error: statusError, success: !statusError }">
        {{ statusMessage }}
      </div>

      <!-- Essential Color Customization -->
      <div class="theme-sections">
        <!-- Essential Colors Section -->
        <section class="theme-section">
          <h3>🎨 Essential Student Page Colors</h3>
          <div class="enhanced-color-grid">
            <div class="color-input">
              <label>Primary Color (Buttons & Links)</label>
              <div class="color-picker-wrapper">
                <input 
                  type="color" 
                  v-model="editingTheme.primaryColor"
                  @input="updateThemeProperty('primaryColor', $event.target.value)"
                  class="color-picker"
                />
                <input 
                  type="text" 
                  v-model="editingTheme.primaryColor"
                  @input="updateThemeProperty('primaryColor', $event.target.value)"
                  class="color-text"
                  placeholder="#1976d2"
                />
              </div>
            </div>
            <div class="color-input">
              <label>Header Text Color</label>
              <div class="color-picker-wrapper">
                <input 
                  type="color" 
                  v-model="editingTheme.headerTextColor"
                  @input="updateThemeProperty('headerTextColor', $event.target.value)"
                  class="color-picker"
                />
                <input 
                  type="text" 
                  v-model="editingTheme.headerTextColor"
                  @input="updateThemeProperty('headerTextColor', $event.target.value)"
                  class="color-text"
                  placeholder="#1a1a1a"
                />
              </div>
            </div>
            <div class="color-input">
              <label>Background Color</label>
              <div class="color-picker-wrapper">
                <input 
                  type="color" 
                  v-model="editingTheme.bgPrimary"
                  @input="updateThemeProperty('bgPrimary', $event.target.value)"
                  class="color-picker"
                />
                <input 
                  type="text" 
                  v-model="editingTheme.bgPrimary"
                  @input="updateThemeProperty('bgPrimary', $event.target.value)"
                  class="color-text"
                  placeholder="#f4f6f9"
                />
              </div>
            </div>
            <div class="color-input">
              <label>Text Color</label>
              <div class="color-picker-wrapper">
                <input 
                  type="color" 
                  v-model="editingTheme.textPrimary"
                  @input="updateThemeProperty('textPrimary', $event.target.value)"
                  class="color-picker"
                />
                <input 
                  type="text" 
                  v-model="editingTheme.textPrimary"
                  @input="updateThemeProperty('textPrimary', $event.target.value)"
                  class="color-text"
                  placeholder="#333333"
                />
              </div>
            </div>
            <div class="color-input">
              <label>Accent Color (Service Pills)</label>
              <div class="color-picker-wrapper">
                <input 
                  type="color" 
                  v-model="editingTheme.accentColor"
                  @input="updateThemeProperty('accentColor', $event.target.value)"
                  class="color-picker"
                />
                <input 
                  type="text" 
                  v-model="editingTheme.accentColor"
                  @input="updateThemeProperty('accentColor', $event.target.value)"
                  class="color-text"
                  placeholder="#e3f2fd"
                />
              </div>
            </div>
            <div class="color-input">
              <label>Card Background</label>
              <div class="color-picker-wrapper">
                <input 
                  type="color" 
                  v-model="editingTheme.bgSecondary"
                  @input="updateThemeProperty('bgSecondary', $event.target.value)"
                  class="color-picker"
                />
                <input 
                  type="text" 
                  v-model="editingTheme.bgSecondary"
                  @input="updateThemeProperty('bgSecondary', $event.target.value)"
                  class="color-text"
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Typography Section -->
        <section class="theme-section">
          <h3>📝 Typography & Readability</h3>
          <div class="typography-grid">
            <div class="option-group">
              <label>Font Family</label>
              <select 
                v-model="editingTheme.fontFamilyBase"
                @change="updateThemeProperty('fontFamilyBase', $event.target.value)"
                class="style-select"
              >
                <option value="'Inter', 'Segoe UI', 'Arial', sans-serif">Inter (Modern & Clean)</option>
                <option value="'Roboto', 'Segoe UI', 'Arial', sans-serif">Roboto (Google Standard)</option>
                <option value="'Open Sans', 'Segoe UI', 'Arial', sans-serif">Open Sans (Friendly)</option>
                <option value="'Source Sans Pro', 'Segoe UI', 'Arial', sans-serif">Source Sans Pro (Professional)</option>
                <option value="'Lato', 'Segoe UI', 'Arial', sans-serif">Lato (Humanist)</option>
                <option value="'Nunito Sans', 'Segoe UI', 'Arial', sans-serif">Nunito Sans (Rounded)</option>
                <option value="'System UI', -apple-system, sans-serif">System Default</option>
              </select>
            </div>
            <div class="option-group">
              <label>Base Font Size</label>
              <select 
                v-model="editingTheme.fontSizeBase"
                @change="updateFontSize($event.target.value)"
                class="style-select"
              >
                <option value="0.875rem">Small (14px) - Compact</option>
                <option value="1rem">Medium (16px) - Standard</option>
                <option value="1.125rem">Large (18px) - Comfortable</option>
                <option value="1.25rem">Extra Large (20px) - Accessible</option>
              </select>
            </div>
            <div class="option-group">
              <label>Line Height</label>
              <select 
                v-model="editingTheme.lineHeight"
                @change="updateThemeProperty('lineHeight', $event.target.value)"
                class="style-select"
              >
                <option value="1.4">Compact (1.4)</option>
                <option value="1.5">Standard (1.5)</option>
                <option value="1.6">Comfortable (1.6)</option>
                <option value="1.7">Spacious (1.7)</option>
              </select>
            </div>
          </div>
        </section>

        <!-- Style Options Section -->
        <section class="theme-section">
          <h3>🎛️ Visual Style</h3>
          <div class="style-options-grid">
            <div class="option-group">
              <label>Border Radius Style</label>
              <select 
                v-model="editingTheme.borderStyle"
                @change="updateBorderStyle($event.target.value)"
                class="style-select"
              >
                <option value="rounded">Rounded (Modern)</option>
                <option value="sharp">Sharp (Professional)</option>
                <option value="extra-rounded">Extra Rounded (Friendly)</option>
              </select>
            </div>
            <div class="option-group">
              <label>Shadow Style</label>
              <select 
                v-model="editingTheme.shadowStyle"
                @change="updateShadowStyle($event.target.value)"
                class="style-select"
              >
                <option value="subtle">Subtle</option>
                <option value="medium">Medium</option>
                <option value="bold">Bold</option>
                <option value="none">No Shadows</option>
              </select>
            </div>
            <div class="option-group">
              <label>Contrast Level</label>
              <select 
                v-model="editingTheme.contrastLevel"
                @change="updateContrastLevel($event.target.value)"
                class="style-select"
              >
                <option value="standard">Standard Contrast</option>
                <option value="high">High Contrast (Accessible)</option>
                <option value="maximum">Maximum Contrast</option>
              </select>
            </div>
          </div>
        </section>

        <!-- Student Page Preview Section -->
        <section class="theme-section">
          <h3>👁️ Student Page Preview</h3>
          <div class="student-preview-container">
            <div class="student-page-mockup" :style="{ 
              fontFamily: editingTheme.fontFamilyBase, 
              fontSize: editingTheme.fontSizeBase,
              lineHeight: editingTheme.lineHeight
            }">
              <!-- Header -->
              <div class="mockup-header">
                <h2 :style="{ 
                  color: editingTheme.headerTextColor || editingTheme.textPrimary,
                  fontFamily: editingTheme.fontFamilyBase
                }">Student Management</h2>
                <div class="mockup-search">
                  <input type="text" placeholder="Search students..." readonly>
                </div>
                <div class="mockup-controls">
                  <button class="mockup-btn primary">🔍 Filters</button>
                  <select class="mockup-select">
                    <option>First Name</option>
                  </select>
                  <div class="mockup-radio-group">
                    <label class="active">List</label>
                    <label>Class</label>
                  </div>
                </div>
              </div>
              
              <!-- Table -->
              <div class="mockup-table">
                <div class="mockup-table-header">
                  <div class="mockup-cell">Student Name</div>
                  <div class="mockup-cell">Grade</div>
                  <div class="mockup-cell">Case Manager</div>
                  <div class="mockup-cell">Services</div>
                  <div class="mockup-cell">Actions</div>
                </div>
                <div class="mockup-table-row">
                  <div class="mockup-cell">John Smith</div>
                  <div class="mockup-cell">9th</div>
                  <div class="mockup-cell">Ms. Johnson</div>
                  <div class="mockup-cell">
                    <span class="mockup-service-pill" :style="{ backgroundColor: editingTheme.accentColor || editingTheme.primaryLight }">Speech</span>
                    <span class="mockup-service-pill" :style="{ backgroundColor: editingTheme.accentColor || editingTheme.primaryLight }">OT</span>
                  </div>
                  <div class="mockup-cell">
                    <button class="mockup-btn primary small">Edit</button>
                  </div>
                </div>
                <div class="mockup-table-row">
                  <div class="mockup-cell">Jane Doe</div>
                  <div class="mockup-cell">10th</div>
                  <div class="mockup-cell">Mr. Wilson</div>
                  <div class="mockup-cell">
                    <span class="mockup-service-pill" :style="{ backgroundColor: editingTheme.accentColor || editingTheme.primaryLight }">Resource</span>
                  </div>
                  <div class="mockup-cell">
                    <button class="mockup-btn primary small">Edit</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Hidden file input for theme import -->
    <input 
      ref="fileInput" 
      type="file" 
      accept=".json" 
      style="display: none" 
      @change="handleFileImport"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useThemeManager } from '@/composables/useThemeManager'

const {
  currentTheme,
  loading,
  error,
  loadTheme,
  saveTheme,
  resetTheme,
  revertTheme,
  updateThemeProperty,
  validateColor,
  DEFAULT_THEME
} = useThemeManager()

// Default theme presets
const defaultThemes = [
  {
    name: 'Professional Blue',
    description: 'Clean, accessible blue theme for professional use',
    primaryColor: '#1976d2',
    primaryHover: '#1565c0',
    primaryLight: '#e3f2fd',
    primaryDark: '#0d47a1',
    bgPrimary: '#f8f9fa',
    bgSecondary: '#ffffff',
    bgTertiary: '#f1f3f4',
    textPrimary: '#212529',
    textSecondary: '#495057',
    textMuted: '#6c757d',
    textInverse: '#ffffff',
    headerTextColor: '#1a202c',
    accentColor: '#e3f2fd',
    secondaryColor: '#6c757d',
    secondaryHover: '#545b62',
    successColor: '#28a745',
    warningColor: '#ffc107',
    errorColor: '#dc3545',
    infoColor: '#17a2b8',
    borderColor: '#dee2e6',
    borderStyle: 'rounded',
    shadowStyle: 'subtle',
    contrastLevel: 'standard',
    borderRadiusSm: '4px',
    borderRadiusMd: '6px',
    borderRadiusLg: '8px',
    borderRadiusXl: '12px',
    fontFamilyBase: "'Inter', 'Segoe UI', 'Arial', sans-serif",
    fontSizeBase: '1rem',
    lineHeight: '1.5'
  },
  {
    name: 'Educational Orange',
    description: 'Warm, professional orange theme optimized for readability',
    primaryColor: '#e65100',
    primaryHover: '#bf360c',
    primaryLight: '#fff3e0',
    primaryDark: '#bf360c',
    bgPrimary: '#fafafa',
    bgSecondary: '#ffffff',
    bgTertiary: '#f5f5f5',
    textPrimary: '#212121',
    textSecondary: '#424242',
    textMuted: '#757575',
    textInverse: '#ffffff',
    headerTextColor: '#bf360c',
    accentColor: '#ffcc80',
    secondaryColor: '#424242',
    secondaryHover: '#212121',
    successColor: '#2e7d32',
    warningColor: '#f57c00',
    errorColor: '#d32f2f',
    infoColor: '#1976d2',
    borderColor: '#e0e0e0',
    borderStyle: 'rounded',
    shadowStyle: 'subtle',
    contrastLevel: 'high',
    borderRadiusSm: '4px',
    borderRadiusMd: '6px',
    borderRadiusLg: '8px',
    borderRadiusXl: '12px',
    fontFamilyBase: "'Source Sans Pro', 'Segoe UI', 'Arial', sans-serif",
    fontSizeBase: '1rem',
    lineHeight: '1.6'
  },
  {
    name: 'Accessible Green',
    description: 'Professional green theme with excellent readability',
    primaryColor: '#2e7d32',
    primaryHover: '#1b5e20',
    primaryLight: '#e8f5e8',
    primaryDark: '#1b5e20',
    bgPrimary: '#f8f9fa',
    bgSecondary: '#ffffff',
    bgTertiary: '#f1f3f4',
    textPrimary: '#1b5e20',
    textSecondary: '#2e7d32',
    textMuted: '#558b2f',
    textInverse: '#ffffff',
    headerTextColor: '#1b5e20',
    accentColor: '#a5d6a7',
    secondaryColor: '#424242',
    secondaryHover: '#212121',
    successColor: '#4caf50',
    warningColor: '#f57c00',
    errorColor: '#d32f2f',
    infoColor: '#1976d2',
    borderColor: '#c8e6c9',
    borderStyle: 'rounded',
    shadowStyle: 'subtle',
    contrastLevel: 'high',
    borderRadiusSm: '4px',
    borderRadiusMd: '6px',
    borderRadiusLg: '8px',
    borderRadiusXl: '12px',
    fontFamilyBase: "'Open Sans', 'Segoe UI', 'Arial', sans-serif",
    fontSizeBase: '1rem',
    lineHeight: '1.6'
  },
  {
    name: 'Professional Dark',
    description: 'High-contrast dark theme for reduced eye strain',
    primaryColor: '#bb86fc',
    primaryHover: '#9c27b0',
    primaryLight: '#f3e5f5',
    primaryDark: '#6a1b9a',
    bgPrimary: '#121212',
    bgSecondary: '#1e1e1e',
    bgTertiary: '#2d2d2d',
    textPrimary: '#ffffff',
    textSecondary: '#e0e0e0',
    textMuted: '#bdbdbd',
    textInverse: '#000000',
    headerTextColor: '#bb86fc',
    accentColor: '#424242',
    secondaryColor: '#616161',
    secondaryHover: '#424242',
    successColor: '#4caf50',
    warningColor: '#ff9800',
    errorColor: '#f44336',
    infoColor: '#2196f3',
    borderColor: '#424242',
    borderStyle: 'rounded',
    shadowStyle: 'medium',
    contrastLevel: 'maximum',
    borderRadiusSm: '4px',
    borderRadiusMd: '6px',
    borderRadiusLg: '8px',
    borderRadiusXl: '12px',
    fontFamilyBase: "'Roboto', 'Segoe UI', 'Arial', sans-serif",
    fontSizeBase: '1rem',
    lineHeight: '1.6'
  },
  {
    name: 'Corporate Navy',
    description: 'Professional navy blue theme for corporate environments',
    primaryColor: '#1565c0',
    primaryHover: '#0d47a1',
    primaryLight: '#e3f2fd',
    primaryDark: '#0d47a1',
    bgPrimary: '#f8f9fa',
    bgSecondary: '#ffffff',
    bgTertiary: '#f1f3f4',
    textPrimary: '#0d47a1',
    textSecondary: '#1565c0',
    textMuted: '#1976d2',
    textInverse: '#ffffff',
    headerTextColor: '#0d47a1',
    accentColor: '#bbdefb',
    secondaryColor: '#424242',
    secondaryHover: '#212121',
    successColor: '#2e7d32',
    warningColor: '#f57c00',
    errorColor: '#d32f2f',
    infoColor: '#1976d2',
    borderColor: '#e1f5fe',
    borderStyle: 'sharp',
    shadowStyle: 'subtle',
    contrastLevel: 'high',
    borderRadiusSm: '2px',
    borderRadiusMd: '4px',
    borderRadiusLg: '6px',
    borderRadiusXl: '8px',
    fontFamilyBase: "'Source Sans Pro', 'Segoe UI', 'Arial', sans-serif",
    fontSizeBase: '1rem',
    lineHeight: '1.5'
  },
  {
    name: 'High Contrast',
    description: 'Maximum accessibility theme with high contrast ratios',
    primaryColor: '#000000',
    primaryHover: '#212121',
    primaryLight: '#f5f5f5',
    primaryDark: '#000000',
    bgPrimary: '#ffffff',
    bgSecondary: '#ffffff',
    bgTertiary: '#f8f9fa',
    textPrimary: '#000000',
    textSecondary: '#212121',
    textMuted: '#424242',
    textInverse: '#ffffff',
    headerTextColor: '#000000',
    accentColor: '#e0e0e0',
    secondaryColor: '#424242',
    secondaryHover: '#212121',
    successColor: '#1b5e20',
    warningColor: '#e65100',
    errorColor: '#b71c1c',
    infoColor: '#0d47a1',
    borderColor: '#000000',
    borderStyle: 'sharp',
    shadowStyle: 'bold',
    contrastLevel: 'maximum',
    borderRadiusSm: '0px',
    borderRadiusMd: '2px',
    borderRadiusLg: '4px',
    borderRadiusXl: '6px',
    fontFamilyBase: "'Roboto', 'Segoe UI', 'Arial', sans-serif",
    fontSizeBase: '1.125rem',
    lineHeight: '1.7'
  }
]

// Local state
const editingTheme = reactive({ ...DEFAULT_THEME })
const saving = ref(false)
const statusMessage = ref('')
const statusError = ref(false)
const fileInput = ref(null)

// Watch for theme changes and update editing theme
watch(currentTheme, (newTheme) => {
  Object.assign(editingTheme, newTheme)
}, { deep: true })

// Methods
const showStatus = (message, isError = false) => {
  statusMessage.value = message
  statusError.value = isError
  setTimeout(() => {
    statusMessage.value = ''
    statusError.value = false
  }, 5000)
}

const handleSaveTheme = async () => {
  saving.value = true
  try {
    await saveTheme(editingTheme)
    showStatus('Theme saved successfully!')
  } catch (err) {
    showStatus('Error saving theme: ' + err.message, true)
  } finally {
    saving.value = false
  }
}

const handleResetTheme = async () => {
  if (confirm('Are you sure you want to reset the theme to defaults? This cannot be undone.')) {
    try {
      await resetTheme()
      showStatus('Theme reset to defaults')
    } catch (err) {
      showStatus('Error resetting theme: ' + err.message, true)
    }
  }
}

const handleRevertTheme = () => {
  Object.assign(editingTheme, currentTheme.value)
  showStatus('Changes reverted')
}

// Apply a preset theme
const applyPresetTheme = (preset) => {
  Object.assign(editingTheme, preset)
  // Apply the theme immediately for preview
  Object.keys(preset).forEach(key => {
    if (key !== 'name' && key !== 'description') {
      updateThemeProperty(key, preset[key])
    }
  })
  showStatus(`Applied ${preset.name} theme`)
}

// Check if a preset theme is currently active
const isCurrentTheme = (preset) => {
  return preset.primaryColor === editingTheme.primaryColor &&
         preset.bgPrimary === editingTheme.bgPrimary &&
         preset.textPrimary === editingTheme.textPrimary
}

// Update border style
const updateBorderStyle = (style) => {
  const borderValues = {
    'rounded': { sm: '4px', md: '6px', lg: '8px', xl: '12px' },
    'sharp': { sm: '2px', md: '4px', lg: '6px', xl: '8px' },
    'extra-rounded': { sm: '8px', md: '12px', lg: '16px', xl: '20px' }
  }
  
  const values = borderValues[style]
  if (values) {
    updateThemeProperty('borderRadiusSm', values.sm)
    updateThemeProperty('borderRadiusMd', values.md)
    updateThemeProperty('borderRadiusLg', values.lg)
    updateThemeProperty('borderRadiusXl', values.xl)
  }
}

// Update shadow style
const updateShadowStyle = (style) => {
  const shadowValues = {
    'none': { sm: 'none', md: 'none', lg: 'none', xl: 'none' },
    'subtle': { sm: '0 1px 2px rgba(0, 0, 0, 0.05)', md: '0 2px 4px rgba(0, 0, 0, 0.1)', lg: '0 4px 6px rgba(0, 0, 0, 0.1)', xl: '0 4px 20px rgba(0, 0, 0, 0.15)' },
    'medium': { sm: '0 2px 4px rgba(0, 0, 0, 0.1)', md: '0 4px 8px rgba(0, 0, 0, 0.15)', lg: '0 6px 12px rgba(0, 0, 0, 0.2)', xl: '0 8px 24px rgba(0, 0, 0, 0.25)' },
    'bold': { sm: '0 4px 8px rgba(0, 0, 0, 0.15)', md: '0 8px 16px rgba(0, 0, 0, 0.2)', lg: '0 12px 24px rgba(0, 0, 0, 0.25)', xl: '0 16px 32px rgba(0, 0, 0, 0.3)' }
  }
  
  const values = shadowValues[style]
  if (values) {
    updateThemeProperty('shadowSm', values.sm)
    updateThemeProperty('shadowMd', values.md)
    updateThemeProperty('shadowLg', values.lg)
    updateThemeProperty('shadowXl', values.xl)
  }
}

// Update font size and related properties
const updateFontSize = (size) => {
  updateThemeProperty('fontSizeBase', size)
  
  // Update related font sizes proportionally
  const baseSize = parseFloat(size)
  const unit = size.replace(/[\d.]/g, '')
  
  updateThemeProperty('fontSizeXs', `${(baseSize * 0.75).toFixed(3)}${unit}`)
  updateThemeProperty('fontSizeSm', `${(baseSize * 0.875).toFixed(3)}${unit}`)
  updateThemeProperty('fontSizeLg', `${(baseSize * 1.125).toFixed(3)}${unit}`)
  updateThemeProperty('fontSizeXl', `${(baseSize * 1.25).toFixed(3)}${unit}`)
  updateThemeProperty('fontSizeXxl', `${(baseSize * 1.5).toFixed(3)}${unit}`)
}

// Update contrast level
const updateContrastLevel = (level) => {
  updateThemeProperty('contrastLevel', level)
  
  // Adjust colors based on contrast level
  if (level === 'high') {
    // Enhance contrast for better readability
    if (editingTheme.textPrimary.includes('#')) {
      updateThemeProperty('textPrimary', '#000000')
      updateThemeProperty('textSecondary', '#212121')
    }
  } else if (level === 'maximum') {
    // Maximum contrast for accessibility
    updateThemeProperty('textPrimary', '#000000')
    updateThemeProperty('textSecondary', '#000000')
    updateThemeProperty('bgPrimary', '#ffffff')
    updateThemeProperty('bgSecondary', '#ffffff')
  }
}

// Initialize on mount
onMounted(async () => {
  try {
    await loadTheme()
  } catch (err) {
    console.error('Error loading theme:', err)
  }
})
</script>

<style scoped>
.theme-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.theme-header {
  text-align: center;
  margin-bottom: 2rem;
}

.theme-header h2 {
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.theme-description {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 3rem;
}

.spinner {
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: var(--error-color);
  margin-bottom: 1rem;
}

/* Default Themes Section */
.default-themes {
  margin-bottom: 2rem;
}

.default-themes h3 {
  color: var(--text-primary);
  margin-bottom: 1rem;
  font-size: 1.25rem;
}

.theme-presets {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.theme-preset {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-md);
  background: var(--bg-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-preset:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-md);
}

.theme-preset.active {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.theme-preview-colors {
  display: flex;
  gap: 0.25rem;
}

.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--border-color);
}

.theme-info h4 {
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
}

.theme-info p {
  color: var(--text-secondary);
  margin: 0;
  font-size: 0.875rem;
}

.theme-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.status-message {
  padding: 1rem;
  border-radius: var(--border-radius-md);
  margin-bottom: 2rem;
  font-weight: 500;
}

.status-message.success {
  background: var(--success-light);
  color: var(--success-color);
  border: 1px solid var(--success-color);
}

.status-message.error {
  background: var(--error-light);
  color: var(--error-color);
  border: 1px solid var(--error-color);
}

.theme-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.theme-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 2rem;
  box-shadow: var(--shadow-sm);
}

.theme-section h3 {
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
}

/* Enhanced Color Grid */
.enhanced-color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* Typography Grid */
.typography-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

/* Style Options Grid */
.style-options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-group label {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.style-select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
  cursor: pointer;
}

.color-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.color-input label {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.color-picker-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.color-picker {
  width: 50px;
  height: 40px;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  background: none;
}

.color-text {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-family: var(--font-family-mono);
  font-size: 0.9rem;
}

/* Student Page Preview */
.student-preview-container {
  display: flex;
  justify-content: center;
}

.student-page-mockup {
  width: 100%;
  max-width: 900px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
}

.mockup-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.mockup-header h2 {
  color: var(--text-primary);
  margin: 0;
  font-size: 1.5rem;
}

.mockup-search {
  display: flex;
  gap: 1rem;
}

.mockup-search input {
  flex: 1;
  max-width: 300px;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.mockup-controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.mockup-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 0.875rem;
}

.mockup-btn.primary {
  background: var(--primary-color);
  color: var(--text-inverse);
  border-color: var(--primary-color);
}

.mockup-btn.small {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.mockup-select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.mockup-radio-group {
  display: flex;
  gap: 0.5rem;
}

.mockup-radio-group label {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 0.875rem;
}

.mockup-radio-group label.active {
  background: var(--primary-color);
  color: var(--text-inverse);
  border-color: var(--primary-color);
}

.mockup-table {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  overflow: hidden;
}

.mockup-table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 2fr 1fr;
  background: var(--table-header-bg);
  font-weight: 600;
  color: var(--text-primary);
}

.mockup-table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 2fr 1fr;
  border-top: 1px solid var(--border-color);
}

.mockup-table-row:nth-child(even) {
  background: var(--table-stripe-bg);
}

.mockup-cell {
  padding: 0.75rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mockup-service-pill {
  background: var(--service-pill-bg);
  color: var(--service-pill-text);
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-pill);
  font-size: 0.75rem;
  border: 1px solid var(--service-pill-border);
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary-color);
  color: var(--text-inverse);
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-warning {
  background: var(--warning-color);
  color: var(--text-primary);
}

.btn-warning:hover:not(:disabled) {
  background: var(--warning-hover);
}

@media (max-width: 768px) {
  .theme-manager {
    padding: 1rem;
  }
  
  .theme-actions {
    flex-direction: column;
  }
  
  .theme-presets {
    grid-template-columns: 1fr;
  }
  
  .enhanced-color-grid,
  .typography-grid,
  .style-options-grid {
    grid-template-columns: 1fr;
  }
  
  .mockup-controls {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .mockup-table-header,
  .mockup-table-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .mockup-cell {
    padding: 0.5rem;
    border-bottom: 1px solid var(--border-color);
  }
  
  .mockup-cell:before {
    content: attr(data-label) ': ';
    font-weight: 600;
    display: none;
  }
}

@media (max-width: 480px) {
  .theme-preset {
    flex-direction: column;
    text-align: center;
  }
  
  .mockup-header {
    gap: 0.5rem;
  }
  
  .mockup-search input {
    max-width: none;
  }
}
</style> 