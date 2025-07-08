<template>
  <fieldset>
    <legend>Flags</legend>
    <label><input type="checkbox" v-model="form.flag1" /> Separate setting</label>
    <label><input type="checkbox" v-model="form.flag2" /> Preferential seating</label>
  </fieldset>
</template>
<script setup>
const props = defineProps({ form: Object })
</script> 