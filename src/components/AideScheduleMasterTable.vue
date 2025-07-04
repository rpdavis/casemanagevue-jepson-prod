<template>
  <div class="master-schedule">
    <h2>Master Schedule View</h2>
    <!-- Tab bar for time table selection (parent should handle selection) -->
    <slot name="tab-bar"></slot>
    <div v-if="!currentTimeTable || !currentTimeTable.schedule || currentTimeTable.schedule.length === 0" class="no-time-table">
      <div class="no-data-message">
        <h3>No Time Table Configured</h3>
        <p>You need to configure a time table first before you can create aide assignments.</p>
        <button @click="$emit('gotoTimeTableConfig')" class="btn btn-primary">
          Go to Time Table Configuration
        </button>
      </div>
    </div>
    <div v-else class="schedule-graph-container">
      <!-- Timeline Header -->
      <div class="timeline-header">
        <div class="aide-name-header">Aide Name</div>
        <div
          class="timeline-container"
          :style="{ height: computedHeaderHeight + 'px' }"
        >
          <div
            class="time-blocks-header"
            :style="{ height: computedHeaderHeight + 'px' }"
          >
            <div
              v-for="block in headerBlocksWithOverlap"
              :key="block.id + '-' + block.overlapIndex"
              class="time-block-header"
              :class="getBlockType(block)"
              :style="{
                left: getBlockPosition(block.startTime) + '%',
                width: getBlockWidth(block.startTime, block.endTime) + '%',
                top: (block.overlapIndex * headerRowHeight) + 'px',
                height: headerRowHeight + 'px',
                zIndex: 10
              }"
            >
              <div class="block-time">{{ block.startTime }}</div>
              <div class="block-name">{{ block.name || block.type }}</div>
              <div class="block-time">{{ block.endTime }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Aide rows with horizontal bar graphs -->
      <div v-for="aide in paraeducators" :key="aide.id" class="aide-row">
        <div class="aide-header">
          <span class="aide-name">{{ getAideName(aide.id) }}</span>
          <button @click="$emit('editAideAssignment', aide.id)" class="btn btn-small btn-primary edit-btn">
            Edit
          </button>
        </div>
        <div class="time-line-container">
          <!-- Time blocks as background -->
          <div class="time-blocks-background">
            <div 
              v-for="block in blocks" 
              :key="block.id" 
              class="time-block-bg"
              :class="getBlockType(block)"
              :style="{ 
                left: getBlockPosition(block.startTime) + '%',
                width: getBlockWidth(block.startTime, block.endTime) + '%'
              }"
            >
            </div>
            
            <!-- Add matching gap columns in background for alignment -->
            <div 
              v-for="(block, index) in blocks.slice(0, -1)" 
              :key="`bg-gap-${block.id}`"
              class="time-block-bg-gap"
              :style="{ 
                left: (getBlockPosition(block.endTime) - 0.5) + '%',
                width: '1%'
              }"
            ></div>
          </div>
          
          <!-- Assignment bars -->
          <div class="assignment-bars">
            <div 
              v-for="assignment in getAideAssignments(aide.id)" 
              :key="assignment.id"
              class="master-assignment-bar"
              :class="assignment.type"
              :style="{
                left: getAssignmentPosition(assignment.start) + '%',
                width: getAssignmentWidth(assignment.start, assignment.end) + '%',
                top: getAssignmentTop(assignment) + 'px'
              }"
            >
              <span class="assignment-label">{{ assignment.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, ref } from 'vue'

const props = defineProps({
  paraeducators: Array,
  blocks: Array,
  getAideTimeBlocks: Function,
  getAideName: Function,
  currentTimeTable: Object
})
const emit = defineEmits(['editAideAssignment', 'gotoTimeTableConfig'])

const localAssignments = ref([])

// Get all assignments for an aide (from individual schedule)
function getAideAssignments(aideId) {
  // Get assignments from individual schedule
  const aideData = props.getAideTimeBlocks(aideId)
    .filter(block => block.assignment)
    .map(block => ({
      id: block.id,
      label: block.assignment,
      type: block.assignmentType,
      start: block.start || block.displayTime.split(' - ')[0],
      end: block.end || block.displayTime.split(' - ')[1]
    }))
  
  // Calculate overlap positions
  return calculateOverlapPositions(aideData)
}

// Calculate overlap positions for assignments
function calculateOverlapPositions(assignments) {
  if (assignments.length === 0) return []
  
  // Sort assignments by start time
  const sortedAssignments = [...assignments].sort((a, b) => 
    timeToMinutes(a.start) - timeToMinutes(b.start)
  )
  
  // Group overlapping assignments
  const overlapGroups = []
  let currentGroup = []
  
  for (const assignment of sortedAssignments) {
    if (currentGroup.length === 0) {
      currentGroup = [assignment]
    } else {
      // Check if this assignment overlaps with any in current group
      const overlaps = currentGroup.some(existing => 
        timeToMinutes(assignment.start) < timeToMinutes(existing.end) &&
        timeToMinutes(assignment.end) > timeToMinutes(existing.start)
      )
      
      if (overlaps) {
        currentGroup.push(assignment)
      } else {
        // No overlap, start new group
        overlapGroups.push(currentGroup)
        currentGroup = [assignment]
      }
    }
  }
  
  // Add the last group
  if (currentGroup.length > 0) {
    overlapGroups.push(currentGroup)
  }
  
  // Assign vertical positions within each group
  const result = []
  for (const group of overlapGroups) {
    group.forEach((assignment, index) => {
      assignment.overlapIndex = index
      assignment.overlapCount = group.length
      result.push(assignment)
    })
  }
  
  return result
}

// Calculate vertical position for overlapping assignments
function getAssignmentTop(assignment) {
  if (!assignment.overlapCount || assignment.overlapCount <= 1) {
    return 10 // Single assignment, center it
  }
  
  // Multiple overlapping assignments, stack them
  const barHeight = 40
  const margin = 10
  const totalHeight = assignment.overlapCount * barHeight + (assignment.overlapCount - 1) * 2
  const startTop = (60 - totalHeight) / 2 // Center the group
  
  return startTop + assignment.overlapIndex * (barHeight + 2)
}

// Calculate position and width for time blocks
function getBlockPosition(startTime) {
  if (!props.blocks || props.blocks.length === 0) {
    return 0
  }
  
  const firstBlock = props.blocks[0]
  const lastBlock = props.blocks[props.blocks.length - 1]
  
  const timelineStartMinutes = timeToMinutes(firstBlock.startTime)
  const timelineEndMinutes = timeToMinutes(lastBlock.endTime)
  const timelineTotalMinutes = timelineEndMinutes - timelineStartMinutes
  
  const startMinutes = timeToMinutes(startTime)
  const position = ((startMinutes - timelineStartMinutes) / timelineTotalMinutes) * 100
  
  // Ensure position is within reasonable bounds
  const clampedPosition = Math.max(0, Math.min(95, position))
  return clampedPosition
}

function getBlockWidth(startTime, endTime) {
  if (!props.blocks || props.blocks.length === 0) {
    return 10
  }
  
  const firstBlock = props.blocks[0]
  const lastBlock = props.blocks[props.blocks.length - 1]
  
  const timelineStartMinutes = timeToMinutes(firstBlock.startTime)
  const timelineEndMinutes = timeToMinutes(lastBlock.endTime)
  const timelineTotalMinutes = timelineEndMinutes - timelineStartMinutes
  
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  const width = ((endMinutes - startMinutes) / timelineTotalMinutes) * 100
  
  // Ensure width is reasonable
  const clampedWidth = Math.max(5, Math.min(95, width))
  return clampedWidth
}

// Calculate position and width for assignments
function getAssignmentPosition(startTime) {
  if (!props.blocks || props.blocks.length === 0) {
    return 0
  }
  
  const firstBlock = props.blocks[0]
  const lastBlock = props.blocks[props.blocks.length - 1]
  
  const timelineStartMinutes = timeToMinutes(firstBlock.startTime)
  const timelineEndMinutes = timeToMinutes(lastBlock.endTime)
  const timelineTotalMinutes = timelineEndMinutes - timelineStartMinutes
  
  const startMinutes = timeToMinutes(startTime)
  const position = ((startMinutes - timelineStartMinutes) / timelineTotalMinutes) * 100
  return Math.max(0, Math.min(95, position)) // Ensure it's within bounds
}

function getAssignmentWidth(startTime, endTime) {
  if (!props.blocks || props.blocks.length === 0) {
    return 10
  }
  
  const firstBlock = props.blocks[0]
  const lastBlock = props.blocks[props.blocks.length - 1]
  
  const timelineStartMinutes = timeToMinutes(firstBlock.startTime)
  const timelineEndMinutes = timeToMinutes(lastBlock.endTime)
  const timelineTotalMinutes = timelineEndMinutes - timelineStartMinutes
  
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  const width = ((endMinutes - startMinutes) / timelineTotalMinutes) * 100
  return Math.max(5, Math.min(95, width)) // Ensure minimum width and within bounds
}

// Helper functions
function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Determine block type based on name
function getBlockType(block) {
  const name = block.name?.toLowerCase() || ''
  
  if (name.includes('lunch')) {
    return 'lunch'
  } else if (name.includes('break') || name.includes('recess')) {
    return 'break'
  } else if (name.includes('period') || name.includes('class')) {
    return 'period'
  } else {
    return 'other'
  }
}

// --- Improved interval packing for header blocks ---
function calculateHeaderPackedRows(blocks) {
  // Sort by start time
  const sorted = [...blocks].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
  const rows = [] // Each row is an array of blocks
  for (const block of sorted) {
    let placed = false
    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx]
      // Check if block can be placed in this row (no overlap, end == start is allowed)
      const conflict = row.some(b =>
        timeToMinutes(block.startTime) < timeToMinutes(b.endTime) &&
        timeToMinutes(block.endTime) > timeToMinutes(b.startTime)
      )
      if (!conflict) {
        row.push(block)
        block.overlapIndex = rowIdx
        placed = true
        break
      }
    }
    if (!placed) {
      // New row
      block.overlapIndex = rows.length
      rows.push([block])
    }
  }
  const overlapCount = rows.length
  // Assign overlapCount to all
  return sorted.map(b => ({ ...b, overlapIndex: b.overlapIndex, overlapCount }))
}

