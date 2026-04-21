<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'

const props = defineProps<{
  names: string[]
}>()

const emit = defineEmits<{
  winner: [name: string]
}>()

// ── Constants ──────────────────────────────────────────
const REEL_COUNT = 3
const ITEM_HEIGHT = 64 // px — height of each name slot
const VISIBLE_ITEMS = 3 // Show 3 items in the viewport (winner is middle)
const VIEWPORT_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS
const REEL_COPIES = 14 // Enough copies for smooth scrolling without wrap

// ── Palette for reel symbols ───────────────────────────
const REEL_COLORS = [
  '#FF6B4A',
  '#FFB830',
  '#38BDF8',
  '#E63946',
  '#2A9D8F',
  '#6A4C93',
  '#F77F00',
  '#8338EC',
  '#06D6A0',
  '#EF476F',
  '#118AB2',
  '#F4A261',
  '#E9C46A',
  '#264653',
  '#C77DFF',
] as const

function colorForIndex(i: number): string {
  return REEL_COLORS[i % REEL_COLORS.length] ?? '#FF6B4A'
}

// ── Shuffle helper ─────────────────────────────────────
function shuffleArray(arr: string[]): string[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = copy[i]!
    copy[i] = copy[j]!
    copy[j] = temp
  }
  return copy
}

// ── State ──────────────────────────────────────────────
const isSpinning = ref(false)
const handlePulled = ref(false)
const winnerRevealed = ref(false)
const reelOffsets = ref<number[]>([0, 0, 0])
const reelStopped = ref<boolean[]>([false, false, false])

// Each reel gets its own independently-shuffled order of names
const reelOrders = ref<string[][]>([[], [], []])

const animIds: number[] = []
let handleTimerId = 0

// Placeholder names shown when no real names are entered
const PLACEHOLDER_NAMES = ['???', '???', '???']

// ── Build reel strips (per reel) ───────────────────────
// Each reel repeats its own shuffled order N times for a long scrollable strip
const reelStrips = computed<string[][]>(() => {
  // When no names entered, show placeholder reels
  if (reelOrders.value.every((o) => o.length === 0)) {
    return Array.from({ length: REEL_COUNT }, () => {
      const strip: string[] = []
      for (let c = 0; c < REEL_COPIES; c++) {
        for (const name of PLACEHOLDER_NAMES) {
          strip.push(name)
        }
      }
      return strip
    })
  }
  return reelOrders.value.map((order) => {
    if (order.length === 0) return []
    const strip: string[] = []
    for (let c = 0; c < REEL_COPIES; c++) {
      for (const name of order) {
        strip.push(name)
      }
    }
    return strip
  })
})

// Initialize / reset reel orders when names change
watch(
  () => props.names,
  (newNames) => {
    if (newNames.length >= 2) {
      reelOrders.value = Array.from({ length: REEL_COUNT }, () => shuffleArray(newNames))
    } else {
      reelOrders.value = [[], [], []]
    }
    reelOffsets.value = [0, 0, 0]
    winnerRevealed.value = false
    reelStopped.value = [false, false, false]
  },
  { immediate: true },
)

// ── Easing ─────────────────────────────────────────────
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBounce(t: number): number {
  const n1 = 7.5625
  const d1 = 2.75
  if (t < 1 / d1) return n1 * t * t
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
  return n1 * (t -= 2.625 / d1) * t + 0.984375
}

