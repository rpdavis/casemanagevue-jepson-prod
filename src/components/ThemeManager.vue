<template>
  <div class="theme-manager">
    <div class="theme-header">
      <h2>🎨 Theme Customization</h2>
      <p class="theme-description">
        Customize the visual appearance of the application. Changes are applied in real-time and saved to the database.
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
      <!-- Action Buttons -->
      <div class="theme-actions">
        <button @click="handleSaveTheme" :disabled="saving" class="btn btn-primary">
          {{ saving ? '💾 Saving...' : '💾 Save Theme' }}
        </button>
        <button @click="handleResetTheme" :disabled="saving" class="btn btn-warning">
          🔄 Reset to Defaults
        </button>
        <button @click="handleRevertTheme" :disabled="saving" class="btn btn-secondary">
          ↩️ Revert Changes
        </button>
        <button @click="exportTheme" class="btn btn-info">
          📤 Export Theme
        </button>
        <button @click="importTheme" class="btn btn-info">
          📥 Import Theme
        </button>
      </div>

      <!-- Status Message -->
      <div v-if="statusMessage" class="status-message" :class="{ error: statusError, success: !statusError }">
        {{ statusMessage }}
      </div>

      <!-- Theme Sections -->
      <div class="theme-sections">
        <!-- Color Palette Section -->
        <section class="theme-section">
          <h3>🎨 Color Palette</h3>
          <div class="color-grid">
            <!-- Primary Colors -->
            <div class="color-group">
              <h4>Primary Colors</h4>
              <div class="color-inputs">
                <div class="color-input">
                  <label>Primary Color</label>
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
                  <label>Primary Hover</label>
                  <div class="color-picker-wrapper">
                    <input 
                      type="color" 
                      v-model="editingTheme.primaryHover"
                      @input="updateThemeProperty('primaryHover', $event.target.value)"
                      class="color-picker"
                    />
                    <input 
                      type="text" 
                      v-model="editingTheme.primaryHover"
                      @input="updateThemeProperty('primaryHover', $event.target.value)"
                      class="color-text"
                      placeholder="#1565c0"
                    />
                  </div>
                </div>
                <div class="color-input">
                  <label>Primary Light</label>
                  <div class="color-picker-wrapper">
                    <input 
                      type="color" 
                      v-model="editingTheme.primaryLight"
                      @input="updateThemeProperty('primaryLight', $event.target.value)"
                      class="color-picker"
                    />
                    <input 
                      type="text" 
                      v-model="editingTheme.primaryLight"
                      @input="updateThemeProperty('primaryLight', $event.target.value)"
                      class="color-text"
                      placeholder="#e3f2fd"
                    />
                  </div>
                </div>
                <div class="color-input">
                  <label>Primary Dark</label>
                  <div class="color-picker-wrapper">
                    <input 
                      type="color" 
                      v-model="editingTheme.primaryDark"
                      @input="updateThemeProperty('primaryDark', $event.target.value)"
                      class="color-picker"
                    />
                    <input 
                      type="text" 
                      v-model="editingTheme.primaryDark"
                      @input="updateThemeProperty('primaryDark', $event.target.value)"
                      class="color-text"
                      placeholder="#0d47a1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Secondary Colors -->
            <div class="color-group">
              <h4>Secondary Colors</h4>
              <div class="color-inputs">
                <div class="color-input">
                  <label>Secondary Color</label>
                  <div class="color-picker-wrapper">
                    <input 
                      type="color" 
                      v-model="editingTheme.secondaryColor"
                      @input="updateThemeProperty('secondaryColor', $event.target.value)"
                      class="color-picker"
                    />
                    <input 
                      type="text" 
                      v-model="editingTheme.secondaryColor"
                      @input="updateThemeProperty('secondaryColor', $event.target.value)"
                      class="color-text"
                      placeholder="#6c757d"
                    />
                  </div>
                </div>
                <div class="color-input">
                  <label>Secondary Hover</label>
                  <div class="color-picker-wrapper">
                    <input 
                      type="color" 
                      v-model="editingTheme.secondaryHover"
                      @input="updateThemeProperty('secondaryHover', $event.target.value)"
                      class="color-picker"
                    />
                    <input 
                      type="text" 
                      v-model="editingTheme.secondaryHover"
                      @input="updateThemeProperty('secondaryHover', $event.target.value)"
                      class="color-text"
                      placeholder="#545b62"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Status Colors -->
            <div class="color-group">
              <h4>Status Colors</h4>
              <div class="color-inputs">
                <div class="color-input">
                  <label>Success</label>
                  <div class="color-picker-wrapper">
                    <input 
                      type="color" 
                      v-model="editingTheme.successColor"
                      @input="updateThemeProperty('successColor', $event.target.value)"
                      class="color-picker"
                    />
                    <input 
                      type="text" 
                      v-model="editingTheme.successColor"
                      @input="updateThemeProperty('successColor', $event.target.value)"
                      class="color-text"
                      placeholder="#28a745"
                    />
                  </div>
                </div>
                <div class="color-input">
                  <label>Warning</label>
                  <div class="color-picker-wrapper">
                    <input 
                      type="color" 
                      v-model="editingTheme.warningColor"
                      @input="updateThemeProperty('warningColor', $event.target.value)"
                      class="color-picker"
                    />
                    <input 
                      type="text" 
                      v-model="editingTheme.warningColor"
                      @input="updateThemeProperty('warningColor', $event.target.value)"
                      class="color-text"
                      placeholder="#ffc107"
                    />
                  </div>
                </div>
                <div class="color-input">
                  <label>Error</label>
                  <div class="color-picker-wrapper">
                    <input 
                      type="color" 
                      v-model="editingTheme.errorColor"
                      @input="updateThemeProperty('errorColor', $event.target.value)"
                      class="color-picker"
                    />
                    <input 
                      type="text" 
                      v-model="editingTheme.errorColor"
                      @input="updateThemeProperty('errorColor', $event.target.value)"
                      class="color-text"
                      placeholder="#dc3545"
                    />
                  </div>
                </div>
                <div class="color-input">
                  <label>Info</label>
                  <div class="color-picker-wrapper">
                    <input 
                      type="color" 
                      v-model="editingTheme.infoColor"
                      @input="updateThemeProperty('infoColor', $event.target.value)"
                      class="color-picker"
                    />
                    <input 
                      type="text" 
                      v-model="editingTheme.infoColor"
                      @input="updateThemeProperty('infoColor', $event.target.value)"
                      class="color-text"
                      placeholder="#17a2b8"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Background Colors Section -->
        <section class="theme-section">
          <h3>🏞️ Background Colors</h3>
          <div class="color-grid">
            <div class="color-input">
              <label>Primary Background</label>
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
              <label>Secondary Background</label>
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
            <div class="color-input">
              <label>Tertiary Background</label>
              <div class="color-picker-wrapper">
                <input 
                  type="color" 
                  v-model="editingTheme.bgTertiary"
                  @input="updateThemeProperty('bgTertiary', $event.target.value)"
                  class="color-picker"
                />
                <input 
                  type="text" 
                  v-model="editingTheme.bgTertiary"
                  @input="updateThemeProperty('bgTertiary', $event.target.value)"
                  class="color-text"
                  placeholder="#f8f9fa"
                />
              </div>
            </div>
            <div class="color-input">
              <label>Muted Background</label>
              <div class="color-picker-wrapper">
                <input 
                  type="color" 
                  v-model="editingTheme.bgMuted"
                  @input="updateThemeProperty('bgMuted', $event.target.value)"
                  class="color-picker"
                />
                <input 
                  type="text" 
                  v-model="editingTheme.bgMuted"
                  @input="updateThemeProperty('bgMuted', $event.target.value)"
                  class="color-text"
                  placeholder="#e9ecef"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Text Colors Section -->
        <section class="theme-section">
          <h3>📝 Text Colors</h3>
          <div class="color-grid">
            <div class="color-input">
              <label>Primary Text</label>
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
              <label>Secondary Text</label>
              <div class="color-picker-wrapper">
                <input 
                  type="color" 
                  v-model="editingTheme.textSecondary"
                  @input="updateThemeProperty('textSecondary', $event.target.value)"
                  class="color-picker"
                />
                <input 
                  type="text" 
                  v-model="editingTheme.textSecondary"
                  @input="updateThemeProperty('textSecondary', $event.target.value)"
                  class="color-text"
                  placeholder="#666666"
                />
              </div>
            </div>
            <div class="color-input">
              <label>Muted Text</label>
              <div class="color-picker-wrapper">
                <input 
                  type="color" 
                  v-model="editingTheme.textMuted"
                  @input="updateThemeProperty('textMuted', $event.target.value)"
                  class="color-picker"
                />
                <input 
                  type="text" 
                  v-model="editingTheme.textMuted"
                  @input="updateThemeProperty('textMuted', $event.target.value)"
                  class="color-text"
                  placeholder="#999999"
                />
              </div>
            </div>
            <div class="color-input">
              <label>Inverse Text</label>
              <div class="color-picker-wrapper">
                <input 
                  type="color" 
                  v-model="editingTheme.textInverse"
                  @input="updateThemeProperty('textInverse', $event.target.value)"
                  class="color-picker"
                />
                <input 
                  type="text" 
                  v-model="editingTheme.textInverse"
                  @input="updateThemeProperty('textInverse', $event.target.value)"
                  class="color-text"
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Border Radius Section -->
        <section class="theme-section">
          <h3>🔲 Border Radius</h3>
          <div class="input-grid">
            <div class="input-group">
              <label>Small Border Radius</label>
              <input 
                type="text" 
                v-model="editingTheme.borderRadiusSm"
                @input="updateThemeProperty('borderRadiusSm', $event.target.value)"
                placeholder="4px"
              />
            </div>
            <div class="input-group">
              <label>Medium Border Radius</label>
              <input 
                type="text" 
                v-model="editingTheme.borderRadiusMd"
                @input="updateThemeProperty('borderRadiusMd', $event.target.value)"
                placeholder="6px"
              />
            </div>
            <div class="input-group">
              <label>Large Border Radius</label>
              <input 
                type="text" 
                v-model="editingTheme.borderRadiusLg"
                @input="updateThemeProperty('borderRadiusLg', $event.target.value)"
                placeholder="8px"
              />
            </div>
            <div class="input-group">
              <label>Extra Large Border Radius</label>
              <input 
                type="text" 
                v-model="editingTheme.borderRadiusXl"
                @input="updateThemeProperty('borderRadiusXl', $event.target.value)"
                placeholder="12px"
              />
            </div>
          </div>
        </section>

        <!-- Font Settings Section -->
        <section class="theme-section">
          <h3>🔤 Typography</h3>
          <div class="input-grid">
            <div class="input-group">
              <label>Font Family</label>
              <select 
                v-model="editingTheme.fontFamilyBase"
                @change="updateThemeProperty('fontFamilyBase', $event.target.value)"
              >
                <option value="'Inter', 'Segoe UI', 'Arial', sans-serif">Inter (Default)</option>
                <option value="'Roboto', 'Segoe UI', 'Arial', sans-serif">Roboto</option>
                <option value="'Open Sans', 'Segoe UI', 'Arial', sans-serif">Open Sans</option>
                <option value="'Lato', 'Segoe UI', 'Arial', sans-serif">Lato</option>
                <option value="'Poppins', 'Segoe UI', 'Arial', sans-serif">Poppins</option>
                <option value="'Montserrat', 'Segoe UI', 'Arial', sans-serif">Montserrat</option>
                <option value="'Source Sans Pro', 'Segoe UI', 'Arial', sans-serif">Source Sans Pro</option>
                <option value="'Ubuntu', 'Segoe UI', 'Arial', sans-serif">Ubuntu</option>
              </select>
            </div>
            <div class="input-group">
              <label>Base Font Size</label>
              <input 
                type="text" 
                v-model="editingTheme.fontSizeBase"
                @input="updateThemeProperty('fontSizeBase', $event.target.value)"
                placeholder="1rem"
              />
            </div>
          </div>
        </section>

        <!-- Preview Section -->
        <section class="theme-section">
          <h3>👁️ Live Preview</h3>
          <div class="preview-container">
            <div class="preview-card">
              <h4>Sample Card</h4>
              <p>This is a sample card to preview your theme changes in real-time.</p>
              <div class="preview-buttons">
                <button class="btn btn-primary">Primary Button</button>
                <button class="btn btn-secondary">Secondary Button</button>
                <button class="btn btn-success">Success Button</button>
                <button class="btn btn-warning">Warning Button</button>
                <button class="btn btn-error">Error Button</button>
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

