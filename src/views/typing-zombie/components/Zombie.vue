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
const displayScale = computed(() => Math.max(0.8, Math.min(2.2, props.zombie.size)))

const matchedLength = computed(() => {
  if (!props.zombie.active) return 0
  const typed = store.typedText
  const word = props.zombie.word
  let i = 0
  while (i < typed.length && i < word.length && typed[i] === word[i]) i++
  return i
})

const sprite = computed(() => {
  if (props.zombie.type === 'fast') return '🧟‍♂️'
  if (props.zombie.type === 'tank') return '🧟‍♀️'
  return '🧟'
})

const spriteAnimClass = computed(() => {
  if (props.zombie.type === 'fast') return 'walk-fast'
  if (props.zombie.type === 'boss') return 'walk-boss'
  return 'walk'
})

const completedSegments = computed(() => {
  const completed = props.zombie.maxWords - props.zombie.remainingWords.length - 1
  return Math.max(0, Math.min(props.zombie.maxWords - 1, completed))
})
</script>

<template>
  <div
    class="absolute select-none pixel-zombie"
    :style="{
      left: `${displayX}%`,
      top: `${displayY}%`,
      transform: `translate(-50%, -50%) scale(${displayScale})`,
    }"
  >
    <!-- Word label above the zombie -->
    <div
      class="mb-1 px-2 py-1 text-center text-[10px] sm:text-xs whitespace-nowrap border pixel-textbox"
      :class="
        zombie.active
          ? 'bg-bg-surface border-accent-sky text-accent-sky'
          : 'bg-bg-surface border-border-default text-text-primary'
      "
    >
      <span
        v-for="(char, i) in zombie.word.split('')"
        :key="i"
        :class="zombie.active && i < matchedLength ? 'text-accent-coral font-bold' : ''"
      >
        {{ char }}
      </span>
    </div>

    <div v-if="zombie.maxWords > 1" class="mb-1 flex justify-center gap-1">
      <span
        v-for="i in zombie.maxWords"
        :key="i"
        class="inline-block size-2 border border-border-default"
        :class="i <= completedSegments ? 'bg-accent-amber' : 'bg-bg-deep/40'"
      />
    </div>

    <!-- Zombie sprite (emoji + step animation) -->
    <div class="relative pixel-sprite text-2xl sm:text-3xl leading-none" :class="spriteAnimClass">
      <span>{{ sprite }}</span>
      <span
        v-if="zombie.type === 'boss'"
        class="absolute -top-3 -right-2 text-base sm:text-lg"
        aria-hidden="true"
      >
        👑
      </span>
      <span
        v-else-if="zombie.type === 'fast'"
        class="absolute -top-2 -right-2 text-sm sm:text-base"
        aria-hidden="true"
      >
        ⚡
      </span>
      <span
        v-else-if="zombie.type === 'tank'"
        class="absolute -top-2 -right-2 text-sm sm:text-base"
        aria-hidden="true"
      >
        🛡️
      </span>
    </div>
  </div>
</template>

<style scoped>
.pixel-zombie {
  image-rendering: pixelated;
  will-change: left, top, transform;
}

.pixel-textbox {
  outline: 1px solid #000;
  outline-offset: -2px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.pixel-sprite {
  filter: saturate(1.05) contrast(1.1);
}

@keyframes walkBase {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-2px);
  }
}

.walk {
  animation: walkBase 460ms steps(2) infinite;
}

.walk-fast {
  animation: walkBase 320ms steps(2) infinite;
}

.walk-boss {
  animation: walkBase 520ms steps(2) infinite;
}
</style>