// ── Spin logic ─────────────────────────────────────────
function spin(): void {
  if (isSpinning.value || props.names.length < 2) return

  isSpinning.value = true
  handlePulled.value = true
  winnerRevealed.value = false
  reelStopped.value = [false, false, false]

  // Shuffle each reel independently
  const newOrders = Array.from({ length: REEL_COUNT }, () => shuffleArray(props.names))
  reelOrders.value = newOrders

  // Reset offsets before animating
  reelOffsets.value = [0, 0, 0]

  // Pick winner
  const n = props.names.length
  const wIdx = Math.floor(Math.random() * n)
  const winnerName = props.names[wIdx] ?? ''

  // Slower staggered durations
  const durations = [3000, 3800, 4600]

  // Release handle after brief delay
  clearTimeout(handleTimerId)
  handleTimerId = window.setTimeout(() => {
    handlePulled.value = false
  }, 500)

  for (let r = 0; r < REEL_COUNT; r++) {
    const reelIndex = r
    const order = newOrders[reelIndex]!

    // Find where the winner name is in this reel's shuffled order
    const winnerPosInOrder = order.indexOf(winnerName)

    // Target: land on the winner in a later copy, centered in viewport.
    // Stagger target copy per reel so later reels travel further.
    const targetCopy = Math.floor(REEL_COPIES * 0.6) + reelIndex
    const targetItemIndex = targetCopy * n + winnerPosInOrder
    // Offset by 1 item so the winner sits in the middle visible row
    const targetOffset = targetItemIndex * ITEM_HEIGHT - ITEM_HEIGHT

    const duration = durations[reelIndex] ?? 3500
    const startTime = performance.now()

    function animateReel(now: number): void {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      // Last reel gets bounce easing for a satisfying stop
      const e = reelIndex === REEL_COUNT - 1 ? easeOutBounce(t) : easeOutCubic(t)

      // Animate linearly from 0 to targetOffset — no modulo, no wrapping
      reelOffsets.value[reelIndex] = targetOffset * e

      if (t < 1) {
        animIds[reelIndex] = requestAnimationFrame(animateReel)
        return
      }

      // Snap to exact target
      reelOffsets.value[reelIndex] = targetOffset
      reelStopped.value[reelIndex] = true

      // When all reels have stopped
      if (reelStopped.value.every(Boolean)) {
        isSpinning.value = false
        winnerRevealed.value = true
        emit('winner', winnerName)
      }
    }

    animIds[reelIndex] = requestAnimationFrame(animateReel)
  }
}

onUnmounted(() => {
  for (const id of animIds) {
    cancelAnimationFrame(id)
  }
  clearTimeout(handleTimerId)
})

defineExpose({ spin })
</script>

<template>
  <div class="flex w-full flex-col items-center gap-6">
    <!-- ── Machine + lever layout ── -->
    <div class="machine-layout">
      <!-- ── Slot machine ── -->
      <div class="slot-machine">
        <!-- Marquee top -->
        <div class="marquee">
          <div class="marquee-lights">
            <span
              v-for="i in 16"
              :key="i"
              class="marquee-bulb"
              :class="{ 'marquee-bulb--on': isSpinning ? i % 2 === 0 : winnerRevealed }"
              :style="{ animationDelay: `${i * 0.08}s` }"
            />
          </div>
          <div class="marquee-sign">
            <span class="marquee-star">★</span>
            <span class="marquee-title">LUCKY JACKPOT</span>
            <span class="marquee-star">★</span>
          </div>
        </div>

        <!-- Reel panel -->
        <div class="reel-panel">
          <!-- Row indicators -->
          <div class="row-arrow row-arrow--left" :class="{ 'row-arrow--active': winnerRevealed }">
            ▶
          </div>

          <div class="reels">
            <template v-for="(_, reelIdx) in REEL_COUNT" :key="reelIdx">
              <div v-if="reelIdx > 0" class="reel-sep" />
              <div class="reel" :style="{ height: `${VIEWPORT_HEIGHT}px` }">
                <div
                  class="reel-strip"
                  :style="{ transform: `translateY(-${reelOffsets[reelIdx] ?? 0}px)` }"
                >
                  <div
                    v-for="(name, itemIdx) in reelStrips[reelIdx] ?? []"
                    :key="itemIdx"
                    class="reel-item"
                    :style="{ height: `${ITEM_HEIGHT}px` }"
                  >
                    <span
                      class="reel-name"
                      :style="{ color: colorForIndex(itemIdx % names.length) }"
                    >
                      {{ name }}
                    </span>
                  </div>
                </div>
                <div class="reel-fade reel-fade--top" />
                <div class="reel-fade reel-fade--bottom" />
              </div>
            </template>
          </div>

          <div class="row-arrow row-arrow--right" :class="{ 'row-arrow--active': winnerRevealed }">
            ◀
          </div>

          <!-- Payline highlight -->
          <div class="payline" :class="{ 'payline--active': winnerRevealed }" />
        </div>

        <!-- Instruction bar -->
        <div class="instruction-bar">
          <span v-if="isSpinning" class="instruction-text instruction-text--spin">
            THE REELS ARE SPINNING…
          </span>
          <span v-else-if="winnerRevealed" class="instruction-text instruction-text--win">
            🎰 JACKPOT! 🎰
          </span>
          <span v-else-if="names.length >= 2" class="instruction-text">
            ← Pull the lever to spin!
          </span>
          <span v-else class="instruction-text instruction-text--dim">
            Enter at least 2 names to play
          </span>
        </div>

        <!-- Machine base -->
        <div class="machine-base">
          <div class="base-plate" />
        </div>
      </div>

      <!-- ── Lever (desktop: right side, mobile: below) ── -->
      <div class="lever-column">
        <div class="lever-housing">
          <div class="lever-track">
            <div class="lever-rod" />
            <div
              class="lever-knob"
              :class="{ 'lever-knob--pulled': handlePulled }"
              role="button"
              tabindex="0"
              aria-label="Pull lever to spin"
              @click="spin"
              @keydown.enter="spin"
              @keydown.space.prevent="spin"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Layout ── */
