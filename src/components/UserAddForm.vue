<template>
  <div class="add-user-wrapper">
    <div class="add-single">
      <h3>Add Single User</h3>
      <form @submit.prevent="addSingleUser" class="form-grid">
        <div>
          <label>
            Name:
            <input
              type="text"
              v-model="singleUser.name"
              required
              autocomplete="off"
              data-lpignore="true"
            />
          </label>
        </div>
        <div>
          <label>
            Email:
            <input
              type="email"
              v-model="singleUser.email"
              required
              autocomplete="off"
              data-lpignore="true"
            />
          </label>
        </div>
        <div>
          <label>
            Role:
            <select v-model="singleUser.role" required>
              <option value="" disabled>Select role...</option>
              <option v-for="role in validRoles" :key="role" :value="role">
                {{ role }}
              </option>
            </select>
          </label>
        </div>
        <div v-if="providerOptions.length > 0">
          <label>
            Provider Type:
            <select v-model="singleUser.provider">
              <option value="">None</option>
              <option v-for="provider in providerOptions" :key="provider.abbreviation" :value="provider.abbreviation">
                {{ provider.name }} ({{ provider.abbreviation }})
              </option>
            </select>
          </label>
        </div>
        <div>
          <label>
            Aeries ID:
            <input type="text" v-model="singleUser.aeriesId" placeholder="Optional Aeries Teacher ID" />
          </label>
        </div>
        <button type="submit">Add User</button>
      </form>
    </div>

    <div class="add-bulk">
      <h3>Bulk Upload Users</h3>
      <div>
        <input
          type="file"
          ref="bulkFileInput"
          accept=".csv, .xls, .xlsx"
          @change="handleFileSelect"
        />
        <button @click="uploadBulkUsers" :disabled="!selectedFile">
          Upload Users
        </button>
      </div>
      <h4>Example Formatting</h4>
      <div>File needs to be in .csv, .xls, .xlsx format, like an Excel spreadsheet.</div>
      <div class="example-format">
        <p><strong>CSV Format:</strong></p>
        <pre>Name,Email,Role,Provider,AeriesID
"John Smith","john.smith@school.org","teacher","","123456"
"Jane Doe","jane.doe@school.org","service_provider","SLP","789012"
"Bob Johnson","bob.johnson@school.org","case_manager","",""</pre>
        <p><strong>Supported Roles:</strong> admin, teacher, case_manager, sped_chair, service_provider</p>
        <p><strong>Provider Types:</strong> SLP, OT, PT, SC, MH, TR, AUD, VI, AT, DHH, O&M, BIS, HN, SW</p>
        <p><strong>Aeries ID:</strong> Optional 6-digit teacher ID from Aeries system</p>
      </div>
    </div>

    <!-- Status Messages -->
    <div v-if="statusMessage" :class="['status-msg', { error: isError }]">
      {{ statusMessage }}
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase.js'
import { getFirestore, collection, addDoc } from 'firebase/firestore'
import { VALID_ROLES, isApprovedRole } from '../config/roles.js'
import { useAppSettings } from '@/composables/useAppSettings'
import { auditLogger } from '@/utils/auditLogger'
import { 
  validateUserData, 
  sanitizeUserFormData, 
  checkSecurityThreats,
  validateFile,
  checkRateLimit
} from '@/utils/validation.js'

