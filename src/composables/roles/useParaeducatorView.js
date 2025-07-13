import { computed } from 'vue'
import { useBaseRoleView } from './useBaseRoleView'
import { getDisplayValue } from '@/utils/studentUtils'

export function useParaeducatorView(studentData, filterData) {
  const baseView = useBaseRoleView(studentData, filterData)

  // Use database-level filtering for paraeducators (students come pre-filtered from queries)
  const visibleStudents = computed(() => {
    return studentData.students.value || []
  })

  // Direct assignments - students specifically assigned to this aide
  const directAssignments = computed(() => {
    const aideData = studentData.aideAssignment.value[baseView.currentUser.value?.uid]
    if (!aideData || !aideData.directAssignment) return []

    const directStudentIds = Array.isArray(aideData.directAssignment)
      ? aideData.directAssignment
      : [aideData.directAssignment]

    return visibleStudents.value.filter(student => directStudentIds.includes(student.id))
  })

  // Class assignments - students in classes where aide is assigned
  const classAssignments = computed(() => {
    const groups = {}
    const aideData = studentData.aideAssignment.value[baseView.currentUser.value?.uid]
    if (!aideData || !aideData.classAssignment) return groups

    visibleStudents.value.forEach(student => {
      const schedule = studentData.getSchedule(student)
      if (schedule) {
        Object.entries(schedule).forEach(([period, data]) => {
          // Extract teacherId from both simple and complex schedule structures
          let teacherId
          if (typeof data === 'string') {
            teacherId = data
          } else if (data && typeof data === 'object') {
            teacherId = data.teacherId
          } else {
            return
          }

          const aideTeacherIds = aideData.classAssignment[period]
          if (aideTeacherIds) {
            const teacherIdArray = Array.isArray(aideTeacherIds) ? aideTeacherIds : [aideTeacherIds]
            if (teacherIdArray.includes(teacherId)) {
              if (!groups[period]) {
                groups[period] = {
                  teacher: studentData.getUserName(teacherId),
                  students: []
                }
              }
              groups[period].students.push(student)
            }
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

  // Paraeducator-specific filtering
  const filterByAssignmentType = (type) => {
    filterData.currentFilters.assignmentType = type // 'direct' or 'class'
    filterData.applyFilters()
  }

  const filterByPeriod = (period) => {
    filterData.currentFilters.period = period
    filterData.applyFilters()
  }

  const filterByTeacher = (teacherId) => {
    filterData.currentFilters.teacher = teacherId
    filterData.applyFilters()
  }

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
    filterByAssignmentType,
    filterByPeriod,
    filterByTeacher,
    canViewAccommodations,
    canViewBasicInfo,
    canViewServiceProviders,
    canViewDates,
    canEditStudents
  }
} 