.machine-layout {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}

.slot-machine {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* ── Marquee ── */
.marquee {
  background: linear-gradient(180deg, #1e2f42, #162232);
  border: 2px solid #ffb830;
  border-bottom: none;
  padding: 10px 12px 6px;
  text-align: center;
}

.marquee-lights {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.marquee-bulb {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #253549;
  transition:
    background 0.2s,
    box-shadow 0.2s;
}

.marquee-bulb--on {
  background: #ffb830;
  box-shadow: 0 0 5px 2px rgba(255, 184, 48, 0.5);
  animation: bulbBlink 0.5s ease-in-out infinite alternate;
}

@keyframes bulbBlink {
  0% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.marquee-sign {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 0;
  border-top: 1px solid #253549;
  border-bottom: 1px solid #253549;
}

.marquee-star {
  font-size: 14px;
  color: #ffb830;
  text-shadow: 0 0 8px rgba(255, 184, 48, 0.6);
}

.marquee-title {
  font-family: 'Anybody', sans-serif;
  font-weight: 800;
  font-size: 17px;
  letter-spacing: 0.18em;
  background: linear-gradient(180deg, #ffb830 0%, #ff6b4a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ── Reel Panel ── */
.reel-panel {
  position: relative;
  display: flex;
  align-items: center;
  background: #0f1923;
  border: 2px solid #ffb830;
  border-top: 1px solid #253549;
  border-bottom: 1px solid #253549;
  padding: 12px 6px;
}

.row-arrow {
  flex-shrink: 0;
  font-size: 10px;
  color: #253549;
  transition:
    color 0.3s,
    text-shadow 0.3s;
  user-select: none;
}

.row-arrow--active {
  color: #ff6b4a;
  text-shadow: 0 0 8px rgba(255, 107, 74, 0.6);
}

.reels {
  flex: 1;
  display: flex;
  min-width: 0;
}

.reel-sep {
  width: 2px;
  background: linear-gradient(180deg, transparent, #253549, transparent);
  flex-shrink: 0;
}

.reel {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  position: relative;
  background: #162232;
  border: 1px solid #253549;
}

.reel-strip {
  will-change: transform;
}

.reel-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  box-sizing: border-box;
}

.reel-name {
  font-family: 'Anybody', sans-serif;
  font-weight: 700;
  font-size: 13px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* Depth fades */
.reel-fade {
  position: absolute;
  left: 0;
  right: 0;
  height: 35%;
  pointer-events: none;
  z-index: 2;
}

.reel-fade--top {
  top: 0;
  background: linear-gradient(180deg, rgba(15, 25, 35, 0.8) 0%, transparent 100%);
}

.reel-fade--bottom {
  bottom: 0;
  background: linear-gradient(0deg, rgba(15, 25, 35, 0.8) 0%, transparent 100%);
}

/* Payline */
.payline {
  position: absolute;
  left: 6px;
  right: 6px;
  top: 50%;
  height: 64px;
  transform: translateY(-50%);
  border: 2px solid transparent;
  pointer-events: none;
  transition:
    border-color 0.3s,
    box-shadow 0.3s;
  z-index: 3;
}

.payline--active {
  border-color: #ff6b4a;
  box-shadow:
    0 0 16px 4px rgba(255, 107, 74, 0.3),
    inset 0 0 16px 4px rgba(255, 107, 74, 0.1);
  animation: paylinePulse 1s ease-in-out infinite alternate;
}

@keyframes paylinePulse {
  0% {
    box-shadow:
      0 0 16px 4px rgba(255, 107, 74, 0.3),
      inset 0 0 16px 4px rgba(255, 107, 74, 0.1);
  }
  100% {
    box-shadow:
      0 0 24px 8px rgba(255, 107, 74, 0.5),
      inset 0 0 24px 8px rgba(255, 107, 74, 0.2);
  }
}

/* ── Instruction Bar ── */
.instruction-bar {
  background: #162232;
  border: 2px solid #ffb830;
  border-top: none;
  border-bottom: none;
  padding: 8px 12px;
  text-align: center;
}

.instruction-text {
  font-family: 'Anybody', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: #8b9db5;
}

.instruction-text--spin {
  color: #ffb830;
  animation: pulse 1s ease-in-out infinite alternate;
}

.instruction-text--win {
  color: #ff6b4a;
  text-shadow: 0 0 8px rgba(255, 107, 74, 0.4);
}

.instruction-text--dim {
  color: #4a6180;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

/* ── Machine Base ── */
.machine-base {
  background: linear-gradient(180deg, #1e2f42, #162232);
  border: 2px solid #ffb830;
  border-top: none;
  padding: 8px 12px;
}

.base-plate {
  height: 6px;
  background: linear-gradient(90deg, #253549, #4a6180, #253549);
  border-radius: 3px;
}

/* ── Lever Column ── */
.lever-column {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.lever-housing {
  background: linear-gradient(180deg, #1e2f42, #162232);
  border: 2px solid #253549;
  border-radius: 6px;
  padding: 6px;
}

.lever-track {
  width: 16px;
  height: 140px;
  background: #0f1923;
  border: 1px solid #253549;
  border-radius: 4px;
  position: relative;
}

.lever-rod {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 90px;
  background: linear-gradient(180deg, #8b9db5, #4a6180);
  border-radius: 3px;
}

.lever-knob {
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #ff6b4a, #e63946);
  border: 2px solid #ffb830;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(255, 107, 74, 0.4);
  z-index: 1;
  transition:
    top 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 0.15s,
    box-shadow 0.15s;
}

.lever-knob--pulled {
  top: 104px;
}

.lever-knob:hover {
  transform: translateX(-50%) scale(1.12);
  box-shadow: 0 4px 14px rgba(255, 107, 74, 0.6);
}

.lever-knob:active {
  transform: translateX(-50%) scale(0.95);
}

/* ── Mobile layout ── */
@media (max-width: 640px) {
  .machine-layout {
    flex-direction: column;
    max-width: 100%;
  }

  .lever-column {
    margin-top: 4px;
  }

  .lever-housing {
    padding: 4px 8px;
  }

  .lever-track {
    width: 140px;
    height: 16px;
  }

  .lever-rod {
    width: 90px;
    height: 6px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .lever-knob {
    top: 50%;
    left: 6px;
    transform: translateY(-50%);
    width: 26px;
    height: 26px;
    transition:
      left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
      transform 0.15s,
      box-shadow 0.15s;
  }

  .lever-knob--pulled {
    top: 50%;
    left: 108px;
  }

  .lever-knob:hover {
    transform: translateY(-50%) scale(1.12);
  }

  .lever-knob:active {
    transform: translateY(-50%) scale(0.95);
  }

  .reel-name {
    font-size: 11px;
  }

  .instruction-text {
    font-size: 10px;
  }
}
</style>
