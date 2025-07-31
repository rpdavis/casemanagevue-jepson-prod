import { computed } from 'vue'
import { usePermissionStore } from '@/store/permissionStore'
import { PERMISSION_ACTIONS } from '@/config/roles'
import { useUnifiedRoleView } from './useUnifiedRoleView'

/**
 * Legacy wrapper for role-based views
 * This now delegates to the new unified role view system
 * while maintaining backward compatibility
 */
export function useRoleBasedView(studentData, filterData) {
  const { currentUser } = studentData
  const permissionStore = usePermissionStore()
  
  // Get the unified role view
  const unifiedView = useUnifiedRoleView(studentData, filterData)
  
  // Legacy permission checks - now using unified system's data
  const currentRole = computed(() => {
    return currentUser.value?.role || 'guest'
  })

  // Role-specific permissions - delegated to unified system
  const canEditAllStudents = computed(() => {
    const userRole = currentUser.value?.role
    return ['admin', 'sped_chair'].includes(userRole)
  })
  
  const canEditOwnStudents = computed(() => {
    const userRole = currentUser.value?.role
    return ['case_manager', 'administrator_504_CM'].includes(userRole)
  })
  
  const canViewAllStudents = computed(() => {
    const userRole = currentUser.value?.role
    return ['admin', 'administrator', 'administrator_504_CM', 'sped_chair'].includes(userRole)
  })
  
  const canManageUsers = computed(() => {
    const userRole = currentUser.value?.role
    return ['admin', 'administrator', 'administrator_504_CM'].includes(userRole)
  })
  
  const canManageAides = computed(() => {
    const userRole = currentUser.value?.role
    return ['admin', 'administrator', 'sped_chair'].includes(userRole)
  })
  
  // Testing permissions
  const canAccessTesting = computed(() => {
    return true
  })

  const canAccessTestingPartial = computed(() => {
    return true
  })

  const hasAnyTestingAccess = computed(() => {
    return true
  })

  // Return unified functionality with legacy compatibility
  return {
    ...unifiedView,
    currentRole,
    canEditAllStudents,
    canEditOwnStudents,
    canViewAllStudents,
    canManageUsers,
    canManageAides,
    canAccessTesting,
    canAccessTestingPartial,
    hasAnyTestingAccess
  }
} 