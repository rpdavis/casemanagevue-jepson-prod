<template>
  <nav id="nav">
    <!-- Left side - User info and navigation -->
    <div class="nav-left">
      <div id="user-info">
        {{ currentUser?.name || currentUser?.email || 'User' }}
        <span v-if="currentUser?.role">({{ currentUser.role }})</span>
      </div>
    </div>

    <!-- Right side - Navigation buttons and logout -->
    <div class="nav-right">
      <!-- Navigation buttons based on user role -->
      <button 
        v-if="isAdmin" 
        @click="$router.push('/admin')"
        :class="{ active: $route.name === 'Admin' }"
      >
        Admin
      </button>
      
      <button 
        @click="$router.push('/students')"
        :class="{ active: $route.name === 'Students' || $route.name === 'Home' }"
      >
        Students
      </button>

      <!-- Dropdown menu for additional options -->
      <div class="dropdown" :class="{ open: showDropdown }">
        <button class="dropbtn" @click="toggleDropdown">
          Menu ▼
        </button>
        <div class="dropdown-content">
                      <a v-if="isAdmin" @click="navigateTo('/admin')">Admin Dashboard</a>
            <a v-if="isAdmin" @click="navigateTo('/admin/users')">Manage Users</a>
            <a v-if="isAdmin" @click="navigateTo('/admin/permissions')">Permissions</a>
          <a @click="navigateTo('/students')">All Students</a>
          <a @click="showExport = true">Export Data</a>
          <a @click="printPage">Print View</a>

        </div>
      </div>

      <!-- Logout button -->
      <button id="logout" @click="handleLogout">
        Logout
      </button>
    </div>
  </nav>

  <!-- Export dialog -->
  <div v-if="showExport" class="ex-dialog-overlay" @click="showExport = false">
    <div class="ex-dialog-box" @click.stop>
      <h3>Export Options</h3>
      <form id="export-form">
        <div>
          <label>
            <input type="checkbox" v-model="exportOptions.students" />
            Students
          </label>
          <label>
            <input type="checkbox" v-model="exportOptions.services" />
            Services
          </label>
          <label>
            <input type="checkbox" v-model="exportOptions.schedule" />
            Schedule
          </label>
        </div>
        <div>
          <label>
            <input type="checkbox" v-model="exportOptions.instruction" />
            Instruction Accom.
          </label>
          <label>
            <input type="checkbox" v-model="exportOptions.assessment" />
            Assessment Accom.
          </label>
          <label>
            <input type="checkbox" v-model="exportOptions.dates" />
            Important Dates
          </label>
        </div>
      </form>
      <div class="ex-dialog-actions">
        <button @click="handleExport">Export</button>
        <button @click="showExport = false">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/authStore'
const router = useRouter()
const authStore = useAuthStore()

const currentUser = computed(() => authStore.currentUser)
const showDropdown = ref(false)
const showExport = ref(false)

const exportOptions = ref({
  students: true,
  services: true,
  schedule: true,
  instruction: true,
  assessment: true,
  dates: true
})

// Check if user is admin
const isAdmin = computed(() => {
  const role = currentUser.value?.role
  return ['admin', 'administrator', 'sped_chair', 'administrator_504_CM'].includes(role)
})

// Toggle dropdown menu
function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

// Close dropdown when clicking outside
function closeDropdown() {
  showDropdown.value = false
}

// Navigation helper
function navigateTo(path) {
  router.push(path)
  showDropdown.value = false
}

// Handle logout
async function handleLogout() {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

// Print functionality
function printPage() {
  window.print()
}

// Export functionality
function handleExport() {
  // Implement export logic here
  console.log('Exporting with options:', exportOptions.value)
  showExport.value = false
}

// Close dropdown when clicking outside
document.addEventListener('click', (event) => {
  if (!event.target.closest('.dropdown')) {
    showDropdown.value = false
  }
})
</script>

<style scoped>
/* The main navbar styles are already in your imported CSS files */
/* Additional component-specific styles */

.dropdown-content a {
  cursor: pointer;
}

button.active {
  background-color: #dbe9ff !important;
  color: #005bb5 !important;
}

/* Ensure the dropdown is properly positioned */
.dropdown {
  position: relative;
}

.dropdown-content {
  display: none;
  position: absolute;
  top: 2.5rem;
  left: 0;
  background-color: white;
  min-width: 160px;
  z-index: 1000;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  border-radius: 6px;
  overflow: hidden;
}

.dropdown-content a {
  color: #005bb5;
  padding: 10px 14px;
  text-decoration: none;
  display: block;
  font-weight: 500;
  transition: background-color 0.2s;
}

.dropdown-content a:hover {
  background-color: #f4f4f4;
}



.dropdown.open .dropdown-content {
  display: block;
}

/* Export dialog styles */
.ex-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.ex-dialog-box {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0,0,0,0.3);
  max-width: 500px;
  width: 90%;
}

#export-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin: 1rem 0;
}

#export-form label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.ex-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.ex-dialog-actions button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.ex-dialog-actions button:first-child {
  background-color: #005bb5;
  color: white;
}

.ex-dialog-actions button:last-child {
  background-color: #6c757d;
  color: white;
}
</style>
