<template>
  <div class="dialog-backdrop">
    <div class="dialog">
      <header>
        <h2>Email about {{ student.first_name }} {{ student.last_name }}</h2>
        <button @click="$emit('close')">X</button>
      </header>
      <main>
        <p>This is a placeholder for the email dialog.</p>
        <p>You can add a form here to compose and send an email.</p>
      </main>
      <footer>
        <button @click="$emit('close')">Cancel</button>
        <button @click="sendEmail">Send</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
defineProps({
  student: Object
})

defineEmits(['close'])

function sendEmail() {
  alert('Email sent (not really)!');
  // In a real app, you would implement email sending logic here
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