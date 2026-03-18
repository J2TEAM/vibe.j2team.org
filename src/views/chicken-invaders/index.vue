<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, provide } from 'vue'
import { GAME_WIDTH, GAME_HEIGHT } from './utils/config'
import { useGame } from './composables/useGame'

import GameHeader from './components/GameHeader.vue'
import GameOverlays from './components/GameOverlays.vue'
import GameEntities from './components/GameEntities.vue'
import VfxLayer from './components/VfxLayer.vue'
import Leaderboard from './components/GameLeaderboard.vue'

const game = useGame()
provide('game', game)

const { bgHue, boardRotation, setPointerState, handleBoardPointerDown } = game

const gameScale = ref(1)
const headerScale = ref(1)
const boardWrapper = ref<HTMLElement | null>(null)

const updateScale = () => {
  if (!boardWrapper.value) return
  const availableWidth = boardWrapper.value.clientWidth
  const availableHeight = boardWrapper.value.clientHeight

  const scaleX = availableWidth / GAME_WIDTH
  const scaleY = availableHeight / GAME_HEIGHT

  if (window.innerWidth < 1024) {
    gameScale.value = Math.min(scaleX, scaleY)
    headerScale.value = scaleX
  } else {
    const minScale = Math.min(scaleX, scaleY, 1.2)
    gameScale.value = minScale
    headerScale.value = minScale
  }
}

onMounted(() => {
  window.addEventListener('resize', updateScale)
  setTimeout(updateScale, 100)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScale)
})
watch(boardRotation, () => {
  updateScale()
})
</script>

<template>
  <div
    class="h-dvh w-screen bg-bg-deep text-text-primary font-body flex flex-col items-center select-none overflow-hidden touch-none relative"
  >
    <GameHeader :gameScale="headerScale" />

    <div
      ref="boardWrapper"
      class="flex-1 w-full flex items-center justify-center min-h-0 relative z-10 pointer-events-auto"
    >
      <div
        class="hidden max-lg:portrait:flex absolute inset-0 z-1000 bg-bg-deep/95 backdrop-blur-md flex-col items-center justify-center text-center px-4 border border-border-default"
      >
        <div class="text-[80px] mb-4 text-accent-sky animate-[bounce_2s_infinite]">📱</div>
        <div
          class="text-[50px] mb-6 text-accent-amber animate-[spin_2s_ease-in-out_infinite] rotate-90 w-16 h-16 flex items-center justify-center leading-none"
        >
          ↻
        </div>
        <h2
          class="text-2xl font-display font-bold text-accent-coral uppercase tracking-widest mb-3 drop-shadow-[0_0_10px_#FF6B4A]"
        >
          Xoay ngang màn hình
        </h2>
        <p class="text-text-secondary text-sm px-8 leading-relaxed">
          Để có trải nghiệm né đạn và tiêu diệt boss mượt mà nhất, vui lòng xoay ngang điện thoại
          của bạn!
        </p>
      </div>

      <div
        class="relative border border-border-default overflow-hidden shadow-2xl shrink-0 transition-colors duration-1000 max-lg:portrait:hidden"
        :style="{
          width: `${GAME_WIDTH}px`,
          height: `${GAME_HEIGHT}px`,
          transform: `scale(${gameScale})`,
          transformOrigin: 'center center',
          backgroundColor: `hsl(${215 + bgHue}, 46%, 8%)`,
        }"
      >
        <div
          class="absolute inset-0 pointer-events-none z-0"
          :style="{ filter: `hue-rotate(${bgHue}deg)` }"
        >
          <div class="space-layer stars-distant"></div>
          <div class="space-layer stars-near"></div>
        </div>

        <GameOverlays />
        <Leaderboard />
        <div
          id="touch-layer"
          class="absolute inset-0 z-200 cursor-crosshair touch-none"
          @pointermove="
            (e) => {
              setPointerState(e.clientX, e.clientY, undefined)
            }
          "
          @pointerdown="handleBoardPointerDown"
          @pointerup="
            () => {
              setPointerState(undefined, undefined, false)
            }
          "
          @pointerleave="
            () => {
              setPointerState(undefined, undefined, false)
            }
          "
        ></div>

        <GameEntities />
        <VfxLayer />
      </div>
    </div>
  </div>
</template>

<style scoped>
.space-layer {
  position: absolute;
  top: -100%;
  left: 0;
  right: 0;
  height: 200%;
  width: 100%;
  will-change: transform;
}

.stars-distant {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><circle cx="25" cy="25" r="1" fill="%234A6180" opacity="0.3"/><circle cx="125" cy="50" r="1" fill="%234A6180" opacity="0.6"/><circle cx="75" cy="125" r="1.5" fill="%234A6180" opacity="0.4"/><circle cx="175" cy="175" r="1" fill="%234A6180" opacity="0.2"/></svg>');
  background-repeat: repeat;
  animation: scrollSpace 18s linear infinite;
}

.stars-near {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><circle cx="100" cy="50" r="1.5" fill="%238B9DB5" opacity="0.8"/><circle cx="250" cy="150" r="2" fill="%23FFB830" opacity="0.4"/><circle cx="50" cy="250" r="1.5" fill="%23F0EDE6" opacity="0.9"/></svg>');
  background-repeat: repeat;
  animation: scrollSpace 8s linear infinite;
}

@keyframes scrollSpace {
  0% {
    transform: translate3d(0, 0, 0);
  }

  100% {
    transform: translate3d(0, 50%, 0);
  }
}
</style>
