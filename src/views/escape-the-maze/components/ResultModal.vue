<script setup lang="ts">
import type { GameStats, Difficulty } from '../types'
import { useLanguage } from '../composables/useLanguage'

defineProps<{
  stats: GameStats
  difficulty: Difficulty
  isNewRecord: boolean
}>()

const emit = defineEmits<{
  playAgain: []
  changeDifficulty: []
}>()

const { t } = useLanguage()
</script>

<template>
  <div
    class="fixed inset-0 bg-bg-deep/90 flex items-center justify-center p-4 z-50 animate-fade-up"
  >
    <div
      class="bg-bg-surface border border-border-default max-w-md w-full p-8 animate-fade-up animate-delay-2"
    >
      <h2 class="font-display text-3xl font-bold text-accent-coral mb-2">
        {{ t.congratulations }}
      </h2>
      <p class="text-text-secondary mb-6">{{ t.youEscaped }}</p>

      <div v-if="isNewRecord" class="bg-accent-amber/10 border border-accent-amber/30 p-3 mb-6">
        <p class="text-accent-amber font-display font-semibold text-center">
          🎉 {{ t.newRecord }} 🎉
        </p>
      </div>

      <div class="space-y-4 mb-8">
        <div class="flex justify-between items-center">
          <span class="text-text-secondary">{{ t.time }}</span>
          <span class="font-display text-xl text-text-primary">
            {{ (stats.time / 1000).toFixed(2) }}s
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-text-secondary">{{ t.steps }}</span>
          <span class="font-display text-xl text-text-primary">{{ stats.steps }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-text-secondary">{{ t.optimalSteps }}</span>
          <span class="font-display text-xl text-text-primary">{{ stats.optimalSteps }}</span>
        </div>
        <div class="flex justify-between items-center pt-4 border-t border-border-default">
          <span class="text-text-secondary">{{ t.efficiency }}</span>
          <span
            class="font-display text-2xl font-bold"
            :class="{
              'text-accent-coral': stats.efficiency >= 90,
              'text-accent-amber': stats.efficiency >= 70 && stats.efficiency < 90,
              'text-accent-sky': stats.efficiency < 70,
            }"
          >
            {{ stats.efficiency.toFixed(1) }}%
          </span>
        </div>
      </div>

      <div class="flex gap-3">
        <button
          class="flex-1 bg-accent-coral text-bg-deep font-display font-semibold py-3 px-6 transition-all duration-200 hover:bg-accent-coral/90 active:scale-95"
          @click="emit('playAgain')"
        >
          {{ t.playAgain }}
        </button>
        <button
          class="flex-1 bg-bg-elevated border border-border-default text-text-primary font-display font-semibold py-3 px-6 transition-all duration-200 hover:bg-bg-deep hover:border-accent-coral active:scale-95"
          @click="emit('changeDifficulty')"
        >
          {{ t.changeDifficulty }}
        </button>
      </div>
    </div>
  </div>
</template>
