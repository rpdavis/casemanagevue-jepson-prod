<template>
  <div class="dialog-backdrop">
    <div class="dialog">
      <header>
        <h2>Email about {{ student.firstName || student.first_name }} {{ student.lastName || student.last_name }}</h2>
        <button @click="$emit('close')" title="Close">×</button>
      </header>
      <main>
        <form @submit.prevent>
          <div class="button-group">
            <button 
              v-if="caseManager"
              type="button"
              :class="['option-button', { active: sendTo === 'CaseManager' }]"
              @click="sendTo = 'CaseManager'"
            >
              Case Manager
            </button>
            <button 
              type="button"
              :class="['option-button', { active: sendTo === 'Teachers' }]"
              @click="sendTo = 'Teachers'"
            >
              Teachers
            </button>
            <button 
              type="button"
              :class="['option-button', { active: sendTo === 'TeachersAndService' }]"
              @click="sendTo = 'TeachersAndService'"
            >
              Teachers and service providers
            </button>
            <button 
              type="button"
              :class="['option-button', { active: sendTo === 'Individual' }]"
              @click="sendTo = 'Individual'"
            >
              Individual member of the IEP team
            </button>
          </div>

          <!-- Show selected recipients -->
          <div v-if="emails" class="selected-recipients">
            <div class="recipients-header">
              <h4>Selected Recipients:</h4>
              <button 
                v-if="!gmailApiEnabled" 
                type="button" 
                class="copy-button"
                @click="copyToClipboard(emails)"
                :class="{ copied: showingCopied }"
              >
                {{ showingCopied ? 'Copied!' : 'Copy All' }}
              </button>
            </div>
            <div class="recipients-list">
              {{ emails }}
            </div>
            <div v-if="!gmailApiEnabled" class="recipients-note">
              <p>Note: Gmail API features are not enabled. You can copy these email addresses to use in your email client.</p>
            </div>
          </div>
          <div v-if="sendTo === 'Individual'" class="members-list">
            <div>Select members:</div>
            <div v-for="member in allMembers" :key="member.id">
              <label>
                <span>
                  {{ member.name || member.displayName || member.email || member.id }}
                  <span v-if="member.email" class="email">({{ member.email }})</span>
                </span>
                <input type="checkbox" :value="member.id" v-model="checkedMembers" />
              </label>
            </div>
          </div>
          <!-- Update categories - only for case managers -->
          <div v-if="isCaseManager" class="update-categories">
            <h4>Select what has been updated:</h4>
            
            <div class="checkbox-group">
              <div class="checkbox-item">
                <input type="checkbox" v-model="updateCategories.studentInfo" />
                <label>Student information</label>
              </div>
              
              <div class="checkbox-item">
                <input type="checkbox" v-model="updateCategories.meetingDates" />
                <label>Meeting dates</label>
              </div>
              
              <div class="checkbox-item">
                <input type="checkbox" v-model="updateCategories.services" />
                <label>Services</label>
              </div>
              
              <div class="checkbox-item">
                <input type="checkbox" v-model="updateCategories.schedule" />
                <label>Schedule</label>
              </div>
              
              <div class="checkbox-item">
                <input type="checkbox" v-model="updateCategories.instructionAccommodations" />
                <label>Instruction accommodations</label>
              </div>
              
              <div class="checkbox-item">
                <input type="checkbox" v-model="updateCategories.assessmentAccommodations" />
                <label>Assessment accommodations</label>
              </div>
              
              <div class="checkbox-item">
                <input type="checkbox" v-model="updateCategories.documents" :disabled="!hasDocs" />
                <label>
                  Documents
                  <span v-if="!hasDocs" class="no-docs">(No docs available)</span>
                </label>
              </div>
            </div>
          </div>
        </form>
      </main>
      <footer>
        <button @click="$emit('close')">Cancel</button>
        <template v-if="gmailApiEnabled">
          <button :disabled="!canSend" @click="sendEmail">Send Email</button>
        </template>
        <template v-else>
          <button :disabled="!canSend" @click="copyToClipboard(emails)">
            {{ showingCopied ? 'Copied!' : 'Copy Email Addresses' }}
          </button>
        </template>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useAppSettings } from '@/composables/useAppSettings'

