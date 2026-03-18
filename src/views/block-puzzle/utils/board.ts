import type { BlockShape } from '../types'
import { getShapeCells } from './blocks'

export const BOARD_SIZE = 10

/**
 * Create an empty board
 */
export function createBoard(): number[][] {
  return Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(0))
}

/**
 * Check if a block can be placed at a given position
 */
export function canPlaceBlock(
  board: number[][],
  shape: BlockShape,
  startRow: number,
  startCol: number,
): boolean {
  const cells = getShapeCells(shape)

  for (const { row: r, col: c } of cells) {
    const boardRow = startRow + r
    const boardCol = startCol + c

    // Check bounds
    if (boardRow < 0 || boardRow >= BOARD_SIZE || boardCol < 0 || boardCol >= BOARD_SIZE) {
      return false
    }

    // Check collision
    if (board[boardRow]?.[boardCol] !== 0) {
      return false
    }
  }

  return true
}

/**
 * Place a block on the board, returning the new board state
 */
export function placeBlock(
  board: number[][],
  shape: BlockShape,
  startRow: number,
  startCol: number,
  blockId: number,
): number[][] {
  const newBoard = board.map((row) => [...row])
  const cells = getShapeCells(shape)

  for (const { row: r, col: c } of cells) {
    const boardRow = startRow + r
    const boardCol = startCol + c

    if (boardRow >= 0 && boardRow < BOARD_SIZE && boardCol >= 0 && boardCol < BOARD_SIZE) {
      const row = newBoard[boardRow]
      if (row) {
        row[boardCol] = blockId
      }
    }
  }

  return newBoard
}

/**
 * Find completed rows
 */
export function findCompletedRows(board: number[][]): number[] {
  const completed: number[] = []

  for (let row = 0; row < BOARD_SIZE; row++) {
    const boardRow = board[row]
    if (boardRow && boardRow.every((cell) => cell !== 0)) {
      completed.push(row)
    }
  }

  return completed
}

/**
 * Find completed columns
 */
export function findCompletedColumns(board: number[][]): number[] {
  const completed: number[] = []

  for (let col = 0; col < BOARD_SIZE; col++) {
    if (
      board.every((row) => {
        const cell = row?.[col]
        return cell !== 0 && cell !== undefined
      })
    ) {
      completed.push(col)
    }
  }

  return completed
}

/**
 * Clear rows from the board
 */
export function clearRows(board: number[][], rowsToClear: number[]): number[][] {
  const newBoard = board.map((row) => [...row])

  // Remove rows in reverse order to maintain indices
  for (let i = rowsToClear.length - 1; i >= 0; i--) {
    const rowIndex = rowsToClear[i]
    if (rowIndex !== undefined && rowIndex >= 0 && rowIndex < newBoard.length) {
      newBoard.splice(rowIndex, 1)
    }
  }

  // Fill with empty rows at the top
  while (newBoard.length < BOARD_SIZE) {
    newBoard.unshift(Array(BOARD_SIZE).fill(0))
  }

  return newBoard
}

/**
 * Clear columns from the board
 */
export function clearColumns(board: number[][], colsToClear: number[]): number[][] {
  const newBoard = board.map((row) => [...row])

  // Clear cells in the specified columns
  for (let row = 0; row < BOARD_SIZE; row++) {
    const boardRow = newBoard[row]
    if (boardRow) {
      for (const col of colsToClear) {
        boardRow[col] = 0
      }
    }
  }

  return newBoard
}

/**
 * Get the score for placing a block
 */
export function calculatePlacementScore(
  cellsCleared: number,
  rowsCleared: number[],
  colsCleared: number[],
): { points: number; hasCombo: boolean } {
  let points = 0

  // Points for placing block tiles
  points += cellsCleared * 10

  // Points for clearing lines
  const totalLinesCleared = rowsCleared.length + colsCleared.length

  if (totalLinesCleared > 0) {
    points += totalLinesCleared * 100
  }

  // Combo bonus for multiple lines cleared at once
  const hasCombo = totalLinesCleared >= 2
  if (hasCombo) {
    points += Math.pow(2, totalLinesCleared - 1) * 50
  }

  return { points, hasCombo }
}

/**
 * Check if any blocks can fit on the board
 */
export function canPlaceAnyBlock(board: number[][], shapes: BlockShape[]): boolean {
  for (const shape of shapes) {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (canPlaceBlock(board, shape, row, col)) {
          return true
        }
      }
    }
  }

  return false
}

/**
 * Get suggested placement position for preview (if any blank area)
 */
export function findFirstValidPlacement(
  board: number[][],
  shape: BlockShape,
): { row: number; col: number } | null {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (canPlaceBlock(board, shape, row, col)) {
        return { row, col }
      }
    }
  }
  return null
}
