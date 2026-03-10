<script setup lang="ts">
import type { Difficulty } from '../composables/types'

const emit = defineEmits<{
  startGame: [difficulty: Difficulty]
  mvIntro: []
  mvHoaChanh: []
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center p-8 max-w-lg mx-auto text-center border border-border-default bg-bg-surface animate-fade-up">
    <div class="text-6xl mb-6">🎨</div>
    <h1 class="font-display text-4xl font-bold text-accent-coral mb-4">Gạch Bông</h1>
    <p class="text-text-secondary text-base mb-8">
      Nối các viên gạch bông có cùng hoa văn, xem MV và thưởng thức âm nhạc.
    </p>

    <div class="flex flex-col gap-4 w-full mb-8">
      <button
        class="group flex flex-col items-center justify-center border border-border-default bg-bg-elevated p-4 transition-all hover:-translate-y-1 hover:border-green-400 hover:shadow-lg"
        @click="emit('startGame', 'easy')"
      >
        <span class="font-display text-lg font-bold text-text-primary group-hover:text-green-400 transition-colors">Play Game</span>
        <span class="text-text-dim text-sm mt-1">6×6 · 5 phút · 6 mẫu</span>
      </button>
    </div>

    <!-- MV Buttons -->
    <div class="flex flex-col gap-3 w-full border-t border-border-default pt-6">
      <h3 class="font-display text-sm tracking-widest text-text-dim mb-2 uppercase">Relaxing Music Video</h3>
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

      <div class="mt-4 text-xs text-text-dim">
        Khám phá nhiều hơn tại <a href="https://gachbong.yellowstudio.vn" target="_blank" rel="noopener noreferrer" class="text-accent-amber hover:underline hover:text-yellow-400 transition">gachbong/vn</a>
      </div>
    </div>
  </div>
</template>
