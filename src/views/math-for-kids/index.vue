<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import { RouterLink } from 'vue-router'

// ─── Types ───────────────────────────────────────────────────
interface Question {
  text: string
  options: string[]
  correctIndex: number
}

// ─── State ───────────────────────────────────────────────────
type Screen = 'intro' | 'level' | 'roast' | 'game' | 'gameover' | 'win'
const screen = ref<Screen>('intro')
const age = ref<number | null>(null)
const selectedLevel = ref('')
const currentQ = ref(0)
const score = ref(0)
const timer = ref(0)
const roastMsg = ref('')
const gameOverMsg = ref('')
const shakeScreen = ref(false)
const selectedOption = ref<number | null>(null)
const answeredWrong = ref(false)

let timerInterval: ReturnType<typeof setInterval> | null = null

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

// ─── Level Definitions ──────────────────────────────────────
const levels = [
  'Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5', 'Lớp 6',
  'Lớp 7', 'Lớp 8', 'Lớp 9', 'Lớp 10', 'Lớp 11', 'Lớp 12',
  'Đại Học', 'Thạc Sĩ', 'Giáo Sư', 'Ngẫu Nhiên',
]

function levelToAge(level: string): number {
  const map: Record<string, number> = {
    'Lớp 1': 6, 'Lớp 2': 7, 'Lớp 3': 8, 'Lớp 4': 9, 'Lớp 5': 10,
    'Lớp 6': 11, 'Lớp 7': 12, 'Lớp 8': 13, 'Lớp 9': 14,
    'Lớp 10': 15, 'Lớp 11': 16, 'Lớp 12': 17,
    'Đại Học': 22, 'Thạc Sĩ': 26, 'Giáo Sư': 35, 'Ngẫu Nhiên': 18,
  }
  return map[level] ?? 18
}

function levelIcon(level: string): string {
  if (level.startsWith('Lớp')) {
    const n = Number(level.replace('Lớp ', ''))
    if (n <= 5) return '📐'
    if (n <= 9) return '📊'
    return '📈'
  }
  const icons: Record<string, string> = {
    'Đại Học': '🎓', 'Thạc Sĩ': '🔬', 'Giáo Sư': '🧠', 'Ngẫu Nhiên': '🎲',
  }
  return icons[level] ?? '📝'
}

