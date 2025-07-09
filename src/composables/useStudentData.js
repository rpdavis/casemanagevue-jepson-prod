import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import useStudents from '@/composables/useStudents.js'
import useUsers from '@/composables/useUsers.js'
import useAideAssignment from '@/composables/useAideAssignment.js'
import { useAuthStore } from '@/store/authStore'
import { useTeacherFeedback } from '@/composables/useTeacherFeedback.js'

export function useStudentData() {
  // External dependencies
  const router = useRouter()
  const authStore = useAuthStore()
  
  // Composables
  const { students, fetchStudents } = useStudents()
  const { users: userMap, userList, fetchUsers, caseManagers, teacherList, userRoles } = useUsers()
  const { 
    loadAideAssignment,
    loadAideAssignments, 
    shouldAideSeeStudent, 
    getStudentsForAide,
    aideAssignment
  } = useAideAssignment()
  const { 
    feedbackForms,
    formsLoading
  } = useTeacherFeedback()

  // Loading state
  const isLoading = ref(false)
  const error = ref(null)

  // Computed properties
  const currentUser = computed(() => authStore.currentUser)
  
  const isAdmin = computed(() => {
    const role = currentUser.value?.role
    return ['admin', 'administrator', 'sped_chair', 'administrator_504_CM'].includes(role)
  })

  const showProviderView = computed(() => {
    return ['case_manager', 'administrator_504_CM', 'sped_chair'].includes(currentUser.value?.role)
  })

  const userMapObj = computed(() => userMap.value || {})

  // Get paraeducators for filter dropdown
  const paraeducators = computed(() => {
    return userList.value?.filter(user => user.role === 'paraeducator') || []
  })

  // Data fetching
  const fetchData = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const promises = [
        fetchStudents(),
        fetchUsers(),
        loadAideAssignments()
      ]
      
      await Promise.all(promises)
      console.log('StudentsView - loaded students:', students.value)
      console.log('StudentsView - loaded users:', userMap.value)
      
    } catch (err) {
      console.error('Error fetching data:', err)
      error.value = err.message || 'Failed to load data'
    } finally {
      isLoading.value = false
    }
  }

  // Helper functions
  const getStudentById = (studentId) => {
    return students.value.find(s => s.id === studentId) || {}
  }

  const getUserName = (userId) => {
    const user = userMap.value[userId]
    return user ? (user.name || user.email || userId) : userId
  }

  const getCaseManagerName = (caseManagerId) => {
    if (!caseManagerId) return 'N/A'
    const user = userMap.value[caseManagerId]
    return user ? (user.name || user.email || caseManagerId) : caseManagerId
  }

  // Helper function to get case manager ID from nested structure
  const getCaseManagerId = (student) => {
    return student.app?.studentData?.caseManagerId || 
           student.caseManagerId || 
           student.casemanager_id
  }

  // Helper function to get schedule data from nested structure
  const getSchedule = (student) => {
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

  // Auto-load data on mount
  onMounted(fetchData)

  return {
    // State
    isLoading,
    error,
    
    // Data
    students,
    userMap,
    userList,
    userMapObj,
    caseManagers,
    teacherList,
    userRoles,
    aideAssignment,
    feedbackForms,
    formsLoading,
    paraeducators,
    
    // Computed
    currentUser,
    isAdmin,
    showProviderView,
    
    // Methods
    fetchData,
    getStudentById,
    getUserName,
    getCaseManagerName,
    getCaseManagerId,
    getSchedule,
    shouldAideSeeStudent,
    
    // Navigation
    router
  }
} 