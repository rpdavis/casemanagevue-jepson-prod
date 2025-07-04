// src/composables/usePermissions.js
import { computed } from 'vue'
import { usePermissionStore } from '@/store/permissionStore'

export function usePermissions() {
  const store = usePermissionStore()

  const isAdmin = computed(() => store.hasRole('admin'))
  const canManageUsers = computed(() => store.can('manage_users'))

  // Add hasPermission function that the UserRoleSwitcher expects
  const hasPermission = (permission) => store.can(permission)

  return {
    isAdmin,
    canManageUsers,
    hasRole: store.hasRole,
    can: store.can,
    hasPermission
  }
}
