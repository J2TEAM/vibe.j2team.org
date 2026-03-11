<script setup lang="ts">
import type { GameMode, LossReason } from '../types'

defineProps<{
  mode: GameMode
  score: number
  maxCombo: number
  wordsCount: number
  cups: number
  lossReason: LossReason
}>()

const emit = defineEmits<{
  playAgain: []
  backToWelcome: []
  showLeaderboard: []
}>()

function getLossText(reason: LossReason): string {
  switch (reason) {
    case 'hearts':
      return 'Hết mạng!'
    case 'timeout':
      return 'Hết giờ!'
    case 'quit':
      return 'Dừng lại!'
    default:
      return 'Kết thúc!'
  }
}

function getLossIcon(reason: LossReason): string {
  switch (reason) {
    case 'hearts':
      return '💔'
    case 'timeout':
      return '⏰'
    case 'quit':
      return '🏁'
    default:
      return '💀'
  }
}
</script>

<template>
  <div class="gameover-container">
    <div class="gameover-content animate-fade-up">
      <!-- Game Over Title -->
      <div class="gameover-header">
        <div class="gameover-icon">{{ getLossIcon(lossReason) }}</div>
        <h1 class="gameover-title">{{ getLossText(lossReason) }}</h1>
        <p class="gameover-mode">Chế độ: {{ mode === 'normal' ? 'Đối kháng' : 'Tự kỷ lục' }}</p>
      </div>

      <!-- Stats -->
      <div class="stats-grid" :class="{ 'stats-with-cups': mode === 'normal' }">
        <div class="stat-card stat-score">
          <span class="stat-emoji">🪙</span>
          <span class="stat-value">{{ score.toLocaleString() }}</span>
          <span class="stat-label">Điểm số</span>
        </div>
        <div v-if="mode === 'normal'" class="stat-card stat-cups">
          <span class="stat-emoji">🏆</span>
          <span class="stat-value">{{ cups }}</span>
          <span class="stat-label">Cúp</span>
        </div>
        <div class="stat-card stat-combo">
          <span class="stat-emoji">⚡</span>
          <span class="stat-value">{{ maxCombo }}</span>
          <span class="stat-label">Combo max</span>
        </div>
        <div class="stat-card stat-words">
          <span class="stat-emoji">📝</span>
          <span class="stat-value">{{ wordsCount }}</span>
          <span class="stat-label">Từ đã nối</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions animate-fade-up animate-delay-3">
        <button class="action-btn action-play" @click="emit('playAgain')">🔄 Chơi lại</button>
        <button class="action-btn action-leaderboard" @click="emit('showLeaderboard')">
          🏆 Bảng xếp hạng
        </button>
        <button class="action-btn action-home" @click="emit('backToWelcome')">
          ← Chọn chế độ khác
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gameover-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 80px 16px 32px;
}

.gameover-content {
  max-width: 420px;
  width: 100%;
}

.gameover-header {
  text-align: center;
  margin-bottom: 32px;
}

.gameover-icon {
  font-size: 3rem;
  margin-bottom: 8px;
  animation: pulse-icon 1s ease-in-out infinite alternate;
}

@keyframes pulse-icon {
  from {
    transform: scale(1);
    opacity: 0.8;
  }
  to {
    transform: scale(1.1);
    opacity: 1;
  }
}

.gameover-title {
  font-family: 'Anybody', sans-serif;
  font-size: 3rem;
  font-weight: 800;
  color: #ff6b4a;
  text-shadow: 0 0 30px rgba(255, 107, 74, 0.3);
  letter-spacing: -1px;
}

.gameover-mode {
  color: #8b9db5;
  font-size: 0.875rem;
  margin-top: 4px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 32px;
}

.stats-with-cups {
  grid-template-columns: repeat(4, 1fr);
}

.stat-card {
  border: 2px solid #253549;
  background: #162232;
  padding: 16px 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.stat-cups {
  border-color: rgba(255, 184, 48, 0.4);
  background: rgba(255, 184, 48, 0.05);
}

.stat-cups .stat-value {
  color: #ffb830;
}

.stat-emoji {
  font-size: 1.5rem;
}

.stat-value {
  font-family: 'Anybody', sans-serif;
  font-size: 1.5rem;
  font-weight: 800;
  color: #f0ede6;
}

.stat-label {
  font-size: 0.625rem;
  color: #8b9db5;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.actions {
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
  letter-spacing: 0.5px;
}

.action-play {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
}

.action-play:hover {
  background: rgba(56, 189, 248, 0.2);
  transform: translateY(-2px);
}

.action-leaderboard {
  border-color: #ffb830;
  color: #ffb830;
}

.action-leaderboard:hover {
  background: rgba(255, 184, 48, 0.1);
  transform: translateY(-2px);
}

.action-home:hover {
  border-color: #8b9db5;
  transform: translateY(-2px);
}

@media (max-width: 480px) {
  .gameover-title {
    font-size: 2.5rem;
  }
  .stat-value {
    font-size: 1.25rem;
  }
  .stats-with-cups {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
