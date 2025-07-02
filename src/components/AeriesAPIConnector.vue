<template>
  <div class="aeries-api-connector">
    <h3>Aeries API Connection</h3>
    
    <!-- API Options Info -->
    <div class="api-info-section">
      <h4>Getting Students with IEP/504 Plans</h4>
      <div class="info-grid">
        <div class="info-card">
          <h5>🔍 OneRoster API (Limited)</h5>
          <p><strong>Can get:</strong> All students, basic info</p>
          <p><strong>Cannot filter:</strong> Students with IEP/504 plans</p>
          <p><strong>Result:</strong> You'd get ALL students, not just SPED</p>
        </div>
        <div class="info-card">
          <h5>🎯 Custom Aeries API (Recommended)</h5>
          <p><strong>Can get:</strong> Only students with IEP/504 plans</p>
          <p><strong>Includes:</strong> Accommodations, services, case managers</p>
          <p><strong>Result:</strong> Perfect for your use case</p>
        </div>
        <div class="info-card">
          <h5>📋 CSV Import (Fallback)</h5>
          <p><strong>Can get:</strong> Filtered data from Aeries export</p>
          <p><strong>Process:</strong> Export SPED students → Import CSV</p>
          <p><strong>Result:</strong> Works but requires manual steps</p>
        </div>
      </div>
      <div class="testing-note">
        <p><strong>Test the buttons below to see what your Aeries instance supports!</strong></p>
      </div>
    </div>
    
    <!-- Connection Form -->
    <div class="connection-form">
      <div class="form-group">
        <label for="baseUrl">Base URL:</label>
        <input 
          id="baseUrl"
          v-model="connectionConfig.baseUrl" 
          type="url" 
          placeholder="https://demo.aeries.net/aeries"
          :disabled="isConnected"
        />
      </div>
      
      <div class="form-group">
        <label for="clientId">Client ID:</label>
        <input 
          id="clientId"
          v-model="connectionConfig.clientId" 
          type="text" 
          placeholder="Enter your Client ID"
          :disabled="isConnected"
        />
      </div>
      
      <div class="form-group">
        <label for="clientSecret">Client Secret:</label>
        <input 
          id="clientSecret"
          v-model="connectionConfig.clientSecret" 
          type="password" 
          placeholder="Enter your Client Secret"
          :disabled="isConnected"
        />
      </div>
      
      <div class="button-group">
        <button 
          @click="connect" 
          :disabled="!canConnect || isConnecting"
          class="btn-primary"
        >
          {{ isConnecting ? 'Connecting...' : 'Connect' }}
        </button>
        
        <button 
          v-if="isConnected" 
          @click="disconnect" 
          class="btn-secondary"
        >
          Disconnect
        </button>
        
        <button 
          @click="loadDemoCredentials" 
          :disabled="isConnected"
          class="btn-demo"
        >
          Load Demo Credentials
        </button>
      </div>

      <!-- API Type Selection -->
      <div class="api-type-selection">
        <h4>Select API Types</h4>
        <p class="api-type-description">Choose which Aeries API types you want to use. This determines which endpoints will be available for testing and data import.</p>
        
        <div class="api-type-options">
          <div class="api-type-option">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="selectedApiTypes.oneroster"
                @change="updateAvailableEndpoints"
              />
              <span class="checkmark"></span>
              <strong>OneRoster API</strong>
            </label>
            <p class="api-type-desc">Standard OneRoster endpoints for basic student, teacher, and class data</p>
          </div>
          
          <div class="api-type-option">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="selectedApiTypes.nativeAeries"
                @change="updateAvailableEndpoints"
              />
              <span class="checkmark"></span>
              <strong>Native Aeries v5 API</strong>
            </label>
            <p class="api-type-desc">Aeries-specific endpoints for special education, IEP, and 504 plan data</p>
          </div>
        </div>

        <!-- Endpoint Selection -->
        <div v-if="hasSelectedApiTypes" class="endpoint-selection">
          <h5>Select Endpoints to Use</h5>
          <p class="endpoint-description">Check the endpoints you want to enable for data import and testing.</p>
          
          <div class="endpoint-categories">
            <!-- OneRoster Endpoints -->
            <div v-if="selectedApiTypes.oneroster" class="endpoint-category">
              <h6>OneRoster Endpoints</h6>
              <div class="endpoint-checkboxes">
                <label v-for="endpoint in onerosterEndpoints" :key="endpoint.path" class="endpoint-checkbox">
                  <input 
                    type="checkbox" 
                    v-model="selectedEndpoints" 
                    :value="endpoint.path"
                  />
                  <span class="endpoint-name">{{ endpoint.name }}</span>
                  <span class="endpoint-path-small">{{ endpoint.path }}</span>
                </label>
              </div>
            </div>
            
            <!-- Native Aeries Endpoints -->
            <div v-if="selectedApiTypes.nativeAeries" class="endpoint-category">
              <h6>Native Aeries v5 Endpoints</h6>
              <div class="endpoint-checkboxes">
                <label v-for="endpoint in nativeAeriesEndpoints" :key="endpoint.path" class="endpoint-checkbox">
                  <input 
                    type="checkbox" 
                    v-model="selectedEndpoints" 
                    :value="endpoint.path"
                  />
                  <span class="endpoint-name">{{ endpoint.name }}</span>
                  <span class="endpoint-path-small">{{ endpoint.path }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Configuration Management -->
      <div class="config-management">
        <h4>Save/Load Configuration</h4>
        <div class="security-note">
          <p><strong>🔒 Security:</strong> Your API credentials are encrypted and stored securely in Firebase. Only you can access your saved configuration.</p>
        </div>
        <div class="config-buttons">
          <button 
            @click="saveConfiguration" 
            :disabled="!canConnect || storageLoading"
            class="btn-save"
          >
            {{ storageLoading ? '⏳ Saving...' : '💾 Save Configuration' }}
          </button>
          
          <button 
            @click="loadConfiguration" 
            :disabled="storageLoading"
            class="btn-load"
          >
            {{ storageLoading ? '⏳ Loading...' : '📂 Load Saved Configuration' }}
          </button>
          
          <button 
            @click="clearConfiguration" 
            :disabled="storageLoading"
            class="btn-clear"
          >
            {{ storageLoading ? '⏳ Deleting...' : '🗑️ Clear Saved Configuration' }}
          </button>
        </div>
        
        <div v-if="configStatus" class="config-status" :class="{ error: configError }">
          {{ configStatus }}
        </div>
      </div>
    </div>

    <!-- Connection Status -->
    <div v-if="connectionStatus" class="status-message" :class="{ error: isError }">
      {{ connectionStatus }}
    </div>

    <!-- API Testing Section -->
    <div v-if="isConnected" class="api-testing">
      <h4>Test API Endpoints</h4>
      
      <!-- Special Education Quick Tests -->
      <div class="special-ed-section">
        <h5>Special Education Data (IEP/504)</h5>
        <div class="quick-test-buttons">
          <button 
            @click="handleTestSpecialEd"
            :disabled="isLoading"
            class="btn-test-special"
          >
            {{ isLoading ? 'Testing...' : 'Test All SPED Endpoints' }}
          </button>
          <button 
            @click="handleTestOneRosterSpecialEd"
            :disabled="isLoading"
            class="btn-test-oneroster"
          >
            Test OneRoster for SPED Data
          </button>
          <button 
            @click="handleTestStudentsWithSpecialEd"
            :disabled="isLoading"
            class="btn-test-oneroster"
          >
            Test OneRoster SPED Filters
          </button>
          <button 
            @click="handleTestEndpoint('/api/special-education/students')"
            :disabled="isLoading"
            class="btn-test-special"
          >
            SPED Students
          </button>
          <button 
            @click="handleTestEndpoint('/api/special-education/ieps')"
            :disabled="isLoading"
            class="btn-test-special"
          >
            IEP Records
          </button>
          <button 
            @click="handleTestEndpoint('/api/special-education/504-plans')"
            :disabled="isLoading"
            class="btn-test-special"
          >
            504 Plans
          </button>
        </div>
      </div>
      
      <div class="endpoint-grid">
        <div 
          v-for="endpoint in availableEndpoints" 
          :key="endpoint.path"
          class="endpoint-card"
        >
          <h5>{{ endpoint.name }}</h5>
          <p class="endpoint-path">{{ endpoint.path }}</p>
          <p class="endpoint-description">{{ endpoint.description }}</p>
          <button 
            @click="testEndpoint(endpoint.path)"
            :disabled="isLoading"
            class="btn-test"
          >
            {{ isLoading && currentEndpoint === endpoint.path ? 'Testing...' : 'Test' }}
          </button>
        </div>
      </div>

      <!-- Results Display -->
      <div v-if="apiResults" class="api-results">
        <h4>API Response</h4>
        <div class="results-header">
          <span class="endpoint-tested">Endpoint: {{ currentEndpoint }}</span>
          <span class="response-time" v-if="responseTime">Response time: {{ responseTime }}ms</span>
        </div>
        <div class="results-content">
          <pre>{{ JSON.stringify(apiResults, null, 2) }}</pre>
        </div>
      </div>
    </div>

    <!-- School Dropdown -->
    <div v-if="canShowSchoolDropdown" class="form-group">
      <label>School</label>
      <select v-model="selectedSchoolId">
        <option value="" disabled>Select a school</option>
        <option v-for="school in schools" :key="school.sourcedId || school.id || school.schoolId" :value="school.sourcedId || school.id || school.schoolId">
          {{ school.name || school.title || school.schoolName }}
        </option>
      </select>
    </div>

    <!-- Case Manager Classes Multiselect -->
    <div v-if="canShowClasses" class="form-group">
      <label>Case Manager Classes</label>
      <div v-if="!classesFetchError">
        <select v-model="selectedClassIds" multiple>
          <option v-for="cls in classes" :key="cls.sourcedId || cls.id || cls.classId" :value="cls.sourcedId || cls.id || cls.classId">
            {{ cls.title || cls.name || cls.className }}
          </option>
        </select>
      </div>
      <div v-else>
        <p class="error">Could not fetch classes. Enter class names manually (comma separated):</p>
        <input v-model="manualClassInput" type="text" placeholder="Class1, Class2, ..." />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useAeriesAPI } from '../composables/useAeriesAPI.js'