const exportTheme = () => {
  const themeData = JSON.stringify(editingTheme, null, 2)
  const blob = new Blob([themeData], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `theme-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  showStatus('Theme exported successfully')
}

const importTheme = () => {
  fileInput.value.click()
}

const handleFileImport = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const importedTheme = JSON.parse(e.target.result)
      
      // Validate imported theme
      const isValid = Object.keys(DEFAULT_THEME).every(key => 
        importedTheme.hasOwnProperty(key)
      )
      
      if (!isValid) {
        showStatus('Invalid theme file format', true)
        return
      }
      
      // Apply imported theme
      Object.assign(editingTheme, importedTheme)
      showStatus('Theme imported successfully')
    } catch (err) {
      showStatus('Error importing theme: ' + err.message, true)
    }
  }
  reader.readAsText(file)
  
  // Reset file input
  event.target.value = ''
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

.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.color-group {
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-md);
  padding: 1.5rem;
  background: var(--bg-tertiary);
}

.color-group h4 {
  color: var(--text-primary);
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.color-inputs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.input-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.input-group input,
.input-group select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: 0.9rem;
}

.preview-container {
  display: flex;
  justify-content: center;
}

.preview-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  box-shadow: var(--shadow-md);
}

.preview-card h4 {
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.preview-card p {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.preview-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
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

.btn-secondary {
  background: var(--secondary-color);
  color: var(--text-inverse);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--secondary-hover);
}

.btn-success {
  background: var(--success-color);
  color: var(--text-inverse);
}

.btn-success:hover:not(:disabled) {
  background: var(--success-hover);
}

.btn-warning {
  background: var(--warning-color);
  color: var(--text-primary);
}

.btn-warning:hover:not(:disabled) {
  background: var(--warning-hover);
}

.btn-error {
  background: var(--error-color);
  color: var(--text-inverse);
}

.btn-error:hover:not(:disabled) {
  background: var(--error-hover);
}

.btn-info {
  background: var(--info-color);
  color: var(--text-inverse);
}

.btn-info:hover:not(:disabled) {
  background: var(--info-hover);
}

@media (max-width: 768px) {
  .theme-manager {
    padding: 1rem;
  }
  
  .theme-actions {
    flex-direction: column;
  }
  
  .color-grid {
    grid-template-columns: 1fr;
  }
  
  .input-grid {
    grid-template-columns: 1fr;
  }
  
  .preview-buttons {
    flex-direction: column;
  }
}
</style> 