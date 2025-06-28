<template>
  <div class="admin-form-row">
    <input 
      type="text" 
      v-model="searchTerm" 
      :placeholder="placeholder"
      @input="handleSearch"
    />
    <select v-model="searchType" @change="handleSearch">
      <option v-for="type in types" :key="type" :value="type">
        {{ type.charAt(0).toUpperCase() + type.slice(1) }}
      </option>
    </select>
    <button 
      v-if="showDeleteAll" 
      @click="handleDeleteAll" 
      id="delete-all"
    >
      Delete All
    </button>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'SearchBar',
  props: {
    placeholder: {
      type: String,
      default: 'Search...'
    },
    types: {
      type: Array,
      default: () => ['name', 'email']
    },
    showDeleteAll: {
      type: Boolean,
      default: false
    }
  },
  emits: ['search', 'delete-all'],
  setup(props, { emit }) {
    const searchTerm = ref('')
    const searchType = ref(props.types[0])

    const handleSearch = () => {
      emit('search', searchType.value, searchTerm.value)
    }

    const handleDeleteAll = () => {
      emit('delete-all')
    }

    // Debounce search
    let searchTimeout
    watch(searchTerm, () => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(handleSearch, 300)
    })

    return {
      searchTerm,
      searchType,
      handleSearch,
      handleDeleteAll
    }
  }
}
</script>

<style scoped>
/* Styles are in admin-panel.css */
</style>