const props = defineProps({
  student: { type: Object, required: true },
  userMap: { type: Object, required: true },
  currentUser: { type: Object, required: false }
})
const { student, userMap } = props

const emit = defineEmits(['close'])

// Get app settings to check Gmail API status
const { appSettings } = useAppSettings()
const gmailApiEnabled = computed(() => appSettings.value.gmailApi?.enabled ?? false)

// Function to copy text to clipboard
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    showCopiedMessage()
  } catch (err) {
    console.error('Failed to copy:', err)
    alert('Failed to copy to clipboard. Please copy the email addresses manually.')
  }
}

// Show "Copied!" message
const showingCopied = ref(false)
const showCopiedMessage = () => {
  showingCopied.value = true
  setTimeout(() => {
    showingCopied.value = false
  }, 2000)
}

const sendTo = ref('')
const checkedMembers = ref([])
const updateCategories = ref({
  studentInfo: false,
  meetingDates: false,
  services: false,
  schedule: false,
  instructionAccommodations: false,
  assessmentAccommodations: false,
  documents: false
})

// Gather teacher IDs from student schedule
const teacherIds = computed(() => {
  // Check new nested structure first
  if (student.app?.schedule?.periods) {
    const ids = []
    Object.values(student.app.schedule.periods).forEach(periodData => {
      // Add main teacher
      const teacherId = typeof periodData === 'string' ? periodData : periodData?.teacherId
      if (teacherId) ids.push(teacherId)
      
      // Add co-teaching case manager if present
      if (periodData?.coTeaching?.caseManagerId) {
        ids.push(periodData.coTeaching.caseManagerId)
      }
    })
    return ids
  }
  // Fallback to legacy structure
  const sched = student.schedule || {}
  return Object.values(sched).filter(Boolean)
})

const uniqueTeacherIds = computed(() => [...new Set(teacherIds.value)])

// Gather service provider IDs
const serviceProviderIds = computed(() => {
  const ids = []
  
  // Check new nested structure first
  if (student.app?.providers) {
    Object.entries(student.app.providers).forEach(([key, value]) => {
      if (value && !['caseManagerId'].includes(key)) {
        ids.push(value)
      }
    })
  }
  
  // Check legacy structure
  for (const key in student) {
    if (key.endsWith('_id') && !['casemanager_id', 'caseManagerId'].includes(key) && student[key]) {
      ids.push(student[key])
    }
  }
  
  // Remove any that are also teachers
  return [...new Set(ids)].filter(id => !uniqueTeacherIds.value.includes(id))
})

// Base lists without filtering
const baseTeachers = computed(() => uniqueTeacherIds.value
  .map(id => ({ id, ...(userMap[id] || {}) }))
  .filter(u => u && u.email)
)

const baseServiceProviders = computed(() => serviceProviderIds.value
  .map(id => ({ id, ...(userMap[id] || {}) }))
  .filter(u => u && u.email)
)

// Get case manager
const caseManager = computed(() => {
  const caseManagerId = student.app?.studentData?.caseManagerId || 
                       student.app?.providers?.caseManagerId ||
                       student.caseManagerId ||
                       student.casemanager_id
  
  if (!caseManagerId) return null
  
  const user = userMap[caseManagerId]
  return user && user.email ? { id: caseManagerId, ...user } : null
})

// All team members including case manager
const allTeamMembers = computed(() => {
  const members = [...baseTeachers.value, ...baseServiceProviders.value]
  if (caseManager.value) {
    // Only add case manager if not already in the list
    const existingIds = members.map(m => m.id)
    if (!existingIds.includes(caseManager.value.id)) {
      members.push(caseManager.value)
    }
  }
  return members
})

