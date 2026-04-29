<script setup lang="ts">
import { computed } from 'vue'
import type { WingParams, Part, CalculationResult } from '../types'

const props = defineProps<{
  params: WingParams
  parts: Part[]
  results: CalculationResult
}>()

const n = (val: number | null | undefined, def = 0): number => {
  if (val === null || val === undefined) return def
  return isFinite(val) ? val : def
}

const PADDING = 40
const VIEW_SIZE = 600

const scale = computed(() => {
  const maxWidth = n(props.params.span)
  const maxHeight = n(props.params.sweep) + n(props.params.rootChord)
  const vScale = (VIEW_SIZE - 2 * PADDING) / Math.max(maxWidth, maxHeight, 1)
  return vScale
})

const viewBox = computed(() => `0 0 ${VIEW_SIZE} ${VIEW_SIZE}`)

const center = VIEW_SIZE / 2

// Wing point coordinates
const wingPoints = computed(() => {
  const span = n(props.params.span)
  const rootChord = n(props.params.rootChord)
  const tipChord = n(props.params.tipChord)
  const sweep = n(props.params.sweep)
  const fuseWidth = n(props.params.fuseWidth)

  const s = scale.value
  const halfSpan = (span / 2) * s
  const halfFuse = (fuseWidth / 2) * s
  const rc = rootChord * s
  const tc = tipChord * s
  const sw = sweep * s

  // Origin (0,0) is LE center
  const cx = center
  const cy = PADDING

  return {
    // Left panel
    lle_root: `${cx - halfFuse},${cy}`,
    lte_root: `${cx - halfFuse},${cy + rc}`,
    lple_tip: `${cx - halfSpan},${cy + sw}`,
    lpte_tip: `${cx - halfSpan},${cy + sw + tc}`,
    // Right panel
    rle_root: `${cx + halfFuse},${cy}`,
    rte_root: `${cx + halfFuse},${cy + rc}`,
    rple_tip: `${cx + halfSpan},${cy + sw}`,
    rpte_tip: `${cx + halfSpan},${cy + sw + tc}`,
    // Fuse
    f_le_root: `${cx - halfFuse},${cy} ${cx + halfFuse},${cy}`,
    f_te_root: `${cx - halfFuse},${cy + rc} ${cx + halfFuse},${cy + rc}`,
  }
})

const wingPath = computed(() => {
  const p = wingPoints.value
  return `M ${p.lle_root} L ${p.lple_tip} L ${p.lpte_tip} L ${p.lte_root} Z
          M ${p.rle_root} L ${p.rple_tip} L ${p.rpte_tip} L ${p.rte_root} Z
          M ${p.lle_root} L ${p.rle_root} L ${p.rte_root} L ${p.lte_root} Z`
})

// MAC indicator
const macIndicator = computed(() => {
  const { results, params } = props
  const s = scale.value
  const macY = results.macDistance * s
  const macL = results.macLength * s

  const span = n(params.span)
  const fuseWidth = n(params.fuseWidth)
  const sweep = n(params.sweep)

  const divisor = (span - fuseWidth) / 2
  const macLeX = divisor > 0 ? sweep * (results.macDistance / divisor) * s : 0

  const cx = center
  const cy = PADDING
  const halfFuse = (fuseWidth / 2) * s

  // Right side MAC
  const rx = cx + halfFuse + macY
  const ry = cy + macLeX

  return {
    x: rx,
    y: ry,
    l: macL,
    // Left side MAC
    lx: cx - halfFuse - macY,
  }
})

// CG points
const targetCg = computed(() => {
  const s = scale.value
  return {
    x: center,
    y: PADDING + props.results.targetCgDist * s,
  }
})

const actualCg = computed(() => {
  const s = scale.value
  return {
    x: center,
    y: PADDING + props.results.actualCgDist * s,
  }
})

const chassisCg = computed(() => {
  const s = scale.value
  return {
    x: center,
    y: PADDING + n(props.params.chassisCog) * s,
  }
})
</script>

<template>
  <div class="w-full h-full flex items-center justify-center">
    <svg :viewBox="viewBox" class="w-full h-full drop-shadow-2xl">
      <!-- Grid/Rulers (Optional) -->
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M 20 0 L 0 0 0 20"
            fill="none"
            stroke="rgba(74, 97, 128, 0.1)"
            stroke-width="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      <!-- Wing Shape -->
      <path
        :d="wingPath"
        fill="rgba(255, 107, 74, 0.05)"
        stroke="var(--color-accent-coral)"
        stroke-width="2"
        stroke-linejoin="round"
      />

      <!-- MAC lines -->
      <g opacity="0.4">
        <line
          :x1="macIndicator.lx"
          :y1="macIndicator.y"
          :x2="macIndicator.lx"
          :y2="macIndicator.y + macIndicator.l"
          stroke="var(--color-text-secondary)"
          stroke-width="1.5"
          stroke-dasharray="4 2"
        />
        <line
          :x1="macIndicator.x"
          :y1="macIndicator.y"
          :x2="macIndicator.x"
          :y2="macIndicator.y + macIndicator.l"
          stroke="var(--color-text-secondary)"
          stroke-width="1.5"
          stroke-dasharray="4 2"
        />
      </g>

      <!-- Reference Datum (Nose) -->
      <circle :cx="center" :cy="PADDING" r="3" fill="var(--color-accent-sky)" />
      <text
        :x="center"
        :y="PADDING - 10"
        text-anchor="middle"
        class="text-[10px] fill-text-dim uppercase tracking-widest font-display"
      >
        Mũi
      </text>

      <!-- CG Marks -->
      <!-- Chassis CG -->
      <circle :cx="chassisCg.x" :cy="chassisCg.y" r="2" fill="var(--color-text-dim)" />

      <!-- Target CG (Crosshair) -->
      <g :transform="`translate(${targetCg.x}, ${targetCg.y})`">
        <line x1="-15" y1="0" x2="15" y2="0" stroke="var(--color-accent-amber)" stroke-width="1" />
        <line x1="0" y1="-15" x2="0" y2="15" stroke="var(--color-accent-amber)" stroke-width="1" />
        <circle r="6" fill="none" stroke="var(--color-accent-amber)" stroke-width="1" />
        <text
          x="20"
          y="5"
          class="text-[10px] fill-accent-amber font-bold font-display uppercase tracking-widest"
        >
          Mục tiêu
        </text>
      </g>

      <!-- Actual CG (Diamond) -->
      <g :transform="`translate(${actualCg.x}, ${actualCg.y})`">
        <rect
          x="-6"
          y="-6"
          width="12"
          height="12"
          fill="var(--color-accent-coral)"
          transform="rotate(45)"
        />
        <text
          x="-20"
          y="5"
          text-anchor="end"
          class="text-[10px] fill-accent-coral font-bold font-display uppercase tracking-widest"
        >
          Thực tế
        </text>
      </g>

      <!-- Parts -->
      <g v-for="part in parts" :key="part.id">
        <rect
          :x="center - (n(part.width) * scale) / 2"
          :y="PADDING + n(part.x) * scale - (n(part.length) * scale) / 2"
          :width="n(part.width) * scale"
          :height="n(part.length) * scale"
          fill="rgba(255, 184, 48, 0.3)"
          stroke="var(--color-accent-amber)"
          stroke-width="1"
        />
      </g>
    </svg>
  </div>
</template>
