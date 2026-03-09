<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { RouterLink } from 'vue-router'

// ── Types ──────────────────────────────────────────────
interface Card {
  id: number
  content: string
  flipped: boolean
  selected: boolean
}

interface ModalConfettiParticle {
  id: number
  tx: number
  ty: number
  delay: number
  color: string
  size: number
  rot: number
}

type GamePhase = 'setup' | 'mode-select' | 'shuffling' | 'playing' | 'complete'
type GameMode = 'spread' | 'draw'

// ── Presets ────────────────────────────────────────────
const PRESETS: { label: string; items: string[] }[] = [
  { label: 'Số 1–10', items: Array.from({ length: 10 }, (_, i) => String(i + 1)) },
  {
    label: 'A–Z',
    items: Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
  },
  {
    label: 'Bộ bài 52 lá',
    items: ['♠', '♥', '♦', '♣'].flatMap((suit) =>
      ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].map((v) => `${v}${suit}`),
    ),
  },
]

// ── State ──────────────────────────────────────────────
const phase = ref<GamePhase>('setup')
const mode = ref<GameMode>('spread')
const textInput = ref('')
const cardTexts = ref<string[]>([])
const cards = ref<Card[]>([])
const drawnCards = ref<Card[]>([])
const isMuted = ref(false)
const shuffleAnimating = ref(false)
const confettiParticles = ref<{ id: number; x: number; delay: number; color: string }[]>([])

// ── Spread settings ───────────────────────────────────
const flipLimit = ref(0) // 0 = unlimited
const shuffleSpeed = ref<'normal' | 'fast' | 'instant'>('normal')
const showSettings = ref(false)
const isShufflingInPlace = ref(false)
const swappingIndices = ref<number[]>([])
// Picked cards list — persists across reshuffles
const pickedCards = ref<Card[]>([])

const remainingDeck = computed(() => cards.value.filter((c) => !c.flipped))
const allFlipped = computed(() => cards.value.length > 0 && cards.value.every((c) => c.flipped))
const flippedCount = computed(() => pickedCards.value.length)
const canFlipMore = computed(() => flipLimit.value === 0 || flippedCount.value < flipLimit.value)
// Cards visible on the grid = not yet picked
const visibleCards = computed(() => {
  const pickedIds = new Set(pickedCards.value.map((c) => c.id))
  return cards.value.filter((c) => !pickedIds.has(c.id))
})
const allPicked = computed(
  () => cards.value.length > 0 && pickedCards.value.length >= cards.value.length,
)
const showMobileDrawer = ref(false)
const isFlipping = ref(false)
const showTablePreview = ref(false)
const isDeckShuffling = ref(false)
const isCollecting = ref(false)
const pendingCard = ref<Card | null>(null)
const modalCardFlipped = ref(false)
const modalConfetti = ref<ModalConfettiParticle[]>([])

const shuffleDuration = computed(() => {
  if (shuffleSpeed.value === 'instant') return 0
  if (shuffleSpeed.value === 'fast') return 200
  return 400
})

// ── Audio ──────────────────────────────────────────────
let audioCtx: AudioContext | null = null

interface WindowWithWebkit extends Window {
  webkitAudioContext?: typeof AudioContext
}

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as WindowWithWebkit).webkitAudioContext)()
  }
}

function playSound(type: 'shuffle' | 'flip' | 'celebrate') {
  if (isMuted.value || !audioCtx) return
  if (audioCtx.state === 'suspended') audioCtx.resume()

  const now = audioCtx.currentTime

  if (type === 'shuffle') {
    for (let i = 0; i < 6; i++) {
      const o = audioCtx.createOscillator()
      const g = audioCtx.createGain()
      o.connect(g)
      g.connect(audioCtx.destination)
      o.type = 'triangle'
      const freq = 200 + Math.random() * 600
      o.frequency.setValueAtTime(freq, now + i * 0.06)
      o.frequency.exponentialRampToValueAtTime(freq * 0.5, now + i * 0.06 + 0.04)
      g.gain.setValueAtTime(0.06, now + i * 0.06)
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.04)
      o.start(now + i * 0.06)
      o.stop(now + i * 0.06 + 0.04)
    }
    return
  }

  if (type === 'flip') {
    const o = audioCtx.createOscillator()
    const g = audioCtx.createGain()
    o.connect(g)
    g.connect(audioCtx.destination)
    o.type = 'sine'
    o.frequency.setValueAtTime(300, now)
    o.frequency.exponentialRampToValueAtTime(600, now + 0.08)
    g.gain.setValueAtTime(0.07, now)
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
    o.start(now)
    o.stop(now + 0.08)
    return
  }

  if (type === 'celebrate') {
    const notes = [523, 659, 783, 1046]
    notes.forEach((freq, i) => {
      const o = audioCtx!.createOscillator()
      const g = audioCtx!.createGain()
      o.connect(g)
      g.connect(audioCtx!.destination)
      o.type = 'triangle'
      o.frequency.setValueAtTime(freq, now + i * 0.12)
      g.gain.setValueAtTime(0.1, now + i * 0.12)
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3)
      o.start(now + i * 0.12)
      o.stop(now + i * 0.12 + 0.3)
    })
  }
}

// ── Shuffle ────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = a[i]!
    a[i] = a[j]!
    a[j] = temp
  }
  return a
}

// ── Setup Actions ──────────────────────────────────────
function applyPreset(items: string[]) {
  initAudio()
  cardTexts.value = [...items]
  textInput.value = items.join('\n')
}

function parseTextarea() {
  initAudio()
  const lines = textInput.value
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  if (lines.length === 0) return
  cardTexts.value = lines
}

function goToModeSelect() {
  parseTextarea()
  if (cardTexts.value.length < 2) return
  phase.value = 'mode-select'
}

function selectMode(m: GameMode) {
  mode.value = m
  startShuffle()
}