const headerBlocksWithOverlap = computed(() => calculateHeaderPackedRows(props.blocks || []))

// Compute the max overlap count for the header
const maxHeaderOverlapCount = computed(() =>
  Math.max(...headerBlocksWithOverlap.value.map(b => b.overlapCount || 1), 1)
)

const headerRowHeight = 30; // px per overlap row
const computedHeaderHeight = computed(() => maxHeaderOverlapCount.value * headerRowHeight);

watch(
  () => props.aideAssignments,
  (newVal) => {
    localAssignments.value = newVal ? JSON.parse(JSON.stringify(newVal)) : []
  },
  { immediate: true }
)

</script>

<style scoped>
.master-schedule {
  margin: 20px 0;
  font-family: 'Inter', 'Segoe UI', 'Arial', sans-serif;
}

.schedule-graph-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
  border: 1px solid #dee2e6;
}

.timeline-header {
  display: flex;
  border-bottom: 2px solid #dee2e6;
  background: #f8f9fa;
}

.aide-name-header {
  width: 200px;
  padding: 12px;
  font-weight: 600;
  color: #333;
  border-right: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  font-size: 0.95rem;
}

.timeline-container {
  flex: 1;
  position: relative;
  height: 80px;
}

.time-blocks-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.time-block-header {
  position: absolute;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 0.75em;
  font-weight: 500;
  color: #333;
  border-right: 1px solid #dee2e6;
  text-align: center;
  padding: 4px;
}

