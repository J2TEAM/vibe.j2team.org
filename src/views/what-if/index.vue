<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { questions, type Question } from './questions'
import { i18n, type Lang } from './i18n'

// ─── State ────────────────────────────────────────────────────────────────────
type Phase = 'idle' | 'shuffling' | 'settling' | 'flip' | 'revealed'

const lang = ref<Lang>('vi')
const phase = ref<Phase>('idle')
const currentQuestion = ref<Question>(questions[0]!)
const isFlipped = ref(false)
const showOverlay = ref(false)
const isZooming = ref(false)

const t = computed(() => i18n[lang.value])

// Belt
const BELT_CARDS = 80
const beltTranslateX = ref(0)
const beltTransition = ref('none')

const stageRef = ref<HTMLElement | null>(null)
const cardGap = 14
const mobileCardW = 130
const desktopCardW = 160

function getCardW() {
  return window.innerWidth >= 640 ? desktopCardW : mobileCardW
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

function toggleLang() {
  lang.value = lang.value === 'vi' ? 'en' : 'vi'
}

// ─── Animation Flow ───────────────────────────────────────────────────────────
async function startShuffle() {
  if (phase.value === 'shuffling' || phase.value === 'flip' || phase.value === 'settling') return

  isFlipped.value = false
  showOverlay.value = false
  isZooming.value = false
  phase.value = 'shuffling'

  const cw = getCardW()
  const cardStep = cw + cardGap
  const stageWidth = stageRef.value?.clientWidth ?? window.innerWidth

  const totalDistance = cardStep * (45 + Math.floor(Math.random() * 15))
  const centerOffset = stageWidth / 2 - cw / 2
  const startX = centerOffset
  const endX = centerOffset - totalDistance

  // Snap start
  beltTransition.value = 'none'
  beltTranslateX.value = startX
  await nextTick()
  stageRef.value?.getBoundingClientRect()

  // Decelerate scroll
  beltTransition.value = 'transform 3.5s cubic-bezier(0.15, 0.8, 0.2, 1)'
  beltTranslateX.value = endX

  await delay(3600)

  // Belt stays as background, overlay fades in, card zooms & flips
  currentQuestion.value = questions[Math.floor(Math.random() * questions.length)]!
  phase.value = 'settling'
  showOverlay.value = true
  await delay(400) // let overlay fade in

  phase.value = 'flip'
  await nextTick()
  await delay(50) // Important: Give browser time to render initial small state

  // Trigger zoom animation (belt card size → full size)
  isZooming.value = true
  await delay(1250) // Wait for zoom to complete (1.2s transition + buffer)

  // Now flip the card
  isFlipped.value = true
  await delay(750) // Wait for flip to complete

  phase.value = 'revealed'
}

// Category
const categoryLabel = computed(() =>
  currentQuestion.value ? (t.value.categories[currentQuestion.value.category] ?? '') : '',
)

const categoryColor: Record<string, string> = {
  career: 'accent-purple',
  wealth: 'accent-amber',
  health: 'accent-green',
  relationships: 'accent-pink',
  growth: 'accent-lime',
  lifestyle: 'accent-orange',
  impact: 'accent-teal',
  technology: 'accent-cyan',
  alternative: 'accent-coral',
  reflection: 'accent-sky',
}

const categoryBorder = computed(
  () => categoryColor[currentQuestion.value.category] ?? 'accent-coral',
)

const categoryQuestionColor: Record<string, string> = {
  career: 'text-accent-purple/12',
  wealth: 'text-accent-amber/12',
  health: 'text-accent-green/12',
  relationships: 'text-accent-pink/12',
  growth: 'text-accent-lime/12',
  lifestyle: 'text-accent-orange/12',
  impact: 'text-accent-teal/12',
  technology: 'text-accent-cyan/12',
  alternative: 'text-accent-coral/12',
  reflection: 'text-accent-sky/12',
}

const categoryAccent: Record<string, string> = {
  career: 'text-accent-purple border-accent-purple/30',
  wealth: 'text-accent-amber border-accent-amber/30',
  health: 'text-accent-green border-accent-green/30',
  relationships: 'text-accent-pink border-accent-pink/30',
  growth: 'text-accent-lime border-accent-lime/30',
  lifestyle: 'text-accent-orange border-accent-orange/30',
  impact: 'text-accent-teal border-accent-teal/30',
  technology: 'text-accent-cyan border-accent-cyan/30',
  alternative: 'text-accent-coral border-accent-coral/30',
  reflection: 'text-accent-sky border-accent-sky/30',
}

// RGB values for category colors (for dynamic shadows)
const categoryRGB: Record<string, string> = {
  career: '168, 85, 247', // purple
  wealth: '255, 184, 48', // amber
  health: '34, 197, 94', // green
  relationships: '236, 72, 153', // pink
  growth: '132, 204, 22', // lime
  lifestyle: '249, 115, 22', // orange
  impact: '20, 184, 166', // teal
  technology: '6, 182, 212', // cyan
  alternative: '255, 107, 74', // coral
  reflection: '56, 189, 248', // sky
}

// Dynamic shadows matching category color
const categoryShadowBack = computed(() => {
  const rgb = categoryRGB[currentQuestion.value.category] ?? '255, 107, 74'
  return {
    boxShadow: `
      0 0 0 1px rgba(${rgb}, 0.1),
      0 8px 24px rgba(0, 0, 0, 0.5),
      0 0 40px rgba(${rgb}, 0.15)
    `,
  }
})

const categoryShadowFront = computed(() => {
  const rgb = categoryRGB[currentQuestion.value.category] ?? '255, 107, 74'
  return {
    boxShadow: `
      0 0 0 1px rgba(${rgb}, 0.2),
      0 12px 32px rgba(0, 0, 0, 0.6),
      0 0 60px rgba(${rgb}, 0.3),
      inset 0 1px 0 rgba(${rgb}, 0.1)
    `,
  }
})

// Idle deck: diagonal stack showing bottom and right edges
function deckOffset(i: number) {
  const shiftY = (6 - i) * 3 // Vertical offset
  const shiftX = (6 - i) * 3 // Horizontal offset for diagonal effect
  return {
    transform: `translate(${shiftX}px, ${shiftY}px)`,
    zIndex: i,
  }
}

// Belt card visual variety - cycle through neon colors
function beltCardClass(i: number) {
  const colors = [
    'border-2 border-accent-coral bg-bg-elevated',
    'border-2 border-accent-amber bg-bg-elevated',
    'border-2 border-accent-sky bg-bg-elevated',
    'border-2 border-accent-purple bg-bg-surface',
    'border-2 border-accent-green bg-bg-surface',
    'border-2 border-accent-teal bg-bg-surface',
    'border-2 border-accent-pink bg-bg-elevated',
    'border-2 border-accent-cyan bg-bg-surface',
    'border-2 border-accent-lime bg-bg-surface',
    'border-2 border-accent-orange bg-bg-elevated',
  ]
  return colors[i % colors.length]!
}

function beltIconClass(i: number) {
  const colors = [
    'text-accent-coral/12',
    'text-accent-amber/12',
    'text-accent-sky/12',
    'text-accent-purple/12',
    'text-accent-green/12',
    'text-accent-teal/12',
    'text-accent-pink/12',
    'text-accent-cyan/12',
    'text-accent-lime/12',
    'text-accent-orange/12',
  ]
  return colors[i % colors.length]!
}

onMounted(() => {
  currentQuestion.value = questions[Math.floor(Math.random() * questions.length)]!
})
</script>

<template>
  <div class="min-h-dvh bg-bg-deep text-text-primary font-body flex flex-col overflow-hidden">
    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <header class="border-b border-border-default animate-fade-up shrink-0">
      <div
        class="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-3"
      >
        <div>
          <p class="font-display text-[10px] sm:text-xs tracking-widest text-accent-coral mb-0.5">
            // WHAT IF?
          </p>
          <h1
            class="font-display text-xl sm:text-2xl md:text-3xl font-bold text-text-primary leading-none"
          >
            What <span class="text-accent-coral">if</span>?
          </h1>
        </div>
        <div class="flex items-center gap-2 sm:gap-4">
          <!-- Sliding VI / EN toggle -->
          <div
            class="lang-toggle"
            role="radiogroup"
            :aria-label="lang === 'vi' ? 'Chọn ngôn ngữ' : 'Select language'"
            @click="toggleLang"
          >
            <span class="lang-toggle-slider" :class="{ 'slider-en': lang === 'en' }" />
            <span class="lang-toggle-option" :class="{ active: lang === 'vi' }">VI</span>
            <span class="lang-toggle-option" :class="{ active: lang === 'en' }">EN</span>
          </div>
          <div
            class="hidden sm:block bg-accent-coral text-bg-deep font-display font-bold text-[10px] sm:text-xs tracking-widest px-2.5 py-1 sm:px-3 sm:py-1.5 rotate-2"
          >
            VOL.01 / 2026
          </div>
        </div>
      </div>
    </header>

    <!-- ── Main ───────────────────────────────────────────────────────────── -->
    <main
      class="flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-10 gap-5 sm:gap-8"
    >
      <!-- Status text -->
      <p
        class="font-display text-xs sm:text-sm tracking-wide text-text-secondary text-center animate-fade-up animate-delay-1 min-h-[1.5em] max-w-3xl leading-relaxed"
      >
        {{ phase === 'shuffling' ? t.shuffling : t.heroSubtitle }}
      </p>

      <!-- ── Stage ────────────────────────────────────────────────────────── -->
      <div ref="stageRef" class="stage">
        <!-- ① IDLE: vertical stacked deck -->
        <div v-if="phase === 'idle'" class="idle-deck cursor-pointer" @click="startShuffle">
          <div
            v-for="i in 7"
            :key="'deck-' + i"
            class="idle-card absolute"
            :style="deckOffset(i - 1)"
          >
            <div class="card-back-design border-2 border-accent-coral">
              <span class="card-back-question text-accent-coral/12">?</span>
              <span class="card-back-label">What if</span>
            </div>
          </div>
        </div>

        <!-- ② SHUFFLING belt (stays on screen during settling/flip/revealed as BG) -->
        <div
          v-if="
            phase === 'shuffling' ||
            phase === 'settling' ||
            phase === 'flip' ||
            phase === 'revealed'
          "
          class="belt-clip"
        >
          <div
            class="belt"
            :style="{ transform: `translateX(${beltTranslateX}px)`, transition: beltTransition }"
          >
            <div v-for="i in BELT_CARDS" :key="'belt-' + i" class="belt-card shrink-0">
              <div class="card-back-design" :class="beltCardClass(i)">
                <span class="card-back-question" :class="beltIconClass(i)">?</span>
                <span class="card-back-label">What if</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Dark overlay over belt background -->
        <Transition name="overlay-fade">
          <div v-if="showOverlay" class="belt-overlay" />
        </Transition>

        <!-- ③④ FLIP card on top of overlay -->
        <div
          v-if="phase === 'flip' || phase === 'revealed'"
          class="flip-wrapper"
          :class="{ 'flip-entered': isZooming, zoomed: phase === 'revealed' }"
        >
          <div class="flip-inner" :class="{ flipped: isFlipped }">
            <!-- Back -->
            <div
              class="flip-face flip-back card-back-design border-2"
              :class="`border-${categoryBorder}`"
              :style="categoryShadowBack"
            >
              <span
                class="card-back-question"
                :class="categoryQuestionColor[currentQuestion.category]"
                >?</span
              >
              <span class="card-back-label">What if</span>
            </div>
            <!-- Front -->
            <div
              class="flip-face flip-front border-2 bg-bg-elevated flex flex-col items-start p-5 sm:p-8"
              :class="`border-${categoryBorder}`"
              :style="categoryShadowFront"
            >
              <span
                class="font-display text-[10px] sm:text-xs tracking-widest px-2 py-0.5 border mb-4 shrink-0"
                :class="categoryAccent[currentQuestion.category]"
              >
                {{ categoryLabel }}
              </span>
              <p
                class="font-display text-base sm:text-lg md:text-xl font-semibold text-text-primary leading-snug flex-1 flex items-center"
              >
                {{ lang === 'en' ? currentQuestion.en : currentQuestion.vi }}
              </p>
              <span
                class="font-display text-4xl sm:text-5xl font-bold text-accent-amber/10 self-end select-none mt-3 shrink-0"
              >
                {{ String(currentQuestion.id).padStart(2, '0') }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Actions ──────────────────────────────────────────────────────── -->
      <div class="flex flex-col items-center gap-3 animate-fade-up animate-delay-2 min-h-12">
        <p
          v-if="phase === 'idle'"
          class="font-display text-[10px] sm:text-xs tracking-widest text-text-dim text-center animate-pulse"
        >
          {{ t.clickHint }}
        </p>
        <button
          v-if="phase === 'revealed'"
          class="font-display text-xs sm:text-sm tracking-wide border border-border-default bg-bg-surface px-5 sm:px-6 py-2.5 sm:py-3 text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          @click="startShuffle"
        >
          {{ t.drawAnother }}
        </button>
      </div>
    </main>

    <!-- ── Footer ─────────────────────────────────────────────────────────── -->
    <footer class="border-t border-border-default shrink-0">
      <div class="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between flex-wrap gap-4">
        <p class="text-text-dim text-xs font-display tracking-wide">
          Được tạo bởi <span class="text-accent-coral">Nhật ký học tập của Khang - KBOT</span> —
          vibe.j2team.org
        </p>
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          &larr; {{ t.backToHome }}
        </RouterLink>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ── Neon color palette (self-contained) ──────────────────── */
:root {
  --neon-purple: #e879f9;
  --neon-green: #10b981;
  --neon-teal: #14b8a6;
  --neon-pink: #ec4899;
  --neon-cyan: #06b6d4;
  --neon-lime: #84cc16;
  --neon-orange: #f97316;
}

/* Utility classes for neon colors */
.border-accent-purple {
  border-color: #e879f9;
}
.border-accent-green {
  border-color: #10b981;
}
.border-accent-teal {
  border-color: #14b8a6;
}
.border-accent-pink {
  border-color: #ec4899;
}
.border-accent-cyan {
  border-color: #06b6d4;
}
.border-accent-lime {
  border-color: #84cc16;
}
.border-accent-orange {
  border-color: #f97316;
}

.text-accent-purple {
  color: #e879f9;
}
.text-accent-green {
  color: #10b981;
}
.text-accent-teal {
  color: #14b8a6;
}
.text-accent-pink {
  color: #ec4899;
}
.text-accent-cyan {
  color: #06b6d4;
}
.text-accent-lime {
  color: #84cc16;
}
.text-accent-orange {
  color: #f97316;
}

.border-accent-purple\/30 {
  border-color: rgba(232, 121, 249, 0.3);
}
.border-accent-green\/30 {
  border-color: rgba(16, 185, 129, 0.3);
}
.border-accent-teal\/30 {
  border-color: rgba(20, 184, 166, 0.3);
}
.border-accent-pink\/30 {
  border-color: rgba(236, 72, 153, 0.3);
}
.border-accent-cyan\/30 {
  border-color: rgba(6, 182, 212, 0.3);
}
.border-accent-lime\/30 {
  border-color: rgba(132, 204, 22, 0.3);
}
.border-accent-orange\/30 {
  border-color: rgba(249, 115, 22, 0.3);
}

.text-accent-purple\/70 {
  color: rgba(232, 121, 249, 0.7);
}
.text-accent-green\/70 {
  color: rgba(16, 185, 129, 0.7);
}
.text-accent-teal\/70 {
  color: rgba(20, 184, 166, 0.7);
}
.text-accent-pink\/70 {
  color: rgba(236, 72, 153, 0.7);
}
.text-accent-cyan\/70 {
  color: rgba(6, 182, 212, 0.7);
}
.text-accent-lime\/70 {
  color: rgba(132, 204, 22, 0.7);
}
.text-accent-orange\/70 {
  color: rgba(249, 115, 22, 0.7);
}

.text-accent-purple\/12 {
  color: rgba(232, 121, 249, 0.12);
}
.text-accent-green\/12 {
  color: rgba(16, 185, 129, 0.12);
}
.text-accent-teal\/12 {
  color: rgba(20, 184, 166, 0.12);
}
.text-accent-pink\/12 {
  color: rgba(236, 72, 153, 0.12);
}
.text-accent-cyan\/12 {
  color: rgba(6, 182, 212, 0.12);
}
.text-accent-lime\/12 {
  color: rgba(132, 204, 22, 0.12);
}
.text-accent-orange\/12 {
  color: rgba(249, 115, 22, 0.12);
}
.text-accent-coral\/12 {
  color: rgba(255, 107, 74, 0.12);
}
.text-accent-amber\/12 {
  color: rgba(255, 184, 48, 0.12);
}
.text-accent-sky\/12 {
  color: rgba(56, 189, 248, 0.12);
}

/* ── Stage ──────────────────────────────────────────────── */
.stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 340px;
  perspective: 1200px;
}

@media (min-width: 640px) {
  .stage {
    height: 420px;
  }
}

/* ── Card back design: big "?" background + "What if" overlaid ── */
.card-back-design {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: var(--color-bg-surface);
  user-select: none;
}

.card-back-question {
  font-family: var(--font-display);
  font-weight: 800;
  line-height: 1;
  opacity: 1; /* Opacity controlled by class now */
  font-size: 9rem; /* Default for belt cards (smallest) */
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 0;
}

@media (min-width: 640px) {
  .card-back-question {
    font-size: 12rem;
  }
}

/* Larger size for idle deck */
.idle-card .card-back-question {
  font-size: 11rem;
}

@media (min-width: 640px) {
  .idle-card .card-back-question {
    font-size: 15rem;
  }
}

/* Even larger for flip cards (card is bigger) */
.flip-back .card-back-question {
  font-size: 14rem;
}

@media (min-width: 640px) {
  .flip-back .card-back-question {
    font-size: 20rem;
  }
}

.card-back-label {
  position: relative;
  z-index: 2;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 0.15em;
  color: var(--color-text-primary);
  text-transform: uppercase;
}

@media (min-width: 640px) {
  .card-back-label {
    font-size: 1.35rem;
  }
}

/* ── ① IDLE deck (vertical, no rotation) ────────────────── */
.idle-deck {
  position: relative;
  width: 180px;
  height: 260px;
  animation: floatDeck 3s ease-in-out infinite;
}

@media (min-width: 640px) {
  .idle-deck {
    width: 220px;
    height: 310px;
  }
}

@keyframes floatDeck {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.idle-card {
  inset: 0;
  transition: transform 0.3s ease;
}

.idle-deck .card-back-design {
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(255, 107, 74, 0.3);
}

/* ── ② BELT ─────────────────────────────────────────────── */
.belt-clip {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

/* Edge fades */
.belt-clip::before,
.belt-clip::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50px;
  z-index: 2;
  pointer-events: none;
}

.belt-clip::before {
  left: 0;
  background: linear-gradient(to right, var(--color-bg-deep), transparent);
}

.belt-clip::after {
  right: 0;
  background: linear-gradient(to left, var(--color-bg-deep), transparent);
}

@media (min-width: 640px) {
  .belt-clip::before,
  .belt-clip::after {
    width: 80px;
  }
}

.belt {
  display: flex;
  gap: 14px;
  will-change: transform;
  height: 100%;
  align-items: center;
}

.belt-card {
  width: 130px;
  height: 190px;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    0 0 15px rgba(255, 107, 74, 0.08);
}

@media (min-width: 640px) {
  .belt-card {
    width: 160px;
    height: 230px;
  }
}

/* ── Dark overlay over belt ──────────────────────────────── */
.belt-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 25, 35, 0.75);
  z-index: 5;
}

