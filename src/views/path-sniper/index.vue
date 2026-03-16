<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router' // Import RouterLink
import { defineAsyncComponent } from 'vue'

const SinglePlayer = defineAsyncComponent(() => import('./SinglePlayer.vue'))
const OnlineDuel = defineAsyncComponent(() => import('./OnlineDue.vue'))

const currentMode = ref<'lobby' | 'single' | 'online'>('lobby')

const goToSingle = () => {
  currentMode.value = 'single'
}
const goToOnline = () => {
  currentMode.value = 'online'
}
const backToLobby = () => {
  currentMode.value = 'lobby'
}
</script>

<template>
  <div class="game-container">
    <RouterLink
      v-if="currentMode === 'lobby'"
      to="/"
      class="home-button"
      title="Về trang chủ dự án"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    </RouterLink>

    <div v-if="currentMode === 'lobby'" class="lobby-screen">
      <div class="header">
        <h1 class="title">PATH <span class="highlight">SNIPER</span></h1>
        <p class="subtitle">Báo Thủ Tọa Độ - J2TEAM Vibe Edition</p>
      </div>

      <div class="mode-selection">
        <div @click="goToSingle" class="mode-card single-card">
          <div class="icon">🧩</div>
          <h2>SINGLE PLAYER</h2>
          <p>Chế độ giải đố, hướng dẫn và thử thách vô hạn.</p>
          <div class="action-btn">BẮT ĐẦU</div>
        </div>

        <div @click="goToOnline" class="mode-card online-card">
          <div class="icon">⚔️</div>
          <h2>ONLINE DUEL</h2>
          <p>Đối kháng WebRTC. Solo cùng bạn bè qua mã mời.</p>
          <div class="action-btn">THÁCH ĐẤU</div>
        </div>
      </div>

      <div class="footer">
        <p>Built with ❤️ for J2TEAM Vibe</p>
      </div>
    </div>

    <SinglePlayer v-if="currentMode === 'single'" @back="backToLobby" />
    <OnlineDuel v-if="currentMode === 'online'" @back="backToLobby" />
  </div>
</template>

<style scoped>
/* CSS cho nút Home mới */
.home-button {
  position: absolute;
  top: 2rem;
  left: 2rem;
  z-index: 150;
  padding: 0.75rem;
  background-color: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
  color: #94a3b8;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-button:hover {
  background-color: #1e293b;
  color: #22d3ee;
  border-color: #22d3ee;
  transform: scale(1.1);
  box-shadow: 0 0 20px rgba(34, 211, 238, 0.2);
}

/* Giữ nguyên các Style cũ của bạn */
.game-container {
  height: 100vh;
  width: 100%;
  background-color: #020617;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  overflow: hidden;
  color: #cbd5e1;
  position: relative;
}

.lobby-screen {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem;
  animation: fadeIn 0.7s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.header {
  text-align: center;
  margin-bottom: 4rem;
}
.title {
  font-size: 3.75rem;
  font-weight: 900;
  font-style: italic;
  letter-spacing: -0.05em;
  color: #ffffff;
  margin-bottom: 0.5rem;
}
.highlight {
  color: #22d3ee;
}
.subtitle {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5em;
  color: #64748b;
}

.mode-selection {
  display: flex;
  gap: 2.5rem;
  max-width: 64rem;
  width: 100%;
}

.mode-card {
  flex: 1;
  padding: 2.5rem;
  background-color: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 2.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mode-card:hover {
  transform: scale(1.02);
  background-color: #0f172a;
}
.single-card:hover {
  border-color: rgba(34, 211, 238, 0.5);
  box-shadow: 0 0 50px rgba(34, 211, 238, 0.1);
}
.online-card:hover {
  border-color: rgba(168, 85, 247, 0.5);
  box-shadow: 0 0 50px rgba(168, 85, 247, 0.1);
}

.icon {
  font-size: 3rem;
  margin-bottom: 1.5rem;
}
h2 {
  font-size: 1.5rem;
  font-weight: 900;
  margin-bottom: 1rem;
}
.single-card h2 {
  color: #22d3ee;
}
.online-card h2 {
  color: #a855f7;
}
p {
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.625;
  margin-bottom: 2rem;
}

.action-btn {
  margin-top: auto;
  padding: 0.75rem 2rem;
  border-radius: 0.75rem;
  font-weight: 900;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
}
.single-card .action-btn {
  background-color: #0891b2;
  color: #ffffff;
}
.online-card .action-btn {
  background-color: #9333ea;
  color: #ffffff;
}

.footer {
  position: absolute;
  bottom: 2.5rem;
  opacity: 0.2;
  font-size: 10px;
  text-transform: uppercase;
}
</style>
