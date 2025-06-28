<template>
  <label>{{ label }}:
    <select :id="id" :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
      <option value="">--</option>
      <option v-for="p in list" :key="p.id" :value="p.id">
        {{ p.name }}
      </option>
    </select>
  </label>
</template>

<script setup>
defineProps(['id', 'label', 'list', 'modelValue'])
defineEmits(['update:modelValue'])
</script> 