// ─── Roast Generator ────────────────────────────────────────
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function generateRoast(userAge: number, level: string): string {
  const levelAge = levelToAge(level)
  const diff = userAge - levelAge

  if (level === 'Ngẫu Nhiên') {
    return pickRandom([
      `${userAge} tuổi mà chọn Ngẫu Nhiên? Hay là không đủ tự tin chọn đúng trình độ của mình nên phải nhờ ông Trời xếp hộ?`,
      `Ngẫu Nhiên à? ${userAge} tuổi rồi mà không biết mình ở level nào thì cũng đáng lo đấy.`,
    ])
  }

  if (diff >= 10) {
    return pickRandom([
      `${userAge} tuổi đầu rồi mà chọn ${level}?! Lòng tự trọng của bạn rẻ hơn kẹo mút trường tiểu học. Già đầu đi tranh kẹo với con nít, nhục không?`,
      `Ôi trời ơi, ${userAge} tuổi chọn ${level}! Thế bạn đi thi đấu võ với trẻ sơ sinh cho oai luôn đi? Tự trọng của bạn đang nằm ở đáy Mariana Trench kìa.`,
      `${userAge} tuổi vs ${level}... Bạn là kiểu người đi siêu thị xin kẹo mẫu của nhân viên rồi vui cả ngày đúng không? Đáng thương thật sự.`,
      `Wao, ${userAge} tuổi chọn ${level}. Thế tối về bạn còn giành remote TV với em 3 tuổi không? Lòng tự trọng rớt giá thế sao?`,
    ])
  }

  if (diff >= 4) {
    return pickRandom([
      `${userAge} tuổi đầu mà chọn ${level} à? Hèn vừa thôi bạn ơi. Lớn rồi mà vẫn sợ toán cơ bản thì cũng hiểu sao cuộc đời khó khăn.`,
      `Hmm, ${userAge} tuổi → ${level}. Bạn thuộc team "an toàn là trên hết" đúng không? Sợ thất bại đến mức không dám thử thách à?`,
      `${userAge} tuổi chọn ${level}? Ít nhất cũng có tí liêm sỉ mà chọn đúng trình đi. Đây là game giải trí chứ không phải nơi bạn farming tự tin giả tạo.`,
    ])
  }

  if (diff < -5) {
    return pickRandom([
      `${userAge} tuổi mà dám chọn ${level}? Ngựa non háu đá! Chưa đỗ ông nghè đã đe hàng tổng. Ảo tưởng sức mạnh quá trời luôn.`,
      `Ủa, ${userAge} tuổi chọn ${level}? Bạn còn chưa biết chia cho 7 mà đòi leo lên đỉnh Olympus? Quay về thực tại đi nha.`,
      `${userAge} tuổi → ${level}?! Tự tin thế thì mở công ty luôn đi, ngồi đây làm gì? À quên, tự tin suông thì chỉ mở được quán nước mía thôi.`,
    ])
  }

  if (diff < 0) {
    return pickRandom([
      `${userAge} tuổi chọn ${level}? Có chút tham vọng đấy. Nhưng tham vọng mà không có thực lực thì gọi là... viển vông. Chúc may mắn!`,
      `Hơi liều lĩnh đấy. ${userAge} tuổi thôi mà chọn ${level}? Dũng cảm hay liều lĩnh đôi khi chỉ cách nhau bởi kết quả thôi.`,
    ])
  }

  return pickRandom([
    `${userAge} tuổi chọn ${level}? Đúng chuẩn bài vở nhỉ, an toàn kinh khủng. Kiểu người qua đường thấy vỏ chuối cũng đi vòng sang làn khác.`,
    `Ồ, ${userAge} tuổi đúng ${level} luôn. Chính xác tuyệt đối. Bạn là kiểu học sinh ngoan, không bao giờ nổi loạn, đúng không?`,
    `Hợp tuổi hợp lớp ghê. ${userAge} tuổi → ${level}. Bình thường đến đáng sợ. Nhưng yên tâm, game này sẽ rất vui.`,
  ])
}

