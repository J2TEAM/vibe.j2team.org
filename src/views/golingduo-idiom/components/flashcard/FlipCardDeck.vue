<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { Idiom } from '../../data/types'
import FlipCard from './FlipCard.vue'

const props = defineProps<{
  idioms: readonly Idiom[]
  learnedIds: string[]
}>()

const emit = defineEmits<{
  (e: 'learned', id: string): void
  (e: 'relearn', id: string): void
}>()

const currentIndex = ref(0)

const currentIdiom = computed(() => props.idioms[currentIndex.value])

const canPrev = computed(() => currentIndex.value > 0)
const canNext = computed(() => currentIndex.value < props.idioms.length - 1)

function prev() {
  if (canPrev.value) currentIndex.value--
}

function next() {
  if (canNext.value) currentIndex.value++
}

function handleLearned() {
  const idiom = currentIdiom.value
  if (idiom) {
    emit('learned', idiom.id)
    if (canNext.value) next()
  }
}

function handleRelearn() {
  const idiom = currentIdiom.value
  if (idiom) {
    emit('relearn', idiom.id)
  }
}
</script>

<template>
  <div v-if="currentIdiom" class="space-y-4">
    <!-- Progress indicator -->
    <div class="flex items-center justify-between text-sm text-text-secondary">
      <span class="font-display"> {{ currentIndex + 1 }} / {{ idioms.length }} </span>
      <div class="h-1 flex-1 mx-4 bg-bg-elevated overflow-hidden">
        <div
          class="h-full bg-accent-coral transition-all duration-300"
          :style="{ width: `${((currentIndex + 1) / idioms.length) * 100}%` }"
        />
      </div>
    </div>

    <!-- Card -->
    <FlipCard
      :key="currentIdiom.id"
      :idiom="currentIdiom"
      :index="currentIndex"
      :is-learned="learnedIds.includes(currentIdiom.id)"
      @learned="handleLearned"
      @relearn="handleRelearn"
    />

    <!-- Navigation buttons -->
    <div class="flex items-center justify-between">
      <button
        :disabled="!canPrev"
        class="flex items-center gap-2 border border-border-default px-4 py-2 text-sm font-display text-text-secondary transition hover:border-accent-coral hover:text-text-primary disabled:opacity-30 disabled:hover:border-border-default disabled:hover:text-text-secondary"
        @click="prev"
      >
        <Icon icon="lucide:chevron-left" class="size-4" />
        Trước
      </button>
      <button
        :disabled="!canNext"
        class="flex items-center gap-2 border border-border-default px-4 py-2 text-sm font-display text-text-secondary transition hover:border-accent-coral hover:text-text-primary disabled:opacity-30 disabled:hover:border-border-default disabled:hover:text-text-secondary"
        @click="next"
      >
        Tiếp
        <Icon icon="lucide:chevron-right" class="size-4" />
      </button>
    </div>
  </div>
</template>
