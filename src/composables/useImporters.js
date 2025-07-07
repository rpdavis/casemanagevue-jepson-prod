import { getFirestore, doc, setDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore'
import Papa from 'papaparse'

// Note: You'll need to install papaparse: npm install papaparse
// import Papa from 'papaparse'

const db = getFirestore()

/**
 * Converts a field name to snake_case format
 * @param {string} fieldName - The field name to convert
 * @returns {string} - The snake_case version
 */
function toSnakeCase(fieldName) {
  return fieldName
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/\s+/g, '_')
}

/**
 * Converts a field name to camelCase format
 * @param {string} fieldName - The field name to convert
 * @returns {string} - The camelCase version
 */
function toCamelCase(fieldName) {
  return fieldName
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, match => match.toLowerCase())
}

/**
 * Maps Aeries teacher IDs to Firebase user IDs using the aeriesId field
 * @param {string} aeriesTeacherId - The Aeries teacher ID from CSV
 * @param {Object} userMap - Map of Firebase user IDs to user objects
 * @returns {string|null} - The Firebase user ID or null if not found
 */
async function mapAeriesTeacherIdToFirebaseId(aeriesTeacherId, userMap) {
  if (!aeriesTeacherId) return null
  
  // First try to find by aeriesId field
  const user = Object.values(userMap).find(u => 
    u.aeriesId === aeriesTeacherId || 
    u.aeriesId === parseInt(aeriesTeacherId) ||
    u.aeriesId?.toString() === aeriesTeacherId?.toString()
  )
  
  if (user) {
    return user.id
  }
  
  // If not found, log a warning
  console.warn(`No Firebase user found for Aeries teacher ID: ${aeriesTeacherId}`)
  return null
}

/**
 * Maps Aeries CSV field names to the structure specified in DATABASE_FIELDS.md
 * @param {string} csvFieldName - The original CSV field name
 * @returns {string} - The mapped field name for the app
 */
function mapAeriesField(csvFieldName) {
  const fieldMap = {
    // Basic student info (mapped to aeries.*)
    'sourcedId': 'stateId',
    'SSID': 'stateId',
    'StateStudentID': 'stateId',
    'StudentNumber': 'localId',
    'givenName': 'firstName',
    'FirstName': 'firstName',
    'familyName': 'lastName',
    'LastName': 'lastName',
    'middleName': 'middleName',
    'MiddleName': 'middleName',
    'email': 'email',
    'Email': 'email',
    'phone': 'phone',
    'Phone': 'phone',
    'dateOfBirth': 'birthDate',
    'DOB': 'birthDate',
    'sex': 'gender',
    'Gender': 'gender',
    'grade': 'grade',
    'Grade': 'grade',
    
    // Contact info
    'Address': 'address',
    'City': 'city',
    'State': 'state',
    'ZipCode': 'zipCode',
    'ParentName': 'parentName',
    'ParentPhone': 'parentPhone',
    'ParentEmail': 'parentEmail',
    
    // Academic info
    'AttendanceRate': 'attendanceRate',
    'attendanceRate': 'attendanceRate',
    
    // Schedule fields - these will be handled specially to create aeries.schedule.periods
    'Period1TeacherId': 'schedule.periods.1',
    'period1TeacherId': 'schedule.periods.1',
    'Period2TeacherId': 'schedule.periods.2',
    'period2TeacherId': 'schedule.periods.2',
    'Period3TeacherId': 'schedule.periods.3',
    'period3TeacherId': 'schedule.periods.3',
    'Period4TeacherId': 'schedule.periods.4',
    'period4TeacherId': 'schedule.periods.4',
    'Period5TeacherId': 'schedule.periods.5',
    'period5TeacherId': 'schedule.periods.5',
    'Period6TeacherId': 'schedule.periods.6',
    'period6TeacherId': 'schedule.periods.6',
    'Period7TeacherId': 'schedule.periods.7',
    'period7TeacherId': 'schedule.periods.7',
    'SHTeacherId': 'schedule.periods.SH',
    'shTeacherId': 'schedule.periods.SH'
  }
  
  return fieldMap[csvFieldName] || toCamelCase(csvFieldName)
}

/**
 * Maps SEIS CSV field names to app field names
 * @param {string} csvFieldName - The original CSV field name
 * @returns {string} - The mapped field name for the app
 */
