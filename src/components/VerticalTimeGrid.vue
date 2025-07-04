<template>
  <div class="vertical-time-grid-wrapper">
    <div class="vertical-time-grid" ref="timeGridRef" :style="{ position: 'relative', height: gridHeight + 'px' }">
      <!-- Grid backgrounds with label/time in upper left, and side-by-side for overlaps -->
      <template v-for="(block, idx) in blocksWithId" :key="block.id">
        <div
          class="grid-block-bg"
          :class="block.type === 'period' ? 'blocktype-period' : 'blocktype-' + (block.type || 'period')"
          :style="getGridBlockStyle(block, idx)"
        >
          <div class="grid-block-label-time">
            <span class="grid-block-label" :title="block.name || (block.type === 'period' ? (block.label || block.periodName || block.periodNumber || 'Period') : (block.type ? block.type.charAt(0).toUpperCase() + block.type.slice(1) : ''))">
              {{ block.name || (block.type === 'period' ? (block.label || block.periodName || block.periodNumber || 'Period') : (block.type ? block.type.charAt(0).toUpperCase() + block.type.slice(1) : '')) }}
            </span>
            <span class="grid-block-time" :title="block.startTime">{{ block.startTime }}</span>
          </div>
        </div>
      </template>
      <!-- Assignment blocks with overlap logic -->
      <template v-for="(assignment, idx) in localAssignments" :key="assignment.id">
        <div
          class="dialog-assignment-box"
          :class="['type-' + (assignment.type || 'other'), { 'dragging': assignment.isDragging }]"
          :style="getAssignmentBlockStyle(assignment, idx)"
          draggable="true"
          @dragstart="onBlockDragStart($event, assignment)"
          @drag="onBlockDrag($event, assignment)"
          @dragend="onBlockDragEnd($event, assignment)"
        >
          <div class="assignment-content">
            <div class="assignment-label-time">
              <span class="assignment-time-label">{{ assignment.start }}–{{ assignment.end }} {{ assignment.label }}</span>
            </div>
          </div>
          <div class="assignment-actions">
            <button class="edit-btn" @click="$emit('edit-assignment', assignment)">✏️</button>
            <button class="delete-btn" @click="deleteAssignment(assignment.id)">🗑️</button>
          </div>
          <div
            class="resize-handle"
            @mousedown.stop="onResizeStart($event, assignment)"
            title="Drag to resize block"
          ></div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import AssignmentDialog from './AssignmentDialog.vue'
const props = defineProps({
  assignments: Array,
  teachers: Array, // pass from parent
  students: Array, // pass from parent
  getAssignmentBoxStyle: Function, // not used anymore
  onAssignmentDragStart: Function, // not used anymore
  onAssignmentDrag: Function, // not used anymore
  onAssignmentDragEnd: Function, // not used anymore
  onResizeStart: Function, // not used anymore
  blocks: Array // for min/max time
})
const emit = defineEmits(['update:assignments', 'edit-assignment'])
const timeGridRef = ref(null)
const showDialog = ref(false)

// --- Use a local copy of assignments for editing ---
const localAssignments = ref(props.assignments ? props.assignments.map(a => ({ ...a })) : [])

watch(() => props.assignments, (newVal) => {
  localAssignments.value = newVal ? newVal.map(a => ({ ...a })) : []
}, { immediate: true })