function buildDeck() {
  return shuffle(
    cardTexts.value.map((content, i) => ({
      id: i,
      content,
      flipped: false,
      selected: false,
    })),
  )
}

async function startShuffle() {
  phase.value = 'shuffling'
  shuffleAnimating.value = true
  cards.value = buildDeck()
  drawnCards.value = []
  pickedCards.value = []
  playSound('shuffle')
  await new Promise((r) => setTimeout(r, 500))
  shuffleAnimating.value = false
  phase.value = 'playing'
}

// ── In-place visual shuffle on the grid ────────────────
async function shuffleInPlace(onlyTable: boolean) {
  if (isShufflingInPlace.value) return
  isShufflingInPlace.value = true
  showTablePreview.value = false

  // Reset flipped state on remaining cards
  cards.value.forEach((c) => {
    c.flipped = false
    c.selected = false
  })

  if (!onlyTable) {
    // Full reshuffle: restore all cards to grid
    pickedCards.value = []
  }

  // Determine which indices on visible cards to shuffle
  const currentVisible = visibleCards.value
  const visibleIds = new Set(currentVisible.map((c) => c.id))
  const indicesToShuffle = cards.value
    .map((c, i) => (visibleIds.has(c.id) ? i : -1))
    .filter((i) => i !== -1)

  // Step 2: animate swap rounds with real FLIP movement
  const rounds = shuffleSpeed.value === 'instant' ? 0 : shuffleSpeed.value === 'fast' ? 3 : 5
  const moveDur = shuffleSpeed.value === 'fast' ? 250 : 400

  playSound('shuffle')
  for (let r = 0; r < rounds; r++) {
    if (indicesToShuffle.length < 2) break
    // Pick two random indices to swap
    const a = indicesToShuffle[Math.floor(Math.random() * indicesToShuffle.length)]!
    let b = a
    while (b === a) {
      b = indicesToShuffle[Math.floor(Math.random() * indicesToShuffle.length)]!
    }
    swappingIndices.value = [a, b]
    // Swap data — TransitionGroup FLIP handles visual movement
    const temp = cards.value[a]!
    cards.value[a] = cards.value[b]!
    cards.value[b] = temp
    // Wait for the CSS move transition to complete
    await new Promise((res) => setTimeout(res, moveDur + 60))
    swappingIndices.value = []
  }

  // Final full shuffle of the selected indices
  if (indicesToShuffle.length >= 2) {
    const vals = indicesToShuffle.map((i) => cards.value[i]!)
    const shuffled = shuffle(vals)
    indicesToShuffle.forEach((idx, i) => {
      cards.value[idx] = shuffled[i]!
    })
    // Wait for final move animation
    if (rounds > 0) await new Promise((res) => setTimeout(res, moveDur))
  }

  isShufflingInPlace.value = false
}

// ── Spread Mode ────────────────────────────────────────
function flipCard(card: Card) {
  if (isShufflingInPlace.value || isFlipping.value || pendingCard.value) return
  if (!canFlipMore.value) return
  pendingCard.value = card
  playSound('flip')
  // Flip the modal card after a small delay for dramatic reveal
  setTimeout(() => {
    modalCardFlipped.value = true
    spawnModalConfetti()
  }, 120)
}

function spawnModalConfetti() {
  const colors = ['#FF6B4A', '#FFB830', '#38BDF8', '#F0EDE6', '#ff4081', '#69f0ae']
  modalConfetti.value = Array.from({ length: 48 }, (_, i) => {
    const angle = (i / 48) * Math.PI * 2 + Math.random() * 0.4
    const dist = 100 + Math.random() * 220
    return {
      id: i,
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist - 60,
      delay: Math.random() * 0.25,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      size: 6 + Math.random() * 8,
      rot: Math.random() * 720 - 360,
    }
  })
  setTimeout(() => {
    modalConfetti.value = []
  }, 2000)
}

function confirmPick() {
  const card = pendingCard.value
  if (!card) return
  pendingCard.value = null
  modalCardFlipped.value = false
  modalConfetti.value = []

  if (mode.value === 'draw') {
    card.flipped = true
    drawnCards.value.push(card)
    nextTick(() => {
      if (allFlipped.value) {
        phase.value = 'complete'
        playSound('celebrate')
        startReview()
      }
    })
    return
  }

  // Spread mode
  isFlipping.value = true
  if (!pickedCards.value.some((c) => c.id === card.id)) {
    setTimeout(() => {
      pickedCards.value.push({ ...card })
      nextTick(() => {
        const limitReached = flipLimit.value > 0 && flippedCount.value >= flipLimit.value
        if (allPicked.value || limitReached) {
          phase.value = 'complete'
          playSound('celebrate')
          startReview()
        }
        setTimeout(() => {
          isFlipping.value = false
        }, 300)
      })
    }, 400)
  }
}

// ── Draw Mode ──────────────────────────────────────────
function drawNext() {
  if (pendingCard.value) return
  const next = remainingDeck.value[0]
  if (!next) return
  pendingCard.value = next
  playSound('flip')
  setTimeout(() => {
    modalCardFlipped.value = true
    spawnModalConfetti()
  }, 120)
}

// ── Review (card-by-card celebration after complete) ────
const reviewIndex = ref(-1)
const reviewCardFlipped = ref(false)
const reviewConfetti = ref<ModalConfettiParticle[]>([])
const reviewCards = computed(() => (mode.value === 'draw' ? drawnCards.value : pickedCards.value))

function startReview() {
  reviewIndex.value = 0
  reviewCardFlipped.value = false
  reviewConfetti.value = []
  setTimeout(() => {
    reviewCardFlipped.value = true
    spawnReviewConfetti()
  }, 200)
}

