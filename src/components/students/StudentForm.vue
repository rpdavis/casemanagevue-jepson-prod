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
              <input v-model="form.first_name" type="text" required />
            </label>
            <label>Last Name:
              <input v-model="form.last_name" type="text" required />
            </label>
            <label>Grade:
              <select v-model="form.grade">
                <option value="7">7</option>
                <option value="8">8</option>
              </select>
            </label>
            <label>Plan Type:
              <select v-model="form.plan">
                <option value="IEP">IEP</option>
                <option value="504">504</option>
              </select>
            </label>
            <label>Review Date:
              <input v-model="form.review_date" type="date" />
            </label>
            <label>Reevaluation Date:
              <input v-model="form.reeval_date" type="date" />
            </label>
            <label>Meeting Date:
              <input v-model="form.meeting_date" type="date" />
            </label>
            <label>Case Manager:
              <select v-model="form.casemanager_id">
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
          <div class="inner-grid-3">
            <label>
              # of Periods:
              <input v-model.number="form.overrides.num_periods" type="number" min="1" max="12" placeholder="Override # of periods…" />
            </label>
          </div>
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
            <ServiceCheckboxGroup label="Co-teach" :items="['English', 'Math']" v-model="form.services" />
            <ServiceCheckboxGroup label="RSP" :items="['English', 'Math']" v-model="form.services" />
            <ServiceCheckboxGroup label="SDC" :items="['English', 'Math', 'History', 'Science']" v-model="form.services" />
            <ServiceCheckboxGroup label="FA" :items="['']" v-model="form.services" />
          </div>
        </fieldset>

        <!-- Services: providers -->
        <fieldset>
          <legend>Services: providers</legend>
          <div class="inner-grid-3">
            <ServiceSelect id="speech" label="Speech Provider" :list="userRoles.speech" v-model="form.speech_id" />
            <ServiceSelect id="ot" label="OT Provider" :list="userRoles.ot" v-model="form.ot_id" />
            <ServiceSelect id="mh" label="Mental Health Provider" :list="userRoles.mh" v-model="form.mh_id" />
            <input v-model="form.other_services[0]" type="text" placeholder="Other service..." />
            <input v-model="form.other_services[1]" type="text" placeholder="Other service..." />
            <input v-model="form.other_services[2]" type="text" placeholder="Other service..." />
          </div>
        </fieldset>

        <!-- Documents -->
        <fieldset class="form-col">
          <legend>Documents</legend>
          <div class="document-section">
            <label>BIP:
              <input type="file" accept="application/pdf" @change="onFileChange($event, 'bipFile')" />
              <span v-if="mode === 'edit' && student.bip_pdf_url">
                Current: <a :href="student.bip_pdf_url" target="_blank">View BIP</a>
              </span>
            </label>
          </div>
          <div class="document-section">
            <label>At-A-Glance PDF:
              <input type="file" accept="application/pdf" @change="onFileChange($event, 'ataglanceFile')" />
              <span v-if="mode === 'edit' && student.ataglance_pdf_url">
                Current: <a :href="student.ataglance_pdf_url" target="_blank">View At-A-Glance</a>
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
import { ref, computed, watch, reactive } from 'vue'
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/firebase'
import { getDisplayValue } from '@/utils/studentUtils'
import ServiceCheckboxGroup from './ServiceCheckboxGroup.vue'
import ServiceSelect from './ServiceSelect.vue'

// Props
const props = defineProps({
  student: { type: Object, default: () => ({}) },
  users: { type: Object, required: true },
  mode: { type: String, default: 'new' }
})
const emit = defineEmits(['close', 'saved'])

// Dynamic periods
const DEFAULT_PERIODS = ['1', '2', '3', '4', '5', '6']
const numOverride = computed(() => parseInt(props.student?.overrides?.num_periods || props.student?.num_periods || '', 10))
const periods = computed(() =>
  Number.isInteger(numOverride.value) && numOverride.value > 0
    ? Array.from({ length: numOverride.value }, (_, i) => String(i + 1))
    : DEFAULT_PERIODS
)

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
  first_name: getDisplayValue(props.student, 'firstName') || '',
  last_name: getDisplayValue(props.student, 'lastName') || '',
  grade: getDisplayValue(props.student, 'grade') || '7',
  plan: getDisplayValue(props.student, 'plan') || 'IEP',
  review_date: getDisplayValue(props.student, 'reviewDate') || '',
  reeval_date: getDisplayValue(props.student, 'reevalDate') || '',
  meeting_date: getDisplayValue(props.student, 'meetingDate') || '',
  casemanager_id: props.student.casemanager_id || '',
  overrides: { num_periods: props.student.overrides?.num_periods || '' },
  schedule: { ...props.student.schedule } || {},
  services: props.student.services ? props.student.services.filter(s => s.includes(':')) : [],
  other_services: props.student.other_services ? [...props.student.other_services] : (
    props.student.services ? props.student.services.filter(s => !s.includes(':')).slice(0,3) : ['', '', '']
  ),
  speech_id: props.student.speech_id || '',
  ot_id: props.student.ot_id || '',
  mh_id: props.student.mh_id || '',
  instruction: getDisplayValue(props.student, 'instruction') || '',
  assessment: getDisplayValue(props.student, 'assessment') || '',
  flag1: !!props.student.flag1,
  flag2: !!props.student.flag2,
  bipFile: null,
  ataglanceFile: null
})

