<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useIntervalFn, useLocalStorage } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'

type TileColor = 0 | 1 | 2
type BoardCell = TileColor | null

interface Coord {
  row: number
  col: number
}

interface PuzzlePreset {
  id: string
  name: string
  par: number
  board: BoardCell[][]
}

interface FloatingPixel {
  id: number
  color: string
  size: number
  top: string
  left: string
  duration: string
  delay: string
}

interface PersistedClearRecord {
  moves: number
  elapsedSeconds: number
  completedAt: string
}

const palette = [
  {
    id: 0 as TileColor,
    name: 'Coral',
    fill: 'bg-accent-coral',
    glow: 'shadow-[0_0_0_2px_rgba(255,107,74,0.55)]',
    chip: '#FF6B4A',
  },
  {
    id: 1 as TileColor,
    name: 'Amber',
    fill: 'bg-accent-amber',
    glow: 'shadow-[0_0_0_2px_rgba(255,184,48,0.55)]',
    chip: '#FFB830',
  },
  {
    id: 2 as TileColor,
    name: 'Sky',
    fill: 'bg-accent-sky',
    glow: 'shadow-[0_0_0_2px_rgba(56,189,248,0.55)]',
    chip: '#38BDF8',
  },
] as const

const presets: PuzzlePreset[] = [
  {
    id: 'drift',
    name: 'Drift Signal',
    par: 9,
    board: [
      [0, 1, 2, 0, 1, null, null],
      [0, 2, 1, 2, 0, 1, null],
      [1, 0, 2, 1, 2, 0, 1],
      [null, 1, 0, 2, 1, 2, 0],
      [null, null, 1, 0, 2, 1, 2],
      [null, 2, 0, 1, 0, 2, 1],
    ],
  },
  {
    id: 'relay',
    name: 'Relay Cluster',
    par: 10,
    board: [
      [0, 2, 1, 1, 2, 0, null, null],
      [1, 0, 2, 0, 1, 2, 0, null],
      [2, 1, 0, 2, 0, 1, 2, 0],
      [0, 2, null, 1, 2, 0, 1, 2],
      [1, 0, 2, 0, 1, null, 0, 1],
      [null, 1, 0, 2, 0, 1, 2, 0],
    ],
  },
  {
    id: 'keystone',
    name: 'Keystone Frame',
    par: 11,
    board: [
      [0, 1, 2, 2, 1, 0, null],
      [1, null, 0, 1, 2, 1, 0],
      [2, 0, 1, null, 0, 2, 1],
      [1, 2, 0, 1, 2, 0, 2],
      [0, 1, null, 2, 1, null, 0],
      [null, 0, 2, 0, 2, 1, 2],
      [null, null, 1, 2, 0, 2, 1],
    ],
  },
]

const floatingPixels: FloatingPixel[] = [
  {
    id: 1,
    color: 'bg-accent-coral/60',
    size: 12,
    top: '10%',
    left: '12%',
    duration: '11s',
    delay: '0s',
  },
  {
    id: 2,
    color: 'bg-accent-amber/65',
    size: 10,
    top: '24%',
    left: '84%',
    duration: '14s',
    delay: '1.2s',
  },
  {
    id: 3,
    color: 'bg-accent-sky/60',
    size: 8,
    top: '72%',
    left: '8%',
    duration: '13s',
    delay: '0.8s',
  },
  {
    id: 4,
    color: 'bg-accent-coral/50',
    size: 14,
    top: '68%',
    left: '78%',
    duration: '15s',
    delay: '2.4s',
  },
  {
    id: 5,
    color: 'bg-accent-amber/50',
    size: 9,
    top: '42%',
    left: '6%',
    duration: '12s',
    delay: '1.6s',
  },
  {
    id: 6,
    color: 'bg-accent-sky/50',
    size: 11,
    top: '16%',
    left: '62%',
    duration: '16s',
    delay: '3.1s',
  },
]

