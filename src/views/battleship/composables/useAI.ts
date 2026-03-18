import type { Cell } from '../utils/board'
import { SIZE } from '../utils/board'
import type { Difficulty } from '../types/game'

type Pos = [number, number]

export function useAI(getDifficulty: () => Difficulty = () => 'hard') {
  // =========================
  // 🎯 STATE
  // =========================

  const targets: Pos[] = []

  const playerHeat = Array.from({ length: SIZE }, () => Array(SIZE).fill(0))

  const remainingShips = [
    { name: 'Carrier', size: 5 },
    { name: 'Cruiser', size: 3 },
    { name: 'Destroyer', size: 2 },
    { name: 'L', size: 4 },
    { name: 'T', size: 4 },
  ]

  // =========================
  // 🧩 UTILS
  // =========================

  function isValid(r: number, c: number) {
    return r >= 0 && r < SIZE && c >= 0 && c < SIZE
  }

  function random(board: Cell[][]): Pos | null {
    const list: Pos[] = []
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = board[r]?.[c]
        if (cell && !cell.hit) list.push([r, c])
      }
    }
    return list[Math.floor(Math.random() * list.length)] ?? null
  }

  // =========================
  // 🎯 TARGET MODE
  // =========================

  function addTargets(r: number, c: number, board: Cell[][]) {
    const dirs: Pos[] = [
      [r + 1, c],
      [r - 1, c],
      [r, c + 1],
      [r, c - 1],
    ]

    for (const [nr, nc] of dirs) {
      const cell = board[nr]?.[nc]
      if (isValid(nr, nc) && cell && !cell.hit) {
        targets.push([nr, nc])
      }
    }
  }

  // =========================
  // 🧠 ORIENTATION INFERENCE
  // =========================

  function getOrientationTargets(board: Cell[][]): Pos[] {
    const hits: Pos[] = []

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = board[r]?.[c]
        if (cell?.hit && cell?.ship) {
          hits.push([r, c])
        }
      }
    }

    if (hits.length < 2) return []

    const a = hits[0]!
    const b = hits[1]!

    // horizontal
    if (a[0] === b[0]) {
      const r = a[0]
      const cols = hits.map((h) => h[1])
      const min = Math.min(...cols)
      const max = Math.max(...cols)

      return [
        [r, min - 1],
        [r, max + 1],
      ]
    }

    // vertical
    if (a[1] === b[1]) {
      const c = a[1]
      const rows = hits.map((h) => h[0])
      const min = Math.min(...rows)
      const max = Math.max(...rows)

      return [
        [min - 1, c],
        [max + 1, c],
      ]
    }

    return []
  }

  // =========================
  // 💀 DETECT SHIP SUNK
  // =========================

  function getConnectedHits(r: number, c: number, board: Cell[][]): Pos[] {
    const visited = new Set<string>()
    const stack: Pos[] = [[r, c]]
    const result: Pos[] = []

    while (stack.length) {
      const [cr, cc] = stack.pop()!
      const key = `${cr},${cc}`

      if (visited.has(key)) continue
      visited.add(key)

      const cell = board[cr]?.[cc]
      if (!cell?.ship) continue

      if (!cell.hit) {
        return [] // chưa chết
      }

      result.push([cr, cc])

      for (const [nr, nc] of [
        [cr + 1, cc],
        [cr - 1, cc],
        [cr, cc + 1],
        [cr, cc - 1],
      ] as Pos[]) {
        if (isValid(nr, nc)) {
          stack.push([nr, nc])
        }
      }
    }

    return result
  }

  // =========================
  // 🔥 PROBABILITY
  // =========================

  function probability(board: Cell[][]): Pos | null {
    const heat = Array.from({ length: SIZE }, () => Array(SIZE).fill(0))

    const ships = remainingShips.map((s) => s.size)

    for (const size of ships) {
      // horizontal
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c <= SIZE - size; c++) {
          let valid = true
          for (let k = 0; k < size; k++) {
            const cell = board[r]?.[c + k]
            if (cell?.hit && !cell?.ship) {
              valid = false
              break
            }
          }
          if (!valid) continue
          const heatRow = heat[r]
          if (!heatRow) continue
          for (let k = 0; k < size; k++) {
            const cell = board[r]?.[c + k]
            if (cell && !cell.hit) {
              heatRow[c + k] = (heatRow[c + k] ?? 0) + 1
            }
          }
        }
      }

      // vertical
      for (let c = 0; c < SIZE; c++) {
        for (let r = 0; r <= SIZE - size; r++) {
          let valid = true
          for (let k = 0; k < size; k++) {
            const cell = board[r + k]?.[c]
            if (cell?.hit && !cell?.ship) {
              valid = false
              break
            }
          }
          if (!valid) continue
          for (let k = 0; k < size; k++) {
            const heatRow = heat[r + k]
            const cell = board[r + k]?.[c]
            if (heatRow && cell && !cell.hit) {
              heatRow[c] = (heatRow[c] ?? 0) + 1
            }
          }
        }
      }
    }

    let best: Pos | null = null
    let max = -1

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = board[r]?.[c]
        if (cell?.hit) continue
        const h = heat[r]?.[c] ?? 0
        const ph = playerHeat[r]?.[c] ?? 0
        const score = h + ph * 0.3
        if (score > max) {
          max = score
          best = [r, c]
        }
      }
    }

    return best
  }

  // =========================
  // 🎲 MONTE CARLO
  // =========================

  function monteCarlo(board: Cell[][]): Pos | null {
    const score = Array.from({ length: SIZE }, () => Array(SIZE).fill(0))

    const simCount = 60

    for (let i = 0; i < simCount; i++) {
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          const cell = board[r]?.[c]
          const scoreRow = score[r]
          if (cell && !cell.hit && scoreRow) {
            scoreRow[c] = (scoreRow[c] ?? 0) + Math.random()
          }
        }
      }
    }

    let best: Pos | null = null
    let max = -1

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = board[r]?.[c]
        if (cell?.hit) continue
        const s = score[r]?.[c] ?? 0
        if (s > max) {
          max = s
          best = [r, c]
        }
      }
    }

    return best
  }

  // =========================
  // 🤖 NEXT MOVE
  // =========================

  function next(board: Cell[][]): Pos | null {
    // 🎯 target queue
    while (targets.length > 0) {
      const pos = targets.pop()
      if (!pos) break
      const [r, c] = pos
      const cell = board[r]?.[c]
      if (cell && !cell.hit) return [r, c]
    }

    // 🧠 orientation
    const orient = getOrientationTargets(board)
    for (const [r, c] of orient) {
      const cell = board[r]?.[c]
      if (isValid(r, c) && cell && !cell.hit) {
        return [r, c]
      }
    }

    const diff = getDifficulty()

    if (diff === 'easy') {
      return random(board)
    }

    if (diff === 'medium') {
      return probability(board)
    }

    // HARD
    const p = probability(board)
    const mc = monteCarlo(board)

    return Math.random() < 0.7 ? p : mc
  }

  // =========================
  // 📊 PROCESS
  // =========================

  function process(r: number, c: number, hit: boolean, board: Cell[][]) {
    // learning
    const phRow = playerHeat[r]
    if (phRow) {
      phRow[c] = (phRow[c] ?? 0) + (hit ? 2 : -0.2)
    }

    if (!hit) return

    addTargets(r, c, board)

    // check sunk
    const shipCells = getConnectedHits(r, c, board)

    if (shipCells.length > 0) {
      const size = shipCells.length

      const index = remainingShips.findIndex((s) => s.size === size)

      if (index !== -1) {
        remainingShips.splice(index, 1)
      }

      // clear targets (ship done)
      targets.length = 0
    }
  }

  return { next, process }
}
