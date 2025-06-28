import { getFirestore, doc, setDoc } from 'firebase/firestore'
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
 * Maps Aeries CSV field names to the specified database structure
 * @param {string} csvFieldName - The original CSV field name
 * @returns {string} - The mapped field name for the app
 */
function mapAeriesField(csvFieldName) {
  const fieldMap = {
    // Core student fields
    'SSID': 'stateId',
    'StudentNumber': 'localId',
    'FirstName': 'firstName',
    'LastName': 'lastName',
    'Grade': 'grade',
    'SchoolCode': 'schoolCode',
    'SchoolName': 'schoolName',
    
    // Program flags
    'IEP': 'programs.specialEducation',
    '504': 'programs.plan504',
    'ELL': 'programs.ell',
    
    // Medical information
    'MedicalNotes': 'medical.notes',
    'Vision': 'medical.vision',
    'Hearing': 'medical.hearing',
    
    // Test scores
    'CAASPP': 'testScores.CAASPP',
    'ELPAC': 'testScores.ELPAC',
    
    // Dates
    'ReviewDate': 'reviewDate',
    'ReevalDate': 'reevalDate',
    'MeetingDate': 'meetingDate',
    
    // Accommodations
    'InstructionAccommodations': 'instruction',
    'AssessmentAccommodations': 'assessment',
    
    // Other fields
    'DOB': 'dob',
    'Gender': 'gender',
    'Ethnicity': 'ethnicity',
    'Address': 'address',
    'City': 'city',
    'State': 'state',
    'ZipCode': 'zipCode',
    'Phone': 'phone',
    'ParentName': 'parentName',
    'ParentPhone': 'parentPhone',
    'ParentEmail': 'parentEmail',
    'CaseManager': 'caseManager',
    'Disability': 'disability',
    'ServiceMinutes': 'serviceMinutes',
    'Goals': 'goals',
    'Notes': 'notes',
    'Plan': 'plan',
    'SpeechProvider': 'speechProvider',
    'MHProvider': 'mhProvider',
    'OTProvider': 'otProvider',
    'Flag1': 'flag1',
    'Flag2': 'flag2'
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
    'FirstName': 'first_name',
    'LastName': 'last_name',
    'MiddleName': 'middle_name',
    'Grade': 'grade',
    'DOB': 'dob',
    'Gender': 'gender',
    'Ethnicity': 'ethnicity',
    'School': 'school',
    'Address': 'address',
    'City': 'city',
    'State': 'state',
    'ZipCode': 'zip_code',
    'Phone': 'phone',
    'ParentName': 'parent_name',
    'ParentPhone': 'parent_phone',
    'ParentEmail': 'parent_email',
    'ELL': 'ell',
    '504': '504',
    'IEP': 'iep',
    'CaseManager': 'case_manager',
    'Disability': 'disability',
    'ServiceMinutes': 'service_minutes',
    'Goals': 'goals',
    'Notes': 'notes',
    'Plan': 'plan',
    'ReviewDate': 'review_date',
    'ReevalDate': 'reeval_date',
    'MeetingDate': 'meeting_date',
    'SpeechProvider': 'speech_provider',
    'MHProvider': 'mh_provider',
    'OTProvider': 'ot_provider',
    'InstructionAccommodations': 'instruction',
    'AssessmentAccommodations': 'assessment',
    'Flag1': 'flag1',
    'Flag2': 'flag2',
    'IEP_Services': 'iep_services'
  }
  
  return fieldMap[csvFieldName] || toSnakeCase(csvFieldName)
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
        // Check for SSID column (case-insensitive)
        const headerKeys = Object.keys(rows[0]).map(h => h.trim().toLowerCase())
        const hasSSID = headerKeys.includes('ssid') || headerKeys.includes('statestudentid')
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
 * Imports selected Aeries fields into Firestore under the 'students/{ssid}/aeries' sub-object.
 * @param {Array<Object>} data - Parsed CSV rows
 * @param {Array<string>} fieldsToImport - Array of CSV header names to import
 * @returns {Promise<number>} - Count of records successfully updated
 */
export async function importFilteredAeriesRecords(data, fieldsToImport) {
  let importedCount = 0

  for (const entry of data) {
    // Extract SSID (case-insensitive keys)
    const ssid = (entry['SSID'] || entry['ssid'] || entry['StateStudentID'] || entry['stateStudentId'])?.trim()
    if (!ssid) {
      console.warn('Skipping row with missing SSID:', entry)
      continue
    }

    // Build the nested aeries object with proper structure
    const aeriesData = {
      studentId: parseInt(ssid) || ssid,
      stateId: ssid,
      localId: entry['StudentNumber'] || ssid,
      programs: {},
      medical: {},
      testScores: {}
    }

    // Process each field and map to proper structure
    for (const field of fieldsToImport) {
      const mappedFieldName = mapAeriesField(field)
      const value = entry[field] != null ? entry[field].trim() : null

      // Handle nested objects
      if (mappedFieldName.includes('.')) {
        const [parent, child] = mappedFieldName.split('.')
        if (!aeriesData[parent]) {
          aeriesData[parent] = {}
        }
        
        // Convert string values to appropriate types for program flags
        if (parent === 'programs') {
          aeriesData[parent][child] = value === 'Yes' || value === 'true' || value === '1'
        } else {
          aeriesData[parent][child] = value
        }
      } else {
        aeriesData[mappedFieldName] = value
      }
    }

    // Add import timestamp
    aeriesData.lastAeriesImport = new Date().toISOString()

    try {
      // Merge into 'aeries' subfield
      const studentRef = doc(db, 'students', ssid)
      await setDoc(studentRef, { aeries: aeriesData }, { merge: true })
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

    const record = {}

    for (const field of fieldsToImport) {
      const mappedFieldName = mapSeisField(field)
      
      if (field === 'IEP_Services' || field === 'iep_services') {
        record[mappedFieldName] = entry[field]?.split(';').map(s => s.trim()) || []
      } else {
        record[mappedFieldName] = entry[field]
      }
    }

    record.last_imported = new Date().toISOString()

    try {
      const studentRef = doc(db, 'students', ssid)
      await setDoc(studentRef, record, { merge: true })
      importedCount++
    } catch (error) {
      console.error(`Failed to import SSID ${ssid}:`, error)
    }
  }

  return importedCount
} 