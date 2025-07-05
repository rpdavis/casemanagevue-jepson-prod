<template>
  <div class="dialog-backdrop">
    <div class="dialog">
      <header>
        <h2>{{ mode === 'edit' ? 'Edit Student' : 'Add Student' }}</h2>
        <button @click="$emit('close')" class="close-btn">×</button>
      </header>
      <form @submit.prevent="handleSubmit" id="student-form">
        <!-- Student Info -->
        <fieldset class="form-col">
          <legend>Student Info</legend>
          <div class="inner-grid-3">
            <label v-if="mode === 'new'" class="ssid-field">
              <span class="field-label">SSID (State Student ID) *</span>
              <input 
                v-model="form.ssid" 
                type="text" 
                required 
                placeholder="Enter student SSID" 
                class="ssid-input"
              />
              <div class="field-help">
                <strong>Required:</strong> This can be found in your Student Information System (SIS) such as Aeries, or in SEIS. 
                The SSID is used to link student data across different systems.
              </div>
            </label>
            <label>First Name:
              <input v-model="form.firstName" type="text" required />
            </label>
            <label>Last Name:
              <input v-model="form.lastName" type="text" required />
            </label>
            <label>Grade:
              <select v-model="form.grade">
                <option v-for="grade in gradeOptions" :key="grade" :value="grade">
                  {{ grade }}
                </option>
              </select>
            </label>
            <label>Plan Type:
              <select v-model="form.plan">
                <option value="IEP">IEP</option>
                <option value="504">504</option>
              </select>
            </label>
            <label>Review Date:
              <input v-model="form.reviewDate" type="date" />
            </label>
            <label>Reevaluation Date:
              <input v-model="form.reevalDate" type="date" />
            </label>
            <label>Meeting Date:
              <input v-model="form.meetingDate" type="date" />
            </label>
            <label>Case Manager:
              <select v-model="form.caseManagerId">
                <option v-for="cm in userRoles.caseManagers" :key="cm.id" :value="cm.id">
                  {{ cm.name || cm.email || cm.id }}
                </option>
              </select>
            </label>
          </div>
        </fieldset>



        <!-- Schedule -->
        <fieldset class="form-col">
          <legend>Schedule</legend>
          <div class="inner-grid-3">
            <template v-for="p in periods" :key="p">
              <label>{{ p }}:
                <select v-model="form.schedule[p]" class="sched">
                  <option value="">--</option>
                  <option v-for="t in userRoles.teachers" :key="t.id" :value="t.id">
                    {{ t.name || t.email || t.id }}
                  </option>
                </select>
              </label>
            </template>
          </div>
        </fieldset>

        <!-- Services: classes -->
        <fieldset class="form-col">
          <legend>Services: classes</legend>
          <div class="inner-grid-3">
            <!-- Loading state -->
            <template v-if="appSettingsLoading">
              <div class="loading-message">
                <span class="loading-spinner">⏳</span> Loading app settings...
              </div>
            </template>
            
            <!-- Error state -->
            <template v-else-if="appSettingsError">
              <div class="error-message">
                <span class="error-icon">⚠️</span> Error loading app settings: {{ appSettingsError }}
              </div>
            </template>
            
            <!-- Success state -->
            <template v-else-if="availableClassServices.length > 0">
              <ServiceCheckboxGroup
                v-for="service in availableClassServices"
                :key="service.name"
                :label="service.name"
                :items="service.enabledSubcategories"
                v-model="form.services"
              />
            </template>
            
            <!-- No services state -->
            <template v-else>
              <div class="no-services-message">
                <span class="info-icon">ℹ️</span> No class services configured. 
                <a href="/admin" class="settings-link">Configure in App Settings</a>
              </div>
            </template>
          </div>
        </fieldset>

        <!-- Services: providers -->
        <fieldset>
          <legend>Services: providers</legend>
          <div class="inner-grid-3">
            <template v-if="serviceProviders.length > 0">
              <ServiceSelect
                v-for="abbr in serviceProviders"
                :key="abbr"
                :id="abbr"
                :label="getProviderLabel(abbr)"
                :list="getProviderUsers(abbr)"
                v-model="form[providerFieldMap[abbr] || `${abbr.toLowerCase()}Id`]"
              />
              <ServiceSelect
                v-for="custom in customServiceProviders"
                :key="custom"
                :id="custom"
                :label="custom"
                :list="[]"
                v-model="form[`${custom.toLowerCase()}Id`]"
              />
            </template>
            <template v-else>
              <div class="no-services-message">
                <span class="info-icon">ℹ️</span> No service providers configured. 
                <a href="/admin" class="settings-link">Configure in App Settings</a>
              </div>
            </template>
          </div>
        </fieldset>

        <!-- Documents -->
        <fieldset class="form-col">
          <legend>Documents</legend>
          <div class="document-section">
            <label>BIP:
              <input type="file" accept="application/pdf" @change="onFileChange($event, 'bipFile')" />
              <span v-if="mode === 'edit' && student.bipPdfUrl && !form.removeBipFile">
                Current: <a :href="student.bipPdfUrl" target="_blank">View BIP</a>
                <button type="button" @click="removeBipFile" class="btn-remove">🗑️ Remove</button>
              </span>
              <span v-if="form.removeBipFile" class="removed-file">
                BIP file will be removed
              </span>
            </label>
          </div>
          <div class="document-section">
            <label>At-A-Glance PDF:
              <input type="file" accept="application/pdf" @change="onFileChange($event, 'ataglanceFile')" />
              <span v-if="mode === 'edit' && student.ataglancePdfUrl && !form.removeAtaglanceFile">
                Current: <a :href="student.ataglancePdfUrl" target="_blank">View At-A-Glance</a>
                <button type="button" @click="removeAtaglanceFile" class="btn-remove">🗑️ Remove</button>
              </span>
              <span v-if="form.removeAtaglanceFile" class="removed-file">
                At-A-Glance file will be removed
              </span>
            </label>
          </div>
        </fieldset>

        <!-- Accommodations -->
        <fieldset class="form-col">
          <legend>Accommodations</legend>
          <div class="inner-grid-2">
            <label>Instruction:
              <textarea v-model="form.instruction"></textarea>
            </label>
            <label>Assessment:
              <textarea v-model="form.assessment"></textarea>
            </label>
          </div>
        </fieldset>

        <!-- Flags -->
        <fieldset>
          <legend>Flags</legend>
          <label><input type="checkbox" v-model="form.flag1" /> Separate setting</label>
          <label><input type="checkbox" v-model="form.flag2" /> Preferential seating</label>
        </fieldset>

        <footer>
          <button type="button" @click="$emit('close')" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="isSaving">
            {{ isSaving ? 'Saving...' : (mode === 'edit' ? 'Save' : 'Add Student') }}
          </button>
        </footer>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, reactive, onMounted } from 'vue'
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '@/firebase'
import { getDisplayValue } from '@/utils/studentUtils'
import ServiceCheckboxGroup from './ServiceCheckboxGroup.vue'
import ServiceSelect from './ServiceSelect.vue'
import { useAppSettings } from '@/composables/useAppSettings'

