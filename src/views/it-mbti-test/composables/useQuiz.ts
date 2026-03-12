import { computed, ref } from 'vue'
import { questions } from '../data/questions'
import { devilResult, results } from '../data/results'
import type { MbtiResult, QuizPhase, QuizQuestion, ScoreMap } from '../types'

const DEVIL_THRESHOLD = 3

export function useQuiz() {
  const phase = ref<QuizPhase>('intro')
  const currentIndex = ref(0)
  const answers = ref<string[]>([])
  const devilCount = ref(0)

  const currentQuestion = computed<QuizQuestion>(
    () => questions[currentIndex.value] as QuizQuestion,
  )

  const progress = computed(() => ({
    current: currentIndex.value + 1,
    total: questions.length,
    pct: Math.round((currentIndex.value / questions.length) * 100),
  }))

  function handleAnswer(label: string) {
    const opt = currentQuestion.value.options.find((o) => o.label === label)
    if (opt?.trait === 'hidden') devilCount.value++

    answers.value = [...answers.value.slice(0, currentIndex.value), label]

    if (currentIndex.value < questions.length - 1) {
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
      const q = questions[idx]
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

  const mbtiResult = computed<MbtiResult>(
    () => (results[mbtiType.value] ?? results['INTJ']) as MbtiResult,
  )

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
