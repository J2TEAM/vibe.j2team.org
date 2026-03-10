<template>
  <div class="min-h-screen bg-[#0b0e11] text-[#eaecef] font-sans selection:bg-yellow-500/30">
    
    <div v-if="!isStarted" class="fixed inset-0 z-50 bg-[#0b0e11] flex items-center justify-center p-4">
      <div class="bg-[#161a1e] p-10 rounded-3xl border border-gray-800 shadow-2xl w-full max-w-md text-center border-t-yellow-500/50">
        <h1 class="text-3xl font-black text-white mb-2 italic tracking-tighter uppercase">Global<span class="text-yellow-500">Terminal</span></h1>
        <p class="text-gray-500 text-[9px] mb-8 uppercase tracking-[0.3em]">Multi-Asset Trading Simulator</p>
        
        <div class="space-y-5 text-left">
          <div>
            <label class="text-[10px] text-gray-500 uppercase font-black ml-1 tracking-widest">Trader Identifier</label>
            <input v-model="userProfile.name" type="text" placeholder="Enter callsing..." 
                   class="w-full bg-[#0b0e11] border border-gray-800 rounded-xl px-4 py-4 focus:border-yellow-500 outline-none transition-all font-bold" />
          </div>
        </div>

        <button @click="startGame" :disabled="!userProfile.name"
                class="w-full mt-10 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-10 text-black font-black py-4 rounded-xl transition-all active:scale-95 shadow-xl shadow-yellow-500/10 uppercase tracking-widest text-sm">
          Initialize Terminal
        </button>
      </div>
    </div>

    <div v-else class="p-4 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <header class="flex flex-wrap justify-between items-center mb-6 border-b border-gray-800 pb-4 gap-4">
        <div class="flex items-center gap-4">
          <router-link to="/" class="bg-gray-800 w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-700 transition-all border border-gray-700 text-lg">←</router-link>
          <div>
            <h1 class="text-xl font-black text-white italic tracking-tighter">GLOBAL<span class="text-yellow-500 font-black">TERMINAL</span></h1>
          </div>
        </div>

        <div class="flex items-center gap-8 font-mono">
          <div class="text-right border-r border-gray-800 pr-8 hidden md:block">
            <p class="text-[9px] text-gray-500 uppercase font-black mb-1 italic">Net Asset Value</p>
            <p class="text-xl font-bold text-white tracking-tighter">{{ Math.floor(userTotalValue).toLocaleString() }} $</p>
          </div>
          <div class="text-right">
            <p class="text-[9px] text-green-600 uppercase font-black mb-1 italic">Available Balance</p>
            <p class="text-xl font-bold text-green-500 tracking-tighter">{{ Math.floor(balance).toLocaleString() }} $</p>
          </div>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-3 bg-[#161a1e] rounded-2xl p-5 border border-gray-800 shadow-xl overflow-hidden order-2 lg:order-1">
          <h2 class="text-[10px] font-black mb-5 text-blue-500 uppercase tracking-[0.2em] flex items-center gap-2">
            🏆 WORLD RANKING
          </h2>
          <div class="space-y-2 overflow-y-auto max-h-[650px] pr-1 custom-scroll">
            <div v-for="(player, idx) in leaderboard" :key="player.name" 
                 class="flex justify-between items-center p-3 rounded-xl transition-all border"
                 :class="player.isUser ? 'bg-yellow-500/10 border-yellow-500/40 shadow-lg' : 'bg-[#0b0e11]/50 border-transparent hover:border-gray-700'">
              <div class="flex items-center gap-3">
                <span class="text-[10px] font-bold w-4 text-center" :class="idx < 3 ? 'text-yellow-500' : 'text-gray-600'">{{ idx + 1 }}</span>
                <div class="flex flex-col">
                  <span class="text-sm font-bold truncate max-w-[100px]" :class="player.isUser ? 'text-yellow-500' : 'text-gray-300'">{{ player.name }}</span>
                  <span class="text-[8px] uppercase tracking-tighter text-gray-600 font-bold italic">{{ player.level }}</span>
                </div>
              </div>
              <span class="font-mono text-[11px] font-bold tracking-tighter">{{ Math.floor(player.totalValue).toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <div class="lg:col-span-6 space-y-6 order-1 lg:order-2">
          <div class="bg-[#161a1e] rounded-3xl p-6 border border-gray-800 shadow-2xl relative">
            <div class="flex justify-between items-start mb-6">
              <div>
                <h2 class="text-4xl font-black text-white italic tracking-tighter flex items-center gap-2">
                  {{ selectedStock.symbol }}
                  <span class="text-[9px] not-italic bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase tracking-widest font-black">Market-Live</span>
                </h2>
                <p class="text-[10px] text-gray-500 uppercase tracking-[0.3em] mt-1">{{ selectedStock.name }}</p>
              </div>
              <div class="text-right font-mono">
                <p class="text-3xl font-bold tracking-tighter" :class="selectedStock.change >= 0 ? 'text-green-500' : 'text-red-500'">{{ selectedStock.price.toLocaleString() }}</p>
                <p class="text-sm font-bold mt-1" :class="selectedStock.change >= 0 ? 'text-green-500' : 'text-red-500'">
                  {{ selectedStock.change >= 0 ? '▲' : '▼' }} {{ Math.abs(selectedStock.change) }}%
                </p>
              </div>
            </div>

            <div class="h-64 w-full bg-[#0b0e11] rounded-2xl mb-8 relative p-4 border border-gray-800 shadow-inner overflow-visible">
              <svg class="w-full h-full cursor-crosshair" preserveAspectRatio="none" viewBox="0 0 100 100">
                <g v-for="(candle, i) in candleData" :key="i"
                   @mouseenter="hoveredCandle = { ...candle, x: getIdxX(i) }"
                   @mouseleave="hoveredCandle = null">
                  
                  <line :x1="getIdxX(i)" :y1="getRawY(candle.high)" 
                        :x2="getIdxX(i)" :y2="getRawY(candle.low)" 
                        :stroke="candle.close >= candle.open ? '#22c55e' : '#ef4444'" 
                        stroke-width="0.3" />
                  
                  <rect :x="getIdxX(i) - 1" 
                        :y="getRawY(Math.max(candle.open, candle.close))" 
                        width="2" 
                        :height="Math.max(0.5, Math.abs(getRawY(candle.open) - getRawY(candle.close)))" 
                        :fill="candle.close >= candle.open ? '#22c55e' : '#ef4444'" 
                        class="transition-all duration-300" />
                </g>
              </svg>

              <div v-if="hoveredCandle" 
                   class="absolute z-10 bg-[#1e2329] border border-gray-700 p-2 rounded shadow-2xl pointer-events-none text-[9px] font-mono leading-tight whitespace-nowrap min-w-[80px]"
                   :style="{ left: hoveredCandle.x + '%', top: '10%' }">
                <p class="text-gray-500 uppercase mb-1 border-b border-gray-700 pb-1">Stats</p>
                <p class="text-green-400">O: {{ hoveredCandle.open.toLocaleString() }}</p>
                <p class="text-white font-bold">H: {{ hoveredCandle.high.toLocaleString() }}</p>
                <p class="text-white font-bold">L: {{ hoveredCandle.low.toLocaleString() }}</p>
                <p class="text-red-400">C: {{ hoveredCandle.close.toLocaleString() }}</p>
              </div>

              <div class="absolute inset-0 flex flex-col justify-between pointer-events-none p-4 opacity-5">
                <div v-for="n in 5" :key="n" class="border-t border-white w-full"></div>
              </div>
            </div>

            <div class="bg-[#0b0e11] p-6 rounded-2xl border border-gray-800">
              <div class="flex flex-col sm:flex-row gap-4 items-end font-mono">
                <div class="flex-1 w-full">
                  <div class="flex justify-between mb-2">
                    <label class="text-[10px] text-gray-500 uppercase font-black tracking-widest">Order Size</label>
                    <span class="text-[10px] text-yellow-500 font-bold uppercase tracking-tighter italic">Inventory: {{ currentStockHolding }} units</span>
                  </div>
                  <input v-model.number="tradeAmount" type="number" min="1"
                         class="w-full bg-[#161a1e] border border-gray-800 rounded-xl px-4 py-4 text-xl focus:border-yellow-500 outline-none transition-all shadow-inner text-white" />
                </div>
                <div class="flex gap-3 w-full sm:w-auto">
                  <button @click="buyStock" :disabled="balance < (selectedStock.price * tradeAmount)"
                          class="flex-1 sm:w-32 bg-green-600 hover:bg-green-500 disabled:opacity-20 py-4 rounded-xl font-black text-lg shadow-lg shadow-green-900/40 active:scale-95 transition-all">BUY</button>
                  <button @click="sellStock" :disabled="currentStockHolding <= 0"
                          class="flex-1 sm:w-32 bg-red-600 hover:bg-red-500 disabled:opacity-20 py-4 rounded-xl font-black text-lg shadow-lg shadow-red-900/40 active:scale-95 transition-all">SELL</button>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div v-for="s in stocks" :key="s.symbol" @click="selectedStock = s"
                 class="p-4 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden"
                 :class="selectedStock.symbol === s.symbol ? 'bg-yellow-500 text-black border-yellow-400 font-black scale-105' : 'bg-[#161a1e] border-gray-800 text-gray-500 hover:border-gray-700'">
              <p class="text-[10px] font-black uppercase tracking-tighter">{{ s.symbol }}</p>
              <p class="text-[9px] mt-1 font-mono font-bold">{{ s.price.toLocaleString() }}</p>
            </div>
          </div>
        </div>

        <div class="lg:col-span-3 space-y-6 order-3 lg:order-3">
          <div class="bg-[#161a1e] rounded-2xl p-6 border border-gray-800 shadow-xl overflow-hidden h-fit">
            <h2 class="text-[10px] font-black mb-6 uppercase text-gray-500 tracking-widest flex justify-between items-center italic">
              Active Positions
              <span class="bg-blue-500/20 text-blue-400 px-3 py-1 rounded font-black not-italic font-mono">{{ portfolio.length }}</span>
            </h2>
            <div v-if="portfolio.length === 0" class="text-center py-24 opacity-10 italic">
              <p class="text-[9px] font-black uppercase tracking-widest">No active positions</p>
            </div>
            <div v-else class="space-y-4">
              <div v-for="item in portfolio" :key="item.symbol" class="bg-[#0b0e11] p-4 rounded-2xl border border-gray-800/50 hover:border-gray-700 transition-all font-mono">
                <div class="flex justify-between font-black text-sm">
                  <span class="text-blue-400 tracking-tighter">{{ item.symbol }}</span>
                  <span class="text-white">{{ item.amount.toLocaleString() }}</span>
                </div>
                <div class="flex justify-between text-[10px] mt-4 border-t border-gray-800 pt-3 italic">
                  <span class="text-gray-500 uppercase">Profit/Loss</span>
                  <span :class="item.currentPrice > item.buyPrice ? 'text-green-500' : 'text-red-500'" class="font-black">
                    {{ item.currentPrice > item.buyPrice ? '+' : '' }}{{ (((item.currentPrice - item.buyPrice) / item.buyPrice) * 100).toFixed(2) }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

// TYPES
interface Player { name: string; totalValue: number; level: string; skill: number; isUser?: boolean; }
interface Stock { symbol: string; name: string; price: number; change: number; }
interface PortfolioItem { symbol: string; amount: number; buyPrice: number; currentPrice: number; }
interface Candle { open: number; close: number; high: number; low: number; x?: number; }

// STATE
const isStarted = ref(false);
const userProfile = ref({ name: '' });
const balance = ref(100000); 
const tradeAmount = ref(1);
const portfolio = ref<PortfolioItem[]>([]);
const hoveredCandle = ref<Candle | null>(null);

const stocks = ref<Stock[]>([
  { symbol: 'BTC', name: 'Bitcoin / USD', price: 65200, change: 0 },
  { symbol: 'ETH', name: 'Ethereum', price: 3450, change: 0 },
  { symbol: 'GOLD', name: 'Gold Spot', price: 2150, change: 0 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 175, change: 0 },
  { symbol: 'DOGE', name: 'Dogecoin', price: 0.15, change: 0 },
]);
const selectedStock = ref<Stock>(stocks.value[0]!);
const candleData = ref<Candle[]>([]);

const bots = ref<Player[]>([
  { name: 'Michael Saylor', totalValue: 500000, level: 'Bitcoin King', skill: 0.18 },
  { name: 'Elon Musk', totalValue: 1000000, level: 'Market Mover', skill: 0.25 },
  { name: 'Warren Buffett', totalValue: 800000, level: 'Huyền thoại', skill: 0.2 },
  { name: 'Crypto Whale', totalValue: 400000, level: 'Deep Sea', skill: 0.1 },
  { name: 'WSB Degenerate', totalValue: 50000, level: 'Gambler', skill: -0.15 },
  { name: 'Retail Army', totalValue: 20000, level: 'Crowd', skill: -0.05 },
  { name: 'AI Trader', totalValue: 300000, level: 'Quant', skill: 0.08 },
]);

// COMPUTED
const userTotalValue = computed(() => {
  const stockValue = portfolio.value.reduce((acc, item) => acc + (item.amount * item.currentPrice), 0);
  return balance.value + stockValue;
});

const leaderboard = computed(() => {
  const user: Player = { name: `${userProfile.value.name} (You)`, totalValue: userTotalValue.value, level: 'Global Trader', skill: 0, isUser: true };
  return [...bots.value, user].sort((a, b) => b.totalValue - a.totalValue);
});

const currentStockHolding = computed(() => {
  const item = portfolio.value.find(p => p.symbol === selectedStock.value.symbol);
  return item ? item.amount : 0;
});

// FUNCTIONS
const startGame = () => { if(userProfile.value.name) isStarted.value = true; };

const buyStock = () => {
  const amount = tradeAmount.value;
  const cost = selectedStock.value.price * amount;
  if (balance.value >= cost) {
    balance.value -= cost;
    const existing = portfolio.value.find(p => p.symbol === selectedStock.value.symbol);
    if (existing) {
      existing.buyPrice = ((existing.amount * existing.buyPrice) + (amount * selectedStock.value.price)) / (existing.amount + amount);
      existing.amount += amount;
    } else {
      portfolio.value.push({ symbol: selectedStock.value.symbol, amount: amount, buyPrice: selectedStock.value.price, currentPrice: selectedStock.value.price });
    }
  }
};

const sellStock = () => {
  const amount = Math.min(tradeAmount.value, currentStockHolding.value);
  if (amount <= 0) return;
  const idx = portfolio.value.findIndex(p => p.symbol === selectedStock.value.symbol);
  if (idx !== -1) {
    balance.value += selectedStock.value.price * amount;
    portfolio.value[idx]!.amount -= amount;
    if (portfolio.value[idx]!.amount <= 0) portfolio.value.splice(idx, 1);
  }
};

// CHART LOGIC
const getIdxX = (i: number) => (i * (100 / 38)) + (100 / 76);

const getRawY = (val: number) => {
  const prices = candleData.value.flatMap(c => [c.high, c.low]);
  const min = Math.min(...prices) * 0.998 || 1;
  const max = Math.max(...prices) * 1.002 || 2;
  return 100 - ((val - min) / (max - min)) * 100;
};

const generateInitialCandles = () => {
  let lastPrice = selectedStock.value.price;
  for (let i = 0; i < 38; i++) {
    const open = lastPrice;
    const close = lastPrice * (1 + (Math.random() * 0.04 - 0.02));
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    candleData.value.push({ open, close, high, low });
    lastPrice = close;
  }
};

let interval: any;
onMounted(() => {
  generateInitialCandles();
  interval = setInterval(() => {
    stocks.value.forEach(s => {
      const vol = (Math.random() * 2 - 1);
      const oldPrice = s.price;
      s.price = Math.max(0.0001, s.price * (1 + vol / 100));
      s.change = parseFloat((vol * 5).toFixed(2));
      
      const pItem = portfolio.value.find(p => p.symbol === s.symbol);
      if(pItem) pItem.currentPrice = s.price;

      if (s.symbol === selectedStock.value.symbol) {
        const lastCandle = candleData.value[candleData.value.length - 1];
        const open = lastCandle ? lastCandle.close : oldPrice;
        const close = s.price;
        const high = Math.max(open, close, open * (1 + Math.random() * 0.005));
        const low = Math.min(open, close, open * (1 - Math.random() * 0.005));
        candleData.value.shift();
        candleData.value.push({ open, close, high, low });
      }
    });

    bots.value.forEach(bot => {
      bot.totalValue *= (1 + (bot.skill + (Math.random() * 1 - 0.5)) / 100);
    });
  }, 3000);
});

onUnmounted(() => clearInterval(interval));
</script>

<style scoped>
.custom-scroll::-webkit-scrollbar { width: 3px; }
.custom-scroll::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
.transition-all { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

/* Hiệu ứng khi hover vào nến */
rect:hover {
  filter: brightness(1.5);
  cursor: pointer;
}
</style>