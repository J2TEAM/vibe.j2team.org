<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { LEVEL_META, QUESTION_BANK } from './question-bank'
import type { ChoiceId, QuizLevel, QuizQuestion } from './types'

const levels: QuizLevel[] = ['easy', 'medium', 'hard']

const selectedLevel = ref<QuizLevel>('easy')
const currentIndex = ref(0)
const selectedChoice = ref<ChoiceId | null>(null)
const submitted = ref(false)
const pickedByQuestion = ref<Record<string, ChoiceId>>({})
const answeredByQuestion = ref<Record<string, boolean>>({})
const correctByQuestion = ref<Record<string, boolean>>({})

const currentQuestions = computed(() => QUESTION_BANK[selectedLevel.value])

const currentQuestion = computed<QuizQuestion | null>(() => {
  return currentQuestions.value[currentIndex.value] ?? null
})

const currentQuestionId = computed(() => currentQuestion.value?.id ?? null)
const currentLevelMeta = computed(() => LEVEL_META[selectedLevel.value])
const isLastQuestion = computed(() => currentIndex.value === currentQuestions.value.length - 1)
const hasSelection = computed(() => selectedChoice.value !== null)

const score = computed(() => {
  return currentQuestions.value.reduce((total, question) => {
    return total + (correctByQuestion.value[question.id] ? 1 : 0)
  }, 0)
})

const answeredCount = computed(() => {
  return currentQuestions.value.reduce((total, question) => {
    return total + (answeredByQuestion.value[question.id] ? 1 : 0)
  }, 0)
})

const totalQuestions = computed(() => {
  return levels.reduce((total, level) => total + QUESTION_BANK[level].length, 0)
})

const totalCorrect = computed(() => {
  return levels.reduce((total, level) => {
    return (
      total
      + QUESTION_BANK[level].reduce((acc, question) => {
        return acc + (correctByQuestion.value[question.id] ? 1 : 0)
      }, 0)
    )
  }, 0)
})

const levelStats = computed(() => {
  return levels.map((level) => {
    const questions = QUESTION_BANK[level]
    const answered = questions.reduce((total, question) => {
      return total + (answeredByQuestion.value[question.id] ? 1 : 0)
    }, 0)
    const correct = questions.reduce((total, question) => {
      return total + (correctByQuestion.value[question.id] ? 1 : 0)
    }, 0)

    return {
      level,
      answered,
      correct,
      total: questions.length,
      label: LEVEL_META[level].label,
    }
  })
})

const isCorrect = computed(() => {
  if (!submitted.value || !selectedChoice.value || !currentQuestion.value) {
    return false
  }

  return selectedChoice.value === currentQuestion.value.correctChoice
})

function loadQuestionState(): void {
  const questionId = currentQuestionId.value

  if (!questionId) {
    selectedChoice.value = null
    submitted.value = false
    return
  }

  selectedChoice.value = pickedByQuestion.value[questionId] ?? null
  submitted.value = answeredByQuestion.value[questionId] ?? false
}

function switchLevel(level: QuizLevel): void {
  if (selectedLevel.value === level) return

  selectedLevel.value = level
  currentIndex.value = 0
  loadQuestionState()
}

function selectChoice(choiceId: ChoiceId): void {
  if (submitted.value) return
  selectedChoice.value = choiceId
}

function submitAnswer(): void {
  if (!selectedChoice.value || submitted.value || !currentQuestion.value) return

  submitted.value = true
  const questionId = currentQuestion.value.id

  pickedByQuestion.value = {
    ...pickedByQuestion.value,
    [questionId]: selectedChoice.value,
  }

  answeredByQuestion.value = {
    ...answeredByQuestion.value,
    [questionId]: true,
  }

  correctByQuestion.value = {
    ...correctByQuestion.value,
    [questionId]: selectedChoice.value === currentQuestion.value.correctChoice,
  }
}

function nextQuestion(): void {
  if (!submitted.value || isLastQuestion.value) return

  currentIndex.value++
  loadQuestionState()
}

function previousQuestion(): void {
  if (currentIndex.value === 0) return

  currentIndex.value--
  loadQuestionState()
}

function restartLevel(): void {
  const nextAnswered = { ...answeredByQuestion.value }
  const nextCorrect = { ...correctByQuestion.value }
  const nextPicked = { ...pickedByQuestion.value }

  for (const question of currentQuestions.value) {
    delete nextAnswered[question.id]
    delete nextCorrect[question.id]
    delete nextPicked[question.id]
  }

  answeredByQuestion.value = nextAnswered
  correctByQuestion.value = nextCorrect
  pickedByQuestion.value = nextPicked

  currentIndex.value = 0
  loadQuestionState()
}

function restartAll(): void {
  pickedByQuestion.value = {}
  answeredByQuestion.value = {}
  correctByQuestion.value = {}
  currentIndex.value = 0
  selectedLevel.value = 'easy'
  loadQuestionState()
}

