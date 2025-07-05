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
            <label>Add Custom Service Provider (max 18 chars):</label>
            <input type="text" v-model="customServiceProvider" maxlength="18" @keyup.enter="addCustomServiceProvider" />
            <button type="button" @click="addCustomServiceProvider">Add</button>
            <div class="custom-chips">
              <span v-for="(svc, idx) in settings.customServiceProviders" :key="svc" class="chip">
                {{ svc }} <button type="button" @click="removeCustomServiceProvider(idx)">×</button>
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
const { saveAppSettings, loadAppSettings, resetAppSettings, loading, error } = useAppSettings()
const saveLoading = ref(false)
const settings = ref({
  grades: [],
  classServices: [
    { name: 'SDC', subcategories: [...CORE_SUBCATEGORIES], enabledSubcategories: [...CORE_SUBCATEGORIES] },
    { name: 'Co-teach', subcategories: [...CORE_SUBCATEGORIES], enabledSubcategories: [...CORE_SUBCATEGORIES] },
    { name: 'RSP', subcategories: [...CORE_SUBCATEGORIES], enabledSubcategories: [...CORE_SUBCATEGORIES] },
    { name: 'Directed Studies', subcategories: ['Directed Studies'], enabledSubcategories: ['Directed Studies'] },
    { name: 'FA', subcategories: ['FA'], enabledSubcategories: ['FA'] }
  ],
  directedStudiesFA: {
    directedStudies: true,
    fa: true
  },
  serviceProviders: DEFAULT_SERVICE_PROVIDERS.map(s => s.abbreviation),
  customServiceProviders: [],
  numPeriods: 7,
  periodLabels: ['Per1', 'Per2', 'Per3', 'Per4', 'Per5', 'Per6', 'Per7']
})

const customClassService = ref('')
const customServiceProvider = ref('')
const status = ref('')
const statusError = ref(false)

const allGradesSelected = computed(() => settings.value.grades.length === gradeOptions.length)
const toggleAllGrades = () => {
  if (allGradesSelected.value) {
    settings.value.grades = []
  } else {
    settings.value.grades = gradeOptions.map(g => g.value)
  }
}

const newServiceName = ref('')
const newServiceSubcat = ref('')
const newServiceSubcats = ref([])

function addNewServiceSubcat() {
  const val = newServiceSubcat.value.trim()
  if (val && !newServiceSubcats.value.includes(val)) {
    newServiceSubcats.value.push(val)
    newServiceSubcat.value = ''
  }
}
function removeNewServiceSubcat(idx) {
  newServiceSubcats.value.splice(idx, 1)
}
function addClassService() {
  const name = newServiceName.value.trim()
  if (!name || settings.value.classServices.some(s => s.name === name)) return
  settings.value.classServices.push({ name, subcategories: [...newServiceSubcats.value] })
  newServiceName.value = ''
  newServiceSubcat.value = ''
  newServiceSubcats.value = []
}
function removeClassService(idx) {
  settings.value.classServices.splice(idx, 1)
}
function addSubcategory(serviceIdx) {
  const val = prompt('Enter new subcategory:')
  if (val && !settings.value.classServices[serviceIdx].subcategories.includes(val)) {
    settings.value.classServices[serviceIdx].subcategories.push(val)
  }
}
function removeSubcategory(serviceIdx, subIdx) {
  settings.value.classServices[serviceIdx].subcategories.splice(subIdx, 1)
}

const addCustomServiceProvider = () => {
  const val = customServiceProvider.value.trim()
  if (val && val.length <= 18 && !settings.value.customServiceProviders.includes(val)) {
    settings.value.customServiceProviders.push(val)
    customServiceProvider.value = ''
  }
}
const removeCustomServiceProvider = idx => {
  settings.value.customServiceProviders.splice(idx, 1)
}

