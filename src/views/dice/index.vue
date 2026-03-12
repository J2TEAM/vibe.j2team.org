<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
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
  winCount,
  loseCount,
  halfPlay,
  doublePlay,
  maxPlay,
  roll,
  resetGame,
  clamp,
  isAutoMode,
  isAutoRunning,
  autoSettings,
  autoRollCount,
  startAuto,
  stopAuto,
} = useDiceGame()

// -- UI State --
const showFairness = ref(false)
const fairnessTab = ref<FairnessTab>('seeds')
const showFullHistory = ref(false)
const showDisclaimer = ref(false)

onMounted(() => {
  const hasSeen = localStorage.getItem('dice_disclaimer_seen')
  if (!hasSeen) {
    showDisclaimer.value = true
  }
})

const closeDisclaimer = () => {
  localStorage.setItem('dice_disclaimer_seen', 'true')
  showDisclaimer.value = false
}

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

    <!-- ── Header ── -->
    <div
      class="sticky top-0 z-40 bg-bg-deep/90 backdrop-blur-md border-b border-border-default/50 mb-6"
    >
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 text-xs text-text-secondary border border-border-default bg-bg-surface px-4 py-2 hover:border-accent-sky hover:text-text-primary transition-all uppercase font-black tracking-widest"
        >
          <span class="font-bold">←</span>
          <span>Home</span>
        </RouterLink>
        <div class="flex items-center gap-4">
          <div
            class="bg-bg-surface border border-border-default px-5 py-2 flex flex-col items-end min-w-[160px] relative group transition-all ring-1 ring-border-default/5"
          >
            <div
              class="text-[9px] text-text-dim font-display tracking-[0.2em] uppercase leading-none mb-1 opacity-50 font-black"
            >
              Current Balance
            </div>
            <div class="flex items-center gap-2 relative">
              <div class="w-1.5 h-1.5 rounded-full bg-accent-amber animate-pulse"></div>
              <div
                class="font-display font-black text-accent-amber text-2xl leading-none tracking-tighter"
              >
                {{ balance.toLocaleString() }}
              </div>
              <transition-group name="floating-delta">
                <div
                  v-for="d in floatingDeltas"
                  :key="d.id"
                  class="absolute left-0 -top-8 font-display font-black text-lg pointer-events-none drop-shadow-sm"
                  :class="d.value > 0 ? 'text-accent-sky' : 'text-accent-coral'"
                >
                  {{ d.value > 0 ? '+' : '' }}{{ Math.abs(d.value).toFixed(2) }}
                </div>
              </transition-group>
            </div>
          </div>
          <button
            @click="handleOpenFairness"
            class="w-11 h-11 flex items-center justify-center border border-border-default bg-bg-surface hover:border-accent-amber text-text-secondary transition-all shadow-sm group text-xl"
          >
            🔐
          </button>
        </div>
      </div>
    </div>

    <!-- ── Main Game Layout ── -->
    <div class="max-w-6xl mx-auto px-4 sm:px-6 animate-fade-up">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- SIDEBAR: Interactive Controls (4/12) -->
        <div class="lg:col-span-4 flex flex-col gap-4">
          <!-- Mode Selector -->
          <div class="bg-bg-surface border border-border-default p-1 flex shadow-sm">
            <button
              class="flex-1 py-3.5 text-[10px] font-display font-black tracking-[0.2em] uppercase transition-all"
              :class="
                !isAutoMode
                  ? 'bg-accent-sky text-bg-deep shadow-lg'
                  : 'text-text-dim hover:text-text-secondary'
              "
              @click="isAutoMode = false"
            >
              Manual
            </button>
            <button
              class="flex-1 py-3.5 text-[10px] font-display font-black tracking-[0.2em] uppercase transition-all"
              :class="
                isAutoMode
                  ? 'bg-accent-sky text-bg-deep shadow-lg'
                  : 'text-text-dim hover:text-text-secondary'
              "
              @click="isAutoMode = true"
            >
              Auto
            </button>
          </div>

          <!-- Bet & Action Panel -->
          <div
            class="bg-bg-surface border border-border-default p-6 space-y-6 shadow-2xl relative overflow-hidden group"
          >
            <!-- Decorative corner -->
            <div
              class="absolute top-0 right-0 w-8 h-8 bg-border-default/5 rotate-45 translate-x-4 -translate-y-4"
            ></div>

            <div class="space-y-4">
              <div
                class="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-text-dim opacity-70"
              >
                <span>Bet Amount</span>
                <span v-if="isAutoRunning" class="text-accent-sky flex items-center gap-1.5"
                  ><span class="w-1 h-1 rounded-full bg-accent-sky animate-ping"></span>
                  Active</span
                >
              </div>
              <div class="relative">
                <input
                  v-model.number="playAmount"
                  @input="clamp"
                  type="number"
                  class="w-full bg-bg-elevated border-2 border-border-default px-5 py-4 font-display font-black text-accent-amber text-3xl focus:outline-none focus:border-accent-amber transition-all tracking-tighter"
                  :disabled="isAutoRunning"
                />
                <div class="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button
                    class="px-3 py-2 bg-bg-deep border border-border-default text-[10px] font-black text-text-dim hover:text-white transition-colors"
                    @click="halfPlay"
                  >
                    1/2
                  </button>
                  <button
                    class="px-3 py-2 bg-bg-deep border border-border-default text-[10px] font-black text-text-dim hover:text-white transition-colors"
                    @click="doublePlay"
                  >
                    2x
                  </button>
                  <button
                    class="px-3 py-2 bg-bg-deep border border-border-default text-[10px] font-black text-text-dim hover:text-white transition-colors"
                    @click="maxPlay"
                  >
                    MAX
                  </button>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between py-4 border-t border-border-default/10">
              <span
                class="text-[10px] text-text-dim uppercase font-black tracking-widest opacity-50"
                >Profit on Win</span
              >
              <span class="text-accent-sky font-black font-display text-xl tracking-tighter"
                >+{{ profitOnWin }} POINT</span
              >
            </div>

            <!-- Auto Mode Configuration -->
            <transition name="fade">
              <div
                v-if="isAutoMode"
                class="space-y-5 pt-2 animate-fade-in border-t border-border-default/10"
              >
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label
                      class="text-[9px] font-black uppercase text-text-dim opacity-50 tracking-widest"
                      >On Win</label
                    >
                    <select
                      v-model="autoSettings.onWin"
                      class="w-full bg-bg-elevated border border-border-default text-[10px] p-3 font-display outline-none appearance-none cursor-pointer focus:border-accent-sky"
                    >
                      <option value="reset">Reset</option>
                      <option value="increase">Increase (%)</option>
                    </select>
                  </div>
                  <div v-if="autoSettings.onWin === 'increase'" class="space-y-2">
                    <label class="text-[9px] font-black uppercase text-accent-sky tracking-widest"
                      >Value</label
                    >
                    <input
                      v-model.number="autoSettings.onWinValue"
                      type="number"
                      class="w-full bg-bg-elevated border border-border-default text-xs p-2.5 font-display text-text-primary"
                    />
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label
                      class="text-[9px] font-black uppercase text-text-dim opacity-50 tracking-widest"
                      >On Loss</label
                    >
                    <select
                      v-model="autoSettings.onLose"
                      class="w-full bg-bg-elevated border border-border-default text-[10px] p-3 font-display outline-none appearance-none cursor-pointer focus:border-accent-sky"
                    >
                      <option value="reset">Reset</option>
                      <option value="increase">Increase (%)</option>
                    </select>
                  </div>
                  <div v-if="autoSettings.onLose === 'increase'" class="space-y-2">
                    <label class="text-[9px] font-black uppercase text-accent-coral tracking-widest"
                      >Value</label
                    >
                    <input
                      v-model.number="autoSettings.onLoseValue"
                      type="number"
                      class="w-full bg-bg-elevated border border-border-default text-xs p-2.5 font-display text-text-primary"
                    />
                  </div>
                </div>
              </div>
            </transition>

            <!-- 🎯 MAIN ACTION BUTTON (Moved here) -->
            <div class="pt-4 space-y-4">
              <button
                v-if="!isAutoMode"
                class="w-full py-6 font-display font-black text-2xl tracking-[0.5em] uppercase transition-all transform active:scale-[0.97] shadow-xl border-b-[6px] hover:brightness-110 disabled:opacity-50 disabled:grayscale"
                :class="
                  mode === 'under'
                    ? 'bg-accent-sky text-bg-deep border-accent-sky/40'
                    : 'bg-accent-coral text-bg-deep border-accent-coral/40'
                "
                :disabled="isRolling || playAmount <= 0"
                @click="roll"
              >
                <div v-if="isRolling" class="flex items-center justify-center gap-3">
                  <span class="w-2.5 h-2.5 bg-bg-deep rounded-full animate-bounce"></span>
                  Rolling
                </div>
                <span v-else>Roll Now</span>
              </button>

              <div v-else class="flex gap-2">
                <button
                  v-if="!isAutoRunning"
                  class="flex-1 py-6 bg-accent-sky text-bg-deep font-display font-black text-base tracking-[0.2em] uppercase shadow-lg shadow-accent-sky/10 hover:brightness-110 active:scale-[0.97] transition-all"
                  @click="startAuto"
                >
                  Start Auto
                </button>
                <button
                  v-else
                  class="flex-1 py-6 bg-accent-coral text-bg-deep font-display font-black text-base tracking-[0.2em] uppercase shadow-lg shadow-accent-coral/10 animate-pulse active:scale-[0.97] transition-all"
                  @click="stopAuto"
                >
                  Stop ({{ autoRollCount }})
                </button>
              </div>

              <button
                class="w-full py-3.5 text-[9px] font-black tracking-[0.3em] border border-border-default text-text-dim hover:text-white hover:border-accent-amber/30 uppercase transition-all"
                @click="resetGame"
              >
                Reset Gameplay
              </button>
            </div>
          </div>

          <!-- Fairness Prompt -->
          <div class="flex justify-center">
            <button
              @click="showFullHistory = true"
              class="text-[9px] text-text-dim hover:text-accent-amber transition-colors flex items-center gap-2 font-display uppercase tracking-widest font-black group opacity-60 hover:opacity-100"
            >
              View Full Game Log →
            </button>
          </div>
        </div>

        <!-- MAIN AREA: Result Visualization (8/12) -->
        <div class="lg:col-span-8 flex flex-col gap-6">
          <div
            class="bg-bg-surface border border-border-default py-4 px-8 shadow-2xl relative flex flex-col items-center justify-start overflow-hidden"
          >
            <!-- Result History Bar (Fixed height to prevent jumping) -->
            <div class="w-full h-12 flex justify-center items-center gap-2 mb-2 animate-fade-in">
              <template v-if="history.length > 0">
                <span
                  v-for="item in history.slice(0, 10).reverse()"
                  :key="item.nonce"
                  class="w-11 h-11 flex items-center justify-center border font-display text-xs font-black transition-all cursor-pointer hover:scale-105"
                  :class="
                    item.won
                      ? 'border-accent-sky/40 text-accent-sky bg-accent-sky/5 shadow-[inset_0_0_10px_rgba(56,189,248,0.1)]'
                      : 'border-accent-coral/40 text-accent-coral bg-accent-coral/5 shadow-[inset_0_0_10px_rgba(255,107,74,0.1)]'
                  "
                  @click="openVerify(item)"
                  >{{ item.result }}</span
                >
              </template>
              <div
                v-else
                class="text-[10px] font-black uppercase tracking-[0.3em] text-text-dim opacity-30 mt-2"
              >
                Awaiting Session Initiation...
              </div>
            </div>

            <!-- Stats Overlay (Moved down to avoid History overlap) -->
            <div class="absolute top-20 left-12 animate-fade-in pointer-events-none">
              <div
                class="text-[9px] font-black text-text-dim uppercase tracking-widest opacity-40 mb-1"
              >
                Multiplier
              </div>
              <div
                class="text-4xl font-black font-display text-accent-amber drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
              >
                ×{{ multiplier }}
              </div>
            </div>
            <div class="absolute top-20 right-12 text-right animate-fade-in pointer-events-none">
              <div
                class="text-[9px] font-black text-text-dim uppercase tracking-widest opacity-40 mb-1"
              >
                Win Chance
              </div>
              <div
                class="text-4xl font-black font-display text-text-primary drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
              >
                {{ chanceToWin }}%
              </div>
            </div>

            <!-- The Wheel Widget (Compact Size) -->
            <div
              class="relative w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] flex items-center justify-center select-none group"
            >
              <div
                class="absolute inset-0 rounded-full border-2 border-border-default/5 scale-[1.15] -rotate-45 border-dashed group-hover:rotate-45 transition-transform duration-[4s]"
              ></div>

              <svg viewBox="0 0 100 100" class="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="41"
                  fill="none"
                  stroke="rgba(255,255,255,0.02)"
                  stroke-width="5"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="41"
                  fill="none"
                  stroke-width="5"
                  stroke-linecap="round"
                  stroke-dasharray="257.61"
                  :stroke-dashoffset="
                    257.61 * (1 - (mode === 'under' ? prediction : 100 - (prediction + 1)) / 100)
                  "
                  :transform="mode === 'over' ? `rotate(${(prediction + 1) * 3.6} 50 50)` : ''"
                  class="transition-all duration-1000 cubic-bezier(0.19, 1, 0.22, 1)"
                  :class="mode === 'under' ? 'text-accent-sky' : 'text-accent-coral'"
                  style="filter: drop-shadow(0 0 15px currentColor)"
                />

                <g class="rotate-90 origin-center opacity-30">
                  <template v-for="val in [0, 25, 50, 75, 99]" :key="val">
                    <circle
                      :cx="50 + 46 * Math.cos((val * 3.6 - 90) * (Math.PI / 180))"
                      :cy="50 + 46 * Math.sin((val * 3.6 - 90) * (Math.PI / 180))"
                      r="0.8"
                      fill="#4A6180"
                    />
                    <text
                      :x="50 + 56 * Math.cos((val * 3.6 - 90) * (Math.PI / 180))"
                      :y="50 + 56 * Math.sin((val * 3.6 - 90) * (Math.PI / 180))"
                      fill="#8B9DB5"
                      font-family="Anybody"
                      font-weight="black"
                      font-size="4"
                      text-anchor="middle"
                      alignment-baseline="middle"
                    >
                      {{ val }}
                    </text>
                  </template>
                </g>

                <!-- The Spear (Result Indicator) - Sharper and dynamic color -->
                <g
                  class="transition-transform duration-[2.5s] cubic-bezier(0.19, 1, 0.22, 1)"
                  :style="{
                    transform: `rotate(${(luckyNumber ?? (isRolling ? 720 : 0)) * 3.6}deg)`,
                    transformOrigin: 'center',
                  }"
                  :class="{ 'animate-gauge-roll-fast': isRolling }"
                >
                  <path
                    d="M50 10 L47 24 L50 20 L53 24 Z"
                    :fill="
                      lastResult === 'win'
                        ? '#38BDF8'
                        : lastResult === 'lose'
                          ? '#FF6B4A'
                          : '#FFFFFF'
                    "
                    :class="
                      lastResult === 'win'
                        ? 'drop-shadow-[0_0_15px_#38BDF8]'
                        : lastResult === 'lose'
                          ? 'drop-shadow-[0_0_15px_#FF6B4A]'
                          : 'drop-shadow-[0_0_10px_white]'
                    "
                  />
                </g>
              </svg>

              <div class="z-20 flex flex-col items-center translate-y-2">
                <span
                  class="font-display font-black text-[100px] sm:text-[140px] leading-none tracking-tighter drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]"
                  :class="
                    lastResult === 'win'
                      ? 'text-accent-sky'
                      : lastResult === 'lose'
                        ? 'text-accent-coral'
                        : 'text-text-primary'
                  "
                >
                  {{ luckyNumber ?? prediction }}
                </span>
                <button
                  class="mt-4 bg-bg-deep/90 px-8 py-3 border border-border-default text-xs font-black uppercase tracking-[0.3em] text-text-secondary hover:text-white hover:border-accent-amber transition-all group flex items-center gap-4 shadow-xl"
                  @click="mode = mode === 'under' ? 'over' : 'under'"
                >
                  <span
                    >{{ mode }}
                    <span :class="mode === 'under' ? 'text-accent-sky' : 'text-accent-coral'">{{
                      prediction
                    }}</span></span
                  >
                  <span
                    class="text-accent-amber group-hover:rotate-180 transition-transform duration-500"
                    >🔄</span
                  >
                </button>
              </div>
            </div>

            <!-- Integrated Slider Area (Ultra Compact) -->
            <div
              class="w-full max-w-2xl bg-bg-deep/50 p-6 rounded-sm border border-border-default/30 shadow-inner mt-1"
            >
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
                class="flex justify-between items-center mt-8 text-[11px] font-black uppercase tracking-[0.2em] font-display"
              >
                <div
                  class="bg-bg-deep border border-accent-sky px-5 py-2 shadow-lg shadow-accent-sky/5"
                >
                  <span class="opacity-40 text-[9px] block mb-1">Under</span>
                  <span class="text-accent-sky text-2xl tracking-tight">{{ prediction }}</span>
                </div>
                <div
                  class="opacity-30 italic text-[9px] font-medium border-b border-border-default pb-1"
                >
                  Slide to modify probability
                </div>
                <div
                  class="bg-bg-deep border border-accent-coral px-5 py-2 shadow-lg shadow-accent-coral/5 text-right"
                >
                  <span class="opacity-40 text-[9px] block mb-1">Over</span>
                  <span class="text-accent-coral text-2xl tracking-tight">{{
                    100 - prediction
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Session Intelligence Board -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
        <div
          class="bg-bg-surface border border-border-default p-5 flex items-center justify-between shadow-sm relative overflow-hidden"
        >
          <div class="z-10 flex flex-col">
            <span
              class="text-[9px] font-black text-text-dim uppercase tracking-widest mb-1 opacity-50"
              >Wins</span
            >
            <span class="text-accent-sky font-black text-2xl drop-shadow-sm">{{ winCount }}</span>
          </div>
          <div
            class="absolute right-0 bottom-0 opacity-[0.03] text-6xl font-black translate-x-2 translate-y-2"
          >
            W
          </div>
        </div>
        <div
          class="bg-bg-surface border border-border-default p-5 flex items-center justify-between shadow-sm relative overflow-hidden"
        >
          <div class="z-10 flex flex-col">
            <span
              class="text-[9px] font-black text-text-dim uppercase tracking-widest mb-1 opacity-50"
              >Losses</span
            >
            <span class="text-accent-coral font-black text-2xl drop-shadow-sm">{{
              loseCount
            }}</span>
          </div>
          <div
            class="absolute right-0 bottom-0 opacity-[0.03] text-6xl font-black translate-x-2 translate-y-2"
          >
            L
          </div>
        </div>
        <div
          class="bg-bg-surface border border-border-default p-5 flex items-center justify-between shadow-sm relative overflow-hidden"
        >
          <div class="z-10 flex flex-col">
            <span
              class="text-[9px] font-black text-text-dim uppercase tracking-widest mb-1 opacity-50"
              >Win Rate</span
            >
            <span class="text-white font-black text-2xl drop-shadow-sm"
              >{{ history.length ? ((winCount / history.length) * 100).toFixed(1) : 0 }}%</span
            >
          </div>
          <div
            class="absolute right-0 bottom-0 opacity-[0.03] text-6xl font-black translate-x-2 translate-y-2"
          >
            %
          </div>
        </div>
      </div>

      <HistoryList
        v-model:is-open="showFullHistory"
        :history="history"
        :win-count="winCount"
        :lose-count="loseCount"
        @verify="openVerify"
      />

      <!-- 📖 HƯỚNG DẪN CÁCH CHƠI -->
      <div
        class="mt-12 bg-bg-surface border border-border-default p-8 shadow-sm relative overflow-hidden group"
      >
        <div
          class="absolute top-0 left-0 w-1 h-full bg-accent-amber opacity-30 group-hover:opacity-100 transition-opacity"
        ></div>
        <h3
          class="font-display font-black text-lg tracking-[0.3em] uppercase mb-10 flex items-center gap-4"
        >
          <span class="text-accent-amber animate-pulse">📖</span>
          <span>HƯỚNG DẪN CÁCH CHƠI</span>
          <span class="h-px flex-1 bg-border-default/20"></span>
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div class="space-y-4 relative">
            <div
              class="text-accent-sky font-display font-black text-3xl opacity-20 absolute -top-4 -left-2"
            >
              01
            </div>
            <div class="relative z-10">
              <div class="text-[11px] font-black uppercase tracking-widest text-white mb-2">
                Thiết lập ngân sách
              </div>
              <p class="text-[11px] text-text-dim leading-relaxed">
                Nhập số tiền bạn muốn chơi vào ô
                <span class="text-accent-amber font-bold">Bet Amount</span>. Sử dụng các nút
                <span class="text-white/60">1/2</span> hoặc <span class="text-white/60">x2</span> để
                điều chỉnh nhanh số tiền cược.
              </p>
            </div>
          </div>

          <div class="space-y-4 relative">
            <div
              class="text-accent-sky font-display font-black text-3xl opacity-20 absolute -top-4 -left-2"
            >
              02
            </div>
            <div class="relative z-10">
              <div class="text-[11px] font-black uppercase tracking-widest text-white mb-2">
                Cân não xác suất
              </div>
              <p class="text-[11px] text-text-dim leading-relaxed">
                Kéo thanh <span class="text-accent-sky font-bold">Slider</span> để thay đổi tỷ lệ
                thắng.
                <span class="italic"
                  >Xác suất thắng càng thấp, tiền thưởng (Multiplier) nhận được sẽ càng cao!</span
                >
              </p>
            </div>
          </div>

          <div class="space-y-4 relative">
            <div
              class="text-accent-sky font-display font-black text-3xl opacity-20 absolute -top-4 -left-2"
            >
              03
            </div>
            <div class="relative z-10">
              <div class="text-[11px] font-black uppercase tracking-widest text-white mb-2">
                Chọn chế độ chơi
              </div>
              <p class="text-[11px] text-text-dim leading-relaxed">
                Chọn <span class="text-accent-sky font-bold">Under</span> (Dưới) hoặc
                <span class="text-accent-coral font-bold">Over</span> (Trên). Hệ thống sẽ tính toán
                vùng thắng (Xanh) và vùng thua (Đỏ) tương ứng trên vòng quay.
              </p>
            </div>
          </div>

          <div class="space-y-4 relative">
            <div
              class="text-accent-sky font-display font-black text-3xl opacity-20 absolute -top-4 -left-2"
            >
              04
            </div>
            <div class="relative z-10">
              <div class="text-[11px] font-black uppercase tracking-widest text-white mb-2">
                Khai hỏa & Nhận thưởng
              </div>
              <p class="text-[11px] text-text-dim leading-relaxed">
                Nhấn <span class="text-accent-sky font-bold">ROLL NOW</span>. Nếu con số may mắn do
                <span class="text-white font-bold">Mũi giáo</span> chỉ vào nằm trong vùng dự đoán
                của bạn, bạn sẽ thắng cược!
              </p>
            </div>
          </div>
        </div>

        <div class="mt-8 pt-6 border-t border-border-default/10 flex items-center gap-3">
          <span class="w-2 h-2 rounded-full bg-accent-sky"></span>
          <span class="text-[9px] font-black uppercase tracking-widest text-text-dim"
            >Mẹo: Sử dụng chế độ <span class="text-accent-sky">AUTO</span> để tự động đánh theo
            chiến thuật tăng/giảm tiền cược khi thắng hoặc thua.</span
          >
        </div>
      </div>
    </div>

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
    <BackToTop />

    <!-- ⚠️ Disclaimer Modal (Only shown on first visit) -->
    <Teleport to="body">
      <transition name="fade">
        <div
          v-if="showDisclaimer"
          class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        >
          <div class="absolute inset-0 bg-black/85 backdrop-blur-md" />
          <div
            class="relative w-full max-w-md bg-bg-surface border border-accent-amber/30 p-8 shadow-2xl text-center animate-fade-in"
          >
            <div class="text-accent-amber text-5xl mb-6">⚠️</div>
            <h2 class="font-display font-black text-xl tracking-widest text-white mb-4 uppercase">
              CẢNH BÁO TRÁCH NHIỆM
            </h2>
            <p class="text-text-dim text-sm leading-relaxed mb-8 font-medium">
              Đây là trò chơi, không phải nền tảng cờ bạc. <br />
              Số dư trong game
              <span class="text-accent-amber font-bold">không có giá trị tiền tệ</span> và
              <span class="text-accent-amber font-bold">không thể quy đổi</span> dưới bất kỳ hình
              thức nào.
            </p>
            <button
              @click="closeDisclaimer"
              class="w-full bg-accent-amber hover:bg-accent-amber/80 text-bg-deep font-display font-black py-4 tracking-[0.2em] transition-all uppercase shadow-lg shadow-accent-amber/10 active:scale-95"
            >
              Tôi đã hiểu và đồng ý
            </button>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped>
.dice-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 16px;
  border-radius: 8px;
  outline: none;
  cursor: pointer;
  box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.4);
}
.dice-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 44px;
  height: 44px;
  background: #f0ede6;
  border: 6px solid #0f1923;
  border-radius: 8px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.6);
  cursor: grab;
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.dice-slider::-webkit-slider-thumb:active {
  cursor: grabbing;
  transform: scale(1.15);
  border-color: #38bdf8;
  box-shadow: 0 0 30px rgba(56, 189, 248, 0.4);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes gauge-roll {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.animate-gauge-roll-fast {
  animation: gauge-roll 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
</style>
