<script setup lang="ts">
import { ref, computed } from 'vue'
import { useIntervalFn } from '@vueuse/core'

const SIZE = 200
const CENTER = SIZE / 2
const RADIUS = 80

const axes = [
  { label: 'CPU', angle: -90 },
  { label: 'RAM', angle: -30 },
  { label: 'NET', angle: 30 },
  { label: 'THREAT', angle: 90 },
  { label: 'FW', angle: 150 },
  { label: 'CRYPTO', angle: 210 },
]

const values = ref(axes.map(() => Math.random() * 0.6 + 0.3))

useIntervalFn(() => {
  values.value = axes.map((_, i) => {
    const current = values.value[i] ?? 0.5
    const delta = (Math.random() - 0.5) * 0.2
    return Math.min(1, Math.max(0.1, current + delta))
  })
}, 1200)

function toPoint(angle: number, radius: number) {
  const rad = (angle * Math.PI) / 180
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  }
}

const gridLevels = [0.25, 0.5, 0.75, 1.0]

function gridPolygon(level: number) {
  return axes
    .map((ax) => {
      const p = toPoint(ax.angle, RADIUS * level)
      return `${p.x},${p.y}`
    })
    .join(' ')
}

const dataPolygon = computed(() => {
  return axes
    .map((ax, i) => {
      const p = toPoint(ax.angle, RADIUS * (values.value[i] ?? 0.5))
      return `${p.x},${p.y}`
    })
    .join(' ')
})

const rotation = ref(0)

useIntervalFn(() => {
  rotation.value = (rotation.value + 0.3) % 360
}, 30)
</script>

<template>
  <div class="radar-wrap">
    <div class="radar-title">// THREAT RADAR</div>
    <svg :width="SIZE" :height="SIZE" class="radar-svg">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <!-- Grid rings -->
      <polygon
        v-for="level in gridLevels"
        :key="level"
        :points="gridPolygon(level)"
        fill="none"
        stroke="#00ff4130"
        stroke-width="1"
      />

      <!-- Axis lines -->
      <line
        v-for="ax in axes"
        :key="ax.label"
        :x1="CENTER"
        :y1="CENTER"
        :x2="toPoint(ax.angle, RADIUS).x"
        :y2="toPoint(ax.angle, RADIUS).y"
        stroke="#00ff4120"
        stroke-width="1"
      />

      <!-- Data polygon -->
      <polygon
        :points="dataPolygon"
        fill="#00ff4120"
        stroke="#00ff41"
        stroke-width="1.5"
        filter="url(#glow)"
        style="transition: all 0.8s ease"
      />

      <!-- Rotating sweep line -->
      <line
        :x1="CENTER"
        :y1="CENTER"
        :x2="toPoint(rotation, RADIUS).x"
        :y2="toPoint(rotation, RADIUS).y"
        stroke="#00ff4180"
        stroke-width="1.5"
      />

      <!-- Axis labels -->
      <text
        v-for="ax in axes"
        :key="ax.label + '-label'"
        :x="toPoint(ax.angle, RADIUS + 16).x"
        :y="toPoint(ax.angle, RADIUS + 16).y"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="#00ff4199"
        font-size="8"
        font-family="monospace"
      >
        {{ ax.label }}
      </text>

      <!-- Center dot -->
      <circle :cx="CENTER" :cy="CENTER" r="3" fill="#00ff41" filter="url(#glow)" />
    </svg>
  </div>
</template>

<style scoped>
.radar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.radar-title {
  color: #00ff41;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  letter-spacing: 2px;
  opacity: 0.8;
}
.radar-svg {
  display: block;
}
</style>
