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
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = originalFileName || 'document.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
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