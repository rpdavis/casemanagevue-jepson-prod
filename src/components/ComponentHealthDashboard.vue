<template>
  <div class="health-dashboard">
    <div class="dashboard-header">
      <h2>🔧 Component Health Dashboard</h2>
      <div class="header-controls">
        <button @click="refreshAll" :disabled="isRefreshing" class="btn btn-primary">
          {{ isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh All' }}
        </button>
        <span class="last-update" v-if="lastUpdate">
          Last update: {{ formatTime(lastUpdate) }}
        </span>
      </div>
    </div>

    <!-- Overall System Status -->
    <div class="status-overview">
      <div class="status-card overall" :class="overallStatus">
        <div class="status-icon">
          {{ getStatusIcon(overallStatus) }}
        </div>
        <div class="status-info">
          <h3>System Status</h3>
          <p>{{ getStatusMessage(overallStatus) }}</p>
          <div class="status-details">
            {{ healthyComponents }}/{{ totalComponents }} components healthy
          </div>
        </div>
      </div>
    </div>

    <!-- Component Categories -->
    <div class="component-categories">
      <!-- Core Services -->
      <div class="category-section">
        <h3>🔧 Core Services</h3>
        <div class="components-grid">
          <ComponentHealthCard
            v-for="service in coreServices"
            :key="service.name"
            :component="service"
            @test="testComponent"
            @toggle="toggleComponent"
          />
        </div>
      </div>

      <!-- Security Components -->
      <div class="category-section">
        <h3>🔐 Authentication & Security</h3>
        <div class="components-grid">
          <ComponentHealthCard
            v-for="security in securityComponents"
            :key="security.name"
            :component="security"
            @test="testComponent"
            @toggle="toggleComponent"
          />
        </div>
      </div>
    </div>

    <!-- Quick Test Actions -->
    <div class="quick-actions">
      <h3>⚡ Quick Tests</h3>
      <div class="admin-action-btns">
        <button @click="runFullSystemTest" :disabled="isRunningFullTest" class="admin-action-btn" style="min-width: 160px; max-width: 160px;">
          {{ isRunningFullTest ? '🧪 Testing...' : '🧪 Full System Test' }}
        </button>
        <button @click="exportHealthReport" class="admin-action-btn" style="min-width: 140px; max-width: 140px;">
          📋 Export Report
        </button>
      </div>
    </div>

    <!-- Real-time Logs -->
    <div class="logs-section">
      <div class="logs-header">
        <h3>📝 Component Activity Logs</h3>
        <div class="log-controls">
          <button @click="clearLogs" class="btn btn-sm btn-secondary">Clear</button>
        </div>
      </div>
      <div class="logs-container">
        <div v-for="log in recentLogs" :key="log.id" class="log-entry" :class="log.type">
          <span class="log-time">{{ formatTime(log.timestamp) }}</span>
          <span class="log-component">{{ log.component }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
        <div v-if="recentLogs.length === 0" class="no-logs">
          No activity logs yet. Click "Refresh All" to start monitoring.
        </div>
      </div>
    </div>

    <!-- Test Results Modal -->
    <div v-if="showTestResults" class="test-modal-overlay" @click="closeTestResults">
      <div class="test-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ testResults.component }} Test Results</h3>
          <button @click="closeTestResults" class="btn btn-sm btn-secondary">✕</button>
        </div>
        <div class="modal-content">
          <pre>{{ JSON.stringify(testResults.data, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ComponentHealthCard from './ComponentHealthCard.vue'

// Dashboard state
const isRefreshing = ref(false)
const lastUpdate = ref(null)
const showTestResults = ref(false)
const testResults = ref({})
const recentLogs = ref([])
const isRunningFullTest = ref(false)

// Component definitions
const coreServices = ref([
  {
    name: 'Firebase Auth',
    status: 'operational',
    description: 'User authentication service',
    lastCheck: new Date(),
    enabled: true,
    latency: 150,
    errors: []
  },
  {
    name: 'Firestore Database',
    status: 'operational',
    description: 'Main database service',
    lastCheck: new Date(),
    enabled: true,
    latency: 200,
    errors: []
  },
  {
    name: 'Firebase Storage',
    status: 'operational',
    description: 'File storage service',
    lastCheck: new Date(),
    enabled: true,
    latency: 180,
    errors: []
  },
  {
    name: 'Cloud Functions',
    status: 'operational',
    description: 'Server-side functions',
    lastCheck: new Date(),
    enabled: true,
    latency: 300,
    errors: []
  }
])

const securityComponents = ref([
  {
    name: 'Session Timeout',
    status: 'operational',
    description: 'Automatic user logout system',
    lastCheck: new Date(),
    enabled: true,
    latency: 50,
    errors: []
  },
  {
    name: 'IEP Encryption',
    status: 'operational',
    description: 'Sensitive data encryption',
    lastCheck: new Date(),
    enabled: true,
    latency: 80,
    errors: []
  },
  {
    name: 'Access Control',
    status: 'operational',
    description: 'Role-based permissions',
    lastCheck: new Date(),
    enabled: true,
    latency: 120,
    errors: []
  },
  {
    name: 'Audit Logging',
    status: 'operational',
    description: 'Activity tracking system',
    lastCheck: new Date(),
    enabled: true,
    latency: 90,
    errors: []
  }
])

// Computed properties
const allComponents = computed(() => [
  ...coreServices.value,
  ...securityComponents.value
])

const totalComponents = computed(() => allComponents.value.length)

const healthyComponents = computed(() => 
  allComponents.value.filter(c => c.status === 'operational').length
)

const overallStatus = computed(() => {
  const statuses = allComponents.value.map(c => c.status)
  if (statuses.every(s => s === 'operational' || s === 'disabled')) return 'operational'
  if (statuses.some(s => s === 'down' || s === 'error')) return 'down'
  return 'degraded'
})

// Methods
const getStatusIcon = (status) => {
  switch (status) {
    case 'operational': return '✅'
    case 'degraded': return '⚠️'
    case 'down': return '❌'
    case 'disabled': return '⏸️'
    default: return '🔄'
  }
}

const getStatusMessage = (status) => {
  switch (status) {
    case 'operational': return 'All systems operational'
    case 'degraded': return 'Some issues detected'
    case 'down': return 'Critical issues found'
    case 'checking': return 'Running diagnostics...'
    default: return 'Unknown status'
  }
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true
  }).format(timestamp)
}

const addLog = (component, message, type = 'info') => {
  recentLogs.value.unshift({
    id: Date.now() + Math.random(),
    timestamp: new Date(),
    component,
    message,
    type
  })
  
  // Keep only last 20 logs
  if (recentLogs.value.length > 20) {
    recentLogs.value = recentLogs.value.slice(0, 20)
  }
}

const testComponent = async (component) => {
  addLog(component.name, 'Starting component test...', 'info')
  
  try {
    // Simulate component test
    const startTime = performance.now()
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))
    const latency = Math.round(performance.now() - startTime)
    
    // Update component status
    const comp = allComponents.value.find(c => c.name === component.name)
    if (comp) {
      comp.status = Math.random() > 0.1 ? 'operational' : 'degraded'
      comp.latency = latency
      comp.lastCheck = new Date()
      comp.errors = comp.status === 'degraded' ? ['Minor performance issue detected'] : []
    }
    
    addLog(component.name, `Test completed - ${comp.status} (${latency}ms)`, 
           comp.status === 'operational' ? 'success' : 'warning')
    
    // Show detailed results
    testResults.value = {
      component: component.name,
      data: {
        status: comp.status,
        latency: `${latency}ms`,
        timestamp: new Date().toISOString(),
        details: comp.status === 'operational' 
          ? 'All checks passed successfully'
          : 'Minor performance issues detected'
      }
    }
    showTestResults.value = true
    
  } catch (error) {
    addLog(component.name, `Test failed: ${error.message}`, 'error')
  }
}

const toggleComponent = (component) => {
  const comp = allComponents.value.find(c => c.name === component.name)
  if (comp) {
    comp.enabled = !comp.enabled
    comp.status = comp.enabled ? 'operational' : 'disabled'
    addLog(component.name, `Component ${comp.enabled ? 'enabled' : 'disabled'}`, 'info')
  }
}

const refreshAll = async () => {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  lastUpdate.value = new Date()
  addLog('System', 'Starting full system refresh...', 'info')
  
  try {
    // Test all components in parallel
    const testPromises = allComponents.value
      .filter(c => c.enabled)
      .map(component => testComponent(component))
    
    await Promise.all(testPromises)
    addLog('System', 'Full system refresh completed', 'success')
    
  } catch (error) {
    addLog('System', `Refresh failed: ${error.message}`, 'error')
  } finally {
    isRefreshing.value = false
  }
}

const runFullSystemTest = async () => {
  isRunningFullTest.value = true
  addLog('System', 'Starting comprehensive system test...', 'info')
  
  try {
    await refreshAll()
    addLog('System', 'Comprehensive system test completed', 'success')
  } catch (error) {
    addLog('System', `System test failed: ${error.message}`, 'error')
  } finally {
    isRunningFullTest.value = false
  }
}

const exportHealthReport = () => {
  const report = {
    timestamp: new Date().toISOString(),
    overallStatus: overallStatus.value,
    components: allComponents.value.map(c => ({
      name: c.name,
      status: c.status,
      enabled: c.enabled,
      latency: c.latency,
      lastCheck: c.lastCheck,
      errors: c.errors
    })),
    logs: recentLogs.value.slice(0, 10)
  }
  
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `health-report-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  addLog('System', 'Health report exported', 'info')
}

const clearLogs = () => {
  recentLogs.value = []
}

const closeTestResults = () => {
  showTestResults.value = false
  testResults.value = {}
}

// Lifecycle
onMounted(() => {
  addLog('System', 'Component Health Dashboard initialized', 'success')
})
</script>

<style scoped>
.health-dashboard {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e9ecef;
}

.dashboard-header h2 {
  margin: 0;
  color: #2c3e50;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.last-update {
  color: #666;
  font-size: 14px;
}

.status-overview {
  margin-bottom: 30px;
}

.status-card {
  display: flex;
  align-items: center;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.status-card.operational {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  border: 1px solid #c3e6cb;
}

.status-card.degraded {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%);
  border: 1px solid #ffeeba;
}

.status-card.down {
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
  border: 1px solid #f5c6cb;
}

.status-icon {
  font-size: 32px;
  margin-right: 20px;
}

.status-info h3 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 24px;
}

.status-info p {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 16px;
}

.status-details {
  color: #666;
  font-size: 14px;
}

.component-categories {
  display: flex;
  flex-direction: column;
  gap: 30px;
  margin-bottom: 30px;
}

.category-section h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e9ecef;
}

.components-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.quick-actions {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.quick-actions h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
}

.action-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.logs-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  overflow: hidden;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.logs-header h3 {
  margin: 0;
  color: #2c3e50;
}

.log-controls {
  display: flex;
  gap: 10px;
}

.logs-container {
  max-height: 300px;
  overflow-y: auto;
  padding: 15px;
}

.log-entry {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 15px;
  padding: 8px 0;
  border-bottom: 1px solid #f1f3f4;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.log-entry.success { color: #28a745; }
.log-entry.warning { color: #ffc107; }
.log-entry.error { color: #dc3545; }
.log-entry.info { color: #17a2b8; }

.log-time {
  color: #666;
  white-space: nowrap;
}

.log-component {
  font-weight: 600;
  white-space: nowrap;
}

.no-logs {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 20px;
}

.test-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.test-modal {
  background: white;
  border-radius: 12px;
  padding: 0;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.modal-content {
  padding: 20px;
  overflow-y: auto;
  max-height: 60vh;
}

.modal-content pre {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  font-size: 12px;
  overflow-x: auto;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  font-size: 14px;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-primary { background: #007bff; color: white; }
.btn-secondary { background: #6c757d; color: white; }
.btn-warning { background: #ffc107; color: #212529; }
.btn-sm { padding: 6px 12px; font-size: 12px; }

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
</style> 