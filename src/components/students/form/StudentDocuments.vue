<template>
  <fieldset class="form-col">
    <legend>Documents</legend>
    
    <!-- BIP Document -->
    <div class="document-section">
      <label>
        BIP:
        <input 
          type="file" 
          accept="application/pdf" 
          @change="handleSecureFileChange($event, 'bipFile')" 
        />
        <span 
          v-if="form.bipPdfUrl && !form.removeBipFile"
          class="current-file"
        >
          Current: 
          <a href="#" @click.prevent="downloadSecurePdf('bip')" target="_blank">View BIP</a>
          <button 
            type="button" 
            @click="removeBipFile" 
            class="btn-remove"
          >
            <Trash2 :size="16" /> Remove
          </button>
        </span>
        <span 
          v-if="form.removeBipFile" 
          class="removed-file"
        >
          BIP file will be removed
          <button 
            type="button" 
            @click="form.removeBipFile = false" 
            class="btn-undo"
          >
            <RotateCcw :size="16" /> Undo
          </button>
        </span>
        <div v-if="isUploading && uploadingFile === 'bip'" class="upload-status loading-pulse">
          <RotateCw :size="16" class="loading-spinner" />
          <strong>Loading... Uploading BIP document...</strong>
        </div>
        <div v-if="pdfError" class="error-message">
          {{ pdfError }}
        </div>
      </label>
    </div>
    
    <!-- At-A-Glance Document -->
    <div class="document-section">
      <label>
        At-A-Glance PDF:
        <input 
          type="file" 
          accept="application/pdf" 
          @change="handleSecureFileChange($event, 'ataglanceFile')" 
        />
        <span 
          v-if="form.ataglancePdfUrl && !form.removeAtaglanceFile"
          class="current-file"
        >
          Current: 
          <a href="#" @click.prevent="downloadSecurePdf('ataglance')" target="_blank">View At-A-Glance</a>
          <button 
            type="button" 
            @click="removeAtaglanceFile" 
            class="btn-remove"
          >
            <Trash2 :size="16" /> Remove
          </button>
        </span>
        <span 
          v-if="form.removeAtaglanceFile" 
          class="removed-file"
        >
          At-A-Glance file will be removed
          <button 
            type="button" 
            @click="form.removeAtaglanceFile = false" 
            class="btn-undo"
          >
            <RotateCcw :size="16" /> Undo
          </button>
        </span>
        <div v-if="isUploading && uploadingFile === 'ataglance'" class="upload-status loading-pulse">
          <RotateCw :size="16" class="loading-spinner" />
          <strong>Loading... Uploading At-A-Glance document...</strong>
        </div>
      </label>
    </div>

    <!-- Additional Documents Section -->
    <div class="additional-documents-section">
      <div class="additional-docs-header">
        <h4>Additional Documents</h4>
        <span class="doc-counter">{{ additionalDocuments.length }}/8 max</span>
      </div>
      
      <!-- Existing Additional Documents -->
      <div v-for="doc in additionalDocuments" :key="doc.id" class="document-section additional-doc">
        <div class="additional-doc-header">
          <FileText :size="16" class="doc-icon" />
          <span class="doc-title">{{ doc.title }}</span>
        </div>
        
        <!-- Document Upload Input (if no file uploaded yet) -->
        <div v-if="!doc.pdfUrl && !doc.toRemove" class="doc-upload-area">
          <input 
            type="file" 
            accept="application/pdf" 
            @change="handleAdditionalDocumentUpload($event, doc.id)" 
            class="additional-doc-input"
          />
        </div>
        
        <!-- Current File Display -->
        <span 
          v-if="doc.pdfUrl && !doc.toRemove"
          class="current-file"
        >
          Current: 
          <a href="#" @click.prevent="downloadAdditionalDocument(doc)" target="_blank">View {{ doc.title }}</a>
          <button 
            type="button" 
            @click="removeAdditionalDocument(doc.id)" 
            class="btn-remove"
          >
            <Trash2 :size="16" /> Remove
          </button>
        </span>
        
        <!-- Removed File State -->
        <span 
          v-if="doc.toRemove" 
          class="removed-file"
        >
          {{ doc.title }} will be removed
          <button 
            type="button" 
            @click="undoRemoveAdditionalDocument(doc.id)" 
            class="btn-undo"
          >
            <RotateCcw :size="16" /> Undo
          </button>
        </span>
        
        <!-- Upload Status -->
        <div v-if="isUploading && uploadingFile === doc.id" class="upload-status loading-pulse">
          <RotateCw :size="16" class="loading-spinner" />
          <strong>Loading... Uploading {{ doc.title }}...</strong>
        </div>
      </div>
      
      <!-- Add Document Button -->
      <div v-if="canAddMoreDocuments" class="add-document-section">
        <div v-if="!showAddForm" class="add-document-button-container">
          <button 
            type="button" 
            @click="showAddDocumentForm" 
            class="btn-add-document"
          >
            <Plus :size="16" /> Add Document
          </button>
        </div>
        
        <!-- Add Document Form -->
        <div v-if="showAddForm" class="add-document-form">
          <div class="title-input-container">
            <label for="newDocTitle">Document Title (max 24 characters):</label>
            <input 
              id="newDocTitle"
              type="text" 
              v-model="newDocumentTitle"
              maxlength="24"
              placeholder="Enter document title..."
              class="title-input"
              @keyup.enter="addNewDocument"
            />
            <span class="char-counter">{{ newDocumentTitle.length }}/24</span>
          </div>
          <div class="add-form-buttons">
            <button 
              type="button" 
              @click="addNewDocument" 
              :disabled="!newDocumentTitle.trim()"
              class="btn-confirm"
            >
              <Plus :size="16" /> Add
            </button>
            <button 
              type="button" 
              @click="cancelAddDocument" 
              class="btn-cancel"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
      
      <!-- Max Documents Message -->
      <div v-if="!canAddMoreDocuments" class="max-documents-message">
        <span>Maximum of 10 documents reached (including BIP and At-A-Glance)</span>
      </div>
    </div>
  </fieldset>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Trash2, RotateCcw, RotateCw, Plus, FileText } from 'lucide-vue-next'
