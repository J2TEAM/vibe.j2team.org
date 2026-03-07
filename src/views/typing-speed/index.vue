<script setup lang="ts">
import { ref, provide } from 'vue'
import { RouterLink } from 'vue-router'
import { useTypingGame } from './useTypingGame'
import { TIME_OPTIONS } from './types'
import IdleScreen from './components/IdleScreen.vue'
import PlayingScreen from './components/PlayingScreen.vue'
import FinishedScreen from './components/FinishedScreen.vue'

const selectedTime = ref(60)
const game = useTypingGame(selectedTime)
const gameState = game.gameState

provide('typingGame', {
  ...game,
  selectedTime,
  TIME_OPTIONS,
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col">
    <header class="flex items-center justify-between px-6 py-4 border-b border-border-default">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-text-primary"
      >
        &#8592; Về trang chủ
      </RouterLink>
      <div class="flex items-center gap-2">
        <span class="font-display text-xs tracking-widest text-accent-coral">//</span>
        <span class="font-display text-sm font-semibold tracking-wide">TYPING SPEED TEST</span>
      </div>
    </header>

    <main class="flex-1 flex flex-col items-center px-4 py-8 max-w-4xl mx-auto w-full">
      <div class="text-center mb-8 animate-fade-up">
        <h1 class="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary mb-3">
          Kiểm tra tốc độ gõ phím
        </h1>
        <p class="text-text-secondary text-sm sm:text-base max-w-xl mx-auto">
          Gõ từng từ tiếng Việt. Nhấn
          <kbd
            class="inline-block px-2 py-0.5 border border-border-default bg-bg-elevated text-xs font-mono text-accent-amber mx-1"
            >Space</kbd
          >
          để xác nhận và chuyển sang từ tiếp theo.
        </p>
      </div>

      <IdleScreen v-if="gameState === 'idle'" />
      <PlayingScreen v-else-if="gameState === 'playing'" />
      <FinishedScreen v-else-if="gameState === 'finished'" />
    </main>
  </div>
</template>
