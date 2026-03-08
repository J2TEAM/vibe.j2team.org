<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAudio } from './composables/useAudio'
import { useRhythmEngine } from './composables/useRhythmEngine'
import { GAME_CONFIG } from './assets/beatmap'
import type { HitResult } from './types'

// ─── Audio & Rhythm ──────────────────────────────────────
const audio = useAudio()
const rhythm = useRhythmEngine()

// ─── Game State ──────────────────────────────────────────
type Phase = 'idle' | 'countdown' | 'playing' | 'dead'
const phase = ref<Phase>('idle')
const lives = ref(3)
const countdownNum = ref(3)
const isVictory = ref(false)

// Hit feedback
const hitFeedback = ref<HitResult | null>(null)
const showFeedback = ref(false)

// Stats
const perfectHits = ref(0)
const goodHits = ref(0)
const missCount = ref(0)
const bestScore = ref(0)

const score = computed(() => perfectHits.value * 2 + goodHits.value)
const accuracy = computed(() => {
  const total = perfectHits.value + goodHits.value + missCount.value
  if (total === 0) return 100
  return Math.round(((perfectHits.value * 2 + goodHits.value) / (total * 2)) * 100)
})

const progressPct = computed(() =>
  Math.round((rhythm.currentBeatIndex.value / GAME_CONFIG.totalBeats) * 100),
)

// ─── Animation Frame ─────────────────────────────────────
let rafId = 0

function gameLoop() {
  if (phase.value !== 'playing') return

  // Get current audio time
  const audioEl = audio.getMusicElement()
  if (audioEl) {
    rhythm.update(audioEl.currentTime)
  }

  // Check if complete
  if (rhythm.isComplete.value) {
    endGame(true)
    return
  }

  rafId = requestAnimationFrame(gameLoop)
}

// Auto-miss callback - được gọi từ rhythm engine
function handleAutoMiss() {
  console.log('[Game] Auto-miss detected!')
  missCount.value++
  audio.playFail()
  lives.value--

  if (lives.value <= 0) {
    endGame(false)
    return
  }

  showHitFeedback('miss')
}

// ─── Game Flow ───────────────────────────────────────────
async function startGame() {
  if (phase.value !== 'idle' && phase.value !== 'dead') return
  audio.init()

  // Reset
  lives.value = 3
  perfectHits.value = 0
  goodHits.value = 0
  missCount.value = 0
  hitFeedback.value = null
  showFeedback.value = false
  isVictory.value = false
  rhythm.reset()

  // Countdown
  phase.value = 'countdown'
  for (let i = 3; i >= 1; i--) {
    if (phase.value !== 'countdown') return
    countdownNum.value = i
    audio.playTick()
    await sleep(700)
  }

  // Start
  phase.value = 'playing'
  audio.startMusic()
  rhythm.start()
  rhythm.setAutoMissCallback(handleAutoMiss)

  rafId = requestAnimationFrame(gameLoop)
}

function handleTap() {
  if (phase.value !== 'playing' || !rhythm.currentBeat.value) return

  const audioEl = audio.getMusicElement()
  if (!audioEl) return

  const tapTime = audioEl.currentTime
  const result = rhythm.evaluateTap(tapTime)

  if (result === 'perfect') {
    perfectHits.value++
    audio.playDoubleJump()
    showHitFeedback('perfect')
  } else if (result === 'good') {
    goodHits.value++
    audio.playJump()
    showHitFeedback('good')
  } else {
    missCount.value++
    audio.playFail()
    lives.value--
    if (lives.value <= 0) {
      endGame(false)
      return
    }
    showHitFeedback('miss')
  }

  rhythm.advanceBeat()
}

function showHitFeedback(result: HitResult) {
  hitFeedback.value = result
  showFeedback.value = true
  setTimeout(() => {
    showFeedback.value = false
  }, 400)
}