function spawnReviewConfetti() {
  const colors = ['#FF6B4A', '#FFB830', '#38BDF8', '#F0EDE6', '#ff4081', '#69f0ae']
  reviewConfetti.value = Array.from({ length: 48 }, (_, i) => {
    const angle = (i / 48) * Math.PI * 2 + Math.random() * 0.4
    const dist = 100 + Math.random() * 220
    return {
      id: i,
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist - 60,
      delay: Math.random() * 0.25,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      size: 6 + Math.random() * 8,
      rot: Math.random() * 720 - 360,
    }
  })
  setTimeout(() => {
    reviewConfetti.value = []
  }, 2000)
}

function reviewNext() {
  reviewConfetti.value = []
  reviewCardFlipped.value = false
  if (reviewIndex.value < reviewCards.value.length - 1) {
    reviewIndex.value++
    setTimeout(() => {
      reviewCardFlipped.value = true
      spawnReviewConfetti()
    }, 200)
  } else {
    // All reviewed — show summary with rain confetti
    reviewIndex.value = -1
    spawnConfetti()
  }
}

function replayReview() {
  reviewIndex.value = 0
  reviewCardFlipped.value = false
  setTimeout(() => {
    reviewCardFlipped.value = true
    spawnReviewConfetti()
  }, 200)
}

// ── Confetti ───────────────────────────────────────────
function spawnConfetti() {
  const colors = ['#FF6B4A', '#FFB830', '#38BDF8', '#F0EDE6', '#ff4081', '#69f0ae']
  confettiParticles.value = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.6,
    color: colors[Math.floor(Math.random() * colors.length)]!,
  }))
  setTimeout(() => {
    confettiParticles.value = []
  }, 3000)
}

// ── Reset ──────────────────────────────────────────────
function reshuffleAll() {
  phase.value = 'playing'
  shuffleInPlace(false)
}

function reshuffleTable() {
  phase.value = 'playing'
  shuffleInPlace(true)
}

async function reshuffleDrawMode() {
  if (isDeckShuffling.value || pendingCard.value || isCollecting.value) return

  // Phase 1: animate drawn cards back into the deck
  if (drawnCards.value.length > 0) {
    isCollecting.value = true
    playSound('shuffle')
    const collectDur = Math.min(drawnCards.value.length * 35 + 350, 900)
    await new Promise((r) => setTimeout(r, collectDur))
    drawnCards.value = []
    isCollecting.value = false
    await new Promise((r) => setTimeout(r, 60))
  }

  // Phase 2: deck shuffle animation
  isDeckShuffling.value = true
  playSound('shuffle')
  await new Promise((r) => setTimeout(r, 800))
  cards.value = buildDeck()
  isDeckShuffling.value = false
}

