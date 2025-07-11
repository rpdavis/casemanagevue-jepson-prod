<template>
  <div class="app-settings-panel" v-if="isAdmin">
    <h2>App Settings</h2>
    <form @submit.prevent="saveSettings">
      <!-- Grades -->
      <section class="settings-section">
        <fieldset>
        <legend>Grades</legend>
        <div class="grades-checkboxes">
          <label>
            <input type="checkbox" :checked="allGradesSelected" @change="toggleAllGrades" />
            <span>Select All</span>
          </label>
          <label v-for="grade in gradeOptions" :key="grade.value">
            <input type="checkbox" v-model="settings.grades" :value="grade.value" />
            <span>{{ grade.label }}</span>
          </label>
        </div></fieldset>
      </section>

      <!-- Class Services -->
      <section class="settings-section">
        <h3>Class Services</h3>
        <div class="class-service-fieldset" v-if="settings.classServices[0] && settings.classServices[0].enabledSubcategories">
          <fieldset>
            <legend>SDC</legend>
            <div class="checkbox-inline-group">
              <label v-for="sub in CORE_SUBCATEGORIES" :key="sub">
                <input type="checkbox" v-model="settings.classServices[0].enabledSubcategories" :value="sub" />
                {{ sub }}
              </label>
            </div>
          </fieldset>
        </div>
        <div class="class-service-fieldset" v-if="settings.classServices[1] && settings.classServices[1].enabledSubcategories">
          <fieldset>
            <legend>Co-teach</legend>
            <div class="checkbox-inline-group">
              <label v-for="sub in CORE_SUBCATEGORIES" :key="sub">
                <input type="checkbox" v-model="settings.classServices[1].enabledSubcategories" :value="sub" />
                {{ sub }}
              </label>
            </div>
          </fieldset>
        </div>
        <div class="class-service-fieldset" v-if="settings.classServices[2] && settings.classServices[2].enabledSubcategories">
          <fieldset>
            <legend>RSP</legend>
            <div class="checkbox-inline-group">
              <label v-for="sub in CORE_SUBCATEGORIES" :key="sub">
                <input type="checkbox" v-model="settings.classServices[2].enabledSubcategories" :value="sub" />
                {{ sub }}
              </label>
            </div>
          </fieldset>
        </div>
        <div class="class-service-fieldset" v-if="settings.classServices[3] && settings.classServices[3].enabledSubcategories">
          <fieldset>
            <legend>Directed Studies</legend>
            <div class="checkbox-inline-group">
              <label>
                <input type="checkbox" v-model="settings.classServices[3].enabledSubcategories" value="Directed Studies" />
                Directed Studies
              </label>
            </div>
          </fieldset>
        </div>
        <div class="class-service-fieldset" v-if="settings.classServices[4] && settings.classServices[4].enabledSubcategories">
          <fieldset>
            <legend>FA</legend>
            <div class="checkbox-inline-group">
              <label>
                <input type="checkbox" v-model="settings.classServices[4].enabledSubcategories" value="FA" />
                FA
              </label>
            </div>
          </fieldset>
        </div>
        <div v-for="(service, sIdx) in settings.classServices.slice(5)" :key="service.name" class="class-service-fieldset">
          <fieldset>
            <legend>{{ service.name }}
              <button type="button" @click="removeClassService(sIdx + 5)" title="Remove Service">×</button>
            </legend>
            <div class="checkbox-inline-group">
              <label v-for="(sub, subIdx) in service.subcategories" :key="sub">
                <input type="checkbox" :checked="true" disabled />
                {{ sub }}
                <button type="button" @click="removeSubcategory(sIdx + 5, subIdx)" title="Remove Subcategory">×</button>
              </label>
              <button type="button" @click="addSubcategory(sIdx + 5)">+ Add Subcategory</button>
            </div>
          </fieldset>
        </div>
        <div class="add-class-service">
          <input type="text" v-model="newServiceName" placeholder="New Service Name" maxlength="18" />
          <input type="text" v-model="newServiceSubcat" placeholder="Add Subcategory" maxlength="18" @keyup.enter="addNewServiceSubcat" />
          <button type="button" @click="addNewServiceSubcat">+ Add Subcategory</button>
          <div class="custom-chips">
            <span v-for="(sub, idx) in newServiceSubcats" :key="sub" class="chip">
              {{ sub }} <button type="button" @click="removeNewServiceSubcat(idx)">×</button>
            </span>
          </div>
          <button type="button" @click="addClassService">+ Add Class Service</button>
        </div>
      </section>

      <!-- Service Providers -->
      <section class="settings-section">
        <fieldset>
          <legend>Service Providers</legend>
          <div class="service-providers-defaults">
            <label v-for="service in serviceProviders" :key="service.abbreviation">
              <input type="checkbox" v-model="settings.serviceProviders" :value="service.abbreviation" />
              <span>{{ service.name }} ({{ service.abbreviation }})</span>
            </label>
          </div>
          <div class="service-providers-custom">
            <label>Add Custom Service Provider:</label>
            <div class="custom-provider-inputs">
              <input type="text" v-model="customServiceProviderName" placeholder="Full Name" maxlength="100" />
              <input type="text" v-model="customServiceProviderAbbr" placeholder="Abbreviation" maxlength="10" />
              <button type="button" @click="addCustomServiceProvider">Add</button>
            </div>
            <div class="custom-chips">
              <span v-for="(svc, idx) in settings.customServiceProviders" :key="idx" class="chip">
                {{ svc.name }} ({{ svc.abbreviation }}) <button type="button" @click="removeCustomServiceProvider(idx)">×</button>
              </span>
            </div>
          </div>
        </fieldset>
      </section>

      <!-- Periods -->
      <section class="settings-section">
        <fieldset>
          <legend>Periods</legend>
          <div class="periods-controls">
            <div class="period-number-control">
              <label>
                Number of Periods (max 15):
                <input 
                  type="number" 
                  v-model="settings.numPeriods" 
                  min="1" 
                  max="15" 
                  class="period-number-input"
                />
              </label>
            </div>
            
            <div class="period-labels" v-if="settings.numPeriods > 0">
              <h4>Period Labels (3 chars max each):</h4>
              <div class="period-labels-grid">
                <div v-for="i in settings.numPeriods" :key="i" class="period-label-item">
                  <label>
                    Period {{ i }}:
                    <input 
                      type="text" 
                      v-model="settings.periodLabels[i-1]" 
                      maxlength="3" 
                      :placeholder="`Per${i}`"
                      class="period-label-input"
                    />
                  </label>
                </div>
              </div>
            </div>
            
            <div class="period-preview" v-if="settings.numPeriods > 0">
              <strong>Preview:</strong> 
              <span v-for="i in settings.numPeriods" :key="i" class="period-preview-item">
                {{ settings.periodLabels[i-1] || `Per${i}` }}
              </span>
            </div>
          </div>
        </fieldset>
      </section>

      <!-- Save/Load/Reset -->
      <section class="settings-section">
        <div class="action-buttons">
          <button type="submit" :disabled="saveLoading || loading">💾 Save Settings</button>
          <button type="button" @click="() => loadSettings(true)" :disabled="loading">📂 Load</button>
          <button type="button" @click="resetSettings" :disabled="loading">↩️ Reset</button>
        </div>
        <div v-if="status" class="status-message" :class="{ error: statusError, success: !statusError }">
          {{ status }}
        </div>
      </section>
    </form>
  </div>
  <div v-else class="not-admin">
    <h2>App Settings</h2>
    <p>Access denied. You must be an admin to view this page.</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAppSettings } from '../composables/useAppSettings.js'
