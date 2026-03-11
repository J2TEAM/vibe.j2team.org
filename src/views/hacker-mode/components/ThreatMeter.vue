<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  score: number
}>()

const threatLevel = computed(() => {
  const p = Math.min(props.score / 2000, 1)
  return p * 100
})

const threatColor = computed(() => {
  if (threatLevel.value < 30) return '#00ff41'
  if (threatLevel.value < 70) return '#ffb830'
  return '#ff3333'
})
</script>

<template>
  <div class="tm-wrap">
    <div class="tm-header">
      <div class="tm-title">// THREAT LEVEL</div>
      <div class="tm-val" :style="{ color: threatColor }">{{ Math.round(threatLevel) }}%</div>
    </div>
    <div class="tm-bar-bg">
      <div
        class="tm-bar-fill"
        :style="{
          width: `${threatLevel}%`,
          backgroundColor: threatColor,
          boxShadow: `0 0 10px ${threatColor}`,
        }"
      />
    </div>
    <div class="tm-markers">
      <span>0</span>
      <span>50</span>
      <span>100</span>
    </div>
  </div>
</template>

<style scoped>
.tm-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tm-title {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: rgba(0, 255, 65, 0.5);
  letter-spacing: 2px;
}
.tm-val {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: bold;
}
.tm-bar-bg {
  height: 12px;
  background: rgba(0, 255, 65, 0.1);
  border: 1px solid rgba(0, 255, 65, 0.2);
  position: relative;
  overflow: hidden;
}
.tm-bar-fill {
  height: 100%;
  transition: all 1s ease-out;
}
.tm-bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 4px,
    rgba(0, 0, 0, 0.2) 4px,
    rgba(0, 0, 0, 0.2) 8px
  );
}
.tm-markers {
  display: flex;
  justify-content: space-between;
  font-family: 'Courier New', monospace;
  font-size: 8px;
  color: rgba(0, 255, 65, 0.4);
}
</style>
