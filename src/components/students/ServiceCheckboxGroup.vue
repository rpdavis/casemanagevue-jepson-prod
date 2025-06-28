<template>
  <fieldset>
    <legend>{{ label }}</legend>
    <div class="checkbox-inline-group">
      <label v-for="val in items" :key="val">
        <input type="checkbox"
          :value="label + ': ' + val"
          :checked="modelValue && modelValue.includes(label + ': ' + val)"
          @change="toggle(val)"
        />
        {{ val }}
      </label>
    </div>
  </fieldset>
</template>

<script setup>
const props = defineProps(['label', 'items', 'modelValue'])
const emit = defineEmits(['update:modelValue'])

function toggle(val) {
  const v = props.label + ': ' + val
  const arr = props.modelValue ? [...props.modelValue] : []
  const idx = arr.indexOf(v)
  if (idx === -1) arr.push(v)
  else arr.splice(idx, 1)
  emit('update:modelValue', arr)
}
</script> 