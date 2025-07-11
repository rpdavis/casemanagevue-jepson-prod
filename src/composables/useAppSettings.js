import { ref, watch } from 'vue'
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/firebase'

const DEFAULT_SETTINGS = {
  grades: [],
  classServices: [
    { name: 'SDC', subcategories: ['English', 'Math', 'History', 'Science'], enabledSubcategories: ['English', 'Math', 'History', 'Science'] },
    { name: 'Co-teach', subcategories: ['English', 'Math', 'History', 'Science'], enabledSubcategories: ['English', 'Math', 'History', 'Science'] },
    { name: 'RSP', subcategories: ['English', 'Math', 'History', 'Science'], enabledSubcategories: ['English', 'Math', 'History', 'Science'] },
    { name: 'Directed Studies', subcategories: ['Directed Studies'], enabledSubcategories: ['Directed Studies'] },
    { name: 'FA', subcategories: ['FA'], enabledSubcategories: ['FA'] }
  ],
  sdcSubcategories: [],
  customClassServices: [],
  serviceProviders: ['SLP', 'OT', 'PT', 'SC', 'MH', 'TR', 'AUD', 'VI', 'AT', 'DHH', 'O&M', 'BIS', 'HN', 'SW'],
  customServiceProviders: [],
  numPeriods: 7,
  periodLabels: ['1', '2', '3', '4', '5', '6', 'sh']
}

// Global singleton state
const appSettings = ref({ ...DEFAULT_SETTINGS })
const loading = ref(false)
const error = ref(null)
let isInitialized = false

export function useAppSettings() {
  const settingsDocRef = doc(db, 'app_settings', 'global')

  const loadAppSettings = async () => {
    // If already loading, wait for the current load to complete
    if (loading.value) {
      return new Promise((resolve) => {
        const unwatch = watch(loading, (newLoading) => {
          if (!newLoading) {
            unwatch()
            resolve(appSettings.value)
          }
        })
      })
    }

    // If already initialized and not forced reload, return current settings
    if (isInitialized && !error.value) {
      return appSettings.value
    }

    loading.value = true
    error.value = null
    try {
      const docSnap = await getDoc(settingsDocRef)
      if (docSnap.exists()) {
        appSettings.value = docSnap.data()
        console.log('useAppSettings: Loaded existing settings:', appSettings.value)
      } else {
        appSettings.value = { ...DEFAULT_SETTINGS }
        console.log('useAppSettings: No existing settings, using defaults:', appSettings.value)
      }
      isInitialized = true
      return appSettings.value
    } catch (e) {
      error.value = e.message
      console.error('useAppSettings: Error loading settings:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  const saveAppSettings = async (settings) => {
    loading.value = true
    error.value = null
    try {
      console.log('useAppSettings: Saving settings:', settings)
      await setDoc(settingsDocRef, settings)
      console.log('useAppSettings: Settings saved successfully')
      // Update the local state immediately without reloading
      appSettings.value = { ...settings }
      isInitialized = true
    } catch (e) {
      error.value = e.message
      console.error('useAppSettings: Error saving settings:', e)
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
      // Update the local state immediately without reloading
      appSettings.value = { ...DEFAULT_SETTINGS }
      isInitialized = true
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Auto-load settings on first use
  if (!isInitialized && !loading.value) {
    loadAppSettings()
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