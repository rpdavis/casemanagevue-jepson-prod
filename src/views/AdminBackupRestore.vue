<template>
  <div class="admin-backup-restore">
    <div class="header">
      <h1>Backup & Restore</h1>
      <p>Manage database backups and restore data from JSON files</p>
    </div>

    <div class="content">
      <!-- Backup Section -->
      <div class="section">
        <h2>Create Backup</h2>
        <div class="backup-options">
          <div class="option-group">
            <label>Collections to backup:</label>
            <div class="checkbox-group">
              <label v-for="collection in collections" :key="collection.id" class="checkbox">
                <input 
                  type="checkbox" 
                  v-model="selectedCollections" 
                  :value="collection.id"
                  :disabled="isBackingUp"
                >
                {{ collection.name }}
              </label>
            </div>
          </div>
          
          <div class="option-group">
            <label>Backup name (optional):</label>
            <input 
              type="text" 
              v-model="backupName" 
              placeholder="e.g., backup-2024-01-15"
              :disabled="isBackingUp"
            >
          </div>

          <button 
            @click="createBackup" 
            :disabled="isBackingUp || selectedCollections.length === 0"
            class="btn btn-primary"
          >
            <span v-if="isBackingUp">Creating Backup...</span>
            <span v-else>Create Backup</span>
          </button>
        </div>
      </div>

      <!-- Restore Section -->
      <div class="section">
        <h2>Restore from Backup</h2>
        <div class="restore-options">
          <div class="file-upload">
            <label>Select JSON backup file:</label>
            <input 
              type="file" 
              @change="handleFileSelect" 
              accept=".json"
              :disabled="isRestoring"
              ref="fileInput"
            >
            <p v-if="selectedFile" class="file-info">
              Selected: {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
            </p>
          </div>

          <div class="option-group" v-if="backupData">
            <label>Collections in backup:</label>
            <div class="backup-info">
              <div v-for="(collection, name) in backupData.collections" :key="name" class="collection-info">
                <span class="collection-name">{{ name }}:</span>
                <span class="collection-count">{{ Array.isArray(collection) ? collection.length : '1' }} items</span>
              </div>
            </div>
          </div>

          <div class="option-group" v-if="backupData">
            <label>Restore options:</label>
            <div class="checkbox-group">
              <label class="checkbox">
                <input 
                  type="checkbox" 
                  v-model="restoreOptions.overwrite"
                  :disabled="isRestoring"
                >
                Overwrite existing data
              </label>
              <label class="checkbox">
                <input 
                  type="checkbox" 
                  v-model="restoreOptions.validate"
                  :disabled="isRestoring"
                >
                Validate data before restore
              </label>
            </div>
          </div>

          <button 
            @click="restoreBackup" 
            :disabled="isRestoring || !selectedFile || !backupData"
            class="btn btn-warning"
          >
            <span v-if="isRestoring">Restoring...</span>
            <span v-else>Restore Backup</span>
          </button>
        </div>
      </div>

      <!-- Backup History -->
      <div class="section">
        <h2>Backup History</h2>
        <div class="backup-list" v-if="backups.length > 0">
          <div v-for="backup in backups" :key="backup.id" class="backup-item">
            <div class="backup-info">
              <h3>{{ backup.name || 'Unnamed Backup' }}</h3>
              <p>Created: {{ formatDate(backup.createdAt) }}</p>
              <p>Size: {{ formatFileSize(backup.size) }}</p>
              <p>Collections: {{ backup.collections.join(', ') }}</p>
            </div>
            <div class="backup-actions">
              <button @click="downloadBackup(backup)" class="btn btn-secondary">Download</button>
              <button @click="deleteBackup(backup.id)" class="btn btn-danger">Delete</button>
            </div>
          </div>
        </div>
        <p v-else class="no-backups">No backups found</p>
      </div>
    </div>

    <!-- Status Messages -->
    <div v-if="statusMessage" :class="['status-message', statusType]">
      {{ statusMessage }}
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { db } from '@/firebase'
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy, limit } from 'firebase/firestore'

