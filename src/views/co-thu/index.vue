<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'

// ============================================================
// Types
// ============================================================

type Player = 'blue' | 'red'
type GameMode = 'pvp' | 'ai'

interface Piece {
  id: string
  player: Player
  rank: number
  name: string
  emoji: string
  row: number
  col: number
}

interface Cell {
  row: number
  col: number
}

interface GameState {
  pieces: Piece[]
  currentPlayer: Player
  selectedPiece: Piece | null
  validMoves: Cell[]
  winner: Player | null
  status: 'playing' | 'won'
}

// ============================================================
// Constants
// ============================================================

const ROWS = 9
const COLS = 7

// Special squares
const BLUE_DEN: Cell = { row: 0, col: 3 }
const RED_DEN: Cell = { row: 8, col: 3 }

const BLUE_TRAPS: Cell[] = [
  { row: 0, col: 2 },
  { row: 0, col: 4 },
  { row: 1, col: 3 },
]

const RED_TRAPS: Cell[] = [
  { row: 8, col: 2 },
  { row: 8, col: 4 },
  { row: 7, col: 3 },
]

// River: rows 3-5, cols 1-2 and rows 3-5, cols 4-5
function isRiver(row: number, col: number): boolean {
  return row >= 3 && row <= 5 && (col === 1 || col === 2 || col === 4 || col === 5)
}

function isDen(row: number, col: number, player: Player): boolean {
  if (player === 'blue') return row === BLUE_DEN.row && col === BLUE_DEN.col
  return row === RED_DEN.row && col === RED_DEN.col
}

function isEnemyDen(row: number, col: number, player: Player): boolean {
  if (player === 'blue') return row === RED_DEN.row && col === RED_DEN.col
  return row === BLUE_DEN.row && col === BLUE_DEN.col
}

function isEnemyTrap(row: number, col: number, player: Player): boolean {
  if (player === 'blue') return RED_TRAPS.some((t) => t.row === row && t.col === col)
  return BLUE_TRAPS.some((t) => t.row === row && t.col === col)
}

// Piece definitions
const ANIMAL_DEFS = [
  { rank: 8, name: 'Voi', emoji: '🐘' },
  { rank: 7, name: 'Sư tử', emoji: '🦁' },
  { rank: 6, name: 'Hổ', emoji: '🐯' },
  { rank: 5, name: 'Báo', emoji: '🐆' },
  { rank: 4, name: 'Chó', emoji: '🐕' },
  { rank: 3, name: 'Sói', emoji: '🐺' },
  { rank: 2, name: 'Mèo', emoji: '🐱' },
  { rank: 1, name: 'Chuột', emoji: '🐭' },
]

// Initial positions: [row, col]
const INITIAL_POSITIONS: { player: Player; rank: number; row: number; col: number }[] = [
  // Blue
  { player: 'blue', rank: 7, row: 0, col: 0 },
  { player: 'blue', rank: 6, row: 0, col: 6 },
  { player: 'blue', rank: 4, row: 1, col: 1 },
  { player: 'blue', rank: 2, row: 1, col: 5 },
  { player: 'blue', rank: 1, row: 2, col: 0 },
  { player: 'blue', rank: 5, row: 2, col: 2 },
  { player: 'blue', rank: 3, row: 2, col: 4 },
  { player: 'blue', rank: 8, row: 2, col: 6 },
  // Red
  { player: 'red', rank: 8, row: 6, col: 0 },
  { player: 'red', rank: 3, row: 6, col: 2 },
  { player: 'red', rank: 5, row: 6, col: 4 },
  { player: 'red', rank: 1, row: 6, col: 6 },
  { player: 'red', rank: 2, row: 7, col: 1 },
  { player: 'red', rank: 4, row: 7, col: 5 },
  { player: 'red', rank: 6, row: 8, col: 0 },
  { player: 'red', rank: 7, row: 8, col: 6 },
]

function createInitialPieces(): Piece[] {
  return INITIAL_POSITIONS.map((pos, idx) => {
    const def = ANIMAL_DEFS.find((d) => d.rank === pos.rank)!
    return {
      id: `${pos.player}-${pos.rank}-${idx}`,
      player: pos.player,
      rank: pos.rank,
      name: def.name,
      emoji: def.emoji,
      row: pos.row,
      col: pos.col,
    }
  })
}

