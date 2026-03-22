<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  value: number
  max: number
  target?: number
  unit?: string
  lowerIsBetter?: boolean
}>()

const percentage = computed(() => Math.min(100, (props.value / props.max) * 100))

const targetPercentage = computed(() =>
  props.target != null ? Math.min(100, (props.target / props.max) * 100) : null,
)

const barColor = computed(() => {
  if (props.target == null) return 'bg-accent-sky'
  const ratio = props.lowerIsBetter ? props.target / props.value : props.value / props.target
  if (ratio >= 1) return 'bg-green-500'
  if (ratio >= 0.7) return 'bg-accent-amber'
  return 'bg-accent-coral'
})
</script>

<template>
  <div class="space-y-1">
    <div class="flex items-center justify-between text-xs">
      <span class="text-text-secondary">{{ label }}</span>
      <span class="font-display text-text-primary">
        {{ value.toLocaleString() }}{{ unit ? ` ${unit}` : '' }}
      </span>
    </div>
    <div class="relative h-2 bg-bg-deep">
      <div
        class="h-full transition-all duration-500"
        :class="barColor"
        :style="{ width: `${percentage}%` }"
      />
      <div
        v-if="targetPercentage != null"
        class="absolute top-0 h-full w-0.5 border-l-2 border-dashed border-text-dim"
        :style="{ left: `${targetPercentage}%` }"
      />
    </div>
  </div>
</template>
