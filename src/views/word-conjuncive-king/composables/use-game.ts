import { ref, computed, onUnmounted } from 'vue'
import type { GameMode, GameScreen, WordHistoryItem } from '../types'
import { useWordChain } from './use-word-chain'
import { useCombo } from './use-combo'
import { useLeaderboard } from './use-leaderboard'
import { useSfx } from './use-sfx'

const TURN_TIME = 30000
const MAX_HEARTS = 3
const BASE_SCORE = 10

export function useGame() {
  const screen = ref<GameScreen>('welcome')
  const mode = ref<GameMode>('normal')
  const score = ref(0)
  const hearts = ref(MAX_HEARTS)
  const wordsCount = ref(0)
  const currentWord = ref('')
  const wordHistory = ref<WordHistoryItem[]>([])
  const inputValue = ref('')
  const isShaking = ref(false)
  const shakePower = ref(0)
  const feedbackMessage = ref('')
  const feedbackType = ref<'success' | 'error' | ''>('')

  const turnTimeRemaining = ref(TURN_TIME)
  const turnTimerStart = ref(0)
  let turnInterval: ReturnType<typeof setInterval> | null = null

  const turnProgress = computed(() => turnTimeRemaining.value / TURN_TIME)
  const isUrgent = computed(() => turnTimeRemaining.value <= 10000)

  const { normalizeWord, isValidChain, wordExistsInDict, botPickWord, getRandomStartWord } =
    useWordChain()
  const combo = useCombo()
  const leaderboard = useLeaderboard()
  const sfx = useSfx()

  function startTurnTimer() {
    stopTurnTimer()
    turnTimerStart.value = Date.now()
    turnTimeRemaining.value = TURN_TIME

    turnInterval = setInterval(() => {
      const elapsed = Date.now() - turnTimerStart.value
      turnTimeRemaining.value = Math.max(0, TURN_TIME - elapsed)

      if (turnTimeRemaining.value <= 0) {
        onTimeUp()
      }
    }, 50)
  }

  function stopTurnTimer() {
    if (turnInterval) {
      clearInterval(turnInterval)
      turnInterval = null
    }
  }

  function resetTurnTimer() {
    turnTimerStart.value = Date.now()
    turnTimeRemaining.value = TURN_TIME
  }

  function onTimeUp() {
    stopTurnTimer()
    hearts.value = 0
    endGame()
  }

  function startGame(selectedMode: GameMode) {
    mode.value = selectedMode
    screen.value = 'playing'
    score.value = 0
    hearts.value = MAX_HEARTS
    wordsCount.value = 0
    wordHistory.value = []
    inputValue.value = ''
    feedbackMessage.value = ''
    feedbackType.value = ''
    combo.resetCombo()

    const startWord = getRandomStartWord()
    currentWord.value = startWord
    wordHistory.value.push({ word: startWord, isBot: true, isCorrect: true })

    startTurnTimer()
  }

  function submitAnswer() {
    const userAnswer = normalizeWord(inputValue.value)
    inputValue.value = ''

    if (!userAnswer) return

    if (!isValidChain(currentWord.value, userAnswer)) {
      onWrongAnswer(userAnswer, 'Từ không nối đúng!')
      return
    }

    if (!wordExistsInDict(userAnswer)) {
      onWrongAnswer(userAnswer, 'Từ không có trong từ điển!')
      return
    }

    const alreadyUsed = wordHistory.value.some(
      (h) => normalizeWord(h.word) === userAnswer && h.isCorrect,
    )
    if (alreadyUsed) {
      onWrongAnswer(userAnswer, 'Từ đã được dùng rồi!')
      return
    }

    onCorrectAnswer(userAnswer)
  }

  function onCorrectAnswer(word: string) {
    sfx.playCorrect()
    wordHistory.value.push({ word, isBot: false, isCorrect: true })
    wordsCount.value++
    combo.incrementStreak()

    const multiplier = combo.getMultiplier()
    score.value += BASE_SCORE * multiplier

    const lvl = combo.comboLevel.value
    if (lvl >= 3) {
      triggerShake(lvl >= 4 ? 2 : 1)
    }

    currentWord.value = word
    feedbackMessage.value = `+${BASE_SCORE * multiplier} điểm!`
    feedbackType.value = 'success'
    clearFeedbackLater()

    resetTurnTimer()

    if (mode.value === 'normal') {
      botTurn()
    }
  }

  function botTurn() {
    const botAnswer = botPickWord(currentWord.value)
    if (!botAnswer) {
      const newWord = getRandomStartWord()
      currentWord.value = newWord
      wordHistory.value.push({ word: newWord, isBot: true, isCorrect: true })
      feedbackMessage.value = 'Bot bí rồi! Từ mới nè~'
      feedbackType.value = 'success'
      clearFeedbackLater()
      return
    }

    wordHistory.value.push({ word: botAnswer, isBot: true, isCorrect: true })
    currentWord.value = botAnswer
  }

  function onWrongAnswer(word: string, message: string) {
    sfx.playWrong()
    wordHistory.value.push({ word, isBot: false, isCorrect: false })
    hearts.value--
    feedbackMessage.value = message
    feedbackType.value = 'error'
    clearFeedbackLater()

    // Sai chỉ mất tim, KHÔNG mất combo, KHÔNG reset timer
    if (hearts.value <= 0) {
      endGame()
    }
  }

  function triggerShake(power: number) {
    shakePower.value = power
    isShaking.value = true
    setTimeout(() => {
      isShaking.value = false
    }, 300)
  }

  let feedbackTimeout: ReturnType<typeof setTimeout> | null = null
  function clearFeedbackLater() {
    if (feedbackTimeout) clearTimeout(feedbackTimeout)
    feedbackTimeout = setTimeout(() => {
      feedbackMessage.value = ''
      feedbackType.value = ''
    }, 2000)
  }

  function endGame() {
    stopTurnTimer()
    combo.dispose()
    screen.value = 'gameover'

    leaderboard.addScore(mode.value, {
      score: score.value,
      maxCombo: combo.maxCombo.value,
      wordsCount: wordsCount.value,
      date: new Date().toLocaleDateString('vi-VN'),
    })
  }

  function goToWelcome() {
    stopTurnTimer()
    combo.dispose()
    screen.value = 'welcome'
  }

  onUnmounted(() => {
    stopTurnTimer()
    combo.dispose()
    if (feedbackTimeout) clearTimeout(feedbackTimeout)
  })

  return {
    screen,
    mode,
    score,
    hearts,
    wordsCount,
    currentWord,
    wordHistory,
    inputValue,
    isShaking,
    shakePower,
    feedbackMessage,
    feedbackType,
    turnTimeRemaining,
    turnProgress,
    isUrgent,

    combo,

    startGame,
    submitAnswer,
    goToWelcome,
    endGame,

    sfx,

    leaderboard,

    MAX_HEARTS,
    TURN_TIME,
  }
}
