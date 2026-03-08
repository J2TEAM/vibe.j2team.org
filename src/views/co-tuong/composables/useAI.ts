import { ref, type Ref } from 'vue'
import type { Board, PieceColor } from '../types'
import { PIECE_VALUE, CENTER_BONUS } from '../constants'
import { cloneBoard, getLegalMoves, isInCheck, isCheckmate } from './useGameEngine'

function evaluateBoard(b: Board, forColor: PieceColor): number {
  let score = 0
  const enemy = forColor === 'red' ? 'black' : 'red'
  for (let r = 0; r < 10; r++)
    for (let c = 0; c < 9; c++) {
      const p = b[r]?.[c]
      if (!p) continue
      const base = PIECE_VALUE[p.type]! + (CENTER_BONUS[r]?.[c] ?? 0)
      let bonus = 0
      if (p.type === 'P') {
        const crossed = p.color === 'red' ? r <= 4 : r >= 5
        if (crossed) bonus += 15
      }
      if (p.type === 'R') bonus += 5
      if (p.type === 'H' && c >= 2 && c <= 6 && r >= 2 && r <= 7) bonus += 5
      if (p.color === forColor) score += base + bonus
      else score -= base + bonus
    }
  if (isInCheck(b, enemy)) score += 30
  if (isInCheck(b, forColor)) score -= 30
  return score
}

function getAllMoves(
  b: Board,
  color: PieceColor,
): { fr: number; fc: number; tr: number; tc: number }[] {
  const moves: { fr: number; fc: number; tr: number; tc: number }[] = []
  for (let r = 0; r < 10; r++)
    for (let c = 0; c < 9; c++) {
      if (b[r]?.[c]?.color === color) {
        for (const [tr, tc] of getLegalMoves(b, r, c)) moves.push({ fr: r, fc: c, tr, tc })
      }
    }
  return moves
}

function minimax(
  b: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  aiCol: PieceColor,
): number {
  const enemy = aiCol === 'red' ? 'black' : 'red'
  const currentColor = maximizing ? aiCol : enemy

  if (depth === 0) return evaluateBoard(b, aiCol)
  if (isCheckmate(b, currentColor)) return maximizing ? -99999 + (3 - depth) : 99999 - (3 - depth)

  const moves = getAllMoves(b, currentColor)
  if (moves.length === 0) return maximizing ? -99999 : 99999

  moves.sort((a, x) => {
    const aCap = b[a.tr]?.[a.tc] ? 1 : 0
    const xCap = b[x.tr]?.[x.tc] ? 1 : 0
    return xCap - aCap
  })

  if (maximizing) {
    let best = -Infinity
    for (const m of moves) {
      const nb = cloneBoard(b)
      nb[m.tr]![m.tc] = nb[m.fr]![m.fc] ?? null
      nb[m.fr]![m.fc] = null
      const val = minimax(nb, depth - 1, alpha, beta, false, aiCol)
      best = Math.max(best, val)
      alpha = Math.max(alpha, val)
      if (beta <= alpha) break
    }
    return best
  } else {
    let best = Infinity
    for (const m of moves) {
      const nb = cloneBoard(b)
      nb[m.tr]![m.tc] = nb[m.fr]![m.fc] ?? null
      nb[m.fr]![m.fc] = null
      const val = minimax(nb, depth - 1, alpha, beta, true, aiCol)
      best = Math.min(best, val)
      beta = Math.min(beta, val)
      if (beta <= alpha) break
    }
    return best
  }
}

function findBestMove(
  b: Board,
  aiCol: PieceColor,
): { fr: number; fc: number; tr: number; tc: number } | null {
  const moves = getAllMoves(b, aiCol)
  if (moves.length === 0) return null
  let bestScore = -Infinity
  let bestMove = moves[0]!
  const depth = 3

  for (const m of moves) {
    const nb = cloneBoard(b)
    nb[m.tr]![m.tc] = nb[m.fr]![m.fc] ?? null
    nb[m.fr]![m.fc] = null
    const score = minimax(nb, depth - 1, -Infinity, Infinity, false, aiCol)
    if (score > bestScore) {
      bestScore = score
      bestMove = m
    }
  }
  return bestMove
}

export function useAI(
  board: Ref<Board>,
  gameOver: Ref<boolean>,
  turn: Ref<PieceColor>,
  makeMove: (fr: number, fc: number, tr: number, tc: number) => void,
) {
  const aiThinking = ref(false)
  const aiColor = ref<PieceColor>('black')

  function triggerAiMove() {
    if (gameOver.value || turn.value !== aiColor.value) return
    aiThinking.value = true
    setTimeout(() => {
      const best = findBestMove(board.value, aiColor.value)
      if (best) makeMove(best.fr, best.fc, best.tr, best.tc)
      aiThinking.value = false
    }, 300)
  }

  return { aiThinking, aiColor, triggerAiMove }
}
