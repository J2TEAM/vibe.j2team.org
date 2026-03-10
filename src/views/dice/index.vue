<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useDiceGame } from './composables/useDiceGame'
import FairnessModal from './components/FairnessModal.vue'
import HistoryList from './components/HistoryList.vue'
import BackToTop from '@/components/BackToTop.vue'
import type { HistoryEntry, FairnessTab } from './types'

const {
  activeClientSeed,
  activeServerSeedHash,
  nonce,
  prevSeed,
  newClientSeedInput,
  rotateSeeds,
  prediction,
  mode,
  luckyNumber,
  isRolling,
  balance,
  playAmount,
  lastResult,
  history,
  chanceToWin,
  multiplier,
  profitOnWin,
  sliderPct,
  isGameOver,
  winCount,
  loseCount,
  halfPlay,
  doublePlay,
  maxPlay,
  roll,
  resetGame,
  clamp,
  houseEdge,
  isBigWin,
} = useDiceGame()

// -- UI State --
const showFairness = ref(false)
const fairnessTab = ref<FairnessTab>('seeds')
const showFullHistory = ref(false)

const vClientSeed = ref('')
const vServerSeed = ref('')
const vNonce = ref(0)

function openVerify(item: HistoryEntry) {
  vClientSeed.value = item.clientSeed
  vNonce.value = item.nonce
  vServerSeed.value =
    prevSeed.value && prevSeed.value.serverSeedHash === item.serverSeedHash
      ? prevSeed.value.serverSeed
      : ''
  fairnessTab.value = 'verify'
  showFairness.value = true
}

function handleOpenFairness() {
  showFairness.value = true
  fairnessTab.value = 'seeds'
}

// -- Balance Animation --
const floatingDeltas = ref<{ id: number; value: number }[]>([])
let deltaId = 0

