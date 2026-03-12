<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  useElementSize,
  useEventListener,
  useLocalStorage,
  useMediaQuery,
  useRafFn,
  useWindowSize,
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
  tier: 0 | 1 | 2
  label: string
}

const defaultStageWidth = 320
const desktopStageHeight = 440
const blockHeight = 28
const baseWidth = 180
const minWidth = 12
const baseCrossDuration = 2.8
const minCrossDuration = 1.05
const tiltCollapseThreshold = 2.65
const maxCenterOffsetRatio = 0.72
const spawnGap = 86
const dropDuration = 320

const isReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
const isMobileViewport = useMediaQuery('(max-width: 639px)')
const { height: windowHeight } = useWindowSize()
const bestScore = useLocalStorage('stack-tower-best-score', 0)
const isSoundEnabled = useLocalStorage('stack-tower-sound-enabled', true)
const stageRef = ref<HTMLElement | null>(null)
const { width: measuredStageWidth } = useElementSize(stageRef)
const stageWidth = computed(() =>
  Math.max(defaultStageWidth, Math.round(measuredStageWidth.value || defaultStageWidth)),
)
const stageHeight = computed(() =>
  isMobileViewport.value ? Math.round(windowHeight.value - 160) : desktopStageHeight,
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
const isFloorNumberShaking = ref(false)
const isInfoModalOpen = ref(false)
const winFxTier = ref<0 | 1 | 2>(0)
const isScorePulse = ref(false)

const showFloorScore = computed(() => score.value > 5)
const streakLabel = computed(() => {
  if (score.value > 0 && score.value % 10 === 0) {
    return 'MEGA JACKPOT'
  }
  if (score.value > 0 && score.value % 5 === 0) {
    return 'WIN STREAK'
  }
  return ''
})
const shouldShowStreak = computed(() => winFxTier.value === 2 && streakLabel.value.length > 0)

// Âm thanh lấy online (Mixkit free SFX). Fallback: Web Audio API nếu URL lỗi.
const SOUND_SUCCESS_URL = 'https://assets.mixkit.co/active_storage/sfx/600.mp3' // Achievement bell
const SOUND_GAMEOVER_URL = 'https://assets.mixkit.co/active_storage/sfx/2010.mp3' // Game over

let successAudio: HTMLAudioElement | null = null
let gameOverAudio: HTMLAudioElement | null = null

function playSuccessSound() {
  if (!isSoundEnabled.value) {
    return
  }

  const playFromUrl = () => {
    if (!successAudio) {
      successAudio = new Audio(SOUND_SUCCESS_URL)
      successAudio.volume = 0.6
      successAudio.addEventListener('error', () => playSuccessWebAudio())
    }
    successAudio!.currentTime = 0
    successAudio!.play().catch(() => playSuccessWebAudio())
  }
  const playSuccessWebAudio = () => {
    const Ctx =
      window.AudioContext ||
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const now = ctx.currentTime
    ;[523.25, 659.25, 783.99].forEach((f, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'square'
      o.frequency.value = f
      o.connect(g)
      g.connect(ctx.destination)
      g.gain.setValueAtTime(0, now)
      g.gain.linearRampToValueAtTime(0.12, now + i * 0.08 + 0.04)
      g.gain.linearRampToValueAtTime(0, now + i * 0.08 + 0.18)
      o.start(now + i * 0.08)
      o.stop(now + i * 0.08 + 0.18)
    })
  }
  playFromUrl()
}

function playGameOverSound() {
  if (!isSoundEnabled.value) {
    return
  }

  const playFromUrl = () => {
    if (!gameOverAudio) {
      gameOverAudio = new Audio(SOUND_GAMEOVER_URL)
      gameOverAudio.volume = 0.6
      gameOverAudio.addEventListener('error', () => playGameOverWebAudio())
    }
    gameOverAudio!.currentTime = 0
    gameOverAudio!.play().catch(() => playGameOverWebAudio())
  }
  const playGameOverWebAudio = () => {
    const Ctx =
      window.AudioContext ||
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(220, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.5)
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  }
  playFromUrl()
}

function toggleSound() {
  isSoundEnabled.value = !isSoundEnabled.value
  if (!isSoundEnabled.value) {
    successAudio?.pause()
    gameOverAudio?.pause()
  }
}

const scrollOffset = computed(() => {
  const contentHeight = stack.value.length * blockHeight + spawnGap + blockHeight
  const bottomPadding = 56
  return Math.max(0, contentHeight - stageHeight.value + bottomPadding)
})

const activeBlockStyle = computed(() => ({
  width: `${activeBlock.value.width}px`,
  left: `${activeBlock.value.left}px`,
  height: `${blockHeight}px`,
  bottom: `${activeBlock.value.level * blockHeight + (isDropping.value ? 0 : spawnGap)}px`,
}))

const progressPercent = computed(() => Math.min(100, (score.value / 50) * 100))
const difficultyLabel = computed(() => Math.round(activeBlock.value.width))
const horizontalSpeed = computed(() => {
  const travelDistance = Math.max(1, stageWidth.value - activeBlock.value.width)
  const levelFactor = score.value * 0.11
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
  return Math.max(minWidth, Math.round(baseWidth - nextLevel * 4.2))
}

function createLevelSeed(level: number, id: number) {
  const value = Math.sin((id + 1) * 12.9898 + (level + 1) * 78.233) * 43758.5453
  return value - Math.floor(value)
}

function getBlockSkin(level: number, id: number, isActive = false) {
  const seed = createLevelSeed(level, id)
  const progress = Math.min(1, level / 40)
  const hueBase = 42 - progress * 20 + (seed - 0.5) * 10
  const hueAccent = hueBase - 12 - seed * 6
  const edgeAlpha = isActive ? 0.92 : 0.66
  const glowAlpha = isActive ? 0.5 : 0.26
  const scanAlpha = isActive ? 0.28 : 0.18
  const hotspotAlpha = isActive ? 0.82 : 0.58

  return {
    borderColor: `hsl(${hueBase} 88% 58% / ${edgeAlpha})`,
    background: `linear-gradient(160deg, hsl(${
      hueBase + 8
    } 92% 76% / 0.42) 0%, hsl(${hueBase} 88% 56% / ${
      0.34 + seed * 0.14
    }) 33%, hsl(${hueAccent} 84% 50% / 0.34) 70%, hsl(12 28% 8% / 0.24) 100%), linear-gradient(to bottom, hsl(0 0% 100% / ${scanAlpha}) 0%, hsl(0 0% 100% / 0) 56%)`,
    boxShadow: `inset 0 1px 0 hsl(0 0% 100% / 0.34), inset 0 -1px 0 hsl(0 0% 0% / 0.38), 0 0 ${
      isActive ? 30 : 18
    }px hsl(${hueBase} 90% 56% / ${glowAlpha})`,
    '--casino-glint-opacity': `${0.16 + seed * 0.16}`,
    '--casino-hotline-opacity': `${hotspotAlpha}`,
  }
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
  isFloorNumberShaking.value = false
  isInfoModalOpen.value = false
  winFxTier.value = 0
  isScorePulse.value = false
}

function finalizePlacement() {
  const placement = pendingPlacement.value
  if (!placement) {
    return
  }

  stack.value = [...stack.value, placement.block]
  towerTilt.value = placement.nextTilt
  score.value += 1
  bestScore.value = Math.max(bestScore.value, score.value)
  direction.value *= -1

  const isJackpot = score.value % 10 === 0
  const isStreak = score.value % 5 === 0
  winFxTier.value = isJackpot ? 2 : isStreak ? 1 : 0
  isScorePulse.value = true

  if (stack.value.length * blockHeight >= stageHeight.value - blockHeight) {
    stack.value = stack.value.slice(1).map((block, index) => ({
      ...block,
      level: index,
    }))
  }

  const shouldCollapse =
    Math.abs(placement.offsetRatio) > maxCenterOffsetRatio ||
    Math.abs(placement.nextTilt) >= tiltCollapseThreshold

  const burstTier: 0 | 1 | 2 = isJackpot ? 2 : isStreak ? 1 : 0
  impactBurst.value = {
    id: placement.block.id,
    x: placement.block.left + placement.block.width / 2,
    y: stageHeight.value - (placement.block.level + 1) * blockHeight,
    tier: burstTier,
    label: isJackpot ? 'JACKPOT +1' : isStreak ? 'STREAK +1' : '+1',
  }
  isImpactShaking.value = true
  isFloorNumberShaking.value = true
  window.setTimeout(
    () => {
      isImpactShaking.value = false
    },
    isReducedMotion.value ? 90 : 220,
  )
  window.setTimeout(
    () => {
      isFloorNumberShaking.value = false
    },
    isReducedMotion.value ? 150 : 450,
  )
  window.setTimeout(
    () => {
      isScorePulse.value = false
    },
    isReducedMotion.value ? 160 : 520,
  )
  window.setTimeout(
    () => {
      winFxTier.value = 0
    },
    isReducedMotion.value ? 200 : 720,
  )
  window.setTimeout(
    () => {
      if (impactBurst.value?.id === placement.block.id) {
        impactBurst.value = null
      }
    },
    isReducedMotion.value ? 180 : 680,
  )

  pendingPlacement.value = null

  if (shouldCollapse) {
    isGameOver.value = true
    playGameOverSound()
    return
  }

  playSuccessSound()
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
    const base = stack.value[0]!
    stack.value = [
      {
        ...base,
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
      <div class="animate-fade-up flex items-center justify-between gap-2">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Trang chủ
        </RouterLink>
        <button
          type="button"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-amber hover:bg-bg-elevated hover:text-text-primary"
          @click="toggleSound"
        >
          <Icon :icon="isSoundEnabled ? 'lucide:volume-2' : 'lucide:volume-x'" class="size-4" />
          {{ isSoundEnabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt' }}
        </button>
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
              :class="[
                isImpactShaking ? 'animate-impact-shake' : '',
                score > 0 ? 'casino-neon-grid' : '',
              ]"
              :style="{ width: '100%', height: `${stageHeight}px` }"
            >
              <div
                class="pointer-events-none absolute inset-0 z-0 opacity-70"
                :class="score > 0 ? 'casino-scanner' : ''"
              />
              <div
                v-if="winFxTier > 0"
                class="pointer-events-none absolute inset-0 z-1"
                :class="winFxTier === 2 ? 'animate-jackpot-flash' : 'animate-win-flash'"
              />
              <div
                class="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-accent-coral/10 to-transparent"
              />
              <div
                class="absolute inset-0 transition-transform duration-300 ease-out"
                :style="{ transform: `translateY(${scrollOffset}px)` }"
              >
                <div
                  class="absolute inset-0 transition-transform duration-700 ease-in"
                  :class="towerShellClass"
                  :style="towerTransform"
                >
                  <div
                    v-for="block in stack"
                    :key="block.id"
                    class="casino-block absolute transition-[bottom,width,left] duration-150"
                    :style="{
                      width: `${block.width}px`,
                      left: `${block.left}px`,
                      height: `${blockHeight}px`,
                      bottom: `${getBlockBottom(block.level)}px`,
                      ...getBlockSkin(block.level, block.id),
                    }"
                  >
                    <span class="casino-block-edge" />
                    <span class="casino-block-glint" />
                  </div>
                </div>
                <div
                  class="casino-block casino-block-active absolute"
                  :class="
                    isDropping ? 'transition-[bottom] duration-300 ease-in' : 'transition-none'
                  "
                  :style="{
                    ...activeBlockStyle,
                    ...getBlockSkin(activeBlock.level, activeBlock.id, true),
                  }"
                >
                  <span class="casino-block-edge" />
                  <span class="casino-block-glint casino-block-glint-fast" />
                  <span class="casino-block-hotline" />
                </div>
                <div
                  v-if="impactBurst"
                  :key="impactBurst.id"
                  class="pointer-events-none absolute z-10"
                  :class="
                    impactBurst.tier === 2
                      ? 'impact-burst-jackpot'
                      : impactBurst.tier === 1
                        ? 'impact-burst-streak'
                        : 'impact-burst-normal'
                  "
                  :style="{
                    left: `${impactBurst.x}px`,
                    top: `${impactBurst.y}px`,
                  }"
                >
                  <span class="impact-shockwave impact-shockwave-lg" />
                  <span class="impact-shockwave impact-shockwave-sm" />
                  <span class="impact-coin-flare" />
                  <span class="impact-floating-text">{{ impactBurst.label }}</span>
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
              </div>

              <div
                v-if="showFloorScore"
                class="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center"
              >
                <span
                  class="inline-flex min-w-12 items-center justify-center rounded border-2 border-accent-amber/70 bg-bg-surface px-4 py-1.5 font-display text-3xl font-black tabular-nums text-accent-amber shadow-[0_0_24px_rgba(255,184,48,0.5)]"
                  :class="[
                    isFloorNumberShaking ? 'animate-slot-jackpot' : '',
                    isScorePulse ? 'animate-score-pop' : '',
                    winFxTier === 2 ? 'score-jackpot-glow' : '',
                  ]"
                >
                  {{ score }}
                </span>
              </div>

              <div
                v-if="shouldShowStreak"
                class="pointer-events-none absolute inset-x-0 top-10 z-20 flex justify-center"
              >
                <span
                  class="border border-accent-amber bg-bg-surface/90 px-4 py-1 font-display text-xs tracking-[0.3em] text-accent-amber shadow-[0_0_22px_rgba(255,184,48,0.45)] animate-streak-banner"
                >
                  {{ streakLabel }}
                </span>
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

          <div class="mt-3 flex justify-end gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 border border-border-default bg-bg-deep px-4 py-2 text-sm text-text-secondary transition hover:border-accent-sky hover:bg-bg-elevated hover:text-text-primary sm:hidden"
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

.impact-burst-normal .spark {
  opacity: 0.9;
}

.impact-burst-streak .spark {
  animation-duration: 500ms;
}

.impact-burst-jackpot .spark {
  animation-duration: 620ms;
  filter: brightness(1.2);
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

.impact-shockwave {
  position: absolute;
  left: 0;
  top: 0;
  border-radius: 999px;
  border: 2px solid rgb(255 184 48 / 0.72);
  transform: translate(-50%, -50%) scale(0.2);
  opacity: 0;
  mix-blend-mode: screen;
}

.impact-shockwave-lg {
  width: 22px;
  height: 22px;
  animation: impact-wave-lg 540ms cubic-bezier(0.2, 0.7, 0.15, 1) forwards;
}

.impact-shockwave-sm {
  width: 12px;
  height: 12px;
  border-color: rgb(255 107 74 / 0.68);
  animation: impact-wave-sm 460ms cubic-bezier(0.2, 0.7, 0.15, 1) forwards;
}

.impact-coin-flare {
  position: absolute;
  left: 0;
  top: 0;
  width: 44px;
  height: 14px;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    ellipse at center,
    rgb(255 184 48 / 0.52) 0%,
    rgb(255 107 74 / 0.24) 45%,
    transparent 80%
  );
  animation: impact-coin-flare 420ms ease-out forwards;
}

.impact-floating-text {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-50%, -22px);
  padding: 2px 8px;
  border: 1px solid rgb(255 184 48 / 0.7);
  background: rgb(9 13 20 / 0.9);
  font-family: 'Anybody', sans-serif;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.18em;
  white-space: nowrap;
  color: rgb(255 224 156 / 1);
  text-shadow: 0 0 10px rgb(255 184 48 / 0.44);
  animation: impact-float-up 680ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.impact-burst-streak .impact-floating-text {
  border-color: rgb(255 184 48 / 0.9);
  color: rgb(255 236 182 / 1);
}

.impact-burst-jackpot .impact-floating-text {
  border-color: rgb(255 107 74 / 0.9);
  color: rgb(255 245 211 / 1);
  box-shadow: 0 0 16px rgb(255 107 74 / 0.5);
  animation-duration: 780ms;
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

@keyframes impact-wave-lg {
  0% {
    transform: translate(-50%, -50%) scale(0.25);
    opacity: 0.9;
  }

  100% {
    transform: translate(-50%, -50%) scale(4.4);
    opacity: 0;
  }
}

@keyframes impact-wave-sm {
  0% {
    transform: translate(-50%, -50%) scale(0.25);
    opacity: 0.85;
  }

  100% {
    transform: translate(-50%, -50%) scale(3.4);
    opacity: 0;
  }
}

@keyframes impact-coin-flare {
  0% {
    opacity: 0.65;
    transform: translate(-50%, -50%) scaleX(0.4);
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scaleX(1.9);
  }
}

@keyframes impact-float-up {
  0% {
    opacity: 0;
    transform: translate(-50%, -10px) scale(0.8);
  }

  20% {
    opacity: 1;
    transform: translate(-50%, -22px) scale(1.02);
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -44px) scale(0.94);
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

@keyframes slot-jackpot {
  0% {
    transform: scale(0.5);
    opacity: 0;
    filter: brightness(3);
  }

  15% {
    transform: scale(1.35);
    opacity: 1;
    filter: brightness(2);
  }

  25% {
    transform: scale(0.95) rotate(-3deg);
  }

  35% {
    transform: scale(1.08) rotate(2deg);
  }

  45% {
    transform: scale(0.98) rotate(-1deg);
  }

  55% {
    transform: scale(1.05) rotate(1deg);
  }

  70% {
    transform: scale(1.02) rotate(0deg);
  }

  85% {
    transform: scale(1.05);
    filter: brightness(1.2);
  }

  100% {
    transform: scale(1);
    opacity: 1;
    filter: brightness(1);
  }
}

.animate-slot-jackpot {
  animation: slot-jackpot 450ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.casino-neon-grid::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(
      to bottom,
      rgb(255 184 48 / 0.04) 0%,
      rgb(255 184 48 / 0.01) 45%,
      rgb(255 107 74 / 0.08) 100%
    ),
    repeating-linear-gradient(
      to right,
      rgb(255 184 48 / 0.03) 0px,
      rgb(255 184 48 / 0.03) 1px,
      transparent 1px,
      transparent 18px
    );
  mix-blend-mode: screen;
}

.casino-scanner {
  background: linear-gradient(
    to bottom,
    rgb(255 255 255 / 0) 0%,
    rgb(255 184 48 / 0.22) 40%,
    rgb(255 255 255 / 0) 72%
  );
  animation: casino-scan 2.1s linear infinite;
}

@keyframes casino-scan {
  0% {
    transform: translateY(-100%);
    opacity: 0.18;
  }

  30% {
    opacity: 0.42;
  }

  100% {
    transform: translateY(100%);
    opacity: 0.18;
  }
}

@keyframes win-flash {
  0% {
    opacity: 0;
  }

  20% {
    opacity: 0.35;
  }

  100% {
    opacity: 0;
  }
}

@keyframes jackpot-flash {
  0% {
    opacity: 0;
    filter: brightness(1);
  }

  18% {
    opacity: 0.45;
    filter: brightness(1.35);
  }

  45% {
    opacity: 0.26;
  }

  100% {
    opacity: 0;
    filter: brightness(1);
  }
}

.animate-win-flash {
  background: radial-gradient(
    ellipse at center,
    rgb(255 184 48 / 0.32) 0%,
    rgb(255 107 74 / 0.15) 40%,
    transparent 80%
  );
  animation: win-flash 420ms ease-out;
}

.animate-jackpot-flash {
  background:
    radial-gradient(
      ellipse at center,
      rgb(255 184 48 / 0.42) 0%,
      rgb(255 107 74 / 0.24) 42%,
      transparent 78%
    ),
    linear-gradient(120deg, rgb(255 184 48 / 0.16), rgb(255 107 74 / 0.18));
  animation: jackpot-flash 620ms ease-out;
}

@keyframes score-pop {
  0% {
    transform: scale(0.92);
    filter: brightness(1.7);
  }

  45% {
    transform: scale(1.1);
  }

  100% {
    transform: scale(1);
    filter: brightness(1);
  }
}

.animate-score-pop {
  animation: score-pop 420ms cubic-bezier(0.2, 1.12, 0.2, 1);
}

.score-jackpot-glow {
  box-shadow:
    0 0 18px rgb(255 184 48 / 0.6),
    0 0 34px rgb(255 107 74 / 0.45);
}

@keyframes streak-banner {
  0% {
    transform: translateY(8px) scale(0.88);
    opacity: 0;
    letter-spacing: 0.45em;
  }

  30% {
    transform: translateY(0) scale(1.06);
    opacity: 1;
  }

  100% {
    transform: translateY(-6px) scale(1);
    opacity: 0;
    letter-spacing: 0.3em;
  }
}

.animate-streak-banner {
  animation: streak-banner 700ms cubic-bezier(0.22, 1, 0.36, 1);
}

.casino-block {
  overflow: hidden;
  --casino-glint-opacity: 0.2;
  --casino-hotline-opacity: 0.62;
}

.casino-block-active {
  filter: saturate(1.08);
}

.casino-block-edge {
  position: absolute;
  inset: 0;
  border-top: 1px solid rgb(255 255 255 / 0.34);
  border-bottom: 1px solid rgb(0 0 0 / 0.42);
  opacity: 0.75;
}

.casino-block-glint {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 15%,
    rgb(255 255 255 / 0.15) 33%,
    rgb(255 255 255 / 0.28) 44%,
    rgb(255 255 255 / 0.12) 56%,
    transparent 72%
  );
  transform: translateX(-120%);
  mix-blend-mode: screen;
  opacity: var(--casino-glint-opacity);
  animation: casino-glint 2.8s ease-in-out infinite;
}

.casino-block-glint-fast {
  animation-duration: 1.45s;
}

.casino-block-hotline {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 2px;
  height: 2px;
  background: linear-gradient(
    to right,
    rgb(255 184 48 / 0.2) 0%,
    rgb(255 184 48 / 0.72) 46%,
    rgb(255 107 74 / 0.85) 100%
  );
  opacity: var(--casino-hotline-opacity);
  box-shadow: 0 0 8px rgb(255 107 74 / 0.48);
}

@keyframes casino-glint {
  0% {
    transform: translateX(-120%);
    opacity: 0;
  }

  16% {
    opacity: 1;
  }

  42% {
    transform: translateX(120%);
    opacity: 0.95;
  }

  100% {
    transform: translateX(120%);
    opacity: 0;
  }
}
</style>
