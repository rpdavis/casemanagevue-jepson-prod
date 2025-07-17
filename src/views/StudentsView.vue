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
        <!-- Filter Toggle Button - Only for Admin Roles -->
        <button 
          v-if="canAccessFilters" 
          @click="toggleFilters" 
          class="filter-toggle-btn" 
          :class="{ active: showFilters }"
        >
          <span>🔍</span> Filters
        </button>

        <!-- Sort By Dropdown -->
        <div class="filter-group">
          <select v-model="currentFilters.sortBy" @change="applyFilters()" class="sort-select">
            <option value="firstName">First Name</option>
            <option value="lastName">Last Name</option>
            <option value="grade">Grade</option>
            <option value="reviewDate">Review Date</option>
            <option value="reevalDate">Re-evaluation Date</option>
            <option value="meetingDate">Meeting Date</option>
          </select>
        </div>

        <!-- Provider View (for case managers and sped roles) -->
        <div v-if="showProviderView" class="filter-group">
          <div class="radio-group">
            <label 
              v-for="option in defaultProviderViewOptions" 
              :key="option.value"
              class="radio-btn" 
              :class="{ active: currentFilters.providerView === option.value }"
            >
              <input 
                type="radio" 
                v-model="currentFilters.providerView" 
                :value="option.value" 
                @change="applyFilters"
              >
              {{ option.label }}
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
            <label class="radio-btn" :class="{ active: currentFilters.viewMode === 'class', disabled: isClassViewDisabled }">
              <input 
                type="radio" 
                v-model="currentFilters.viewMode" 
                value="class" 
                @change="applyFilters()"
                :disabled="isClassViewDisabled"
              >
              <span :class="{ 'strikethrough': isClassViewDisabled }">Class</span>
            </label>
            <label v-if="canAccessTesting" class="radio-btn" :class="{ active: currentFilters.viewMode === 'testing' }">
              <input type="radio" v-model="currentFilters.viewMode" value="testing" @change="applyFilters()">
              SS-Testing
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

        <!-- Plan Filter -->
        <div class="filter-group">
          <label>Plan Type</label>
          <select v-model="currentFilters.plan" @change="applyFilters()" class="filter-select">
            <option value="all">All Plans</option>
            <option value="IEP">IEP</option>
            <option value="504">504</option>
          </select>
        </div>
      </div>
    </div>
    
    <div class="content">
      <!-- List View -->
      <div v-if="currentViewMode === 'list'">
        <StudentTable
          :students="visibleStudents"
          :user-map="userMapObj"
          :current-user="currentUser"
          :can-edit-all="canEditAllStudents"
          :can-edit-own="canEditOwnStudents"
          :can-view-all="canViewAllStudents"
          :can-access-testing="canAccessTesting"
          :can-access-testing-partial="canAccessTestingPartial"
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
            :can-edit-all="canEditAllStudents"
            :can-edit-own="canEditOwnStudents"
            :can-view-all="canViewAllStudents"
            :can-access-testing="canAccessTesting"
            :can-access-testing-partial="canAccessTestingPartial"
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
            :can-edit-all="canEditAllStudents"
            :can-edit-own="canEditOwnStudents"
            :can-view-all="canViewAllStudents"
            :can-access-testing="canAccessTesting"
            :can-access-testing-partial="canAccessTestingPartial"
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
          :students="testingViewStudents"
          :user-map="userMapObj"
          :current-user="currentUser"
          :can-edit-all="canEditAllStudents"
          :can-edit-own="canEditOwnStudents"
          :can-view-all="canViewAllStudents"
          :can-access-testing="canAccessTesting"
          :can-access-testing-partial="canAccessTestingPartial"
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
      :user-map="userMapObj"
      @close="showExport = false"
    />
    
    <StudentForm
      v-if="showAddStudent"
      :users="{ userRoles }"
      @close="showAddStudent = false"
      @saved="handleStudentAdded"
    />
    
    <TeacherFeedbackDialog
      v-if="showFeedbackDialog"
      :student="getStudentById(feedbackStudentId)"
      :current-user="currentUser"
      @close="showFeedbackDialog = false"
      @form-sent="handleFormSent"
    />
  </div>
</template>

<script setup>
// Vue imports
import { computed, ref, watch } from 'vue'

// Composables
import { useStudentData } from '@/composables/useStudentData.js'
import { useStudentFilters } from '@/composables/useStudentFilters.js'
import { useRoleBasedView } from '@/composables/roles/useRoleBasedView.js'
import { useStudentViews } from '@/composables/useStudentViews.js'
import { useStudentNavActions } from '@/composables/useStudentNavActions.js'
import { useStudentQueries } from '@/composables/useStudentQueries.js'

