<script setup lang="ts">
import SpinWheel from '../components/spin/SpinWheel.vue'
import FlipCard from '../components/flashcard/FlipCard.vue'
import { useSpin } from '../composables/useSpin'
import { useProgress } from '../composables/useProgress'
import { Icon } from '@iconify/vue'

const { isSpinning, rotation, resultIdiom, showResult, spin, reset } = useSpin()
const { addSpinHistory, markLearned, progress } = useProgress()

function handleSpin() {
  spin()
}

function handleLearn() {
  if (resultIdiom.value) {
    addSpinHistory(resultIdiom.value.id)
    markLearned(resultIdiom.value.id)
    reset()
  }
}

function handleSpinAgain() {
  if (resultIdiom.value) {
    addSpinHistory(resultIdiom.value.id)
  }
  reset()
  setTimeout(() => spin(), 300)
}
</script>

<template>
  <div class="space-y-6">
    <h2
      class="flex items-center gap-3 font-display text-2xl font-semibold text-text-primary animate-fade-up"
    >
      <span class="font-display text-sm tracking-widest text-accent-amber">//</span>
      Vòng Quay May Mắn
    </h2>
    <p class="text-sm text-text-secondary animate-fade-up animate-delay-1">
      Quay vòng quay để khám phá idiom ngẫu nhiên! +5 XP mỗi lần quay 🎲
    </p>

    <!-- Wheel -->
    <div class="animate-fade-up animate-delay-2">
      <SpinWheel :is-spinning="isSpinning" :rotation="rotation" @spin="handleSpin" />
    </div>

    <!-- Result -->
    <div v-if="showResult && resultIdiom" class="animate-fade-up space-y-4">
      <h3 class="text-center font-display text-lg text-accent-coral">🎉 Mày đã trúng!</h3>

      <FlipCard
        :idiom="resultIdiom"
        :is-learned="progress.learnedIds.includes(resultIdiom.id)"
        @learned="handleLearn"
        @relearn="handleSpinAgain"
      />

      <div class="flex gap-3">
        <button
          class="flex flex-1 items-center justify-center gap-2 border border-accent-sky bg-accent-sky/10 px-4 py-2 font-display text-sm text-accent-sky transition hover:bg-accent-sky/20"
          @click="handleLearn"
        >
          <Icon icon="lucide:check" class="size-4" />
          Học Luôn ✅
        </button>
        <button
          class="flex flex-1 items-center justify-center gap-2 border border-border-default px-4 py-2 font-display text-sm text-text-secondary transition hover:border-accent-coral hover:text-accent-coral"
          @click="handleSpinAgain"
        >
          <Icon icon="lucide:rotate-cw" class="size-4" />
          Quay Tiếp
        </button>
      </div>
    </div>
  </div>
</template>
