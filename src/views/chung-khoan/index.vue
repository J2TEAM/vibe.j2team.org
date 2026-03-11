<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// --- TYPES ---
interface Player {
  name: string
  totalValue: number
  level: string
  skill: number
  isUser?: boolean
}
interface Stock {
  symbol: string
  name: string
  price: number
  change: number
}
interface PortfolioItem {
  symbol: string
  amount: number
  buyPrice: number
  currentPrice: number
}
interface Candle {
  open: number
  close: number
  high: number
  low: number
  x?: number
}
interface MiningItem {
  type: 'diamond' | 'gold' | 'bronze'
  baseVal: number
}

// --- STATE ---
const currentView = ref<'Lobby' | 'Market' | 'Mining' | 'Crushing'>('Lobby')
const userProfile = ref({ name: '' })
const balance = ref(9999)
const tradeAmount = ref(1)
const portfolio = ref<PortfolioItem[]>([])
const hoveredCandle = ref<Candle | null>(null)

// --- MINIGAME STATE ---
const hookAngle = ref(0)
const hookLength = ref(20)
const isHookMoving = ref(false)
const isRetracting = ref(false)
const currentLoot = ref<MiningItem | null>(null)
const hitCount = ref(0)
const moneyNotes = ref<{ id: number; x: number; y: number; val: number }[]>([])

// --- 10 WORLDWIDE STOCKS ---
const stocks = ref<Stock[]>([
  { symbol: 'BTC', name: 'Bitcoin', price: 65000, change: 0 },
  { symbol: 'NVDA', name: 'Nvidia Corp', price: 900, change: 0 },
  { symbol: 'GOLD', name: 'Gold Spot', price: 2150, change: 0 },
  { symbol: 'ETH', name: 'Ethereum', price: 3500, change: 0 },
  { symbol: 'AAPL', name: 'Apple Inc', price: 175, change: 0 },
  { symbol: 'TSLA', name: 'Tesla Inc', price: 170, change: 0 },
  { symbol: 'OIL', name: 'Crude Oil', price: 80, change: 0 },
  { symbol: 'MSFT', name: 'Microsoft', price: 420, change: 0 },
  { symbol: 'DOGE', name: 'Dogecoin', price: 0.15, change: 0 },
  { symbol: 'XAU', name: 'Vàng SJC', price: 80, change: 0 },
])

// FIX DÒNG 41: Dùng dấu ! để khẳng định với TS là không bao giờ bị undefined
const selectedStock = ref<Stock>(stocks.value[0]!)
const candleData = ref<Candle[]>([])

// --- 10 BOTS ---
const bots = ref<Player[]>([
  { name: 'Con Nghiện Game', totalValue: 500, level: 'Dễ', skill: -0.2 },
  { name: 'Trader Tập Sự', totalValue: 5000, level: 'Dễ', skill: -0.05 },
  { name: 'KOL Tài Chính', totalValue: 15000, level: 'Trung bình', skill: 0.02 },
  { name: 'Cá Lòng Tong', totalValue: 50000, level: 'Trung bình', skill: 0.05 },
  { name: 'Quỹ Đầu Tư', totalValue: 200000, level: 'Khó', skill: 0.1 },
  { name: 'Michael Saylor', totalValue: 500000, level: 'Khó', skill: 0.15 },
  { name: 'Con Bạc', totalValue: 1200000, level: 'Huyền thoại', skill: 0.18 },
  { name: 'Cá Voi Crypto', totalValue: 3000000, level: 'Huyền thoại', skill: 0.22 },
  { name: 'Elon Musk', totalValue: 10000000, level: 'Thần thánh', skill: 0.25 },
  { name: 'AI Hủy Diệt', totalValue: 50000000, level: 'Vô cực', skill: 0.35 },
])

// --- COMPUTED ---
const userTotalValue = computed(() => {
  const stockValue = portfolio.value.reduce((acc, item) => acc + item.amount * item.currentPrice, 0)
  return balance.value + stockValue
})
const leaderboard = computed(() => {
  const user: Player = {
    name: `${userProfile.value.name} (You)`,
    totalValue: userTotalValue.value,
    level: 'Investor',
    skill: 0,
    isUser: true,
  }
  return [...bots.value, user].sort((a, b) => b.totalValue - a.totalValue)
})
const currentStockHolding = computed(
  () => portfolio.value.find((p) => p.symbol === selectedStock.value.symbol)?.amount || 0,
)

