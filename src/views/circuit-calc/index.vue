<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'

type Mode = 'series' | 'parallel' | 'regulator' | 'node'

const activeMode = ref<Mode>('series')

// --- Formats ---
const format = (val: number | null) => (val === null ? null : Number(val.toFixed(3)))

// --- Series Mode ---
const seriesVin = ref<number | null>(12)
const seriesR1 = ref<number | null>(10)
const seriesR2 = ref<number | null>(10)
const seriesVout = ref<number | null>(6)

function solveSeries(target: 'Vin' | 'R1' | 'R2' | 'Vout') {
  const v = seriesVin.value ?? 0
  const r1 = seriesR1.value ?? 0
  const r2 = seriesR2.value ?? 0
  const vo = seriesVout.value ?? 0

  if (target === 'Vout') {
    if (r1 + r2 === 0) return
    seriesVout.value = format((v * r2) / (r1 + r2))
  } else if (target === 'Vin') {
    if (r2 === 0) return
    seriesVin.value = format((vo * (r1 + r2)) / r2)
  } else if (target === 'R1') {
    if (vo === 0) return
    seriesR1.value = format(r2 * (v / vo - 1))
  } else if (target === 'R2') {
    if (v - vo === 0) return
    seriesR2.value = format((vo * r1) / (v - vo))
  }
}

// --- Parallel Mode ---
const parallelR1 = ref<number | null>(10)
const parallelR2 = ref<number | null>(10)
const parallelRTotal = ref<number | null>(5)

function solveParallel(target: 'R1' | 'R2' | 'RT') {
  const r1 = parallelR1.value ?? 0
  const r2 = parallelR2.value ?? 0
  const rt = parallelRTotal.value ?? 0

  if (target === 'RT') {
    if (r1 + r2 === 0) return
    parallelRTotal.value = format((r1 * r2) / (r1 + r2))
  } else if (target === 'R1') {
    if (r2 - rt === 0) return
    parallelR1.value = format((rt * r2) / (r2 - rt))
  } else if (target === 'R2') {
    if (r1 - rt === 0) return
    parallelR2.value = format((rt * r1) / (r1 - rt))
  }
}

// --- Regulator Mode ---
const regRef = ref<number | null>(1.25)
const regR1 = ref<number | null>(240)
const regR2 = ref<number | null>(720)
const regVout = ref<number | null>(5)

function solveRegulator(target: 'R1' | 'R2' | 'Vout' | 'Vref') {
  const refV = regRef.value ?? 0
  const r1 = regR1.value ?? 0
  const r2 = regR2.value ?? 0
  const vo = regVout.value ?? 0

  if (target === 'Vout') {
    if (r1 === 0) return
    regVout.value = format(refV * (1 + r2 / r1))
  } else if (target === 'R1') {
    if (vo / refV - 1 === 0) return
    regR1.value = format(r2 / (vo / refV - 1))
  } else if (target === 'R2') {
    if (refV === 0) return
    regR2.value = format(r1 * (vo / refV - 1))
  } else if (target === 'Vref') {
    if (1 + r2 / r1 === 0) return
    regRef.value = format(vo / (1 + r2 / r1))
  }
}

// --- Node Mode ---
const nodeV1 = ref<number | null>(12)
const nodeV2 = ref<number | null>(5)
const nodeR1 = ref<number | null>(10)
const nodeR2 = ref<number | null>(10)
const nodeR3 = ref<number | null>(10)
const nodeV3 = ref<number | null>(4.286)

function solveNode(target: 'V3' | 'V1' | 'V2') {
  const v1 = nodeV1.value ?? 0
  const v2 = nodeV2.value ?? 0
  const r1 = nodeR1.value ?? 0
  const r2 = nodeR2.value ?? 0
  const r3 = nodeR3.value ?? 0
  const v3 = nodeV3.value ?? 0

  if (target === 'V3') {
    const denom = 1 / r1 + 1 / r2 + 1 / r3
    if (denom === 0) return
    nodeV3.value = format((v1 / r1 + v2 / r2) / denom)
  } else if (target === 'V1') {
    nodeV1.value = format(r1 * (v3 * (1 / r1 + 1 / r2 + 1 / r3) - v2 / r2))
  } else if (target === 'V2') {
    nodeV2.value = format(r2 * (v3 * (1 / r1 + 1 / r2 + 1 / r3) - v1 / r1))
  }
}

