<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useEventListener, useIntervalFn, useLocalStorage } from '@vueuse/core'
const logoUrl = '/shared/web-logo.svg'
import {
  canMoveTile,
  createSolvedBoard,
  formatTime,
  getCol,
  getEmptyIndex,
  getRow,
  isAdjacent,
  isSolved,
  moveTile,
  shuffleBoard,
} from './utils'
import type { PuzzleSize, PuzzleStats, TileValue } from './types'

// ── Constants ────────────────────────────────────────────────────────────────
const GAP = 6 // px

// ── Board state ──────────────────────────────────────────────────────────────
const size = ref<PuzzleSize>(3)
const board = ref<TileValue[]>(createSolvedBoard(size.value))
const moves = ref(0)
const seconds = ref(0)
const hasStarted = ref(false)
const isWon = ref(false)

const leaderboard = useLocalStorage<Record<string, PuzzleStats[]>>('eight-puzzle-leaderboard-v1', {
  '3': [],
  '4': [],
  '5': [],
})

const { pause: pauseTimer, resume: resumeTimer } = useIntervalFn(
  () => {
    seconds.value++
  },
  1000,
  { immediate: false },
)

// ── Drag state ───────────────────────────────────────────────────────────────
const dragIndex = ref<number | null>(null)
const dragDx = ref(0)
const dragDy = ref(0)
const startX = ref(0)
const startY = ref(0)
const suppressClick = ref(false)
const clickAnimatingIndex = ref<number | null>(null)

// ── Helpers ───────────────────────────────────────────────────────────────────
const tileSize = computed(() => {
  if (size.value === 3) return 88
  if (size.value === 4) return 68
  return 54
})
const cell = computed(() => tileSize.value + GAP)
const boardPx = computed(() => tileSize.value * size.value + GAP * (size.value - 1))
const modeKey = computed(() => String(size.value))
const currentLeaderboard = computed(() => leaderboard.value[modeKey.value] ?? [])
const bestMoves = computed(() => currentLeaderboard.value[0]?.moves ?? 0)
const bestTime = computed(() => currentLeaderboard.value[0]?.seconds ?? 0)

function tilePos(idx: number) {
  return { x: getCol(idx, size.value) * cell.value, y: getRow(idx, size.value) * cell.value }
}

type Dir = 'left' | 'right' | 'up' | 'down' | null

function getDragDir(tileIdx: number): Dir {
  const b = board.value
  const ei = getEmptyIndex(b)
  if (!isAdjacent(tileIdx, ei, size.value)) return null
  const tr = getRow(tileIdx, size.value),
    tc = getCol(tileIdx, size.value)
  const er = getRow(ei, size.value),
    ec = getCol(ei, size.value)
  if (tr === er) return ec > tc ? 'right' : 'left'
  return er > tr ? 'down' : 'up'
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v
}

function getTileStyle(boardIdx: number, val: TileValue): Record<string, string> {
  const { x, y } = tilePos(boardIdx)

  if (val === null) {
    return { left: `${x}px`, top: `${y}px`, visibility: 'hidden', transition: 'none' }
  }

  if (dragIndex.value === boardIdx) {
    const dir = getDragDir(boardIdx)
    let dx = 0,
      dy = 0
    if (dir === 'left' || dir === 'right') dx = clamp(dragDx.value, -cell.value, cell.value)
    else if (dir === 'up' || dir === 'down') dy = clamp(dragDy.value, -cell.value, cell.value)

    return {
      left: `${x}px`,
      top: `${y}px`,
      transform: `translate(${dx}px,${dy}px) scale(1.06)`,
      transition: 'none',
      zIndex: '10',
    }
  }

  const isClickAnimating = clickAnimatingIndex.value === boardIdx

  return {
    left: `${x}px`,
    top: `${y}px`,
    transform: isClickAnimating ? 'translate(0,0) scale(1.03)' : 'translate(0,0) scale(1)',
    transition:
      'left 0.24s cubic-bezier(0.22, 1, 0.36, 1), top 0.24s cubic-bezier(0.22, 1, 0.36, 1), transform 0.18s ease',
    zIndex: '1',
  }
}

