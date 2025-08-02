<template>
  <div class="dialog-backdrop">
    <div class="dialog">
      <header>
        <h2>Export Students</h2>
        <button @click="$emit('close')" class="close-btn">×</button>
      </header>
      <main>
        <p>Export {{ students.length }} students</p>
        
        <!-- Field Selection -->
        <div class="field-groups">
          <div class="field-group">
            <h4>Student Info</h4>
            <label>
              <input type="checkbox" v-model="selectedFields.studentData.firstName" />
              First Name
            </label>
            <label>
              <input type="checkbox" v-model="selectedFields.studentData.lastName" />
              Last Name
            </label>
            <label>
              <input type="checkbox" v-model="selectedFields.studentData.grade" />
              Grade
            </label>
            <label>
              <input type="checkbox" v-model="selectedFields.studentData.plan" />
              Plan Type
            </label>
            <label>
              <input type="checkbox" v-model="selectedFields.studentData.caseManagerId" />
              Case Manager
            </label>
          </div>

          <div class="field-group">
            <h4>Important Dates</h4>
            <label>
              <input type="checkbox" v-model="selectedFields.dates.reviewDate" />
              Plan Review
            </label>
            <label>
              <input type="checkbox" v-model="selectedFields.dates.reevalDate" />
              Reevaluation
            </label>
            <label>
              <input type="checkbox" v-model="selectedFields.dates.meetingDate" />
              Meeting Date
            </label>
          </div>

          <div class="field-group">
            <h4>Related Services</h4>
            <label>
              <input type="checkbox" v-model="selectedFields.providers.all" />
              All Service Providers
            </label>
          </div>

          <div class="field-group">
            <h4>Accommodations</h4>
            <label>
              <input type="checkbox" v-model="selectedFields.accommodations.instruction" />
              Instructional
            </label>
            <label>
              <input type="checkbox" v-model="selectedFields.accommodations.assessment" />
              Assessment
            </label>
          </div>

          <div class="field-group">
            <h4>Schedule & Services</h4>
            <label>
              <input type="checkbox" v-model="selectedFields.schedule.periods" />
              Class Schedule
            </label>
            <label>
              <input type="checkbox" v-model="selectedFields.schedule.classServices" />
              Class Services
            </label>
          </div>

          <div class="field-group">
            <h4>Documents</h4>
            <label>
              <input type="checkbox" v-model="selectedFields.documents.ataglancePdfUrl" />
              At-A-Glance
            </label>
            <label>
              <input type="checkbox" v-model="selectedFields.documents.bipPdfUrl" />
              BIP
            </label>
          </div>
        </div>

        <!-- Quick Selection Buttons -->
        <div class="quick-select">
          <button @click="selectAll">Select All</button>
          <button @click="deselectAll">Deselect All</button>
        </div>
      </main>
      <footer>
        <button @click="$emit('close')" class="btn-secondary">Cancel</button>
        <button @click="exportData" class="btn-primary" :disabled="!hasSelectedFields">Export</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/store/authStore'
import { usePermissionStore } from '@/store/permissionStore'
import { getDisplayValue } from '@/utils/studentUtils'

