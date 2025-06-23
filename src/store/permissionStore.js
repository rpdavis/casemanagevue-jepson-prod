// src/store/permissionStore.js

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { db } from '@/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { useAuthStore } from './authStore'
import { PERMISSIONS_BY_ROLE } from '@/config/roles'

export const usePermissionStore = defineStore('permission', () => {
  const { currentUser } = useAuthStore()
  const userRoles = ref([])
  const userPermissions = ref({})

  function derivePermissions(roles) {
    const perms = {}
    roles.forEach(role => {
      const rolePerms = PERMISSIONS_BY_ROLE[role] || []
      rolePerms.forEach(p => perms[p] = true)
    })
    return perms
  }

  let unsubscribe = null

  const startPermissionWatcher = () => {
    if (unsubscribe) unsubscribe()
    if (currentUser?.uid) {
      const docRef = doc(db, 'users', currentUser.uid)
      unsubscribe = onSnapshot(docRef, snap => {
        const data = snap.data() || {}
        userRoles.value = data.role ? [data.role] : []
        userPermissions.value = derivePermissions(userRoles.value)
      })
    } else {
      userRoles.value = []
      userPermissions.value = {}
    }
  }

  watch(() => currentUser?.uid, startPermissionWatcher, { immediate: true })

  return {
    userRoles,
    userPermissions,
    hasRole: role => userRoles.value.includes(role),
    can: perm => userPermissions.value[perm] === true
  }
})
