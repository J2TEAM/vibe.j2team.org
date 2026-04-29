<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useGame } from './composables/useGame'
import GameMenu from './components/GameMenu.vue'
import GamePlay from './components/GamePlay.vue'
import GameResult from './components/GameResult.vue'
import type { GameMode } from './types'

useHead({
  title: 'Vibe Flag — Quiz Đoán Cờ Quốc Gia',
  meta: [
    {
      name: 'description',
      content: 'Quiz đoán cờ quốc gia — thử thách kiến thức địa lý của bạn với 195+ quốc gia!',
    },
  ],
})

const {
  gameState,
  currentMode,
  currentQuestion,
  questionIndex,
  timeLeft,
  stats,
  config,
  accuracy,
  rank,
  selectedAnswer,
  isAnswered,
  startGame,
  handleAnswer,
  backToMenu,
} = useGame()

function handleRestart(mode: GameMode) {
  startGame(mode)
}
</script>

<template>
  <div class="bg-bg-deep text-text-primary font-body relative min-h-screen overflow-hidden">
    <!-- Background decorative number -->
    <span
      class="font-display text-accent-amber/5 pointer-events-none absolute right-8 top-8 select-none text-9xl font-bold"
    >
      🌍
    </span>

    <!-- Main layout -->
    <div class="relative z-10 flex min-h-screen flex-col">
      <!-- Top bar -->
      <header class="border-border-default border-b px-6 py-4">
        <div class="mx-auto flex max-w-5xl items-center justify-between">
          <RouterLink
            to="/"
            class="text-text-secondary font-display flex items-center cursor-pointer gap-2 text-sm tracking-wide transition hover:text-accent-coral"
          >
            <Icon icon="lucide:arrow-left" class="size-4" />
            Trang chủ
          </RouterLink>

          <div class="font-display text-text-dim text-xs tracking-widest">VIBE FLAG</div>

          <!-- Issue badge -->
          <div
            class="bg-accent-coral text-bg-deep font-display hidden rotate-3 px-2.5 py-1 text-xs font-bold tracking-widest sm:block"
          >
            VOL.01 / 2026
          </div>
        </div>
      </header>

      <!-- Main content -->
      <main class="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <!-- Menu -->
        <Transition name="slide-fade" mode="out-in">
          <GameMenu v-if="gameState === 'menu'" key="menu" @start="startGame" />

          <!-- Playing -->
          <GamePlay
            v-else-if="gameState === 'playing' && currentQuestion"
            key="playing"
            :question="currentQuestion"
            :question-index="questionIndex"
            :time-left="timeLeft"
            :stats="stats"
            :config="config"
            :selected-answer="selectedAnswer"
            :is-answered="isAnswered"
            :mode="currentMode"
            @answer="handleAnswer"
            @quit="backToMenu"
          />

          <!-- Result -->
          <GameResult
            v-else-if="gameState === 'result'"
            key="result"
            :stats="stats"
            :accuracy="accuracy"
            :rank="rank"
            :mode="currentMode"
            @restart="handleRestart"
            @menu="backToMenu"
          />
        </Transition>
      </main>

      <!-- Footer -->
      <footer class="border-border-default border-t px-6 py-4 text-center">
        <p class="font-display text-text-dim text-xs tracking-widest">
          VIBE FLAG · J2TEAM COMMUNITY · CỜ TỪ
          <a
            href="https://flagcdn.com"
            target="_blank"
            rel="noopener noreferrer"
            class="text-accent-sky hover:underline"
            >FLAGCDN.COM</a
          >
        </p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
