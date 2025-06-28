<template>
  <div class="dialog-backdrop">
    <div class="dialog">
      <header>
        <h2>Export Students</h2>
        <button @click="$emit('close')">X</button>
      </header>
      <main>
        <p>Export {{ students.length }} students</p>
        <div class="export-options">
          <label>
            <input type="checkbox" v-model="includeHeaders" />
            Include headers
          </label>
          <label>
            <input type="checkbox" v-model="includeIds" />
            Include IDs
          </label>
        </div>
      </main>
      <footer>
        <button @click="$emit('close')">Cancel</button>
        <button @click="exportData">Export</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  students: {
    type: Array,
    default: () => []
  }
})

defineEmits(['close'])

const includeHeaders = ref(true)
const includeIds = ref(false)

function exportData() {
  // Basic CSV export functionality
  const headers = includeHeaders.value ? ['ID', 'First Name', 'Last Name', 'Email'] : []
  const data = props.students.map(student => [
    includeIds.value ? student.id : '',
    student.first_name || '',
    student.last_name || '',
    student.email || ''
  ])
  
  const csvContent = [headers, ...data]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'students-export.csv'
  a.click()
  window.URL.revokeObjectURL(url)
  
  // Close dialog
  emit('close')
}
</script>

<style scoped>
.dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  max-width: 90vw;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 15px 0;
}

.export-options label {
  display: flex;
  align-items: center;
  gap: 8px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:first-child {
  background: #f0f0f0;
}

button:last-child {
  background: #007bff;
  color: white;
}
</style>
