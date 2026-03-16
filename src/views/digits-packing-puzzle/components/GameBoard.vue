<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Piece, BoardPosition, Segment, PlacedPiece } from '../types'
import { getAllBoardSegments, segmentToId, PIECE_COLORS } from '../utils/segments'
import { getPieceSegments } from '../utils/rotation'
import { getPieceAnchor } from '../utils/anchor'
import { useElementSize } from '@vueuse/core'

interface Props {
  placedPieces: PlacedPiece[]
  occupiedSegments: Set<string>
  draggedPiece: Piece | null
  dragPointer: { clientX: number; clientY: number } | null
  dragPointerOffset: { x: number; y: number } | null
}

interface Emits {
  piecePickup: [piece: Piece, position: BoardPosition]
  boardHoverChange: [position: BoardPosition | null]
  startDragFromBoard: [
    piece: Piece,
    position: BoardPosition,
    event: PointerEvent,
    dragPointerOffset: { x: number; y: number },
  ]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const containerRef = ref<HTMLDivElement>()
const dragOverPosition = ref<BoardPosition | null>(null)
const scale = ref(0.8)
const isLoading = ref(true)

const { width: containerWidth, height: containerHeight } = useElementSize(containerRef)

const BASE_SEGMENT_LENGTH = 60
const SEGMENT_THICKNESS = 8
const GRID_PADDING = 10

// Calculate scale based on container size
watch(
  [containerWidth, containerHeight],
  () => {
    if (!containerRef.value) return

    const containerW = containerWidth.value
    const containerH = containerHeight.value

    // Base board dimensions
    const baseWidth = 5 * BASE_SEGMENT_LENGTH + 2 * GRID_PADDING
    const baseHeight = 4 * BASE_SEGMENT_LENGTH + 2 * GRID_PADDING

    const maxWidth = 698 - 16

    // Calculate scale to fit container (with some margin)
    const scaleX = Math.min((containerW - 40) / baseWidth, maxWidth / baseWidth)
    const scaleY = (containerH - 40) / baseHeight
    const newScale = Math.min(scaleX, scaleY, 2.0)

    scale.value = newScale
    isLoading.value = false
  },
  { immediate: true },
)

const SEGMENT_LENGTH = computed(() => BASE_SEGMENT_LENGTH * scale.value)

const boardSegments = computed(() => getAllBoardSegments())
const svgWidth = computed(() => 5 * SEGMENT_LENGTH.value + 2 * GRID_PADDING * scale.value)
const svgHeight = computed(() => 4 * SEGMENT_LENGTH.value + 2 * GRID_PADDING * scale.value)

const gridToPixel = (x: number, y: number) => {
  return {
    x: GRID_PADDING * scale.value + x * SEGMENT_LENGTH.value,
    y: GRID_PADDING * scale.value + y * SEGMENT_LENGTH.value,
  }
}

const pixelToGrid = (pixelX: number, pixelY: number, piece?: Piece): BoardPosition => {
  let gridX = Math.round((pixelX - GRID_PADDING * scale.value) / SEGMENT_LENGTH.value)
  let gridY = Math.round((pixelY - GRID_PADDING * scale.value) / SEGMENT_LENGTH.value)

  // Adjust so the cursor represents the *visual center* of the piece.
  if (piece) {
    const center = getPieceAnchor(piece)
    gridX = gridX - center.x
    gridY = gridY - center.y
  }

  return { x: Math.round(gridX), y: Math.round(gridY) }
}

// Helper function for hitbox calculation
const getPieceHitboxOffset = (piece: Piece) => {
  const segments = getPieceSegments(piece)
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity

  segments.forEach((seg) => {
    minX = Math.min(minX, seg.x)
    minY = Math.min(minY, seg.y)
    if (seg.orientation === 'horizontal') {
      maxX = Math.max(maxX, seg.x + 1)
      maxY = Math.max(maxY, seg.y)
    } else {
      maxX = Math.max(maxX, seg.x)
      maxY = Math.max(maxY, seg.y + 1)
    }
  })

  // Add small padding to make hitbox slightly larger for easier grabbing
  const padding = 0.15 // 15% of a segment on each side
  const width = (maxX - minX + padding * 2) * SEGMENT_LENGTH.value
  const height = (maxY - minY + padding * 2) * SEGMENT_LENGTH.value
  const offsetX = (minX - padding) * SEGMENT_LENGTH.value
  const offsetY = (minY - padding) * SEGMENT_LENGTH.value

  return { width, height, offsetX, offsetY }
}

// Update drag-over position based on global drag pointer
watch(
  [() => props.dragPointer, () => props.dragPointerOffset, () => props.draggedPiece],
  () => {
    if (!props.dragPointer || !props.draggedPiece || !containerRef.value) {
      if (dragOverPosition.value !== null) {
        dragOverPosition.value = null
        emit('boardHoverChange', null)
      }
      return
    }

    const rect = containerRef.value.getBoundingClientRect()
    const adjustedClientX = props.dragPointer.clientX - (props.dragPointerOffset?.x ?? 0)
    const adjustedClientY = props.dragPointer.clientY - (props.dragPointerOffset?.y ?? 0)

    const pixelX = adjustedClientX - rect.left
    const pixelY = adjustedClientY - rect.top

    if (pixelX < 0 || pixelY < 0 || pixelX > rect.width || pixelY > rect.height) {
      if (dragOverPosition.value !== null) {
        dragOverPosition.value = null
        emit('boardHoverChange', null)
      }
      return
    }

    const gridPos = pixelToGrid(pixelX, pixelY, props.draggedPiece)
    if (
      !dragOverPosition.value ||
      dragOverPosition.value.x !== gridPos.x ||
      dragOverPosition.value.y !== gridPos.y
    ) {
      dragOverPosition.value = gridPos
      emit('boardHoverChange', gridPos)
    }
  },
  { immediate: true },
)

const renderSegment = (segment: Segment, isOccupied: boolean) => {
  const id = segmentToId(segment)
  const start = gridToPixel(segment.x, segment.y)
  const thickness = SEGMENT_THICKNESS * scale.value
  const halfThickness = thickness / 2

  let points: string

  if (segment.orientation === 'horizontal') {
    const end = gridToPixel(segment.x + 1, segment.y)
    // Horizontal segment with pointed ends
    points = `
      ${start.x + halfThickness},${start.y - halfThickness}
      ${start.x},${start.y}
      ${start.x + halfThickness},${start.y + halfThickness}
      ${end.x - halfThickness},${end.y + halfThickness}
      ${end.x},${end.y}
      ${end.x - halfThickness},${end.y - halfThickness}
    `
  } else {
    const end = gridToPixel(segment.x, segment.y + 1)
    // Vertical segment with pointed ends
    points = `
      ${start.x - halfThickness},${start.y + halfThickness}
      ${start.x},${start.y}
      ${start.x + halfThickness},${start.y + halfThickness}
      ${end.x + halfThickness},${end.y - halfThickness}
      ${end.x},${end.y}
      ${end.x - halfThickness},${end.y - halfThickness}
    `
  }

  return {
    id,
    points,
    fill: isOccupied ? 'rgb(100 116 139)' : 'rgba(255, 255, 255, 0.05)',
    stroke: 'rgba(255, 255, 255, 0.1)',
  }
}

const renderPieceSegments = (
  piece: Piece,
  position: BoardPosition,
  color: string,
  opacity: number = 1,
) => {
  const segments = getPieceSegments(piece)
  const backgroundThickness = (SEGMENT_THICKNESS + 4) * scale.value
  const backgroundHalfThickness = backgroundThickness / 2
  const innerThickness = SEGMENT_THICKNESS * scale.value * 0.7
  const innerHalfThickness = innerThickness / 2
  const backgroundColor = '#0a0e1a'
  const endGap = SEGMENT_LENGTH.value * 0.15

  return segments.flatMap((seg, idx) => {
    const absoluteSeg = {
      x: position.x + seg.x,
      y: position.y + seg.y,
      orientation: seg.orientation,
    }

    const start = gridToPixel(absoluteSeg.x, absoluteSeg.y)
    let backgroundPoints: string
    let innerPoints: string

    if (absoluteSeg.orientation === 'horizontal') {
      const end = gridToPixel(absoluteSeg.x + 1, absoluteSeg.y)

      // Background (larger, dark polygon) - full length
      backgroundPoints = `
        ${start.x + backgroundHalfThickness},${start.y - backgroundHalfThickness}
        ${start.x},${start.y}
        ${start.x + backgroundHalfThickness},${start.y + backgroundHalfThickness}
        ${end.x - backgroundHalfThickness},${end.y + backgroundHalfThickness}
        ${end.x},${end.y}
        ${end.x - backgroundHalfThickness},${end.y - backgroundHalfThickness}
      `

      // Inner colored polygon (smaller and shorter) - with gaps at ends
      const innerStart = { x: start.x + endGap, y: start.y }
      const innerEnd = { x: end.x - endGap, y: end.y }
      innerPoints = `
        ${innerStart.x + innerHalfThickness},${innerStart.y - innerHalfThickness}
        ${innerStart.x},${innerStart.y}
        ${innerStart.x + innerHalfThickness},${innerStart.y + innerHalfThickness}
        ${innerEnd.x - innerHalfThickness},${innerEnd.y + innerHalfThickness}
        ${innerEnd.x},${innerEnd.y}
        ${innerEnd.x - innerHalfThickness},${innerEnd.y - innerHalfThickness}
      `
    } else {
      const end = gridToPixel(absoluteSeg.x, absoluteSeg.y + 1)

      // Background (larger, dark polygon) - full length
      backgroundPoints = `
        ${start.x - backgroundHalfThickness},${start.y + backgroundHalfThickness}
        ${start.x},${start.y}
        ${start.x + backgroundHalfThickness},${start.y + backgroundHalfThickness}
        ${end.x + backgroundHalfThickness},${end.y - backgroundHalfThickness}
        ${end.x},${end.y}
        ${end.x - backgroundHalfThickness},${end.y - backgroundHalfThickness}
      `

      // Inner colored polygon (smaller and shorter) - with gaps at ends
      const innerStart = { x: start.x, y: start.y + endGap }
      const innerEnd = { x: end.x, y: end.y - endGap }
      innerPoints = `
        ${innerStart.x - innerHalfThickness},${innerStart.y + innerHalfThickness}
        ${innerStart.x},${innerStart.y}
        ${innerStart.x + innerHalfThickness},${innerStart.y + innerHalfThickness}
        ${innerEnd.x + innerHalfThickness},${innerEnd.y - innerHalfThickness}
        ${innerEnd.x},${innerEnd.y}
        ${innerEnd.x - innerHalfThickness},${innerEnd.y - innerHalfThickness}
      `
    }

    return [
      {
        key: `${piece.id}-bg-${idx}`,
        points: backgroundPoints,
        fill: backgroundColor,
        opacity,
        type: 'background',
      },
      {
        key: `${piece.id}-seg-${idx}`,
        points: innerPoints,
        fill: color,
        opacity,
        type: 'inner',
      },
    ]
  })
}

const wouldBeValidPlacement = (piece: Piece, position: BoardPosition): boolean => {
  const segments = getPieceSegments(piece)

  for (const seg of segments) {
    const absoluteSeg = {
      x: position.x + seg.x,
      y: position.y + seg.y,
      orientation: seg.orientation,
    }

    if (absoluteSeg.orientation === 'horizontal') {
      if (absoluteSeg.x < 0 || absoluteSeg.x >= 5 || absoluteSeg.y < 0 || absoluteSeg.y > 4) {
        return false
      }
    } else {
      if (absoluteSeg.x < 0 || absoluteSeg.x > 5 || absoluteSeg.y < 0 || absoluteSeg.y >= 4) {
        return false
      }
    }

    const id = segmentToId(absoluteSeg)
    if (props.occupiedSegments.has(id)) {
      return false
    }
  }

  return true
}

const handlePointerDown = (piece: Piece, position: BoardPosition, event: PointerEvent) => {
  emit('piecePickup', piece, position)

  // Compute dragPointerOffset so the cursor represents the piece's visual centroid.
  const boardRect = containerRef.value?.getBoundingClientRect()
  if (!boardRect) {
    emit('startDragFromBoard', piece, position, event, { x: 0, y: 0 })
    return
  }

  const center = getPieceAnchor(piece)
  const absX = position.x + center.x
  const absY = position.y + center.y
  const centroidPixel = gridToPixel(absX, absY)
  const centroidClientX = boardRect.left + centroidPixel.x
  const centroidClientY = boardRect.top + centroidPixel.y
  const offset = {
    x: event.clientX - centroidClientX,
    y: event.clientY - centroidClientY,
  }

  emit('startDragFromBoard', piece, position, event, offset)
}
</script>

<template>
  <div ref="containerRef" class="flex justify-center items-center w-full h-full">
    <div
      v-if="isLoading"
      class="w-full max-w-[650px] aspect-[650/540] bg-bg-deep border-2 border-border-default shadow-inner flex items-center justify-center p-6"
    >
      <div class="w-full h-full bg-white/5 rounded-lg animate-pulse"></div>
    </div>