// --- MINIGAME LOGIC: BLIND BOX ---
const throwHook = () => {
  if (isHookMoving.value) return
  isHookMoving.value = true
  isRetracting.value = false

  const extendInterval = setInterval(() => {
    hookLength.value += 12
    if (hookLength.value > 480) {
      clearInterval(extendInterval)
      pickRandomLoot()
    }
  }, 20)
}

const pickRandomLoot = () => {
  isRetracting.value = true
  const lootPool: MiningItem[] = [
    { type: 'diamond', baseVal: 1000 },
    { type: 'gold', baseVal: 500 },
    { type: 'bronze', baseVal: 150 },
  ]

  const randomIndex = Math.floor(Math.random() * lootPool.length)
  const lucky = lootPool[randomIndex]

  if (lucky) {
    currentLoot.value = lucky
  }

  const retractInterval = setInterval(() => {
    hookLength.value -= 12
    if (hookLength.value <= 20) {
      clearInterval(retractInterval)
      isHookMoving.value = false
      if (currentLoot.value) {
        currentView.value = 'Crushing'
      }
    }
  }, 20)
}

const handleHit = (e: MouseEvent) => {
  const loot = currentLoot.value
  if (!loot) return
  hitCount.value++

  const hitMoney = Math.floor(loot.baseVal / 10)
  balance.value += hitMoney
  moneyNotes.value.push({ id: Date.now(), x: e.clientX, y: e.clientY, val: hitMoney })

  if (hitCount.value >= 10) {
    const bonus = loot.baseVal * 10
    balance.value += bonus
    alert(`XONG! BẠN NHẬN THƯỞNG TÚI MÙ: ${bonus}$`)
    hitCount.value = 0
    currentLoot.value = null
    currentView.value = 'Mining'
  }
  setTimeout(() => {
    moneyNotes.value.shift()
  }, 800)
}

const handleStartInvestment = () => {
  if (userProfile.value.name.trim()) {
    currentView.value = 'Market'
  }
}
const goToView = (v: 'Lobby' | 'Market' | 'Mining' | 'Crushing') => {
  currentView.value = v
}

// --- TRADING ACTIONS ---
const buyStock = () => {
  const cost = selectedStock.value.price * tradeAmount.value
  if (balance.value >= cost) {
    balance.value -= cost
    const existing = portfolio.value.find((p) => p.symbol === selectedStock.value.symbol)
    if (existing) {
      existing.buyPrice =
        (existing.amount * existing.buyPrice + cost) / (existing.amount + tradeAmount.value)
      existing.amount += tradeAmount.value
    } else {
      portfolio.value.push({
        symbol: selectedStock.value.symbol,
        amount: tradeAmount.value,
        buyPrice: selectedStock.value.price,
        currentPrice: selectedStock.value.price,
      })
    }
  }
}

const sellStock = () => {
  const amount = Math.min(tradeAmount.value, currentStockHolding.value)
  const idx = portfolio.value.findIndex((p) => p.symbol === selectedStock.value.symbol)
  const target = portfolio.value[idx]
  if (idx !== -1 && target) {
    balance.value += selectedStock.value.price * amount
    target.amount -= amount
    if (target.amount <= 0) {
      portfolio.value.splice(idx, 1)
    }
  }
}

// --- CHART ---
const getIdxX = (i: number) => i * (100 / 38) + 1.3
const getRawY = (val: number) => {
  const prices = candleData.value.flatMap((c) => [c.high, c.low])
  const min = Math.min(...prices) * 0.99 || 1
  const max = Math.max(...prices) * 1.01 || 2
  return 100 - ((val - min) / (max - min)) * 100
}