// ============================================================
// Game Logic
// ============================================================

function getPieceAt(pieces: Piece[], row: number, col: number): Piece | undefined {
  return pieces.find((p) => p.row === row && p.col === col)
}

function effectiveRank(piece: Piece): number {
  // Rank is 0 if piece is in enemy trap
  if (isEnemyTrap(piece.row, piece.col, piece.player)) return 0
  return piece.rank
}

function canCapture(attacker: Piece, defender: Piece): boolean {
  const aRank = effectiveRank(attacker)
  const dRank = effectiveRank(defender)

  // Rat in water cannot be captured by land pieces
  if (isRiver(defender.row, defender.col)) {
    // Only another rat in water can capture it
    return attacker.rank === 1 && isRiver(attacker.row, attacker.col)
  }

  // Rat (rank 1) can capture Elephant (rank 8) on land
  if (attacker.rank === 1 && defender.rank === 8) {
    // But rat must be on land (not attacking from water to land)
    if (!isRiver(attacker.row, attacker.col)) {
      return true
    }
    // Rat in water cannot capture elephant on land
    return false
  }

  return aRank >= dRank
}

function getValidMoves(piece: Piece, pieces: Piece[]): Cell[] {
  const moves: Cell[] = []
  const directions: [number, number][] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]

  for (const [dr, dc] of directions) {
    const nr = piece.row + dr
    const nc = piece.col + dc

    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue

    // Cannot enter own den
    if (isDen(nr, nc, piece.player)) continue

    const targetPiece = getPieceAt(pieces, nr, nc)

    if (isRiver(nr, nc)) {
      // Only rat can enter river normally
      if (piece.rank === 1) {
        if (!targetPiece) {
          moves.push({ row: nr, col: nc })
        } else if (targetPiece.player !== piece.player && canCapture(piece, targetPiece)) {
          moves.push({ row: nr, col: nc })
        }
      } else if (piece.rank === 7 || piece.rank === 6) {
        // Lion and Tiger can jump over river
        // Try to jump in this direction
        const jumpMove = getRiverJump(piece, dr, dc, pieces)
        if (jumpMove) {
          moves.push(jumpMove)
        }
      }
      // Other pieces: skip river entirely (handled above via jump for lion/tiger)
      // For non-rat, non-lion, non-tiger: cannot enter river, so skip
      if (piece.rank !== 1 && piece.rank !== 7 && piece.rank !== 6) {
        continue
      }
    } else {
      // Normal land movement
      if (!targetPiece) {
        moves.push({ row: nr, col: nc })
      } else if (targetPiece.player !== piece.player && canCapture(piece, targetPiece)) {
        moves.push({ row: nr, col: nc })
      }
    }
  }

  return moves
}

function getRiverJump(piece: Piece, dr: number, dc: number, pieces: Piece[]): Cell | null {
  // Step through the river in direction dr,dc until we exit
  let r = piece.row + dr
  let c = piece.col + dc
  const ratInPath: boolean[] = []

  while (r >= 0 && r < ROWS && c >= 0 && c < COLS && isRiver(r, c)) {
    const here = getPieceAt(pieces, r, c)
    if (here && here.rank === 1) {
      ratInPath.push(true)
    }
    r += dr
    c += dc
  }

  // If we stepped out of bounds, no valid jump
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null

  // Jump is blocked if any rat is in the path
  if (ratInPath.length > 0) return null

  // Cannot land on own den
  if (isDen(r, c, piece.player)) return null

  const landingPiece = getPieceAt(pieces, r, c)
  if (!landingPiece) return { row: r, col: c }
  if (landingPiece.player !== piece.player && canCapture(piece, landingPiece)) {
    return { row: r, col: c }
  }

  return null
}

function checkWinner(
  pieces: Piece[],
  lastMove: { piece: Piece; row: number; col: number },
): Player | null {
  // Win by entering enemy den
  if (isEnemyDen(lastMove.row, lastMove.col, lastMove.piece.player)) {
    return lastMove.piece.player
  }

  // Win by capturing all enemy pieces
  const bluePieces = pieces.filter((p) => p.player === 'blue')
  const redPieces = pieces.filter((p) => p.player === 'red')

  if (bluePieces.length === 0) return 'red'
  if (redPieces.length === 0) return 'blue'

  return null
}

