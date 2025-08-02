import { computed } from 'vue'

/**
 * Centralized student access logic
 * Single source of truth for who can see which students
 */
export function useStudentAccess(currentUser, students, aideAssignment = null) {
  
  // Helper: Check if user is case manager for student
  const isCaseManager = (userId, student) => {
    const cmId = student.app?.studentData?.caseManagerId || student.caseManagerId
    return cmId === userId
  }
  
  // Helper: Check if user teaches student
  const teachesStudent = (userId, student) => {
    const schedule = student.app?.schedule?.periods || student.schedule || {}
    
    return Object.values(schedule).some(periodData => {
      if (typeof periodData === 'string') {
        return periodData === userId
      } else if (periodData && typeof periodData === 'object') {
        return periodData.teacherId === userId || 
               periodData.coTeaching?.caseManagerId === userId
      }
      return false
    })
  }
  
  // Helper: Check if paraeducator is assigned to student
  const isAssignedToStudent = (userId, student) => {
    if (!aideAssignment || !aideAssignment[userId]) return false
    
    const aideData = aideAssignment[userId]
    
    // Check direct assignment
    const directIds = Array.isArray(aideData.directAssignment) 
      ? aideData.directAssignment 
      : [aideData.directAssignment].filter(Boolean)
    
    if (directIds.includes(student.id)) return true
    
    // Check class assignment
    if (!aideData.classAssignment) return false
    
    const schedule = student.app?.schedule?.periods || student.schedule || {}
    
    return Object.entries(schedule).some(([period, data]) => {
      const teacherId = typeof data === 'string' ? data : data?.teacherId
      const assignedTeachers = aideData.classAssignment[period]
      
      if (!assignedTeachers) return false
      
      const teacherArray = Array.isArray(assignedTeachers) 
        ? assignedTeachers 
        : [assignedTeachers]
      
      return teacherArray.includes(teacherId)
    })
  }
  
  // Core access function - determines if user can see student
  const canUserSeeStudent = (user, student) => {
    if (!user || !student) return false
    
    const userId = user.uid
    const userRole = user.role
    
    switch (userRole) {
      case 'admin':
      case 'school_admin':
      case 'staff_view':
      case 'staff_edit':
      case 'admin_504':
      case 'sped_chair':
      // Legacy roles for backward compatibility
      case 'administrator':
      case 'administrator_504_CM':
        return true // See all students
        
      case 'case_manager':
        return isCaseManager(userId, student) || teachesStudent(userId, student)
        
      case 'teacher':
      case 'service_provider':
        return teachesStudent(userId, student)
        
      case 'paraeducator':
        return isAssignedToStudent(userId, student)
        
      default:
        return false
    }
  }
  
  // Get all students user can access
  const getAccessibleStudents = computed(() => {
    if (!currentUser.value || !students.value) return []
    
    return students.value.filter(student => 
      canUserSeeStudent(currentUser.value, student)
    )
  })
  
  // Get students for specific provider view
  const getProviderViewStudents = (providerView) => {
    const user = currentUser.value
    if (!user) return []
    
    const accessible = getAccessibleStudents.value
    const userId = user.uid
    const userRole = user.role
    
    // Only certain roles have provider views
    if (!['case_manager', 'sped_chair', 'admin_504', 'administrator_504_CM'].includes(userRole)) {
      return accessible
    }
    
    switch (providerView) {
      case 'case_manager':
        return accessible.filter(s => isCaseManager(userId, s))
        
      case 'service_provider':
        return accessible.filter(s => teachesStudent(userId, s))
        
      case 'all':
        return accessible
        
      case 'iep_all':
        if (userRole === 'sped_chair') {
          return students.value.filter(s => 
            (s.app?.studentData?.plan || s.plan) === 'IEP'
          )
        }
        return []
        
      case 'iep_504_all':
        if (userRole === 'admin_504' || userRole === 'administrator_504_CM') {
          return students.value.filter(s => {
            const plan = s.app?.studentData?.plan || s.plan
            return plan === 'IEP' || plan === '504'
          })
        }
        return []
        
      default:
        return accessible
    }
  }
  
  // Get students grouped by period (for class view)
  // CRITICAL: Only returns students in periods where CURRENT USER teaches
  const getStudentsByPeriod = (providerView = 'all') => {
    const user = currentUser.value
    if (!user) return {}
    
    const userId = user.uid
    const studentsToGroup = getProviderViewStudents(providerView)
    const periods = {}
    
    studentsToGroup.forEach(student => {
      const schedule = student.app?.schedule?.periods || student.schedule || {}
      
      Object.entries(schedule).forEach(([period, data]) => {
        // Check if CURRENT USER teaches this period
        const teacherId = typeof data === 'string' ? data : data?.teacherId
        const coTeacherId = data?.coTeaching?.caseManagerId
        
        if (teacherId === userId || coTeacherId === userId) {
          if (!periods[period]) periods[period] = []
          periods[period].push(student)
        }
      })
    })
    
    return periods
  }
  
  // Get students grouped by period for a specific teacher (admin use)
  const getStudentsByPeriodForTeacher = (teacherUserId) => {
    if (!teacherUserId || !students.value) return {}
    
    const periods = {}
    
    students.value.forEach(student => {
      const schedule = student.app?.schedule?.periods || student.schedule || {}
      
      Object.entries(schedule).forEach(([period, data]) => {
        const teacherId = typeof data === 'string' ? data : data?.teacherId
        const coTeacherId = data?.coTeaching?.caseManagerId
        
        if (teacherId === teacherUserId || coTeacherId === teacherUserId) {
          if (!periods[period]) periods[period] = []
          periods[period].push(student)
        }
      })
    })
    
    return periods
  }
  
  return {
    // Core functions
    canUserSeeStudent,
    isCaseManager,
    teachesStudent,
    isAssignedToStudent,
    
    // Computed values
    getAccessibleStudents,
    
    // Methods
    getProviderViewStudents,
    getStudentsByPeriod,
    getStudentsByPeriodForTeacher
  }
} 