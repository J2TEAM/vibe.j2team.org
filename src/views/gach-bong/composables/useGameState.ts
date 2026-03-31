import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { GachBongModule, Difficulty, GameConfig, MatchResult } from './types'
import { DIFFICULTY_CONFIGS } from './types'

export type GameStatus = 'menu' | 'playing' | 'paused' | 'won' | 'lost'

interface SelectedTile {
  row: number
  col: number
}

interface GameState {
  status: GameStatus
  difficulty: Difficulty
  config: GameConfig
  score: number
  timeLeft: number
  remainingTiles: number
  selected: SelectedTile | null
  hintTiles: [SelectedTile, SelectedTile] | null
  matchPath: [number, number][] | null
  hintsUsed: number
  shufflesUsed: number
  combo: number
  boardVersion: number
}

function makeInitialState(): GameState {
  return {
    status: 'menu',
    difficulty: 'easy',
    config: DIFFICULTY_CONFIGS.easy,
    score: 0,
    timeLeft: 300,
    remainingTiles: 0,
    selected: null,
    hintTiles: null,
    matchPath: null,
    hintsUsed: 0,
    shufflesUsed: 0,
    combo: 0,
    boardVersion: 0,
  }
}

export function useGameState(engine: Ref<GachBongModule | null>) {
  const state = ref<GameState>(makeInitialState())
  let selectedTile: SelectedTile | null = null
  let selectedTileType: number = -1 // Store the pattern type of selected tile
  let selectedPaletteIdx: number = -1 // Store the palette (color) of selected tile
  let comboTimer: ReturnType<typeof setTimeout> | null = null

  function startGame(difficulty: Difficulty) {
    if (!engine.value) return
    const config = DIFFICULTY_CONFIGS[difficulty]
    engine.value.initGame(config.rows, config.cols, config.numPatterns)
    selectedTile = null
    selectedTileType = -1
    selectedPaletteIdx = -1
    state.value = {
      status: 'playing',
      difficulty,
      config,
      score: 0,
      timeLeft: config.timeLimit,
      remainingTiles: engine.value.getRemainingTiles(),
      selected: null,
      hintTiles: null,
      matchPath: null,
      hintsUsed: 0,
      shufflesUsed: 0,
      combo: 0,
      boardVersion: 0,
    }
  }

  function selectTile(row: number, col: number) {
    if (!engine.value) return
    if (state.value.status !== 'playing') return

    const tileType = engine.value.getTileAt(row, col)
    if (tileType < 0) return

    // Get palette index (color) for this tile
    const paletteIdx = engine.value.getPaletteIdx(row, col)

    const prev = selectedTile

    if (!prev) {
      // First tile selection - store both position, pattern type, and palette
      selectedTile = { row, col }
      selectedTileType = tileType
      selectedPaletteIdx = paletteIdx
      state.value = { ...state.value, selected: { row, col }, hintTiles: null }
      return
    }

    if (prev.row === row && prev.col === col) {
      // Clicked same tile - deselect
      selectedTile = null
      selectedTileType = -1
      selectedPaletteIdx = -1
      state.value = { ...state.value, selected: null }
      return
    }

    // Check if tiles have the same pattern type AND same palette before calling engine
    if (tileType !== selectedTileType || paletteIdx !== selectedPaletteIdx) {
      // Different pattern type or palette - select the new tile instead
      selectedTile = { row, col }
      selectedTileType = tileType
      selectedPaletteIdx = paletteIdx
      state.value = { ...state.value, selected: { row, col }, hintTiles: null, combo: 0 }
      return
    }

    // Same pattern type AND same palette - check if they can connect via path
    const result: MatchResult = engine.value.checkMatch(prev.row, prev.col, row, col)

    if (result.valid) {
      engine.value.removePair(prev.row, prev.col, row, col)
      const remaining = engine.value.getRemainingTiles()
      const isWon = engine.value.isBoardCleared()
      selectedTile = null
      selectedTileType = -1
      selectedPaletteIdx = -1

      if (comboTimer) clearTimeout(comboTimer)

      const newCombo = state.value.combo + 1
      const basePoints = 100
      const comboBonus = Math.min(newCombo - 1, 5) * 25
      const turnBonus = (2 - result.turns) * 10
      const points = basePoints + comboBonus + turnBonus

      state.value = {
        ...state.value,
        selected: null,
        matchPath: result.path,
        score: state.value.score + points,
        remainingTiles: remaining,
        combo: newCombo,
        status: isWon ? 'won' : state.value.status,
        boardVersion: state.value.boardVersion + 1,
      }
    } else {
      // Same type and palette but no valid path - select the new tile instead
      selectedTile = { row, col }
      selectedTileType = tileType
      selectedPaletteIdx = paletteIdx
      state.value = { ...state.value, selected: { row, col }, hintTiles: null, combo: 0 }
    }
  }

  // Reset combo sau 3 giây không match
  watch(
    () => [state.value.combo, state.value.status] as const,
    ([combo, status]) => {
      if (combo > 0 && status === 'playing') {
        comboTimer = setTimeout(() => {
          state.value = { ...state.value, combo: 0 }
        }, 3000)
      }
    },
  )

  function clearMatchAnimation() {
    state.value = { ...state.value, matchPath: null, hintTiles: null }
  }

  function requestHint() {
    if (!engine.value) return
    const hint = engine.value.getHint()
    if (hint.found) {
      state.value = {
        ...state.value,
        hintTiles: [
          { row: hint.tile1[0], col: hint.tile1[1] },
          { row: hint.tile2[0], col: hint.tile2[1] },
        ],
        hintsUsed: state.value.hintsUsed + 1,
        score: Math.max(0, state.value.score - 20),
      }
    }
  }

  function requestShuffle() {
    if (!engine.value) return
    engine.value.shuffleBoard()
    selectedTile = null
    selectedTileType = -1
    selectedPaletteIdx = -1
    state.value = {
      ...state.value,
      shufflesUsed: state.value.shufflesUsed + 1,
      score: Math.max(0, state.value.score - 50),
      selected: null,
      hintTiles: null,
      boardVersion: state.value.boardVersion + 1,
    }
  }

  function tick() {
    if (state.value.status !== 'playing') return
    const newTime = state.value.timeLeft - 1
    if (newTime <= 0) {
      state.value = { ...state.value, timeLeft: 0, status: 'lost' }
    } else {
      state.value = { ...state.value, timeLeft: newTime }
    }
  }

  function backToMenu() {
    selectedTile = null
    selectedTileType = -1
    selectedPaletteIdx = -1
    state.value = {
      ...state.value,
      status: 'menu',
      selected: null,
      matchPath: null,
      hintTiles: null,
    }
  }

  return {
    state,
    startGame,
    selectTile,
    requestHint,
    requestShuffle,
    tick,
    backToMenu,
    clearMatchAnimation,
  }
}
