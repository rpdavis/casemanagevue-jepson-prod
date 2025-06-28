<template>
  <table class="students-table">
    <thead>
      <tr>
        <th class="print">Student Info</th>
        <th class="print">Services</th>
        <th class="print">Schedule</th>
        <th class="print">Instruction Accom.</th>
        <th class="print">Assessment Accom.</th>
        <th class="print">Docs</th>
        <th class="print">Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="student in students" :key="student.id">
        <!-- Student Info Cell -->
        <td>
          <div class="student-name"><strong>{{ getDisplayValue(student, 'firstName') }} {{ getDisplayValue(student, 'lastName') }}</strong></div>
          <div class="std-info-subheading">
            <div>Grd: {{ getDisplayValue(student, 'grade') }} | Prg: {{ getDisplayValue(student, 'plan') }}</div>
            <div>CM: {{ getUserName(student.casemanager_id) }}</div>
          </div>
          <div class="student-dates print">
            <span class="badge badge-review" :class="getReviewUrgencyClass(student)">PR: {{ formatDate(getDisplayValue(student, 'reviewDate')) }}</span>
            <span class="badge badge-reeval" :class="getReevalUrgencyClass(student)">RE: {{ formatDate(getDisplayValue(student, 'reevalDate')) }}</span>
            <span class="badge badge-meeting" :class="[getMeetingUrgencyClass(student), getDisplayValue(student, 'meetingDate') ? 'date-set' : '']">
              🗓 {{ formatDate(getDisplayValue(student, 'meetingDate')) || 'Not set' }}
            </span>
          </div>
          
          <!-- Flags -->
          <div v-if="student.flags && student.flags.length > 0" class="flag-overlay">
            <div v-for="flag in student.flags" :key="flag" :class="getFlagClass(flag)">
              {{ flag }}
            </div>
          </div>
        </td>
        
        <!-- Services Cell -->
        <td>
          <template v-if="Array.isArray(student.services) || Array.isArray(student.other_services)">
            <div v-if="getClassServices(student).length > 0">
              <strong>Class Services:</strong>
              <span v-for="service in getClassServices(student)" :key="service" class="service-pill">{{ service }}</span>
            </div>
            <div v-if="getOtherServices(student).length > 0 || student.speech_id || student.mh_id || student.ot_id">
              <strong>Related Services:</strong>
              <span v-for="other in getOtherServices(student)" :key="other" class="service-pill">{{ other }}</span>
              <span v-if="student.speech_id" class="service-pill">SP ({{ getUserInitials(student.speech_id) }})</span>
              <span v-if="student.mh_id" class="service-pill">MH ({{ getUserInitials(student.mh_id) }})</span>
              <span v-if="student.ot_id" class="service-pill">OT ({{ getUserInitials(student.ot_id) }})</span>
            </div>
            <div v-if="getClassServices(student).length === 0 && getOtherServices(student).length === 0 && !student.speech_id && !student.mh_id && !student.ot_id">—</div>
          </template>
          <template v-else>
            —
          </template>
        </td>
        
        <!-- Schedule Cell -->
        <td>
          <div v-if="student.schedule" class="schedule-list" :class="{ expanded: expandedSchedules.has(student.id) }">
            <ul>
              <li v-for="(teacherId, period) in student.schedule" :key="period">
                <span class="service-pill">{{ period }}:</span> {{ getUserInitialLastName(teacherId) }}
              </li>
            </ul>
          </div>
          <div v-if="student.schedule && Object.keys(student.schedule).length > 6" 
               class="expand-toggle" 
               @click="toggleSchedule(student.id)">
            {{ expandedSchedules.has(student.id) ? 'Show Less' : 'Show More' }}
          </div>
          <div v-else-if="!student.schedule">—</div>
        </td>
        
        <!-- Instruction Accom. Cell -->
        <td class="instruction-cell" :class="{ 'with-flag': student.flag1 }">
          <div v-if="student.flag1" class="flag-overlay flag-preferential-seating">Preferential Seating</div>
          <div v-if="getDisplayValue(student, 'instruction')" class="bullet-list">
            <div v-html="formatListFromText(getDisplayValue(student, 'instruction'))"></div>
          </div>
          <div v-else>—</div>
        </td>
        
        <!-- Assessment Accom. Cell -->
        <td class="instruction-cell" :class="{ 'with-flag': student.flag2 }">
          <div v-if="student.flag2" class="flag-overlay flag-separate-setting">Separate setting</div>
          <div v-if="getDisplayValue(student, 'assessment')" class="bullet-list">
            <div v-html="formatListFromText(getDisplayValue(student, 'assessment'))"></div>
          </div>
          <div v-else>—</div>
        </td>
        
        <!-- Docs Cell -->
        <td>
          <div class="docs-item">
            <a v-if="student.ataglance_pdf_url" :href="student.ataglance_pdf_url" target="_blank">At-A-Glance</a>
            <a v-if="student.bip_pdf_url" :href="student.bip_pdf_url" target="_blank">BIP</a>
          </div>
        </td>
        
        <!-- Actions Cell -->
        <td>
          <button class="edit-btn" @click="$emit('edit', student.id)" title="Edit Student">✏️</button>
          <button class="email-btn" @click="$emit('email', student.id)" title="Email Student">✉️</button>
          <button v-if="currentUser?.role === 'teacher'" 
                  class="teacher-feedback-btn" 
                  @click="$emit('teacher-feedback', student.id)" 
                  title="Teacher Feedback">📝</button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { ref } from 'vue'
