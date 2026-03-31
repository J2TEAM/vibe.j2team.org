<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps<{
  label: string
  value: number
  max: number
  target?: number
  unit?: string
  lowerIsBetter?: boolean
  icon?: string
}>()

const percentage = computed(() => Math.min(100, (props.value / props.max) * 100))

const targetPercentage = computed(() =>
  props.target != null ? Math.min(100, (props.target / props.max) * 100) : null,
)

const ratio = computed(() => {
  if (props.target == null) return 1
  return props.lowerIsBetter ? props.target / props.value : props.value / props.target
})

const barColor = computed(() => {
  if (props.target == null) return 'bg-accent-sky'
  if (ratio.value >= 1) return 'bg-green-500'
  if (ratio.value >= 0.7) return 'bg-accent-amber'
  return 'bg-accent-coral'
})

const glowColor = computed(() => {
  if (props.target == null) return 'shadow-accent-sky/20'
  if (ratio.value >= 1) return 'shadow-green-500/20'
  if (ratio.value >= 0.7) return 'shadow-accent-amber/20'
  return 'shadow-accent-coral/20'
})

const statusIcon = computed(() => {
  if (props.target == null) return null
  if (ratio.value >= 1) return 'lucide:check-circle'
  if (ratio.value >= 0.7) return 'lucide:alert-circle'
  return 'lucide:x-circle'
})

const statusColor = computed(() => {
  if (props.target == null) return ''
  if (ratio.value >= 1) return 'text-green-400'
  if (ratio.value >= 0.7) return 'text-accent-amber'
  return 'text-accent-coral'
})
</script>

<template>
  <div class="space-y-1.5">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1.5">
        <Icon v-if="icon" :icon="icon" class="size-3.5 text-text-dim" />
        <span class="text-xs text-text-secondary">{{ label }}</span>
        <Icon v-if="statusIcon" :icon="statusIcon" class="size-3" :class="statusColor" />
      </div>
      <span
        class="font-display text-xs font-semibold tabular-nums"
        :class="statusColor || 'text-text-primary'"
      >
        {{ value.toLocaleString() }}{{ unit ? ` ${unit}` : '' }}
      </span>
    </div>
    <div class="relative h-2.5 bg-bg-deep/80 overflow-hidden">
      <div
        class="h-full transition-all duration-700 ease-out shadow-sm"
        :class="[barColor, glowColor]"
        :style="{ width: `${percentage}%` }"
      />
      <div
        v-if="targetPercentage != null"
        class="absolute top-0 h-full w-0.5 bg-text-primary/40"
        :style="{ left: `${targetPercentage}%` }"
      >
        <div class="absolute -top-1 left-1/2 -translate-x-1/2 size-1 bg-text-primary/60" />
      </div>
    </div>
  </div>
</template>
