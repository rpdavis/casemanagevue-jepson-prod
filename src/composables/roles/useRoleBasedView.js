import { computed } from 'vue'
import { usePermissionStore } from '@/store/permissionStore'
import { PERMISSION_ACTIONS } from '@/config/roles'
import { useUnifiedRoleView } from './useUnifiedRoleView'
import { useAdministrator504View } from './useAdministrator504View'

/**
 * Legacy wrapper for role-based views
 * This now delegates to the new unified role view system
 * while maintaining backward compatibility
 */
export function useRoleBasedView(studentData, filterData) {
  const { currentUser } = studentData
  const permissionStore = usePermissionStore()
  
  // Get current role
  const currentRole = computed(() => {
    return currentUser.value?.role || 'guest'
  })

  // Create role-specific view based on current role
  const roleView = computed(() => {
    const role = currentRole.value
    
    switch (role) {
      case 'admin_504':
        // 504 Coordinator gets their specific view (CM caseload or IEP/504 only)
        return useAdministrator504View(studentData, filterData)
      
      default:
        // All other roles use the unified view
        return useUnifiedRoleView(studentData, filterData)
    }
  })
  
  // Use the role-specific view
  const activeView = roleView.value
  
  // Debug: Log role view results for paraeducators
  if (currentRole.value === 'paraeducator') {
    console.log('🔍 ROLE-BASED VIEW: Paraeducator activeView:', {
      visibleStudents: activeView.visibleStudents?.value?.length || 0,
      providerViewOptions: activeView.providerViewOptions?.value?.length || 0,
      role: currentRole.value
    })
  }
  
  // Legacy permission checks - now using active view's data
  const canEditAllStudents = computed(() => {
    const userRole = currentUser.value?.role
    return ['admin', 'school_admin', 'staff_edit', 'sped_chair'].includes(userRole)
  })
  
  const canEditOwnStudents = computed(() => {
    const userRole = currentUser.value?.role
    return ['case_manager', 'admin_504'].includes(userRole)
  })
  
  const canViewAllStudents = computed(() => {
    const userRole = currentUser.value?.role
    return ['admin', 'school_admin', 'staff_view', 'staff_edit', 'admin_504', 'sped_chair'].includes(userRole)
  })
  
  const canManageUsers = computed(() => {
    const userRole = currentUser.value?.role
    return ['admin', 'school_admin', 'admin_504', 'sped_chair'].includes(userRole)
  })
  
  const canManageAides = computed(() => {
    const userRole = currentUser.value?.role
    return ['admin', 'school_admin', 'admin_504', 'sped_chair'].includes(userRole)
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

  // Return active view functionality with legacy compatibility
  return {
    ...activeView,
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