function backToSetup() {
  phase.value = 'setup'
  cards.value = []
  drawnCards.value = []
  pickedCards.value = []
  confettiParticles.value = []
  reviewIndex.value = -1
  reviewConfetti.value = []
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body relative overflow-hidden">
    <!-- Confetti overlay -->
    <div v-if="confettiParticles.length" class="fixed inset-0 pointer-events-none z-50">
      <div
        v-for="p in confettiParticles"
        :key="p.id"
        class="confetti-piece"
        :style="{
          left: p.x + '%',
          animationDelay: p.delay + 's',
          backgroundColor: p.color,
        }"
      />
    </div>

    <!-- Header -->
    <header class="flex items-center justify-between px-4 py-3 sm:px-6">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
      >
        &larr; Về trang chủ
      </RouterLink>
      <button
        class="border border-border-default bg-bg-surface px-3 py-2 text-lg transition hover:border-accent-coral hover:bg-bg-elevated"
        :title="isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'"
        @click="isMuted = !isMuted"
      >
        {{ isMuted ? '🔇' : '🔊' }}
      </button>
    </header>

    <main class="px-4 pb-12 sm:px-6 max-w-6xl mx-auto">
      <!-- ═══ PHASE: SETUP ═══ -->
      <section v-if="phase === 'setup'" class="animate-fade-up">
        <h1 class="font-display text-3xl sm:text-5xl font-bold text-accent-coral mt-6 mb-2">
          <span class="text-accent-amber">//</span> Random Card
        </h1>
        <p class="text-text-secondary mb-8 max-w-lg">
          Tạo bộ thẻ bài của bạn, chọn chế độ chơi, xáo bài và bắt đầu rút thẻ!
        </p>

        <!-- Presets -->
        <div class="mb-6 animate-fade-up animate-delay-1">
          <p class="text-text-secondary text-sm mb-3 font-medium">Mẫu có sẵn:</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="preset in PRESETS"
              :key="preset.label"
              class="border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary hover:bg-bg-elevated"
              @click="applyPreset(preset.items)"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>

        <!-- Textarea -->
        <div class="mb-6 animate-fade-up animate-delay-2">
          <label class="block text-text-secondary text-sm mb-2 font-medium">
            Nhập nội dung thẻ bài (mỗi dòng = 1 thẻ):
          </label>
          <textarea
            v-model="textInput"
            rows="8"
            placeholder="Ví dụ:&#10;Thẻ 1&#10;Thẻ 2&#10;Thẻ 3&#10;..."
            class="w-full bg-bg-surface border border-border-default text-text-primary p-3 text-sm font-body resize-y focus:outline-none focus:border-accent-coral transition placeholder:text-text-dim"
          />
          <p class="text-text-dim text-xs mt-1">
            {{ textInput.split('\n').filter((l) => l.trim().length > 0).length }}
            thẻ bài
          </p>
        </div>

        <!-- Continue -->
        <button
          class="bg-accent-coral text-bg-deep font-bold px-6 py-3 text-sm transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed animate-fade-up animate-delay-3"
          :disabled="textInput.split('\n').filter((l) => l.trim().length > 0).length < 2"
          @click="goToModeSelect"
        >
          Tiếp tục →
        </button>
      </section>

      <!-- ═══ PHASE: MODE SELECT ═══ -->
      <section v-else-if="phase === 'mode-select'" class="animate-fade-up mt-8">
        <h2 class="font-display text-2xl sm:text-3xl font-bold text-accent-coral mb-2">
          <span class="text-accent-amber">//</span> Chọn chế độ chơi
        </h2>
        <p class="text-text-secondary mb-8">
          {{ cardTexts.length }} thẻ bài đã sẵn sàng. Hãy chọn cách chơi:
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <!-- Mode: Spread -->
          <button
            class="group border border-border-default bg-bg-surface p-6 text-left transition hover:border-accent-coral hover:bg-bg-elevated hover:-translate-y-1"
            @click="selectMode('spread')"
          >
            <div class="text-3xl mb-3">🃏</div>
            <h3
              class="font-display text-lg font-bold text-text-primary group-hover:text-accent-coral transition"
            >
              Trải bài
            </h3>
            <p class="text-text-secondary text-sm mt-1">
              Tất cả thẻ úp xuống trên bàn. Nhấn để lật từng thẻ hoặc nhiều thẻ cùng lúc.
            </p>
          </button>

          <!-- Mode: Draw -->
          <button
            class="group border border-border-default bg-bg-surface p-6 text-left transition hover:border-accent-coral hover:bg-bg-elevated hover:-translate-y-1"
            @click="selectMode('draw')"
          >
            <div class="text-3xl mb-3">📥</div>
            <h3
              class="font-display text-lg font-bold text-text-primary group-hover:text-accent-coral transition"
            >
              Rút bài
            </h3>
            <p class="text-text-secondary text-sm mt-1">
              Bộ bài xếp chồng bên trái. Nhấn để rút từng thẻ một sang bàn chơi.
            </p>
          </button>
        </div>

        <button
          class="text-text-dim text-sm hover:text-text-secondary transition"
          @click="backToSetup"
        >
          ← Quay lại tạo thẻ
        </button>
      </section>

      <!-- ═══ PHASE: SHUFFLING ═══ -->
      <section
        v-else-if="phase === 'shuffling'"
        class="flex flex-col items-center justify-center mt-24"
      >
        <div class="shuffle-stack">
          <div
            v-for="i in 5"
            :key="i"
            class="shuffle-card"
            :class="shuffleAnimating ? 'shuffle-anim' : ''"
            :style="{ animationDelay: i * 0.08 + 's' }"
          />
        </div>
        <p class="text-text-secondary mt-8 text-lg animate-pulse">Đang xáo bài...</p>
      </section>

      <!-- ═══ PHASE: PLAYING — SPREAD MODE ═══ -->
      <section v-else-if="phase === 'playing' && mode === 'spread'" class="mt-6">
        <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 class="font-display text-xl font-bold text-accent-coral">
            <span class="text-accent-amber">//</span> Trải bài
          </h2>
          <div class="flex gap-2 flex-wrap">
            <!-- Mobile: open drawer -->
            <button
              class="lg:hidden border border-border-default bg-bg-surface px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              :class="pickedCards.length > 0 ? 'border-accent-sky text-text-primary' : ''"
              @click="showMobileDrawer = true"
            >
              📋 Đã chọn ({{ pickedCards.length }})
            </button>
            <button
              class="border border-border-default bg-bg-surface px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              :class="showTablePreview ? 'border-accent-sky text-text-primary' : ''"
              @click="showTablePreview = !showTablePreview"
            >
              👁️ Xem trên sân ({{ visibleCards.length }})
            </button>
            <button
              class="border border-border-default bg-bg-surface px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              :class="showSettings ? 'border-accent-amber text-text-primary' : ''"
              @click="showSettings = !showSettings"
            >
              ⚙️ Cài đặt
            </button>
            <button
              class="border border-border-default bg-bg-surface px-3 py-2 text-xs text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
              @click="backToSetup"
            >
              ← Tạo mới
            </button>
          </div>
        </div>

        <!-- Settings panel -->
        <div
          v-if="showSettings"
          class="mb-4 border border-border-default bg-bg-surface p-4 animate-fade-up"
        >
          <h3 class="font-display text-sm font-bold text-accent-amber mb-3">⚙️ Cài đặt</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-text-secondary text-xs block mb-1">Giới hạn số thẻ lật:</label>
              <div class="flex gap-2 flex-wrap">
                <button
                  v-for="opt in [0, 1, 2, 3, 5]"
                  :key="opt"
                  class="px-3 py-1.5 text-xs border transition"
                  :class="
                    flipLimit === opt
                      ? 'border-accent-coral bg-accent-coral/15 text-accent-coral'
                      : 'border-border-default text-text-dim hover:border-accent-coral hover:text-text-primary'
                  "
                  @click="flipLimit = opt"
                >
                  {{ opt === 0 ? 'Không giới hạn' : opt + ' thẻ' }}
                </button>
              </div>
            </div>
            <div>
              <label class="text-text-secondary text-xs block mb-1">Tốc độ xáo bài:</label>
              <div class="flex gap-2">
                <button
                  v-for="opt in ['normal', 'fast', 'instant'] as const"
                  :key="opt"
                  class="px-3 py-1.5 text-xs border transition"
                  :class="
                    shuffleSpeed === opt
                      ? 'border-accent-coral bg-accent-coral/15 text-accent-coral'
                      : 'border-border-default text-text-dim hover:border-accent-coral hover:text-text-primary'
                  "
                  @click="shuffleSpeed = opt"
                >
                  {{ opt === 'normal' ? 'Bình thường' : opt === 'fast' ? 'Nhanh' : 'Tức thì' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Status bar -->
        <div class="flex items-center justify-between mb-4">
          <p class="text-text-dim text-xs">
            Đã chọn {{ flippedCount }} / {{ cards.length }} thẻ
            <span v-if="flipLimit > 0" class="text-accent-amber ml-1">
              (giới hạn: {{ flipLimit }})
            </span>
          </p>
          <div class="flex gap-2">
            <button
              class="border border-border-default bg-bg-surface px-3 py-1.5 text-xs text-text-secondary transition hover:border-accent-amber hover:text-text-primary disabled:opacity-40"
              :disabled="isShufflingInPlace"
              @click="reshuffleTable"
            >
              🔀 Xáo trên sân
            </button>
            <button
              class="border border-border-default bg-bg-surface px-3 py-1.5 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary disabled:opacity-40"
              :disabled="isShufflingInPlace"
              @click="reshuffleAll"
            >
              🔄 Xáo toàn bộ
            </button>
          </div>
        </div>

        <!-- Main layout: grid + sidebar -->
        <div class="flex gap-6">
          <!-- Card grid with FLIP move animation -->
          <div class="flex-1 min-w-0">
            <TransitionGroup
              tag="div"
              name="card-grid"
              class="grid grid-cols-3 min-[400px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 sm:gap-3"
              :class="{ 'pointer-events-none': isShufflingInPlace }"
              :style="{ '--move-dur': shuffleDuration + 'ms' }"
            >
              <div
                v-for="card in visibleCards"
                :key="card.id"
                class="card-perspective"
                :class="{
                  'cursor-pointer': !pendingCard && canFlipMore && !isFlipping && !showTablePreview,
                  'opacity-40 cursor-not-allowed':
                    (!canFlipMore || isFlipping || !!pendingCard) && !showTablePreview,
                  'cursor-default': showTablePreview,
                }"
                @click="!showTablePreview && flipCard(card)"
              >
                <div class="card-inner" :class="{ 'card-flipped': showTablePreview }">
                  <div class="card-face card-back">
                    <div class="card-pattern" />
                  </div>
                  <div class="card-face card-front">
                    <span class="card-text">{{ card.content }}</span>
                  </div>
                </div>
              </div>
            </TransitionGroup>
            <div
              v-if="visibleCards.length === 0"
              class="flex flex-col items-center justify-center py-12 text-text-dim"
            >
              <p class="text-lg mb-3">🎴</p>
              <p class="text-sm">Tất cả thẻ đã được chọn!</p>
            </div>
          </div>

          <!-- Desktop sidebar: picked list -->
          <aside class="hidden lg:block w-64 flex-shrink-0">
            <div
              class="sticky top-20 border border-border-default bg-bg-surface p-4 max-h-[75vh] overflow-y-auto"
            >
              <div class="flex items-center justify-between mb-3">
                <h3 class="font-display text-sm font-bold text-accent-sky">📋 Đã chọn</h3>
                <span class="text-text-dim text-xs tabular-nums"
                  >{{ pickedCards.length }}/{{ cards.length }}</span
                >
              </div>
              <div v-if="pickedCards.length === 0" class="text-text-dim text-xs py-4 text-center">
                Chưa chọn thẻ nào.
              </div>
              <TransitionGroup v-else tag="div" name="picked-item" class="space-y-1.5">
                <div
                  v-for="(card, idx) in pickedCards"
                  :key="card.id"
                  class="flex items-center gap-2 bg-bg-elevated border border-border-default px-3 py-2 text-sm"
                >
                  <span class="text-accent-coral font-bold tabular-nums text-xs">{{
                    Number(idx) + 1
                  }}</span>
                  <span class="text-text-primary truncate">{{ card.content }}</span>
                </div>
              </TransitionGroup>
              <div class="flex gap-2 mt-4">
                <button
                  class="flex-1 px-2 py-1.5 text-xs border border-border-default text-text-dim transition hover:border-accent-amber hover:text-accent-amber disabled:opacity-40"
                  :disabled="isShufflingInPlace"
                  @click="reshuffleTable"
                >
                  🔀 Xáo sân
                </button>
                <button
                  class="flex-1 px-2 py-1.5 text-xs border border-border-default text-text-dim transition hover:border-accent-coral hover:text-accent-coral disabled:opacity-40"
                  :disabled="isShufflingInPlace"
                  @click="reshuffleAll"
                >
                  🔄 Toàn bộ
                </button>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <!-- Card reveal modal -->
      <Teleport to="body">
        <Transition name="modal-reveal">
          <div v-if="pendingCard" class="fixed inset-0 z-50 flex items-center justify-center px-4">
            <!-- Backdrop -->
            <div class="absolute inset-0 bg-bg-deep/85 backdrop-blur-sm" />

            <!-- Burst confetti -->
            <div
              class="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden"
            >
              <div
                v-for="p in modalConfetti"
                :key="p.id"
                class="modal-confetti"
                :style="{
                  width: p.size + 'px',
                  height: p.size * 1.6 + 'px',
                  backgroundColor: p.color,
                  animationDelay: p.delay + 's',
                  '--tx': p.tx + 'px',
                  '--ty': p.ty + 'px',
                  '--rot': p.rot + 'deg',
                }"
              />
            </div>

            <!-- Card + content -->
            <div class="relative z-10 flex flex-col items-center gap-5 animate-fade-up">
              <!-- Pick number badge -->
              <div
                class="font-display text-accent-amber text-sm font-bold tracking-widest uppercase"
              >
                #{{ mode === 'draw' ? drawnCards.length + 1 : pickedCards.length + 1 }}
              </div>

              <!-- Big flipping card -->
              <div class="modal-card-wrap">
                <div class="modal-card-inner" :class="{ 'modal-card-flipped': modalCardFlipped }">
                  <div class="modal-card-face modal-card-back">
                    <div class="card-pattern" />
                  </div>
                  <div class="modal-card-face modal-card-front">
                    <span class="modal-card-text">{{ pendingCard.content }}</span>
                  </div>
                </div>
              </div>

              <!-- Continue button fades in after card flips -->
              <Transition name="btn-appear">
                <button
                  v-if="modalCardFlipped"
                  class="bg-accent-coral text-bg-deep font-display font-bold px-8 py-3 text-base transition hover:opacity-90 shadow-2xl"
                  @click="confirmPick"
                >
                  Tiếp tục →
                </button>
              </Transition>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Mobile drawer for picked list -->
      <Teleport to="body">
        <Transition name="drawer">
          <div v-if="showMobileDrawer" class="fixed inset-0 z-40 lg:hidden">
            <div
              class="absolute inset-0 bg-bg-deep/70 backdrop-blur-sm"
              @click="showMobileDrawer = false"
            />
            <div class="drawer-panel">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-display text-base font-bold text-accent-sky">📋 Thẻ đã chọn</h3>
                <button
                  class="text-text-dim hover:text-text-primary transition text-xl leading-none px-2"
                  @click="showMobileDrawer = false"
                >
                  ✕
                </button>
              </div>
              <div v-if="pickedCards.length === 0" class="text-text-dim text-sm py-8 text-center">
                Chưa chọn thẻ nào.
              </div>
              <div v-else class="space-y-2 overflow-y-auto flex-1 -mx-1 px-1">
                <div
                  v-for="(card, idx) in pickedCards"
                  :key="card.id"
                  class="flex items-center gap-3 bg-bg-elevated border border-border-default px-3 py-2.5"
                >
                  <span class="text-accent-coral font-bold tabular-nums text-sm">{{
                    Number(idx) + 1
                  }}</span>
                  <span class="text-text-primary text-sm">{{ card.content }}</span>
                </div>
              </div>
              <div class="flex gap-2 mt-4 pt-4 border-t border-border-default">
                <!-- eslint-disable vue/max-attributes-per-line -->
                <button
                  class="flex-1 px-3 py-2 text-xs border border-border-default text-text-dim transition hover:border-accent-amber hover:text-accent-amber disabled:opacity-40"
                  :disabled="isShufflingInPlace"
                  @click="reshuffleTable(); showMobileDrawer = false"
                >
                  🔀 Xáo trên sân
                </button>
                <button
                  class="flex-1 px-3 py-2 text-xs border border-border-default text-text-dim transition hover:border-accent-coral hover:text-accent-coral disabled:opacity-40"
                  :disabled="isShufflingInPlace"
                  @click="reshuffleAll(); showMobileDrawer = false"
                >
                  🔄 Xáo toàn bộ
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- ═══ PHASE: PLAYING — DRAW MODE ═══ -->
      <section v-if="phase === 'playing' && mode === 'draw'" class="mt-6">
        <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 class="font-display text-xl font-bold text-accent-coral">
            <span class="text-accent-amber">//</span> Rút bài
          </h2>
          <div class="flex gap-2">
            <button
              class="border border-border-default bg-bg-surface px-4 py-2 text-xs text-text-secondary transition hover:border-accent-amber hover:text-text-primary disabled:opacity-40"
              :disabled="isDeckShuffling || !!pendingCard || isCollecting"
              @click="reshuffleDrawMode"
            >
              🔄 Xáo lại
            </button>
            <button
              class="border border-border-default bg-bg-surface px-4 py-2 text-xs text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
              @click="backToSetup"
            >
              ← Tạo mới
            </button>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-6 sm:gap-8 min-h-[50vh]">
          <!-- Deck (left) -->
          <div class="flex flex-col items-center flex-shrink-0">
            <p class="text-text-dim text-xs mb-2">
              Còn lại: {{ remainingDeck.length }} / {{ cards.length }}
            </p>
            <div
              class="deck-stack relative"
              :class="{
                'cursor-pointer': remainingDeck.length > 0 && !pendingCard && !isDeckShuffling,
                'opacity-30 pointer-events-none': remainingDeck.length === 0 && !isDeckShuffling,
                'pointer-events-none': isDeckShuffling || !!pendingCard,
              }"
              @click="drawNext"
            >
              <div
                v-for="(_, i) in isDeckShuffling ? 5 : Math.min(remainingDeck.length, 5)"
                :key="i"
                class="deck-layer"
                :class="{ 'deck-shuffle-anim': isDeckShuffling }"
                :style="
                  isDeckShuffling
                    ? {}
                    : {
                        transform: `translate(${i * 1.5}px, ${-i * 1.5}px)`,
                        zIndex: 5 - i,
                      }
                "
              />
              <div
                v-if="remainingDeck.length === 0 && !isDeckShuffling"
                class="deck-layer deck-empty"
              >
                <span class="text-text-dim text-xs">Hết bài</span>
              </div>
            </div>
            <p v-if="isDeckShuffling" class="text-accent-amber text-xs mt-3 animate-pulse">
              Đang xáo bài...
            </p>
            <p
              v-else-if="remainingDeck.length > 0"
              class="text-accent-coral text-xs mt-3 animate-pulse"
            >
              Nhấn để rút
            </p>
          </div>

          <!-- Table (right) -->
          <div class="flex-1 min-h-[200px]">
            <p class="text-text-dim text-xs mb-3">Thẻ đã rút ({{ drawnCards.length }}):</p>
            <div
              v-if="drawnCards.length === 0"
              class="border border-dashed border-border-default h-32 flex items-center justify-center text-text-dim text-sm"
            >
              Chưa có thẻ nào
            </div>
            <div
              v-else
              class="grid grid-cols-3 min-[400px]:grid-cols-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3"
            >
              <div
                v-for="(card, idx) in drawnCards"
                :key="card.id"
                class="card-perspective"
                :class="isCollecting ? 'card-collect-back' : 'drawn-card-enter'"
                :style="isCollecting ? { animationDelay: idx * 0.035 + 's' } : {}"
              >
                <div class="card-inner card-flipped">
                  <div class="card-face card-back">
                    <div class="card-pattern" />
                  </div>
                  <div class="card-face card-front">
                    <span class="card-text">{{ card.content }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══ PHASE: COMPLETE ═══ -->
      <!-- Card-by-card review modal -->
      <Teleport to="body">
        <Transition name="modal-reveal">
          <div
            v-if="phase === 'complete' && reviewIndex >= 0"
            class="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div class="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm" />

            <!-- Burst confetti -->
            <div
              class="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden"
            >
              <div
                v-for="p in reviewConfetti"
                :key="p.id"
                class="modal-confetti"
                :style="{
                  width: p.size + 'px',
                  height: p.size * 1.6 + 'px',
                  backgroundColor: p.color,
                  animationDelay: p.delay + 's',
                  '--tx': p.tx + 'px',
                  '--ty': p.ty + 'px',
                  '--rot': p.rot + 'deg',
                }"
              />
            </div>

            <div class="relative z-10 flex flex-col items-center gap-5">
              <!-- Progress -->
              <div class="flex items-center gap-3">
                <span class="font-display text-accent-amber text-sm font-bold tracking-widest">
                  #{{ reviewIndex + 1 }} / {{ reviewCards.length }}
                </span>
                <div class="flex gap-1">
                  <div
                    v-for="(_, i) in reviewCards"
                    :key="i"
                    class="h-1 w-5 transition-all duration-300"
                    :class="i <= reviewIndex ? 'bg-accent-coral' : 'bg-bg-elevated'"
                  />
                </div>
              </div>

              <!-- Big flipping card -->
              <div class="modal-card-wrap">
                <div class="modal-card-inner" :class="{ 'modal-card-flipped': reviewCardFlipped }">
                  <div class="modal-card-face modal-card-back">
                    <div class="card-pattern" />
                  </div>
                  <div class="modal-card-face modal-card-front">
                    <span class="modal-card-text">{{ reviewCards[reviewIndex]?.content }}</span>
                  </div>
                </div>
              </div>

              <!-- Next / Finish button -->
              <Transition name="btn-appear">
                <button
                  v-if="reviewCardFlipped"
                  class="font-display font-bold px-8 py-3 text-base transition hover:opacity-90 shadow-2xl"
                  :class="
                    reviewIndex < reviewCards.length - 1
                      ? 'bg-accent-amber text-bg-deep'
                      : 'bg-accent-coral text-bg-deep'
                  "
                  @click="reviewNext"
                >
                  {{ reviewIndex < reviewCards.length - 1 ? 'Tiếp theo →' : '🎉 Xem kết quả' }}
                </button>
              </Transition>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Summary modal -->
      <section
        v-if="phase === 'complete' && reviewIndex === -1"
        class="fixed inset-0 z-40 flex items-center justify-center bg-bg-deep/80 backdrop-blur-sm px-4"
        @click.self="phase = 'playing'"
      >
        <div
          class="bg-bg-surface border border-border-default p-6 sm:p-8 max-w-md w-full text-center animate-fade-up"
        >
          <div class="text-5xl mb-4">🎉</div>
          <h2 class="font-display text-2xl font-bold text-accent-coral mb-2">
            {{
              mode === 'draw' ? 'Rút bài xong!' : flipLimit > 0 ? 'Đã chọn xong!' : 'Hoàn thành!'
            }}
          </h2>
          <p class="text-text-secondary mb-5">
            {{
              mode === 'draw'
                ? `Đã rút ${drawnCards.length} / ${cards.length} thẻ bài.`
                : flipLimit > 0
                  ? `Bạn đã lật ${flippedCount} thẻ bài.`
                  : `Bạn đã lật hết ${cards.length} thẻ bài.`
            }}
          </p>
          <!-- Result list -->
          <div v-if="reviewCards.length" class="mb-5 text-left max-h-52 overflow-y-auto">
            <p class="text-text-dim text-xs mb-2">✨ Kết quả:</p>
            <div class="space-y-1">
              <div
                v-for="(card, idx) in reviewCards"
                :key="card.id"
                class="flex items-center gap-2 bg-bg-elevated border border-border-default px-3 py-1.5 text-sm"
              >
                <span class="text-accent-coral font-bold tabular-nums text-xs w-5 flex-shrink-0"
                  >{{ Number(idx) + 1 }}.</span
                >
                <span class="text-text-primary">{{ card.content }}</span>
              </div>
            </div>
          </div>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              class="bg-accent-coral text-bg-deep font-bold px-5 py-2.5 text-sm transition hover:opacity-90"
              @click="mode === 'draw' ? reshuffleDrawMode() : reshuffleAll()"
            >
              🔄 Chơi lại
            </button>
            <button
              class="border border-border-default bg-bg-elevated px-5 py-2.5 text-sm text-accent-amber font-bold transition hover:opacity-90"
              @click="replayReview"
            >
              ▶️ Xem lại
            </button>
            <button
              class="border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              @click="backToSetup"
            >
              ← Tạo bộ thẻ mới
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* ── Modal card reveal ──────────────────────────────────── */
.modal-reveal-enter-active {
  transition: opacity 0.2s ease;
}
.modal-reveal-enter-from {
  opacity: 0;
}
.modal-reveal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-reveal-leave-to {
  opacity: 0;
}

