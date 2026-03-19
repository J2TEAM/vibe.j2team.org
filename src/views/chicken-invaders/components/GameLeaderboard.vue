<script setup lang="ts">
import { inject } from 'vue'
import type { GameContext } from '../composables/useGame'

const { gameState, leaderboard } = inject('game') as GameContext

// Map cho Leaderboard để hiện màu hiển thị tùy theo độ khó
const diffMap: Record<string, { name: string; color: string }> = {
  easy: { name: 'DỄ', color: 'text-green-400' },
  normal: { name: 'VỪA', color: 'text-yellow-400' },
  hard: { name: 'KHÓ', color: 'text-orange-400' },
  hardcore: { name: 'HARDCORE', color: 'text-red-500 drop-shadow-[0_0_5px_currentColor]' },
}
</script>

<template>
  <div
    v-if="gameState === 'leaderboard'"
    class="absolute inset-0 z-600 bg-bg-deep/95 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto overflow-y-auto py-8"
  >
    <div
      class="border border-border-default bg-bg-surface p-6 max-w-lg w-full text-center shadow-2xl"
    >
      <h2
        class="text-3xl sm:text-4xl font-display font-bold text-accent-amber tracking-widest mb-6 uppercase border-b border-border-default pb-4 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"
      >
        🏆 BẢNG VÀNG 🏆
      </h2>

      <div v-if="leaderboard && leaderboard.length > 0" class="flex flex-col gap-3 mb-8">
        <div
          v-for="(entry, idx) in leaderboard.slice(0, 10)"
          :key="idx"
          class="flex justify-between items-center bg-bg-elevated px-4 py-3 border border-border-default transition-colors hover:border-accent-sky"
        >
          <div class="flex items-center gap-4">
            <span class="text-accent-amber font-display font-bold text-xl sm:text-2xl w-8 text-left"
              >{{ idx + 1 }}.</span
            >
            <span
              class="text-text-primary font-display font-bold text-xl sm:text-2xl tracking-wider"
              >{{ entry.score.toLocaleString() }}</span
            >
          </div>
          <div
            class="flex flex-col items-end text-xs sm:text-sm font-bold uppercase tracking-wider"
          >
            <span class="text-text-secondary">WAVE {{ entry.wave }}</span>
            <span :class="diffMap[entry.difficulty]?.color || 'text-text-primary'">
              {{ diffMap[entry.difficulty]?.name || entry.difficulty }}
            </span>
          </div>
        </div>
      </div>

      <div
        v-else
        class="text-text-secondary py-12 font-display font-bold text-xl tracking-widest border border-dashed border-border-default mb-8"
      >
        CHƯA CÓ THÀNH TÍCH NÀO
      </div>

      <button
        @click="gameState = 'menu'"
        class="w-full py-4 bg-bg-elevated border border-border-default text-text-primary font-display font-bold text-xl transition-all hover:border-accent-sky hover:text-accent-sky active:scale-95"
      >
        &larr; QUAY LẠI MENU
      </button>
    </div>
  </div>
</template>
