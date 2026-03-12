import type { CellValue, Player } from '../types'

const SCORES = { X: -10, O: 10, draw: 0 } as const

function getWinLength(rows: number, cols: number): number {
  return Math.min(rows, cols) >= 5 ? 4 : 3
}

export function checkWinner(
  squares: CellValue[],
  rows: number,
  cols: number,
): Player | 'draw' | null {
  const winLength = getWinLength(rows, cols)

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const start = row * cols + col
      const first = squares[start]
      if (!first) continue

      // Horizontal
      if (col <= cols - winLength) {
        let win = true
        for (let i = 1; i < winLength; i++) {
          if (squares[start + i] !== first) {
            win = false
            break
          }
        }
        if (win) return first
      }

      // Vertical
      if (row <= rows - winLength) {
        let win = true
        for (let i = 1; i < winLength; i++) {
          if (squares[start + i * cols] !== first) {
            win = false
            break
          }
        }
        if (win) return first
      }

      // Diagonal ↘
      if (row <= rows - winLength && col <= cols - winLength) {
        let win = true
        for (let i = 1; i < winLength; i++) {
          if (squares[start + i * (cols + 1)] !== first) {
            win = false
            break
          }
        }
        if (win) return first
      }

      // Diagonal ↙
      if (row <= rows - winLength && col >= winLength - 1) {
        let win = true
        for (let i = 1; i < winLength; i++) {
          if (squares[start + i * (cols - 1)] !== first) {
            win = false
            break
          }
        }
        if (win) return first
      }
    }
  }

  if (squares.every((s) => s !== null)) return 'draw'
  return null
}

export function getAvailableMoves(board: CellValue[]): number[] {
  const moves: number[] = []
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) moves.push(i)
  }
  return moves
}

function getMaxDepth(rows: number, cols: number, difficulty: 'easy' | 'medium' | 'hard'): number {
  const size = rows * cols
  const base = size > 16 ? 4 : 6
  if (difficulty === 'easy') return Math.max(1, base - 4)
  if (difficulty === 'medium') return Math.max(2, base - 2)
  return base
}

export function minimax(
  board: CellValue[],
  depth: number,
  isMaximizing: boolean,
  rows: number,
  cols: number,
  maxDepth: number,
  alpha: number = -Infinity,
  beta: number = Infinity,
): number {
  const winner = checkWinner(board, rows, cols)

  if (winner === 'O') return SCORES.O - depth
  if (winner === 'X') return SCORES.X + depth
  if (winner === 'draw') return SCORES.draw

  if (depth >= maxDepth) return 0

  const moves = getAvailableMoves(board)

  if (isMaximizing) {
    let best = -Infinity
    for (const move of moves) {
      board[move] = 'O'
      const score = minimax(board, depth + 1, false, rows, cols, maxDepth, alpha, beta)
      board[move] = null
      best = Math.max(best, score)
      alpha = Math.max(alpha, score)
      if (beta <= alpha) break
    }
    return best
  } else {
    let best = Infinity
    for (const move of moves) {
      board[move] = 'X'
      const score = minimax(board, depth + 1, true, rows, cols, maxDepth, alpha, beta)
      board[move] = null
      best = Math.min(best, score)
      beta = Math.min(beta, score)
      if (beta <= alpha) break
    }
    return best
  }
}

function getHeuristicMove(board: CellValue[], rows: number, cols: number): number {
  const center = Math.floor(rows / 2) * cols + Math.floor(cols / 2)
  if (board[center] === null) return center

  const corners = [0, cols - 1, (rows - 1) * cols, rows * cols - 1]
  for (const corner of corners) {
    if (board[corner] === null) return corner
  }

  return getAvailableMoves(board)[0]!
}

export function getBestMove(
  board: CellValue[],
  rows: number,
  cols: number,
  difficulty: 'easy' | 'medium' | 'hard' = 'hard',
): number | null {
  const moves = getAvailableMoves(board)
  if (moves.length === 0) return null

  if (rows * cols > 25) return getHeuristicMove(board, rows, cols)

  // Easy mode: 30% chance of random move
  if (difficulty === 'easy' && Math.random() < 0.3) {
    return moves[Math.floor(Math.random() * moves.length)]!
  }

  const maxDepth = getMaxDepth(rows, cols, difficulty)
  const work = [...board]
  let bestMove = moves[0]!
  let bestValue = -Infinity

  for (const move of moves) {
    work[move] = 'O'
    const value = minimax(work, 0, false, rows, cols, maxDepth)
    work[move] = null

    if (value > bestValue) {
      bestValue = value
      bestMove = move
    }
  }

  return bestMove
}