watch(history, (newVal, oldVal) => {
  if (newVal.length > (oldVal?.length || 0)) {
    const latest = newVal[0]
    if (latest) {
      const id = ++deltaId
      floatingDeltas.value.push({ id, value: latest.delta })
      setTimeout(() => {
        floatingDeltas.value = floatingDeltas.value.filter((d) => d.id !== id)
      }, 200)
    }
  }
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body pb-16 relative">
    <!-- Badge phiên bản -->
    <div
      class="fixed top-24 right-4 z-30 bg-accent-coral text-bg-deep font-display font-bold text-[10px] tracking-widest px-2 py-1 rotate-3 pointer-events-none hidden lg:block"
    >
      VOL.01 / 2026
    </div>
    <!-- ── Full Screen Big Win Fire ── -->
    <transition name="fire-fade">
      <div
        v-if="isBigWin"
        class="fixed inset-0 z-[100] pointer-events-none overflow-hidden flex items-center justify-center"
        :class="mode === 'under' ? 'bg-accent-sky/5' : 'bg-accent-coral/5'"
      >
        <!-- Particle Flames -->
        <div
          class="absolute inset-x-0 bottom-0 h-[60vh] animate-fire-rise blur-xl"
          :class="
            mode === 'under'
              ? 'bg-gradient-to-t from-accent-sky/40 via-accent-sky/10 to-transparent'
              : 'bg-gradient-to-t from-accent-coral/40 via-accent-amber/10 to-transparent'
          "
        ></div>
        <div
          class="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(255,107,74,0.1)_100%)]"
        ></div>

        <!-- Big Win Text Center -->
        <div class="relative z-10 flex flex-col items-center animate-win-zoom">
          <div
            class="font-display font-black text-7xl sm:text-[10rem] uppercase italic tracking-tighter leading-none"
            :class="
              mode === 'under'
                ? 'text-accent-sky drop-shadow-[0_0_50px_rgba(56,189,248,0.8)]'
                : 'text-accent-coral drop-shadow-[0_0_50px_rgba(255,107,74,0.8)]'
            "
          >
            BIG WIN
          </div>
          <div
            class="font-display font-bold text-xl sm:text-2xl mt-4 tracking-[0.5em] uppercase drop-shadow-lg"
            :class="mode === 'under' ? 'text-white' : 'text-accent-amber'"
          >
            🔥 UNSTOPPABLE 🔥
          </div>
        </div>

        <!-- Flickering border -->
        <div
          class="absolute inset-0 border-[20px] animate-border-burn"
          :class="mode === 'under' ? 'border-accent-sky/20' : 'border-accent-coral/20'"
        ></div>
      </div>
    </transition>

    <!-- ── Header (Sticky) ── -->
    <div
      class="sticky top-0 z-40 bg-bg-deep/80 backdrop-blur-md border-b border-border-default/50 mb-4"
    >
      <div class="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 text-sm text-text-secondary border border-border-default bg-bg-surface px-4 py-2 transition-all hover:border-accent-sky hover:text-text-primary h-11"
        >
          <span class="font-bold">←</span>
          <span class="hidden sm:inline">Về trang chủ</span>
        </RouterLink>
        <div class="flex items-center gap-3">
          <button
            class="flex items-center gap-1.5 text-[10px] sm:text-xs font-display tracking-wide border border-border-default bg-bg-surface px-3 py-2 text-text-secondary transition-all hover:border-accent-sky hover:text-accent-sky h-11"
            @click="handleOpenFairness"
          >
            <span class="text-sm">🔐</span> Fairness
          </button>

          <div
            class="bg-bg-surface border border-border-default px-4 py-1.5 flex flex-col items-end min-w-[140px] shadow-sm group hover:border-accent-amber transition-all duration-300 relative"
          >
            <!-- Trang trí góc -->
            <div class="absolute top-0 right-0 w-1.5 h-1.5 bg-accent-amber opacity-20"></div>

            <div
              class="text-[10px] text-text-dim font-display tracking-[0.2em] uppercase leading-none mb-1"
            >
              Balance
            </div>
            <div class="flex items-center gap-2 relative">
              <div class="w-1.5 h-1.5 rounded-full bg-accent-amber animate-pulse"></div>
              <div
                class="font-display font-bold text-accent-amber text-2xl leading-none tracking-tighter"
              >
                {{ balance.toLocaleString() }}
              </div>
              <span
                class="text-[10px] text-text-dim font-display font-medium uppercase tracking-widest mt-1 opacity-70"
              >
                POINT
              </span>

              <!-- Floating Deltas -->
              <transition-group name="floating-delta">
                <div
                  v-for="d in floatingDeltas"
                  :key="d.id"
                  class="absolute left-0 -top-5 font-display font-bold text-lg pointer-events-none whitespace-nowrap drop-shadow-md z-50 transition-opacity duration-200"
                  :class="d.value > 0 ? 'text-accent-sky' : 'text-accent-coral'"
                  style="animation: float-quick 0.2s ease-out forwards"
                >
                  {{ d.value > 0 ? '+' : '' }}{{ d.value.toFixed(2) }}
                </div>
              </transition-group>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Disclaimer ── -->
    <div class="max-w-2xl mx-auto px-4 sm:px-6 mb-4">
      <div
        class="border border-accent-amber/40 bg-accent-amber/5 px-4 py-2.5 flex items-start gap-3"
      >
        <span class="text-accent-amber text-base shrink-0 mt-0.5">⚠️</span>
        <p class="text-[11px] text-text-secondary leading-relaxed tracking-wider">
          <strong class="text-accent-amber font-display"
            >Đây là một trò chơi, không phải nền tảng cờ bạc</strong
          ><br />
          POINT không có giá trị tiền tệ & không thể quy đổi
        </p>
      </div>
    </div>

    <!-- ── Title ── -->
    <div class="text-center pb-4 animate-fade-up">
      <h1 class="font-display text-6xl sm:text-7xl font-bold tracking-tight">
        <span class="text-accent-coral">// </span>DICE
      </h1>
      <p class="text-text-secondary mt-1 text-sm uppercase tracking-widest font-display">
        Predict • Roll • Win
      </p>
    </div>

    <!-- ── Mini history bar ── -->
    <div class="max-w-2xl mx-auto px-4 sm:px-6 mb-4 animate-fade-up animate-delay-1">
      <div class="flex items-center justify-center gap-2 flex-wrap min-h-[2rem]">
        <template v-if="history.length > 0">
          <span
            v-for="item in history.slice(0, 13).reverse()"
            :key="item.nonce"
            class="font-display text-xs font-bold px-2 py-1 border text-center min-w-[2.4rem] transition-all cursor-pointer hover:opacity-80"
            :class="
              item.won
                ? 'border-accent-sky text-accent-sky bg-accent-sky/10'
                : 'border-accent-coral text-accent-coral bg-accent-coral/10'
            "
            @click="openVerify(item)"
            :title="`Roll #${item.nonce} — Click to verify`"
          >
            {{ String(item.result).padStart(2, '0') }}
          </span>
        </template>
        <span v-else class="text-xs text-text-dim font-display tracking-wide uppercase opacity-30"
          >Recent results</span
        >
      </div>
    </div>

    <!-- ── Main game panel ── -->
    <div class="max-w-2xl mx-auto px-4 sm:px-6 animate-fade-up animate-delay-2">
      <!-- Prediction | Dice | Lucky Number -->
      <div
        class="bg-bg-surface border border-border-default grid grid-cols-3 gap-2 items-center py-8 px-4 sm:px-8 shadow-sm transition-all duration-500 relative"
        :class="{
          'big-win-glow-sky border-accent-sky/50': isBigWin && mode === 'under',
          'big-win-glow-coral border-accent-coral/50': isBigWin && mode === 'over',
        }"
      >
        <!-- Big Win Overlay Text -->
        <div
          v-if="isBigWin"
          class="absolute inset-0 flex items-center justify-center pointer-events-none z-20 overflow-hidden"
        >
          <div
            class="font-display font-black text-6xl sm:text-8xl text-accent-coral/20 uppercase tracking-[0.2em] animate-pulse"
          >
            BIG WIN
          </div>
        </div>
        <div class="text-center">
          <div
            class="font-display font-bold transition-all duration-200 text-5xl sm:text-7xl"
            :class="mode === 'under' ? 'text-accent-sky' : 'text-accent-coral'"
          >
            {{ String(prediction).padStart(2, '0') }}
          </div>
          <div
            class="text-text-dim text-[10px] tracking-widest mt-3 font-display uppercase font-bold"
          >
            Prediction
          </div>
        </div>

        <div class="flex justify-center">
          <div
            class="text-6xl sm:text-7xl select-none transition-transform"
            :class="{ 'roll-spin': isRolling }"
          >
            🎲
          </div>
        </div>

        <div class="text-center">
          <div
            class="font-display font-bold transition-all duration-300 text-5xl sm:text-7xl"
            :class="{
              'text-accent-sky': lastResult === 'win',
              'text-accent-coral': lastResult === 'lose',
              'text-text-primary': lastResult === null,
            }"
          >
            {{ luckyNumber !== null ? String(luckyNumber).padStart(2, '0') : '??' }}
          </div>
          <div
            class="text-text-dim text-[10px] tracking-widest mt-3 font-display uppercase font-bold"
          >
            Lucky Number
          </div>
        </div>
      </div>

      <!-- Slider -->
      <div class="mt-6 px-1 mb-6">
        <input
          v-model.number="prediction"
          type="range"
          min="2"
          max="98"
          step="1"
          class="dice-slider w-full"
          :style="{
            background: `linear-gradient(to right, #38BDF8 0%, #38BDF8 ${sliderPct}%, #FF6B4A ${sliderPct}%, #FF6B4A 100%)`,
          }"
        />
        <div
          class="flex justify-between mt-2 text-[10px] text-text-dim font-display uppercase tracking-widest font-bold"
        >
          <span>MIN: 02</span>
          <span class="text-text-secondary border-b border-border-default pb-0.5"
            >PREDICTION: {{ prediction }}</span
          >
          <span>MAX: 98</span>
        </div>
      </div>

      <!-- Roll Under | Stats | Roll Over -->
      <div class="grid grid-cols-3 mt-4">
        <button
          class="py-2.5 font-display font-bold tracking-widest text-xs transition-all uppercase"
          :class="
            mode === 'under'
              ? 'bg-accent-sky text-bg-deep'
              : 'bg-bg-surface border border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
          "
          @click="mode = 'under'"
        >
          Roll Under
        </button>
        <div
          class="bg-bg-surface border-y border-border-default p-1.5 text-center flex flex-col justify-center relative overflow-hidden group"
        >
          <!-- Subtle top indicator -->
          <div class="absolute top-0 left-0 w-full h-[1px] bg-accent-amber/10"></div>

          <div class="text-[8px] text-text-dim font-display tracking-widest uppercase mb-0">
            Multiplier
          </div>
          <div
            class="font-display font-bold text-accent-amber text-base leading-tight mb-1 tracking-tight"
          >
            ×{{ multiplier }}
          </div>

          <div class="h-[1px] w-6 bg-border-default mx-auto mb-1 opacity-30"></div>

          <div class="text-[8px] text-text-dim font-display tracking-widest uppercase mb-0">
            Win Chance
          </div>
          <div class="font-display font-bold text-text-primary text-sm leading-tight">
            {{ chanceToWin }}%
          </div>

          <!-- House Edge info -->
          <div class="mt-1 pt-1 border-t border-border-default/20">
            <div
              class="flex items-center justify-center gap-1 text-[8px] text-text-dim/60 font-display font-bold tracking-widest"
            >
              <span class="inline-block w-1 h-1 rounded-full bg-accent-amber/40"></span>
              HOUSE EDGE: <span class="text-text-dim font-bold">{{ houseEdge }}%</span>
            </div>
          </div>
        </div>
        <button
          class="py-2.5 font-display font-bold tracking-widest text-xs transition-all uppercase"
          :class="
            mode === 'over'
              ? 'bg-accent-coral text-bg-deep'
              : 'bg-bg-surface border border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
          "
          @click="mode = 'over'"
        >
          Roll Over
        </button>
      </div>

      <!-- Play amount + Roll button -->
      <div class="mt-5 grid grid-cols-2 gap-4">
        <div class="bg-bg-surface border border-border-default p-4">
          <div
            class="text-[10px] text-text-dim font-display tracking-widest mb-3 uppercase font-bold"
          >
            Bet Amount
          </div>
          <input
            v-model.number="playAmount"
            @input="clamp"
            type="number"
            min="1"
            :max="Math.floor(balance)"
            class="w-full bg-bg-elevated border border-border-default px-3 py-2 font-display font-bold text-accent-amber text-lg focus:outline-none focus:border-accent-amber mb-3 transition-colors tracking-tight"
          />
          <div class="grid grid-cols-3 gap-1.5">
            <button
              class="py-1.5 text-[10px] bg-bg-elevated border border-border-default text-text-secondary font-display font-bold hover:text-text-primary hover:border-accent-coral transition-all tracking-widest"
              @click="maxPlay"
            >
              MAX
            </button>
            <button
              class="py-1.5 text-[10px] bg-bg-elevated border border-border-default text-text-secondary font-display font-bold hover:text-text-primary hover:border-accent-coral transition-all tracking-widest"
              @click="halfPlay"
            >
              1/2
            </button>
            <button
              class="py-1.5 text-[10px] bg-bg-elevated border border-border-default text-text-secondary font-display font-bold hover:text-text-primary hover:border-accent-coral transition-all tracking-widest"
              @click="doublePlay"
            >
              2×
            </button>
          </div>
          <div class="text-[10px] text-text-dim mt-4 tracking-wide">
            Profit on Win:
            <span class="text-accent-amber font-bold font-display ml-1"
              >+{{ profitOnWin }} POINT</span
            >
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <button
            class="flex-1 font-display font-bold text-base sm:text-lg tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed uppercase"
            :class="
              isRolling
                ? 'bg-bg-elevated text-text-dim'
                : mode === 'under'
                  ? 'bg-accent-sky text-bg-deep hover:brightness-110 shadow-[0_4px_12px_rgba(56,189,248,0.2)]'
                  : 'bg-accent-coral text-bg-deep hover:brightness-110 shadow-[0_4px_12px_rgba(255,107,74,0.2)]'
            "
            :disabled="isRolling || isGameOver || playAmount <= 0 || playAmount > balance"
            @click="roll"
          >
            <span v-if="isRolling" class="flex items-center justify-center gap-2">ROLLING</span>
            <span v-else-if="isGameOver" class="text-sm">INSUFFICIENT BALANCE</span>
            <span v-else>ROLL NOW</span>
          </button>
          <button
            class="py-3 font-display text-[10px] font-bold tracking-widest border transition-all uppercase"
            :class="
              isGameOver
                ? 'border-accent-amber text-accent-amber hover:bg-accent-amber/10'
                : 'border-border-default text-text-dim hover:border-accent-coral hover:text-text-secondary'
            "
            @click="resetGame"
          >
            🔄 RESET SESSION
          </button>
        </div>
      </div>

      <!-- ── Full History ── -->
      <HistoryList
        v-model:is-open="showFullHistory"
        :history="history"
        :win-count="winCount"
        :lose-count="loseCount"
        @verify="openVerify"
      />

      <!-- ── How to play ── -->
      <div class="mt-6 border border-border-default bg-bg-surface p-5 shadow-sm">
        <h2
          class="font-display text-xs font-bold text-text-primary mb-3 flex items-center gap-2 tracking-widest uppercase"
        >
          <span class="text-accent-amber text-[10px] tracking-widest">//</span> How to Play
        </h2>
        <ul class="space-y-2 text-[11px] text-text-secondary leading-relaxed tracking-wide">
          <li>
            Chọn
            <span class="text-accent-sky font-display uppercase tracking-wider">PREDICTION</span>
            bằng cách kéo thanh trượt
          </li>
          <li>
            Click nút
            <span class="text-accent-sky font-display uppercase tracking-wider">ROLL NOW</span> để
            biết thắng - thua
          </li>
          <li>
            <strong class="text-accent-sky font-display uppercase tracking-wider">
              Roll Under
            </strong>
            để chọn cửa dưới — thắng nếu LUCKY NUMBER
            <strong class="text-text-primary underline decoration-accent-sky/30">nhỏ hơn</strong>
            PREDICTION
          </li>
          <li>
            <strong class="text-accent-coral font-display uppercase tracking-wider">
              Roll Over
            </strong>
            để chọn cửa trên — thắng nếu LUCKY NUMBER
            <strong class="text-text-primary underline decoration-accent-coral/30">lớn hơn</strong>
            PREDICTION
          </li>
          <li>Multiplier càng cao → xác suất thắng càng thấp</li>
          <li>
            Bắt đầu với <span class="text-accent-amber font-bold">1000 POINT</span> ảo miễn phí —
            <strong class="text-text-secondary">không có giá trị tiền tệ thực</strong>
          </li>
          <li>GoodLuck!!!</li>
        </ul>
      </div>
    </div>

    <!-- ══ Fairness Modal ══════════════════════════════════════════════════════ -->
    <FairnessModal
      v-model:is-open="showFairness"
      :initial-tab="fairnessTab"
      :active-client-seed="activeClientSeed"
      :active-server-seed-hash="activeServerSeedHash"
      :nonce="nonce"
      :prev-seed="prevSeed"
      v-model:new-client-seed-input="newClientSeedInput"
      v-model:v-client-seed="vClientSeed"
      v-model:v-server-seed="vServerSeed"
      v-model:v-nonce="vNonce"
      @rotate="rotateSeeds"
    />

    <!-- Nút về đầu trang -->
    <BackToTop />
  </div>
