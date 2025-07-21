import { computed } from 'vue'
import { useBaseRoleView } from './useBaseRoleView'

export function useTeacherView(studentData, filterData) {
  const baseView = useBaseRoleView(studentData, filterData)
  const currentUserId = computed(() => baseView.currentUser.value?.uid)

  // Override visible students to only show students in teacher's classes
  const visibleStudents = computed(() => {
    if (!currentUserId.value) return []
    
    // Get the raw students from database for teachers (similar to case manager fix)
    const allFilteredStudents = studentData.students.value
    
    // Filter students where teacher is in their schedule
    const filtered = allFilteredStudents.filter(student => {
      const schedule = studentData.getSchedule(student)
      if (!schedule) {
        return false
      }
      
      // Check if teacher ID is anywhere in the schedule
      // Handle both string values (teacherId) and object values ({ teacherId, subject, room })
      const hasTeacher = Object.values(schedule).some(periodData => {
        if (typeof periodData === 'string') {
          return periodData === currentUserId.value
        } else if (periodData && typeof periodData === 'object') {
          return periodData.teacherId === currentUserId.value || 
                 periodData.coTeaching?.caseManagerId === currentUserId.value
        }
        return false
      })
      
      return hasTeacher
    })
    
    return filtered
  })

  // Group students by period
  const studentsByPeriod = computed(() => {
    if (!currentUserId.value) return {}
    return baseView.groupStudentsByPeriod(visibleStudents.value, currentUserId.value)
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

  // Teacher permissions
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
    canViewAccommodations,
    canViewBasicInfo,
    canViewServiceProviders,
    canViewDates,
    canEditStudents,
    showProviderView: false,
    providerViewOptions: computed(() => [])
  }
} 