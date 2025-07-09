<template>
  <table class="students-table" :class="{ 'testing-view': testingView }">
    <thead>
      <tr>
        <!-- Testing View Headers -->
        <template v-if="testingView">
          <th class="print">Student Info</th>
          <th class="print">Schedule</th>
          <th class="print">Assessment Accom.</th>
        </template>
        <!-- Regular View Headers -->
        <template v-else>
          <th class="print">Student Info</th>
          <th class="print">Services</th>
          <th class="print">Schedule</th>
          <th class="print">Instruction Accom.</th>
          <th class="print">Assessment Accom.</th>
          <th class="print">Docs</th>
          <th class="print">Feedback Forms</th>
          <th class="print">Actions</th>
        </template>
      </tr>
    </thead>
    <tbody>
      <tr v-for="student in students" :key="student.id">
        <!-- Testing View Cells -->
        <template v-if="testingView">
          <!-- Student Info Cell (same format as regular view) -->
          <td>
            <div class="student-name"><strong>{{ getDisplayValue(student, 'firstName') }} {{ getDisplayValue(student, 'lastName') }}</strong></div>
            <div class="std-info-subheading">
              <div>Grd: {{ getDisplayValue(student, 'grade') }} | Prg: {{ getDisplayValue(student, 'plan') }}</div>
              <div>CM: {{ getUserName(getCaseManagerId(student)) }}</div>
            </div>
          </td>
          
          <!-- Schedule Cell (same as regular view) -->
          <td>
            <div v-if="getSchedule(student)" class="schedule-list">
              <ul>
                <li v-for="(teacherId, period) in getSchedule(student)" :key="period">
                  <span class="service-pill">{{ period }}:</span> {{ getUserInitialLastName(teacherId) }}
                </li>
              </ul>
            </div>
            <div v-else-if="!getSchedule(student)">—</div>
          </td>
          
          <!-- Assessment Accommodations Cell (same as regular view) -->
          <td class="instruction-cell" :class="{ 'with-flag': getFlagValue(student, 'flag2') }">
            <div v-if="getFlagValue(student, 'flag2')" class="flag-overlay flag-separate-setting">Separate setting</div>
            <div v-if="getDisplayValue(student, 'assessment')" class="bullet-list">
              <div v-html="formatListFromText(getDisplayValue(student, 'assessment'))"></div>
            </div>
            <div v-else>—</div>
          </td>
        </template>
        
        <!-- Regular View Cells -->
        <template v-else>
          <!-- Student Info Cell -->
          <td>
            <div class="student-name">
              <strong>{{ getDisplayValue(student, 'firstName') }} {{ getDisplayValue(student, 'lastName') }}</strong>
              <span class="data-source" :title="`Data source: ${getSourceValue(student, 'firstName')}`">
                {{ getSourceValue(student, 'firstName') === 'Override' ? '🔒' : 
                   getSourceValue(student, 'firstName') === 'App' ? '📱' :
                   getSourceValue(student, 'firstName') === 'Aeries' ? '📊' :
                   getSourceValue(student, 'firstName') === 'SEIS' ? '📋' : '' }}
              </span>
            </div>
            <div class="std-info-subheading">
              <div>Grd: {{ getDisplayValue(student, 'grade') }} | Prg: {{ getDisplayValue(student, 'plan') }}</div>
              <div>CM: {{ getUserName(getCaseManagerId(student)) }}</div>
            </div>
            <div class="student-dates print">
              <span class="badge badge-review plan-review" :class="getReviewUrgencyClass(student)">PR: {{ formatDate(getDisplayValue(student, 'reviewDate')) }}</span>
              <span class="badge badge-reeval reeval-due" :class="getReevalUrgencyClass(student)">RE: {{ formatDate(getDisplayValue(student, 'reevalDate')) }}</span>
              <span class="badge badge-meeting meeting-date" :class="[getMeetingUrgencyClass(student), getDisplayValue(student, 'meetingDate') ? 'date-set' : '']">
                🗓 {{ formatDate(getDisplayValue(student, 'meetingDate')) || 'Not set' }}
              </span>
            </div>
            
            <!-- Direct Assignment Badge for Paraeducators -->
            <div v-if="currentUser?.role === 'paraeducator' && isDirectAssignment(student.id)" class="direct-assignment-badge">
              <span class="badge badge-direct">Direct Assignment</span>
            </div>
          </td>
          
          <!-- Services Cell -->
          <StudentServicesCell
            :student="student"
            :app-settings="appSettings"
            :get-class-services="getClassServices"
            :get-other-services="getOtherServices"
            :has-service-providers="hasServiceProviders"
            :get-service-provider-id="getServiceProviderId"
            :get-provider-field-name="getProviderFieldName"
            :get-user-initial-last-name="getUserInitialLastName"
          />
          
          <!-- Schedule Cell -->
          <StudentScheduleCell
            :student="student"
            :get-schedule="getSchedule"
            :get-user-initial-last-name="getUserInitialLastName"
          />
          
          <!-- Instruction Accom. Cell -->
          <StudentInstructionAccomCell
            :student="student"
            :get-flag-value="getFlagValue"
            :format-list-from-text="formatListFromText"
          />
          
          <!-- Assessment Accom. Cell -->
          <StudentAssessmentAccomCell
            :student="student"
            :get-flag-value="getFlagValue"
            :format-list-from-text="formatListFromText"
          />
          
          <!-- Docs Cell -->
          <StudentDocsCell :student="student" :get-document-url="getDocumentUrl" />
          
          <!-- Feedback Forms Cell -->
          <StudentFeedbackCell
            :student="student"
            :feedback-forms="getFeedbackFormsForStudent(student.id)"
            @create-feedback="$emit('teacher-feedback', student.id)"
          />
          
          <!-- Actions Cell -->
          <StudentActionsCell
            :student="student"
            :current-user="currentUser"
            @edit="$emit('edit', student.id)"
            @email="$emit('email', student.id)"
            @teacher-feedback="$emit('teacher-feedback', student.id)"
          />
        </template>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { formatListFromText, getDisplayValue, getSourceValue } from '@/utils/studentUtils'
