import { computed, ref } from 'vue'
import type { Idiom } from '../data/types'
import type { IdiomCategoryId } from '../data/categories'
import { idioms } from '../data/idioms'

export type QuizMode = 'classic' | 'time-attack'

export function useQuiz() {
  const mode = ref<QuizMode>('classic')
  const category = ref<IdiomCategoryId | 'all'>('all')
  const currentIndex = ref(0)
  const score = ref(0)
  const total = ref(10)
  const isFinished = ref(false)
  const isStarted = ref(false)
  const selectedAnswer = ref<string | null>(null)
  const showExplanation = ref(false)
  const questions = ref<Idiom[]>([])

  // Fisher-Yates shuffle
  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let j = a.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1))
      const tmp = a[j]
      a[j] = a[k]!
      a[k] = tmp!
    }
    return a
  }

  function startQuiz(quizMode: QuizMode, cat: IdiomCategoryId | 'all') {
    mode.value = quizMode
    category.value = cat
    currentIndex.value = 0
    score.value = 0
    isFinished.value = false
    isStarted.value = true
    selectedAnswer.value = null
    showExplanation.value = false

    const pool = cat === 'all' ? [...idioms] : idioms.filter((i) => i.category === cat)
    questions.value = shuffle(pool).slice(0, total.value)
  }

  const currentQuestion = computed(() => questions.value[currentIndex.value])

  const answers = computed(() => {
    const q = currentQuestion.value
    if (!q) return []
    const all = [q.meaning_vi, ...q.wrong_answers]
    return shuffle(all)
  })

  const progress = computed(() => ({
    current: currentIndex.value + 1,
    total: questions.value.length,
    percent: questions.value.length > 0 ? (currentIndex.value / questions.value.length) * 100 : 0,
  }))

  function selectAnswer(answer: string) {
    if (selectedAnswer.value !== null) return
    selectedAnswer.value = answer
    showExplanation.value = true
    if (answer === currentQuestion.value?.meaning_vi) {
      score.value++
    }
  }

  function nextQuestion() {
    if (currentIndex.value < questions.value.length - 1) {
      currentIndex.value++
      selectedAnswer.value = null
      showExplanation.value = false
    } else {
      isFinished.value = true
    }
  }

  function resetQuiz() {
    isStarted.value = false
    isFinished.value = false
    currentIndex.value = 0
    score.value = 0
    selectedAnswer.value = null
    showExplanation.value = false
    questions.value = []
  }

  const resultMessage = computed(() => {
    const ratio = questions.value.length > 0 ? score.value / questions.value.length : 0
    if (ratio === 1) return '🏆 Perfect! Mày là thiên tài ngôn ngữ!'
    if (ratio >= 0.7) return '🔥 Giỏi lắm! Gần perfect rồi!'
    if (ratio >= 0.4) return '💪 Tạm được! Cố thêm chút nữa!'
    return '😅 Hmm... quay lại học flashcard rồi thử lại nha!'
  })

  const xpEarned = computed(() => {
    const ratio = questions.value.length > 0 ? score.value / questions.value.length : 0
    if (ratio === 1) return 100
    if (ratio >= 0.7) return 60
    if (ratio >= 0.4) return 30
    return 10
  })

  return {
    mode,
    category,
    currentIndex,
    score,
    total,
    isFinished,
    isStarted,
    selectedAnswer,
    showExplanation,
    questions,
    currentQuestion,
    answers,
    progress,
    selectAnswer,
    nextQuestion,
    startQuiz,
    resetQuiz,
    resultMessage,
    xpEarned,
  }
}