import { useAuth } from '../composables/useAuth.js'
import { 
  sanitizeString, 
  checkSecurityThreats, 
  validateStringLength,
  checkRateLimit,
  sanitizeNumber
} from '@/utils/validation.js'

const { currentUser } = useAuth()
const userRole = computed(() => currentUser.value?.role || null)
const isAdmin = computed(() => [
  'admin',
  'administrator',
  'administrator_504_CM',
  'sped_chair'
].includes(userRole.value))

const gradeOptions = [
  { value: 'K', label: 'K' },
  ...Array.from({ length: 12 }, (_, i) => ({ value: (i + 1).toString(), label: (i + 1).toString() }))
]

const CORE_SUBCATEGORIES = ['English', 'Math', 'History', 'Science']

const DEFAULT_SERVICE_PROVIDERS = [
  { name: 'Speech-Language Therapy', abbreviation: 'SLP' },
  { name: 'Occupational Therapy', abbreviation: 'OT' },
  { name: 'Physical Therapy', abbreviation: 'PT' },
  { name: 'School Counseling', abbreviation: 'SC' },
  { name: 'School-Based Mental Health Services', abbreviation: 'MH' },
  { name: 'Transportation', abbreviation: 'TR' },
  { name: 'Audiology Services', abbreviation: 'AUD' },
  { name: 'Vision Services', abbreviation: 'VI' },
  { name: 'Assistive Technology', abbreviation: 'AT' },
  { name: 'Deaf and Hard of Hearing Services', abbreviation: 'DHH' },
  { name: 'Orientation and Mobility', abbreviation: 'O&M' },
  { name: 'Behavioral Intervention Services', abbreviation: 'BIS' },
  { name: 'Health/Nursing Services', abbreviation: 'HN' },
  { name: 'Social Work Services', abbreviation: 'SW' }
]

