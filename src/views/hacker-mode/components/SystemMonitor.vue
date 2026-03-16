<script setup lang="ts">
import { ref } from 'vue'
import { useIntervalFn } from '@vueuse/core'

interface Metric {
  label: string
  value: number
  unit: string
  color: string
}

const metrics = ref<Metric[]>([
  { label: 'CPU', value: 45, unit: '%', color: '#00ff41' },
  { label: 'MEM', value: 62, unit: '%', color: '#00d4ff' },
  { label: 'NET↑', value: 28, unit: 'MB/s', color: '#ff6b35' },
  { label: 'NET↓', value: 71, unit: 'MB/s', color: '#ffb830' },
])

// Oscilloscope history for each metric (last 40 values)
const histories = ref<number[][]>(metrics.value.map(() => Array(40).fill(0) as number[]))

useIntervalFn(() => {
  metrics.value = metrics.value.map((m, i) => {
    let newVal: number
    if (i === 0) newVal = Math.min(99, Math.max(5, m.value + (Math.random() - 0.5) * 15))
    else if (i === 1) newVal = Math.min(95, Math.max(20, m.value + (Math.random() - 0.5) * 8))
    else newVal = Math.min(100, Math.max(1, m.value + (Math.random() - 0.5) * 25))
    return { ...m, value: Math.round(newVal) }
  })

  histories.value = histories.value.map((hist, i) => {
    const arr = [...hist.slice(1), metrics.value[i]?.value ?? 50]
    return arr
  })
}, 600)

function sparklinePath(values: number[]): string {
  const W = 140
  const H = 30
  const step = W / (values.length - 1)
  return values
    .map((v, i) => {
      const x = i * step
      const y = H - (v / 100) * H
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}
</script>

<template>
  <div class="monitor-wrap">
    <div class="monitor-title">// SYS MONITOR</div>
    <div class="metrics-list">
      <div v-for="(metric, i) in metrics" :key="metric.label" class="metric-row">
        <div class="metric-header">
          <span class="metric-label">{{ metric.label }}</span>
          <span class="metric-value" :style="{ color: metric.color }">
            {{ metric.value }}{{ metric.unit }}
          </span>
        </div>
        <div class="metric-bar-bg">
          <div
            class="metric-bar-fill"
            :style="{
              width: `${metric.value}%`,
              background: metric.color,
              boxShadow: `0 0 6px ${metric.color}`,
            }"
          />
        </div>
        <svg width="140" height="30" class="sparkline">
          <path
            :d="sparklinePath(histories[i] ?? [])"
            fill="none"
            :stroke="metric.color"
            stroke-width="1.2"
            opacity="0.6"
          />
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
.monitor-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.monitor-title {
  color: #00ff41;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  letter-spacing: 2px;
  opacity: 0.8;
}
.metrics-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.metric-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.metric-header {
  display: flex;
  justify-content: space-between;
  font-family: 'Courier New', monospace;
  font-size: 10px;
}
.metric-label {
  color: #00ff4180;
}
.metric-value {
  font-weight: bold;
}
.metric-bar-bg {
  width: 100%;
  height: 3px;
  background: #ffffff10;
  overflow: hidden;
}
.metric-bar-fill {
  height: 100%;
  transition: width 0.5s ease;
}
.sparkline {
  display: block;
  opacity: 0.7;
}
</style>
