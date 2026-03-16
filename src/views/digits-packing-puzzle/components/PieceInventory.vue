<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Piece } from '../types'
import PieceRenderer from './PieceRenderer.vue'
import { getPieceSegments } from '../utils/rotation'
import { getPieceAnchor } from '../utils/anchor'

interface Props {
  pieces: Piece[]
  dragPointer: { clientX: number; clientY: number } | null
}

interface Emits {
  piecePickup: [piece: Piece]
  rotate: [pieceId: string, direction: 'clockwise' | 'counterclockwise']
  pieceReturnToInventory: [piece: Piece]
  inventoryHoverChange: [isHover: boolean]
  startDragFromInventory: [
    piece: Piece,
    event: PointerEvent,
    dragPointerOffset: { x: number; y: number },
  ]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const containerRef = ref<HTMLDivElement>()
const isDragOver = ref(false)

function getPieceAnchorOffsetInPieceRendererSvg(piece: Piece): {
  x: number
  y: number
} {
  // Match PieceRenderer defaults (scale=1)
  const SEGMENT_LENGTH = 40
  const PADDING = 10

  const segments = getPieceSegments(piece)
  if (segments.length === 0) return { x: 0, y: 0 }

  // minX/minY match PieceRenderer's bbox logic (using raw segment coords)
  let minX = Infinity
  let minY = Infinity
  for (const seg of segments) {
    minX = Math.min(minX, seg.x)
    minY = Math.min(minY, seg.y)
  }

  // Anchor point in piece-local grid coords (centroid + per-digit tweak)
  const anchor = getPieceAnchor(piece)

  // Map local grid coords -> SVG pixel coords used by PieceRenderer
  return {
    x: PADDING + (anchor.x - minX) * SEGMENT_LENGTH,
    y: PADDING + (anchor.y - minY) * SEGMENT_LENGTH,
  }
}

// Track whether the current drag pointer is over the inventory area
watch(
  () => props.dragPointer,
  (dragPointer) => {
    if (!dragPointer || !containerRef.value) {
      if (isDragOver.value) {
        isDragOver.value = false
        emit('inventoryHoverChange', false)
      }
      return
    }

    const rect = containerRef.value.getBoundingClientRect()
    const isHover =
      dragPointer.clientX >= rect.left &&
      dragPointer.clientX <= rect.right &&
      dragPointer.clientY >= rect.top &&
      dragPointer.clientY <= rect.bottom

    if (isHover !== isDragOver.value) {
      isDragOver.value = isHover
      emit('inventoryHoverChange', isHover)
    }
  },
  { immediate: true },
)

const handlePointerDown = (piece: Piece, event: PointerEvent) => {
  emit('piecePickup', piece)

  // Compute dragPointerOffset so cursor represents the piece centroid in the inventory SVG
  const pieceEl = (event.currentTarget as HTMLElement).querySelector(
    '.inventory-item-piece svg',
  ) as SVGElement | null

  if (pieceEl && pieceEl instanceof SVGSVGElement) {
    const c = getPieceAnchorOffsetInPieceRendererSvg(piece)
    const ctm = pieceEl.getScreenCTM()
    if (ctm) {
      const screenPoint = new DOMPoint(c.x, c.y).matrixTransform(ctm)
      emit('startDragFromInventory', piece, event, {
        x: event.clientX - screenPoint.x,
        y: event.clientY - screenPoint.y,
      })
    } else {
      // Fallback: treat cursor as the centroid
      emit('startDragFromInventory', piece, event, { x: 0, y: 0 })
    }
  } else {
    // Fallback: treat cursor as the centroid
    emit('startDragFromInventory', piece, event, { x: 0, y: 0 })
  }
}
</script>

<template>
  <div
    ref="containerRef"
    :class="['flex flex-col flex-1 overflow-hidden p-4', isDragOver ? 'bg-accent-coral/10' : '']"
  >
    <h2 class="text-xl font-bold mb-4 text-text-primary">Kho mảnh ({{ pieces.length }}/10)</h2>

    <div class="grid grid-cols-2 gap-3 overflow-y-auto flex-1 pr-1">
      <div
        v-for="piece in pieces"
        :key="piece.id"
        class="p-3 bg-bg-surface border border-border-default cursor-grab flex flex-col items-center gap-2 transition-all duration-200 relative hover:bg-bg-elevated hover:border-accent-coral hover:-translate-y-0.5"
        @pointerdown="handlePointerDown(piece, $event)"
      >
        <div class="text-sm font-semibold text-text-secondary">
          {{ piece.number }}
        </div>

        <div
          class="w-full h-20 flex justify-center items-center overflow-visible inventory-item-piece"
        >
          <PieceRenderer :piece="piece" />
        </div>

        <div class="flex gap-1 w-full justify-center">
          <button
            @click="emit('rotate', piece.id, 'counterclockwise')"
            class="px-2 py-1 text-sm cursor-pointer border border-border-default bg-transparent text-text-secondary transition-all duration-200 hover:bg-bg-elevated hover:text-text-primary hover:border-accent-coral"
            title="Xoay ngược chiều kim đồng hồ"
          >
            ↻
          </button>
          <button
            @click="emit('rotate', piece.id, 'clockwise')"
            class="px-2 py-1 text-sm cursor-pointer border border-border-default bg-transparent text-text-secondary transition-all duration-200 hover:bg-bg-elevated hover:text-text-primary hover:border-accent-coral"
            title="Xoay theo chiều kim đồng hồ"
          >
            ↺
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
