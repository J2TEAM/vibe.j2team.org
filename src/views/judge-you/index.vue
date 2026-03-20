<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useBehaviorStore } from './useBehaviorStore'
import { useBehaviorTracker } from './BehaviorTracker'
import MessageSystem from './components/MessageSystem.vue'
import { useMouse, useWindowScroll, useWindowSize } from '@vueuse/core'

const store = useBehaviorStore()
useBehaviorTracker()

const { x, y } = useMouse()
const { y: scrollY } = useWindowScroll()
const { width, height } = useWindowSize()

const isDisturbed = computed(() => store.phase >= 4 && store.phase < 9)
const isRevealed = computed(() => store.phase >= 9 || store.hasEscaped)
const isCollapse = computed(() => store.phase === 7)

// Silent Mode logic
const isSilent = computed(() => store.idleTime > 5000 && store.phase < 8)

const statusText = computed(() => {
  if (store.hasEscaped || store.phase >= 9) return 'REVEAL MODE'
  if (store.phase === 8) return 'TERMINATION'
  if (store.phase === 7) return 'COLLAPSE'
  if (store.phase === 6) return 'CONTROL'
  if (store.phase === 5) return 'PRESSURE'
  if (store.phase === 4) return 'DISTURB'
  if (store.phase === 3) return 'JUDGMENT'
  if (store.phase === 2) return 'OBSERVATION'
  return 'BOOT'
})

const observerLogs = computed(() => {
  const idleSeconds = Math.floor(store.idleTime / 1000)
  const totalSeconds = (store.totalTime / 1000).toFixed(1)

  const lines: string[] = [
    'PLAYER DETECTED',
    `PHASE ${store.phase}/9 :: ${statusText.value}`,
    `CLICKS ${store.clicks} | MOVES ${store.mouseMoves}`,
    `IDLE ${idleSeconds}s | TIME ${totalSeconds}s`,
    `PROFILE ${(store.personality ?? 'UNKNOWN').toUpperCase()}`,
  ]

  if (store.predictionTarget.show) lines.push('PREDICTION ZONE: LOCKED')
  else if (store.idleTime > 4000) lines.push('INPUT PATTERN: HESITATION SPIKE')
  else lines.push('INPUT PATTERN: STREAM OK')

  if (store.isRapidClicking) lines.push('ALERT: RAPID INPUT')
  if (store.isMobileTapSpam) lines.push('ALERT: TOUCH SPAM')
  if (store.isFastMoving) lines.push('ALERT: PANIC MOVEMENT')

  return lines.slice(0, 8)
})

// Dynamic 3D Perspective Tilt Calculation
const tiltStyle = computed(() => {
  if (isSilent.value || store.phase >= 8 || store.hasEscaped) return { transform: 'none' }
  const centerX = width.value / 2
  const centerY = height.value / 2
  const rotateX = ((y.value - centerY) / centerY) * -15 // max 15deg tilt
  const rotateY = ((x.value - centerX) / centerX) * 15
  return {
    transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
    transition: 'transform 0.1s ease-out',
  }
})

// Dynamic Lighting overlay - Darken everything except near cursor
const lightingStyle = computed(() => {
  if (store.phase < 4 || store.phase >= 8 || store.hasEscaped) return { opacity: 0 }
  // Pixel-hard spotlight on cursor
  return {
    background: `radial-gradient(circle 280px at ${x.value}px ${y.value}px, transparent 0 65%, rgba(0,0,0,0.9) 66% 100%)`,
    opacity: 1,
  }
})

// Trap Effect: Infinite scroll resistance in higher phases
watch(scrollY, (val) => {
  if (isDisturbed.value && val > 0) {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }
})

