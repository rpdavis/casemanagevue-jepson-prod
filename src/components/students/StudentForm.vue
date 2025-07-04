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

        <!-- Admin Overrides -->
        <fieldset class="form-col override-section">
          <legend>Admin Overrides</legend>
          <!-- Removed periods override since we removed the periods admin panel -->
        </fieldset>

        <!-- Schedule -->
        <fieldset class="form-col">
          <legend>Schedule</legend>
          <div class="inner-grid-3">
            <template v-for="p in periods" :key="p">
              <label>Period {{ p }}:
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
            <template v-if="appSettings && appSettings.value && appSettings.value.classServices">
              <ServiceCheckboxGroup
                v-for="service in appSettings.value.classServices"
                :key="service.name"
                :label="service.name"
                :items="service.enabledSubcategories || service.subcategories"
                v-model="form.services"
              />
            </template>
            <template v-else>
              <!-- fallback to default -->
              <ServiceCheckboxGroup label="Co-teach" :items="['English', 'Math']" v-model="form.services" />
              <ServiceCheckboxGroup label="RSP" :items="['English', 'Math']" v-model="form.services" />
              <ServiceCheckboxGroup label="SDC" :items="['English', 'Math', 'History', 'Science']" v-model="form.services" />
              <ServiceCheckboxGroup label="FA" :items="['']" v-model="form.services" />
            </template>
          </div>
        </fieldset>

        <!-- Services: providers -->
        <fieldset>
          <legend>Services: providers</legend>
          <div class="inner-grid-3">
            <template v-if="serviceProviders.length > 0">
              <!-- Debug info -->
              <div style="font-size: 12px; color: #666; margin-bottom: 10px;">
                Debug: Found {{ serviceProviders.length }} service providers in app settings
              </div>
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
              <!-- Debug info -->
              <div style="font-size: 12px; color: #666; margin-bottom: 10px;">
                Debug: No service providers configured in app settings
              </div>
              <div style="font-size: 12px; color: #999; font-style: italic;">
                Please configure service providers in App Settings to see provider options here.
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
const { appSettings, loadAppSettings } = useAppSettings()
onMounted(async () => {
  await loadAppSettings()
})

// Dynamic periods - use fixed number since we removed periods admin panel
const DEFAULT_PERIODS = ['1', '2', '3', '4', '5', '6', '7']
const periods = computed(() => {
  // Use fixed periods since we removed the periods admin panel
  return DEFAULT_PERIODS
})

// Grades options
const gradeOptions = computed(() => {
  if (appSettings.value && appSettings.value.grades && appSettings.value.grades.length > 0) {
    return appSettings.value.grades
  }
  return ['7', '8']
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
  firstName: getDisplayValue(props.student, 'firstName') || '',
  lastName: getDisplayValue(props.student, 'lastName') || '',
  grade: getDisplayValue(props.student, 'grade') || '7',
  plan: getDisplayValue(props.student, 'plan') || 'IEP',
  reviewDate: getDisplayValue(props.student, 'reviewDate') || '',
  reevalDate: getDisplayValue(props.student, 'reevalDate') || '',
  meetingDate: getDisplayValue(props.student, 'meetingDate') || '',
  caseManagerId: props.student.caseManagerId || props.student.casemanager_id || '',
  schedule: { ...props.student.schedule } || {},
  services: props.student.services ? props.student.services.filter(s => s.includes(':')) : [],
  speechId: props.student.speechId || props.student.speech_id || '',
  otId: props.student.otId || props.student.ot_id || '',
  mhId: props.student.mhId || props.student.mh_id || '',
  ptId: props.student.ptId || props.student.pt_id || '',
  scId: props.student.scId || props.student.sc_id || '',
  trId: props.student.trId || props.student.tr_id || '',
  audId: props.student.audId || props.student.aud_id || '',
  viId: props.student.viId || props.student.vi_id || '',
  atId: props.student.atId || props.student.at_id || '',
  dhhId: props.student.dhhId || props.student.dhh_id || '',
  omId: props.student.omId || props.student.om_id || '',
  bisId: props.student.bisId || props.student.bis_id || '',
  hnId: props.student.hnId || props.student.hn_id || '',
  swId: props.student.swId || props.student.sw_id || '',
  instruction: getDisplayValue(props.student, 'instruction') || '',
  assessment: getDisplayValue(props.student, 'assessment') || '',
  flag1: !!props.student.flag1,
  flag2: !!props.student.flag2,
  bipFile: null,
  ataglanceFile: null,
  removeBipFile: false,
  removeAtaglanceFile: false
})

