<script setup lang="ts">
import { computed } from 'vue'
import type { Direction } from '../types'
import { ROTATION_SPRITES } from '../assets/main_char/rotations'

type Keys = { w: boolean; a: boolean; s: boolean; d: boolean }

function getDirection(keys: Keys): Direction {
  const hasNorth = keys.w && !keys.s
  const hasSouth = keys.s && !keys.w
  const hasWest = keys.a && !keys.d
  const hasEast = keys.d && !keys.a
  if (hasNorth && hasWest) return 'north-west'
  if (hasNorth && hasEast) return 'north-east'
  if (hasSouth && hasWest) return 'south-west'
  if (hasSouth && hasEast) return 'south-east'
  if (hasNorth) return 'north'
  if (hasSouth) return 'south'
  if (hasWest) return 'west'
  if (hasEast) return 'east'
  return 'south'
}

const props = defineProps<{ keys: Keys }>()

const direction = computed(() => getDirection(props.keys))
const spriteSrc = computed(() => ROTATION_SPRITES[direction.value])
</script>

<template>
  <div class="player">
    <img :src="spriteSrc" alt="Player" class="player-sprite" />
  </div>
</template>

<style scoped>
.player {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 10;
}

.player-sprite {
  width: 48px;
  height: 48px;
  display: block;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
</style>
