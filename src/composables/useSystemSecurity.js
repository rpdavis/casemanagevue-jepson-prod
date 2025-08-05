import { ref, watch } from 'vue'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase'

const DEFAULT_SECURITY_SETTINGS = {
  domainValidation: {
    enabled: false,
    controlledByCloudDomain: false,
    requireAtLeastOne: true,
    domains: [
      {
        id: 'district',
        name: 'District Domain',
        domain: '',
        enabled: true,
        required: true,
        description: 'Main district email domain (e.g., district.edu)'
      },
      {
        id: 'school',
        name: 'School Domain',
        domain: '',
        enabled: false,
        required: false,
        description: 'Individual school domain (e.g., schoolname.org)'
      },
      {
        id: 'state',
        name: 'State K-12 Domain',
        domain: '',
        enabled: false,
        required: false,
        description: 'State education domain (e.g., k12.state.us)'
      }
    ],
    emailExceptions: [
      { email: '', description: 'Tech team member or cloud console owner' },
      { email: '', description: 'IT administrator' },
      { email: '', description: 'External consultant' },
      { email: '', description: 'Emergency access' },
      { email: '', description: 'Backup administrator' }
    ]
  },
  sessionSecurity: {
    timeoutEnabled: true,
    timeoutMinutes: 30,
    enforcePasswordChange: false,
    requireMFA: false
  },
  dataAccess: {
    restrictExport: true,
    watermarkPDFs: true
  },
  ipRestrictions: {
    enabled: false,
    allowedIPs: []
  },
  alertSettings: {
    enabled: true,
    unusualAccess: true,
    bulkExport: true,
    alertEmails: []
  }
}

// Global singleton state
const securitySettings = ref({ ...DEFAULT_SECURITY_SETTINGS })
const loading = ref(false)
const error = ref(null)
let isInitialized = false

export function useSystemSecurity() {
  const settingsDocRef = doc(db, 'system_security', 'global')

  const loadSecuritySettings = async () => {
    if (loading.value) {
      return new Promise((resolve) => {
        const unwatch = watch(loading, (newLoading) => {
          if (!newLoading) {
            unwatch()
            resolve(securitySettings.value)
          }
        })
      })
    }

    if (isInitialized && !error.value) {
      return securitySettings.value
    }

    loading.value = true
    error.value = null

    try {
      const docSnap = await getDoc(settingsDocRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        // Merge with defaults to ensure all properties exist
        securitySettings.value = {
          ...DEFAULT_SECURITY_SETTINGS,
          ...data,
          domainValidation: {
            ...DEFAULT_SECURITY_SETTINGS.domainValidation,
            ...data.domainValidation,
            domains: data.domainValidation?.domains || DEFAULT_SECURITY_SETTINGS.domainValidation.domains,
            emailExceptions: data.domainValidation?.emailExceptions || DEFAULT_SECURITY_SETTINGS.domainValidation.emailExceptions
          }
        }
      } else {
        // Use defaults and save them
        securitySettings.value = { ...DEFAULT_SECURITY_SETTINGS }
        await setDoc(settingsDocRef, securitySettings.value)
      }
      
      isInitialized = true
    } catch (err) {
      console.error('Error loading security settings:', err)
      error.value = err.message || 'Failed to load security settings'
      // Use defaults on error
      securitySettings.value = { ...DEFAULT_SECURITY_SETTINGS }
    } finally {
      loading.value = false
    }

    return securitySettings.value
  }

  const saveSecuritySettings = async (newSettings = null) => {
    const settingsToSave = newSettings || securitySettings.value
    
    loading.value = true
    error.value = null

    try {
      await setDoc(settingsDocRef, settingsToSave)
      if (!newSettings) {
        securitySettings.value = { ...settingsToSave }
      }
      console.log('✅ Security settings saved successfully')
    } catch (err) {
      console.error('Error saving security settings:', err)
      error.value = err.message || 'Failed to save security settings'
      throw err
    } finally {
      loading.value = false
    }
  }

  const resetSecuritySettings = async () => {
    securitySettings.value = { ...DEFAULT_SECURITY_SETTINGS }
    await saveSecuritySettings()
  }

  // Helper functions for domain validation
  const getEnabledDomains = () => {
    if (!securitySettings.value?.domainValidation?.domains) return []
    return securitySettings.value.domainValidation.domains
      .filter(d => d.enabled && d.domain && d.domain.trim())
      .map(d => d.domain.trim())
  }

  const getEmailExceptions = () => {
    if (!securitySettings.value?.domainValidation?.emailExceptions) return []
    return securitySettings.value.domainValidation.emailExceptions
      .filter(e => e.email && e.email.trim())
      .map(e => e.email.trim())
  }

  const isEmailAllowed = (email) => {
    if (!email) return false
    
    // If domain validation is disabled, allow all accounts
    if (!securitySettings.value?.domainValidation?.enabled) {
      return true
    }
    
    const emailLower = email.toLowerCase()
    
    // Check email exceptions first (for tech team members)
    const exceptions = getEmailExceptions()
    if (exceptions.some(exception => emailLower === exception.toLowerCase())) {
      return true
    }
    
    // Check enabled domains
    const enabledDomains = getEnabledDomains()
    
    // If no domains configured, allow all (fallback)
    if (enabledDomains.length === 0) {
      return true
    }
    
    // Check if email matches any enabled domain
    return enabledDomains.some(domain => 
      emailLower.endsWith(`@${domain.toLowerCase()}`)
    )
  }

  return {
    securitySettings,
    loading,
    error,
    loadSecuritySettings,
    saveSecuritySettings,
    resetSecuritySettings,
    getEnabledDomains,
    getEmailExceptions,
    isEmailAllowed
  }
}