import usePdfHandler from '@/composables/usePdfHandler'

// Props & Emits
const props = defineProps({
  form: { type: Object, required: true },
  student: { type: Object, default: () => ({}) },
  mode: { type: String, default: 'new' },
  onFileChange: { type: Function, required: true },
  removeBipFile: { type: Function, required: true },
  removeAtaglanceFile: { type: Function, required: true },
  addAdditionalDocument: { type: Function, required: true },
  removeAdditionalDocument: { type: Function, required: true },
  undoRemoveAdditionalDocument: { type: Function, required: true },
  deleteAdditionalDocument: { type: Function, required: true }
})

const emit = defineEmits(['loading-change'])

// Use secure PDF handler
const { uploadPdf, downloadPdf, isUploading, isDownloading, error: pdfError } = usePdfHandler()

// Local state
const uploadingFile = ref(null)

// Computed loading state
const isLoadingFiles = computed(() => {
  return isUploading.value || uploadingFile.value !== null
})

// Watch loading state and emit changes
watch(isLoadingFiles, (newValue) => {
  emit('loading-change', newValue)
}, { immediate: true })

// Get student ID for secure operations
const studentId = computed(() => {
  const id = props.student?.id || props.form?.id
  console.log('🔍 StudentDocuments - studentId computed:', {
    studentId: props.student?.id,
    formId: props.form?.id,
    finalId: id
  })
  return id
})

// Enhanced file change handler that integrates with secure PDF system
const handleSecureFileChange = async (event, fileType) => {
  const file = event.target.files[0] || null
  
  if (file) {
    // Validate file
    const fileValidation = validateFile(file, {
      allowedTypes: ['pdf'],
      maxSize: 10 * 1024 * 1024, // 10MB
      fieldName: fileType === 'bipFile' ? 'BIP Document' : 'At-A-Glance Document'
    })
    
    if (!fileValidation.isValid) {
      alert(fileValidation.error)
      event.target.value = '' // Clear the file input
      return
    }
    
    // Check for security threats in filename
    const securityCheck = checkSecurityThreats(file.name)
    if (!securityCheck.isSafe) {
      alert(`File name contains potentially dangerous content: ${securityCheck.threats.join(', ')}`)
      event.target.value = '' // Clear the file input
      return
    }

    // Upload to secure PDF system
    try {
      uploadingFile.value = fileType === 'bipFile' ? 'bip' : 'ataglance'
      
      if (!studentId.value) {
        throw new Error('Student ID is required for secure file upload')
      }

      // Clean up old file of the same type before uploading new one
      const oldFileName = fileType === 'bipFile' ? props.form.bipPdfUrl : props.form.ataglancePdfUrl
      if (oldFileName) {
        console.log(`🗑️ Cleaning up old ${fileType} file:`, oldFileName)
        try {
          const { ref, deleteObject } = await import('firebase/storage')
          const { doc, deleteDoc } = await import('firebase/firestore')
          const { storage, db } = await import('@/firebase')
          
          // Delete from storage
          const oldStorageRef = ref(storage, `students/${studentId.value}/${oldFileName}`)
          await deleteObject(oldStorageRef)
          
          // Delete metadata
          await deleteDoc(doc(db, 'pdfMetadata', oldFileName))
          
          console.log(`✅ Old ${fileType} file cleaned up:`, oldFileName)
        } catch (error) {
          console.warn(`Failed to clean up old ${fileType} file:`, error.message)
          // Continue with upload even if cleanup fails
        }
      }

      const secureFileName = await uploadPdf(file, studentId.value)
      
      // Update form with secure file reference using Vue's reactivity
      if (fileType === 'bipFile') {
        // Force reactive update
        Object.assign(props.form, {
          bipPdfUrl: secureFileName,
          bipFileName: file.name
        })
        console.log(`✅ BIP file updated in form:`, {
          bipPdfUrl: props.form.bipPdfUrl,
          bipFileName: props.form.bipFileName
        })
      } else {
        // Force reactive update
        Object.assign(props.form, {
          ataglancePdfUrl: secureFileName,
          ataglanceFileName: file.name
        })
        console.log(`✅ At-A-Glance file updated in form:`, {
          ataglancePdfUrl: props.form.ataglancePdfUrl,
          ataglanceFileName: props.form.ataglanceFileName
        })
      }
      
      console.log(`✅ Secure PDF uploaded: ${secureFileName}`)
      console.log(`📋 Current form state:`, {
        bipPdfUrl: props.form.bipPdfUrl,
        bipFileName: props.form.bipFileName,
        ataglancePdfUrl: props.form.ataglancePdfUrl,
        ataglanceFileName: props.form.ataglanceFileName
      })
      
    } catch (error) {
      console.error('Secure PDF upload failed:', error)
      alert(`Failed to upload PDF: ${error.message}`)
    } finally {
      uploadingFile.value = null
      event.target.value = '' // Clear the file input
    }
  }
  
  // Call the original onFileChange for form state management
  props.onFileChange(event, fileType)
}

