<script setup lang="ts">
import { useGameStore } from '../stores/gameStore'

const store = useGameStore()

const emit = defineEmits<{ restart: [] }>()

function restart() {
  emit('restart')
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 pixel-overlay"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="w-full max-w-sm bg-[#0b1220] border-4 border-[#ef4444] p-6 sm:p-8 text-center pixel-panel"
    >
      <h2 class="text-3xl sm:text-5xl font-mono font-black text-[#ef4444] mb-2 tracking-[0.22em]">
        <span class="blink">GAME OVER</span>
      </h2>
      <p class="text-[#94a3b8] text-sm mb-6 font-mono tracking-wider uppercase">
        Zombie đã nuốt chửng bạn
      </p>

      <div class="space-y-3 mb-6">
        <div
          class="flex justify-between items-center px-4 py-2 bg-[#0f172a] border-2 border-[#22c55e]"
        >
          <span class="text-[#22c55e] text-[10px] font-mono tracking-[0.18em] uppercase">Điểm</span>
          <span class="text-[#e2e8f0] text-xl font-mono font-bold tracking-widest">{{
            store.score
          }}</span>
        </div>
        <div
          class="flex justify-between items-center px-4 py-2 bg-[#0f172a] border-2 border-[#38bdf8]"
        >
          <span class="text-[#38bdf8] text-[10px] font-mono tracking-[0.18em] uppercase">Đợt</span>
          <span class="text-[#e2e8f0] text-lg font-mono font-bold tracking-widest">{{
            store.difficulty
          }}</span>
        </div>
        <div
          class="flex justify-between items-center px-4 py-2 bg-[#0f172a] border-2 border-[#22c55e]"
        >
          <span class="text-[#22c55e] text-[10px] font-mono tracking-[0.18em] uppercase"
            >Kỷ lục</span
          >
          <span class="text-[#e2e8f0] text-lg font-mono font-bold tracking-widest">{{
            store.highScore
          }}</span>
        </div>
      </div>

      <button
        type="button"
        class="w-full px-6 py-3 bg-[#22c55e] text-[#0b1220] text-lg font-black font-mono tracking-[0.2em] uppercase border-4 border-[#16a34a] active:translate-y-[2px] active:border-[#22c55e]"
        @click="restart"
      >
        Chơi lại
      </button>
    </div>
  </div>
</template>

<style scoped>
.pixel-overlay {
  image-rendering: pixelated;
}

.pixel-panel {
  outline: 4px solid #000;
  outline-offset: -4px;
}

.blink {
  animation: blink 800ms steps(2) infinite;
}

@keyframes blink {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0.25;
  }
}
</style>