const props = defineProps({
  students: {
    type: Array,
    default: () => []
  },
  userMap: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close'])

const authStore = useAuthStore()
const permissionStore = usePermissionStore()

// Field selection state
const selectedFields = ref({
  studentData: {
    firstName: true,
    lastName: true,
    grade: true,
    plan: true,
    caseManagerId: true
  },
  dates: {
    reviewDate: true,
    reevalDate: true,
    meetingDate: true
  },
  providers: {
    all: true
  },
  accommodations: {
    instruction: true,
    assessment: true
  },
  schedule: {
    periods: true,
    classServices: true
  },
  documents: {
    ataglancePdfUrl: true,
    bipPdfUrl: true
  }
})

// List of all service provider fields
const serviceProviderFields = [
  'speechId', 'otId', 'mhId', 'ptId', 'scId', 'trId', 
  'audId', 'viId', 'atId', 'dhhId', 'omId', 'bisId', 
  'hnId', 'swId'
]

// Computed property to check if any fields are selected
const hasSelectedFields = computed(() => {
  return Object.values(selectedFields.value).some(group => 
    Object.values(group).some(value => value)
  )
})

// Helper function to get user display name
function getUserDisplayName(userId) {
  if (!userId || !props.userMap[userId]) return ''
  const user = props.userMap[userId]
  return user.name || user.email || ''
}

// Helper function to check permissions
function hasPermission(permission) {
  const userPermissions = permissionStore.userPermissions || []
  return Array.isArray(userPermissions) && userPermissions.includes(permission)
}

// Select/Deselect all fields
function selectAll() {
  Object.keys(selectedFields.value).forEach(group => {
    Object.keys(selectedFields.value[group]).forEach(field => {
      selectedFields.value[group][field] = true
    })
  })
}

function deselectAll() {
  Object.keys(selectedFields.value).forEach(group => {
    Object.keys(selectedFields.value[group]).forEach(field => {
      selectedFields.value[group][field] = false
    })
  })
}

// Filter student data based on user permissions
function filterStudentData(student) {
  const currentUser = authStore.currentUser
  const isAdmin = currentUser?.role === 'admin' || 
                 currentUser?.role === 'administrator' || currentUser?.role === 'staff_view' ||
                 currentUser?.role === 'sped_chair' || 
                 currentUser?.role === 'administrator_504_CM' || currentUser?.role === 'admin_504'

  // If user is admin, return all selected data
  if (isAdmin) {
    return getSelectedData(student)
  }

  const filteredData = {}

  // Basic info - always visible
  if (selectedFields.value.studentData.firstName) filteredData.firstName = student.app?.studentData?.firstName
  if (selectedFields.value.studentData.lastName) filteredData.lastName = student.app?.studentData?.lastName
  if (selectedFields.value.studentData.grade) filteredData.grade = student.app?.studentData?.grade
  if (selectedFields.value.studentData.plan) filteredData.plan = student.app?.studentData?.plan
  if (selectedFields.value.studentData.caseManagerId) filteredData.caseManagerId = student.app?.studentData?.caseManagerId

  // Dates - check permissions
  if (hasPermission('view_student_dates')) {
    if (selectedFields.value.dates.reviewDate) filteredData.reviewDate = student.app?.dates?.reviewDate
    if (selectedFields.value.dates.reevalDate) filteredData.reevalDate = student.app?.dates?.reevalDate
    if (selectedFields.value.dates.meetingDate) filteredData.meetingDate = student.app?.dates?.meetingDate
  }

  // Providers - check if user is provider or has permission
  if (hasPermission('view_service_providers') || 
      student.app?.studentData?.caseManagerId === currentUser?.uid ||
      serviceProviderFields.some(field => student.app?.providers?.[field] === currentUser?.uid)) {
    if (selectedFields.value.providers.all) {
      serviceProviderFields.forEach(field => {
        filteredData[field] = student.app?.providers?.[field]
      })
    }
  }

  // Accommodations - check permissions
  if (hasPermission('view_accommodations')) {
    if (selectedFields.value.accommodations.instruction) filteredData.instruction = student.app?.accommodations?.instruction
    if (selectedFields.value.accommodations.assessment) filteredData.assessment = student.app?.accommodations?.assessment
  }

  // Schedule & Services - check if user is teacher or has permission
  if (hasPermission('view_schedule') || 
      Object.values(student.app?.schedule?.periods || {}).includes(currentUser?.uid)) {
    if (selectedFields.value.schedule.periods) filteredData.schedule = student.app?.schedule?.periods
    if (selectedFields.value.schedule.classServices) filteredData.classServices = student.app?.schedule?.classServices
  }

  // Documents - check permissions
  if (hasPermission('view_documents')) {
    if (selectedFields.value.documents.ataglancePdfUrl) filteredData.ataglancePdfUrl = student.app?.documents?.ataglancePdfUrl
    if (selectedFields.value.documents.bipPdfUrl) filteredData.bipPdfUrl = student.app?.documents?.bipPdfUrl
  }

  return filteredData
}

// Helper function to get selected data without filtering
function getSelectedData(student) {
  const data = {}
  
  // Basic info
  if (selectedFields.value.studentData.firstName) data.firstName = student.app?.studentData?.firstName
  if (selectedFields.value.studentData.lastName) data.lastName = student.app?.studentData?.lastName
  if (selectedFields.value.studentData.grade) data.grade = student.app?.studentData?.grade
  if (selectedFields.value.studentData.plan) data.plan = student.app?.studentData?.plan
  if (selectedFields.value.studentData.caseManagerId) data.caseManagerId = student.app?.studentData?.caseManagerId

  // Dates
  if (selectedFields.value.dates.reviewDate) data.reviewDate = student.app?.dates?.reviewDate
  if (selectedFields.value.dates.reevalDate) data.reevalDate = student.app?.dates?.reevalDate
  if (selectedFields.value.dates.meetingDate) data.meetingDate = student.app?.dates?.meetingDate

  // Providers
  if (selectedFields.value.providers.all) {
    serviceProviderFields.forEach(field => {
      data[field] = student.app?.providers?.[field]
    })
  }

  // Accommodations
  if (selectedFields.value.accommodations.instruction) data.instruction = student.app?.accommodations?.instruction
  if (selectedFields.value.accommodations.assessment) data.assessment = student.app?.accommodations?.assessment

  // Schedule & Services
  if (selectedFields.value.schedule.periods) data.schedule = student.app?.schedule?.periods
  if (selectedFields.value.schedule.classServices) data.classServices = student.app?.schedule?.classServices

  // Documents
  if (selectedFields.value.documents.ataglancePdfUrl) data.ataglancePdfUrl = student.app?.documents?.ataglancePdfUrl
  if (selectedFields.value.documents.bipPdfUrl) data.bipPdfUrl = student.app?.documents?.bipPdfUrl

  return data
}

// Export function
function exportData() {
  // Get filtered data for each student
  const exportData = props.students.map(student => filterStudentData(student))

  // Create CSV content
  const headers = []
  const rows = []

  // Build headers and data mapping
  const fieldMapping = {
    'firstName': 'First Name',
    'lastName': 'Last Name',
    'grade': 'Grade',
    'plan': 'Plan Type',
    'caseManagerId': 'Case Manager',
    'reviewDate': 'Plan Review',
    'reevalDate': 'Reevaluation',
    'meetingDate': 'Meeting Date',
    'speechId': 'Speech',
    'otId': 'OT',
    'mhId': 'Mental Health',
    'ptId': 'PT',
    'scId': 'SC',
    'trId': 'TR',
    'audId': 'Audiology',
    'viId': 'Vision',
    'atId': 'AT',
    'dhhId': 'DHH',
    'omId': 'O&M',
    'bisId': 'BIS',
    'hnId': 'HN',
    'swId': 'SW',
    'instruction': 'Instructional Accommodation',
    'assessment': 'Assessment Accommodations',
    'schedule': 'Schedule',
    'classServices': 'Class Services',
    'ataglancePdfUrl': 'At-A-Glance',
    'bipPdfUrl': 'BIP'
  }

  // Build headers based on selected fields and mapping
  Object.entries(selectedFields.value).forEach(([group, fields]) => {
    Object.entries(fields).forEach(([field, isSelected]) => {
      if (isSelected) {
        if (field === 'all') {
          // Add headers for all service providers
          serviceProviderFields.forEach(providerField => {
            headers.push(fieldMapping[providerField])
          })
        } else {
          headers.push(fieldMapping[field])
        }
      }
    })
  })

  // Build rows
  exportData.forEach(student => {
    const row = []
    Object.entries(selectedFields.value).forEach(([group, fields]) => {
      Object.entries(fields).forEach(([field, isSelected]) => {
        if (isSelected) {
          if (field === 'all') {
            // Add values for all service providers
            serviceProviderFields.forEach(providerField => {
              const value = student[providerField] || ''
              row.push(value ? getUserDisplayName(value) : '')
            })
          } else {
            let value = student[field] || ''
            
            // Format special fields
            if (field.endsWith('Id')) {
              value = value ? getUserDisplayName(value) : ''
            } else if (field === 'classServices') {
              value = Array.isArray(student.classServices) ? student.classServices.join(', ') : ''
            } else if (field === 'schedule') {
              value = student.schedule ? 
                Object.entries(student.schedule)
                  .map(([period, teacherId]) => `${period}: ${getUserDisplayName(teacherId)}`)
                  .join('; ') : ''
            }
            row.push(value)
          }
        }
      })
    })
    rows.push(row)
  })

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  // Download the file
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'students-export.csv'
  a.click()
  window.URL.revokeObjectURL(url)

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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  color: #666;
}

.field-groups {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.field-group {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 6px;
}

.field-group h4 {
  margin: 0 0 10px 0;
  color: #333;
}

label {
  display: block;
  margin: 8px 0;
  color: #444;
}

.quick-select {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.quick-select button {
  padding: 5px 10px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f0f0f0;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary:hover:not(:disabled),
.btn-secondary:hover {
  opacity: 0.9;
}
</style>
