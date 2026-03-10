<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  useElementSize,
  useEventListener,
  useLocalStorage,
  useMediaQuery,
  useRafFn,
} from '@vueuse/core'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'

interface Block {
  id: number
  width: number
  left: number
  level: number
}

interface PendingPlacement {
  block: Block
  nextTilt: number
  offsetRatio: number
}

interface ImpactBurst {
  id: number
  x: number
  y: number
}

const defaultStageWidth = 320
const stageHeight = 440
const blockHeight = 28
const baseWidth = 180
const minWidth = 72
const baseCrossDuration = 2.8
const minCrossDuration = 1.05
const tiltCollapseThreshold = 2.65
const maxCenterOffsetRatio = 0.72
const spawnGap = 86
const dropDuration = 320

const isReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
const bestScore = useLocalStorage('stack-tower-best-score', 0)
const stageRef = ref<HTMLElement | null>(null)
const { width: measuredStageWidth } = useElementSize(stageRef)
const stageWidth = computed(() =>
  Math.max(defaultStageWidth, Math.round(measuredStageWidth.value || defaultStageWidth)),
)

const stack = ref<Block[]>([
  {
    id: 0,
    width: baseWidth,
    left: (defaultStageWidth - baseWidth) / 2,
    level: 0,
  },
])
const activeBlock = ref<Block>({
  id: 1,
  width: baseWidth,
  left: 0,
  level: 1,
})
const isDropping = ref(false)
const isGameOver = ref(false)
const direction = ref(1)
const score = ref(0)
const nextId = ref(2)
const towerTilt = ref(0)
const pendingPlacement = ref<PendingPlacement | null>(null)
const impactBurst = ref<ImpactBurst | null>(null)
const isImpactShaking = ref(false)
const isInfoModalOpen = ref(false)

const activeBlockStyle = computed(() => ({
  width: `${activeBlock.value.width}px`,
  left: `${activeBlock.value.left}px`,
  height: `${blockHeight}px`,
  bottom: `${activeBlock.value.level * blockHeight + (isDropping.value ? 0 : spawnGap)}px`,
}))

const progressPercent = computed(() => Math.min(100, (score.value / 20) * 100))
const difficultyLabel = computed(() => Math.round(activeBlock.value.width))
const horizontalSpeed = computed(() => {
  const travelDistance = Math.max(1, stageWidth.value - activeBlock.value.width)
  const levelFactor = Math.min(score.value, 14) * 0.11
  const duration = Math.max(minCrossDuration, baseCrossDuration - levelFactor)

  return travelDistance / duration
})
const towerTransform = computed(() => {
  if (isGameOver.value) {
    const collapseAngle = towerTilt.value >= 0 ? 88 : -88
    const collapseShift = towerTilt.value >= 0 ? 136 : -136

    return {
      transform: `rotate(${collapseAngle}deg) translate3d(${collapseShift}px, 58px, 0)`,
      transformOrigin: 'center bottom',
    }
  }

  return {
    transform: `rotate(${towerTilt.value * 2.8}deg)`,
    transformOrigin: 'center bottom',
  }
})
const towerShellClass = computed(() => {
  if (!isGameOver.value) {
    return ''
  }

  return towerTilt.value >= 0 ? 'animate-collapse-right' : 'animate-collapse-left'
})
const showGameOverModal = computed(() => isGameOver.value)

function getBlockBottom(level: number) {
  return level * blockHeight
}

function getNextWidth(nextLevel: number) {
  return Math.max(minWidth, Math.round(baseWidth - nextLevel * 7))
}

function createNextBlock() {
  const previous = stack.value[stack.value.length - 1]
  if (!previous) {
    return
  }

  const nextWidth = getNextWidth(stack.value.length)
  const startAtLeft = direction.value > 0
  activeBlock.value = {
    id: nextId.value,
    width: nextWidth,
    left: startAtLeft ? 0 : stageWidth.value - nextWidth,
    level: stack.value.length,
  }
  nextId.value += 1
  isDropping.value = false
  pendingPlacement.value = null
}

function resetGame() {
  stack.value = [
    {
      id: 0,
      width: baseWidth,
      left: (stageWidth.value - baseWidth) / 2,
      level: 0,
    },
  ]
  activeBlock.value = {
    id: 1,
    width: baseWidth,
    left: 0,
    level: 1,
  }
  isDropping.value = false
  isGameOver.value = false
  direction.value = 1
  score.value = 0
  nextId.value = 2
  towerTilt.value = 0
  pendingPlacement.value = null
  impactBurst.value = null
  isImpactShaking.value = false
  isInfoModalOpen.value = false
}

