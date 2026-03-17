<script setup lang="ts">
import { useGameStore } from '../stores/gameStore'

const store = useGameStore()
const emit = defineEmits<{
  pause: []
  resume: []
  menu: []
}>()

function onPause() {
  emit('pause')
}

function onResume() {
  emit('resume')
}

function onMenu() {
  emit('menu')
}
</script>

<template>
  <div
    class="flex flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3 border-b-2 border-[#22c55e] bg-[#0b1220]"
  >
    <!-- Score -->
    <div class="flex items-center gap-1.5 sm:gap-2">
      <span class="text-[#22c55e] text-[10px] sm:text-xs font-bold tracking-[0.18em] uppercase">
        Điểm
      </span>
      <span
        class="text-[#e2e8f0] text-base sm:text-xl font-mono font-bold tabular-nums tracking-widest"
      >
        {{ store.score }}
      </span>
    </div>

    <!-- Difficulty -->
    <div class="flex items-center gap-1.5 sm:gap-2">
      <span class="text-[#38bdf8] text-[10px] sm:text-xs font-bold tracking-[0.18em] uppercase">
        Đợt
      </span>
      <span class="text-[#e2e8f0] text-sm sm:text-lg font-mono font-bold tracking-widest">
        {{ store.difficulty }}
      </span>
    </div>

    <!-- Health -->
    <div class="flex items-center gap-1.5 sm:gap-2">
      <span class="text-[#ef4444] text-[10px] sm:text-xs font-bold tracking-[0.18em] uppercase">
        HP
      </span>
      <div class="flex gap-1">
        <span
          v-for="i in store.maxHealth"
          :key="i"
          class="inline-block size-2.5 sm:size-3.5 border-2 border-[#ef4444]"
          :class="i <= store.health ? 'bg-[#ef4444]' : 'bg-transparent opacity-60'"
        >
        </span>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex items-center gap-2">
      <button
        v-if="store.status === 'playing'"
        type="button"
        class="px-3 py-2 border-2 border-[#38bdf8] text-[#38bdf8] text-[10px] sm:text-xs tracking-[0.2em] uppercase active:translate-y-[2px]"
        @click="onPause"
      >
        Pause
      </button>
      <button
        v-else-if="store.status === 'paused'"
        type="button"
        class="px-3 py-2 border-2 border-[#22c55e] text-[#22c55e] text-[10px] sm:text-xs tracking-[0.2em] uppercase active:translate-y-[2px]"
        @click="onResume"
      >
        Resume
      </button>
      <button
        type="button"
        class="px-3 py-2 border-2 border-[#ef4444] text-[#ef4444] text-[10px] sm:text-xs tracking-[0.2em] uppercase active:translate-y-[2px]"
        @click="onMenu"
      >
        Menu
      </button>
    </div>
  </div>
</template>
