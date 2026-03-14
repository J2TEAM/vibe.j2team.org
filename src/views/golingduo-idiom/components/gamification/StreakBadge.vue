<script setup lang="ts">
defineProps<{
  current: number
  longest: number
}>()
</script>

<template>
  <div class="flex items-center gap-3 border border-border-default bg-bg-surface p-4">
    <div
      class="flex size-12 items-center justify-center border-2 border-accent-amber text-2xl"
      :class="current >= 7 ? 'animate-pulse-border' : ''"
    >
      🔥
    </div>
    <div>
      <p class="font-display text-lg font-bold text-accent-amber">{{ current }} ngày</p>
      <p class="text-xs text-text-dim">Kỷ lục: {{ longest }} ngày</p>
    </div>
  </div>
</template>
