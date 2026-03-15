import { ref, computed } from 'vue'
import { useIntervalFn, useLocalStorage } from '@vueuse/core'
import { VIM_QUESTIONS } from '../data/questions'

export type GameState = 'MENU' | 'PLAYING' | 'RESULT'

export function useVimGame() {
  const state = ref<GameState>('MENU')
  const currentLevelId = ref(1)
  const currentQuestionIndex = ref(0)
  const score = ref(0)
  const time = ref(0)
  const inputBuffer = ref<string[]>([])
  const isWrong = ref(false)
  const showHint = ref(false)

  // Local storage for unlocked levels
  const unlockedLevels = useLocalStorage<number[]>('vim-challenge-unlocked', [1])

  const levelQuestions = computed(() =>
    VIM_QUESTIONS.filter((q) => q.level === currentLevelId.value),
  )

  const currentQuestion = computed(() => {
    return levelQuestions.value[currentQuestionIndex.value]
  })

  const hintText = computed(() => {
    const currentQ = currentQuestion.value
    if (!currentQ) return ''

    // Find the first answer that starts with the current buffer
    const potentialAnswer = currentQ.answers.find((ans) =>
      inputBuffer.value.every((k, i) => k === ans[i]),
    )

    if (potentialAnswer) {
      return potentialAnswer.join(' ')
    }
    return currentQ.answers[0]?.join(' ') || ''
  })

  const progress = computed(() => {
    if (!levelQuestions.value.length) return 0
    return Math.floor((currentQuestionIndex.value / levelQuestions.value.length) * 100)
  })

  const { pause, resume } = useIntervalFn(
    () => {
      time.value++
    },
    1000,
    { immediate: false },
  )

  const startGame = (levelId: number) => {
    currentLevelId.value = levelId
    currentQuestionIndex.value = 0
    score.value = 0
    time.value = 0
    inputBuffer.value = []
    showHint.value = false
    state.value = 'PLAYING'
    resume()
  }

  const resetGame = () => {
    state.value = 'MENU'
    pause()
  }

  const handleKey = (key: string) => {
    if (state.value !== 'PLAYING') return

    // Update activity
    showHint.value = false

    // Ignore modifier keys alone
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) return

    inputBuffer.value.push(key)
    isWrong.value = false

    const currentQ = currentQuestion.value
    if (!currentQ) return

    // Check if the current buffer matches any answer
    const match = currentQ.answers.find((ans) => {
      if (ans.length !== inputBuffer.value.length) return false
      return ans.every((k, i) => k === inputBuffer.value[i])
    })

    if (match) {
      // Correct answer!
      score.value += 10
      nextQuestion()
    } else {
      // Check if the buffer is still a potential prefix for any answer
      const isPrefix = currentQ.answers.some((ans) => {
        return (
          ans.length > inputBuffer.value.length && inputBuffer.value.every((k, i) => k === ans[i])
        )
      })

      if (!isPrefix) {
        // Wrong key sequence
        isWrong.value = true
        inputBuffer.value = []
        // Shake effect can be triggered by isWrong
        setTimeout(() => {
          isWrong.value = false
        }, 500)
      }
    }
  }

  const nextQuestion = () => {
    inputBuffer.value = []
    showHint.value = false
    if (currentQuestionIndex.value < levelQuestions.value.length - 1) {
      currentQuestionIndex.value++
    } else {
      // Level complete
      finishLevel()
    }
  }

  const finishLevel = () => {
    state.value = 'RESULT'
    pause()

    // Unlock next level
    if (currentLevelId.value < 5 && !unlockedLevels.value.includes(currentLevelId.value + 1)) {
      unlockedLevels.value.push(currentLevelId.value + 1)
    }
  }

  const toggleHint = () => {
    showHint.value = !showHint.value
  }

  return {
    state,
    currentLevelId,
    currentQuestion,
    score,
    time,
    progress,
    inputBuffer,
    isWrong,
    showHint,
    hintText,
    unlockedLevels,
    startGame,
    resetGame,
    handleKey,
    toggleHint,
  }
}