function shuffleButton(event: Event) {
  if (isDisturbed.value && store.phase !== 6) {
    // allow clicking in control phase 6
    const target = event.target as HTMLElement
    if (target && target.tagName === 'BUTTON') {
      const xDir = Math.random() > 0.5 ? 1 : -1
      const yDir = Math.random() > 0.5 ? 1 : -1
      const newX = Math.floor(Math.random() * 200 + 50) * xDir
      const newY = Math.floor(Math.random() * 200 + 50) * yDir
      target.style.transform = `translate(${newX}px, ${newY}px)`
      target.style.transition = 'transform 0.1s ease-out'
    }
  }
}

function handleEscape() {
  store.updateClick()
}
</script>

<template>
  <div
    class="judge-pixel relative flex flex-col justify-between overflow-hidden bg-bg-deep text-text-primary transition-all duration-[2000ms]"
    :class="{
      'glitch-bg': isDisturbed && !isSilent,
      'bg-black text-white': isRevealed,
      'cursor-none': isDisturbed,
      'min-h-[300dvh]': isDisturbed,
      'min-h-[100dvh]': !isDisturbed,
    }"
  >
    <!-- Pixel overlays (scanlines + noise) -->
    <div class="fixed inset-0 pointer-events-none z-[1] judge-scanlines"></div>
    <div class="fixed inset-0 pointer-events-none z-[2] judge-noise"></div>
    <div
      v-if="isDisturbed && !isSilent && !isRevealed"
      class="fixed inset-0 pointer-events-none z-[3] judge-glitch-pixels"
    ></div>

    <!-- Dynamic Lighting Overlay -->
    <div
      class="fixed inset-0 pointer-events-none z-[30] transition-opacity duration-1000"
      :style="lightingStyle"
    ></div>

    <!-- Sticky wrapper for Trap effect & Tilt -->
    <div
      class="flex flex-col justify-between w-full h-[100dvh] sticky top-0 transition-all duration-1000"
      :class="{
        'opacity-50 blur-[2px] scale-[0.98] grayscale': isSilent,
        'collapse-mode': isCollapse,
        'pixel-shake': store.isRapidClicking || store.isMobileTapSpam,
        'pixel-corrupt': store.phase >= 7 && !isRevealed,
      }"
    >
      <div
        class="flex-grow flex flex-col items-center justify-center p-6 w-full h-full"
        :style="tiltStyle"
      >
        <!-- HUD -->
        <div class="fixed inset-x-0 top-0 z-[70] pointer-events-none">
          <div class="mx-auto max-w-5xl px-4 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              class="judge-panel px-3 py-2 text-[11px] font-mono uppercase tracking-[0.22em] flex items-center gap-2"
            >
              <span
                class="judge-led"
                :class="{ 'judge-led-alert': isDisturbed && !isSilent }"
              ></span>
              <span>SYSTEM ONLINE</span>
              <span class="text-text-dim">/</span>
              <span>OBSERVING USER</span>
            </div>
            <div
              class="judge-panel px-3 py-2 text-[11px] font-mono uppercase tracking-[0.22em] flex items-center justify-between gap-3"
            >
              <span>PHASE {{ store.phase }}/9</span>
              <span :class="isDisturbed ? 'text-accent-coral' : 'text-accent-sky'">{{
                statusText
              }}</span>
            </div>
          </div>
        </div>

        <!-- Header controls -->
        <header class="absolute top-0 left-0 p-6 z-10 flex justify-between items-center w-full">
          <RouterLink
            to="/"
            class="judge-btn pointer-events-auto"
            :class="{ 'opacity-0 pointer-events-none': isRevealed || isCollapse }"
          >
            ← BACK TO HOME
          </RouterLink>

          <div
            v-if="store.phase >= 2 && store.phase < 8"
            class="hidden sm:block text-[11px] font-mono uppercase tracking-[0.22em] opacity-70 transition-opacity duration-1000 judge-panel px-3 py-2"
          >
            <span v-if="store.predictionTarget.show">PREDICTING INTERACTION ZONE...</span>
            <span v-else-if="store.idleTime > 4000">PREDICTING NEXT MOVE...</span>
            <span v-else>ANALYZING INPUT PATTERN...</span>
          </div>
        </header>

        <!-- Main Content -->
        <div
          class="w-full max-w-5xl transition-transform duration-500"
          :class="{ 'animate-pulse skew-x-1': isDisturbed, 'opacity-0': isRevealed }"
        >
          <div class="grid gap-4 md:grid-cols-[1fr_320px] items-start">
            <section class="judge-panel p-5 md:p-7">
              <h1
                class="text-2xl md:text-4xl font-mono uppercase tracking-[0.24em] text-text-primary transition-all duration-[3s]"
                :class="{
                  'tracking-[0.5em] opacity-30 blur-sm': isCollapse,
                  'tracking-[0.24em]': !isCollapse,
                }"
              >
                <span class="text-accent-coral">//</span>
                <span class="ml-3">THE PAGE THAT JUDGES YOU</span>
              </h1>

              <div class="mt-8 flex flex-col items-start gap-6">
                <button
                  @click="handleEscape"
                  @mouseenter="shuffleButton"
                  class="judge-btn w-full sm:w-auto focus:outline-none"
                  :class="{
                    'pointer-events-none opacity-50': isRevealed,
                    'tracking-[1em] opacity-10': isCollapse,
                    'tracking-[0.22em]': !isCollapse,
                  }"
                >
                  {{ store.phase >= 4 ? 'TRY TO CLICK ME' : 'INTERACT WITH ME' }}
                </button>

                <div class="text-[11px] font-mono uppercase tracking-[0.22em] text-text-secondary">
                  <div class="flex items-center gap-2">
                    <span class="text-accent-sky">STATUS</span>
                    <span class="text-text-dim">::</span>
                    <span :class="isDisturbed ? 'text-accent-coral' : 'text-text-primary'">{{
                      statusText
                    }}</span>
                  </div>
                  <p v-if="store.phase >= 3 && !isRevealed" class="mt-3 opacity-70 animate-pulse">
                    HOLD INPUT DOWN TO ESCAPE...
                  </p>
                </div>
              </div>
            </section>

            <aside class="judge-panel p-5 md:p-6">
              <div class="flex items-center justify-between gap-3">
                <h2 class="font-mono uppercase tracking-[0.22em] text-[11px] text-accent-amber">
                  OBSERVER LOG
                </h2>
                <div class="font-mono text-[11px] uppercase tracking-[0.22em] text-text-dim">
                  LIVE
                </div>
              </div>

              <div
                class="mt-4 grid gap-2 font-mono text-[11px] uppercase tracking-[0.22em] leading-relaxed"
              >
                <div v-for="line in observerLogs" :key="line" class="judge-logline">
                  {{ line }}
                </div>
              </div>

              <div
                class="mt-5 pt-4 border-t-2 border-border-default/60 font-mono text-[11px] uppercase tracking-[0.22em] text-text-secondary"
              >
                <div class="flex items-center justify-between gap-3">
                  <span>CLICK RATE</span>
                  <span
                    :class="store.isRapidClicking ? 'text-accent-coral' : 'text-text-primary'"
                    >{{ store.isRapidClicking ? 'SPIKING' : 'STABLE' }}</span
                  >
                </div>
                <div class="mt-2 flex items-center justify-between gap-3">
                  <span>MOVE</span>
                  <span :class="store.isFastMoving ? 'text-accent-coral' : 'text-text-primary'">{{
                    store.isFastMoving ? 'ERRATIC' : 'NORMAL'
                  }}</span>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <!-- Footer -->
        <footer
          class="absolute bottom-0 left-0 p-6 w-full text-center text-[11px] font-mono uppercase tracking-[0.22em] text-text-secondary z-10 transition-all duration-1000 flex flex-col items-center"
          :class="{ 'opacity-0': isRevealed || isCollapse }"
        >
          <p>CREATED BY: <span class="text-accent-sky">ITSAZURA</span></p>
          <p class="mt-2 opacity-70 max-w-md mx-auto tracking-[0.18em]">
            A RETRO PSYCHOLOGICAL SYSTEM THAT OBSERVES AND REACTS.
          </p>
          <p v-if="store.visitCount > 1" class="mt-3 opacity-60 tracking-[0.18em]">
            RETURN VISITS: {{ store.visitCount }} | LAST SESSION:
            {{ (store.lastDuration / 1000).toFixed(1) }}S
          </p>
        </footer>
      </div>
    </div>

    <!-- Overlay Component Handles Messages -->
    <MessageSystem />

    <!-- Pixel collapse overlay (phase 7) -->
    <div
      v-if="isCollapse && !isRevealed"
      class="fixed inset-0 pointer-events-none z-[65] judge-collapse"
    ></div>

    <!-- Custom Cursor / Delayed Cursor for Disturb Phases -->
    <div
      v-if="isDisturbed && !isRevealed"
      class="judge-cursor fixed w-4 h-4 bg-accent-coral border-2 border-bg-deep pointer-events-none transition-all duration-75 z-[60] mix-blend-screen"
      :style="{ left: `${x - 8}px`, top: `${y - 8}px` }"
    ></div>

    <!-- Subtler Cursor "Eye" shadow tracking behind -->
    <div
      v-if="store.phase >= 3 && !isRevealed"
      class="fixed w-28 h-28 pointer-events-none transition-all duration-700 z-[10] border-4 border-accent-coral/15 judge-cursor-eye"
      :class="{ 'opacity-60': !isCollapse, 'opacity-90': isCollapse }"
      :style="{ left: `${x - 64}px`, top: `${y - 64}px` }"
    ></div>
  </div>
