import { useEventListener, useIntervalFn, useLocalStorage } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import type { Direction, Grid, Tile } from '../types'
import { addRandomTile, createEmptyGrid, isGameOver, move, syncNextId } from '../utils/logic'

interface SavedState {
  grid: Grid
  score: number
  time: number
  isGameOver: boolean
}

export function useGame() {
  const grid = ref<Grid>(createEmptyGrid())
  const score = ref(0)
  const bestScore = useLocalStorage('game-2048-best-score', 0)
  const isGameOverFlag = ref(false)
  const isPaused = ref(false)
  const showResumeChoice = ref(false)

  const savedStateRaw = useLocalStorage<string>('game-2048-saved-state', '')
  const isInitializing = ref(false)

  // Timer using VueUse
  const time = ref(0)
  const {
    pause: stopTimer,
    resume: startTimer,
    isActive: isTimerActive,
  } = useIntervalFn(
    () => {
      time.value++
    },
    1000,
    { immediate: false },
  )

  const formattedTime = computed(() => {
    const m = Math.floor(time.value / 60)
    const s = time.value % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  })

  const getParsedState = (): SavedState | null => {
    if (!savedStateRaw.value) return null
    try {
      return JSON.parse(savedStateRaw.value)
    } catch {
      return null
    }
  }

  const validateGrid = (g: unknown): boolean => {
    if (!Array.isArray(g)) return false
    if (g.length !== 4) return false
    for (let y = 0; y < 4; y++) {
      const row = g[y]
      if (!Array.isArray(row) || row.length !== 4) return false
    }
    return true
  }

  const saveGameState = () => {
    if (isInitializing.value || showResumeChoice.value) return
    savedStateRaw.value = JSON.stringify({
      grid: grid.value,
      score: score.value,
      time: time.value,
      isGameOver: isGameOverFlag.value,
    })
  }

  // Auto-save
  watch(
    [grid, score, time, isGameOverFlag],
    () => {
      saveGameState()
    },
    { deep: true },
  )

  const togglePause = () => {
    if (isGameOverFlag.value || showResumeChoice.value) return
    isPaused.value = !isPaused.value
    if (isPaused.value) {
      stopTimer()
    } else if (
      score.value > 0 ||
      time.value > 0 ||
      grid.value.some((row) => Array.isArray(row) && row.some((cell) => cell !== null))
    ) {
      startTimer()
    }
  }

  const loadGameState = () => {
    try {
      const state = getParsedState()
      if (state && !state.isGameOver && validateGrid(state.grid)) {
        isInitializing.value = true

        grid.value = state.grid
        score.value = typeof state.score === 'number' ? state.score : 0
        time.value = typeof state.time === 'number' ? state.time : 0
        syncNextId(grid.value)

        setTimeout(() => {
          isInitializing.value = false
        }, 50)
        return true
      }
    } catch (e) {
      console.error('Failed to load saved state', e)
    }

    savedStateRaw.value = ''
    return false
  }

  const initGame = (forceNewArg: boolean | Event = false) => {
    const forceNew = typeof forceNewArg === 'boolean' ? forceNewArg : false
    isInitializing.value = true

    if (forceNew) {
      savedStateRaw.value = ''
      showResumeChoice.value = false
    } else {
      const state = getParsedState()
      if (
        state &&
        !state.isGameOver &&
        validateGrid(state.grid) &&
        state.grid.some((row) => Array.isArray(row) && row.some((cell) => cell !== null))
      ) {
        loadGameState()
        showResumeChoice.value = true
        return
      }
    }

    if (!forceNew) savedStateRaw.value = ''

    grid.value = createEmptyGrid()
    grid.value = addRandomTile(grid.value)
    grid.value = addRandomTile(grid.value)
    score.value = 0
    isGameOverFlag.value = false
    isPaused.value = false
    showResumeChoice.value = false
    time.value = 0
    stopTimer()

    setTimeout(() => {
      isInitializing.value = false
    }, 50)
  }

  const resumeSavedGame = () => {
    isGameOverFlag.value = false
    isPaused.value = false
    showResumeChoice.value = false
    startTimer()
  }

  const handleMove = (direction: Direction) => {
    if (isGameOverFlag.value || isPaused.value || showResumeChoice.value) return

    const result = move(grid.value, direction)
    if (result.changed) {
      if (!isTimerActive.value) {
        startTimer()
      }

      grid.value = result.grid
      setTimeout(() => {
        grid.value = addRandomTile(grid.value)
        if (isGameOver(grid.value)) {
          isGameOverFlag.value = true
          stopTimer()
        }
      }, 150)

      score.value += result.score
      if (score.value > bestScore.value) {
        bestScore.value = score.value
      }
    }
  }

  const tiles = computed(() => {
    const result: Tile[] = []
    grid.value.forEach((row) => {
      row.forEach((tile) => {
        if (tile) {
          result.push(tile)
          if (tile.mergedFrom) {
            result.push(...tile.mergedFrom)
          }
        }
      })
    })
    return result.sort((a, b) => a.id - b.id)
  })

  useEventListener(document, 'visibilitychange', () => {
    if (
      document.hidden &&
      !isGameOverFlag.value &&
      !isPaused.value &&
      (score.value > 0 || time.value > 0)
    ) {
      togglePause()
    }
  })

  return {
    grid,
    score,
    bestScore,
    isGameOverFlag,
    isPaused,
    showResumeChoice,
    time: formattedTime,
    tiles,

    initGame,
    resumeSavedGame,
    togglePause,
    handleMove,
    saveGameState,
  }
}
