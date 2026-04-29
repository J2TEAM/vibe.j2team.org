<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useIntervalFn, useTimeoutFn, useWindowSize } from '@vueuse/core'
import { RouterLink } from 'vue-router'

const animals = ['🐑', '🐄', '🐖', '🐔', '🐐', '🦆', '🐈'] as const
type Animal = (typeof animals)[number]

type Cell = Animal | null

type MovingAnimal = {
  id: number
  emoji: Animal
  x: number
  y: number
}

type Level = {
  id: number
  label: string
  size: number
  density: number
  moving: boolean
}

const levels: Level[] = [
  { id: 1, label: 'Level 1', size: 5, density: 0.5, moving: false },
  { id: 2, label: 'Level 2', size: 7, density: 0.55, moving: false },
  { id: 3, label: 'Level 3', size: 10, density: 0.6, moving: false },
  { id: 4, label: 'Level 4', size: 13, density: 0.65, moving: false },
  { id: 5, label: 'Level 5', size: 15, density: 0.7, moving: false },
  {
    id: 6,
    label: 'Level Địa ngục 😈',
    size: 15,
    density: 0.75,
    moving: true,
  },
]

const selectedLevelId = ref<Level['id']>(1)
const defaultLevel = levels[0]!
const currentLevel = computed<Level>(
  () => levels.find((level) => level.id === selectedLevelId.value) ?? defaultLevel,
)

const grid = ref<Cell[]>([])
const gridHidden = ref(false)
const movingAnimals = ref<MovingAnimal[]>([])
const phase = ref<'idle' | 'playing' | 'answer' | 'next' | 'failed' | 'cleared'>('idle')
const answerInput = ref('')
const timeLeft = ref(0)
const { width: viewportWidth } = useWindowSize()
const boardPx = computed(() => {
  const isWide = viewportWidth.value >= 1024
  const padding = isWide ? 100 : 50
  const viewportMax = viewportWidth.value - padding
  const containerMax = Math.min(1280, viewportWidth.value - 48)
  const leftColumn = Math.floor(containerMax * 0.66) - 16
  const maxWidth = isWide ? Math.min(leftColumn, viewportMax) : viewportMax
  return Math.floor(maxWidth)
})
const cellGap = 4
const gridMetrics = computed(() => {
  const size = currentLevel.value.size
  const cell = Math.max(10, Math.floor((boardPx.value - cellGap * (size - 1)) / size))
  const grid = cell * size + cellGap * (size - 1)
  return { cell, grid }
})
const boardSize = computed(() => `${gridMetrics.value.grid}px`)
const cellPx = computed(() => gridMetrics.value.cell)
const stepPx = computed(() => gridMetrics.value.cell + cellGap)

const shuffleIndices = (length: number) => {
  const indices = Array.from({ length }, (_, index) => index)
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = indices[i]!
    indices[i] = indices[j]!
    indices[j] = temp
  }
  return indices
}

const levelTime = (levelId: number) => {
  switch (levelId) {
    case 1:
      return 7
    case 2:
      return 10
    case 3:
      return 12
    case 4:
      return 15
    case 5:
      return 20
    case 6:
      return 25
    default:
      return 25
  }
}

const buildGrid = (level: Level) => {
  const total = level.size * level.size
  const count = Math.max(1, Math.floor(total * level.density))
  const indices = shuffleIndices(total)
  const nextGrid: Cell[] = Array.from({ length: total }, () => null)
  const nextMoving: MovingAnimal[] = []

  for (let i = 0; i < count; i += 1) {
    const cellIndex = indices[i]!
    const animalIndex = Math.floor(Math.random() * animals.length)
    const emoji = animals[animalIndex]!
    nextGrid[cellIndex] = emoji
    nextMoving.push({
      id: i,
      emoji,
      x: cellIndex % level.size,
      y: Math.floor(cellIndex / level.size),
    })
  }

  grid.value = nextGrid
  movingAnimals.value = nextMoving
}

