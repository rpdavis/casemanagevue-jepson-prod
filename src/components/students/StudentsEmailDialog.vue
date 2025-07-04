<template>
  <div class="dialog-backdrop">
    <div class="dialog">
      <header>
        <h2>Email about {{ student.firstName || student.first_name }} {{ student.lastName || student.last_name }}</h2>
        <button @click="$emit('close')">X</button>
      </header>
      <main>
        <form @submit.prevent>
          <div>
            <label><input type="radio" v-model="sendTo" value="Teachers" /> Teachers</label><br />
            <label><input type="radio" v-model="sendTo" value="TeachersAndService" /> Teachers and service providers</label><br />
            <label><input type="radio" v-model="sendTo" value="Individual" /> Individual member of the IEP team</label>
          </div>
          <div v-if="sendTo === 'Individual'" class="members-list">
            <div>Select members:</div>
            <div v-for="member in allMembers" :key="member.id">
              <label>
                <input type="checkbox" :value="member.id" v-model="checkedMembers" />
                {{ member.name || member.displayName || member.email || member.id }}<span v-if="member.email"> ({{ member.email }})</span>
              </label>
            </div>
          </div>
          <div style="margin-top: 1em;">
            <label>
              <input type="checkbox" v-model="includeDocs" :disabled="!hasDocs" />
              Include documents
            </label>
            <span v-if="!hasDocs" style="color: #888; font-size: 0.95em;"> (No docs available)</span>
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

// Gather teacher and service provider IDs from student
const teacherIds = computed(() => {
  const sched = student.schedule || {}
  return Object.values(sched).filter(Boolean)
})
const uniqueTeacherIds = computed(() => [...new Set(teacherIds.value)])

const serviceProviderIds = computed(() => {
  const ids = []
  for (const key in student) {
    if (key.endsWith('_id') && !['casemanager_id', 'caseManagerId'].includes(key) && student[key]) {
      ids.push(student[key])
    }
  }
  // Remove any that are also teachers
  return ids.filter(id => !uniqueTeacherIds.value.includes(id))
})

const allUserIds = computed(() => [...uniqueTeacherIds.value, ...serviceProviderIds.value])
const uniqAllUserIds = computed(() => [...new Set(allUserIds.value)])

const teachers = computed(() => uniqueTeacherIds.value
  .map(id => ({ id, ...(userMap[id] || {}) }))
  .filter(u => u && u.email)
)
const serviceProviders = computed(() => serviceProviderIds.value
  .map(id => ({ id, ...(userMap[id] || {}) }))
  .filter(u => u && u.email)
)
const allMembers = computed(() => [...teachers.value, ...serviceProviders.value])

const hasDocs = computed(() => !!(student.ataglancePdfUrl || student.ataglance_pdf_url || student.bipPdfUrl || student.bip_pdf_url))

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
  // Compose subject and body
  const initials = ((student.firstName?.[0] || student.first_name?.[0] || '') + (student.lastName?.[0] || student.last_name?.[0] || '')).toUpperCase()
  const subject = `${initials} - Student Update`
  let body = ''
  if (includeDocs.value) {
    body += `Hi team!\n\nBelow are links to ${(student.firstName || student.first_name || '')} ${(student.lastName || student.last_name || '')}'s updated documents:\n\n`
    if (student.ataglancePdfUrl || student.ataglance_pdf_url) {
      body += `At-A-Glance: ${student.ataglancePdfUrl || student.ataglance_pdf_url}\n`
    }
    if (student.bipPdfUrl || student.bip_pdf_url) {
      body += `BIP:       ${student.bipPdfUrl || student.bip_pdf_url}\n`
    }
  } else {
    body = 'See attached.'
  }
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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.dialog {
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 420px;
  max-width: 95vw;
  box-shadow: 0 4px 24px rgba(0,0,0,0.2);
  position: relative;
}
header { margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
header h2 { margin: 0; font-size: 1.2em; }
header button { background: none; border: none; font-size: 1.2em; cursor: pointer; }
.members-list { margin: 12px 0; }
footer { margin-top: 24px; display: flex; gap: 12px; justify-content: flex-end; }
button[disabled] { opacity: 0.6; cursor: not-allowed; }
</style>