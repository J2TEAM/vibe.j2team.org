<script setup lang="ts">
import { ref, computed, toValue } from 'vue'
import type { Ref } from 'vue'
import { useWindowSize } from '@vueuse/core'
import type { Cell } from '../utils/board'
import { SIZE } from '../utils/board'

defineOptions({ name: 'BattleshipBoard' })

type Placement = { r: number; c: number; shape: number[][] }

const props = defineProps<{
  board: Cell[][]
  clickable?: boolean
  hideShips?: boolean
  droppable?: boolean
  removable?: boolean
  attackMode?: boolean
  selectedPlacement?: Placement | null | Ref<Placement | null>
}>()

const selectedPlacementValue = computed(() => toValue(props.selectedPlacement))

const emit = defineEmits<{
  cell: [r: number, c: number, shipIndex?: number]
  select: [r: number, c: number]
  move: [fromR: number, fromC: number, toR: number, toC: number]
}>()

function isCellInPlacement(rr: number, cc: number, p: Placement): boolean {
  const { r, c, shape } = p
  for (let di = 0; di < shape.length; di++) {
    const row = shape[di]
    if (!row) continue
    for (let dj = 0; dj < row.length; dj++) {
      if (!row[dj]) continue
      if (r + di === rr && c + dj === cc) return true
    }
  }
  return false
}

const gridRef = ref<HTMLElement | null>(null)
const { width: windowWidth } = useWindowSize()

const cellSize = computed(() => {
  const available = windowWidth.value - 64
  const raw = Math.floor(available / SIZE) - 2
  return Math.min(34, Math.max(24, raw))
})

function onCellDragEnter(e: DragEvent) {
  if (props.droppable) e.preventDefault()
}

function onCellDragOver(e: DragEvent) {
  if (props.droppable) {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  }
}

function onCellDrop(e: DragEvent, toR: number, toC: number) {
  if (!props.droppable) return
  e.preventDefault()
  e.stopPropagation()
  const data = e.dataTransfer?.getData('text/plain')

  if (data?.startsWith('remove,')) {
    const parts = data.slice(7).split(',')
    const fromR = parseInt(parts[0] ?? '0', 10)
    const fromC = parseInt(parts[1] ?? '0', 10)
    if (!Number.isNaN(fromR) && !Number.isNaN(fromC)) {
      emit('move', fromR, fromC, toR, toC)
    }
    return
  }

  let shipIndex: number | undefined
  if (data?.startsWith('ship,')) {
    const idx = parseInt(data.slice(5), 10)
    if (!Number.isNaN(idx)) shipIndex = idx
  }
  emit('cell', toR, toC, shipIndex)
}

function onShipDragStart(e: DragEvent, r: number, c: number) {
  const dt = e.dataTransfer
  if (dt) {
    dt.setData('text/plain', `remove,${r},${c}`)
    dt.effectAllowed = 'move'
  }
}
</script>

<template>
  <div
    ref="gridRef"
    class="grid gap-[2px] w-fit max-w-full"
    :style="{ gridTemplateColumns: `repeat(${board.length},${cellSize}px)` }"
  >
    <div v-for="(row, r) in board" :key="r" class="contents">
      <div
        v-for="(cell, c) in row"
        :key="`${r}-${c}`"
        :draggable="removable && cell.ship && !cell.hit"
        class="border border-border-default transition select-none min-w-0 min-h-0"
        :style="{ width: `${cellSize}px`, height: `${cellSize}px` }"
        :class="[
          cell.hit && cell.ship && '!bg-accent-coral',
          cell.hit && !cell.ship && 'bg-accent-sky/30',
          (!cell.ship || hideShips) && !cell.hit && 'bg-bg-elevated',
          cell.ship && !cell.hit && !hideShips && 'bg-accent-amber',
          clickable && 'cursor-pointer hover:border-accent-coral/50',
          droppable && 'hover:border-accent-amber/70',
          removable && cell.ship && !cell.hit && 'cursor-grab active:cursor-grabbing',
          selectedPlacementValue &&
            isCellInPlacement(r, c, selectedPlacementValue) &&
            '!border-accent-coral !border-2',
        ]"
        @click="
          clickable &&
          (attackMode ? emit('cell', r, c) : cell.ship ? emit('select', r, c) : emit('cell', r, c))
        "
        @dragenter.prevent="droppable && onCellDragEnter($event)"
        @dragover.prevent="droppable && onCellDragOver($event)"
        @drop.prevent="droppable && onCellDrop($event, r, c)"
        @dragstart="removable && cell.ship && !cell.hit && onShipDragStart($event, r, c)"
      />
    </div>
  </div>
</template>
