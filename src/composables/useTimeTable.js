import { computed } from 'vue'

// Returns the blocks for the current time table
export function getTimeTableBlocks(currentTimeTable) {
  return currentTimeTable?.schedule || []
}

// Returns the earliest start and latest end time from a list of blocks
export function getEarliestStartAndLatestEnd(blocks) {
  let min = '23:59', max = '00:00'
  for (const b of blocks) {
    if (b.startTime && b.startTime < min) min = b.startTime
    if (b.endTime && b.endTime > max) max = b.endTime
  }
  return { min, max }
}

// Returns a computed timeTicks array for a set of blocks
export function useTimeTicks(blocks) {
  return computed(() => {
    const { min, max } = getEarliestStartAndLatestEnd(blocks.value || blocks)
    const [minH, minM] = min.split(':').map(Number)
    const [maxH, maxM] = max.split(':').map(Number)
    let ticks = []
    let h = minH, m = minM
    // Add all 5-min increments
    while (h < maxH || (h === maxH && m <= maxM)) {
      const hourStr = h < 10 ? `0${h}` : `${h}`
      const minStr = m < 10 ? `0${m}` : `${m}`
      ticks.push({ time: `${hourStr}:${minStr}` })
      m += 5
      if (m >= 60) { m = 0; h++ }
    }
    // Add all unique block start times
    const blockStarts = (blocks.value || blocks).map(b => b.startTime)
    for (const t of blockStarts) {
      if (!ticks.find(tick => tick.time === t)) {
        ticks.push({ time: t })
      }
    }
    // Sort and dedupe
    ticks = Array.from(new Set(ticks.map(t => t.time)))
      .sort()
      .map(time => ({ time }))
    return ticks
  })
}

// Checks if a tick time is in any block
export function isTickInAnyBlock(tickTime, blocks) {
  return blocks.some(block => block.startTime <= tickTime && block.endTime >= tickTime)
} 