import { computed } from 'vue'
import { useBaseRoleView } from './useBaseRoleView'

export function useAdminView(studentData, filterData) {
  const baseView = useBaseRoleView(studentData, filterData)

  // Admin has access to all students without filtering
  const hasFullAccess = true

  // Override visible students to show ALL students for admin
  const visibleStudents = computed(() => {
    return studentData.students.value || []
  })

  // Admin-specific functionality
  const groupStudentsByCaseManager = computed(() => {
    const groups = {}
    visibleStudents.value.forEach(student => {
      const caseManagerId = studentData.getCaseManagerId(student)
      if (!groups[caseManagerId]) {
        groups[caseManagerId] = {
          caseManager: studentData.getUserName(caseManagerId),
          students: []
        }
      }
      groups[caseManagerId].students.push(student)
    })
    return groups
  })

  // Admin can view all service providers
  const groupStudentsByServiceProvider = computed(() => {
    const groups = {}
    visibleStudents.value.forEach(student => {
      // Get all service providers for the student
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

  // Admin can view all accommodations
  const groupStudentsByAccommodationType = computed(() => {
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

  // Admin-specific filtering
  const filterByServiceProvider = (providerId) => {
    filterData.currentFilters.serviceProvider = providerId
    filterData.applyFilters()
  }

  const filterByAccommodationType = (type) => {
    filterData.currentFilters.accommodationType = type
    filterData.applyFilters()
  }

  // Admin can export all data
  const canExportAllData = true

  return {
    ...baseView,
    // Override specific properties
    visibleStudents,
    showProviderView: false,
    providerViewOptions: computed(() => [])
  }
} 