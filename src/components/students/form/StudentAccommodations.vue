<template>
  <fieldset class="form-col">
    <legend>Accommodations</legend>
    <div class="inner-grid-2">
      <label>
        Instruction:
        <textarea v-model="form.instruction" placeholder="Enter instructional accommodations..."></textarea>
      </label>
      <label>
        Assessment:
        <textarea v-model="form.assessment" placeholder="Enter assessment accommodations..."></textarea>
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
textarea {
  min-height: 80px;
  resize: vertical;
}
</style> 