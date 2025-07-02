import { ref } from 'vue'
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Simple encryption/decryption (for production, consider using a more robust encryption library)
const encrypt = (text, key) => {
  // Simple XOR encryption - replace with proper encryption in production
  let result = ''
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return btoa(result) // Base64 encode
}

const decrypt = (encryptedText, key) => {
  // Simple XOR decryption - replace with proper encryption in production
  const decoded = atob(encryptedText) // Base64 decode
  let result = ''
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return result
}

export function useSecureStorage() {
  const db = getFirestore()
  const auth = getAuth()
  const isLoading = ref(false)
  const error = ref(null)

  const getEncryptionKey = () => {
    const user = auth.currentUser
    if (!user) throw new Error('User not authenticated')
    
    // Use user UID as part of the encryption key
    // In production, you might want to use a more sophisticated key derivation
    return user.uid + '_aeries_config_key'
  }

  const saveAeriesConfig = async (config) => {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to save configuration')
    }

    isLoading.value = true
    error.value = null

    try {
      const user = auth.currentUser
      const encryptionKey = getEncryptionKey()
      
      // Encrypt sensitive data
      const encryptedConfig = {
        baseUrl: encrypt(config.baseUrl, encryptionKey),
        clientId: encrypt(config.clientId, encryptionKey),
        clientSecret: encrypt(config.clientSecret, encryptionKey),
        selectedSchoolId: config.selectedSchoolId || '',
        selectedClassIds: config.selectedClassIds || [],
        manualClassInput: config.manualClassInput || '',
        savedAt: new Date().toISOString(),
        userId: user.uid // Store user ID for security
      }

      // Save to Firestore in user's private collection
      const configRef = doc(db, 'users', user.uid, 'aeries_config', 'current')
      await setDoc(configRef, encryptedConfig)

      return { success: true, message: 'Configuration saved securely' }
    } catch (err) {
      error.value = err.message
      console.error('Failed to save Aeries configuration:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const loadAeriesConfig = async () => {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to load configuration')
    }

    isLoading.value = true
    error.value = null

    try {
      const user = auth.currentUser
      const encryptionKey = getEncryptionKey()
      
      // Load from Firestore
      const configRef = doc(db, 'users', user.uid, 'aeries_config', 'current')
      const configDoc = await getDoc(configRef)

      if (!configDoc.exists()) {
        return null
      }

      const encryptedConfig = configDoc.data()
      
      // Verify this config belongs to the current user
      if (encryptedConfig.userId !== user.uid) {
        throw new Error('Configuration security check failed')
      }

      // Decrypt sensitive data
      const config = {
        baseUrl: decrypt(encryptedConfig.baseUrl, encryptionKey),
        clientId: decrypt(encryptedConfig.clientId, encryptionKey),
        clientSecret: decrypt(encryptedConfig.clientSecret, encryptionKey),
        selectedSchoolId: encryptedConfig.selectedSchoolId || '',
        selectedClassIds: encryptedConfig.selectedClassIds || [],
        manualClassInput: encryptedConfig.manualClassInput || '',
        savedAt: encryptedConfig.savedAt
      }

      return config
    } catch (err) {
      error.value = err.message
      console.error('Failed to load Aeries configuration:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteAeriesConfig = async () => {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to delete configuration')
    }

    isLoading.value = true
    error.value = null

    try {
      const user = auth.currentUser
      
      // Delete from Firestore
      const configRef = doc(db, 'users', user.uid, 'aeries_config', 'current')
      await deleteDoc(configRef)

      return { success: true, message: 'Configuration deleted securely' }
    } catch (err) {
      error.value = err.message
      console.error('Failed to delete Aeries configuration:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const hasSavedConfig = async () => {
    if (!auth.currentUser) return false

    try {
      const user = auth.currentUser
      const configRef = doc(db, 'users', user.uid, 'aeries_config', 'current')
      const configDoc = await getDoc(configRef)
      return configDoc.exists()
    } catch (err) {
      console.error('Failed to check for saved configuration:', err)
      return false
    }
  }

  return {
    isLoading,
    error,
    saveAeriesConfig,
    loadAeriesConfig,
    deleteAeriesConfig,
    hasSavedConfig
  }
}
