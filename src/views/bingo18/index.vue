<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'

// ── Types ──────────────────────────────────────────────
interface BetEntry {
  type: BetType
  value: string
  amount: number
  odds: number
  label: string
}

type BetType = 'single' | 'double' | 'triple' | 'tripleAny' | 'sum' | 'lhn'
type LHN = 'Lớn' | 'Hòa' | 'Nhỏ'

interface DrawResult {
  nums: [number, number, number]
  sum: number
  lhn: LHN
}

// ── Constants ──────────────────────────────────────────
const ROUND_SECONDS = 180
const INITIAL_POINTS = 100

const SINGLE_ODDS: Record<number, number> = { 3: 120, 4: 40, 5: 20, 6: 12, 7: 8, 8: 5.5, 9: 4.7, 10: 4.4 }
const DOUBLE_ODDS = 7.5
const TRIPLE_ODDS = 120
const SUM_ODDS: Record<number, number> = {
  3: 120, 4: 40, 5: 20, 6: 12, 7: 8, 8: 5.5, 9: 4.7, 10: 4.4,
  11: 4.4, 12: 4.7, 13: 5.5, 14: 8, 15: 12, 16: 20, 17: 40, 18: 120,
}
const LHN_ODDS: Record<LHN, number> = { Nhỏ: 1.5, Hòa: 2, Lớn: 1.5 }

// ── State ──────────────────────────────────────────────
const points = ref<number>(INITIAL_POINTS)
const betAmount = ref<number>(1)
const bets = ref<BetEntry[]>([])
const result = ref<DrawResult | null>(null)
const history = ref<{ result: DrawResult; won: number; lost: number }[]>([])
const timeLeft = ref<number>(ROUND_SECONDS)
const isDrawing = ref<boolean>(false)
const tab = ref<'basic' | 'sum'>('basic')
const toast = ref<string>('')
const selectedSingle = ref<number | null>(null)
const selectedDouble = ref<number | null>(null)
const selectedTriple = ref<number | null>(null)
const selectedSum = ref<number | null>(null)
const selectedLHN = ref<LHN | null>(null)

// ── Timer ──────────────────────────────────────────────
const timer = setInterval(() => {
  if (timeLeft.value <= 0) {
    draw()
    timeLeft.value = ROUND_SECONDS
  } else {
    timeLeft.value--
  }
}, 1000)

onUnmounted(() => clearInterval(timer))

// ── Computed ───────────────────────────────────────────
const totalBet = computed(() =>
  bets.value.reduce((s, b) => s + b.amount, 0),
)

const timerColor = computed(() => {
  if (timeLeft.value <= 10) return 'text-red-400'
  if (timeLeft.value <= 30) return 'text-yellow-400'
  return 'text-green-400'
})

