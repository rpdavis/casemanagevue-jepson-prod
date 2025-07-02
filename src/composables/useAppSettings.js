import { ref, watch } from 'vue'
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import { getFirestore } from 'firebase/firestore'

const DEFAULT_SETTINGS = {
  grades: [],
  numPeriods: 6,
  periods: ['1', '2', '3', '4', '5', '6'],
  classServices: [],
  sdcSubcategories: [],
  customClassServices: [],
  serviceProviders: [],
  customServiceProviders: []
}

// Move appSettings ref outside the function for singleton behavior
const appSettings = ref({ ...DEFAULT_SETTINGS })

export function useAppSettings() {
  const db = getFirestore()
  const loading = ref(false)
  const error = ref(null)

  const settingsDocRef = doc(db, 'app_settings', 'global')

  const loadAppSettings = async () => {
    loading.value = true
    error.value = null
    try {
      const docSnap = await getDoc(settingsDocRef)
      if (docSnap.exists()) {
        appSettings.value = docSnap.data()
      } else {
        appSettings.value = { ...DEFAULT_SETTINGS }
      }
      return appSettings.value
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  const saveAppSettings = async (settings) => {
    loading.value = true
    error.value = null
    try {
      await setDoc(settingsDocRef, settings)
      // Immediately reload after save so all components see the update
      await loadAppSettings()
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  const resetAppSettings = async () => {
    loading.value = true
    error.value = null
    try {
      await setDoc(settingsDocRef, { ...DEFAULT_SETTINGS })
      await loadAppSettings()
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  watch(appSettings, (newVal) => {
    console.log('appSettings changed:', newVal)
  }, { deep: true })

  return {
    appSettings,
    loadAppSettings,
    saveAppSettings,
    resetAppSettings,
    loading,
    error
  }
} 