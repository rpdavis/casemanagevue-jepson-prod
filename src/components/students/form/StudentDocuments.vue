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
            🗑️ Remove
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
            ↩️ Undo
          </button>
        </span>
        <div v-if="isUploading && uploadingFile === 'bip'" class="upload-status loading-pulse">
          <span class="loading-spinner">🔄</span>
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
            🗑️ Remove
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
            ↩️ Undo
          </button>
        </span>
        <div v-if="isUploading && uploadingFile === 'ataglance'" class="upload-status loading-pulse">
          <span class="loading-spinner">🔄</span>
          <strong>Loading... Uploading At-A-Glance document...</strong>
        </div>
      </label>
    </div>
  </fieldset>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import usePdfHandler from '@/composables/usePdfHandler'

// Props & Emits
const props = defineProps({
  form: { type: Object, required: true },
  student: { type: Object, default: () => ({}) },
  mode: { type: String, default: 'new' },
  onFileChange: { type: Function, required: true },
  removeBipFile: { type: Function, required: true },
  removeAtaglanceFile: { type: Function, required: true }
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
</style> 