let marketInt: ReturnType<typeof setInterval> | undefined
let hookSwingInt: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && currentView.value === 'Mining') {
      throwHook()
    }
  })

  hookSwingInt = setInterval(() => {
    if (!isHookMoving.value) {
      hookAngle.value = Math.sin(Date.now() / 600) * 50
    }
  }, 30)

  let lp = selectedStock.value.price
  for (let i = 0; i < 40; i++) {
    const o = lp
    const c = lp * (1 + (Math.random() * 0.04 - 0.02))
    candleData.value.push({
      open: o,
      close: c,
      high: Math.max(o, c) * 1.01,
      low: Math.min(o, c) * 0.99,
    })
    lp = c
  }

  marketInt = setInterval(() => {
    stocks.value.forEach((s) => {
      const v = Math.random() * 2 - 1
      s.price = Math.max(0.0001, s.price * (1 + v / 100))
      s.change = parseFloat((v * 5).toFixed(2))
      const p = portfolio.value.find((pi) => pi.symbol === s.symbol)
      if (p) {
        p.currentPrice = s.price
      }

      if (s.symbol === selectedStock.value.symbol) {
        const last = candleData.value[candleData.value.length - 1]
        if (last) {
          const o = last.close
          const c = s.price
          candleData.value.shift()
          candleData.value.push({
            open: o,
            close: c,
            high: Math.max(o, c) * 1.005,
            low: Math.min(o, c) * 0.995,
          })
        }
      }
    })
    bots.value.forEach((b) => {
      b.totalValue *= 1 + (b.skill + (Math.random() * 1 - 0.5)) / 100
    })
  }, 3000)
})

onUnmounted(() => {
  if (marketInt) clearInterval(marketInt)
  if (hookSwingInt) clearInterval(hookSwingInt)
})
</script>