import { useSecureStorage } from '../composables/useStorage.js'

export default {
  name: 'AeriesAPIConnector',
  setup() {
    const {
      isConnected,
      isConnecting,
      accessToken,
      connectionStatus,
      isError,
      connectionConfig,
      availableEndpoints,
      showStatus,
      loadDemoCredentials,
      connect,
      disconnect,
      testEndpoint,
      testAllSpecialEducationEndpoints,
      testOneRosterForSpecialEd,
      testStudentsWithSpecialEd,
      fetchSchools,
      fetchClasses
    } = useAeriesAPI()

    const {
      isLoading: storageLoading,
      error: storageError,
      saveAeriesConfig,
      loadAeriesConfig,
      deleteAeriesConfig,
      hasSavedConfig
    } = useSecureStorage()

    const isLoading = ref(false)
    const apiResults = ref(null)
    const currentEndpoint = ref('')
    const responseTime = ref(null)

    // New state for schools and classes
    const schools = ref([])
    const selectedSchoolId = ref('')
    const classes = ref([])
    const selectedClassIds = ref([])
    const classesFetchError = ref(false)
    const manualClassInput = ref('')

    // Configuration management state
    const configStatus = ref('')
    const configError = ref(false)

    // API type and endpoint selection state
    const selectedApiTypes = ref({
      oneroster: false,
      nativeAeries: false
    })
    
    const selectedEndpoints = ref([])
    
    // Define endpoint categories
    const onerosterEndpoints = ref([
      { path: '/orgs', name: 'Organizations', description: 'District information' },
      { path: '/schools', name: 'Schools', description: 'School sites' },
      { path: '/academicSessions', name: 'Academic Sessions', description: 'Terms/semesters' },
      { path: '/grades', name: 'Grades', description: 'Grade levels' },
      { path: '/courses', name: 'Courses', description: 'Course catalog' },
      { path: '/classes', name: 'Classes', description: 'Sections (MST table)' },
      { path: '/teachers', name: 'Teachers', description: 'Teacher roster' },
      { path: '/students', name: 'Students', description: 'Student roster' },
      { path: '/enrollments', name: 'Enrollments', description: 'Student-to-class links' }
    ])
    
    const nativeAeriesEndpoints = ref([
      { path: '/api/special-education/students', name: 'SPED Students', description: 'Students with IEP/504 plans' },
      { path: '/api/special-education/ieps', name: 'IEP Records', description: 'IEP documents and data' },
      { path: '/api/special-education/504-plans', name: '504 Plans', description: '504 plan records' },
      { path: '/api/special-education/accommodations', name: 'Accommodations', description: 'Student accommodations' },
      { path: '/api/special-education/services', name: 'Services', description: 'Related services' },
      { path: '/api/special-education/case-managers', name: 'Case Managers', description: 'Case manager assignments' },
      { path: '/api/students/special-education', name: 'SPED Students Alt', description: 'Alternative SPED endpoint' },
      { path: '/api/iep/students', name: 'IEP Students', description: 'IEP student data' },
      { path: '/api/504/students', name: '504 Students', description: '504 student data' }
    ])

    const canConnect = computed(() => {
      return connectionConfig.baseUrl && connectionConfig.clientId && connectionConfig.clientSecret
    })

    const handleConnect = async () => {
      const success = await connect()
      if (success) {
        // Fetch schools after successful connection
        try {
          isLoading.value = true
          const schoolsData = await fetchSchools({ 
            baseUrl: connectionConfig.baseUrl, 
            accessToken: accessToken.value 
          })
          schools.value = schoolsData || []
          selectedSchoolId.value = ''
        } catch (err) {
          console.error('Failed to fetch schools:', err)
          showStatus('Failed to fetch schools', true)
          schools.value = []
        } finally {
          isLoading.value = false
        }
      }
    }

    const handleTestEndpoint = async (endpointPath) => {
      isLoading.value = true
      currentEndpoint.value = endpointPath
      apiResults.value = null
      responseTime.value = null

      const result = await testEndpoint(endpointPath)
      
      if (result && !result.error) {
        apiResults.value = result.data
        responseTime.value = result.responseTime
      } else if (result && result.error) {
        apiResults.value = { error: result.error }
      }
      
      isLoading.value = false
    }

    const handleTestSpecialEd = async () => {
      isLoading.value = true
      await testAllSpecialEducationEndpoints()
      isLoading.value = false
    }

    const handleTestOneRosterSpecialEd = async () => {
      isLoading.value = true
      currentEndpoint.value = '/students (SPED check)'
      apiResults.value = null
      responseTime.value = null

      const result = await testOneRosterForSpecialEd()
      
      if (result && !result.error) {
        apiResults.value = result
        showStatus(result.message)
      } else if (result && result.error) {
        apiResults.value = { error: result.error }
        showStatus(`❌ OneRoster test failed: ${result.error}`, true)
      }
      
      isLoading.value = false
    }

    const handleTestStudentsWithSpecialEd = async () => {
      isLoading.value = true
      currentEndpoint.value = '/students (SPED filters)'
      apiResults.value = null
      responseTime.value = null

      const result = await testStudentsWithSpecialEd()
      
      if (result) {
        apiResults.value = result
        showStatus('OneRoster SPED filter tests completed')
      }
      
      isLoading.value = false
    }

    // Watch for school selection to fetch classes
    watch(selectedSchoolId, async (newSchoolId) => {
      if (!newSchoolId) {
        classes.value = []
        selectedClassIds.value = []
        return
      }
      classesFetchError.value = false
      manualClassInput.value = ''
      isLoading.value = true
      try {
        classes.value = await fetchClasses({ 
          baseUrl: connectionConfig.baseUrl, 
          accessToken: accessToken.value, 
          schoolId: newSchoolId 
        })
        selectedClassIds.value = []
      } catch (err) {
        classesFetchError.value = true
        classes.value = []
        selectedClassIds.value = []
      } finally {
        isLoading.value = false
      }
    })

    const canShowSchoolDropdown = computed(() => isConnected.value && schools.value.length > 0)
    const canShowClasses = computed(() => canShowSchoolDropdown.value && selectedSchoolId.value)

    const hasSelectedApiTypes = computed(() => {
      return selectedApiTypes.value.oneroster || selectedApiTypes.value.nativeAeries
    })

    const updateAvailableEndpoints = () => {
      // Update the availableEndpoints based on selected API types
      const newEndpoints = []
      
      if (selectedApiTypes.value.oneroster) {
        newEndpoints.push(...onerosterEndpoints.value)
      }
      
      if (selectedApiTypes.value.nativeAeries) {
        newEndpoints.push(...nativeAeriesEndpoints.value)
      }
      
      availableEndpoints.value = newEndpoints
    }

    // Configuration management functions
    const showConfigStatus = (message, error = false) => {
      configStatus.value = message
      configError.value = error
      setTimeout(() => {
        configStatus.value = ''
        configError.value = false
      }, 5000)
    }

    const saveConfiguration = async () => {
      try {
        const config = {
          baseUrl: connectionConfig.baseUrl,
          clientId: connectionConfig.clientId,
          clientSecret: connectionConfig.clientSecret,
          selectedSchoolId: selectedSchoolId.value,
          selectedClassIds: selectedClassIds.value,
          manualClassInput: manualClassInput.value,
          selectedApiTypes: selectedApiTypes.value,
          selectedEndpoints: selectedEndpoints.value
        }
        
        await saveAeriesConfig(config)
        showConfigStatus('✅ Configuration saved securely to Firebase!')
      } catch (error) {
        console.error('Failed to save configuration:', error)
        showConfigStatus(`❌ Failed to save configuration: ${error.message}`, true)
      }
    }

    const loadConfiguration = async () => {
      try {
        const config = await loadAeriesConfig()
        if (!config) {
          showConfigStatus('❌ No saved configuration found', true)
          return
        }

        // Load connection config
        connectionConfig.baseUrl = config.baseUrl || ''
        connectionConfig.clientId = config.clientId || ''
        connectionConfig.clientSecret = config.clientSecret || ''
        
        // Load selections (these will be restored after connection)
        selectedSchoolId.value = config.selectedSchoolId || ''
        selectedClassIds.value = config.selectedClassIds || []
        manualClassInput.value = config.manualClassInput || ''
        
        // Load API type and endpoint selections
        if (config.selectedApiTypes) {
          selectedApiTypes.value = config.selectedApiTypes
        }
        if (config.selectedEndpoints) {
          selectedEndpoints.value = config.selectedEndpoints
        }
        
        // Update available endpoints based on loaded API types
        updateAvailableEndpoints()
        
        const savedDate = config.savedAt ? new Date(config.savedAt).toLocaleString() : 'Unknown'
        showConfigStatus(`✅ Configuration loaded securely (saved: ${savedDate})`)
      } catch (error) {
        console.error('Failed to load configuration:', error)
        showConfigStatus(`❌ Failed to load configuration: ${error.message}`, true)
      }
    }

    const clearConfiguration = async () => {
      if (!confirm('Are you sure you want to permanently delete the saved configuration? This action cannot be undone.')) {
        return
      }
      
      try {
        await deleteAeriesConfig()
        showConfigStatus('✅ Configuration permanently deleted from Firebase!')
      } catch (error) {
        console.error('Failed to clear configuration:', error)
        showConfigStatus(`❌ Failed to clear configuration: ${error.message}`, true)
      }
    }

    // Auto-load saved configuration on component mount
    onMounted(async () => {
      try {
        const hasConfig = await hasSavedConfig()
        if (hasConfig) {
          const config = await loadAeriesConfig()
          if (config) {
            connectionConfig.baseUrl = config.baseUrl || ''
            connectionConfig.clientId = config.clientId || ''
            connectionConfig.clientSecret = config.clientSecret || ''
            
            // Load API type and endpoint selections
            if (config.selectedApiTypes) {
              selectedApiTypes.value = config.selectedApiTypes
            }
            if (config.selectedEndpoints) {
              selectedEndpoints.value = config.selectedEndpoints
            }
            
            // Update available endpoints based on loaded API types
            updateAvailableEndpoints()
            
            showConfigStatus('✅ Configuration auto-loaded securely from Firebase')
          }
        }
      } catch (error) {
        console.error('Failed to auto-load configuration:', error)
        // Don't show error to user on auto-load
      }
    })

    return {
      connectionConfig,
      isConnected,
      isConnecting,
      isLoading,
      connectionStatus,
      isError,
      apiResults,
      currentEndpoint,
      responseTime,
      availableEndpoints,
      canConnect,
      loadDemoCredentials,
      connect: handleConnect,
      disconnect,
      testEndpoint: handleTestEndpoint,
      handleTestSpecialEd,
      handleTestOneRosterSpecialEd,
      handleTestStudentsWithSpecialEd,
      schools,
      selectedSchoolId,
      classes,
      selectedClassIds,
      classesFetchError,
      manualClassInput,
      canShowSchoolDropdown,
      canShowClasses,
      configStatus,
      configError,
      storageLoading,
      storageError,
      saveConfiguration,
      loadConfiguration,
      clearConfiguration,
      selectedApiTypes,
      selectedEndpoints,
      onerosterEndpoints,
      nativeAeriesEndpoints,
      hasSelectedApiTypes,
      updateAvailableEndpoints
    }
  }
}
</script>

