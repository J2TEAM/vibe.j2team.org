<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useGameStore } from './stores/gameStore'
import { useGameLoop } from './composables/useGameLoop'
import ZombieComponent from './components/Zombie.vue'
import GameHUD from './components/GameHUD.vue'
import TypingInput from './components/TypingInput.vue'
import GameOver from './components/GameOver.vue'
import Player from './components/Player.vue'
import PixelExplosion from './components/PixelExplosion.vue'

const store = useGameStore()
const { start, resume, stop } = useGameLoop()
const inputRef = ref<InstanceType<typeof TypingInput> | null>(null)
const damageFlash = ref(false)
let flashTimer: number | undefined

function handleStart() {
  start()
  setTimeout(() => inputRef.value?.focusInput(), 100)
}

function handleRestart() {
  handleStart()
}

function handlePause() {
  if (store.status !== 'playing') return
  store.pauseGame()
  stop()
}

function handleResume() {
  if (store.status !== 'paused') return
  store.resumeGame()
  resume()
  setTimeout(() => inputRef.value?.focusInput(), 60)
}

function handleMenu() {
  stop()
  store.returnToMenu()
}

watch(
  () => store.health,
  (hp, prev) => {
    if (prev !== undefined && hp < prev) {
      damageFlash.value = true
      if (flashTimer) window.clearTimeout(flashTimer)
      flashTimer = window.setTimeout(() => {
        damageFlash.value = false
      }, 120)
    }
  },
)
</script>

