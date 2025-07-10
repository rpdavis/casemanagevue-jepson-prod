<template>
  <div>
    <h2>Edit Users</h2>
    
    <!-- Search Bar -->
    <div class="admin-form-row">
      <input 
        type="text" 
        v-model="searchTerm" 
        placeholder="Search by name or email"
        @input="debouncedHandleSearch"
      />
      <select v-model="searchType" @change="handleSearch">
        <option value="name">Name</option>
        <option value="email">Email</option>
      </select>
      <button @click="deleteAllUsers" style="margin-left: auto; background: #f44336; color: #fff; padding: 0.3rem 0.8rem; border: none; border-radius: 4px; cursor: pointer;">
        Delete All Users
      </button>
    </div>

    <!-- Status Message -->
    <div :class="['admin-status-msg', { error: isError }]">
      {{ statusMessage }}
    </div>

    <!-- Users Table -->
    <div>
      <table class="user-admin-table users-table striped">
        <thead>
          <tr>
            <th>Name</th>
            <th>Title</th>
            <th>Email</th>
            <th>Role</th>
            <th>Provider Type</th>
            <th style="text-align:center;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="users.length === 0">
            <td colspan="5">No users found.</td>
          </tr>
          <tr 
            v-for="user in users" 
            :key="user.id"
            :class="{ 'active-row': activeRowId === user.id }"
            :data-userid="user.id"
          >
            <td>
              <input 
                type="text" 
                :value="user.name || ''" 
                class="editable-input"
                :disabled="activeRowId !== user.id"
                @input="updateUserField(user.id, 'name', $event.target.value)"
              />
            </td>
            <td>
              <input 
                type="text" 
                :value="user.title || ''" 
                class="editable-input"
                :disabled="activeRowId !== user.id"
                @input="updateUserField(user.id, 'title', $event.target.value)"
              />
            </td>
            <td>{{ user.email }}</td>
            <td>
              <select 
                class="editable-select"
                :disabled="activeRowId !== user.id"
                :value="user.role"
                @change="updateUserField(user.id, 'role', $event.target.value)"
              >
                <option v-for="role in validRoles" :key="role" :value="role">
                  {{ role.replace(/_/g, ' ') }}
                </option>
              </select>
            </td>
            <td v-if="providersLoaded">
              <span v-if="activeRowId !== user.id">
                {{ user.provider || '—' }}
              </span>
              <span v-else>
                <select v-model="editingUser.provider">
                  <option value="">None</option>
                  <option v-for="abbr in serviceProviders" :key="abbr" :value="abbr">
                    {{ abbr }}
                  </option>
                </select>
              </span>
            </td>
            <td v-else>
              <span>Loading...</span>
            </td>
            <td class="action-btns">
              <button v-if="activeRowId !== user.id" class="edit-btn" @click="startEdit(user.id)">
                ✏️
              </button>
              <template v-else>
                <button class="save-btn" @click="saveUser(user.id)">💾</button>
                <button class="cancel-btn" @click="cancelEdit">❌</button>
                <button class="delete-btn" @click="deleteUser(user.id)">🗑️</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="admin-pagination">
      <button 
        @click="loadPreviousPage" 
        :disabled="currentPage === 1"
      >
        Previous
      </button>
      <span>Page {{ currentPage }}</span>
      <button 
        @click="loadNextPage" 
        :disabled="!hasNextPage"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore'
import { VALID_ROLES } from '../config/roles.js'
import { useAppSettings } from '@/composables/useAppSettings'

const PAGE_SIZE = 20