const { loadAppSettings, saveAppSettings } = useAppSettings()

const loading = ref(false)
const saveLoading = ref(false)
const status = ref('')
const statusError = ref(false)
const customServiceProviderName = ref('')
const customServiceProviderAbbr = ref('')

// Initialize default settings structure
const settings = ref({
  grades: ['7', '8'],
  classServices: [
    {
      name: 'SDC',
      enabledSubcategories: [...CORE_SUBCATEGORIES]
    },
    {
      name: 'Co-teach',
      enabledSubcategories: [...CORE_SUBCATEGORIES]
    }
  ],
  serviceProviders: ['SLP', 'OT', 'MH'],
  serviceProvidersDetails: DEFAULT_SERVICE_PROVIDERS,
  customServiceProviders: [],
  numPeriods: 7,
  periodLabels: ['Per1', 'Per2', 'Per3', 'Per4', 'Per5', 'Per6', 'Per7']
})

// Enhanced validation functions
const validateSettings = () => {
  // Validate number of periods
  const sanitizedNumPeriods = sanitizeNumber(settings.value.numPeriods, {
    min: 1,
    max: 15,
    decimals: 0
  })
  
  if (sanitizedNumPeriods === null) {
    showStatus('Invalid number of periods. Must be between 1 and 15.', true)
    return false
  }
  
  settings.value.numPeriods = sanitizedNumPeriods

  // Validate period labels
  for (let i = 0; i < settings.value.numPeriods; i++) {
    if (!settings.value.periodLabels[i]) {
      settings.value.periodLabels[i] = `Per${i + 1}`
    }

    // Sanitize period label
    const sanitizedLabel = sanitizeString(settings.value.periodLabels[i], {
      trim: true,
      maxLength: 3,
      removeDangerous: true
    })

    // Security threat detection
    const securityCheck = checkSecurityThreats(sanitizedLabel)
    if (!securityCheck.isSafe) {
      showStatus(`Security threat detected in period ${i + 1} label: ${securityCheck.threats.join(', ')}`, true)
      return false
    }

    // Validate length
    const lengthValidation = validateStringLength(sanitizedLabel, { max: 3, fieldName: `Period ${i + 1} label` })
    if (!lengthValidation.isValid) {
      showStatus(lengthValidation.error, true)
      return false
    }

    settings.value.periodLabels[i] = sanitizedLabel
  }

  // Validate custom service providers
  if (settings.value.customServiceProviders) {
    for (let i = 0; i < settings.value.customServiceProviders.length; i++) {
      const provider = settings.value.customServiceProviders[i]
      
      if (provider.name) {
        const sanitizedName = sanitizeString(provider.name, {
          trim: true,
          maxLength: 100,
          removeDangerous: true
        })

        const securityCheck = checkSecurityThreats(sanitizedName)
        if (!securityCheck.isSafe) {
          showStatus(`Security threat detected in custom provider ${i + 1}: ${securityCheck.threats.join(', ')}`, true)
          return false
        }

        provider.name = sanitizedName
      }

      if (provider.abbreviation) {
        const sanitizedAbbr = sanitizeString(provider.abbreviation, {
          trim: true,
          maxLength: 10,
          removeDangerous: true
        })

        const securityCheck = checkSecurityThreats(sanitizedAbbr)
        if (!securityCheck.isSafe) {
          showStatus(`Security threat detected in custom provider abbreviation ${i + 1}: ${securityCheck.threats.join(', ')}`, true)
          return false
        }

        provider.abbreviation = sanitizedAbbr
      }
    }
  }

  return true
}

