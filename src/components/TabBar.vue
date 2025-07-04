<template>
  <div class="admin-tab-bar">
    <!-- Category Headers -->
    <div class="tab-category" v-for="category in categories" :key="category.key">
      <div class="category-header">{{ category.label }}</div>
      <div class="category-tabs">
        <button
          v-for="tab in getTabsForCategory(category.key)"
          :key="tab.key"
          :class="{ active: activeTab === tab.key }"
          @click="$emit('tab-change', tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TabBar',
  props: {
    tabs: {
      type: Array,
      required: true,
      default: () => []
    },
    activeTab: {
      type: String,
      required: true
    }
  },
  emits: ['tab-change'],
  computed: {
    categories() {
      return [
        { key: 'users-students', label: 'Users & Students' },
        { key: 'aide-management', label: 'Aide Management' },
        { key: 'system-config', label: 'System Configuration' }
      ]
    }
  },
  methods: {
    getTabsForCategory(categoryKey) {
      return this.tabs.filter(tab => tab.category === categoryKey)
    }
  }
}
</script>

<style scoped>
/* Styles are in admin-panel.css */
</style>
