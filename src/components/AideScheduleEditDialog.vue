<template>
  <div class="dialog-overlay" @click="onClose">
    <div class="edit-dialog" @click.stop>
      <div class="dialog-header">
        <h2>Edit Schedule: {{ aideName }}</h2>
        <div class="dialog-header-actions">
          <button @click="onImportAssignments" class="btn btn-secondary btn-import-assignments">Import Aide Assignments</button>
          <button @click="openAddAssignmentDialog" class="btn btn-primary btn-add-assignment">Add Assignment</button>
          <button @click="onClose" class="btn btn-secondary close-btn">×</button>
        </div>
      </div>
      <div class="dialog-content">
        <div style="display: flex; align-items: flex-start;">
          <VerticalTimeGrid
            :timeTicks="timeTicks"
            :isTickInAnyBlock="isTickInAnyBlock"
            :assignments="localAssignments"
            :getAssignmentBoxStyle="getAssignmentBoxStyle"
            :onAssignmentDragStart="onAssignmentDragStart"
            :onAssignmentDrag="onAssignmentDrag"
            :onAssignmentDragEnd="onAssignmentDragEnd"
            :onResizeStart="onResizeStart"
            :blocks="blocks"
            @edit-assignment="handleEditAssignment"
            @update:assignments="handleUpdateAssignments"
          />
        </div>
        <AssignmentDialog v-if="showAssignmentDialog" :teachers="teachers" :students="students" :assignment="editingAssignment" @save="handleAssignmentDialogSave" @close="handleAssignmentDialogClose" />
      </div>
      <div class="dialog-actions">
        <button @click="handleSave" class="btn btn-primary" :disabled="saving">
          <span v-if="saving">💾</span>
          <span v-else>💾</span>
          {{ saving ? 'Saving...' : 'Save Schedule' }}
        </button>
        <button @click="onClose" class="btn btn-secondary">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import VerticalTimeGrid from './VerticalTimeGrid.vue'
import AssignmentDialog from './AssignmentDialog.vue'

const props = defineProps({
  aideName: String,
  timeTicks: Array,
  isTickInAnyBlock: Function,
  aideAssignments: Array,
  getAssignmentBoxStyle: Function,
  onAssignmentDragStart: Function,
  onAssignmentDrag: Function,
  onAssignmentDragEnd: Function,
  onResizeStart: Function,
  showAddAssignment: Boolean,
  addAssignment: Function,
  onImportAssignments: Function,
  onSave: Function,
  onClose: Function,
  saving: Boolean,
  blocks: Array,
  teachers: Array,
  students: Array
})

const localAssignments = ref([])
const showAssignmentDialog = ref(false)
const editingAssignment = ref(null)

onMounted(() => {
  console.log('DEBUG: AideScheduleEditDialog mounted, blocks:', props.blocks)
})

watch(() => props.blocks, (val) => {
  console.log('DEBUG: props.blocks in AideScheduleEditDialog', val)
})

function handleSave() {
  props.onSave(localAssignments.value)
}

function openAddAssignmentDialog() {
  localAssignments.value = props.aideAssignments ? JSON.parse(JSON.stringify(props.aideAssignments)) : []
  showAssignmentDialog.value = true
}

function handleEditAssignment(assignment) {
  localAssignments.value = props.aideAssignments ? JSON.parse(JSON.stringify(props.aideAssignments)) : []
  editingAssignment.value = { ...assignment }
  showAssignmentDialog.value = true
}

function handleAssignmentDialogSave(newAssignment) {
  if (editingAssignment.value) {
    // Update existing assignment
    const idx = localAssignments.value.findIndex(a => a.id === newAssignment.id)
    if (idx !== -1) {
      localAssignments.value[idx] = { ...newAssignment }
    }
    editingAssignment.value = null
  } else {
    // Add new assignment
    localAssignments.value = [...localAssignments.value, newAssignment]
  }
  showAssignmentDialog.value = false
}

function handleAssignmentDialogClose() {
  editingAssignment.value = null
  showAssignmentDialog.value = false
}

function handleUpdateAssignments(assignments) {
  console.log('handleUpdateAssignments called with:', assignments)
  localAssignments.value = assignments
}
</script> 