import { computed } from 'vue'
import { useBaseRoleView } from './useBaseRoleView'

export function useTeacherView(studentData, filterData) {
  const baseView = useBaseRoleView(studentData, filterData)

  // Override visible students to only show students in teacher's classes
  const visibleStudents = computed(() => {
    return baseView.visibleStudents.value.filter(student => {
      const schedule = studentData.getSchedule(student)
      return schedule ? Object.values(schedule).includes(baseView.currentUser.value?.uid) : false
    })
  })

  // Group students by period
  const studentsByPeriod = computed(() => {
    const groups = {}
    visibleStudents.value.forEach(student => {
      const schedule = studentData.getSchedule(student)
      if (schedule) {
        Object.entries(schedule).forEach(([period, teacherId]) => {
          if (teacherId === baseView.currentUser.value?.uid) {
            if (!groups[period]) groups[period] = []
            groups[period].push(student)
          }
        })
      }
    })
    return groups
  })

  // Group students by accommodation type
  const studentsByAccommodation = computed(() => {
    const groups = {
      instruction: [],
      assessment: []
    }
    visibleStudents.value.forEach(student => {
      if (student.app?.accommodations?.instruction) {
        groups.instruction.push(student)
      }
      if (student.app?.accommodations?.assessment) {
        groups.assessment.push(student)
      }
    })
    return groups
  })

  // Group students by service provider
  const studentsByServiceProvider = computed(() => {
    const groups = {}
    visibleStudents.value.forEach(student => {
      const providers = student.app?.providers || {}
      Object.entries(providers).forEach(([providerType, providerId]) => {
        if (providerId) {
          if (!groups[providerId]) {
            groups[providerId] = {
              provider: studentData.getUserName(providerId),
              providerType,
              students: []
            }
          }
          groups[providerId].students.push(student)
        }
      })
    })
    return groups
  })

  // Teacher-specific filtering
  const filterByPeriod = (period) => {
    filterData.currentFilters.period = period
    filterData.applyFilters()
  }

  const filterByAccommodation = (type) => {
    filterData.currentFilters.accommodationType = type
    filterData.applyFilters()
  }

  const filterByProvider = (providerId) => {
    filterData.currentFilters.serviceProvider = providerId
    filterData.applyFilters()
  }

  // Teacher can only view accommodations and basic info
  const canViewAccommodations = true
  const canViewBasicInfo = true
  const canViewServiceProviders = true
  const canViewDates = false
  const canEditStudents = false

  return {
    ...baseView,
    visibleStudents,
    studentsByPeriod,
    studentsByAccommodation,
    studentsByServiceProvider,
    filterByPeriod,
    filterByAccommodation,
    filterByProvider,
    canViewAccommodations,
    canViewBasicInfo,
    canViewServiceProviders,
    canViewDates,
    canEditStudents
  }
} 