import { computed, watch } from 'vue'
import { useBaseRoleView } from './useBaseRoleView'
import { getDisplayValue } from '@/utils/studentUtils'

export function useSpedChairView(studentData, filterData) {
  const baseView = useBaseRoleView(studentData, filterData)
  const currentUserId = computed(() => baseView.currentUser.value?.uid)
  const currentRole = computed(() => baseView.currentUser.value?.role)

  // Override provider view options for sped_chair and administrator_504_CM
  const providerViewOptions = computed(() => {
    const role = currentRole.value
    if (role === 'sped_chair') {
      return [
        { value: 'all', label: 'All' },
        { value: 'case_manager', label: 'CM' },
        { value: 'service_provider', label: 'SP' },
        { value: 'iep_all', label: '*' }
      ]
    } else if (role === 'administrator_504_CM') {
      return [
        { value: 'case_manager', label: 'CM' },
        { value: 'iep_504_all', label: '*' }
      ]
    }
    return []
  })
  
  // Ensure the current filter is valid for this view; default to first option if not
  watch(providerViewOptions, (options) => {
    // Default for sped_chair is 'all'; for 504 CM default to IEP/504 '*' view
    const role = currentRole.value
    let defaultValue = ''
    if (role === 'administrator_504_CM') {
      defaultValue = 'iep_504_all'
    } else if (role === 'sped_chair') {
      defaultValue = 'all'
    }
    // If current filter isn't valid for this view, set to default
    const validValues = options.map(o => o.value)
    if (!validValues.includes(filterData.currentFilters.providerView) && validValues.includes(defaultValue)) {
      filterData.currentFilters.providerView = defaultValue
      filterData.applyFilters()
    }
  }, { immediate: true })

  // Override visible students with frontend filtering
  const visibleStudents = computed(() => {
    if (!currentUserId.value) return []
    
    // Get base filtered students
    const baseStudents = baseView.visibleStudents.value
    const providerView = filterData.currentFilters.providerView
    const role = currentRole.value

    // Apply provider view filtering
    switch (providerView) {
      case 'case_manager':
        return baseView.getProviderViewStudents(baseStudents, currentUserId.value, 'case_manager')
      
      case 'service_provider':
        return baseView.getProviderViewStudents(baseStudents, currentUserId.value, 'service_provider')
      
      case 'all':
      // Show students where user is either case manager OR service provider
        return baseStudents.filter(student => {
          const isCaseManager = studentData.getCaseManagerId(student) === currentUserId.value
          const schedule = studentData.getSchedule(student)
          
          // Check if user teaches any of the student's classes
          const isTeacher = schedule ? Object.values(schedule).some(periodData => {
            if (typeof periodData === 'string') {
              return periodData === currentUserId.value
            } else if (periodData && typeof periodData === 'object') {
              return periodData.teacherId === currentUserId.value || 
                     periodData.coTeaching?.caseManagerId === currentUserId.value
            }
            return false
          }) : false
          
          return isCaseManager || isTeacher
      })
      
      case 'iep_all':
        if (role === 'sped_chair') {
          // Show all students with IEP
          return baseStudents.filter(student => 
            getDisplayValue(student, 'plan') === 'IEP'
          )
        }
        return []
      
      case 'iep_504_all':
        if (role === 'administrator_504_CM') {
          // Show all students with IEP or 504 plans
          return baseStudents.filter(student => {
            const plan = getDisplayValue(student, 'plan')
            return plan === 'IEP' || plan === '504'
          })
        }
        return []
      
      default:
        console.warn(`Unknown provider view: ${providerView}`)
        return []
    }
  })

  // Group students by period for class view
  const studentsByPeriod = computed(() => {
    if (!currentUserId.value) return {}
    return baseView.groupStudentsByPeriod(visibleStudents.value, currentUserId.value)
  })

  // Override view mode switching logic
  const setViewMode = (mode) => {
    // If trying to switch to class view while it's disabled, switch to list instead
    if (mode === 'class' && baseView.isClassViewDisabled.value) {
      currentFilters.viewMode = 'list'
      return
    }
    currentFilters.viewMode = mode
  }

  return {
    ...baseView,
    // Override specific properties
    visibleStudents,
    studentsByPeriod,
    providerViewOptions,
    // Additional properties
    showProviderView: true
  }
} 