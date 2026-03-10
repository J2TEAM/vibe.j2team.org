<template>
  <div class="menu-screen">
    <button class="home-btn-float" @click="goHome" title="Về trang chủ">← Trang chủ</button>
    <div class="menu-container">
      <h1 class="game-title">
        <span class="title-boom">BOOM</span>
        <span class="title-artillery">ARTILLERY</span>
      </h1>
      <p class="game-subtitle">💥 Bắn pháo chiến thuật - 1 vs 1 hoặc đấu với Bot! 💥</p>

      <div class="difficulty-select">
        <p class="diff-label">Chọn chế độ chơi:</p>
        <div class="diff-buttons">
          <button
            :class="['diff-btn', { active: gameMode === 'pve' }]"
            @click="$emit('update:gameMode', 'pve')"
          >
            🤖 Đấu với Bot
          </button>
          <button
            :class="['diff-btn', { active: gameMode === 'pvp' }]"
            @click="$emit('update:gameMode', 'pvp')"
          >
            🧑‍🤝‍🧑 2 Người Chơi
          </button>
        </div>
      </div>

      <div class="difficulty-select" v-if="gameMode === 'pve'">
        <p class="diff-label">Chọn độ khó Bot:</p>
        <div class="diff-buttons">
          <button
            v-for="d in DIFFICULTIES"
            :key="d.id"
            :class="['diff-btn', { active: modelValue === d.id }]"
            @click="$emit('update:modelValue', d.id)"
          >
            {{ d.icon }} {{ d.label }}
          </button>
        </div>
      </div>

      <button class="start-btn" @click="$emit('start')">
        <span>⚔️ BẮT ĐẦU CHIẾN ĐẤU</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { DIFFICULTIES } from './constants'

const router = useRouter()

defineProps<{
  modelValue: string
  gameMode: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
  'update:gameMode': [value: string]
  start: []
}>()

function goHome() {
  router.push('/')
}
</script>

<style scoped>
.menu-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  background: radial-gradient(ellipse at top, #1e293b 0%, #0f172a 70%);
  position: relative;
}

.home-btn-float {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #94a3b8;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 10;
  backdrop-filter: blur(4px);
}

.home-btn-float:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #e2e8f0;
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateX(-2px);
}

.menu-container {
  text-align: center;
  max-width: 600px;
  padding: 2rem;
}

.game-title {
  font-size: 3.5rem;
  margin-bottom: 0.5rem;
  line-height: 1.1;
}

.title-boom {
  display: block;
  background: linear-gradient(135deg, #f59e0b, #ef4444, #f97316);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 900;
  letter-spacing: 0.1em;
  filter: drop-shadow(0 0 20px rgba(245, 158, 11, 0.3));
}

.title-artillery {
  display: block;
  font-size: 0.5em;
  color: #94a3b8;
  letter-spacing: 0.4em;
  font-weight: 300;
}

.game-subtitle {
  color: #94a3b8;
  font-size: 1rem;
  margin-bottom: 2rem;
}

.difficulty-select {
  margin-bottom: 2rem;
}

.diff-label {
  color: #94a3b8;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.diff-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.diff-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  padding: 0.6rem 1.2rem;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.diff-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.diff-btn.active {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.start-btn {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  border: none;
  color: #fff;
  padding: 1rem 2.5rem;
  border-radius: 14px;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);
}

.start-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(245, 158, 11, 0.5);
}

@media (max-width: 640px) {
  .game-title {
    font-size: 2.5rem;
  }

  .menu-info {
    grid-template-columns: 1fr;
  }
}
</style>
