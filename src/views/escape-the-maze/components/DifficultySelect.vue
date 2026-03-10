<script setup lang="ts">
import { ref } from 'vue'
import type { Difficulty, BestRecord } from '../types'
import { difficultyConfig, STORAGE_KEY } from '../config'
import { useLanguage } from '../composables/useLanguage'

defineProps<{
  bestRecords?: BestRecord | null
}>()

const emit = defineEmits<{
  start: [difficulty: Difficulty]
}>()

const { t } = useLanguage()
const selectedDifficulty = ref<Difficulty>('noob')

function getBestTime(difficulty: Difficulty): string {
  const key = `${STORAGE_KEY.BEST_NOOB}`.replace('noob', difficulty)
  const stored = localStorage.getItem(key)
  if (!stored) return t.value.noBestYet
  const record: BestRecord = JSON.parse(stored)
  return `${(record.time / 1000).toFixed(2)}s`
}

const difficulties: Difficulty[] = ['noob', 'medium', 'hard', 'asian']
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <h2 class="font-display text-2xl font-semibold text-text-primary mb-8 text-center">
      <span class="text-accent-coral">//</span> {{ t.selectDifficulty }}
    </h2>

    <div class="grid gap-4 sm:grid-cols-2">
      <button
        v-for="difficulty in difficulties"
        :key="difficulty"
        class="bg-bg-surface border transition-all duration-200 p-6 text-left hover:-translate-y-1 hover:shadow-lg hover:shadow-accent-coral/5"
        :class="{
          'border-accent-coral': selectedDifficulty === difficulty,
          'border-border-default': selectedDifficulty !== difficulty,
        }"
        @click="selectedDifficulty = difficulty"
      >
        <div class="flex justify-between items-start mb-2">
          <h3 class="font-display text-xl font-bold text-text-primary">
            {{ t.difficulty[difficulty].label }}
          </h3>
          <span class="text-accent-amber font-display text-sm">
            {{ difficultyConfig[difficulty] }}×{{ difficultyConfig[difficulty] }}
          </span>
        </div>
        <p class="text-text-secondary text-sm mb-3">
          {{ t.difficulty[difficulty].desc }}
        </p>
        <div class="text-xs text-text-dim">
          <span class="font-display">{{ t.bestTime }}:</span>
          {{ getBestTime(difficulty) }}
        </div>
      </button>
    </div>

    <div class="mt-8 text-center">
      <button
        class="bg-accent-coral text-bg-deep font-display font-bold text-lg py-4 px-12 transition-all duration-200 hover:bg-accent-coral/90 active:scale-95"
        @click="emit('start', selectedDifficulty)"
      >
        {{ t.start }}
      </button>
    </div>
  </div>
</template>
