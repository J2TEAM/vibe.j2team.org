<script setup lang="ts">
import { ref } from 'vue'
import type { GameMode, LeaderboardEntry } from '../types'

const props = defineProps<{
  getScores: (mode: GameMode) => LeaderboardEntry[]
}>()

defineEmits<{
  close: []
}>()

const activeTab = ref<GameMode>('normal')
</script>

<template>
  <div class="lb-overlay" @click.self="$emit('close')">
    <div class="lb-modal animate-fade-up">
      <!-- Header -->
      <div class="lb-header">
        <span class="lb-trophy">🏆</span>
        <h2 class="lb-title">Bảng xếp hạng</h2>
        <button class="lb-close" @click="$emit('close')">✕</button>
      </div>

      <!-- Tabs -->
      <div class="lb-tabs">
        <button
          class="lb-tab"
          :class="{ active: activeTab === 'normal' }"
          @click="activeTab = 'normal'"
        >
          👥 Đối kháng
        </button>
        <button
          class="lb-tab"
          :class="{ active: activeTab === 'solo' }"
          @click="activeTab = 'solo'"
        >
          🏃 Tự kỷ lục
        </button>
      </div>

      <!-- Scores -->
      <div class="lb-scores">
        <div v-if="props.getScores(activeTab).length === 0" class="lb-empty">
          <span class="lb-empty-icon">😢</span>
          <p>Chưa có kỷ lục nào</p>
        </div>
        <div v-else class="lb-list">
          <div class="lb-list-header">
            <span class="lb-col lb-rank">#</span>
            <span class="lb-col lb-score-h">Điểm</span>
            <span class="lb-col lb-combo-h">Combo</span>
            <span class="lb-col lb-words-h">Từ</span>
            <span class="lb-col lb-date-h">Ngày</span>
          </div>
          <div
            v-for="(entry, idx) in props.getScores(activeTab)"
            :key="idx"
            class="lb-row"
            :class="{
              'lb-gold': idx === 0,
              'lb-silver': idx === 1,
              'lb-bronze': idx === 2,
            }"
          >
            <span class="lb-col lb-rank">
              <span v-if="idx === 0" class="medal">🥇</span>
              <span v-else-if="idx === 1" class="medal">🥈</span>
              <span v-else-if="idx === 2" class="medal">🥉</span>
              <span v-else>{{ idx + 1 }}</span>
            </span>
            <span class="lb-col lb-score-val">{{ entry.score.toLocaleString() }}</span>
            <span class="lb-col lb-combo-val">{{ entry.maxCombo }}</span>
            <span class="lb-col lb-words-val">{{ entry.wordsCount }}</span>
            <span class="lb-col lb-date-val">{{ entry.date }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lb-overlay {
  position: fixed;
  inset: 0;
  z-index: 45;
  background: rgba(15, 25, 35, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.lb-modal {
  width: 100%;
  max-width: 520px;
  max-height: 80vh;
  border: 2px solid #253549;
  background: #0f1923;
  display: flex;
  flex-direction: column;
}

.lb-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 2px solid #253549;
}

.lb-trophy {
  font-size: 1.25rem;
}

.lb-title {
  flex: 1;
  font-family: 'Anybody', sans-serif;
  font-size: 1.125rem;
  font-weight: 700;
  color: #f0ede6;
}

.lb-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #253549;
  background: transparent;
  color: #8b9db5;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.lb-close:hover {
  border-color: #ff6b4a;
  color: #ff6b4a;
}

.lb-tabs {
  display: flex;
  border-bottom: 2px solid #253549;
}

.lb-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border: none;
  background: transparent;
  color: #4a6180;
  font-family: 'Anybody', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 0.5px;
}

.lb-tab:hover {
  color: #8b9db5;
  background: rgba(56, 189, 248, 0.05);
}

.lb-tab.active {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.08);
  border-bottom: 2px solid #38bdf8;
  margin-bottom: -2px;
}

.lb-scores {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;
}

.lb-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 20px;
  color: #4a6180;
  font-size: 0.875rem;
}

.lb-empty-icon {
  font-size: 2rem;
}

.lb-list-header {
  display: flex;
  align-items: center;
  padding: 4px 20px 8px;
  font-size: 0.625rem;
  font-family: 'Anybody', sans-serif;
  color: #4a6180;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.lb-row {
  display: flex;
  align-items: center;
  padding: 8px 20px;
  font-size: 0.8rem;
  color: #8b9db5;
  transition: background 0.2s;
}

.lb-row:hover {
  background: rgba(30, 47, 66, 0.5);
}

.lb-gold {
  color: #ffb830;
}
.lb-silver {
  color: #c0c0c0;
}
.lb-bronze {
  color: #cd7f32;
}

.lb-col {
  text-align: center;
}

.lb-rank {
  width: 36px;
  flex-shrink: 0;
}
.lb-score-h,
.lb-score-val {
  flex: 1;
  text-align: right;
}
.lb-combo-h,
.lb-combo-val {
  width: 60px;
}
.lb-words-h,
.lb-words-val {
  width: 48px;
}
.lb-date-h,
.lb-date-val {
  width: 80px;
  text-align: right;
}

.lb-score-val {
  font-family: 'Anybody', sans-serif;
  font-weight: 700;
  color: #f0ede6;
}

.lb-gold .lb-score-val {
  color: #ffb830;
}
.lb-silver .lb-score-val {
  color: #c0c0c0;
}
.lb-bronze .lb-score-val {
  color: #cd7f32;
}

.medal {
  font-size: 1rem;
}

.lb-date-val {
  font-size: 0.7rem;
  color: #4a6180;
}

.lb-scores::-webkit-scrollbar {
  width: 4px;
}
.lb-scores::-webkit-scrollbar-track {
  background: transparent;
}
.lb-scores::-webkit-scrollbar-thumb {
  background: #253549;
}

@media (max-width: 480px) {
  .lb-date-h,
  .lb-date-val {
    display: none;
  }
}
</style>
