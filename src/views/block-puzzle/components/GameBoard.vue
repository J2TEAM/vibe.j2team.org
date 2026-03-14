<script setup lang="ts">
import type { Block } from '../types'
import { BOARD_SIZE } from '../utils/board'

interface Props {
  board: number[][]
  blocks: Block[]
  clearingRows: Set<number>
  clearingCols: Set<number>
  lastPlacedBlockId: number | null
  draggingBlockIndex: number | null
  dragPreviewPosition: { row: number; col: number } | null
  canPreviewPlace: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'place-block': [blockIndex: number, row: number, col: number]
  'update-preview': [row: number, col: number]
}>()

// Get color for a cell based on its value
function getCellColor(cellValue: number): string {
  if (cellValue === 0) return ''

  // Find the block that owns this cell
  let blockIndex = cellValue - 1

  // Clamp to available blocks (in case of overflow)
  if (blockIndex >= props.blocks.length) {
    blockIndex = blockIndex % props.blocks.length
  }

  return props.blocks[blockIndex]?.color || '#606060'
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
}

function handleCellDragEnter(row: number, col: number) {
  if (props.draggingBlockIndex !== null) {
    emit('update-preview', row, col)
  }
}

function handleBoardDrop(e: DragEvent) {
  e.preventDefault()

  if (!props.dragPreviewPosition) {
    return
  }

  const transferIndex = Number(e.dataTransfer?.getData('blockIndex'))
  const blockIndex = Number.isNaN(transferIndex) ? props.draggingBlockIndex : transferIndex

  if (blockIndex === null || blockIndex < 0) {
    return
  }

  emit('place-block', blockIndex, props.dragPreviewPosition.row, props.dragPreviewPosition.col)
}

function isPreviewCell(row: number, col: number): boolean {
  if (props.draggingBlockIndex === null || !props.dragPreviewPosition) {
    return false
  }

  const block = props.blocks[props.draggingBlockIndex]
  if (!block) {
    return false
  }

  const localRow = row - props.dragPreviewPosition.row
  const localCol = col - props.dragPreviewPosition.col

  if (localRow < 0 || localCol < 0) {
    return false
  }

  return block.shape[localRow]?.[localCol] === 1
}
</script>

<template>
  <div class="game-board">
    <div
      class="board-grid"
      :class="{ 'is-dragging': draggingBlockIndex !== null }"
      :style="{
        display: 'grid',
        gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
        gap: '2px',
        padding: '8px',
        backgroundColor: '#0F1923',
        border: '2px solid #253549',
      }"
      @dragover="handleDragOver"
      @drop="handleBoardDrop"
    >
      <div
        v-for="row in BOARD_SIZE"
        :key="`row-${row}`"
        class="board-row"
        :style="{ display: 'contents' }"
      >
        <div
          v-for="col in BOARD_SIZE"
          :key="`cell-${row}-${col}`"
          class="board-cell"
          :class="{
            'is-clearing': clearingRows.has(row - 1) || clearingCols.has(col - 1),
            'is-preview-valid': isPreviewCell(row - 1, col - 1) && canPreviewPlace,
            'is-preview-invalid': isPreviewCell(row - 1, col - 1) && !canPreviewPlace,
          }"
          :style="{
            aspectRatio: '1',
            backgroundColor:
              board[row - 1]?.[col - 1] !== 0
                ? getCellColor(board[row - 1]?.[col - 1] || 0)
                : '#162232',
            border: '1px solid #253549',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            opacity: clearingRows.has(row - 1) || clearingCols.has(col - 1) ? 0.5 : 1,
            transform: isPreviewCell(row - 1, col - 1) ? 'scale(0.95)' : 'scale(1)',
          }"
          @dragover.prevent="handleDragOver"
          @dragenter.prevent="handleCellDragEnter(row - 1, col - 1)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="css">
.game-board {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.board-cell {
  border-radius: 2px;
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.3),
    0 1px 2px rgba(0, 0, 0, 0.2);
}

.board-grid.is-dragging {
  border-color: #38bdf8 !important;
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
}

.board-cell.is-preview-valid {
  background: linear-gradient(180deg, rgba(52, 211, 153, 0.7), rgba(16, 185, 129, 0.7)) !important;
  border-color: #34d399 !important;
}

.board-cell.is-preview-invalid {
  background: linear-gradient(
    180deg,
    rgba(248, 113, 113, 0.65),
    rgba(239, 68, 68, 0.65)
  ) !important;
  border-color: #f87171 !important;
}

.board-cell.is-clearing {
  animation: cellClear 0.3s ease-out forwards;
}

@keyframes cellClear {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 0;
    transform: scale(0.8);
  }
}
</style>
