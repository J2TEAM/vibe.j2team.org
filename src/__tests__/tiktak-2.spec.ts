import { describe, it, expect } from 'vitest'
import { checkWinner, getAvailableMoves, getBestMove } from '@/views/tiktak-2/utils/ai'
import type { CellValue } from '@/views/tiktak-2/types'

function board(template: string, cols: number): CellValue[] {
  return template
    .trim()
    .split('\n')
    .flatMap((row) =>
      row
        .trim()
        .split(/\s+/)
        .slice(0, cols)
        .map((c) => (c === '.' ? null : (c as CellValue))),
    )
}

describe('checkWinner', () => {
  it('detects horizontal win', () => {
    const b = board(
      `X X X
       . . .
       . . .`,
      3,
    )
    expect(checkWinner(b, 3, 3)).toBe('X')
  })

  it('detects vertical win', () => {
    const b = board(
      `O . .
       O . .
       O . .`,
      3,
    )
    expect(checkWinner(b, 3, 3)).toBe('O')
  })

  it('detects diagonal ↘ win', () => {
    const b = board(
      `X . .
       . X .
       . . X`,
      3,
    )
    expect(checkWinner(b, 3, 3)).toBe('X')
  })

  it('detects diagonal ↙ win', () => {
    const b = board(
      `. . O
       . O .
       O . .`,
      3,
    )
    expect(checkWinner(b, 3, 3)).toBe('O')
  })

  it('detects draw', () => {
    const b = board(
      `X O X
       X O O
       O X X`,
      3,
    )
    expect(checkWinner(b, 3, 3)).toBe('draw')
  })

  it('returns null for in-progress game', () => {
    const b = board(
      `X . .
       . O .
       . . .`,
      3,
    )
    expect(checkWinner(b, 3, 3)).toBeNull()
  })

  it('uses win length 4 for 5x5 board', () => {
    // 4 in a row on 5x5 — should win
    const b: CellValue[] = Array(25).fill(null)
    b[0] = 'X'
    b[1] = 'X'
    b[2] = 'X'
    b[3] = 'X'
    expect(checkWinner(b, 5, 5)).toBe('X')

    // 3 in a row on 5x5 — should NOT win
    const b2: CellValue[] = Array(25).fill(null)
    b2[0] = 'X'
    b2[1] = 'X'
    b2[2] = 'X'
    expect(checkWinner(b2, 5, 5)).toBeNull()
  })
})

describe('getAvailableMoves', () => {
  it('returns all empty indices', () => {
    const b = board(
      `X . O
       . . .
       . . X`,
      3,
    )
    expect(getAvailableMoves(b)).toEqual([1, 3, 4, 5, 6, 7])
  })

  it('returns empty array for full board', () => {
    const b = board(
      `X O X
       X O O
       O X X`,
      3,
    )
    expect(getAvailableMoves(b)).toEqual([])
  })
})

describe('getBestMove', () => {
  it('returns a valid move on empty board', () => {
    const b: CellValue[] = Array(9).fill(null)
    const move = getBestMove(b, 3, 3, 'hard')
    expect(move).not.toBeNull()
    expect(move).toBeGreaterThanOrEqual(0)
    expect(move).toBeLessThan(9)
  })

  it('takes the winning move', () => {
    // O can win by placing at index 2
    const b = board(
      `O O .
       X X .
       . . .`,
      3,
    )
    expect(getBestMove(b, 3, 3, 'hard')).toBe(2)
  })

  it('blocks player winning move', () => {
    // X is about to win at index 2 — AI must block
    const b = board(
      `X X .
       O . .
       . . .`,
      3,
    )
    const move = getBestMove(b, 3, 3, 'hard')
    expect(move).toBe(2)
  })

  it('returns null on full board', () => {
    const b = board(
      `X O X
       X O O
       O X X`,
      3,
    )
    expect(getBestMove(b, 3, 3)).toBeNull()
  })

  it('uses heuristic for large boards (>25 cells)', () => {
    const b: CellValue[] = Array(36).fill(null)
    const move = getBestMove(b, 6, 6, 'hard')
    expect(move).not.toBeNull()
    // Heuristic prefers center
    expect(move).toBe(21) // floor(6/2)*6 + floor(6/2) = 3*6+3 = 21
  })
})