.modal-card-wrap {
  perspective: 1200px;
}

.modal-card-inner {
  position: relative;
  width: 180px;
  height: 252px;
  transform-style: preserve-3d;
  transition: transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@media (min-width: 640px) {
  .modal-card-inner {
    width: 220px;
    height: 308px;
  }
}

.modal-card-flipped {
  transform: rotateY(180deg);
}

.modal-card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-border-default);
}

.modal-card-back {
  background: var(--color-bg-surface);
  overflow: hidden;
}

.modal-card-front {
  background: var(--color-bg-elevated);
  transform: rotateY(180deg);
  padding: 20px;
  border-color: var(--color-accent-coral);
  box-shadow: 0 0 40px color-mix(in srgb, var(--color-accent-coral) 30%, transparent);
}

.modal-card-text {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(1.25rem, 8vw, 2.5rem);
  color: var(--color-text-primary);
  text-align: center;
  word-break: break-word;
  line-height: 1.2;
}

/* ── Burst confetti ─────────────────────────────────────── */
.modal-confetti {
  position: absolute;
  border-radius: 2px;
  animation: modal-burst 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes modal-burst {
  0% {
    transform: translate(0, 0) rotate(0deg) scale(1);
    opacity: 1;
  }
  60% {
    opacity: 1;
  }
  100% {
    transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(0.4);
    opacity: 0;
  }
}

/* ── Continue button appear ─────────────────────────────── */
.btn-appear-enter-active {
  transition:
    opacity 0.3s ease 0.3s,
    transform 0.3s ease 0.3s;
}
.btn-appear-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

/* ── Card 3D flip ─────────────────────────────────────── */
.card-perspective {
  perspective: 800px;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.card-inner {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  transform-style: preserve-3d;
  transition: transform 0.5s ease;
}

.card-flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border-default);
}

