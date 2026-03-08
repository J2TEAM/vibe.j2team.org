<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'

type CardType = 'number' | 'operator'
type Operator = '+' | '-' | '×'
type GameStatus = 'idle' | 'preview' | 'playing' | 'checking' | 'won' | 'lost'

interface CardItem {
  id: string
  type: CardType
  value: number | Operator
  isFlipped: boolean
  isSelected: boolean
}

const PREVIEW_SECONDS = 5
const TIME_LIMIT_SECONDS = 180
const WIN_SCORE = 5
const CHECK_DELAY_MS = 800
const CONFETTI_COUNT = 80
const CONFETTI_DURATION_MS = 3000

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const a = out[i] as T
    const b = out[j] as T
    out[i] = b
    out[j] = a
  }
  return out
}

function createBoard(): CardItem[] {
  const cards: CardItem[] = []
  let id = 0
  for (let i = 0; i < 10; i++) {
    cards.push({
      id: `card_${id++}`,
      type: 'number',
      value: Math.floor(Math.random() * 9) + 1,
      isFlipped: false,
      isSelected: false,
    })
  }
  const ops: Operator[] = ['+', '+', '-', '-', '×', '×']
  for (const op of ops) {
    cards.push({
      id: `card_${id++}`,
      type: 'operator',
      value: op,
      isFlipped: false,
      isSelected: false,
    })
  }
  return shuffle(cards)
}

function compute(a: number, op: Operator, b: number): number {
  switch (op) {
    case '+':
      return a + b
    case '-':
      return a - b
    case '×':
      return a * b
    default:
      return 0
  }
}

function generateTargetFromBoard(board: CardItem[]): number | null {
  const numbers = board.filter((c) => c.type === 'number') as (CardItem & { value: number })[]
  const operators = board.filter((c) => c.type === 'operator') as (CardItem & { value: Operator })[]
  const valid: number[] = []
  for (let i = 0; i < numbers.length; i++) {
    for (let j = 0; j < numbers.length; j++) {
      if (i === j) continue
      const numI = numbers[i]
      const numJ = numbers[j]
      if (numI == null || numJ == null) continue
      for (const opCard of operators) {
        const op = opCard.value
        const a = numI.value
        const b = numJ.value
        const result = compute(a, op, b)
        if (result >= 0 && result <= 100 && Number.isInteger(result)) {
          valid.push(result)
        }
      }
    }
  }
  if (valid.length === 0) return null
  const idx = Math.floor(Math.random() * valid.length)
  return valid[idx] ?? null
}

const gameStatus = ref<GameStatus>('idle')
const board = ref<CardItem[]>([])
const target = ref<number>(0)
const score = ref(0)
const timeLeft = ref(TIME_LIMIT_SECONDS)
const statusMessage = ref('Bấm "Bắt đầu" để chơi.')
const previewCountdown = ref(PREVIEW_SECONDS)
const selectedIdsOrder = ref<string[]>([])
const showConfetti = ref(false)
const confettiParticles = ref<{ id: number; left: number; delay: number; color: string; size: number }[]>([])

let timerId: ReturnType<typeof setInterval> | null = null
let previewTimerId: ReturnType<typeof setInterval> | null = null
let confettiTimeoutId: ReturnType<typeof setTimeout> | null = null

const selectedCardsOrdered = computed(() =>
  selectedIdsOrder.value
    .map((id) => board.value.find((c) => c.id === id))
    .filter((c): c is CardItem => c != null)
)

const timeFormatted = computed(() => {
  const m = Math.floor(timeLeft.value / 60)
  const s = timeLeft.value % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
})

const isLowTime = computed(() => gameStatus.value === 'playing' && timeLeft.value <= 30)

function canAddToSelection(card: CardItem): boolean {
  return (
    gameStatus.value === 'playing' &&
    !card.isSelected &&
    selectedIdsOrder.value.length < 3
  )
}

