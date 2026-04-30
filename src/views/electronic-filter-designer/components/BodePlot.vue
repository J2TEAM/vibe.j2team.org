<script setup lang="ts">
import { computed } from 'vue'

import type { FilterDescription } from '../types'
import { formatFrequency } from '../utils/siFormat'

interface Props {
  filter: FilterDescription
  /** Decades to show on each side of the characteristic frequency. */
  decades?: number
  /** Number of sample points across the frequency window. */
  samples?: number
}

const props = withDefaults(defineProps<Props>(), {
  decades: 2,
  samples: 240,
})

// SVG layout constants
const WIDTH = 800
const HEIGHT = 520
const MARGIN_LEFT = 64
const MARGIN_RIGHT = 24
const MARGIN_TOP = 24
const MARGIN_BOTTOM = 28
const PLOT_GAP = 36
const PLOT_W = WIDTH - MARGIN_LEFT - MARGIN_RIGHT
const PLOT_H = (HEIGHT - MARGIN_TOP - MARGIN_BOTTOM - PLOT_GAP) / 2

const TOP_PLOT_Y = MARGIN_TOP
const BOTTOM_PLOT_Y = MARGIN_TOP + PLOT_H + PLOT_GAP

const PHASE_MIN = -180
const PHASE_MAX = 180

const window = computed(() => {
  const fc = props.filter.fc
  if (!Number.isFinite(fc) || fc <= 0) {
    return { fStart: 1, fEnd: 1e6, logStart: 0, logEnd: 6 }
  }
  const logFc = Math.log10(fc)
  const logStart = logFc - props.decades
  const logEnd = logFc + props.decades
  return {
    fStart: 10 ** logStart,
    fEnd: 10 ** logEnd,
    logStart,
    logEnd,
  }
})

const samplePoints = computed(() => {
  const w = window.value
  const stepLog = (w.logEnd - w.logStart) / (props.samples - 1)
  const list: Array<{ f: number; mag: number; phase: number }> = []
  for (let i = 0; i < props.samples; i += 1) {
    const f = 10 ** (w.logStart + stepLog * i)
    const evaluated = props.filter.evaluate(f)
    list.push({ f, mag: evaluated.magnitudeDb, phase: evaluated.phaseDeg })
  }
  return list
})

const magBounds = computed(() => {
  let maxObserved = Number.NEGATIVE_INFINITY
  for (const sample of samplePoints.value) {
    if (Number.isFinite(sample.mag) && sample.mag > maxObserved) {
      maxObserved = sample.mag
    }
  }
  if (!Number.isFinite(maxObserved)) maxObserved = 0
  // Round up to next 10 dB and add 10 dB headroom.
  const dbMax = Math.ceil(maxObserved / 10) * 10 + 10
  const dbMin = dbMax - 80
  return { dbMin, dbMax }
})

function fToX(f: number): number {
  const w = window.value
  if (f <= 0) return MARGIN_LEFT
  const logF = Math.log10(f)
  const t = (logF - w.logStart) / (w.logEnd - w.logStart)
  return MARGIN_LEFT + t * PLOT_W
}

function dbToY(db: number): number {
  const { dbMin, dbMax } = magBounds.value
  if (!Number.isFinite(db)) return TOP_PLOT_Y + PLOT_H
  const clamped = Math.min(Math.max(db, dbMin - 5), dbMax + 5)
  const t = (clamped - dbMin) / (dbMax - dbMin)
  return TOP_PLOT_Y + (1 - t) * PLOT_H
}

function phaseToY(deg: number): number {
  const t = (deg - PHASE_MIN) / (PHASE_MAX - PHASE_MIN)
  return BOTTOM_PLOT_Y + (1 - t) * PLOT_H
}

const magnitudePath = computed(() => {
  const points = samplePoints.value
    .map((p) => `${fToX(p.f).toFixed(2)},${dbToY(p.mag).toFixed(2)}`)
    .join(' L ')
  return points.length > 0 ? `M ${points}` : ''
})

const phasePath = computed(() => {
  const points = samplePoints.value
    .map((p) => `${fToX(p.f).toFixed(2)},${phaseToY(p.phase).toFixed(2)}`)
    .join(' L ')
  return points.length > 0 ? `M ${points}` : ''
})

