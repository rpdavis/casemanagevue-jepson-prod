// /Users/rd/CaseManageVue/src/views/StudentsView.vue

<template>
  <div class="students-view">
    <!-- Navigation Menu -->
    <StudentNavMenu
      :current-user="currentUser"
      :is-admin="isAdmin"
      @action="handleNavAction"
    />
    
    <!-- Page Header with Search -->
    <div class="page-header">
      <div class="header-left">
        <h1>Student Management</h1>
        <div class="search-container">
          <input 
            type="text" 
            v-model="currentFilters.search" 
            @input="debouncedApplyFilters"
            placeholder="Search students..."
            class="search-input"
          >
        </div>
      </div>
      <div class="header-controls">
        <!-- Filter Toggle Button -->
        <button @click="toggleFilters" class="filter-toggle-btn" :class="{ active: showFilters }">
          <span>🔍</span> Filters
        </button>

        <!-- Provider View (for case managers) -->
        <div v-if="showProviderView" class="filter-group">
          <div class="radio-group">
            <label class="radio-btn" :class="{ active: currentFilters.providerView === 'all' }">
              <input type="radio" v-model="currentFilters.providerView" value="all" @change="applyFilters">
              All
            </label>
            <label class="radio-btn" :class="{ active: currentFilters.providerView === 'case_manager' }">
              <input type="radio" v-model="currentFilters.providerView" value="case_manager" @change="applyFilters">
              CM
            </label>
            <label class="radio-btn" :class="{ active: currentFilters.providerView === 'service_provider' }">
              <input type="radio" v-model="currentFilters.providerView" value="service_provider" @change="applyFilters">
              SP
            </label>
          </div>
        </div>

        <!-- View Mode -->
        <div class="filter-group">
          <div class="radio-group">
            <label class="radio-btn" :class="{ active: currentFilters.viewMode === 'list' }">
              <input type="radio" v-model="currentFilters.viewMode" value="list" @change="applyFilters()">
              List
            </label>
            <label class="radio-btn" :class="{ active: currentFilters.viewMode === 'class' }">
              <input type="radio" v-model="currentFilters.viewMode" value="class" @change="applyFilters()">
              Class
            </label>
            <label class="radio-btn" :class="{ active: currentFilters.viewMode === 'testing' }">
              <input type="radio" v-model="currentFilters.viewMode" value="testing" @change="applyFilters()">
              Test
            </label>
          </div>
        </div>

        <!-- Reset Filters -->
        <button @click="clearFilters" class="reset-btn" title="Reset all filters">
          🔄
        </button>
      </div>
    </div>

    <!-- Hidden Filters Panel -->
    <div v-if="showFilters" class="filters-panel">
      <div class="filters-content">
        <!-- Sort By -->
        <div class="filter-group">
          <label>Sort By</label>
          <select v-model="currentFilters.sortBy" @change="applyFilters()" class="filter-select">
            <option value="firstName">First Name</option>
            <option value="lastName">Last Name</option>
            <option value="grade">Grade</option>
            <option value="plan">Plan</option>
            <option value="reviewDate">Review Date</option>
            <option value="reevalDate">Re-evaluation Date</option>
            <option value="meetingDate">Meeting Date</option>
          </select>
        </div>

        <!-- Case Manager Filter -->
        <div class="filter-group">
          <label>Case Manager</label>
          <select v-model="currentFilters.cm" @change="applyFilters()" class="filter-select">
            <option value="all">All Case Managers</option>
            <option v-for="cm in caseManagers" :key="cm.id" :value="cm.id">
              {{ cm.name || cm.email || cm.id }}
            </option>
          </select>
        </div>

        <!-- Teacher Filter -->
        <div class="filter-group">
          <label>Teacher</label>
          <select v-model="currentFilters.teacher" @change="applyFilters()" class="filter-select">
            <option value="all">All Teachers</option>
            <option v-for="t in teacherList" :key="t.id" :value="t.id">
              {{ t.name || t.email || t.id }}
            </option>
          </select>
        </div>

        <!-- Paraeducator Filter -->
        <div class="filter-group">
          <label>Paraeducator</label>
          <select v-model="currentFilters.paraeducator" @change="applyFilters()" class="filter-select">
            <option value="all">All Paraeducators</option>
            <option v-for="p in paraeducators" :key="p.id" :value="p.id">
              {{ p.name || p.email || p.id }}
            </option>
          </select>
        </div>
      </div>
    </div>
    
    <div class="content">
      <!-- List View -->
      <div v-if="currentViewMode === 'list'">
        <StudentTable
          :students="filteredStudents"
          :user-map="userMapObj"
          :current-user="currentUser"
          :aide-schedule="currentUser?.role === 'paraeducator' ? aideAssignment : {}"
          :feedback-forms="linkedForms"
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
            :feedback-forms="linkedForms"
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
            :feedback-forms="linkedForms"
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
          :feedback-forms="linkedForms"
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
import { ref, onMounted, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import useStudents from '@/composables/useStudents.js'
import useUsers from '@/composables/useUsers.js'
import useAideAssignment from '@/composables/useAideAssignment.js'
import { useAuthStore } from '@/store/authStore'
import { useGoogleForms } from '@/composables/useGoogleForms.js'
import { getDisplayValue } from '@/utils/studentUtils'
import StudentNavMenu from '@/components/students/StudentNavMenu.vue'
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
const { 
  linkedForms, 
  loadExistingForms, 
  initializeGoogleAuth,
  createFeedbackForm 
} = useGoogleForms()

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
    const schedule = getSchedule(student)
    if (schedule) {
      Object.entries(schedule).forEach(([period, data]) => {
        if (!groups[period]) {
          groups[period] = []
        }
        
        // Extract teacherId from both simple and complex schedule structures
        let teacherId
        if (typeof data === 'string') {
          teacherId = data
        } else if (data && typeof data === 'object') {
          teacherId = data.teacherId
        } else {
          return // Skip if no valid teacherId
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
    const cmId = getCaseManagerId(student)
    if (cmId) {
      if (!groups[cmId]) {
        groups[cmId] = []
      }
      groups[cmId].push(student)
    }
  })
  return groups
})

// Helper function to get case manager ID from nested structure
function getCaseManagerId(student) {
  return student.app?.studentData?.caseManagerId || 
         student.caseManagerId || 
         student.casemanager_id
}

// Helper function to get schedule data from nested structure
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
    return student.aeries.schedule
  }
  
  return null
}

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
const showFilters = ref(false)
const showFeedbackDialog = ref(false)
const feedbackStudentId = ref(null)

