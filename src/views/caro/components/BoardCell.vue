<script setup lang="ts">
import { computed } from 'vue'
import { PlayerEnum } from '@/views/caro/types'

const props = withDefaults(
  defineProps<{
    value: PlayerEnum | null
    cellSize: number
    isWinning?: boolean
    isLastMove?: boolean
    gameEnded?: boolean
  }>(),
  {
    isWinning: false,
    isLastMove: false,
    gameEnded: false,
  },
)

const emit = defineEmits<{
  click: []
}>()

const fontSize = computed(() => props.cellSize * 0.55)

const cellColor = computed(() => {
  if (props.value === PlayerEnum.X) return 'var(--color-accent-coral)'
  if (props.value === PlayerEnum.O) return 'var(--color-accent-sky)'
  return 'transparent'
})

function onClick() {
  emit('click')
}
</script>

<template>
  <button
    type="button"
    class="cell"
    :class="{
      'cell--winning': isWinning,
      'cell--last-move': isLastMove,
      'cell--ended': gameEnded,
    }"
    :style="{
      width: `${cellSize}px`,
      height: `${cellSize}px`,
    }"
    @click="onClick"
  >
    <span
      v-if="value !== null"
      class="cell-piece"
      :class="{
        'cell-piece--winning': isWinning,
      }"
      :style="{
        fontSize: `${fontSize}px`,
        color: cellColor,
      }"
    >
      {{ value }}
    </span>
  </button>
</template>

<style scoped>
.cell {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  outline: none;
  transition: all 0.2s ease;
  border-radius: 4px;
  border: 1px solid var(--color-border-default);
  background-color: var(--color-bg-surface);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  opacity: 1;
}

.cell:hover:not(.cell--ended):not(.cell--winning):not(.cell--last-move) {
  background-color: var(--color-bg-elevated);
  border-color: var(--color-accent-sky);
  box-shadow: 0 0 0 2px var(--color-accent-sky);
}

.cell--ended:not(.cell--winning) {
  background-color: var(--color-bg-elevated);
  cursor: not-allowed;
  opacity: 0.7;
}

.cell--last-move {
  border-width: 2px;
  border-color: var(--color-accent-coral);
  box-shadow: 0 0 4px rgba(255, 107, 74, 0.2);
}

.cell--winning {
  animation: cell-winning-pulse 2s ease-in-out infinite;
}

@keyframes cell-winning-pulse {
  0%,
  100% {
    box-shadow: 0 0 8px rgba(255, 184, 48, 0.4);
  }
  50% {
    box-shadow: 0 0 16px rgba(245, 158, 11, 0.6);
  }
}

.cell-piece {
  font-weight: 900;
  user-select: none;
  pointer-events: none;
  text-shadow: 0 0 8px currentColor;
  animation: cell-piece-appear 0.35s ease-out both;
}

.cell-piece--winning {
  text-shadow:
    0 0 8px currentColor,
    0 0 16px currentColor;
}

@keyframes cell-piece-appear {
  from {
    opacity: 0;
    transform: scale(0);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
