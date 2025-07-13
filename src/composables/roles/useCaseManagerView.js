import { computed, ref } from 'vue'
import { useBaseRoleView } from './useBaseRoleView'

export function useCaseManagerView(studentData, filterData) {
  const baseView = useBaseRoleView(studentData, filterData)

  // Override visible students to show students based on provider view filter
  const visibleStudents = computed(() => {
    // First, get all students this case manager has access to
    const allAccessibleStudents = baseView.visibleStudents.value.filter(student => {
      const caseManagerId = studentData.getCaseManagerId(student)
      const currentUserId = baseView.currentUser.value?.uid
      const schedule = studentData.getSchedule(student)
      
      // Check if user is the case manager
      const isCaseManager = caseManagerId === currentUserId
      
      // Check if user teaches any of the student's classes
      const isTeacher = schedule ? Object.values(schedule).includes(currentUserId) : false
      
      // Check if user provides any services
      const providers = student.app?.providers || {}
      const isProvider = Object.values(providers).includes(currentUserId)
      
      // Show students where user is either CM or provides services
      return isCaseManager || isTeacher || isProvider
    })
    
    // Apply provider view filtering
    const providerView = filterData.currentFilters.providerView
    const viewMode = filterData.currentFilters.viewMode
    
    // CLASS VIEW LOGIC: Force service provider filtering and auto-switch view modes
    if (viewMode === 'class') {
      // In class view, only show students where user is a service provider (teaches)
      const serviceProviderStudents = allAccessibleStudents.filter(student => {
        const currentUserId = baseView.currentUser.value?.uid
        const schedule = studentData.getSchedule(student)
        
        const isTeacher = schedule ? Object.values(schedule).includes(currentUserId) : false
        const providers = student.app?.providers || {}
        const isProvider = Object.values(providers).includes(currentUserId)
        
        // Return students where user teaches or provides services (regardless of CM status)
        return isTeacher || isProvider
      })
      
      // Auto-set provider view to SP when in class view
      if (providerView !== 'service_provider') {
        filterData.currentFilters.providerView = 'service_provider'
      }
      
      console.log('🔍 Case Manager Class View Results:', {
        providerView: 'service_provider (auto-set)',
        viewMode: viewMode,
        totalAccessible: allAccessibleStudents.length,
        finalVisible: serviceProviderStudents.length,
        studentNames: serviceProviderStudents.map(s => `${s.app?.studentData?.firstName} ${s.app?.studentData?.lastName}`)
      })
      
      return serviceProviderStudents
    }
    
    // LIST VIEW LOGIC: Auto-switch to list view if All or CM is selected
    if ((providerView === 'all' || providerView === 'case_manager') && viewMode === 'class') {
      // Auto-switch back to list view when All or CM is selected
      filterData.currentFilters.viewMode = 'list'
    }
    
    // Apply normal provider view filtering for list view
    let filteredStudents
    
    if (providerView === 'case_manager') {
      // Show only students where user is the case manager
      filteredStudents = allAccessibleStudents.filter(student => {
        const caseManagerId = studentData.getCaseManagerId(student)
        return caseManagerId === baseView.currentUser.value?.uid
      })
    } else if (providerView === 'service_provider') {
      // Show students where user teaches (provides services) - INCLUDES students they both teach AND case manage
      filteredStudents = allAccessibleStudents.filter(student => {
        const currentUserId = baseView.currentUser.value?.uid
        const schedule = studentData.getSchedule(student)
        
        const isTeacher = schedule ? Object.values(schedule).includes(currentUserId) : false
        const providers = student.app?.providers || {}
        const isProvider = Object.values(providers).includes(currentUserId)
        
        // Return students where user teaches or provides services (regardless of CM status)
        return isTeacher || isProvider
      })
    } else {
      // 'all' - show both CM and SP students
      filteredStudents = allAccessibleStudents
    }
    
    // Final debug log to show what's actually being returned
    console.log('🔍 Case Manager Final Results:', {
      providerView: providerView,
      viewMode: viewMode,
      totalAccessible: allAccessibleStudents.length,
      finalVisible: filteredStudents.length,
      studentNames: filteredStudents.map(s => `${s.app?.studentData?.firstName} ${s.app?.studentData?.lastName}`)
    })
    
    return filteredStudents
  })

  // Case manager specific view modes
  const viewMode = ref('all') // 'all', 'case_manager', 'service_provider'

  // Students where case manager is the primary case manager
  const managedStudents = computed(() => {
    return visibleStudents.value.filter(student => {
      const caseManagerId = studentData.getCaseManagerId(student)
      return caseManagerId === baseView.currentUser.value?.uid
    })
  })

  // Students where case manager provides services but is not primary case manager
  const serviceStudents = computed(() => {
    return visibleStudents.value.filter(student => {
      const caseManagerId = studentData.getCaseManagerId(student)
      const currentUserId = baseView.currentUser.value?.uid
      const schedule = studentData.getSchedule(student)
      
      // Check if case manager teaches any of the student's classes
      const isTeacher = schedule ? Object.values(schedule).includes(currentUserId) : false
      
      // Check if case manager provides any services
      const providers = student.app?.providers || {}
      const isProvider = Object.values(providers).includes(currentUserId)
      
      // Return students where user provides services but is NOT the case manager
      return (isTeacher || isProvider) && caseManagerId !== currentUserId
    })
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

  // Case manager specific filtering
  const setViewMode = (mode) => {
    viewMode.value = mode
    filterData.currentFilters.providerView = mode
    filterData.applyFilters()
  }

  const filterByService = (service) => {
    filterData.currentFilters.service = service
    filterData.applyFilters()
  }

  const filterByDateType = (dateType) => {
    filterData.currentFilters.dateType = dateType
    filterData.applyFilters()
  }

  return {
    ...baseView,
    // Override specific properties
    visibleStudents,
    showProviderView: true,
    // Provider view options for case managers
    providerViewOptions: computed(() => [
      { value: 'all', label: 'All' },
      { value: 'case_manager', label: 'CM' },
      { value: 'service_provider', label: 'SP' }
    ])
  }
} 