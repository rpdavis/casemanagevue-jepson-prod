import { computed } from 'vue'
import { getDisplayValue } from '@/utils/studentUtils'

export function useBaseRoleView(studentData, filterData) {
  const {
    students,
    userMapObj,
    currentUser,
    getCaseManagerId,
    getSchedule,
    getUserName,
    formatDate
  } = studentData

  const {
    filteredStudents,
    currentFilters,
    applyFilters
  } = filterData

  // Basic student data access
  const visibleStudents = computed(() => {
    return filteredStudents.value
  })

  // Basic student info formatting
  const formatStudentName = (student) => {
    const firstName = getDisplayValue(student, 'firstName')
    const lastName = getDisplayValue(student, 'lastName')
    return `${firstName} ${lastName}`
  }

  const formatStudentInfo = (student) => {
    return {
      name: formatStudentName(student),
      grade: getDisplayValue(student, 'grade'),
      plan: getDisplayValue(student, 'plan'),
      caseManager: getUserName(getCaseManagerId(student))
    }
  }

  // Basic date formatting
  const formatDates = (student) => {
    return {
      reviewDate: formatDate(getDisplayValue(student, 'reviewDate')),
      reevalDate: formatDate(getDisplayValue(student, 'reevalDate')),
      meetingDate: formatDate(getDisplayValue(student, 'meetingDate'))
    }
  }

  // Basic schedule access
  const getStudentSchedule = (student) => {
    const schedule = getSchedule(student)
    if (!schedule) return {}

    return Object.entries(schedule).reduce((acc, [period, teacherId]) => {
      acc[period] = {
        teacherId,
        teacherName: getUserName(teacherId)
      }
      return acc
    }, {})
  }

  // Basic filtering
  const filterByName = (searchTerm) => {
    currentFilters.search = searchTerm
    applyFilters()
  }

  const filterByCaseManager = (caseManagerId) => {
    currentFilters.cm = caseManagerId
    applyFilters()
  }

  const filterByTeacher = (teacherId) => {
    currentFilters.teacher = teacherId
    applyFilters()
  }

  // View mode management
  const setViewMode = (mode) => {
    currentFilters.viewMode = mode
    applyFilters()
  }

  // Basic student grouping
  const groupStudentsByGrade = computed(() => {
    const groups = {}
    visibleStudents.value.forEach(student => {
      const grade = getDisplayValue(student, 'grade')
      if (!groups[grade]) groups[grade] = []
      groups[grade].push(student)
    })
    return groups
  })

  const groupStudentsByPlan = computed(() => {
    const groups = {}
    visibleStudents.value.forEach(student => {
      const plan = getDisplayValue(student, 'plan')
      if (!groups[plan]) groups[plan] = []
      groups[plan].push(student)
    })
    return groups
  })

  // UI Permission Logic - Common across all roles
  const canAccessFilters = computed(() => {
    const role = currentUser.value?.role
    return ['admin', 'administrator', 'administrator_504_CM', 'sped_chair'].includes(role)
  })

  // View mode restrictions based on role
  const isClassViewDisabled = computed(() => {
    const role = currentUser.value?.role
    
    // For case managers, class view is only available when SP (service provider) is selected
    if (role === 'case_manager') {
      return currentFilters.providerView !== 'service_provider'
    }
    
    // For admin, class view is only available when teacher or paraeducator filter is selected
    if (role === 'admin') {
      return currentFilters.teacher === 'all' && currentFilters.paraeducator === 'all'
    }
    
    // For administrator_504_CM and sped_chair, class view is available when:
    // 1. Teacher or paraeducator filter is selected, OR
    // 2. Their SP (service provider) view is selected
    // BUT disabled when * is selected
    if (role === 'administrator_504_CM' || role === 'sped_chair') {
      // First check if * is selected - if so, disable class view
      if (currentFilters.providerView === 'iep_all' || currentFilters.providerView === 'iep_504_all') {
        return true
      }
      
      // Otherwise, use the original logic
      const hasTeacherOrParaeducatorFilter = currentFilters.teacher !== 'all' || currentFilters.paraeducator !== 'all'
      const hasServiceProviderView = currentFilters.providerView === 'service_provider'
      return !hasTeacherOrParaeducatorFilter && !hasServiceProviderView
    }
    
    // For paraeducators, class view might have different restrictions
    if (role === 'paraeducator') {
      // Could add paraeducator-specific logic here if needed
      return false
    }
    
    // For other roles (teacher, service_provider), class view is always available
    return false
  })

  // Check if user has admin-level permissions
  const isAdminRole = computed(() => {
    const role = currentUser.value?.role
    return ['admin', 'administrator', 'administrator_504_CM', 'sped_chair'].includes(role)
  })

  return {
    // Data
    visibleStudents,
    currentUser,
    userMapObj,

    // Computed groups
    groupStudentsByGrade,
    groupStudentsByPlan,

    // UI Permissions
    canAccessFilters,
    isClassViewDisabled,
    isAdminRole,

    // Formatting functions
    formatStudentName,
    formatStudentInfo,
    formatDates,
    getStudentSchedule,

    // Filter functions
    filterByName,
    filterByCaseManager,
    filterByTeacher,
    setViewMode,

    // Current state
    currentFilters,
    
    // Default provider view settings
    showProviderView: false,
    providerViewOptions: computed(() => [])
  }
} 