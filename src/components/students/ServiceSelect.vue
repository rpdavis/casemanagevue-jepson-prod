<template>
  <label>{{ label }}:
    <select :id="id" :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
      <option value="">--</option>
      <option v-for="p in sortedList" :key="p.id" :value="p.id">
        {{ p.name }}
      </option>
    </select>
  </label>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps(['id', 'label', 'list', 'modelValue'])
defineEmits(['update:modelValue'])

// Sorted list for dropdown (alphabetical order)
const sortedList = computed(() => {
  const list = props.list || []
  return list.sort((a, b) => (a.name || a.email || a.id).localeCompare(b.name || b.email || b.id))
})
</script> 