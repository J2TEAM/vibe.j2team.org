import { computed, ref } from 'vue'
import { LESSON_STEPS, QUIZ_QUESTIONS } from '../data'

export function useLessonMode() {
  const lessonModeEnabled = ref(true)
  const currentStepIndex = ref(0)
  const completedStepIds = ref<string[]>([])

  const quizAnswers = ref<Record<string, string>>({})
  const quizSubmitted = ref(false)

  const currentStep = computed(() => LESSON_STEPS[currentStepIndex.value] ?? LESSON_STEPS[0]!)

  const isFirstStep = computed(() => currentStepIndex.value <= 0)

  const isLastStep = computed(() => currentStepIndex.value >= LESSON_STEPS.length - 1)

  const completedStepsCount = computed(() => completedStepIds.value.length)

  const answeredCount = computed(() => {
    let total = 0
    for (const question of QUIZ_QUESTIONS) {
      if (quizAnswers.value[question.id]) {
        total++
      }
    }
    return total
  })

  const canSubmitQuiz = computed(() => answeredCount.value === QUIZ_QUESTIONS.length)

  const quizScore = computed(() => {
    let total = 0

    for (const question of QUIZ_QUESTIONS) {
      const selectedChoiceId = quizAnswers.value[question.id]
      if (selectedChoiceId && selectedChoiceId === question.correctChoiceId) {
        total++
      }
    }

    return total
  })

  const quizScorePercent = computed(() => {
    if (QUIZ_QUESTIONS.length === 0) return 0
    return Math.round((quizScore.value / QUIZ_QUESTIONS.length) * 100)
  })

  function toggleLessonMode() {
    lessonModeEnabled.value = !lessonModeEnabled.value
  }

  function goToStep(index: number) {
    currentStepIndex.value = Math.max(0, Math.min(LESSON_STEPS.length - 1, index))
  }

  function previousStep() {
    if (isFirstStep.value) return
    currentStepIndex.value -= 1
  }

  function nextStep() {
    if (isLastStep.value) return
    currentStepIndex.value += 1
  }

  function markCurrentStepDone() {
    const currentStepId = currentStep.value.id
    if (completedStepIds.value.includes(currentStepId)) {
      return
    }

    completedStepIds.value = [...completedStepIds.value, currentStepId]
  }

  function selectQuizAnswer(questionId: string, choiceId: string) {
    if (quizSubmitted.value) return

    quizAnswers.value = {
      ...quizAnswers.value,
      [questionId]: choiceId,
    }
  }

  function submitQuiz() {
    if (!canSubmitQuiz.value) return
    quizSubmitted.value = true
  }

  function resetQuiz() {
    quizAnswers.value = {}
    quizSubmitted.value = false
  }

  return {
    lessonModeEnabled,
    currentStep,
    currentStepIndex,
    isFirstStep,
    isLastStep,
    completedStepIds,
    completedStepsCount,
    quizAnswers,
    quizSubmitted,
    answeredCount,
    canSubmitQuiz,
    quizScore,
    quizScorePercent,
    lessonSteps: LESSON_STEPS,
    quizQuestions: QUIZ_QUESTIONS,
    toggleLessonMode,
    goToStep,
    previousStep,
    nextStep,
    markCurrentStepDone,
    selectQuizAnswer,
    submitQuiz,
    resetQuiz,
  }
}
