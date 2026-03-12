<script setup lang="ts">
defineProps<{
  title: string
  type?: 'info' | 'warning' | 'danger' | 'success'
}>()

const emit = defineEmits<{
  close: []
}>()

const colors = {
  info: '#00d4ff',
  warning: '#ffb830',
  danger: '#ff3333',
  success: '#00ff41',
}
</script>

<template>
  <div class="popup-overlay" @click.self="emit('close')">
    <div
      class="popup-window"
      :style="{
        borderColor: colors[type ?? 'info'],
        boxShadow: `0 0 30px ${colors[type ?? 'info']}40`,
      }"
    >
      <!-- Title bar -->
      <div class="popup-titlebar" :style="{ borderBottomColor: colors[type ?? 'info'] + '60' }">
        <div class="popup-dots">
          <span class="dot dot-red" />
          <span class="dot dot-yellow" />
          <span class="dot dot-green" />
        </div>
        <span class="popup-title-text" :style="{ color: colors[type ?? 'info'] }">
          {{ title }}
        </span>
        <button class="popup-close" @click="emit('close')">✕</button>
      </div>
      <!-- Content -->
      <div class="popup-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.popup-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #00000060;
  backdrop-filter: blur(2px);
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
.popup-window {
  background: #050505;
  border: 1px solid;
  min-width: 320px;
  max-width: 90vw;
  animation: slideUp 0.25s ease;
}
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
.popup-titlebar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid;
  background: #ffffff05;
}
.popup-dots {
  display: flex;
  gap: 5px;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: block;
}
.dot-red {
  background: #ff5f57;
}
.dot-yellow {
  background: #febc2e;
}
.dot-green {
  background: #28c840;
}
.popup-title-text {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  letter-spacing: 2px;
  text-align: center;
  text-transform: uppercase;
}
.popup-close {
  background: none;
  border: none;
  color: #ffffff40;
  cursor: pointer;
  font-size: 12px;
  padding: 0;
  transition: color 0.2s;
}
.popup-close:hover {
  color: #ff3333;
}
.popup-body {
  padding: 20px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #00ff41;
  line-height: 1.7;
}
</style>