export default {
  name: 'AdminBackupRestore',
  setup() {
    const collections = ref([
      { id: 'users', name: 'Users' },
      { id: 'students', name: 'Students' },
      { id: 'appSettings', name: 'App Settings' },
      { id: 'aideSchedules', name: 'Aide Schedules' },
      { id: 'aideAssignments', name: 'Aide Assignments' }
    ])

    const selectedCollections = ref(['users', 'students', 'appSettings'])
    const backupName = ref('')
    const isBackingUp = ref(false)
    const isRestoring = ref(false)
    const selectedFile = ref(null)
    const backupData = ref(null)
    const backups = ref([])
    const statusMessage = ref('')
    const statusType = ref('info')

    const restoreOptions = reactive({
      overwrite: false,
      validate: true
    })

    const fileInput = ref(null)

    // Load existing backups
    const loadBackups = async () => {
      try {
        const backupsRef = collection(db, 'backups')
        const q = query(backupsRef, orderBy('createdAt', 'desc'), limit(20))
        const snapshot = await getDocs(q)
        backups.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      } catch (error) {
        console.error('Error loading backups:', error)
        showStatus('Error loading backups', 'error')
      }
    }

    // Create backup
    const createBackup = async () => {
      if (selectedCollections.value.length === 0) {
        showStatus('Please select at least one collection', 'error')
        return
      }

      isBackingUp.value = true
      showStatus('Creating backup...', 'info')

      try {
        const backup = {
          metadata: {
            version: '1.0',
            createdAt: new Date().toISOString(),
            createdBy: 'admin',
            description: backupName.value || 'Manual backup'
          },
          collections: {}
        }

        // Collect data from selected collections
        for (const collectionId of selectedCollections.value) {
          const collectionRef = collection(db, collectionId)
          const snapshot = await getDocs(collectionRef)
          
          if (collectionId === 'appSettings') {
            // App settings is a single document
            backup.collections[collectionId] = snapshot.docs[0]?.data() || {}
          } else {
            // Other collections are arrays of documents
            backup.collections[collectionId] = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
          }
        }

        // Save backup to Firestore
        const backupId = `backup_${Date.now()}`
        const backupRef = doc(db, 'backups', backupId)
        await setDoc(backupRef, {
          name: backupName.value || `Backup ${new Date().toLocaleDateString()}`,
          createdAt: new Date().toISOString(),
          collections: selectedCollections.value,
          size: JSON.stringify(backup).length,
          data: backup
        })

        backupName.value = ''
        await loadBackups()
        showStatus('Backup created successfully!', 'success')
      } catch (error) {
        console.error('Error creating backup:', error)
        showStatus('Error creating backup: ' + error.message, 'error')
      } finally {
        isBackingUp.value = false
      }
    }

    // Handle file selection
    const handleFileSelect = (event) => {
      const file = event.target.files[0]
      if (!file) return

      selectedFile.value = file
      backupData.value = null

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          if (data.metadata && data.collections) {
            backupData.value = data
            showStatus('Backup file loaded successfully', 'success')
          } else {
            showStatus('Invalid backup file format', 'error')
          }
        } catch (error) {
          showStatus('Error parsing JSON file', 'error')
        }
      }
      reader.readAsText(file)
    }

    // Restore backup
    const restoreBackup = async () => {
      if (!selectedFile.value || !backupData.value) {
        showStatus('Please select a valid backup file', 'error')
        return
      }

      if (!restoreOptions.overwrite) {
        const confirmed = confirm('This will add new data without overwriting existing records. Continue?')
        if (!confirmed) return
      } else {
        const confirmed = confirm('This will overwrite existing data. This action cannot be undone. Continue?')
        if (!confirmed) return
      }

      isRestoring.value = true
      showStatus('Restoring backup...', 'info')

      try {
        for (const [collectionName, data] of Object.entries(backupData.value.collections)) {
          if (collectionName === 'appSettings') {
            // Restore app settings
            const settingsRef = doc(db, 'appSettings', 'default')
            await setDoc(settingsRef, data, { merge: !restoreOptions.overwrite })
          } else {
            // Restore other collections
            const collectionRef = collection(db, collectionName)
            
            if (Array.isArray(data)) {
              for (const item of data) {
                const docRef = doc(collectionRef, item.id)
                if (restoreOptions.overwrite) {
                  await setDoc(docRef, item)
                } else {
                  await setDoc(docRef, item, { merge: true })
                }
              }
            }
          }
        }

        showStatus('Backup restored successfully!', 'success')
        selectedFile.value = null
        backupData.value = null
        if (fileInput.value) {
          fileInput.value.value = ''
        }
      } catch (error) {
        console.error('Error restoring backup:', error)
        showStatus('Error restoring backup: ' + error.message, 'error')
      } finally {
        isRestoring.value = false
      }
    }

    // Download backup
    const downloadBackup = (backup) => {
      const dataStr = JSON.stringify(backup.data, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${backup.name || 'backup'}.json`
      link.click()
      URL.revokeObjectURL(url)
    }

    // Delete backup
    const deleteBackup = async (backupId) => {
      const confirmed = confirm('Are you sure you want to delete this backup?')
      if (!confirmed) return

      try {
        await deleteDoc(doc(db, 'backups', backupId))
        await loadBackups()
        showStatus('Backup deleted successfully', 'success')
      } catch (error) {
        console.error('Error deleting backup:', error)
        showStatus('Error deleting backup', 'error')
      }
    }

    // Utility functions
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleString()
    }

    const showStatus = (message, type = 'info') => {
      statusMessage.value = message
      statusType.value = type
      setTimeout(() => {
        statusMessage.value = ''
      }, 5000)
    }

    onMounted(() => {
      loadBackups()
    })

    return {
      collections,
      selectedCollections,
      backupName,
      isBackingUp,
      isRestoring,
      selectedFile,
      backupData,
      backups,
      statusMessage,
      statusType,
      restoreOptions,
      fileInput,
      createBackup,
      handleFileSelect,
      restoreBackup,
      downloadBackup,
      deleteBackup,
      formatFileSize,
      formatDate
    }
  }
}
</script>

<style scoped>
.admin-backup-restore {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  margin-bottom: 30px;
  text-align: center;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.header p {
  color: #7f8c8d;
  font-size: 16px;
}

.section {
  background: white;
  border-radius: 8px;
  padding: 25px;
  margin-bottom: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.section h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
}

.backup-options,
.restore-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-group label {
  font-weight: 600;
  color: #2c3e50;
}

.checkbox-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

input[type="text"],
input[type="file"] {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.file-info {
  margin-top: 5px;
  color: #27ae60;
  font-size: 14px;
}

.backup-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  border-left: 4px solid #3498db;
}

.collection-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.collection-name {
  font-weight: 600;
}

.collection-count {
  color: #7f8c8d;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  max-width: 200px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-warning {
  background: #f39c12;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #e67e22;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
  margin-right: 10px;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
}

.backup-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.backup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.backup-info h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.backup-info p {
  margin: 5px 0;
  color: #7f8c8d;
  font-size: 14px;
}

.backup-actions {
  display: flex;
  gap: 10px;
}

.no-backups {
  text-align: center;
  color: #7f8c8d;
  font-style: italic;
}

.status-message {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 6px;
  color: white;
  font-weight: 600;
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

.status-message.success {
  background: #27ae60;
}

.status-message.error {
  background: #e74c3c;
}

.status-message.info {
  background: #3498db;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .backup-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .backup-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .checkbox-group {
    grid-template-columns: 1fr;
  }
}
</style> 