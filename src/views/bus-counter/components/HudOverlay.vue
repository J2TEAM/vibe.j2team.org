<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { GamePhase } from '../types'

defineProps<{
  lives: number
  score: number
  phase: GamePhase
  boardingTimer: number
  countingTimer: number
  totalTime: number
  currentStopIndex: number
  totalStops: number
  stopName: string
  isMuted: boolean
}>()

const emit = defineEmits<{
  quit: []
  toggleMute: []
}>()

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getPhaseLabel(phase: GamePhase): string {
  switch (phase) {
    case 'TRANSIT':
      return 'Di chuyển...'
    case 'BOARDING':
      return 'Cửa mở — Quan sát hành khách!'
    case 'COUNTING':
      return 'Nhập số hành khách!'
    case 'SCORING':
      return 'Kết quả'
    default:
      return ''
  }
}
</script>

<template>
  <div
    class="border-border-default bg-bg-surface/90 flex flex-wrap items-center gap-3 border px-4 py-2 backdrop-blur-sm sm:gap-5"
  >
    <!-- Lives -->
    <div class="flex items-center gap-1">
      <Icon
        v-for="i in 3"
        :key="i"
        :icon="i <= lives ? 'lucide:heart' : 'lucide:heart'"
        class="size-5 transition-all"
        :class="i <= lives ? 'text-accent-coral icon-filled' : 'text-text-dim'"
      />
    </div>

    <!-- Score -->
    <div class="flex items-center gap-1.5">
      <Icon icon="lucide:star" class="text-accent-amber size-4" />
      <span class="font-display text-accent-amber text-lg font-bold tabular-nums">
        {{ score }}
      </span>
    </div>

    <!-- Timer -->
    <div v-if="phase === 'BOARDING' && boardingTimer > 0" class="flex items-center gap-1.5">
      <Icon icon="lucide:door-open" class="text-accent-sky size-4" />
      <span class="font-display text-accent-sky text-sm font-semibold tabular-nums">
        {{ boardingTimer }}s
      </span>
    </div>
    <div v-if="phase === 'COUNTING' && countingTimer > 0" class="flex items-center gap-1.5">
      <Icon
        icon="lucide:alarm-clock"
        class="size-4"
        :class="countingTimer <= 3 ? 'text-accent-coral animate-pulse' : 'text-accent-amber'"
      />
      <span
        class="font-display text-sm font-semibold tabular-nums"
        :class="countingTimer <= 3 ? 'text-accent-coral' : 'text-accent-amber'"
      >
        {{ countingTimer }}s
      </span>
    </div>

    <!-- Total time -->
    <div class="flex items-center gap-1.5">
      <Icon icon="lucide:timer" class="text-text-dim size-4" />
      <span class="font-display text-text-secondary text-sm tabular-nums">
        {{ formatTime(totalTime) }}
      </span>
    </div>

    <!-- Phase label -->
    <div class="text-text-secondary hidden text-xs sm:block sm:text-sm">
      {{ getPhaseLabel(phase) }}
    </div>

    <!-- Audio toggle -->
    <button
      class="border-border-default text-text-dim hover:border-accent-sky hover:text-accent-sky ml-auto flex items-center gap-1 border px-2 py-1 text-xs transition"
      @click="emit('toggleMute')"
    >
      <Icon :icon="isMuted ? 'lucide:volume-x' : 'lucide:volume-2'" class="size-3" />
    </button>

    <!-- Quit button -->
    <button
      class="border-border-default text-text-dim hover:border-accent-coral hover:text-accent-coral flex items-center gap-1 border px-2 py-1 text-xs transition"
      @click="emit('quit')"
    >
      <Icon icon="lucide:square" class="size-3" />
      <span class="hidden sm:inline">Kết thúc</span>
    </button>
  </div>
</template>
