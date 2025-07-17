import { computed } from 'vue'
import { usePermissionStore } from '@/store/permissionStore'
import { PERMISSION_ACTIONS } from '@/config/roles'
import { useAdminView } from './useAdminView'
import { useCaseManagerView } from './useCaseManagerView'
import { useSpedChairView } from './useSpedChairView'
import { useTeacherView } from './useTeacherView'
import { useServiceProviderView } from './useServiceProviderView'
import { useParaeducatorView } from './useParaeducatorView'

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
      case 'admin':
        return useAdminView(studentData, filterData)
      
      case 'case_manager':
        return useCaseManagerView(studentData, filterData)
      
      case 'sped_chair':
      case 'administrator_504_CM':
        return useSpedChairView(studentData, filterData)
      
      case 'teacher':
        return useTeacherView(studentData, filterData)
      
      case 'service_provider':
        return useServiceProviderView(studentData, filterData)
      
      case 'paraeducator':
        return useParaeducatorView(studentData, filterData)
      
      case 'administrator':
        return useAdminView(studentData, filterData)
      
      default:
        // Guest or unknown role - return minimal view
        return useAdminView(studentData, filterData)
    }
  })

  // Role-specific permissions - STATIC for security consistency
  const canEditAllStudents = computed(() => {
    const userRole = currentUser.value?.role
    // These roles can edit all students (matches Firebase rules)
    // Note: 'administrator' removed - they can only view, not edit
    return ['admin', 'sped_chair'].includes(userRole)
  })
  
  const canEditOwnStudents = computed(() => {
    const userRole = currentUser.value?.role
    // These roles can edit their own assigned students (matches Firebase rules)
    // Note: 'administrator_504_CM' added - they can only edit students on their case load
    return ['case_manager', 'administrator_504_CM'].includes(userRole)
  })
  
  const canViewAllStudents = computed(() => {
    const userRole = currentUser.value?.role
    // These roles can view all students (matches Firebase rules)
    return ['admin', 'administrator', 'administrator_504_CM', 'sped_chair'].includes(userRole)
  })
  
  const canManageUsers = computed(() => {
    const userRole = currentUser.value?.role
    // These roles can manage users (matches Firebase rules)
    return ['admin', 'administrator', 'administrator_504_CM'].includes(userRole)
  })
  
  const canManageAides = computed(() => {
    const userRole = currentUser.value?.role
    // These roles can manage aide assignments (matches Firebase rules)
    return ['admin', 'administrator', 'sped_chair'].includes(userRole)
  })
  
  // Testing permissions - Based on role and proctorTest field
  const canAccessTesting = computed(() => {
    // All authenticated users can access testing view for their role-based students
    return true
  })

  const canAccessTestingPartial = computed(() => {
    // Legacy - now same as canAccessTesting
    return true
  })

  const hasAnyTestingAccess = computed(() => {
    // All authenticated users have testing access for their assigned students
    return true
  })

  // Return combined functionality
  return {
    ...roleView.value,
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