const GRID_PADDING = 24 // px, for top and bottom

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
function minutesToTime(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}`
}

const minTime = computed(() => {
  if (!props.blocks || props.blocks.length === 0) return '08:00'
  return props.blocks.reduce((min, b) => b.startTime < min ? b.startTime : min, props.blocks[0].startTime)
})
const maxTime = computed(() => {
  if (!props.blocks || props.blocks.length === 0) return '16:00'
  return props.blocks.reduce((max, b) => b.endTime > max ? b.endTime : max, props.blocks[0].endTime)
})
const minMins = computed(() => timeToMinutes(minTime.value))
const maxMins = computed(() => timeToMinutes(maxTime.value))
const totalMins = computed(() => maxMins.value - minMins.value)
const gridHeight = computed(() => totalMins.value * 2.5 + GRID_PADDING * 2) // Add padding to top and bottom

// Collect all unique tick times (start and end of each block)
const uniqueTicks = computed(() => {
  if (!props.blocks) return []
  const times = []
  props.blocks.forEach(b => {
    if (!times.includes(b.startTime)) times.push(b.startTime)
    if (!times.includes(b.endTime)) times.push(b.endTime)
  })
  // Sort times ascending
  return times.sort((a, b) => timeToMinutes(a) - timeToMinutes(b))
})

function tickToTop(tick) {
  return (timeToMinutes(tick) - minMins.value) * 2.5 + GRID_PADDING - 10 // -10 to center label on tick
}

// Helper: Check if two blocks overlap
function isOverlap(a, b) {
  if (!a || !b) return false
  const aStart = timeToMinutes(a.startTime)
  const aEnd = timeToMinutes(a.endTime)
  const bStart = timeToMinutes(b.startTime)
  const bEnd = timeToMinutes(b.endTime)
  return aStart < bEnd && aEnd > bStart
}

// Helper: Compute overlap groups with their time range
function computeBlockOverlapGroupsWithRange(blocks) {
  // Each group is an array of block ids that overlap
  const groups = []
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    let foundGroup = null
    for (let j = 0; j < groups.length; j++) {
      if (groups[j].ids.some(id => isOverlap(block, blocks.find(b => b.id === id)))) {
        foundGroup = groups[j]
        break
      }
    }
    if (foundGroup) {
      foundGroup.ids.push(block.id)
      foundGroup.blocks.push(block)
    } else {
      groups.push({ ids: [block.id], blocks: [block] })
    }
  }
  // Merge groups that have any overlap
  let merged = true
  while (merged) {
    merged = false
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        if (groups[i].ids.some(id1 => groups[j].ids.some(id2 => isOverlap(blocks.find(b => b.id === id1), blocks.find(b => b.id === id2))))) {
          groups[i].ids = Array.from(new Set([...groups[i].ids, ...groups[j].ids]))
          groups[i].blocks = Array.from(new Set([...groups[i].blocks, ...groups[j].blocks]))
          groups.splice(j, 1)
          merged = true
          break
        }
      }
      if (merged) break
    }
  }
  // For each group, compute earliest start and latest end
  return groups.map(group => {
    const sorted = group.blocks.sort((a, b) => a.startTime.localeCompare(b.startTime) || a.id.localeCompare(b.id))
    const startTime = sorted.reduce((min, b) => b.startTime < min ? b.startTime : min, sorted[0].startTime)
    const endTime = sorted.reduce((max, b) => b.endTime > max ? b.endTime : max, sorted[0].endTime)
    return {
      ids: group.ids,
      startTime,
      endTime
    }
  })
}

const blockOverlapGroupsWithRange = computed(() => computeBlockOverlapGroupsWithRange(blocksWithId.value))

// Ensure every block has a unique id
const blocksWithId = computed(() => {
  return (props.blocks || []).map((block, idx) => ({
    ...block,
    id: block.id || `block-${idx}`
  }))
})

// Helper: Compute overlap groups for grid block side-by-side logic
function computeBlockOverlapGroups(blocks) {
  // Each group is an array of block ids that overlap
  const groups = []
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    let foundGroup = null
    for (let j = 0; j < groups.length; j++) {
      if (groups[j].some(id => isOverlap(block, blocks.find(b => b.id === id)))) {
        foundGroup = groups[j]
        break
      }
    }
    if (foundGroup) {
      foundGroup.push(block.id)
    } else {
      groups.push([block.id])
    }
  }
  // Merge groups that have any overlap
  let merged = true
  while (merged) {
    merged = false
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        if (groups[i].some(id1 => groups[j].some(id2 => isOverlap(blocks.find(b => b.id === id1), blocks.find(b => b.id === id2))))) {
          groups[i] = Array.from(new Set([...groups[i], ...groups[j]]))
          groups.splice(j, 1)
          merged = true
          break
        }
      }
      if (merged) break
    }
  }
  // Assign group and column index to each block
  const blockGroupInfo = {}
  for (const group of groups) {
    // Sort group blocks by start time, then id
    const sorted = group.map(id => blocks.find(b => b.id === id)).sort((a, b) => a.startTime.localeCompare(b.startTime) || a.id.localeCompare(b.id))
    sorted.forEach((b, idx) => {
      blockGroupInfo[b.id] = {
        groupSize: sorted.length,
        colIndex: idx
      }
    })
  }
  return blockGroupInfo
}

function getGridBlockStyle(block, idx) {
  // Use the original overlap logic for block positioning
  const info = computeBlockOverlapGroups(blocksWithId.value)[block.id] || { groupSize: 1, colIndex: 0 }
  const top = tickToTop(block.startTime)
  const height = (timeToMinutes(block.endTime) - timeToMinutes(block.startTime)) * 2.5
  const widthPercent = 100 / info.groupSize
  const leftPercent = widthPercent * info.colIndex
  return {
    position: 'absolute',
    left: leftPercent + '%',
    width: widthPercent + '%',
    top: top + 'px',
    height: height + 'px',
    zIndex: 1,
    opacity: 0.38,
    boxSizing: 'border-box',
    overflow: 'hidden',
  }
}

function getAssignmentBlockStyle(assignment, idx) {
  // Find all assignments that overlap with this one
  const overlaps = localAssignments.value.filter((a, i) => {
    if (a.id === assignment.id) return false;
    const aStart = timeToMinutes(a.start);
    const aEnd = timeToMinutes(a.end);
    const thisStart = timeToMinutes(assignment.start);
    const thisEnd = timeToMinutes(assignment.end);
    return (
      (aStart < thisEnd && aEnd > thisStart)
    );
  });
  // Count overlaps (including self)
  const overlapCount = overlaps.length + 1;
  // Find this assignment's order among overlaps (for side-by-side positioning)
  const overlapAssignments = [assignment, ...overlaps].sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
  const colIndex = overlapAssignments.findIndex(a => a.id === assignment.id);
  // Calculate style for right-aligned 75% width
  const top = tickToTop(assignment.start);
  const calculatedHeight = (timeToMinutes(assignment.end) - timeToMinutes(assignment.start)) * 2.5;
  const height = Math.max(calculatedHeight, 2.5); // Minimum height of 2.5px (1 minute)
  const groupWidthPercent = 73;
  const groupLeftPercent = 27;
  const widthPercent = groupWidthPercent / overlapCount;
  const leftPercent = groupLeftPercent + (widthPercent * colIndex);
  return {
    position: 'absolute',
    left: leftPercent + '%',
    width: widthPercent + '%',
    top: top + 'px',
    height: height + 'px',
    zIndex: 2,
    minWidth: '80px',
    boxSizing: 'border-box',
    padding: '4px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    cursor: 'grab',
    transition: 'top 0.2s, height 0.2s',
  };
}

const draggingAssignment = ref(null)
const dragStartY = ref(0)
const dragStartMins = ref(0)
const dragType = ref(null)

function onBlockDragStart(e, assignment) {
  draggingAssignment.value = assignment
  dragStartY.value = e.clientY
  dragStartMins.value = timeToMinutes(assignment.start)
  dragType.value = 'move'
  assignment.isDragging = true
  const originalElement = e.target
  originalElement.classList.add('background-dragging-div')
  const dragImage = document.createElement('div')
  dragImage.className = 'drag-preview-div'
  dragImage.style.width = '160px'
  dragImage.style.height = '40px'
  dragImage.style.background = 'transparent'
  dragImage.style.border = '2px solid #007bff'
  dragImage.style.position = 'absolute'
  dragImage.style.top = '-9999px'
  dragImage.style.left = '-9999px'
  document.body.appendChild(dragImage)
  e.dataTransfer.setDragImage(dragImage, 80, 20)
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', assignment.id)
}
function onBlockDrag(e, assignment) {
  if (!draggingAssignment.value || e.clientY === 0) return
  const deltaY = e.clientY - dragStartY.value
  const deltaMins = Math.round(deltaY / 2.5)
  if (dragType.value === 'move') {
    let newStart = dragStartMins.value + deltaMins
    let newEnd = newStart + (timeToMinutes(assignment.end) - timeToMinutes(assignment.start))
    newStart = Math.max(minMins.value, Math.min(newStart, maxMins.value - 1))
    newEnd = Math.max(newStart + 1, Math.min(newEnd, maxMins.value))
    assignment.start = minutesToTime(newStart)
    assignment.end = minutesToTime(newEnd)
  }
}
function onBlockDragEnd(e, assignment) {
  draggingAssignment.value = null
  dragType.value = null
  assignment.isDragging = false
  emit('update:assignments', localAssignments.value)
}
function onResizeStart(e, assignment) {
  draggingAssignment.value = assignment
  dragStartY.value = e.clientY
  dragStartMins.value = timeToMinutes(assignment.end)
  dragType.value = 'resize'
  window.addEventListener('mousemove', onResizeMove)
  window.addEventListener('mouseup', onResizeEnd)
}
function onResizeMove(e) {
  if (!draggingAssignment.value) return
  const deltaY = e.clientY - dragStartY.value
  let newEnd = dragStartMins.value + Math.round(deltaY / 2.5)
  const startMins = timeToMinutes(draggingAssignment.value.start)
  newEnd = Math.max(startMins + 1, Math.min(newEnd, maxMins.value))
  draggingAssignment.value.end = minutesToTime(newEnd)
}
function onResizeEnd(e) {
  draggingAssignment.value = null
  dragType.value = null
  window.removeEventListener('mousemove', onResizeMove)
  window.removeEventListener('mouseup', onResizeEnd)
}

function deleteAssignment(id) {
  const idx = localAssignments.value.findIndex(a => a.id === id)
  if (idx !== -1) {
    localAssignments.value.splice(idx, 1)
    emit('update:assignments', localAssignments.value)
  }
}

function addAssignmentFromDialog(newAssignment) {
  localAssignments.value.push(newAssignment)
  emit('update:assignments', localAssignments.value)
  showDialog.value = false
}
</script>

<style scoped>
.vertical-time-grid-wrapper {
  width: 100%;
  display: flex;
  flex-direction: row;
  position: relative;
  justify-content: center;
}

.vertical-time-grid {
  width: 80%;
  position: relative;
  background: #fff;
  overflow-x: auto;
  border: 2px solid #007bff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
.grid-labels-column {
  position: absolute;
  left: 0;
  top: 0;
  width: 120px;
  height: 100%;
  z-index: 5;
  pointer-events: none;
}
.grid-label-row {
  font-size: 1em;
  font-weight: 500;
  color: #333;
  gap: 10px;
  padding-left: 8px;
  display: flex;
  align-items: center;
  height: 20px;
}
.grid-label {
  min-width: 70px;
  text-align: right;
  margin-right: 8px;
  font-weight: 600;
  color: #444;
}
.grid-time {
  min-width: 38px;
  font-family: monospace;
  color: #222;
  font-size: 1em;
}
.dialog-assignment-box {
  box-sizing: border-box;
  position: absolute;
  background: #e0e0e0;
  border-radius: 6px;
  border: 2px solid #b3c6e0;
  box-shadow: 0 2px 8px rgba(42,121,201,0.08);
  font-weight: bold;
  color: #333;
  min-width: 80px;
  min-height: 2.5px;
  overflow: visible;
  transition: background 0.2s, opacity 0.2s, height 0.2s, transform 0.2s;
}
.assignment-content {
  width: 100%;
  text-align: left;
  padding: 2px 4px;
  opacity: 1;
  transition: opacity 0.2s;
}
.assignment-label-time {
  font-size: 0.98em;
  font-weight: 600;
  color: #222;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  margin-bottom: 2px;
}
.assignment-time-label {
  font-size: 0.98em;
  font-weight: 600;
  color: #222;
  background: rgba(255,255,255,0.7);
  border-radius: 3px;
  padding: 1px 4px;
  margin-top: 2px;
  margin-left: 0;
}
.assignment-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
  position: absolute;
  top: 2px;
  right: 2px;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s;
}
.edit-btn {
  background: rgba(255,255,255,0.9);
  border: 1px solid #ccc;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8em;
  padding: 2px 4px;
  min-width: 20px;
  min-height: 20px;
}
.delete-btn {
  background: rgba(255,255,255,0.9);
  border: 1px solid #ccc;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8em;
  padding: 2px 4px;
  min-width: 20px;
  min-height: 20px;
}
.resize-handle {
  width: 8px;
  height: 8px;
  background: #4a90e2;
  border-radius: 50%;
  cursor: ns-resize;
  position: absolute;
  left: 50%;
  bottom: 2px;
  transform: translateX(-50%);
  box-shadow: 0 1px 3px rgba(0,0,0,0.18);
  border: 2px solid #fff;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
}
.resize-handle:hover {
  background: #357abd;
  box-shadow: 0 2px 6px rgba(0,0,0,0.22);
}
.add-assignment-fab {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 16px;
  z-index: 10;
  background: #2a79c9;
  color: #fff;
  border: none;
  border-radius: 24px;
  padding: 10px 24px;
  font-size: 1.1em;
  box-shadow: 0 2px 8px rgba(42,121,201,0.12);
  cursor: pointer;
  transition: background 0.2s;
}
.add-assignment-fab:hover {
  background: #1a4e8a;
}
.type-period {
  background: #b6e0fb !important;
  border-color: #64b5f6 !important;
}
.type-lunch {
  background: #ffeec2 !important;
  border-color: #ffb84d !important;
}
.type-break {
  background: #b2f4ea !important;
  border-color: #4dd0e1 !important;
}
.type-other {
  background: #f5e6fa !important;
  border-color: #ba68c8 !important;
}

/* Assignment type color coding */
.dialog-assignment-box.type-class {
  background: linear-gradient(135deg, #4a90e2, #357abd);
  border-color: #357abd !important;
}

.dialog-assignment-box.type-student {
  background: linear-gradient(135deg, #7cb342, #5a8a2e);
  border-color: #5a8a2e !important;
}

.dialog-assignment-box.type-other {
  background: linear-gradient(135deg, #cc4d41, #bd5035);
  border-color: #bd5535 !important;
}

.dialog-assignment-box.break {
  background: linear-gradient(135deg, #4adae2, #35bd90);
  border-color: #35bdaf !important;
}

.dialog-assignment-box.lunch {
  background: linear-gradient(135deg, #e2984a, #bd8d35);
  border-color: #bd9f35 !important;
}

.dialog-assignment-box.other {
  background: linear-gradient(135deg, #cc4d41, #bd5035);
  border-color: #bd5535 !important;
}

.grid-block-bg.blocktype-period {
  background: #eaf4fb;
  /* even lighter blue */
}
.grid-block-bg.blocktype-lunch {
  background: #fffbe7;
  /* even lighter yellow */
}
.grid-block-bg.blocktype-break {
  background: #e6fcf7;
  /* even lighter teal */
}
.grid-block-bg.blocktype-other {
  background: #f8f3fa;
  /* even lighter purple/gray */
}
.grid-block-label-time {
  position: absolute;
  top: 8px;
  left: 12px;
  right: 12px;
  z-index: 20;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  font-size: 1em;
  font-weight: 600;
  color: #222;
  /* background: none; */
  border-radius: 6px;
  padding: 2px 8px;
  pointer-events: none;
  max-width: calc(100% - 24px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: none;
}
.grid-block-label {
  font-weight: 700;
  text-align: left;
}
.grid-block-time {
  font-family: monospace;
  font-size: 0.98em;
  color: #444;
}
.dialog-assignment-box:hover {
  background: rgba(224,224,224,0.9) !important;
  opacity: 1 !important;
  transform: scale(0.95);
  z-index: 15 !important;
}

.dialog-assignment-box:hover .assignment-content {
  opacity: 1 !important;
  display: flex !important;
}

.dialog-assignment-box:hover .assignment-actions {
  opacity: 1 !important;
  display: flex !important;
}

.dialog-assignment-box.dragging {
  background: rgba(255, 0, 0, 0.3) !important;
}

.dialog-assignment-box.dragging .assignment-content {
  opacity: 0.8 !important;
}

/* Target the drag preview/ghost more specifically */
.vertical-time-grid .dialog-assignment-box[draggable="true"]:active {
   /* Green background to identify it */
}

/* Alternative: target the drag preview using a different approach */
.dialog-assignment-box[draggable="true"]:active:not(.dragging) {
   /* Green background to identify it */
}

/* Target the background div specifically */
.dialog-assignment-box.background-dragging-div {
  background: rgba(255, 0, 0, 0.5) !important; /* Red background */
  border: 3px solid red !important;
}

/* Target the drag preview div */
.drag-preview-div {
  background: transparent !important;
  border: 2px solid #007bff !important;
}

/* Hide label when div is too small */
.dialog-assignment-box[style*="height: 2.5px"] .assignment-content,
.dialog-assignment-box[style*="height: 5px"] .assignment-content,
.dialog-assignment-box[style*="height: 7.5px"] .assignment-content {
  opacity: 0;
}
</style> 