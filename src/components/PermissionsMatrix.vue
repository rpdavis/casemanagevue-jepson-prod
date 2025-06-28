<template>
  <div>
    <h3>Role Permissions Matrix</h3>
    <table class="permissions-table-admin">
      <thead>
        <tr>
          <th style="min-width:120px;">Role</th>
          <th v-for="action in actionList" :key="action" style="min-width:110px;">
            {{ actionLabels[action] }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="role in validRoles" :key="role">
          <td style="font-weight:bold;">{{ role }}</td>
          <td v-for="action in actionList" :key="action" style="text-align:center;">
            <input 
              type="checkbox"
              :data-role="role"
              :data-action="action"
              :checked="matrix[role]?.includes(action)"
              @change="updatePermission(role, action, $event.target.checked)"
            />
          </td>
        </tr>
      </tbody>
    </table>
    <button @click="savePermissions" style="padding:0.5em 1.4em;font-size:1.08em;">
      Save
    </button>
    <span :style="{ marginLeft: '1em', fontSize: '1em', color: isError ? '#b42c2c' : '#267838' }">
      {{ statusMessage }}
    </span>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'
import { VALID_ROLES, PERMISSION_ACTIONS, PERMISSIONS_MATRIX } from '../config/roles.js'

const ACTION_LIST = [
  PERMISSION_ACTIONS.VIEW_USERS,
  PERMISSION_ACTIONS.EDIT_USER,
  PERMISSION_ACTIONS.DELETE_USER,
  PERMISSION_ACTIONS.MANAGE_SUBJECTS,
  PERMISSION_ACTIONS.MANAGE_ROLES,
  PERMISSION_ACTIONS.VIEW_STUDENTS,
  PERMISSION_ACTIONS.EDIT_STUDENT_CM,
  PERMISSION_ACTIONS.EDIT_STUDENT_ALL,
  PERMISSION_ACTIONS.TESTING
]

const ACTION_LABELS = {
  [PERMISSION_ACTIONS.VIEW_USERS]: 'View Users',
  [PERMISSION_ACTIONS.EDIT_USER]: 'Edit User',
  [PERMISSION_ACTIONS.DELETE_USER]: 'Delete User',
  [PERMISSION_ACTIONS.MANAGE_SUBJECTS]: 'Manage Subjects',
  [PERMISSION_ACTIONS.MANAGE_ROLES]: 'Manage Roles',
  [PERMISSION_ACTIONS.VIEW_STUDENTS]: 'View Students',
  [PERMISSION_ACTIONS.EDIT_STUDENT_CM]: 'Edit Students (Own Caseload)',
  [PERMISSION_ACTIONS.EDIT_STUDENT_ALL]: 'Edit All Students',
  [PERMISSION_ACTIONS.TESTING]: 'Testing'
}

export default {
  name: 'PermissionsMatrix',
  setup() {
    const db = getFirestore()
    const MATRIX_DOC_PATH = 'config/permissions_matrix'
    
    const matrix = reactive({})
    const statusMessage = ref('')
    const isError = ref(false)

    const validRoles = VALID_ROLES
    const actionList = ACTION_LIST
    const actionLabels = ACTION_LABELS

    const showStatus = (message, error = false) => {
      statusMessage.value = message
      isError.value = error
      setTimeout(() => {
        statusMessage.value = ''
        isError.value = false
      }, 3000)
    }

    const loadPermissionsMatrix = async () => {
      try {
        const docRef = doc(db, MATRIX_DOC_PATH)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          Object.assign(matrix, data)
        } else {
          // Fallback to default
          Object.assign(matrix, PERMISSIONS_MATRIX)
        }
      } catch (e) {
        console.error('Error loading permissions matrix:', e)
        // Fallback to default
        Object.assign(matrix, PERMISSIONS_MATRIX)
      }
    }

    const updatePermission = (role, action, checked) => {
      if (!matrix[role]) {
        matrix[role] = []
      }
      
      if (checked) {
        if (!matrix[role].includes(action)) {
          matrix[role].push(action)
        }
      } else {
        const index = matrix[role].indexOf(action)
        if (index > -1) {
          matrix[role].splice(index, 1)
        }
      }
    }

    const savePermissions = async () => {
      try {
        await setDoc(doc(db, MATRIX_DOC_PATH), matrix)
        showStatus('✅ Permissions updated.', false)
      } catch (e) {
        console.error('Error saving permissions:', e)
        showStatus(`❌ Error saving: ${e.message}`, true)
      }
    }

    onMounted(() => {
      loadPermissionsMatrix()
    })

    return {
      matrix,
      statusMessage,
      isError,
      validRoles,
      actionList,
      actionLabels,
      updatePermission,
      savePermissions
    }
  }
}
</script>

<style scoped>
/* Styles are in admin-panel.css */
</style>