// Watch for changes in student prop and update form
watch(() => props.student, (newStudent) => {
  if (newStudent && Object.keys(newStudent).length > 0) {
    form.firstName = getDisplayValue(newStudent, 'firstName') || ''
    form.lastName = getDisplayValue(newStudent, 'lastName') || ''
    form.grade = getDisplayValue(newStudent, 'grade') || '7'
    form.plan = getDisplayValue(newStudent, 'plan') || 'IEP'
    form.reviewDate = getDisplayValue(newStudent, 'reviewDate') || ''
    form.reevalDate = getDisplayValue(newStudent, 'reevalDate') || ''
    form.meetingDate = getDisplayValue(newStudent, 'meetingDate') || ''
    form.caseManagerId = newStudent.caseManagerId || newStudent.casemanager_id || ''
    form.schedule = { ...newStudent.schedule } || {}
    form.services = newStudent.services ? newStudent.services.filter(s => s.includes(':')) : []
    form.speechId = newStudent.speechId || newStudent.speech_id || ''
    form.otId = newStudent.otId || newStudent.ot_id || ''
    form.mhId = newStudent.mhId || newStudent.mh_id || ''
    form.ptId = newStudent.ptId || newStudent.pt_id || ''
    form.scId = newStudent.scId || newStudent.sc_id || ''
    form.trId = newStudent.trId || newStudent.tr_id || ''
    form.audId = newStudent.audId || newStudent.aud_id || ''
    form.viId = newStudent.viId || newStudent.vi_id || ''
    form.atId = newStudent.atId || newStudent.at_id || ''
    form.dhhId = newStudent.dhhId || newStudent.dhh_id || ''
    form.omId = newStudent.omId || newStudent.om_id || ''
    form.bisId = newStudent.bisId || newStudent.bis_id || ''
    form.hnId = newStudent.hnId || newStudent.hn_id || ''
    form.swId = newStudent.swId || newStudent.sw_id || ''
    form.instruction = getDisplayValue(newStudent, 'instruction') || ''
    form.assessment = getDisplayValue(newStudent, 'assessment') || ''
    form.flag1 = !!newStudent.flag1
    form.flag2 = !!newStudent.flag2
    form.bipFile = null
    form.ataglanceFile = null
    form.removeBipFile = false
    form.removeAtaglanceFile = false
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
  console.log('serviceProviders computed - appSettings:', appSettings)
  console.log('appSettings.value:', appSettings.value)
  console.log('appSettings.value.serviceProviders:', appSettings.value?.serviceProviders)
  console.log('appSettings.value.serviceProviders length:', appSettings.value?.serviceProviders?.length)
  
  if (appSettings.value && appSettings.value.serviceProviders && appSettings.value.serviceProviders.length > 0) {
    console.log('✅ Using app settings service providers:', appSettings.value.serviceProviders)
    return appSettings.value.serviceProviders
  }
  // No fallback - return empty array if no providers configured
  console.log('❌ No service providers configured in app settings')
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
    
    // Compose payload
    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      grade: form.grade,
      plan: form.plan,
      reviewDate: form.reviewDate,
      reevalDate: form.reevalDate,
      meetingDate: form.meetingDate,
      caseManagerId: form.caseManagerId,
      schedule,
      services: classServices,
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
      swId: form.swId,
      instruction: form.instruction,
      assessment: form.assessment,
      flag1: form.flag1,
      flag2: form.flag2,
      bipPdfUrl: bipPdfUrl,
      ataglancePdfUrl: ataglancePdfUrl,
      updatedAt: serverTimestamp()
    }
    
    console.log('Saving payload:', payload)
    
    // Save to Firestore
    if (props.mode === 'edit' && props.student.id) {
      console.log('Updating existing student:', props.student.id)
      // Update existing student
      await setDoc(doc(db, 'students', props.student.id), payload)
      console.log('Student updated successfully')
    } else {
      console.log('Adding new student')
      // Add new student
      payload.createdAt = serverTimestamp()
      const docRef = await addDoc(collection(db, 'students'), payload)
      payload.id = docRef.id
      console.log('Student added successfully with ID:', docRef.id)
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
</style>
