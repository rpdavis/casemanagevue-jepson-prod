// /Users/rd/CaseManageVue/src/views/StudentsView.vue

<template>
  <div class="students-view">
    <div class="header">
      <div class="header-left">
        <h1>Student Management</h1>
        <div class="user-info">
          {{ currentUser?.name || currentUser?.email || 'User' }}
          <span v-if="currentUser?.role">({{ currentUser.role }})</span>
        </div>
      </div>
      <div class="header-actions">
        <button @click="showExport = true" class="btn btn-secondary">
          <span>📊</span> Export
        </button>
        <button v-if="isAdmin" @click="navigateToAdmin" class="btn btn-secondary">
          <span>⚙️</span> Admin
        </button>
        <button v-if="currentUser?.role === 'paraeducator'" @click="navigateToAideSchedule" class="btn btn-secondary">
          <span>📅</span> My Schedule
        </button>
        <button @click="showAddStudent = true" class="btn btn-primary">
          <span>➕</span> Add Student
        </button>
        <button @click="handleLogout" class="btn btn-secondary">
          <span>🚪</span> Logout
        </button>
      </div>
    </div>
    
    <div class="controls">
      <StudentFilters
        :case-managers="caseManagers"
        :teachers="teacherList"
        :paraeducators="paraeducators"
        :current-user-role="currentUser?.role"
        :current-user-id="currentUser?.uid"
        @filter="applyFilters"
      />
    </div>
    
    <div class="content">
      <!-- List View -->
      <div v-if="currentViewMode === 'list'">
        <StudentTable
          :students="filteredStudents"
          :user-map="userMapObj"
          :current-user="currentUser"
          :aide-schedule="currentUser?.role === 'paraeducator' ? aideAssignment : {}"
          @edit="editStudent"
          @email="emailStudent"
          @teacher-feedback="handleTeacherFeedback"
        />
      </div>
      
      <!-- By Class View -->
      <div v-else-if="currentViewMode === 'class'" class="view-container">
        <!-- Direct Assignment Section -->
        <div v-if="directAssignmentStudents.length > 0" class="group-section">
          <h3 class="group-header direct-assignment-header">Direct Assignment</h3>
          <StudentTable
            :students="directAssignmentStudents"
            :user-map="userMapObj"
            :current-user="currentUser"
            :aide-schedule="currentUser?.role === 'paraeducator' ? aideAssignment : {}"
            @edit="editStudent"
            @email="emailStudent"
            @teacher-feedback="handleTeacherFeedback"
          />
        </div>
        
        <!-- Class Period Sections -->
        <div v-for="(students, period) in studentsByClass" :key="period" class="group-section">
          <h3 class="group-header">Period {{ period }}</h3>
          <StudentTable
            :students="students"
            :user-map="userMapObj"
            :current-user="currentUser"
            :aide-schedule="currentUser?.role === 'paraeducator' ? aideAssignment : {}"
            @edit="editStudent"
            @email="emailStudent"
            @teacher-feedback="handleTeacherFeedback"
          />
        </div>
      </div>
      
      <!-- Testing View -->
      <div v-else-if="currentViewMode === 'testing'" class="view-section">
        <StudentTable
          :students="filteredStudents"
          :user-map="userMapObj"
          :current-user="currentUser"
          :testing-view="true"
          :aide-schedule="currentUser?.role === 'paraeducator' ? aideAssignment : {}"
          @edit="editStudent"
          @email="emailStudent"
          @teacher-feedback="handleTeacherFeedback"
        />
      </div>
    </div>
    
    <!-- Dialogs -->
    <StudentEditDialog
      v-if="editingStudentId"
      :student-id="editingStudentId"
      :users="{ userRoles }"
      @close="editingStudentId = null"
      @saved="handleStudentSaved"
    />
    
    <StudentsEmailDialog
      v-if="emailingStudentId"
      :student="getStudentById(emailingStudentId)"
      :user-map="userMapObj"
      @close="emailingStudentId = null"
    />
    
    <ExportDialog
      v-if="showExport"
      :students="students"
      @close="showExport = false"
    />
    
    <StudentForm
      v-if="showAddStudent"
      :users="{ userRoles }"
      @close="showAddStudent = false"
      @saved="handleStudentAdded"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import useStudents from '@/composables/useStudents.js'
