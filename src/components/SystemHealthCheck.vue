<template>
  <div class="health-check">
    <div class="status-header">
      <h3>System Health Status</h3>
      <div class="refresh-button">
        <button @click="refreshStatus" :disabled="isChecking" class="btn btn-primary">
          {{ isChecking ? 'Checking...' : 'Check Now' }}
        </button>
        <span class="last-check" v-if="lastCheck">
          Last check: {{ formatTime(lastCheck) }}
        </span>
      </div>
    </div>

    <!-- Overall System Status -->
    <div class="status-card overall" :class="overallStatus">
      <div class="status-icon">
        {{ overallStatus === 'operational' ? '✅' : overallStatus === 'degraded' ? '⚠️' : '❌' }}
      </div>
      <div class="status-info">
        <h4>Overall System Status</h4>
        <p>{{ getStatusMessage(overallStatus) }}</p>
      </div>
    </div>

    <!-- Individual Service Status -->
    <div class="services-grid">
      <div v-for="service in services" :key="service.name" 
           class="service-card" :class="service.status">
        <div class="service-header">
          <span class="service-icon">{{ service.icon }}</span>
          <span class="service-name">{{ service.name }}</span>
        </div>
        <div class="service-status">
          {{ service.status === 'operational' ? '✅' : service.status === 'degraded' ? '⚠️' : '❌' }}
          {{ getStatusMessage(service.status) }}
        </div>
        <div class="service-latency" v-if="service.latency !== undefined">
          Latency: {{ service.latency }}ms
        </div>
        <div class="service-message" v-if="service.message">
          {{ service.message }}
        </div>
      </div>
    </div>

    <!-- Recent Issues -->
    <div class="recent-issues" v-if="recentIssues.length">
      <h4>Recent Issues</h4>
      <div class="issue-list">
        <div v-for="issue in recentIssues" :key="issue.id" class="issue-item">
          <div class="issue-time">{{ formatTime(issue.timestamp) }}</div>
          <div class="issue-service">{{ issue.service }}</div>
          <div class="issue-description">{{ issue.description }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { 
  getAuth, 
  signInAnonymously, 
  connectAuthEmulator 
} from 'firebase/auth'
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { getStorage, ref as storageRef } from 'firebase/storage'

const isChecking = ref(false)
const lastCheck = ref(null)
const overallStatus = ref('checking')
const services = ref([
  {
    name: 'Authentication',
    icon: '🔐',
    status: 'checking',
    latency: null
  },
  {
    name: 'Database',
    icon: '💾',
    status: 'checking',
    latency: null
  },
  {
    name: 'Storage',
    icon: '📁',
    status: 'checking',
    latency: null
  },
  {
    name: 'Functions',
    icon: '⚡',
    status: 'checking',
    latency: null
  }
])
const recentIssues = ref([])

const getStatusMessage = (status) => {
  switch (status) {
    case 'operational':
      return 'Fully Operational'
    case 'degraded':
      return 'Performance Issues'
    case 'down':
      return 'Service Unavailable'
    case 'checking':
      return 'Checking Status...'
    default:
      return 'Unknown Status'
  }
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp instanceof Date ? timestamp : timestamp.toDate()
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true
  }).format(date)
}

const checkAuth = async () => {
  const auth = getAuth()
  const startTime = performance.now()
  try {
    await signInAnonymously(auth)
    const latency = Math.round(performance.now() - startTime)
    return { status: 'operational', latency }
  } catch (error) {
    console.error('Auth check failed:', error)
    return { 
      status: 'down', 
      message: 'Authentication service is not responding' 
    }
  }
}

const checkDatabase = async () => {
  const db = getFirestore()
  const startTime = performance.now()
  try {
    const q = query(collection(db, 'health_checks'), limit(1))
    await getDocs(q)
    const latency = Math.round(performance.now() - startTime)
    return { status: 'operational', latency }
  } catch (error) {
    console.error('Database check failed:', error)
    return { 
      status: 'down', 
      message: 'Database service is not responding' 
    }
  }
}

const checkStorage = async () => {
  const storage = getStorage()
  const startTime = performance.now()
  try {
    const testRef = storageRef(storage, 'health_check.txt')
    await testRef.toString() // Light operation to test connectivity
    const latency = Math.round(performance.now() - startTime)
    return { status: 'operational', latency }
  } catch (error) {
    console.error('Storage check failed:', error)
    return { 
      status: 'down', 
      message: 'Storage service is not responding' 
    }
  }
}