</template>

<style scoped>
.dice-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 10px;
  border-radius: 5px;
  outline: none;
  cursor: pointer;
  transition: background 0.15s ease;
}
.dice-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 26px;
  height: 26px;
  background: #f0ede6;
  border: 3px solid #0f1923;
  border-radius: 4px;
  cursor: pointer;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.15);
  transition: transform 0.15s ease;
}
.dice-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}
.dice-slider::-moz-range-thumb {
  width: 26px;
  height: 26px;
  background: #f0ede6;
  border: 3px solid #0f1923;
  border-radius: 4px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

@keyframes spin-once {
  0% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(180deg) scale(1.3);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}
.roll-spin {
  animation: spin-once 0.2s linear infinite;
  display: inline-block;
}

@keyframes float-quick {
  0% {
    opacity: 0;
    transform: translateY(5px);
  }
  20% {
    opacity: 1;
    transform: translateY(0);
  }
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

/* Big Win Effects */
.big-win-glow-sky {
  animation: glow-pulse-sky 0.4s ease-in-out infinite alternate;
  box-shadow: 0 0 60px rgba(56, 189, 248, 0.4);
}
.big-win-glow-coral {
  animation: glow-pulse-coral 0.4s ease-in-out infinite alternate;
  box-shadow: 0 0 60px rgba(255, 107, 74, 0.4);
}

@keyframes glow-pulse-sky {
  0% {
    border-color: rgba(56, 189, 248, 0.4);
  }
  100% {
    border-color: rgba(56, 189, 248, 1);
  }
}
@keyframes glow-pulse-coral {
  0% {
    border-color: rgba(255, 107, 74, 0.4);
  }
  100% {
    border-color: rgba(255, 107, 74, 1);
  }
}

/* Full Screen Fire Animations */
.animate-fire-rise {
  animation: fire-rise 1s ease-out infinite alternate;
}

@keyframes fire-rise {
  0% {
    transform: translateY(20px) scaleX(1);
    opacity: 0.6;
  }
  100% {
    transform: translateY(0) scaleX(1.1);
    opacity: 0.9;
  }
}

.animate-win-zoom {
  animation: win-zoom 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes win-zoom {
  0% {
    transform: scale(0.5);
    opacity: 0;
    filter: blur(10px);
  }
  100% {
    transform: scale(1);
    opacity: 1;
    filter: blur(0);
  }
}

.animate-border-burn {
  animation: border-burn 0.1s infinite alternate;
}

@keyframes border-burn {
  0% {
    opacity: 0.3;
  }
  100% {
    opacity: 0.7;
  }
}

.fire-fade-enter-active,
.fire-fade-leave-active {
  transition: opacity 0.5s ease;
}
.fire-fade-enter-from,
.fire-fade-leave-to {
  opacity: 0;
}
</style>
