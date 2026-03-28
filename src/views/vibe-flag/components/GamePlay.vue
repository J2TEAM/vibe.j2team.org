<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { GameStats, GameConfig, Question, GameMode } from '../types'
import FlagCard from './FlagCard.vue'
import AnswerButtons from './AnswerButtons.vue'
import TimerBar from './TimerBar.vue'

const { question, questionIndex, timeLeft, stats, config, selectedAnswer, isAnswered, mode } =
  defineProps<{
    question: Question
    questionIndex: number
    timeLeft: number
    stats: GameStats
    config: GameConfig
    selectedAnswer: string | null
    isAnswered: boolean
    mode: GameMode
  }>()

const emit = defineEmits<{
  answer: [code: string]
  quit: []
}>()
</script>

<template>
  <div class="flex w-full max-w-lg flex-col gap-5">
    <!-- HUD top bar -->
    <div class="flex items-center justify-between">
      <button
        class="border-border-default bg-bg-surface text-text-secondary font-display flex items-center cursor-pointer gap-1.5 border px-3 py-1.5 text-xs tracking-wide transition hover:border-accent-coral hover:text-text-primary"
        @click="emit('quit')"
      >
        <Icon icon="lucide:x" class="size-3.5" />
        Thoát
      </button>

      <!-- Survival: lives -->
      <div v-if="mode === 'survival'" class="flex items-center gap-1">
        <Icon
          v-for="i in config.maxLives"
          :key="i"
          icon="lucide:heart"
          :class="['size-5', i <= stats.lives ? 'text-accent-coral' : 'text-text-dim']"
        />
      </div>

      <!-- Score + Streak -->
      <div class="flex items-center gap-3">
        <div
          v-if="stats.streak >= 2"
          class="font-display text-accent-amber flex items-center gap-1 text-sm font-bold"
        >
          <Icon icon="lucide:flame" class="size-4" />
          x{{ stats.streak }}
        </div>
        <div class="font-display text-text-primary text-sm font-bold tabular-nums">
          {{ stats.score.toLocaleString() }}
        </div>
      </div>
    </div>

    <!-- Progress -->
    <div>
      <h3
        class="font-display text-text-secondary mb-2 flex items-center gap-2 text-sm tracking-widest"
      >
        <span class="text-accent-coral">// </span>TIẾN ĐỘ
      </h3>
      <div class="mb-1.5 flex justify-between">
        <span class="font-display text-text-dim text-xs tracking-widest">
          CÂU {{ questionIndex }} / {{ mode === 'survival' ? '∞' : config.totalQuestions }}
        </span>
        <span class="font-display text-accent-sky text-xs tracking-widest">
          ✓ {{ stats.correct }} · ✗ {{ stats.wrong }}
        </span>
      </div>
      <div
        v-if="mode !== 'survival'"
        class="bg-bg-elevated border-border-default h-1 w-full overflow-hidden border"
      >
        <div
          class="bg-accent-coral h-full transition-all duration-500"
          :style="{ width: `${(questionIndex / config.totalQuestions) * 100}%` }"
        />
      </div>
    </div>

    <!-- Flag -->
    <FlagCard :country="question.correct" :mode="mode" :is-hard="mode === 'hard'" />

    <!-- Timer -->
    <TimerBar :time-left="timeLeft" :max-time="config.timePerQuestion" />

    <!-- Question prompt -->
    <div class="text-center">
      <p class="font-display text-text-secondary text-sm tracking-widest">
        ĐÂY LÀ CỜ CỦA NƯỚC NÀO?
      </p>
    </div>

    <!-- Answers -->
    <AnswerButtons
      :options="question.options"
      :selected="selectedAnswer"
      :correct="question.correct.code"
      :is-answered="isAnswered"
      @answer="emit('answer', $event)"
    />

    <!-- Correct answer reveal -->
    <Transition name="fade">
      <div
        v-if="isAnswered"
        :class="[
          'border p-3 text-center font-display text-sm font-semibold tracking-wide',
          selectedAnswer === question.correct.code
            ? 'border-green-500/30 bg-green-500/10 text-green-400'
            : 'border-red-500/30 bg-red-500/10 text-red-400',
        ]"
      >
        <span v-if="selectedAnswer === question.correct.code">
          ✓ Chính xác! +{{ 100 + Math.floor(timeLeft * 5) + stats.streak * 10 }} điểm
        </span>
        <span v-else-if="selectedAnswer === ''">
          ⏰ Hết giờ! Đáp án: {{ question.correct.nameVi }}
        </span>
        <span v-else> ✗ Sai rồi! Đáp án: {{ question.correct.nameVi }} </span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