function isTileCorrect(boardIdx: number, value: number): boolean {
  return boardIdx === value - 1
}

// ── Tile list (keyed by value, stable DOM node) ───────────────────────────────
interface TileEntry {
  value: number
  boardIdx: number
}

const tileEntries = computed<TileEntry[]>(() => {
  const out: TileEntry[] = []
  board.value.forEach((v, i) => {
    if (v !== null) out.push({ value: v, boardIdx: i })
  })
  return out
})

// ── Game ──────────────────────────────────────────────────────────────────────
function startGame() {
  board.value = shuffleBoard(size.value, size.value * size.value * 24)
  moves.value = 0
  seconds.value = 0
  isWon.value = false
  hasStarted.value = true
  resumeTimer()
}

function commitMove(tileIdx: number) {
  const b = board.value
  if (!Array.isArray(b) || !canMoveTile(b, tileIdx, size.value)) return
  board.value = moveTile(b, tileIdx, size.value)
  moves.value++

  if (isSolved(board.value)) {
    pauseTimer()
    isWon.value = true
    saveScore()
  }
}

function handleTileClick(tileIdx: number) {
  if (suppressClick.value) {
    suppressClick.value = false
    return
  }

  if (dragIndex.value !== null || isWon.value || !hasStarted.value) return
  clickAnimatingIndex.value = tileIdx
  commitMove(tileIdx)
  setTimeout(() => {
    if (clickAnimatingIndex.value === tileIdx) {
      clickAnimatingIndex.value = null
    }
  }, 220)
}

// ── Pointer events ────────────────────────────────────────────────────────────
function onPointerDown(e: PointerEvent, idx: number) {
  if (isWon.value || !hasStarted.value) return
  if (!canMoveTile(board.value, idx, size.value)) return
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  dragIndex.value = idx
  dragDx.value = 0
  dragDy.value = 0
  startX.value = e.clientX
  startY.value = e.clientY
}

useEventListener(window, 'pointermove', (e: PointerEvent) => {
  if (dragIndex.value === null) return
  dragDx.value = e.clientX - startX.value
  dragDy.value = e.clientY - startY.value

  if (Math.abs(dragDx.value) > 4 || Math.abs(dragDy.value) > 4) {
    suppressClick.value = true
  }
})

useEventListener(window, 'pointerup', () => {
  if (dragIndex.value === null) return
  const idx = dragIndex.value
  const dir = getDragDir(idx)
  const THRESHOLD = cell.value * 0.35
  let commit = false

  if (dir === 'left' && dragDx.value < -THRESHOLD) commit = true
  else if (dir === 'right' && dragDx.value > THRESHOLD) commit = true
  else if (dir === 'up' && dragDy.value < -THRESHOLD) commit = true
  else if (dir === 'down' && dragDy.value > THRESHOLD) commit = true

  // Reset drag trước (tile snap về), rồi mới commit board
  dragIndex.value = null
  dragDx.value = 0
  dragDy.value = 0

  if (commit) nextTick(() => commitMove(idx))
  else suppressClick.value = false
})

useEventListener(window, 'pointercancel', () => {
  dragIndex.value = null
  dragDx.value = 0
  dragDy.value = 0
  suppressClick.value = false
})

// ── Status ────────────────────────────────────────────────────────────────────
const statusText = computed(() => {
  if (isWon.value) return '🎉 Hoàn thành!'
  if (!hasStarted.value) return 'Nhấn Bắt đầu để chơi'
  return `Bước: ${moves.value} · ${formatTime(seconds.value)}`
})

function safeFormatTime(s: number): string {
  if (!s || s <= 0) return '00:00'
  return formatTime(Math.floor(s))
}