const logoUrl = '/shared/web-logo.svg'
const authorName = 'KaiyoDang'
const authorUrl = 'https://www.facebook.com/kaiyo.dang'
const defaultPreset = presets[0]!

const activePresetId = ref(defaultPreset.id)
const board = ref<BoardCell[][]>([])
const region = ref<Set<string>>(new Set())
const moves = ref(0)
const elapsedSeconds = ref(0)
const isWon = ref(false)
const isStarted = ref(false)
const showHowToPlay = ref(false)
const completedPresets = useLocalStorage<Record<string, PersistedClearRecord>>(
  'switch-swatch-completed-presets',
  {},
)
const burstRegionKeys = ref<Set<string>>(new Set())

const selectedPreset = computed<PuzzlePreset>(
  () => presets.find((preset) => preset.id === activePresetId.value) ?? defaultPreset,
)

const { pause: pauseTimer, resume: resumeTimer } = useIntervalFn(
  () => {
    elapsedSeconds.value += 1
  },
  1000,
  { immediate: false },
)

const totalPlayableTiles = computed(() => countPlayableTiles(board.value))

const currentRegionColor = computed<TileColor | null>(() => {
  const start = getStartCoord(board.value)
  if (!start) return null
  return board.value[start.row]?.[start.col] ?? null
})

const selectedPresetCompletion = computed(
  () => completedPresets.value[selectedPreset.value.id] ?? null,
)

const progressPercent = computed(() => {
  if (totalPlayableTiles.value === 0) return 0
  return Math.round((region.value.size / totalPlayableTiles.value) * 100)
})

const timerLabel = computed(() => formatTime(elapsedSeconds.value))
const currentDateLabel = computed(() => {
  const now = new Date()
  const day = now.toLocaleString('en-US', { weekday: 'long' }).toUpperCase()
  const month = now.toLocaleString('en-US', { month: 'long' }).toUpperCase()
  const date = now.getDate()
  return `IT'S ${day}, ${month} ${date}!`
})

const messageTitle = computed(() => (isWon.value ? 'Nice Work!' : 'Signal Stable'))
const messageBody = computed(() =>
  isWon.value
    ? selectedPresetCompletion.value
      ? `Bạn đã clear màn này với thành tích tốt nhất ${selectedPresetCompletion.value.moves} lượt trong ${formatTime(selectedPresetCompletion.value.elapsedSeconds)}.`
      : `Bạn hoàn thành trong ${moves.value} lượt và ${timerLabel.value}. Hẹn gặp lại ngày mai!`
    : `Còn ${totalPlayableTiles.value - region.value.size} ô chưa nhập vùng điều khiển.`,
)

const boardGridStyle = computed(() => {
  const columnCount = board.value[0]?.length ?? 0
  return {
    gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
  }
})

watch(activePresetId, () => {
  resetGame()
})

function cloneBoard(source: BoardCell[][]): BoardCell[][] {
  return source.map((row) => [...row])
}

function coordKey(coord: Coord): string {
  return `${coord.row},${coord.col}`
}

function parseCoord(key: string): Coord {
  const [row = 0, col = 0] = key.split(',').map(Number)
  return { row, col }
}

function countPlayableTiles(grid: BoardCell[][]): number {
  return grid.reduce(
    (count, row) =>
      count + row.reduce<number>((rowCount, cell) => rowCount + (cell === null ? 0 : 1), 0),
    0,
  )
}

function getStartCoord(grid: BoardCell[][]): Coord | null {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < (grid[row]?.length ?? 0); col++) {
      if (grid[row]?.[col] !== null) {
        return { row, col }
      }
    }
  }
  return null
}

function getNeighbors(coord: Coord, grid: BoardCell[][]): Coord[] {
  const deltas = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ]

  return deltas
    .map(({ row, col }) => ({ row: coord.row + row, col: coord.col + col }))
    .filter(({ row, col }) => {
      const cell = grid[row]?.[col]
      return cell !== undefined && cell !== null
    })
}

