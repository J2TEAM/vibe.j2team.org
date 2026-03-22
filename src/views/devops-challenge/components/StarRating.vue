<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps<{
  stars: 0 | 1 | 2 | 3
  size?: 'sm' | 'md' | 'lg'
}>()

const sizeClasses = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
}
</script>

<template>
  <div class="inline-flex gap-0.5">
    <Icon
      v-for="i in 3"
      :key="i"
      icon="lucide:star"
      :class="[
        sizeClasses[size ?? 'md'],
        i <= stars ? 'fill-accent-amber text-accent-amber' : 'text-text-dim/30',
      ]"
    />
  </div>
</template>