// Debounced apply filters for search
let debounceTimer = null
const debouncedApplyFilters = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    applyFilters()
  }, 300) // 300ms delay
}

// Current filters state
const currentFilters = reactive({
  sortBy: 'firstName',
  cm: 'all',
  teacher: 'all',
  paraeducator: 'all',
  search: '',
  providerView: 'all',
  viewMode: 'list'
})

// Check if provider view should be shown
const showProviderView = computed(() => {
  return ['case_manager', 'administrator_504_CM', 'sped_chair'].includes(currentUser.value?.role)
})

const userMapObj = computed(() => userMap.value || {})

async function fetchData() {
  try {
    const promises = [
      fetchStudents(),
      fetchUsers(),
      loadAideAssignments(),
      initializeGoogleAuth()
    ]
    
    await Promise.all(promises)
    console.log('StudentsView - loaded students:', students.value)
    console.log('StudentsView - loaded users:', userMap.value)
    
    // Load existing feedback forms
    loadExistingForms()
    
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

function toggleFilters() {
  showFilters.value = !showFilters.value
}

function clearFilters() {
  currentFilters.sortBy = 'firstName'
  currentFilters.cm = 'all'
  currentFilters.teacher = 'all'
  currentFilters.paraeducator = 'all'
  currentFilters.search = ''
  currentFilters.providerView = 'all'
  currentFilters.viewMode = 'list'
  applyFilters()
}

function applyFilters(filters = currentFilters) {
  let result = students.value

  // Apply provider view filtering (for case managers)
  if (filters.providerView === 'case_manager') {
    result = result.filter(s => getCaseManagerId(s) === currentUser.value?.uid)
  } else if (filters.providerView === 'service_provider') {
    result = result.filter(s => {
      // Check if user is in schedule (handle both simple and complex structures)
      const schedule = getSchedule(s)
      const isInSchedule = schedule ? Object.entries(schedule).some(([period, data]) => {
        if (typeof data === 'string') {
          return data === currentUser.value?.uid
        } else if (data && typeof data === 'object') {
          return data.teacherId === currentUser.value?.uid
        }
        return false
      }) : false
      
      const isInServices = (s.services || []).some(service => service.includes(currentUser.value?.uid))
      const isNotCaseManager = getCaseManagerId(s) !== currentUser.value?.uid
      return (isInSchedule || isInServices) && isNotCaseManager
    })
  }

  // Apply role-based filtering
  if (currentUser.value?.role === 'case_manager' && filters.providerView === 'all') {
    result = result.filter(s => getCaseManagerId(s) === currentUser.value.uid)
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
    result = result.filter(s => getCaseManagerId(s) === filters.cm)
  }

  // Apply teacher filter
  if (filters.teacher && filters.teacher !== 'all') {
    result = result.filter(s => {
      const schedule = getSchedule(s)
      if (!schedule) return false
      
      // Handle both simple schedule structure (period -> teacherId) and complex structure (period -> {teacherId, subject, room})
      return Object.entries(schedule).some(([period, data]) => {
        if (typeof data === 'string') {
          // Simple structure: period -> teacherId
          return data === filters.teacher
        } else if (data && typeof data === 'object') {
          // Complex structure: period -> {teacherId, subject, room}
          return data.teacherId === filters.teacher
        }
        return false
      })
    })
  }

  // Apply paraeducator filter
  if (filters.paraeducator && filters.paraeducator !== 'all') {
    // Track the current paraeducator filter
    currentParaeducatorFilter.value = filters.paraeducator
    
    result = result.filter(s => {
      try {
        return shouldAideSeeStudent(filters.paraeducator, s.id, students.value, userMap.value)
      } catch (error) {
        console.error('Error filtering student for paraeducator:', error)
        return false
      }
    })
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
  
  // Handle view mode
  currentViewMode.value = filters.viewMode || 'list'
}

function editStudent(studentId) {
  editingStudentId.value = studentId
}

function emailStudent(studentId) {
  emailingStudentId.value = studentId
}

function handleTeacherFeedback(studentId) {
  feedbackStudentId.value = studentId
  showFeedbackDialog.value = true
}

// Get feedback forms for a specific student
const getFeedbackFormsForStudent = (studentId) => {
  return linkedForms.value.filter(form => form.student.id === studentId)
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

function navigateToTesting() {
  router.push('/testing')
}

function navigateToAideSchedule() {
  router.push('/aide-schedule')
}

async function handleNavAction(action) {
  switch (action) {
    case 'add-student':
      showAddStudent.value = true
      break
    case 'export':
      showExport.value = true
      break
    case 'print':
      window.print()
      break
    case 'admin':
      navigateToAdmin()
      break
    case 'testing':
      navigateToTesting()
      break
    case 'aide-schedule':
      navigateToAideSchedule()
      break
    case 'logout':
      handleLogout()
      break
  }
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
    paraeducator: currentFilters.paraeducator
  }
}
</script>

<style scoped>
.students-view {
  padding: 20px;
  padding-top: 30px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
  gap: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-left h1 {
  margin: 0;
  color: #333;
  font-size: 2rem;
  white-space: nowrap;
}

.search-container {
  display: flex;
  align-items: center;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  background: white;
  min-width: 250px;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
  color: #495057;
}

.filter-toggle-btn:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.filter-toggle-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.filter-toggle-btn.active:hover {
  background: #0056b3;
  border-color: #0056b3;
}

.filter-group {
  display: flex;
  align-items: center;
}

.radio-group {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid #ced4da;
  border-radius: 6px;
  overflow: hidden;
  background: #f8f9fa;
}

.radio-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
  color: #6c757d;
  position: relative;
}

.radio-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.radio-btn.active {
  background: #007bff;
  color: white;
  font-weight: 600;
}

.radio-btn.active:hover {
  background: #0056b3;
  color: white;
}

.radio-btn input[type="radio"] {
  margin: 0;
  opacity: 0;
  position: absolute;
}

.reset-btn {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}

/* Filters Panel */
.filters-panel {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
}

.filters-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.filters-content .filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filters-content .filter-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #495057;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  background: white;
  width: 100%;
}

.filter-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

/* Responsive design for filters */
@media (max-width: 1200px) {
  .header-filters {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .filter-group {
    justify-content: flex-start;
  }
  
  .search-input {
    min-width: 100%;
  }
  
  .filter-select {
    min-width: 100%;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .header-filters {
    flex-direction: column;
    gap: 8px;
  }
  
  .radio-group {
    justify-content: center;
  }
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