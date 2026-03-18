<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useEventListener, useLocalStorage } from '@vueuse/core'
import { RouterLink } from 'vue-router'

type GameState = 'idle' | 'playing' | 'finished'
type AimRun = {
  score: number
  totalClicks: number
  accuracy: number
  avgReaction: number
  durationSec: number
  targetSize: number
  createdAt: number
}

const MIN_TARGET_SIZE = 30
const MAX_TARGET_SIZE = 90
const MIN_DURATION = 10
const MAX_DURATION = 120
const MIN_SENSITIVITY = 0.5
const MAX_SENSITIVITY = 2.5
const MIN_GAME_HEIGHT = 260
const MAX_GAME_HEIGHT = 680
const MIN_GAME_WIDTH = 320
const MAX_GAME_WIDTH = 1200

const gameArea = ref<HTMLElement | null>(null)
const cursorX = ref(0)
const cursorY = ref(0)
const lastPointerX = ref<number | null>(null)
const lastPointerY = ref<number | null>(null)
const isPointerLocked = ref(false)
const settingsOpen = ref(true)
const state = ref<GameState>('idle')
const score = ref(0)
const totalClicks = ref(0)
const targetSize = useLocalStorage<number>('aim-trainer-target-size', 50)
const durationSec = useLocalStorage<number>('aim-trainer-duration-sec', 30)
const sensitivity = useLocalStorage<number>('aim-trainer-sensitivity', 1)
const gameHeight = useLocalStorage<number>('aim-trainer-game-height', 420)
const gameWidth = useLocalStorage<number>('aim-trainer-game-width', 100)
const timeLeft = ref(durationSec.value)
const reactionSum = ref(0)

const targetX = ref(0)
const targetY = ref(0)
const targetVisible = ref(false)
const targetKey = ref(0)
const hitLocked = ref(false)
const spawnedAt = ref(0)

const bestScore = useLocalStorage<number>('aim-trainer-best-score', 0)
const playHistory = useLocalStorage<AimRun[]>('aim-trainer-history', [])

const accuracy = computed(() => (totalClicks.value ? (score.value / totalClicks.value) * 100 : 0))
const avgReaction = computed(() => (score.value ? reactionSum.value / score.value : 0))
const topScores = computed(() =>
  [...playHistory.value]
    .sort((a, b) => b.score - a.score || b.accuracy - a.accuracy || a.avgReaction - b.avgReaction)
    .slice(0, 5),
)
const recentRuns = computed(() =>
  [...playHistory.value].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8),
)
const displayTimeLeft = computed(() =>
  state.value === 'playing' ? timeLeft.value : durationSec.value,
)
const targetSizePx = computed(() =>
  Math.min(MAX_TARGET_SIZE, Math.max(MIN_TARGET_SIZE, targetSize.value)),
)
const gameDurationMs = computed(
  () => Math.min(MAX_DURATION, Math.max(MIN_DURATION, durationSec.value)) * 1000,
)
const sensitivityValue = computed(() =>
  Math.min(MAX_SENSITIVITY, Math.max(MIN_SENSITIVITY, sensitivity.value)),
)
const gameHeightPx = computed(() => Math.max(120, gameHeight.value))
const gameWidthPx = computed(() => Math.max(240, gameWidth.value))
const gameHeightSlider = computed({
  get: () => Math.min(MAX_GAME_HEIGHT, Math.max(MIN_GAME_HEIGHT, gameHeight.value)),
  set: (value: number) => {
    gameHeight.value = value
  },
})
const gameWidthSlider = computed({
  get: () => Math.min(MAX_GAME_WIDTH, Math.max(MIN_GAME_WIDTH, gameWidth.value)),
  set: (value: number) => {
    gameWidth.value = value
  },
})

let rafId = 0
let endAt = 0

function saveRun() {
  const run: AimRun = {
    score: score.value,
    totalClicks: totalClicks.value,
    accuracy: accuracy.value,
    avgReaction: avgReaction.value,
    durationSec: durationSec.value,
    targetSize: targetSizePx.value,
    createdAt: Date.now(),
  }

  playHistory.value = [run, ...playHistory.value].slice(0, 30)
}

function formatRunTime(ts: number) {
  return new Date(ts).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  })
}

