<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useMouse, useWindowScroll, useWindowSize } from '@vueuse/core'
import { useBehaviorTracker } from './BehaviorTracker'
import MessageSystem from './components/MessageSystem.vue'
import { useBehaviorStore } from './useBehaviorStore'

const store = useBehaviorStore()
useBehaviorTracker()

const { x, y } = useMouse()
const { y: scrollY } = useWindowScroll()
const { width, height } = useWindowSize()

const isDisturbed = computed(() => store.phase >= 4 && store.phase < 9)
const isRevealed = computed(() => store.phase >= 9 || store.hasEscaped)
const isCollapse = computed(() => store.phase === 7)
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

const tiltStyle = computed(() => {
  if (isSilent.value || store.phase >= 8 || store.hasEscaped) return { transform: 'none' }
  const centerX = width.value / 2
  const centerY = height.value / 2
  const rotateX = ((y.value - centerY) / centerY) * -10
  const rotateY = ((x.value - centerX) / centerX) * 10
  return {
    transform: `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
    transition: 'transform 0.14s ease-out',
  }
})

const lightingStyle = computed(() => {
  if (store.phase < 4 || store.phase >= 8 || store.hasEscaped) return { opacity: 0 }
  return {
    background: `radial-gradient(circle 300px at ${x.value}px ${y.value}px, transparent 0 60%, rgba(6, 10, 16, 0.9) 66% 100%)`,
    opacity: 1,
  }
})

const sceneTone = computed(() => {
  let accent = 'var(--color-accent-sky)'
  let secondary = 'var(--color-accent-amber)'
  let haze = 'rgba(56, 189, 248, 0.18)'
  let muted = 'rgba(139, 157, 181, 0.45)'

  if (isSilent.value) {
    accent = 'color-mix(in srgb, var(--color-text-secondary) 72%, transparent)'
    secondary = 'color-mix(in srgb, var(--color-text-dim) 82%, transparent)'
    haze = 'rgba(74, 97, 128, 0.16)'
    muted = 'rgba(74, 97, 128, 0.5)'
  } else if (store.phase >= 5 && !isRevealed.value) {
    accent = 'var(--color-accent-coral)'
    secondary = 'var(--color-accent-amber)'
    haze = 'rgba(255, 107, 74, 0.18)'
    muted = 'rgba(255, 184, 48, 0.28)'
  }

  if (isRevealed.value) {
    accent = 'rgba(240, 237, 230, 0.82)'
    secondary = 'rgba(139, 157, 181, 0.44)'
    haze = 'rgba(240, 237, 230, 0.08)'
    muted = 'rgba(240, 237, 230, 0.14)'
  }

  return {
    '--judge-accent': accent,
    '--judge-secondary': secondary,
    '--judge-haze': haze,
    '--judge-muted': muted,
  }
})

const haloStyle = computed(() => {
  const widthSafe = Math.max(width.value, 1)
  const heightSafe = Math.max(height.value, 1)
  const offsetX = (x.value / widthSafe - 0.5) * 80
  const offsetY = (y.value / heightSafe - 0.5) * -60
  const scale = isDisturbed.value ? 1.08 : 1

  return {
    transform: `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${scale})`,
    opacity: isSilent.value ? 0.35 : 0.8,
  }
})

const copyDriftStyle = computed(() => {
  const widthSafe = Math.max(width.value, 1)
  const heightSafe = Math.max(height.value, 1)
  const offsetX = (x.value / widthSafe - 0.5) * 20
  const offsetY = (y.value / heightSafe - 0.5) * 16

  return {
    transform: `translate3d(${offsetX}px, ${offsetY}px, 0)`,
  }
})

const triggerStyle = computed(() => {
  const widthSafe = Math.max(width.value, 1)
  const driftX = isDisturbed.value ? (x.value / widthSafe - 0.5) * 16 : 0
  const driftY = isDisturbed.value ? Math.sin(store.mouseMoves / 24) * 8 : 0

  return {
    transform: `translate3d(${driftX}px, ${driftY}px, 0)`,
  }
})

function fragmentStyle(index: number) {
  const widthSafe = Math.max(width.value, 1)
  const heightSafe = Math.max(height.value, 1)
  const baseX = (index * 17.7) % 100
  const baseY = (index * 11.3 + 7) % 100
  const size = 4 + (index % 5) * 4
  const depth = index % 3
  const parallaxX = (x.value / widthSafe - 0.5) * (depth === 0 ? 26 : 12)
  const parallaxY = (y.value / heightSafe - 0.5) * (depth === 0 ? -20 : -10)
  const phaseDrift = isDisturbed.value ? Math.sin((store.mouseMoves + index * 14) / 45) * 10 : 0
  const opacityBase = isSilent.value ? 0.14 : 0.24 + depth * 0.08
  const brightness = store.phase >= 5 ? 1.18 : 1

  return {
    left: `calc(${baseX}% + ${parallaxX}px)`,
    top: `calc(${baseY}% + ${parallaxY + phaseDrift}px)`,
    width: `${size}px`,
    height: `${size}px`,
    opacity: opacityBase,
    transform: `scale(${brightness}) rotate(${index % 2 === 0 ? 0 : 45}deg)`,
    animationDelay: `${index * 0.18}s`,
    background:
      index % 4 === 0
        ? 'var(--judge-accent)'
        : index % 3 === 0
          ? 'var(--judge-secondary)'
          : 'color-mix(in srgb, var(--color-text-primary) 45%, transparent)',
  }
}

function observerStyle(index: number) {
  const widthSafe = Math.max(width.value, 1)
  const heightSafe = Math.max(height.value, 1)
  const shiftX = (x.value / widthSafe - 0.5) * (10 + index * 2)
  const shiftY = (y.value / heightSafe - 0.5) * (6 + index)

  return {
    transform: `translate3d(${shiftX}px, ${shiftY}px, 0)`,
    transitionDelay: `${index * 60}ms`,
  }
}

watch(scrollY, (value) => {
  if (isDisturbed.value && value > 0) {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }
})

function shuffleButton(event: Event) {
  if (isDisturbed.value && store.phase !== 6) {
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

onMounted(() => {
  document.documentElement.classList.add('hide-scrollbar-global')
})

onUnmounted(() => {
  document.documentElement.classList.remove('hide-scrollbar-global')
})
</script>

<template>
  <div
    class="judge-void relative flex flex-col justify-between overflow-hidden bg-bg-deep text-text-primary transition-all duration-[2000ms]"
    :style="sceneTone"
    :class="{
      'judge-disturb': isDisturbed && !isSilent,
      'bg-black text-white': isRevealed,
      'cursor-none': isDisturbed,
      'min-h-[300dvh]': isDisturbed,
      'min-h-[100dvh]': !isDisturbed,
    }"
  >
    <div class="fixed inset-0 pointer-events-none z-[1] judge-atmosphere"></div>
    <div class="fixed inset-0 pointer-events-none z-[2] judge-grid"></div>
    <div class="fixed inset-0 pointer-events-none z-[3] judge-noise"></div>
    <div class="fixed inset-0 pointer-events-none z-[4] judge-scanlines"></div>
    <div class="fixed inset-0 pointer-events-none z-[5] judge-halo" :style="haloStyle"></div>

    <div class="fixed inset-0 pointer-events-none z-[6]">
      <span v-for="n in 30" :key="n" class="judge-pixel-fragment" :style="fragmentStyle(n)"></span>
    </div>

    <div
      v-if="isDisturbed && !isSilent && !isRevealed"
      class="fixed inset-0 pointer-events-none z-[7] judge-glitch-pixels"
    ></div>

    <div
      class="fixed inset-0 pointer-events-none z-[30] transition-opacity duration-1000"
      :style="lightingStyle"
    ></div>

    <div
      class="sticky top-0 z-[20] flex h-[100dvh] flex-col justify-between transition-all duration-1000"
      :class="{
        'opacity-50 blur-[2px] grayscale': isSilent,
        'judge-collapse-shell': isCollapse,
        'judge-chaos': store.isRapidClicking || store.isMobileTapSpam,
        'judge-corrupt': store.phase >= 7 && !isRevealed,
      }"
    >
      <header class="pointer-events-none absolute inset-x-0 top-0 z-[40] px-5 py-5 md:px-8 md:py-7">
        <div class="mx-auto flex max-w-6xl items-start justify-between gap-4">
          <RouterLink
            to="/"
            class="judge-back-link pointer-events-auto"
            :class="{ 'opacity-0 pointer-events-none': isRevealed || isCollapse }"
          >
            <span class="text-accent-coral">//</span>
            <span>← Back</span>
          </RouterLink>

          <div
            class="judge-top-note"
            :class="{ 'opacity-0': isRevealed, 'judge-top-note-alert': isDisturbed && !isSilent }"
          >
            <span class="judge-led"></span>
            <span>PHASE {{ store.phase }}/9</span>
            <span class="text-text-dim">·</span>
            <span>{{ statusText }}</span>
          </div>
        </div>
      </header>

      <main
        class="relative flex h-full w-full items-center justify-center px-5 pb-24 pt-28 md:px-8"
      >
        <div
          class="judge-stage mx-auto flex w-full max-w-6xl flex-col justify-center"
          :style="tiltStyle"
        >
          <div class="grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
            <section
              class="relative max-w-3xl transition-all duration-700"
              :class="{ 'opacity-0': isRevealed }"
              :style="copyDriftStyle"
            >
              <p class="judge-kicker">
                <span class="text-accent-coral">//</span>
                <span>THE PAGE THAT JUDGES YOU</span>
              </p>

              <h1
                class="mt-4 max-w-2xl font-display text-5xl font-semibold uppercase tracking-[0.08em] text-text-primary transition-all duration-[3s] md:text-7xl"
                :class="{
                  'opacity-35 blur-sm': isCollapse,
                  'tracking-[0.28em]': isCollapse,
                }"
              >
                A living field of pixels reading every pause, twitch, and impulse.
              </h1>

              <p
                class="mt-6 max-w-xl text-sm leading-7 text-text-secondary transition-all duration-1000 md:text-base"
              >
                The system stays quiet at first. Then it starts leaning toward your cursor, storing
                your habits, and staining the room with whatever mood your behavior suggests.
              </p>

              <div
                class="mt-10 flex flex-col items-start gap-5"
                :class="{ 'opacity-70': isSilent }"
              >
                <button
                  @click="handleEscape"
                  @mouseenter="shuffleButton"
                  class="judge-trigger pointer-events-auto focus:outline-none"
                  :style="triggerStyle"
                  :class="{
                    'pointer-events-none opacity-30': isRevealed,
                    'tracking-[0.6em] opacity-20': isCollapse,
                  }"
                >
                  <span class="judge-trigger-pixels"></span>
                  <span>{{ store.phase >= 4 ? 'TRY TO CLICK ME' : 'INTERACT WITH ME' }}</span>
                </button>

                <div class="judge-status-line">
                  <span class="text-accent-sky">STATUS</span>
                  <span class="text-text-dim">/</span>
                  <span :class="isDisturbed ? 'text-accent-coral' : 'text-text-primary'">
                    {{ statusText }}
                  </span>
                  <span v-if="store.phase >= 3 && !isRevealed" class="judge-status-whisper">
                    hold input to escape
                  </span>
                </div>
              </div>
            </section>

            <aside
              class="relative flex flex-col items-start gap-3 self-center lg:items-end"
              :class="{ 'opacity-0': isRevealed }"
            >
              <div class="judge-trace-label">
                <span class="text-accent-amber">//</span>
                <span>OBSERVER TRACE</span>
              </div>

              <div class="judge-trace-cloud">
                <div
                  v-for="(line, index) in observerLogs"
                  :key="line"
                  class="judge-trace-line"
                  :style="observerStyle(index)"
                >
                  {{ line }}
                </div>
              </div>

              <div v-if="store.phase >= 2 && store.phase < 8" class="judge-predict-note">
                <span v-if="store.predictionTarget.show">prediction zone locked</span>
                <span v-else-if="store.idleTime > 4000">hesitation detected</span>
                <span v-else>signal remains unstable</span>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <footer
        class="pointer-events-none absolute inset-x-0 bottom-0 z-[35] px-5 pb-5 text-center md:px-8 md:pb-7"
        :class="{ 'opacity-0': isRevealed || isCollapse }"
      >
        <div class="mx-auto flex max-w-6xl flex-col items-center gap-2">
          <p class="judge-footer-line">CREATED BY <span class="text-accent-sky">ITSAZURA</span></p>
          <p class="max-w-md text-[11px] uppercase tracking-[0.28em] text-text-dim/80">
            A pixel-space that observes, reflects, and quietly destabilizes the viewer.
          </p>
          <p
            v-if="store.visitCount > 1"
            class="text-[10px] uppercase tracking-[0.24em] text-text-dim/70"
          >
            return visits {{ store.visitCount }} / last session
            {{ (store.lastDuration / 1000).toFixed(1) }}s
          </p>
        </div>
      </footer>
    </div>

    <MessageSystem />

    <div
      v-if="isCollapse && !isRevealed"
      class="fixed inset-0 pointer-events-none z-[65] judge-collapse"
    ></div>

    <div
      v-if="isDisturbed && !isRevealed"
      class="judge-cursor fixed z-[60] h-4 w-4 pointer-events-none"
      :style="{ left: `${x - 8}px`, top: `${y - 8}px` }"
    ></div>

    <div
      v-if="store.phase >= 3 && !isRevealed"
      class="judge-cursor-eye fixed z-[10] h-28 w-28 pointer-events-none transition-all duration-700"
      :class="{ 'opacity-55': !isCollapse, 'opacity-90': isCollapse }"
      :style="{ left: `${x - 56}px`, top: `${y - 56}px` }"
    ></div>
  </div>
</template>

<style scoped>
.judge-void {
  background:
    radial-gradient(circle at 20% 18%, rgb(255 184 48 / 0.08), transparent 0 24%),
    radial-gradient(circle at 78% 26%, var(--judge-haze), transparent 0 28%),
    radial-gradient(circle at 52% 78%, rgb(255 107 74 / 0.07), transparent 0 32%),
    linear-gradient(180deg, #0f1923 0%, #0b131b 52%, #070b11 100%);
  transition:
    background 1200ms ease,
    color 1200ms ease,
    filter 1000ms ease;
}

.judge-atmosphere {
  background:
    radial-gradient(circle at center, rgb(255 255 255 / 0.02), transparent 0 28%),
    radial-gradient(circle at center, var(--judge-haze), transparent 0 48%);
  filter: blur(26px);
  opacity: 0.95;
}

.judge-grid {
  background-image:
    linear-gradient(rgb(255 255 255 / 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgb(255 255 255 / 0.03) 1px, transparent 1px);
  background-size: 38px 38px;
  mask-image: radial-gradient(circle at center, black 22%, transparent 78%);
  opacity: 0.18;
}

.judge-noise {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.72' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.34'/%3E%3C/svg%3E");
  mix-blend-mode: screen;
  opacity: 0.08;
}

.judge-scanlines {
  background: repeating-linear-gradient(
    to bottom,
    rgb(0 0 0 / 0) 0px,
    rgb(0 0 0 / 0) 5px,
    rgb(255 255 255 / 0.03) 6px
  );
  opacity: 0.2;
}

.judge-halo {
  background:
    radial-gradient(circle at 50% 50%, var(--judge-haze), transparent 0 24%),
    radial-gradient(circle at 50% 50%, rgb(255 255 255 / 0.05), transparent 0 50%);
  filter: blur(58px);
}

.judge-pixel-fragment {
  position: absolute;
  image-rendering: pixelated;
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.06),
    0 0 18px color-mix(in srgb, var(--judge-accent) 32%, transparent);
  animation: fragment-breathe 8s ease-in-out infinite;
}

.judge-glitch-pixels {
  background-image:
    repeating-linear-gradient(
      0deg,
      rgb(0 0 0 / 0) 0px,
      rgb(0 0 0 / 0) 18px,
      color-mix(in srgb, var(--judge-accent) 8%, transparent) 19px
    ),
    repeating-linear-gradient(
      90deg,
      rgb(0 0 0 / 0) 0px,
      rgb(0 0 0 / 0) 18px,
      color-mix(in srgb, var(--judge-secondary) 9%, transparent) 19px
    );
  mix-blend-mode: screen;
  opacity: 0.32;
  animation: judge-glitch 0.6s steps(2, end) infinite;
}

.judge-stage {
  transform-style: preserve-3d;
}

.judge-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  font-family: 'Anybody', sans-serif;
  font-size: 0.72rem;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.judge-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.95rem 1.3rem;
  border: 1px solid color-mix(in srgb, var(--judge-accent) 28%, transparent);
  background: linear-gradient(
    135deg,
    rgb(255 255 255 / 0.08),
    color-mix(in srgb, var(--color-bg-surface) 68%, transparent)
  );
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.03),
    0 20px 60px rgb(0 0 0 / 0.25);
  backdrop-filter: blur(12px);
  color: var(--color-text-primary);
  font-family: 'Anybody', sans-serif;
  font-size: 0.72rem;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  transition:
    border-color 220ms ease,
    background 220ms ease,
    box-shadow 220ms ease,
    transform 220ms ease;
}

.judge-trigger:hover {
  border-color: color-mix(in srgb, var(--judge-accent) 62%, transparent);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--judge-haze) 65%, transparent),
    color-mix(in srgb, var(--color-bg-elevated) 80%, transparent)
  );
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.04),
    0 22px 80px rgb(0 0 0 / 0.3);
}

.judge-trigger-pixels {
  width: 16px;
  height: 16px;
  background:
    linear-gradient(90deg, var(--judge-accent) 0 50%, transparent 50% 100%),
    linear-gradient(
      0deg,
      color-mix(in srgb, var(--judge-secondary) 70%, transparent) 0 50%,
      transparent 50% 100%
    );
  background-size: 8px 8px;
  image-rendering: pixelated;
  box-shadow: 0 0 20px color-mix(in srgb, var(--judge-accent) 35%, transparent);
  animation: fragment-breathe 2.8s ease-in-out infinite;
}

.judge-status-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.7rem;
  font-family: 'Anybody', sans-serif;
  font-size: 0.72rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.judge-status-whisper {
  color: color-mix(in srgb, var(--judge-accent) 72%, transparent);
  opacity: 0.75;
}

.judge-trace-label,
.judge-top-note,
.judge-footer-line {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  font-family: 'Anybody', sans-serif;
  font-size: 0.68rem;
  letter-spacing: 0.32em;
  text-transform: uppercase;
}

.judge-top-note {
  padding: 0.6rem 0.85rem;
  border: 1px solid rgb(255 255 255 / 0.08);
  background: rgb(15 25 35 / 0.45);
  backdrop-filter: blur(10px);
  color: var(--color-text-secondary);
  transition:
    border-color 400ms ease,
    color 400ms ease,
    opacity 600ms ease;
}

.judge-top-note-alert {
  border-color: color-mix(in srgb, var(--judge-accent) 36%, transparent);
  color: var(--color-text-primary);
}

.judge-led {
  width: 8px;
  height: 8px;
  background: var(--judge-accent);
  box-shadow: 0 0 16px color-mix(in srgb, var(--judge-accent) 45%, transparent);
  animation: led-blink 1.4s ease-in-out infinite;
}

.judge-trace-cloud {
  display: flex;
  width: min(100%, 18rem);
  flex-direction: column;
  align-items: flex-start;
  gap: 0.85rem;
}

.judge-trace-line {
  max-width: 18rem;
  padding: 0.35rem 0.55rem;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--judge-haze) 72%, transparent),
    transparent
  );
  border-left: 1px solid color-mix(in srgb, var(--judge-accent) 30%, transparent);
  color: var(--color-text-secondary);
  font-family: 'Anybody', sans-serif;
  font-size: 0.67rem;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  transition:
    transform 500ms ease,
    opacity 500ms ease;
}

.judge-predict-note {
  margin-top: 0.75rem;
  color: color-mix(in srgb, var(--judge-secondary) 88%, transparent);
  font-family: 'Anybody', sans-serif;
  font-size: 0.63rem;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  opacity: 0.72;
}

.judge-back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.55rem 0.8rem;
  border: 1px solid rgb(255 255 255 / 0.08);
  background: rgb(15 25 35 / 0.42);
  backdrop-filter: blur(10px);
  font-family: 'Anybody', sans-serif;
  font-size: 0.72rem;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  transition:
    border-color 220ms ease,
    color 220ms ease,
    background 220ms ease,
    transform 220ms ease,
    opacity 500ms ease;
}

.judge-back-link:hover {
  border-color: color-mix(in srgb, var(--judge-accent) 45%, transparent);
  background: rgb(22 34 50 / 0.62);
  color: var(--color-text-primary);
  transform: translateY(-1px);
}

.judge-cursor {
  background: var(--judge-accent);
  border: 1px solid rgb(255 255 255 / 0.22);
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--judge-accent) 8%, transparent),
    0 0 28px color-mix(in srgb, var(--judge-accent) 36%, transparent);
  mix-blend-mode: screen;
  animation: cursor-blink 0.9s steps(2, end) infinite;
}

.judge-cursor-eye {
  border: 1px solid color-mix(in srgb, var(--judge-accent) 22%, transparent);
  background:
    radial-gradient(
      circle at center,
      color-mix(in srgb, var(--judge-accent) 10%, transparent),
      transparent 62%
    ),
    repeating-linear-gradient(
      90deg,
      color-mix(in srgb, var(--judge-accent) 8%, transparent) 0px,
      color-mix(in srgb, var(--judge-accent) 8%, transparent) 9px,
      transparent 10px,
      transparent 18px
    );
  filter: blur(0.2px);
}

.judge-chaos {
  animation: shell-chaos 0.22s steps(2, end) infinite;
}

.judge-corrupt {
  filter: contrast(1.08) saturate(1.08);
}

.judge-disturb {
  animation: judge-disturb 1s steps(2, end) infinite;
}

.judge-collapse-shell {
  animation: collapse-shell 5s steps(10, end) forwards;
}

.judge-collapse {
  background:
    linear-gradient(180deg, rgb(7 11 17 / 0.1) 0%, rgb(7 11 17 / 0.88) 100%),
    repeating-linear-gradient(
      90deg,
      rgb(255 255 255 / 0.02) 0px,
      rgb(255 255 255 / 0.02) 12px,
      rgb(0 0 0 / 0) 13px,
      rgb(0 0 0 / 0) 24px
    );
  animation: collapse-wipe 2.2s steps(18, end) forwards;
}

@keyframes fragment-breathe {
  0%,
  100% {
    opacity: 0.18;
    filter: blur(0.6px);
  }
  50% {
    opacity: 0.42;
    filter: blur(0);
  }
}

@keyframes led-blink {
  0%,
  100% {
    opacity: 0.55;
  }
  50% {
    opacity: 1;
  }
}

@keyframes judge-glitch {
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

@keyframes cursor-blink {
  0%,
  49% {
    opacity: 0.92;
  }
  50%,
  100% {
    opacity: 0.24;
  }
}

@keyframes judge-disturb {
  0% {
    filter: contrast(1.02);
    transform: translate(0);
  }
  25% {
    filter: contrast(1.12) saturate(1.04);
    transform: translate(-1px, 1px);
  }
  50% {
    transform: translate(1px, -1px);
  }
  75% {
    filter: hue-rotate(2deg);
    transform: translate(-1px, -2px);
  }
  100% {
    filter: contrast(1.02);
    transform: translate(0);
  }
}

@keyframes shell-chaos {
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

@keyframes collapse-shell {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  45% {
    transform: scale(1.03) translate(1px, -1px);
    opacity: 0.82;
  }
  70% {
    transform: scale(0.98) translate(-2px, 2px);
    opacity: 0.54;
  }
  100% {
    transform: scale(0.92) translate(2px, 14px);
    opacity: 0.2;
  }
}

@keyframes collapse-wipe {
  0% {
    opacity: 0;
    clip-path: inset(100% 0 0 0);
  }
  20% {
    opacity: 0.15;
    clip-path: inset(88% 0 0 0);
  }
  60% {
    opacity: 0.55;
    clip-path: inset(32% 0 0 0);
  }
  100% {
    opacity: 1;
    clip-path: inset(0 0 0 0);
  }
}

@media (max-width: 1023px) {
  .judge-trace-cloud {
    width: 100%;
  }

  .judge-trace-line {
    max-width: none;
  }
}

@media (max-width: 767px) {
  .judge-grid {
    background-size: 24px 24px;
  }

  .judge-top-note {
    font-size: 0.58rem;
    letter-spacing: 0.24em;
  }

  .judge-kicker,
  .judge-status-line,
  .judge-back-link {
    letter-spacing: 0.24em;
  }

  .judge-trace-cloud {
    gap: 0.55rem;
  }

  .judge-trace-line {
    font-size: 0.6rem;
    letter-spacing: 0.2em;
  }
}
</style>

<style>
.hide-scrollbar-global::-webkit-scrollbar {
  display: none !important;
}

.hide-scrollbar-global {
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
}
</style>
