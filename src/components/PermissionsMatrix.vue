<template>
  <div>
    <h3>Role Permissions Matrix</h3>
    <div class="permissions-note">
      <p><strong>Note:</strong> Permissions marked with 🔒 are read-only and match Firebase security rules. 
      These cannot be changed to ensure database security consistency. Only view permissions and testing access can be modified.</p>
    </div>
    <table class="permissions-table-admin">
      <thead>
        <tr>
          <th style="min-width:120px;">Role</th>
          <th v-for="action in actionList" :key="action" style="min-width:110px;">
            {{ actionLabels[action] }}
          </th>
          <th style="min-width:120px;">Testing Access</th>
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
              :disabled="isReadOnlyPermission(action)"
              :class="{ 'read-only': isReadOnlyPermission(action) }"
              @change="updatePermission(role, action, $event.target.checked)"
            />
            <span v-if="isReadOnlyPermission(action)" class="read-only-indicator" title="This permission matches Firebase security rules and cannot be changed">🔒</span>
          </td>
          <td style="text-align:center;">
            <select 
              :value="getTestingLevel(role)"
              @change="updateTestingPermission(role, $event.target.value)"
              style="width: 100px; padding: 2px;"
            >
              <option value="none">None</option>
              <option value="partial">Partial</option>
              <option value="all">All</option>
            </select>
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

// Filter out testing-related permissions from the regular checkbox list
const ACTION_LIST = [
  PERMISSION_ACTIONS.VIEW_USERS,
  PERMISSION_ACTIONS.EDIT_USER,
  PERMISSION_ACTIONS.DELETE_USER,
  PERMISSION_ACTIONS.MANAGE_SUBJECTS,
  PERMISSION_ACTIONS.MANAGE_ROLES,
  PERMISSION_ACTIONS.VIEW_STUDENTS,
  PERMISSION_ACTIONS.EDIT_STUDENT_CM,
  PERMISSION_ACTIONS.EDIT_STUDENT_ALL
  // Note: TESTING, TESTING_ALL, TESTING_PARTIAL are handled separately
]

// Define which permissions are read-only (edit/write permissions that match Firebase rules)
const READ_ONLY_PERMISSIONS = [
  PERMISSION_ACTIONS.EDIT_USER,
  PERMISSION_ACTIONS.DELETE_USER,
  PERMISSION_ACTIONS.MANAGE_SUBJECTS,
  PERMISSION_ACTIONS.MANAGE_ROLES,
  PERMISSION_ACTIONS.EDIT_STUDENT_CM,
  PERMISSION_ACTIONS.EDIT_STUDENT_ALL
]

const ACTION_LABELS = {
  [PERMISSION_ACTIONS.VIEW_USERS]: 'View Users',
  [PERMISSION_ACTIONS.EDIT_USER]: 'Edit User',
  [PERMISSION_ACTIONS.DELETE_USER]: 'Delete User',
  [PERMISSION_ACTIONS.MANAGE_SUBJECTS]: 'Manage Subjects',
  [PERMISSION_ACTIONS.MANAGE_ROLES]: 'Manage Roles',
  [PERMISSION_ACTIONS.VIEW_STUDENTS]: 'View Students',
  [PERMISSION_ACTIONS.EDIT_STUDENT_CM]: 'Edit Students (Own Caseload)',
  [PERMISSION_ACTIONS.EDIT_STUDENT_ALL]: 'Edit All Students'
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
      // Prevent changes to read-only permissions
      if (READ_ONLY_PERMISSIONS.includes(action)) {
        console.log(`Permission ${action} is read-only and cannot be changed`)
        return
      }

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

    const isReadOnlyPermission = (action) => {
      return READ_ONLY_PERMISSIONS.includes(action)
    }

    const getTestingLevel = (role) => {
      if (!matrix[role]) return 'none'
      
      if (matrix[role].includes(PERMISSION_ACTIONS.TESTING_ALL)) {
        return 'all'
      } else if (matrix[role].includes(PERMISSION_ACTIONS.TESTING_PARTIAL)) {
        return 'partial'
      }
      return 'none'
    }

    const updateTestingPermission = (role, level) => {
      if (!matrix[role]) {
        matrix[role] = []
      }

      // Remove all testing permissions first
      const testingPermissions = [
        PERMISSION_ACTIONS.TESTING,
        PERMISSION_ACTIONS.TESTING_ALL,
        PERMISSION_ACTIONS.TESTING_PARTIAL
      ]
      
      testingPermissions.forEach(perm => {
        const index = matrix[role].indexOf(perm)
        if (index > -1) {
          matrix[role].splice(index, 1)
        }
      })

      // Add the appropriate testing permission
      if (level === 'all') {
        matrix[role].push(PERMISSION_ACTIONS.TESTING_ALL)
      } else if (level === 'partial') {
        matrix[role].push(PERMISSION_ACTIONS.TESTING_PARTIAL)
      }
      // 'none' means no testing permissions are added
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
      isReadOnlyPermission,
      getTestingLevel,
      updateTestingPermission,
      savePermissions
    }
  }
}
</script>

<style scoped>
/* Styles are in admin-panel.css */

/* Read-only permission styling */
.permissions-note {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 16px;
  color: #495057;
  font-size: 0.9em;
}

.permissions-note p {
  margin: 0;
}

.read-only {
  opacity: 0.6;
  cursor: not-allowed;
}

.read-only-indicator {
  margin-left: 4px;
  font-size: 0.8em;
  color: #666;
}

/* Enhanced table styling for permissions matrix */
.permissions-table-admin td {
  position: relative;
  padding: 8px;
  vertical-align: middle;
}

.permissions-table-admin input[type="checkbox"]:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.permissions-table-admin input[type="checkbox"]:disabled + .read-only-indicator {
  color: #999;
}
</style>