function endGame(victory: boolean) {
  isVictory.value = victory
  phase.value = 'dead'
  cancelAnimationFrame(rafId)
  rhythm.stop()
  audio.stopMusic()

  const s = score.value
  if (s > bestScore.value) {
    bestScore.value = s
    localStorage.setItem('press-it-best', s.toString())
  }
}

function getRating(): string {
  const acc = accuracy.value
  if (acc >= 95) return 'S rank — RHYTHM GOD 🏆'
  if (acc >= 85) return 'A rank — IMPRESSIVE 🔥'
  if (acc >= 70) return 'B rank — GOOD 👍'
  if (acc >= 50) return 'C rank — OK 😐'
  return 'D rank — PRACTICE MORE 💀'
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// ─── Lifecycle ───────────────────────────────────────────
onMounted(() => {
  const saved = localStorage.getItem('press-it-best')
  if (saved) bestScore.value = parseInt(saved, 10)
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  audio.destroy()
})
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary flex flex-col font-body select-none overflow-hidden"
  >
    <!-- Header -->
    <header class="flex items-center justify-between px-4 py-3 border-b border-border-subtle z-10">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-1.5 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        @pointerdown.stop
      >
        &larr; Về trang chủ
      </RouterLink>
      <h1 class="font-display text-base"><span class="text-accent-coral">//</span> PRESS IT</h1>
      <button
        class="text-text-secondary hover:text-text-primary transition-colors text-lg px-1"
        @pointerdown.stop
        @click="audio.toggleMute()"
      >
        {{ audio.isMuted.value ? '🔇' : '🔊' }}
      </button>
    </header>

    <!-- ── IDLE SCREEN ─────────────────────────────────── -->
    <div
      v-if="phase === 'idle'"
      class="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-8 animate-fade-up"
    >
      <div class="text-center space-y-2">
        <div class="text-7xl mb-3">🎵</div>
        <h2 class="font-display text-4xl sm:text-5xl">
          <span class="text-accent-coral">//</span> PRESS IT
        </h2>
        <p class="text-text-tertiary text-sm">Trust your guts - follow the rhythm!</p>
      </div>

      <div class="w-full max-w-xs space-y-2 text-xs text-text-tertiary">
        <div class="flex items-center gap-3 bg-bg-surface border border-border-subtle p-3">
          <span class="text-accent-coral font-display text-sm w-20 shrink-0">PERFECT</span>
          <span>±350ms — +2 điểm</span>
        </div>
        <div class="flex items-center gap-3 bg-bg-surface border border-border-subtle p-3">
          <span class="text-accent-amber font-display text-sm w-20 shrink-0">GOOD</span>
          <span>±500ms — +1 điểm</span>
        </div>
        <div class="flex items-center gap-3 bg-bg-surface border border-border-subtle p-3">
          <span class="text-red-400 font-display text-sm w-20 shrink-0">MISS</span>
          <span>lệch nhịp — mất 1 mạng ♥</span>
        </div>
      </div>

      <div class="text-center space-y-1">
        <p class="text-text-tertiary text-xs">
          {{ GAME_CONFIG.totalBeats }} beats • {{ GAME_CONFIG.BPM }} BPM
        </p>
        <div v-if="bestScore > 0" class="text-text-tertiary text-xs">
          Kỷ lục: <span class="text-accent-amber font-bold">{{ bestScore }}</span> điểm
        </div>
      </div>

      <button
        class="w-full max-w-xs py-5 bg-accent-coral text-bg-deep font-display text-xl hover:bg-accent-amber transition-colors active:scale-95"
        @click="startGame"
      >
        BẮT ĐẦU
      </button>
    </div>

    <!-- ── COUNTDOWN SCREEN ────────────────────────────── -->
    <div
      v-else-if="phase === 'countdown'"
      class="flex-1 flex flex-col items-center justify-center gap-8 px-6"
    >
      <div
        class="font-display text-[120px] leading-none text-accent-coral drop-shadow-[0_0_40px_rgba(255,107,107,0.6)] animate-bounce"
      >
        {{ countdownNum }}
      </div>
      <p class="text-text-secondary text-center text-sm max-w-xs">
        Tap khi từ xuất hiện đúng nhịp.<br />
        Theo dõi rhythm bar phía dưới!
      </p>
    </div>

    <!-- ── PLAYING SCREEN ──────────────────────────────── -->
    <div
      v-else-if="phase === 'playing'"
      class="flex-1 flex flex-col touch-none"
      @pointerdown.prevent="handleTap"
    >
      <!-- HUD -->
      <div class="flex items-center justify-between px-4 py-2 border-b border-border-subtle">
        <div class="flex gap-1 text-lg">
          <span
            v-for="n in 3"
            :key="n"
            :class="n <= lives ? 'opacity-100 text-accent-coral' : 'opacity-20'"
            >♥</span
          >
        </div>
        <div class="text-xs text-text-tertiary font-mono">
          {{ rhythm.currentBeatIndex.value + 1 }}/{{ GAME_CONFIG.totalBeats }}
        </div>
        <div class="flex gap-3 text-xs text-text-tertiary font-mono">
          <span>⚡{{ perfectHits }}</span>
          <span>✓{{ goodHits }}</span>
        </div>
      </div>

      <!-- Hit Feedback -->
      <div class="h-12 flex items-center justify-center shrink-0">
        <Transition name="feedback">
          <span
            v-if="showFeedback"
            key="fb"
            class="font-display text-3xl sm:text-4xl drop-shadow"
            :class="{
              'text-accent-coral': hitFeedback === 'perfect',
              'text-accent-amber': hitFeedback === 'good',
              'text-red-400': hitFeedback === 'miss',
            }"
          >
            <template v-if="hitFeedback === 'perfect'">PERFECT! 🎯</template>
            <template v-else-if="hitFeedback === 'good'">GOOD! 👍</template>
            <template v-else>MISS! 💀</template>
          </span>
        </Transition>
      </div>

      <!-- Lyrics Display -->
      <div class="flex-1 flex flex-col items-center justify-center px-4 gap-6 min-h-0">
        <!-- Current lyric (large) -->
        <div v-if="rhythm.currentBeat.value" class="text-center space-y-2">
          <div
            class="font-display text-6xl sm:text-7xl text-accent-coral drop-shadow-[0_0_20px_rgba(255,107,107,0.5)] animate-pulse"
          >
            {{ rhythm.currentBeat.value.text }}
          </div>
          <div class="text-text-tertiary text-sm">
            phrase {{ rhythm.currentBeat.value.phrase + 1 }}
          </div>
        </div>

        <!-- Upcoming lyrics preview -->
        <div class="flex gap-3 text-text-tertiary text-sm flex-wrap justify-center">
          <span
            v-for="item in rhythm.visibleLyrics.value.slice(1, 4)"
            :key="item.id"
            class="opacity-60"
          >
            {{ item.text }}
          </span>
        </div>
      </div>

      <!-- Rhythm Bar -->
      <div class="px-4 pb-4 space-y-2 border-t border-border-subtle pt-3">
        <!-- Progress -->
        <div class="h-1 w-full bg-bg-elevated overflow-hidden">
          <div
            class="h-full bg-accent-coral/60 transition-all duration-100"
            :style="{ width: progressPct + '%' }"
          ></div>
        </div>

        <!-- Beat bar -->
        <div
          class="relative w-full h-10 bg-bg-elevated border border-border-subtle overflow-hidden"
        >
          <!-- Good zone (50% of bar = ±500ms window) -->
          <div
            class="absolute inset-y-0 bg-accent-amber/10 border-x border-accent-amber/20"
            style="left: 0%; width: 50%"
          ></div>
          <!-- Perfect zone (35% of bar = ±350ms window) -->
          <div
            class="absolute inset-y-0 bg-accent-coral/20 border-x border-accent-coral/30"
            style="left: 0%; width: 35%"
          ></div>
          <!-- Perfect marker line (center of perfect zone at 17.5%) -->
          <div class="absolute inset-y-0 left-[17.5%] w-px bg-accent-coral"></div>

          <!-- Moving cursor -->
          <div
            class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white shadow-lg transition-transform duration-75"
            :style="{ left: rhythm.progress.value * 100 + '%' }"
          ></div>
        </div>

        <p class="text-center text-text-tertiary text-[10px] tracking-widest uppercase">
          — TAP NGAY KHI TỪ XUẤT HIỆN —
        </p>
      </div>
    </div>

    <!-- ── GAME OVER / VICTORY SCREEN ──────────────────── -->
    <div
      v-else-if="phase === 'dead'"
      class="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-8 animate-fade-up"
    >
      <!-- Victory -->
      <div v-if="isVictory" class="text-center space-y-1">
        <div class="text-6xl mb-2">🏆</div>
        <p class="font-display text-4xl text-accent-amber">PHÁ ĐẢO!</p>
        <p class="text-text-secondary text-sm">
          Bạn đã hoàn thành tất cả {{ GAME_CONFIG.totalBeats }} beats!
        </p>
      </div>
      <!-- Game Over -->
      <div v-else class="text-center space-y-1">
        <div class="text-5xl mb-2">💀</div>
        <p class="font-display text-4xl text-red-400">GAME OVER</p>
        <p class="text-text-secondary text-sm">{{ getRating() }}</p>
      </div>

      <!-- Stats -->
      <div class="w-full max-w-xs grid grid-cols-2 gap-2">
        <div class="bg-bg-surface border border-border-subtle p-3 text-center">
          <p class="text-text-tertiary text-[10px] uppercase tracking-wider mb-0.5">Điểm</p>
          <p class="font-display text-3xl text-accent-coral">{{ score }}</p>
        </div>
        <div class="bg-bg-surface border border-border-subtle p-3 text-center">
          <p class="text-text-tertiary text-[10px] uppercase tracking-wider mb-0.5">Kỷ lục</p>
          <p class="font-display text-3xl text-accent-amber">{{ bestScore }}</p>
        </div>
        <div class="bg-bg-surface border border-border-subtle p-3 text-center">
          <p class="text-text-tertiary text-[10px] uppercase tracking-wider mb-0.5">Perfect</p>
          <p class="font-display text-2xl text-accent-coral">{{ perfectHits }}</p>
        </div>
        <div class="bg-bg-surface border border-border-subtle p-3 text-center">
          <p class="text-text-tertiary text-[10px] uppercase tracking-wider mb-0.5">Good</p>
          <p class="font-display text-2xl text-accent-amber">{{ goodHits }}</p>
        </div>
        <div class="bg-bg-surface border border-border-subtle p-3 text-center">
          <p class="text-text-tertiary text-[10px] uppercase tracking-wider mb-0.5">Miss</p>
          <p class="font-display text-2xl text-red-400">{{ missCount }}</p>
        </div>
        <div class="bg-bg-surface border border-border-subtle p-3 text-center">
          <p class="text-text-tertiary text-[10px] uppercase tracking-wider mb-0.5">Accuracy</p>
          <p class="font-display text-2xl text-accent-sky">{{ accuracy }}%</p>
        </div>
      </div>

      <button
        class="w-full max-w-xs py-4 bg-accent-coral text-bg-deep font-display text-xl hover:bg-accent-amber transition-colors active:scale-95"
        @click="startGame"
      >
        {{ isVictory ? 'CHƠI LẠI' : 'THỬ LẠI' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.feedback-enter-active {
  animation: feedback-pop 0.2s ease-out;
}
.feedback-leave-active {
  transition: opacity 0.2s ease-in;
}
.feedback-leave-to {
  opacity: 0;
}

@keyframes feedback-pop {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
