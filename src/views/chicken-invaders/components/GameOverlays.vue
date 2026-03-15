<script setup lang="ts">
import { inject } from 'vue'
import type { GameContext } from '../composables/useGame'

const { gameState, startGame, initGame, score, resumingCountdown, waveAnnouncement } = inject(
  'game',
) as GameContext
</script>

<template>
  <div
    v-if="gameState === 'menu'"
    class="absolute inset-0 z-600 bg-bg-deep/80 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto"
  >
    <button
      @click="startGame"
      class="px-12 py-4 mb-6 bg-accent-coral text-bg-deep text-2xl sm:text-3xl font-display font-bold tracking-widest transition-all hover:bg-accent-amber hover:scale-105 active:scale-95 shadow-[0_0_20px_#FF6B4A] rounded-sm"
    >
      CHƠI NGAY
    </button>
    <div
      class="border border-border-default bg-bg-surface p-6 max-w-sm w-full text-center shadow-xl"
    >
      <h3
        class="text-xl font-display font-bold text-accent-sky tracking-widest mb-4 uppercase border-b border-border-default pb-2"
      >
        HƯỚNG DẪN
      </h3>
      <div class="hidden lg:flex flex-col gap-4">
        <div class="flex justify-between items-center">
          <span class="text-text-secondary font-bold text-sm tracking-wider">DI CHUYỂN:</span>
          <span
            class="bg-bg-elevated px-3 py-1.5 font-bold text-accent-amber border border-border-default text-xs tracking-widest"
            >CHUỘT / WASD</span
          >
        </div>
        <div class="flex justify-between items-center">
          <span class="text-text-secondary font-bold text-sm tracking-wider">BẮN ĐẠN:</span>
          <span
            class="bg-bg-elevated px-3 py-1.5 font-bold text-accent-coral border border-border-default text-xs tracking-widest"
            >CLICK / SPACE</span
          >
        </div>
      </div>
      <div class="lg:hidden flex flex-col gap-4">
        <div class="flex flex-col items-center gap-2">
          <span class="text-text-secondary font-bold text-sm tracking-wider">DI CHUYỂN & BẮN:</span>
          <span
            class="bg-bg-elevated px-3 py-1.5 font-bold text-accent-amber border border-border-default w-full text-xs tracking-widest"
            >CHẠM KÉO & GIỮ MÀN HÌNH</span
          >
        </div>
      </div>
    </div>
  </div>

  <div
    v-if="gameState === 'gameover'"
    class="absolute inset-0 bg-bg-deep/90 flex flex-col items-center justify-center z-500 backdrop-blur-md pointer-events-auto"
  >
    <h2
      class="text-7xl font-display font-bold mb-2 text-accent-coral tracking-tighter uppercase drop-shadow-[0_0_20px_#FF6B4A]"
    >
      GAME OVER
    </h2>
    <p class="text-3xl text-accent-amber font-display font-bold mb-10">ĐIỂM: {{ score }}</p>
    <button
      @click="initGame"
      class="px-10 py-4 bg-bg-surface border border-border-default text-text-primary font-display font-bold text-xl transition-all hover:border-accent-coral hover:text-accent-coral cursor-pointer active:scale-95 shadow-lg"
    >
      CHƠI LẠI 🔄
    </button>
  </div>

  <div
    v-if="gameState === 'paused'"
    class="absolute inset-0 bg-bg-deep/80 backdrop-blur-md flex flex-col items-center justify-center z-400 pointer-events-none"
  >
    <h2 class="text-7xl font-display font-bold text-accent-coral mb-4 tracking-widest uppercase">
      TẠM DỪNG
    </h2>
    <p class="text-xl text-text-secondary font-body text-center leading-relaxed">
      <span class="hidden lg:inline">Nhấn SPACE / CLICK để tiếp tục</span>
      <span class="lg:hidden">Nhấn nút ▶ trên thanh điều khiển để tiếp tục</span>
    </p>
  </div>

  <div
    v-if="gameState === 'resuming'"
    class="absolute inset-0 flex flex-col items-center justify-center z-400 pointer-events-none"
  >
    <span
      class="text-[150px] font-display font-bold text-accent-amber drop-shadow-[0_0_20px_#FFB830]"
      >{{ resumingCountdown }}</span
    >
  </div>

  <div
    v-if="waveAnnouncement"
    class="absolute top-1/3 left-0 w-full flex items-center justify-center z-300 pointer-events-none"
  >
    <h2
      class="text-5xl sm:text-6xl font-display font-bold text-accent-sky tracking-widest text-center px-4 uppercase drop-shadow-lg whitespace-pre-line"
    >
      {{ waveAnnouncement }}
    </h2>
  </div>
</template>
