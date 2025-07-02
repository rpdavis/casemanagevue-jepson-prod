<template>
  <div class="add-user-wrapper">
    <div class="add-single">
      <h3>Add Single User</h3>
      <form @submit.prevent="addSingleUser" class="form-grid">
        <div>
          <label>
            Name:
            <input
              type="text"
              v-model="singleUser.name"
              required
              autocomplete="off"
              data-lpignore="true"
            />
          </label>
        </div>
        <div>
          <label>
            Email:
            <input
              type="email"
              v-model="singleUser.email"
              required
              autocomplete="off"
              data-lpignore="true"
            />
          </label>
        </div>
        <div>
          <label>
            Role:
            <select v-model="singleUser.role" required>
              <option value="" disabled>Select role...</option>
              <option v-for="role in validRoles" :key="role" :value="role">
                {{ role }}
              </option>
            </select>
          </label>
        </div>
        <div v-if="providerOptions.length > 0">
          <label>
            Provider Type:
            <select v-model="singleUser.provider">
              <option value="">None</option>
              <option v-for="provider in providerOptions" :key="provider.abbreviation" :value="provider.abbreviation">
                {{ provider.name }} ({{ provider.abbreviation }})
              </option>
            </select>
          </label>
        </div>
        <button type="submit">Add User</button>
      </form>
    </div>

    <div class="add-bulk">
      <h3>Bulk Upload Users</h3>
      <div>
        <input
          type="file"
          ref="bulkFileInput"
          accept=".csv, .xls, .xlsx"
          @change="handleFileSelect"
        />
        <button @click="uploadBulkUsers" :disabled="!selectedFile">
          Upload Users
        </button>
      </div>
      <h4>Example Formatting</h4>
      <div>File needs to be in .csv, .xls, .xlsx format, like an Excel spreadsheet.</div>
      <div>
        <img
          src="../assets/images/bulk_upload_ex.png"
          alt="Bulk User Upload Example Format"
          style="max-width:100%; height:auto;"
        />
      </div>
    </div>

    <!-- Status Messages -->
    <div v-if="statusMessage" :class="['status-msg', { error: isError }]">
      {{ statusMessage }}
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase.js'
import { getFirestore, collection, addDoc } from 'firebase/firestore'
import { VALID_ROLES, isApprovedRole } from '../config/roles.js'
import { useAppSettings } from '@/composables/useAppSettings'

export default {
  name: 'UserAddForm',
  setup() {
    const addUserWithRoleCallable = httpsCallable(functions, 'addUserWithRole')
    const db = getFirestore()

    const singleUser = reactive({
      name: '',
      email: '',
      role: '',
      provider: ''
    })

    const selectedFile = ref(null)
    const statusMessage = ref('')
    const isError = ref(false)
    const bulkFileInput = ref(null)

    const validRoles = VALID_ROLES

    const { appSettings, loadAppSettings } = useAppSettings()

    const providerOptions = computed(() => {
      if (appSettings && appSettings.value && appSettings.value.serviceProviders) {
        const DEFAULT_SERVICE_PROVIDERS = [
          { name: 'Speech-Language Therapy', abbreviation: 'SLP' },
          { name: 'Occupational Therapy', abbreviation: 'OT' },
          { name: 'Physical Therapy', abbreviation: 'PT' },
          { name: 'School Counseling', abbreviation: 'SC' },
          { name: 'School-Based Mental Health Services', abbreviation: 'MH' },
          { name: 'Transportation', abbreviation: 'TR' },
          { name: 'Audiology Services', abbreviation: 'AUD' },
          { name: 'Vision Services', abbreviation: 'VI' },
          { name: 'Assistive Technology', abbreviation: 'AT' },
          { name: 'Deaf and Hard of Hearing Services', abbreviation: 'DHH' },
          { name: 'Orientation and Mobility', abbreviation: 'O&M' },
          { name: 'Behavioral Intervention Services', abbreviation: 'BIS' },
          { name: 'Health/Nursing Services', abbreviation: 'HN' },
          { name: 'Social Work Services', abbreviation: 'SW' }
        ]
        return appSettings.value.serviceProviders.map(abbr =>
          DEFAULT_SERVICE_PROVIDERS.find(p => p.abbreviation === abbr) || { name: abbr, abbreviation: abbr }
        )
      }
      return []
    })

    const showStatus = (message, error = false) => {
      statusMessage.value = message
      isError.value = error
      setTimeout(() => {
        statusMessage.value = ''
        isError.value = false
      }, 5000)
    }

    const createUserInFirestore = async (name, email, role, provider) => {
      try {
        const userData = {
          name: name,
          email: email,
          role: role,
          provider: provider,
          createdAt: new Date(),
          status: 'active'
        }
        const docRef = await addDoc(collection(db, 'users'), userData)
        return { success: true, userId: docRef.id }
      } catch (error) {
        throw error
      }
    }

    const addUserToFirestore = async (name, email, role, provider) => {
      try {
        try {
          await addUserWithRoleCallable({ name, email, role, provider })
          return { success: true, method: 'cloud-function' }
        } catch (cloudError) {
          await createUserInFirestore(name, email, role, provider)
          return { success: true, method: 'firestore' }
        }
      } catch (error) {
        return { success: false, error: error.message }
      }
    }

    const addSingleUser = async () => {
      if (!singleUser.name || !singleUser.email || !singleUser.role) {
        showStatus('Please fill in all fields', true)
        return
      }
      if (!isApprovedRole(singleUser.role)) {
        showStatus('Invalid role selected', true)
        return
      }
      const result = await addUserToFirestore(
        singleUser.name,
        singleUser.email,
        singleUser.role,
        singleUser.provider
      )
      if (result.success) {
        showStatus(`User ${singleUser.name} added successfully!`)
        singleUser.name = ''
        singleUser.email = ''
        singleUser.role = ''
        singleUser.provider = ''
      } else {
        showStatus(`Error adding user: ${result.error}`, true)
      }
    }

    // Dummy handlers for bulk upload (implement as needed)
    const handleFileSelect = () => {}
    const uploadBulkUsers = () => {}

    onMounted(async () => {
      await loadAppSettings()
    })

    return {
      singleUser,
      validRoles,
      providerOptions,
      addSingleUser,
      selectedFile,
      statusMessage,
      isError,
      bulkFileInput,
      handleFileSelect,
      uploadBulkUsers,
      appSettings
    }
  }
}
</script>

<style scoped>
/* Add your styles here */
</style>