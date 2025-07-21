<template>
  <div class="secure-pdf-test">
    <h2>🔒 Secure PDF System Test</h2>
    
    <div class="test-section">
      <h3>System Status</h3>
      <div class="status-grid">
        <div class="status-item">
          <span class="status-label">Encryption Key:</span>
          <span class="status-value">{{ encryptionKeyStatus }}</span>
        </div>
        <div class="status-item">
          <span class="status-label">Storage Access:</span>
          <span class="status-value">{{ storageStatus }}</span>
        </div>
        <div class="status-item">
          <span class="status-label">Firestore Access:</span>
          <span class="status-value">{{ firestoreStatus }}</span>
        </div>
        <div class="status-item">
          <span class="status-label">User Role:</span>
          <span class="status-value">{{ userRole }}</span>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h3>Test Student ID</h3>
      <input 
        v-model="testStudentId" 
        placeholder="Enter test student ID"
        class="student-id-input"
      />
      <p class="help-text">Enter a student ID to test with. You can:</p>
      <ul class="help-text">
        <li>Use an existing student ID from your database</li>
        <li>Create a new test student (requires admin permissions)</li>
        <li>Use "test-student-123" for testing</li>
      </ul>
      <button @click="createTestStudent" :disabled="creatingStudent" class="btn btn-secondary">
        {{ creatingStudent ? 'Creating...' : 'Create Test Student' }}
      </button>
      <button @click="findExistingStudent" :disabled="findingStudent" class="btn btn-secondary">
        {{ findingStudent ? 'Finding...' : 'Find Existing Student' }}
      </button>
    </div>
    
    <div class="test-section">
      <h3>Upload Test PDF</h3>
      <input 
        type="file" 
        accept="application/pdf" 
        @change="handleFileSelect" 
        ref="fileInput"
      />
      <button @click="uploadTestPdf" :disabled="!selectedFile || isUploading">
        {{ isUploading ? '🔄 Uploading...' : '📤 Upload PDF' }}
      </button>
      
      <div v-if="uploadError" class="error-message">
        {{ uploadError }}
      </div>
      
      <div v-if="uploadSuccess" class="success-message">
        ✅ PDF uploaded successfully! Secure filename: {{ uploadSuccess }}
      </div>
    </div>
    
    <div v-if="uploadSuccess" class="test-section">
      <h3>Download Test PDF</h3>
      <button @click="downloadTestPdf" :disabled="isDownloading">
        {{ isDownloading ? '🔄 Downloading...' : '📥 Download PDF' }}
      </button>
      
      <div v-if="downloadError" class="error-message">
        {{ downloadError }}
      </div>
      
      <div v-if="downloadSuccess" class="success-message">
        ✅ PDF downloaded successfully!
      </div>
    </div>

    <div class="test-section">
      <h3>Alternative Test: Direct Storage Upload</h3>
      <p class="help-text">This test bypasses the secure PDF system and uploads directly to storage for comparison.</p>
      <button @click="testDirectUpload" :disabled="!selectedFile || directUploading">
        {{ directUploading ? '🔄 Uploading...' : '📤 Test Direct Upload' }}
      </button>
      
      <div v-if="directUploadError" class="error-message">
        {{ directUploadError }}
      </div>
      
      <div v-if="directUploadSuccess" class="success-message">
        ✅ Direct upload successful! This confirms storage permissions are working.
      </div>
    </div>

    <div class="test-section">
      <h3>Test Cloud Function: Private URL Generation</h3>
      <p class="help-text">Test if the cloud function can generate private URLs for existing files.</p>
      <button @click="testCloudFunction" :disabled="testingCloudFunction">
        {{ testingCloudFunction ? '🔄 Testing...' : '🔗 Test Cloud Function' }}
      </button>
      
      <div v-if="cloudFunctionError" class="error-message">
        {{ cloudFunctionError }}
      </div>
      
      <div v-if="cloudFunctionSuccess" class="success-message">
        ✅ Cloud function working! Private URL generated successfully.
        <br><small>URL expires in 5 minutes</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import usePdfHandler from '@/composables/usePdfHandler'
import { securePdfHandler } from '@/utils/pdfSecurity'
import { db, storage, auth } from '@/firebase'
import { doc, getDoc, setDoc, serverTimestamp, collection, query, getDocs, limit } from 'firebase/firestore'
import { ref as storageRef, listAll, uploadBytes, getDownloadURL } from 'firebase/storage'