function saveScore() {
  const key = modeKey.value
  const nextScores = [
    ...(leaderboard.value[key] ?? []),
    { moves: moves.value, seconds: seconds.value },
  ]
    .sort((a, b) => a.seconds - b.seconds || a.moves - b.moves)
    .slice(0, 10)

  leaderboard.value = {
    ...leaderboard.value,
    [key]: nextScores,
  }
}

function setMode(nextSize: PuzzleSize) {
  size.value = nextSize
  board.value = createSolvedBoard(nextSize)
  moves.value = 0
  seconds.value = 0
  isWon.value = false
  hasStarted.value = false
  pauseTimer()
  dragIndex.value = null
  dragDx.value = 0
  dragDy.value = 0
  clickAnimatingIndex.value = null
}
</script>

<template>
  <div
    class="relative min-h-screen bg-bg-deep text-text-primary font-body px-4 py-6 sm:py-8 lg:grid lg:place-items-center"
  >
    <img
      :src="logoUrl"
      alt="KaiyoDang logo"
      class="pointer-events-none absolute right-3 top-3 z-0 w-28 rotate-12 opacity-70 mix-blend-screen drop-shadow-[0_0_18px_rgba(255,107,74,0.18)] sm:right-5 sm:top-4 sm:w-36 md:w-44"
      style="filter: brightness(0) invert(1)"
    />

    <div
      class="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:grid lg:grid-cols-[320px_minmax(0,1fr)_320px] lg:items-center"
    >
      <div class="hidden lg:block" aria-hidden="true"></div>

      <div class="flex flex-col items-center gap-6 lg:col-start-2 lg:justify-self-center">
        <div class="w-full text-center animate-fade-up">
          <RouterLink
            to="/"
            class="mb-5 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          >
            ← Trang chủ
          </RouterLink>
          <h1 class="font-display text-4xl font-bold text-accent-coral tracking-tight">8 Puzzle</h1>
          <p class="mt-2 text-sm text-text-secondary">Trượt ô để sắp xếp 1–8 theo thứ tự</p>
        </div>

        <div class="flex gap-2 animate-fade-up animate-delay-2">
          <button
            v-for="mode in [3, 4, 5]"
            :key="mode"
            class="border px-3 py-2 text-xs font-display tracking-wide transition"
            :class="
              size === mode
                ? 'border-accent-coral bg-bg-elevated text-accent-coral'
                : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-coral hover:text-text-primary'
            "
            @click="setMode(mode as PuzzleSize)"
          >
            {{ mode }}x{{ mode }}
          </button>
        </div>

        <div class="animate-fade-up animate-delay-3 border border-border-default bg-bg-surface p-3">
          <div class="relative" :style="{ width: boardPx + 'px', height: boardPx + 'px' }">
            <button
              v-for="entry in tileEntries"
              :key="entry.value"
              class="tile absolute flex items-center justify-center font-display font-bold border border-border-default bg-bg-elevated text-text-primary select-none"
              :class="{
                'tile-movable cursor-grab border-accent-coral/40 text-accent-amber': canMoveTile(
                  board,
                  entry.boardIdx,
                  size,
                ),
                'cursor-default': !canMoveTile(board, entry.boardIdx, size),
                'tile-correct': isTileCorrect(entry.boardIdx, entry.value),
              }"
              :data-size="size"
              :style="getTileStyle(entry.boardIdx, entry.value)"
              @pointerdown="(e) => onPointerDown(e, entry.boardIdx)"
              @click="handleTileClick(entry.boardIdx)"
            >
              {{ entry.value }}
            </button>
          </div>
        </div>

        <p class="text-center text-sm text-text-secondary animate-fade-up animate-delay-4">
          {{ statusText }}
        </p>

        <div
          class="flex flex-wrap items-center justify-center gap-4 animate-fade-up animate-delay-5"
        >
          <button
            class="border border-accent-coral bg-bg-surface px-6 py-2.5 text-sm font-display font-semibold text-accent-coral transition hover:bg-accent-coral hover:text-bg-deep"
            @click="startGame"
          >
            {{ hasStarted ? 'Chơi lại' : 'Bắt đầu' }}
          </button>

          <div
            v-if="bestMoves > 0 || bestTime > 0"
            class="flex gap-4 text-xs text-text-dim font-display tracking-wide"
          >
            <span v-if="bestMoves > 0">🏆 Tốt nhất: {{ bestMoves }} bước</span>
            <span v-if="bestTime > 0">⏱ {{ safeFormatTime(bestTime) }}</span>
          </div>
        </div>
      </div>

      <aside
        class="w-full border border-border-default bg-bg-surface p-4 animate-fade-up animate-delay-6 lg:col-start-3"
      >
        <div class="mb-3 flex items-center justify-between">
          <h2 class="font-display text-sm tracking-widest text-text-primary">
            <span class="mr-2 text-accent-coral">//</span>BXH {{ size }}x{{ size }}
          </h2>
          <span class="text-xs text-text-dim">Chúc bạn 1 ngày tốt lành</span>
        </div>

        <div v-if="currentLeaderboard.length" class="space-y-2">
          <div
            v-for="(item, index) in currentLeaderboard"
            :key="`${size}-${index}-${item.moves}-${item.seconds}`"
            class="flex items-center justify-between border border-border-default bg-bg-elevated px-3 py-2 text-xs"
          >
            <span class="font-display text-text-secondary">#{{ index + 1 }}</span>
            <span class="text-text-primary">{{ item.moves }} bước</span>
            <span class="text-accent-amber">{{ safeFormatTime(item.seconds) }}</span>
          </div>
        </div>
        <p v-else class="text-xs text-text-dim">Chưa có kỷ lục nào cho chế độ này.</p>
      </aside>
    </div>

    <div
      class="mx-auto mt-8 flex flex-wrap items-center justify-center gap-2 text-center text-xs font-display tracking-wide text-text-dim animate-fade-up animate-delay-7"
    >
      <span>Made by</span>
      <a
        href="https://www.facebook.com/kaiyo.dang"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-block text-accent-coral transition hover:-translate-y-0.5 hover:text-text-primary"
      >
        KaiyoDang
      </a>
      <span>· J2TEAM Community with love</span>
    </div>

    <!-- Win overlay -->
    <Transition name="fade">
      <div
        v-if="isWon"
        class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/85 backdrop-blur-sm"
      >
        <div class="border border-border-default bg-bg-surface p-10 text-center max-w-xs w-full">
          <div class="text-4xl mb-4">🎉</div>
          <h2 class="font-display text-2xl font-bold text-accent-coral mb-1">Xuất sắc!</h2>
          <p class="text-text-secondary text-sm">
            {{ moves }} bước · {{ safeFormatTime(seconds) }}
          </p>
          <button
            class="mt-6 w-full border border-accent-coral bg-bg-elevated px-4 py-2.5 text-sm font-display font-semibold text-accent-coral transition hover:bg-accent-coral hover:text-bg-deep"
            @click="startGame"
          >
            Chơi lại
          </button>
          <RouterLink
            to="/"
            class="block mt-3 text-xs text-text-dim hover:text-text-secondary transition"
          >
            ← Trang chủ
          </RouterLink>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.tile {
  width: v-bind('tileSize + "px"');
  height: v-bind('tileSize + "px"');
  will-change: transform;
  touch-action: none;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.5);
}

.tile-movable:hover {
  filter: brightness(1.15);
  box-shadow:
    0 2px 0 rgba(0, 0, 0, 0.5),
    0 0 12px rgba(255, 107, 74, 0.2);
}

.tile-movable:active {
  cursor: grabbing;
}

.tile-correct {
  border-color: #7fb069;
  color: #eef8e8;
  box-shadow:
    0 2px 0 rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(127, 176, 105, 0.55),
    0 0 14px rgba(127, 176, 105, 0.18);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
