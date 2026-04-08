<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { LessonStep, QuizQuestion } from '../types'

const props = defineProps<{
  lessonModeEnabled: boolean
  steps: LessonStep[]
  currentStep: LessonStep
  currentStepIndex: number
  isFirstStep: boolean
  isLastStep: boolean
  completedStepIds: string[]
  completedStepsCount: number
  quizQuestions: QuizQuestion[]
  quizAnswers: Record<string, string>
  answeredCount: number
  quizSubmitted: boolean
  canSubmitQuiz: boolean
  quizScore: number
  quizScorePercent: number
}>()

const emit = defineEmits<{
  (event: 'toggle-lesson'): void
  (event: 'prev-step'): void
  (event: 'next-step'): void
  (event: 'go-step', index: number): void
  (event: 'apply-step'): void
  (event: 'mark-step-done'): void
  (event: 'select-answer', payload: { questionId: string; choiceId: string }): void
  (event: 'submit-quiz'): void
  (event: 'reset-quiz'): void
}>()

function isStepDone(stepId: string): boolean {
  return props.completedStepIds.includes(stepId)
}

function selectedChoice(questionId: string): string {
  return props.quizAnswers[questionId] ?? ''
}

function chooseAnswer(questionId: string, choiceId: string) {
  emit('select-answer', { questionId, choiceId })
}

function isCorrectChoice(question: QuizQuestion, choiceId: string): boolean {
  return question.correctChoiceId === choiceId
}
</script>

