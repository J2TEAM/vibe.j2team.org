<script setup lang="ts">
import { Icon } from '@iconify/vue'

const props = defineProps<{
  rainMode: 'auto' | 'manual'
  manualRainIntensity: number
  rainIntensity: number
}>()

const emit = defineEmits<{
  'update:rainMode': [value: 'auto' | 'manual']
  'update:manualRainIntensity': [value: number]
}>()

function updateMode(mode: 'auto' | 'manual') {
  emit('update:rainMode', mode)
}

function updateManual(value: number) {
  emit('update:manualRainIntensity', Math.max(1, Math.min(8, value)))
}

function decreaseManual() {
  updateMode('manual')
  updateManual(props.manualRainIntensity - 1)
}

function increaseManual() {
  updateMode('manual')
  updateManual(props.manualRainIntensity + 1)
}

function onManualInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  updateManual(value)
}
</script>

<template>
  <section class="card">
    <div class="card-header">
      <div class="section-title">// Điều chỉnh mưa</div>
      <div class="mode-switch">
        <button
          class="mode-btn"
          :class="{ active: rainMode === 'auto' }"
          @click="updateMode('auto')"
        >Tự động</button>
        <button
          class="mode-btn"
          :class="{ active: rainMode === 'manual' }"
          @click="updateMode('manual')"
        >Thủ công</button>
      </div>
    </div>

    <div class="meter-row">
      <span class="meter-label">Cường độ</span>
      <div class="meter-track">
        <div
          v-for="index in 8"
          :key="index"
          class="meter-bar"
          :class="{ active: index <= rainIntensity }"
          :style="{ '--idx': index }"
        />
      </div>
      <span class="meter-value">{{ rainIntensity }}/8</span>
    </div>

    <div class="manual-row" :class="{ disabled: rainMode === 'auto' }">
      <button class="step-btn" :disabled="manualRainIntensity <= 1" @click="decreaseManual">
        <Icon icon="lucide:minus" class="size-4" />
      </button>
      <input
        :value="manualRainIntensity"
        class="range-input"
        type="range"
        min="1"
        max="8"
        step="1"
        :disabled="rainMode === 'auto'"
        @input="onManualInput"
      >
      <button class="step-btn" :disabled="manualRainIntensity >= 8" @click="increaseManual">
        <Icon icon="lucide:plus" class="size-4" />
      </button>
      <span class="manual-value">{{ manualRainIntensity }}/8</span>
    </div>
  </section>
</template>

<style scoped>
.card {
  background: linear-gradient(135deg, rgba(9, 20, 39, 0.76), rgba(8, 16, 28, 0.58));
  border: 1px solid rgba(68, 111, 145, 0.45);
  padding: clamp(0.72rem, 1.6vh, 0.95rem);
  display: flex;
  flex-direction: column;
  gap: 0.72rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
}

.section-title {
  font-family: var(--font-display);
  font-size: 0.76rem;
  color: var(--color-accent-sky);
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.mode-switch {
  display: inline-flex;
  border: 1px solid rgba(68, 111, 145, 0.5);
}

.mode-btn {
  border: none;
  padding: 0.3rem 0.65rem;
  font-family: var(--font-body);
  font-size: 0.74rem;
  background: transparent;
  color: var(--color-text-dim);
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn.active {
  color: var(--color-text-primary);
  background: rgba(56, 189, 248, 0.14);
}

.meter-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.6rem;
}

.meter-label,
.meter-value,
.manual-value {
  font-family: 'Courier New', monospace;
  font-size: 0.72rem;
  color: var(--color-text-dim);
  letter-spacing: 0.04em;
}

.meter-track {
  display: flex;
  gap: 3px;
  align-items: flex-end;
}

.meter-bar {
  width: 5px;
  height: calc(6px + var(--idx) * 2.1px);
  background: rgba(77, 105, 133, 0.5);
}

.meter-bar.active {
  background: var(--color-accent-sky);
  box-shadow: 0 0 6px rgba(56, 189, 248, 0.55);
}

.manual-row {
  display: grid;
  grid-template-columns: 32px 1fr 32px auto;
  align-items: center;
  gap: 0.58rem;
}

.manual-row.disabled {
  opacity: 0.5;
}

.step-btn {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(68, 111, 145, 0.45);
  background: rgba(10, 18, 30, 0.58);
  color: var(--color-text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.step-btn:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.range-input {
  width: 100%;
  accent-color: #56beef;
}

@media (max-width: 760px) {
  .card-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .meter-row {
    grid-template-columns: 1fr;
    justify-items: start;
  }

  .meter-track {
    width: 100%;
    justify-content: space-between;
  }

  .manual-row {
    grid-template-columns: 28px 1fr 28px auto;
  }
}
</style>
