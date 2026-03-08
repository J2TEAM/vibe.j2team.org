<script setup lang="ts">
import type { DisplayCell, Tile } from '../types'

defineProps<{
  displayCells: DisplayCell[]
  extCols: number
  extRows: number
  portraitCellSizeClass: string
  firstSelected: Tile | null
  secondSelected: Tile | null
  failedPairIds: number[]
  flashPath: { x: number; y: number }[]
  pathPolylinePoints: string
  isPaused: boolean
  isGameOver: boolean
  isResolvingPair: boolean
  surfaceClass: string
}>()

const emit = defineEmits<{
  'select-tile': [tile: Tile]
}>()
</script>

<template>
  <div class="animate-fade-up animate-delay-2 border p-3 sm:p-4" :class="surfaceClass">
    <div class="flex justify-center overflow-x-auto">
      <div class="relative overflow-visible">
        <div class="grid gap-[2px]" :style="{ gridTemplateColumns: `repeat(${extCols}, minmax(0, 1fr))`, width: 'fit-content' }">
          <div
            v-for="cell in displayCells"
            :key="cell.key"
            class="border transition-all duration-150"
            :class="[
              portraitCellSizeClass,
              cell.isOuter ? 'border-transparent bg-transparent' : '',
              !cell.isOuter && cell.tile?.kind === 'wall' ? 'border-[#707070] bg-[#707070]' : '',
              !cell.isOuter && cell.tile?.kind === 'icon' && cell.tile.isVisible ? 'cursor-pointer border-border-default bg-bg-deep hover:border-accent-amber hover:bg-bg-elevated flex items-center justify-center' : '',
              !cell.isOuter && cell.tile?.kind === 'icon' && !cell.tile.isVisible ? 'border-border-default/40 bg-bg-deep/30' : '',
              cell.tile && firstSelected?.id === cell.tile.id ? '!border-accent-amber !bg-accent-amber/45 ring-2 ring-accent-amber/80 shadow-[0_0_10px_rgba(255,184,48,0.65)]' : '',
              cell.tile && secondSelected?.id === cell.tile.id ? 'border-accent-amber bg-accent-amber/25' : '',
              cell.tile && failedPairIds.includes(cell.tile.id) ? 'tile-fail-shake border-accent-coral bg-accent-amber/25' : '',
              isPaused || isGameOver ? 'pointer-events-none opacity-80' : '',
              isResolvingPair ? 'pointer-events-none' : '',
            ]"
            @click="cell.tile && emit('select-tile', cell.tile)"
          >
            <template v-if="cell.tile?.kind === 'icon' && cell.tile.isVisible">{{ cell.tile.icon }}</template>
          </div>
        </div>

        <svg class="pointer-events-none absolute inset-0 h-full w-full" :viewBox="`0 0 ${extCols} ${extRows}`" preserveAspectRatio="none">
          <polyline
            v-if="flashPath.length > 1"
            :points="pathPolylinePoints"
            class="connect-line"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="0.14"
          />
        </svg>

        <div
          v-if="isPaused && !isGameOver"
          class="absolute inset-0 z-10 flex items-center justify-center border border-border-default bg-bg-deep"
        >
          <p class="font-display text-xs tracking-[0.2em] text-accent-coral sm:text-sm">PAUSED</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.connect-line {
  stroke: #ffb830;
  filter: drop-shadow(0 0 6px rgb(255 184 48 / 75%));
  animation: connect-flash 0.28s ease-in-out 2;
}

@keyframes connect-flash {
  0%,
  100% {
    opacity: 0.2;
  }
  50% {
    opacity: 1;
  }
}

.tile-fail-shake {
  animation: tile-fail-shake 0.28s ease-in-out 1;
}

@keyframes tile-fail-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-2px);
  }
  75% {
    transform: translateX(2px);
  }
}
</style>