function buildRegion(grid: BoardCell[][]): Set<string> {
  const start = getStartCoord(grid)
  if (!start) return new Set()

  const targetColor = grid[start.row]?.[start.col]
  if (targetColor === null || targetColor === undefined) return new Set()

  const queue: Coord[] = [start]
  const visited = new Set<string>([coordKey(start)])

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) continue

    for (const neighbor of getNeighbors(current, grid)) {
      const key = coordKey(neighbor)
      if (visited.has(key)) continue
      if (grid[neighbor.row]?.[neighbor.col] !== targetColor) continue

      visited.add(key)
      queue.push(neighbor)
    }
  }

  return visited
}

function applyColor(nextColor: TileColor) {
  if (isWon.value) return
  if (currentRegionColor.value === nextColor) return

  const nextBoard = cloneBoard(board.value)
  burstRegionKeys.value = new Set(region.value)

  for (const key of region.value) {
    const { row, col } = parseCoord(key)
    nextBoard[row]![col] = nextColor
  }

  board.value = nextBoard
  region.value = buildRegion(nextBoard)
  moves.value += 1

  if (!isStarted.value) {
    isStarted.value = true
    resumeTimer()
  }

  if (region.value.size === totalPlayableTiles.value) {
    isWon.value = true
    pauseTimer()
    markPresetCompleted()
  }

  window.setTimeout(() => {
    burstRegionKeys.value = new Set()
  }, 220)
}