import { useAppSettings } from '@/composables/useAppSettings'
import './table/StudentTable.css'
import StudentDocsCell from './table/StudentDocsCell.vue'
import StudentActionsCell from './table/StudentActionsCell.vue'
import StudentScheduleCell from './table/StudentScheduleCell.vue'
import StudentServicesCell from './table/StudentServicesCell.vue'
import StudentInstructionAccomCell from './table/StudentInstructionAccomCell.vue'
import StudentAssessmentAccomCell from './table/StudentAssessmentAccomCell.vue'
import StudentFeedbackCell from './table/StudentFeedbackCell.vue'

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
  },
  testingView: {
    type: Boolean,
    default: false
  },
  aideSchedule: {
    type: Object,
    default: () => ({})
  },
  feedbackForms: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['edit', 'email', 'teacher-feedback'])

// Load app settings for dynamic services and providers
const { appSettings, loadAppSettings, loading: appSettingsLoading, error: appSettingsError } = useAppSettings()
onMounted(async () => {
  try {
    console.log('StudentTable: Loading app settings...')
    await loadAppSettings()
    console.log('StudentTable: App settings loaded successfully')
  } catch (error) {
    console.error('StudentTable: Error loading app settings:', error)
  }
})

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
  // Check if any flags are set in either structure
  return (student.app?.flags && Object.values(student.app.flags).some(Boolean)) ||
         (student.flag1 || student.flag2)
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

function getCaseManagerId(student) {
  // Check new nested structure first, then fallback to legacy
  return student.app?.studentData?.caseManagerId || 
         student.caseManagerId || 
         student.casemanager_id
}

function getFlagValue(student, flag) {
  // Check new nested structure first, then fallback to legacy
  return student.app?.flags?.[flag] || 
         student[flag] || 
         false
}

function getDocumentUrl(student, type) {
  // Check new nested structure first, then fallback to legacy
  return student.app?.documents?.[type] || 
         student[`${type}Url`] || 
         student[`${type}_url`] ||
         null
}

function getSchedule(student) {
  // Check Aeries schedule structure first (direct schedule object)
  if (student.schedule) {
    return student.schedule
  }
  
  // Check new nested structure
  if (student.app?.schedule?.periods) {
    return student.app.schedule.periods
  }
  
  // Check Aeries schedule.periods structure (your current format)
  if (student.aeries?.schedule?.periods) {
    return student.aeries.schedule.periods
  }
  
  // Check legacy Aeries schedule structure
  if (student.aeries?.schedule) {
    const formattedSchedule = {}
    Object.entries(student.aeries.schedule).forEach(([period, data]) => {
      if (data && data.teacherId) {
        // Get period label from app settings
        let periodLabel = period
        if (appSettings.value && appSettings.value.periodLabels) {
          const periodIndex = parseInt(period.replace('period', '')) - 1
          if (periodIndex >= 0 && periodIndex < appSettings.value.periodLabels.length) {
            periodLabel = appSettings.value.periodLabels[periodIndex]
          }
        }
        
        // Get teacher name from userMap
        let teacherName = data.teacherId
        if (props.userMap) {
          // Try to find teacher by aeriesId (exact match or string conversion)
          let teacher = Object.values(props.userMap).find(user => 
            user.aeriesId === data.teacherId || 
            user.aeriesId === parseInt(data.teacherId) ||
            user.id === data.teacherId
          )
          
          // If not found by aeriesId, try to find by any field that might match
          if (!teacher) {
            teacher = Object.values(props.userMap).find(user => 
              user.aeriesId?.toString() === data.teacherId?.toString() ||
              user.id?.toString() === data.teacherId?.toString()
            )
          }
          
          if (teacher && teacher.name) {
            // Format as "First Initial. Last Name"
            const nameParts = teacher.name.split(' ')
            if (nameParts.length >= 2) {
              const firstName = nameParts[0]
              const lastName = nameParts[nameParts.length - 1]
              teacherName = `${firstName.charAt(0)}. ${lastName}`
            } else {
              teacherName = teacher.name
            }
          } else {
            // If teacher not found, show the teacherId as is
            console.warn(`Teacher not found for ID: ${data.teacherId}`)
          }
        }
        
        formattedSchedule[periodLabel] = teacherName
      }
    })
    return Object.keys(formattedSchedule).length > 0 ? formattedSchedule : null
  }
  
  return null
}