const timerDisplay = computed(() => {
  const m = Math.floor(timeLeft.value / 60).toString().padStart(2, '0')
  const s = (timeLeft.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

// ── Helpers ────────────────────────────────────────────
function showToast(msg: string): void {
  toast.value = msg
  setTimeout(() => (toast.value = ''), 2500)
}

function randNum(): number {
  return Math.floor(Math.random() * 6) + 1
}

function calcLHN(sum: number): LHN {
  if (sum <= 9) return 'Nhỏ'
  if (sum <= 11) return 'Hòa'
  return 'Lớn'
}

// ── Bet actions ────────────────────────────────────────
function addBet(entry: Omit<BetEntry, 'amount'>): void {
  const amount = betAmount.value
  if (amount < 1) { showToast('Số điểm cược tối thiểu là 1'); return }
  if (amount > points.value) { showToast('Không đủ J2-Point'); return }
  // Gộp nếu đã có cùng loại + giá trị
  const existing = bets.value.find(b => b.type === entry.type && b.value === entry.value)
  if (existing) {
    existing.amount += amount
  } else {
    bets.value.push({ ...entry, amount })
  }
  showToast(`Đã đặt ${amount} điểm vào "${entry.label}"`)
}

function removeBet(index: number): void {
  bets.value.splice(index, 1)
}

function clearBets(): void {
  bets.value = []
  selectedSingle.value = null
  selectedDouble.value = null
  selectedTriple.value = null
  selectedSum.value = null
  selectedLHN.value = null
}

// ── Bet helpers ────────────────────────────────────────
function betSingle(n: number): void {
  selectedSingle.value = n
  addBet({ type: 'single', value: String(n), odds: SINGLE_ODDS[n] ?? 4.4, label: `Số ${n}` })
}

function betDouble(n: number): void {
  selectedDouble.value = n
  addBet({ type: 'double', value: String(n), odds: DOUBLE_ODDS, label: `Đôi ${n}${n}` })
}

function betTriple(n: number): void {
  selectedTriple.value = n
  addBet({ type: 'triple', value: String(n), odds: TRIPLE_ODDS, label: `Ba ${n}${n}${n}` })
}

function betSum(n: number): void {
  selectedSum.value = n
  addBet({ type: 'sum', value: String(n), odds: SUM_ODDS[n] ?? 4.4, label: `Tổng ${n}` })
}

function betLHN(v: LHN): void {
  selectedLHN.value = v
  addBet({ type: 'lhn', value: v, odds: LHN_ODDS[v], label: v })
}

// ── Draw ───────────────────────────────────────────────
function draw(): void {
  if (bets.value.length === 0) {
    result.value = null
    return
  }

  isDrawing.value = true

  setTimeout(() => {
    const nums: [number, number, number] = [randNum(), randNum(), randNum()]
    const sum = nums[0] + nums[1] + nums[2]
    const lhn = calcLHN(sum)
    const drawResult: DrawResult = { nums, sum, lhn }
    result.value = drawResult

    let won = 0
    let lost = 0

    for (const bet of bets.value) {
      const win = checkWin(bet, drawResult)
      if (win) {
        won += Math.floor(bet.amount * bet.odds)
      } else {
        lost += bet.amount
      }
    }

    points.value = points.value - lost + won
    if (points.value < 0) points.value = 0

    history.value.unshift({ result: drawResult, won, lost })
    if (history.value.length > 10) history.value.pop()

    clearBets()
    isDrawing.value = false
  }, 800)
}

function checkWin(bet: BetEntry, r: DrawResult): boolean {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  r.nums.forEach(n => { counts[n] = (counts[n] ?? 0) + 1 })

  if (bet.type === 'single') {
    const n = Number(bet.value)
    return r.nums.includes(n)
  }
  if (bet.type === 'double') {
    const n = Number(bet.value)
    return (counts[n] ?? 0) >= 2
  }
  if (bet.type === 'triple') {
    const n = Number(bet.value)
    return counts[n] === 3
  }
  if (bet.type === 'tripleAny') {
    return Object.values(counts).some(c => c === 3)
  }
  if (bet.type === 'sum') {
    return r.sum === Number(bet.value)
  }
  if (bet.type === 'lhn') {
    return r.lhn === bet.value
  }
  return false
}

function manualDraw(): void {
  if (isDrawing.value) return
  draw()
  timeLeft.value = ROUND_SECONDS
}
</script>

<template>
  <div class="min-h-screen bg-[#068603] text-white font-sans pb-32">
    <!-- Header -->
    <div class="bg-[#068603] px-4 py-3 flex items-center justify-between">
      <a href="/" class="text-sm text-green-300 hover:text-white transition-colors">← Trang chủ</a>
      <h1 class="text-lg font-bold text-yellow-400">🎱 Bingo 18</h1>
      <div class="text-sm font-semibold text-yellow-300">
        💎 {{ points.toLocaleString('vi-VN') }} J2-Point
      </div>
    </div>

    <!-- Timer + Draw -->
    <div class="flex items-center justify-between px-4 py-2 bg-[#0f3d18]">
      <div class="text-sm text-gray-300">Kỳ tiếp theo:</div>
      <div :class="['text-2xl font-mono font-bold', timerColor]">{{ timerDisplay }}</div>
      <button
        class="bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        :disabled="isDrawing"
        @click="manualDraw"
      >
        Quay ngay
      </button>
    </div>

    <!-- Kết quả -->
    <div v-if="result" class="mx-4 mt-3 bg-[#14491f] rounded-xl p-3">
      <div class="text-center text-xs text-gray-400 mb-2">Kết quả kỳ vừa quay</div>
      <div class="flex justify-center gap-3 mb-2">
        <div
          v-for="(n, i) in result.nums"
          :key="i"
          class="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center text-xl font-bold text-black shadow-lg"
        >
          {{ n }}
        </div>
      </div>
      <div class="text-center text-sm">
        Tổng: <span class="font-bold text-yellow-400">{{ result.sum }}</span>
        &nbsp;·&nbsp;
        <span
          :class="{
            'text-red-400': result.lhn === 'Lớn',
            'text-yellow-400': result.lhn === 'Hòa',
            'text-blue-400': result.lhn === 'Nhỏ',
          }"
          class="font-bold"
        >{{ result.lhn }}</span>
      </div>
      <div v-if="history[0]" class="text-center text-xs mt-1">
        <span v-if="history[0].won > 0" class="text-green-400">+{{ history[0].won }} điểm</span>
        <span v-if="history[0].lost > 0" class="text-red-400 ml-2">-{{ history[0].lost }} điểm</span>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex mx-4 mt-4 rounded-xl overflow-hidden border border-green-700">
      <button
        :class="['flex-1 py-2 text-sm font-semibold transition-colors', tab === 'basic' ? 'bg-green-600 text-white' : 'bg-[#14491f] text-green-300']"
        @click="tab = 'basic'"
      >
        Cơ bản
      </button>
      <button
        :class="['flex-1 py-2 text-sm font-semibold transition-colors', tab === 'sum' ? 'bg-green-600 text-white' : 'bg-[#14491f] text-green-300']"
        @click="tab = 'sum'"
      >
        Cộng tổng / LHN
      </button>
    </div>

    <!-- Wrapper giới hạn chiều rộng -->
    <div class="max-w-md mx-auto">

      <!-- Tab: Cơ bản -->
      <div v-if="tab === 'basic'" class="px-4 mt-3 space-y-4">
        <!-- 1 số -->
        <div class="bg-[#14491f] rounded-xl p-3">
          <div class="text-xs text-gray-400 mb-2 text-center">1 số · 1 số x1.2 | 2 số x2 | 3 số x3</div>
          <div class="flex justify-between gap-2">
            <button
              v-for="n in 6"
              :key="n"
              :class="['w-12 h-12 rounded-full flex flex-col items-center justify-center text-base font-bold border-2 transition-all flex-shrink-0',
        selectedSingle === n ? 'bg-yellow-400 text-black border-yellow-300' : 'bg-[#1e6b30] text-white border-green-600 hover:border-yellow-400']"
              @click="betSingle(n)"
            >
              <span>{{ n }}</span>
              <span class="text-[9px] font-normal opacity-70">x{{ SINGLE_ODDS[n] ?? 4.4 }}</span>
            </button>
          </div>
        </div>

        <!-- 2 số trùng -->
        <div class="flex justify-between gap-2">
          <button
            v-for="n in 6"
            :key="n"
            :class="['w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all flex-shrink-0',
      selectedDouble === n ? 'bg-yellow-400 text-black border-yellow-300' : 'bg-[#1e6b30] text-white border-green-600 hover:border-yellow-400']"
            @click="betDouble(n)"
          >
            {{ n }}{{ n }}
          </button>
        </div>

        <!-- 3 số trùng -->
        <div class="flex justify-between gap-2">
          <button
            v-for="n in 6"
            :key="n"
            :class="['w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all flex-shrink-0',
      selectedTriple === n ? 'bg-yellow-400 text-black border-yellow-300' : 'bg-[#1e6b30] text-white border-green-600 hover:border-yellow-400']"
            @click="betTriple(n)"
          >
            {{ n }}{{ n }}{{ n }}
          </button>
        </div>
      </div>

      <!-- Tab: Cộng tổng / LHN -->
      <div v-if="tab === 'sum'" class="px-4 mt-3 space-y-4">
        <!-- LHN -->
        <div class="bg-[#14491f] rounded-xl p-3">
          <div class="text-xs text-gray-400 mb-2 text-center">Lớn / Hòa / Nhỏ</div>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="opt in (['Nhỏ', 'Hòa', 'Lớn'] as LHN[])"
              :key="opt"
              :class="['py-3 rounded-xl border-2 text-sm font-bold transition-all',
                selectedLHN === opt ? 'bg-yellow-400 text-black border-yellow-300' : 'bg-[#1e6b30] text-white border-green-600 hover:border-yellow-400']"
              @click="betLHN(opt)"
            >
              <div>{{ opt }}</div>
              <div class="text-xs opacity-70">
                {{ opt === 'Nhỏ' ? '3-9' : opt === 'Hòa' ? '10-11' : '12-18' }}
                · x{{ LHN_ODDS[opt] }}
              </div>
            </button>
          </div>
        </div>

        <!-- Cộng tổng -->
        <div class="bg-[#14491f] rounded-xl p-3">
          <div class="text-xs text-gray-400 mb-2 text-center">Cộng tổng (3 – 18)</div>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="n in 16"
              :key="n + 2"
              :class="['py-2 rounded-xl border-2 text-sm font-bold transition-all',
                selectedSum === n + 2 ? 'bg-yellow-400 text-black border-yellow-300' : 'bg-[#1e6b30] text-white border-green-600 hover:border-yellow-400']"
              @click="betSum(n + 2)"
            >
              {{ n + 2 }}
              <span class="block text-[9px] opacity-70">x{{ SUM_ODDS[n + 2] }}</span>
            </button>
          </div>
        </div>
      </div>

    </div><!-- end max-w-md -->

    <!-- Footer cược -->
    <div class="fixed bottom-0 left-0 right-0 bg-[#0f3d18] border-t border-green-700 px-4 py-3 footer-transparent">
      <div class="max-w-md mx-auto">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xs text-gray-400 whitespace-nowrap">Điểm cược:</span>
          <input
            v-model.number="betAmount"
            type="number"
            min="1"
            :max="points"
            class="flex-1 bg-[#14491f] border border-green-600 rounded-lg px-3 py-1.5 text-sm text-white text-center focus:outline-none focus:border-yellow-400"
          />
          <button class="text-xs bg-green-700 px-2 py-1.5 rounded-lg" @click="betAmount = Math.floor(points / 2)">1/2</button>
          <button class="text-xs bg-green-700 px-2 py-1.5 rounded-lg" @click="betAmount = points">MAX</button>
        </div>

        <div v-if="bets.length > 0" class="flex gap-2 overflow-x-auto pb-1 mb-2">
          <div
            v-for="(bet, i) in bets"
            :key="i"
            class="flex-shrink-0 bg-yellow-900 border border-yellow-600 rounded-lg px-2 py-1 text-xs flex items-center gap-1"
          >
            <span>{{ bet.label }} · {{ bet.amount }}đ</span>
            <button class="text-red-400 ml-1" @click="removeBet(i)">✕</button>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            class="flex-1 py-2 rounded-xl bg-gray-700 text-sm font-semibold hover:bg-gray-600 transition-colors"
            @click="clearBets"
          >
            Chọn lại
          </button>
          <button
            class="flex-1 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold transition-colors disabled:opacity-50"
            :disabled="bets.length === 0 || isDrawing"
            @click="manualDraw"
          >
            Xác nhận ({{ totalBet }} điểm)
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <Transition name="fade">
      <div
        v-if="toast"
        class="fixed top-16 left-1/2 -translate-x-1/2 bg-black/80 text-black text-sm px-4 py-2 rounded-xl z-50 whitespace-nowrap bg-yellow-400"
      >
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.bg-\[#1a5c2a\] { background: #1a5c2a; }
.bg-\[#14491f\] { background: #14491f; }
.bg-\[#0f3d18\] { background: #0f3d18; }
.bg-\[#1e6b30\] { background: #1e6b30; }
.border-\[\#166534\] { border-color: #166534; }
.border-\[\#16a34a\] { border-color: #16a34a; }

.hover\:border-yellow-400:hover { border-color: #facc15; }

.bg-yellow-400 { background: #facc15; }
.bg-yellow-500 { background: #eab308; }
.bg-yellow-900 { background: #713f12; }
.border-yellow-300 { border-color: #fde047; }
.border-yellow-400 { border-color: #facc15; }
.border-yellow-600 { border-color: #ca8a04; }

.text-yellow-300 { color: #fde047; }
.text-yellow-400 { color: #facc15; }

.text-green-300 { color: #86efac; }
.text-green-400 { color: #4ade80; }
.bg-green-600 { background: #16a34a; }
.bg-green-700 { background: #15803d; }
.border-green-600 { border-color: #16a34a; }
.border-green-700 { border-color: #15803d; }

.text-red-400 { color: #f87171; }
.text-blue-400 { color: #60a5fa; }
.bg-gray-700 { background: #374151; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.footer-transparent {
  background: rgba(21, 128, 61, 0.7);
}

.bg-yellow-900 { background: #facc15; }
.border-yellow-600 { border-color: #ca8a04; color: #000; }
</style>
