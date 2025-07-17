/**
 * Debug summary utility to track student filtering flow
 */

let debugData = {}

export function initDebugSummary(userId, userRole) {
  debugData = {
    userId,
    userRole,
    databaseStudents: 0,
    accessibleStudents: 0,
    providerView: '',
    providerViewStudents: 0,
    classViewPeriods: {},
    timestamp: new Date().toISOString()
  }
}

export function setDatabaseStudents(count, details = {}) {
  debugData.databaseStudents = count
  debugData.databaseDetails = details
}

export function setAccessibleStudents(count, names = []) {
  debugData.accessibleStudents = count
  debugData.accessibleNames = names.slice(0, 5) // First 5 names
}

export function setProviderView(view, count, names = []) {
  debugData.providerView = view
  debugData.providerViewStudents = count
  debugData.providerViewNames = names.slice(0, 5)
}

export function setClassViewPeriods(periods) {
  debugData.classViewPeriods = Object.entries(periods).reduce((acc, [period, students]) => {
    acc[period] = students.length
    return acc
  }, {})
}

export function printDebugSummary() {
  console.log('🎯 === DEBUG SUMMARY ===')
  console.log(`User: ${debugData.userId} (${debugData.userRole})`)
  console.log(`Database returned: ${debugData.databaseStudents} students`)
  if (debugData.databaseDetails) {
    console.log(`  - Case managing: ${debugData.databaseDetails.caseManaging || 0}`)
    console.log(`  - Teaching: ${debugData.databaseDetails.teaching || 0}`)
  }
  console.log(`Accessible after role filter: ${debugData.accessibleStudents} students`)
  console.log(`Provider view "${debugData.providerView}": ${debugData.providerViewStudents} students`)
  if (debugData.classViewPeriods && Object.keys(debugData.classViewPeriods).length > 0) {
    console.log('Class view periods:', debugData.classViewPeriods)
  }
  console.log('🎯 === END SUMMARY ===')
}

export function getDebugData() {
  return { ...debugData }
} 