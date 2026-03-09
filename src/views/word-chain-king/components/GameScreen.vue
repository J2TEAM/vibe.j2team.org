<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import type { ComboLevel, WordHistoryItem } from '../types'
import ComboRing from './ComboRing.vue'

const props = defineProps<{
  mode: 'normal' | 'solo'
  score: number
  hearts: number
  maxHearts: number
  wordsCount: number
  currentWord: string
  wordHistory: WordHistoryItem[]
  inputValue: string
  turnProgress: number
  turnTimeRemaining: number
  isUrgent: boolean
  comboLevel: ComboLevel
  comboProgress: number
  comboStreak: number
  feedbackMessage: string
  feedbackType: 'success' | 'error' | ''
}>()

const emit = defineEmits<{
  submit: []
  'update:inputValue': [value: string]
}>()

const inputRef = ref<HTMLInputElement>()
const historyRef = ref<HTMLDivElement>()

const timerSeconds = computed(() => Math.ceil(props.turnTimeRemaining / 1000))
const timerBarWidth = computed(() => `${props.turnProgress * 100}%`)

const timerColor = computed(() => {
  if (props.turnProgress > 0.66) return '#38bdf8'
  if (props.turnProgress > 0.33) return '#ffb830'
  return '#ff6b4a'
})

const urgentBgOpacity = computed(() => {
  if (!props.isUrgent) return 0
  const urgentProgress = 1 - props.turnTimeRemaining / 10000
  return Math.min(0.15, urgentProgress * 0.15)
})

function onInputUpdate(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:inputValue', target.value)
}

function onSubmit() {
  emit('submit')
  nextTick(() => {
    inputRef.value?.focus()
  })
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    onSubmit()
  }
}

watch(
  () => props.wordHistory.length,
  () => {
    nextTick(() => {
      if (historyRef.value) {
        historyRef.value.scrollTop = historyRef.value.scrollHeight
      }
    })
  },
)

onMounted(() => {
  nextTick(() => {
    inputRef.value?.focus()
  })
})
</script>

<template>
  <div class="game-screen">
    <!-- Urgent red overlay -->
    <div class="urgent-overlay" :style="{ opacity: urgentBgOpacity }" />

    <!-- Score + Hearts bar -->
    <div class="status-bar">
      <div class="score-display">
        <span class="score-emoji">🪙</span>
        <span class="score-value">{{ score.toLocaleString() }}</span>
      </div>
      <div class="hearts-display">
        <span v-for="i in maxHearts" :key="i" class="heart" :class="{ 'heart-lost': i > hearts }">
          {{ i <= hearts ? '❤️' : '🖤' }}
        </span>
      </div>
    </div>

    <!-- Timer bar -->
    <div class="timer-container">
      <div class="timer-bar-bg">
        <div class="timer-bar-fill" :style="{ width: timerBarWidth, background: timerColor }" />
      </div>
      <div class="timer-text" :style="{ color: timerColor }">{{ timerSeconds }}s</div>
    </div>

    <!-- Combo ring -->
    <div class="combo-area">
      <ComboRing :level="comboLevel" :progress="comboProgress" :streak="comboStreak" />
    </div>

    <!-- Word history -->
    <div ref="historyRef" class="word-history">
      <div
        v-for="(item, idx) in wordHistory"
        :key="idx"
        class="history-item"
        :class="{
          'history-bot': item.isBot,
          'history-user': !item.isBot,
          'history-wrong': !item.isCorrect,
        }"
      >
        <span class="history-label">{{ item.isBot ? 'BOT' : 'YOU' }}</span>
        <span class="history-word">{{ item.word }}</span>
        <span v-if="!item.isCorrect" class="wrong-icon">✕</span>
      </div>
    </div>

    <!-- Current word prompt -->
    <div class="current-prompt">
      <div class="prompt-label">Nối tiếp từ:</div>
      <div class="prompt-word">{{ currentWord }}</div>
    </div>

    <!-- Feedback message -->
    <div v-if="feedbackMessage" class="feedback" :class="`feedback-${feedbackType}`">
      {{ feedbackMessage }}
    </div>

    <!-- Input -->
    <div class="input-area">
      <input
        ref="inputRef"
        type="text"
        class="word-input"
        :value="inputValue"
        placeholder="Gõ từ nối tiếp..."
        autocomplete="off"
        autocapitalize="off"
        @input="onInputUpdate"
        @keydown="onKeydown"
      />
      <button class="submit-btn" @click="onSubmit">✓</button>
    </div>

    <!-- Word count -->
    <div class="word-count">📝 {{ wordsCount }} từ đã nối</div>
  </div>