function resetGame() {
  board.value = cloneBoard(selectedPreset.value.board)
  region.value = buildRegion(board.value)
  moves.value = 0
  elapsedSeconds.value = 0
  isWon.value = region.value.size === totalPlayableTiles.value
  isStarted.value = false
  burstRegionKeys.value = new Set()
  pauseTimer()
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function isRegionCell(row: number, col: number): boolean {
  return region.value.has(coordKey({ row, col }))
}

function getColorClass(cell: BoardCell): string {
  if (cell === null) return 'bg-transparent'
  return palette[cell].fill
}

function getTileClass(row: number, col: number, cell: BoardCell): string[] {
  if (cell === null) return ['pointer-events-none', 'opacity-0']

  const key = coordKey({ row, col })
  const isActive = isRegionCell(row, col)

  return [
    'tile-cell',
    getColorClass(cell),
    isActive ? 'tile-region' : 'tile-resting',
    burstRegionKeys.value.has(key) ? 'tile-burst' : '',
    isWon.value ? 'tile-won' : '',
  ]
}

function isPresetCompleted(presetId: string): boolean {
  return presetId in completedPresets.value
}

function markPresetCompleted() {
  const presetId = selectedPreset.value.id
  const currentRecord = completedPresets.value[presetId]
  const nextRecord: PersistedClearRecord = {
    moves: moves.value,
    elapsedSeconds: elapsedSeconds.value,
    completedAt: new Date().toISOString(),
  }

  if (
    currentRecord &&
    (currentRecord.moves < nextRecord.moves ||
      (currentRecord.moves === nextRecord.moves &&
        currentRecord.elapsedSeconds <= nextRecord.elapsedSeconds))
  ) {
    return
  }

  completedPresets.value = {
    ...completedPresets.value,
    [presetId]: nextRecord,
  }
}

function toggleHowToPlay() {
  showHowToPlay.value = !showHowToPlay.value
}

resetGame()
</script>

<template>
  <div class="min-h-screen overflow-hidden bg-bg-deep text-text-primary">
    <img
      :src="logoUrl"
      alt="J2TEAM logo"
      class="pointer-events-none absolute right-3 top-3 z-0 w-24 rotate-12 opacity-70 mix-blend-screen drop-shadow-[0_0_18px_rgba(255,107,74,0.18)] sm:right-5 sm:top-4 sm:w-32 md:w-40"
      style="filter: brightness(0) invert(1)"
    />

    <!-- Floating pixel decorations -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        v-for="pixel in floatingPixels"
        :key="pixel.id"
        class="float-pixel absolute"
        :class="pixel.color"
        :style="{
          width: `${pixel.size}px`,
          height: `${pixel.size}px`,
          top: pixel.top,
          left: pixel.left,
          '--float-duration': pixel.duration,
          animationDelay: pixel.delay,
        }"
      />
    </div>

    <div class="relative mx-auto flex min-h-screen max-w-6xl flex-col px-3 py-3 sm:px-5 sm:py-4">
      <!-- ═══════════════════════════════════════════════
           HEADER — pill logo + decorative bar + date pill
      ═══════════════════════════════════════════════ -->
      <header class="animate-fade-up flex items-center gap-2.5">
        <!-- LEFT: Home + logo -->
        <div class="flex shrink-0 items-center gap-2">
          <RouterLink
            to="/"
            class="inline-flex items-center gap-1.5 border border-border-default bg-bg-surface px-2.5 py-1.5 text-[11px] text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          >
            <Icon icon="lucide:arrow-left" class="size-3.5" />
            Về trang chủ
          </RouterLink>
          <div
            class="border-2 border-bg-deep bg-accent-coral px-3 py-1.5 font-display text-xs font-bold tracking-[0.18em] text-white shadow-[3px_3px_0_rgba(15,25,35,0.35)] sm:text-sm"
          >
            SWITCH SWATCH
          </div>
        </div>

        <!-- CENTER: Decorative bar -->
        <div class="h-2.5 flex-1 border border-border-default bg-bg-surface" />

        <!-- RIGHT: Date pill -->
        <div
          class="hidden shrink-0 border-2 border-border-default bg-bg-elevated px-3 py-1.5 font-display text-[10px] font-bold tracking-[0.14em] text-text-primary shadow-[2px_2px_0_rgba(15,25,35,0.25)] md:block"
        >
          {{ currentDateLabel }}
        </div>
      </header>

      <!-- ═══════════════════════════════════════════════
           MAIN: 2-column desktop, single-column mobile
      ═══════════════════════════════════════════════ -->
      <main class="mt-3 grid flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_248px] lg:items-start">
        <!-- ─── LEFT: GAME CONTAINER ─── -->
        <section class="animate-fade-up animate-delay-2 flex flex-col gap-3">
          <!-- Outer card -->
          <div
            class="border border-border-default bg-bg-surface p-3 shadow-[0_6px_0_rgba(15,25,35,0.24)] sm:p-4"
          >
            <!-- Inner light game panel -->
            <div class="border-[3px] border-bg-deep bg-[#f0ede6] p-3 sm:p-4">
              <!-- Title row -->
              <div class="mb-3 flex items-center justify-between gap-3">
                <h1 class="font-display text-base font-bold text-bg-deep sm:text-lg">
                  Switch Swatch
                  <span class="ml-1 font-display text-xs font-semibold text-[#59687c] sm:text-sm">
                    #{{
                      selectedPreset.id === 'drift'
                        ? '401'
                        : selectedPreset.id === 'relay'
                          ? '402'
                          : '403'
                    }}
                  </span>
                </h1>
                <button
                  type="button"
                  class="border-2 border-bg-deep bg-bg-deep px-2.5 py-1 font-display text-[10px] font-bold tracking-[0.16em] text-text-primary transition hover:bg-bg-elevated"
                  @click="toggleHowToPlay"
                >
                  HOW TO PLAY?
                </button>
              </div>

              <!-- How to play tooltip -->
              <div
                v-if="showHowToPlay"
                class="mb-3 border-2 border-bg-deep bg-white p-2.5 text-xs leading-5 text-[#334155] sm:text-sm sm:leading-6"
              >
                <p class="font-display text-xs font-bold tracking-widest text-bg-deep">
                  HOW TO PLAY
                </p>
                <p class="mt-1.5 leading-6">
                  Chọn màu bên dưới để đổi toàn bộ vùng hiện tại (góc trên trái). Vùng sẽ lan sang
                  các ô kề cùng màu. Mục tiêu: chiếm toàn bộ bảng trong ít lượt nhất!
                </p>
              </div>

              <!-- Board wrapper — relative for hand icon -->
              <div class="relative mx-auto w-full max-w-[320px] sm:max-w-[368px]">
                <!-- Pixel board with thick outline -->
                <div
                  class="board-frame border-[4px] border-[#2b3a4a] bg-[#e8e4da] p-1.5 shadow-[5px_5px_0_rgba(15,25,35,0.18)] sm:p-2"
                >
                  <div class="grid gap-[1px]" :style="boardGridStyle">
                    <template v-for="(row, rowIndex) in board" :key="`row-${rowIndex}`">
                      <div
                        v-for="(cell, colIndex) in row"
                        :key="`${rowIndex}-${colIndex}`"
                        class="aspect-square"
                        :class="getTileClass(rowIndex, colIndex, cell)"
                      />
                    </template>
                  </div>
                </div>

                <!-- Hand cursor icon — pixel art hand -->
                <img
                  src="/switch-swatch/hand.png"
                  alt="cursor"
                  class="pointer-events-none absolute -left-3 -top-4 z-10 w-8 select-none drop-shadow-[2px_2px_0_rgba(15,25,35,0.4)] sm:w-9"
                  :class="isWon ? 'hand-celebrate' : 'hand-float'"
                />
              </div>

              <!-- Color buttons row -->
              <div
                class="mt-4 flex items-end justify-center gap-4 border-t-2 border-[#c8c0b0] pt-4"
              >
                <div
                  v-for="color in palette"
                  :key="color.id"
                  class="flex flex-col items-center gap-2"
                >
                  <button
                    type="button"
                    class="color-btn border-[3px] border-bg-deep transition-all duration-150"
                    :class="
                      currentRegionColor === color.id
                        ? 'cursor-not-allowed opacity-40 shadow-none'
                        : 'cursor-pointer shadow-[4px_4px_0_rgba(15,25,35,0.25)] hover:scale-105 hover:shadow-[6px_6px_0_rgba(15,25,35,0.28)] active:scale-95 active:shadow-[2px_2px_0_rgba(15,25,35,0.2)]'
                    "
                    :style="{ backgroundColor: color.chip }"
                    :disabled="currentRegionColor === color.id || isWon"
                    @click="applyColor(color.id)"
                  >
                    <span class="sr-only">{{ color.name }}</span>
                  </button>
                  <span
                    class="font-display text-[9px] font-bold tracking-[0.18em] text-[#59687c] sm:text-[10px]"
                    :class="currentRegionColor === color.id ? 'opacity-40' : ''"
                    >{{ color.name.toUpperCase() }}</span
                  >
                </div>
              </div>

              <!-- Bottom meta row -->
              <div class="mt-3 flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <span class="font-display text-[11px] font-bold tracking-[0.18em] text-bg-deep">
                    {{ moves.toString().padStart(2, '0') }} MOVES
                  </span>
                  <span class="text-[#8895a7]">/</span>
                  <span class="text-[11px] text-[#59687c]">
                    PAR <span class="font-semibold text-bg-deep">{{ selectedPreset.par }}</span>
                  </span>
                </div>
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 border border-bg-deep bg-white px-2.5 py-1.5 font-display text-[11px] font-semibold text-bg-deep transition hover:-translate-y-0.5 hover:bg-bg-elevated hover:text-text-primary"
                  @click="resetGame"
                >
                  <Icon icon="lucide:rotate-ccw" class="size-3.5" />
                  RESET
                </button>
              </div>
            </div>
          </div>

          <!-- ─── MOBILE STATS (hidden on desktop) ─── -->
          <div class="grid grid-cols-2 gap-2.5 lg:hidden">
            <div
              class="border border-border-default bg-bg-surface p-3 shadow-[0_4px_0_rgba(15,25,35,0.2)]"
            >
              <div class="flex items-center gap-3">
                <span
                  class="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-bg-deep bg-accent-sky/20"
                >
                  <Icon icon="lucide:clock" class="size-4 text-text-primary" />
                </span>
                <div>
                  <p class="font-display text-[10px] tracking-[0.2em] text-text-dim">TIMER</p>
                  <p class="mt-0.5 font-display text-lg font-semibold text-text-primary">
                    {{ timerLabel }}
                  </p>
                </div>
              </div>
            </div>
            <div
              class="border border-border-default bg-bg-surface p-3 shadow-[0_4px_0_rgba(15,25,35,0.2)]"
            >
              <div class="flex items-center gap-3">
                <span
                  class="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-bg-deep bg-accent-amber/20"
                >
                  <Icon icon="lucide:move" class="size-4 text-text-primary" />
                </span>
                <div>
                  <p class="font-display text-[10px] tracking-[0.2em] text-text-dim">MOVES</p>
                  <p class="mt-0.5 font-display text-lg font-semibold text-text-primary">
                    {{ moves.toString().padStart(2, '0') }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            class="border border-border-default bg-bg-surface p-3 shadow-[0_4px_0_rgba(15,25,35,0.2)] lg:hidden"
          >
            <h2
              class="flex items-center gap-2 font-display text-sm font-semibold text-text-primary"
            >
              <span class="text-[10px] tracking-widest text-accent-amber">//</span>
              Chọn màn
            </h2>
            <div class="mt-3 grid gap-2">
              <button
                v-for="preset in presets"
                :key="`mobile-${preset.id}`"
                type="button"
                class="border p-2 text-left transition"
                :class="
                  activePresetId === preset.id
                    ? 'border-accent-coral bg-bg-elevated'
                    : 'border-border-default bg-bg-deep hover:-translate-y-0.5 hover:border-accent-coral hover:bg-bg-elevated'
                "
                @click="activePresetId = preset.id"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="font-display text-sm font-semibold text-text-primary">
                      {{ preset.name }}
                    </span>
                    <span
                      v-if="isPresetCompleted(preset.id)"
                      class="inline-flex items-center gap-1 border border-accent-amber/40 bg-accent-amber/10 px-1.5 py-0.5 font-display text-[9px] tracking-[0.14em] text-accent-amber"
                    >
                      <Icon icon="lucide:badge-check" class="size-3" />
                      CLEARED
                    </span>
                  </div>
                  <span class="font-display text-[10px] tracking-[0.18em] text-text-dim">
                    PAR {{ preset.par }}
                  </span>
                </div>
                <p class="mt-1 text-xs text-text-secondary">
                  {{ countPlayableTiles(preset.board) }}
                  ô hoạt động
                </p>
                <p v-if="completedPresets[preset.id]" class="mt-1 text-[11px] text-accent-amber/80">
                  Best: {{ completedPresets[preset.id]?.moves }} lượt /
                  {{ formatTime(completedPresets[preset.id]?.elapsedSeconds ?? 0) }}
                </p>
              </button>
            </div>
          </div>
        </section>

        <!-- ─── RIGHT: SIDEBAR (desktop only) ─── -->
        <aside class="animate-fade-up animate-delay-3 hidden flex-col gap-2.5 lg:flex">
          <!-- STATUS box -->
          <div
            class="border border-border-default bg-bg-surface p-3.5 shadow-[0_5px_0_rgba(15,25,35,0.2)]"
          >
            <p class="font-display text-[11px] tracking-[0.22em] text-accent-coral">STATUS //</p>
            <div class="mt-3 grid grid-cols-2 gap-2">
              <div class="border border-border-default bg-bg-deep p-2.5">
                <div class="flex items-center gap-2">
                  <span
                    class="flex h-8 w-8 shrink-0 items-center justify-center border border-border-default bg-accent-sky/15"
                  >
                    <Icon icon="lucide:clock" class="size-4 text-text-primary" />
                  </span>
                  <div>
                    <p class="font-display text-[10px] tracking-[0.18em] text-text-dim">TIMER</p>
                    <p class="mt-0.5 font-display text-lg font-semibold text-text-primary">
                      {{ timerLabel }}
                    </p>
                  </div>
                </div>
              </div>
              <div class="border border-border-default bg-bg-deep p-2.5">
                <div class="flex items-center gap-2">
                  <span
                    class="flex h-8 w-8 shrink-0 items-center justify-center border border-border-default bg-accent-amber/15"
                  >
                    <Icon icon="lucide:move" class="size-4 text-text-primary" />
                  </span>
                  <div>
                    <p class="font-display text-[10px] tracking-[0.18em] text-text-dim">MOVES</p>
                    <p class="mt-0.5 font-display text-lg font-semibold text-text-primary">
                      {{ moves.toString().padStart(2, '0') }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              class="mt-3 border-2 p-3 transition-all duration-300"
              :class="
                isWon
                  ? 'status-win border-accent-amber bg-accent-amber/10'
                  : 'border-bg-deep bg-bg-elevated/40'
              "
            >
              <p class="font-display text-[11px] tracking-[0.22em] text-text-dim">MESSAGE //</p>
              <p class="mt-2 font-display text-base font-semibold text-text-primary">
                {{ messageTitle }}
              </p>
              <p class="mt-2 text-sm leading-5 text-text-secondary">{{ messageBody }}</p>
            </div>

            <div class="mt-3 border border-border-default bg-bg-deep p-2.5">
              <div
                class="flex items-center justify-between font-display text-[10px] tracking-[0.2em] text-text-dim"
              >
                <span>PROGRESS</span>
                <span>{{ progressPercent }}%</span>
              </div>
              <div class="mt-2 h-2 border border-border-default bg-bg-surface">
                <div
                  class="h-full bg-accent-coral transition-all duration-300"
                  :style="{ width: `${progressPercent}%` }"
                />
              </div>
              <p class="mt-2 text-xs leading-5 text-text-secondary">
                {{ region.size }} / {{ totalPlayableTiles }} ô đã nằm trong vùng điều khiển.
              </p>
            </div>
          </div>

          <!-- MAP SELECT box -->
          <div
            class="border border-border-default bg-bg-surface p-3.5 shadow-[0_5px_0_rgba(15,25,35,0.2)]"
          >
            <h2
              class="flex items-center gap-2 font-display text-base font-semibold text-text-primary"
            >
              <span class="text-xs tracking-widest text-accent-amber">//</span>
              Map Select
            </h2>
            <div class="mt-3 grid gap-2">
              <button
                v-for="preset in presets"
                :key="preset.id"
                type="button"
                class="border p-2 text-left transition"
                :class="
                  activePresetId === preset.id
                    ? 'border-accent-coral bg-bg-elevated'
                    : 'border-border-default bg-bg-deep hover:-translate-y-0.5 hover:border-accent-coral hover:bg-bg-elevated'
                "
                @click="activePresetId = preset.id"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="font-display text-sm font-semibold text-text-primary">
                      {{ preset.name }}
                    </span>
                    <span
                      v-if="isPresetCompleted(preset.id)"
                      class="inline-flex items-center gap-1 border border-accent-amber/40 bg-accent-amber/10 px-1.5 py-0.5 font-display text-[9px] tracking-[0.14em] text-accent-amber"
                    >
                      <Icon icon="lucide:badge-check" class="size-3" />
                      CLEARED
                    </span>
                  </div>
                  <span class="font-display text-[10px] tracking-[0.18em] text-text-dim">
                    PAR {{ preset.par }}
                  </span>
                </div>
                <p class="mt-1 text-xs text-text-secondary">
                  {{ countPlayableTiles(preset.board) }}
                  ô hoạt động
                </p>
                <p v-if="completedPresets[preset.id]" class="mt-1 text-[11px] text-accent-amber/80">
                  Best: {{ completedPresets[preset.id]?.moves }} lượt /
                  {{ formatTime(completedPresets[preset.id]?.elapsedSeconds ?? 0) }}
                </p>
              </button>
            </div>
          </div>
        </aside>
      </main>

      <div
        class="mx-auto mt-3 flex flex-wrap items-center justify-center gap-2 text-center text-[11px] font-display tracking-wide text-text-dim sm:mt-4"
      >
        <span>Made by</span>
        <a
          :href="authorUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-block text-accent-coral transition hover:-translate-y-0.5 hover:text-text-primary"
        >
          {{ authorName }}
        </a>
        <span>· J2TEAM Community with love</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Floating pixel animation ── */
@keyframes float-pixel {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(0, -14px, 0);
  }
}

.float-pixel {
  animation-name: float-pixel;
  animation-duration: var(--float-duration);
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}

/* ── Hand cursor animations ── */
@keyframes hand-float {
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(-8deg);
  }
  50% {
    transform: translate3d(2px, -6px, 0) rotate(-4deg);
  }
}

