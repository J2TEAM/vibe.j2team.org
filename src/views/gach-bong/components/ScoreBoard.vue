<script setup lang="ts">
defineProps<{
  score: number
  timeLeft: number
  remainingTiles: number
  combo: number
}>()

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="flex items-center justify-between gap-4 border border-border-default bg-bg-surface px-4 py-3">
    <div class="flex flex-col items-center">
      <span class="font-display text-xs tracking-widest text-text-dim">ĐIỂM</span>
      <span class="font-display text-lg font-bold text-accent-coral">{{ score.toLocaleString() }}</span>
    </div>
    <div class="flex flex-col items-center">
      <span class="font-display text-xs tracking-widest text-text-dim">THỜI GIAN</span>
      <span
        class="font-display text-lg font-bold"
        :class="{
          'text-red-400': timeLeft <= 30,
          'text-accent-amber': timeLeft <= 60 && timeLeft > 30,
          'text-text-primary': timeLeft > 60,
        }"
      >{{ formatTime(timeLeft) }}</span>
    </div>
    <div class="flex flex-col items-center">
      <span class="font-display text-xs tracking-widest text-text-dim">CÒN LẠI</span>
      <span class="font-display text-lg font-bold text-text-primary">{{ remainingTiles }}</span>
    </div>
    <div v-if="combo > 1" class="flex flex-col items-center">
      <span class="font-display text-sm font-bold text-accent-amber">🔥 ×{{ combo }}</span>
    </div>
  </div>
</template>
