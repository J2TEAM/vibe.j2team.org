<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'

const props = defineProps<{
  names: string[]
}>()

const emit = defineEmits<{
  winner: [name: string]
}>()

// ── Color palette ──────────────────────────────────────
const WHEEL_COLORS = [
  '#FF6B4A', '#FFB830', '#38BDF8', '#E63946', '#2A9D8F',
  '#6A4C93', '#F77F00', '#8338EC', '#06D6A0', '#EF476F',
  '#118AB2', '#F4A261', '#E9C46A', '#264653', '#C77DFF',
  '#F72585', '#4CC9F0', '#4361EE', '#7209B7', '#52B788',
] as const

// ── Wheel geometry constants ───────────────────────────
const SIZE = 400
const CENTER = SIZE / 2
const RADIUS = SIZE / 2 - 12

// ── State ──────────────────────────────────────────────
const isSpinning = ref(false)
const currentRotation = ref(0)
let animationFrameId = 0

// ── Geometry helpers ───────────────────────────────────
function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#0F1923' : '#F0EDE6'
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// ── Computed wheel segments ────────────────────────────
const segments = computed(() => {
  const n = props.names.length
  if (n === 0) return []

  const anglePerSeg = 360 / n
  return props.names.map((name, i) => {
    const startAngle = i * anglePerSeg
    const endAngle = startAngle + anglePerSeg
    const midAngle = startAngle + anglePerSeg / 2
    const color = WHEEL_COLORS[i % WHEEL_COLORS.length] ?? '#FF6B4A'
    const path = describeArc(CENTER, CENTER, RADIUS, startAngle, endAngle)
    const textRadius = RADIUS * 0.66
    const textPos = polarToCartesian(CENTER, CENTER, textRadius, midAngle)

    let textRot = midAngle
    if (textRot > 90 && textRot < 270) textRot += 180

    const maxChars = n > 20 ? 4 : n > 12 ? 6 : n > 8 ? 9 : n > 4 ? 12 : 16
    const displayName = name.length > maxChars ? name.slice(0, maxChars - 1) + '\u2026' : name
    const fontSize = n > 50 ? 7 : n > 30 ? 9 : n > 20 ? 10 : n > 12 ? 12 : n > 6 ? 13 : 15

    return {
      name,
      color,
      path,
      textX: textPos.x,
      textY: textPos.y,
      textRot,
      displayName,
      fontSize,
      textColor: getContrastColor(color),
    }
  })
})

// ── Spin logic ─────────────────────────────────────────
function spin(): void {
  if (isSpinning.value || props.names.length < 2) return

  const n = props.names.length
  const winnerIndex = Math.floor(Math.random() * n)
  // Capture the winner name now in case names prop changes during animation
  const winnerName = props.names[winnerIndex] ?? props.names[0] ?? ''

  const anglePerSeg = 360 / n
  const segmentCenter = winnerIndex * anglePerSeg + anglePerSeg / 2
  // Add 5–8 full rotations to make the spin feel satisfying, then land on winner
  const fullRotations = (5 + Math.floor(Math.random() * 4)) * 360
  const targetAngle =
    Math.floor(currentRotation.value / 360) * 360 + fullRotations + (360 - segmentCenter)

  isSpinning.value = true
  const startRotation = currentRotation.value
  const totalDelta = targetAngle - startRotation
  const duration = 4000 + Math.random() * 1500
  const startTime = performance.now()

  function animate(now: number): void {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    currentRotation.value = startRotation + totalDelta * easeOutCubic(progress)

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate)
    } else {
      currentRotation.value = targetAngle
      isSpinning.value = false
      emit('winner', winnerName)
    }
  }

  animationFrameId = requestAnimationFrame(animate)
}

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId)
})

defineExpose({ spin })
</script>

<template>
  <div class="flex w-full flex-col items-center gap-6">
    <!-- Wheel container -->
    <div class="relative w-full max-w-[400px]">
      <!-- Pointer arrow (fixed, outside the spinning SVG) -->
      <div
        class="pointer-events-none absolute left-1/2 top-0 z-10"
        style="transform: translateX(-50%) translateY(-2px)"
      >
        <svg aria-hidden="true" height="36" viewBox="0 0 28 36" width="28">
          <polygon fill="#FF6B4A" points="14,32 1,1 27,1" />
          <polygon fill="none" points="14,32 1,1 27,1" stroke="rgba(0,0,0,0.35)" stroke-width="1" />
        </svg>
      </div>

      <!-- Spinning SVG wheel -->
      <svg
        :style="{ transform: `rotate(${currentRotation}deg)` }"
        :viewBox="`0 0 ${SIZE} ${SIZE}`"
        aria-hidden="true"
        class="w-full drop-shadow-2xl"
      >
        <!-- Outer decorative ring -->
        <circle :cx="CENTER" :cy="CENTER" :r="RADIUS + 6" fill="#253549" />
        <circle
          :cx="CENTER"
          :cy="CENTER"
          :r="RADIUS + 2"
          fill="none"
          opacity="0.4"
          stroke="#FF6B4A"
          stroke-dasharray="4 6"
          stroke-width="1.5"
        />

        <!-- Empty state placeholder -->
        <template v-if="segments.length === 0">
          <circle :cx="CENTER" :cy="CENTER" :r="RADIUS" fill="#162232" />
          <text
            :x="CENTER"
            :y="CENTER"
            dominant-baseline="middle"
            fill="#4A6180"
            font-family="'Be Vietnam Pro', sans-serif"
            font-size="14"
            text-anchor="middle"
          >
            Enter names to begin
          </text>
        </template>

        <!-- Wheel segments fill -->
        <template v-else>
          <path
            v-for="(seg, i) in segments"
            :key="`seg-${i}`"
            :d="seg.path"
            :fill="seg.color"
          />
          <!-- Segment border dividers -->
          <path
            v-for="(seg, i) in segments"
            :key="`div-${i}`"
            :d="seg.path"
            fill="none"
            stroke="rgba(0,0,0,0.22)"
            stroke-width="1.5"
          />
          <!-- Name labels -->
          <text
            v-for="(seg, i) in segments"
            :key="`txt-${i}`"
            :fill="seg.textColor"
            :font-size="seg.fontSize"
            :transform="`rotate(${seg.textRot}, ${seg.textX}, ${seg.textY})`"
            :x="seg.textX"
            :y="seg.textY"
            class="pointer-events-none select-none"
            dominant-baseline="middle"
            font-family="'Be Vietnam Pro', sans-serif"
            font-weight="600"
            text-anchor="middle"
          >
            {{ seg.displayName }}
          </text>
        </template>

        <!-- Center hub -->
        <circle :cx="CENTER" :cy="CENTER" r="22" fill="#0F1923" stroke="#FF6B4A" stroke-width="3" />
        <circle :cx="CENTER" :cy="CENTER" r="10" fill="#FF6B4A" />
      </svg>
    </div>

    <!-- Spin button -->
    <button
      :disabled="isSpinning || names.length < 2"
      class="bg-accent-coral font-display px-14 py-4 text-base font-bold tracking-[0.15em] text-bg-deep transition-all hover:bg-accent-amber active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      type="button"
      @click="spin"
    >
      {{ isSpinning ? 'SPINNING\u2026' : 'SPIN' }}
    </button>
  </div>
</template>