// Props
const props = defineProps({
  student: { type: Object, default: () => ({}) },
  users: { type: Object, required: true },
  mode: { type: String, default: 'new' }
})
const emit = defineEmits(['close', 'saved'])

// Load app settings
const { appSettings, loadAppSettings, loading: appSettingsLoading, error: appSettingsError } = useAppSettings()
onMounted(async () => {
  try {
    console.log('StudentForm: Starting to load app settings...')
    await loadAppSettings()
    console.log('StudentForm: App settings loaded successfully:', appSettings.value)
    console.log('StudentForm: App settings loading state:', appSettingsLoading.value)
    console.log('StudentForm: App settings error:', appSettingsError.value)
  } catch (error) {
    console.error('StudentForm: Error loading app settings:', error)
  }
})

// Dynamic periods - use app settings only
const periods = computed(() => {
  // Use app settings periods
  if (appSettings.value?.numPeriods && appSettings.value?.periodLabels) {
    return appSettings.value.periodLabels.slice(0, appSettings.value.numPeriods)
  }
  
  // Fallback to default periods
  return ['Per1', 'Per2', 'Per3', 'Per4', 'Per5', 'Per6', 'Per7']
})

// Grades options
const gradeOptions = computed(() => {
  if (appSettings.value && appSettings.value.grades && appSettings.value.grades.length > 0) {
    console.log('StudentForm: Using app settings grades:', appSettings.value.grades)
    return appSettings.value.grades
  }
  console.log('StudentForm: Using fallback grades: [7, 8]')
  return ['7', '8']
})

