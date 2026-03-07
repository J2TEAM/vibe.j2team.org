<script setup lang="ts">
import type { DisplayCell, Point, Tile } from '../types'

interface Props {
  displayCells: DisplayCell[]
  extCols: number
  extRows: number
  cellSizeClass: string
  firstSelectedId: number | null
  secondSelectedId: number | null
  disabled: boolean
  flashPath: Point[]
  pathPolylinePoints: string
  isFullscreen: boolean
}

defineProps<Props>()

defineEmits<{ select: [tile: Tile] }>()
</script>

<template>
  <div class="animate-fade-up animate-delay-2 border border-border-default bg-bg-surface p-2 sm:p-4">
    <div
      class="flex justify-center overflow-auto"
      :class="isFullscreen ? 'max-h-[calc(100vh-230px)]' : 'max-h-[72vh]'"
    >
      <div class="relative overflow-visible p-1">
        <div class="grid gap-[2px]" :style="{ gridTemplateColumns: `repeat(${extCols}, minmax(0, 1fr))`, width: 'fit-content' }">
          <div
            v-for="cell in displayCells"
            :key="cell.key"
            class="border border-border-default transition-all duration-150"
            :class="[
              cellSizeClass,
              cell.isOuter ? 'border-transparent bg-transparent' : '',
              !cell.isOuter && cell.tile?.kind === 'wall' ? 'border-border-default bg-bg-elevated' : '',
              !cell.isOuter && cell.tile?.kind === 'icon' && cell.tile.isVisible
                ? 'flex cursor-pointer items-center justify-center bg-bg-deep hover:border-accent-amber hover:bg-bg-elevated'
                : '',
              !cell.isOuter && cell.tile?.kind === 'icon' && !cell.tile.isVisible ? 'border-border-default/30 bg-bg-deep/30' : '',
              cell.tile && firstSelectedId === cell.tile.id ? 'border-accent-coral bg-bg-elevated' : '',
              cell.tile && secondSelectedId === cell.tile.id ? 'border-accent-amber bg-bg-elevated' : '',
              disabled ? 'pointer-events-none opacity-80' : '',
            ]"
            @click="cell.tile && $emit('select', cell.tile)"
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
      </div>
    </div>
  </div>
</template>

