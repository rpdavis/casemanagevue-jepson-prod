import { ref, computed } from 'vue'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase'

// Global state for admin permissions
const adminPermissions = ref({})
const permissionsLoaded = ref(false)

export function useAdminPermissions() {
  
  // Load permissions from Firestore
  const loadPermissions = async () => {
    try {
      const docRef = doc(db, 'app_settings', 'admin_panel_permissions')
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        adminPermissions.value = docSnap.data()
      } else {
        // Use default permissions if none exist
        adminPermissions.value = getDefaultPermissions()
      }
      
      permissionsLoaded.value = true
      console.log('Admin permissions loaded:', adminPermissions.value)
    } catch (error) {
      console.error('Error loading admin permissions:', error)
      // Fall back to default permissions
      adminPermissions.value = getDefaultPermissions()
      permissionsLoaded.value = true
    }
  }

  // Check if a user role has permission for a specific page
  const hasPermission = (pageKey, userRole) => {
    if (!permissionsLoaded.value) return false
    if (!adminPermissions.value[pageKey]) return false
    
    // Admin role always has access to everything
    if (userRole === 'admin') return true
    
    return adminPermissions.value[pageKey][userRole] === true
  }

  // Get filtered tabs based on user permissions
  const getPermittedTabs = (allTabs, userRole) => {
    if (!permissionsLoaded.value) return []
    
    return allTabs.filter(tab => {
      // Admin role sees everything
      if (userRole === 'admin') return true
      
      // Check specific permission for this tab
      return hasPermission(tab.key, userRole)
    })
  }

  // Default permissions structure
  const getDefaultPermissions = () => ({
    dashboard: { school_admin: true, admin_504: true, sped_chair: true },
    usersAdd: { school_admin: true, admin_504: true, sped_chair: false },
    usersEdit: { school_admin: true, admin_504: true, sped_chair: true },
    students: { school_admin: true, admin_504: true, sped_chair: true },
    addStudents: { school_admin: true, admin_504: true, sped_chair: true },
    'aide-assignment': { school_admin: true, admin_504: true, sped_chair: true },
    'aide-schedule': { school_admin: true, admin_504: true, sped_chair: true },
    'time-table': { school_admin: true, admin_504: false, sped_chair: true },
    seis: { school_admin: true, admin_504: true, sped_chair: true },
    aeries: { school_admin: true, admin_504: true, sped_chair: true },
    'testing-links': { school_admin: true, admin_504: false, sped_chair: true },
    'teacher-feedback': { school_admin: true, admin_504: true, sped_chair: true },
    'backup-restore': { school_admin: true, admin_504: false, sped_chair: true },
    settings: { school_admin: true, admin_504: true, sped_chair: true },
    // System category - admin only
    permissions: { school_admin: false, admin_504: false, sped_chair: false },
    'iep-security': { school_admin: false, admin_504: false, sped_chair: false },
    security: { school_admin: false, admin_504: false, sped_chair: false },
    'component-health': { school_admin: false, admin_504: false, sped_chair: false }
  })

  return {
    adminPermissions: computed(() => adminPermissions.value),
    permissionsLoaded: computed(() => permissionsLoaded.value),
    loadPermissions,
    hasPermission,
    getPermittedTabs
  }
} 