import useUsers from '@/composables/useUsers.js'
import useAideAssignment from '@/composables/useAideAssignment.js'
import { useAuthStore } from '@/store/authStore'
import { getDisplayValue } from '@/utils/studentUtils'
import StudentFilters from '@/components/students/StudentFilters.vue'
import StudentTable from '@/components/students/StudentTable.vue'
import StudentEditDialog from '@/components/students/StudentEditDialog.vue'
import StudentsEmailDialog from '@/components/students/StudentsEmailDialog.vue'
import StudentForm from '@/components/students/StudentForm.vue'
import ExportDialog from '@/components/ExportDialog.vue'

const router = useRouter()
const { students, fetchStudents } = useStudents()
const { users: userMap, userList, fetchUsers, caseManagers, teacherList, userRoles } = useUsers()
const { 
  loadAideAssignment,
  loadAideAssignments, 
  shouldAideSeeStudent, 
  getStudentsForAide,
  aideAssignment
} = useAideAssignment()
const authStore = useAuthStore()

const currentUser = computed(() => authStore.currentUser)

// Check if user is admin
const isAdmin = computed(() => {
  const role = currentUser.value?.role
  return ['admin', 'administrator', 'sped_chair', 'administrator_504_CM'].includes(role)
})

// Group students by class (period)
const studentsByClass = computed(() => {
  console.log('Computing studentsByClass from filteredStudents:', filteredStudents.value.length)
  console.log('Filtered students:', filteredStudents.value.map(s => ({ id: s.id, name: getDisplayValue(s, 'firstName') + ' ' + getDisplayValue(s, 'lastName') })))
  
  const groups = {}
  
  // Check if we're filtering by paraeducator
  const currentFilters = getCurrentFilters()
  const isParaeducatorFilter = currentFilters.paraeducator && currentFilters.paraeducator !== 'all'
  
  filteredStudents.value.forEach(student => {
    if (student.schedule) {
      Object.entries(student.schedule).forEach(([period, teacherId]) => {
        if (!groups[period]) {
          groups[period] = []
        }
        
        // If filtering by paraeducator, only add student to periods where aide is assigned
        if (isParaeducatorFilter) {
          const aideData = aideAssignment.value[currentFilters.paraeducator]
          if (aideData && aideData.classAssignment && aideData.classAssignment[period]) {
            const teacherIds = Array.isArray(aideData.classAssignment[period]) ? aideData.classAssignment[period] : [aideData.classAssignment[period]]
            if (teacherIds.includes(teacherId)) {
              groups[period].push(student)
            }
          }
        } else {
          // No paraeducator filter, add student to all their periods
          groups[period].push(student)
        }
      })
    }
  })
  
  // Remove periods with no students
  Object.keys(groups).forEach(period => {
    if (groups[period].length === 0) {
      delete groups[period]
    }
  })
  
  console.log('studentsByClass result:', Object.keys(groups).map(period => `${period}: ${groups[period].length} students`))
  Object.entries(groups).forEach(([period, students]) => {
    console.log(`Period ${period} students:`, students.map(s => getDisplayValue(s, 'firstName') + ' ' + getDisplayValue(s, 'lastName')))
  })
  
  return groups
})

// Get directly assigned students for paraeducator filter
const directAssignmentStudents = computed(() => {
  const currentFilters = getCurrentFilters()
  const isParaeducatorFilter = currentFilters.paraeducator && currentFilters.paraeducator !== 'all'
  
  if (!isParaeducatorFilter) {
    return []
  }
  
  const aideData = aideAssignment.value[currentFilters.paraeducator]
  if (!aideData || !aideData.directAssignment) {
    return []
  }
  
  const directStudentIds = Array.isArray(aideData.directAssignment) ? aideData.directAssignment : [aideData.directAssignment]
  return filteredStudents.value.filter(s => directStudentIds.includes(s.id))
})