function finalizePlacement() {
  const placement = pendingPlacement.value
  if (!placement) {
    return
  }

  stack.value = [...stack.value, placement.block]
  towerTilt.value = placement.nextTilt
  score.value = stack.value.length - 1
  bestScore.value = Math.max(bestScore.value, score.value)
  direction.value *= -1

  if (stack.value.length * blockHeight >= stageHeight - blockHeight) {
    stack.value = stack.value.slice(1).map((block, index) => ({
      ...block,
      level: index,
    }))
  }

  const shouldCollapse =
    Math.abs(placement.offsetRatio) > maxCenterOffsetRatio ||
    Math.abs(placement.nextTilt) >= tiltCollapseThreshold

  impactBurst.value = {
    id: placement.block.id,
    x: placement.block.left + placement.block.width / 2,
    y: stageHeight - (placement.block.level + 1) * blockHeight,
  }
  isImpactShaking.value = true
  window.setTimeout(
    () => {
      isImpactShaking.value = false
    },
    isReducedMotion.value ? 90 : 220,
  )
  window.setTimeout(
    () => {
      if (impactBurst.value?.id === placement.block.id) {
        impactBurst.value = null
      }
    },
    isReducedMotion.value ? 140 : 520,
  )

  pendingPlacement.value = null

  if (shouldCollapse) {
    isGameOver.value = true
    return
  }

  createNextBlock()
}

function dropBlock() {
  if (isGameOver.value || isDropping.value) {
    return
  }

  const previous = stack.value[stack.value.length - 1]
  if (!previous) {
    return
  }

  const currentLeft = Math.round(activeBlock.value.left)
  const currentCenter = currentLeft + activeBlock.value.width / 2
  const previousCenter = previous.left + previous.width / 2
  const centerOffset = currentCenter - previousCenter
  const offsetRatio = centerOffset / Math.max(1, previous.width / 2)
  const nextTilt = towerTilt.value + offsetRatio * 1.18

  pendingPlacement.value = {
    block: {
      id: activeBlock.value.id,
      width: activeBlock.value.width,
      left: currentLeft,
      level: activeBlock.value.level,
    },
    nextTilt,
    offsetRatio,
  }
  isDropping.value = true

  window.setTimeout(finalizePlacement, isReducedMotion.value ? 120 : dropDuration)
}

useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  if (event.code !== 'Space') {
    return
  }

  event.preventDefault()
  if (isGameOver.value) {
    resetGame()
    return
  }

  dropBlock()
})

useRafFn(({ delta }) => {
  if (isGameOver.value || isDropping.value) {
    return
  }

  const deltaSeconds = delta / 1000
  const maxLeft = stageWidth.value - activeBlock.value.width
  let nextLeft = activeBlock.value.left + direction.value * horizontalSpeed.value * deltaSeconds

  if (nextLeft <= 0) {
    nextLeft = 0
    direction.value = 1
  } else if (nextLeft >= maxLeft) {
    nextLeft = maxLeft
    direction.value = -1
  }

  activeBlock.value = {
    ...activeBlock.value,
    left: nextLeft,
  }
})