</template>

<style scoped>
.judge-pixel {
  image-rendering: pixelated;
}

.judge-panel {
  border: 4px solid var(--color-border-default);
  background: color-mix(in srgb, var(--color-bg-surface) 95%, transparent);
  box-shadow: 6px 6px 0 rgb(0 0 0 / 0.35);
}

.judge-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 4px solid var(--color-border-default);
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  box-shadow: 4px 4px 0 rgb(0 0 0 / 0.4);
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  font-size: 11px;
  line-height: 1.2;
  transition:
    transform 80ms steps(2, end),
    background 120ms steps(2, end),
    border-color 120ms steps(2, end),
    color 120ms steps(2, end);
}

.judge-btn:hover {
  background: var(--color-bg-elevated);
  border-color: var(--color-accent-amber);
}

.judge-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 rgb(0 0 0 / 0.45);
}

.judge-logline {
  padding: 0.25rem 0.5rem;
  border-left: 4px solid color-mix(in srgb, var(--color-accent-sky) 35%, transparent);
  background: color-mix(in srgb, var(--color-bg-deep) 35%, transparent);
}

.judge-led {
  width: 10px;
  height: 10px;
  border: 2px solid var(--color-border-default);
  background: var(--color-accent-sky);
  box-shadow: 2px 2px 0 rgb(0 0 0 / 0.45);
  animation: led-blink 1.2s steps(2, end) infinite;
}

