import { ref } from 'vue'
import { iepSecurityHandler } from '@/utils/iepSecurity'

export default function useIEPSecurity() {
  const isLoading = ref(false)
  const error = ref(null)
  const accessHistory = ref([])

  // Secure save of student data
  const secureStudentSave = async (studentData) => {
    isLoading.value = true
    error.value = null

    try {
      // Verify access
      const hasAccess = await iepSecurityHandler.verifyAccess(studentData.id, 'write')
      if (!hasAccess) {
        throw new Error('You do not have permission to modify this student\'s IEP data')
      }

      // Encrypt sensitive fields
      const encryptedData = iepSecurityHandler.encryptSensitiveFields(studentData)

      // Log the access
      await iepSecurityHandler.logAccess(studentData.id, 'save', {
        fields: ['accommodations', 'services', 'plan'],
        type: 'modification'
      })

      return encryptedData
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // Secure load of student data
  const secureStudentLoad = async (studentData, studentId) => {
    isLoading.value = true
    error.value = null

    try {
      // Verify access
      const hasAccess = await iepSecurityHandler.verifyAccess(studentId, 'read')
      if (!hasAccess) {
        // Return masked data for unauthorized users
        return iepSecurityHandler.maskSensitiveData(studentData)
      }

      // Decrypt sensitive fields
      const decryptedData = iepSecurityHandler.decryptSensitiveFields(studentData)

      // Log the access
      await iepSecurityHandler.logAccess(studentId, 'view', {
        fields: ['accommodations', 'services', 'plan'],
        type: 'read'
      })

      return decryptedData
    } catch (e) {
      error.value = e.message
      // Return masked data on error
      return iepSecurityHandler.maskSensitiveData(studentData)
    } finally {
      isLoading.value = false
    }
  }

  // Load access history
  const loadAccessHistory = async (studentId) => {
    isLoading.value = true
    error.value = null

    try {
      const hasAccess = await iepSecurityHandler.verifyAccess(studentId, 'read')
      if (!hasAccess) {
        throw new Error('You do not have permission to view access history')
      }

      accessHistory.value = await iepSecurityHandler.getAccessHistory(studentId)
    } catch (e) {
      error.value = e.message
      accessHistory.value = []
    } finally {
      isLoading.value = false
    }
  }

  // Check if user has specific access
  const checkAccess = async (studentId, accessType = 'read') => {
    try {
      return await iepSecurityHandler.verifyAccess(studentId, accessType)
    } catch (e) {
      error.value = e.message
      return false
    }
  }

  return {
    secureStudentSave,
    secureStudentLoad,
    loadAccessHistory,
    checkAccess,
    accessHistory,
    isLoading,
    error
  }
} 