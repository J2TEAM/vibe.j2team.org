<script setup lang="ts">
import type { GachBongModule, Difficulty } from '../composables/types'
import { getHighScoreByDifficulty } from '../composables/useHighScores'
import GameLogoIcon from './GameLogoIcon.vue'

defineProps<{
  engine: GachBongModule
}>()

const emit = defineEmits<{
  startGame: [difficulty: Difficulty]
  mvIntro: []
  mvHoaChanh: []
  showHistory: []
}>()

const difficulties: { key: Difficulty; label: string; info: string; color: string }[] = [
  { key: 'easy', label: '🌱 Dễ', info: '6×6 · 5 phút · 6 mẫu', color: 'green' },
  { key: 'medium', label: '⚡ Trung Bình', info: '8×8 · 4 phút · 8 mẫu', color: 'amber' },
  { key: 'hard', label: '🔥 Khó', info: '10×10 · 3 phút · 12 mẫu', color: 'red' },
]

function getHighScore(difficulty: Difficulty): number {
  return getHighScoreByDifficulty(difficulty)
}
</script>

<template>
  <div
    class="flex flex-col items-center justify-center p-4 sm:p-8 max-w-lg mx-auto text-center border border-border-default bg-bg-surface animate-fade-up"
  >
    <!-- Animated Logo -->
    <div class="mb-6">
      <GameLogoIcon v-if="engine" :engine="engine" />
      <div v-else class="w-20 h-20 bg-bg-elevated rounded-lg flex items-center justify-center">
        <span class="text-4xl">🎨</span>
      </div>
    </div>

    <h1 class="font-display text-4xl font-bold text-accent-coral mb-4">Gạch Bông</h1>
    <p class="text-text-secondary text-base mb-8">
      Nối các viên gạch bông có cùng hoa văn. Tất cả hoạ tiết được render bằng C++, không sử dụng
      hình ảnh!
    </p>

    <!-- Difficulty Buttons -->
    <div class="flex flex-col gap-3 w-full mb-8">
      <button
        v-for="diff in difficulties"
        :key="diff.key"
        class="group flex flex-col items-center justify-center border border-border-default bg-bg-elevated p-4 transition-all hover:-translate-y-1 hover:border-green-400 hover:shadow-lg"
        :class="{
          'hover:border-green-400': diff.color === 'green',
          'hover:border-accent-amber': diff.color === 'amber',
          'hover:border-red-400': diff.color === 'red',
        }"
        @click="emit('startGame', diff.key)"
      >
        <span
          class="font-display text-lg font-bold text-text-primary group-hover:text-green-400 transition-colors"
          >{{ diff.label }}</span
        >
        <span class="text-text-dim text-sm mt-1">{{ diff.info }}</span>
        <span v-if="getHighScore(diff.key) > 0" class="text-accent-amber text-xs mt-1">
          🏆 {{ getHighScore(diff.key).toLocaleString() }} điểm
        </span>
      </button>
    </div>

    <!-- MV Buttons -->
    <div class="flex flex-col gap-3 w-full border-t border-border-default pt-6">
      <h3 class="font-display text-sm tracking-widest text-text-dim mb-2 uppercase">Relaxing</h3>
      <button
        class="w-full flex items-center justify-center gap-2 border border-accent-coral bg-accent-coral/10 px-5 py-3 font-display text-sm font-semibold text-accent-coral transition hover:bg-accent-coral/20 hover:-translate-y-0.5"
        @click="emit('mvIntro')"
      >
        <span>🎬</span> MV Intro
      </button>

      <button
        class="w-full flex items-center justify-center gap-2 border border-accent-amber bg-accent-amber/10 px-5 py-3 font-display text-sm font-semibold text-accent-amber transition hover:bg-accent-amber/20 hover:-translate-y-0.5"
        @click="emit('mvHoaChanh')"
      >
        <span>⭐</span> MV Hoa Chanh
      </button>

      <button
        class="w-full flex items-center justify-center gap-2 border border-blue-400 bg-blue-400/10 px-5 py-3 font-display text-sm font-semibold text-blue-400 transition hover:bg-blue-400/20 hover:-translate-y-0.5"
        @click="emit('showHistory')"
      >
        <span>📊</span> Lịch Sử Điểm
      </button>

      <div class="mt-4 text-xs text-text-dim">
        Khám phá nhiều hơn tại
        <a
          href="https://gachbong.yellowstudio.vn"
          target="_blank"
          rel="noopener noreferrer"
          class="text-accent-amber hover:underline hover:text-yellow-400 transition"
          >gachbong/vn</a
        >
      </div>
    </div>
  </div>
</template>