// Class services for template - reactive to app settings
const availableClassServices = computed(() => {
  if (appSettings.value && appSettings.value.classServices && appSettings.value.classServices.length > 0) {
    const enabledServices = appSettings.value.classServices.filter(s => 
      s.enabledSubcategories && s.enabledSubcategories.length > 0
    )
    console.log('StudentForm: Available class services:', enabledServices.length, 'services')
    return enabledServices
  }
  console.log('StudentForm: No class services available')
  return []
})

// Use the new userRoles structure that matches vanilla JS
const userRoles = computed(() => {
  if (props.users.userRoles) {
    return props.users.userRoles
  }
  // Fallback to old structure if userRoles not available
  return {
    teachers: props.users.teachers || [],
    caseManagers: props.users.caseManagers || [],
    speech: props.users.speech || [],
    ot: props.users.ot || [],
    mh: props.users.mh || []
  }
})

// Form state - use hierarchy for fields that could have duplicate data
const form = reactive({
  ssid: props.student.id || '',
  firstName: getDisplayValue(props.student, 'firstName') || '',
  lastName: getDisplayValue(props.student, 'lastName') || '',
  grade: getDisplayValue(props.student, 'grade') || '7',
  plan: getDisplayValue(props.student, 'plan') || 'IEP',
  reviewDate: getDisplayValue(props.student, 'reviewDate') || '',
  reevalDate: getDisplayValue(props.student, 'reevalDate') || '',
  meetingDate: getDisplayValue(props.student, 'meetingDate') || '',
  caseManagerId: props.student.app?.studentData?.caseManagerId || props.student.caseManagerId || props.student.casemanager_id || '',
  schedule: { ...(props.student.app?.schedule?.periods || props.student.schedule) } || {},
  services: (props.student.app?.schedule?.classServices || props.student.services) || [],
  speechId: props.student.app?.providers?.speechId || props.student.speechId || props.student.speech_id || '',
  otId: props.student.app?.providers?.otId || props.student.otId || props.student.ot_id || '',
  mhId: props.student.app?.providers?.mhId || props.student.mhId || props.student.mh_id || '',
  ptId: props.student.app?.providers?.ptId || props.student.ptId || props.student.pt_id || '',
  scId: props.student.app?.providers?.scId || props.student.scId || props.student.sc_id || '',
  trId: props.student.app?.providers?.trId || props.student.trId || props.student.tr_id || '',
  audId: props.student.app?.providers?.audId || props.student.audId || props.student.aud_id || '',
  viId: props.student.app?.providers?.viId || props.student.viId || props.student.vi_id || '',
  atId: props.student.app?.providers?.atId || props.student.atId || props.student.at_id || '',
  dhhId: props.student.app?.providers?.dhhId || props.student.dhhId || props.student.dhh_id || '',
  omId: props.student.app?.providers?.omId || props.student.omId || props.student.om_id || '',
  bisId: props.student.app?.providers?.bisId || props.student.bisId || props.student.bis_id || '',
  hnId: props.student.app?.providers?.hnId || props.student.hnId || props.student.hn_id || '',
  swId: props.student.app?.providers?.swId || props.student.swId || props.student.sw_id || '',
  instruction: getDisplayValue(props.student, 'instruction') || '',
  assessment: getDisplayValue(props.student, 'assessment') || '',
  flag1: props.student.app?.flags?.flag1 || props.student.flag1 || false,
  flag2: props.student.app?.flags?.flag2 || props.student.flag2 || false,
  ataglancePdfUrl: props.student.app?.documents?.ataglancePdfUrl || props.student.ataglancePdfUrl || '',
  bipPdfUrl: props.student.app?.documents?.bipPdfUrl || props.student.bipPdfUrl || '',
  bipFile: null,
  ataglanceFile: null,
  removeBipFile: false,
  removeAtaglanceFile: false
})

