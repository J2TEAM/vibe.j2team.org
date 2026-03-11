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
  cups,
  currentWord,
  wordHistory,
  inputValue,
  isShaking,
  shakePower,
  feedbackMessage,
  feedbackType,
  lossReason,
  inputWarning,
  turnProgress,
  turnTimeRemaining,
  isUrgent,
  combo,
  startGame,
  submitAnswer,
  continuePlaying,
  stopAfterWin,
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
        :cups="cups"
        :words-count="wordsCount"
        :current-word="currentWord"
        :word-history="wordHistory"
        :input-value="inputValue"
        :input-warning="inputWarning"
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

      <!-- Bot defeated screen -->
      <div v-else-if="screen === 'bot-defeated'" key="bot-defeated" class="bot-defeated-screen">
        <div class="bot-defeated-content animate-fade-up">
          <div class="bot-defeated-icon">🏆</div>
          <h2 class="bot-defeated-title">BOT BÍ RỒI!</h2>
          <p class="bot-defeated-sub">Bạn đã thắng bot! +1 Cúp</p>
          <div class="bot-defeated-stats">
            <span>🏆 {{ cups }} cúp</span>
            <span>🪙 {{ score.toLocaleString() }} điểm</span>
          </div>
          <div class="bot-defeated-actions">
            <button class="action-btn action-continue" @click="continuePlaying">▶ Chơi tiếp</button>
            <button class="action-btn action-stop" @click="stopAfterWin">⏹ Dừng lại</button>
          </div>
        </div>
      </div>

      <GameOverScreen
        v-else
        key="gameover"
        :mode="mode"
        :score="score"
        :max-combo="combo.maxCombo.value"
        :words-count="wordsCount"
        :cups="cups"
        :loss-reason="lossReason"
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

:global(html),
:global(body) {
  overflow: hidden !important;
  background: #0a1628 !important;
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

/* Bot defeated screen */
.bot-defeated-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 80px 16px 32px;
  position: relative;
  z-index: 2;
}

.bot-defeated-content {
  max-width: 380px;
  width: 100%;
  text-align: center;
}

.bot-defeated-icon {
  font-size: 4rem;
  margin-bottom: 12px;
  animation: pulse-icon 1s ease-in-out infinite alternate;
}

@keyframes pulse-icon {
  from {
    transform: scale(1);
    opacity: 0.8;
  }
  to {
    transform: scale(1.15);
    opacity: 1;
  }
}

.bot-defeated-title {
  font-family: 'Anybody', sans-serif;
  font-size: 2.5rem;
  font-weight: 800;
  color: #ffb830;
  text-shadow: 0 0 30px rgba(255, 184, 48, 0.4);
  margin-bottom: 8px;
}

.bot-defeated-sub {
  color: #8b9db5;
  font-size: 1rem;
  margin-bottom: 24px;
}

.bot-defeated-stats {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 32px;
  font-family: 'Anybody', sans-serif;
  font-size: 1.125rem;
  font-weight: 700;
  color: #f0ede6;
}

.bot-defeated-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 46px;
  border: 2px solid #253549;
  background: #162232;
  color: #f0ede6;
  font-family: 'Anybody', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.action-continue {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.action-continue:hover {
  background: rgba(34, 197, 94, 0.2);
  transform: translateY(-2px);
}

.action-stop {
  border-color: #ffb830;
  color: #ffb830;
}

.action-stop:hover {
  background: rgba(255, 184, 48, 0.1);
  transform: translateY(-2px);
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
