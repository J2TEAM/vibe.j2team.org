import { computed, ref, shallowRef, watch } from 'vue'
import type { DevilResult, MbtiResult, QuizPhase, QuizQuestion, ScoreMap } from '../types'
import { useLocale } from './useLocale'

const DEVIL_THRESHOLD = 3

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  return res.json() as Promise<T>
}

export function useQuiz() {
  const { locale } = useLocale()

  const phase = ref<QuizPhase>('intro')
  const currentIndex = ref(0)
  const answers = ref<string[]>([])
  const devilCount = ref(0)
  const loading = ref(true)

  const questionsVi = shallowRef<QuizQuestion[]>([])
  const questionsEn = shallowRef<QuizQuestion[]>([])
  const resultsVi = shallowRef<Record<string, MbtiResult>>({})
  const resultsEn = shallowRef<Record<string, MbtiResult>>({})
  const devilResultVi = shallowRef<DevilResult | null>(null)
  const devilResultEn = shallowRef<DevilResult | null>(null)

  // Load Vietnamese data immediately (default locale)
  const loadVi = Promise.all([
    fetchJson<QuizQuestion[]>('/data/it-mbti-questions-vi.json').then((d) => {
      questionsVi.value = d
    }),
    fetchJson<{ results: Record<string, MbtiResult>; devilResult: DevilResult }>(
      '/data/it-mbti-results-vi.json',
    ).then((d) => {
      resultsVi.value = d.results
      devilResultVi.value = d.devilResult
    }),
  ])

  loadVi.then(() => {
    loading.value = false
  })

  // Load English data lazily when needed
  let enLoaded = false
  watch(
    locale,
    (val) => {
      if (val === 'en' && !enLoaded) {
        enLoaded = true
        Promise.all([
          fetchJson<QuizQuestion[]>('/data/it-mbti-questions-en.json').then((d) => {
            questionsEn.value = d
          }),
          fetchJson<{ results: Record<string, MbtiResult>; devilResult: DevilResult }>(
            '/data/it-mbti-results-en.json',
          ).then((d) => {
            resultsEn.value = d.results
            devilResultEn.value = d.devilResult
          }),
        ])
      }
    },
    { immediate: true },
  )

  const questions = computed(() => (locale.value === 'vi' ? questionsVi.value : questionsEn.value))
  const currentQuestion = computed<QuizQuestion | null>(
    () => questions.value[currentIndex.value] ?? null,
  )

  const progress = computed(() => ({
    current: currentIndex.value + 1,
    total: questions.value.length,
    pct:
      questions.value.length > 0
        ? Math.round((currentIndex.value / questions.value.length) * 100)
        : 0,
  }))

  function handleAnswer(label: string) {
    if (!currentQuestion.value) return
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

  const activeResults = computed(() => (locale.value === 'vi' ? resultsVi.value : resultsEn.value))
  const mbtiResult = computed<MbtiResult | null>(
    () => activeResults.value[mbtiType.value] ?? activeResults.value['INTJ'] ?? null,
  )

  const devilResult = computed(() =>
    locale.value === 'vi' ? devilResultVi.value : devilResultEn.value,
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
    loading,
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