function triggerConfetti() {
  const colors = ['#FF6B4A', '#FFB830', '#38BDF8', '#F0EDE6']
  confettiParticles.value = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 400,
    color: colors[Math.floor(Math.random() * colors.length)] ?? '#FF6B4A',
    size: 6 + Math.random() * 8,
  }))
  showConfetti.value = true
  if (confettiTimeoutId) clearTimeout(confettiTimeoutId)
  confettiTimeoutId = setTimeout(() => {
    showConfetti.value = false
    confettiParticles.value = []
    confettiTimeoutId = null
  }, CONFETTI_DURATION_MS)
}

function onCardClick(card: CardItem) {
  if (gameStatus.value === 'checking') return
  if (!canAddToSelection(card)) return
  if (!card.isFlipped) card.isFlipped = true
  card.isSelected = true
  selectedIdsOrder.value = [...selectedIdsOrder.value, card.id]
  if (selectedIdsOrder.value.length === 3) evaluateSelection()
}

function resetSelection() {
  board.value.forEach((c) => {
    c.isFlipped = false
    c.isSelected = false
  })
  selectedIdsOrder.value = []
  gameStatus.value = 'playing'
  statusMessage.value = 'Chọn 3 ô: số → phép toán (+ − ×) → số.'
}

function evaluateSelection() {
  const sel = selectedCardsOrdered.value
  if (sel.length !== 3) return
  const first = sel[0]
  const second = sel[1]
  const third = sel[2]
  if (first == null || second == null || third == null) return
  gameStatus.value = 'checking'
  const isValidFormula =
    first.type === 'number' &&
    second.type === 'operator' &&
    third.type === 'number'
  if (!isValidFormula) {
    statusMessage.value = 'Sai phép tính. Cần: số → phép toán → số.'
    setTimeout(resetSelection, CHECK_DELAY_MS)
    return
  }
  const a = first.value as number
  const op = second.value as Operator
  const b = third.value as number
  const result = compute(a, op, b)
  if (result === target.value) {
    triggerConfetti()
    statusMessage.value = 'Chính xác!'
    score.value += 1
    if (score.value >= WIN_SCORE) {
      gameStatus.value = 'won'
      statusMessage.value = 'Chiến thắng!'
      stopTimer()
      return
    }
    const newTarget = generateTargetFromBoard(board.value)
    if (newTarget !== null) target.value = newTarget
    setTimeout(resetSelection, CHECK_DELAY_MS)
  } else {
    statusMessage.value = 'Sai kết quả, thử lại.'
    setTimeout(resetSelection, CHECK_DELAY_MS)
  }
}

function startGame() {
  stopTimer()
  gameStatus.value = 'preview'
  score.value = 0
  timeLeft.value = TIME_LIMIT_SECONDS
  statusMessage.value = 'Ghi nhớ vị trí các thẻ...'
  board.value = createBoard()
  board.value.forEach((c) => {
    c.isFlipped = true
    c.isSelected = false
  })
  selectedIdsOrder.value = []
  const t = generateTargetFromBoard(board.value)
  target.value = t ?? 0
  previewCountdown.value = PREVIEW_SECONDS
  previewTimerId = setInterval(() => {
    previewCountdown.value -= 1
    if (previewCountdown.value <= 0 && previewTimerId) {
      clearInterval(previewTimerId)
      previewTimerId = null
      board.value.forEach((c) => {
        c.isFlipped = false
        c.isSelected = false
      })
      selectedIdsOrder.value = []
      gameStatus.value = 'playing'
      statusMessage.value = 'Chọn 3 ô: số → phép toán (+ − ×) → số.'
      timeLeft.value = TIME_LIMIT_SECONDS
      timerId = setInterval(() => {
        timeLeft.value -= 1
        if (timeLeft.value <= 0) {
          stopTimer()
          gameStatus.value = 'lost'
          statusMessage.value = 'Hết giờ!'
        }
      }, 1000)
    }
  }, 1000)
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
  if (previewTimerId) {
    clearInterval(previewTimerId)
    previewTimerId = null
  }
}

