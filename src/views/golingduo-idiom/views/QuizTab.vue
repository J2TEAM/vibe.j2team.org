<script setup lang="ts">
import { Icon } from '@iconify/vue'
import QuizCard from '../components/quiz/QuizCard.vue'
import QuizTimer from '../components/quiz/QuizTimer.vue'
import QuizResult from '../components/quiz/QuizResult.vue'
import CategoryGrid from '../components/collection/CategoryGrid.vue'
import { useQuiz } from '../composables/useQuiz'
import { useProgress } from '../composables/useProgress'
import type { IdiomCategoryId } from '../data/categories'

const emit = defineEmits<{
  (e: 'go-home'): void
}>()

const quiz = useQuiz()
const { addQuizScore } = useProgress()

function handleTimeout() {
  if (!quiz.selectedAnswer.value) {
    quiz.selectAnswer('')
  }
}

function handleFinish() {
  addQuizScore({
    date: new Date().toISOString().slice(0, 10),
    score: quiz.score.value,
    total: quiz.questions.value.length,
    mode: quiz.mode.value,
    category: quiz.category.value,
  })
}

function handleRetry() {
  quiz.startQuiz(quiz.mode.value, quiz.category.value)
}

function handleNext() {
  quiz.nextQuestion()
  if (quiz.isFinished.value) handleFinish()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Mode selector (before quiz starts) -->
    <template v-if="!quiz.isStarted.value">
      <h2
        class="flex items-center gap-3 font-display text-2xl font-semibold text-text-primary animate-fade-up"
      >
        <span class="font-display text-sm tracking-widest text-accent-amber">//</span>
        Chọn Chế Độ Quiz
      </h2>

      <div class="grid grid-cols-2 gap-4 animate-fade-up animate-delay-2">
        <button
          class="border border-border-default bg-bg-surface p-6 text-center transition-all hover:-translate-y-1 hover:border-accent-amber hover:bg-bg-elevated"
          @click="quiz.mode.value = 'classic'"
          :class="quiz.mode.value === 'classic' ? 'border-accent-amber bg-accent-amber/10' : ''"
        >
          <Icon icon="fluent-emoji:books" class="mx-auto mb-2 size-8" />
          <p class="font-display font-semibold text-text-primary">Classic</p>
          <p class="mt-1 text-xs text-text-secondary">Không giới hạn thời gian</p>
        </button>
        <button
          class="border border-border-default bg-bg-surface p-6 text-center transition-all hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated"
          @click="quiz.mode.value = 'time-attack'"
          :class="quiz.mode.value === 'time-attack' ? 'border-accent-coral bg-accent-coral/10' : ''"
        >
          <Icon icon="fluent-emoji:fire" class="mx-auto mb-2 size-8" />
          <p class="font-display font-semibold text-text-primary">Time Attack</p>
          <p class="mt-1 text-xs text-text-secondary">30 giây/câu, áp lực!</p>
        </button>
      </div>

      <!-- Category filter -->
      <div class="animate-fade-up animate-delay-3">
        <p class="mb-3 text-sm text-text-secondary font-display">Chọn chủ đề (tuỳ chọn):</p>
        <CategoryGrid
          :selected-category="
            quiz.category.value === 'all' ? null : (quiz.category.value as IdiomCategoryId)
          "
          @select="(cat) => (quiz.category.value = cat ?? 'all')"
        />
      </div>

      <!-- Start button -->
      <button
        class="flex w-full items-center justify-center gap-2 border-2 border-accent-amber bg-accent-amber/10 px-6 py-3 font-display text-lg font-bold text-accent-amber transition hover:bg-accent-amber/20 animate-fade-up animate-delay-5"
        @click="quiz.startQuiz(quiz.mode.value, quiz.category.value)"
      >
        <Icon icon="lucide:play" class="size-5" />
        BẮT ĐẦU QUIZ!
      </button>
    </template>

    <!-- Quiz in progress -->
    <template v-else-if="!quiz.isFinished.value && quiz.currentQuestion.value">
      <!-- Timer for Time Attack -->
      <QuizTimer
        v-if="quiz.mode.value === 'time-attack'"
        :key="quiz.currentIndex.value"
        :duration="30"
        :is-active="!quiz.showExplanation.value"
        @timeout="handleTimeout"
      />

      <QuizCard
        :key="quiz.currentIndex.value"
        :question="quiz.currentQuestion.value"
        :answers="quiz.answers.value"
        :selected-answer="quiz.selectedAnswer.value"
        :show-explanation="quiz.showExplanation.value"
        :progress="quiz.progress.value"
        @select="quiz.selectAnswer"
        @next="handleNext"
      />
    </template>

    <!-- Quiz result -->
    <QuizResult
      v-else-if="quiz.isFinished.value"
      :score="quiz.score.value"
      :total="quiz.questions.value.length"
      :xp-earned="quiz.xpEarned.value"
      :message="quiz.resultMessage.value"
      @retry="handleRetry"
      @home="
        () => {
          quiz.resetQuiz()
          emit('go-home')
        }
      "
    />
  </div>
</template>
