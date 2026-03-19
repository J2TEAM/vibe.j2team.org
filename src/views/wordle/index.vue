<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useLocalStorage } from '@vueuse/core'
import { getDailyWord, getTodayKey, toBase } from './words'

// ─── Constants ────────────────────────────────────────────────────────────────
const WORD_LENGTH = 5
const MAX_GUESSES = 6
const REVEAL_MS = 250

// ─── Types ────────────────────────────────────────────────────────────────────
type LetterState = 'correct' | 'present' | 'absent'

interface GameState {
  guesses: string[]
  status: 'playing' | 'won' | 'lost'
  date: string
}

// ─── Daily word (loaded lazily from /wordle/words.json) ───────────────────────
const todayKey = getTodayKey()
const answer = ref('')

// ─── Persistent state ─────────────────────────────────────────────────────────
const saved = useLocalStorage<GameState>('wordle-vn-v1', {
  guesses: [],
  status: 'playing',
  date: todayKey,
})

if (saved.value.date !== todayKey) {
  saved.value = { guesses: [], status: 'playing', date: todayKey }
}

// ─── Reactive UI state ────────────────────────────────────────────────────────
const currentInput = ref('')
const errorMsg = ref('')
const shakeRow = ref<number | null>(null)
const revealingRow = ref<number | null>(null)
// revealedUpTo[row] = highest col index that has been flipped
const revealedUpTo = ref<Record<number, number>>({})
const showModal = ref(false)

// ─── Evaluation ───────────────────────────────────────────────────────────────
function evaluate(guess: string): LetterState[] {
  const g = [...guess]
  const a = [...answer.value]
  const result: LetterState[] = Array(WORD_LENGTH).fill('absent')
  const used = Array(WORD_LENGTH).fill(false)

  g.forEach((ch, i) => {
    if (toBase(ch) === toBase(a[i]!)) {
      result[i] = 'correct'
      used[i] = true
    }
  })
  g.forEach((ch, i) => {
    if (result[i] === 'correct') return
    const j = a.findIndex((ac, ai) => !used[ai] && toBase(ac) === toBase(ch))
    if (j !== -1) {
      result[i] = 'present'
      used[j] = true
    }
  })
  return result
}

const evaluations = computed(() => saved.value.guesses.map(evaluate))

// Key states indexed by base char so both on-screen (toned) and physical (base)
// keyboard keys light up correctly.
const keyStates = computed<Record<string, LetterState>>(() => {
  const map: Record<string, LetterState> = {}
  saved.value.guesses.forEach((guess, gi) => {
    ;[...guess].forEach((ch, ci) => {
      const key = toBase(ch) // normalise so 'ề' and 'e' share the same slot
      const s = evaluations.value[gi]![ci]!
      const prev = map[key]
      if (prev === 'correct') return
      if (prev === 'present' && s !== 'correct') return
      map[key] = s
    })
  })
  return map
})

// ─── Input handlers ───────────────────────────────────────────────────────────
function addChar(ch: string) {
  if (saved.value.status !== 'playing') return
  if ([...currentInput.value].length >= WORD_LENGTH) return
  currentInput.value += ch
}

function removeChar() {
  if (saved.value.status !== 'playing') return
  const chars = [...currentInput.value]
  chars.pop()
  currentInput.value = chars.join('')
}

function showError(msg: string) {
  errorMsg.value = msg
  setTimeout(() => (errorMsg.value = ''), 1500)
}

function submitGuess() {
  if (saved.value.status !== 'playing') return

  const input = currentInput.value.normalize('NFC')
  const row = saved.value.guesses.length

  if ([...input].length !== WORD_LENGTH) {
    showError(`Cần đúng ${WORD_LENGTH} ký tự!`)
    shakeRow.value = row
    setTimeout(() => (shakeRow.value = null), 600)
    return
  }

  saved.value.guesses = [...saved.value.guesses, input]
  currentInput.value = ''

  // Reveal tiles one by one
  revealingRow.value = row
  for (let col = 0; col < WORD_LENGTH; col++) {
    const c = col
    setTimeout(() => {
      revealedUpTo.value = { ...revealedUpTo.value, [row]: c }
    }, c * REVEAL_MS)
  }

  setTimeout(
    () => {
      revealingRow.value = null
      const won = toBase(input) === toBase(answer.value)
      const lost = !won && saved.value.guesses.length >= MAX_GUESSES
      if (won) saved.value.status = 'won'
      if (lost) saved.value.status = 'lost'
      if (won || lost) setTimeout(() => (showModal.value = true), 400)
    },
    WORD_LENGTH * REVEAL_MS + 100,
  )
}

