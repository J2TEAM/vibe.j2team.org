<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  code: string
  label: string
  labelShift?: string
  status: 'idle' | 'active' | 'pressed'
  width?: string
  height?: string
  isSmall?: boolean
  spanH?: boolean
  spanV?: boolean
  gridArea?: string
}

const props = defineProps<Props>()

const statusClasses = computed(() => {
  switch (props.status) {
    case 'active':
      return 'bg-accent-coral border-accent-coral text-bg-deep z-10 scale-95'
    case 'pressed':
      return 'bg-bg-elevated border-accent-amber text-text-primary'
    default:
      return 'bg-bg-surface border-border-default text-text-secondary hover:border-text-dim'
  }
})
</script>

<template>
  <div
    class="flex flex-col items-center justify-center border transition-all duration-75 select-none font-display text-sm relative"
    :class="[
      statusClasses,
      spanH || width ? width || 'col-span-2 w-full' : 'w-12',
      spanV || height ? height || 'row-span-2 h-full' : 'h-12',
    ]"
    :style="gridArea ? { gridArea } : {}"
  >
    <template v-if="labelShift">
      <span class="absolute top-1 right-2 text-[10px] leading-tight opacity-70">{{
        labelShift
      }}</span>
      <span class="absolute bottom-1.5 left-2 leading-tight">{{ label }}</span>
    </template>
    <template v-else>
      <span :class="{ 'text-[10px]': isSmall }">{{ label }}</span>
    </template>
  </div>
</template>