.time-block-header.period {
  background: #eaf4fb !important;
}

.time-block-header.lunch {
  background: #fffbe7 !important;
}

.time-block-header.break {
  background: #e6fcf7 !important;
}

.time-block-header.other {
  background: #f8f3fa !important;
}

.time-block-gap {
  position: absolute;
  height: 100%;
  background: transparent;
  border-right: 1px solid #dee2e6;
  z-index: 5;
}

.block-time {
  font-size: 0.7em;
  color: #666;
  font-family: monospace;
  margin: 2px 0;
}

.block-name {
  font-size: 0.8em;
  font-weight: 600;
  color: #333;
  margin: 2px 0;
}

.aide-row {
  display: flex;
  border-bottom: 1px solid #dee2e6;
  background: white;
}

.aide-row:last-child {
  border-bottom: none;
}

.aide-row:hover {
  background: #f8f9fa;
}

.aide-header {
  width: 200px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-right: 1px solid #dee2e6;
  background: white;
}

.aide-name {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.edit-btn {
  padding: 4px 8px;
  font-size: 0.8em;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.edit-btn:hover {
  background: #0056b3;
}

.time-line-container {
  flex: 1;
  position: relative;
  height: 60px;
  background: white;
  overflow: hidden;
}

.time-blocks-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
}

.time-block-bg {
  position: absolute;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75em;
  font-weight: 500;
  color: #666;
  border-right: 1px solid #dee2e6;
}

.time-block-bg.period {
  background: #eaf4fb !important;
}

.time-block-bg.lunch {
  background: #fffbe7 !important;
}

.time-block-bg.break {
  background: #e6fcf7 !important;
}

.time-block-bg.other {
  background: #ffffff !important;
}

.time-block-bg-gap {
  position: absolute;
  height: 100%;
  background: transparent;
  border-right: 1px solid #dee2e6;
  z-index: 1;
}

.assignment-bars {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.master-assignment-bar {
  position: absolute;
  height: 25px;
  margin: 10px 0;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85em;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  pointer-events: auto;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  min-width: 60px;
  z-index: 10;
}

.master-assignment-bar:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
}

.master-assignment-bar.class {
  background: linear-gradient(135deg, #4a90e2, #357abd);
  border: 1px solid #357abd;
}

.master-assignment-bar.student {
  background: linear-gradient(135deg, #7cb342, #5a8a2e);
  border: 1px solid #5a8a2e;
}

.master-assignment-bar.custom {
  background: linear-gradient(135deg, #9e9e9e, #757575);
  border: 1px solid #757575;
}

.master-assignment-bar.break {
  background: linear-gradient(135deg, #4adae2, #35bd90);
  border: 1px solid #35bdaf;
}

.master-assignment-bar.lunch {
  background: linear-gradient(135deg, #e2984a, #bd8d35);
  border: 1px solid #bd9f35;
}

.master-assignment-bar.other {
  background: linear-gradient(135deg, #cc4d41, #bd5035);
  border: 1px solid #bd5535;
}

.assignment-label {
  text-align: center;
  padding: 0 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  font-size: 0.8em;
}

.no-time-table {
  text-align: center;
  padding: 40px;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 20px 0;
  border: 1px solid #dee2e6;
}

.no-data-message h3 {
  color: #666;
  margin-bottom: 10px;
  font-size: 1.2rem;
}

.no-data-message p {
  color: #999;
  margin-bottom: 20px;
  font-size: 0.95rem;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  text-decoration: none;
  display: inline-block;
  transition: background 0.2s;
  font-weight: 500;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-small {
  padding: 4px 8px;
  font-size: 0.8em;
}
.time-block-bg.period,.time-block-bg.break,.time-block-bg.class,.time-block-bg.lunch,.time-block-bg.other{
  background: #ffffff !important;
}
</style> 
