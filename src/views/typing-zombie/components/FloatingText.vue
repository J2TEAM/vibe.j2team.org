<script setup lang="ts">
import { computed } from 'vue'
import type { PixelEffect } from '../types'

// Multi-word component name for lint compliance
defineOptions({ name: 'TypingZombieFloatingText' })

const props = defineProps<{ effect: PixelEffect }>()

const colorClass = computed(() => {
  if (props.effect.kind === 'score') return 'text-accent-amber'
  if (props.effect.kind === 'combo') return 'text-accent-sky'
  if (props.effect.kind === 'powerup') return 'text-accent-coral'
  if (props.effect.kind === 'streak') return 'text-accent-coral'
  return 'text-text-primary'
})

const sizeClass = computed(() => {
  if (props.effect.kind === 'streak')
    return 'text-lg sm:text-2xl font-display font-bold tracking-wide'
  return 'text-xs sm:text-sm font-display font-semibold tracking-widest'
})
</script>

<template>
  <div
    class="absolute pointer-events-none select-none floating-text"
    :class="[colorClass, sizeClass]"
    :style="{
      left: `${effect.x}%`,
      top: `${effect.y}%`,
      transform: 'translate(-50%, -50%)',
    }"
    aria-hidden="true"
  >
    <span class="px-2 py-1 bg-bg-surface/65 border border-border-default shadow-sm shadow-black/30">
      {{ effect.value }}
    </span>
  </div>
</template>

<style scoped>
.floating-text {
  animation: floatUp 900ms ease-out both;
  will-change: transform, opacity;
}

@keyframes floatUp {
  0% {
    opacity: 0;
    transform: translate(-50%, -35%) scale(0.96);
  }
  15% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -95%) scale(1.02);
  }
}
</style>