<template>
  <div
    class="min-h-screen bg-[#0b0e11] text-[#eaecef] font-sans selection:bg-yellow-500/30 overflow-hidden"
  >
    <div
      v-if="currentView === 'Lobby'"
      class="fixed inset-0 z-50 bg-[#0b0e11] flex items-center justify-center p-4"
    >
      <div
        class="bg-[#161a1e] p-10 rounded-3xl border border-gray-800 shadow-2xl w-full max-w-md text-center border-t-yellow-500/50"
      >
        <router-link
          to="/"
          class="flex items-center justify-center w-10 h-10 mb-2 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 backdrop-blur-md border border-white/20 text-white"
          title="Về trang chủ"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </router-link>
        <h1 class="text-3xl font-black text-white mb-2 italic tracking-tighter uppercase">
          GIẢ LẬP<span class="text-yellow-500 ml-2 font-black">LÀM GIÀU</span>
        </h1>
        <p class="text-gray-500 text-[10px] mb-10 uppercase tracking-[0.3em]">
          Blind Box Edition - Thử vận may tỷ phú
        </p>
        <div class="space-y-5 text-left mb-8">
          <div>
            <label class="text-[10px] text-gray-500 uppercase font-black ml-1 tracking-widest"
              >Tên nhà giao dịch</label
            >
            <input
              v-model="userProfile.name"
              type="text"
              placeholder="Nhập tên của bạn..."
              class="w-full bg-[#0b0e11] border border-gray-800 rounded-xl px-4 py-4 focus:border-yellow-500 outline-none transition-all font-bold text-white"
            />
          </div>
        </div>
        <div class="space-y-4">
          <button
            @click="handleStartInvestment"
            :class="
              userProfile.name.trim()
                ? 'bg-yellow-500 text-black'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            "
            class="w-full font-black py-4 rounded-xl transition-all active:scale-95 shadow-xl uppercase tracking-widest text-sm"
          >
            Bắt đầu đầu tư
          </button>
          <button
            @click="goToView('Mining')"
            :disabled="!userProfile.name.trim()"
            class="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-20 text-white font-black py-4 rounded-xl transition-all active:scale-95 uppercase tracking-widest text-sm shadow-lg shadow-purple-900/20"
          >
            Bốc túi mù kiếm tiền
          </button>
        </div>
      </div>
    </div>

    <div
      v-else-if="currentView === 'Mining'"
      class="min-h-screen relative bg-[#0a0a0a] flex flex-col items-center overflow-hidden"
    >
      <div class="mt-10 text-center z-20">
        <h2 class="text-2xl font-black text-purple-500 uppercase italic">Kho Báu Huyền Bí</h2>
        <p class="text-white/40 text-[10px] tracking-widest uppercase">
          Thả câu vào sương mù - 100% trúng quà
        </p>
      </div>
      <div
        class="absolute top-32 w-1 bg-gray-500 origin-top z-30"
        :style="{
          height: hookLength + 'px',
          transform: `rotate(${hookAngle}deg)`,
          transition: isHookMoving ? 'none' : 'transform 0.05s linear',
        }"
      >
        <div
          class="absolute bottom-[-15px] left-1/2 -translate-x-1/2 text-3xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
        >
          {{
            isRetracting && currentLoot
              ? currentLoot.type === 'diamond'
                ? '💎'
                : currentLoot.type === 'gold'
                  ? '💰'
                  : '🥉'
              : '🪝'
          }}
        </div>
      </div>
      <div class="absolute inset-0 top-1/2 flex items-center justify-center">
        <div
          class="absolute inset-0 bg-gradient-to-t from-black via-purple-950/20 to-transparent z-10 opacity-80 animate-pulse"
        ></div>
        <div
          v-for="n in 8"
          :key="n"
          class="absolute text-4xl opacity-20 blur-[2px] animate-float select-none"
          :style="{
            left: Math.random() * 80 + 10 + '%',
            top: Math.random() * 60 + '%',
            animationDelay: n * 0.5 + 's',
          }"
        >
          {{ n % 3 === 0 ? '💎' : n % 2 === 0 ? '💰' : '🥉' }}
        </div>
      </div>
      <div class="absolute bottom-10 flex flex-col items-center gap-4 z-20">
        <button
          @click="throwHook"
          :disabled="isHookMoving"
          class="bg-purple-600 px-12 py-5 rounded-full font-black text-white hover:bg-purple-500 active:scale-90 transition-all uppercase tracking-widest"
        >
          {{ isHookMoving ? 'ĐANG KÉO QUÀ...' : 'THẢ CÂU BỐC TÚI MÙ' }}
        </button>
        <button @click="goToView('Lobby')" class="text-white/40 text-xs uppercase hover:text-white">
          Rút lui
        </button>
      </div>
      <div class="absolute top-5 right-5 text-2xl font-mono font-black text-purple-500">
        {{ balance.toLocaleString() }}$
      </div>
    </div>

    <div
      v-else-if="currentView === 'Crushing'"
      class="min-h-screen flex flex-col items-center justify-center bg-[#050505]"
    >
      <div class="text-center mb-10">
        <h2 class="text-3xl font-black text-white uppercase italic">Giải mã túi mù</h2>
        <p class="text-purple-400 font-bold uppercase tracking-widest text-xs italic">
          Đập 10 phát để nhận kho báu X10
        </p>
      </div>
      <div class="relative group cursor-pointer scale-125" @click="handleHit">
        <div
          class="text-[10rem] select-none transition-transform active:scale-90 duration-75 relative"
        >
          {{ currentLoot?.type === 'diamond' ? '💎' : currentLoot?.type === 'gold' ? '💰' : '🥉' }}
        </div>
        <div class="w-full bg-gray-900 h-2 rounded-full mt-10 border border-purple-900/30">
          <div
            class="h-full bg-purple-500 shadow-[0_0_10px_#a855f7]"
            :style="{ width: hitCount * 10 + '%' }"
          ></div>
        </div>
      </div>
      <div
        v-for="note in moneyNotes"
        :key="note.id"
        class="absolute pointer-events-none animate-bounce-up text-green-400 font-black text-3xl"
        :style="{ left: note.x + 'px', top: note.y + 'px' }"
      >
        +{{ note.val }}$
      </div>
    </div>

    <div v-else class="p-4 max-w-[1600px] mx-auto animate-in fade-in duration-500 font-mono">
      <header
        class="flex flex-wrap justify-between items-center mb-6 border-b border-gray-800 pb-4 gap-4"
      >
        <div class="flex items-center gap-4">
          <button
            @click="goToView('Lobby')"
            class="bg-gray-800 w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-700 transition-all border border-gray-700 text-lg"
          >
            ←
          </button>
          <h1 class="text-xl font-black text-white italic tracking-tighter uppercase">
            VIBE<span class="text-yellow-500">TERMINAL</span>
          </h1>
        </div>
        <div class="flex items-center gap-8 font-mono">
          <div class="text-right border-r border-gray-800 pr-8 hidden md:block">
            <p class="text-[9px] text-gray-500 uppercase font-black mb-1">Net Asset Value</p>
            <p class="text-xl font-bold text-white tracking-tighter">
              {{ Math.floor(userTotalValue).toLocaleString() }} $
            </p>
          </div>
          <div class="text-right">
            <p class="text-[9px] text-green-600 uppercase font-black mb-1">Tiền mặt</p>
            <p class="text-xl font-bold text-green-500 tracking-tighter">
              {{ Math.floor(balance).toLocaleString() }} $
            </p>
          </div>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          class="lg:col-span-3 bg-[#161a1e] rounded-2xl p-5 border border-gray-800 shadow-xl overflow-hidden order-2 lg:order-1 font-sans"
        >
          <h2 class="text-[10px] font-black mb-5 text-blue-500 uppercase tracking-widest">
            🏆 THẾ GIỚI NGẦM
          </h2>
          <div class="space-y-2 overflow-y-auto max-h-[600px] pr-1 custom-scroll">
            <div
              v-for="(player, idx) in leaderboard"
              :key="player.name"
              class="flex justify-between items-center p-3 rounded-xl border"
              :class="
                player.isUser
                  ? 'bg-yellow-500/10 border-yellow-500/40'
                  : 'bg-[#0b0e11]/50 border-transparent'
              "
            >
              <div class="flex flex-col">
                <span
                  class="text-sm font-bold"
                  :class="player.isUser ? 'text-yellow-500' : 'text-gray-300'"
                  >{{ idx + 1 }}. {{ player.name }}</span
                >
                <span class="text-[8px] uppercase text-gray-600 font-bold">{{ player.level }}</span>
              </div>
              <span class="font-mono text-[11px] font-bold">{{
                Math.floor(player.totalValue).toLocaleString()
              }}</span>
            </div>
          </div>
        </div>

        <div class="lg:col-span-6 space-y-6 order-1 lg:order-2">
          <div class="bg-[#161a1e] rounded-3xl p-6 border border-gray-800 shadow-2xl relative">
            <div class="flex justify-between items-start mb-6">
              <div>
                <h2 class="text-4xl font-black text-white italic tracking-tighter">
                  {{ selectedStock.symbol }}
                </h2>
                <p class="text-[10px] text-gray-500 uppercase mt-1">{{ selectedStock.name }}</p>
              </div>
              <div class="text-right">
                <p
                  class="text-3xl font-bold tracking-tighter"
                  :class="selectedStock.change >= 0 ? 'text-green-500' : 'text-red-500'"
                >
                  {{ selectedStock.price.toLocaleString() }}
                </p>
              </div>
            </div>
            <div
              class="h-64 w-full bg-[#0b0e11] rounded-2xl mb-8 relative p-4 border border-gray-800"
            >
              <svg class="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <g
                  v-for="(candle, i) in candleData"
                  :key="i"
                  @mouseenter="hoveredCandle = { ...candle, x: getIdxX(i) }"
                  @mouseleave="hoveredCandle = null"
                >
                  <line
                    :x1="getIdxX(i)"
                    :y1="getRawY(candle.high)"
                    :x2="getIdxX(i)"
                    :y2="getRawY(candle.low)"
                    :stroke="candle.close >= candle.open ? '#22c55e' : '#ef4444'"
                    stroke-width="0.3"
                  />
                  <rect
                    :x="getIdxX(i) - 1"
                    :y="getRawY(Math.max(candle.open, candle.close))"
                    width="2"
                    :height="Math.max(0.5, Math.abs(getRawY(candle.open) - getRawY(candle.close)))"
                    :fill="candle.close >= candle.open ? '#22c55e' : '#ef4444'"
                  />
                </g>
              </svg>
            </div>
            <div class="bg-[#0b0e11] p-6 rounded-2xl border border-gray-800 font-sans">
              <div class="flex flex-col sm:flex-row gap-4 items-end font-mono">
                <div class="flex-1 w-full font-sans">
                  <label
                    class="text-[10px] text-gray-500 uppercase font-black mb-2 block tracking-widest"
                    >Khối lượng (Lot Size)</label
                  >
                  <input
                    v-model.number="tradeAmount"
                    type="number"
                    min="1"
                    class="w-full bg-[#161a1e] border border-gray-800 rounded-xl px-4 py-4 text-xl focus:border-yellow-500 outline-none text-white font-bold"
                  />
                </div>
                <div class="flex gap-3 w-full sm:w-auto font-sans">
                  <button
                    @click="buyStock"
                    :disabled="balance < selectedStock.price * tradeAmount"
                    class="flex-1 sm:w-32 bg-green-600 hover:bg-green-500 py-4 rounded-xl font-black text-lg active:scale-95 transition-all"
                  >
                    BUY
                  </button>
                  <button
                    @click="sellStock"
                    :disabled="currentStockHolding <= 0"
                    class="flex-1 sm:w-32 bg-red-600 hover:bg-red-700 py-4 rounded-xl font-black text-lg active:scale-95 transition-all"
                  >
                    SELL
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div
            class="grid grid-cols-2 sm:grid-cols-5 gap-2 overflow-y-auto max-h-40 p-1 custom-scroll font-sans"
          >
            <div
              v-for="s in stocks"
              :key="s.symbol"
              @click="selectedStock = s"
              class="p-3 rounded-xl border transition-all cursor-pointer text-center"
              :class="
                selectedStock.symbol === s.symbol
                  ? 'bg-yellow-500 text-black border-yellow-400 font-bold'
                  : 'bg-[#161a1e] border-gray-800 text-gray-500 hover:border-gray-600'
              "
            >
              <p class="text-[10px] font-black">{{ s.symbol }}</p>
              <p class="text-[8px] font-mono">{{ s.price.toLocaleString() }}</p>
            </div>
          </div>
        </div>

        <div class="lg:col-span-3 space-y-6 order-3 lg:order-3 font-sans">
          <div
            class="bg-[#161a1e] rounded-2xl p-6 border border-gray-800 shadow-xl overflow-hidden h-fit"
          >
            <h2
              class="text-[10px] font-black mb-6 uppercase text-gray-500 tracking-widest flex justify-between italic"
            >
              Vị thế mở <span class="text-blue-400 font-mono">{{ portfolio.length }}</span>
            </h2>
            <div
              v-if="portfolio.length === 0"
              class="text-center py-24 opacity-10 uppercase text-[10px] font-bold"
            >
              Danh mục trống
            </div>
            <div v-else class="space-y-4 font-mono">
              <div
                v-for="item in portfolio"
                :key="item.symbol"
                class="bg-[#0b0e11] p-4 rounded-2xl border border-gray-800/50 transition-all"
              >
                <div class="flex justify-between font-black text-sm">
                  <span class="text-blue-400">{{ item.symbol }}</span
                  ><span>{{ item.amount }}</span>
                </div>
                <div class="flex justify-between text-[10px] mt-2">
                  <span class="text-gray-600">Lãi/Lỗ:</span
                  ><span
                    :class="item.currentPrice > item.buyPrice ? 'text-green-500' : 'text-red-500'"
                    class="font-bold"
                    >{{
                      (((item.currentPrice - item.buyPrice) / item.buyPrice) * 100).toFixed(2)
                    }}%</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scroll::-webkit-scrollbar {
  width: 3px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: #374151;
  border-radius: 10px;
}
.transition-all {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes float {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }
  50% {
    transform: translate(20px, 30px) rotate(10deg);
  }
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
}
.animate-float {
  animation: float 6s ease-in-out infinite;
}
@keyframes bounce-up {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(-150px);
    opacity: 0;
  }
}
.animate-bounce-up {
  animation: bounce-up 0.8s ease-out forwards;
}
</style>
