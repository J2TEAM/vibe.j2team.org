<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useGameStore } from './stores/gameStore'
import { useGameLoop } from './composables/useGameLoop'
import ZombieComponent from './components/Zombie.vue'
import GameHUD from './components/GameHUD.vue'
import TypingInput from './components/TypingInput.vue'
import GameOver from './components/GameOver.vue'
import Player from './components/Player.vue'
import PixelExplosion from './components/PixelExplosion.vue'
import FloatingText from './components/FloatingText.vue'

const store = useGameStore()
const { start, resume, stop } = useGameLoop()
const inputRef = ref<InstanceType<typeof TypingInput> | null>(null)
const damageFlash = ref(false)
const killFlash = ref(false)
let flashTimer: number | undefined
let killFlashTimer: number | undefined

const shakeStyle = computed(() => {
  const x = Math.round(store.shakeX * 10)
  const y = Math.round(store.shakeY * 10)
  return { transform: `translate(${x}px, ${y}px)` }
})

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

watch(
  () => store.killPulse,
  (v, prev) => {
    if (prev !== undefined && v !== prev) {
      killFlash.value = true
      if (killFlashTimer) window.clearTimeout(killFlashTimer)
      killFlashTimer = window.setTimeout(() => {
        killFlash.value = false
      }, 90)
    }
  },
)
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body overflow-hidden">
    <div class="mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
      <header class="flex items-center justify-between gap-3">
        <RouterLink
          to="/"
          class="px-4 py-2 border border-border-default bg-bg-surface text-text-secondary text-xs font-display tracking-widest uppercase transition hover:border-accent-coral hover:text-text-primary active:translate-y-0.5"
        >
          &larr; Trang chủ
        </RouterLink>
        <div class="text-right">
          <div class="text-xs text-text-dim font-display tracking-widest uppercase crt-flicker">
            // Arcade
          </div>
          <h1 class="text-2xl sm:text-3xl font-display font-extrabold tracking-tight">
            Typing Zombie
          </h1>
        </div>
      </header>

      <section class="mt-5 sm:mt-7 arcade-shell">
        <div class="arcade-topbar border border-border-default bg-bg-surface">
          <GameHUD
            v-if="store.status === 'playing' || store.status === 'paused'"
            @pause="handlePause"
            @resume="handleResume"
            @menu="handleMenu"
          />
          <div v-else class="px-3 py-2 sm:px-4 sm:py-3 border-b border-border-default">
            <div class="flex items-center justify-between gap-2"></div>
          </div>
        </div>

        <div class="arcade-screen border border-border-default bg-bg-deep scanlines">
          <main
            class="relative overflow-hidden h-[64vh] min-h-110 max-h-175 sm:h-[72vh] sm:min-h-140 sm:max-h-205"
            :style="shakeStyle"
          >
            <div
              v-if="damageFlash"
              class="absolute inset-0 bg-accent-coral/20 z-40 pointer-events-none"
            />
            <div
              v-if="killFlash"
              class="absolute inset-0 bg-text-primary/6 z-30 pointer-events-none"
            />

            <div
              v-if="store.status === 'idle'"
              class="absolute inset-0 z-20 grid place-items-center p-4"
            >
              <div class="w-full max-w-md text-center">
                <div
                  class="text-accent-coral text-xs sm:text-sm font-display tracking-widest uppercase"
                >
                  Press start
                </div>
                <h2 class="mt-2 text-4xl sm:text-6xl font-display font-extrabold tracking-tight">
                  Typing Zombie
                </h2>
                <p class="mt-4 text-text-secondary text-sm">
                  Gõ đúng từ để bắn hạ zombie trước khi chúng chạm bạn. Combo càng cao, điểm càng
                  nhân.
                </p>

                <div class="mt-6 text-left border border-border-default bg-bg-surface p-4">
                  <p class="text-xs text-text-secondary">
                    1. Zombie xuất hiện từ bên phải, tiến dần về bạn
                  </p>
                  <p class="mt-2 text-xs text-text-secondary">
                    2. Gõ đúng từ trên đầu zombie để hạ gục
                  </p>
                  <p class="mt-2 text-xs text-text-secondary">3. Sai ký tự sẽ reset combo</p>
                  <p class="mt-2 text-xs text-text-secondary">4. Nhặt power-up để sống lâu hơn</p>
                </div>

                <button
                  type="button"
                  class="mt-6 w-full px-6 py-3 bg-accent-coral text-bg-deep border border-accent-coral font-display font-bold tracking-widest uppercase transition hover:brightness-105 active:translate-y-0.5"
                  @click="handleStart"
                >
                  Start
                </button>
              </div>
            </div>

            <template v-if="store.status === 'playing' || store.status === 'paused'">
              <div class="absolute inset-0 pixel-grid opacity-20 pointer-events-none" />
              <div
                class="absolute left-0 top-0 bottom-0 w-[10%] bg-linear-to-r from-accent-coral/18 to-transparent pointer-events-none"
              />

              <Player />
              <ZombieComponent v-for="zombie in store.zombies" :key="zombie.id" :zombie="zombie" />
              <template v-for="effect in store.effects" :key="effect.id">
                <PixelExplosion v-if="effect.kind === 'explode'" :effect="effect" />
                <FloatingText v-else :effect="effect" />
              </template>
            </template>

            <div
              v-if="store.status === 'paused'"
              class="absolute inset-0 z-50 grid place-items-center bg-black/70 p-4"
            >
              <div
                class="w-full max-w-sm border border-border-default bg-bg-surface p-5 text-center"
              >
                <div
                  class="text-accent-sky text-xs font-display tracking-widest uppercase crt-flicker"
                >
                  Paused
                </div>
                <div class="mt-2 text-4xl font-display font-extrabold tracking-tight">
                  <span class="pause-blink">PAUSE</span>
                </div>
                <div class="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    class="px-5 py-3 bg-accent-coral text-bg-deep border border-accent-coral font-display font-bold tracking-widest uppercase transition hover:brightness-105 active:translate-y-0.5"
                    @click="handleResume"
                  >
                    Resume
                  </button>
                  <button
                    type="button"
                    class="px-5 py-3 border border-border-default bg-bg-deep text-text-secondary font-display font-bold tracking-widest uppercase transition hover:border-accent-coral hover:text-text-primary active:translate-y-0.5"
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

        <div class="arcade-bottombar border border-border-default bg-bg-surface">
          <TypingInput
            v-if="store.status === 'playing' || store.status === 'paused'"
            ref="inputRef"
          />
          <div v-else class="px-3 py-2 sm:px-4 sm:py-3">
            <div class="text-xs text-text-secondary font-display tracking-widest uppercase">
              Tip: bấm Start, rồi gõ từ trong ô nhập
            </div>
          </div>
        </div>
      </section>

      <footer class="mt-6 text-center">
        <p class="text-text-dim text-xs font-display tracking-widest uppercase">
          Tác giả: <span class="text-text-primary font-bold">ItsAzura</span>
        </p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.arcade-shell {
  border: 2px solid #000;
  outline: 2px solid rgba(37, 53, 73, 0.9);
  outline-offset: -2px;
}

.pixel-grid {
  background-image:
    linear-gradient(rgba(255, 107, 74, 0.18) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 107, 74, 0.18) 1px, transparent 1px);
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