loadQuestionState()
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <header class="animate-fade-up">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="font-display text-xs tracking-[0.2em] text-accent-amber">LEARN BY FIXING</p>
            <h1 class="font-display text-4xl font-bold text-accent-coral sm:text-5xl">
              Debug Me JavaScript Quiz
            </h1>
            <p class="mt-2 max-w-2xl text-sm text-text-secondary sm:text-base">
              Mỗi câu là một bug JavaScript nhỏ. Bạn chọn cách sửa đúng và xem giải thích ngắn
              ngay sau khi trả lời.
            </p>
          </div>

          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          >
            <Icon icon="lucide:house" class="size-4" />
            Trang chủ
          </RouterLink>
        </div>
      </header>

      <section
        class="mt-6 border border-border-default bg-bg-surface p-4 sm:p-6 animate-fade-up animate-delay-2"
      >
        <h2 class="font-display text-2xl font-semibold">
          <span class="mr-2 text-accent-coral">//</span>
          Chọn level
        </h2>
        <p class="mt-2 text-sm text-text-secondary">
          Tách theo ngân hàng câu hỏi để bạn luyện từ cơ bản tới nâng cao.
        </p>

        <div class="mt-4 grid gap-3 md:grid-cols-3">
          <button
            v-for="stat in levelStats"
            :key="stat.level"
            type="button"
            class="border p-3 text-left transition"
            :class="
              selectedLevel === stat.level
                ? 'border-accent-coral bg-accent-coral/10'
                : 'border-border-default bg-bg-elevated hover:border-accent-sky/60'
            "
            @click="switchLevel(stat.level)"
          >
            <p class="font-display text-base text-text-primary">{{ stat.label }}</p>
            <p class="mt-1 text-xs text-text-dim">{{ LEVEL_META[stat.level].hint }}</p>
            <p class="mt-2 text-xs text-text-secondary">
              Tiến độ: {{ stat.answered }}/{{ stat.total }} | Đúng: {{ stat.correct }}
            </p>
          </button>
        </div>

        <p class="mt-4 text-xs text-text-secondary">
          Tổng điểm toàn bộ ngân hàng: {{ totalCorrect }} / {{ totalQuestions }}
        </p>
      </section>

      <section
        class="mt-6 border border-border-default bg-bg-surface p-4 sm:p-6 animate-fade-up animate-delay-3"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 class="font-display text-2xl font-semibold">
            <span class="mr-2 text-accent-coral">//</span>
            {{ currentLevelMeta.label }} · Câu {{ currentIndex + 1 }}/{{ currentQuestions.length }}
          </h2>
          <p class="text-sm text-text-secondary">
            Đúng: {{ score }} / {{ currentQuestions.length }} · Đã làm: {{ answeredCount }}
          </p>
        </div>

        <p class="mt-4 font-display text-lg text-text-primary">{{ currentQuestion?.title }}</p>
        <p class="mt-2 text-sm text-text-secondary">{{ currentQuestion?.question }}</p>

        <pre
          class="mt-4 overflow-x-auto border border-border-default bg-bg-elevated p-4 text-xs leading-6 text-text-secondary"
        ><code>{{ currentQuestion?.snippet }}</code></pre>

        <div class="mt-4 grid gap-2">
          <button
            v-for="choice in currentQuestion?.choices ?? []"
            :key="choice.id"
            type="button"
            class="w-full border px-3 py-3 text-left text-sm transition"
            :class="[
              selectedChoice === choice.id
                ? 'border-accent-sky bg-accent-sky/10 text-text-primary'
                : 'border-border-default bg-bg-elevated text-text-secondary hover:text-text-primary',
              submitted && choice.id === currentQuestion?.correctChoice
                ? 'border-accent-coral bg-accent-coral/10 text-text-primary'
                : '',
              submitted && selectedChoice === choice.id && selectedChoice !== currentQuestion?.correctChoice
                ? 'border-red-400 bg-red-500/10 text-text-primary'
                : '',
            ]"
            @click="selectChoice(choice.id)"
          >
            <span class="font-display mr-2">{{ choice.id }}.</span>
            {{ choice.text }}
          </button>
        </div>

        <div class="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-2 border border-accent-coral bg-accent-coral/15 px-4 py-2 text-sm font-medium text-text-primary transition disabled:cursor-not-allowed disabled:opacity-45"
            :disabled="!hasSelection || submitted"
            @click="submitAnswer"
          >
            <Icon icon="lucide:check-check" class="size-4" />
            Chấm câu này
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-4 py-2 text-sm text-text-secondary transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-45"
            :disabled="currentIndex === 0"
            @click="previousQuestion"
          >
            <Icon icon="lucide:arrow-left" class="size-4" />
            Câu trước
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-4 py-2 text-sm text-text-secondary transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-45"
            :disabled="!submitted || isLastQuestion"
            @click="nextQuestion"
          >
            Câu tiếp
            <Icon icon="lucide:arrow-right" class="size-4" />
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-4 py-2 text-sm text-text-secondary transition hover:text-text-primary"
            @click="restartLevel"
          >
            <Icon icon="lucide:rotate-ccw" class="size-4" />
            Làm lại level
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-4 py-2 text-sm text-text-secondary transition hover:text-text-primary"
            @click="restartAll"
          >
            <Icon icon="lucide:refresh-cw" class="size-4" />
            Reset toàn bộ
          </button>
        </div>

        <div v-if="submitted" class="mt-5 border border-border-default bg-bg-elevated p-4">
          <p class="font-display text-base" :class="isCorrect ? 'text-accent-amber' : 'text-accent-coral'">
            {{ isCorrect ? 'Chính xác!' : 'Chưa đúng, thử đọc giải thích nhé.' }}
          </p>
          <p class="mt-2 text-sm leading-6 text-text-secondary">{{ currentQuestion?.explanation }}</p>
          <p class="mt-3 text-xs text-text-dim">
            Đáp án đúng: <span class="text-text-primary">{{ currentQuestion?.correctChoice }}</span>
          </p>
        </div>
      </section>

      <section
        class="mt-6 border border-border-default bg-bg-surface p-4 text-sm text-text-secondary animate-fade-up animate-delay-4"
      >
        <p>
          Mẹo học nhanh: sau mỗi câu, hãy tự viết lại đoạn code đúng trong editor của bạn để nhớ
          pattern bug lâu hơn.
        </p>
      </section>
    </div>
  </div>
</template>