// Watch for changes in student prop and update form
watch(() => props.student, (newStudent) => {
  if (newStudent && Object.keys(newStudent).length > 0) {
    form.ssid = newStudent.id || ''
    form.firstName = getDisplayValue(newStudent, 'firstName') || ''
    form.lastName = getDisplayValue(newStudent, 'lastName') || ''
    form.grade = getDisplayValue(newStudent, 'grade') || '7'
    form.plan = getDisplayValue(newStudent, 'plan') || 'IEP'
    form.reviewDate = getDisplayValue(newStudent, 'reviewDate') || ''
    form.reevalDate = getDisplayValue(newStudent, 'reevalDate') || ''
    form.meetingDate = getDisplayValue(newStudent, 'meetingDate') || ''
    form.caseManagerId = newStudent.app?.studentData?.caseManagerId || newStudent.caseManagerId || newStudent.casemanager_id || ''
    form.schedule = { ...newStudent.app?.schedule?.periods || newStudent.schedule } || {}
    form.services = newStudent.app?.schedule?.classServices || newStudent.services || []
    form.speechId = newStudent.app?.providers?.speechId || newStudent.speechId || newStudent.speech_id || ''
    form.otId = newStudent.app?.providers?.otId || newStudent.otId || newStudent.ot_id || ''
    form.mhId = newStudent.app?.providers?.mhId || newStudent.mhId || newStudent.mh_id || ''
    form.ptId = newStudent.app?.providers?.ptId || newStudent.ptId || newStudent.pt_id || ''
    form.scId = newStudent.app?.providers?.scId || newStudent.scId || newStudent.sc_id || ''
    form.trId = newStudent.app?.providers?.trId || newStudent.trId || newStudent.tr_id || ''
    form.audId = newStudent.app?.providers?.audId || newStudent.audId || newStudent.aud_id || ''
    form.viId = newStudent.app?.providers?.viId || newStudent.viId || newStudent.vi_id || ''
    form.atId = newStudent.app?.providers?.atId || newStudent.atId || newStudent.at_id || ''
    form.dhhId = newStudent.app?.providers?.dhhId || newStudent.dhhId || newStudent.dhh_id || ''
    form.omId = newStudent.app?.providers?.omId || newStudent.omId || newStudent.om_id || ''
    form.bisId = newStudent.app?.providers?.bisId || newStudent.bisId || newStudent.bis_id || ''
    form.hnId = newStudent.app?.providers?.hnId || newStudent.hnId || newStudent.hn_id || ''
    form.swId = newStudent.app?.providers?.swId || newStudent.swId || newStudent.sw_id || ''
    form.instruction = getDisplayValue(newStudent, 'instruction') || ''
    form.assessment = getDisplayValue(newStudent, 'assessment') || ''
    form.flag1 = !!(newStudent.app?.flags?.flag1 || newStudent.flag1)
    form.flag2 = !!(newStudent.app?.flags?.flag2 || newStudent.flag2)
    form.bipFile = null
    form.ataglanceFile = null
    form.removeBipFile = false
    form.removeAtaglanceFile = false
  }
}, { immediate: true, deep: true })

// Watch for app settings changes and update form accordingly
watch(() => appSettings.value, (newSettings) => {
  console.log('StudentForm: App settings watcher triggered:', newSettings)
  
  // Update grade if app settings has grades and current grade is not in the list
  if (newSettings?.grades && newSettings.grades.length > 0) {
    if (!newSettings.grades.includes(form.grade)) {
      form.grade = newSettings.grades[0] || '7'
    }
  }
}, { immediate: true, deep: true })

// Loading state
const isSaving = ref(false)

// File input handlers
function onFileChange(event, key) {
  form[key] = event.target.files[0] || null
}

// Remove file from Firebase Storage
async function deleteFile(url) {
  if (!url) return
  
  try {
    // Extract the file path from the URL
    const urlObj = new URL(url)
    const pathSegments = urlObj.pathname.split('/')
    const filePath = pathSegments.slice(pathSegments.indexOf('o') + 1).join('/')
    
    // Decode the path
    const decodedPath = decodeURIComponent(filePath)
    
    // Delete from Firebase Storage
    const fileRef = storageRef(storage, decodedPath)
    await deleteObject(fileRef)
    console.log('File deleted successfully:', decodedPath)
  } catch (error) {
    console.error('Error deleting file:', error)
    throw error
  }
}

// Remove file handlers
function removeBipFile(event) {
  event.preventDefault()
  event.stopPropagation()
  form.removeBipFile = true
  form.bipFile = null
}

function removeAtaglanceFile(event) {
  event.preventDefault()
  event.stopPropagation()
  form.removeAtaglanceFile = true
  form.ataglanceFile = null
}