const moveAnimals = () => {
  const total = grid.value.length
  if (total === 0) return

  if (currentLevel.value.moving) {
    const indices = shuffleIndices(total)
    movingAnimals.value = movingAnimals.value.map((animal, idx) => {
      const index = indices[idx]!
      return {
        ...animal,
        x: index % currentLevel.value.size,
        y: Math.floor(index / currentLevel.value.size),
      }
    })
    return
  }

  const occupied: number[] = []
  const empty: number[] = []

  grid.value.forEach((cell, index) => {
    if (cell) occupied.push(index)
    else empty.push(index)
  })

  if (occupied.length === 0 || empty.length === 0) return

  const moves = Math.min(6, Math.ceil(total * 0.04))

  for (let i = 0; i < moves; i += 1) {
    const fromIndex = occupied[Math.floor(Math.random() * occupied.length)]!
    const toIndex = empty[Math.floor(Math.random() * empty.length)]!

    const temp = grid.value[fromIndex]!
    grid.value[fromIndex] = null
    grid.value[toIndex] = temp

    empty.push(fromIndex)
  }
}

const counts = computed(() => {
  const base = animals.reduce<Record<Animal, number>>(
    (acc, animal) => {
      acc[animal] = 0
      return acc
    },
    {} as Record<Animal, number>,
  )

  if (currentLevel.value.moving) {
    for (const animal of movingAnimals.value) {
      base[animal.emoji] += 1
    }
  } else {
    for (const cell of grid.value) {
      if (cell) base[cell] += 1
    }
  }

  return base
})

const { pause: pauseMove, resume: resumeMove } = useIntervalFn(moveAnimals, 1500, {
  immediate: false,
})
const { pause: pauseCountdown, resume: resumeCountdown } = useIntervalFn(
  () => {
    if (timeLeft.value <= 0) return
    timeLeft.value -= 1
    if (timeLeft.value <= 0) {
      timeLeft.value = 0
      phase.value = 'answer'
      pauseCountdown()
      pauseMove()
    }
  },
  1000,
  { immediate: false },
)
const { start: startHideTimer, stop: stopHideTimer } = useTimeoutFn(
  () => {
    gridHidden.value = true
    if (currentLevel.value.moving && phase.value === 'playing') resumeMove()
  },
  3000,
  { immediate: false },
)

const startLevel = (level: Level) => {
  buildGrid(level)
  gridHidden.value = false
  stopHideTimer()
  pauseMove()
  pauseCountdown()
  phase.value = 'playing'
  answerInput.value = ''
  timeLeft.value = levelTime(level.id)
  resumeCountdown()
  if (level.moving) startHideTimer()
}

const submitAnswer = () => {
  const guess = Number.parseInt(answerInput.value, 10)
  if (Number.isNaN(guess)) return
  const sheepCount = counts.value['🐑']
  if (guess === sheepCount) {
    const currentIndex = levels.findIndex((level) => level.id === currentLevel.value.id)
    const nextLevel = levels[currentIndex + 1]
    if (nextLevel) {
      phase.value = 'next'
      pauseCountdown()
      pauseMove()
    } else {
      phase.value = 'cleared'
      pauseCountdown()
      pauseMove()
    }
  } else {
    phase.value = 'failed'
  }
}

const nextLevel = () => {
  const currentIndex = levels.findIndex((level) => level.id === currentLevel.value.id)
  const nextLevel = levels[currentIndex + 1]
  if (nextLevel) {
    phase.value = 'playing'
    selectedLevelId.value = nextLevel.id
  }
}

const resetGame = () => {
  phase.value = 'playing'
  selectedLevelId.value = 1
  grid.value = []
  movingAnimals.value = []
  answerInput.value = ''
  timeLeft.value = 0
}

