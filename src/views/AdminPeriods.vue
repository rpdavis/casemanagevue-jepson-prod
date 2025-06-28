<template>
  <div>
    <h2>Periods & Times</h2>
    <form @submit.prevent="submitPeriod" class="periods-form">
      <input type="hidden" v-model="editingId" />
      <div style="margin-bottom:0.7em;">
        <label>
          Name: 
          <input 
            type="text" 
            v-model="periodForm.name" 
            required 
            style="margin-left:0.5em;"
          />
        </label>
      </div>
      <div style="margin-bottom:0.7em;">
        <label>
          Start Time: 
          <input 
            type="time" 
            v-model="periodForm.start" 
            required 
            style="margin-left:0.5em;"
          />
        </label>
      </div>
      <div style="margin-bottom:0.7em;">
        <label>
          End Time: 
          <input 
            type="time" 
            v-model="periodForm.end" 
            required 
            style="margin-left:0.5em;"
          />
        </label>
      </div>
      <button type="submit" id="period-submit-btn">
        {{ editingId ? 'Save Changes' : 'Add Period' }}
      </button>
      <button 
        v-if="editingId" 
        type="button" 
        @click="cancelEdit" 
        style="display:inline;margin-left:0.7em;"
      >
        Cancel
      </button>
    </form>
    
    <div :style="{ margin: '0.7em 0 0.7em 0', color: isError ? '#b42c2c' : '#267838', minHeight: '1.5em' }">
      {{ statusMessage }}
    </div>
    
    <h3 style="margin-top:2em;">Existing Periods</h3>
    <table class="periods-table">
      <thead>
        <tr>
          <th style="text-align:left;">Name</th>
          <th style="text-align:left;">Start</th>
          <th style="text-align:left;">End</th>
          <th style="text-align:left;">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="periods.length === 0">
          <td colspan="4">No periods defined.</td>
        </tr>
        <tr v-for="period in periods" :key="period.id">
          <td>{{ period.name }}</td>
          <td>{{ period.start }}</td>
          <td>{{ period.end }}</td>
          <td>
            <button type="button" class="edit-period" @click="editPeriod(period.id)">
              Edit
            </button>
            <button 
              type="button" 
              class="delete-period" 
              @click="deletePeriod(period.id)"
              style="margin-left:0.7em;"
            >
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore'

export default {
  name: 'AdminPeriods',
  setup() {
    const db = getFirestore()
    
    const periods = ref([])
    const editingId = ref(null)
    const statusMessage = ref('')
    const isError = ref(false)
    
    const periodForm = reactive({
      name: '',
      start: '',
      end: ''
    })

    const showStatus = (message, error = false) => {
      statusMessage.value = message
      isError.value = error
      setTimeout(() => {
        statusMessage.value = ''
        isError.value = false
      }, 3000)
    }

    const renderPeriods = async () => {
      try {
        const periodsCol = collection(db, 'periods')
        const snapshot = await getDocs(periodsCol)
        const periodsData = []
        snapshot.forEach(docSnap => {
          const data = docSnap.data()
          periodsData.push({ id: docSnap.id, ...data })
        })
        periods.value = periodsData
      } catch (error) {
        console.error('Error loading periods:', error)
        showStatus('Error loading periods', true)
      }
    }

    const submitPeriod = async () => {
      const { name, start, end } = periodForm
      
      if (!name || !start || !end) {
        showStatus('All fields are required.', true)
        return
      }

      try {
        if (editingId.value) {
          await updateDoc(doc(db, 'periods', editingId.value), { name, start, end })
          showStatus('Period updated.')
        } else {
          await addDoc(collection(db, 'periods'), { name, start, end })
          showStatus('Period added.')
        }
        
        // Reset form
        periodForm.name = ''
        periodForm.start = ''
        periodForm.end = ''
        editingId.value = null
        
        await renderPeriods()
      } catch (err) {
        console.error('Error saving period:', err)
        showStatus(`Error: ${err.message}`, true)
      }
    }

    const editPeriod = async (id) => {
      try {
        const periodsCol = collection(db, 'periods')
        const snapshot = await getDocs(periodsCol)
        let found = null
        
        snapshot.forEach(docSnap => {
          if (docSnap.id === id) found = docSnap.data()
        })
        
        if (found) {
          editingId.value = id
          periodForm.name = found.name
          periodForm.start = found.start
          periodForm.end = found.end
          showStatus('')
        }
      } catch (error) {
        console.error('Error loading period for editing:', error)
        showStatus('Error loading period', true)
      }
    }

    const deletePeriod = async (id) => {
      if (!confirm('Delete this period?')) return
      
      try {
        await deleteDoc(doc(db, 'periods', id))
        showStatus('Period deleted.')
        await renderPeriods()
      } catch (error) {
        console.error('Error deleting period:', error)
        showStatus('Error deleting period', true)
      }
    }

    const cancelEdit = () => {
      editingId.value = null
      periodForm.name = ''
      periodForm.start = ''
      periodForm.end = ''
      showStatus('')
    }

    onMounted(() => {
      renderPeriods()
    })

    return {
      periods,
      editingId,
      periodForm,
      statusMessage,
      isError,
      submitPeriod,
      editPeriod,
      deletePeriod,
      cancelEdit
    }
  }
}
</script>

<style scoped>
/* Styles are in admin-panel.css */
</style>
