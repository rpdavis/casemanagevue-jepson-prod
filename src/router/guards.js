import { useAuthStore } from '@/store/authStore'
import { auditLogger } from '@/utils/auditLogger'

export const authGuard = async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Wait for auth to initialize
  while (authStore.isLoading) {
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  
  if (!authStore.currentUser) {
    // Log unauthorized access attempt
    await auditLogger.logSystemAccess('unauthorized_access_attempt', {
      attemptedRoute: to.path,
      fromRoute: from.path,
      success: false
    })
    
    next('/login')
  } else if (!authStore.currentUser.role) {
    console.log(`User ${authStore.currentUser.uid} exists in Auth but has no role - redirecting to login for role assignment`)
    
    // Log incomplete user setup
    await auditLogger.logSystemAccess('incomplete_user_setup', {
      userId: authStore.currentUser.uid,
      userEmail: authStore.currentUser.email,
      attemptedRoute: to.path,
      reason: 'no_role_assigned'
    })
    
    next('/login')
  } else {
    next()
  }
}

export const adminGuard = async (to, from, next) => {
  const authStore = useAuthStore()
  
  if (!authStore.currentUser || !['admin', 'school_admin', 'admin_504', 'sped_chair'].includes(authStore.currentUser.role)) {
    console.warn(`User with role '${authStore.currentUser?.role}' tried to access restricted route: ${to.path}`)
    
    // Log unauthorized admin access attempt
    await auditLogger.logSystemAccess('unauthorized_admin_access', {
      userRole: authStore.currentUser?.role || 'none',
      attemptedRoute: to.path,
      fromRoute: from.path,
      success: false
    })
    
    next('/students')
  } else {
    // Log successful admin access
    await auditLogger.logSystemAccess('admin_route_access', {
      userRole: authStore.currentUser.role,
      accessedRoute: to.path,
      fromRoute: from.path,
      success: true
    })
    
    next()
  }
}

export const setupGuards = (router) => {
  // This function can be used to set up global navigation guards if needed
  // For now, the guards are applied individually to routes
  console.log('Router guards setup completed')
}