// Computed properties
const serviceProviders = computed(() => {
  return DEFAULT_SERVICE_PROVIDERS
})

const allGradesSelected = computed(() => {
  return gradeOptions.every(grade => settings.value.grades.includes(grade.value))
})

const toggleAllGrades = (event) => {
  if (event.target.checked) {
    settings.value.grades = gradeOptions.map(g => g.value)
  } else {
    settings.value.grades = []
  }
}

// Service provider management
const addCustomServiceProvider = () => {
  if (!customServiceProviderName.value.trim() || !customServiceProviderAbbr.value.trim()) {
    showStatus('Both name and abbreviation are required for custom service providers', true)
    return
  }
  
  // Check for duplicates
  const isDuplicate = settings.value.customServiceProviders.some(provider => 
    provider.abbreviation.toLowerCase() === customServiceProviderAbbr.value.toLowerCase()
  )
  
  if (isDuplicate) {
    showStatus('A service provider with this abbreviation already exists', true)
    return
  }
  
  settings.value.customServiceProviders.push({
    name: customServiceProviderName.value.trim(),
    abbreviation: customServiceProviderAbbr.value.trim()
  })
  
  // Clear input fields
  customServiceProviderName.value = ''
  customServiceProviderAbbr.value = ''
  
  showStatus('Custom service provider added successfully')
}

const removeCustomServiceProvider = (index) => {
  settings.value.customServiceProviders.splice(index, 1)
}

// Watchers for validation
watch(() => settings.value.numPeriods, (newVal) => {
  // Sanitize and validate on change
  const sanitizedVal = sanitizeNumber(newVal, { min: 1, max: 15, decimals: 0 })
  if (sanitizedVal !== null && sanitizedVal !== newVal) {
    settings.value.numPeriods = sanitizedVal
  }

  // Ensure period labels array matches number of periods
  if (settings.value.periodLabels.length < settings.value.numPeriods) {
    // Add missing labels
    for (let i = settings.value.periodLabels.length; i < settings.value.numPeriods; i++) {
      settings.value.periodLabels.push(`Per${i + 1}`)
    }
  }
})

// Watch period labels for validation
watch(() => settings.value.periodLabels, (newLabels) => {
  newLabels.forEach((label, index) => {
    if (label && label.length > 3) {
      settings.value.periodLabels[index] = label.substring(0, 3)
    }
  })
}, { deep: true })

// Status message helper
const showStatus = (message, isError = false) => {
  status.value = message
  statusError.value = isError
  setTimeout(() => {
    status.value = ''
    statusError.value = false
  }, 5000)
}