// Current user filtering
const currentUserId = computed(() => props.currentUser?.uid)

const isViewerOnlyRole = computed(() => {
  const role = props.currentUser?.role
  return ['paraeducator', 'staff_view', 'teacher'].includes(role)
})

// Check if current user is the case manager of this student
const isCaseManager = computed(() => {
  const currentUserId = props.currentUser?.uid
  const caseManagerId = student.app?.studentData?.caseManagerId || 
                       student.app?.providers?.caseManagerId ||
                       student.caseManagerId ||
                       student.casemanager_id
  return currentUserId && caseManagerId && currentUserId === caseManagerId
})

// Apply self-filtering for all roles (not just viewer-only)
const teachers = computed(() => 
  baseTeachers.value.filter(t => t.id !== currentUserId.value)
)

const serviceProviders = computed(() => 
  baseServiceProviders.value.filter(sp => sp.id !== currentUserId.value)
)

// All members with self-filtering applied
const allMembers = computed(() => 
  allTeamMembers.value.filter(m => m.id !== currentUserId.value)
)

// Check for documents in both nested and legacy structures
const hasDocs = computed(() => {
  return !!(
    // Check nested structure
    student.app?.documents?.ataglancePdfUrl ||
    student.app?.documents?.bipPdfUrl ||
    // Check legacy structure
    student.ataglancePdfUrl ||
    student.ataglance_pdf_url ||
    student.bipPdfUrl ||
    student.bip_pdf_url
  )
})

const canSend = computed(() => {
  if (!sendTo.value) return false
  if (sendTo.value === 'Individual') return checkedMembers.value.length > 0
  return true
})

// Get recipient emails
const emails = computed(() => {
  let recipients = []
  if (sendTo.value === 'Teachers') recipients = teachers.value
  else if (sendTo.value === 'TeachersAndService') recipients = [...teachers.value, ...serviceProviders.value]
  else if (sendTo.value === 'CaseManager') recipients = caseManager.value ? [caseManager.value] : []
  else if (sendTo.value === 'Individual') recipients = allMembers.value.filter(p => checkedMembers.value.includes(p.id))
  return recipients.map(p => p.email).filter(Boolean).join(',')
})