watch(
  [currentLevel, phase],
  ([level, currPhase]) => {
    if (level && currPhase === 'playing') startLevel(level)
  },
  { immediate: true },
)
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body px-4 py-4">
    <div class="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <header class="flex flex-col gap-3">
        <div class="flex items-center gap-3">
          <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
          <p class="text-text-dim font-display text-xs tracking-widest">COUNT SHEEP</p>
        </div>
        <h1 class="font-display text-3xl font-bold text-text-primary animate-fade-up">
          Game đếm Cừu
        </h1>
        <p class="max-w-2xl text-sm text-text-secondary animate-fade-up animate-delay-2">
          Hãy đếm xem có bao nhiêu con cừu (🐑) xuất hiện nhé.
        </p>
        <div class="flex flex-wrap items-center gap-2 animate-fade-up animate-delay-3">
          <RouterLink
            to="/"
            class="border border-border-default bg-bg-surface px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          >
            Về trang chủ
          </RouterLink>
          <button
            v-if="phase === 'idle'"
            type="button"
            class="border border-border-default bg-bg-elevated px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            @click="resetGame()"
          >
            Bắt đầu chơi
          </button>
          <button
            v-if="['failed', 'cleared'].includes(phase)"
            type="button"
            class="border border-border-default bg-bg-elevated px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            @click="resetGame()"
          >
            Chơi lại
          </button>
        </div>
      </header>

      <section
        v-if="phase !== 'idle'"
        class="grid flex-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
      >
        <div
          class="border border-border-default bg-bg-surface p-3 animate-fade-up animate-delay-4 w-fit"
        >
          <div class="flex items-center justify-between gap-4 pb-3 text-xs text-text-secondary">
            <div class="font-display text-text-primary">
              {{ currentLevel.label }}
            </div>
            <div v-show="phase === 'playing'" class="flex items-center gap-3">
              <span>Thời gian còn lại:</span>
              <span class="text-accent-amber font-display"> {{ timeLeft }}s </span>
            </div>
          </div>
          <div
            v-if="phase === 'playing'"
            class="relative mx-auto"
            :style="{ width: boardSize, height: boardSize }"
          >
            <div
              class="grid h-full w-full"
              :class="{ 'grid-hidden': gridHidden }"
              :style="{
                gridTemplateColumns: `repeat(${currentLevel?.size}, ${cellPx}px)`,
                gridAutoRows: `${cellPx}px`,
                gap: `${cellGap}px`,
              }"
            >
              <div
                v-for="(cell, index) in grid"
                :key="`${cell ?? 'empty'}-${index}`"
                class="cell flex items-center justify-center border border-border-default bg-bg-deep"
                :style="{ fontSize: `${Math.max(10, cellPx - 6)}px` }"
              >
                <span v-if="cell && !currentLevel?.moving">{{ cell }}</span>
                <span v-else class="empty text-text-dim">.</span>
              </div>
            </div>
            <div
              v-if="currentLevel?.moving"
              class="pointer-events-none absolute left-0 top-0 h-full w-full"
            >
              <div
                v-for="animal in movingAnimals"
                :key="animal.id"
                class="moving-animal"
                :style="{
                  transform: `translate3d(${animal.x * stepPx}px, ${animal.y * stepPx}px, 0)`,
                  width: `${cellPx}px`,
                  height: `${cellPx}px`,
                  fontSize: `${Math.max(10, cellPx - 6)}px`,
                }"
              >
                {{ animal.emoji }}
              </div>
            </div>
          </div>
          <div v-if="phase === 'answer'" class="mt-4 flex flex-wrap items-center gap-3">
            <label class="text-sm text-text-secondary">
              Có bao nhiêu con cừu (🐑) trong xuất hiện?:
            </label>
            <input
              v-model="answerInput"
              type="number"
              min="0"
              class="w-32 border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-primary"
            />
            <button
              type="button"
              class="border border-border-default bg-bg-surface px-4 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              @click="submitAnswer"
            >
              Trả lời
            </button>
          </div>
          <div v-else-if="phase === 'failed'">
            <img src="/count-sheep/cat-haha.jpg" alt="Cat Shocked" class="mx-auto w-32" />
            <div
              class="mt-4 border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-secondary"
            >
              Sai rồi. Bạn đã gục ngã ở level {{ currentLevel.id }}. 😭😭😭
            </div>
          </div>
          <div v-else-if="phase === 'next'">
            <div
              class="mt-4 border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-secondary"
            >
              Chính xác! Chuyển sang level tiếp theo nào. 🎉🎉🎉
            </div>
            <button
              type="button"
              class="mt-4 border border-border-default bg-bg-surface px-4 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              @click="nextLevel"
            >
              Chơi tiếp
            </button>
          </div>
          <div v-else-if="phase === 'cleared'">
            <img src="/count-sheep/cat-shock.jpg" alt="Cat Shocked" class="mx-auto w-32" />
            <div
              class="mt-4 border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-secondary"
            >
              🤯 Á đù dân chơi này đẳng cấp vậy, clear hết level luôn. Chúc mừng bạn đã chiến thắng!
              🎉🎉🎉
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.cell {
  transition:
    transform 160ms ease,
    background-color 160ms ease,
    border-color 160ms ease;
}

.grid-hidden .cell {
  border-color: transparent;
  background-color: transparent;
}

.grid-hidden .empty {
  opacity: 0;
}

.grid-hidden .cell span {
  opacity: 0;
}

.moving-animal {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition:
    transform 620ms ease,
    filter 620ms ease;
  filter: drop-shadow(0 0 8px rgba(255, 107, 74, 0.3));
}

@media (max-width: 640px) {
  .moving-animal {
    font-size: 12px;
  }
}
</style>