.judge-led-alert {
  background: var(--color-accent-coral);
}

@keyframes led-blink {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0.35;
  }
}

.judge-scanlines {
  background: repeating-linear-gradient(
    to bottom,
    rgb(0 0 0 / 0) 0px,
    rgb(0 0 0 / 0) 2px,
    rgb(0 0 0 / 0.22) 3px
  );
  opacity: 0.35;
}

.judge-noise {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.22'/%3E%3C/svg%3E");
  mix-blend-mode: overlay;
  opacity: 0.08;
}

.judge-glitch-pixels {
  background-image:
    repeating-linear-gradient(
      0deg,
      rgb(0 0 0 / 0) 0px,
      rgb(0 0 0 / 0) 10px,
      color-mix(in srgb, var(--color-accent-sky) 8%, transparent) 11px
    ),
    repeating-linear-gradient(
      90deg,
      rgb(0 0 0 / 0) 0px,
      rgb(0 0 0 / 0) 14px,
      color-mix(in srgb, var(--color-accent-coral) 7%, transparent) 15px
    );
  animation: glitch-pixels 0.55s steps(2, end) infinite;
  mix-blend-mode: screen;
  opacity: 0.35;
}

@keyframes glitch-pixels {
  0% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(-2px, 1px);
  }
  50% {
    transform: translate(2px, -1px);
  }
  75% {
    transform: translate(-1px, -2px);
  }
  100% {
    transform: translate(0, 0);
  }
}