async function sendEmail() {
  // Only proceed if Gmail API is enabled
  if (!gmailApiEnabled.value) {
    alert('Gmail API features are disabled. Please use the "Copy Email Addresses" button instead.')
    return
  }

  if (!emails.value) {
    alert('No email addresses found for the selected recipients.')
    return
  }
  
  // Debug student data
  console.log('🔍 Student data for email:', {
    student: student,
    firstName: student.firstName,
    first_name: student.first_name,
    lastName: student.lastName,
    last_name: student.last_name,
    appStudentData: student.app?.studentData
  })
  
  // Compose subject and body - try multiple field name patterns
  const firstName = student.firstName || 
                   student.first_name || 
                   student.app?.studentData?.firstName ||
                   student.app?.firstName ||
                   ''
  const lastName = student.lastName || 
                  student.last_name || 
                  student.app?.studentData?.lastName ||
                  student.app?.lastName ||
                  ''
  
  console.log('🔍 Extracted names:', { firstName, lastName })
  
  const fullName = `${firstName} ${lastName}`.trim() || 'Student'
  const initials = ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || 'ST'
  
  console.log('🔍 Final values:', { fullName, initials })
  
  // Check if any update categories are selected
  const hasUpdates = Object.values(updateCategories.value).some(value => value)
  
  // Use different subject based on whether updates are selected
  const subject = hasUpdates
    ? `${initials} - Student Update`
    : `${initials} - Student Inquiry`
  let body = ''
  
  if (hasUpdates) {
    body += `Hi team,\n\n`
    body += `${fullName}'s student profile has been updated in the CaseManage app.\n\n`
    
    // Add update summary
    body += `Update Summary:\n`
    
    if (updateCategories.value.studentInfo) {
      body += `• Student data has been updated\n`
    }
    if (updateCategories.value.documents) {
      body += `• Documents have been updated and are available\n`
    }
    if (updateCategories.value.schedule) {
      body += `• Schedule details have been updated\n`
    }
    if (updateCategories.value.instructionAccommodations) {
      body += `• Instruction accommodations have been updated\n`
    }
    if (updateCategories.value.assessmentAccommodations) {
      body += `• Assessment accommodations have been updated\n`
    }
    if (updateCategories.value.services) {
      body += `• Services have been updated\n`
    }
    if (updateCategories.value.meetingDates) {
      body += `• Meeting dates have been updated\n`
    }
    
    body += `\n`
    body += `Please reach out if you have any questions.\n\n`
    
    // Access instructions
    body += `To access the updated confidential information and documents:\n`
    body += `Log into the CaseManage app: ${window.location.origin}\n`
    body += `Navigate to the student's record to view the updates. Authentication is required.\n\n`
    
    // Case manager contact info
    const caseManagerName = caseManager.value ? 
      `${caseManager.value.firstName || ''} ${caseManager.value.lastName || ''}`.trim() || 
      caseManager.value.displayName || 
      caseManager.value.email || 
      'Case Manager' : 'Case Manager'
    
    if (caseManagerName && caseManagerName !== 'Case Manager') {
      body += `For questions please contact the Case Manager (${caseManagerName}) directly.\n`
    } else {
      body += `For questions please contact the Case Manager directly.\n`
    }

  } else {
    // Default email body for inquiries (no updates selected)
    body = `Hi team,\n\nI have a question regarding ${fullName}.\n\nPlease reach out if you need any additional information.\n\nThank you!`
  }
  
  console.log('🔍 Email composition:', { subject, body })
  
  // Get the current user's work email for security
  const userWorkEmail = props.currentUser?.email
  
  if (!userWorkEmail) {
    console.error('❌ No user email found in props.currentUser:', props.currentUser)
    alert('Unable to send email: User email not found. Please contact your administrator.')
    return
  }

  console.log('🔍 User work email:', userWorkEmail)

  // Create Gmail web interface URL
  const gmailUrl =
    `https://mail.google.com/mail/?view=cm&fs=1` +
    `&to=${encodeURIComponent(emails.value)}` +
    `&su=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`

  // Security check
  const proceed = confirm(
    `IMPORTANT: Security Check\n\n` +
    `This email MUST be sent from your school account: ${userWorkEmail}\n\n` +
    `Please confirm:\n` +
    `1. You are signed into Gmail with ${userWorkEmail}\n` +
    `2. You are NOT signed into any other Gmail accounts\n\n` +
    `Click OK only if you are using your school account.\n` +
    `Click Cancel to open Gmail and switch accounts.`
  )

  if (!proceed) {
    // Open Gmail in a new tab so they can switch accounts
    window.open('https://mail.google.com', '_blank', 'noopener')
    return
  }

  // Open Gmail compose in new tab
  window.open(gmailUrl, '_blank', 'noopener')
  console.log('✅ Gmail compose window opened')
  emit('close')
}
</script>

<style scoped>
.dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--dialog-backdrop);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: var(--z-modal);
  backdrop-filter: blur(2px);
}

.dialog {
  background: var(--bg-secondary);
  border-radius: var(--border-radius-lg);
  width: 480px;
  max-width: 95vw;
  max-height: 90vh;
  box-shadow: var(--shadow-xl);
  position: relative;
  display: flex;
  flex-direction: column;
}

header {
  padding: var(--spacing-lg);
  border-bottom: var(--border-width) solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

header h2 {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
}

header button {
  background: none;
  border: none;
  font-size: var(--font-size-lg);
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius-pill);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: var(--transition-base);
}

header button:hover {
  background: var(--bg-muted);
  color: var(--text-primary);
}