// Watch for changes in student prop and update form
watch(() => props.student, (newStudent) => {
  if (newStudent && Object.keys(newStudent).length > 0) {
    form.first_name = getDisplayValue(newStudent, 'firstName') || ''
    form.last_name = getDisplayValue(newStudent, 'lastName') || ''
    form.grade = getDisplayValue(newStudent, 'grade') || '7'
    form.plan = getDisplayValue(newStudent, 'plan') || 'IEP'
    form.review_date = getDisplayValue(newStudent, 'reviewDate') || ''
    form.reeval_date = getDisplayValue(newStudent, 'reevalDate') || ''
    form.meeting_date = getDisplayValue(newStudent, 'meetingDate') || ''
    form.casemanager_id = newStudent.casemanager_id || ''
    form.overrides = { num_periods: newStudent.overrides?.num_periods || '' }
    form.schedule = { ...newStudent.schedule } || {}
    form.services = newStudent.services ? newStudent.services.filter(s => s.includes(':')) : []
    form.other_services = newStudent.other_services ? [...newStudent.other_services] : (
      newStudent.services ? newStudent.services.filter(s => !s.includes(':')).slice(0,3) : ['', '', '']
    )
    form.speech_id = newStudent.speech_id || ''
    form.ot_id = newStudent.ot_id || ''
    form.mh_id = newStudent.mh_id || ''
    form.instruction = getDisplayValue(newStudent, 'instruction') || ''
    form.assessment = getDisplayValue(newStudent, 'assessment') || ''
    form.flag1 = !!newStudent.flag1
    form.flag2 = !!newStudent.flag2
    form.bipFile = null
    form.ataglanceFile = null
  }
}, { immediate: true, deep: true })

// Loading state
const isSaving = ref(false)

// File input handlers
function onFileChange(event, key) {
  form[key] = event.target.files[0] || null
}

// Upload file to Firebase Storage
async function uploadFile(file, path) {
  if (!file) return null
  const fileRef = storageRef(storage, path)
  const snapshot = await uploadBytes(fileRef, file)
  return await getDownloadURL(snapshot.ref)
}

// Submit handler
async function handleSubmit() {
  try {
    console.log('Form submitted:', form)
    isSaving.value = true
    
    // Compose services arrays
    const classServices = form.services.filter(s => s && s.includes(':'))
    const otherServices = form.other_services.filter(s => s && !s.includes(':'))
    
    // Compose schedule object
    const schedule = {}
    periods.value.forEach(p => {
      if (form.schedule[p]) schedule[p] = form.schedule[p]
    })
    
    console.log('Composed data:', { classServices, otherServices, schedule })
    
    // Upload files if provided
    let bipPdfUrl = props.student.bip_pdf_url || null
    let ataglancePdfUrl = props.student.ataglance_pdf_url || null
    
    if (form.bipFile) {
      console.log('Uploading BIP file...')
      const studentId = props.mode === 'edit' && props.student.id ? props.student.id : 'temp'
      bipPdfUrl = await uploadFile(form.bipFile, `students/${studentId}/bip.pdf`)
      console.log('BIP uploaded:', bipPdfUrl)
    }
    
    if (form.ataglanceFile) {
      console.log('Uploading At-A-Glance file...')
      const studentId = props.mode === 'edit' && props.student.id ? props.student.id : 'temp'
      ataglancePdfUrl = await uploadFile(form.ataglanceFile, `students/${studentId}/ataglance.pdf`)
      console.log('At-A-Glance uploaded:', ataglancePdfUrl)
    }
    
    // Compose payload
    const payload = {
      first_name: form.first_name,
      last_name: form.last_name,
      grade: form.grade,
      plan: form.plan,
      review_date: form.review_date,
      reeval_date: form.reeval_date,
      meeting_date: form.meeting_date,
      casemanager_id: form.casemanager_id,
      schedule,
      services: classServices,
      other_services: otherServices,
      speech_id: form.speech_id,
      ot_id: form.ot_id,
      mh_id: form.mh_id,
      instruction: form.instruction,
      assessment: form.assessment,
      flag1: form.flag1,
      flag2: form.flag2,
      overrides: { num_periods: form.overrides.num_periods },
      bip_pdf_url: bipPdfUrl,
      ataglance_pdf_url: ataglancePdfUrl,
      updated_at: serverTimestamp()
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
      payload.created_at = serverTimestamp()
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
