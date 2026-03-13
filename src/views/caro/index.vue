<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import BoardCell from '@/views/caro/components/BoardCell.vue'
import { checkWinCondition } from '@/views/caro/algorithm/checkWinCondition'
import { AiService } from '@/views/caro/algorithm/ai'
import { PlayerEnum, type Board, type GameResult, type IPosition } from '@/views/caro/types'
import pageMeta from '@/views/caro/meta'

const WIN_CONDITION = 5
const BOARD_SIZE = 19
const CELL_GAP = 2
const GRID_PADDING = 12

const gameStarted = ref(false)
const board = ref<Board>([])
const humanPlayer = ref<PlayerEnum>(PlayerEnum.X)
const aiPlayer = ref<PlayerEnum>(PlayerEnum.O)
const currentPlayer = ref<PlayerEnum>(PlayerEnum.X)
const gameEnded = ref(false)
const gameResult = ref<GameResult | null>(null)
const winningPositions = ref<IPosition[]>([])
const lastMovePosition = ref<IPosition | undefined>(undefined)
const isThinking = ref(false)

const cellSizePx = 32

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${BOARD_SIZE}, ${cellSizePx}px)`,
  gridTemplateRows: `repeat(${BOARD_SIZE}, ${cellSizePx}px)`,
  gap: `${CELL_GAP}px`,
  padding: `${GRID_PADDING}px`,
}))

function createEmptyBoard(size: number): Board {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null))
}

function isBoardFull(): boolean {
  return board.value.every((row) => row.every((cell) => cell !== null))
}

function isInWinning(row: number, col: number): boolean {
  return winningPositions.value.some((p) => p.row === row && p.col === col)
}

const boardWrapperRef = ref<HTMLElement | null>(null)

function scrollBoardToCenter() {
  nextTick(() => {
    requestAnimationFrame(() => {
      const el = boardWrapperRef.value
      if (!el || el.scrollWidth <= el.clientWidth) return
      const scrollLeft = (el.scrollWidth - el.clientWidth) / 2
      const scrollTop = (el.scrollHeight - el.clientHeight) / 2
      el.scrollTo({
        left: Math.max(0, scrollLeft),
        top: Math.max(0, scrollTop),
        behavior: 'smooth',
      })
    })
  })
}

function startGame() {
  board.value = createEmptyBoard(BOARD_SIZE)
  const humanFirst = Math.random() < 0.7
  humanPlayer.value = humanFirst ? PlayerEnum.X : PlayerEnum.O
  aiPlayer.value = humanFirst ? PlayerEnum.O : PlayerEnum.X
  currentPlayer.value = PlayerEnum.X
  gameEnded.value = false
  gameResult.value = null
  winningPositions.value = []
  lastMovePosition.value = undefined
  isThinking.value = false
  gameStarted.value = true

  if (currentPlayer.value === aiPlayer.value) {
    nextTick(() => runAiMove())
  }
  scrollBoardToCenter()
}

function onCellClick(row: number, col: number) {
  if (gameEnded.value || currentPlayer.value !== humanPlayer.value || isThinking.value) {
    return
  }
  const rowData = board.value[row]
  if (!rowData || rowData[col] !== null) return

  rowData[col] = humanPlayer.value
  lastMovePosition.value = { row, col }

  const gameState = {
    board: board.value,
    currentPlayer: currentPlayer.value,
    winCondition: WIN_CONDITION,
    lastMovePosition: lastMovePosition.value,
  }
  const { hasWon, winningLine } = checkWinCondition(gameState, row, col, humanPlayer.value)

  if (hasWon && winningLine) {
    gameEnded.value = true
    gameResult.value = 'win'
    winningPositions.value = winningLine
    return
  }

  if (isBoardFull()) {
    gameEnded.value = true
    gameResult.value = 'draw'
    return
  }

  currentPlayer.value = aiPlayer.value
  runAiMove()
}

function runAiMove() {
  const delay = 700
  isThinking.value = true
  const boardCopy: Board = board.value.map((row) => [...row])
  const ai = new AiService()
  const pos = ai.bestMove(boardCopy, aiPlayer.value)

  setTimeout(() => {
    const rowData = board.value[pos.row]
    if (!rowData) {
      isThinking.value = false
      return
    }
    rowData[pos.col] = aiPlayer.value
    lastMovePosition.value = { row: pos.row, col: pos.col }

    const gameState = {
      board: board.value,
      currentPlayer: aiPlayer.value,
      winCondition: WIN_CONDITION,
      lastMovePosition: lastMovePosition.value,
    }
    const { hasWon, winningLine } = checkWinCondition(gameState, pos.row, pos.col, aiPlayer.value)

    if (hasWon && winningLine) {
      gameEnded.value = true
      gameResult.value = 'lose'
      winningPositions.value = winningLine
    } else if (isBoardFull()) {
      gameEnded.value = true
      gameResult.value = 'draw'
    } else {
      currentPlayer.value = humanPlayer.value
    }
    isThinking.value = false
  }, delay)
}

const statusText = computed(() => {
  if (gameResult.value === 'win') return 'Bạn thắng!'
  if (gameResult.value === 'lose') return 'Bạn thua!'
  if (gameResult.value === 'draw') return 'Hòa!'
  if (isThinking.value) return 'Máy đang suy nghĩ...'
  if (currentPlayer.value === humanPlayer.value) return 'Lượt của bạn'
  return 'Lượt máy'
})
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center px-4 py-8"
  >
    <header class="w-full max-w-2xl animate-fade-up">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-accent-coral"
      >
        &larr; Về trang chủ
      </RouterLink>
      <h1 class="font-display text-3xl min-[375px]:text-4xl font-bold text-accent-coral mt-4">
        {{ pageMeta.name }}
      </h1>
      <p v-if="gameStarted" class="mt-2 text-text-secondary text-sm">
        Bạn đi {{ humanPlayer }} — {{ statusText }}
      </p>
      <p v-else class="mt-2 text-text-secondary text-sm">
        {{ pageMeta.description }} Nhấn Bắt đầu để chơi.
      </p>
    </header>

    <div v-if="!gameStarted" class="mt-6 animate-fade-up animate-delay-1">
      <button
        class="px-6 py-2 text-sm font-medium border border-accent-coral text-accent-coral bg-bg-surface transition hover:bg-accent-coral hover:text-bg-deep"
        @click="startGame"
      >
        Bắt đầu
      </button>
    </div>

    <template v-else>
      <div class="mt-4 flex w-full max-w-2xl flex-col items-center animate-fade-up animate-delay-2">
        <div class="mb-3 flex w-full items-center justify-between gap-4">
          <p
            class="font-display text-lg"
            :class="{
              'text-accent-coral': gameResult === 'win',
              'text-accent-amber': gameResult === 'lose' || isThinking,
              'text-text-secondary': !gameEnded && !isThinking,
            }"
          >
            {{ statusText }}
          </p>
          <button
            v-if="gameEnded"
            class="shrink-0 px-4 py-2 text-sm font-medium border border-accent-coral text-accent-coral bg-bg-surface transition hover:bg-accent-coral hover:text-bg-deep"
            @click="startGame"
          >
            Chơi lại
          </button>
        </div>

        <div
          ref="boardWrapperRef"
          class="caro-board-wrapper mt-4 w-full overflow-auto touch-pan-x touch-pan-y"
        >
          <div class="caro-board mx-auto w-max">
            <div
              class="rounded-[12px] border border-border-default bg-bg-surface p-3 shadow-lg"
              :style="gridStyle"
            >
              <template v-for="(rowData, r) in board" :key="r">
                <BoardCell
                  v-for="(cell, c) in rowData"
                  :key="`${r}-${c}`"
                  :value="cell"
                  :cell-size="cellSizePx"
                  :is-winning="isInWinning(r, c)"
                  :is-last-move="lastMovePosition?.row === r && lastMovePosition?.col === c"
                  :game-ended="gameEnded"
                  @click="onCellClick(r, c)"
                />
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.caro-board-wrapper {
  -webkit-overflow-scrolling: touch;
  min-height: 0;
}
</style>