.card-back {
  background: var(--color-bg-surface);
  overflow: hidden;
}

.card-pattern {
  position: absolute;
  inset: 4px;
  border: 2px solid var(--color-accent-coral);
  opacity: 0.3;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 6px,
    var(--color-accent-coral) 6px,
    var(--color-accent-coral) 7px
  );
}

.card-front {
  background: var(--color-bg-elevated);
  transform: rotateY(180deg);
  padding: 8px;
}

.card-text {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(0.75rem, 2.5vw, 1.25rem);
  color: var(--color-text-primary);
  text-align: center;
  word-break: break-word;
  overflow-wrap: break-word;
  line-height: 1.3;
}

/* ── TransitionGroup FLIP move + leave animation ─────── */
.card-grid-move {
  transition: transform var(--move-dur, 400ms) cubic-bezier(0.22, 1, 0.36, 1);
  z-index: 5;
}

.card-grid-leave-active {
  position: absolute;
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}

.card-grid-leave-to {
  opacity: 0;
  transform: scale(0.6) rotateY(90deg);
}

/* ── Picked list items enter animation ────────────────── */
.picked-item-enter-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.picked-item-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

/* ── Mobile drawer ────────────────────────────────────── */
.drawer-panel {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: min(320px, 85vw);
  background: var(--color-bg-surface);
  border-left: 1px solid var(--color-border-default);
  padding: 20px;
  display: flex;
  flex-direction: column;
  animation: drawer-slide-in 0.25s ease-out;
}