// Upload file to Firebase Storage
async function uploadFile(file, path) {
  if (!file) return null
  const fileRef = storageRef(storage, path)
  const snapshot = await uploadBytes(fileRef, file)
  return await getDownloadURL(snapshot.ref)
}

// Service Providers integration
const providerFieldMap = {
  SLP: 'speechId',
  OT: 'otId',
  MH: 'mhId',
  PT: 'ptId',
  SC: 'scId',
  TR: 'trId',
  AUD: 'audId',
  VI: 'viId',
  AT: 'atId',
  DHH: 'dhhId',
  'O&M': 'omId',
  BIS: 'bisId',
  HN: 'hnId',
  SW: 'swId'
}
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
function getProviderLabel(abbr) {
  // Try to find in App Settings first
  if (appSettings.value && appSettings.value.serviceProviders && Array.isArray(appSettings.value.serviceProviders)) {
    const found = (appSettings.value.serviceProvidersDetails || DEFAULT_SERVICE_PROVIDERS).find(s => s.abbreviation === abbr)
    if (found) return found.name + ' (' + abbr + ')'
  }
  // Fallback to default list
  const found = DEFAULT_SERVICE_PROVIDERS.find(s => s.abbreviation === abbr)
  return found ? found.name + ' (' + abbr + ')' : abbr
}

function getProviderUsers(abbr) {
  // Map provider abbreviations to user role keys
  const providerUserMap = {
    'SLP': 'speech',
    'OT': 'ot', 
    'MH': 'mh',
    'PT': 'pt',
    'SC': 'sc',
    'TR': 'tr',
    'AUD': 'aud',
    'VI': 'vi',
    'AT': 'at',
    'DHH': 'dhh',
    'O&M': 'om',
    'BIS': 'bis',
    'HN': 'hn',
    'SW': 'sw'
  }
  
  const userRoleKey = providerUserMap[abbr] || abbr.toLowerCase()
  return userRoles.value[userRoleKey] || []
}
const serviceProviders = computed(() => {
  if (appSettings.value && appSettings.value.serviceProviders && appSettings.value.serviceProviders.length > 0) {
    console.log('StudentForm: Using app settings service providers:', appSettings.value.serviceProviders.length, 'providers')
    return appSettings.value.serviceProviders
  }
  console.log('StudentForm: No service providers configured in app settings')
  return []
})
const customServiceProviders = computed(() => {
  if (appSettings.value && appSettings.value.customServiceProviders) {
    return appSettings.value.customServiceProviders
  }
  return []
})