// ============================================================
// Game State
// ============================================================

const gameMode = ref<GameMode>('pvp')
const gameStarted = ref(false)

function createGameState(): GameState {
  return {
    pieces: createInitialPieces(),
    currentPlayer: 'blue',
    selectedPiece: null,
    validMoves: [],
    winner: null,
    status: 'playing',
  }
}

const state = ref<GameState>(createGameState())

function selectPiece(piece: Piece) {
  if (state.value.status !== 'playing') return
  if (piece.player !== state.value.currentPlayer) return
  if (gameMode.value === 'ai' && state.value.currentPlayer === 'red') return

  state.value.selectedPiece = piece
  state.value.validMoves = getValidMoves(piece, state.value.pieces)
}

function movePieceTo(row: number, col: number) {
  const sel = state.value.selectedPiece
  if (!sel) return

  const isValid = state.value.validMoves.some((m) => m.row === row && m.col === col)
  if (!isValid) return

  // Remove captured piece if any
  const captured = getPieceAt(state.value.pieces, row, col)
  if (captured) {
    state.value.pieces = state.value.pieces.filter((p) => p.id !== captured.id)
  }

  // Move piece
  const movingPiece = state.value.pieces.find((p) => p.id === sel.id)!
  movingPiece.row = row
  movingPiece.col = col

  // Check winner
  const winner = checkWinner(state.value.pieces, { piece: movingPiece, row, col })

  state.value.selectedPiece = null
  state.value.validMoves = []

  if (winner) {
    state.value.winner = winner
    state.value.status = 'won'
    return
  }

  // Switch player
  state.value.currentPlayer = state.value.currentPlayer === 'blue' ? 'red' : 'blue'

  // AI move
  if (gameMode.value === 'ai' && state.value.currentPlayer === 'red') {
    scheduleAiMove()
  }
}

function handleCellClick(row: number, col: number) {
  if (state.value.status !== 'playing') return
  if (gameMode.value === 'ai' && state.value.currentPlayer === 'red') return

  const clickedPiece = getPieceAt(state.value.pieces, row, col)

  // If a piece is already selected
  if (state.value.selectedPiece) {
    const isValidTarget = state.value.validMoves.some((m) => m.row === row && m.col === col)

    if (isValidTarget) {
      movePieceTo(row, col)
      return
    }

    // Clicked own piece: switch selection
    if (clickedPiece && clickedPiece.player === state.value.currentPlayer) {
      selectPiece(clickedPiece)
      return
    }

    // Deselect
    state.value.selectedPiece = null
    state.value.validMoves = []
    return
  }

  // No piece selected: try to select
  if (clickedPiece && clickedPiece.player === state.value.currentPlayer) {
    selectPiece(clickedPiece)
  }
}

function startGame(mode: GameMode) {
  gameMode.value = mode
  state.value = createGameState()
  gameStarted.value = true

  if (mode === 'ai' && state.value.currentPlayer === 'red') {
    scheduleAiMove()
  }
}

function newGame() {
  state.value = createGameState()
  if (gameMode.value === 'ai' && state.value.currentPlayer === 'red') {
    scheduleAiMove()
  }
}

// ============================================================
// AI Logic (Minimax depth 2)
// ============================================================

interface AiMove {
  piece: Piece
  row: number
  col: number
  score: number
}

function clonePieces(pieces: Piece[]): Piece[] {
  return pieces.map((p) => ({ ...p }))
}

function evaluateBoard(pieces: Piece[], forPlayer: Player): number {
  const enemy: Player = forPlayer === 'red' ? 'blue' : 'red'
  let score = 0

  for (const p of pieces) {
    const rankVal = p.rank * 10
    if (p.player === forPlayer) {
      score += rankVal
      // Bonus for being near enemy den
      const targetDen = forPlayer === 'red' ? BLUE_DEN : RED_DEN
      const dist = Math.abs(p.row - targetDen.row) + Math.abs(p.col - targetDen.col)
      score += (14 - dist) * 2
    } else {
      score -= rankVal
    }
  }

  // Extra weight for pieces in traps (effective rank 0, vulnerable)
  for (const p of pieces) {
    if (p.player === enemy && isEnemyTrap(p.row, p.col, p.player)) {
      score += 30
    }
  }

  return score
}

