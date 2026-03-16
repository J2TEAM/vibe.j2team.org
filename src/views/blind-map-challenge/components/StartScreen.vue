<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { GameMode, Difficulty, Zone, GameConfig } from '../types'
import { useLocalStorage } from '../composables/useLocalStorage'

const emit = defineEmits<{
  (e: 'start', config: GameConfig): void
}>()

const storage = useLocalStorage()
const settings = storage.getSettings()

const selectedMode = ref<GameMode>(settings.defaultMode)
const selectedDifficulty = ref<Difficulty>(settings.defaultDifficulty)
const selectedRegion = ref<Zone>('Bắc')

const modes: { value: GameMode; label: string; icon: string; desc: string }[] = [
  { value: 'classic', label: 'Classic', icon: '🗺️', desc: 'Gắn hết 63 tỉnh, không giới hạn thời gian' },
  { value: 'time-attack', label: 'Time Attack', icon: '⚡', desc: 'Gắn càng nhiều càng tốt trong thời gian giới hạn' },
  { value: 'daily', label: 'Daily Quiz', icon: '📅', desc: 'Mỗi ngày 10 tỉnh ngẫu nhiên, chơi 1 lần/ngày' },
  { value: 'region', label: 'Region', icon: '🏔️', desc: 'Chỉ chơi các tỉnh thuộc 1 vùng' },
]

const difficulties: { value: Difficulty; label: string; icon: string; desc: string }[] = [
  { value: 'easy', label: 'Dễ', icon: '🟢', desc: 'Gợi ý vùng miền, không giới hạn thời gian' },
  { value: 'medium', label: 'Trung bình', icon: '🟡', desc: 'Gợi ý viết tắt, 10 phút' },
  { value: 'hard', label: 'Khó', icon: '🔴', desc: 'Không gợi ý, 5 phút' },
  { value: 'expert', label: 'Chuyên gia', icon: '⚫', desc: 'Bản đồ mờ, không gợi ý, 3 phút' },
]

const regions: { value: Zone; label: string }[] = [
  { value: 'Bắc', label: '🏔️ Miền Bắc' },
  { value: 'Trung', label: '⛱️ Miền Trung' },
  { value: 'Nam', label: '🌴 Miền Nam' },
]

const bestScore = computed(() =>
  storage.getBestScore(selectedMode.value, selectedDifficulty.value)
)

const hasPlayedToday = computed(() => storage.hasPlayedToday())

