import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import useStudents from '@/composables/useStudents.js'
import useUsers from '@/composables/useUsers.js'
import useAideAssignment from '@/composables/useAideAssignment.js'
import { useAuthStore } from '@/store/authStore'
import { useTeacherFeedback } from '@/composables/useTeacherFeedback.js'
import { useStudentQueries } from '@/composables/useStudentQueries.js'
import { quickSecurityTest } from '@/utils/securityTest.js'
import { 
  getTeacherIdFromPeriod, 
  getCoTeachingCaseManagerFromPeriod,
  getAllTeacherIdsFromSchedule,
  getCoTeachingCaseManagersFromSchedule,
  isCoTeachingCaseManager 
} from '@/utils/scheduleUtils.js'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'

export function useStudentData() {
  // External dependencies
  const router = useRouter()
  const authStore = useAuthStore()
  
  // Composables
  const { students, setStudents } = useStudents()
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
  const { loadStudents } = useStudentQueries()

  // Loading state
  const isLoading = ref(false)
  const error = ref(null)

  // Computed properties
  // Use computed 'user' from auth store for correct reactive user object
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

  // Data fetching with role-based security
  const fetchData = async () => {
    console.log('🔍 useStudentData: fetchData() called')
    isLoading.value = true
    error.value = null
    
    try {
      console.log('🔍 useStudentData: About to fetchUsers()...')
      // First, fetch users (needed for role-based student queries)
      await fetchUsers()
      console.log('🔍 useStudentData: fetchUsers() completed')
      
      // Then fetch students based on user role (SECURITY: Database-level filtering)
      const user = currentUser.value
      console.log('🔍 useStudentData: Checking user for loadStudents call:', user)
      if (user) {
        console.log('🔒 Security: Fetching students for user role:', user.role)
        console.log('🔍 useStudentData: About to call loadStudents()...')
        const roleBasedStudents = await loadStudents()
        console.log('🔍 useStudentData: loadStudents() returned:', roleBasedStudents.length, 'students')
        setStudents(roleBasedStudents)
        
        // Run security test to verify access control
        const securityTest = quickSecurityTest(roleBasedStudents, user)
        if (!securityTest.isSecure) {
          console.error('🚨 SECURITY VIOLATION DETECTED:', securityTest.violations)
        }
      } else {
        console.log('🔒 Security: No user found - setting empty student array')
        setStudents([])
      }
      
      // Load aide assignments based on user role and permissions
      const userRole = currentUser.value?.role
      if (['admin', 'school_admin', 'admin_504', 'sped_chair',
           // Legacy roles for backward compatibility
           'administrator', 'administrator_504_CM'].includes(userRole)) {
        // Admin roles can load all aide assignments
        await loadAideAssignments()
      } else if (userRole === 'paraeducator' && currentUser.value.uid) {
        // Paraeducators can only load their own aide assignment
        console.log('🔍 useStudentData: Loading individual aide assignment for paraeducator:', currentUser.value.uid)
        await loadAideAssignment(currentUser.value.uid)
        
        // Listen for changes to their own aideSchedules document for real-time updates
        const aideDocRef = doc(db, 'aideSchedules', currentUser.value.uid)
        const unsubscribe = onSnapshot(aideDocRef, async snap => {
          if (snap.exists()) {
            console.log('🔍 useStudentData: Aide schedule updated, reloading students...')
            // Update the aide assignment data
            await loadAideAssignment(currentUser.value.uid)
            // Re-fetch role-based students (will use updated studentIds)
            const updated = await loadStudents()
            setStudents(updated)
          }
        })
        // Clean up on unmount
        onUnmounted(() => unsubscribe())
      }
      
      console.log('🔒 Security: Loaded', students.value.length, 'students for', currentUser.value?.role)
      console.log('StudentsView - loaded users:', Object.keys(userMap.value || {}).length, 'users')
      
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
  onMounted(() => {
    console.log('🔍 useStudentData: onMounted triggered, calling fetchData...')
    fetchData()
  })

  // Watch for user role changes and reload data accordingly
  watch(
    () => currentUser.value?.role,
    async (newRole, oldRole) => {
      if (newRole && newRole !== oldRole) {
        console.log('🔒 Security: User role changed from', oldRole, 'to', newRole, '- reloading students')
        
        // Reload students with new role
        const user = currentUser.value
        console.log('🔍 useStudentData: Role watcher - checking user:', user)
        if (user) {
          console.log('🔍 useStudentData: Role watcher - about to call loadStudents()...')
          const roleBasedStudents = await loadStudents()
          console.log('🔍 useStudentData: Role watcher - loadStudents() returned:', roleBasedStudents.length, 'students')
          setStudents(roleBasedStudents)
          
          // Run security test
          const securityTest = quickSecurityTest(roleBasedStudents, user)
          if (!securityTest.isSecure) {
            console.error('🚨 SECURITY VIOLATION DETECTED:', securityTest.violations)
          }
          
          console.log('🔒 Security: Reloaded', roleBasedStudents.length, 'students for role', newRole)
        }
      }
    },
    { immediate: false }
  )

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
    
    // Schedule utilities (co-teaching support)
    getTeacherIdFromPeriod,
    getCoTeachingCaseManagerFromPeriod,
    getAllTeacherIdsFromSchedule,
    getCoTeachingCaseManagersFromSchedule,
    isCoTeachingCaseManager,
    
    // Navigation
    router
  }
} 