.overlay-fade-enter-active {
  transition: opacity 0.4s ease;
}

.overlay-fade-leave-active {
  transition: opacity 0.2s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

/* ── ③④ FLIP wrapper (floats above overlay) ──────────────── */
.flip-wrapper {
  position: absolute;
  z-index: 10;
  width: 240px;
  height: 340px;
  /* Initial scale matches belt card size: 130/240 ≈ 0.54 mobile, 160/300 ≈ 0.53 desktop */
  transition: scale 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  scale: 0.54;
  opacity: 1;
}

.flip-wrapper.flip-entered {
  scale: 1;
}

.flip-wrapper.zoomed {
  /* No additional scale change needed */
}

@media (min-width: 640px) {
  .flip-wrapper {
    width: 300px;
    height: 420px;
    scale: 0.53;
  }
}

/* Inner container handles the 3D flip */
.flip-inner {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  -webkit-transform-style: preserve-3d;
  transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

.flip-inner.flipped {
  transform: rotateY(180deg);
}

.flip-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transition: visibility 0s linear 0.35s;
}

/* Hide back face when flipped */
.flip-inner.flipped .flip-back {
  visibility: hidden;
}

/* Hide front face when not flipped */
.flip-inner:not(.flipped) .flip-front {
  visibility: hidden;
}

.flip-front {
  transform: rotateY(180deg);
}

/* ── Language toggle ─────────────────────────────────────── */
.lang-toggle {
  position: relative;
  display: flex;
  cursor: pointer;
  border: 1px solid var(--color-border-default);
  user-select: none;
  overflow: hidden;
}

.lang-toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  width: 50%;
  height: 100%;
  background-color: var(--color-accent-coral);
  transition: left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
}

.lang-toggle-slider.slider-en {
  left: 50%;
}

.lang-toggle-option {
  position: relative;
  z-index: 1;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.1em;
  padding: 4px 10px;
  color: var(--color-text-dim);
  transition: color 0.25s ease;
}

@media (min-width: 640px) {
  .lang-toggle-option {
    font-size: 11px;
    padding: 5px 14px;
  }
}

.lang-toggle-option.active {
  color: var(--color-bg-deep);
}
</style>