export default {
  name: 'UserAddForm',
  setup() {
    const addUserWithRoleCallable = httpsCallable(functions, 'addUserWithRole')
    const db = getFirestore()

    const singleUser = reactive({
      name: '',
      email: '',
      role: '',
      provider: '',
      aeriesId: ''
    })

    const selectedFile = ref(null)
    const statusMessage = ref('')
    const isError = ref(false)
    const bulkFileInput = ref(null)

    const validRoles = VALID_ROLES

    const { appSettings, loadAppSettings } = useAppSettings()

    const providerOptions = computed(() => {
      if (appSettings && appSettings.value && appSettings.value.serviceProviders) {
        const DEFAULT_SERVICE_PROVIDERS = [
          { name: 'Speech-Language Therapy', abbreviation: 'SLP' },
          { name: 'Occupational Therapy', abbreviation: 'OT' },
          { name: 'Physical Therapy', abbreviation: 'PT' },
          { name: 'School Counseling', abbreviation: 'SC' },
          { name: 'School-Based Mental Health Services', abbreviation: 'MH' },
          { name: 'Transportation', abbreviation: 'TR' },
          { name: 'Audiology Services', abbreviation: 'AUD' },
          { name: 'Vision Services', abbreviation: 'VI' },
          { name: 'Assistive Technology', abbreviation: 'AT' },
          { name: 'Deaf and Hard of Hearing Services', abbreviation: 'DHH' },
          { name: 'Orientation and Mobility', abbreviation: 'O&M' },
          { name: 'Behavioral Intervention Services', abbreviation: 'BIS' },
          { name: 'Health/Nursing Services', abbreviation: 'HN' },
          { name: 'Social Work Services', abbreviation: 'SW' }
        ]
        return appSettings.value.serviceProviders.map(abbr =>
          DEFAULT_SERVICE_PROVIDERS.find(p => p.abbreviation === abbr) || { name: abbr, abbreviation: abbr }
        )
      }
      return []
    })

    const showStatus = (message, error = false) => {
      statusMessage.value = message
      isError.value = error
      setTimeout(() => {
        statusMessage.value = ''
        isError.value = false
      }, 5000)
    }

    const createUserInFirestore = async (name, email, role, provider, aeriesId) => {
      try {
        const userData = {
          name: name,
          email: email,
          role: role,
          provider: provider,
          aeriesId: aeriesId,
          createdAt: new Date(),
          status: 'active'
        }
        const docRef = await addDoc(collection(db, 'users'), userData)
        
        // Log user creation
        await auditLogger.logUserManagement(docRef.id, 'create', {
          userData: {
            name: name,
            email: email,
            role: role,
            provider: provider,
            aeriesId: aeriesId
          },
          method: 'firestore_direct'
        })
        
        return { success: true, userId: docRef.id }
      } catch (error) {
        // Log creation failure
        await auditLogger.logUserManagement('unknown', 'create_failed', {
          error: error.message,
          attemptedData: { name, email, role, provider, aeriesId },
          method: 'firestore_direct'
        })
        
        throw error
      }
    }

    const addUserToFirestore = async (name, email, role, provider, aeriesId) => {
      try {
        try {
          await addUserWithRoleCallable({ name, email, role, provider, aeriesId })
          
          // Log successful user creation via cloud function
          await auditLogger.logUserManagement('cloud_function_user', 'create', {
            userData: { name, email, role, provider, aeriesId },
            method: 'cloud_function'
          })
          
          return { success: true, method: 'cloud-function' }
        } catch (cloudError) {
          // Check if the error is because user already exists
          if (cloudError.code === 'functions/already-exists' || 
              cloudError.message?.includes('409') || 
              cloudError.message?.includes('already exists')) {
            console.log(`User ${email} already exists in Firebase Auth, skipping...`)
            
            // Log existing user attempt
            await auditLogger.logUserManagement('existing_user', 'create_skipped', {
              userData: { name, email, role, provider, aeriesId },
              reason: 'user_already_exists',
              method: 'cloud_function'
            })
            
            return { success: true, method: 'already-exists', message: 'User already exists' }
          }
          
          // For other errors, try creating in Firestore only
          await createUserInFirestore(name, email, role, provider, aeriesId)
          return { success: true, method: 'firestore' }
        }
      } catch (error) {
        // Log overall creation failure
        await auditLogger.logUserManagement('unknown', 'create_failed', {
          error: error.message,
          attemptedData: { name, email, role, provider, aeriesId },
          method: 'addUserToFirestore'
        })
        
        return { success: false, error: error.message }
      }
    }

    const addSingleUser = async () => {
      // Rate limiting check
      const rateCheck = checkRateLimit('addUser', 5, 60000) // 5 requests per minute
      if (!rateCheck.allowed) {
        showStatus('Too many requests. Please wait before adding another user.', true)
        return
      }
      
      // Sanitize input data
      const sanitizedData = sanitizeUserFormData(singleUser)
      
      // Comprehensive validation
      const validation = validateUserData(sanitizedData)
      if (!validation.isValid) {
        showStatus(`Please fix the following errors:\n${validation.errors.join('\n')}`, true)
        return
      }
      
      // Security threat detection
      const textFields = ['name', 'email', 'aeriesId']
      for (const field of textFields) {
        if (sanitizedData[field]) {
          const securityCheck = checkSecurityThreats(sanitizedData[field])
          if (!securityCheck.isSafe) {
            showStatus(`Security threat detected in ${field}: ${securityCheck.threats.join(', ')}`, true)
            return
          }
        }
      }
      
      // Apply sanitized data
      Object.assign(singleUser, sanitizedData)
      
      const result = await addUserToFirestore(
        singleUser.name,
        singleUser.email,
        singleUser.role,
        singleUser.provider,
        singleUser.aeriesId
      )
      if (result.success) {
        showStatus(`User ${singleUser.name} added successfully!`)
        singleUser.name = ''
        singleUser.email = ''
        singleUser.role = ''
        singleUser.provider = ''
        singleUser.aeriesId = ''
      } else {
        showStatus(`Error adding user: ${result.error}`, true)
      }
    }

    const handleFileSelect = (event) => {
      const file = event.target.files[0]
      if (file) {
        // Validate file
        const fileValidation = validateFile(file, {
          allowedTypes: ['csv', 'excel'],
          maxSize: 5 * 1024 * 1024, // 5MB for CSV/Excel files
          fieldName: 'User Import File'
        })
        
        if (!fileValidation.isValid) {
          showStatus(fileValidation.error, true)
          event.target.value = '' // Clear the file input
          return
        }
        
        // Check for security threats in filename
        const securityCheck = checkSecurityThreats(file.name)
        if (!securityCheck.isSafe) {
          showStatus(`File name contains potentially dangerous content: ${securityCheck.threats.join(', ')}`, true)
          event.target.value = '' // Clear the file input
          return
        }
        
        selectedFile.value = file
      }
    }

    const uploadBulkUsers = async () => {
      if (!selectedFile.value) {
        showStatus('Please select a file first', true)
        return
      }

      const fileName = selectedFile.value.name.toLowerCase()
      if (!(fileName.endsWith('.csv') || fileName.endsWith('.xls') || fileName.endsWith('.xlsx'))) {
        showStatus('Unsupported file type. Please upload a .csv, .xls, or .xlsx file.', true)
        return
      }

      showStatus('Processing file...')

      try {
        if (fileName.endsWith('.csv')) {
          await processCSVFile(selectedFile.value)
        } else {
          await processExcelFile(selectedFile.value)
        }
      } catch (error) {
        showStatus(`Error processing file: ${error.message}`, true)
        console.error('Bulk upload error:', error)
      }
    }

    const processCSVFile = async (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const text = e.target.result
            const lines = text.trim().split(/\r?\n/)
            if (lines.length === 0) {
              reject(new Error('The CSV file is empty.'))
              return
            }

            // Simple CSV parser that handles quoted fields
            const parseCSVLine = (line) => {
              const result = []
              let current = ''
              let inQuotes = false
              
              for (let i = 0; i < line.length; i++) {
                const char = line[i]
                if (char === '"') {
                  inQuotes = !inQuotes
                } else if (char === ',' && !inQuotes) {
                  result.push(current.trim())
                  current = ''
                } else {
                  current += char
                }
              }
              result.push(current.trim())
              return result
            }

            let startIndex = 0
            const colIndex = { name: 0, email: 1, role: 2, provider: 3, aeriesId: 4 }
            const firstLineCols = parseCSVLine(lines[0])
            const headerDetected = firstLineCols.map(h => h.toLowerCase())
              .some(h => h.includes('name') || h.includes('email') || h.includes('role'))

            if (headerDetected) {
              firstLineCols.forEach((header, idx) => {
                const headerLC = header.trim().toLowerCase()
                if (headerLC === 'name' || headerLC === 'displayname') colIndex.name = idx
                if (headerLC === 'email') colIndex.email = idx
                if (headerLC === 'role') colIndex.role = idx
                if (headerLC === 'provider' || headerLC === 'providertype') colIndex.provider = idx
                if (headerLC === 'aeriesid' || headerLC === 'aeries_id' || headerLC === 'teacherid') colIndex.aeriesId = idx
              })
              startIndex = 1
            }

            let successCount = 0
            const errorMessages = []

            for (let i = startIndex; i < lines.length; i++) {
              const line = lines[i].trim()
              if (!line) continue

              const parts = parseCSVLine(line)
              const name = (parts[colIndex.name] || '').trim()
              const email = (parts[colIndex.email] || '').trim()
              const role = (parts[colIndex.role] || '').trim()
              const provider = (parts[colIndex.provider] || '').trim()
              const aeriesId = (parts[colIndex.aeriesId] || '').trim()

              // Remove quotes from values
              const cleanName = name.replace(/^"|"$/g, '')
              const cleanEmail = email.replace(/^"|"$/g, '')
              const cleanRole = role.replace(/^"|"$/g, '')
              const cleanProvider = provider.replace(/^"|"$/g, '')
              const cleanAeriesId = aeriesId.replace(/^"|"$/g, '')

              if (!cleanName || !cleanEmail || !cleanRole) {
                errorMessages.push(`Line ${i + 1}: Missing name, email, or role.`)
                continue
              }

              if (!isApprovedRole(cleanRole)) {
                errorMessages.push(`Line ${i + 1}: Invalid role "${cleanRole}".`)
                continue
              }

              const result = await addUserToFirestore(cleanName, cleanEmail, cleanRole, cleanProvider, cleanAeriesId)
              if (result.success) {
                successCount++
                if (result.method === 'already-exists') {
                  console.log(`Line ${i + 1}: User ${cleanEmail} already exists, skipped`)
                }
              } else {
                errorMessages.push(`Line ${i + 1}: ${result.error}`)
              }
            }

            let summary = `${successCount} users added successfully.`
            if (errorMessages.length > 0) {
              summary += `\n${errorMessages.length} errors:\n` + errorMessages.join('\n')
            }
            showStatus(summary, errorMessages.length > 0)
            selectedFile.value = null
            if (bulkFileInput.value) {
              bulkFileInput.value.value = ''
            }
            resolve()
          } catch (err) {
            reject(new Error(`Error processing CSV file: ${err.message}`))
          }
        }
        reader.onerror = () => reject(new Error('Failed to read the CSV file.'))
        reader.readAsText(file)
      })
    }

    const processExcelFile = async (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            if (typeof XLSX === 'undefined') {
              reject(new Error('Excel upload requires SheetJS (XLSX) library. Please include it in your page.'))
              return
            }

            const data = new Uint8Array(e.target.result)
            const workbook = XLSX.read(data, { type: 'array' })
            const firstSheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[firstSheetName]
            const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

            if (rows.length === 0) {
              reject(new Error('The Excel file is empty or unrecognized.'))
              return
            }

            let successCount = 0
            const errorMessages = []

            for (let index = 0; index < rows.length; index++) {
              const row = rows[index]
              let name = '', email = '', role = '', provider = '', aeriesId = ''

              for (const key in row) {
                const keyLC = key.toLowerCase()
                const value = ('' + row[key]).trim()
                if ((keyLC === 'name' || keyLC === 'displayname') && !name) name = value
                else if (keyLC === 'email' && !email) email = value
                else if (keyLC === 'role' && !role) role = value
                else if ((keyLC === 'provider' || keyLC === 'providertype') && !provider) provider = value
                else if ((keyLC === 'aeriesid' || keyLC === 'aeries_id' || keyLC === 'teacherid') && !aeriesId) aeriesId = value
              }

              // Fallback to column order if field names not found
              const rowValues = Object.values(row).map(val => ('' + val).trim())
              if (!name && rowValues[0]) name = rowValues[0]
              if (!email && rowValues[1]) email = rowValues[1]
              if (!role && rowValues[2]) role = rowValues[2]
              if (!provider && rowValues[3]) provider = rowValues[3]
              if (!aeriesId && rowValues[4]) aeriesId = rowValues[4]

              if (!name || !email || !role) {
                errorMessages.push(`Row ${index + 1}: Missing name, email, or role.`)
                continue
              }

              if (!isApprovedRole(role)) {
                errorMessages.push(`Row ${index + 1}: Invalid role "${role}".`)
                continue
              }

              const result = await addUserToFirestore(name, email, role, provider, aeriesId)
              if (result.success) {
                successCount++
                if (result.method === 'already-exists') {
                  console.log(`Row ${index + 1}: User ${email} already exists, skipped`)
                }
              } else {
                errorMessages.push(`Row ${index + 1}: ${result.error}`)
              }
            }

            let summary = `${successCount} users added successfully.`
            if (errorMessages.length > 0) {
              summary += `\n${errorMessages.length} errors:\n` + errorMessages.join('\n')
            }
            showStatus(summary, errorMessages.length > 0)
            selectedFile.value = null
            if (bulkFileInput.value) {
              bulkFileInput.value.value = ''
            }
            resolve()
          } catch (err) {
            reject(new Error(`Error processing Excel file: ${err.message}`))
          }
        }
        reader.onerror = () => reject(new Error('Failed to read the Excel file.'))
        reader.readAsArrayBuffer(file)
      })
    }

    onMounted(async () => {
      await loadAppSettings()
    })

    return {
      singleUser,
      validRoles,
      providerOptions,
      addSingleUser,
      selectedFile,
      statusMessage,
      isError,
      bulkFileInput,
      handleFileSelect,
      uploadBulkUsers,
      appSettings
    }
  }
}
</script>

