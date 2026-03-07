<script setup lang="ts">
import type { GameMode } from '../types'

interface Props {
  mode: GameMode
  timeLabel: string
  timeProgress: number
}

defineProps<Props>()
</script>

<template>
  <header class="animate-fade-up border border-border-default bg-bg-surface p-3 sm:p-4">
    <div class="mb-2 flex items-center justify-between gap-3">
      <p class="font-display text-xs tracking-widest text-accent-amber">TIME BAR // LIVE</p>
      <p class="font-display text-sm text-accent-coral">
        {{ mode === 'timed' ? timeLabel : mode === 'story' ? `STORY ${timeLabel}` : 'NO TIMER' }}
      </p>
    </div>
    <div class="h-2 w-full border border-border-default bg-bg-deep">
      <div class="h-full bg-accent-coral transition-all duration-300" :style="{ width: `${mode === 'timed' ? timeProgress : 100}%` }" />
    </div>
  </header>
</template>

