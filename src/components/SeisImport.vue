<template>
  <div class="seis-import">
    <h3>Upload SEIS CSV</h3>
    <input type="file" ref="fileInput" accept=".csv" @change="handleFileSelect" />
    <button @click="previewFile" :disabled="!selectedFile">Preview</button>

    <div v-if="fieldOptions.length > 0" id="seis-field-options">
      <h4>Select fields to import:</h4>
      <label v-for="field in fieldOptions" :key="field">
        <input 
          type="checkbox" 
          :value="field" 
          v-model="selectedFields"
          checked 
        /> {{ field }}
      </label>
    </div>

    <div v-if="previewData.length > 0" id="seis-preview-container" style="margin-top:1rem;">
      <table border="1" cellpadding="4">
        <thead>
          <tr>
            <th v-for="field in fieldOptions" :key="field">{{ field }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in previewData" :key="index">
            <td v-for="field in fieldOptions" :key="field">{{ row[field] || '' }}</td>
          </tr>
        </tbody>
      </table>
      <p>Showing first {{ previewData.length }} of {{ parsedData.length }} rows.</p>
    </div>

    <button @click="importData" :disabled="!canImport">Import to Firestore</button>
    <p :class="['status-msg', { error: isError }]">{{ statusMessage }}</p>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { parseSeisCSVAndPreview, importFilteredSeisRecords } from '../composables/useImporters.js'

export default {
  name: 'SeisImport',
  setup() {
    const fileInput = ref(null)
    const selectedFile = ref(null)
    const parsedData = ref([])
    const fieldOptions = ref([])
    const selectedFields = ref([])
    const previewData = ref([])
    const statusMessage = ref('')
    const isError = ref(false)

    const canImport = computed(() => {
      return parsedData.value.length > 0 && selectedFields.value.length > 0
    })

    const showStatus = (message, error = false) => {
      statusMessage.value = message
      isError.value = error
      setTimeout(() => {
        statusMessage.value = ''
        isError.value = false
      }, 5000)
    }

    const handleFileSelect = (event) => {
      selectedFile.value = event.target.files[0]
    }

    const previewFile = async () => {
      const file = selectedFile.value
      if (!file) {
        showStatus('❌ Please select a CSV file.', true)
        return
      }

      showStatus('Parsing file...')
      previewData.value = []
      fieldOptions.value = []
      selectedFields.value = []

      try {
        parsedData.value = await parseSeisCSVAndPreview(file)
        showStatus(`✅ Loaded ${parsedData.value.length} rows.`)

        // Field selector
        const fields = Object.keys(parsedData.value[0])
        fieldOptions.value = fields
        selectedFields.value = [...fields] // Select all by default

        // Preview table (first 5 rows)
        previewData.value = parsedData.value.slice(0, 5)
      } catch (err) {
        showStatus(`❌ Error: ${err.message}`, true)
        console.error('SEIS Parse Error:', err)
      }
    }

    const importData = async () => {
      if (!parsedData.value.length) {
        showStatus('❌ No parsed data available.', true)
        return
      }

      if (selectedFields.value.length === 0) {
        showStatus('❌ Please select at least one field to import.', true)
        return
      }

      showStatus('Importing...')

      try {
        const count = await importFilteredSeisRecords(parsedData.value, selectedFields.value)
        showStatus(`✅ Imported ${count} records with selected fields.`)
        
        // Reset file input
        if (fileInput.value) {
          fileInput.value.value = ''
        }
        selectedFile.value = null
        parsedData.value = []
        fieldOptions.value = []
        selectedFields.value = []
        previewData.value = []
      } catch (err) {
        showStatus(`❌ Import failed: ${err.message}`, true)
        console.error('SEIS Import Error:', err)
      }
    }

    return {
      fileInput,
      selectedFile,
      parsedData,
      fieldOptions,
      selectedFields,
      previewData,
      statusMessage,
      isError,
      canImport,
      handleFileSelect,
      previewFile,
      importData
    }
  }
}
</script>

<style scoped>
/* Styles are in admin-panel.css */
</style> 