<style scoped>
/* Add your styles here */
.example-format {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.example-format pre {
  background-color: #fff;
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  font-size: 0.875rem;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.example-format p {
  margin: 0.5rem 0;
  font-size: 0.875rem;
}

.example-format strong {
  color: #495057;
}

/* Button Styles - Force visibility */
.add-user-wrapper button {
  padding: 12px 24px !important;
  border: none !important;
  border-radius: 6px !important;
  font-size: 16px !important;
  font-weight: 500 !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  text-decoration: none !important;
  display: inline-block !important;
  min-width: 120px !important;
  text-align: center !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
  margin: 10px 5px !important;
}

.add-user-wrapper button[type="submit"] {
  background: #007bff !important;
  color: white !important;
}

.add-user-wrapper button[type="submit"]:hover:not(:disabled) {
  background: #0056b3 !important;
}

.add-user-wrapper button:not([type="submit"]) {
  background: #28a745 !important;
  color: white !important;
}

.add-user-wrapper button:not([type="submit"]):hover:not(:disabled) {
  background: #1e7e34 !important;
}

.add-user-wrapper button:disabled {
  opacity: 0.6 !important;
  cursor: not-allowed !important;
  background: #6c757d !important;
}

/* Form layout */
.add-user-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.add-single, .add-bulk {
  background: white;
  border-radius: 8px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.form-grid label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-weight: 500;
}

.form-grid input, .form-grid select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

/* File upload section */
.add-bulk > div {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.add-bulk input[type="file"] {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex: 1;
}

/* Status messages */
.status-msg {
  padding: 15px;
  border-radius: 6px;
  margin-top: 20px;
  text-align: center;
}

.status-msg:not(.error) {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-msg.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>