watch(stageWidth, (newWidth, oldWidth) => {
  if (!oldWidth || newWidth === oldWidth) {
    return
  }

  if (score.value === 0 && stack.value.length === 1 && !isDropping.value) {
    stack.value = [
      {
        ...stack.value[0],
        left: (newWidth - baseWidth) / 2,
      },
    ]
    activeBlock.value = {
      ...activeBlock.value,
      left: direction.value > 0 ? 0 : newWidth - activeBlock.value.width,
    }
    return
  }

  const delta = (newWidth - oldWidth) / 2
  stack.value = stack.value.map((block) => ({
    ...block,
    left: Math.min(Math.max(0, block.left + delta), newWidth - block.width),
  }))
  activeBlock.value = {
    ...activeBlock.value,
    left: Math.min(Math.max(0, activeBlock.value.left + delta), newWidth - activeBlock.value.width),
  }

  if (impactBurst.value) {
    impactBurst.value = {
      ...impactBurst.value,
      x: Math.min(Math.max(0, impactBurst.value.x + delta), newWidth),
    }
  }
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary">
    <div class="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
      <div class="animate-fade-up">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Trang chủ
        </RouterLink>
      </div>

      <main class="mt-4 flex flex-1 flex-col sm:mt-6">
        <section class="animate-fade-up animate-delay-3">
          <button
            type="button"
            class="group relative mx-auto block w-full overflow-hidden border border-border-default bg-bg-surface p-3 text-left transition duration-300 hover:border-accent-coral"
            @click="isGameOver ? resetGame() : dropBlock()"
          >
            <div
              ref="stageRef"
              class="relative mx-auto overflow-hidden border border-border-default bg-bg-deep"
              :class="isImpactShaking ? 'animate-impact-shake' : ''"
              :style="{ width: '100%', height: `${stageHeight}px` }"
            >
              <div
                class="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-accent-coral/10 to-transparent"
              />
              <div
                class="absolute inset-0 transition-transform duration-700 ease-in"
                :class="towerShellClass"
                :style="towerTransform"
              >
                <div
                  v-for="block in stack"
                  :key="block.id"
                  class="absolute border border-accent-amber/40 bg-accent-amber/85 shadow-[0_0_20px_rgba(255,184,48,0.18)] transition-[bottom,width,left] duration-150"
                  :style="{
                    width: `${block.width}px`,
                    left: `${block.left}px`,
                    height: `${blockHeight}px`,
                    bottom: `${getBlockBottom(block.level)}px`,
                  }"
                />
              </div>
              <div
                class="absolute border border-accent-coral bg-accent-coral/90 shadow-[0_0_24px_rgba(255,107,74,0.25)]"
                :class="isDropping ? 'transition-[bottom] duration-300 ease-in' : 'transition-none'"
                :style="activeBlockStyle"
              />
              <div
                v-if="impactBurst"
                :key="impactBurst.id"
                class="pointer-events-none absolute z-10"
                :style="{
                  left: `${impactBurst.x}px`,
                  top: `${impactBurst.y}px`,
                }"
              >
                <span class="spark sparkle-a" />
                <span class="spark sparkle-b" />
                <span class="spark sparkle-c" />
                <span class="spark sparkle-d" />
                <span class="spark sparkle-e" />
                <span class="spark sparkle-f" />
                <span class="spark spark-sm sparkle-g" />
                <span class="spark spark-sm sparkle-h" />
                <span class="spark spark-sm sparkle-i" />
                <span class="spark spark-sm sparkle-j" />
                <span class="spark spark-sm sparkle-k" />
                <span class="spark spark-sm sparkle-l" />
                <span class="spark spark-dot sparkle-m" />
                <span class="spark spark-dot sparkle-n" />
                <span class="spark spark-dot sparkle-o" />
                <span class="spark spark-dot sparkle-p" />
              </div>

              <div
                class="pointer-events-none absolute inset-x-0 top-4 px-4 text-center font-display text-xs tracking-[0.25em] text-text-dim"
              >
                {{ isGameOver ? 'CHẠM ĐỂ CHƠI LẠI' : 'CHẠM MÀN HÌNH ĐỂ THẢ BLOCK' }}
              </div>
            </div>

            <div
              v-if="showGameOverModal"
              class="absolute inset-0 z-10 flex items-center justify-center bg-bg-deep/78 p-4"
            >
              <div
                class="w-full max-w-xs border border-accent-coral bg-bg-surface p-5 text-center animate-fade-up"
              >
                <p class="font-display text-xs tracking-[0.28em] text-accent-coral">// GAME OVER</p>
                <h3 class="mt-3 font-display text-3xl font-bold text-text-primary">Tháp đã sập</h3>
                <p class="mt-3 text-sm leading-6 text-text-secondary">
                  Bạn giữ được
                  <span class="font-display text-lg text-accent-amber">{{ score }}</span>
                  tầng trước khi trục tháp mất cân bằng.
                </p>
                <p class="mt-2 text-sm text-text-dim">
                  Kỷ lục hiện tại:
                  <span class="font-display text-accent-sky">{{ bestScore }}</span>
                </p>
                <button
                  type="button"
                  class="mt-5 inline-flex w-full items-center justify-center gap-2 border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-secondary transition hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
                  @click.stop="resetGame"
                >
                  <Icon icon="lucide:rotate-ccw" class="size-4" />
                  Chơi lại ngay
                </button>
              </div>
            </div>
          </button>
        </section>

        <section
          class="mt-4 animate-fade-up animate-delay-2 border border-border-default bg-bg-surface p-5 sm:p-6"
        >
          <div
            class="flex flex-col gap-4 border-b border-border-default pb-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div>
              <p class="font-display text-xs tracking-[0.3em] text-accent-coral">// TIMING GAME</p>
              <h1 class="mt-2 font-display text-4xl font-bold uppercase sm:text-6xl">
                Stack Tower
              </h1>
              <div
                class="mt-3 max-w-3xl space-y-2 text-sm leading-6 text-text-secondary sm:text-base"
              >
                <p>
                  Tap vào vùng chơi hoặc nhấn phím <span class="text-accent-amber">Space</span>.
                </p>
                <p>
                  Block giữ nguyên kích thước khi rơi xuống, nhưng vị trí lệch sẽ làm trục tháp
                  nghiêng.
                </p>
                <p>
                  Block càng lên cao càng hẹp và di chuyển nhanh hơn, nên timing phải chính xác hơn.
                </p>
              </div>
            </div>
            <div
              class="w-fit border border-accent-coral bg-accent-coral px-3 py-2 font-display text-xs font-bold tracking-[0.25em] text-bg-deep"
            >
              VOL.01 / 2026
            </div>
          </div>

          <div class="mt-4 grid gap-3 sm:grid-cols-3">
            <div
              class="border border-border-default bg-bg-deep p-4 animate-fade-up animate-delay-2"
            >
              <p class="font-display text-xs tracking-[0.25em] text-text-dim">TẦNG HIỆN TẠI</p>
              <p class="mt-3 font-display text-4xl font-bold text-accent-coral">{{ score }}</p>
            </div>
            <div
              class="border border-border-default bg-bg-deep p-4 animate-fade-up animate-delay-3"
            >
              <p class="font-display text-xs tracking-[0.25em] text-text-dim">ĐIỂM CAO NHẤT</p>
              <p class="mt-3 font-display text-4xl font-bold text-accent-amber">{{ bestScore }}</p>
            </div>
            <div
              class="border border-border-default bg-bg-deep p-4 animate-fade-up animate-delay-4"
            >
              <p class="font-display text-xs tracking-[0.25em] text-text-dim">ĐỘ KHÓ</p>
              <p class="mt-3 font-display text-2xl font-bold text-accent-sky">
                {{ difficultyLabel }}px
              </p>
              <div class="mt-4 h-2 border border-border-default bg-bg-surface">
                <div
                  class="h-full bg-accent-sky transition-all duration-300"
                  :style="{ width: `${progressPercent}%` }"
                />
              </div>
            </div>
          </div>

          <div class="mt-3 flex justify-end sm:hidden">
            <button
              type="button"
              class="inline-flex items-center gap-2 border border-border-default bg-bg-deep px-4 py-2 text-sm text-text-secondary transition hover:border-accent-sky hover:bg-bg-elevated hover:text-text-primary"
              @click="isInfoModalOpen = true"
            >
              <Icon icon="lucide:info" class="size-4 text-accent-sky" />
              Thông tin
            </button>
          </div>
        </section>
      </main>

      <div
        v-if="isInfoModalOpen"
        class="fixed inset-0 z-40 flex items-end bg-bg-deep/82 p-4 sm:hidden"
        @click.self="isInfoModalOpen = false"
      >
        <div
          class="max-h-[82vh] w-full overflow-y-auto border border-border-default bg-bg-surface p-5"
        >
          <div
            class="mb-4 flex items-start justify-between gap-4 border-b border-border-default pb-4"
          >
            <div>
              <p class="font-display text-xs tracking-[0.28em] text-accent-sky">// THÔNG TIN</p>
              <h2 class="mt-2 font-display text-2xl font-bold text-text-primary">Stack Tower</h2>
            </div>
            <button
              type="button"
              class="inline-flex items-center justify-center border border-border-default bg-bg-deep p-2 text-text-secondary transition hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
              @click="isInfoModalOpen = false"
            >
              <Icon icon="lucide:x" class="size-4" />
            </button>
          </div>

          <div class="space-y-4">
            <div class="border border-border-default bg-bg-deep p-4">
              <h3 class="flex items-center gap-3 font-display text-lg font-semibold">
                <span class="text-sm tracking-widest text-accent-coral">//</span>
                Cách chơi
              </h3>
              <div class="mt-3 space-y-3 text-sm leading-6 text-text-secondary">
                <p>
                  Tap vào vùng chơi hoặc nhấn phím <span class="text-accent-amber">Space</span>.
                </p>
                <p>
                  Block giữ nguyên kích thước khi rơi xuống, nhưng vị trí lệch sẽ làm trục tháp
                  nghiêng.
                </p>
                <p>
                  Block càng lên cao càng hẹp và di chuyển nhanh hơn, nên timing phải chính xác hơn.
                </p>
              </div>
            </div>

            <div class="border border-border-default bg-bg-deep p-4">
              <div class="grid gap-3">
                <button
                  type="button"
                  class="inline-flex items-center justify-center gap-2 border border-border-default bg-bg-surface px-4 py-3 text-sm text-text-secondary transition hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
                  @click="dropBlock"
                >
                  <Icon icon="lucide:mouse-pointer-click" class="size-4" />
                  Thả block
                </button>
                <button
                  type="button"
                  class="inline-flex items-center justify-center gap-2 border border-border-default bg-bg-surface px-4 py-3 text-sm text-text-secondary transition hover:border-accent-amber hover:bg-bg-elevated hover:text-text-primary"
                  @click="resetGame"
                >
                  <Icon icon="lucide:rotate-ccw" class="size-4" />
                  Chơi lại
                </button>
                <RouterLink
                  to="/"
                  class="inline-flex items-center justify-center gap-2 border border-border-default bg-bg-surface px-4 py-3 text-sm text-text-secondary transition hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
                >
                  <Icon icon="lucide:arrow-left" class="size-4" />
                  Về trang chủ
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes collapse-right {
  0% {
    transform: rotate(0deg) translate3d(0, 0, 0);
  }

  55% {
    transform: rotate(38deg) translate3d(20px, 8px, 0);
  }

  100% {
    transform: rotate(88deg) translate3d(136px, 58px, 0);
  }
}