// Main functions
const loadSettings = async (showMessage = false) => {
  loading.value = true
  try {
    const loadedSettings = await loadAppSettings()
    if (loadedSettings) {
      // Merge with defaults to ensure all properties exist
      settings.value = {
        ...settings.value,
        ...loadedSettings
      }
      
      // Ensure periodLabels array exists and has correct length
      if (!settings.value.periodLabels || settings.value.periodLabels.length < settings.value.numPeriods) {
        settings.value.periodLabels = []
        for (let i = 0; i < settings.value.numPeriods; i++) {
          settings.value.periodLabels[i] = settings.value.periodLabels[i] || `Per${i + 1}`
        }
      }
      
      if (showMessage) showStatus('Settings loaded successfully')
    }
  } catch (error) {
    showStatus('Error loading settings', true)
    console.error('Load settings error:', error)
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  // Rate limiting for save operations
  const rateCheck = checkRateLimit('saveAppSettings', 10, 60000) // 10 saves per minute
  if (!rateCheck.allowed) {
    showStatus('Too many save requests. Please wait before saving again.', true)
    return
  }

  // Validate settings before saving
  if (!validateSettings()) {
    return
  }

  saveLoading.value = true
  try {
    await saveAppSettings(settings.value)
    showStatus('Settings saved successfully')
  } catch (error) {
    showStatus('Error saving settings', true)
    console.error('Save settings error:', error)
  } finally {
    saveLoading.value = false
  }
}

const resetSettings = () => {
  if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
    settings.value = {
      grades: ['7', '8'],
      classServices: [
        {
          name: 'SDC',
          enabledSubcategories: [...CORE_SUBCATEGORIES]
        },
        {
          name: 'Co-teach',
          enabledSubcategories: [...CORE_SUBCATEGORIES]
        }
      ],
      serviceProviders: ['SLP', 'OT', 'MH'],
      serviceProvidersDetails: DEFAULT_SERVICE_PROVIDERS,
      customServiceProviders: [],
      numPeriods: 7,
      periodLabels: ['Per1', 'Per2', 'Per3', 'Per4', 'Per5', 'Per6', 'Per7']
    }
    showStatus('Settings reset to defaults')
  }
}

// Initialize on mount
onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.app-settings-panel {
  max-width: 700px;
  margin: 2rem auto;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 2rem;
}
.settings-section {
  margin-bottom: 2rem;
}
.grades-checkboxes, .class-services-defaults, .related-services-defaults {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.class-services-subcats {
  margin: 1rem 0 0 0;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
.class-services-custom, .related-services-custom {
  margin-top: 1rem;
}
.custom-provider-inputs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.custom-provider-inputs input {
  flex: 1;
  min-width: 150px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.custom-chips {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.chip {
  background: #e3f2fd;
  border-radius: 16px;
  padding: 0.25rem 0.75rem;
  display: flex;
  align-items: center;
  font-size: 14px;
}
.chip button {
  background: none;
  border: none;
  color: #1976d2;
  font-size: 16px;
  margin-left: 0.5rem;
  cursor: pointer;
}
button[type="submit"] {
  background: #1976d2;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1.5rem;
  font-size: 16px;
  margin-right: 1rem;
  cursor: pointer;
}
button[type="button"] {
  background: #e0e0e0;
  color: #333;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1.5rem;
  font-size: 16px;
  margin-right: 1rem;
  cursor: pointer;
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.not-admin {
  max-width: 500px;
  margin: 4rem auto;
  background: #fff3f3;
  border: 1px solid #f8d7da;
  border-radius: 10px;
  padding: 2rem;
  text-align: center;
  color: #b71c1c;
}
.error {
  color: #b71c1c;
  margin-left: 1rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.status-message {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  margin-top: 1rem;
}

.status-message.success {
  background-color: #e8f5e8;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
}

.status-message.error {
  background-color: #ffebee;
  color: #b71c1c;
  border: 1px solid #ef9a9a;
}
.related-services-defaults {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}
.related-services-defaults label {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5em;
  font-size: 1rem;
  padding: 0.25em 0.5em;
}
.periods-controls {
  margin-bottom: 1rem;
}
.period-number-control {
  flex: 1;
}
.period-labels {
  flex: 1;
}
.period-labels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}
.period-label-item {
  display: flex;
  flex-direction: column;
}
.period-label-item label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-weight: 500;
}
.period-label-input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}
.period-number-input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  width: 100px;
}
.period-preview {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}
.period-preview-item {
  display: inline-block;
  margin-right: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: #e3f2fd;
  border-radius: 4px;
  font-family: monospace;
  font-weight: 500;
}

.service-providers-defaults {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.service-providers-defaults label {
  display: flex;
  flex-direction: row;
  gap: 5px;
  width: 100%;
  font-weight: 500;
}

.service-providers-custom {
  margin-top: 1rem;
}
</style> 