// src/composables/usePermissions.js
import { computed } from 'vue'
import { usePermissionStore } from '@/store/permissionStore'

export function usePermissions() {
  const store = usePermissionStore()

  const isAdmin = computed(() => store.hasRole('admin'))
  const canManageUsers = computed(() => store.can('manage_users'))

  return {
    isAdmin,
    canManageUsers,
    hasRole: store.hasRole,
    can: store.can
  }
}
