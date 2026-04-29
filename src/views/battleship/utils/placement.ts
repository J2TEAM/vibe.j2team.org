import type { Cell } from './board'

export function canPlaceShape(board: Cell[][], r: number, c: number, shape: number[][]) {
  for (let i = 0; i < shape.length; i++) {
    const row = shape[i]
    if (!row) continue
    for (let j = 0; j < row.length; j++) {
      if (!row[j]) continue

      const rr = r + i
      const cc = c + j

      if (rr < 0 || rr >= board.length || cc < 0 || cc >= (board[0]?.length ?? 0)) {
        return false
      }

      const cell = board[rr]?.[cc]
      if (cell?.ship) return false
    }
  }

  return true
}

export function placeShape(board: Cell[][], r: number, c: number, shape: number[][]) {
  for (let i = 0; i < shape.length; i++) {
    const row = shape[i]
    if (!row) continue
    for (let j = 0; j < row.length; j++) {
      if (!row[j]) continue
      const cell = board[r + i]?.[c + j]
      if (cell) cell.ship = true
    }
  }
}

export function removeShape(board: Cell[][], r: number, c: number, shape: number[][]) {
  for (let i = 0; i < shape.length; i++) {
    const row = shape[i]
    if (!row) continue
    for (let j = 0; j < row.length; j++) {
      if (!row[j]) continue
      const cell = board[r + i]?.[c + j]
      if (cell) cell.ship = false
    }
  }
}