function spawnTarget() {
  const el = gameArea.value
  if (!el) return

  const maxX = Math.max(0, el.clientWidth - targetSizePx.value)
  const maxY = Math.max(0, el.clientHeight - targetSizePx.value)

  targetVisible.value = false
  const centerX = maxX / 2
  const centerY = maxY / 2
  const rangeX = centerX * sensitivityValue.value
  const rangeY = centerY * sensitivityValue.value
  const nextX = centerX + (Math.random() * 2 - 1) * rangeX
  const nextY = centerY + (Math.random() * 2 - 1) * rangeY
  targetX.value = Math.min(maxX, Math.max(0, nextX))
  targetY.value = Math.min(maxY, Math.max(0, nextY))
  targetKey.value += 1
  spawnedAt.value = performance.now()
  hitLocked.value = false

  requestAnimationFrame(() => {
    targetVisible.value = true
  })
}

function finishGame() {
  state.value = 'finished'
  targetVisible.value = false
  cancelAnimationFrame(rafId)
  timeLeft.value = 0
  if (document.pointerLockElement) document.exitPointerLock()
  saveRun()
  if (score.value > bestScore.value) {
    bestScore.value = score.value
  }
}

function tick(now: number) {
  if (state.value !== 'playing') return

  const remaining = endAt - now
  if (remaining <= 0) {
    finishGame()
    return
  }

  timeLeft.value = remaining / 1000
  rafId = requestAnimationFrame(tick)
}

function startGame() {
  cancelAnimationFrame(rafId)

  state.value = 'playing'
  score.value = 0
  totalClicks.value = 0
  reactionSum.value = 0
  timeLeft.value = durationSec.value
  hitLocked.value = false
  lastPointerX.value = null
  lastPointerY.value = null

  nextTick(() => {
    const el = gameArea.value
    if (el) {
      cursorX.value = el.clientWidth / 2
      cursorY.value = el.clientHeight / 2
      try {
        el.requestPointerLock()
      } catch {}
    }
    spawnTarget()
    endAt = performance.now() + gameDurationMs.value
    rafId = requestAnimationFrame(tick)
  })
}

function handlePointerMove(e: PointerEvent) {
  if (state.value !== 'playing') return
  if (e.pointerType !== 'mouse') return
  const el = gameArea.value
  if (!el) return

  const rect = el.getBoundingClientRect()
  let dx = 0
  let dy = 0

  if (isPointerLocked.value) {
    dx = e.movementX * sensitivityValue.value
    dy = e.movementY * sensitivityValue.value
  } else {
    if (lastPointerX.value === null || lastPointerY.value === null) {
      lastPointerX.value = e.clientX
      lastPointerY.value = e.clientY
      return
    }
    dx = (e.clientX - lastPointerX.value) * sensitivityValue.value
    dy = (e.clientY - lastPointerY.value) * sensitivityValue.value
    lastPointerX.value = e.clientX
    lastPointerY.value = e.clientY
  }

  const nextX = cursorX.value + dx
  const nextY = cursorY.value + dy
  cursorX.value = Math.min(rect.width, Math.max(0, nextX))
  cursorY.value = Math.min(rect.height, Math.max(0, nextY))
}

function handleShot() {
  if (state.value !== 'playing' || hitLocked.value || !targetVisible.value) return

  hitLocked.value = true
  totalClicks.value += 1

  const targetCenterX = targetX.value + targetSizePx.value / 2
  const targetCenterY = targetY.value + targetSizePx.value / 2
  const dx = cursorX.value - targetCenterX
  const dy = cursorY.value - targetCenterY
  const distance = Math.hypot(dx, dy)
  const hitRadius = targetSizePx.value / 2

  if (distance <= hitRadius) {
    score.value += 1
    reactionSum.value += performance.now() - spawnedAt.value
    targetVisible.value = false
  }

  setTimeout(() => {
    if (state.value === 'playing') {
      spawnTarget()
    }
  }, 60)
}