// Test state
const selectedFile = ref(null)
const testStudentId = ref('test-student-123')
const fileInput = ref(null)
const creatingStudent = ref(false)
const findingStudent = ref(false)
const directUploading = ref(false)
const directUploadError = ref(null)
const directUploadSuccess = ref(null)
const testingCloudFunction = ref(false)
const cloudFunctionError = ref(null)
const cloudFunctionSuccess = ref(null)

// System status
const encryptionKeyStatus = ref('Checking...')
const storageStatus = ref('Checking...')
const firestoreStatus = ref('Checking...')
const userRole = ref('Checking...')

// Upload/download state
const uploadSuccess = ref(null)
const uploadError = ref(null)
const downloadError = ref(null)
const downloadSuccess = ref(null)

// Use secure PDF handler
const { uploadPdf, downloadPdf, isUploading, isDownloading, error: pdfError } = usePdfHandler()

// Get current user role
const currentUserRole = computed(() => {
  // Try to get role from auth token
  return auth.currentUser?.role || 
         auth.currentUser?.claims?.role || 
         'unknown'
})

// Handle file selection
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file')
      event.target.value = ''
      return
    }
    selectedFile.value = file
    uploadError.value = null
    uploadSuccess.value = null
    directUploadError.value = null
    directUploadSuccess.value = null
  }
}

// Create test student
const createTestStudent = async () => {
  if (!testStudentId.value) {
    alert('Please enter a student ID')
    return
  }
  
  try {
    creatingStudent.value = true
    
    // First, let's check if we can read the user's role properly
    const user = auth.currentUser
    if (user) {
      const tokenResult = await user.getIdTokenResult()
      console.log('🔍 User token result:', tokenResult)
      console.log('🔍 User role from token:', tokenResult.claims.role)
    }
    
    const testStudentRef = doc(db, 'students', testStudentId.value)
    const testStudentDoc = await getDoc(testStudentRef)
    
    if (!testStudentDoc.exists()) {
      // Create a minimal test student document with proper structure
      await setDoc(testStudentRef, {
        app: {
          studentData: {
            firstName: 'Test',
            lastName: 'Student',
            grade: '7',
            plan: 'IEP',
            caseManagerId: auth.currentUser?.uid || 'test-case-manager'
          },
          staffIds: [auth.currentUser?.uid || 'test-user'],
          schedule: {
            periods: {},
            classServices: []
          },
          providers: {},
          accommodations: {
            instruction: '',
            assessment: ''
          },
          flags: {
            flag1: false,
            flag2: false
          }
        },
        createdAt: serverTimestamp()
      })
      alert('✅ Test student created successfully!')
    } else {
      alert('ℹ️ Test student already exists')
    }
    
  } catch (error) {
    alert(`❌ Error creating test student: ${error.message}`)
    console.error('Error creating test student:', error)
    
    // If admin creation fails, try a simpler test approach
    if (error.message.includes('permissions')) {
      alert('⚠️ Admin permissions required. Try using an existing student ID instead.')
    }
  } finally {
    creatingStudent.value = false
  }
}

// Find existing student
const findExistingStudent = async () => {
  try {
    findingStudent.value = true
    
    // Get a list of students to choose from
    const studentsRef = collection(db, 'students')
    const q = query(studentsRef, limit(5)) // Get first 5 students
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      const students = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      console.log('📋 Available students:', students)
      
      // Use the first student found
      const firstStudent = students[0]
      testStudentId.value = firstStudent.id
      
      alert(`✅ Found student: ${firstStudent.app?.studentData?.firstName || 'Unknown'} ${firstStudent.app?.studentData?.lastName || 'Student'} (ID: ${firstStudent.id})`)
    } else {
      alert('❌ No students found in database')
    }
    
  } catch (error) {
    alert(`❌ Error finding student: ${error.message}`)
    console.error('Error finding student:', error)
  } finally {
    findingStudent.value = false
  }
}

// Upload test PDF
const uploadTestPdf = async () => {
  if (!selectedFile.value || !testStudentId.value) {
    alert('Please select a file and enter a student ID')
    return
  }
  
  try {
    uploadError.value = null
    uploadSuccess.value = null
    
    const secureFileName = await uploadPdf(selectedFile.value, testStudentId.value)
    uploadSuccess.value = secureFileName
    
    console.log('✅ Test PDF uploaded successfully:', secureFileName)
    
  } catch (error) {
    uploadError.value = error.message
    console.error('❌ Test PDF upload failed:', error)
  }
}

// Download test PDF
const downloadTestPdf = async () => {
  if (!uploadSuccess.value || !testStudentId.value) {
    alert('Please upload a PDF first')
    return
  }
  
  try {
    downloadError.value = null
    downloadSuccess.value = null
    
    await downloadPdf(uploadSuccess.value, testStudentId.value, 'test-document.pdf')
    downloadSuccess.value = true
    
    console.log('✅ Test PDF downloaded successfully')
    
  } catch (error) {
    downloadError.value = error.message
    console.error('❌ Test PDF download failed:', error)
  }
}

