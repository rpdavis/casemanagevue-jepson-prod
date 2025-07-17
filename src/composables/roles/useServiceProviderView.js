import { computed } from 'vue'
import { useBaseRoleView } from './useBaseRoleView'

export function useServiceProviderView(studentData, filterData) {
  const baseView = useBaseRoleView(studentData, filterData)
  const currentUserId = computed(() => baseView.currentUser.value?.uid)
  
  // Service providers see students they provide services to
  const visibleStudents = computed(() => {
    if (!currentUserId.value) return []
    
    // Get base filtered students and apply service provider filtering
    return baseView.getProviderViewStudents(
      baseView.visibleStudents.value,
      currentUserId.value,
      'service_provider'
    )
  })

  // Group students by period for class view
  const studentsByPeriod = computed(() => {
    if (!currentUserId.value) return {}
    return baseView.groupStudentsByPeriod(visibleStudents.value, currentUserId.value)
  })

  return {
    ...baseView,
    visibleStudents,
    studentsByPeriod,
    showProviderView: false,
    providerViewOptions: computed(() => [])
  }
} 