<script setup lang="ts">
import type { PixelEffect } from '../types'

defineProps<{ effect: PixelEffect }>()
</script>

<template>
  <div
    class="absolute pixel-explosion pointer-events-none select-none"
    :style="{
      left: `${effect.x}%`,
      top: `${effect.y}%`,
      transform: 'translate(-50%, -50%)',
    }"
    aria-hidden="true"
  >
    <div class="pixel-burst" />
  </div>
</template>

<style scoped>
.pixel-explosion {
  width: 38px;
  height: 38px;
  image-rendering: pixelated;
  animation: explode 240ms steps(6) both;
}

.pixel-burst {
  width: 100%;
  height: 100%;
  background:
    radial-gradient(var(--color-accent-coral) 25%, transparent 26%),
    radial-gradient(var(--color-accent-amber) 25%, transparent 26%),
    radial-gradient(var(--color-accent-sky) 18%, transparent 19%),
    radial-gradient(var(--color-accent-coral) 14%, transparent 15%);
  background-size:
    10px 10px,
    10px 10px,
    14px 14px,
    18px 18px;
  background-position:
    0 0,
    18px 18px,
    12px 4px,
    4px 14px;
  background-repeat: no-repeat;
  filter: contrast(1.1);
}

@keyframes explode {
  0% {
    opacity: 0.95;
    transform: scale(0.7);
  }
  70% {
    opacity: 0.85;
    transform: scale(1.25);
  }
  100% {
    opacity: 0;
    transform: scale(1.35);
  }
}
</style>