<template>
  <section class="mt-4 border border-border-default bg-bg-elevated p-4">
    <div class="flex items-center justify-between gap-3">
      <h3 class="flex items-center gap-2 font-display text-lg font-semibold">
        <span class="font-display text-xs tracking-widest text-accent-sky">//</span>
        Lesson + Quiz
      </h3>

      <button
        class="inline-flex items-center gap-2 border border-border-default px-3 py-1.5 text-xs text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
        @click="emit('toggle-lesson')"
      >
        <Icon :icon="lessonModeEnabled ? 'lucide:eye-off' : 'lucide:eye'" class="size-3.5" />
        {{ lessonModeEnabled ? 'Ẩn bài học' : 'Hiện bài học' }}
      </button>
    </div>

    <div v-if="lessonModeEnabled" class="mt-4 space-y-4">
      <div class="grid gap-2 sm:grid-cols-4">
        <button
          v-for="(step, index) in steps"
          :key="step.id"
          class="flex items-center justify-between gap-2 border px-2 py-2 text-left text-xs transition"
          :class="
            index === currentStepIndex
              ? 'border-accent-amber bg-accent-amber/10 text-text-primary'
              : 'border-border-default text-text-secondary hover:text-text-primary'
          "
          @click="emit('go-step', index)"
        >
          <span>Bước {{ index + 1 }}</span>
          <Icon
            :icon="isStepDone(step.id) ? 'lucide:check-circle-2' : 'lucide:circle'"
            class="size-3.5"
            :class="isStepDone(step.id) ? 'text-accent-sky' : 'text-text-dim'"
          />
        </button>
      </div>

      <div class="border border-border-default bg-bg-surface p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="font-display text-xs tracking-widest text-text-dim">
              BƯỚC {{ currentStepIndex + 1 }}/{{ steps.length }}
            </p>
            <h4 class="mt-1 text-lg font-semibold text-accent-amber">{{ currentStep.title }}</h4>
          </div>
          <span class="border border-border-default px-2 py-1 text-xs text-text-secondary">
            Hoàn thành {{ completedStepsCount }}/{{ steps.length }}
          </span>
        </div>

        <p class="mt-3 text-sm text-text-primary">{{ currentStep.objective }}</p>
        <p class="mt-2 text-sm text-text-secondary">{{ currentStep.instructions }}</p>
        <p class="mt-2 text-xs text-accent-sky">Gợi ý: {{ currentStep.hint }}</p>

        <div class="mt-4 grid gap-2 sm:grid-cols-4">
          <button
            class="inline-flex items-center justify-center gap-2 border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:text-text-primary"
            :disabled="isFirstStep"
            @click="emit('prev-step')"
          >
            <Icon icon="lucide:arrow-left" class="size-3.5" />
            Bước trước
          </button>

          <button
            class="inline-flex items-center justify-center gap-2 border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:text-text-primary"
            :disabled="isLastStep"
            @click="emit('next-step')"
          >
            Bước sau
            <Icon icon="lucide:arrow-right" class="size-3.5" />
          </button>

          <button
            class="inline-flex items-center justify-center gap-2 border border-accent-coral px-3 py-2 text-xs text-accent-coral transition hover:bg-accent-coral/10"
            @click="emit('apply-step')"
          >
            <Icon icon="lucide:rocket" class="size-3.5" />
            Áp dụng lên mô phỏng
          </button>

          <button
            class="inline-flex items-center justify-center gap-2 border border-accent-sky px-3 py-2 text-xs text-accent-sky transition hover:bg-accent-sky/10"
            @click="emit('mark-step-done')"
          >
            <Icon icon="lucide:badge-check" class="size-3.5" />
            Đánh dấu xong
          </button>
        </div>
      </div>

      <div class="border border-border-default bg-bg-surface p-4">
        <div class="flex items-center justify-between gap-3">
          <h4 class="font-display text-base font-semibold">
            Quiz kiểm tra nhanh ({{ answeredCount }}/{{ quizQuestions.length }})
          </h4>
          <span
            v-if="quizSubmitted"
            class="border border-accent-amber px-2 py-1 text-xs text-accent-amber"
          >
            {{ quizScore }}/{{ quizQuestions.length }} điểm ({{ quizScorePercent }}%)
          </span>
        </div>

        <div class="mt-3 space-y-4">
          <article
            v-for="(question, questionIndex) in quizQuestions"
            :key="question.id"
            class="border border-border-default bg-bg-elevated p-3"
          >
            <p class="text-sm text-text-primary">
              {{ questionIndex + 1 }}. {{ question.question }}
            </p>

            <div class="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                v-for="choice in question.choices"
                :key="choice.id"
                class="border px-3 py-2 text-left text-sm transition"
                :class="
                  selectedChoice(question.id) === choice.id
                    ? 'border-accent-coral bg-accent-coral/10 text-text-primary'
                    : 'border-border-default text-text-secondary hover:text-text-primary'
                "
                :disabled="quizSubmitted"
                @click="chooseAnswer(question.id, choice.id)"
              >
                <span>{{ choice.label }}</span>
              </button>
            </div>

            <p
              v-if="quizSubmitted"
              class="mt-3 text-xs"
              :class="
                isCorrectChoice(question, selectedChoice(question.id))
                  ? 'text-accent-sky'
                  : 'text-accent-coral'
              "
            >
              {{ isCorrectChoice(question, selectedChoice(question.id)) ? 'Đúng: ' : 'Chưa đúng: '
              }}{{ question.explanation }}
            </p>
          </article>
        </div>

        <div class="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            class="inline-flex items-center justify-center gap-2 border px-3 py-2 text-sm transition"
            :class="
              canSubmitQuiz
                ? 'border-accent-amber text-accent-amber hover:bg-accent-amber/10'
                : 'border-border-default text-text-dim'
            "
            :disabled="!canSubmitQuiz || quizSubmitted"
            @click="emit('submit-quiz')"
          >
            <Icon icon="lucide:clipboard-check" class="size-4" />
            Nộp bài
          </button>

          <button
            class="inline-flex items-center justify-center gap-2 border border-border-default px-3 py-2 text-sm text-text-secondary transition hover:text-text-primary"
            @click="emit('reset-quiz')"
          >
            <Icon icon="lucide:refresh-cw" class="size-4" />
            Làm lại quiz
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