export default {
  name: 'UserTable',
  setup() {
    const db = getFirestore()
    
    const users = ref([])
    const currentPage = ref(1)
    const searchType = ref('name')
    const searchTerm = ref('')
    const activeRowId = ref(null)
    const statusMessage = ref('')
    const isError = ref(false)
    const hasNextPage = ref(false)
    const usersPageDocs = ref([])
    const editingUser = ref(null)

    const validRoles = VALID_ROLES
    const appSettingsComposable = useAppSettings()
    const appSettings = appSettingsComposable.appSettings
    const loadAppSettings = appSettingsComposable.loadAppSettings

    // Debounced search implementation
    let debounceTimer = null
    const debouncedHandleSearch = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        handleSearch()
      }, 300) // 300ms delay to prevent rapid API calls
    }

    const providersLoaded = computed(() =>
      Array.isArray(appSettings.value?.serviceProviders) && appSettings.value.serviceProviders.length > 0
    )

    const serviceProviders = computed(() => {
      return appSettings.value?.serviceProviders || []
    })

    const showStatus = (message, error = false) => {
      statusMessage.value = message
      isError.value = error
      setTimeout(() => {
        statusMessage.value = ''
        isError.value = false
      }, 3000)
    }

    const handleSearch = () => {
      currentPage.value = 1
      fetchUsers()
    }

    const fetchUsers = async (pageDirection = 'first') => {
      showStatus('')
      const usersRef = collection(db, 'users')
      let q

      // Client-side name search
      if (searchTerm.value && searchType.value === 'name') {
        const snapAll = await getDocs(query(usersRef, orderBy('name'), limit(1000)))
        const filtered = snapAll.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(u => (u.name || '').toLowerCase().includes(searchTerm.value.toLowerCase()))
        activeRowId.value = null
        users.value = filtered
        hasNextPage.value = false
        return
      }

      // Email or default search
      if (searchTerm.value && searchType.value === 'email') {
        q = query(
          usersRef,
          orderBy('email'),
          where('email', '>=', searchTerm.value),
          where('email', '<=', searchTerm.value + '\uf8ff'),
          limit(PAGE_SIZE)
        )
      } else if (!searchTerm.value) {
        q = query(usersRef, orderBy('name'), limit(PAGE_SIZE))
      } else {
        q = query(
          usersRef,
          orderBy('name'),
          where('name', '>=', searchTerm.value),
          where('name', '<=', searchTerm.value + '\uf8ff'),
          limit(PAGE_SIZE)
        )
      }

      // Cursor-based paging
      if (pageDirection === 'next' && usersPageDocs.value.length) {
        q = query(
          usersRef,
          orderBy(searchType.value),
          startAfter(usersPageDocs.value[usersPageDocs.value.length - 1]),
          limit(PAGE_SIZE)
        )
      }

      const snap = await getDocs(q)
      usersPageDocs.value = snap.docs
      activeRowId.value = null
      users.value = usersPageDocs.value.map(d => ({ id: d.id, ...d.data() }))
      hasNextPage.value = snap.size === PAGE_SIZE
    }

    const startEdit = (userId) => {
      if (activeRowId.value) return
      activeRowId.value = userId
      editingUser.value = { ...users.value.find(u => u.id === userId) }
    }

    const cancelEdit = () => {
      activeRowId.value = null
      editingUser.value = null
      fetchUsers()
    }

    const updateUserField = (userId, field, value) => {
      if (editingUser.value && editingUser.value.id === userId) {
        editingUser.value[field] = value
      }
    }

    const saveUser = async (userId) => {
      if (!editingUser.value || editingUser.value.id !== userId) return

      try {
        // Filter out undefined values and prepare the update data
        const updateData = {}
        if (editingUser.value.name !== undefined) updateData.name = editingUser.value.name?.trim() || null
        if (editingUser.value.title !== undefined) updateData.title = editingUser.value.title?.trim() || null
        if (editingUser.value.role !== undefined) updateData.role = editingUser.value.role
        if (editingUser.value.provider !== undefined) updateData.provider = editingUser.value.provider || null

        await updateDoc(doc(db, 'users', userId), updateData)
        showStatus('✅ User updated.')
        activeRowId.value = null
        editingUser.value = null
        fetchUsers()
      } catch (error) {
        console.error('Error updating user:', error)
        showStatus(`❌ Error updating user: ${error.message}`, true)
      }
    }

    const deleteUser = async (userId) => {
      if (!confirm('Are you sure you want to delete this user?')) return

      try {
        await deleteDoc(doc(db, 'users', userId))
        showStatus('✅ User deleted.')
        activeRowId.value = null
        editingUser.value = null
        fetchUsers()
      } catch (error) {
        console.error('Error deleting user:', error)
        showStatus(`❌ Error deleting user: ${error.message}`, true)
      }
    }

    const deleteAllUsers = async () => {
      const confirmation = prompt('Type DELETE ALL USERS to confirm:')
      if (confirmation !== 'DELETE ALL USERS') return

      try {
        const snapAll = await getDocs(collection(db, 'users'))
        await Promise.all(snapAll.docs.map(d => deleteDoc(doc(db, 'users', d.id))))
        showStatus('✅ All users deleted.')
        currentPage.value = 1
        fetchUsers()
      } catch (error) {
        console.error('Error deleting all users:', error)
        showStatus(`❌ Error deleting all users: ${error.message}`, true)
      }
    }

    const loadNextPage = () => {
      currentPage.value++
      fetchUsers('next')
    }

    const loadPreviousPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--
        fetchUsers()
      }
    }

    const getProviderLabel = (abbr) => {
      if (!abbr) return ''
      const allProviders = [
        ...(appSettings.value?.serviceProviders || []),
        ...(appSettings.value?.customServiceProviders || [])
      ]
      const defaultList = [
        { name: 'Speech-Language Therapy', abbreviation: 'SLP' },
        { name: 'Occupational Therapy', abbreviation: 'OT' },
        { name: 'Physical Therapy', abbreviation: 'PT' },
        { name: 'School Counseling', abbreviation: 'SC' },
        { name: 'School-Based Mental Health Services', abbreviation: 'MH' },
        { name: 'Adapted PE', abbreviation: 'APE' },
        { name: 'Assistive Technology', abbreviation: 'AT' },
        { name: 'Deaf/Hard of Hearing', abbreviation: 'DHH' },
        { name: 'Vision Services', abbreviation: 'VI' },
        { name: 'Orientation & Mobility', abbreviation: 'OM' },
        { name: 'Other', abbreviation: 'OTHER' }
      ]
      const found = defaultList.find(p => p.abbreviation === abbr)
      return found ? `${found.name} (${found.abbreviation})` : abbr
    }

    onMounted(async () => {
      await loadAppSettings()
      fetchUsers()
    })

    // Cleanup on unmount
    onUnmounted(() => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    })

    return {
      users,
      currentPage,
      searchType,
      searchTerm,
      activeRowId,
      statusMessage,
      isError,
      hasNextPage,
      validRoles,
      handleSearch,
      debouncedHandleSearch,
      startEdit,
      cancelEdit,
      updateUserField,
      saveUser,
      deleteUser,
      deleteAllUsers,
      loadNextPage,
      loadPreviousPage,
      getProviderLabel,
      appSettings,
      editingUser,
      providersLoaded,
      serviceProviders
    }
  }
}
</script>

<style scoped>
/* Styles are in admin-panel.css */
</style>
