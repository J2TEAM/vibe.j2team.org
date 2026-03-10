<template>
  <div class="gameover-overlay">
    <div class="gameover-box">
      <h2 :class="winner === 'player' ? 'win-text' : gameMode === 'pvp' ? 'win-text' : 'lose-text'">
        <template v-if="gameMode === 'pvp'">
          {{ winner === 'player' ? '🏆 Người chơi 1 Thắng!' : '🏆 Người chơi 2 Thắng!' }}
        </template>
        <template v-else>
          {{ winner === 'player' ? '🏆 CHIẾN THẮNG!' : '💀 THUA CUỘC!' }}
        </template>
      </h2>
      <p class="gameover-sub">
        <template v-if="gameMode === 'pvp'">
          {{
            winner === 'player' ? 'Người chơi 2 đã bị tiêu diệt!' : 'Người chơi 1 đã bị tiêu diệt!'
          }}
        </template>
        <template v-else>
          {{ winner === 'player' ? 'Bot đã bị tiêu diệt!' : 'Bạn đã bị Bot hạ gục!' }}
        </template>
      </p>
      <div class="gameover-stats">
        <div class="stat">
          <span class="stat-label">Lượt bắn</span>
          <span class="stat-value">{{ totalShots }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Trúng đích</span>
          <span class="stat-value">{{ totalHits }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Chính xác</span>
          <span class="stat-value">{{ accuracy }}%</span>
        </div>
      </div>
      <div class="gameover-actions">
        <button class="restart-btn" @click="$emit('restart')">🔄 Chơi lại</button>
        <button class="menu-btn-back" @click="$emit('menu')">📋 Menu</button>
        <button class="home-btn-back" @click="$emit('home')">🌐 Trang chủ</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Winner } from './types'

defineProps<{
  winner: Winner
  gameMode: string
  totalShots: number
  totalHits: number
  accuracy: number
}>()

defineEmits<{
  restart: []
  menu: []
  home: []
}>()
</script>

<style scoped>
.gameover-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.gameover-box {
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2.5rem;
  text-align: center;
  max-width: 400px;
  width: 90%;
  animation: popIn 0.4s ease-out;
}

@keyframes popIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.win-text {
  font-size: 2rem;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.lose-text {
  font-size: 2rem;
  color: #ef4444;
}

.gameover-sub {
  color: #94a3b8;
  margin: 0.5rem 0 1.5rem;
}

.gameover-stats {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
}

.stat-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #f59e0b;
}

.gameover-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.restart-btn {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  border: none;
  color: #fff;
  padding: 0.7rem 1.5rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}

.restart-btn:hover {
  transform: translateY(-2px);
}

.menu-btn-back {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #cbd5e1;
  padding: 0.7rem 1.5rem;
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.menu-btn-back:hover {
  background: rgba(255, 255, 255, 0.15);
}

.home-btn-back {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #60a5fa;
  padding: 0.7rem 1.5rem;
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.home-btn-back:hover {
  background: rgba(59, 130, 246, 0.3);
  transform: translateY(-2px);
}
</style>