function handleStart() {
  const config: GameConfig = {
    mode: selectedMode.value,
    difficulty: selectedDifficulty.value,
  }
  if (selectedMode.value === 'region') {
    config.regionFilter = selectedRegion.value
  }
  storage.saveSettings({
    defaultMode: selectedMode.value,
    defaultDifficulty: selectedDifficulty.value,
  })
  emit('start', config)
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col">
    <!-- Header -->
    <header class="border-b border-border-default px-4 py-3 flex items-center justify-between">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 text-sm text-text-secondary
               transition hover:text-text-primary"
      >
        &larr; Trang chủ
      </RouterLink>
      <div class="flex items-center gap-2">
        <span class="text-accent-coral font-display text-xs tracking-widest">//</span>
        <span class="font-display text-sm tracking-wide">BLIND MAP</span>
      </div>
    </header>

    <!-- Content -->
    <div class="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-2xl mx-auto w-full">
      <!-- Title -->
      <div class="text-center mb-10 animate-fade-up">
        <h1 class="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-accent-coral
                   tracking-tight leading-tight">
          🗺️ Blind Map
          <br />
          <span class="text-accent-sky">Challenge</span>
        </h1>
        <p class="mt-4 text-text-secondary text-lg max-w-md mx-auto">
          Thử thách gắn tên 63 tỉnh/thành phố lên bản đồ Việt Nam trống!
        </p>
      </div>

      <!-- Game Mode -->
      <div class="w-full mb-8 animate-fade-up animate-delay-1">
        <h2 class="font-display text-lg font-semibold mb-3 flex items-center gap-2">
          <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
          Chế độ chơi
        </h2>
        <div class="grid gap-2 sm:grid-cols-2">
          <button
            v-for="m in modes"
            :key="m.value"
            :class="[
              'border p-3 text-left transition-all duration-200',
              selectedMode === m.value
                ? 'border-accent-sky bg-bg-elevated shadow-lg shadow-accent-sky/5'
                : 'border-border-default bg-bg-surface hover:border-accent-sky/50 hover:bg-bg-elevated',
            ]"
            @click="selectedMode = m.value"
          >
            <div class="flex items-center gap-2 mb-1">
              <span>{{ m.icon }}</span>
              <span class="font-display font-semibold text-sm">{{ m.label }}</span>
            </div>
            <p class="text-xs text-text-dim">{{ m.desc }}</p>
          </button>
        </div>
      </div>

      <!-- Region selector (only when mode = region) -->
      <Transition name="slide">
        <div v-if="selectedMode === 'region'" class="w-full mb-8">
          <h2 class="font-display text-lg font-semibold mb-3 flex items-center gap-2">
            <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
            Chọn vùng
          </h2>
          <div class="grid gap-2 grid-cols-3">
            <button
              v-for="r in regions"
              :key="r.value"
              :class="[
                'border p-3 text-center transition-all duration-200 font-display text-sm',
                selectedRegion === r.value
                  ? 'border-accent-amber bg-bg-elevated'
                  : 'border-border-default bg-bg-surface hover:border-accent-amber/50',
              ]"
              @click="selectedRegion = r.value"
            >
              {{ r.label }}
            </button>
          </div>
        </div>
      </Transition>

      <!-- Difficulty -->
      <div class="w-full mb-8 animate-fade-up animate-delay-2">
        <h2 class="font-display text-lg font-semibold mb-3 flex items-center gap-2">
          <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
          Độ khó
        </h2>
        <div class="grid gap-2 sm:grid-cols-2">
          <button
            v-for="d in difficulties"
            :key="d.value"
            :class="[
              'border p-3 text-left transition-all duration-200',
              selectedDifficulty === d.value
                ? 'border-accent-coral bg-bg-elevated shadow-lg shadow-accent-coral/5'
                : 'border-border-default bg-bg-surface hover:border-accent-coral/50 hover:bg-bg-elevated',
            ]"
            @click="selectedDifficulty = d.value"
          >
            <div class="flex items-center gap-2 mb-1">
              <span>{{ d.icon }}</span>
              <span class="font-display font-semibold text-sm">{{ d.label }}</span>
            </div>
            <p class="text-xs text-text-dim">{{ d.desc }}</p>
          </button>
        </div>
      </div>

      <!-- Best score -->
      <div
        v-if="bestScore > 0"
        class="w-full mb-6 border border-border-default bg-bg-surface p-3
               flex items-center justify-between animate-fade-up animate-delay-3"
      >
        <span class="text-sm text-text-secondary font-display">🏆 Kỷ lục</span>
        <span class="font-display font-bold text-accent-amber text-lg">{{ bestScore }}đ</span>
      </div>

      <!-- Daily warning -->
      <div
        v-if="selectedMode === 'daily' && hasPlayedToday"
        class="w-full mb-6 border border-accent-amber/30 bg-accent-amber/5 p-3
               text-sm text-accent-amber animate-fade-up animate-delay-3"
      >
        📅 Bạn đã chơi Daily Quiz hôm nay rồi. Hãy quay lại vào ngày mai!
      </div>

      <!-- Start button -->
      <button
        class="w-full max-w-sm py-4 bg-accent-coral text-bg-deep font-display font-bold
               text-lg tracking-wide transition-all duration-300
               hover:bg-accent-amber hover:shadow-lg hover:shadow-accent-coral/20
               hover:-translate-y-0.5 active:translate-y-0
               animate-fade-up animate-delay-4
               disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        :disabled="selectedMode === 'daily' && hasPlayedToday"
        @click="handleStart"
      >
        🚀 BẮT ĐẦU CHƠI
      </button>
    </div>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}
.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 200px;
}
</style>