@keyframes drawer-slide-in {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.drawer-enter-active {
  transition: opacity 0.25s ease;
}

.drawer-enter-from {
  opacity: 0;
}

.drawer-leave-active {
  transition: opacity 0.2s ease;
}

.drawer-leave-to {
  opacity: 0;
}

/* ── Deck in-place shuffle animation ─────────────────── */
.deck-shuffle-anim {
  animation: shuffle-fan 0.5s ease-in-out both;
}

.deck-layer:nth-child(1).deck-shuffle-anim {
  --i: -2;
  animation-delay: 0s;
}
.deck-layer:nth-child(2).deck-shuffle-anim {
  --i: -1;
  animation-delay: 0.07s;
}
.deck-layer:nth-child(3).deck-shuffle-anim {
  --i: 0;
  animation-delay: 0.14s;
}
.deck-layer:nth-child(4).deck-shuffle-anim {
  --i: 1;
  animation-delay: 0.21s;
}
.deck-layer:nth-child(5).deck-shuffle-anim {
  --i: 2;
  animation-delay: 0.28s;
}

/* ── Deck stack (draw mode) ───────────────────────────── */
.deck-stack {
  width: 100px;
  height: 140px;
  position: relative;
}

@media (min-width: 640px) {
  .deck-stack {
    width: 120px;
    height: 168px;
  }
}

.deck-layer {
  position: absolute;
  inset: 0;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-default);
  transition: transform 0.2s;
}