// Components
import StudentNavMenu from '@/components/students/StudentNavMenu.vue'
import StudentTable from '@/components/students/StudentTable.vue'
import StudentEditDialog from '@/components/students/StudentEditDialog.vue'
import StudentsEmailDialog from '@/components/students/StudentsEmailDialog.vue'
import StudentForm from '@/components/students/StudentForm.vue'
import ExportDialog from '@/components/ExportDialog.vue'
import TeacherFeedbackDialog from '@/components/students/TeacherFeedbackDialog.vue'

// Initialize composables
const studentData = useStudentData()
const filterData = useStudentFilters(studentData)
const roleView = useRoleBasedView(studentData, filterData)
const navActions = useStudentNavActions(studentData)

// Extract data from composables
const {
  // Data
  students,
  userMapObj,
  caseManagers,
  teacherList,
  userRoles,
  aideAssignment,
  paraeducators,
  // Computed
  currentUser,
  isAdmin,
  showProviderView,
  // Methods
  getStudentById
} = studentData

const {
  // State
  showFilters,
  filteredStudents,
  currentFilters,
  // Methods
  toggleFilters,
  clearFilters,
  applyFilters,
  debouncedApplyFilters
} = filterData

const {
  // Role-based data
  visibleStudents,
  currentRole,
  // Permissions
  canEditAllStudents,
  canEditOwnStudents,
  canViewAllStudents,
  canManageUsers,
  canManageAides,
  canAccessTesting,
  canAccessTestingPartial,
  hasAnyTestingAccess,
  // UI Permissions (from base role view)
  canAccessFilters,
  isClassViewDisabled,
  isAdminRole,
  // Grouping functions (role-specific)
  groupStudentsByGrade,
  groupStudentsByPlan,
  // View mode and filtering
  setViewMode,
  filterByName,
  filterByCaseManager,
  filterByTeacher,
  // Provider view options (for sped roles)
  providerViewOptions
} = roleView

// For backward compatibility, we'll get view-specific data from the existing useStudentViews
// SECURITY: Pass role-based visibleStudents to ensure case managers only see authorized students
const viewData = useStudentViews(studentData, filterData, computed(() => roleView.visibleStudents.value))
const {
  // State
  currentViewMode,
  // Computed data
  studentsByClass,
  directAssignmentStudents,
  testingViewStudents
} = viewData

const {
  // Dialog states
  editingStudentId,
  emailingStudentId,
  showExport,
  showAddStudent,
  showFeedbackDialog,
  feedbackStudentId,
  // Student actions
  editStudent,
  emailStudent,
  handleTeacherFeedback,
  // Event handlers
  handleFormSent,
  handleStudentAdded,
  handleStudentSaved,
  // Navigation
  handleNavAction
} = navActions













// Fallback provider view options for roles that don't have custom options
const defaultProviderViewOptions = computed(() => {
  if (providerViewOptions?.value) {
    return providerViewOptions.value
  }
  
  // Default options for case managers and other roles
  const role = currentUser.value?.role
  if (role === 'case_manager') {
    return [
      { value: 'all', label: 'All' },
      { value: 'case_manager', label: 'CM' },
      { value: 'service_provider', label: 'SP' }
    ]
  }
  
  return [
    { value: 'all', label: 'All' },
    { value: 'case_manager', label: 'CM' },
    { value: 'service_provider', label: 'SP' }
  ]
})
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
  gap: 8px;
}

.radio-group {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid #ced4da;
  border-radius: 6px;
  overflow: hidden;
  background: #f8f9fa;
  flex-direction: row;
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

.radio-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.radio-btn.disabled:hover {
  background: #f8f9fa;
  color: #6c757d;
}

.strikethrough {
  text-decoration: line-through;
  text-decoration-color: #dc3545;
  text-decoration-thickness: 2px;
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

/* Sort Dropdown Styling */
.sort-select {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  background: white;
  min-width: 140px;
  cursor: pointer;
}

.sort-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
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
  .header-controls {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .filter-group {
    justify-content: flex-start;
  }
  
  .search-input {
    min-width: 100%;
  }
  
  .sort-select {
    min-width: 120px;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .header-controls {
    flex-direction: column;
    gap: 8px;
  }
  
  .filter-group {
    align-items: flex-start;
  }
  
  .radio-group {
    justify-content: center;
  }
  
  .sort-select {
    width: 100%;
    min-width: auto;
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

.testing-all-header {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
}

.testing-all-header h3 {
  margin: 0 0 8px 0;
  color: #dc3545;
  font-size: 1.2rem;
  font-weight: 600;
}


</style>