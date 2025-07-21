import { ref } from 'vue'
import { securePdfHandler } from '@/utils/pdfSecurity'

export default function usePdfHandler() {
  const isUploading = ref(false)
  const isDownloading = ref(false)
  const error = ref(null)

  const uploadPdf = async (file, studentId) => {
    isUploading.value = true
    error.value = null
    
    try {
      // Validate file type
      if (file.type !== 'application/pdf') {
        throw new Error('Only PDF files are allowed')
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB')
      }

      const secureFileName = await securePdfHandler.encryptAndUploadPdf(file, studentId)
      return secureFileName
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      isUploading.value = false
    }
  }

  const downloadPdf = async (secureFileName, studentId, originalFileName) => {
    isDownloading.value = true
    error.value = null
    
    try {
      const pdfBlob = await securePdfHandler.downloadAndDecryptPdf(secureFileName, studentId)
      
      // Create blob URL and open in new tab
      const url = window.URL.createObjectURL(pdfBlob)
      
      // Open PDF in new tab
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
      
      // Clean up the blob URL after a delay to ensure it's loaded
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 5000)
      
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      isDownloading.value = false
    }
  }

  const getAccessHistory = async (fileId) => {
    try {
      return await securePdfHandler.getFileAccessHistory(fileId)
    } catch (e) {
      error.value = e.message
      return []
    }
  }

  return {
    uploadPdf,
    downloadPdf,
    getAccessHistory,
    isUploading,
    isDownloading,
    error
  }
} 