const decadeTicks = computed(() => {
  const w = window.value
  const start = Math.ceil(w.logStart)
  const end = Math.floor(w.logEnd)
  const ticks: Array<{ f: number; label: string; isMajor: boolean }> = []
  for (let exp = start; exp <= end; exp += 1) {
    const major = 10 ** exp
    ticks.push({ f: major, label: formatFrequency(major, 3), isMajor: true })
    if (exp < end) {
      for (const m of [2, 3, 5]) {
        const f = m * major
        if (f >= w.fStart && f <= w.fEnd) {
          ticks.push({ f, label: '', isMajor: false })
        }
      }
    }
  }
  return ticks
})

const dbTicks = computed(() => {
  const { dbMin, dbMax } = magBounds.value
  const ticks: Array<number> = []
  for (let v = Math.ceil(dbMin / 10) * 10; v <= dbMax; v += 10) {
    ticks.push(v)
  }
  return ticks
})

const phaseTicks: ReadonlyArray<number> = [-180, -135, -90, -45, 0, 45, 90, 135, 180]

const cutoffX = computed(() => fToX(props.filter.fc))

const cutoffEvaluation = computed(() => props.filter.evaluate(props.filter.fc))

const frequencySymbol = computed(() => (props.filter.q === null ? 'c' : '0'))
</script>

