<script setup lang="ts">
import { inject } from 'vue'
import { useRouter } from 'vue-router'
import { GAME_WIDTH, WEAPON_TYPES } from '../utils/config'
import type { GameContext } from '../composables/useGame'
import { SPRITES } from '../utils/sprites'

defineProps<{ gameScale: number }>()

const router = useRouter()

const {
  score,
  lives,
  weaponType,
  weaponLevel,
  currentWave,
  isMuted,
  toggleMute,
  togglePause,
  gameState,
  difficulty, // <-- Lấy thêm biến difficulty
} = inject('game') as GameContext

// Map cấu hình hiển thị độ khó
const diffMap: Record<string, { name: string; color: string }> = {
  easy: { name: 'DỄ', color: 'text-green-400' },
  normal: { name: 'VỪA', color: 'text-yellow-400' },
  hard: { name: 'KHÓ', color: 'text-orange-400' },
  hardcore: { name: 'HARDCORE', color: 'text-red-500 drop-shadow-[0_0_5px_currentColor]' },
}
</script>

<template>
  <div
    class="w-full mx-auto flex justify-between items-center bg-bg-surface p-2 lg:p-4 border-b xl:border border-border-default shadow-lg z-50 shrink-0 pointer-events-auto"
    :style="{ maxWidth: `${GAME_WIDTH * gameScale}px` }"
  >
    <div class="flex gap-2 lg:gap-6 items-center overflow-x-auto whitespace-nowrap hide-scrollbar">
      <h1
        class="text-base sm:text-lg lg:text-2xl font-display font-bold text-accent-coral uppercase tracking-tight"
      >
        ĐIỂM: {{ score }}
      </h1>
      <div
        class="flex items-center gap-1 lg:gap-2 border-l border-border-default pl-2 lg:pl-4 text-sm sm:text-base lg:text-xl font-display font-bold text-text-primary"
      >
        {{ lives }}
        <div class="w-5 h-5 lg:w-6 lg:h-6 animate-pulse" v-html="SPRITES.heart"></div>
      </div>
      <div
        class="flex items-center gap-1 lg:gap-2 font-display font-bold border border-border-default bg-bg-elevated px-1.5 py-1 lg:px-3 lg:py-1.5 transition-colors hover:border-accent-amber"
      >
        <div
          class="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 inline-block"
          :class="WEAPON_TYPES[weaponType]?.color"
          v-html="SPRITES.giftBox"
        ></div>

        <span class="hidden lg:inline text-accent-amber pl-1">{{
          WEAPON_TYPES[weaponType]?.name || ''
        }}</span>
        <span class="text-border-default hidden lg:inline">/</span>
        <span class="text-text-secondary uppercase hidden lg:inline">CẤP {{ weaponLevel }}</span>
        <span class="text-text-secondary uppercase lg:hidden text-[11px] sm:text-sm pl-1"
          >LV.{{ weaponLevel }}</span
        >
      </div>

      <div
        class="flex items-center gap-1.5 lg:gap-2 font-display font-bold border border-border-default bg-bg-elevated px-1.5 py-1 lg:px-3 lg:py-1.5"
      >
        <span class="text-accent-sky text-[10px] lg:text-xs tracking-widest">//</span>
        <span class="text-text-secondary text-[11px] sm:text-sm lg:text-base"
          >WAVE {{ currentWave }}</span
        >
        <span class="text-border-default mx-0.5 lg:mx-1">|</span>
        <span
          class="text-[11px] sm:text-sm lg:text-base uppercase"
          :class="diffMap[difficulty]?.color"
        >
          {{ diffMap[difficulty]?.name }}
        </span>
      </div>
    </div>

    <div class="flex items-center gap-1 lg:gap-2 shrink-0">
      <button
        @click="toggleMute"
        class="w-7 h-7 lg:w-10 lg:h-10 flex items-center justify-center bg-bg-elevated border border-border-default text-text-secondary transition-all hover:border-accent-amber text-xs lg:text-base"
      >
        {{ isMuted ? '🔇' : '🔊' }}
      </button>
      <button
        @click="togglePause"
        class="w-7 h-7 lg:w-10 lg:h-10 flex items-center justify-center bg-bg-elevated border border-border-default text-text-secondary transition-all hover:border-accent-sky font-bold text-sm lg:text-lg"
      >
        {{ gameState === 'paused' || gameState === 'resuming' ? '▶' : '⏸' }}
      </button>
      <button
        @click="router.push('/')"
        class="px-2 lg:px-5 py-1 lg:py-2 font-display font-semibold text-[10px] lg:text-sm bg-bg-elevated border border-border-default text-text-secondary transition-all hover:border-accent-coral hover:text-text-primary"
      >
        <span class="hidden lg:inline">&larr; THOÁT</span>
        <span class="lg:hidden text-sm">&larr;</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
