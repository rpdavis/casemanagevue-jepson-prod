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
          <div class="docs-option">
            <label>
              <span>
                Include documents
                <span v-if="!hasDocs" class="no-docs">(No docs available)</span>
              </span>
              <input type="checkbox" v-model="includeDocs" :disabled="!hasDocs" />
            </label>
          </div>
        </form>
      </main>
      <footer>
        <button @click="$emit('close')">Cancel</button>
        <button :disabled="!canSend" @click="sendEmail">Send</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  student: { type: Object, required: true },
  userMap: { type: Object, required: true }
})
const { student, userMap } = props

defineEmits(['close'])

const sendTo = ref('')
const checkedMembers = ref([])
const includeDocs = ref(false)

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

const teachers = computed(() => uniqueTeacherIds.value
  .map(id => ({ id, ...(userMap[id] || {}) }))
  .filter(u => u && u.email)
)

const serviceProviders = computed(() => serviceProviderIds.value
  .map(id => ({ id, ...(userMap[id] || {}) }))
  .filter(u => u && u.email)
)

const allMembers = computed(() => [...teachers.value, ...serviceProviders.value])

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

function sendEmail() {
  let recipients = []
  if (sendTo.value === 'Teachers') recipients = teachers.value
  else if (sendTo.value === 'TeachersAndService') recipients = [...teachers.value, ...serviceProviders.value]
  else if (sendTo.value === 'Individual') recipients = allMembers.value.filter(p => checkedMembers.value.includes(p.id))
  const emails = recipients.map(p => p.email).filter(Boolean).join(',')
  if (!emails) {
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
  
  const subject = `${initials} - Student Update`
  let body = ''
  if (includeDocs.value) {
    body += `Hi team!\n\n${fullName}'s updated documents are available in the CaseManage app.\n\n`
    
    // Check what documents are available
    const ataglanceUrl = student.app?.documents?.ataglancePdfUrl || student.ataglancePdfUrl || student.ataglance_pdf_url
    const bipUrl = student.app?.documents?.bipPdfUrl || student.bipPdfUrl || student.bip_pdf_url
    
    if (ataglanceUrl || bipUrl) {
      body += `Available documents:\n`
      if (ataglanceUrl) {
        body += `• At-A-Glance\n`
      }
      if (bipUrl) {
        body += `• BIP (Behavior Intervention Plan)\n`
      }
      body += `\nTo access the documents:\n`
      body += `Log into the CaseManage app: ${window.location.origin}\n`
      body += `Navigate to the student's record to view their documents.\n\n`
      body += `The documents require authentication to view for security purposes.\n`
    } else {
      body += `No documents are currently available for ${fullName}.\n\n`
      body += `If documents are added, you can access them by logging into:\n`
      body += `${window.location.origin}\n`
    }
  } else {
    body = 'See attached.'
  }
  
  console.log('🔍 Email composition:', { subject, body })
  
  const gmailUrl =
    `https://mail.google.com/mail/?view=cm&fs=1` +
    `&to=${encodeURIComponent(emails)}` +
    `&su=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`
  window.open(gmailUrl, '_blank', 'noopener')
  // Optionally close dialog
  // $emit('close')
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

.docs-option {
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  background: var(--bg-tertiary);
  margin-top: var(--spacing-md);
}

.docs-option .no-docs {
  color: var(--text-muted);
  font-size: var(--font-size-sm);
  margin-left: var(--spacing-xs);
}

input[type="checkbox"]:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>