// Download secure PDF
const downloadSecurePdf = async (fileType) => {
  try {
    const secureFileName = fileType === 'bip' ? props.form.bipPdfUrl : props.form.ataglancePdfUrl
    const originalFileName = fileType === 'bip' ? props.form.bipFileName : props.form.ataglanceFileName
    
    if (!secureFileName || !studentId.value) {
      throw new Error('File not found or student ID missing')
    }
    
    await downloadPdf(secureFileName, studentId.value, originalFileName)
    
  } catch (error) {
    console.error('Secure PDF download failed:', error)
    alert(`Failed to download PDF: ${error.message}`)
  }
}

// Local state for additional documents
const showAddForm = ref(false)
const newDocumentTitle = ref('')

// Computed properties for additional documents
const additionalDocuments = computed(() => props.form.additionalDocuments || [])
const canAddMoreDocuments = computed(() => {
  const totalDocs = 2 + additionalDocuments.value.length // BIP + At-A-Glance + additional
  return totalDocs < 10
})

// Additional document management functions
const showAddDocumentForm = () => {
  showAddForm.value = true
  newDocumentTitle.value = ''
}

const cancelAddDocument = () => {
  showAddForm.value = false
  newDocumentTitle.value = ''
}

const addNewDocument = async () => {
  try {
    if (!newDocumentTitle.value.trim()) {
      alert('Please enter a document title')
      return
    }
    
    const docId = props.addAdditionalDocument(newDocumentTitle.value.trim())
    showAddForm.value = false
    newDocumentTitle.value = ''
    
  } catch (error) {
    alert(error.message)
  }
}

const handleAdditionalDocumentUpload = async (event, docId) => {
  const file = event.target.files[0] || null
  
  if (file) {
    // Validate file
    const fileValidation = validateFile(file, {
      allowedTypes: ['pdf'],
      maxSize: 10 * 1024 * 1024, // 10MB
      fieldName: 'Additional Document'
    })
    
    if (!fileValidation.isValid) {
      alert(fileValidation.error)
      event.target.value = '' // Clear the file input
      return
    }
    
    // Check for security threats in filename
    const securityCheck = checkSecurityThreats(file.name)
    if (!securityCheck.isSafe) {
      alert(`File name contains potentially dangerous content: ${securityCheck.threats.join(', ')}`)
      event.target.value = '' // Clear the file input
      return
    }

    // Upload to secure PDF system
    try {
      uploadingFile.value = docId
      
      if (!studentId.value) {
        throw new Error('Student ID is required for secure file upload')
      }

      const secureFileName = await uploadPdf(file, studentId.value)
      
      // Update the specific document in the array
      const doc = props.form.additionalDocuments.find(d => d.id === docId)
      if (doc) {
        Object.assign(doc, {
          pdfUrl: secureFileName,
          fileName: file.name,
          uploadDate: new Date().toISOString()
        })
      }
      
      console.log(`✅ Additional document uploaded: ${secureFileName}`)
      
    } catch (error) {
      console.error('Additional document upload failed:', error)
      alert(`Failed to upload PDF: ${error.message}`)
    } finally {
      uploadingFile.value = null
      event.target.value = '' // Clear the file input
    }
  }
}

