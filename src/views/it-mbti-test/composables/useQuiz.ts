import { computed, ref } from 'vue'
import { questions as questionsVi } from '../data/questions'
import { questionsEn } from '../data/questions.en'
import { devilResult as devilResultVi, results as resultsVi } from '../data/results'
import { devilResultEn, resultsEn } from '../data/results.en'
import type { MbtiResult, QuizPhase, QuizQuestion, ScoreMap } from '../types'
import { useLocale } from './useLocale'

const DEVIL_THRESHOLD = 3

export function useQuiz() {
  const { locale } = useLocale()

  const phase = ref<QuizPhase>('intro')
  const currentIndex = ref(0)
  const answers = ref<string[]>([])
  const devilCount = ref(0)

  const questions = computed(() => (locale.value === 'vi' ? questionsVi : questionsEn))
  const currentQuestion = computed<QuizQuestion>(
    () => questions.value[currentIndex.value] as QuizQuestion,
  )

  const progress = computed(() => ({
    current: currentIndex.value + 1,
    total: questions.value.length,
    pct: Math.round((currentIndex.value / questions.value.length) * 100),
  }))

  function handleAnswer(label: string) {
    const opt = currentQuestion.value.options.find((o) => o.label === label)
    if (opt?.trait === 'hidden') devilCount.value++

    answers.value = [...answers.value.slice(0, currentIndex.value), label]

    if (currentIndex.value < questions.value.length - 1) {
      currentIndex.value++
    } else {
      phase.value = 'calculating'
      setTimeout(() => {
        phase.value = 'result'
      }, 2000)
    }
  }

  const scores = computed<ScoreMap>(() => {
    const s: ScoreMap = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }

    answers.value.forEach((answer, idx) => {
      const q = questions.value[idx]
      if (!q || !answer) return

      const opt = q.options.find((o) => o.label === answer)
      if (!opt || opt.trait === 'hidden') return

      s[opt.trait] += opt.score
    })

    return s
  })

  const mbtiType = computed(() => {
    const s = scores.value
    return (
      (s.E >= s.I ? 'E' : 'I') +
      (s.S >= s.N ? 'S' : 'N') +
      (s.T >= s.F ? 'T' : 'F') +
      (s.J >= s.P ? 'J' : 'P')
    )
  })

  const activeResults = computed(() => (locale.value === 'vi' ? resultsVi : resultsEn))
  const mbtiResult = computed<MbtiResult>(
    () => (activeResults.value[mbtiType.value] ?? activeResults.value['INTJ']) as MbtiResult,
  )

  const devilResult = computed(() => (locale.value === 'vi' ? devilResultVi : devilResultEn))

  const traitPcts = computed(() => {
    const s = scores.value
    const calc = (a: number, b: number) => (a + b > 0 ? Math.round((a / (a + b)) * 100) : 50)
    return {
      E: calc(s.E, s.I),
      I: calc(s.I, s.E),
      S: calc(s.S, s.N),
      N: calc(s.N, s.S),
      T: calc(s.T, s.F),
      F: calc(s.F, s.T),
      J: calc(s.J, s.P),
      P: calc(s.P, s.J),
    }
  })

  const showDevilPanel = computed(() => devilCount.value > DEVIL_THRESHOLD)

  function resetQuiz() {
    phase.value = 'intro'
    currentIndex.value = 0
    answers.value = []
    devilCount.value = 0
  }

  return {
    phase,
    currentIndex,
    currentQuestion,
    progress,
    handleAnswer,
    scores,
    mbtiType,
    mbtiResult,
    traitPcts,
    devilCount,
    showDevilPanel,
    devilResult,
    resetQuiz,
  }
}
