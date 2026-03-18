<script setup lang="ts">
import { computed } from 'vue'
import { WALK_FRAMES, DEATH_FRAMES } from '../assets/zom_char'
import type { Zombie } from '../types'

const props = defineProps<{
  zombie: Zombie
  x: number
  y: number
  walkFrame: number
}>()

const src = computed(() => {
  if (props.zombie.state === 'dying') {
    const frames = DEATH_FRAMES[props.zombie.direction]
    return frames[props.zombie.deathFrame ?? 0] ?? frames[0]
  }
  const frames = WALK_FRAMES[props.zombie.direction]
  return frames[props.walkFrame % frames.length] ?? frames[0]
})
</script>

<template>
  <div
    class="zombie"
    :style="{
      left: `${x}px`,
      top: `${y}px`,
      transform: 'translate(-50%, -50%)',
    }"
  >
    <img v-if="src" :src="src" alt="" class="zombie-sprite" />
  </div>
</template>

<style scoped>
.zombie {
  position: fixed;
  pointer-events: none;
  z-index: 9;
}

.zombie-sprite {
  width: 48px;
  height: 48px;
  display: block;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
</style>