function getClassServices(student) {
  // Check new nested structure first, then fallback to legacy
  const services = student.app?.schedule?.classServices || 
                  student.services || 
                  []
  
  // If app settings are still loading, show all services
  if (appSettingsLoading.value) {
    return Array.isArray(services) ? services.filter(s => typeof s === 'string' && s.includes(':')) : []
  }
  
  // If there was an error loading app settings, show all services
  if (appSettingsError.value) {
    return Array.isArray(services) ? services.filter(s => typeof s === 'string' && s.includes(':')) : []
  }
  
  // Filter services to only show those that are enabled in app settings
  if (appSettings.value && appSettings.value.classServices) {
    const enabledServices = appSettings.value.classServices
      .filter(svc => svc.enabledSubcategories && svc.enabledSubcategories.length > 0)
      .map(svc => svc.name)
    
    return Array.isArray(services) ? services.filter(s => {
      if (typeof s !== 'string' || !s.includes(':')) return false
      const serviceName = s.split(':')[0]
      return enabledServices.includes(serviceName)
    }) : []
  }
  
  // Fallback to all services if app settings not available
  return Array.isArray(services) ? services.filter(s => typeof s === 'string' && s.includes(':')) : []
}

function getOtherServices(student) {
  // Check new nested structure first, then fallback to legacy
  const otherServices = student.app?.schedule?.otherServices || 
                       student.other_services || 
                       []
  return Array.isArray(otherServices) ? otherServices.filter(s => !!s) : []
}

function hasServiceProviders(student) {
  // Check new nested structure first, then fallback to legacy
  const providers = student.app?.providers || {}
  const hasNewProviders = Object.values(providers).some(Boolean)
  
  // If app settings are still loading or there was an error, check all providers
  if (appSettingsLoading.value || appSettingsError.value) {
    const hasLegacyProviders = student.speechId || student.speech_id || 
                              student.mhId || student.mh_id || 
                              student.otId || student.ot_id ||
                              student.ptId || student.pt_id ||
                              student.scId || student.sc_id ||
                              student.trId || student.tr_id ||
                              student.audId || student.aud_id ||
                              student.viId || student.vi_id ||
                              student.atId || student.at_id ||
                              student.dhhId || student.dhh_id ||
                              student.omId || student.om_id ||
                              student.bisId || student.bis_id ||
                              student.hnId || student.hn_id ||
                              student.swId || student.sw_id
    return hasNewProviders || hasLegacyProviders
  }
  
  // Check legacy providers based on app settings
  let hasLegacyProviders = false
  
  if (appSettings.value && appSettings.value.serviceProviders) {
    // Only check providers that are enabled in app settings
    const enabledProviders = appSettings.value.serviceProviders
    const providerFieldMap = {
      'SLP': 'speechId',
      'OT': 'otId', 
      'MH': 'mhId',
      'PT': 'ptId',
      'SC': 'scId',
      'TR': 'trId',
      'AUD': 'audId',
      'VI': 'viId',
      'AT': 'atId',
      'DHH': 'dhhId',
      'O&M': 'omId',
      'BIS': 'bisId',
      'HN': 'hnId',
      'SW': 'swId'
    }
    
    hasLegacyProviders = enabledProviders.some(abbr => {
      const fieldName = providerFieldMap[abbr]
      return student[fieldName] || student[fieldName.replace('Id', '_id')]
    })
  } else {
    // Fallback to checking all providers if app settings not available
    hasLegacyProviders = student.speechId || student.speech_id || 
                        student.mhId || student.mh_id || 
                        student.otId || student.ot_id ||
                        student.ptId || student.pt_id ||
                        student.scId || student.sc_id ||
                        student.trId || student.tr_id ||
                        student.audId || student.aud_id ||
                        student.viId || student.vi_id ||
                        student.atId || student.at_id ||
                        student.dhhId || student.dhh_id ||
                        student.omId || student.om_id ||
                        student.bisId || student.bis_id ||
                        student.hnId || student.hn_id ||
                        student.swId || student.sw_id
  }
  
  return hasNewProviders || hasLegacyProviders
}

