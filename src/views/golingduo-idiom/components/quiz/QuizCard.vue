<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { Idiom } from '../../data/types'

const props = defineProps<{
  question: Idiom
  answers: string[]
  selectedAnswer: string | null
  showExplanation: boolean
  progress: { current: number; total: number; percent: number }
}>()

const emit = defineEmits<{
  (e: 'select', answer: string): void
  (e: 'next'): void
}>()

function isCorrect(answer: string) {
  return answer === props.question.meaning_vi
}
</script>

<template>
  <div class="space-y-6">
    <!-- Progress bar -->
    <div class="space-y-2">
      <div class="flex justify-between text-xs font-display text-text-secondary">
        <span>Câu {{ progress.current }}/{{ progress.total }}</span>
        <span>{{ Math.round(progress.percent) }}%</span>
      </div>
      <div class="h-2 overflow-hidden bg-accent-coral/20">
        <div
          class="h-full bg-accent-coral transition-all duration-500"
          :style="{ width: `${progress.percent}%` }"
        />
      </div>
    </div>

    <!-- Question -->
    <div class="border border-border-default bg-bg-surface p-6 text-center">
      <span class="mb-3 block text-3xl">{{ question.emoji }}</span>
      <h3 class="font-display text-2xl font-bold text-text-primary">
        {{ question.phrase }}
      </h3>
      <p class="mt-2 text-sm text-text-dim">Câu này nghĩa là gì?</p>
    </div>

    <!-- Answer options -->
    <div class="grid gap-3">
      <button
        v-for="answer in answers"
        :key="answer"
        class="border p-4 text-left text-sm transition-all duration-300"
        :class="[
          selectedAnswer === null
            ? 'border-border-default bg-bg-surface hover:border-accent-coral hover:bg-bg-elevated cursor-pointer'
            : isCorrect(answer)
              ? 'border-accent-sky bg-accent-sky/10'
              : selectedAnswer === answer
                ? 'border-accent-coral bg-accent-coral/10'
                : 'border-border-default bg-bg-surface opacity-50',
        ]"
        :disabled="selectedAnswer !== null"
        @click="emit('select', answer)"
      >
        <div class="flex items-center gap-3">
          <div
            v-if="selectedAnswer !== null"
            class="flex size-6 shrink-0 items-center justify-center"
          >
            <Icon
              v-if="isCorrect(answer)"
              icon="lucide:check-circle"
              class="size-5 text-accent-sky"
            />
            <Icon
              v-else-if="selectedAnswer === answer"
              icon="lucide:x-circle"
              class="size-5 text-accent-coral"
            />
          </div>
          <span class="text-text-primary">{{ answer }}</span>
        </div>
      </button>
    </div>

    <!-- Explanation -->
    <div
      v-if="showExplanation"
      class="animate-fade-up border border-border-default bg-bg-elevated p-4 space-y-2"
    >
      <p class="text-sm text-text-secondary">
        <span class="font-display text-accent-amber">Dịch thẳng:</span>
        {{ question.literal_vi }}
      </p>
      <p class="text-sm italic text-text-secondary">
        {{ question.funny_context }}
      </p>
      <button
        class="mt-2 flex w-full items-center justify-center gap-2 border border-accent-coral bg-accent-coral/10 px-4 py-2.5 font-display text-sm text-accent-coral transition hover:bg-accent-coral/20"
        @click="emit('next')"
      >
        Câu tiếp theo
        <Icon icon="lucide:arrow-right" class="size-4" />
      </button>
    </div>
  </div>
</template>
