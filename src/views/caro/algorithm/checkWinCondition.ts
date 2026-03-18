import type { Direction, IGameState, IPosition } from '@/views/caro/types'
import { PlayerEnum } from '@/views/caro/types'

const DIRECTIONS: Direction[] = [
  [0, 1], // horizontal
  [1, 0], // vertical
  [1, 1], // diagonal \
  [1, -1], // diagonal /
]

export function checkWinCondition(
  gameState: IGameState,
  row: number,
  col: number,
  player: PlayerEnum,
): { hasWon: boolean; winningLine?: IPosition[] } {
  const { board, winCondition } = gameState
  const firstRow = board[0]
  const colCount = firstRow?.length ?? 0

  for (const [dx, dy] of DIRECTIONS) {
    const line: IPosition[] = [{ row, col }]

    // Check in positive direction
    let newRow = row + dx
    let newCol = col + dy
    while (
      newRow >= 0 &&
      newRow < board.length &&
      newCol >= 0 &&
      newCol < colCount &&
      board[newRow]?.[newCol] === player
    ) {
      line.push({ row: newRow, col: newCol })
      newRow += dx
      newCol += dy
    }

    // Check in negative direction
    newRow = row - dx
    newCol = col - dy
    while (
      newRow >= 0 &&
      newRow < board.length &&
      newCol >= 0 &&
      newCol < colCount &&
      board[newRow]?.[newCol] === player
    ) {
      line.unshift({ row: newRow, col: newCol })
      newRow -= dx
      newCol -= dy
    }

    if (line.length >= winCondition) {
      return { hasWon: true, winningLine: line }
    }
  }

  return { hasWon: false }
}
