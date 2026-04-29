<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps<{
  stars: 0 | 1 | 2 | 3
  size?: 'sm' | 'md' | 'lg'
}>()

const sizeClasses = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-10',
}
</script>

<template>
  <div class="inline-flex gap-1">
    <span
      v-for="i in 3"
      :key="i"
      class="relative inline-block transition-transform duration-300"
      :class="i <= stars ? 'scale-110' : 'scale-100'"
      :style="i <= stars ? { transitionDelay: `${(i - 1) * 100}ms` } : {}"
    >
      <Icon
        icon="lucide:star"
        :class="[
          sizeClasses[size ?? 'md'],
          i <= stars
            ? 'fill-accent-amber text-accent-amber drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]'
            : 'text-text-dim/20',
        ]"
      />
    </span>
  </div>
</template>
