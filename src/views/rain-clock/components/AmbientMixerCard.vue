<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { AmbientPreset } from '../composables/useAmbientAudio'

const props = defineProps<{
  isSoundOn: boolean
  rainLevel: number
  windLevel: number
  preset: AmbientPreset
  rainVolumeText: string
  windVolumeText: string
}>()

const emit = defineEmits<{
  toggle: []
  'set-preset': [value: AmbientPreset]
  'set-rain': [value: number]
  'set-wind': [value: number]
}>()

function onChannelInput(channel: 'rain' | 'wind', event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  const nextValue = Math.max(0, Math.min(1, value))
  if (channel === 'rain') {
    emit('set-rain', nextValue)
    return
  }
  emit('set-wind', nextValue)
}

function onPreset(value: AmbientPreset) {
  emit('set-preset', value)
}

function onToggle() {
  emit('toggle')
}
</script>

<template>
  <section class="card">
    <div class="card-header">
      <div class="section-title">// Không gian âm thanh</div>
      <button class="sound-btn" :class="{ active: props.isSoundOn }" @click="onToggle">
        <Icon :icon="props.isSoundOn ? 'lucide:volume-2' : 'lucide:volume-x'" class="size-4" />
        <span>{{ props.isSoundOn ? 'Đang phát' : 'Bật âm thanh' }}</span>
      </button>
    </div>

    <div class="preset-row">
      <button
        class="preset-btn"
        :class="{ active: props.preset === 'deep-focus' }"
        @click="onPreset('deep-focus')"
      >Deep Focus</button>
      <button
        class="preset-btn"
        :class="{ active: props.preset === 'storm' }"
        @click="onPreset('storm')"
      >Storm</button>
      <button
        class="preset-btn"
        :class="{ active: props.preset === 'soft-night' }"
        @click="onPreset('soft-night')"
      >Soft Night</button>
    </div>

    <div class="channel-row">
      <label for="rain-channel">Mưa</label>
      <input
        id="rain-channel"
        class="slider"
        type="range"
        min="0"
        max="1"
        step="0.01"
        :value="props.rainLevel"
        @input="onChannelInput('rain', $event)"
      >
      <span>{{ props.rainVolumeText }}</span>
    </div>

    <div class="channel-row">
      <label for="wind-channel">Gió</label>
      <input
        id="wind-channel"
        class="slider"
        type="range"
        min="0"
        max="1"
        step="0.01"
        :value="props.windLevel"
        @input="onChannelInput('wind', $event)"
      >
      <span>{{ props.windVolumeText }}</span>
    </div>
  </section>
</template>

<style scoped>
.card {
  background: linear-gradient(130deg, rgba(12, 24, 44, 0.76), rgba(10, 18, 30, 0.6));
  border: 1px solid rgba(71, 112, 145, 0.45);
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

.sound-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid rgba(71, 112, 145, 0.5);
  background: rgba(9, 16, 28, 0.55);
  color: var(--color-text-dim);
  font-size: 0.75rem;
  font-family: var(--font-body);
  padding: 0.35rem 0.55rem;
  cursor: pointer;
}

.sound-btn.active {
  color: var(--color-text-primary);
  border-color: rgba(56, 189, 248, 0.7);
}

.preset-row {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.preset-btn {
  padding: 0.28rem 0.6rem;
  border: 1px solid rgba(71, 112, 145, 0.5);
  background: transparent;
  color: var(--color-text-dim);
  font-family: var(--font-body);
  font-size: 0.72rem;
  cursor: pointer;
}

.preset-btn.active {
  color: var(--color-text-primary);
  background: rgba(56, 189, 248, 0.16);
  border-color: rgba(56, 189, 248, 0.7);
}

.channel-row {
  display: grid;
  grid-template-columns: 48px 1fr 44px;
  align-items: center;
  gap: 0.6rem;
  color: var(--color-text-dim);
  font-family: var(--font-body);
  font-size: 0.74rem;
}

.slider {
  width: 100%;
  accent-color: #56beef;
}
</style>
