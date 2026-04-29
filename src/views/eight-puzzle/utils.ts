import type { PuzzleSize, TileValue } from './types'

export function createSolvedBoard(size: PuzzleSize): TileValue[] {
  const total = size * size
  return Array.from({ length: total }, (_, index) => {
    if (index === total - 1) return null
    return index + 1
  })
}

export function getEmptyIndex(board: TileValue[]): number {
  return board.findIndex((tile) => tile === null)
}

export function getRow(index: number, size: PuzzleSize): number {
  return Math.floor(index / size)
}

export function getCol(index: number, size: PuzzleSize): number {
  return index % size
}

export function isAdjacent(a: number, b: number, size: PuzzleSize): boolean {
  const rowDiff = Math.abs(getRow(a, size) - getRow(b, size))
  const colDiff = Math.abs(getCol(a, size) - getCol(b, size))
  return rowDiff + colDiff === 1
}

export function canMoveTile(board: TileValue[], tileIndex: number, size: PuzzleSize): boolean {
  return isAdjacent(tileIndex, getEmptyIndex(board), size)
}

export function getMoveDirection(
  board: TileValue[],
  tileIndex: number,
  size: PuzzleSize,
): { axis: 'x' | 'y'; sign: -1 | 1 } | null {
  const emptyIndex = getEmptyIndex(board)
  if (!isAdjacent(tileIndex, emptyIndex, size)) return null

  const tileRow = getRow(tileIndex, size)
  const tileCol = getCol(tileIndex, size)
  const emptyRow = getRow(emptyIndex, size)
  const emptyCol = getCol(emptyIndex, size)

  if (tileRow === emptyRow) {
    return { axis: 'x', sign: emptyCol > tileCol ? 1 : -1 }
  }

  return { axis: 'y', sign: emptyRow > tileRow ? 1 : -1 }
}

export function moveTile(board: TileValue[], tileIndex: number, size: PuzzleSize): TileValue[] {
  const emptyIndex = getEmptyIndex(board)
  if (!isAdjacent(tileIndex, emptyIndex, size)) return board

  const next = [...board]
  const tile = next[tileIndex]
  if (tile === undefined) return board
  next[tileIndex] = null
  next[emptyIndex] = tile
  return next
}

export function isSolved(board: TileValue[]): boolean {
  const solved = createSolvedBoard(Math.sqrt(board.length) as PuzzleSize)
  return board.every((tile, index) => tile === solved[index])
}

export function shuffleBoard(size: PuzzleSize, steps = 120): TileValue[] {
  let board = createSolvedBoard(size)
  let previousEmpty = -1

  for (let i = 0; i < steps; i++) {
    const emptyIndex = getEmptyIndex(board)
    const candidates = board
      .map((_, index) => index)
      .filter((index) => index !== previousEmpty && isAdjacent(index, emptyIndex, size))

    const randomIndex = Math.floor(Math.random() * candidates.length)
    const tileIndex = candidates[randomIndex]

    if (tileIndex == null) continue

    previousEmpty = emptyIndex
    board = moveTile(board, tileIndex, size)
  }

  return isSolved(board) ? shuffleBoard(size, steps + 5) : board
}

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}