import { formatListFromText, getDisplayValue } from '@/utils/studentUtils'

const props = defineProps({
  students: {
    type: Array,
    default: () => []
  },
  userMap: {
    type: Object,
    default: () => ({})
  },
  currentUser: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['edit', 'email', 'teacher-feedback'])

// Track expanded schedules
const expandedSchedules = ref(new Set())

// Helper functions
function getUserName(userId) {
  const user = props.userMap[userId]
  return user ? (user.name || user.email || userId) : userId
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

function getFlagClass(flag) {
  const flagLower = flag.toLowerCase()
  if (flagLower.includes('critical')) return 'flag-critical'
  if (flagLower.includes('high')) return 'flag-high'
  if (flagLower.includes('medium')) return 'flag-medium'
  if (flagLower.includes('mid')) return 'flag-mid'
  if (flagLower.includes('low')) return 'flag-low'
  if (flagLower.includes('prep')) return 'flag-prep'
  return 'flag-low'
}

function hasFlags(student) {
  return student.flags && student.flags.length > 0
}

function toggleSchedule(studentId) {
  if (expandedSchedules.value.has(studentId)) {
    expandedSchedules.value.delete(studentId)
  } else {
    expandedSchedules.value.add(studentId)
  }
}

// --- Urgency color helpers ---
function getDateUrgencyClass(dateStr) {
  if (!dateStr) return ''
  const today = new Date()
  const target = new Date(dateStr)
  const daysDiff = Math.ceil((target - today) / (1000 * 60 * 60 * 24))
  if (daysDiff <= 0)  return 'flag-critical'
  if (daysDiff <= 7)  return 'flag-high'
  if (daysDiff <= 14) return 'flag-medium'
  if (daysDiff <= 21) return 'flag-mid'
  if (daysDiff <= 28) return 'flag-low'
  if (daysDiff <= 35) return 'flag-prep'
  if (daysDiff <= 60) return 'flag-prep-reeval'
  return ''
}
function getMeetingUrgencyClass(student) {
  return getDateUrgencyClass(getDisplayValue(student, 'meetingDate'))
}
function getReviewUrgencyClass(student) {
  return getDateUrgencyClass(getDisplayValue(student, 'reviewDate'))
}
function getReevalUrgencyClass(student) {
  return getDateUrgencyClass(getDisplayValue(student, 'reevalDate'))
}

function getUserInitials(userId) {
  const user = props.userMap[userId]
  if (!user) return '?'
  if (user.initials) return user.initials
  if (user.name) {
    const parts = user.name.split(' ')
    return parts.map(p => p[0]).join('').toUpperCase()
  }
  if (user.email) return user.email[0].toUpperCase()
  return '?'
}

function getUserInitialLastName(userId) {
  const user = props.userMap[userId]
  if (!user) return userId
  if (user.name) {
    const parts = user.name.trim().split(' ')
    if (parts.length === 1) return parts[0]
    return `${parts[0][0]}. ${parts.slice(1).join(' ')}`
  }
  if (user.email) return user.email[0].toUpperCase()
  return userId
}

function getClassServices(student) {
  const arr = Array.isArray(student.services) ? student.services : []
  return arr.filter(s => typeof s === 'string' && s.includes(':'))
}
function getOtherServices(student) {
  if (Array.isArray(student.other_services)) {
    return student.other_services.filter(s => !!s)
  }
  const arr = Array.isArray(student.services) ? student.services : []
  return arr.filter(s => typeof s === 'string' && !s.includes(':'))
}
</script>

// Styles removed for migration to external CSS files