</template>

<style scoped>
.game-screen {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 64px 16px 24px;
  position: relative;
}

.urgent-overlay {
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 30%, rgba(255, 50, 50, 1) 100%);
  pointer-events: none;
  z-index: 1;
  transition: opacity 0.3s;
}

.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  position: relative;
  z-index: 2;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 6px;
}

.score-emoji {
  font-size: 1.125rem;
}

.score-value {
  font-family: 'Anybody', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #f0ede6;
}

.hearts-display {
  display: flex;
  gap: 4px;
  font-size: 1.125rem;
}

.heart {
  transition: all 0.3s;
}
.heart-lost {
  opacity: 0.4;
  filter: grayscale(1);
}

.timer-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  position: relative;
  z-index: 2;
}

.timer-bar-bg {
  flex: 1;
  height: 6px;
  background: #1e2f42;
  overflow: hidden;
}

.timer-bar-fill {
  height: 100%;
  transition:
    width 0.1s linear,
    background 0.5s;
}

.timer-text {
  font-family: 'Anybody', sans-serif;
  font-size: 0.875rem;
  font-weight: 700;
  min-width: 32px;
  text-align: right;
}

.combo-area {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
  min-height: 32px;
  position: relative;
  z-index: 2;
}

.word-history {
  flex: 1;
  overflow-y: auto;
  max-height: 240px;
  border: 2px solid #253549;
  background: rgba(22, 34, 50, 0.5);
  padding: 12px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  z-index: 2;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  font-size: 0.875rem;
}

.history-label {
  font-family: 'Anybody', sans-serif;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 2px 6px;
  flex-shrink: 0;
}

.history-bot .history-label {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
}

.history-user .history-label {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.history-wrong .history-label {
  background: rgba(255, 107, 74, 0.15);
  color: #ff6b4a;
}

.history-word {
  color: #f0ede6;
  font-weight: 500;
}

.history-wrong .history-word {
  color: #ff6b4a;
  text-decoration: line-through;
  opacity: 0.7;
}

.wrong-icon {
  color: #ff6b4a;
  font-weight: 700;
  font-size: 0.75rem;
}

.current-prompt {
  text-align: center;
  margin-bottom: 12px;
  position: relative;
  z-index: 2;
}

.prompt-label {
  font-size: 0.75rem;
  color: #8b9db5;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 4px;
}

.prompt-word {
  font-family: 'Anybody', sans-serif;
  font-size: 1.75rem;
  font-weight: 800;
  color: #38bdf8;
  text-shadow: 0 0 20px rgba(56, 189, 248, 0.3);
  animation: word-in 0.3s ease-out;
}

@keyframes word-in {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.feedback {
  text-align: center;
  font-family: 'Anybody', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 8px;
  margin-bottom: 8px;
  animation: feedback-pop 0.3s ease-out;
  position: relative;
  z-index: 2;
}

.feedback-success {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.feedback-error {
  color: #ff6b4a;
  background: rgba(255, 107, 74, 0.1);
  border: 1px solid rgba(255, 107, 74, 0.2);
}

@keyframes feedback-pop {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.input-area {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  position: relative;
  z-index: 2;
  max-width: 560px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.word-input {
  flex: 1;
  height: 56px;
  padding: 0 20px;
  border: 2px solid #253549;
  background: #162232;
  color: #f0ede6;
  font-family: 'Be Vietnam Pro', sans-serif;
  font-size: 1.125rem;
  outline: none;
  transition: border-color 0.2s;
}

.word-input:focus {
  border-color: #38bdf8;
}

.word-input::placeholder {
  color: #4a6180;
}

.submit-btn {
  width: 56px;
  height: 56px;
  border: 2px solid #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.submit-btn:hover {
  background: rgba(56, 189, 248, 0.2);
  transform: translateY(-1px);
}

.submit-btn:active {
  transform: translateY(0);
}

.word-count {
  text-align: center;
  font-size: 0.75rem;
  color: #4a6180;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  position: relative;
  z-index: 2;
}

.word-history::-webkit-scrollbar {
  width: 4px;
}
.word-history::-webkit-scrollbar-track {
  background: transparent;
}
.word-history::-webkit-scrollbar-thumb {
  background: #253549;
}

@media (max-width: 480px) {
  .prompt-word {
    font-size: 1.5rem;
  }
  .word-history {
    max-height: 180px;
  }
}
</style>