function getAllMovesForPlayer(
  pieces: Piece[],
  player: Player,
): { piece: Piece; row: number; col: number }[] {
  const result: { piece: Piece; row: number; col: number }[] = []
  for (const piece of pieces.filter((p) => p.player === player)) {
    const moves = getValidMoves(piece, pieces)
    for (const move of moves) {
      result.push({ piece, row: move.row, col: move.col })
    }
  }
  return result
}

function applyMove(pieces: Piece[], pieceId: string, row: number, col: number): Piece[] {
  let newPieces = clonePieces(pieces)
  // Remove captured piece
  const captured = newPieces.find((p) => p.row === row && p.col === col && p.id !== pieceId)
  if (captured) {
    newPieces = newPieces.filter((p) => p.id !== captured.id)
  }
  const moving = newPieces.find((p) => p.id === pieceId)!
  moving.row = row
  moving.col = col
  return newPieces
}

function minimax(
  pieces: Piece[],
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number,
): number {
  const currentPlayer: Player = isMaximizing ? 'red' : 'blue'

  // Check terminal states
  const bluePieces = pieces.filter((p) => p.player === 'blue')
  const redPieces = pieces.filter((p) => p.player === 'red')

  if (bluePieces.length === 0) return 10000
  if (redPieces.length === 0) return -10000

  // Check den entries
  for (const p of redPieces) {
    if (isEnemyDen(p.row, p.col, p.player)) return 10000
  }
  for (const p of bluePieces) {
    if (isEnemyDen(p.row, p.col, p.player)) return -10000
  }

  if (depth === 0) return evaluateBoard(pieces, 'red')

  const moves = getAllMovesForPlayer(pieces, currentPlayer)

  if (moves.length === 0) return isMaximizing ? -10000 : 10000

  if (isMaximizing) {
    let maxScore = -Infinity
    for (const move of moves) {
      const newPieces = applyMove(pieces, move.piece.id, move.row, move.col)
      const score = minimax(newPieces, depth - 1, false, alpha, beta)
      maxScore = Math.max(maxScore, score)
      alpha = Math.max(alpha, score)
      if (beta <= alpha) break
    }
    return maxScore
  } else {
    let minScore = Infinity
    for (const move of moves) {
      const newPieces = applyMove(pieces, move.piece.id, move.row, move.col)
      const score = minimax(newPieces, depth - 1, true, alpha, beta)
      minScore = Math.min(minScore, score)
      beta = Math.min(beta, score)
      if (beta <= alpha) break
    }
    return minScore
  }
}

function getBestAiMove(): AiMove | null {
  const pieces = state.value.pieces
  const moves = getAllMovesForPlayer(pieces, 'red')

  if (moves.length === 0) return null

  let bestScore = -Infinity
  let bestMove: AiMove | null = null

  for (const move of moves) {
    const newPieces = applyMove(pieces, move.piece.id, move.row, move.col)

    // Check immediate win
    const movingPiece = newPieces.find((p) => p.id === move.piece.id)!
    if (isEnemyDen(movingPiece.row, movingPiece.col, 'red')) {
      return { ...move, score: 10000 }
    }

    const score = minimax(newPieces, 2, false, -Infinity, Infinity)

    if (score > bestScore) {
      bestScore = score
      bestMove = { ...move, score }
    }
  }

  return bestMove
}

let aiTimer: ReturnType<typeof setTimeout> | null = null

function scheduleAiMove() {
  if (aiTimer) clearTimeout(aiTimer)
  aiTimer = setTimeout(() => {
    if (state.value.currentPlayer !== 'red' || state.value.status !== 'playing') return
    const best = getBestAiMove()
    if (!best) return

    // Animate: select piece first
    state.value.selectedPiece = state.value.pieces.find((p) => p.id === best.piece.id) ?? null
    state.value.validMoves = [{ row: best.row, col: best.col }]

    aiTimer = setTimeout(() => {
      movePieceTo(best.row, best.col)
    }, 400)
  }, 600)
}

