import { ref, watch } from 'vue'
import { getAuth } from 'firebase/auth'

// Google Sheets API configuration
const SPREADSHEET_ID_KEY = 'casemanage_linked_sheet_id'
const SHEET_NAME = 'Student Data'

export function useGoogleSheetsRealtime() {
  const isInitialized = ref(false)
  const linkedSheetId = ref(localStorage.getItem(SPREADSHEET_ID_KEY) || '')
  const linkedSheetUrl = ref('')
  const lastSyncTime = ref(null)
  const syncStatus = ref('idle') // idle, syncing, success, error
  const syncMessage = ref('')
  
  // Google Sign-In configuration
  const tokenClient = ref(null)
  const accessToken = ref('')
  let tokenResolve = null // Store the resolve function for the token promise
  
  // Initialize Google Identity Services (new OAuth approach)
  const initializeGoogleAuth = () => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.google?.accounts?.oauth2 && window.gapi?.client) {
        resolve()
        return
      }
      
      // Load the Google Identity Services library
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.onload = () => {
        // Initialize the token client
        tokenClient.value = window.google.accounts.oauth2.initTokenClient({
          client_id: '756483333257-kh1cv865e0buv0cv9g0v1h7ghq7s0e70.apps.googleusercontent.com',
          scope: 'https://www.googleapis.com/auth/spreadsheets',
          callback: (response) => {
            if (response.access_token) {
              accessToken.value = response.access_token
              isInitialized.value = true
              // Set the token for gapi client
              window.gapi.client.setToken({ access_token: response.access_token })
              // Resolve the token promise if it exists
              if (tokenResolve) {
                tokenResolve(response)
                tokenResolve = null
              }
            } else {
              console.error('Failed to get access token')
              if (tokenResolve) {
                tokenResolve(null)
                tokenResolve = null
              }
            }
          },
        })
        
        // Load Google API client library
        const gapiScript = document.createElement('script')
        gapiScript.src = 'https://apis.google.com/js/api.js'
        gapiScript.onload = () => {
          window.gapi.load('client', async () => {
            await window.gapi.client.init({
              apiKey: 'AIzaSyDx1jbQT-FzgzjASFqVA2kbAHWJ_TeUzdY',
              discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
            })
            resolve()
          })
        }
        document.head.appendChild(gapiScript)
      }
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
      document.head.appendChild(script)
    })
  }
  
  // Request access token
  const requestAccessToken = async () => {
    if (!tokenClient.value) {
      throw new Error('Google auth not initialized')
    }
    
    // Create a promise that will be resolved when the token callback is called
    const tokenPromise = new Promise((resolve) => {
      tokenResolve = resolve
    })
    
    // Request the token
    tokenClient.value.requestAccessToken()
    
    // Wait for the token
    const response = await tokenPromise
    if (!response) {
      throw new Error('Failed to get access token')
    }
    
    return response
  }
  
  // Create a new linked sheet
  const createLinkedSheet = async (students) => {
    try {
      syncStatus.value = 'syncing'
      syncMessage.value = 'Creating new Google Sheet...'
      
      // Request token if we don't have one
      if (!accessToken.value) {
        await requestAccessToken()
      }
      
      // Create the spreadsheet
      const response = await window.gapi.client.sheets.spreadsheets.create({
        properties: {
          title: `CaseManage Student Data - ${new Date().toLocaleDateString()}`,
          locale: 'en_US',
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        sheets: [{
          properties: {
            title: SHEET_NAME,
            gridProperties: {
              rowCount: 1000,
              columnCount: 8,
              frozenRowCount: 1
            }
          }
        }]
      })
      
      const spreadsheetId = response.result.spreadsheetId
      linkedSheetId.value = spreadsheetId
      linkedSheetUrl.value = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
      
      // Save to localStorage
      localStorage.setItem(SPREADSHEET_ID_KEY, spreadsheetId)
      
      // Add initial data
      await updateSheetData(students)
      
      // Format the header row - use the correct sheet ID
      const sheetId = response.result.sheets[0].properties.sheetId
      await formatHeaders(spreadsheetId, sheetId)
      
      syncStatus.value = 'success'
      syncMessage.value = 'Sheet created and linked successfully!'
      lastSyncTime.value = new Date()
      
      // Open the sheet
      window.open(linkedSheetUrl.value, '_blank')
      
      return { spreadsheetId, url: linkedSheetUrl.value }
      
    } catch (error) {
      console.error('Error creating sheet:', error)
      syncStatus.value = 'error'
      syncMessage.value = `Failed to create sheet: ${error.message}`
      throw error
    }
  }
  
  // Update sheet data
  const updateSheetData = async (students) => {
    if (!linkedSheetId.value) {
      throw new Error('No linked sheet. Create a sheet first.')
    }
    
    try {
      syncStatus.value = 'syncing'
      syncMessage.value = 'Updating Google Sheet...'
      
      // Make sure we have a token
      if (!accessToken.value) {
        await requestAccessToken()
      }
      
      // Debug log to see what students data looks like
      console.log('🔍 Google Sheets - Students data:', students)
      if (students && students.length > 0) {
        console.log('🔍 Google Sheets - First student:', students[0])
      }
      
      // Prepare the data
      const headers = [
        'Student ID',
        'First Name',
        'Last Name',
        'Grade',
        'Case Manager',
        'Assessment Accommodations',
        'Services',
        'Last Updated'
      ]
      
      const rows = students.map(student => {
        // Debug log for data extraction
        console.log('🔍 Processing student:', student.id, {
          firstName: student.firstName || student.app?.studentData?.firstName,
          lastName: student.lastName || student.app?.studentData?.lastName,
          grade: student.grade || student.app?.studentData?.grade
        })
        
        return [
          student.id || '',
          student.firstName || student.app?.studentData?.firstName || '',
          student.lastName || student.app?.studentData?.lastName || '',
          student.grade || student.app?.studentData?.grade || '',
          getCaseManagerName(student) || '',
          getAccommodations(student, 'assessment') || '',
          getServices(student) || '',
          new Date().toLocaleString()
        ]
      })
      
      const allData = [headers, ...rows]
      console.log('🔍 Google Sheets - Data to write:', allData)
      
      // Clear the sheet first
      await window.gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: linkedSheetId.value,
        range: `${SHEET_NAME}!A:Z`
      })
      
      // Update with new data
      const updateResponse = await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: linkedSheetId.value,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'RAW',
        resource: {
          values: allData
        }
      })
      
      console.log('🔍 Google Sheets - Update response:', updateResponse)
      
      syncStatus.value = 'success'
      syncMessage.value = `Updated ${rows.length} students`
      lastSyncTime.value = new Date()
      
    } catch (error) {
      console.error('Error updating sheet:', error)
      syncStatus.value = 'error'
      syncMessage.value = `Failed to update: ${error.message}`
      
      // If token expired, request new one
      if (error.status === 401) {
        accessToken.value = ''
        await requestAccessToken()
      }
      throw error
    }
  }
  
  // Format the header row
  const formatHeaders = async (spreadsheetId, sheetId) => {
    try {
      await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        resource: {
          requests: [{
            repeatCell: {
              range: {
                sheetId: sheetId, // Use the actual sheet ID, not 0
                startRowIndex: 0,
                endRowIndex: 1
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.6, blue: 0.9 },
                  textFormat: {
                    bold: true,
                    foregroundColor: { red: 1, green: 1, blue: 1 }
                  }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          }, {
            autoResizeDimensions: {
              dimensions: {
                sheetId: sheetId, // Use the actual sheet ID, not 0
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 8
              }
            }
          }]
        }
      })
    } catch (error) {
      console.error('Error formatting headers:', error)
    }
  }
  
  // Unlink the sheet
  const unlinkSheet = () => {
    linkedSheetId.value = ''
    linkedSheetUrl.value = ''
    localStorage.removeItem(SPREADSHEET_ID_KEY)
    syncStatus.value = 'idle'
    syncMessage.value = ''
    lastSyncTime.value = null
  }
  
  // Helper functions
  const getCaseManagerName = (student) => {
    // Implementation depends on your data structure
    const caseManagerId = student.caseManagerId || 
                         student.app?.studentData?.caseManagerId || 
                         student.casemanager_id
    return caseManagerId || 'Not Assigned'
  }
  
  const getAccommodations = (student, type) => {
    const accommodations = student.app?.accommodations?.[type] || 
                          student.accommodations?.[type] || 
                          []
    return Array.isArray(accommodations) ? accommodations.join(', ') : accommodations
  }
  
  const getServices = (student) => {
    const services = student.app?.classServices || 
                    student.classServices || 
                    []
    if (Array.isArray(services)) {
      return services.map(s => s.name || s).join(', ')
    }
    return services
  }
  
  // Check if sheet exists and is accessible
  const checkSheetConnection = async () => {
    if (!linkedSheetId.value) return false
    
    try {
      await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: linkedSheetId.value
      })
      return true
    } catch (error) {
      if (error.status === 404) {
        // Sheet was deleted
        unlinkSheet()
      }
      return false
    }
  }

  // Create a custom tab in the sheet
  const createCustomTab = async (tabName, students, teacherIds, users = []) => {
    if (!linkedSheetId.value) {
      throw new Error('No linked sheet. Create a sheet first.')
    }
    
    try {
      // Make sure we have a token
      if (!accessToken.value) {
        await requestAccessToken()
      }
      
      console.log('🔍 Creating custom tab:', tabName, 'for teachers:', teacherIds)
      
      // First, add a new sheet (tab) to the spreadsheet
      const addSheetResponse = await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: linkedSheetId.value,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: tabName,
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 11,
                  frozenRowCount: 1
                }
              }
            }
          }]
        }
      })
      
      const newSheetId = addSheetResponse.result.replies[0].addSheet.properties.sheetId
      console.log('🔍 Created sheet with ID:', newSheetId)
      
      // Prepare the data with teacher-specific columns
      const headers = [
        'Student ID',
        'First Name',
        'Last Name',
        'Grade',
        'Case Manager',
        'Period',
        'Teacher',
        'Subject',
        'Assessment Accommodations',
        'Services',
        'Last Updated'
      ]
      
      const rows = []
      students.forEach(student => {
        // Get all periods for this student with the selected teachers
        const periods = getStudentPeriodsForTeachers(student, teacherIds, users)
        
        periods.forEach(periodInfo => {
          rows.push([
            student.id || '',
            student.firstName || student.app?.studentData?.firstName || '',
            student.lastName || student.app?.studentData?.lastName || '',
            student.grade || student.app?.studentData?.grade || '',
            getCaseManagerName(student) || '',
            periodInfo.period || '',
            periodInfo.teacherName || '',
            periodInfo.subject || '',
            getAccommodations(student, 'assessment') || '',
            getServices(student) || '',
            new Date().toLocaleString()
          ])
        })
      })
      
      const allData = [headers, ...rows]
      
      // Update the new sheet with data
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: linkedSheetId.value,
        range: `${tabName}!A1`,
        valueInputOption: 'RAW',
        resource: {
          values: allData
        }
      })
      
      // Format the header row
      await formatHeaders(linkedSheetId.value, newSheetId)
      
      console.log('🔍 Custom tab created successfully with', rows.length, 'rows')
      return { sheetId: newSheetId, rowCount: rows.length }
      
    } catch (error) {
      console.error('Error creating custom tab:', error)
      throw error
    }
  }
  
  // Helper function to get student periods for specific teachers
  const getStudentPeriodsForTeachers = (student, teacherIds, users = []) => {
    const periods = []
    
    // Check aeries schedule structure
    if (student.aeries?.schedule) {
      Object.entries(student.aeries.schedule).forEach(([periodKey, period]) => {
        if (period && period.teacherId && teacherIds.includes(String(period.teacherId))) {
          const periodNum = periodKey.replace('period', '')
          periods.push({
            period: periodNum,
            teacherId: period.teacherId,
            teacherName: getTeacherName(period.teacherId, users),
            subject: period.subject || ''
          })
        }
      })
    }
    
    // Check app.schedule.periods structure
    if (student.app?.schedule?.periods) {
      Object.entries(student.app.schedule.periods).forEach(([periodNum, teacherId]) => {
        if (teacherId && teacherIds.includes(String(teacherId))) {
          periods.push({
            period: periodNum,
            teacherId: teacherId,
            teacherName: getTeacherName(teacherId, users),
            subject: '' // No subject info in this structure
          })
        }
      })
    }
    
    return periods
  }
  
  // Helper to get teacher name
  const getTeacherName = (teacherId, users = []) => {
    // First try to find by ID (email format)
    let user = users.find(u => u.id === teacherId)
    
    // If not found and teacherId is numeric, try to find by aeriesId
    if (!user && /^\d+$/.test(teacherId)) {
      user = users.find(u => u.aeriesId === teacherId)
    }
    
    if (user) {
      return user.name || `${user.firstName} ${user.lastName}` || `Teacher ${teacherId}`
    }
    
    return `Teacher ${teacherId}`
  }
  
  // Delete a custom tab from the sheet
  const deleteCustomTab = async (sheetId) => {
    if (!linkedSheetId.value) {
      throw new Error('No linked sheet.')
    }
    
    try {
      // Make sure we have a token
      if (!accessToken.value) {
        await requestAccessToken()
      }
      
      await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: linkedSheetId.value,
        resource: {
          requests: [{
            deleteSheet: {
              sheetId: sheetId
            }
          }]
        }
      })
      
      console.log('🔍 Deleted custom tab with sheet ID:', sheetId)
      
    } catch (error) {
      console.error('Error deleting custom tab:', error)
      throw error
    }
  }
  
  return {
    isInitialized,
    linkedSheetId,
    linkedSheetUrl,
    lastSyncTime,
    syncStatus,
    syncMessage,
    initializeGoogleAuth,
    requestAccessToken,
    createLinkedSheet,
    updateSheetData,
    createCustomTab,
    deleteCustomTab,
    unlinkSheet,
    checkSheetConnection
  }
} 