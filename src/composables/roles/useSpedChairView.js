import { computed } from 'vue'
import { useBaseRoleView } from './useBaseRoleView'
import { getDisplayValue } from '@/utils/studentUtils'

export function useSpedChairView(studentData, filterData) {
  const baseView = useBaseRoleView(studentData, filterData)
  const { 
    students, 
    currentUser, 
    getCaseManagerId, 
    getSchedule
  } = studentData
  const { currentFilters } = filterData

  // Override provider view options for sped_chair and administrator_504_CM
  const providerViewOptions = computed(() => {
    const role = currentUser.value?.role
    if (role === 'sped_chair') {
      return [
        { value: 'all', label: 'All' },
        { value: 'case_manager', label: 'CM' },
        { value: 'service_provider', label: 'SP' },
        { value: 'iep_all', label: '*' }
      ]
    } else if (role === 'administrator_504_CM') {
      return [
        { value: 'all', label: 'All' },
        { value: 'case_manager', label: 'CM' },
        { value: 'service_provider', label: 'SP' },
        { value: 'iep_504_all', label: '*' }
      ]
    }
    return []
  })

  // Override visible students with frontend filtering
  const visibleStudents = computed(() => {
    const allStudents = students.value
    const currentUserId = currentUser.value?.uid
    const providerView = currentFilters.providerView
    const role = currentUser.value?.role

    if (!currentUserId || !allStudents) return []

    // Apply provider view filtering
    let filteredStudents = allStudents

    if (providerView === 'case_manager') {
      // Show only students where user is the case manager
      filteredStudents = allStudents.filter(student => {
        const caseManagerId = getCaseManagerId(student)
        return caseManagerId === currentUserId
      })
    } else if (providerView === 'service_provider') {
      // Show only students where user is a service provider (teacher)
      filteredStudents = allStudents.filter(student => {
        const schedule = getSchedule(student)
        if (!schedule) return false
        return Object.values(schedule).includes(currentUserId)
      })
    } else if (providerView === 'all') {
      // Show students where user is either case manager OR service provider
      filteredStudents = allStudents.filter(student => {
        const caseManagerId = getCaseManagerId(student)
        const schedule = getSchedule(student)
        const isCaseManager = caseManagerId === currentUserId
        const isServiceProvider = schedule ? Object.values(schedule).includes(currentUserId) : false
        return isCaseManager || isServiceProvider
      })
    } else if (providerView === 'iep_all' && role === 'sped_chair') {
      // Show all students with IEP
      filteredStudents = allStudents.filter(student => {
        const plan = getDisplayValue(student, 'plan')
        return plan === 'IEP'
      })
    } else if (providerView === 'iep_504_all' && role === 'administrator_504_CM') {
      // Show all students with IEP or 504
      filteredStudents = allStudents.filter(student => {
        const plan = getDisplayValue(student, 'plan')
        return plan === 'IEP' || plan === '504'
      })
    }

    return filteredStudents
  })

  // Override view mode switching logic
  const setViewMode = (mode) => {
    // If trying to switch to class view while * is selected, switch to list instead
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
    setViewMode,
    providerViewOptions,
    // Additional properties
    showProviderView: true
  }
} 