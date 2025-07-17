import { computed } from 'vue'
import { useAppSettings } from '@/composables/useAppSettings'

export function usePeriodLabels() {
  const { appSettings } = useAppSettings()

  // Reactive labels array from app settings
  const labels = computed(() => {
    console.log('🏷️ usePeriodLabels: appSettings.value:', appSettings.value)
    console.log('🏷️ usePeriodLabels: periodLabels:', appSettings.value?.periodLabels)
    console.log('🏷️ usePeriodLabels: numPeriods:', appSettings.value?.numPeriods)
    
    if (appSettings.value?.periodLabels && appSettings.value?.numPeriods) {
      const result = appSettings.value.periodLabels.slice(0, appSettings.value.numPeriods)
      console.log('🏷️ usePeriodLabels: returning labels:', result)
      return result
    }
    const fallback = ['1', '2', '3', '4', '5', '6', '7']
    console.log('🏷️ usePeriodLabels: returning fallback labels:', fallback)
    return fallback
  })

  // Convert numeric period (1-7) to display label
  const getLabel = (periodNum) => {
    const num = parseInt(periodNum)
    if (!num || num < 1) return `Period ${periodNum}`
    
    const index = num - 1 // Convert 1-based to 0-based index
    const label = labels.value[index] || `Period ${num}`
    console.log(`🏷️ getLabel(${periodNum}) -> "${label}" (index: ${index}, labels:`, labels.value, ')')
    return label
  }

  // Convert display label back to numeric period (1-7)
  const getNumber = (label) => {
    const index = labels.value.findIndex(l => l === label)
    return index !== -1 ? index + 1 : null
  }

  // Get numeric periods array based on app settings
  const numericPeriods = computed(() => {
    const numPeriods = appSettings.value?.numPeriods || 7
    return Array.from({ length: numPeriods }, (_, i) => i + 1)
  })

  // Get label-to-number mapping object for easy lookups
  const labelToNumberMap = computed(() => {
    const map = {}
    labels.value.forEach((label, index) => {
      map[label] = index + 1
    })
    return map
  })

  // Get number-to-label mapping object for easy lookups
  const numberToLabelMap = computed(() => {
    const map = {}
    labels.value.forEach((label, index) => {
      map[index + 1] = label
    })
    return map
  })

  return {
    labels,
    getLabel,
    getNumber,
    numericPeriods,
    labelToNumberMap,
    numberToLabelMap
  }
} 