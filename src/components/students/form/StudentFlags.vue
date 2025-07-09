<template>
  <fieldset>
    <legend>Flags</legend>
    <div class="flags-container">
      <label class="checkbox-label">
        <input type="checkbox" v-model="form.flag1" />
        Separate setting
      </label>
      <label class="checkbox-label">
        <input type="checkbox" v-model="form.flag2" />
        Preferential seating
      </label>
    </div>
  </fieldset>
</template>

<script setup>
// Props
const props = defineProps({
  form: { type: Object, required: true }
})

// No local state needed - all data flows through props
</script>

<style scoped>
.flags-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
}
</style> 