<script setup lang="ts">
interface Props {
  score: number
  highScore: number
}

defineProps<Props>()
</script>

<template>
  <div class="score-display">
    <div class="score-item">
      <div class="score-label">Score</div>
      <div class="score-value">{{ score }}</div>
    </div>
    <div class="score-divider" />
    <div class="score-item">
      <div class="score-label">High Score</div>
      <div class="score-value">{{ highScore }}</div>
    </div>
  </div>
</template>

<style scoped lang="css">
.score-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 16px;
  background: #162232;
  border: 1px solid #253549;
}

.score-item {
  text-align: center;
}

.score-label {
  font-size: 12px;
  color: #8b9db5;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.score-value {
  font-family: 'Anybody', sans-serif;
  font-size: clamp(1.6rem, 3.2vw, 2rem);
  font-weight: 700;
  color: #ff6b4a;
}

.score-divider {
  width: 1px;
  height: 48px;
  background: #253549;
}

@media (max-width: 480px) {
  .score-display {
    gap: 14px;
    padding: 12px 10px;
  }

  .score-label {
    font-size: 11px;
  }

  .score-divider {
    height: 40px;
  }
}
</style>
