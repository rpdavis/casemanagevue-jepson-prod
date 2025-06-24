<template>
  <div class="dialog-backdrop">
    <div class="dialog">
      <header>
        <h2>Edit Student: {{ studentData.first_name }} {{ studentData.last_name }}</h2>
        <button @click="$emit('close')">X</button>
      </header>
      <main>
        <form @submit.prevent="save">
          <label for="first_name">First Name:</label>
          <input type="text" id="first_name" v-model="studentData.first_name">

          <label for="last_name">Last Name:</label>
          <input type="text" id="last_name" v-model="studentData.last_name">

          <label for="grade">Grade:</label>
          <input type="text" id="grade" v-model="studentData.grade">
          
          <label for="plan">Plan:</label>
          <input type="text" id="plan" v-model="studentData.plan">

          <label for="instruction">Instruction:</label>
          <textarea id="instruction" v-model="studentData.instruction"></textarea>

          <label for="assessment">Assessment:</label>
          <textarea id="assessment" v-model="studentData.assessment"></textarea>

        </form>
      </main>
      <footer>
        <button @click="$emit('close')">Cancel</button>
        <button @click="save">Save</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  student: Object
})

const emit = defineEmits(['close', 'save'])

const studentData = ref({})

watch(() => props.student, (newStudent) => {
  // Create a copy to avoid mutating the prop directly
  studentData.value = { ...newStudent }
}, { immediate: true })


function save() {
  emit('save', studentData.value)
}
</script>

<style scoped>
.dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.dialog {
  background: white;
  padding: 20px;
  border-radius: 5px;
  width: 500px;
}
</style>