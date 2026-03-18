<script setup lang="ts">
import { computed, toValue } from 'vue'
import type { Ref } from 'vue'
import { SHIPS } from '../utils/ship'

const props = defineProps<{
  placedShipIndices: Set<number> | Ref<Set<number>>
  rotation?: number
  droppable?: boolean
}>()

const placedSet = computed(() => toValue(props.placedShipIndices))

const emit = defineEmits<{
  remove: [r: number, c: number]
}>()

function onDragOver(e: DragEvent) {
  if (props.droppable) e.preventDefault()
}

function onDragEnter(e: DragEvent) {
  if (props.droppable) e.preventDefault()
}

function onDrop(e: DragEvent) {
  if (!props.droppable) return
  e.preventDefault()
  const data = e.dataTransfer?.getData('text/plain')
  if (!data?.startsWith('remove,')) return
  const parts = data.slice(7).split(',')
  const r = parseInt(parts[0] ?? '0', 10)
  const c = parseInt(parts[1] ?? '0', 10)
  if (!Number.isNaN(r) && !Number.isNaN(c)) emit('remove', r, c)
}

function onDragStart(e: DragEvent, shipIndex: number) {
  const dt = e.dataTransfer
  if (dt) {
    dt.setData('text/plain', `ship,${shipIndex}`)
    dt.effectAllowed = 'move'
  }
}

function rotateShape(shape: number[][]): number[][] {
  const rows = shape.length
  const cols = shape[0]?.length ?? 0
  return Array.from({ length: cols }, (_, j) =>
    Array.from({ length: rows }, (_, i) => shape[rows - 1 - i]?.[j] ?? 0),
  )
}

function getShapeWithRotation(shape: number[][], rot: number): number[][] {
  let s = shape
  for (let i = 0; i < rot % 4; i++) s = rotateShape(s)
  return s
}

const rotatedShapes = computed(() =>
  SHIPS.map((ship) => getShapeWithRotation(ship.shape, props.rotation ?? 0)),
)
</script>

<template>
  <div
    class="p-4 sm:p-6 border border-border-default bg-bg-surface transition-all duration-300 hover:border-accent-amber w-full sm:w-auto sm:min-w-[200px]"
    :class="droppable && 'min-h-[180px] sm:min-h-[200px]'"
    @dragenter="droppable && onDragEnter($event)"
    @dragover="droppable && onDragOver($event)"
    @drop="droppable && onDrop($event)"
  >
    <h3 class="font-display text-sm tracking-widest text-accent-amber mb-4">// Tàu cần đặt</h3>
    <p v-if="droppable" class="text-text-dim text-xs mb-3">Thả tàu vào đây để gỡ</p>
    <div class="flex flex-col gap-4">
      <div
        v-for="(ship, idx) in SHIPS"
        :key="ship.name"
        class="flex flex-col gap-[2px] transition-opacity"
        :class="placedSet.has(idx) ? 'opacity-40' : ''"
      >
        <div
          :draggable="!placedSet.has(idx)"
          class="flex flex-col gap-[2px] w-fit"
          :class="!placedSet.has(idx) ? 'cursor-grab active:cursor-grabbing select-none' : ''"
          @dragstart="!placedSet.has(idx) && onDragStart($event, idx)"
        >
          <div
            v-for="(row, ri) in placedSet.has(idx) ? ship.shape : rotatedShapes[idx]"
            :key="ri"
            class="flex gap-[2px]"
          >
            <div
              v-for="(cell, ci) in row"
              :key="`${ri}-${ci}`"
              class="w-6 h-6 border border-border-default"
              :class="cell ? 'bg-accent-amber' : 'bg-transparent'"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
