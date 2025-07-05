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
            
            <!-- Flags -->
            <div v-if="hasFlags(student)" class="flag-overlay">
              <div v-if="getFlagValue(student, 'flag1')" class="flag-preferential-seating">Preferential Seating</div>
              <div v-if="getFlagValue(student, 'flag2')" class="flag-separate-setting">Separate Setting</div>
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
              <span class="badge badge-review" :class="getReviewUrgencyClass(student)">PR: {{ formatDate(getDisplayValue(student, 'reviewDate')) }}</span>
              <span class="badge badge-reeval" :class="getReevalUrgencyClass(student)">RE: {{ formatDate(getDisplayValue(student, 'reevalDate')) }}</span>
              <span class="badge badge-meeting" :class="[getMeetingUrgencyClass(student), getDisplayValue(student, 'meetingDate') ? 'date-set' : '']">
                🗓 {{ formatDate(getDisplayValue(student, 'meetingDate')) || 'Not set' }}
              </span>
            </div>
            
            <!-- Direct Assignment Badge for Paraeducators -->
            <div v-if="currentUser?.role === 'paraeducator' && isDirectAssignment(student.id)" class="direct-assignment-badge">
              <span class="badge badge-direct">Direct Assignment</span>
            </div>
            
            <!-- Flags -->
            <div v-if="hasFlags(student)" class="flag-overlay">
              <div v-if="getFlagValue(student, 'flag1')" class="flag-preferential-seating">Preferential Seating</div>
              <div v-if="getFlagValue(student, 'flag2')" class="flag-separate-setting">Separate Setting</div>
            </div>
          </td>
          
          <!-- Services Cell -->
          <td>
            <template v-if="getClassServices(student).length > 0 || getOtherServices(student).length > 0 || hasServiceProviders(student)">
              <div v-if="getClassServices(student).length > 0">
                <strong>Class Services:</strong>
                <span v-for="service in getClassServices(student)" :key="service" class="service-pill">{{ service }}</span>
              </div>
              <div v-if="getOtherServices(student).length > 0 || hasServiceProviders(student)">
                <strong>Related Services:</strong>
                <span v-for="other in getOtherServices(student)" :key="other" class="service-pill">{{ other }}</span>
                <template v-if="appSettings && appSettings.value && appSettings.value.serviceProviders">
                  <span v-for="abbr in appSettings.value.serviceProviders" :key="abbr" 
                        v-if="getServiceProviderId(student, getProviderFieldName(abbr))" 
                        class="service-pill">
                    {{ abbr }} ({{ getUserInitials(getServiceProviderId(student, getProviderFieldName(abbr))) }})
                  </span>
                </template>
                <template v-else>
                  <!-- Fallback to hardcoded providers if app settings not available -->
                  <span v-if="getServiceProviderId(student, 'speechId')" class="service-pill">SP ({{ getUserInitials(getServiceProviderId(student, 'speechId')) }})</span>
                  <span v-if="getServiceProviderId(student, 'mhId')" class="service-pill">MH ({{ getUserInitials(getServiceProviderId(student, 'mhId')) }})</span>
                  <span v-if="getServiceProviderId(student, 'otId')" class="service-pill">OT ({{ getUserInitials(getServiceProviderId(student, 'otId')) }})</span>
                  <span v-if="getServiceProviderId(student, 'ptId')" class="service-pill">PT ({{ getUserInitials(getServiceProviderId(student, 'ptId')) }})</span>
                  <span v-if="getServiceProviderId(student, 'scId')" class="service-pill">SC ({{ getUserInitials(getServiceProviderId(student, 'scId')) }})</span>
                  <span v-if="getServiceProviderId(student, 'trId')" class="service-pill">TR ({{ getUserInitials(getServiceProviderId(student, 'trId')) }})</span>
                </template>
              </div>
            </template>
            <template v-else>
              —
            </template>
          </td>
          
          <!-- Schedule Cell -->
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
          
          <!-- Instruction Accom. Cell -->
          <td class="instruction-cell" :class="{ 'with-flag': getFlagValue(student, 'flag1') }">
            <div v-if="getFlagValue(student, 'flag1')" class="flag-overlay flag-preferential-seating">Preferential Seating</div>
            <div v-if="getDisplayValue(student, 'instruction')" class="bullet-list">
              <div v-html="formatListFromText(getDisplayValue(student, 'instruction'))"></div>
            </div>
            <div v-else>—</div>
          </td>
          
          <!-- Assessment Accom. Cell -->
          <td class="instruction-cell" :class="{ 'with-flag': getFlagValue(student, 'flag2') }">
            <div v-if="getFlagValue(student, 'flag2')" class="flag-overlay flag-separate-setting">Separate setting</div>
            <div v-if="getDisplayValue(student, 'assessment')" class="bullet-list">
              <div v-html="formatListFromText(getDisplayValue(student, 'assessment'))"></div>
            </div>
            <div v-else>—</div>
          </td>
          
          <!-- Docs Cell -->
          <td>
            <div class="docs-item">
              <a v-if="getDocumentUrl(student, 'ataglancePdfUrl')" :href="getDocumentUrl(student, 'ataglancePdfUrl')" target="_blank">At-A-Glance</a>
              <a v-if="getDocumentUrl(student, 'bipPdfUrl')" :href="getDocumentUrl(student, 'bipPdfUrl')" target="_blank">BIP</a>
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
        </template>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { formatListFromText, getDisplayValue, getSourceValue } from '@/utils/studentUtils'
import { useAppSettings } from '@/composables/useAppSettings'

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
  // Check new nested structure first, then fallback to legacy
  return student.app?.schedule?.periods || 
         student.schedule
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