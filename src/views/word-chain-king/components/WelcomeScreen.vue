<script setup lang="ts">
import type { GameMode } from '../types'

const emit = defineEmits<{
  start: [mode: GameMode]
}>()
</script>

<template>
  <div class="welcome-container">
    <!-- Title -->
    <div class="welcome-header animate-fade-up">
      <div class="pixel-crown">⚡</div>
      <h1 class="game-title">
        <span class="title-line1">VUA</span>
        <span class="title-line2">NỐI TỪ</span>
      </h1>
      <p class="game-subtitle">Nối từ để giải tỏa áp lực coding!</p>
      <div class="pixel-divider">
        <span v-for="n in 20" :key="n" class="pixel-dot" />
      </div>
    </div>

    <!-- Chế độ chơi -->
    <div class="mode-select animate-fade-up animate-delay-2">
      <h2 class="mode-title">🎮 Chọn chế độ</h2>

      <button class="mode-btn mode-normal" @click="emit('start', 'normal')">
        <div class="mode-btn-inner">
          <div class="mode-icon">👥</div>
          <div class="mode-info">
            <span class="mode-name">Đối kháng</span>
            <span class="mode-desc">Bot đưa từ → bạn nối → bot nối tiếp</span>
          </div>
          <span class="mode-arrow">▶</span>
        </div>
      </button>

      <button class="mode-btn mode-solo" @click="emit('start', 'solo')">
        <div class="mode-btn-inner">
          <div class="mode-icon">🏃</div>
          <div class="mode-info">
            <span class="mode-name">Tự kỷ lục</span>
            <span class="mode-desc">Tự nối từ liên tục, thử thách bản thân</span>
          </div>
          <span class="mode-arrow">▶</span>
        </div>
      </button>
    </div>

    <!-- How to play -->
    <div class="how-to-play animate-fade-up animate-delay-4">
      <h3 class="how-title">📖 Cách chơi</h3>
      <ul class="rules-list">
        <li><span class="rule-icon">⏱️</span> 30 giây mỗi lượt</li>
        <li><span class="rule-icon">❤️</span> 3 mạng sống, sai mất 1</li>
        <li><span class="rule-icon">🔥</span> Combo x2 → x5 khi nối đúng liên tiếp</li>
        <li><span class="rule-icon">🏆</span> Ghi điểm cao nhất!</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.welcome-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 80px 16px 32px;
  gap: 32px;
}

.welcome-header {
  text-align: center;
}

.pixel-crown {
  font-size: 3rem;
  margin-bottom: 8px;
  animation: float 2s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.game-title {
  font-family: 'Anybody', sans-serif;
  line-height: 1;
  letter-spacing: -2px;
}

.title-line1 {
  display: block;
  font-size: 4rem;
  font-weight: 800;
  color: #38bdf8;
  text-shadow: 0 0 30px rgba(56, 189, 248, 0.3);
}

.title-line2 {
  display: block;
  font-size: 3.5rem;
  font-weight: 800;
  color: #f0ede6;
  text-shadow: 4px 4px 0 rgba(56, 189, 248, 0.2);
}

.game-subtitle {
  margin-top: 12px;
  color: #8b9db5;
  font-size: 1rem;
  letter-spacing: 1px;
}

.pixel-divider {
  display: flex;
  gap: 4px;
  justify-content: center;
  margin-top: 16px;
}

.pixel-dot {
  width: 4px;
  height: 4px;
  background: #253549;
}

.pixel-dot:nth-child(3n) {
  background: #38bdf8;
  opacity: 0.5;
}

/* Mode Selection */
.mode-select {
  width: 100%;
  max-width: 420px;
}

.mode-title {
  font-family: 'Anybody', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: #38bdf8;
  text-transform: uppercase;
  letter-spacing: 3px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.mode-btn {
  display: block;
  width: 100%;
  padding: 0;
  border: 2px solid #253549;
  background: #162232;
  cursor: pointer;
  margin-bottom: 12px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.mode-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(56, 189, 248, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.mode-btn:hover::before {
  opacity: 1;
}

.mode-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(56, 189, 248, 0.15);
}

.mode-normal:hover {
  border-color: #38bdf8;
}

.mode-solo:hover {
  border-color: #ffb830;
}

.mode-btn-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  position: relative;
  z-index: 1;
}

.mode-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #253549;
  background: rgba(15, 25, 35, 0.5);
  font-size: 1.5rem;
}

.mode-info {
  flex: 1;
  text-align: left;
}

.mode-name {
  display: block;
  font-family: 'Anybody', sans-serif;
  font-size: 1.125rem;
  font-weight: 700;
  color: #f0ede6;
  margin-bottom: 4px;
}

.mode-desc {
  display: block;
  font-size: 0.8rem;
  color: #8b9db5;
  line-height: 1.4;
}

.mode-arrow {
  color: #4a6180;
  flex-shrink: 0;
  transition: transform 0.3s;
  font-size: 0.75rem;
}

.mode-btn:hover .mode-arrow {
  transform: translateX(4px);
  color: #f0ede6;
}

/* How to play */
.how-to-play {
  width: 100%;
  max-width: 420px;
  border: 2px solid #253549;
  background: rgba(22, 34, 50, 0.5);
  padding: 20px;
}

.how-title {
  font-family: 'Anybody', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: #8b9db5;
  text-transform: uppercase;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.rules-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rules-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #8b9db5;
}

.rule-icon {
  font-size: 1rem;
  width: 24px;
  text-align: center;
}

@media (max-width: 480px) {
  .title-line1 {
    font-size: 3rem;
  }
  .title-line2 {
    font-size: 2.5rem;
  }
}
</style>