@keyframes collapse-left {
  0% {
    transform: rotate(0deg) translate3d(0, 0, 0);
  }

  55% {
    transform: rotate(-38deg) translate3d(-20px, 8px, 0);
  }

  100% {
    transform: rotate(-88deg) translate3d(-136px, 58px, 0);
  }
}

.animate-collapse-right {
  animation: collapse-right 700ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.animate-collapse-left {
  animation: collapse-left 700ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.spark {
  position: absolute;
  left: -2px;
  top: -2px;
  width: 4px;
  height: 18px;
  background: linear-gradient(
    to bottom,
    rgb(255 255 255 / 0.95) 0%,
    rgb(255 184 48 / 0.95) 38%,
    rgb(255 107 74 / 0) 100%
  );
  transform-origin: center bottom;
  animation: sparkle-burst 420ms ease-out forwards;
}

.spark-sm {
  width: 3px;
  height: 13px;
  animation-duration: 520ms;
}

.spark-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: radial-gradient(
    circle,
    rgb(255 255 255 / 0.95) 0%,
    rgb(255 184 48 / 0.9) 40%,
    rgb(255 107 74 / 0) 100%
  );
  animation: sparkle-dot 520ms ease-out forwards;
}

.sparkle-a {
  transform: rotate(0deg);
}

.sparkle-b {
  transform: rotate(60deg);
}

.sparkle-c {
  transform: rotate(120deg);
}

.sparkle-d {
  transform: rotate(180deg);
}

.sparkle-e {
  transform: rotate(240deg);
}

.sparkle-f {
  transform: rotate(300deg);
}

.sparkle-g {
  transform: rotate(30deg);
}

.sparkle-h {
  transform: rotate(90deg);
}

.sparkle-i {
  transform: rotate(150deg);
}

.sparkle-j {
  transform: rotate(210deg);
}

.sparkle-k {
  transform: rotate(270deg);
}

.sparkle-l {
  transform: rotate(330deg);
}

.sparkle-m {
  transform: rotate(45deg) translateY(-2px);
}

.sparkle-n {
  transform: rotate(135deg) translateY(-2px);
}

.sparkle-o {
  transform: rotate(225deg) translateY(-2px);
}

.sparkle-p {
  transform: rotate(315deg) translateY(-2px);
}

@keyframes sparkle-burst {
  0% {
    opacity: 0.95;
    transform: scaleY(0.4);
  }

  45% {
    opacity: 1;
    transform: scaleY(1) translateY(-4px);
  }

  100% {
    opacity: 0;
    transform: scaleY(0.65) translateY(-12px);
  }
}

@keyframes sparkle-dot {
  0% {
    opacity: 0.95;
    transform: scale(0.6);
  }

  55% {
    opacity: 1;
    transform: scale(1) translateY(-10px);
  }

  100% {
    opacity: 0;
    transform: scale(0.5) translateY(-18px);
  }
}

@keyframes impact-shake {
  0% {
    transform: translate3d(0, 0, 0);
  }

  20% {
    transform: translate3d(-2px, 0, 0);
  }

  40% {
    transform: translate3d(2px, 0, 0);
  }

  60% {
    transform: translate3d(-1px, 1px, 0);
  }

  80% {
    transform: translate3d(1px, 0, 0);
  }

  100% {
    transform: translate3d(0, 0, 0);
  }
}

.animate-impact-shake {
  animation: impact-shake 220ms ease-out;
}
</style>
