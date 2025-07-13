import { computed } from 'vue'
import { useBaseRoleView } from './useBaseRoleView'

export function useServiceProviderView(studentData, filterData) {
  const baseView = useBaseRoleView(studentData, filterData)
  
  // Service providers see students they provide services to
  const visibleStudents = computed(() => {
    const currentUserId = baseView.currentUser.value?.uid
    if (!currentUserId) return []
    
    return baseView.visibleStudents.value.filter(student => {
      const schedule = studentData.getSchedule(student)
      if (!schedule) return false
      return Object.values(schedule).includes(currentUserId)
    })
  })

  return {
    ...baseView,
    visibleStudents,
    showProviderView: false,
    providerViewOptions: computed(() => [])
  }
} 