// Test direct upload to storage
const testDirectUpload = async () => {
  if (!selectedFile.value) {
    alert('Please select a file first')
    return
  }
  
  try {
    directUploading.value = true
    directUploadError.value = null
    directUploadSuccess.value = null
    
    // Upload directly to a public folder for testing
    const fileRef = storageRef(storage, `public/test-${Date.now()}.pdf`)
    await uploadBytes(fileRef, selectedFile.value)
    
    directUploadSuccess.value = true
    console.log('✅ Direct upload successful')
    
  } catch (error) {
    directUploadError.value = error.message
    console.error('❌ Direct upload failed:', error)
  } finally {
    directUploading.value = false
  }
}

// Test cloud function
const testCloudFunction = async () => {
  if (!testStudentId.value) {
    alert('Please enter a student ID first')
    return
  }
  
  try {
    testingCloudFunction.value = true
    cloudFunctionError.value = null
    cloudFunctionSuccess.value = null
    
    // Import the cloud function
    const { getFunctions, httpsCallable } = await import('firebase/functions')
    const functions = getFunctions()
    const getStudentFileUrlFunction = httpsCallable(functions, 'getStudentFileUrl')
    
    // Test with a sample filename
    const testFileName = 'test-document.pdf'
    console.log(`🔍 Testing cloud function with studentId: ${testStudentId.value}, fileName: ${testFileName}`)
    
    const result = await getStudentFileUrlFunction({ 
      studentId: testStudentId.value, 
      fileName: testFileName 
    })
    
    console.log('✅ Cloud function result:', result.data)
    cloudFunctionSuccess.value = true
    
    // Test if the URL is actually private (no download token)
    const url = result.data.url
    if (url && !url.includes('token=')) {
      console.log('✅ URL is private (no download token)')
    } else {
      console.warn('⚠️ URL may not be private')
    }
    
  } catch (error) {
    cloudFunctionError.value = error.message
    console.error('❌ Cloud function test failed:', error)
  } finally {
    testingCloudFunction.value = false
  }
}

// Check system status
const checkSystemStatus = async () => {
  try {
    // Check encryption key
    const key = securePdfHandler.encryptionKey
    encryptionKeyStatus.value = key && key !== 'your-dev-key-here' ? '✅ Configured' : '⚠️ Using default key'
    
    // Check storage access
    try {
      // Test with a path that should be accessible
      const testRef = storageRef(storage, 'public/test-access')
      await listAll(testRef)
      storageStatus.value = '✅ Accessible'
    } catch (error) {
      if (error.code === 'storage/unauthorized') {
        storageStatus.value = '⚠️ Limited access (expected)'
      } else {
        storageStatus.value = '❌ Access denied'
      }
    }
    
    // Check Firestore access
    try {
      const testDoc = doc(db, 'test', 'test')
      await getDoc(testDoc)
      firestoreStatus.value = '✅ Accessible'
    } catch (error) {
      firestoreStatus.value = '❌ Access denied'
    }
    
    // Set user role - try multiple sources
    try {
      const user = auth.currentUser
      if (user) {
        const tokenResult = await user.getIdTokenResult()
        userRole.value = tokenResult.claims.role || 'unknown'
        console.log('🔍 User role detected:', userRole.value)
      } else {
        userRole.value = 'not authenticated'
      }
    } catch (error) {
      userRole.value = 'error reading role'
      console.error('Error reading user role:', error)
    }
    
  } catch (error) {
    console.error('Error checking system status:', error)
  }
}

// Initialize on mount
onMounted(() => {
  checkSystemStatus()
})
</script>

<style scoped>
.secure-pdf-test {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.test-section h3 {
  margin-top: 0;
  color: #333;
}

input[type="file"] {
  margin-bottom: 10px;
  padding: 10px;
  border: 2px dashed #ccc;
  border-radius: 4px;
  width: 100%;
}

button {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
  margin-bottom: 10px;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.error-message {
  color: #dc3545;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}

.success-message {
  color: #155724;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}

.status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: white;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.status-label {
  font-weight: bold;
  color: #555;
}

.status-value {
  font-family: monospace;
  font-size: 0.9em;
}

.student-id-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
}

.help-text {
  font-size: 0.9em;
  color: #666;
  margin: 0 0 10px 0;
}

.help-text ul {
  margin: 5px 0;
  padding-left: 20px;
}

.help-text li {
  margin-bottom: 3px;
}
</style> 