    <div
      v-else
      class="p-2 bg-bg-deep border-2 border-border-default relative shadow-inner w-fit max-w-[650px] mx-auto"
    >
      <div
        class="relative"
        :style="{
          width: svgWidth + 'px',
          height: svgHeight + 'px',
        }"
      >
        <svg
          :width="svgWidth"
          :height="svgHeight"
          class="absolute top-0 left-0 pointer-events-none z-10"
        >
          <!-- Board segments -->
          <polygon
            v-for="seg in boardSegments"
            :key="segmentToId(seg)"
            v-bind="renderSegment(seg, occupiedSegments.has(segmentToId(seg)))"
            stroke-width="1"
          />

          <!-- Placed pieces -->
          <g v-for="{ piece, position } in placedPieces" :key="piece.id">
            <polygon
              v-for="segmentData in renderPieceSegments(
                piece,
                position,
                PIECE_COLORS[piece.number],
                draggedPiece?.id === piece.id ? 0.3 : 1,
              )"
              :key="segmentData.key"
              :points="segmentData.points"
              :fill="segmentData.fill"
              :opacity="segmentData.opacity"
              class="transition-all duration-200"
            />
          </g>

          <!-- Show placement preview on board for visual feedback -->
          <g v-if="draggedPiece && dragOverPosition">
            <polygon
              v-for="segmentData in renderPieceSegments(
                draggedPiece,
                dragOverPosition,
                wouldBeValidPlacement(draggedPiece, dragOverPosition) ? '#10b981' : '#ef4444',
                0.4,
              )"
              :key="segmentData.key"
              :points="segmentData.points"
              :fill="segmentData.fill"
              :opacity="segmentData.opacity"
            />
          </g>
        </svg>

        <!-- Hitboxes for placed pieces -->
        <div
          v-for="{ piece, position } in placedPieces"
          :key="`drag-${piece.id}`"
          :style="{
            position: 'absolute',
            left:
              gridToPixel(position.x, position.y).x + getPieceHitboxOffset(piece).offsetX + 'px',
            top: gridToPixel(position.x, position.y).y + getPieceHitboxOffset(piece).offsetY + 'px',
            width: getPieceHitboxOffset(piece).width + 'px',
            height: getPieceHitboxOffset(piece).height + 'px',
            cursor: 'grab',
            background: 'transparent',
            zIndex: piece.number === 1 ? 20 : 10,
            pointerEvents: 'auto',
          }"
          @pointerdown="handlePointerDown(piece, position, $event)"
          :title="`Mảnh ${piece.number}`"
        />
      </div>
    </div>
  </div>
</template>
