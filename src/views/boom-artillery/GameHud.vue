<template>
  <div class="hud">
    <div class="hud-player hud-left">
      <div class="hud-avatar player-avatar">🧑‍✈️</div>
      <div class="hud-info">
        <span class="hud-name">{{ gameMode === 'pvp' ? 'Người chơi 1' : 'Bạn' }}</span>
      </div>
    </div>

    <div class="hud-center">
      <div class="hud-center-top">
        <div class="turn-indicator" :class="{ 'bot-turn': currentTurn === 'bot' }">
          <template v-if="gameMode === 'pvp'">
            {{ currentTurn === 'player' ? '🎯 Lượt Người chơi 1' : '🎯 Lượt Người chơi 2' }}
          </template>
          <template v-else>
            {{ currentTurn === 'player' ? '🎯 Lượt của bạn' : '🤖 Bot đang ngắm...' }}
          </template>
        </div>
      </div>
    </div>

    <div class="hud-right-section">
      <div class="hud-player hud-right">
        <div class="hud-info" style="text-align: right">
          <span class="hud-name">
            <template v-if="gameMode === 'pvp'">Người chơi 2</template>
            <template v-else>Bot {{ diffLabel }}</template>
          </span>
        </div>
      </div>
      <button class="home-btn" @click="$emit('home')" title="Về trang chủ">🏠</button>
      <button class="exit-btn" @click="$emit('exit')" title="Thoát về Menu">✕</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Turn } from './types'

defineProps<{
  playerHP: number
  botHP: number
  currentTurn: Turn
  gameMode: string
  wind: number
  diffLabel: string
}>()

defineEmits<{
  exit: []
  home: []
}>()
</script>

<style scoped>
.hud {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 12px;
  margin-bottom: 0.25rem;
  backdrop-filter: blur(8px);
  flex-wrap: wrap;
  gap: 0.5rem;
}

.hud-player {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 140px;
}

.hud-avatar {
  font-size: 2rem;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.hud-name {
  font-weight: 700;
  font-size: 0.85rem;
}

.hud-center {
  text-align: center;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.hud-center-top {
  text-align: center;
}

.turn-indicator {
  font-weight: 700;
  font-size: 0.9rem;
  color: #4ade80;
  transition: color 0.3s;
}

.turn-indicator.bot-turn {
  color: #f87171;
}

/* Right section with bot info + exit button */
.hud-right-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  justify-content: flex-end;
  min-width: 160px;
}

.home-btn {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.home-btn:hover {
  background: rgba(59, 130, 246, 0.35);
  border-color: rgba(59, 130, 246, 0.5);
  transform: scale(1.1);
}

.home-btn:active {
  transform: scale(0.95);
}

.exit-btn {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.exit-btn:hover {
  background: rgba(239, 68, 68, 0.35);
  border-color: rgba(239, 68, 68, 0.5);
  transform: scale(1.1);
}

.exit-btn:active {
  transform: scale(0.95);
}

.exit-btn:active {
  transform: scale(0.95);
}

@media (max-width: 640px) {
  .hud {
    flex-direction: column;
    align-items: stretch;
  }

  .hud-player {
    justify-content: center;
  }

  .hud-right-section {
    justify-content: center;
  }
}
</style>
