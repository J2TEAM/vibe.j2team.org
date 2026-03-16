import { ref, computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import type { Block } from '../types'
import {
  createBoard,
  canPlaceBlock,
  placeBlock,
  findCompletedRows,
  findCompletedColumns,
  clearRows,
  clearColumns,
  calculatePlacementScore,
  canPlaceAnyBlock,
} from '../utils/board'
import {
  getRandomBlockShape,
  getRandomBlockColor,
  countShapeCells,
  getShapeCells,
} from '../utils/blocks'
import { useAudio } from './useAudio'

let nextBlockId = 1

export function useGameEngine() {
  const board = ref<number[][]>(createBoard())
  const score = ref(0)
  const isGameOver = ref(false)
  const blocks = ref<Block[]>([])
  const clearedLines = ref(0)
  const combo = ref(0)
  const highScore = useLocalStorage('block-puzzle-high-score', 0)
  const { playBlockPlace, playLineClear, playCombo, playGameOver } = useAudio()

  // Animation state
  const clearingRows = ref<Set<number>>(new Set())
  const clearingCols = ref<Set<number>>(new Set())
  const lastPlacedBlockId = ref<number | null>(null)

  const canExit = computed(() => {
    if (isGameOver.value) return true
    // Can exit if none of the current blocks can be placed
    return !canPlaceAnyBlock(
      board.value,
      blocks.value.map((b) => b.shape),
    )
  })

  /**
   * Generate new blocks
   */
  function generateBlocks(): Block[] {
    const newBlocks: Block[] = []
    for (let i = 0; i < 3; i++) {
      newBlocks.push({
        id: `block-${nextBlockId++}`,
        shape: getRandomBlockShape(),
        color: getRandomBlockColor(),
      })
    }
    return newBlocks
  }

  /**
   * Initialize the game
   */
  function startGame() {
    board.value = createBoard()
    score.value = 0
    isGameOver.value = false
    blocks.value = generateBlocks()
    clearedLines.value = 0
    combo.value = 0
    clearingRows.value.clear()
    clearingCols.value.clear()
    lastPlacedBlockId.value = null
  }

  /**
   * Place a block on the board
   */
  function tryPlaceBlock(
    blockIndex: number,
    row: number,
    col: number,
  ): { success: boolean; pointsEarned: number } {
    const block = blocks.value[blockIndex]
    if (!block) return { success: false, pointsEarned: 0 }

    // Validate placement
    if (!canPlaceBlock(board.value, block.shape, row, col)) {
      return { success: false, pointsEarned: 0 }
    }

    // Get the number of cells being placed
    const cellCount = countShapeCells(block.shape)

    // Place the block
    const blockId = nextBlockId
    nextBlockId++
    board.value = placeBlock(board.value, block.shape, row, col, blockId)
    lastPlacedBlockId.value = blockId

    // Check for completed lines
    const completedRows = findCompletedRows(board.value)
    const completedCols = findCompletedColumns(board.value)

    // Calculate score
    const { points, hasCombo } = calculatePlacementScore(cellCount, completedRows, completedCols)

    score.value += points
    if (score.value > highScore.value) {
      highScore.value = score.value
    }

    // Play sound
    playBlockPlace()

    // Clear lines if any
    if (completedRows.length > 0 || completedCols.length > 0) {
      clearingRows.value = new Set(completedRows)
      clearingCols.value = new Set(completedCols)
      clearedLines.value += completedRows.length + completedCols.length

      // Schedule the actual clear after animation
      setTimeout(() => {
        board.value = clearRows(board.value, completedRows)
        board.value = clearColumns(board.value, completedCols)
        clearingRows.value.clear()
        clearingCols.value.clear()

        playLineClear()
        if (hasCombo && completedRows.length + completedCols.length >= 2) {
          playCombo()
        }
      }, 300)
    }

    // Remove the placed block from available blocks
    blocks.value.splice(blockIndex, 1)

    // Generate new blocks if all are used
    if (blocks.value.length === 0) {
      blocks.value = generateBlocks()

      // Check for game over
      if (
        !canPlaceAnyBlock(
          board.value,
          blocks.value.map((b) => b.shape),
        )
      ) {
        isGameOver.value = true
        playGameOver()
      }
    } else {
      // Check if any remaining blocks can fit
      if (
        !canPlaceAnyBlock(
          board.value,
          blocks.value.map((b) => b.shape),
        )
      ) {
        isGameOver.value = true
        playGameOver()
      }
    }

    return { success: true, pointsEarned: points }
  }

  /**
   * Restart the game
   */
  function restart() {
    startGame()
  }

  /**
   * Check if a block can be placed at a position (for preview)
   */
  function canPlace(blockIndex: number, row: number, col: number): boolean {
    const block = blocks.value[blockIndex]
    if (!block) return false
    return canPlaceBlock(board.value, block.shape, row, col)
  }

  /**
   * Get block shape cells for rendering
   */
  function getBlockCells(blockIndex: number): Array<{ row: number; col: number }> {
    const block = blocks.value[blockIndex]
    if (!block) return []
    return getShapeCells(block.shape)
  }

  // Initialize on creation
  startGame()

  return {
    // State
    board,
    score,
    isGameOver,
    blocks,
    clearedLines,
    combo,
    highScore,
    clearingRows,
    clearingCols,
    lastPlacedBlockId,
    canExit,

    // Methods
    startGame,
    restart,
    tryPlaceBlock,
    canPlace,
    getBlockCells,
  }
}
