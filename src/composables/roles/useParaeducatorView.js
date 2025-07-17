import { computed } from 'vue'
import { useBaseRoleView } from './useBaseRoleView'

export function useParaeducatorView(studentData, filterData) {
  const baseView = useBaseRoleView(studentData, filterData)
  const currentUserId = computed(() => baseView.currentUser.value?.uid)

  // Use database-level filtering for paraeducators (students come pre-filtered from queries)
  const visibleStudents = computed(() => {
    if (!currentUserId.value) return []
    return baseView.visibleStudents.value || []
  })

  // Direct assignments - students specifically assigned to this aide
  const directAssignments = computed(() => {
    if (!currentUserId.value) return []
    
    const aideData = studentData.aideAssignment.value[currentUserId.value]
    if (!aideData?.directAssignment) return []

    const directStudentIds = Array.isArray(aideData.directAssignment)
      ? aideData.directAssignment
      : [aideData.directAssignment]

    return visibleStudents.value.filter(student => 
      directStudentIds.includes(student.id)
    )
  })

  // Class assignments - students in classes where aide is assigned
  const classAssignments = computed(() => {
    if (!currentUserId.value) return {}
    
    const aideData = studentData.aideAssignment.value[currentUserId.value]
    if (!aideData?.classAssignment) return {}

    const groups = {}

    visibleStudents.value.forEach(student => {
      const { periods } = baseView.standardizeScheduleAccess(
        studentData.getSchedule(student),
        currentUserId.value
      )
      
      Object.entries(periods).forEach(([period, data]) => {
          const aideTeacherIds = aideData.classAssignment[period]
        if (!aideTeacherIds) return

        const teacherIdArray = Array.isArray(aideTeacherIds) 
          ? aideTeacherIds 
          : [aideTeacherIds]

        if (teacherIdArray.includes(data.teacherId)) {
              if (!groups[period]) {
                groups[period] = {
              teacher: data.teacherName,
                  students: []
                }
              }
              groups[period].students.push(student)
          }
        })
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

  // Paraeducator permissions
  const canViewAccommodations = true
  const canViewBasicInfo = true
  const canViewServiceProviders = false
  const canViewDates = false
  const canEditStudents = false

  return {
    ...baseView,
    visibleStudents,
    directAssignments,
    classAssignments,
    studentsByAccommodation,
    canViewAccommodations,
    canViewBasicInfo,
    canViewServiceProviders,
    canViewDates,
    canEditStudents,
    showProviderView: false,
    providerViewOptions: computed(() => [])
  }
} 