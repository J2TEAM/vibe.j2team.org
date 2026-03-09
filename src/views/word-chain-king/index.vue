<script setup lang="ts">
import { ref, computed } from 'vue'
import { useHead } from '@unhead/vue'
import type { GameMode } from './types'
import { useGame } from './composables/use-game'
import TopBar from './components/TopBar.vue'
import WelcomeScreen from './components/WelcomeScreen.vue'
import GameScreen from './components/GameScreen.vue'
import GameOverScreen from './components/GameOverScreen.vue'
import LeaderboardModal from './components/LeaderboardModal.vue'

useHead({
  title: 'Vua Nối Từ — vibe.j2team.org',
  meta: [
    {
      name: 'description',
      content: 'Nối từ để giải tỏa áp lực coding! Nối càng nhanh, vibe càng cao.',
    },
  ],
})

const {
  screen,
  mode,
  score,
  hearts,
  wordsCount,
  currentWord,
  wordHistory,
  inputValue,
  isShaking,
  shakePower,
  feedbackMessage,
  feedbackType,
  turnProgress,
  turnTimeRemaining,
  isUrgent,
  combo,
  startGame,
  submitAnswer,
  goToWelcome,
  sfx,
  leaderboard,
  MAX_HEARTS,
} = useGame()

const showLeaderboard = ref(false)

function onStart(selectedMode: GameMode) {
  startGame(selectedMode)
}

function onPlayAgain() {
  startGame(mode.value)
}

function toggleLeaderboard() {
  showLeaderboard.value = !showLeaderboard.value
}

const shakeClass = computed(() => {
  if (!isShaking.value) return ''
  return shakePower.value >= 2 ? 'shake-strong' : 'shake-light'
})
</script>

<template>
  <div class="vnt-root" :class="[shakeClass]">
    <!-- Pixel background stars -->
    <div class="bg-stars">
      <div
        v-for="n in 30"
        :key="n"
        class="star"
        :style="{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${2 + Math.random() * 2}s`,
        }"
      />
    </div>

    <!-- Scanlines overlay -->
    <div class="scanlines" />

    <!-- Top bar -->
    <TopBar
      :sfx-enabled="sfx.sfxEnabled.value"
      :show-leaderboard="showLeaderboard"
      @toggle-sfx="sfx.toggleSfx"
      @toggle-leaderboard="toggleLeaderboard"
    />

    <!-- Screens -->
    <Transition name="screen" mode="out-in">
      <WelcomeScreen v-if="screen === 'welcome'" key="welcome" @start="onStart" />
      <GameScreen
        v-else-if="screen === 'playing'"
        key="playing"
        :mode="mode"
        :score="score"
        :hearts="hearts"
        :max-hearts="MAX_HEARTS"
        :words-count="wordsCount"
        :current-word="currentWord"
        :word-history="wordHistory"
        :input-value="inputValue"
        :turn-progress="turnProgress"
        :turn-time-remaining="turnTimeRemaining"
        :is-urgent="isUrgent"
        :combo-level="combo.comboLevel.value"
        :combo-progress="combo.comboProgress.value"
        :combo-streak="combo.streak.value"
        :feedback-message="feedbackMessage"
        :feedback-type="feedbackType"
        @submit="submitAnswer"
        @update:input-value="inputValue = $event"
      />
      <GameOverScreen
        v-else
        key="gameover"
        :mode="mode"
        :score="score"
        :max-combo="combo.maxCombo.value"
        :words-count="wordsCount"
        @play-again="onPlayAgain"
        @back-to-welcome="goToWelcome"
        @show-leaderboard="toggleLeaderboard"
      />
    </Transition>

    <!-- Leaderboard modal -->
    <Transition name="modal">
      <LeaderboardModal
        v-if="showLeaderboard"
        :get-scores="leaderboard.getScores"
        @close="showLeaderboard = false"
      />
    </Transition>
  </div>
</template>

<style scoped>
.vnt-root {
  position: relative;
  min-height: 100vh;
  background: #0a1628;
  color: #f0ede6;
  font-family: 'Be Vietnam Pro', sans-serif;
  overflow: hidden;
}

/* Pixel stars background */
.bg-stars {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.star {
  position: absolute;
  width: 2px;
  height: 2px;
  background: #38bdf8;
  opacity: 0.3;
  animation: twinkle ease-in-out infinite alternate;
}

.star:nth-child(3n) {
  width: 3px;
  height: 3px;
  background: #ffb830;
  opacity: 0.2;
}

.star:nth-child(5n) {
  background: #f0ede6;
  opacity: 0.15;
}

@keyframes twinkle {
  from {
    opacity: 0.1;
  }
  to {
    opacity: 0.5;
  }
}

/* CRT scanlines overlay */
.scanlines {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 42;
  opacity: 0.03;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.3) 2px,
    rgba(0, 0, 0, 0.3) 4px
  );
}

/* Screen shake */
.shake-light {
  animation: shake-light 0.3s ease-in-out;
}

.shake-strong {
  animation: shake-strong 0.3s ease-in-out;
}

@keyframes shake-light {
  0%,
  100% {
    transform: translate(0);
  }
  25% {
    transform: translate(-2px, 1px);
  }
  50% {
    transform: translate(2px, -1px);
  }
  75% {
    transform: translate(-1px, 2px);
  }
}

@keyframes shake-strong {
  0%,
  100% {
    transform: translate(0);
  }
  10% {
    transform: translate(-4px, 2px);
  }
  20% {
    transform: translate(4px, -2px);
  }
  30% {
    transform: translate(-3px, 3px);
  }
  40% {
    transform: translate(3px, -1px);
  }
  50% {
    transform: translate(-2px, 4px);
  }
  60% {
    transform: translate(4px, -3px);
  }
  70% {
    transform: translate(-3px, 2px);
  }
  80% {
    transform: translate(2px, -4px);
  }
  90% {
    transform: translate(-4px, 3px);
  }
}

/* Screen transitions */
.screen-enter-active {
  transition: all 0.3s ease-out;
}

.screen-leave-active {
  transition: all 0.2s ease-in;
}

.screen-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.screen-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Modal transitions */
.modal-enter-active {
  transition: all 0.3s ease-out;
}

.modal-leave-active {
  transition: all 0.2s ease-in;
}

.modal-enter-from {
  opacity: 0;
}

.modal-leave-to {
  opacity: 0;
}
</style>
