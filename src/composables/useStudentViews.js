import { ref, computed, watch } from 'vue'
import { getDisplayValue } from '@/utils/studentUtils'
import { setClassViewPeriods } from '@/utils/debugSummary'

export function useStudentViews(studentData, filterData, roleBasedStudents = null) {
  const {
    aideAssignment,
    getCaseManagerId,
    getSchedule,
    standardizeScheduleAccess,
    currentUser
  } = studentData

  const {
    filteredStudents,
    currentFilters,
    getCurrentFilters
  } = filterData

  // Use role-based students if provided (for security), otherwise fall back to general filtered students
  const studentsToUse = roleBasedStudents || filteredStudents

  // View mode state
  const currentViewMode = ref('list')

  // Watch for view mode changes in filters
  watch(
    () => currentFilters.viewMode,
    (newMode) => {
      currentViewMode.value = newMode || 'list'
    }
  )

  // Get students for testing view (only those with separate setting)
  const testingViewStudents = computed(() => {
    return studentsToUse.value.filter(student => {
      // Check flag2 (primary field) and separateSetting (alias) for backward compatibility
      return student.app?.flags?.flag2 || student.app?.flags?.separateSetting || student.separateSetting || student.flag2 || false
    })
  })

  // Group students by class (period) - SECURITY: Use role-based students
  const studentsByClass = computed(() => {
    const groups = {}
    
    // Only process if we're in class view mode
    if (currentViewMode.value !== 'class') {
      return groups
    }
    
    // Get current user ID
    const currentUserId = currentUser.value?.uid
    if (!currentUserId) {
      console.log('🔴 studentsByClass: No current user ID')
      return groups
    }
    
    console.log('🔵 studentsByClass: Current user ID:', currentUserId)
    console.log('🔵 studentsByClass: Processing', studentsToUse.value.length, 'students')
    
    // Get current filters to check for paraeducator filtering
    const currentFilters = getCurrentFilters()
    const isParaeducatorFilter = currentFilters.paraeducator && currentFilters.paraeducator !== 'all'
    
    studentsToUse.value.forEach(student => {
      const schedule = getSchedule(student) || {}
      // Debug: print full schedule object to inspect coTeaching structure
      console.log(`🕵️ studentsByClass full schedule for ${student.app?.studentData?.firstName}:`, schedule)
      
      Object.entries(schedule).forEach(([period, data]) => {
        // Extract teacherId from both simple and complex schedule structures
        let teacherId, coTeacherId
        if (typeof data === 'string') {
          teacherId = data
        } else if (data && typeof data === 'object') {
          teacherId   = data.teacherId
          coTeacherId = data.coTeaching?.caseManagerId
          // Debug: if coTeaching exists, log its content
          if (data.coTeaching) {
            console.log(`🕵️ studentsByClass coTeaching data for ${student.app?.studentData?.firstName} in period ${period}:`, data.coTeaching)
          }
        } else {
          return // Skip if no valid teacherId
        }
        
        // CRITICAL FIX: Only add student to period if CURRENT USER teaches this period
        const userTeachesThisPeriod = teacherId === currentUserId || coTeacherId === currentUserId
        
        if (!userTeachesThisPeriod) {
          return // Skip this period - current user doesn't teach it
        }
        
        if (!groups[period]) {
          groups[period] = []
        }
        
        // If filtering by paraeducator, only add student to periods where aide is assigned
        if (isParaeducatorFilter) {
            const aideData = aideAssignment.value[currentFilters.paraeducator]
            if (aideData && aideData.classAssignment && aideData.classAssignment[period]) {
              const teacherIds = Array.isArray(aideData.classAssignment[period]) 
                ? aideData.classAssignment[period] 
                : [aideData.classAssignment[period]]
              if (teacherIds.includes(teacherId)) {
                groups[period].push(student)
              }
            }
          } else {
            // No paraeducator filter, add student to this period (where user teaches)
            groups[period].push(student)
          }
        })
    })
    
    console.log('🟢 studentsByClass: Final groups:', Object.keys(groups).map(p => `Period ${p}: ${groups[p].length} students`))
    
    // Track class view periods
    setClassViewPeriods(groups)
    
    // Remove periods with no students
    Object.keys(groups).forEach(period => {
      if (groups[period].length === 0) {
        delete groups[period]
      }
    })
    
    // Sort periods numerically
    return Object.keys(groups)
      .sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''))
        const numB = parseInt(b.replace(/\D/g, ''))
        return numA - numB
      })
      .reduce((obj, key) => {
        obj[key] = groups[key]
        return obj
      }, {})
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
    
    const directStudentIds = Array.isArray(aideData.directAssignment) 
      ? aideData.directAssignment 
      : [aideData.directAssignment]
    
    return studentsToUse.value.filter(s => directStudentIds.includes(s.id))
  })

  // Group students by case manager
  const studentsByCaseManager = computed(() => {
    const groups = {}
    studentsToUse.value.forEach(student => {
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

  // Set view mode
  const setViewMode = (mode) => {
    currentViewMode.value = mode
    currentFilters.viewMode = mode
  }

  return {
    // State
    currentViewMode,
    
    // Computed data
    studentsByClass,
    directAssignmentStudents,
    studentsByCaseManager,
    testingViewStudents,
    
    // Methods
    setViewMode
  }
} 