// Group students by case manager
const studentsByCaseManager = computed(() => {
  const groups = {}
  filteredStudents.value.forEach(student => {
    const cmId = student.caseManagerId || student.casemanager_id
    if (cmId) {
      if (!groups[cmId]) {
        groups[cmId] = []
      }
      groups[cmId].push(student)
    }
  })
  return groups
})

// Get paraeducators for filter dropdown - use userList which includes UID as id field
const paraeducators = computed(() => {
  return userList.value?.filter(user => user.role === 'paraeducator') || []
})

const filteredStudents = ref([])
const currentViewMode = ref('list')
const currentParaeducatorFilter = ref('all')
const editingStudentId = ref(null)
const emailingStudentId = ref(null)
const showExport = ref(false)
const showAddStudent = ref(false)

const userMapObj = computed(() => userMap.value || {})

async function fetchData() {
  try {
    const promises = [
      fetchStudents(),
      fetchUsers()
    ]
    
    // Load aide assignments for all users so paraeducator filter works
    promises.push(loadAideAssignments())
    
    await Promise.all(promises)
    console.log('StudentsView - loaded students:', students.value)
    console.log('StudentsView - loaded users:', userMap.value)
    applyFilters({}) // Initial render
  } catch (error) {
    console.error('Error fetching data:', error)
  }
}

onMounted(fetchData)

function getStudentById(studentId) {
  return students.value.find(s => s.id === studentId) || {}
}

function getUserName(userId) {
  const user = userMap.value[userId]
  return user ? (user.name || user.email || userId) : userId
}

function getCaseManagerName(caseManagerId) {
  if (!caseManagerId) return 'N/A'
  const user = userMap.value[caseManagerId]
  return user ? (user.name || user.email || caseManagerId) : caseManagerId
}

