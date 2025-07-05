<!-- src/views/TestingView.vue -->
<template>
  <div class="testing-view">
    <h2>App Settings Testing</h2>
    
    <div class="test-section">
      <h3>App Settings Status</h3>
      <div class="status-grid">
        <div class="status-item">
          <strong>Loading:</strong> {{ loading ? 'Yes' : 'No' }}
        </div>
        <div class="status-item">
          <strong>Error:</strong> {{ error || 'None' }}
        </div>
        <div class="status-item">
          <strong>Loaded:</strong> {{ appSettings && Object.keys(appSettings).length > 0 ? 'Yes' : 'No' }}
        </div>
      </div>
    </div>

    <div class="test-section" v-if="appSettings">
      <h3>Current Settings</h3>
      <div class="settings-display">
        <div class="setting-group">
          <h4>Grades ({{ appSettings.grades?.length || 0 }})</h4>
          <div class="setting-values">
            {{ appSettings.grades?.join(', ') || 'None configured' }}
          </div>
        </div>
        
        <div class="setting-group">
          <h4>Class Services ({{ appSettings.classServices?.length || 0 }})</h4>
          <div class="setting-values">
            <div v-for="service in appSettings.classServices" :key="service.name" class="service-item">
              <strong>{{ service.name }}:</strong> 
              {{ service.enabledSubcategories?.join(', ') || 'None enabled' }}
            </div>
          </div>
        </div>
        
        <div class="setting-group">
          <h4>Service Providers ({{ appSettings.serviceProviders?.length || 0 }})</h4>
          <div class="setting-values">
            {{ appSettings.serviceProviders?.join(', ') || 'None configured' }}
          </div>
        </div>
        
        <div class="setting-group">
          <h4>Periods</h4>
          <div class="setting-values">
            <strong>Number:</strong> {{ appSettings.numPeriods || 0 }}<br>
            <strong>Labels:</strong> {{ appSettings.periodLabels?.join(', ') || 'None' }}
          </div>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h3>Test Actions</h3>
      <div class="action-buttons">
        <button @click="reloadSettings" :disabled="loading" class="btn btn-primary">
          {{ loading ? 'Loading...' : 'Reload Settings' }}
        </button>
        <button @click="resetSettings" :disabled="loading" class="btn btn-secondary">
          Reset to Defaults
        </button>
      </div>
    </div>

    <div class="test-section">
      <h3>Component Integration Test</h3>
      <div class="integration-test">
        <p>This section tests if the StudentForm can access app settings:</p>
        <button @click="showTestForm = !showTestForm" class="btn btn-primary">
          {{ showTestForm ? 'Hide' : 'Show' }} Test Student Form
        </button>
        
        <div v-if="showTestForm" class="test-form-container">
          <StudentForm 
            :users="{ userRoles: {} }" 
            mode="new"
            @close="showTestForm = false"
            @saved="handleTestSaved"
          />
        </div>
      </div>
    </div>

    <div class="test-section">
      <h3>Migration Tools</h3>
      <div class="migration-controls">
        <button @click="runMigration" :disabled="migrationRunning" class="btn btn-warning">
          {{ migrationRunning ? 'Migrating...' : 'Migrate Student IDs' }}
        </button>
        <button @click="verifyMigration" :disabled="verificationRunning" class="btn btn-secondary">
          {{ verificationRunning ? 'Verifying...' : 'Verify Migration' }}
        </button>
      </div>
      <div v-if="migrationResult" class="migration-result">
        <h4>Migration Result:</h4>
        <pre>{{ JSON.stringify(migrationResult, null, 2) }}</pre>
      </div>
    </div>

    <div class="test-section">
      <h3>SSID Resolution Test</h3>
      <div class="ssid-test-controls">
        <button @click="testSSIDResolution" :disabled="ssidTestRunning" class="btn btn-primary">
          {{ ssidTestRunning ? 'Testing...' : 'Test SSID Resolution' }}
        </button>
        <button @click="clearSSIDTest" class="btn btn-secondary">
          Clear Results
        </button>
      </div>
      <div v-if="ssidTestResult" class="ssid-test-result">
        <h4>SSID Resolution Test Result:</h4>
        <pre>{{ JSON.stringify(ssidTestResult, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAppSettings } from '@/composables/useAppSettings'
import StudentForm from '@/components/students/StudentForm.vue'
import { migrateStudentIds, verifyMigration as verifyMigrationUtil } from '@/utils/migrateStudentIds'
import { mapAeriesField, mapSeisField } from '@/composables/useImporters'

const { appSettings, loadAppSettings, resetAppSettings, loading, error } = useAppSettings()
const showTestForm = ref(false)
const migrationRunning = ref(false)
const verificationRunning = ref(false)
const migrationResult = ref(null)
const ssidTestRunning = ref(false)
const ssidTestResult = ref(null)

onMounted(async () => {
  console.log('TestingView: Component mounted, checking app settings...')
})

const reloadSettings = async () => {
  try {
    await loadAppSettings()
    console.log('TestingView: Settings reloaded successfully')
  } catch (err) {
    console.error('TestingView: Error reloading settings:', err)
  }
}

const resetSettings = async () => {
  try {
    await resetAppSettings()
    console.log('TestingView: Settings reset successfully')
  } catch (err) {
    console.error('TestingView: Error resetting settings:', err)
  }
}

const handleTestSaved = (student) => {
  console.log('TestingView: Test student saved:', student)
  showTestForm.value = false
}

const runMigration = async () => {
  migrationRunning.value = true
  migrationResult.value = null
  
  try {
    const result = await migrateStudentIds()
    migrationResult.value = result
    console.log('Migration completed:', result)
  } catch (error) {
    migrationResult.value = { error: error.message }
    console.error('Migration failed:', error)
  } finally {
    migrationRunning.value = false
  }
}

const verifyMigration = async () => {
  verificationRunning.value = true
  migrationResult.value = null
  
  try {
    const result = await verifyMigrationUtil()
    migrationResult.value = result
    console.log('Verification completed:', result)
  } catch (error) {
    migrationResult.value = { error: error.message }
    console.error('Verification failed:', error)
  } finally {
    verificationRunning.value = false
  }
}

const testSSIDResolution = async () => {
  ssidTestRunning.value = true
  ssidTestResult.value = null
  
  try {
    // Test data with different SSID field names
    const testData = [
      // OneRoster format
      { sourcedId: '123456789', givenName: 'John', familyName: 'Doe', specialEducation: 'true' },
      // Legacy Aeries format
      { SSID: '987654321', FirstName: 'Jane', LastName: 'Smith', IEP: 'Yes' },
      // Mixed case
      { ssid: '555666777', FirstName: 'Bob', LastName: 'Johnson', iep: '1' },
      // StateStudentID format
      { StateStudentID: '111222333', FirstName: 'Alice', LastName: 'Brown', '504': 'true' }
    ]

    const results = {
      aeriesMapping: {},
      seisMapping: {},
      ssidExtraction: {},
      fieldMapping: {}
    }

    // Test Aeries field mapping
    testData.forEach((row, index) => {
      const aeriesMapped = {}
      Object.keys(row).forEach(field => {
        aeriesMapped[field] = mapAeriesField(field)
      })
      results.aeriesMapping[`row_${index}`] = aeriesMapped
    })

    // Test SEIS field mapping
    testData.forEach((row, index) => {
      const seisMapped = {}
      Object.keys(row).forEach(field => {
        seisMapped[field] = mapSeisField(field)
      })
      results.seisMapping[`row_${index}`] = seisMapped
    })

    // Test SSID extraction logic
    testData.forEach((row, index) => {
      const ssid = (row['sourcedId'] || row['SSID'] || row['ssid'] || row['StateStudentID'] || row['stateStudentId'])?.trim()
      results.ssidExtraction[`row_${index}`] = {
        original: row,
        extractedSSID: ssid,
        success: !!ssid
      }
    })

    // Test field mapping for special education
    const specialEdFields = ['specialEducation', 'iep', 'IEP', 'plan504', '504', 'disabilities', 'accommodations']
    results.fieldMapping = {
      aeries: specialEdFields.map(field => ({ field, mapped: mapAeriesField(field) })),
      seis: specialEdFields.map(field => ({ field, mapped: mapSeisField(field) }))
    }

    ssidTestResult.value = {
      success: true,
      message: 'SSID resolution test completed successfully',
      results
    }
    
    console.log('SSID resolution test completed:', results)
  } catch (error) {
    ssidTestResult.value = { 
      success: false, 
      error: error.message,
      message: 'SSID resolution test failed'
    }
    console.error('SSID resolution test failed:', error)
  } finally {
    ssidTestRunning.value = false
  }
}

const clearSSIDTest = () => {
  ssidTestResult.value = null
}
</script>

<style scoped>
.testing-view {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.test-section {
  margin-bottom: 2rem;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}

.test-section h3 {
  margin-top: 0;
  color: #1976d2;
  border-bottom: 2px solid #e3f2fd;
  padding-bottom: 0.5rem;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.status-item {
  padding: 0.5rem;
  background: #f5f5f5;
  border-radius: 4px;
  font-family: monospace;
}

.settings-display {
  display: grid;
  gap: 1rem;
}

.setting-group {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #1976d2;
}

.setting-group h4 {
  margin: 0 0 0.5rem 0;
  color: #1976d2;
}

.setting-values {
  font-family: monospace;
  font-size: 14px;
  line-height: 1.4;
}

.service-item {
  margin-bottom: 0.5rem;
  padding: 0.25rem 0;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.integration-test {
  padding: 1rem;
  background: #e8f5e8;
  border-radius: 4px;
}

.test-form-container {
  margin-top: 1rem;
  padding: 1rem;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.migration-controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.btn-warning {
  background: #ff9800;
  color: white;
}

.migration-result {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #ff9800;
}

.migration-result pre {
  background: #fff;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}
</style>
