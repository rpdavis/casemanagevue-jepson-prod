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
import { ref, reactive } from 'vue'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase.js'
import { getFirestore, doc, setDoc, collection, addDoc } from 'firebase/firestore'
import { VALID_ROLES, isApprovedRole } from '../config/roles.js'

export default {
  name: 'UserAddForm',
  setup() {
    const addUserWithRoleCallable = httpsCallable(functions, 'addUserWithRole')
    const db = getFirestore()
    
    const singleUser = reactive({
      name: '',
      email: '',
      role: ''
    })

    const selectedFile = ref(null)
    const statusMessage = ref('')
    const isError = ref(false)
    const bulkFileInput = ref(null)

    const validRoles = VALID_ROLES

    const showStatus = (message, error = false) => {
      statusMessage.value = message
      isError.value = error
      setTimeout(() => {
        statusMessage.value = ''
        isError.value = false
      }, 5000)
    }

    // Simple function to create user directly in Firestore
    const createUserInFirestore = async (name, email, role) => {
      try {
        // Create a simple user document in Firestore
        const userData = {
          name: name,
          email: email,
          role: role,
          createdAt: new Date(),
          status: 'active'
        }

        // Add to users collection
        const docRef = await addDoc(collection(db, 'users'), userData)
        
        console.log(`✅ User created successfully: ${email} (ID: ${docRef.id})`)
        return { success: true, userId: docRef.id }
      } catch (error) {
        console.error('❌ Error creating user in Firestore:', error)
        throw error
      }
    }

    const addUserToFirestore = async (name, email, role, lineNumber) => {
      try {
        // Try Cloud Function first
        try {
          const result = await addUserWithRoleCallable({ name, email, role })
          console.log(`✅ User created via Cloud Function: ${email}`)
          return { success: true, method: 'cloud-function' }
        } catch (cloudError) {
          console.log('Cloud function failed, trying local creation:', cloudError)
          
          // Fallback to local Firestore creation
          const result = await createUserInFirestore(name, email, role)
          return { success: true, method: 'firestore' }
        }
      } catch (error) {
        console.error(`Line ${lineNumber}: Error adding user "${email}":`, error)
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
        1
      )

      if (result.success) {
        showStatus(`User ${singleUser.name} added successfully!`)
        // Reset form
        singleUser.name = ''
        singleUser.email = ''
        singleUser.role = ''
      } else {
        showStatus(`Error adding user: ${result.error}`, true)
      }
    }

    const uploadBulkUsers = async () => {
      console.log('🚀 Upload button clicked!')
      console.log('Selected file:', selectedFile.value)
      
      if (!selectedFile.value) {
        console.log('❌ No file selected')
        showStatus('Please select a CSV file', true)
        return
      }

      console.log('📁 File selected:', selectedFile.value.name)
      console.log('📁 File size:', selectedFile.value.size)

      const reader = new FileReader()
      reader.onload = async (e) => {
        console.log('📖 File read successfully')
        try {
          const csv = e.target.result
          console.log('📄 CSV content (first 200 chars):', csv.substring(0, 200))
          
          const lines = csv.split('\n')
          console.log('📊 Number of lines:', lines.length)
          
          const headers = lines[0].split(',').map(h => h.trim())
          console.log('📋 Headers found:', headers)
          
          // Validate headers
          const requiredHeaders = ['name', 'email', 'role']
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
          
          if (missingHeaders.length > 0) {
            console.log('❌ Missing headers:', missingHeaders)
            showStatus(`Missing required headers: ${missingHeaders.join(', ')}`, true)
            return
          }

          console.log('✅ Headers validation passed')
          let successCount = 0
          let errorCount = 0

          // Process each line (skip header)
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue

            const values = line.split(',').map(v => v.trim())
            const name = values[headers.indexOf('name')]
            const email = values[headers.indexOf('email')]
            const role = values[headers.indexOf('role')]

            console.log(`📝 Processing line ${i + 1}:`, { name, email, role })

            if (!name || !email || !role) {
              console.log(`Line ${i + 1}: Skipping incomplete row`)
              continue
            }

            if (!isApprovedRole(role)) {
              console.log(`Line ${i + 1}: Invalid role "${role}" for ${email}`)
              errorCount++
              continue
            }

            console.log(`🔄 Adding user: ${name} (${email}) with role: ${role}`)
            const result = await addUserToFirestore(name, email, role, i + 1)
            
            if (result.success) {
              console.log(`✅ User added successfully: ${email}`)
              successCount++
            } else {
              console.log(`❌ Failed to add user: ${email} - ${result.error}`)
              errorCount++
            }
          }

          console.log(`🎉 Bulk upload complete! ${successCount} users added, ${errorCount} errors`)
          showStatus(`Bulk upload complete! ${successCount} users added, ${errorCount} errors`)
          selectedFile.value = null
          if (bulkFileInput.value) {
            bulkFileInput.value.value = ''
          }

        } catch (error) {
          console.error('❌ Error processing CSV:', error)
          showStatus('Error processing CSV file', true)
        }
      }

      reader.onerror = (error) => {
        console.error('❌ FileReader error:', error)
        showStatus('Error reading file', true)
      }

      console.log('📖 Starting to read file...')
      reader.readAsText(selectedFile.value)
    }

    const handleFileSelect = (event) => {
      selectedFile.value = event.target.files[0]
    }

    return {
      singleUser,
      selectedFile,
      statusMessage,
      isError,
      bulkFileInput,
      validRoles,
      addSingleUser,
      uploadBulkUsers,
      handleFileSelect
    }
  }
}
</script>

<style scoped>
/* Styles are in admin-panel.css */
</style>

