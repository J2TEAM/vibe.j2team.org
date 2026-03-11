<script setup lang="ts">
import { unref, computed } from 'vue'
import type { Ref } from 'vue'
import type { Block } from '../types'
import { BOARD_SIZE } from '../utils/board'
import { getShapeCells } from '../utils/blocks'

interface Props {
  blocks: Block[] | Ref<Block[]>
  canPlaceBlock: (blockIndex: number, row: number, col: number) => boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'drag-start': [blockIndex: number]
  'drag-end': []
}>()

const blocks = computed(() => unref(props.blocks))

function handleDragStart(e: DragEvent, blockIndex: number) {
  e.dataTransfer!.effectAllowed = 'move'
  e.dataTransfer!.setData('blockIndex', String(blockIndex))
  emit('drag-start', blockIndex)
}

function handleDragEnd() {
  emit('drag-end')
}

// Check if a block can be placed somewhere on the board
function canBlockBePlaced(blockIndex: number): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (props.canPlaceBlock(blockIndex, row, col)) {
        return true
      }
    }
  }
  return false
}

function getBlockCells(blockIndex: number) {
  const block = blocks.value[blockIndex]
  if (!block) return []
  return getShapeCells(block.shape)
}
</script>

<template>
  <div class="block-tray">
    <div class="tray-title">
      <span class="text-accent-coral font-display text-xs tracking-widest">//</span>
      <span class="font-display text-sm font-medium">Blocks</span>
    </div>
    <div class="blocks-container">
      <div
        v-for="(block, index) in blocks"
        :key="block.id"
        class="block-item"
        :class="{ 'opacity-40': !canBlockBePlaced(index) }"
        :draggable="canBlockBePlaced(index)"
        @dragstart="handleDragStart($event, index)"
        @dragend="handleDragEnd"
      >
        <div class="block-preview">
          <svg viewBox="0 0 60 60" class="block-svg">
            <g v-for="cell of getBlockCells(index)" :key="`${cell.row}-${cell.col}`">
              <rect
                :x="cell.col * 15"
                :y="cell.row * 15"
                width="14"
                height="14"
                :fill="block.color"
                rx="2"
              />
            </g>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="css">
.block-tray {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #162232;
  border: 1px solid #253549;
}

.tray-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f0ede6;
  font-weight: 500;
}

.blocks-container {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.block-item {
  cursor: grab;
  padding: 10px;
  background: #1e2f42;
  border: 2px solid #253549;
  transition: all 0.2s ease;
  user-select: none;
  min-height: 88px;
}

.block-item:active {
  cursor: grabbing;
}

.block-item:hover:not(.opacity-40) {
  border-color: #ff6b4a;
  transform: translateY(-2px);
  background: #243a52;
}

.block-preview {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.block-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

@media (max-width: 480px) {
  .block-tray {
    padding: 12px 10px;
  }

  .blocks-container {
    gap: 8px;
  }

  .block-item {
    min-height: 74px;
    padding: 8px;
  }
}
</style>
