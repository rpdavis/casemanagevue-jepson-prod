// src/store/permissionStore.js

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { db } from '@/firebase'
import { doc, onSnapshot, getDoc } from 'firebase/firestore'
import { useAuthStore } from './authStore'
import { PERMISSIONS_MATRIX } from '@/config/roles'

export const usePermissionStore = defineStore('permission', () => {
  const authStore = useAuthStore()
  const userRoles = ref([])
  const userPermissions = ref({})
  const permissionsMatrix = ref({})
  const matrixLoaded = ref(false)

  // Load permissions matrix from database
  const loadPermissionsMatrix = async () => {
    try {
      const docRef = doc(db, 'config/permissions_matrix')
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        permissionsMatrix.value = docSnap.data()
        console.log('Loaded permissions matrix from database:', permissionsMatrix.value)
      } else {
        // Fallback to default matrix
        permissionsMatrix.value = PERMISSIONS_MATRIX
        console.log('Using default permissions matrix:', permissionsMatrix.value)
      }
      matrixLoaded.value = true
      // Recalculate permissions after matrix is loaded
      if (userRoles.value.length > 0) {
        userPermissions.value = derivePermissions(userRoles.value)
      }
    } catch (error) {
      console.error('Error loading permissions matrix:', error)
      // Fallback to default matrix
      permissionsMatrix.value = PERMISSIONS_MATRIX
      matrixLoaded.value = true
    }
  }

  // Watch for changes to permissions matrix in database
  let matrixUnsubscribe = null
  const startMatrixWatcher = () => {
    if (matrixUnsubscribe) matrixUnsubscribe()
    const docRef = doc(db, 'config/permissions_matrix')
    matrixUnsubscribe = onSnapshot(docRef, (doc) => {
      console.log('Permissions matrix updated:', doc.exists(), doc.data())
      if (doc.exists()) {
        permissionsMatrix.value = doc.data()
      } else {
        permissionsMatrix.value = PERMISSIONS_MATRIX
      }
      matrixLoaded.value = true
      // Recalculate permissions when matrix changes
      if (userRoles.value.length > 0) {
        userPermissions.value = derivePermissions(userRoles.value)
        console.log('User permissions recalculated:', userPermissions.value)
      }
    }, (error) => {
      console.error('Error watching permissions matrix:', error)
      permissionsMatrix.value = PERMISSIONS_MATRIX
      matrixLoaded.value = true
    })
  }

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

  // Initialize permissions matrix watcher and load initial data
  startMatrixWatcher()
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
