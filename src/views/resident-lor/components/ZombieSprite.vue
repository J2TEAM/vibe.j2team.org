<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { WALK_FRAMES, DEATH_FRAMES } from '../assets/zom_char'
import type { Zombie } from '../types'

const WALK_FRAME_MS = 100
const DEATH_FRAME_MS = 100

const props = defineProps<{
  zombie: Zombie
  x: number
  y: number
}>()

const walkFrame = ref(0)
const deathFrame = ref(0)

const isDying = computed(() => props.zombie.state === 'dying')

const frames = computed(() =>
  isDying.value ? DEATH_FRAMES[props.zombie.direction] : WALK_FRAMES[props.zombie.direction],
)
const frameIndex = computed(() => (isDying.value ? deathFrame.value : walkFrame.value))
const src = computed(() => frames.value[frameIndex.value] ?? frames.value[0])

watch(isDying, () => {
  if (isDying.value) deathFrame.value = 0
})

const intervalId = ref<ReturnType<typeof setInterval> | null>(null)
watch(
  [isDying, src],
  () => {
    if (intervalId.value) clearInterval(intervalId.value)
    if (!src.value) return
    intervalId.value = setInterval(
      () => {
        if (isDying.value) {
          deathFrame.value = Math.min(deathFrame.value + 1, 6)
        } else {
          walkFrame.value = (walkFrame.value + 1) % 6
        }
      },
      isDying.value ? DEATH_FRAME_MS : WALK_FRAME_MS,
    )
  },
  { immediate: true },
)

onUnmounted(() => {
  if (intervalId.value) clearInterval(intervalId.value)
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
