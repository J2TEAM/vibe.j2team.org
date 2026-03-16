<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { Idiom } from '../../data/types'
import { getIdiomCategory } from '../../data/categories'

defineProps<{
  idiom: Idiom
  isLearned: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

const difficultyColor: Record<string, string> = {
  easy: 'text-accent-sky border-accent-sky',
  medium: 'text-accent-amber border-accent-amber',
  hard: 'text-accent-coral border-accent-coral',
}

const difficultyLabel: Record<string, string> = {
  easy: 'Dễ',
  medium: 'Vừa',
  hard: 'Khó',
}
</script>

<template>
  <button
    class="relative w-full border border-border-default bg-bg-surface p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
    @click="emit('click')"
  >
    <!-- Learned badge -->
    <div v-if="isLearned" class="absolute right-3 top-3 text-accent-sky">
      <Icon icon="lucide:check-circle" class="size-4" />
    </div>

    <div class="flex items-start gap-3">
      <span class="text-2xl">{{ idiom.emoji }}</span>
      <div class="min-w-0 flex-1">
        <h4 class="truncate font-display text-sm font-semibold text-text-primary">
          {{ idiom.phrase }}
        </h4>
        <p class="mt-0.5 truncate text-xs text-text-secondary">
          {{ idiom.meaning_vi }}
        </p>
        <div class="mt-2 flex items-center gap-2">
          <span
            class="border px-1.5 py-0.5 text-xs font-display"
            :class="difficultyColor[idiom.difficulty]"
          >
            {{ difficultyLabel[idiom.difficulty] }}
          </span>
          <span class="text-xs text-text-dim">
            {{ getIdiomCategory(idiom.category)?.emoji }}
            {{ getIdiomCategory(idiom.category)?.label }}
          </span>
        </div>
      </div>
    </div>
  </button>
</template>