// ─── Physical keyboard ────────────────────────────────────────────────────────
function onKeydown(e: KeyboardEvent) {
  if (e.metaKey || e.ctrlKey || e.altKey) return
  if (e.key === 'Enter') submitGuess()
  else if (e.key === 'Backspace') removeChar()
  // Accept any single letter — includes plain a-z and Vietnamese chars if IME active
  else if (e.key.length === 1 && /\p{L}/u.test(e.key)) addChar(e.key.toLowerCase())
}

onMounted(async () => {
  answer.value = await getDailyWord()
  window.addEventListener('keydown', onKeydown)
  if (saved.value.status !== 'playing') setTimeout(() => (showModal.value = true), 400)
  // Restore reveal state for already-played rows
  saved.value.guesses.forEach((_, i) => {
    revealedUpTo.value[i] = WORD_LENGTH - 1
  })
  // Start countdown
  updateCountdown()
  countdownTimer = setInterval(updateCountdown, 1000)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  if (countdownTimer) clearInterval(countdownTimer)
})

// ─── Tile helpers ─────────────────────────────────────────────────────────────
function tileChar(row: number, col: number): string {
  if (row < saved.value.guesses.length) return [...saved.value.guesses[row]!][col] ?? ''
  if (row === saved.value.guesses.length) return [...currentInput.value][col] ?? ''
  return ''
}

function tileClass(row: number, col: number): string {
  const isSubmitted = row < saved.value.guesses.length
  const isCurrentRow = row === saved.value.guesses.length
  const isRevealed = (revealedUpTo.value[row] ?? -1) >= col

  if (isSubmitted && isRevealed) {
    const s = evaluations.value[row]?.[col]
    if (s === 'correct') return 'bg-accent-coral border-accent-coral text-bg-deep scale-100'
    if (s === 'present') return 'bg-accent-amber border-accent-amber text-bg-deep scale-100'
    return 'bg-bg-elevated border-bg-elevated text-text-dim scale-100'
  }

  if (isCurrentRow && [...currentInput.value][col]) {
    return 'border-text-secondary text-text-primary bg-bg-surface'
  }

  return 'border-border-default text-text-dim bg-transparent'
}

// ─── Keyboard layout ──────────────────────────────────────────────────────────
const CONSONANT_KEYS = [
  'b',
  'c',
  'd',
  'đ',
  'g',
  'h',
  'k',
  'l',
  'm',
  'n',
  'p',
  'q',
  'r',
  's',
  't',
  'v',
  'x',
]

const VOWEL_SECTIONS = [
  { tone: 'Không dấu', keys: ['a', 'ă', 'â', 'e', 'ê', 'i', 'o', 'ô', 'ơ', 'u', 'ư', 'y'] },
  { tone: 'Huyền', keys: ['à', 'ằ', 'ầ', 'è', 'ề', 'ì', 'ò', 'ồ', 'ờ', 'ù', 'ừ', 'ỳ'] },
  { tone: 'Sắc', keys: ['á', 'ắ', 'ấ', 'é', 'ế', 'í', 'ó', 'ố', 'ớ', 'ú', 'ứ', 'ý'] },
  { tone: 'Hỏi', keys: ['ả', 'ẳ', 'ẩ', 'ẻ', 'ể', 'ỉ', 'ỏ', 'ổ', 'ở', 'ủ', 'ử', 'ỷ'] },
  { tone: 'Ngã', keys: ['ã', 'ẵ', 'ẫ', 'ẽ', 'ễ', 'ĩ', 'õ', 'ỗ', 'ỡ', 'ũ', 'ữ', 'ỹ'] },
  { tone: 'Nặng', keys: ['ạ', 'ặ', 'ậ', 'ẹ', 'ệ', 'ị', 'ọ', 'ộ', 'ợ', 'ụ', 'ự', 'ỵ'] },
]

function keyClass(ch: string): string {
  const s = keyStates.value[toBase(ch)]
  if (s === 'correct') return 'bg-accent-coral border-accent-coral text-bg-deep font-bold'
  if (s === 'present') return 'bg-accent-amber border-accent-amber text-bg-deep font-bold'
  if (s === 'absent') return 'bg-bg-elevated border-bg-elevated text-text-dim'
  return 'bg-bg-surface border-border-default text-text-primary hover:border-accent-coral hover:text-accent-coral'
}

