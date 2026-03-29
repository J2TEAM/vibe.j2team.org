<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import AmbientMixerCard from './components/AmbientMixerCard.vue'
import FocusStudioCard from './components/FocusStudioCard.vue'
import RainControlsCard from './components/RainControlsCard.vue'
import RainHeroPanel from './components/RainHeroPanel.vue'
import { useRainEngine } from './composables/useRainEngine'
import { useAmbientAudio } from './composables/useAmbientAudio'

const now = ref(new Date())
useIntervalFn(() => {
  now.value = new Date()
}, 1000)

const hours = computed(() => now.value.getHours())
const minutes = computed(() => now.value.getMinutes())
const seconds = computed(() => now.value.getSeconds())

const dateStr = computed(() =>
  now.value.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
)

const autoRainIntensity = computed(() => {
  const hour = hours.value
  if (hour >= 22 || hour <= 5) return 8
  if (hour >= 6 && hour <= 9) return 2
  if (hour >= 10 && hour <= 13) return 3
  if (hour >= 14 && hour <= 17) return 5
  if (hour >= 18 && hour <= 21) return 7
  return 4
})

const rainMode = ref<'auto' | 'manual'>('auto')
const manualRainIntensity = ref(5)

const rainIntensity = computed(() =>
  rainMode.value === 'manual' ? manualRainIntensity.value : autoRainIntensity.value
)

const intensityLabel = computed(() => {
  const intensity = rainIntensity.value
  if (intensity <= 2) return 'Mưa phùn'
  if (intensity <= 4) return 'Mưa nhẹ'
  if (intensity <= 6) return 'Mưa vừa'
  return 'Mưa lớn'
})

function clampIntensity(value: number) {
  return Math.min(8, Math.max(1, value))
}

watch(manualRainIntensity, value => {
  manualRainIntensity.value = clampIntensity(value)
})

const canvasEl = ref<HTMLCanvasElement | null>(null)
const { pause, initDrops } = useRainEngine(canvasEl, rainIntensity)

const {
  isSoundOn: ambientSoundOn,
  rainLevel: ambientRainLevel,
  windLevel: ambientWindLevel,
  preset: ambientPreset,
  rainVolumeText,
  windVolumeText,
  toggleSound,
  applyPreset,
  setRainLevel,
  setWindLevel,
  shutdownAudio,
} = useAmbientAudio(rainIntensity)

watch(rainIntensity, () => {
  initDrops()
})

onUnmounted(() => {
  pause()
  void shutdownAudio()
})
</script>

<template>
  <div class="rain-page">
    <canvas ref="canvasEl" class="rain-canvas" />
    <div class="fog fog-top" />
    <div class="fog fog-bottom" />

    <header class="page-header">
      <RouterLink to="/" class="home-link">
        <Icon icon="lucide:arrow-left" class="size-4" />
        <span>Trang chủ</span>
      </RouterLink>
      <p class="headline">Rain Focus Studio</p>
    </header>

    <main class="layout">
      <RainHeroPanel
        :hours="hours"
        :minutes="minutes"
        :seconds="seconds"
        :date-str="dateStr"
        :rain-intensity="rainIntensity"
        :intensity-label="intensityLabel"
      />

      <section class="control-column">
        <RainControlsCard
          v-model:rain-mode="rainMode"
          v-model:manual-rain-intensity="manualRainIntensity"
          :rain-intensity="rainIntensity"
        />

        <AmbientMixerCard
          :is-sound-on="ambientSoundOn"
          :rain-level="ambientRainLevel"
          :wind-level="ambientWindLevel"
          :preset="ambientPreset"
          :rain-volume-text="rainVolumeText"
          :wind-volume-text="windVolumeText"
          @toggle="toggleSound()"
          @set-preset="applyPreset($event)"
          @set-rain="setRainLevel($event)"
          @set-wind="setWindLevel($event)"
        />
        <FocusStudioCard />
      </section>
    </main>
  </div>
</template>

<style scoped>
.rain-page {
  position: relative;
  min-height: 100dvh;
  background:
    radial-gradient(circle at 20% 18%, rgba(56, 189, 248, 0.09), transparent 40%),
    radial-gradient(circle at 88% 82%, rgba(56, 189, 248, 0.06), transparent 35%),
    linear-gradient(180deg, #031122 0%, #020d1b 100%);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.rain-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.fog {
  position: fixed;
  left: 0;
  right: 0;
  pointer-events: none;
  z-index: 1;
}

.fog-top {
  top: 0;
  height: 28vh;
  background: linear-gradient(to bottom, rgba(4, 13, 24, 0.8), transparent 100%);
}

.fog-bottom {
  bottom: 0;
  height: 34vh;
  background: linear-gradient(to top, rgba(3, 10, 18, 0.86), transparent 100%);
}

.page-header {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: clamp(0.65rem, 1.8vh, 1.1rem) clamp(0.8rem, 2.2vw, 1.7rem);
  flex-shrink: 0;
}

.home-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text-dim);
  font-family: var(--font-body);
  font-size: 0.78rem;
  text-decoration: none;
  letter-spacing: 0.05em;
}

.home-link:hover {
  color: var(--color-text-secondary);
}

.headline {
  margin: 0;
  font-family: var(--font-display);
  color: rgba(123, 188, 238, 0.72);
  letter-spacing: 0.1em;
  font-size: 0.72rem;
  text-transform: uppercase;
}

.layout {
  position: relative;
  z-index: 10;
  flex: 1;
  min-height: 0;
  width: min(1400px, 98vw);
  margin: 0 auto;
  padding: clamp(0.4rem, 1.1vh, 0.9rem) clamp(0.3rem, 0.9vw, 0.8rem) clamp(0.7rem, 1.6vh, 1.2rem);
  display: grid;
  grid-template-columns: minmax(400px, 1fr) minmax(520px, 1.1fr);
  align-items: stretch;
  gap: clamp(0.7rem, 1.4vw, 1.1rem);
  overflow: hidden;
}

.control-column {
  min-height: 0;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: clamp(0.55rem, 1.2vh, 0.8rem);
}

@media (max-width: 1080px) {
  .layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
    width: min(960px, 96vw);
    padding-left: 0.6rem;
    padding-right: 0.6rem;
    gap: 0.55rem;
  }

  .control-column {
    grid-template-rows: auto auto minmax(0, 1fr);
  }
}

@media (max-height: 820px) {
  .headline {
    display: none;
  }

  .layout {
    gap: 0.5rem;
    padding-top: 0.2rem;
    padding-bottom: 0.55rem;
  }
}
</style>
