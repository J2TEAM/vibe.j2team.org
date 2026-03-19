<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'

interface Card {
  id: number
  pairId: string
  name: string
  imageUrl: string
  flipped: boolean
  matched: boolean
}

type Difficulty = 'easy' | 'medium' | 'hard'

const ACTRESSES = [
  { id: 'aragaki', name: 'Yui Aragaki', imageUrl: '/memory-game/aragaki.jpg' },
  { id: 'ayase', name: 'Haruka Ayase', imageUrl: '/memory-game/ayase.jpg' },
  { id: 'ishihara', name: 'Satomi Ishihara', imageUrl: '/memory-game/ishihara.jpg' },
  { id: 'toda', name: 'Erika Toda', imageUrl: '/memory-game/toda.jpg' },
  { id: 'hirose', name: 'Suzu Hirose', imageUrl: '/memory-game/hirose.jpg' },
  { id: 'arimura', name: 'Kasumi Arimura', imageUrl: '/memory-game/arimura.jpg' },
  { id: 'komatsu', name: 'Nana Komatsu', imageUrl: '/memory-game/komatsu.jpg' },
  { id: 'tsuchiya', name: 'Tao Tsuchiya', imageUrl: '/memory-game/tsuchiya.jpg' },
  { id: 'yoshitaka', name: 'Yuriko Yoshitaka', imageUrl: '/memory-game/yoshitaka.jpg' },
  { id: 'nagasawa', name: 'Masami Nagasawa', imageUrl: '/memory-game/nagasawa.jpg' },
  { id: 'kitagawa', name: 'Keiko Kitagawa', imageUrl: '/memory-game/kitagawa.jpg' },
  { id: 'hashimoto', name: 'Kanna Hashimoto', imageUrl: '/memory-game/hashimoto.jpg' },
]

const GRID_CONFIG: Record<Difficulty, { pairs: number; cols: string }> = {
  easy: { pairs: 6, cols: 'grid-cols-3 min-[375px]:grid-cols-4' },
  medium: { pairs: 8, cols: 'grid-cols-4' },
  hard: { pairs: 12, cols: 'grid-cols-4 min-[480px]:grid-cols-6' },
}

const difficulty = ref<Difficulty>('medium')
const cards = ref<Card[]>([])
const flippedIds = ref<number[]>([])
const moves = ref(0)
const timer = ref(0)
const timerInterval = ref<ReturnType<typeof setInterval> | null>(null)
const gameStarted = ref(false)
const gameWon = ref(false)
const locked = ref(false)

const matchedPairs = computed(() => cards.value.filter((c) => c.matched).length / 2)
const totalPairs = computed(() => GRID_CONFIG[difficulty.value].pairs)
const gridCols = computed(() => GRID_CONFIG[difficulty.value].cols)

const formattedTime = computed(() => {
  const m = Math.floor(timer.value / 60)
  const s = timer.value % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]!
    a[i] = a[j]!
    a[j] = tmp
  }
  return a
}

function startGame() {
  stopTimer()
  const pairs = GRID_CONFIG[difficulty.value].pairs
  const selected = shuffle(ACTRESSES).slice(0, pairs)
  const deck = shuffle(
    [...selected, ...selected].map((actress, i) => ({
      id: i,
      pairId: actress.id,
      name: actress.name,
      imageUrl: actress.imageUrl,
      flipped: false,
      matched: false,
    })),
  )
  cards.value = deck
  flippedIds.value = []
  moves.value = 0
  timer.value = 0
  gameStarted.value = false
  gameWon.value = false
  locked.value = false
}

function stopTimer() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

function flipCard(card: Card) {
  if (locked.value || card.flipped || card.matched) return

  if (!gameStarted.value) {
    gameStarted.value = true
    timerInterval.value = setInterval(() => timer.value++, 1000)
  }

  card.flipped = true
  flippedIds.value.push(card.id)

  if (flippedIds.value.length === 2) {
    moves.value++
    locked.value = true
    const a = cards.value.find((c) => c.id === flippedIds.value[0])
    const b = cards.value.find((c) => c.id === flippedIds.value[1])
    if (!a || !b) {
      flippedIds.value = []
      locked.value = false
      return
    }

    if (a.pairId === b.pairId) {
      a.matched = true
      b.matched = true
      flippedIds.value = []
      locked.value = false
      if (matchedPairs.value === totalPairs.value) {
        gameWon.value = true
        stopTimer()
      }
    } else {
      setTimeout(() => {
        a.flipped = false
        b.flipped = false
        flippedIds.value = []
        locked.value = false
      }, 600)
    }
  }
}

