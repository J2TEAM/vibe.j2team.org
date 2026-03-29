<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: number
    label?: string
    id?: string
  }>(),
  {
    label: 'Tiến độ',
  },
)

const pct = () => Math.max(0, Math.min(100, Math.round(props.modelValue)))
</script>

<template>
  <div class="w-full">
    <div v-if="label" class="flex justify-between gap-2 text-xs font-display text-text-dim mb-1.5">
      <span :id="id">{{ label }}</span>
      <span class="tabular-nums text-text-secondary">{{ pct() }}%</span>
    </div>
    <div
      class="h-2 w-full border border-border-default bg-bg-deep overflow-hidden"
      role="progressbar"
      :aria-valuemin="0"
      :aria-valuemax="100"
      :aria-valuenow="pct()"
      :aria-labelledby="id"
    >
      <div
        class="h-full bg-accent-coral transition-[width] duration-300 ease-out"
        :style="{ width: `${pct()}%` }"
      />
    </div>
  </div>
</template>