const checkFunctions = async () => {
  const functions = getFunctions()
  const startTime = performance.now()
  try {
    const healthCheck = httpsCallable(functions, 'healthCheck')
    await healthCheck()
    const latency = Math.round(performance.now() - startTime)
    return { status: 'operational', latency }
  } catch (error) {
    console.error('Functions check failed:', error)
    return { 
      status: 'down', 
      message: 'Cloud Functions service is not responding' 
    }
  }
}

const updateServiceStatus = (serviceName, result) => {
  const service = services.value.find(s => s.name === serviceName)
  if (service) {
    service.status = result.status
    service.latency = result.latency
    service.message = result.message
  }
}

const calculateOverallStatus = () => {
  const statuses = services.value.map(s => s.status)
  if (statuses.every(s => s === 'operational')) {
    return 'operational'
  }
  if (statuses.some(s => s === 'down')) {
    return 'down'
  }
  return 'degraded'
}

const refreshStatus = async () => {
  if (isChecking.value) return
  
  isChecking.value = true
  lastCheck.value = new Date()
  
  try {
    // Reset all services to checking
    services.value.forEach(service => {
      service.status = 'checking'
      service.latency = null
      service.message = null
    })
    
    // Check all services in parallel
    const [authResult, dbResult, storageResult, functionsResult] = await Promise.all([
      checkAuth(),
      checkDatabase(),
      checkStorage(),
      checkFunctions()
    ])
    
    // Update individual service statuses
    updateServiceStatus('Authentication', authResult)
    updateServiceStatus('Database', dbResult)
    updateServiceStatus('Storage', storageResult)
    updateServiceStatus('Functions', functionsResult)
    
    // Update overall status
    overallStatus.value = calculateOverallStatus()
    
    // Log issues if any service is not operational
    const newIssues = services.value
      .filter(s => s.status !== 'operational')
      .map(s => ({
        id: Date.now() + Math.random(),
        service: s.name,
        timestamp: new Date(),
        description: s.message || `Service is ${s.status}`
      }))
    
    if (newIssues.length) {
      recentIssues.value = [...newIssues, ...recentIssues.value].slice(0, 5)
    }
    
  } catch (error) {
    console.error('Health check failed:', error)
    overallStatus.value = 'down'
  } finally {
    isChecking.value = false
  }
}

// Initial check on mount
onMounted(() => {
  refreshStatus()
  // Auto refresh every 5 minutes
  setInterval(refreshStatus, 5 * 60 * 1000)
})
</script>

<style scoped>
.health-check {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.status-header h3 {
  margin: 0;
  color: #2c3e50;
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 10px;
}

.last-check {
  color: #666;
  font-size: 14px;
}

.status-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.status-card.operational {
  background: #d4edda;
  border: 1px solid #c3e6cb;
}

.status-card.degraded {
  background: #fff3cd;
  border: 1px solid #ffeeba;
}

.status-card.down {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
}

.status-icon {
  font-size: 24px;
  margin-right: 15px;
}

.status-info h4 {
  margin: 0 0 5px 0;
  color: #2c3e50;
}

.status-info p {
  margin: 0;
  color: #666;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.service-card {
  padding: 15px;
  border-radius: 8px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
}

.service-card.operational {
  border-left: 4px solid #28a745;
}

.service-card.degraded {
  border-left: 4px solid #ffc107;
}

.service-card.down {
  border-left: 4px solid #dc3545;
}

.service-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.service-icon {
  font-size: 20px;
}

.service-name {
  font-weight: 500;
  color: #2c3e50;
}

.service-status {
  margin-bottom: 5px;
  color: #666;
}

.service-latency {
  font-size: 14px;
  color: #666;
}

.service-message {
  margin-top: 5px;
  font-size: 14px;
  color: #dc3545;
}

.recent-issues {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #dee2e6;
}

.recent-issues h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
}

.issue-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.issue-item {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
  align-items: center;
}

.issue-time {
  color: #666;
  font-size: 14px;
}

.issue-service {
  font-weight: 500;
  color: #2c3e50;
}

.issue-description {
  color: #666;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}
</style> 