.judge-collapse {
  background:
    repeating-linear-gradient(
      90deg,
      rgb(0 0 0 / 0.9) 0px,
      rgb(0 0 0 / 0.9) 12px,
      rgb(0 0 0 / 0.96) 13px
    ),
    repeating-linear-gradient(0deg, rgb(0 0 0 / 0) 0px, rgb(0 0 0 / 0) 12px, rgb(0 0 0 / 0.25) 13px);
  animation: collapse-wipe 2.2s steps(18, end) forwards;
}

@keyframes collapse-wipe {
  0% {
    opacity: 0;
    clip-path: inset(100% 0 0 0);
  }
  15% {
    opacity: 0.15;
    clip-path: inset(90% 0 0 0);
  }
  55% {
    opacity: 0.55;
    clip-path: inset(35% 0 0 0);
  }
  100% {
    opacity: 1;
    clip-path: inset(0 0 0 0);
  }
}

.judge-cursor {
  box-shadow:
    6px 0 0 color-mix(in srgb, var(--color-accent-coral) 45%, transparent),
    12px 0 0 color-mix(in srgb, var(--color-accent-coral) 22%, transparent),
    0 6px 0 color-mix(in srgb, var(--color-accent-coral) 18%, transparent);
  animation: cursor-blink 0.9s steps(2, end) infinite;
}

@keyframes cursor-blink {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0.25;
  }
}

.judge-cursor-eye {
  background: repeating-linear-gradient(
    90deg,
    color-mix(in srgb, var(--color-accent-coral) 8%, transparent) 0px,
    color-mix(in srgb, var(--color-accent-coral) 8%, transparent) 6px,
    color-mix(in srgb, var(--color-accent-coral) 2%, transparent) 7px
  );
}

.pixel-shake {
  animation: pixel-shake 0.18s steps(2, end) infinite;
}

@keyframes pixel-shake {
  0% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(1px, -1px);
  }
  50% {
    transform: translate(-1px, 1px);
  }
  75% {
    transform: translate(1px, 1px);
  }
  100% {
    transform: translate(0, 0);
  }
}

.pixel-corrupt {
  filter: contrast(1.1) saturate(1.05);
}

.glitch-bg {
  animation: glitch-anim 0.9s steps(2, end) infinite;
}

@keyframes glitch-anim {
  0% {
    filter: contrast(1.05);
    transform: translate(0);
  }
  20% {
    filter: contrast(1.25) saturate(1.2);
    transform: translate(-2px, 1px);
  }
  40% {
    transform: translate(2px, -1px);
  }
  60% {
    filter: contrast(1.1) hue-rotate(3deg);
    transform: translate(-1px, -2px);
  }
  80% {
    transform: translate(1px, 2px);
  }
  100% {
    filter: contrast(1.05);
    transform: translate(0);
  }
}

.collapse-mode {
  animation: collapse-anim 5s steps(8, end) forwards;
}

@keyframes collapse-anim {
  0% {
    transform: scale(1);
    filter: contrast(1);
  }
  40% {
    transform: scale(1.03) translate(1px, -1px);
    filter: contrast(1.35) saturate(1.15);
    opacity: 0.85;
  }
  70% {
    transform: scale(0.98) translate(-2px, 2px);
    filter: contrast(0.85) saturate(0.9);
    opacity: 0.55;
  }
  100% {
    transform: scale(0.92) translate(2px, 10px);
    filter: contrast(0.6);
    opacity: 0.28;
  }
}
</style>
