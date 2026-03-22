import { computed, ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import type {
  Challenge,
  EvaluationResult,
  GameProgress,
  GameView,
  PlayMode,
  TechCategory,
} from '../types'
import { challenges } from '../data/challenges'
import { useSimulationEngine } from './useSimulationEngine'
import { evaluateSolution } from './useEvaluation'

export function useGame() {
  // ---- Core state ----
  const gameView = ref<GameView>('menu')
  const playMode = ref<PlayMode>('level')
  const currentChallenge = ref<Challenge | null>(null)
  const selectedTechs = ref<Map<TechCategory, string>>(new Map())
  const lastResult = ref<EvaluationResult | null>(null)
  const showCustomerDialog = ref(false)

  // ---- Persistence ----
  const progress = useLocalStorage<GameProgress>('devops-challenge-progress', {
    unlockedLevel: 1,
    stars: {},
    totalStars: 0,
  })

  // ---- Engine ----
  const engine = useSimulationEngine(selectedTechs)

  // ---- Computed ----
  const totalStars = computed(() => {
    let total = 0
    for (const s of Object.values(progress.value.stars)) {
      total += s
    }
    return total
  })

  const selectedCategoriesCount = computed(() => selectedTechs.value.size)

  const canSubmit = computed(() => {
    if (!currentChallenge.value) return false
    const required = currentChallenge.value.constraints.requiredCategories
    return required.every((cat) => selectedTechs.value.has(cat))
  })

  const missingCategories = computed(() => {
    if (!currentChallenge.value) return []
    return currentChallenge.value.constraints.requiredCategories.filter(
      (cat) => !selectedTechs.value.has(cat),
    )
  })

  // ---- Actions ----
  function startLevel(levelId: number) {
    const challenge = challenges.find((c) => c.id === levelId)
    if (!challenge) return
    if (levelId > progress.value.unlockedLevel) return

    currentChallenge.value = challenge
    selectedTechs.value = new Map()
    lastResult.value = null
    showCustomerDialog.value = true
    gameView.value = 'playing'
  }

  function startRandom() {
    const randomIndex = Math.floor(Math.random() * challenges.length)
    const challenge = challenges[randomIndex]
    if (!challenge) return

    playMode.value = 'random'
    currentChallenge.value = challenge
    selectedTechs.value = new Map()
    lastResult.value = null
    showCustomerDialog.value = true
    gameView.value = 'playing'
  }

  function startCustom() {
    playMode.value = 'custom'
    currentChallenge.value = null
    selectedTechs.value = new Map()
    lastResult.value = null
    showCustomerDialog.value = false
    gameView.value = 'playing'
  }

  function selectTech(category: TechCategory, techId: string) {
    const newMap = new Map(selectedTechs.value)
    newMap.set(category, techId)
    selectedTechs.value = newMap
  }

  function deselectTech(category: TechCategory) {
    const newMap = new Map(selectedTechs.value)
    newMap.delete(category)
    selectedTechs.value = newMap
  }

  function submitSolution() {
    if (!currentChallenge.value) return
    if (!canSubmit.value) return

    const result = evaluateSolution(currentChallenge.value, engine.systemMetrics.value)
    lastResult.value = result

    // Update progress
    if (result.passed && currentChallenge.value) {
      const levelId = currentChallenge.value.id
      const currentStars = progress.value.stars[levelId] ?? 0
      if (result.stars > currentStars) {
        progress.value.stars[levelId] = result.stars
        progress.value.totalStars = totalStars.value
      }
      // Unlock next level
      if (levelId >= progress.value.unlockedLevel) {
        progress.value.unlockedLevel = levelId + 1
      }
    }

    gameView.value = 'result'
  }

  function nextLevel() {
    if (!currentChallenge.value) return
    const nextId = currentChallenge.value.id + 1
    const next = challenges.find((c) => c.id === nextId)
    if (next) {
      startLevel(nextId)
    } else {
      backToMenu()
    }
  }

  function retryLevel() {
    if (!currentChallenge.value) return
    startLevel(currentChallenge.value.id)
  }

  function backToMenu() {
    gameView.value = 'menu'
    currentChallenge.value = null
    selectedTechs.value = new Map()
    lastResult.value = null
    showCustomerDialog.value = false
  }

  function dismissCustomerDialog() {
    showCustomerDialog.value = false
  }

  function resetProgress() {
    progress.value = {
      unlockedLevel: 1,
      stars: {},
      totalStars: 0,
    }
  }

  return {
    // State
    gameView,
    playMode,
    currentChallenge,
    selectedTechs,
    lastResult,
    showCustomerDialog,
    progress,

    // Computed
    totalStars,
    selectedCategoriesCount,
    canSubmit,
    missingCategories,

    // Engine passthrough
    systemMetrics: engine.systemMetrics,
    warnings: engine.warnings,
    synergyPairs: engine.synergyPairs,
    conflictPairs: engine.conflictPairs,

    // Actions
    startLevel,
    startRandom,
    startCustom,
    selectTech,
    deselectTech,
    submitSolution,
    nextLevel,
    retryLevel,
    backToMenu,
    dismissCustomerDialog,
    resetProgress,
  }
}
