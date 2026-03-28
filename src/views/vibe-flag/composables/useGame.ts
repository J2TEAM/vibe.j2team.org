import { ref, computed } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import type { GameMode, GameState, GameStats, Question, RankInfo } from '../types'
import { GAME_CONFIGS, RANKS } from '../types'
import { useCountries } from './useCountries'

export function useGame() {
  const { generateQuestion, loadCountries } = useCountries()

  const gameState = ref<GameState>('menu')
  const currentMode = ref<GameMode>('classic')
  const currentQuestion = ref<Question | null>(null)
  const questionIndex = ref(0)
  const usedCodes = ref<string[]>([])
  const timeLeft = ref(10)
  const selectedAnswer = ref<string | null>(null)
  const isAnswered = ref(false)

  const stats = ref<GameStats>({
    score: 0,
    correct: 0,
    wrong: 0,
    streak: 0,
    maxStreak: 0,
    lives: 3,
    wrongCountries: [],
    timeBonus: 0,
  })

  const config = computed(() => GAME_CONFIGS[currentMode.value])

  const accuracy = computed(() => {
    const total = stats.value.correct + stats.value.wrong
    return total === 0 ? 0 : Math.round((stats.value.correct / total) * 100)
  })

  const rank = computed((): RankInfo => {
    const found = RANKS.find((r) => accuracy.value >= r.minScore)
    // RANKS[length-1] always exists (minScore: 0 catches all), safe to assert
    return found ?? (RANKS[RANKS.length - 1] as RankInfo)
  })

  const isGameOver = computed(() => {
    if (currentMode.value === 'survival' && stats.value.lives <= 0) return true
    if (currentMode.value !== 'survival' && questionIndex.value >= config.value.totalQuestions)
      return true
    return false
  })

  const { pause: pauseTimer, resume: resumeTimer } = useIntervalFn(
    () => {
      if (timeLeft.value > 0) {
        timeLeft.value--
      } else {
        handleTimeout()
      }
    },
    1000,
    { immediate: false },
  )

  async function startGame(mode: GameMode) {
    await loadCountries()
    currentMode.value = mode
    questionIndex.value = 0
    usedCodes.value = []
    selectedAnswer.value = null
    isAnswered.value = false
    stats.value = {
      score: 0,
      correct: 0,
      wrong: 0,
      streak: 0,
      maxStreak: 0,
      lives: config.value.maxLives,
      wrongCountries: [],
      timeBonus: 0,
    }
    gameState.value = 'playing'
    nextQuestion()
  }

  function nextQuestion() {
    if (isGameOver.value) {
      endGame()
      return
    }
    selectedAnswer.value = null
    isAnswered.value = false
    timeLeft.value = config.value.timePerQuestion
    currentQuestion.value = generateQuestion(usedCodes.value)
    if (currentQuestion.value) {
      usedCodes.value.push(currentQuestion.value.correct.code)
    }
    resumeTimer()
  }

  function handleAnswer(code: string) {
    if (isAnswered.value) return
    pauseTimer()
    isAnswered.value = true
    selectedAnswer.value = code

    const isCorrect = code === currentQuestion.value?.correct.code

    if (isCorrect) {
      const bonus = Math.floor(timeLeft.value * 5)
      stats.value.timeBonus += bonus
      stats.value.score += 100 + bonus + stats.value.streak * 10
      stats.value.correct++
      stats.value.streak++
      if (stats.value.streak > stats.value.maxStreak) {
        stats.value.maxStreak = stats.value.streak
      }
    } else {
      stats.value.wrong++
      stats.value.streak = 0
      if (currentMode.value === 'survival') {
        stats.value.lives--
      }
      if (currentQuestion.value) {
        stats.value.wrongCountries.push(currentQuestion.value.correct)
      }
    }

    questionIndex.value++

    setTimeout(() => {
      if (isGameOver.value) {
        endGame()
      } else {
        nextQuestion()
      }
    }, 1200)
  }

  function handleTimeout() {
    if (isAnswered.value) return
    handleAnswer('')
  }

  function endGame() {
    pauseTimer()
    gameState.value = 'result'
  }

  function backToMenu() {
    pauseTimer()
    gameState.value = 'menu'
    currentQuestion.value = null
    selectedAnswer.value = null
    isAnswered.value = false
  }

  return {
    gameState,
    currentMode,
    currentQuestion,
    questionIndex,
    timeLeft,
    selectedAnswer,
    isAnswered,
    stats,
    config,
    accuracy,
    rank,
    isGameOver,
    startGame,
    handleAnswer,
    backToMenu,
  }
}
