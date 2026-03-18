<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useEventListener, useMagicKeys } from '@vueuse/core'
import { onMounted, onUnmounted } from 'vue'
import type { Direction } from './types'
import { useGame } from './composables/useGame'

const {
  score,
  bestScore,
  isGameOverFlag,
  isPaused,
  showResumeChoice,
  time,
  tiles,
  initGame,
  resumeSavedGame,
  togglePause,
  handleMove,
  saveGameState,
} = useGame()

// Controls
useMagicKeys()
useEventListener('keydown', (e) => {
  if (showResumeChoice.value) return
  if (e.key.toLowerCase() === 'p') {
    togglePause()
    return
  }
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault()
    handleMove(e.key.replace('Arrow', '').toLowerCase() as Direction)
  }
})

// Swipe Support
let swipeStart: { x: number; y: number } | null = null
useEventListener('pointerdown', (e) => {
  const target = e.target as HTMLElement
  if (target.closest('.game-board')) {
    swipeStart = { x: e.clientX, y: e.clientY }
  }
})

useEventListener('pointerup', (e) => {
  if (!swipeStart) return
  const dx = e.clientX - swipeStart.x
  const dy = e.clientY - swipeStart.y
  if (Math.max(Math.abs(dx), Math.abs(dy)) > 30) {
    if (Math.abs(dx) > Math.abs(dy)) handleMove(dx > 0 ? 'right' : 'left')
    else handleMove(dy > 0 ? 'down' : 'up')
  }
  swipeStart = null
})

onMounted(() => initGame())
onUnmounted(() => saveGameState())

const getTileColor = (value: number) => {
  const colors: Record<number, string> = {
    2: 'bg-bg-surface text-text-primary',
    4: 'bg-bg-elevated text-text-primary',
    8: 'bg-accent-coral text-white',
    16: 'bg-accent-coral/90 text-white',
    32: 'bg-accent-amber text-white',
    64: 'bg-accent-amber/90 text-white',
    128: 'bg-accent-sky text-white',
    256: 'bg-accent-sky/90 text-white',
    512: 'bg-accent-sky/80 text-white',
    1024: 'bg-accent-sky/70 text-white',
    2048: 'bg-accent-sky/60 font-bold text-white',
  }
  return colors[value] || 'bg-text-secondary text-white'
}
</script>