function mapSeisField(csvFieldName) {
  const fieldMap = {
    'SSID': 'ssid',
    'FirstName': 'firstName',
    'LastName': 'lastName',
    'MiddleName': 'middleName',
    'Grade': 'grade',
    'DOB': 'dob',
    'Gender': 'gender',
    'Ethnicity': 'ethnicity',
    'School': 'school',
    'Address': 'address',
    'City': 'city',
    'State': 'state',
    'ZipCode': 'zipCode',
    'Phone': 'phone',
    'ParentName': 'parentName',
    'ParentPhone': 'parentPhone',
    'ParentEmail': 'parentEmail',
    'ELL': 'ell',
    '504': '504',
    'IEP': 'iep',
    'CaseManager': 'caseManager',
    'Disability': 'disability',
    'ServiceMinutes': 'serviceMinutes',
    'Goals': 'goals',
    'Notes': 'notes',
    'Plan': 'plan',
    'ReviewDate': 'reviewDate',
    'ReevalDate': 'reevalDate',
    'MeetingDate': 'meetingDate',
    'SpeechProvider': 'speechProvider',
    'MHProvider': 'mhProvider',
    'OTProvider': 'otProvider',
    'ProgramAccommodations': 'programAccommodations',
    'Accommodations': 'programAccommodations',
    'IEP_Services': 'iepServices'
  }
  
  return fieldMap[csvFieldName] || toCamelCase(csvFieldName)
}

/**
 * Parses an Aeries CSV file and ensures SSID column exists.
 * @param {File} file - CSV file selected by the user.
 * @returns {Promise<Array<Object>>} - Array of row objects.
 */
export async function parseAeriesCSVAndPreview(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data
        if (!rows || !rows.length) {
          return reject(new Error('No data rows found in the CSV.'))
        }
        // Check for SSID column (OneRoster sourcedId or legacy SSID)
        const headerKeys = Object.keys(rows[0]).map(h => h.trim().toLowerCase())
        const hasSSID = headerKeys.includes('sourcedid') || headerKeys.includes('ssid') || headerKeys.includes('statestudentid')
        if (!hasSSID) {
          return reject(new Error("Missing required 'sourcedId' or 'SSID' column."))
        }
        resolve(rows)
      },
      error: err => reject(new Error('Failed to parse CSV: ' + err.message))
    })
  })
}

/**
 * Imports selected Aeries fields into Firestore under the 'students/{ssid}/aeries' sub-object.
 * @param {Array<Object>} data - Parsed CSV rows
 * @param {Array<string>} fieldsToImport - Array of CSV header names to import
 * @returns {Promise<number>} - Count of records successfully updated
 */
export async function importFilteredAeriesRecords(data, fieldsToImport) {
  let importedCount = 0

  // Load user collection to map Aeries teacher IDs to Firebase user IDs
  const usersRef = collection(db, 'users')
  const usersSnapshot = await getDocs(usersRef)
  const userMap = {}
  usersSnapshot.forEach(doc => {
    userMap[doc.id] = { id: doc.id, ...doc.data() }
  })
  console.log(`Loaded ${Object.keys(userMap).length} users for teacher ID mapping`)

  for (const entry of data) {
    // Extract SSID (OneRoster sourcedId or legacy SSID fields)
    const ssid = (entry['sourcedId'] || entry['SSID'] || entry['ssid'] || entry['StateStudentID'] || entry['stateStudentId'])?.trim()
    if (!ssid) {
      console.warn('Skipping row with missing SSID:', entry)
      continue
    }

    // Build the nested aeries object with proper structure as specified in DATABASE_FIELDS.md
    const aeriesData = {
      firstName: '',
      lastName: '',
      grade: '',
      birthDate: '',
      gender: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      email: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      attendanceRate: '',
      schedule: {
        periods: {}
      }
    }

    // Process each field and map to proper structure
    for (const field of fieldsToImport) {
      const mappedFieldName = mapAeriesField(field)
      const rawValue = entry[field]
      const value = rawValue != null && typeof rawValue === 'string' ? rawValue.trim() : (rawValue != null ? String(rawValue) : null)

      // Handle schedule fields specially - map to aeries.schedule.periods
      if (mappedFieldName.startsWith('schedule.periods.')) {
        const period = mappedFieldName.split('.')[2] // Extract period number (1, 2, 3, etc.)
        if (value) {
          // Map Aeries teacher ID to Firebase user ID
          const firebaseUserId = await mapAeriesTeacherIdToFirebaseId(value, userMap)
          if (firebaseUserId) {
            aeriesData.schedule.periods[period] = firebaseUserId
            console.log(`Mapped Aeries teacher ID ${value} to Firebase user ID ${firebaseUserId} for period ${period}`)
          } else {
            console.warn(`Could not map Aeries teacher ID ${value} for period ${period}`)
          }
        }
      } else {
        // Handle regular fields
        aeriesData[mappedFieldName] = value
      }
    }

    // Add import timestamp
    aeriesData.lastAeriesImport = new Date().toISOString()

    // Debug: Log the final schedule structure
    console.log('Final aeriesData.schedule structure:', JSON.stringify(aeriesData.schedule, null, 2))

    try {
      // Find existing student by SSID or create new one
      const studentsRef = collection(db, 'students')
      const q = query(studentsRef, where('app.studentData.ssid', '==', ssid))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        // Update existing student
        const studentDoc = querySnapshot.docs[0]
        await setDoc(doc(db, 'students', studentDoc.id), { aeries: aeriesData }, { merge: true })
        console.log(`Updated existing student ${studentDoc.id} with Aeries data for SSID ${ssid}`)
      } else {
        // Create new student with auto-generated ID
        const newStudentRef = doc(collection(db, 'students'))
        const newStudentData = {
          app: {
            studentData: { ssid: ssid }
          },
          aeries: aeriesData,
          createdAt: serverTimestamp()
        }
        await setDoc(newStudentRef, newStudentData)
        console.log(`Created new student ${newStudentRef.id} with Aeries data for SSID ${ssid}`)
      }
      importedCount++
    } catch (error) {
      console.error(`Failed to import Aeries data for SSID ${ssid}:`, error)
    }
  }

  return importedCount
}

