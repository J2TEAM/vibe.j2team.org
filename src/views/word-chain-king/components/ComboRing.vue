<script setup lang="ts">
import { computed } from 'vue'
import type { ComboLevel } from '../types'

const props = defineProps<{
  level: ComboLevel
  progress: number
  streak: number
}>()

const COLORS: Record<ComboLevel, string> = {
  0: 'transparent',
  1: '#22c55e',
  2: '#3b82f6',
  3: '#eab308',
  4: '#a855f7',
}

const GLOW_COLORS: Record<ComboLevel, string> = {
  0: 'transparent',
  1: 'rgba(34, 197, 94, 0.3)',
  2: 'rgba(59, 130, 246, 0.3)',
  3: 'rgba(234, 179, 8, 0.3)',
  4: 'rgba(168, 85, 247, 0.4)',
}

const LABELS: Record<ComboLevel, string> = {
  0: '',
  1: 'x2',
  2: 'x3',
  3: 'x4',
  4: 'x5',
}

const radius = 38
const circumference = 2 * Math.PI * radius

const strokeDashoffset = computed(() => {
  return circumference * (1 - props.progress)
})

const ringColor = computed(() => COLORS[props.level])
const glowColor = computed(() => GLOW_COLORS[props.level])
const label = computed(() => LABELS[props.level])
</script>

<template>
  <div v-if="level > 0" class="combo-ring-wrapper" :class="`combo-lv${level}`">
    <svg width="96" height="96" viewBox="0 0 96 96" class="combo-svg">
      <!-- Background circle -->
      <circle cx="48" cy="48" :r="radius" fill="none" stroke="#1E2F42" stroke-width="5" />
      <!-- Progress circle -->
      <circle
        cx="48"
        cy="48"
        :r="radius"
        fill="none"
        :stroke="ringColor"
        stroke-width="5"
        stroke-linecap="square"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="strokeDashoffset"
        transform="rotate(-90 48 48)"
        class="progress-ring"
      />
    </svg>
    <div class="combo-center">
      <span class="combo-streak">{{ streak }}</span>
      <span class="combo-label" :style="{ color: ringColor }">{{ label }}</span>
    </div>
    <div class="combo-glow" :style="{ boxShadow: `0 0 30px 10px ${glowColor}` }" />
  </div>
</template>

<style scoped>
.combo-ring-wrapper {
  position: relative;
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.combo-svg {
  position: absolute;
  inset: 0;
}

.progress-ring {
  transition:
    stroke-dashoffset 0.1s linear,
    stroke 0.3s;
}

.combo-center {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}

.combo-streak {
  font-family: 'Anybody', sans-serif;
  font-size: 1.75rem;
  font-weight: 800;
  color: #f0ede6;
}

.combo-label {
  font-family: 'Anybody', sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 1px;
  margin-top: 2px;
}

.combo-glow {
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  transition: box-shadow 0.3s;
}

.combo-lv3 .combo-streak,
.combo-lv4 .combo-streak {
  animation: pulse-text 0.5s ease-in-out infinite alternate;
}

@keyframes pulse-text {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.1);
  }
}

.combo-lv4 .combo-ring-wrapper {
  animation: ring-spin 3s linear infinite;
}

@keyframes ring-spin {
  from {
    filter: hue-rotate(0deg);
  }
  to {
    filter: hue-rotate(360deg);
  }
}
</style>