// Submit handler
async function handleSubmit() {
  try {
    console.log('Form submitted:', form)
    isSaving.value = true
    
    // Validate SSID for new students
    if (props.mode === 'new' && (!form.ssid || form.ssid.trim() === '')) {
      alert('SSID is required. Please enter the student\'s State Student ID from your SIS (Aeries, SEIS, etc.).')
      isSaving.value = false
      return
    }
    
    // Compose services arrays
    const classServices = form.services.filter(s => s && s.includes(':'))
    
    // Compose schedule object
    const schedule = {}
    periods.value.forEach(p => {
      if (form.schedule[p]) schedule[p] = form.schedule[p]
    })
    
    console.log('Composed data:', { classServices, schedule })
    
    // Handle file uploads and removals
    let bipPdfUrl = props.student.bipPdfUrl || null
    let ataglancePdfUrl = props.student.ataglancePdfUrl || null
    
    // Handle BIP file
    if (form.removeBipFile && props.student.bipPdfUrl) {
      console.log('Removing BIP file...')
      await deleteFile(props.student.bipPdfUrl)
      bipPdfUrl = null
    } else if (form.bipFile) {
      console.log('Uploading BIP file...')
      const studentId = props.mode === 'edit' && props.student.id ? props.student.id : 'temp'
      bipPdfUrl = await uploadFile(form.bipFile, `students/${studentId}/bip.pdf`)
      console.log('BIP uploaded:', bipPdfUrl)
    }
    
    // Handle At-A-Glance file
    if (form.removeAtaglanceFile && props.student.ataglancePdfUrl) {
      console.log('Removing At-A-Glance file...')
      await deleteFile(props.student.ataglancePdfUrl)
      ataglancePdfUrl = null
    } else if (form.ataglanceFile) {
      console.log('Uploading At-A-Glance file...')
      const studentId = props.mode === 'edit' && props.student.id ? props.student.id : 'temp'
      ataglancePdfUrl = await uploadFile(form.ataglanceFile, `students/${studentId}/ataglance.pdf`)
      console.log('At-A-Glance uploaded:', ataglancePdfUrl)
    }
    
    // Compose payload - save to nested 'app' structure with categories
    const appData = {
      // Basic student information
      studentData: {
        firstName: form.firstName,
        lastName: form.lastName,
        grade: form.grade,
        plan: form.plan,
        caseManagerId: form.caseManagerId
      },
      
      // Important dates
      dates: {
        reviewDate: form.reviewDate,
        reevalDate: form.reevalDate,
        meetingDate: form.meetingDate
      },
      
      // Academic schedule and services
      schedule: {
        periods: schedule,
        classServices: classServices
      },
      
      // Service providers
      providers: {
        speechId: form.speechId,
        otId: form.otId,
        mhId: form.mhId,
        ptId: form.ptId,
        scId: form.scId,
        trId: form.trId,
        audId: form.audId,
        viId: form.viId,
        atId: form.atId,
        dhhId: form.dhhId,
        omId: form.omId,
        bisId: form.bisId,
        hnId: form.hnId,
        swId: form.swId
      },
      
      // Accommodations
      accommodations: {
        instruction: form.instruction,
        assessment: form.assessment
      },
      
      // Flags
      flags: {
        flag1: form.flag1,
        flag2: form.flag2
      },
      
      // Documents
      documents: {
        ataglancePdfUrl: ataglancePdfUrl,
        bipPdfUrl: bipPdfUrl
      }
    }
    
    console.log('Saving payload:', appData)
    
    // Create the full payload with nested structure
    const payload = {
      app: appData,
      updatedAt: serverTimestamp()
    }
    
    console.log('Saving payload:', payload)
    
    // Save to Firestore
    if (props.mode === 'edit' && props.student.id) {
      console.log('Updating existing student:', props.student.id)
      // Update existing student with merge to preserve other data
      await setDoc(doc(db, 'students', props.student.id), payload, { merge: true })
      console.log('Student updated successfully')
    } else {
      console.log('Adding new student')
      // For new students, SSID is required
      if (!form.ssid || form.ssid.trim() === '') {
        alert('SSID is required for new students')
        return
      }
      
      const ssid = form.ssid.trim()
      
      // Add SSID to the payload for internal reference
      payload.app.studentData.ssid = ssid
      
      // Use Firebase auto-generated ID for security
      const docRef = doc(collection(db, 'students'))
      payload.createdAt = serverTimestamp()
      await setDoc(docRef, payload)
      payload.id = docRef.id
      console.log('Student added successfully with ID:', docRef.id, 'SSID:', ssid)
    }
    
    emit('saved', payload)
    emit('close')
  } catch (error) {
    console.error('Error saving student:', error)
    alert('Error saving student. Please try again.')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.ssid-field {
  grid-column: span 3;
  margin-bottom: 20px;
}

.field-label {
  font-weight: 600;
  color: #d32f2f;
  display: block;
  margin-bottom: 8px;
}

.ssid-input {
  border: 2px solid #d32f2f;
  background-color: #fff3f3;
}

.ssid-input:focus {
  border-color: #1976d2;
  background-color: #fff;
}

.field-help {
  font-size: 12px;
  color: #666;
  margin-top: 6px;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  border-left: 3px solid #1976d2;
}

.btn-remove {
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 2px 8px;
  margin-left: 8px;
  cursor: pointer;
  font-size: 12px;
}

.btn-remove:hover {
  background: #d32f2f;
}

.removed-file {
  color: #f44336;
  font-style: italic;
  font-size: 14px;
  margin-left: 8px;
}

.document-section {
  margin-bottom: 16px;
}

.document-section label {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.document-section span {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* App Settings Integration Styles */
.loading-message, .error-message, .no-services-message {
  grid-column: span 3;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.loading-message {
  background-color: #f0f8ff;
  color: #0066cc;
  border: 1px solid #b3d9ff;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

.error-message {
  background-color: #fff5f5;
  color: #d32f2f;
  border: 1px solid #ffcdd2;
}

.error-icon {
  font-size: 16px;
}

.no-services-message {
  background-color: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.info-icon {
  font-size: 16px;
}

.settings-link {
  color: #1976d2;
  text-decoration: none;
  font-weight: 500;
}

.settings-link:hover {
  text-decoration: underline;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
