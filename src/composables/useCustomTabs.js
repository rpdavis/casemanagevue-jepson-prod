import { ref, computed } from 'vue'

export function useCustomTabs(testingData, googleSheetsIntegration) {
  const { getStudentsForTeachers } = testingData
  const { createCustomTab, deleteCustomTab } = googleSheetsIntegration

  // Custom tabs state
  const customTabs = ref([])
  const showAddTabForm = ref(false)
  const newTabName = ref('')
  const selectedTeachers = ref([])
  const selectedExcludedPeriods = ref([])
  const maxCustomTabs = 5

  // Preview of filtered students
  const filteredStudentsPreview = computed(() => {
    if (selectedTeachers.value.length === 0) return []
    return getStudentsForTeachers(selectedTeachers.value, selectedExcludedPeriods.value)
  })

  // Add custom tab
  const addCustomTab = async (users) => {
    if (!newTabName.value.trim() || selectedTeachers.value.length === 0) {
      alert('Please enter a tab name and select at least one teacher')
      return
    }
    
    if (customTabs.value.length >= maxCustomTabs) {
      alert(`Maximum of ${maxCustomTabs} custom tabs allowed`)
      return
    }
    
    try {
      // Get the filtered students for these teachers
      const filteredStudents = getStudentsForTeachers(selectedTeachers.value, selectedExcludedPeriods.value)
      
      // Create the tab in Google Sheets
      const result = await createCustomTab(
        newTabName.value.trim(),
        filteredStudents,
        selectedTeachers.value,
        users, // Pass users data for teacher name lookup
        selectedExcludedPeriods.value // Pass excluded periods
      )
      
      // Store the tab info locally with the sheet ID
      const tab = {
        id: Date.now().toString(),
        name: newTabName.value.trim(),
        teachers: [...selectedTeachers.value],
        studentCount: result.rowCount,
        sheetId: result.sheetId // Store the Google Sheet tab ID
      }
      
      customTabs.value.push(tab)
      
      // Reset form
      resetForm()
      
      console.log('Custom tab added:', tab)
      alert(`Custom tab "${tab.name}" created successfully with ${result.rowCount} student entries!`)
      
    } catch (error) {
      console.error('Failed to create custom tab:', error)
      alert('Failed to create custom tab in Google Sheet. Please try again.')
    }
  }

  // Remove custom tab
  const removeCustomTab = async (tabId) => {
    const tab = customTabs.value.find(t => t.id === tabId)
    if (!tab) return
    
    if (confirm(`Are you sure you want to remove the "${tab.name}" tab?`)) {
      try {
        // Delete from Google Sheets if we have a sheet ID
        if (tab.sheetId) {
          await deleteCustomTab(tab.sheetId)
        }
        
        // Remove from local list
        customTabs.value = customTabs.value.filter(t => t.id !== tabId)
        
        console.log('Custom tab removed:', tabId)
        alert(`Tab "${tab.name}" removed successfully.`)
        
      } catch (error) {
        console.error('Failed to delete custom tab:', error)
        alert('Failed to delete tab from Google Sheet. You may need to delete it manually.')
        // Still remove from local list even if Google Sheets deletion failed
        customTabs.value = customTabs.value.filter(t => t.id !== tabId)
      }
    }
  }

  // Reset form
  const resetForm = () => {
    newTabName.value = ''
    selectedTeachers.value = []
    selectedExcludedPeriods.value = []
    showAddTabForm.value = false
  }

  // Toggle form visibility
  const toggleAddTabForm = () => {
    showAddTabForm.value = !showAddTabForm.value
    if (!showAddTabForm.value) {
      resetForm()
    }
  }

  return {
    // State
    customTabs,
    showAddTabForm,
    newTabName,
    selectedTeachers,
    selectedExcludedPeriods,
    maxCustomTabs,
    
    // Computed
    filteredStudentsPreview,
    
    // Methods
    addCustomTab,
    removeCustomTab,
    resetForm,
    toggleAddTabForm
  }
} 