<style scoped>
.aeries-api-connector {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.api-info-section {
  margin-bottom: 2rem;
  padding: 1rem;
  background: #e3f2fd;
  border-radius: 8px;
  border-left: 4px solid #2196f3;
}

.api-info-section h4 {
  margin: 0 0 1rem 0;
  color: #1976d2;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.info-card {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.info-card h5 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 16px;
}

.info-card p {
  margin: 0.25rem 0;
  font-size: 14px;
  line-height: 1.4;
}

.connection-form {
  display: grid;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #333;
}

.form-group input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:disabled {
  background-color: #f5f5f5;
  color: #666;
}

.button-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-primary {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.btn-demo {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-demo:hover:not(:disabled) {
  background-color: #1e7e34;
}

.btn-demo:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.status-message {
  padding: 0.5rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.api-testing {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #ddd;
}

.special-ed-section {
  margin-bottom: 2rem;
}

.quick-test-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.endpoint-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.endpoint-card {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
}

.endpoint-card h5 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.endpoint-path {
  font-family: monospace;
  background: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  margin: 0.5rem 0;
  font-size: 12px;
  color: #666;
}

.endpoint-description {
  margin: 0.5rem 0;
  color: #666;
  font-size: 14px;
}

.btn-test {
  background-color: #17a2b8;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}

.btn-test:hover:not(:disabled) {
  background-color: #138496;
}

.btn-test:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-test-special {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.btn-test-special:hover:not(:disabled) {
  background-color: #c82333;
}

.btn-test-special:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-test-oneroster {
  background-color: #ffc107;
  color: black;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.btn-test-oneroster:hover:not(:disabled) {
  background-color: #e0a800;
}

.btn-test-oneroster:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.api-results {
  margin-top: 2rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.endpoint-tested {
  font-weight: 600;
  color: #333;
}

.response-time {
  font-size: 12px;
  color: #666;
}

.results-content {
  max-height: 400px;
  overflow-y: auto;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
}

.results-content pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.testing-note {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
}

.testing-note p {
  margin: 0;
  color: #856404;
  font-size: 14px;
}

/* API Type Selection Styles */
.api-type-selection {
  margin-top: 2rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f8f9fa;
}

.api-type-selection h4 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 16px;
}

.api-type-description {
  margin: 0 0 1.5rem 0;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.api-type-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.api-type-option {
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
}

.api-type-option .api-type-desc {
  margin: 0.5rem 0 0 0;
  color: #666;
  font-size: 14px;
}

/* Custom Checkbox Styles */
.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 16px;
  position: relative;
  padding-left: 35px;
}

.checkbox-label input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 20px;
  width: 20px;
  background-color: #eee;
  border: 2px solid #ccc;
  border-radius: 4px;
}

.checkbox-label:hover input ~ .checkmark {
  background-color: #ccc;
}

.checkbox-label input:checked ~ .checkmark {
  background-color: #2196F3;
  border-color: #2196F3;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.checkbox-label input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-label .checkmark:after {
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* Endpoint Selection Styles */
.endpoint-selection {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #ddd;
}

.endpoint-selection h5 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 15px;
}

.endpoint-description {
  margin: 0 0 1rem 0;
  color: #666;
  font-size: 14px;
}

.endpoint-categories {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.endpoint-category h6 {
  margin: 0 0 0.75rem 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.endpoint-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.endpoint-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.endpoint-checkbox:hover {
  background-color: #f5f5f5;
}

.endpoint-checkbox input[type="checkbox"] {
  margin: 0;
}

.endpoint-name {
  font-weight: 500;
  color: #333;
  flex: 1;
}

.endpoint-path-small {
  font-family: monospace;
  font-size: 12px;
  color: #666;
  background: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
}

/* Configuration Management Styles */
.config-management {
  margin-top: 2rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f8f9fa;
}

.config-management h4 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 16px;
}

.security-note {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #e8f5e8;
  border: 1px solid #4caf50;
  border-radius: 4px;
}

.security-note p {
  margin: 0;
  color: #2e7d32;
  font-size: 14px;
  line-height: 1.4;
}

.config-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.btn-save {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-save:hover:not(:disabled) {
  background-color: #1e7e34;
}

.btn-save:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-load {
  background-color: #17a2b8;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-load:hover:not(:disabled) {
  background-color: #138496;
}

.btn-clear {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-clear:hover:not(:disabled) {
  background-color: #c82333;
}

.config-status {
  padding: 0.5rem;
  border-radius: 4px;
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  font-size: 14px;
}

.config-status.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style> 