<script setup lang="ts">
import { computed } from 'vue'
import type { Zombie } from '../types'
import { useGameStore } from '../stores/gameStore'
// Multi-word component name for lint compliance
defineOptions({ name: 'TypingZombieZombie' })

const props = defineProps<{ zombie: Zombie }>()
const store = useGameStore()

const displayX = computed(() => Math.round(props.zombie.x))
const displayY = computed(() => Math.round(props.zombie.y))

const matchedLength = computed(() => {
  if (!props.zombie.active) return 0
  const typed = store.typedText
  const word = props.zombie.word
  let i = 0
  while (i < typed.length && i < word.length && typed[i] === word[i]) i++
  return i
})
</script>

<template>
  <div
    class="absolute select-none pixel-zombie"
    :style="{
      left: `${displayX}%`,
      top: `${displayY}%`,
      transform: 'translate(-50%, -50%)',
    }"
  >
    <!-- Word label above the zombie -->
    <div
      class="mb-1 px-2 py-1 text-center font-mono text-[10px] sm:text-xs whitespace-nowrap border-2 pixel-textbox"
      :class="
        zombie.active
          ? 'bg-[#0b1220] border-[#38bdf8] text-[#38bdf8]'
          : 'bg-[#0b1220] border-[#22c55e] text-[#22c55e]'
      "
    >
      <span
        v-for="(char, i) in zombie.word.split('')"
        :key="i"
        :class="zombie.active && i < matchedLength ? 'text-[#ef4444] font-bold' : ''"
      >
        {{ char }}
      </span>
    </div>

    <!-- Zombie sprite (emoji + step animation) -->
    <div class="pixel-sprite text-2xl sm:text-3xl leading-none">🧟</div>
  </div>
</template>

<style scoped>
.pixel-zombie {
  image-rendering: pixelated;
  will-change: left, top, transform;
}

.pixel-textbox {
  outline: 2px solid #000;
  outline-offset: -4px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.pixel-sprite {
  animation: walk 450ms steps(2) infinite;
  filter: saturate(1.05) contrast(1.1);
}

@keyframes walk {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-2px);
  }
}
</style>
