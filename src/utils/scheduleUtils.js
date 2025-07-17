/**
 * Schedule utilities for handling both legacy (string) and enhanced (object) period formats
 * Maintains backward compatibility while enabling co-teaching features
 */

import { ref, watch } from 'vue'

// Debug helper to trace schedule operations
const debugSchedule = (operation, data) => {
  console.log(`🔍 DEBUG: Schedule Operation - ${operation}:`, data)
}

/**
 * Get teacher ID from a period, handling both string and object formats
 * @param {string|object} periodData - Period data (either "teacherId" or {teacherId, coTeachingCaseManager})
 * @returns {string} - Teacher ID or empty string
 */
export function getTeacherIdFromPeriod(periodData) {
  debugSchedule('getTeacherIdFromPeriod', { periodData, type: typeof periodData })
  
  if (!periodData) return null
  if (typeof periodData === 'string') return periodData
  return periodData.teacherId || null
}

/**
 * Get co-teaching case manager ID from a period
 * @param {string|object} periodData - Period data
 * @returns {string} - Case manager ID or empty string
 */
export function getCoTeachingCaseManagerFromPeriod(periodData) {
  debugSchedule('getCoTeachingCaseManagerFromPeriod', { periodData })
  
  if (!periodData || typeof periodData !== 'object') return null
  return periodData.coTeaching?.caseManagerId || null
}

/**
 * Get subject from a period (if available)
 * @param {string|object} periodData - Period data
 * @returns {string} - Subject or empty string
 */
export function getSubjectFromPeriod(periodData) {
  debugSchedule('getSubjectFromPeriod', { periodData })
  
  if (!periodData || typeof periodData !== 'object') return null
  return periodData.coTeaching?.subject || null
}

/**
 * Check if a period has co-teaching
 * @param {string|object} periodData - Period data
 * @returns {boolean} - True if period has co-teaching case manager
 */
export function hasCoTeaching(periodData) {
  debugSchedule('hasCoTeaching check', { periodData })
  
  if (!periodData || typeof periodData !== 'object') return false
  return !!periodData.coTeaching?.caseManagerId
}

/**
 * Create or update a period with co-teaching case manager
 * @param {string|object} existingPeriodData - Current period data
 * @param {string} teacherId - Teacher ID
 * @param {string} coTeachingCaseManager - Case manager ID (optional)
 * @param {string} subject - Subject name (optional)
 * @returns {string|object} - Updated period data
 */
export function createPeriodData(teacherId, coTeachingData = null) {
  debugSchedule('createPeriodData', { teacherId, coTeachingData })
  
  if (!coTeachingData) {
    return teacherId
  }
  
  return {
    teacherId,
    coTeaching: {
      caseManagerId: coTeachingData.caseManagerId || '',
      subject: coTeachingData.subject || ''
    }
  }
}

/**
 * Get all teacher IDs from a student's schedule (including co-teaching case managers who are also teachers)
 * @param {object} schedule - Student schedule object
 * @param {object} userMap - Map of user IDs to user objects
 * @returns {string[]} - Array of unique teacher IDs
 */
export function getAllTeacherIdsFromSchedule(schedule, userMap = {}) {
  if (!schedule || !schedule.periods) return []
  
  const teacherIds = new Set()
  
  Object.values(schedule.periods).forEach(periodData => {
    // Add main teacher
    const teacherId = getTeacherIdFromPeriod(periodData)
    if (teacherId) {
      teacherIds.add(teacherId)
    }
    
    // Add co-teaching case manager if they are also a teacher
    const coTeachingCM = getCoTeachingCaseManagerFromPeriod(periodData)
    if (coTeachingCM) {
      const user = userMap[coTeachingCM]
      // Check if case manager also has teacher role
      if (user && (user.role === 'teacher' || (user.roles && user.roles.includes('teacher')))) {
        teacherIds.add(coTeachingCM)
      }
    }
  })
  
  return Array.from(teacherIds)
}

/**
 * Get all co-teaching case managers from a student's schedule
 * @param {object} schedule - Student schedule object
 * @returns {string[]} - Array of unique case manager IDs
 */