// ─── Countdown to midnight ────────────────────────────────────────────────────
const countdown = ref('')

function updateCountdown() {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  const diff = midnight.getTime() - now.getTime()
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1_000)
  countdown.value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

let countdownTimer: ReturnType<typeof setInterval> | null = null

// ─── Share ────────────────────────────────────────────────────────────────────
const guessCount = computed(() => saved.value.guesses.length)

const shareText = computed(() => {
  const rows = saved.value.guesses.map((_, i) =>
    (evaluations.value[i] ?? [])
      .map((s) => (s === 'correct' ? '🟥' : s === 'present' ? '🟨' : '⬜'))
      .join(''),
  )
  const status = saved.value.status === 'won' ? `${guessCount.value}/${MAX_GUESSES}` : 'X/6'
  return `Wordle Tiếng Việt ${todayKey} ${status}\n\n${rows.join('\n')}\nvibe.j2team.org/wordle`
})

async function copyShare() {
  await navigator.clipboard.writeText(shareText.value)
  showError('Đã copy!')
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col">
    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <header class="border-b border-border-default shrink-0">
      <div class="max-w-xl mx-auto px-4 py-3 relative flex items-center justify-between">
        <RouterLink
          to="/"
          class="text-text-secondary hover:text-text-primary transition text-sm flex items-center gap-1.5"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Về trang chủ
        </RouterLink>
        <h1
          class="font-display font-bold text-base tracking-widest text-accent-coral absolute left-1/2 -translate-x-1/2"
        >
          WORDLE TIẾNG VIỆT
        </h1>
        <button
          class="text-text-secondary hover:text-text-primary transition flex items-center gap-1.5 ml-auto"
          @click="showModal = true"
        >
          <Icon icon="lucide:bar-chart-2" class="size-4" />
        </button>
      </div>
      <!-- Countdown bar -->
      <div class="border-t border-border-default bg-bg-surface py-1.5 text-center">
        <span class="text-text-dim text-xs tracking-wide">Từ mới sau </span>
        <span class="font-display font-bold text-sm text-text-primary tracking-widest">{{
          countdown
        }}</span>
      </div>
    </header>

    <!-- ── Error toast ────────────────────────────────────────────────── -->
    <Transition name="toast">
      <div
        v-if="errorMsg"
        class="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-text-primary text-bg-deep font-display font-bold text-sm px-4 py-2 tracking-wide whitespace-nowrap"
      >
        {{ errorMsg }}
      </div>
    </Transition>

    <!-- ── Grid ──────────────────────────────────────────────────────── -->
    <div class="flex justify-center py-5 shrink-0">
      <div class="flex flex-col gap-1.5">
        <div
          v-for="row in MAX_GUESSES"
          :key="row"
          class="flex gap-1.5"
          :class="{ 'animate-shake': shakeRow === row - 1 }"
        >
          <div
            v-for="col in WORD_LENGTH"
            :key="col"
            class="w-11 h-11 sm:w-13 sm:h-13 border-2 flex items-center justify-center font-display font-bold text-lg sm:text-xl select-none transition-all duration-200"
            :class="tileClass(row - 1, col - 1)"
            :style="
              row - 1 === revealingRow
                ? `transition-delay:${(col - 1) * REVEAL_MS}ms`
                : 'transition-delay:0ms'
            "
          >
            {{ tileChar(row - 1, col - 1) }}
          </div>
        </div>
      </div>
    </div>

    <!-- ── Keyboard ───────────────────────────────────────────────────── -->
    <div class="flex-1 max-w-2xl mx-auto w-full px-3 pb-4">
      <!-- Consonants -->
      <div class="mb-2">
        <p class="text-text-dim text-[9px] font-display tracking-widest mb-1 uppercase">
          // Phụ âm
        </p>
        <div class="flex flex-wrap gap-1">
          <button
            v-for="ch in CONSONANT_KEYS"
            :key="ch"
            class="w-8 h-8 border text-sm font-display font-semibold transition-colors flex items-center justify-center"
            :class="keyClass(ch)"
            @click="addChar(ch)"
          >
            {{ ch }}
          </button>
        </div>
      </div>

      <!-- Vowel rows (the glorious mess) -->
      <div v-for="section in VOWEL_SECTIONS" :key="section.tone" class="mb-1.5">
        <p class="text-text-dim text-[9px] font-display tracking-widest mb-1 uppercase">
          // {{ section.tone }}
        </p>
        <div class="flex flex-wrap gap-1">
          <button
            v-for="ch in section.keys"
            :key="ch"
            class="w-8 h-8 border text-sm font-display font-semibold transition-colors flex items-center justify-center"
            :class="keyClass(ch)"
            @click="addChar(ch)"
          >
            {{ ch }}
          </button>
        </div>
      </div>

      <!-- Enter / Delete -->
      <div class="flex gap-2 mt-3">
        <button
          class="flex-1 h-10 border border-border-default bg-bg-surface text-text-secondary text-xs font-display font-bold tracking-widest transition hover:border-accent-coral hover:text-accent-coral flex items-center justify-center gap-2"
          @click="submitGuess"
        >
          <Icon icon="lucide:corner-down-left" class="size-3.5" />
          NHẬP
        </button>
        <button
          class="w-16 h-10 border border-border-default bg-bg-surface text-text-secondary transition hover:border-accent-coral hover:text-accent-coral flex items-center justify-center"
          @click="removeChar"
        >
          <Icon icon="lucide:delete" class="size-4" />
        </button>
      </div>
    </div>

    <!-- ── Modal ──────────────────────────────────────────────────────── -->
    <Transition name="modal">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 bg-bg-deep/90 flex items-center justify-center px-4"
        @click.self="showModal = false"
      >
        <div class="border border-border-default bg-bg-surface w-full max-w-sm p-6 animate-fade-up">
          <template v-if="saved.status === 'won'">
            <p class="font-display text-3xl font-bold text-accent-coral mb-1">🎉 Đúng rồi!</p>
            <p class="text-text-secondary text-sm mb-4">
              Bạn đoán đúng sau
              <span class="text-text-primary font-bold">{{ guessCount }}</span> lần thử.
            </p>
          </template>

          <template v-else-if="saved.status === 'lost'">
            <p class="font-display text-3xl font-bold text-accent-coral mb-1">💀 Hết lượt!</p>
            <p class="text-text-secondary text-sm mb-1">Đáp án hôm nay là:</p>
            <p class="font-display font-bold text-2xl text-accent-amber mb-4 tracking-widest">
              {{ answer }}
            </p>
          </template>

          <template v-else>
            <p class="font-display text-xl font-bold text-text-primary mb-2">Tiến độ hôm nay</p>
            <p class="text-text-secondary text-sm mb-4">
              Đã thử <span class="text-text-primary font-bold">{{ guessCount }}</span> /
              {{ MAX_GUESSES }} lần.
            </p>
          </template>

          <!-- Emoji grid -->
          <div
            v-if="saved.status !== 'playing'"
            class="font-mono text-xl leading-tight mb-4 text-center space-y-0.5"
          >
            <div v-for="(_, i) in saved.guesses" :key="i">
              <span v-for="(s, j) in evaluations[i]" :key="j">
                {{ s === 'correct' ? '🟥' : s === 'present' ? '🟨' : '⬜' }}
              </span>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <button
              v-if="saved.status !== 'playing'"
              class="w-full border border-accent-coral bg-accent-coral/10 text-accent-coral py-2.5 text-sm font-display font-bold tracking-wide transition hover:bg-accent-coral hover:text-bg-deep flex items-center justify-center gap-2"
              @click="copyShare"
            >
              <Icon icon="lucide:share-2" class="size-4" />
              Chia sẻ kết quả
            </button>
            <button
              class="w-full border border-border-default text-text-secondary py-2.5 text-sm font-display tracking-wide transition hover:border-accent-coral hover:text-text-primary"
              @click="showModal = false"
            >
              Đóng
            </button>
          </div>

          <div v-if="saved.status !== 'playing'" class="mt-4 text-center">
            <p class="text-text-dim text-xs mb-1">Từ mới sau</p>
            <p class="font-display font-bold text-xl text-text-primary tracking-widest">
              {{ countdown }}
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-6px);
  }
  40% {
    transform: translateX(6px);
  }
  60% {
    transform: translateX(-4px);
  }
  80% {
    transform: translateX(4px);
  }
}
.animate-shake {
  animation: shake 0.5s ease-in-out;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-6px) translateX(-50%);
}
/* keep translate during transition */
.toast-enter-to,
.toast-leave-from {
  transform: translateY(0) translateX(-50%);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
