import { ref, computed } from 'vue'
import type { Question, PersonalityType, QuizResult, QuizState } from '../types'
import { calculateResult, shuffleQuestions } from './useScoring'

const STORAGE_KEY = 'mbti-results'
const PROGRESS_KEY = 'trac-nghiem-progress'

interface QuizProgress {
  questionIds: number[]
  currentIndex: number
  answers: Record<number, number>
}

export function useQuiz() {
  const quizState = ref<QuizState>('welcome')
  const questions = ref<Question[]>([])
  const personalities = ref<PersonalityType[]>([])
  const currentQuestionIndex = ref(0)
  const answers = ref<Record<number, number>>({})
  const result = ref<QuizResult | null>(null)
  const history = ref<QuizResult[]>([])
  const isLoading = ref(true)

  // Progress state
  const hasSavedProgress = ref(false)
  const savedAnswersCount = ref(0)
  const isStarting = ref(false) // Loading when clicking start/continue

  // Load từ localStorage - chỉ gọi khi cần (khởi động hoặc refresh page)
  // Không gọi khi đang trong quiz vì state đã được sync trong memory
  function loadFromStorage() {
    // Nếu đang trong quiz, không load lại (state đã up-to-date trong memory)
    if (quizState.value === 'quiz') {
      console.log('[Quiz] Skipping loadFromStorage, currently in quiz')
      return
    }

    try {
      // Load history
      const storedHistory = localStorage.getItem(STORAGE_KEY)
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory)
        if (Array.isArray(parsed)) {
          history.value = parsed
        }
      }

      // Load progress (only when not in quiz)
      const storedProgress = localStorage.getItem(PROGRESS_KEY)
      if (storedProgress) {
        const parsed: QuizProgress = JSON.parse(storedProgress)
        if (parsed && parsed.answers) {
          const answerCount = Object.keys(parsed.answers).length
          if (answerCount > 0) {
            hasSavedProgress.value = true
            savedAnswersCount.value = answerCount
            console.log('[Quiz] Found saved progress:', answerCount, 'answers')
          }
        }
      }
    } catch (e) {
      console.error('[Quiz] Error loading from localStorage:', e)
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(PROGRESS_KEY)
    }
  }

  // Save to localStorage
  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value))
    } catch (e) {
      console.error('[Quiz] Error saving to localStorage:', e)
    }
  }

  // Save progress
  function saveProgress() {
    if (quizState.value !== 'quiz' || questions.value.length === 0) return

    try {
      const progress: QuizProgress = {
        questionIds: questions.value.map((q) => q.id),
        currentIndex: currentQuestionIndex.value,
        answers: { ...answers.value },
      }
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
      savedAnswersCount.value = Object.keys(answers.value).length
      console.log('[Quiz] Progress saved:', savedAnswersCount.value, 'answers')
    } catch (e) {
      console.error('[Quiz] Error saving progress:', e)
    }
  }

  // Clear progress
  function clearProgress() {
    localStorage.removeItem(PROGRESS_KEY)
    hasSavedProgress.value = false
    savedAnswersCount.value = 0
  }

  // Computed
  const currentQuestion = computed(() => questions.value[currentQuestionIndex.value])

  const progress = computed(() => {
    if (questions.value.length === 0) return 0
    return Math.round(((currentQuestionIndex.value + 1) / questions.value.length) * 100)
  })

  const progressText = computed(() => {
    return `${currentQuestionIndex.value + 1} / ${questions.value.length}`
  })

  const currentDimension = computed(() => {
    if (!currentQuestion.value) return null
    return currentQuestion.value.dimension
  })

  // Load quiz data
  async function loadData() {
    console.log('[Quiz] loadData called')
    loadFromStorage()

    try {
      const [questionsRes, personalitiesRes] = await Promise.all([
        fetch('/trac-nghiem-tinh-cach/questions.json'),
        fetch('/trac-nghiem-tinh-cach/personalities.json'),
      ])

      const questionsData = await questionsRes.json()
      const personalitiesData = await personalitiesRes.json()

      questions.value = shuffleQuestions(questionsData)
      personalities.value = personalitiesData.personalities

      console.log('[Quiz] Data loaded, hasSavedProgress:', hasSavedProgress.value)
    } catch (error) {
      console.error('[Quiz] Failed to load quiz data:', error)
    } finally {
      isLoading.value = false
    }
  }

  // Continue from saved progress
  async function continueQuiz() {
    isStarting.value = true
    // Small delay for UX
    await new Promise((r) => setTimeout(r, 200))

    try {
      const storedProgress = localStorage.getItem(PROGRESS_KEY)
      if (storedProgress) {
        const parsed: QuizProgress = JSON.parse(storedProgress)
        currentQuestionIndex.value = parsed.currentIndex || 0
        answers.value = parsed.answers || {}
        quizState.value = 'quiz'
        console.log('[Quiz] Resumed from saved progress')
      }
    } catch (e) {
      console.error('[Quiz] Error resuming:', e)
      clearProgress()
    } finally {
      isStarting.value = false
    }
  }

  // Start fresh
  async function startQuiz() {
    isStarting.value = true
    // Small delay for UX
    await new Promise((r) => setTimeout(r, 500))

    clearProgress()
    questions.value = shuffleQuestions([...questions.value])
    currentQuestionIndex.value = 0
    answers.value = {}
    result.value = null
    quizState.value = 'quiz'
    isStarting.value = false
  }

  // Handle answer
  function answerQuestion(score: number) {
    if (!currentQuestion.value) return

    answers.value[currentQuestion.value.id] = score
    saveProgress()

    if (currentQuestionIndex.value < questions.value.length - 1) {
      currentQuestionIndex.value++
    } else {
      finishQuiz()
    }
  }

  function nextQuestion() {
    if (currentQuestionIndex.value < questions.value.length - 1) {
      currentQuestionIndex.value++
      saveProgress()
    }
  }

  function prevQuestion() {
    if (currentQuestionIndex.value > 0) {
      currentQuestionIndex.value--
      saveProgress()
    }
  }

  function finishQuiz() {
    if (Object.keys(answers.value).length === 0) return

    const quizResult = calculateResult(answers.value, questions.value)
    const personality = personalities.value.find((p) => p.code === quizResult.type)

    if (personality) {
      result.value = { ...quizResult, personality }
    } else {
      result.value = quizResult
    }

    // Save to history
    const existing = history.value || []
    const updated = [result.value, ...existing].slice(0, 10)
    history.value = updated
    saveToStorage()

    // Clear progress
    clearProgress()
    quizState.value = 'result'
  }

  function retakeQuiz() {
    questions.value = shuffleQuestions([...questions.value])
    startQuiz()
  }

  function backToWelcome() {
    quizState.value = 'welcome'
  }

  // History functions
  function viewHistory() {
    quizState.value = 'history'
  }

  function loadFromHistory(index: number) {
    const items = history.value || []
    if (items[index]) {
      const historicalResult = items[index]
      const personality = personalities.value.find((p) => p.code === historicalResult.type)
      result.value = personality ? { ...historicalResult, personality } : historicalResult
      quizState.value = 'result'
    }
  }

  function deleteHistoryItem(index: number) {
    const items = [...history.value]
    items.splice(index, 1)
    history.value = items
    saveToStorage()
  }

  return {
    quizState,
    questions,
    personalities,
    currentQuestionIndex,
    answers,
    result,
    history,
    isLoading,
    isStarting,
    hasSavedProgress,
    savedAnswersCount,
    currentQuestion,
    progress,
    progressText,
    currentDimension,
    loadData,
    loadFromStorage,
    continueQuiz,
    startQuiz,
    answerQuestion,
    nextQuestion,
    prevQuestion,
    finishQuiz,
    retakeQuiz,
    backToWelcome,
    viewHistory,
    loadFromHistory,
    deleteHistoryItem,
  }
}
