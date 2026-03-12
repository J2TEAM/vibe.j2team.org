<script setup lang="ts">
import { computed } from 'vue'
import { useMap } from '../composables/useMap'
import type { Bullet } from '../types'

const props = defineProps<{ bullets: Bullet[] }>()
const mapRef = useMap()

const bulletsWithCoords = computed(() => {
  const map = mapRef.value
  if (!map) return []
  return props.bullets.map((b) => {
    const point = map.project([b.lng, b.lat])
    return { ...b, x: point.x, y: point.y }
  })
})
</script>

<template>
  <div
    v-for="b in bulletsWithCoords"
    :key="b.id"
    class="bullet"
    :style="{ left: `${b.x}px`, top: `${b.y}px` }"
  />
</template>

<style scoped>
.bullet {
  position: fixed;
  width: 6px;
  height: 6px;
  background: #fbbf24;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 11;
  box-shadow: 0 0 4px rgba(251, 191, 36, 0.8);
}
</style>
