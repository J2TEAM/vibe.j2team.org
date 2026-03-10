<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  sfxEnabled: boolean
  showLeaderboard: boolean
}>()

const emit = defineEmits<{
  toggleSfx: []
  toggleLeaderboard: []
}>()
</script>

<template>
  <div class="top-bar">
    <RouterLink to="/" class="top-bar-btn" title="Về trang chủ"> 🏠 </RouterLink>
    <div class="top-bar-right">
      <button
        class="top-bar-btn"
        :title="showLeaderboard ? 'Đóng BXH' : 'Bảng xếp hạng'"
        @click="emit('toggleLeaderboard')"
      >
        🏆
      </button>
      <button
        class="top-bar-btn"
        :class="{ 'sfx-off': !sfxEnabled }"
        :title="sfxEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'"
        @click="emit('toggleSfx')"
      >
        {{ sfxEnabled ? '🔊' : '🔇' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(180deg, rgba(15, 25, 35, 0.95) 0%, rgba(15, 25, 35, 0) 100%);
}

.top-bar-right {
  display: flex;
  gap: 8px;
}

.top-bar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 2px solid #253549;
  background: rgba(22, 34, 50, 0.8);
  color: #8b9db5;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
  text-decoration: none;
}

.top-bar-btn:hover {
  border-color: #38bdf8;
  color: #f0ede6;
  background: rgba(22, 34, 50, 1);
  transform: translateY(-1px);
}

.sfx-off {
  opacity: 0.5;
}
</style>