// ─── Question Generation ────────────────────────────────────
const bossQuestion: Question = {
  text: 'Tính ∫₀^∞ e^(−x²) dx = ?',
  options: ['π', '√π / 2', '1/e', '∞'],
  correctIndex: 1,
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

function makeOptions(correct: number, spread: number): { options: string[]; correctIndex: number } {
  const opts = new Set<number>([correct])
  let attempts = 0
  while (opts.size < 4 && attempts < 80) {
    const offset = Math.floor(Math.random() * Math.max(spread * 2, 8)) - spread
    const v = correct + (offset === 0 ? (Math.random() > 0.5 ? 1 : -1) : offset)
    if (v >= 0 && v !== correct) opts.add(v)
    attempts++
  }
  let fill = 1
  while (opts.size < 4) {
    const candidate = correct + fill * 3
    if (candidate >= 0) opts.add(candidate)
    fill++
  }
  const arr = shuffle(Array.from(opts))
  return { options: arr.map(String), correctIndex: arr.indexOf(correct) }
}

function createQ(text: string, correct: number, spread: number): Question {
  const { options, correctIndex } = makeOptions(correct, spread)
  return { text, options, correctIndex }
}

function rng(max: number): number {
  return Math.floor(Math.random() * max)
}

function generateQuestions(level: string): Question[] {
  const actualLevel = level === 'Ngẫu Nhiên'
    ? levels[Math.floor(Math.random() * (levels.length - 1))]!
    : level
  const idx = levels.indexOf(actualLevel)
  const d = Math.max(idx, 0)

  const qs: Question[] = []

  // Q1-Q5: Easy, level-appropriate
  for (let i = 0; i < 5; i++) {
    const s = (d + 1) * (i + 1)
    qs.push(pickRandom([
      () => { const a = rng(s * 3) + 1, b = rng(s * 3) + 1; return createQ(`${a} + ${b} = ?`, a + b, s) },
      () => { const b = rng(s * 2) + 1, a = b + rng(s * 2) + 1; return createQ(`${a} − ${b} = ?`, a - b, s) },
      () => { const a = rng(Math.max(s, 4)) + 2, b = rng(Math.max(s, 3)) + 2; return createQ(`${a} × ${b} = ?`, a * b, Math.max(s, 3)) },
      () => { const b = rng(Math.max(s, 3)) + 2, c = rng(Math.max(s, 3)) + 1; return createQ(`${b * c} ÷ ${b} = ?`, c, Math.max(s, 3)) },
    ])())
  }

  // Q6-Q9: Dramatically harder
  for (let i = 0; i < 4; i++) {
    const s = (d + 6) * (i + 2)
    qs.push(pickRandom([
      () => { const a = rng(s * 2) + 10, b = rng(s * 2) + 10; return createQ(`${a} × ${b} = ?`, a * b, s * 3) },
      () => { const a = rng(Math.min(s, 20)) + 3; return createQ(`${a}² = ?`, a * a, Math.max(s, 8)) },
      () => { const a = rng(s * 2) + 5, b = rng(s) + 2, c = rng(s) + 1; return createQ(`${a} × ${b} + ${c} = ?`, a * b + c, s * 2) },
      () => { const a = rng(s * 2) + 5, b = rng(s) + 2, c = rng(s) + 1; return createQ(`${a} × ${b} − ${c} = ?`, a * b - c, s * 2) },
    ])())
  }

  // Q10: Boss — always university level
  qs.push(bossQuestion)
  return qs
}

// ─── Game State ─────────────────────────────────────────────
const questions = ref<Question[]>([])

const currentQuestion = computed(() => questions.value[currentQ.value] ?? null)
const isDarkMode = computed(() => currentQ.value >= 5 && screen.value === 'game')
const isBossMode = computed(() => currentQ.value === 9 && screen.value === 'game')
const timeLimit = computed(() => {
  if (currentQ.value >= 9) return 5
  if (currentQ.value >= 5) return 10
  return 0
})
const progressPercent = computed(() => (currentQ.value / 10) * 100)

// ─── Screen Transitions ─────────────────────────────────────
function goToIntro() {
  screen.value = 'intro'
  age.value = null
  selectedLevel.value = ''
  currentQ.value = 0
  score.value = 0
  shakeScreen.value = false
  selectedOption.value = null
  answeredWrong.value = false
  stopTimer()
}

function startGame() {
  if (!age.value || age.value < 1 || age.value > 120) return
  screen.value = 'level'
}

function selectLevel(level: string) {
  selectedLevel.value = level
  roastMsg.value = generateRoast(age.value ?? 18, level)
  screen.value = 'roast'
}

function startPlaying() {
  questions.value = generateQuestions(selectedLevel.value)
  currentQ.value = 0
  score.value = 0
  selectedOption.value = null
  answeredWrong.value = false
  screen.value = 'game'
  startTimerIfNeeded()
}

// ─── Timer ──────────────────────────────────────────────────
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function startTimerIfNeeded() {
  stopTimer()
  const limit = timeLimit.value
  if (limit <= 0) { timer.value = 0; return }
  timer.value = limit
  timerInterval = setInterval(() => {
    timer.value--
    if (timer.value <= 0) { stopTimer(); triggerGameOver() }
  }, 1000)
}

watch(currentQ, () => {
  if (screen.value === 'game') startTimerIfNeeded()
})

// ─── Answer Logic ───────────────────────────────────────────
function selectAnswer(idx: number) {
  if (selectedOption.value !== null) return
  selectedOption.value = idx
  const q = currentQuestion.value
  if (!q) return

  if (idx === q.correctIndex) {
    score.value++
    stopTimer()
    setTimeout(() => {
      if (currentQ.value >= 9) { screen.value = 'win'; return }
      currentQ.value++
      selectedOption.value = null
      answeredWrong.value = false
    }, 500)
  } else {
    answeredWrong.value = true
    stopTimer()
    setTimeout(() => triggerGameOver(), 700)
  }
}

function triggerGameOver() {
  stopTimer()
  const userAge = age.value ?? 0
  const q = currentQ.value + 1
  const lvl = selectedLevel.value

  gameOverMsg.value = pickRandom([
    `Nhục nhã! Đã ${userAge} tuổi đầu rồi mà không qua nổi câu ${q} của cái game ${lvl}. Đề nghị xé bằng tốt nghiệp!`,
    `${userAge} tuổi, ${q}/10 câu. Thành tích này mà đem khoe thì cả họ mất mặt luôn á. Về hỏi lại thầy cô có dạy bạn không?`,
    `Game Over! ${userAge} tuổi mà trượt ở câu ${q} — Toán ${lvl}. Einstein vừa lật mình trong mộ. Tổ tiên cũng đang lắc đầu.`,
    `Thua rồi! ${userAge} tuổi không qua nổi câu ${q}. Bạn nên chuyển sang ngành không cần tính toán. À khoan, ngành nào cũng cần. RIP.`,
  ])
  shakeScreen.value = true
  screen.value = 'gameover'
  setTimeout(() => { shakeScreen.value = false }, 800)
}

// ─── Option Styling ─────────────────────────────────────────
function optionClass(idx: number): string {
  const q = currentQuestion.value
  if (!q) return ''

  const normalBase = 'border border-border-default bg-bg-surface text-text-primary'
  const darkBase = 'border border-red-900/50 bg-red-950/30 text-red-100'
  const base = isDarkMode.value ? darkBase : normalBase

  if (selectedOption.value === null) {
    return isDarkMode.value
      ? `${base} hover:border-red-500 hover:bg-red-900/40 cursor-pointer`
      : `${base} hover:border-accent-coral hover:bg-bg-elevated cursor-pointer`
  }

  if (idx === q.correctIndex) {
    return 'border border-emerald-500 bg-emerald-500/20 text-emerald-300'
  }
  if (idx === selectedOption.value && idx !== q.correctIndex) {
    return 'border border-red-500 bg-red-500/20 text-red-300 animate-wrong'
  }
  return `${base} opacity-40`
}
</script>

<template>
  <div
    class="min-h-screen font-body transition-all duration-700 relative"
    :class="[
      screen === 'gameover' ? 'bg-red-950' : isDarkMode ? 'bg-gray-950' : 'bg-bg-deep',
      shakeScreen ? 'animate-shake' : '',
    ]"
  >
    <!-- ═══════════════════════════════════════════════════════
         SCREEN 1 — INTRO
         ═══════════════════════════════════════════════════════ -->
    <div
      v-if="screen === 'intro'"
      class="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6"
    >
      <div class="w-full max-w-lg animate-fade-up">
        <!-- Header -->
        <div class="text-center mb-10">
          <div
            class="inline-block bg-accent-coral text-bg-deep font-display font-bold
                   text-xs tracking-widest px-3 py-1.5 rotate-2 mb-5"
          >
            MATH CHALLENGE
          </div>
          <h1 class="font-display text-5xl sm:text-6xl font-bold text-text-primary tracking-tight">
            Giải Toán<br><span class="text-accent-coral">Vui</span>
          </h1>
          <p class="text-text-secondary mt-4 text-sm sm:text-base max-w-sm mx-auto">
            Kiểm tra trình độ toán học từ Lớp 1 đến Giáo Sư. Bạn sẽ vượt qua được bao nhiêu câu?
          </p>
        </div>

        <!-- Age Input Card -->
        <div class="border border-border-default bg-bg-surface p-6 sm:p-8 animate-fade-up animate-delay-2">
          <div class="flex items-center gap-3 mb-5">
            <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
            <span class="font-display text-sm font-semibold text-text-primary tracking-wide">Thông tin người chơi</span>
          </div>

          <label class="block mb-2 text-text-secondary text-sm">
            Tuổi của bạn
          </label>
          <input
            v-model.number="age"
            type="number"
            min="1"
            max="120"
            placeholder="VD: 25"
            class="w-full bg-bg-deep border border-border-default px-4 py-3 text-text-primary
                   font-body text-base outline-none transition-colors
                   focus:border-accent-coral placeholder:text-text-dim"
            @keyup.enter="startGame"
          >

          <button
            :disabled="!age || age < 1 || age > 120"
            class="mt-6 w-full border border-accent-coral bg-accent-coral/10 px-5 py-3
                   font-display text-sm font-semibold tracking-wider text-accent-coral
                   transition-all duration-300
                   hover:bg-accent-coral hover:text-bg-deep
                   disabled:opacity-30 disabled:cursor-not-allowed
                   disabled:hover:bg-accent-coral/10 disabled:hover:text-accent-coral"
            @click="startGame"
          >
            TIẾP TỤC →
          </button>
        </div>

        <!-- Back to home -->
        <div class="mt-8 text-center animate-fade-up animate-delay-3">
          <RouterLink
            to="/"
            class="text-text-secondary text-sm link-underline inline-flex items-center gap-1.5"
          >
            &larr; Về trang chủ
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         SCREEN 2 — LEVEL SELECT
         ═══════════════════════════════════════════════════════ -->
    <div
      v-if="screen === 'level'"
      class="min-h-screen flex flex-col items-center px-4 sm:px-6 py-12"
    >
      <div class="w-full max-w-2xl">
        <div class="text-center mb-10 animate-fade-up">
          <h2 class="font-display text-2xl sm:text-3xl font-semibold text-text-primary flex items-center justify-center gap-3">
            <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
            Chọn cấp độ
          </h2>
          <p class="text-text-secondary text-sm mt-3">
            Hãy chọn trình độ phù hợp với bạn. Mỗi cấp có 10 câu hỏi.
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up animate-delay-2">
          <button
            v-for="lvl in levels"
            :key="lvl"
            class="border border-border-default bg-bg-surface p-4
                   font-display text-sm font-semibold text-text-primary
                   transition-all duration-300 text-left
                   hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated
                   hover:shadow-lg hover:shadow-accent-coral/5
                   flex items-center gap-3"
            :class="lvl === 'Ngẫu Nhiên'
              ? 'sm:col-span-2 lg:col-span-3 justify-center border-accent-amber/30 hover:border-accent-amber hover:shadow-accent-amber/5'
              : ''"
            @click="selectLevel(lvl)"
          >
            <span class="text-lg">{{ levelIcon(lvl) }}</span>
            <span :class="lvl === 'Ngẫu Nhiên' ? 'text-accent-amber' : ''">{{ lvl }}</span>
          </button>
        </div>

        <div class="mt-10 text-center animate-fade-up animate-delay-3">
          <button
            class="text-text-dim text-xs font-display tracking-wide
                   hover:text-text-secondary transition-colors"
            @click="goToIntro"
          >
            &larr; Quay lại
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         SCREEN 3 — ROAST
         ═══════════════════════════════════════════════════════ -->
    <div
      v-if="screen === 'roast'"
      class="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6"
    >
      <div class="w-full max-w-lg animate-fade-up">
        <div class="border border-accent-coral bg-bg-surface p-6 sm:p-8 relative">
          <!-- Decorative background mark -->
          <span
            class="absolute top-3 right-4 font-display text-6xl font-bold
                   text-accent-coral/5 select-none pointer-events-none"
          >
            !?
          </span>

          <div class="flex items-center gap-3 mb-4">
            <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
            <span class="font-display text-sm font-semibold text-text-primary tracking-wide">Nhận xét</span>
          </div>

          <p class="text-text-primary leading-relaxed text-sm sm:text-base">
            {{ roastMsg }}
          </p>

          <div class="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              class="flex-1 border border-border-default bg-bg-elevated px-4 py-3
                     font-display text-xs font-semibold tracking-wide text-text-secondary
                     transition-all duration-300
                     hover:border-accent-sky hover:text-text-primary"
              @click="screen = 'level'"
            >
              Nhục quá, chọn lại
            </button>
            <button
              class="flex-1 border border-accent-coral bg-accent-coral/10 px-4 py-3
                     font-display text-xs font-semibold tracking-wide text-accent-coral
                     transition-all duration-300
                     hover:bg-accent-coral hover:text-bg-deep"
              @click="startPlaying"
            >
              Sợ quái gì, chơi tiếp
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         SCREEN 4 — GAMEPLAY
         ═══════════════════════════════════════════════════════ -->
    <div
      v-if="screen === 'game' && currentQuestion"
      class="min-h-screen flex flex-col px-4 sm:px-6 py-8 transition-all duration-700"
    >
      <div class="w-full max-w-xl mx-auto flex flex-col flex-1">
        <!-- Top Bar -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-3">
            <span
              class="font-display text-xs tracking-widest"
              :class="isDarkMode ? 'text-red-400' : 'text-accent-amber'"
            >
              // Câu {{ currentQ + 1 }} / 10
            </span>

            <div class="flex items-center gap-3">
              <span
                class="font-display text-xs tracking-wide"
                :class="isDarkMode ? 'text-red-400/50' : 'text-text-dim'"
              >
                {{ selectedLevel }}
              </span>
              <span
                v-if="timeLimit > 0"
                class="font-display text-sm font-bold tabular-nums"
                :class="timer <= 3 ? 'text-red-400 animate-pulse' : isDarkMode ? 'text-red-300' : 'text-accent-coral'"
              >
                {{ timer }}s
              </span>
            </div>
          </div>

          <!-- Progress bar -->
          <div
            class="h-0.5 w-full"
            :class="isDarkMode ? 'bg-red-950' : 'bg-border-default'"
          >
            <div
              class="h-full transition-all duration-500 ease-out"
              :class="isDarkMode ? 'bg-red-500' : 'bg-accent-coral'"
              :style="{ width: `${progressPercent}%` }"
            />
          </div>
        </div>

        <!-- Question Card -->
        <div
          class="p-6 sm:p-8 mb-8 transition-all duration-500 relative overflow-hidden"
          :class="[
            isBossMode
              ? 'border-2 border-red-500 bg-red-950/60'
              : isDarkMode
                ? 'border border-red-900/50 bg-gray-900/80'
                : 'border border-border-default bg-bg-surface',
          ]"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <p
                v-if="isBossMode"
                class="text-[10px] font-display tracking-widest text-red-400 mb-3 uppercase"
              >
                Câu hỏi cuối cùng
              </p>
              <p
                v-else-if="isDarkMode"
                class="text-[10px] font-display tracking-widest text-red-400/60 mb-3"
              >
                Thời gian giới hạn
              </p>

              <h3
                class="font-display text-lg sm:text-xl font-bold leading-relaxed"
                :class="isDarkMode ? 'text-red-100' : 'text-text-primary'"
              >
                {{ currentQuestion.text }}
              </h3>
            </div>

            <!-- Question number watermark -->
            <span
              class="font-display text-5xl font-bold select-none pointer-events-none shrink-0"
              :class="isDarkMode ? 'text-red-500/5' : 'text-accent-amber/5'"
            >
              {{ String(currentQ + 1).padStart(2, '0') }}
            </span>
          </div>
        </div>

        <!-- Options -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <button
            v-for="(opt, idx) in currentQuestion.options"
            :key="idx"
            :class="optionClass(idx)"
            class="p-4 font-display text-base font-semibold text-center
                   transition-all duration-200"
            :disabled="selectedOption !== null"
            @click="selectAnswer(idx)"
          >
            <span
              class="mr-2 text-xs font-normal opacity-40"
            >{{ ['A', 'B', 'C', 'D'][idx] }}.</span>{{ opt }}
          </button>
        </div>

        <!-- Score -->
        <div class="mt-auto pt-4 text-center">
          <span
            class="font-display text-xs tracking-widest"
            :class="isDarkMode ? 'text-red-400/40' : 'text-text-dim'"
          >
            Điểm: {{ score }}
          </span>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         SCREEN 5 — GAME OVER
         ═══════════════════════════════════════════════════════ -->
    <div
      v-if="screen === 'gameover'"
      class="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6"
    >
      <div class="w-full max-w-lg text-center animate-fade-up">
        <div class="text-6xl sm:text-7xl mb-6 animate-bounce-slow select-none">
          💀
        </div>

        <h2 class="font-display text-3xl sm:text-4xl font-bold text-red-400 mb-2">
          GAME OVER
        </h2>

        <div class="border border-red-800 bg-red-950/50 p-6 sm:p-8 mt-6 mb-8">
          <p class="text-red-200 leading-relaxed text-sm sm:text-base">
            {{ gameOverMsg }}
          </p>

          <div
            class="mt-5 pt-4 border-t border-red-800/40
                   flex items-center justify-center gap-4
                   text-xs font-display tracking-wide text-red-400/50"
          >
            <span>{{ age }} tuổi</span>
            <span class="w-1 h-1 rounded-full bg-red-400/30" />
            <span>{{ selectedLevel }}</span>
            <span class="w-1 h-1 rounded-full bg-red-400/30" />
            <span>{{ score }}/10</span>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            class="border border-red-700 bg-red-900/40 px-6 py-3
                   font-display text-sm font-semibold tracking-wide text-red-300
                   transition-all duration-300
                   hover:bg-red-700 hover:text-white"
            @click="startPlaying"
          >
            Chơi lại
          </button>
          <button
            class="border border-red-800/50 px-6 py-3
                   font-display text-xs tracking-wide text-red-400/50
                   transition-all duration-300
                   hover:border-red-600 hover:text-red-300"
            @click="goToIntro"
          >
            Về đầu
          </button>
        </div>

        <div class="mt-8">
          <RouterLink
            to="/"
            class="text-red-400/30 text-xs font-display tracking-wide
                   hover:text-red-300 transition-colors"
          >
            &larr; Về trang chủ
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         SCREEN 6 — WIN
         ═══════════════════════════════════════════════════════ -->
    <div
      v-if="screen === 'win'"
      class="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 bg-bg-deep"
    >
      <div class="w-full max-w-lg text-center animate-fade-up">
        <div class="text-6xl sm:text-7xl mb-6 select-none">🏆</div>

        <h2 class="font-display text-3xl sm:text-4xl font-bold text-accent-amber mb-2">
          Hoàn thành!
        </h2>

        <div class="border border-accent-amber bg-bg-surface p-6 sm:p-8 mt-6 mb-8">
          <p class="text-text-primary leading-relaxed text-sm sm:text-base">
            {{ age }} tuổi, vượt qua 10/10 câu {{ selectedLevel }} — kể cả câu trùm cuối toán đại học.
            Hoặc bạn là thiên tài, hoặc bạn Google. Dù sao cũng xin chúc mừng.
          </p>

          <div
            class="mt-5 pt-4 border-t border-accent-amber/20
                   flex items-center justify-center gap-4
                   text-xs font-display tracking-wide text-accent-amber/60"
          >
            <span>{{ age }} tuổi</span>
            <span class="w-1 h-1 rounded-full bg-accent-amber/30" />
            <span>{{ selectedLevel }}</span>
            <span class="w-1 h-1 rounded-full bg-accent-amber/30" />
            <span>10/10</span>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            class="border border-accent-amber bg-accent-amber/10 px-6 py-3
                   font-display text-sm font-semibold tracking-wide text-accent-amber
                   transition-all duration-300
                   hover:bg-accent-amber hover:text-bg-deep"
            @click="goToIntro"
          >
            Chơi lại
          </button>
          <RouterLink
            to="/"
            class="border border-border-default px-6 py-3
                   font-display text-sm tracking-wide text-text-secondary
                   transition-all duration-300
                   hover:border-accent-coral hover:text-text-primary inline-block"
          >
            &larr; Về trang chủ
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
  20%, 40%, 60%, 80% { transform: translateX(6px); }
}

@keyframes wrong-flash {
  0% { background-color: rgba(239, 68, 68, 0.3); }
  50% { background-color: rgba(239, 68, 68, 0.1); }
  100% { background-color: rgba(239, 68, 68, 0.3); }
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

.animate-shake {
  animation: shake 0.6s ease-in-out;
}

.animate-wrong {
  animation: wrong-flash 0.4s ease-in-out 2;
}

.animate-bounce-slow {
  animation: bounce-slow 2s ease-in-out infinite;
}

input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type='number'] {
  -moz-appearance: textfield;
}
</style>
