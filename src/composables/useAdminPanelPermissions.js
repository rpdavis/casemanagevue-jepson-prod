import { ref, computed } from 'vue'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/store/authStore'

const permissions = ref({})
const isLoading = ref(false)
const isInitialized = ref(false)

export function useAdminPanelPermissions() {
  const authStore = useAuthStore()
  const currentUser = computed(() => authStore.currentUser)

  // Load permissions from Firestore
  const loadPermissions = async () => {
    if (isLoading.value || isInitialized.value) return permissions.value
    
    isLoading.value = true
    try {
      const docRef = doc(db, 'app_settings', 'admin_panel_permissions')
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        permissions.value = docSnap.data()
      } else {
        permissions.value = {}
      }
      
      isInitialized.value = true
      return permissions.value
    } catch (error) {
      console.error('Error loading admin panel permissions:', error)
      permissions.value = {}
      return permissions.value
    } finally {
      isLoading.value = false
    }
  }

  // Check if current user has permission for a specific action
  const hasPermission = computed(() => {
    return (permissionKey) => {
      if (!currentUser.value?.role || !permissions.value[permissionKey]) {
        return false
      }

      const userRole = currentUser.value.role
      
      // Admin always has all permissions
      if (userRole === 'admin') {
        return true
      }

      // Check specific role permission
      return permissions.value[permissionKey]?.[userRole] === true
    }
  })

  // Specific permission checks for common actions
  const canDeleteAllUsers = computed(() => hasPermission.value('delete-all-users'))
  const canDeleteAllStudents = computed(() => hasPermission.value('delete-all-students'))

  // Initialize permissions on first use
  const initializeIfNeeded = async () => {
    if (!isInitialized.value) {
      await loadPermissions()
    }
  }

  return {
    permissions,
    isLoading,
    hasPermission,
    canDeleteAllUsers,
    canDeleteAllStudents,
    loadPermissions,
    initializeIfNeeded
  }
}