import { computed } from 'vue'
import { useBaseRoleView } from './useBaseRoleView'
import { initDebugSummary, setAccessibleStudents, setProviderView, printDebugSummary } from '@/utils/debugSummary'

export function useCaseManagerView(studentData, filterData) {
  const baseView = useBaseRoleView(studentData, filterData)
  const currentUserId = computed(() => baseView.currentUser.value?.uid)

  // Initialize debug tracking
  if (currentUserId.value) {
    initDebugSummary(currentUserId.value, 'case_manager')
  }

  // Override visible students to show students based on provider view filter
  const visibleStudents = computed(() => {
    if (!currentUserId.value) return []
    
    // Get base filtered students
    const baseStudents = baseView.visibleStudents.value
    
    console.log('🔵 CM visibleStudents: Starting with', baseStudents.length, 'base students')
    
    // First, get all students this case manager has access to
    const allAccessibleStudents = baseStudents.filter(student => {
      const isCaseManager = studentData.getCaseManagerId(student) === currentUserId.value
      const schedule = studentData.getSchedule(student) || {}
      
      console.log(`🔍 Checking student ${student.app?.studentData?.firstName}: schedule keys:`, Object.keys(schedule))
      
      // Check if user teaches any of the student's classes (simple check)
      const isTeacher = schedule ? Object.values(schedule).some(periodData => {
        if (typeof periodData === 'string') {
          return periodData === currentUserId.value
        } else if (periodData && typeof periodData === 'object') {
          // Log the first few to see structure
          if (Math.random() < 0.1) { // Log 10% to avoid spam
            console.log('📚 Schedule period data:', periodData)
          }
          return periodData.teacherId === currentUserId.value || 
                 periodData.coTeaching?.caseManagerId === currentUserId.value
        }
        return false
      }) : false
      
      if (isTeacher || isCaseManager) {
        console.log(`✅ User has access to ${student.app?.studentData?.firstName}: CM=${isCaseManager}, Teacher=${isTeacher}`)
      }
      
      // Show students where user is either CM or teaches
      return isCaseManager || isTeacher
    })
    
    console.log('🔵 CM visibleStudents: Accessible students:', allAccessibleStudents.length)
    
    // Track accessible students
    setAccessibleStudents(allAccessibleStudents.length, 
      allAccessibleStudents.map(s => `${s.app?.studentData?.firstName} ${s.app?.studentData?.lastName}`)
    )
    
    // Apply provider view filtering
    const providerView = filterData.currentFilters.providerView
    
    console.log('🔵 CM visibleStudents: Provider view:', providerView)
    
    let filteredStudents
    
    if (providerView === 'case_manager') {
      // Show only students where user is the case manager
      filteredStudents = allAccessibleStudents.filter(student => {
        return studentData.getCaseManagerId(student) === currentUserId.value
      })
    } else if (providerView === 'service_provider') {
      // Show students where user teaches (provides services)
      filteredStudents = allAccessibleStudents.filter(student => {
        const schedule = studentData.getSchedule(student) || {}
        
        // Check if user teaches this student (same logic as above)
        const isTeacher = schedule ? Object.values(schedule).some(periodData => {
          if (typeof periodData === 'string') {
            return periodData === currentUserId.value
          } else if (periodData && typeof periodData === 'object') {
            return periodData.teacherId === currentUserId.value || 
                   periodData.coTeaching?.caseManagerId === currentUserId.value
          }
          return false
        }) : false
        
        if (isTeacher) {
          console.log(`✅ SP mode: User teaches ${student.app?.studentData?.firstName}`)
        }
        
        // Return students where user teaches
        return isTeacher
      })
    } else {
      // 'all' - show both CM and SP students
      filteredStudents = allAccessibleStudents
    }
    
    console.log('🟢 CM visibleStudents: Final count:', filteredStudents.length)
    console.log('🟢 CM visibleStudents: Student names:', filteredStudents.map(s => 
      `${s.app?.studentData?.firstName} ${s.app?.studentData?.lastName}`
    ).slice(0, 5), '...')
    
    // Track provider view results
    setProviderView(providerView, filteredStudents.length,
      filteredStudents.map(s => `${s.app?.studentData?.firstName} ${s.app?.studentData?.lastName}`)
    )
    
    // Print debug summary
    printDebugSummary()
    
    return filteredStudents
  })

  // Group students by period for class view
  const studentsByPeriod = computed(() => {
    if (!currentUserId.value) return {}
    return baseView.groupStudentsByPeriod(visibleStudents.value, currentUserId.value)
  })

  // Students where case manager is the primary case manager
  const managedStudents = computed(() => {
    if (!currentUserId.value) return []
    return baseView.getProviderViewStudents(visibleStudents.value, currentUserId.value, 'case_manager')
  })

  // Students where case manager provides services but is not primary case manager
  const serviceStudents = computed(() => {
    if (!currentUserId.value) return []
    return baseView.getProviderViewStudents(visibleStudents.value, currentUserId.value, 'service_provider')
      .filter(student => studentData.getCaseManagerId(student) !== currentUserId.value)
  })

  // Group students by their services
  const groupStudentsByService = computed(() => {
    const groups = {
      instruction: [],
      assessment: [],
      speech: [],
      ot: [],
      mh: []
    }

    visibleStudents.value.forEach(student => {
      // Add to accommodations groups
      if (student.app?.accommodations?.instruction) {
        groups.instruction.push(student)
      }
      if (student.app?.accommodations?.assessment) {
        groups.assessment.push(student)
      }

      // Add to service provider groups
      const providers = student.app?.providers || {}
      if (providers.speechId) groups.speech.push(student)
      if (providers.otId) groups.ot.push(student)
      if (providers.mhId) groups.mh.push(student)
    })

    return groups
  })

  // Group students by upcoming dates
  const groupStudentsByUpcomingDates = computed(() => {
    const now = new Date()
    const thirtyDays = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds

    const groups = {
      reviewDue: [],
      reevalDue: [],
      meetingScheduled: []
    }

    visibleStudents.value.forEach(student => {
      const reviewDate = new Date(student.app?.dates?.reviewDate)
      const reevalDate = new Date(student.app?.dates?.reevalDate)
      const meetingDate = new Date(student.app?.dates?.meetingDate)

      if (reviewDate && reviewDate - now < thirtyDays) {
        groups.reviewDue.push(student)
      }
      if (reevalDate && reevalDate - now < thirtyDays) {
        groups.reevalDue.push(student)
      }
      if (meetingDate && meetingDate - now < thirtyDays) {
        groups.meetingScheduled.push(student)
      }
    })

    return groups
  })

  // Override view mode: ensure class view uses service_provider filter
  const setViewMode = (mode) => {
    // If user selects class view, switch to service provider mode
    if (mode === 'class') {
      filterData.currentFilters.providerView = 'service_provider'
    }
    // Set the view mode and reapply filters
    filterData.currentFilters.viewMode = mode
    filterData.applyFilters()
  }

  return {
    ...baseView,
    // Override specific properties
    visibleStudents,
    studentsByPeriod,
    managedStudents,
    serviceStudents,
    groupStudentsByService,
    groupStudentsByUpcomingDates,
    setViewMode, // use our override
    showProviderView: true,
    // Provider view options for case managers
    providerViewOptions: computed(() => [
      { value: 'all', label: 'All' },
      { value: 'case_manager', label: 'CM' },
      { value: 'service_provider', label: 'SP' }
    ])
  }
} 