/**
 * Parses a SEIS CSV and verifies that it contains data and SSID field.
 */
export async function parseSeisCSVAndPreview(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data

        if (!rows || !rows.length) {
          return reject(new Error('No data rows found in the CSV.'))
        }

        const hasSSID = Object.keys(rows[0]).some(
          key => key.trim().toLowerCase() === 'ssid'
        )

        if (!hasSSID) {
          return reject(new Error("Missing required 'SSID' column."))
        }

        resolve(rows)
      },
      error: err => reject(new Error('Failed to parse CSV: ' + err.message))
    })
  })
}

/**
 * Imports only the selected fields from parsed SEIS records and syncs them to Firestore using SSID.
 */
export async function importFilteredSeisRecords(data, fieldsToImport) {
  let importedCount = 0

  for (const entry of data) {
    const ssid = entry['SSID']?.trim() || entry['ssid']?.trim()
    if (!ssid) {
      console.warn('Skipping row with missing SSID:', entry)
      continue
    }

    // Build the nested seis object
    const seisData = {}

    for (const field of fieldsToImport) {
      const mappedFieldName = mapSeisField(field)
      
      if (field === 'IEP_Services' || field === 'iep_services') {
        seisData[mappedFieldName] = entry[field]?.split(';').map(s => s.trim()) || []
      } else if (field === 'ProgramAccommodations' || field === 'Accommodations') {
        seisData[mappedFieldName] = entry[field]?.split(';').map(s => s.trim()) || []
      } else {
        seisData[mappedFieldName] = entry[field]
      }
    }

    // Add import timestamp
    seisData.lastSeisImport = new Date().toISOString()

    try {
      // Find existing student by SSID or create new one
      const studentsRef = collection(db, 'students')
      const q = query(studentsRef, where('app.studentData.ssid', '==', ssid))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        // Update existing student
        const studentDoc = querySnapshot.docs[0]
        await setDoc(doc(db, 'students', studentDoc.id), { seis: seisData }, { merge: true })
        console.log(`Updated existing student ${studentDoc.id} with SEIS data for SSID ${ssid}`)
      } else {
        // Create new student with auto-generated ID
        const newStudentRef = doc(collection(db, 'students'))
        const newStudentData = {
          app: {
            studentData: { ssid: ssid }
          },
          seis: seisData,
          createdAt: serverTimestamp()
        }
        await setDoc(newStudentRef, newStudentData)
        console.log(`Created new student ${newStudentRef.id} with SEIS data for SSID ${ssid}`)
      }
      importedCount++
    } catch (error) {
      console.error(`Failed to import SEIS data for SSID ${ssid}:`, error)
    }
  }

  return importedCount
}

// Export mapping functions for testing
export { mapAeriesField, mapSeisField } 