import { ref, computed, reactive, watch } from 'vue'
import { getDisplayValue } from '@/utils/studentUtils'

export function useStudentFilters(studentData) {
  const {
    students,
    currentUser,
    shouldAideSeeStudent,
    userMap,
    getCaseManagerId,
    getSchedule
  } = studentData

  // Filter state
  const showFilters = ref(false)
  const filteredStudents = ref([])

  // Current filters state
  const currentFilters = reactive({
    sortBy: 'firstName',
    cm: 'all',
    teacher: 'all',
    paraeducator: 'all',
    plan: 'all',
    search: '',
    providerView: 'all',
    viewMode: 'list'
  })

  // Debounced search
  let debounceTimer = null
  const debouncedApplyFilters = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      applyFilters()
    }, 300) // 300ms delay
  }

  // Filter management
  const toggleFilters = () => {
    showFilters.value = !showFilters.value
  }

  const clearFilters = () => {
    currentFilters.sortBy = 'firstName'
    currentFilters.cm = 'all'
    currentFilters.teacher = 'all'
    currentFilters.paraeducator = 'all'
    currentFilters.plan = 'all'
    currentFilters.search = ''
    currentFilters.providerView = 'all'
    currentFilters.viewMode = 'list'
    applyFilters()
  }

  // Helper function to get current filters (for paraeducator filtering)
  const getCurrentFilters = () => {
    return {
      paraeducator: currentFilters.paraeducator
    }
  }

  // Main filtering function
  const applyFilters = (filters = currentFilters) => {
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
    // Note: For case managers, the role-based view (useCaseManagerView) handles provider view filtering
    // so we skip the general filtering here to avoid conflicts
    if (currentUser.value?.role === 'paraeducator') {
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
      result = result.filter(s => {
        try {
          return shouldAideSeeStudent(filters.paraeducator, s.id, students.value, userMap.value)
        } catch (error) {
          console.error('Error filtering student for paraeducator:', error)
          return false
        }
      })
    }

    // Apply plan filter
    if (filters.plan && filters.plan !== 'all') {
      result = result.filter(s => {
        const studentPlan = getDisplayValue(s, 'plan')
        return studentPlan === filters.plan
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
  }

  // Watch for data changes and reapply filters
  watch(
    () => [students.value, currentUser.value],
    () => {
      if (students.value.length > 0) {
        applyFilters()
      }
    },
    { deep: true }
  )

  return {
    // State
    showFilters,
    filteredStudents,
    currentFilters,
    
    // Methods
    toggleFilters,
    clearFilters,
    applyFilters,
    debouncedApplyFilters,
    getCurrentFilters
  }
} 