export function getCoTeachingCaseManagersFromSchedule(schedule) {
  if (!schedule || !schedule.periods) return []
  
  const caseManagerIds = new Set()
  
  Object.values(schedule.periods).forEach(periodData => {
    const coTeachingCM = getCoTeachingCaseManagerFromPeriod(periodData)
    if (coTeachingCM) {
      caseManagerIds.add(coTeachingCM)
    }
  })
  
  return Array.from(caseManagerIds)
}

/**
 * Check if a user is a co-teaching case manager for a student
 * @param {object} student - Student object
 * @param {string} userId - User ID to check
 * @returns {boolean} - True if user is a co-teaching case manager for this student
 */
export function isCoTeachingCaseManager(student, userId) {
  if (!student.app?.schedule?.periods || !userId) return false
  
  return Object.values(student.app.schedule.periods).some(periodData => {
    return getCoTeachingCaseManagerFromPeriod(periodData) === userId
  })
}

/**
 * Get periods where a user is the co-teaching case manager
 * @param {object} student - Student object
 * @param {string} userId - User ID to check
 * @returns {string[]} - Array of period numbers
 */
export function getCoTeachingPeriodsForUser(student, userId) {
  if (!student.app?.schedule?.periods || !userId) return []
  
  const periods = []
  Object.entries(student.app.schedule.periods).forEach(([period, periodData]) => {
    if (getCoTeachingCaseManagerFromPeriod(periodData) === userId) {
      periods.push(period)
    }
  })
  
  return periods
}

/**
 * Convert legacy schedule format to ensure consistency
 * @param {object} schedule - Schedule object that might have mixed formats
 * @returns {object} - Normalized schedule object
 */
export function normalizeSchedule(schedule) {
  if (!schedule || !schedule.periods) return schedule
  
  const normalizedPeriods = {}
  Object.entries(schedule.periods).forEach(([period, periodData]) => {
    normalizedPeriods[period] = periodData // Keep as-is for backward compatibility
  })
  
  return {
    ...schedule,
    periods: normalizedPeriods
  }
} 

/**
 * Normalize the keys of a schedule.periods object to match the display labels
 * defined in app settings. This prevents duplicate keys like "P1" + "Per1".
 *
 * @param {object} periodsObj  Original periods object {P1: 't1', 1: 't1', Per1: 't1', ...}
 * @param {string[]} periodLabels Array of display labels from app settings (index 0 -> period 1)
 * @returns {object} New object whose keys exactly equal the entries in periodLabels
 */
export function normalizeScheduleKeys(schedule, periodLabels) {
  debugSchedule('normalizeScheduleKeys input', {
    schedule,
    periodLabels,
    scheduleType: typeof schedule,
    isObject: schedule instanceof Object
  })

  if (!schedule || typeof schedule !== 'object') {
    debugSchedule('normalizeScheduleKeys - invalid input', { schedule })
    return {}
  }

  // Map of common period formats to normalized format
  const periodFormats = {
    numeric: /^[0-9]+$/,
    pPrefix: /^[Pp][0-9]+$/,
    perPrefix: /^[Pp]er[0-9]+$/,
    periodPrefix: /^[Pp]eriod\s*[0-9]+$/
  }

  const normalizedSchedule = {}
  
  // Debug the normalization process
  debugSchedule('Starting normalization', {
    originalKeys: Object.keys(schedule),
    periodFormats: Object.keys(periodFormats)
  })

  Object.entries(schedule).forEach(([key, value]) => {
    debugSchedule('Processing period', { key, value, valueType: typeof value })

    // Extract the numeric part
    let periodNumber = null
    
    // Try to match against each format
    for (const [format, regex] of Object.entries(periodFormats)) {
      if (regex.test(key)) {
        periodNumber = key.match(/\d+/)[0]
        debugSchedule('Format matched', { key, format, periodNumber })
        break
      }
    }

    if (periodNumber) {
      // Find the corresponding label from settings
      const normalizedKey = periodLabels[parseInt(periodNumber) - 1] || `Period ${periodNumber}`
      debugSchedule('Key normalization', {
        original: key,
        normalized: normalizedKey,
        value
      })
      
      normalizedSchedule[normalizedKey] = value
    } else {
      // If no format matches, keep the original key
      debugSchedule('No format match - keeping original', { key })
      normalizedSchedule[key] = value
    }
  })

  debugSchedule('Normalization complete', {
    input: schedule,
    output: normalizedSchedule
  })

  return normalizedSchedule
} 