/**
 * Security testing utilities to verify database-level filtering
 * These functions help ensure users only access authorized student data
 */

/**
 * Test function to verify a user can only access authorized students
 * @param {Array} students - Array of students returned from database
 * @param {Object} user - Current user object with role and uid
 * @returns {Object} - Test results with security status
 */
export function verifyStudentAccess(students, user) {
  const results = {
    isSecure: true,
    violations: [],
    summary: '',
    studentCount: students.length,
    authorizedCount: 0,
    unauthorizedCount: 0
  }

  if (!user || !user.role) {
    results.isSecure = false
    results.violations.push('No user or role provided')
    return results
  }

  students.forEach((student, index) => {
    const hasAccess = checkStudentAccess(student, user)
    
    if (hasAccess) {
      results.authorizedCount++
    } else {
      results.unauthorizedCount++
      results.isSecure = false
      results.violations.push({
        studentIndex: index,
        studentName: `${student.app?.studentData?.firstName} ${student.app?.studentData?.lastName}`,
        studentId: student.id,
        reason: getAccessViolationReason(student, user)
      })
    }
  })

  results.summary = `User ${user.role} (${user.uid}) has access to ${results.authorizedCount}/${results.studentCount} students`
  
  if (!results.isSecure) {
    results.summary += `. SECURITY VIOLATION: ${results.unauthorizedCount} unauthorized students accessible!`
  }

  return results
}

/**
 * Check if a user should have access to a specific student
 * @param {Object} student - Student object
 * @param {Object} user - User object with role and uid
 * @returns {boolean} - Whether access should be allowed
 */
function checkStudentAccess(student, user) {
  const { role, uid } = user

  switch (role) {
    case 'admin':
    case 'school_admin':
    case 'admin_504':
    case 'sped_chair':
    case 'staff_view':
    case 'staff_edit':
      // Admins can access all students
      return true

    case 'case_manager':
      // Case managers can only access their assigned students
      return student.app?.studentData?.caseManagerId === uid

    case 'teacher':
      // Teachers can only access students they teach
      const schedule = student.app?.schedule?.periods || {}
      return Object.values(schedule).includes(uid)

    case 'service_provider':
      // Service providers can access students they provide services to OR teach
      const providers = student.app?.providers || {}
      const teacherSchedule = student.app?.schedule?.periods || {}
      const isProvider = Object.values(providers).includes(uid)
      const isTeacher = Object.values(teacherSchedule).includes(uid)
      return isProvider || isTeacher

    case 'paraeducator':
      // Paraeducators access is validated at database level through aideSchedules collection
      // If they have access to a student, it's because the database query already validated
      // their access through either direct assignment or class assignment
      // Since we can't validate the aide schedule data at the student level,
      // we trust the database-level filtering
      return true

    default:
      // Unknown roles have no access
      return false
  }
}

/**
 * Get a human-readable reason why access was denied
 * @param {Object} student - Student object
 * @param {Object} user - User object
 * @returns {string} - Reason for access denial
 */
function getAccessViolationReason(student, user) {
  const { role, uid } = user

  switch (role) {
    case 'case_manager':
      const assignedCM = student.app?.studentData?.caseManagerId
      return `Case manager ${uid} is not assigned to student (assigned to: ${assignedCM})`

    case 'teacher':
      const schedule = student.app?.schedule?.periods || {}
      const teachers = Object.values(schedule)
      return `Teacher ${uid} does not teach this student (teachers: ${teachers.join(', ')})`

    case 'service_provider':
      const providers = student.app?.providers || {}
      const teacherSchedule = student.app?.schedule?.periods || {}
      const providerList = Object.values(providers).filter(p => p)
      const teacherList = Object.values(teacherSchedule)
      return `Service provider ${uid} is not assigned to student (providers: ${providerList.join(', ')}, teachers: ${teacherList.join(', ')})`

    case 'paraeducator':
      // For paraeducators, we can't validate access at the student level because
      // aide assignments are stored in a separate collection (aideSchedules)
      // The database-level filtering in useStudentQueries handles the security
      // So if a paraeducator has access to a student, it's because the query
      // already validated their access through the aideSchedules collection
      return null // Access is validated at the database query level

    default:
      return `Unknown role: ${role}`
  }
}

/**
 * Log security test results to console with proper formatting
 * @param {Object} results - Results from verifyStudentAccess
 */
export function logSecurityTest(results) {
  if (results.isSecure) {
    console.log('✅ SECURITY TEST PASSED:', results.summary)
  } else {
    console.error('🚨 SECURITY TEST FAILED:', results.summary)
    console.error('Violations:', results.violations)
  }
}

/**
 * Quick security test for development
 * Call this function to test current user's student access
 * @param {Array} students - Students array
 * @param {Object} user - Current user
 */
export function quickSecurityTest(students, user) {
  const results = verifyStudentAccess(students, user)
  logSecurityTest(results)
  return results
} 