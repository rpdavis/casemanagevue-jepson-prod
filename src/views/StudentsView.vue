// /Users/rd/CaseManageVue/src/views/StudentsView.vue

<template>
  <div class="students-view">
    <div class="header">
      <h1>Student Management</h1>
      <div class="header-actions">
        <button @click="showExport = true" class="btn btn-secondary">
          <span>📊</span> Export
        </button>
        <button @click="showAddStudent = true" class="btn btn-primary">
          <span>➕</span> Add Student
        </button>
      </div>
    </div>
    
    <div class="controls">
      <StudentFilters
        :case-managers="caseManagers"
        :teachers="teacherList"
        :current-user-role="currentUser?.role"
        :current-user-id="currentUser?.uid"
        @filter="applyFilters"
      />
    </div>
    
    <div class="content">
      <StudentTable
        :students="filteredStudents"
        :user-map="userMap"
        :current-user="currentUser"
        @edit="editStudent"
        @email="emailStudent"
        @teacher-feedback="handleTeacherFeedback"
      />
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
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import useStudents from '@/composables/useStudents.js'
import useUsers from '@/composables/useUsers.js'
import { useAuthStore } from '@/store/authStore'
import StudentFilters from '@/components/students/StudentFilters.vue'
import StudentTable from '@/components/students/StudentTable.vue'
import StudentEditDialog from '@/components/students/StudentEditDialog.vue'
import StudentsEmailDialog from '@/components/students/StudentsEmailDialog.vue'
import StudentForm from '@/components/students/StudentForm.vue'
import ExportDialog from '@/components/ExportDialog.vue'

const { students, fetchStudents } = useStudents()
const { users: userMap, fetchUsers, caseManagers, teacherList, userRoles } = useUsers()
const authStore = useAuthStore()

const currentUser = computed(() => authStore.currentUser)

const filteredStudents = ref([])
const editingStudentId = ref(null)
const emailingStudentId = ref(null)
const showExport = ref(false)
const showAddStudent = ref(false)

async function fetchData() {
  try {
    await Promise.all([
      fetchStudents(),
      fetchUsers()
    ])
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

function applyFilters(filters) {
  let result = students.value

  // Apply filters here based on the 'filters' object
  if (filters.search) {
    const search = filters.search.toLowerCase()
    result = result.filter(s => 
      `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase().includes(search)
    )
  }
  
  if (filters.cm && filters.cm !== 'all') {
    result = result.filter(s => s.casemanager_id === filters.cm)
  }
  
  // Apply role-based filtering
  if (currentUser.value?.role === 'case_manager') {
    result = result.filter(s => s.casemanager_id === currentUser.value.uid)
  }

  // Apply sorting
  if (filters.sortBy) {
    result.sort((a, b) => {
      const valA = a[filters.sortBy] || ''
      const valB = b[filters.sortBy] || ''
      return valA.localeCompare(valB)
    })
  }

  filteredStudents.value = result
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
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
}

.header h1 {
  margin: 0;
  color: #333;
  font-size: 2rem;
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
</style>