<template>
  <div class="border border-border-default bg-bg-surface p-4">
    <svg
      :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
      class="w-full h-auto"
      role="img"
      aria-label="Bode plot magnitude and phase"
    >
      <!-- Magnitude grid + axes -->
      <g>
        <rect
          :x="MARGIN_LEFT"
          :y="TOP_PLOT_Y"
          :width="PLOT_W"
          :height="PLOT_H"
          class="fill-bg-deep stroke-border-default"
          stroke-width="1"
        />
        <line
          v-for="tick in decadeTicks"
          :key="`mg-${tick.f}`"
          :x1="fToX(tick.f)"
          :x2="fToX(tick.f)"
          :y1="TOP_PLOT_Y"
          :y2="TOP_PLOT_Y + PLOT_H"
          class="stroke-border-default"
          :stroke-width="tick.isMajor ? 1 : 0.4"
          :stroke-opacity="tick.isMajor ? 0.8 : 0.4"
        />
        <line
          v-for="db in dbTicks"
          :key="`db-${db}`"
          :x1="MARGIN_LEFT"
          :x2="MARGIN_LEFT + PLOT_W"
          :y1="dbToY(db)"
          :y2="dbToY(db)"
          class="stroke-border-default"
          :stroke-width="db === 0 ? 1 : 0.4"
          :stroke-opacity="db === 0 ? 0.8 : 0.4"
        />
        <text
          v-for="db in dbTicks"
          :key="`dbl-${db}`"
          :x="MARGIN_LEFT - 6"
          :y="dbToY(db) + 4"
          text-anchor="end"
          font-size="11"
          class="fill-text-secondary font-display tracking-wide"
        >
          {{ db }}
        </text>
        <text
          :x="MARGIN_LEFT - 36"
          :y="TOP_PLOT_Y + PLOT_H / 2"
          text-anchor="middle"
          font-size="11"
          class="fill-text-dim font-display tracking-widest uppercase"
          :transform="`rotate(-90 ${MARGIN_LEFT - 36} ${TOP_PLOT_Y + PLOT_H / 2})`"
        >
          Magnitude (dB)
        </text>
      </g>

      <!-- Magnitude curve -->
      <path
        :d="magnitudePath"
        class="stroke-accent-coral fill-none"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
      />

      <!-- Characteristic-frequency marker on magnitude plot -->
      <line
        :x1="cutoffX"
        :x2="cutoffX"
        :y1="TOP_PLOT_Y"
        :y2="TOP_PLOT_Y + PLOT_H"
        class="stroke-accent-amber"
        stroke-width="1"
        stroke-dasharray="4 4"
        stroke-opacity="0.8"
      />

      <!-- Phase grid + axes -->
      <g>
        <rect
          :x="MARGIN_LEFT"
          :y="BOTTOM_PLOT_Y"
          :width="PLOT_W"
          :height="PLOT_H"
          class="fill-bg-deep stroke-border-default"
          stroke-width="1"
        />
        <line
          v-for="tick in decadeTicks"
          :key="`pg-${tick.f}`"
          :x1="fToX(tick.f)"
          :x2="fToX(tick.f)"
          :y1="BOTTOM_PLOT_Y"
          :y2="BOTTOM_PLOT_Y + PLOT_H"
          class="stroke-border-default"
          :stroke-width="tick.isMajor ? 1 : 0.4"
          :stroke-opacity="tick.isMajor ? 0.8 : 0.4"
        />
        <line
          v-for="deg in phaseTicks"
          :key="`pd-${deg}`"
          :x1="MARGIN_LEFT"
          :x2="MARGIN_LEFT + PLOT_W"
          :y1="phaseToY(deg)"
          :y2="phaseToY(deg)"
          class="stroke-border-default"
          :stroke-width="deg === 0 ? 1 : 0.4"
          :stroke-opacity="deg === 0 ? 0.8 : 0.4"
        />
        <text
          v-for="deg in phaseTicks"
          :key="`pdl-${deg}`"
          :x="MARGIN_LEFT - 6"
          :y="phaseToY(deg) + 4"
          text-anchor="end"
          font-size="11"
          class="fill-text-secondary font-display tracking-wide"
        >
          {{ deg }}°
        </text>
        <text
          :x="MARGIN_LEFT - 36"
          :y="BOTTOM_PLOT_Y + PLOT_H / 2"
          text-anchor="middle"
          font-size="11"
          class="fill-text-dim font-display tracking-widest uppercase"
          :transform="`rotate(-90 ${MARGIN_LEFT - 36} ${BOTTOM_PLOT_Y + PLOT_H / 2})`"
        >
          Phase (deg)
        </text>
      </g>

      <!-- Phase curve -->
      <path
        :d="phasePath"
        class="stroke-accent-sky fill-none"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
      />

      <!-- Characteristic-frequency marker on phase plot -->
      <line
        :x1="cutoffX"
        :x2="cutoffX"
        :y1="BOTTOM_PLOT_Y"
        :y2="BOTTOM_PLOT_Y + PLOT_H"
        class="stroke-accent-amber"
        stroke-width="1"
        stroke-dasharray="4 4"
        stroke-opacity="0.8"
      />

      <!-- Frequency axis labels -->
      <g>
        <text
          v-for="tick in decadeTicks.filter((t) => t.isMajor)"
          :key="`fl-${tick.f}`"
          :x="fToX(tick.f)"
          :y="BOTTOM_PLOT_Y + PLOT_H + 16"
          text-anchor="middle"
          font-size="11"
          class="fill-text-secondary font-display tracking-wide"
        >
          {{ tick.label }}
        </text>
      </g>
      <text
        :x="MARGIN_LEFT + PLOT_W / 2"
        :y="HEIGHT - 4"
        text-anchor="middle"
        font-size="11"
        class="fill-text-dim font-display tracking-widest uppercase"
      >
        Frequency
      </text>

      <!-- Characteristic-frequency label -->
      <text
        :x="cutoffX + 6"
        :y="TOP_PLOT_Y + 14"
        font-size="11"
        class="fill-accent-amber font-display tracking-wide"
      >
        f
        <tspan baseline-shift="sub" font-size="9">{{ frequencySymbol }}</tspan>
        =
        {{ formatFrequency(filter.fc, 4) }}
      </text>
    </svg>

    <div
      class="mt-2 text-xs text-text-dim font-display tracking-wide flex flex-wrap gap-x-6 gap-y-1"
    >
      <span>
        <span class="inline-block w-3 h-0.5 bg-accent-coral mr-1 align-middle" />
        Magnitude
      </span>
      <span>
        <span class="inline-block w-3 h-0.5 bg-accent-sky mr-1 align-middle" />
        Phase
      </span>
      <span>
        <span class="inline-block w-3 h-0.5 bg-accent-amber mr-1 align-middle" />
        f<sub>{{ frequencySymbol }}</sub
        >: {{ cutoffEvaluation.magnitudeDb.toFixed(2) }} dB /
        {{ cutoffEvaluation.phaseDeg.toFixed(1) }}°
      </span>
    </div>
  </div>
</template>
