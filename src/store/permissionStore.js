// src/store/permissionStore.js

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { db } from '@/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { useAuthStore } from './authStore'
import { PERMISSIONS_MATRIX } from '@/config/roles'

export const usePermissionStore = defineStore('permission', () => {
  const authStore = useAuthStore()
  const userRoles = ref([])
  const userPermissions = ref({})
  const permissionsMatrix = ref({})
  const matrixLoaded = ref(false)

  // Use static permissions matrix (no Firestore loading)
  const loadPermissionsMatrix = async () => {
    // Always use the static matrix from roles.js
    permissionsMatrix.value = PERMISSIONS_MATRIX
    matrixLoaded.value = true
    console.log('Using static permissions matrix:', permissionsMatrix.value)
    
    // Recalculate permissions after matrix is loaded
    if (userRoles.value.length > 0) {
      userPermissions.value = derivePermissions(userRoles.value)
    }
  }

  // No dynamic watching needed for static permissions

  function derivePermissions(roles) {
    const perms = {}
    console.log('Deriving permissions for roles:', roles)
    console.log('Current permissions matrix:', permissionsMatrix.value)
    console.log('Matrix loaded:', matrixLoaded.value)
    roles.forEach(role => {
      const rolePerms = permissionsMatrix.value[role] || []
      console.log(`Role ${role} has permissions:`, rolePerms)
      rolePerms.forEach(p => perms[p] = true)
    })
    console.log('Final derived permissions:', perms)
    return perms
  }

  let unsubscribe = null

  const startPermissionWatcher = () => {
    if (unsubscribe) unsubscribe()
    if (authStore.currentUser?.uid) {
      const docRef = doc(db, 'users', authStore.currentUser.uid)
      unsubscribe = onSnapshot(docRef, snap => {
        const data = snap.data() || {}
        userRoles.value = data.role ? [data.role] : []
        console.log('User roles updated:', userRoles.value)
        
        // Update auth store with latest user data (including proctorTest field)
        if (authStore.currentUser) {
          authStore.currentUser.value = {
            ...authStore.currentUser.value,
            ...data
          }
          console.log('🔄 Updated auth store user data:', authStore.currentUser.value)
        }
        
        // Only calculate permissions if matrix is loaded
        if (matrixLoaded.value) {
          userPermissions.value = derivePermissions(userRoles.value)
        }
      })
    } else {
      userRoles.value = []
      userPermissions.value = {}
    }
  }

  watch(() => authStore.currentUser?.uid, startPermissionWatcher, { immediate: true })

  // Initialize static permissions matrix
  loadPermissionsMatrix()

  return {
    userRoles,
    userPermissions,
    permissionsMatrix,
    matrixLoaded,
    hasRole: role => userRoles.value.includes(role),
    can: perm => userPermissions.value[perm] === true,
    loadPermissionsMatrix
  }
})
