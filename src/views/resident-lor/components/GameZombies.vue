<script setup lang="ts">
import { computed } from 'vue'
import { useMap } from '../composables/useMap'
import type { Zombie } from '../types'
import ZombieSprite from './ZombieSprite.vue'

const props = defineProps<{ zombies: Zombie[] }>()

const mapRef = useMap()

const zombiesWithCoords = computed(() => {
  const map = mapRef.value
  if (!map) return []
  return props.zombies.map((z) => {
    const point = map.project([z.lng, z.lat])
    return { zombie: z, x: point.x, y: point.y }
  })
})
</script>

<template>
  <ZombieSprite
    v-for="item in zombiesWithCoords"
    :key="item.zombie.id"
    :zombie="item.zombie"
    :x="item.x"
    :y="item.y"
  />
</template>
