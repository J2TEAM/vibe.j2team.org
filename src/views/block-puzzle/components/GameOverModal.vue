<script setup lang="ts">
interface Props {
  score: number
  highScore: number
  isShowing: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'restart-game': []
}>()

function handleRestart() {
  emit('restart-game')
}
</script>

<template>
  <div v-if="isShowing" class="modal-overlay">
    <div class="modal-content">
      <h2 class="modal-title">Game Over!</h2>

      <div class="score-section">
        <div class="score-info">
          <div class="score-label">Final Score</div>
          <div class="score-value">{{ score }}</div>
        </div>
        <div v-if="score === highScore" class="new-record">
          <span>🎉 New Record! 🎉</span>
        </div>
      </div>

      <button class="restart-button" @click="handleRestart">Play Again</button>
      <RouterLink to="/" class="home-link">Back to Home</RouterLink>
    </div>
  </div>
</template>

<style scoped lang="css">
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 25, 35, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: #1e2f42;
  border: 2px solid #ff6b4a;
  padding: 32px 24px;
  text-align: center;
  width: min(92vw, 360px);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-title {
  font-family: 'Anybody', sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: #ff6b4a;
  margin: 0 0 24px 0;
}

.score-section {
  margin-bottom: 24px;
}

.score-info {
  margin-bottom: 12px;
}

.score-label {
  font-size: 12px;
  color: #8b9db5;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.score-value {
  font-family: 'Anybody', sans-serif;
  font-size: 48px;
  font-weight: 700;
  color: #ffb830;
}

.new-record {
  font-family: 'Anybody', sans-serif;
  font-size: 20px;
  color: #38bdf8;
  margin-top: 12px;
  font-weight: 600;
}

.restart-button {
  width: 100%;
  padding: 12px 16px;
  margin-bottom: 12px;
  background: #ff6b4a;
  color: white;
  border: none;
  font-family: 'Anybody', sans-serif;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.restart-button:hover {
  background: #ff5533;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 74, 0.3);
}

.home-link {
  display: block;
  color: #38bdf8;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s ease;
}

.home-link:hover {
  color: #0ea5e9;
  text-decoration: underline;
}

@media (max-width: 480px) {
  .modal-content {
    padding: 22px 14px;
  }

  .modal-title {
    font-size: 28px;
    margin-bottom: 16px;
  }

  .score-value {
    font-size: 40px;
  }
}
</style>