onUnmounted(() => {
  stopTimer()
  if (confettiTimeoutId) clearTimeout(confettiTimeoutId)
})

watch(
  () => gameStatus.value,
  (s) => {
    if (s === 'idle' || s === 'won' || s === 'lost') stopTimer()
  }
)
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col relative">
    <!-- Nổ pháo khi đúng -->
    <Teleport to="body">
      <div
        v-if="showConfetti"
        class="fixed inset-0 pointer-events-none z-[100] overflow-hidden"
        aria-hidden="true"
      >
        <div
          v-for="p in confettiParticles"
          :key="p.id"
          class="confetti-particle absolute rounded-sm"
          :style="{
            left: p.left + '%',
            top: '-10px',
            width: p.size + 'px',
            height: p.size + 'px',
            backgroundColor: p.color,
            animationDelay: p.delay + 'ms',
          }"
        />
      </div>
    </Teleport>
    <header class="border-b border-border-default bg-bg-surface px-4 py-3 flex flex-wrap items-center justify-between gap-3 animate-fade-up">
      <h1 class="font-display text-xl sm:text-2xl font-semibold text-accent-coral">Number Puzzle</h1>
      <div class="flex items-center gap-4 text-sm">
        <span class="text-text-secondary">Điểm: <strong class="text-text-primary">{{ score }}/{{ WIN_SCORE }}</strong></span>
        <span
          :class="isLowTime ? 'text-accent-coral font-semibold' : 'text-text-secondary'"
        >
          Thời gian: {{ timeFormatted }}
        </span>
      </div>
    </header>

    <main class="flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-lg mx-auto w-full">
      <!-- Idle: cách chơi + start button -->
      <template v-if="gameStatus === 'idle'">
        <div class="text-text-secondary text-sm max-w-md mb-6 animate-fade-up animate-delay-2 border border-border-default bg-bg-surface p-4">
          <p class="font-display text-accent-coral text-base font-semibold mb-2">// Cách chơi</p>
          <ul class="list-disc list-inside space-y-1">
            <li>Xem 16 thẻ mở trong 5 giây rồi ghi nhớ vị trí.</li>
            <li>Chọn 3 ô theo thứ tự bấm (ô nào cũng được). Phép tính hợp lệ phải là <strong class="text-text-primary">số → phép toán (+ − ×) → số</strong>.</li>
            <li>Sai phép tính hoặc sai kết quả thì 3 ô sẽ reset, chọn lại.</li>
            <li>Đạt <strong class="text-text-primary">5 điểm</strong> trong <strong class="text-text-primary">3 phút</strong> để thắng.</li>
          </ul>
        </div>
        <button
          type="button"
          class="border border-border-default bg-bg-surface px-6 py-3 text-lg font-display font-semibold text-accent-coral transition hover:border-accent-coral hover:bg-bg-elevated animate-fade-up animate-delay-3"
          @click="startGame"
        >
          Bắt đầu
        </button>
      </template>

      <!-- Preview -->
      <template v-else-if="gameStatus === 'preview'">
        <p class="text-accent-amber font-display text-lg mb-4">Ghi nhớ trong {{ previewCountdown }} giây...</p>
        <div class="grid grid-cols-4 gap-2 w-full max-w-[280px] sm:max-w-[320px] mb-4">
          <button
            v-for="card in board"
            :key="card.id"
            type="button"
            class="aspect-square border border-border-default bg-bg-surface flex items-center justify-center text-xl sm:text-2xl font-display font-bold text-text-primary pointer-events-none"
          >
            {{ card.value }}
          </button>
        </div>
        <button
          type="button"
          class="border border-border-default bg-bg-surface px-4 py-2 text-sm font-display text-text-secondary transition hover:border-accent-coral hover:text-text-primary hover:bg-bg-elevated"
          @click="startGame"
        >
          Ván mới
        </button>
      </template>

      <!-- Playing / Checking / Won / Lost: board or result -->
      <template v-else>
        <p class="text-center font-display text-accent-sky text-sm mb-3 min-h-[1.5rem]">
          {{ statusMessage }}
        </p>
        <!-- Đã chọn: 3 ô to, số và phép toán đều to -->
        <div class="flex items-center justify-center gap-3 sm:gap-4 mb-4 w-full">
          <template v-for="(_, index) in 3" :key="index">
            <div
              class="w-16 h-16 sm:w-20 sm:h-20 border-2 border-border-default bg-bg-surface flex items-center justify-center font-display font-bold text-text-primary text-2xl sm:text-4xl"
              :class="selectedCardsOrdered[index] ? 'border-accent-coral' : 'text-text-dim'"
            >
              {{ selectedCardsOrdered[index]?.value ?? '?' }}
            </div>
            <span v-if="index < 2" class="text-text-dim font-display text-xl sm:text-2xl">→</span>
          </template>
        </div>
        <button
          v-if="gameStatus === 'playing'"
          type="button"
          class="mb-4 border border-border-default bg-bg-surface px-4 py-2 text-sm font-display text-text-secondary transition hover:border-accent-coral hover:text-text-primary hover:bg-bg-elevated"
          @click="startGame"
        >
          Ván mới
        </button>
        <div class="grid grid-cols-4 gap-2 w-full max-w-[280px] sm:max-w-[320px] mb-4">
          <button
            v-for="card in board"
            :key="card.id"
            type="button"
            class="aspect-square border flex items-center justify-center text-xl sm:text-2xl font-display font-bold transition select-none cursor-pointer"
            :class="[
              card.isFlipped
                ? 'border-border-default bg-bg-surface text-text-primary'
                : 'border-border-default bg-bg-elevated text-text-dim',
              card.isSelected ? 'ring-2 ring-accent-coral ring-offset-2 ring-offset-bg-deep' : '',
              canAddToSelection(card) ? 'hover:border-accent-coral' : '',
              gameStatus === 'checking' ? 'pointer-events-none' : '',
            ]"
            :disabled="gameStatus === 'checking'"
            @click="onCardClick(card)"
          >
            {{ card.isFlipped ? card.value : '?' }}
          </button>
        </div>

        <!-- Số mục tiêu: nổi bật phía dưới bàn -->
        <div class="w-full max-w-[280px] sm:max-w-[320px] border-2 border-accent-amber bg-bg-surface py-3 px-4 mb-4 text-center">
          <p class="text-text-secondary text-xs sm:text-sm font-display tracking-widest mb-0.5">SỐ MỤC TIÊU</p>
          <p class="font-display text-4xl sm:text-5xl font-bold text-accent-amber">{{ target }}</p>
        </div>

        <template v-if="gameStatus === 'won'">
          <p class="font-display text-2xl text-accent-coral mb-4">Chiến thắng!</p>
          <button
            type="button"
            class="border border-accent-coral bg-bg-surface px-6 py-3 font-display font-semibold text-accent-coral hover:bg-bg-elevated"
            @click="startGame"
          >
            Chơi lại
          </button>
        </template>
        <template v-else-if="gameStatus === 'lost'">
          <p class="font-display text-2xl text-accent-amber mb-4">Hết giờ!</p>
          <button
            type="button"
            class="border border-border-default bg-bg-surface px-6 py-3 font-display font-semibold text-text-primary hover:border-accent-coral hover:bg-bg-elevated"
            @click="startGame"
          >
            Chơi lại
          </button>
        </template>
      </template>

      <div class="mt-8 flex flex-col items-center gap-3">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          &larr; Về trang chủ
        </RouterLink>
        <a
          href="https://github.com/thanhquangqb95"
          target="_blank"
          rel="noopener noreferrer"
          class="text-text-dim text-xs hover:text-accent-sky transition-colors"
        >
          Tác giả: Lê Thanh Quảng · GitHub
        </a>
      </div>
    </main>
  </div>
</template>

<style scoped>
@keyframes confetti-fall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}
.confetti-particle {
  animation: confetti-fall 2.5s ease-in forwards;
}
</style>