function applyFilters(filters) {
  console.log('applyFilters called with:', filters)
  console.log('Initial students count:', students.value.length)
  let result = students.value

  // Apply provider view filtering (for case managers)
  if (filters.providerView === 'case_manager') {
    result = result.filter(s => s.caseManagerId === currentUser.value?.uid)
  } else if (filters.providerView === 'service_provider') {
    result = result.filter(s => {
      const isInSchedule = Object.values(s.schedule || {}).includes(currentUser.value?.uid)
      const isInServices = (s.services || []).some(service => service.includes(currentUser.value?.uid))
      const isNotCaseManager = s.caseManagerId !== currentUser.value?.uid
      return (isInSchedule || isInServices) && isNotCaseManager
    })
  }

  // Apply role-based filtering
  if (currentUser.value?.role === 'case_manager' && filters.providerView === 'all') {
    result = result.filter(s => s.caseManagerId === currentUser.value.uid)
  } else if (currentUser.value?.role === 'paraeducator') {
    // Filter students based on aide assignments
    result = result.filter(s => {
      try {
        return shouldAideSeeStudent(currentUser.value.uid, s.id, students.value, userMap.value)
      } catch (error) {
        console.error('Error filtering student for aide:', error)
        return false
      }
    })
  }

  // Apply text search
  if (filters.search) {
    const search = filters.search.toLowerCase()
    result = result.filter(s => {
      const firstName = getDisplayValue(s, 'firstName') || ''
      const lastName = getDisplayValue(s, 'lastName') || ''
      return `${firstName} ${lastName}`.toLowerCase().includes(search)
    })
  }
  
  // Apply case manager filter
  if (filters.cm && filters.cm !== 'all') {
    result = result.filter(s => s.caseManagerId === filters.cm)
  }

  // Apply teacher filter
  if (filters.teacher && filters.teacher !== 'all') {
    result = result.filter(s => Object.values(s.schedule || {}).includes(filters.teacher))
  }

  // Apply paraeducator filter
  if (filters.paraeducator && filters.paraeducator !== 'all') {
    console.log('Filtering by paraeducator:', filters.paraeducator)
    console.log('Students before paraeducator filter:', result.length)
    console.log('Aide assignments loaded:', Object.keys(aideAssignment.value).length > 0)
    console.log('Aide assignments data:', aideAssignment.value)
    
    // Track the current paraeducator filter
    currentParaeducatorFilter.value = filters.paraeducator
    
    // Get the aide's schedule data
    const aideData = aideAssignment.value[filters.paraeducator]
    console.log('Selected aide data:', aideData)
    
    result = result.filter(s => {
      try {
            // Debug: Log the actual student data structure
    console.log('Student data:', {
      id: s.id,
      firstName: s.first_name,
      lastName: s.last_name,
      firstNameDisplay: getDisplayValue(s, 'firstName'),
      lastNameDisplay: getDisplayValue(s, 'lastName'),
      plan: s.plan,
      schedule: s.schedule,
      // Check all possible field names
      allFields: Object.keys(s).filter(key => key.includes('name') || key.includes('first') || key.includes('last'))
    })
        
        const shouldSee = shouldAideSeeStudent(filters.paraeducator, s.id, students.value, userMap.value)
        if (shouldSee) {
          console.log('Paraeducator can see student:', getDisplayValue(s, 'firstName'), getDisplayValue(s, 'lastName'))
        } else {
          console.log('Paraeducator cannot see student:', getDisplayValue(s, 'firstName'), getDisplayValue(s, 'lastName'))
        }
        return shouldSee
      } catch (error) {
        console.error('Error filtering student for paraeducator:', error)
        return false
      }
    })
    
    console.log('Students after paraeducator filter:', result.length)
  }

  // Apply sorting
  if (filters.sortBy) {
    result.sort((a, b) => {
      const valA = getDisplayValue(a, filters.sortBy) || ''
      const valB = getDisplayValue(b, filters.sortBy) || ''
      
      // Handle date sorting
      if (['reviewDate', 'reevalDate', 'meetingDate'].includes(filters.sortBy)) {
        const dateA = valA ? new Date(valA).getTime() : 0
        const dateB = valB ? new Date(valB).getTime() : 0
        return dateA - dateB
      }
      
      return valA.toString().toLowerCase().localeCompare(valB.toString().toLowerCase())
    })
  }

  // Store the filtered results
  filteredStudents.value = result
  console.log('Final filtered students count:', result.length)
  
  // Handle view mode
  currentViewMode.value = filters.viewMode || 'list'
  console.log('View mode set to:', currentViewMode.value)
}

function editStudent(studentId) {
  editingStudentId.value = studentId
}

function emailStudent(studentId) {
  emailingStudentId.value = studentId
}

function handleTeacherFeedback(studentId) {
  // Handle teacher feedback action
  console.log('Teacher feedback for student:', studentId)
}

function handleStudentAdded() {
  showAddStudent.value = false
  fetchData() // Refresh the data
}

function handleStudentSaved() {
  // Handle student saved event
  console.log('Student saved')
  fetchData() // Refresh the data
}

function navigateToAdmin() {
  router.push('/admin')
}

function navigateToAideSchedule() {
  router.push('/aide-schedule')
}

async function handleLogout() {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

// Helper function to get current filters
function getCurrentFilters() {
  return {
    paraeducator: currentParaeducatorFilter.value
  }
}
</script>

<style scoped>
.students-view {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header h1 {
  margin: 0;
  color: #333;
  font-size: 2rem;
}

.user-info {
  font-size: 0.9rem;
  color: #666;
  font-style: italic;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.controls {
  margin-bottom: 20px;
}

.content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

/* View Mode Styles */
.view-container {
  padding: 20px;
}

.group-section {
  margin-bottom: 30px;
}

.group-section:last-child {
  margin-bottom: 0;
}

.group-header {
  margin: 0 0 15px 0;
  color: #1976d2;
  font-size: 1.3rem;
  font-weight: 600;
  border-bottom: 2px solid #e3eaf6;
  padding-bottom: 8px;
}

.direct-assignment-header {
  color: #007bff;
  border-bottom: 2px solid #007bff;
  padding-bottom: 8px;
  margin-bottom: 15px;
}

</style>