onUnmounted(() => {
  if (aiTimer) clearTimeout(aiTimer)
})

// ============================================================
// Computed helpers
// ============================================================

const winnerLabel = computed(() => {
  if (!state.value.winner) return ''
  return state.value.winner === 'blue' ? 'Xanh' : 'Đỏ'
})

// ============================================================
// UI Helpers
// ============================================================

function getCellType(
  row: number,
  col: number,
): 'den-blue' | 'den-red' | 'trap-blue' | 'trap-red' | 'river' | 'land-light' | 'land-dark' {
  if (row === BLUE_DEN.row && col === BLUE_DEN.col) return 'den-blue'
  if (row === RED_DEN.row && col === RED_DEN.col) return 'den-red'
  if (BLUE_TRAPS.some((t) => t.row === row && t.col === col)) return 'trap-blue'
  if (RED_TRAPS.some((t) => t.row === row && t.col === col)) return 'trap-red'
  if (isRiver(row, col)) return 'river'
  return (row + col) % 2 === 0 ? 'land-light' : 'land-dark'
}

function isSelectedCell(row: number, col: number): boolean {
  const sel = state.value.selectedPiece
  return sel !== null && sel.row === row && sel.col === col
}

function isValidMoveCell(row: number, col: number): boolean {
  return state.value.validMoves.some((m) => m.row === row && m.col === col)
}

function getPieceAtCell(row: number, col: number): Piece | undefined {
  return state.value.pieces.find((p) => p.row === row && p.col === col)
}

