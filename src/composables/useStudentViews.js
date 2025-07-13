import { ref, computed, watch } from 'vue'
import { getDisplayValue } from '@/utils/studentUtils'

export function useStudentViews(studentData, filterData, roleBasedStudents = null) {
  const {
    aideAssignment,
    getCaseManagerId,
    getSchedule
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
      // Check both nested and legacy structures for flag2 (separate setting)
      return student.app?.flags?.flag2 || student.flag2 || false
    })
  })

  // Group students by class (period) - SECURITY: Use role-based students
  const studentsByClass = computed(() => {
    const groups = {}
    
    // Check if we're filtering by paraeducator
    const currentFilters = getCurrentFilters()
    const isParaeducatorFilter = currentFilters.paraeducator && currentFilters.paraeducator !== 'all'
    
    studentsToUse.value.forEach(student => {
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
              const teacherIds = Array.isArray(aideData.classAssignment[period]) 
                ? aideData.classAssignment[period] 
                : [aideData.classAssignment[period]]
              if (teacherIds.includes(teacherId)) {
                groups[period].push(student)
              }
            }
          } else {
            // No paraeducator filter, add student to all their periods
            groups[period].push(student)
          }
        })
      } else {
        // Student has no schedule - add to special "No Schedule" group
        // This is especially important for case managers who need to see all their students
        if (!isParaeducatorFilter) {
          if (!groups['No Schedule']) {
            groups['No Schedule'] = []
          }
          groups['No Schedule'].push(student)
        }
      }
    })
    
    // Remove periods with no students
    Object.keys(groups).forEach(period => {
      if (groups[period].length === 0) {
        delete groups[period]
      }
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