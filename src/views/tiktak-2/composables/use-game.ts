import { ref, computed, watch } from 'vue'
import { useLocalStorage, useTimeoutFn } from '@vueuse/core'
import { checkWinner, getBestMove } from '../utils/ai'
import type { CellValue, GameStatus, Difficulty, Score } from '../types'

export function useGame() {
  const rows = ref(3)
  const cols = ref(3)
  const board = ref<CellValue[]>(Array(9).fill(null) as CellValue[])
  const isPlayerTurn = ref(true)
  const gameStatus = ref<GameStatus>('setup')
  const difficulty = ref<Difficulty>('hard')
  const score = useLocalStorage<Score>('tiktak-2-score', {
    wins: 0,
    losses: 0,
    draws: 0,
  })

  const statusMessage = computed(() => {
    switch (gameStatus.value) {
      case 'playerWins':
        return 'Bạn thắng! 🎉'
      case 'aiWins':
        return 'AI thắng! 🤖'
      case 'draw':
        return 'Hoà! 🤝'
      default:
        return isPlayerTurn.value ? 'Lượt của bạn (X)' : 'AI đang suy nghĩ... (O)'
    }
  })

  const isGameOver = computed(
    () =>
      gameStatus.value === 'playerWins' ||
      gameStatus.value === 'aiWins' ||
      gameStatus.value === 'draw',
  )

  function initBoard() {
    board.value = Array(rows.value * cols.value).fill(null) as CellValue[]
  }

  function startGame() {
    if (rows.value < 3 || cols.value < 3 || rows.value > 10 || cols.value > 10) return
    initBoard()
    gameStatus.value = 'playing'
    isPlayerTurn.value = true
  }

  function backToSetup() {
    gameStatus.value = 'setup'
    rows.value = 3
    cols.value = 3
    initBoard()
    isPlayerTurn.value = true
  }

  function resetGame() {
    initBoard()
    isPlayerTurn.value = true
    gameStatus.value = 'playing'
  }

  function resetScore() {
    score.value = { wins: 0, losses: 0, draws: 0 }
  }

  function applyResult(winner: 'X' | 'O' | 'draw') {
    if (winner === 'X') {
      gameStatus.value = 'playerWins'
      score.value = { ...score.value, wins: score.value.wins + 1 }
    } else if (winner === 'O') {
      gameStatus.value = 'aiWins'
      score.value = { ...score.value, losses: score.value.losses + 1 }
    } else {
      gameStatus.value = 'draw'
      score.value = { ...score.value, draws: score.value.draws + 1 }
    }
  }

  function handleCellClick(index: number) {
    if (board.value[index] !== null || !isPlayerTurn.value || gameStatus.value !== 'playing') return

    const newBoard = [...board.value]
    newBoard[index] = 'X'
    board.value = newBoard

    const winner = checkWinner(newBoard, rows.value, cols.value)
    if (winner) {
      applyResult(winner)
    } else {
      isPlayerTurn.value = false
    }
  }

  const { start: scheduleAiMove, stop: cancelAiMove } = useTimeoutFn(
    () => {
      if (isPlayerTurn.value || gameStatus.value !== 'playing') return

      const aiMove = getBestMove([...board.value], rows.value, cols.value, difficulty.value)
      if (aiMove === null) return

      const newBoard = [...board.value]
      newBoard[aiMove] = 'O'
      board.value = newBoard

      const winner = checkWinner(newBoard, rows.value, cols.value)
      if (winner) {
        applyResult(winner)
      } else {
        isPlayerTurn.value = true
      }
    },
    500,
    { immediate: false },
  )

  watch([isPlayerTurn, gameStatus], ([turn, status]) => {
    if (!turn && status === 'playing') {
      scheduleAiMove()
    }
  })

  function setPresetSize(size: number) {
    rows.value = size
    cols.value = size
  }

  return {
    rows,
    cols,
    board,
    isPlayerTurn,
    gameStatus,
    difficulty,
    score,
    statusMessage,
    isGameOver,
    startGame,
    backToSetup,
    resetGame,
    resetScore,
    handleCellClick,
    setPresetSize,
    cancelAiMove,
  }
}