.deck-stack:hover .deck-layer {
  border-color: var(--color-accent-coral);
}

.deck-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  border-style: dashed;
}

/* ── Drawn card entry animation ───────────────────────── */
.drawn-card-enter {
  animation: slide-in 0.4s ease-out both;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(-40px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* ── Collect back animation (draw mode reshuffle) ────────── */
.card-collect-back {
  animation: collect-back 0.38s ease-in forwards;
}

@keyframes collect-back {
  0% {
    opacity: 1;
    transform: scale(1) translateX(0) translateY(0);
  }
  40% {
    opacity: 0.9;
    transform: scale(0.8) translateX(-20px) translateY(-4px);
  }
  100% {
    opacity: 0;
    transform: scale(0.25) translateX(-90px) translateY(8px);
  }
}

/* ── Shuffle animation ────────────────────────────────── */
.shuffle-stack {
  position: relative;
  width: 120px;
  height: 168px;
}

.shuffle-card {
  position: absolute;
  inset: 0;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-default);
}

.shuffle-anim {
  animation: shuffle-fan 0.5s ease-in-out both;
}

@keyframes shuffle-fan {
  0% {
    transform: translateX(0) rotate(0deg);
  }
  30% {
    transform: translateX(calc(var(--i, 1) * 15px)) rotate(calc(var(--i, 1) * 5deg));
  }
  60% {
    transform: translateX(calc(var(--i, 1) * -10px)) rotate(calc(var(--i, 1) * -3deg));
  }
  100% {
    transform: translateX(0) rotate(0deg);
  }
}

.shuffle-card:nth-child(1) {
  --i: -2;
}
.shuffle-card:nth-child(2) {
  --i: -1;
}
.shuffle-card:nth-child(3) {
  --i: 0;
}
.shuffle-card:nth-child(4) {
  --i: 1;
}
.shuffle-card:nth-child(5) {
  --i: 2;
}

/* ── Confetti ─────────────────────────────────────────── */
.confetti-piece {
  position: absolute;
  top: -10px;
  width: 8px;
  height: 14px;
  animation: confetti-fall 2.5s ease-in forwards;
}

@keyframes confetti-fall {
  0% {
    opacity: 1;
    transform: translateY(0) rotateZ(0deg) rotateX(0deg);
  }
  100% {
    opacity: 0;
    transform: translateY(100vh) rotateZ(720deg) rotateX(360deg);
  }
}
</style>