function getServiceProviderId(student, type) {
  // Check new nested structure first, then fallback to legacy
  const providerId = student.app?.providers?.[type] || 
                    student[type] || 
                    student[type.replace('Id', '_id')] ||
                    null
  return providerId
}

function getProviderFieldName(abbr) {
  const providerFieldMap = {
    'SLP': 'speechId',
    'OT': 'otId', 
    'MH': 'mhId',
    'PT': 'ptId',
    'SC': 'scId',
    'TR': 'trId',
    'AUD': 'audId',
    'VI': 'viId',
    'AT': 'atId',
    'DHH': 'dhhId',
    'O&M': 'omId',
    'BIS': 'bisId',
    'HN': 'hnId',
    'SW': 'swId'
  }
  return providerFieldMap[abbr] || `${abbr.toLowerCase()}Id`
}

function isDirectAssignment(studentId) {
  if (!props.currentUser || props.currentUser.role !== 'paraeducator') {
    return false
  }
  
  // The currentUser from auth store has uid, but we need to find the user in userMap
  // to get the correct ID that matches the aide schedule
  const aideId = props.currentUser.uid
  
  // Check if the aide schedule uses the current user's UID directly
  let aideData = props.aideSchedule[aideId]
  
  // If not found, try to find the user in userMap to get the correct ID
  if (!aideData) {
    const userEntry = Object.entries(props.userMap).find(([id, user]) => user.uid === aideId || user.email === props.currentUser.email)
    if (userEntry) {
      const [correctAideId] = userEntry
      aideData = props.aideSchedule[correctAideId]
    }
  }
  
  return aideData?.directAssignment === studentId
}

// Get feedback forms for a specific student
function getFeedbackFormsForStudent(studentId) {
  return props.feedbackForms.filter(form => form.student.id === studentId)
}

function getScheduleForForm(student) {
  // App schedule (preferred)
  if (student.app?.schedule?.periods && Object.keys(student.app.schedule.periods).length > 0) {
    return { ...student.app.schedule.periods }
  }
  // Aeries schedule.periods structure (your current format)
  if (student.aeries?.schedule?.periods && Object.keys(student.aeries.schedule.periods).length > 0) {
    return { ...student.aeries.schedule.periods }
  }
  // Legacy top-level
  if (student.schedule && Object.keys(student.schedule).length > 0) {
    return { ...student.schedule }
  }
  // Aeries fallback: convert to simple { period: teacherId }
  if (student.aeries?.schedule && Object.keys(student.aeries.schedule).length > 0) {
    const aeriesSchedule = {}
    Object.entries(student.aeries.schedule).forEach(([period, data]) => {
      if (data && data.teacherId) {
        aeriesSchedule[period] = String(data.teacherId || data)
      }
    })
    return aeriesSchedule
  }
  return {}
}

// DEBUG: Check schedule data sources (moved to StudentForm.vue)

watch(() => props.student, (newStudent) => {
  if (newStudent && Object.keys(newStudent).length > 0) {
    // ... other fields ...
    form.schedule =
      newStudent.app?.schedule?.periods ||
      newStudent.schedule ||
      newStudent.aeries?.schedule?.periods ||
      {};
    console.log('StudentForm DEBUG - form.schedule:', form.schedule);
    console.log('StudentForm DEBUG - aeries.schedule:', props.student.aeries?.schedule);
    console.log('StudentForm DEBUG - app.schedule.periods:', props.student.app?.schedule?.periods);
    // ... other fields ...

    // DEBUG: Check schedule data in watcher (moved to StudentForm.vue)
  }
}, { immediate: true, deep: true })
</script>

<style scoped>
.students-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.students-table th,
.students-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
  vertical-align: top;
}

.students-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.student-name {
  display: flex;
  align-items: center;
  gap: 4px;
}

.data-source {
  font-size: 12px;
  opacity: 0.7;
  cursor: help;
}

.data-source:hover {
  opacity: 1;
}

/* Testing view column widths */
.students-table.testing-view th:nth-child(3),
.students-table.testing-view td:nth-child(3) {
  width: 50%;
}
</style>

// Styles removed for migration to external CSS files
// Styles removed for migration to external CSS files