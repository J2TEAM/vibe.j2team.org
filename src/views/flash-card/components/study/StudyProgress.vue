<script setup lang="ts">
defineProps<{
  round: number
  remaining: number
  total: number
}>()
</script>

<template>
  <div class="flex items-center gap-4">
    <span class="font-display text-sm text-accent-amber font-semibold"> Vòng {{ round }}/3 </span>
    <div class="flex-1 h-1.5 bg-bg-elevated overflow-hidden">
      <div
        class="h-full bg-accent-coral transition-all duration-500"
        :style="{ width: total > 0 ? `${((total - remaining) / total) * 100}%` : '0%' }"
      />
    </div>
    <span class="text-xs text-text-dim whitespace-nowrap"> Còn {{ remaining }} thẻ </span>
  </div>
</template>