main {
  padding: var(--spacing-md);
  overflow-y: auto;
  flex: 1;
}

main form > div {
  margin-bottom: var(--spacing-lg);
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.option-button {
  width: 100%;
  padding: var(--spacing-md);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: var(--font-size-base);
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-base);
}

.option-button:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-dark);
}

.option-button.active {
  background: var(--primary-color);
  color: var(--text-inverse);
  border-color: var(--primary-color);
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.dialog label {
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  transition: var(--transition-base);
  width: 100%;
}

.dialog label:hover {
  background-color: var(--bg-muted);
}

input[type="radio"],
input[type="checkbox"] {
  margin-right: var(--spacing-sm);
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--primary-color);
  margin: 0; /* Reset margin to prevent alignment issues */
}

.members-list {
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin: var(--spacing-md) 0;
  max-height: 300px;
  overflow-y: auto;
  border: var(--border-width) solid var(--border-color);
}

.members-list > div:first-child {
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
  position: sticky;
  top: 0;
  background: var(--bg-tertiary);
  padding: var(--spacing-xs) 0;
  z-index: 1;
}

.members-list label {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.members-list label span {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

footer {
  padding: var(--spacing-md);
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
  border-top: var(--border-width) solid var(--border-color);
  background: var(--bg-secondary);
  flex-shrink: 0;
}

footer button {
  padding: var(--btn-padding-md);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  transition: var(--transition-base);
  font-weight: var(--font-weight-medium);
}

footer button:first-child {
  background: var(--bg-tertiary);
  border: var(--border-width) solid var(--border-color);
  color: var(--text-secondary);
}

footer button:first-child:hover {
  background: var(--bg-muted);
  color: var(--text-primary);
}

footer button:last-child {
  background: var(--primary-color);
  border: var(--border-width) solid var(--primary-color);
  color: var(--text-inverse);
}

footer button:last-child:hover {
  background: var(--primary-hover);
}

footer button[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(0.5);
}

/* Custom scrollbar for members list */
.members-list::-webkit-scrollbar {
  width: 8px;
}

.members-list::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-sm);
}

.members-list::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: var(--border-radius-sm);
}

.members-list::-webkit-scrollbar-thumb:hover {
  background: var(--border-dark);
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  transition: var(--transition-base);
}

.member-item:hover {
  background-color: var(--bg-muted);
}

.member-item .email {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin-left: var(--spacing-xs);
}

.update-categories {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-sm);
  background: var(--bg-tertiary);
  margin-top: var(--spacing-md);
  border: 1px solid var(--border-color);
}

.update-categories h4 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.checkbox-group {
  display: grid;
  gap: var(--spacing-xs);
}

.checkbox-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-xs) 0;
}

.checkbox-item input[type="checkbox"] {
  margin-right: var(--spacing-xs);
  cursor: pointer;
}

.checkbox-item input[type="checkbox"]:disabled {
  cursor: not-allowed;
}

.checkbox-item label {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  cursor: pointer;
}

.no-docs {
  color: var(--text-muted);
  font-style: italic;
  font-size: var(--font-size-xs);
  margin-left: var(--spacing-xs);
}

input[type="checkbox"]:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Selected Recipients */
.selected-recipients {
  margin: 1rem 0;
  padding: 1rem;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
}

.recipients-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.recipients-header h4 {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--text-primary);
}

.copy-button {
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius-sm);
  padding: 0.25rem 0.75rem;
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: background-color 0.2s;
}

.copy-button:hover {
  background: var(--primary-hover);
}

.copy-button.copied {
  background: var(--success-color);
}

.recipients-list {
  padding: 0.5rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
  font-family: monospace;
  font-size: var(--font-size-sm);
  word-break: break-all;
  margin-bottom: 0.5rem;
}

.recipients-note {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: var(--bg-muted);
  border-radius: var(--border-radius-sm);
}
</style>