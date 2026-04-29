<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { EchoState, Point, Tile } from '../types'

const props = defineProps<{
  grid: Tile[][]
  levelWidth: number
  levelHeight: number
  startPoint: Point
  exitPoint: Point
  playerPosition: Point
  echoes: EchoState[]
  doorOpen: boolean
}>()

function isPlayerAt(x: number, y: number): boolean {
  return props.playerPosition.x === x && props.playerPosition.y === y
}

function getEchoCountAt(x: number, y: number): number {
  return props.echoes.reduce((count, echo) => {
    if (echo.position.x === x && echo.position.y === y) {
      return count + 1
    }

    return count
  }, 0)
}

function getFirstEchoIdAt(x: number, y: number): number {
  const found = props.echoes.find((echo) => echo.position.x === x && echo.position.y === y)

  return found?.id ?? 1
}

function getCellClasses(x: number, y: number): string[] {
  const tile = props.grid[y]?.[x]
  const classes = [
    'relative',
    'flex',
    'size-8',
    'items-center',
    'justify-center',
    'border',
    'text-[10px]',
    'font-semibold',
    'sm:size-9',
  ]

  if (tile === '#') {
    classes.push('border-border-default', 'bg-bg-elevated')
  } else if (tile === 'P') {
    classes.push('border-border-default', 'bg-accent-amber/20')
  } else if (tile === 'D') {
    if (props.doorOpen) {
      classes.push('border-border-default', 'bg-accent-sky/30')
    } else {
      classes.push('border-border-default', 'bg-accent-coral/30')
    }
  } else {
    classes.push('border-border-default', 'bg-bg-surface')
  }

  if (props.exitPoint.x === x && props.exitPoint.y === y) {
    classes.push('ring-1', 'ring-accent-sky')
  }

  return classes
}

function getEchoBadgeClass(id: number): string {
  const palette = [
    'bg-accent-amber text-bg-deep',
    'bg-accent-sky text-bg-deep',
    'bg-accent-coral text-bg-deep',
  ] as const

  return palette[(id - 1) % palette.length] ?? palette[0]
}
</script>

<template>
  <div class="overflow-x-auto pb-2">
    <div
      class="mx-auto grid w-max gap-1"
      :style="{ gridTemplateColumns: `repeat(${levelWidth}, minmax(0, 1fr))` }"
    >
      <template v-for="y in levelHeight" :key="`row-${y}`">
        <template v-for="x in levelWidth" :key="`cell-${x}-${y}`">
          <div :class="getCellClasses(x - 1, y - 1)">
            <div
              v-if="exitPoint.x === x - 1 && exitPoint.y === y - 1"
              class="absolute left-0.5 top-0.5 text-[8px] font-medium"
              :class="doorOpen ? 'text-accent-sky' : 'text-accent-coral'"
            >
              {{ doorOpen ? 'EXIT' : 'LOCK' }}
            </div>

            <div
              v-if="startPoint.x === x - 1 && startPoint.y === y - 1"
              class="absolute bottom-0.5 left-0.5 text-[8px] font-medium text-text-secondary"
            >
              S
            </div>

            <div
              v-if="isPlayerAt(x - 1, y - 1)"
              class="z-20 inline-flex size-5 items-center justify-center border border-border-default bg-accent-coral text-bg-deep sm:size-6"
            >
              <Icon icon="lucide:user-round" class="size-3 sm:size-3.5" />
            </div>

            <div
              v-else-if="getEchoCountAt(x - 1, y - 1) > 0"
              class="z-10 inline-flex size-5 items-center justify-center border border-border-default text-[10px] font-bold sm:size-6"
              :class="getEchoBadgeClass(getFirstEchoIdAt(x - 1, y - 1))"
            >
              {{ getEchoCountAt(x - 1, y - 1) }}
            </div>

            <div
              v-if="grid[y - 1]?.[x - 1] === 'P'"
              class="absolute right-0.5 top-0.5 text-[8px] text-accent-amber"
            >
              P
            </div>
            <div
              v-if="grid[y - 1]?.[x - 1] === 'D'"
              class="absolute right-0.5 top-0.5 text-[8px]"
              :class="doorOpen ? 'text-accent-sky' : 'text-accent-coral'"
            >
              D
            </div>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>