watch(difficulty, () => startGame())
startGame()
onUnmounted(() => stopTimer())
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center px-4 py-8"
  >
    <!-- Header -->
    <div class="w-full max-w-2xl animate-fade-up">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-accent-coral"
      >
        &larr; Về trang chủ
      </RouterLink>

      <h1
        class="font-display text-3xl min-[375px]:text-4xl sm:text-5xl font-bold text-accent-coral mt-4"
      >
        🧠 Lật Hình Trí Nhớ
      </h1>
      <p class="mt-2 text-text-secondary text-sm sm:text-base">
        Tìm tất cả các cặp hình giống nhau. Càng ít lượt lật càng giỏi!
      </p>
    </div>

    <!-- Difficulty selector -->
    <div class="flex gap-2 mt-6 animate-fade-up animate-delay-1">
      <button
        v-for="level in ['easy', 'medium', 'hard'] as Difficulty[]"
        :key="level"
        :class="[
          'px-4 py-1.5 text-sm border transition-all duration-200',
          difficulty === level
            ? 'border-accent-coral text-accent-coral bg-bg-elevated'
            : 'border-border-default text-text-secondary hover:border-accent-coral hover:text-text-primary',
        ]"
        @click="difficulty = level"
      >
        {{ level === 'easy' ? 'Dễ' : level === 'medium' ? 'Vừa' : 'Khó' }}
      </button>
    </div>

    <!-- Stats bar -->
    <div class="flex gap-6 mt-5 text-sm animate-fade-up animate-delay-2">
      <div class="flex items-center gap-1.5">
        <span class="text-text-dim">Lượt:</span>
        <span class="text-accent-amber font-bold tabular-nums">{{ moves }}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-text-dim">Thời gian:</span>
        <span class="text-accent-sky font-bold tabular-nums">{{ formattedTime }}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-text-dim">Cặp:</span>
        <span class="text-accent-coral font-bold tabular-nums"
          >{{ matchedPairs }}/{{ totalPairs }}</span
        >
      </div>
    </div>

    <!-- Card grid -->
    <div
      :class="[
        'grid gap-2 sm:gap-3 mt-6 w-full max-w-lg animate-fade-up animate-delay-3',
        gridCols,
      ]"
    >
      <button
        v-for="card in cards"
        :key="card.id"
        class="card-container aspect-square"
        :class="{ 'pointer-events-none': card.matched }"
        @click="flipCard(card)"
      >
        <div class="card-inner" :class="{ 'is-flipped': card.flipped || card.matched }">
          <div class="card-face card-back">
            <div
              class="absolute inset-0 rounded-none"
              style="
                background: radial-gradient(
                  ellipse at center,
                  rgba(255, 107, 74, 0.08) 0%,
                  transparent 70%
                );
              "
            ></div>
            <span class="font-display text-2xl font-bold text-accent-coral relative">?</span>
          </div>
          <div class="card-face card-front" :class="{ 'matched-glow': card.matched }">
            <img
              :src="card.imageUrl"
              :alt="card.flipped || card.matched ? card.name : ''"
              class="absolute inset-0 w-full h-full object-cover object-top"
              loading="lazy"
              draggable="false"
            />
            <div
              v-if="card.matched"
              class="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5 pt-4 text-center"
              style="
                background: linear-gradient(
                  to top,
                  rgba(15, 25, 35, 0.92) 0%,
                  rgba(15, 25, 35, 0.6) 60%,
                  transparent 100%
                );
              "
            >
              <span class="text-[10px] sm:text-xs font-medium text-text-primary truncate block">{{
                card.name
              }}</span>
            </div>
          </div>
        </div>
      </button>
    </div>

    <!-- Reset button -->
    <button
      class="mt-6 px-6 py-2 text-sm border border-border-default text-text-secondary transition hover:border-accent-coral hover:text-text-primary animate-fade-up animate-delay-4"
      @click="startGame()"
    >
      🔄 Chơi lại
    </button>

    <!-- Win overlay -->
    <Teleport to="body">
      <Transition name="win">
        <div
          v-if="gameWon"
          class="fixed inset-0 z-40 flex items-center justify-center bg-bg-deep/80 backdrop-blur-sm"
          @click="startGame()"
        >
          <div
            class="text-center p-8 border border-accent-coral bg-bg-surface max-w-sm mx-4"
            @click.stop
          >
            <div class="text-5xl mb-4">🎉</div>
            <h2 class="font-display text-2xl sm:text-3xl font-bold text-accent-coral">Xuất sắc!</h2>
            <p class="mt-3 text-text-secondary">
              Hoàn thành trong <span class="text-accent-amber font-bold">{{ moves }}</span> lượt và
              <span class="text-accent-sky font-bold">{{ formattedTime }}</span>
            </p>
            <button
              class="mt-5 px-6 py-2 text-sm border border-accent-coral text-accent-coral transition hover:bg-accent-coral hover:text-bg-deep"
              @click="startGame()"
            >
              Chơi lại
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Footer -->
    <p class="mt-8 text-xs text-text-dim animate-fade-up animate-delay-5">
      Tạo bởi <span class="text-text-secondary">chungtoixayweb.vn</span>
    </p>
  </div>
</template>

<style scoped>
.card-container {
  perspective: 600px;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.4s ease;
  transform-style: preserve-3d;
}

.card-inner.is-flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  backface-visibility: hidden;
  border: 1px solid var(--color-border-default);
  background: var(--color-bg-surface);
  transition:
    border-color 0.2s,
    box-shadow 0.3s;
}

.card-face:hover {
  border-color: var(--color-accent-coral);
}

.card-front {
  transform: rotateY(180deg);
  background: var(--color-bg-elevated);
  overflow: hidden;
}

.matched-glow {
  border-color: var(--color-accent-amber);
  box-shadow:
    0 0 0 1px var(--color-accent-amber),
    0 0 16px color-mix(in srgb, var(--color-accent-amber) 40%, transparent),
    0 0 32px color-mix(in srgb, var(--color-accent-amber) 15%, transparent);
}

.win-enter-active {
  transition: opacity 0.3s ease;
}
.win-leave-active {
  transition: opacity 0.2s ease;
}
.win-enter-from,
.win-leave-to {
  opacity: 0;
}
</style>
