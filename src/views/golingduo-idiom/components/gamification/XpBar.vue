<script setup lang="ts">
defineProps<{
  xp: number
  levelLabel: string
  nextLevelMin: number | null
}>()

const xpPercent = (xp: number, next: number | null) => {
  if (!next) return 100
  return Math.min((xp / next) * 100, 100)
}
</script>

<template>
  <div class="border border-border-default bg-bg-surface p-4">
    <div class="flex items-center justify-between">
      <span class="font-display text-sm text-text-secondary">{{ levelLabel }}</span>
      <span class="font-display text-sm text-accent-amber">{{ xp }} XP</span>
    </div>
    <div class="mt-2 h-3 overflow-hidden bg-bg-elevated">
      <div
        class="h-full bg-accent-amber transition-all duration-500"
        :style="{ width: `${xpPercent(xp, nextLevelMin)}%` }"
      />
    </div>
    <p v-if="nextLevelMin" class="mt-1 text-right text-xs text-text-dim">
      {{ nextLevelMin - xp }} XP còn lại để lên level
    </p>
    <p v-else class="mt-1 text-right text-xs text-accent-coral font-display">🎉 MAX LEVEL!</p>
  </div>
</template>