<template>
  <div class="min-h-screen bg-[#0f172a] text-[#e2e8f0] font-mono overflow-hidden">
    <div class="mx-auto w-full max-w-275 px-2 py-6 sm:py-6">
      <header class="flex items-center justify-between gap-3">
        <RouterLink
          to="/"
          class="px-3 py-2 border-2 border-[#22c55e] text-[#22c55e] text-[10px] sm:text-xs tracking-[0.2em] uppercase active:translate-y-0.5"
        >
          &lt; Trang chủ
        </RouterLink>
        <div class="text-right">
          <div
            class="text-[10px] sm:text-xs text-accent-sky tracking-[0.24em] uppercase crt-flicker"
          >
            Retro Arcade
          </div>
          <h1 class="text-lg sm:text-2xl font-black tracking-[0.28em] uppercase neon-title">
            Typing Zombie
          </h1>
        </div>
      </header>

      <section class="mt-5 sm:mt-7 arcade-shell">
        <div class="arcade-topbar border-4 border-[#22c55e] bg-[#0b1220]">
          <GameHUD
            v-if="store.status === 'playing' || store.status === 'paused'"
            @pause="handlePause"
            @resume="handleResume"
            @menu="handleMenu"
          />
          <div v-else class="px-3 py-2 sm:px-4 sm:py-3 border-b-2 border-[#22c55e]">
            <div class="flex items-center justify-between gap-2"></div>
          </div>
        </div>

        <div class="arcade-screen border-4 border-[#22c55e] bg-[#020617] scanlines">
          <main
            class="relative overflow-hidden h-[64vh] min-h-110 max-h-175 sm:h-[72vh] sm:min-h-140 sm:max-h-205"
          >
            <div
              v-if="damageFlash"
              class="absolute inset-0 bg-[#ef4444]/25 z-40 pointer-events-none"
            />

            <div
              v-if="store.status === 'idle'"
              class="absolute inset-0 z-20 grid place-items-center p-4"
            >
              <div class="w-full max-w-md text-center">
                <div
                  class="text-[#22c55e] text-xs sm:text-sm tracking-[0.26em] uppercase crt-flicker"
                >
                  Press start
                </div>
                <h2
                  class="mt-2 text-4xl sm:text-6xl font-black tracking-[0.28em] uppercase neon-title"
                >
                  Typing Zombie
                </h2>
                <p class="mt-4 text-[#94a3b8] text-xs sm:text-sm tracking-wide uppercase">
                  Gõ đúng từ để bắn hạ 🧟 trước khi chúng chạm bạn
                </p>

                <div class="mt-6 text-left border-2 border-accent-sky bg-[#0b1220] p-4">
                  <p class="text-[10px] sm:text-xs tracking-wider uppercase text-[#e2e8f0]">
                    1. Zombie xuất hiện từ bên phải
                  </p>
                  <p class="mt-2 text-[10px] sm:text-xs tracking-wider uppercase text-[#e2e8f0]">
                    2. Gõ đúng từ trên đầu zombie
                  </p>
                  <p class="mt-2 text-[10px] sm:text-xs tracking-wider uppercase text-[#e2e8f0]">
                    3. Chạm người chơi sẽ mất HP
                  </p>
                  <p class="mt-2 text-[10px] sm:text-xs tracking-wider uppercase text-[#ef4444]">
                    Càng lâu càng khó
                  </p>
                </div>

                <button
                  type="button"
                  class="mt-6 w-full px-6 py-3 bg-[#22c55e] text-[#020617] border-4 border-[#16a34a] font-black tracking-[0.22em] uppercase active:translate-y-0.5 active:border-[#22c55e]"
                  @click="handleStart"
                >
                  Start
                </button>
              </div>
            </div>

            <template v-if="store.isPlaying">
              <div class="absolute inset-0 pixel-grid opacity-20 pointer-events-none" />
              <div
                class="absolute left-0 top-0 bottom-0 w-[10%] bg-linear-to-r from-[#ef4444]/25 to-transparent pointer-events-none"
              />

              <Player />
              <ZombieComponent v-for="zombie in store.zombies" :key="zombie.id" :zombie="zombie" />
              <PixelExplosion v-for="effect in store.effects" :key="effect.id" :effect="effect" />
            </template>

            <div
              v-if="store.status === 'paused'"
              class="absolute inset-0 z-50 grid place-items-center bg-black/70 p-4"
            >
              <div class="w-full max-w-sm border-4 border-accent-sky bg-[#0b1220] p-5 text-center">
                <div class="text-accent-sky text-xs tracking-[0.26em] uppercase crt-flicker">
                  Paused
                </div>
                <div class="mt-2 text-4xl font-black tracking-[0.28em] uppercase neon-title">
                  <span class="pause-blink">PAUSE</span>
                </div>
                <div class="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    class="px-5 py-3 bg-[#22c55e] text-[#020617] border-4 border-[#16a34a] font-black tracking-[0.22em] uppercase active:translate-y-0.5 active:border-[#22c55e]"
                    @click="handleResume"
                  >
                    Resume
                  </button>
                  <button
                    type="button"
                    class="px-5 py-3 border-4 border-[#ef4444] text-[#ef4444] font-black tracking-[0.22em] uppercase active:translate-y-0.5"
                    @click="handleMenu"
                  >
                    Menu
                  </button>
                </div>
              </div>
            </div>

            <GameOver v-if="store.isGameOver" @restart="handleRestart" />
          </main>
        </div>

        <div class="arcade-bottombar border-4 border-[#22c55e] bg-[#0b1220]">
          <TypingInput
            v-if="store.status === 'playing' || store.status === 'paused'"
            ref="inputRef"
          />
          <div v-else class="px-3 py-2 sm:px-4 sm:py-3">
            <div class="text-[10px] sm:text-xs tracking-[0.22em] uppercase text-[#94a3b8]">
              Tip: bấm Start, rồi gõ từ trong ô nhập
            </div>
          </div>
        </div>
      </section>

      <footer class="mt-6 text-center">
        <p class="text-[#94a3b8] text-[10px] sm:text-xs tracking-[0.18em] uppercase">
          Tác giả: <span class="text-[#22c55e] font-black">ItsAzura</span>
        </p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.arcade-shell {
  border: 6px solid #0b1220;
  outline: 6px solid #000;
  outline-offset: -6px;
}

.neon-title {
  text-shadow:
    0 0 0 #000,
    2px 2px 0 #000,
    0 0 18px rgba(34, 197, 94, 0.25),
    0 0 24px rgba(56, 189, 248, 0.15);
}

.pixel-grid {
  background-image:
    linear-gradient(rgba(34, 197, 94, 0.22) 1px, transparent 1px),
    linear-gradient(90deg, rgba(34, 197, 94, 0.22) 1px, transparent 1px);
  background-size: 32px 32px;
  image-rendering: pixelated;
}

.scanlines::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.04),
    rgba(255, 255, 255, 0.04) 1px,
    rgba(0, 0, 0, 0) 3px,
    rgba(0, 0, 0, 0) 6px
  );
  opacity: 0.35;
  z-index: 30;
}

.scanlines::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.35) 70%);
  opacity: 0.8;
  z-index: 31;
}

.arcade-screen {
  position: relative;
}

.crt-flicker {
  animation: flicker 1700ms steps(2) infinite;
}

@keyframes pauseBlink {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0.35;
  }
}

.pause-blink {
  animation: pauseBlink 900ms steps(2) infinite;
}

@keyframes flicker {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.85;
  }
  100% {
    opacity: 1;
  }
}
</style>