@keyframes hand-celebrate {
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(-8deg) scale(1);
  }
  25% {
    transform: translate3d(4px, -10px, 0) rotate(4deg) scale(1.15);
  }
  75% {
    transform: translate3d(-4px, -8px, 0) rotate(-12deg) scale(1.1);
  }
}

.hand-float {
  animation: hand-float 3s ease-in-out infinite;
}

.hand-celebrate {
  animation: hand-celebrate 1.2s ease-in-out infinite;
}

@keyframes tile-burst {
  0% {
    transform: translate3d(0, 1px, 0) scale(0.95);
  }
  60% {
    transform: translate3d(0, -2px, 0) scale(1.04);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes status-win {
  0%,
  100% {
    box-shadow: inset 0 0 0 1px rgba(255, 184, 48, 0.18);
  }
  50% {
    box-shadow:
      inset 0 0 0 1px rgba(255, 184, 48, 0.48),
      0 0 18px rgba(255, 184, 48, 0.12);
  }
}

/* ── Color button size ── */
.color-btn {
  width: 40px;
  height: 40px;
}

/* ── Board pixel-art feel ── */
.board-frame {
  image-rendering: pixelated;
}

.tile-cell {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(15, 25, 35, 0.15);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.26),
    inset 1px 0 0 rgba(255, 255, 255, 0.12),
    inset 0 -2px 0 rgba(15, 25, 35, 0.16),
    0 1px 0 rgba(15, 25, 35, 0.08);
  transition:
    transform 180ms ease,
    box-shadow 220ms ease,
    filter 220ms ease,
    opacity 180ms ease;
  will-change: transform, box-shadow, filter;
}

.tile-cell::before,
.tile-cell::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.tile-cell::before {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.2), transparent 48%);
}

.tile-cell::after {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.16),
    transparent 40%,
    rgba(15, 25, 35, 0.14)
  );
  mix-blend-mode: soft-light;
}

.tile-resting {
  opacity: 0.94;
  filter: saturate(0.95) brightness(0.98);
}

.tile-region {
  z-index: 1;
  transform: translate3d(0, -1px, 0) scale(1.04);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.34),
    inset 0 -2px 0 rgba(15, 25, 35, 0.18),
    0 0 0 1px rgba(240, 237, 230, 0.55),
    0 4px 8px rgba(15, 25, 35, 0.12);
  filter: saturate(1.08) brightness(1.03);
}

.tile-burst {
  animation: tile-burst 240ms ease-out;
}

.tile-won {
  filter: saturate(1.08) brightness(1.05);
}

.status-win {
  animation: status-win 1.8s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .float-pixel,
  .hand-float,
  .hand-celebrate,
  .tile-burst,
  .status-win {
    animation: none;
  }

  .tile-cell {
    transition: none;
  }
}
</style>