function normalizeSettings(loaded) {
  // Ensure all required fields exist and have correct structure
  const defaultClassServices = [
    { name: 'SDC', subcategories: [...CORE_SUBCATEGORIES], enabledSubcategories: [...CORE_SUBCATEGORIES] },
    { name: 'Co-teach', subcategories: [...CORE_SUBCATEGORIES], enabledSubcategories: [...CORE_SUBCATEGORIES] },
    { name: 'RSP', subcategories: [...CORE_SUBCATEGORIES], enabledSubcategories: [...CORE_SUBCATEGORIES] },
    { name: 'Directed Studies', subcategories: ['Directed Studies'], enabledSubcategories: ['Directed Studies'] },
    { name: 'FA', subcategories: ['FA'], enabledSubcategories: ['FA'] }
  ]
  
  // Handle period labels migration
  let periodLabels = []
  if (Array.isArray(loaded.periodLabels)) {
    periodLabels = loaded.periodLabels
  } else if (loaded.periodLabel) {
    // Migration from old single periodLabel to array
    const numPeriods = loaded.numPeriods || 7
    periodLabels = Array(numPeriods).fill(loaded.periodLabel)
  } else {
    // Default period labels
    const numPeriods = loaded.numPeriods || 7
    periodLabels = Array(numPeriods).fill('Per')
  }
  
  const merged = {
    grades: loaded.grades || [],
    classServices: Array.isArray(loaded.classServices) ? loaded.classServices.map((svc, i) => ({
      name: svc.name || defaultClassServices[i]?.name || '',
      subcategories: Array.isArray(svc.subcategories) ? svc.subcategories : (defaultClassServices[i]?.subcategories || []),
      enabledSubcategories: Array.isArray(svc.enabledSubcategories) ? svc.enabledSubcategories : (defaultClassServices[i]?.enabledSubcategories || [])
    })) : defaultClassServices,
    directedStudiesFA: loaded.directedStudiesFA || { directedStudies: true, fa: true },
    serviceProviders: Array.isArray(loaded.serviceProviders) ? loaded.serviceProviders : DEFAULT_SERVICE_PROVIDERS.map(s => s.abbreviation),
    customServiceProviders: Array.isArray(loaded.customServiceProviders) ? loaded.customServiceProviders : [],
    numPeriods: loaded.numPeriods || 7,
    periodLabels: periodLabels
  }
  // Ensure classServices has at least 5 entries
  while (merged.classServices.length < 5) {
    merged.classServices.push(defaultClassServices[merged.classServices.length])
  }
  return merged
}

const saveSettings = async () => {
  saveLoading.value = true
  status.value = ''
  statusError.value = false
  try {
    console.log('Saving settings:', JSON.stringify(settings.value, null, 2))
    await saveAppSettings(settings.value)
    status.value = '✅ Settings saved successfully!'
    // Clear status after 3 seconds
    setTimeout(() => {
      if (status.value === '✅ Settings saved successfully!') {
        status.value = ''
      }
    }, 3000)
  } catch (e) {
    console.error('Error saving settings:', e)
    status.value = '❌ Failed to save settings: ' + (e && e.message ? e.message : e)
    statusError.value = true
  } finally {
    saveLoading.value = false
  }
}
const loadSettings = async (showMessage = false) => {
  status.value = ''
  statusError.value = false
  try {
    const loaded = await loadAppSettings()
    if (loaded) {
      settings.value = normalizeSettings(loaded)
      if (showMessage) {
        status.value = '✅ Settings loaded!'
        setTimeout(() => {
          if (status.value === '✅ Settings loaded!') {
            status.value = ''
          }
        }, 3000)
      }
    } else {
      settings.value = normalizeSettings({})
      if (showMessage) {
        status.value = 'No saved settings found.'
        setTimeout(() => {
          if (status.value === 'No saved settings found.') {
            status.value = ''
          }
        }, 3000)
      }
    }
  } catch (e) {
    status.value = '❌ Failed to load settings.'
    statusError.value = true
  }
}
const resetSettings = () => {
  settings.value = {
    grades: [],
    classServices: [
      { name: 'SDC', subcategories: [...CORE_SUBCATEGORIES], enabledSubcategories: [...CORE_SUBCATEGORIES] },
      { name: 'Co-teach', subcategories: [...CORE_SUBCATEGORIES], enabledSubcategories: [...CORE_SUBCATEGORIES] },
      { name: 'RSP', subcategories: [...CORE_SUBCATEGORIES], enabledSubcategories: [...CORE_SUBCATEGORIES] },
      { name: 'Directed Studies', subcategories: ['Directed Studies'], enabledSubcategories: ['Directed Studies'] },
      { name: 'FA', subcategories: ['FA'], enabledSubcategories: ['FA'] }
    ],
    directedStudiesFA: {
      directedStudies: true,
      fa: true
    },
    serviceProviders: DEFAULT_SERVICE_PROVIDERS.map(s => s.abbreviation),
    customServiceProviders: [],
    numPeriods: 7,
    periodLabels: ['1', '2', '3', '4', '5', '6', 'SH']
  }
  status.value = 'Settings reset to defaults.'
  setTimeout(() => {
    if (status.value === 'Settings reset to defaults.') {
      status.value = ''
    }
  }, 3000)
}

const serviceProviders = computed(() => DEFAULT_SERVICE_PROVIDERS)

// Watch for changes in numPeriods and adjust periodLabels array
watch(() => settings.value.numPeriods, (newNumPeriods, oldNumPeriods) => {
  if (newNumPeriods > oldNumPeriods) {
    // Adding periods - add default labels
    while (settings.value.periodLabels.length < newNumPeriods) {
      settings.value.periodLabels.push(`Per${settings.value.periodLabels.length + 1}`)
    }
  } else if (newNumPeriods < oldNumPeriods) {
    // Removing periods - trim the array
    settings.value.periodLabels = settings.value.periodLabels.slice(0, newNumPeriods)
  }
}, { immediate: true })

onMounted(() => loadSettings(false))

// TODO: Wire these settings into the rest of the app (forms, filters, etc)
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