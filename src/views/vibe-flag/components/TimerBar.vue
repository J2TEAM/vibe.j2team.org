<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  timeLeft: number
  maxTime: number
}>()

const percentage = computed(() => (props.timeLeft / props.maxTime) * 100)

const barColor = computed(() => {
  if (percentage.value > 50) return 'bg-accent-sky'
  if (percentage.value > 25) return 'bg-accent-amber'
  return 'bg-accent-coral'
})
</script>

<template>
  <div class="w-full">
    <div class="flex items-center justify-between mb-1.5">
      <span class="font-display text-text-dim text-xs tracking-widest">THỜI GIAN</span>
      <span
        :class="[
          'font-display text-sm font-bold tabular-nums transition-colors duration-300',
          timeLeft <= 3 ? 'text-accent-coral' : 'text-text-primary',
        ]"
      >
        {{ timeLeft }}s
      </span>
    </div>
    <div class="bg-bg-elevated border-border-default relative h-2 w-full overflow-hidden border">
      <div
        :class="['h-full transition-all duration-1000 ease-linear', barColor]"
        :style="{ width: `${percentage}%` }"
      />
    </div>
  </div>
</template>