const cellTypeClasses: Record<string, string> = {
  'den-blue': 'bg-accent-sky/30 border-accent-sky/50',
  'den-red': 'bg-accent-coral/30 border-accent-coral/50',
  'trap-blue': 'bg-accent-amber/20 border-accent-amber/40',
  'trap-red': 'bg-accent-amber/20 border-accent-amber/40',
  river: 'bg-sky-900/60 border-sky-700/40',
  'land-light': 'bg-bg-elevated border-border-default',
  'land-dark': 'bg-bg-surface border-border-default',
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <!-- Header -->
    <header
      class="border-b border-border-default bg-bg-surface px-4 py-3 flex items-center justify-between"
    >
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition text-sm"
      >
        <Icon icon="lucide:arrow-left" class="size-4" />
        Về trang chủ
      </RouterLink>
      <h1 class="font-display text-xl font-bold text-accent-coral">Cờ Thú</h1>
      <div class="w-24" />
    </header>

    <!-- Mode Selector -->
    <div
      v-if="!gameStarted"
      class="flex flex-col items-center justify-center min-h-[calc(100vh-57px)] px-4 py-12"
    >
      <div class="w-full max-w-md">
        <div class="text-center mb-10">
          <h2 class="font-display text-4xl font-bold text-text-primary mb-3">
            <span class="text-accent-coral">//</span> Cờ Thú
          </h2>
          <p class="text-text-secondary text-sm leading-relaxed">
            Animal Chess — Trò chơi chiến thuật với 8 loài thú trên bàn cờ 7×9.
          </p>
        </div>

        <div class="border border-border-default bg-bg-surface p-6 mb-4">
          <h3
            class="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-2"
          >
            <Icon icon="lucide:gamepad-2" class="size-5 text-accent-amber" />
            Chọn chế độ chơi
          </h3>
          <div class="grid grid-cols-1 gap-3">
            <button
              class="border border-border-default bg-bg-elevated p-4 text-left hover:border-accent-coral hover:bg-bg-elevated/80 transition group"
              @click="startGame('pvp')"
            >
              <div class="flex items-center gap-3 mb-1">
                <Icon
                  icon="lucide:users"
                  class="size-5 text-accent-coral group-hover:scale-110 transition"
                />
                <span class="font-display font-semibold text-text-primary">2 người chơi</span>
              </div>
              <p class="text-text-secondary text-xs pl-8">
                Hai người thay nhau đi trên cùng thiết bị
              </p>
            </button>
            <button
              class="border border-border-default bg-bg-elevated p-4 text-left hover:border-accent-sky hover:bg-bg-elevated/80 transition group"
              @click="startGame('ai')"
            >
              <div class="flex items-center gap-3 mb-1">
                <Icon
                  icon="lucide:cpu"
                  class="size-5 text-accent-sky group-hover:scale-110 transition"
                />
                <span class="font-display font-semibold text-text-primary">Đấu với máy</span>
              </div>
              <p class="text-text-secondary text-xs pl-8">Bạn đi Xanh, máy đi Đỏ — AI mức độ vừa</p>
            </button>
          </div>
        </div>

        <!-- Legend -->
        <div class="border border-border-default bg-bg-surface p-4">
          <h3 class="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">
            Bảng xếp hạng thú
          </h3>
          <div class="grid grid-cols-2 gap-1.5">
            <div
              v-for="def in [...ANIMAL_DEFS].sort((a, b) => b.rank - a.rank)"
              :key="def.rank"
              class="flex items-center gap-2 text-xs"
            >
              <span class="text-lg leading-none">{{ def.emoji }}</span>
              <span class="text-text-secondary">{{ def.name }}</span>
              <span class="ml-auto text-text-dim font-mono">{{ def.rank }}</span>
            </div>
          </div>
          <p class="text-text-dim text-xs mt-3 leading-relaxed">
            Thú mạnh hơn (số lớn hơn) ăn thú yếu hơn.<br />
            Ngoại lệ: Chuột ăn Voi, Chuột không ăn được khi ở sông.
          </p>
        </div>
      </div>
    </div>

    <!-- Game Board -->
    <div v-else class="flex flex-col items-center py-4 px-2 min-h-[calc(100vh-57px)]">
      <!-- Status Bar -->
      <div class="w-full max-w-2xl mb-3 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <button
            class="border border-border-default bg-bg-surface px-3 py-1.5 text-xs text-text-secondary hover:border-accent-amber hover:text-text-primary transition flex items-center gap-1.5"
            @click="newGame"
          >
            <Icon icon="lucide:rotate-ccw" class="size-3.5" />
            Ván mới
          </button>
          <button
            class="border border-border-default bg-bg-surface px-3 py-1.5 text-xs text-text-secondary hover:border-accent-coral hover:text-text-primary transition flex items-center gap-1.5"
            @click="gameStarted = false"
          >
            <Icon icon="lucide:home" class="size-3.5" />
            Menu
          </button>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-text-dim text-xs">Chế độ:</span>
          <span class="text-text-secondary text-xs font-semibold">
            {{ gameMode === 'pvp' ? '2 người' : 'vs Máy' }}
          </span>
        </div>
      </div>

      <!-- Win Banner -->
      <div
        v-if="state.status === 'won'"
        class="w-full max-w-2xl mb-3 border-2 p-3 text-center animate-fade-up"
        :class="
          state.winner === 'blue'
            ? 'border-accent-sky bg-accent-sky/10 text-accent-sky'
            : 'border-accent-coral bg-accent-coral/10 text-accent-coral'
        "
      >
        <p class="font-display text-xl font-bold">🎉 {{ winnerLabel }} thắng!</p>
        <p class="text-sm mt-1 opacity-80">
          <span v-if="gameMode === 'ai' && state.winner === 'blue'">Bạn đã đánh bại máy!</span>
          <span v-else-if="gameMode === 'ai' && state.winner === 'red'"
            >Máy đã thắng. Thử lại nhé!</span
          >
          <span v-else>Chúc mừng người chơi {{ winnerLabel }}!</span>
        </p>
        <button
          class="mt-2 border border-current px-4 py-1.5 text-sm hover:opacity-80 transition"
          @click="newGame"
        >
          Ván mới
        </button>
      </div>

      <!-- Turn Indicator -->
      <div v-else class="w-full max-w-2xl mb-3 flex items-center justify-center gap-3">
        <div
          class="flex items-center gap-2 border px-4 py-2 transition"
          :class="
            state.currentPlayer === 'blue'
              ? 'border-accent-sky bg-accent-sky/10'
              : 'border-border-default bg-bg-surface opacity-50'
          "
        >
          <span class="w-3 h-3 rounded-full bg-accent-sky block" />
          <span
            class="text-sm font-semibold"
            :class="state.currentPlayer === 'blue' ? 'text-accent-sky' : 'text-text-dim'"
          >
            Xanh
          </span>
          <Icon
            v-if="state.currentPlayer === 'blue'"
            icon="lucide:chevron-right"
            class="size-4 text-accent-sky"
          />
        </div>
        <span class="text-text-dim text-xs">vs</span>
        <div
          class="flex items-center gap-2 border px-4 py-2 transition"
          :class="
            state.currentPlayer === 'red'
              ? 'border-accent-coral bg-accent-coral/10'
              : 'border-border-default bg-bg-surface opacity-50'
          "
        >
          <Icon
            v-if="state.currentPlayer === 'red'"
            icon="lucide:chevron-left"
            class="size-4 text-accent-coral"
          />
          <span
            class="text-sm font-semibold"
            :class="state.currentPlayer === 'red' ? 'text-accent-coral' : 'text-text-dim'"
          >
            Đỏ
          </span>
          <span class="w-3 h-3 rounded-full bg-accent-coral block" />
          <span
            v-if="gameMode === 'ai' && state.currentPlayer === 'red'"
            class="text-xs text-text-dim ml-1"
          >
            (đang nghĩ...)
          </span>
        </div>
      </div>

      <!-- Board -->
      <div class="w-full max-w-2xl overflow-x-auto">
        <div class="border-2 border-border-default bg-bg-deep mx-auto" style="width: fit-content">
          <!-- Row labels + board -->
          <div>
            <div v-for="row in ROWS" :key="row - 1" class="flex">
              <div
                v-for="col in COLS"
                :key="col - 1"
                class="relative border cursor-pointer select-none transition-all"
                :class="[
                  cellTypeClasses[getCellType(row - 1, col - 1)],
                  isSelectedCell(row - 1, col - 1)
                    ? 'ring-2 ring-inset ring-accent-amber z-10'
                    : '',
                  isValidMoveCell(row - 1, col - 1) ? 'ring-2 ring-inset ring-white/40 z-10' : '',
                  state.status === 'playing' ? 'hover:brightness-125' : '',
                ]"
                style="width: clamp(44px, 10vw, 72px); height: clamp(44px, 10vw, 72px)"
                @click="handleCellClick(row - 1, col - 1)"
              >
                <!-- Valid move dot (empty cell) -->
                <div
                  v-if="isValidMoveCell(row - 1, col - 1) && !getPieceAtCell(row - 1, col - 1)"
                  class="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <span class="w-3 h-3 rounded-full bg-white/30 block" />
                </div>

                <!-- Cell label for special squares -->
                <div
                  v-if="getCellType(row - 1, col - 1) === 'den-blue'"
                  class="absolute top-0.5 left-0 right-0 text-center text-[9px] text-accent-sky/70 leading-none pointer-events-none"
                >
                  Hang
                </div>
                <div
                  v-if="getCellType(row - 1, col - 1) === 'den-red'"
                  class="absolute top-0.5 left-0 right-0 text-center text-[9px] text-accent-coral/70 leading-none pointer-events-none"
                >
                  Hang
                </div>
                <div
                  v-if="
                    getCellType(row - 1, col - 1) === 'trap-blue' ||
                    getCellType(row - 1, col - 1) === 'trap-red'
                  "
                  class="absolute top-0.5 left-0 right-0 text-center text-[9px] text-accent-amber/70 leading-none pointer-events-none"
                >
                  Bẫy
                </div>
                <div
                  v-if="getCellType(row - 1, col - 1) === 'river'"
                  class="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <span class="text-sky-600/30 text-xs">〰</span>
                </div>

                <!-- Piece -->
                <div
                  v-if="getPieceAtCell(row - 1, col - 1)"
                  class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                >
                  <div
                    class="flex flex-col items-center justify-center w-full h-full"
                    :class="[
                      getPieceAtCell(row - 1, col - 1)!.player === 'blue'
                        ? 'text-accent-sky'
                        : 'text-accent-coral',
                      isSelectedCell(row - 1, col - 1) ? 'scale-110' : '',
                    ]"
                  >
                    <!-- Piece background circle -->
                    <div
                      class="flex flex-col items-center justify-center rounded-full border-2 transition-all"
                      :class="[
                        getPieceAtCell(row - 1, col - 1)!.player === 'blue'
                          ? 'border-accent-sky/60 bg-accent-sky/10'
                          : 'border-accent-coral/60 bg-accent-coral/10',
                        isSelectedCell(row - 1, col - 1)
                          ? 'border-accent-amber bg-accent-amber/20 shadow-lg'
                          : '',
                        isValidMoveCell(row - 1, col - 1) ? 'border-white/60 bg-white/10' : '',
                      ]"
                      style="width: 80%; height: 80%"
                    >
                      <span class="leading-none" style="font-size: clamp(16px, 4vw, 26px)">
                        {{ getPieceAtCell(row - 1, col - 1)!.emoji }}
                      </span>
                      <span
                        class="font-mono font-bold leading-none mt-0.5"
                        style="font-size: clamp(8px, 1.5vw, 11px)"
                      >
                        {{ getPieceAtCell(row - 1, col - 1)!.rank }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Piece counts -->
      <div class="w-full max-w-2xl mt-3 grid grid-cols-2 gap-2">
        <div class="border border-accent-sky/30 bg-bg-surface p-2">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-accent-sky text-xs font-semibold flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-accent-sky block" />
              Xanh
            </span>
            <span class="text-text-dim text-xs font-mono">
              {{ state.pieces.filter((p) => p.player === 'blue').length }}/8
            </span>
          </div>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="p in [...state.pieces.filter((p) => p.player === 'blue')].sort(
                (a, b) => b.rank - a.rank,
              )"
              :key="p.id"
              class="text-base leading-none cursor-pointer hover:scale-110 transition"
              :title="`${p.name} (${p.rank})`"
              @click="selectPiece(p)"
              >{{ p.emoji }}</span
            >
          </div>
        </div>
        <div class="border border-accent-coral/30 bg-bg-surface p-2">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-accent-coral text-xs font-semibold flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-accent-coral block" />
              Đỏ
            </span>
            <span class="text-text-dim text-xs font-mono">
              {{ state.pieces.filter((p) => p.player === 'red').length }}/8
            </span>
          </div>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="p in [...state.pieces.filter((p) => p.player === 'red')].sort(
                (a, b) => b.rank - a.rank,
              )"
              :key="p.id"
              class="text-base leading-none"
              :title="`${p.name} (${p.rank})`"
              >{{ p.emoji }}</span
            >
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="w-full max-w-2xl mt-3 border border-border-default bg-bg-surface p-3">
        <p class="text-text-dim text-xs font-semibold uppercase tracking-wider mb-2">
          Chú thích bàn cờ
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div class="flex items-center gap-1.5">
            <span
              class="w-4 h-4 border border-accent-sky/50 bg-accent-sky/30 block flex-shrink-0"
            />
            <span class="text-text-secondary">Hang (Xanh)</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span
              class="w-4 h-4 border border-accent-coral/50 bg-accent-coral/30 block flex-shrink-0"
            />
            <span class="text-text-secondary">Hang (Đỏ)</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span
              class="w-4 h-4 border border-accent-amber/40 bg-accent-amber/20 block flex-shrink-0"
            />
            <span class="text-text-secondary">Bẫy</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-4 h-4 border border-sky-700/40 bg-sky-900/60 block flex-shrink-0" />
            <span class="text-text-secondary">Sông</span>
          </div>
        </div>
      </div>

      <!-- Rules summary -->
      <div class="w-full max-w-2xl mt-3 mb-6 border border-border-default bg-bg-surface p-3">
        <p class="text-text-dim text-xs font-semibold uppercase tracking-wider mb-2">
          Luật chơi tóm tắt
        </p>
        <ul class="text-xs text-text-secondary space-y-1 list-none">
          <li>• Thú mạnh hơn ăn thú yếu hơn (số rank lớn hơn)</li>
          <li>• 🐭 Chuột (1) có thể ăn 🐘 Voi (8) — khi cả hai ở trên cạn</li>
          <li>• 🦁 Sư tử và 🐯 Hổ có thể nhảy qua sông (bị chặn nếu có Chuột trong sông)</li>
          <li>• Chỉ 🐭 Chuột được vào sông</li>
          <li>• Thú vào bẫy địch bị giảm rank về 0</li>
          <li>• Vào hang địch hoặc ăn hết quân địch = thắng</li>
        </ul>
      </div>
    </div>
  </div>
</template>