const downloadAdditionalDocument = async (doc) => {
  try {
    if (!doc.pdfUrl || !studentId.value) {
      throw new Error('File not found or student ID missing')
    }
    
    await downloadPdf(doc.pdfUrl, studentId.value, doc.fileName)
    
  } catch (error) {
    console.error('Additional document download failed:', error)
    alert(`Failed to download PDF: ${error.message}`)
  }
}

// Import validation utilities
import { validateFile, checkSecurityThreats } from '@/utils/validation.js'
</script>

<style scoped>
.document-section {
  margin-bottom: var(--spacing-lg);
}

.document-section label {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.current-file {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-sm);
}

.current-file a {
  color: var(--primary-color);
  text-decoration: none;
}

.current-file a:hover {
  text-decoration: underline;
}

.btn-remove {
  background: var(--error-color);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: var(--transition-base);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.btn-remove:hover {
  background: var(--error-hover);
}

.removed-file {
  color: var(--error-color);
  font-style: italic;
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.btn-undo {
  background: var(--bg-tertiary);
  border: var(--border-width) solid var(--border-color);
  color: var(--text-secondary);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: var(--transition-base);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.btn-undo:hover {
  background: var(--bg-muted);
  color: var(--text-primary);
}

.upload-status {
  color: var(--primary-color);
  font-size: var(--font-size-sm);
  font-style: italic;
  margin-top: var(--spacing-xs);
}

.error-message {
  color: var(--error-color);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-xs);
  padding: var(--spacing-xs);
  background: var(--error-bg);
  border-radius: var(--border-radius-sm);
}

input[type="file"] {
  padding: var(--spacing-sm);
  border: var(--border-width) dashed var(--border-color);
  border-radius: var(--border-radius-sm);
  background: var(--bg-tertiary);
  cursor: pointer;
}

input[type="file"]:hover {
  border-color: var(--border-dark);
  background: var(--bg-muted);
}

/* Loading animations */
.loading-pulse {
  animation: pulse 1.5s ease-in-out infinite;
}

.loading-spinner {
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.upload-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 12px;
  background-color: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 4px;
  color: #1976d2;
  font-size: 14px;
  font-weight: 500;
}

/* Additional Documents Styling */
.additional-documents-section {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: var(--border-width) solid var(--border-color);
}

.additional-docs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.additional-docs-header h4 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-size-lg);
}

.doc-counter {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.additional-doc {
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  background: var(--bg-secondary);
}

.additional-doc-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.doc-icon {
  color: var(--primary-color);
}

.doc-title {
  font-weight: 600;
  color: var(--text-primary);
}

.doc-upload-area {
  margin: var(--spacing-sm) 0;
}

.additional-doc-input {
  width: 100%;
  padding: var(--spacing-sm);
  border: var(--border-width) dashed var(--border-color);
  border-radius: var(--border-radius-sm);
  background: var(--bg-tertiary);
  cursor: pointer;
}

.additional-doc-input:hover {
  border-color: var(--border-dark);
  background: var(--bg-muted);
}

.add-document-section {
  margin-top: var(--spacing-lg);
}

.add-document-button-container {
  display: flex;
  justify-content: center;
}

.btn-add-document {
  background: var(--primary-color);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm) var(--spacing-lg);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: 500;
  transition: var(--transition-base);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.btn-add-document:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.add-document-form {
  background: var(--bg-secondary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
}

.title-input-container {
  margin-bottom: var(--spacing-md);
}

.title-input-container label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: 500;
  color: var(--text-primary);
}

.title-input {
  width: 100%;
  padding: var(--spacing-sm);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-base);
}

.title-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-alpha);
}

.char-counter {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
  display: block;
}

.add-form-buttons {
  display: flex;
  gap: var(--spacing-sm);
}

.btn-confirm {
  background: var(--success-color);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: var(--transition-base);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.btn-confirm:hover:not(:disabled) {
  background: var(--success-hover);
}

.btn-confirm:disabled {
  background: var(--bg-muted);
  color: var(--text-disabled);
  cursor: not-allowed;
}

.btn-cancel {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: var(--transition-base);
}

.btn-cancel:hover {
  background: var(--bg-muted);
  color: var(--text-primary);
}

.max-documents-message {
  text-align: center;
  padding: var(--spacing-md);
  background: var(--warning-bg);
  border: var(--border-width) solid var(--warning-color);
  border-radius: var(--border-radius-md);
  color: var(--warning-text);
  font-size: var(--font-size-sm);
  font-style: italic;
}
</style> 