useEventListener(document, 'pointermove', handlePointerMove)
useEventListener(document, 'pointerrawupdate', handlePointerMove, { passive: true })
useEventListener(document, 'pointerlockchange', () => {
  isPointerLocked.value = document.pointerLockElement === gameArea.value
  if (!isPointerLocked.value) {
    lastPointerX.value = null
    lastPointerY.value = null
  }
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  if (document.pointerLockElement) document.exitPointerLock()
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body px-4 py-4 sm:px-6 sm:py-6">
    <div
      class="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col sm:min-h-[calc(100vh-3rem)]"
    >
      <header class="mb-3 flex items-center justify-between gap-3 animate-fade-up sm:mb-4">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-2 text-xs text-text-secondary transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
        >
          &larr; Về trang chủ
        </RouterLink>
        <div class="font-display text-xs tracking-widest text-accent-coral">// AIM TRAINER</div>
      </header>

      <div
        class="mb-3 grid grid-cols-2 gap-2 text-xs animate-fade-up animate-delay-1 sm:mb-4 sm:grid-cols-4 sm:text-sm"
      >
        <div
          class="border border-border-default bg-bg-surface px-3 py-2 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated"
        >
          Score: {{ score }}
        </div>
        <div
          class="border border-border-default bg-bg-surface px-3 py-2 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated"
        >
          Time: {{ displayTimeLeft.toFixed(1) }}s
        </div>
        <div
          class="border border-border-default bg-bg-surface px-3 py-2 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated"
        >
          Accuracy: {{ accuracy.toFixed(1) }}%
        </div>
        <div
          class="border border-border-default bg-bg-surface px-3 py-2 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated"
        >
          Avg: {{ avgReaction.toFixed(0) }}ms
        </div>
      </div>

      <div class="flex justify-center">
        <div
          ref="gameArea"
          class="relative shrink-0 overflow-hidden border border-border-default bg-bg-surface animate-fade-up animate-delay-2"
          :class="state === 'playing' ? 'cursor-none' : ''"
          :style="{ height: `${gameHeightPx}px`, width: `${gameWidthPx}px` }"
          @pointerdown="handleShot"
          @pointermove="handlePointerMove"
        >
          <div
            v-if="state === 'playing' && targetVisible"
            :key="targetKey"
            class="target-pop absolute rounded-full border-2 border-bg-deep bg-accent-coral"
            :style="{
              left: `${targetX}px`,
              top: `${targetY}px`,
              width: `${targetSizePx}px`,
              height: `${targetSizePx}px`,
            }"
          />

          <div
            v-if="state === 'playing'"
            class="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent-amber bg-accent-amber/20"
            :style="{ left: `${cursorX}px`, top: `${cursorY}px` }"
          >
            <span
              class="absolute left-1/2 top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-accent-amber/60"
            />
            <span
              class="absolute left-1/2 top-1/2 h-0.5 w-5 -translate-x-1/2 -translate-y-1/2 bg-accent-amber/60"
            />
          </div>

          <div
            v-if="state !== 'playing'"
            class="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-bg-deep/70 px-4 text-center"
          >
            <h1 class="font-display text-3xl text-accent-coral sm:text-5xl">Aim Trainer</h1>
            <p class="text-sm text-text-secondary sm:text-base">
              {{ durationSec }} giây • Best score:
              <span class="font-display text-accent-amber">{{ bestScore }}</span>
            </p>

            <div class="w-full max-w-sm border border-border-default bg-bg-surface text-left">
              <button
                class="flex w-full items-center justify-between border-b border-border-default px-4 py-2 text-xs text-text-secondary transition-all duration-300 hover:bg-bg-elevated"
                type="button"
                @click="settingsOpen = !settingsOpen"
              >
                <span class="font-display text-xs tracking-wide text-text-primary">SETTINGS</span>
                <span class="text-text-dim">{{ settingsOpen ? 'Ẩn' : 'Mở' }}</span>
              </button>

              <div
                v-if="settingsOpen"
                class="max-h-[220px] space-y-3 overflow-y-auto px-4 py-3 pb-6"
              >
                <label class="block text-xs text-text-secondary">
                  Target size: <span class="text-text-primary">{{ targetSizePx }}px</span>
                </label>
                <input
                  v-model.number="targetSize"
                  :min="MIN_TARGET_SIZE"
                  :max="MAX_TARGET_SIZE"
                  type="range"
                  class="w-full accent-accent-coral"
                />

                <label class="block text-xs text-text-secondary">
                  Duration: <span class="text-text-primary">{{ durationSec }}s</span>
                </label>
                <input
                  v-model.number="durationSec"
                  :min="MIN_DURATION"
                  :max="MAX_DURATION"
                  type="range"
                  class="w-full accent-accent-amber"
                />

                <label class="block text-xs text-text-secondary">
                  Sensitivity:
                  <span class="text-text-primary">{{ sensitivityValue.toFixed(2) }}x</span>
                </label>
                <input
                  v-model.number="sensitivity"
                  :min="MIN_SENSITIVITY"
                  :max="MAX_SENSITIVITY"
                  step="0.05"
                  type="range"
                  class="w-full accent-accent-sky"
                />

                <label class="block text-xs text-text-secondary">
                  Game width: <span class="text-text-primary">{{ gameWidthPx }}px</span>
                </label>
                <input
                  v-model.number="gameWidth"
                  type="number"
                  class="w-full border border-border-default bg-bg-deep/40 px-2 py-1 text-xs text-text-primary"
                />
                <input
                  v-model.number="gameWidthSlider"
                  :min="MIN_GAME_WIDTH"
                  :max="MAX_GAME_WIDTH"
                  step="1"
                  type="range"
                  class="w-full accent-accent-coral"
                />

                <label class="block text-xs text-text-secondary">
                  Game height: <span class="text-text-primary">{{ gameHeightPx }}px</span>
                </label>
                <input
                  v-model.number="gameHeight"
                  type="number"
                  class="w-full border border-border-default bg-bg-deep/40 px-2 py-1 text-xs text-text-primary"
                />
                <input
                  v-model.number="gameHeightSlider"
                  :min="MIN_GAME_HEIGHT"
                  :max="MAX_GAME_HEIGHT"
                  step="10"
                  type="range"
                  class="w-full accent-accent-amber"
                />
              </div>
            </div>

            <div v-if="state === 'finished'" class="space-y-1 text-sm text-text-secondary">
              <p>Kết quả: {{ score }} hits / {{ totalClicks }} clicks</p>
              <p>Accuracy: {{ accuracy.toFixed(1) }}% • Avg: {{ avgReaction.toFixed(0) }}ms</p>
            </div>

            <button
              class="border border-accent-coral bg-accent-coral px-5 py-2 font-display text-bg-deep transition hover:brightness-110"
              @click="startGame"
            >
              {{ state === 'idle' ? 'Start' : 'Restart' }}
            </button>
          </div>
        </div>
      </div>

      <div
        class="mt-3 grid gap-3 text-xs animate-fade-up animate-delay-3 sm:mt-4 sm:grid-cols-2 sm:text-sm"
      >
        <section
          class="border border-border-default bg-bg-surface p-3 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated sm:p-4"
        >
          <h2 class="mb-2 font-display text-sm tracking-wide text-accent-coral sm:text-base">
            // SCOREBOARD
          </h2>
          <p class="mb-3 text-text-secondary">
            Top điểm cao nhất ({{ playHistory.length }} lượt chơi)
          </p>
          <div v-if="topScores.length === 0" class="text-text-dim">Chưa có dữ liệu.</div>
          <ul v-else class="space-y-1.5">
            <li
              v-for="(run, index) in topScores"
              :key="`${run.createdAt}-${index}`"
              class="flex items-center justify-between border border-border-default px-2 py-1.5"
            >
              <span class="font-display text-accent-amber"
                >#{{ index + 1 }} {{ run.score }} hits</span
              >
              <span class="text-text-secondary">
                {{ run.accuracy.toFixed(1) }}% • {{ run.avgReaction.toFixed(0) }}ms
              </span>
            </li>
          </ul>
        </section>

        <section
          class="border border-border-default bg-bg-surface p-3 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated sm:p-4"
        >
          <h2 class="mb-2 font-display text-sm tracking-wide text-accent-sky sm:text-base">
            // HISTORY
          </h2>
          <p class="mb-3 text-text-secondary">Lịch sử các lượt gần nhất</p>
          <div v-if="recentRuns.length === 0" class="text-text-dim">Chưa có dữ liệu.</div>
          <ul v-else class="space-y-1.5">
            <li
              v-for="run in recentRuns"
              :key="run.createdAt"
              class="flex items-center justify-between border border-border-default px-2 py-1.5"
            >
              <span class="text-text-primary">
                {{ run.score }} hits • {{ run.durationSec }}s • {{ run.targetSize }}px
              </span>
              <span class="text-text-secondary">{{ formatRunTime(run.createdAt) }}</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.target-pop {
  animation: pop 0.14s ease-out;
}

@keyframes pop {
  0% {
    transform: scale(0.72);
    opacity: 0.65;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