function resetInputs() {
  if (activeMode.value === 'series') {
    seriesVin.value = seriesR1.value = seriesR2.value = seriesVout.value = null
  } else if (activeMode.value === 'parallel') {
    parallelR1.value = parallelR2.value = parallelRTotal.value = null
  } else if (activeMode.value === 'regulator') {
    regRef.value = 1.25
    regR1.value = regR2.value = regVout.value = null
  } else if (activeMode.value === 'node') {
    nodeV1.value = nodeV2.value = nodeR1.value = nodeR2.value = nodeR3.value = nodeV3.value = null
  }
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body pb-20">
    <div class="max-w-5xl mx-auto px-6 py-12">
      <!-- Header -->
      <header class="mb-16 relative">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 text-text-dim hover:text-accent-coral transition-colors mb-8 group text-xs tracking-[0.2em] font-display"
        >
          <Icon
            icon="lucide:arrow-left"
            class="size-3 group-hover:-translate-x-1 transition-transform"
          />
          <span>TRANG CHỦ</span>
        </RouterLink>

        <div class="relative">
          <!-- Title -->
          <h1
            class="font-display text-6xl md:text-8xl font-bold text-text-primary tracking-tighter mb-6 flex items-baseline leading-[0.8]"
          >
            Circuit<span class="text-accent-coral mx-px">.</span>Calc
          </h1>

          <!-- Tagline -->
          <div class="flex items-center gap-4 text-text-dim">
            <div class="w-1.5 h-10 bg-accent-amber"></div>
            <p class="text-lg md:text-xl font-body leading-tight">
              Công cụ tính cầu phân áp, điện trở song song và các mạch phổ biến
            </p>
          </div>

          <!-- Badge -->
          <div class="absolute -top-12 md:-top-4 right-0 md:right-8">
            <div
              class="bg-accent-coral text-bg-deep px-4 py-1.5 font-display font-black text-[10px] md:text-xs tracking-[0.2em] uppercase transform rotate-3 shadow-[8px_8px_0_var(--color-bg-elevated)]"
            >
              VOL.01 / 2026
            </div>
          </div>
        </div>
      </header>

      <!-- Tabs Navigation -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8 animate-fade-up">
        <button
          v-for="mode in ['series', 'parallel', 'regulator', 'node'] as Mode[]"
          :key="mode"
          @click="activeMode = mode"
          class="px-4 py-4 text-xs font-display font-bold tracking-widest uppercase border transition-all duration-300 flex flex-col items-center gap-3"
          :class="
            activeMode === mode
              ? 'bg-bg-elevated border-accent-coral text-accent-coral'
              : 'bg-bg-surface border-border-default text-text-dim hover:border-text-secondary hover:text-text-secondary'
          "
        >
          <Icon
            :icon="
              mode === 'series'
                ? 'lucide:layers'
                : mode === 'parallel'
                  ? 'lucide:grid'
                  : mode === 'regulator'
                    ? 'lucide:cpu'
                    : 'lucide:network'
            "
            class="size-6"
          />
          <span class="text-center">
            {{
              mode === 'series'
                ? 'Cầu phân áp'
                : mode === 'parallel'
                  ? 'Trở song song'
                  : mode === 'regulator'
                    ? 'IC Ổn áp'
                    : 'Điểm nút'
            }}
          </span>
        </button>
      </div>

      <!-- Main Calculator Section -->
      <div
        class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 items-stretch animate-fade-up animate-delay-1"
      >
        <!-- Diagram Side -->
        <div
          class="border border-border-default bg-bg-surface p-1 relative overflow-hidden flex flex-col items-center justify-center min-h-[400px] h-full"
        >
          <span
            class="absolute top-3 right-4 font-display text-6xl font-bold text-accent-coral/5 select-none pointer-events-none uppercase"
          >
            {{ activeMode }}
          </span>

          <!-- Series Diagram -->
          <svg
            v-if="activeMode === 'series'"
            width="220"
            height="300"
            viewBox="0 0 220 300"
            class="text-text-secondary"
          >
            <!-- Wires & Components -->
            <line x1="110" y1="30" x2="110" y2="70" stroke="currentColor" stroke-width="2" />

            <rect
              x="90"
              y="70"
              width="40"
              height="60"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            />
            <text
              x="110"
              y="105"
              fill="currentColor"
              class="font-display font-bold text-[10px]"
              text-anchor="middle"
            >
              R1
            </text>

            <line x1="110" y1="130" x2="110" y2="170" stroke="currentColor" stroke-width="2" />
            <circle cx="110" cy="150" r="4" fill="var(--color-accent-coral)" />
            <line x1="110" y1="150" x2="170" y2="150" stroke="currentColor" stroke-width="2" />

            <rect
              x="90"
              y="170"
              width="40"
              height="60"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            />
            <text
              x="110"
              y="205"
              fill="currentColor"
              class="font-display font-bold text-[10px]"
              text-anchor="middle"
            >
              R2
            </text>

            <line x1="110" y1="230" x2="110" y2="250" stroke="currentColor" stroke-width="2" />
            <!-- Ground -->
            <line x1="90" y1="250" x2="130" y2="250" stroke="currentColor" stroke-width="2" />
            <line x1="95" y1="258" x2="125" y2="258" stroke="currentColor" stroke-width="2" />
            <line x1="105" y1="266" x2="115" y2="266" stroke="currentColor" stroke-width="2" />

            <!-- Dynamic Value Badges -->
            <g v-if="seriesVin">
              <rect x="65" y="5" width="45" height="20" fill="var(--color-accent-coral)" />
              <text
                x="87"
                y="19"
                fill="white"
                class="font-display font-bold text-[10px]"
                text-anchor="middle"
              >
                {{ seriesVin }}V
              </text>
            </g>
            <g v-if="seriesR1">
              <rect x="140" y="90" width="45" height="20" fill="var(--color-accent-coral)" />
              <text
                x="162"
                y="104"
                fill="white"
                class="font-display font-bold text-[10px]"
                text-anchor="middle"
              >
                {{ seriesR1 }}Ω
              </text>
            </g>
            <g v-if="seriesVout">
              <rect x="175" y="140" width="45" height="20" fill="var(--color-accent-amber)" />
              <text
                x="197"
                y="154"
                fill="black"
                class="font-display font-bold text-[10px]"
                text-anchor="middle"
              >
                {{ seriesVout }}V
              </text>
            </g>
            <g v-if="seriesR2">
              <rect x="140" y="190" width="45" height="20" fill="var(--color-accent-coral)" />
              <text
                x="162"
                y="204"
                fill="white"
                class="font-display font-bold text-[10px]"
                text-anchor="middle"
              >
                {{ seriesR2 }}Ω
              </text>
            </g>
          </svg>

          <!-- Parallel Diagram -->
          <svg
            v-if="activeMode === 'parallel'"
            width="260"
            height="220"
            viewBox="0 0 260 220"
            class="text-text-secondary"
          >
            <line x1="40" y1="100" x2="80" y2="100" stroke="currentColor" stroke-width="2" />
            <line x1="80" y1="40" x2="80" y2="160" stroke="currentColor" stroke-width="2" />

            <rect
              x="100"
              y="20"
              width="60"
              height="40"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            />
            <text
              x="130"
              y="45"
              fill="currentColor"
              class="font-display font-bold text-[10px]"
              text-anchor="middle"
            >
              R1
            </text>

            <rect
              x="100"
              y="140"
              width="60"
              height="40"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            />
            <text
              x="130"
              y="165"
              fill="currentColor"
              class="font-display font-bold text-[10px]"
              text-anchor="middle"
            >
              R2
            </text>

            <line x1="80" y1="40" x2="100" y2="40" stroke="currentColor" stroke-width="2" />
            <line x1="80" y1="160" x2="100" y2="160" stroke="currentColor" stroke-width="2" />
            <line x1="160" y1="40" x2="180" y2="40" stroke="currentColor" stroke-width="2" />
            <line x1="160" y1="160" x2="180" y2="160" stroke="currentColor" stroke-width="2" />
            <line x1="180" y1="40" x2="180" y2="160" stroke="currentColor" stroke-width="2" />
            <line x1="180" y1="100" x2="220" y2="100" stroke="currentColor" stroke-width="2" />

            <text
              x="240"
              y="105"
              fill="currentColor"
              class="font-display font-bold text-[10px]"
              text-anchor="middle"
            >
              RT
            </text>

            <g v-if="parallelR1">
              <rect x="107" y="65" width="45" height="20" fill="var(--color-accent-coral)" />
              <text
                x="129"
                y="79"
                fill="white"
                class="font-display font-bold text-[10px]"
                text-anchor="middle"
              >
                {{ parallelR1 }}Ω
              </text>
            </g>
            <g v-if="parallelR2">
              <rect x="107" y="105" width="45" height="20" fill="var(--color-accent-coral)" />
              <text
                x="129"
                y="119"
                fill="white"
                class="font-display font-bold text-[10px]"
                text-anchor="middle"
              >
                {{ parallelR2 }}Ω
              </text>
            </g>
            <g v-if="parallelRTotal">
              <rect x="200" y="75" width="50" height="20" fill="var(--color-accent-amber)" />
              <text
                x="225"
                y="89"
                fill="black"
                class="font-display font-bold text-[10px]"
                text-anchor="middle"
              >
                {{ parallelRTotal }}Ω
              </text>
            </g>
          </svg>

          <!-- Regulator Diagram (Improved) -->
          <svg
            v-if="activeMode === 'regulator'"
            width="300"
            height="220"
            viewBox="0 0 300 220"
            class="text-text-secondary"
          >
            <!-- Regulator Symbol -->
            <rect
              x="100"
              y="60"
              width="70"
              height="40"
              fill="var(--color-bg-elevated)"
              stroke="currentColor"
              stroke-width="2"
            />
            <text
              x="135"
              y="85"
              fill="currentColor"
              text-anchor="middle"
              class="font-display text-[9px] font-bold"
            >
              REG
            </text>

            <!-- Input Wire -->
            <line x1="30" y1="80" x2="100" y2="80" stroke="currentColor" stroke-width="2" />
            <text
              x="25"
              y="85"
              fill="currentColor"
              class="font-display font-bold text-xs"
              text-anchor="end"
            >
              Vin
            </text>

            <!-- Node/Middle Wire -->
            <line x1="170" y1="80" x2="230" y2="80" stroke="currentColor" stroke-width="2" />
            <circle cx="210" cy="80" r="3" fill="currentColor" />

            <!-- ADJ Wire and Resistor R1 -->
            <line x1="135" y1="100" x2="135" y2="130" stroke="currentColor" stroke-width="2" />
            <line x1="135" y1="130" x2="210" y2="130" stroke="currentColor" stroke-width="2" />
            <line x1="210" y1="80" x2="210" y2="100" stroke="currentColor" stroke-width="2" />

            <!-- R1 Rectangle and Label (Inside) -->
            <rect
              x="200"
              y="100"
              width="20"
              height="30"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            />
            <text
              x="210"
              y="118"
              fill="currentColor"
              class="font-display font-bold text-[8px]"
              text-anchor="middle"
            >
              R1
            </text>

            <g v-if="regR1">
              <rect x="225" y="105" width="45" height="18" fill="var(--color-accent-coral)" />
              <text
                x="247"
                y="118"
                fill="white"
                class="font-display font-bold text-[9px]"
                text-anchor="middle"
              >
                {{ regR1 }}Ω
              </text>
            </g>

            <!-- Lower Resistor R2 -->
            <line x1="135" y1="130" x2="135" y2="150" stroke="currentColor" stroke-width="2" />

            <!-- R2 Rectangle and Label (Inside) -->
            <rect
              x="125"
              y="150"
              width="20"
              height="30"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            />
            <text
              x="135"
              y="168"
              fill="currentColor"
              class="font-display font-bold text-[8px]"
              text-anchor="middle"
            >
              R2
            </text>

            <g v-if="regR2">
              <rect x="75" y="155" width="45" height="18" fill="var(--color-accent-coral)" />
              <text
                x="97"
                y="168"
                fill="white"
                class="font-display font-bold text-[9px]"
                text-anchor="middle"
              >
                {{ regR2 }}Ω
              </text>
            </g>

            <line x1="135" y1="180" x2="135" y2="195" stroke="currentColor" stroke-width="2" />
            <!-- Ground -->
            <line x1="125" y1="195" x2="145" y2="195" stroke="currentColor" stroke-width="2" />
            <line x1="128" y1="200" x2="142" y2="200" stroke="currentColor" stroke-width="1" />
            <line x1="131" y1="205" x2="139" y2="205" stroke="currentColor" stroke-width="1" />

            <!-- Outcome -->
            <text
              x="235"
              y="70"
              fill="currentColor"
              class="font-display font-bold text-xs"
              text-anchor="start"
            >
              Vout
            </text>
            <g v-if="regVout">
              <rect x="235" y="75" width="45" height="18" fill="var(--color-accent-amber)" />
              <text
                x="257"
                y="88"
                fill="black"
                class="font-display font-bold text-[9px]"
                text-anchor="middle"
              >
                {{ regVout }}V
              </text>
            </g>
          </svg>

          <!-- Node Diagram -->
          <svg
            v-if="activeMode === 'node'"
            width="280"
            height="240"
            viewBox="0 0 280 240"
            class="text-text-secondary"
          >
            <circle cx="160" cy="110" r="4" fill="var(--color-accent-coral)" />
            <line x1="40" y1="60" x2="90" y2="60" stroke="currentColor" stroke-width="2" />

            <rect
              x="90"
              y="40"
              width="50"
              height="40"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            />
            <text
              x="115"
              y="65"
              fill="currentColor"
              class="font-display font-bold text-[10px]"
              text-anchor="middle"
            >
              R1
            </text>

            <line x1="140" y1="60" x2="160" y2="60" stroke="currentColor" stroke-width="2" />

            <line x1="40" y1="160" x2="90" y2="160" stroke="currentColor" stroke-width="2" />

            <rect
              x="90"
              y="140"
              width="50"
              height="40"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            />
            <text
              x="115"
              y="165"
              fill="currentColor"
              class="font-display font-bold text-[10px]"
              text-anchor="middle"
            >
              R2
            </text>

            <line x1="140" y1="160" x2="160" y2="160" stroke="currentColor" stroke-width="2" />

            <line x1="160" y1="60" x2="160" y2="160" stroke="currentColor" stroke-width="2" />
            <line x1="160" y1="110" x2="200" y2="110" stroke="currentColor" stroke-width="2" />

            <rect
              x="200"
              y="95"
              width="40"
              height="50"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            />
            <text
              x="220"
              y="125"
              fill="currentColor"
              class="font-display font-bold text-[10px]"
              text-anchor="middle"
            >
              R3
            </text>

            <line x1="220" y1="145" x2="220" y2="165" stroke="currentColor" stroke-width="2" />

            <!-- Dinamic Values -->
            <g v-if="nodeV1">
              <rect x="35" y="32" width="40" height="18" fill="var(--color-accent-coral)" />
              <text
                x="55"
                y="45"
                fill="white"
                class="font-display font-bold text-[9px]"
                text-anchor="middle"
              >
                {{ nodeV1 }}V
              </text>
            </g>
            <g v-if="nodeV2">
              <rect x="35" y="132" width="40" height="18" fill="var(--color-accent-coral)" />
              <text
                x="55"
                y="145"
                fill="white"
                class="font-display font-bold text-[9px]"
                text-anchor="middle"
              >
                {{ nodeV2 }}V
              </text>
            </g>
            <g v-if="nodeV3">
              <rect x="110" y="101" width="45" height="18" fill="var(--color-accent-amber)" />
              <text
                x="132"
                y="114"
                fill="black"
                class="font-display font-bold text-[9px]"
                text-anchor="middle"
              >
                {{ nodeV3 }}V
              </text>
            </g>
          </svg>
        </div>

        <!-- Input Side -->
        <div
          class="border border-border-default bg-bg-surface p-8 min-h-[400px] h-full flex flex-col"
        >
          <h2
            class="font-display text-xl font-semibold mb-8 flex items-center gap-3 uppercase tracking-wider"
          >
            <span class="text-accent-coral text-sm font-display tracking-widest">//</span>
            Nhập & Tính toán
          </h2>

          <!-- Helper Component for Input Rows -->
          <div class="space-y-6">
            <!-- SERIES -->
            <template v-if="activeMode === 'series'">
              <div class="grid gap-4">
                <div class="flex h-11">
                  <button
                    @click="solveSeries('Vin')"
                    class="w-24 h-full bg-bg-elevated border border-border-default border-r-0 px-4 font-display font-bold text-xs hover:text-accent-coral transition-all whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    Vin
                  </button>
                  <input
                    v-model="seriesVin"
                    type="number"
                    class="w-full h-full bg-bg-surface border border-border-default px-4 focus:border-accent-coral focus:outline-none"
                  />
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="flex h-11">
                    <button
                      @click="solveSeries('R1')"
                      class="w-24 h-full bg-bg-elevated border border-border-default border-r-0 px-4 font-display font-bold text-xs hover:text-accent-coral transition-all whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                      R1
                    </button>
                    <input
                      v-model="seriesR1"
                      type="number"
                      class="w-full h-full bg-bg-surface border border-border-default px-4 focus:border-accent-coral focus:outline-none"
                    />
                  </div>
                  <div class="flex h-11">
                    <button
                      @click="solveSeries('R2')"
                      class="w-24 h-full bg-bg-elevated border border-border-default border-r-0 px-4 font-display font-bold text-xs hover:text-accent-coral transition-all whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                      R2
                    </button>
                    <input
                      v-model="seriesR2"
                      type="number"
                      class="w-full h-full bg-bg-surface border border-border-default px-4 focus:border-accent-coral focus:outline-none"
                    />
                  </div>
                </div>

                <div class="flex h-11">
                  <button
                    @click="solveSeries('Vout')"
                    class="w-24 h-full bg-bg-elevated border border-border-default border-r-0 px-4 font-display font-bold text-xs hover:text-accent-coral transition-all whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    Vout
                  </button>
                  <input
                    v-model="seriesVout"
                    type="number"
                    class="w-full h-full bg-bg-surface border border-border-default px-4 focus:border-accent-coral focus:outline-none"
                  />
                </div>
              </div>
            </template>

            <!-- PARALLEL -->
            <template v-if="activeMode === 'parallel'">
              <div class="space-y-4">
                <div class="flex h-11">
                  <button
                    @click="solveParallel('R1')"
                    class="w-24 h-full bg-bg-elevated border border-border-default border-r-0 px-4 font-display font-bold text-xs hover:text-accent-coral transition-all whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    R1
                  </button>
                  <input
                    v-model="parallelR1"
                    type="number"
                    class="w-full h-full bg-bg-surface border border-border-default px-4 focus:border-accent-coral focus:outline-none"
                  />
                </div>
                <div class="flex h-11">
                  <button
                    @click="solveParallel('R2')"
                    class="w-24 h-full bg-bg-elevated border border-border-default border-r-0 px-4 font-display font-bold text-xs hover:text-accent-coral transition-all whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    R2
                  </button>
                  <input
                    v-model="parallelR2"
                    type="number"
                    class="w-full h-full bg-bg-surface border border-border-default px-4 focus:border-accent-coral focus:outline-none"
                  />
                </div>
                <div class="flex h-11">
                  <button
                    @click="solveParallel('RT')"
                    class="w-24 h-full bg-bg-elevated border border-border-default border-r-0 px-4 font-display font-bold text-[10px] hover:text-accent-coral transition-all whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    Rtotal
                  </button>
                  <input
                    v-model="parallelRTotal"
                    type="number"
                    class="w-full h-full bg-bg-surface border border-border-default px-4 focus:border-accent-coral focus:outline-none"
                  />
                </div>
              </div>
            </template>

            <!-- REGULATOR -->
            <template v-if="activeMode === 'regulator'">
              <div class="grid gap-4">
                <div class="flex h-11">
                  <button
                    @click="solveRegulator('Vref')"
                    class="w-24 h-full bg-bg-elevated border border-border-default border-r-0 px-4 font-display font-bold text-xs hover:text-accent-coral transition-all whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    Vref
                  </button>
                  <input
                    v-model="regRef"
                    type="number"
                    class="w-full h-full bg-bg-surface border border-border-default px-4 focus:border-accent-coral focus:outline-none"
                  />
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="flex h-11">
                    <button
                      @click="solveRegulator('R1')"
                      class="w-24 h-full bg-bg-elevated border border-border-default border-r-0 px-3 font-display font-bold text-xs hover:text-accent-coral transition-all whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                      R1
                    </button>
                    <input
                      v-model="regR1"
                      type="number"
                      class="w-full h-full bg-bg-surface border border-border-default px-3 focus:border-accent-coral focus:outline-none"
                    />
                  </div>
                  <div class="flex h-11">
                    <button
                      @click="solveRegulator('R2')"
                      class="w-24 h-full bg-bg-elevated border border-border-default border-r-0 px-3 font-display font-bold text-xs hover:text-accent-coral transition-all whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                      R2
                    </button>
                    <input
                      v-model="regR2"
                      type="number"
                      class="w-full h-full bg-bg-surface border border-border-default px-3 focus:border-accent-coral focus:outline-none"
                    />
                  </div>
                </div>
                <div class="flex h-11">
                  <button
                    @click="solveRegulator('Vout')"
                    class="w-24 h-full bg-bg-elevated border border-border-default border-r-0 px-4 font-display font-bold text-xs hover:text-accent-coral transition-all whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    Vout
                  </button>
                  <input
                    v-model="regVout"
                    type="number"
                    class="w-full h-full bg-bg-surface border border-border-default px-4 focus:border-accent-coral focus:outline-none"
                  />
                </div>
              </div>
            </template>

            <!-- NODE -->
            <template v-if="activeMode === 'node'">
              <div class="grid gap-4">
                <div class="grid grid-cols-2 gap-4">
                  <div class="flex h-11">
                    <button
                      @click="solveNode('V1')"
                      class="w-20 h-full bg-bg-elevated border border-border-default border-r-0 px-4 font-display font-bold text-xs hover:text-accent-coral transition-all whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                      V1
                    </button>
                    <input
                      v-model="nodeV1"
                      type="number"
                      class="w-full h-full bg-bg-surface border border-border-default px-4 focus:border-accent-coral focus:outline-none"
                    />
                  </div>
                  <div class="flex h-11">
                    <button
                      @click="solveNode('V2')"
                      class="w-20 h-full bg-bg-elevated border border-border-default border-r-0 px-4 font-display font-bold text-xs hover:text-accent-coral transition-all whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                      V2
                    </button>
                    <input
                      v-model="nodeV2"
                      type="number"
                      class="w-full h-full bg-bg-surface border border-border-default px-4 focus:border-accent-coral focus:outline-none"
                    />
                  </div>
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <div class="flex h-11">
                    <input
                      v-model="nodeR1"
                      type="number"
                      placeholder="R1"
                      class="w-full h-full bg-bg-surface border border-border-default px-2 focus:border-accent-coral focus:outline-none font-bold"
                    />
                  </div>
                  <div class="flex h-11">
                    <input
                      v-model="nodeR2"
                      type="number"
                      placeholder="R2"
                      class="w-full h-full bg-bg-surface border border-border-default px-2 focus:border-accent-coral focus:outline-none font-bold"
                    />
                  </div>
                  <div class="flex h-11">
                    <input
                      v-model="nodeR3"
                      type="number"
                      placeholder="R3"
                      class="w-full h-full bg-bg-surface border border-border-default px-2 focus:border-accent-coral focus:outline-none font-bold"
                    />
                  </div>
                </div>
                <div class="flex h-11">
                  <button
                    @click="solveNode('V3')"
                    class="w-24 h-full bg-bg-elevated border border-border-default border-r-0 px-4 font-display font-bold text-xs hover:text-accent-coral transition-all whitespace-nowrap overflow-hidden text-ellipsis min-w-[96px]"
                  >
                    Vnode
                  </button>
                  <input
                    v-model="nodeV3"
                    type="number"
                    class="w-full h-full bg-bg-surface border border-border-default px-4 focus:border-accent-coral focus:outline-none"
                  />
                </div>
              </div>
            </template>

            <!-- General Reset -->
            <button
              @click="resetInputs"
              class="w-full mt-6 py-4 border border-border-default bg-bg-elevated font-display text-[10px] tracking-[0.3em] font-bold uppercase hover:border-accent-coral hover:text-accent-coral transition-all flex items-center justify-center gap-3 animate-fade-up"
            >
              <Icon icon="lucide:refresh-cw" class="size-4" />
              NHẬP LẠI
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}
input[type='number'] {
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>
