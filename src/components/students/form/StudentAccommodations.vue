<template>
  <fieldset class="form-col">
    <legend>Accommodations</legend>
    <div class="inner-grid-2">
      <label>Instruction: <textarea v-model="form.instruction"></textarea></label>
      <label>Assessment: <textarea v-model="form.assessment"></textarea></label>
    </div>
  </fieldset>
</template>
<script setup>
const props = defineProps({ form: Object })
</script> 