<template>
  <div
    class="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center bg-bg-deep p-4 font-body animate-fade-up select-none overflow-hidden touch-none"
  >
    <!-- Title & Caption Row -->
    <div
      class="mb-6 flex w-full max-w-[420px] items-center justify-between border-b border-border-default pb-4"
    >
      <h1
        class="font-display text-5xl font-black text-accent-coral tracking-tighter leading-none italic"
      >
        // 2048
      </h1>
      <p class="text-text-secondary text-sm font-medium italic opacity-80">
        Ghép các số để đạt 2048!
      </p>
    </div>

    <!-- Stats Row: Time - Score - Best -->
    <div class="mb-8 grid w-full max-w-[420px] grid-cols-3 gap-3">
      <div
        class="flex flex-col items-center justify-center rounded-sm bg-bg-surface px-2 py-3 border border-border-default shadow-sm group"
      >
        <div
          class="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-text-secondary font-display font-bold mb-1 opacity-60"
        >
          <Icon icon="lucide:clock" class="size-3" />
          <span>Thời gian</span>
        </div>
        <span class="text-xl font-black text-accent-sky tabular-nums">{{ time }}</span>
      </div>
      <div
        class="flex flex-col items-center justify-center rounded-sm bg-bg-surface px-2 py-3 border border-border-default shadow-sm"
      >
        <span
          class="text-[10px] uppercase tracking-widest text-text-secondary font-display font-bold mb-1 opacity-60"
          >Điểm</span
        >
        <span class="text-xl font-black text-text-primary tabular-nums">{{ score }}</span>
      </div>
      <div
        class="flex flex-col items-center justify-center rounded-sm bg-bg-surface px-2 py-3 border border-border-default shadow-sm border-r-4 border-r-accent-amber/20"
      >
        <span
          class="text-[10px] uppercase tracking-widest text-text-secondary font-display font-bold mb-1 opacity-60"
          >Kỷ lục</span
        >
        <span class="text-xl font-black text-text-primary tabular-nums">{{ bestScore }}</span>
      </div>
    </div>

    <!-- Game Board -->
    <div
      class="game-board relative rounded-sm bg-bg-surface p-3 shadow-2xl border-4 border-bg-surface touch-none"
    >
      <div class="grid grid-cols-4 gap-3 bg-bg-deep p-3 rounded-sm border border-border-default">
        <template v-for="i in 16" :key="i">
          <div
            class="size-16 sm:size-20 rounded-sm bg-bg-surface/30 border border-border-default/20"
          ></div>
        </template>
      </div>

      <div
        class="absolute inset-0 p-6 pointer-events-none overflow-hidden"
        style="perspective: 1000px"
      >
        <TransitionGroup name="tile">
          <div
            v-for="tile in tiles"
            :key="tile.id"
            class="tile absolute size-16 sm:size-20"
            :style="{
              transform: `translate3d(calc(${tile.x} * (100% + 12px)), calc(${tile.y} * (100% + 12px)), 0)`,
            }"
          >
            <div
              class="tile-content flex h-full w-full items-center justify-center text-2xl sm:text-3xl font-black rounded-sm shadow-md border border-white/10"
              :class="getTileColor(tile.value)"
            >
              {{ tile.value }}
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- Overlays -->
      <div
        v-if="isGameOverFlag || isPaused || showResumeChoice"
        class="absolute inset-0 flex flex-col items-center justify-center bg-bg-deep/95 backdrop-blur-xl animate-fade-up rounded-sm z-50 p-6"
      >
        <template v-if="showResumeChoice">
          <Icon icon="lucide:sparkles" class="size-16 text-accent-sky mb-4 animate-pulse" />
          <h2
            class="font-display text-3xl font-black text-text-primary mb-2 tracking-tighter uppercase leading-tight"
          >
            Chào mừng trở lại!
          </h2>
          <p class="text-text-secondary mb-8 text-sm max-w-[240px] text-center">
            Bạn muốn tiếp tục ván game đang dang dở?
          </p>
          <div class="flex flex-col gap-3 w-full max-w-[280px]">
            <button
              @click="resumeSavedGame"
              class="flex items-center justify-center gap-3 rounded-sm bg-accent-sky px-8 py-4 font-display font-black text-white hover:bg-accent-sky/90 transition-all shadow-xl active:scale-95"
            >
              TIẾP TỤC CHƠI
            </button>
            <button
              @click="initGame(true)"
              class="flex items-center justify-center gap-3 rounded-sm border border-border-default bg-bg-surface px-8 py-3 font-display font-bold text-text-secondary hover:text-text-primary transition-all"
            >
              VÁN MỚI
            </button>
          </div>
        </template>

        <template v-else-if="isGameOverFlag">
          <Icon icon="lucide:skull" class="size-20 text-accent-coral mb-4" />
          <h2
            class="font-display text-4xl font-black text-text-primary mb-8 tracking-tighter italic"
          >
            GAME OVER
          </h2>
          <div class="flex flex-col gap-3 w-full max-w-[280px]">
            <button
              @click="initGame(true)"
              class="rounded-sm bg-accent-coral px-10 py-4 font-display font-black text-white hover:bg-accent-coral/90 transition-all shadow-xl active:scale-95 text-xl"
            >
              CHƠI LẠI
            </button>
            <RouterLink
              to="/"
              class="flex items-center justify-center gap-2 rounded-sm border border-border-default/50 bg-bg-surface/50 px-8 py-3 font-display font-bold text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
            >
              <Icon icon="lucide:home" class="size-5" />
              VỀ TRANG CHỦ
            </RouterLink>
          </div>
        </template>

        <template v-else-if="isPaused">
          <Icon icon="lucide:pause-circle" class="size-20 text-accent-amber mb-6" />
          <h2
            class="font-display text-4xl font-black text-accent-amber mb-8 tracking-tighter uppercase italic"
          >
            ĐÃ TẠM DỪNG
          </h2>
          <div class="flex flex-col gap-3 w-full max-w-[280px]">
            <button
              @click="togglePause"
              class="rounded-sm bg-accent-amber px-8 py-4 font-display font-black text-white hover:bg-accent-amber/90 transition-all shadow-xl active:scale-95 text-lg"
            >
              TIẾP TỤC
            </button>
            <button
              @click="initGame(true)"
              class="rounded-sm border border-border-default bg-bg-surface px-8 py-3 font-display font-bold text-text-secondary hover:text-text-primary transition-all"
            >
              CHƠI MỚI
            </button>
            <RouterLink
              to="/"
              class="flex items-center justify-center gap-2 rounded-sm border border-border-default/50 bg-bg-surface/50 px-8 py-3 font-display font-bold text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
            >
              <Icon icon="lucide:home" class="size-5" />
              VỀ TRANG CHỦ
            </RouterLink>
          </div>
        </template>
      </div>
    </div>

    <!-- Combined Controls Row -->
    <div class="mt-8 flex w-full max-w-[420px] flex-col gap-4 px-2">
      <div class="flex gap-3">
        <button
          @click="togglePause"
          class="flex flex-1 items-center justify-center gap-2 rounded-sm border border-border-default bg-bg-surface py-4 font-display font-bold text-text-primary hover:bg-bg-elevated transition-all shadow-sm active:scale-95"
        >
          <Icon :icon="isPaused ? 'lucide:play' : 'lucide:pause'" class="size-5" />
          {{ isPaused ? 'Tiếp tục' : 'Tạm dừng' }}
        </button>
        <button
          @click="initGame(true)"
          class="flex flex-1 items-center justify-center gap-2 rounded-sm border border-border-default bg-bg-surface py-4 font-display font-bold text-text-primary hover:bg-bg-elevated transition-all shadow-sm active:scale-95"
        >
          <Icon icon="lucide:rotate-ccw" class="size-5" />
          Làm mới
        </button>
      </div>
      <RouterLink
        to="/"
        class="flex items-center justify-center gap-2 rounded-sm border border-border-default/50 bg-bg-surface/50 py-3 text-text-secondary hover:text-text-primary transition-all font-display font-bold hover:bg-bg-elevated"
      >
        <Icon icon="lucide:home" class="size-5" />
        Quay về Trang chủ
      </RouterLink>
    </div>

    <!-- Instructions -->
    <div
      class="mt-8 hidden md:block text-center border-t border-border-default/50 pt-8 max-w-[420px] w-full"
    >
      <div class="flex justify-center gap-12">
        <div class="flex flex-col items-center">
          <span class="text-[9px] uppercase font-display font-bold text-text-secondary mb-2"
            >Điều khiển</span
          >
          <kbd
            class="px-2 py-1 bg-bg-surface border border-border-default rounded text-sm text-text-primary font-bold"
            >↑ ↓ ← →</kbd
          >
        </div>
        <div class="flex flex-col items-center">
          <span class="text-[9px] uppercase font-display font-bold text-text-secondary mb-2"
            >Lối tắt</span
          >
          <kbd
            class="px-2 py-1 bg-bg-surface border border-border-default rounded text-sm text-text-primary font-bold italic"
            >P</kbd
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tile {
  transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
  z-index: 10;
  backface-visibility: hidden;
  transform-style: preserve-3d;
}

.tile-enter-active .tile-content {
  animation: tile-pop 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.tile-leave-active {
  transition: opacity 100ms ease;
  opacity: 0;
  z-index: 0;
}

@keyframes tile-pop {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 640px) {
  .size-16 {
    width: 3.5rem;
    height: 3.5rem;
  }
  .p-6 {
    padding: 1.5rem;
  }
}
</style>
