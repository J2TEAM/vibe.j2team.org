<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import pageMeta from './meta'
import bgmTrack from './res/BGM/BGM.mp3'

type GameMode = 'classic' | 'timed' | 'story'
type Direction = 0 | 1 | 2 | 3
type GridSize = '10x10' | '20x20' | '30x30' | '10x20' | '10x30' | '20x30'

type LeaderboardStep = 'pick' | 'view'
type MainMode = 'story' | 'custom'
type LeaderboardCategory = 'story' | 'custom' | 'easter'

interface Tile {
  id: number
  kind: 'icon' | 'wall'
  type: number
  icon: string
  x: number
  y: number
  isVisible: boolean
}

interface SearchNode {
  x: number
  y: number
  dir: Direction | -1
  turns: number
  parent: number
}

interface Point {
  x: number
  y: number
}

interface DisplayCell {
  key: string
  x: number
  y: number
  tile: Tile | null
  isOuter: boolean
}

interface RecordItem {
  name: string
  score: number
  difficulty: number
  mode: GameMode
  timeSpent: number
  createdAt: string
}

interface EasterEggFinder {
  name: string
  createdAt: string
}

interface GridPreset {
  key: GridSize
  rows: number
  cols: number
}

const STORAGE_KEY = 'pikachu-records-v2'
const EASTER_EGG_STORAGE_KEY = 'pikachu-easter-egg-finders-v1'
const DEFAULT_RECORDS: ReadonlyArray<RecordItem> = [
  { name: 'Starter A', score: 40, difficulty: 0, mode: 'classic', timeSpent: 0, createdAt: '2026-01-01T00:00:00.000Z' },
  { name: 'Starter B', score: 55, difficulty: 1, mode: 'classic', timeSpent: 0, createdAt: '2026-01-02T00:00:00.000Z' },
  { name: 'Starter C', score: 65, difficulty: 1, mode: 'timed', timeSpent: 120, createdAt: '2026-01-03T00:00:00.000Z' },
  { name: 'Starter D', score: 80, difficulty: 2, mode: 'timed', timeSpent: 140, createdAt: '2026-01-04T00:00:00.000Z' },
  { name: 'Story Runner', score: 0, difficulty: 8, mode: 'story', timeSpent: 3300, createdAt: '2026-01-05T00:00:00.000Z' },
  { name: 'Story Explorer', score: 0, difficulty: 8, mode: 'story', timeSpent: 2700, createdAt: '2026-01-06T00:00:00.000Z' },
  { name: 'Story Sprinter', score: 0, difficulty: 8, mode: 'story', timeSpent: 2280, createdAt: '2026-01-07T00:00:00.000Z' },
]
const DEFAULT_EASTER_EGG_FINDERS: ReadonlyArray<EasterEggFinder> = [
  { name: 'Easter Egg Man', createdAt: '2026-01-01T00:00:00.000Z' },
]
const STORY_TOTAL_LEVELS = 10
const STORY_GRID_SIZE: GridSize = '10x20'
const iconSet = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵'] as const
const directions: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
] as const

const gridPresets: ReadonlyArray<GridPreset> = [
  { key: '10x10', rows: 10, cols: 10 },
  { key: '20x20', rows: 20, cols: 20 },
  { key: '30x30', rows: 30, cols: 30 },
  { key: '10x20', rows: 10, cols: 20 },
  { key: '10x30', rows: 10, cols: 30 },
  { key: '20x30', rows: 20, cols: 30 },
] as const
const gridPresetMap: Readonly<Record<GridSize, GridPreset>> = {
  '10x10': gridPresets[0] as GridPreset,
  '20x20': gridPresets[1] as GridPreset,
  '30x30': gridPresets[2] as GridPreset,
  '10x20': gridPresets[3] as GridPreset,
  '10x30': gridPresets[4] as GridPreset,
  '20x30': gridPresets[5] as GridPreset,
}
const sizeOptions: ReadonlyArray<GridSize> = gridPresets.map((preset) => preset.key)
const difficultyOptions = Array.from({ length: 9 }, (_, i) => i)

const appliedSize = ref<GridSize>(STORY_GRID_SIZE)
const appliedDifficulty = ref(0)
const appliedMode = ref<GameMode>('story')

const pendingSize = ref<GridSize>('10x10')
const pendingDifficulty = ref(0)
const pendingMainMode = ref<MainMode>('story')
const pendingCustomMode = ref<Exclude<GameMode, 'story'>>('classic')

const grid = ref<Tile[][]>([])
const firstSelected = ref<Tile | null>(null)
const secondSelected = ref<Tile | null>(null)
const failedPairIds = ref<number[]>([])
const flashPath = ref<Point[]>([])
const isHintVisible = ref(false)
const score = ref(0)
const assistsLeft = ref(0)
const timeLeft = ref(180)
const storyElapsedSeconds = ref(0)
const storyLevel = ref(1)
const message = ref('Sẵn sàng bắt đầu ván mới.')

const isPaused = ref(false)
const isResolvingPair = ref(false)
const isLightMode = ref(false)
const isMobilePortrait = ref(false)
const isSoundOn = ref(true)
const isBgmOn = ref(true)
const sfxVolume = ref(50)
const bgmVolume = ref(50)

const showNewGameModal = ref(false)
const showSettingsModal = ref(false)
const showRecordPrompt = ref(false)
const showLeaderboardModal = ref(false)
const showCreditsModal = ref(false)
const leaderboardStep = ref<LeaderboardStep>('pick')
const leaderboardCategory = ref<LeaderboardCategory>('story')
const leaderboardDifficulty = ref(0)
const playerName = ref('')
const easterName = ref('')
const easterMessage = ref('')
const easterUnlocked = ref(false)
const isCreditsBoosted = ref(false)
const creditsContainerRef = ref<HTMLElement | null>(null)
const creditsContentRef = ref<HTMLElement | null>(null)
const creditsEasterButtonRef = ref<HTMLElement | null>(null)
const creditsOffsetY = ref(0)
const isCreditsAutoStopped = ref(false)

const records = ref<RecordItem[]>([])
const easterEggFinders = ref<EasterEggFinder[]>([])
let timerId: ReturnType<typeof setInterval> | null = null
let audioContext: AudioContext | null = null
let bgmAudio: HTMLAudioElement | null = null
let creditsRafId: number | null = null
let creditsLastFrame = 0

const activeGridPreset = computed(() => gridPresetMap[appliedSize.value])
const boardRows = computed(() => activeGridPreset.value.rows)
const boardCols = computed(() => activeGridPreset.value.cols)
const extRows = computed(() => boardRows.value + 2)
const extCols = computed(() => boardCols.value + 2)
const largestBoardEdge = computed(() => Math.max(boardRows.value, boardCols.value))
const totalBoardCells = computed(() => boardRows.value * boardCols.value)

const visibleIconsLeft = computed(() => {
  return grid.value.reduce((acc, row) => {
    return acc + row.filter((tile) => tile.kind === 'icon' && tile.isVisible).length
  }, 0)
})

const isCleared = computed(() => visibleIconsLeft.value === 0 && grid.value.length > 0)
const isStoryMode = computed(() => appliedMode.value === 'story')
const isTimeUp = computed(() => appliedMode.value === 'timed' && timeLeft.value <= 0)
const isGameOver = computed(() => isCleared.value || isTimeUp.value)

const startTimeBySetup = computed(() => {
  const base = Math.floor(totalBoardCells.value / 2.2)
  if (appliedMode.value === 'timed') {
    return Math.max(75, base) * 3
  }
  return Math.max(75, base)
})

const totalAssists = computed(() => {
  const divider = Math.max(1, appliedDifficulty.value)
  return Math.max(1, Math.floor(largestBoardEdge.value / divider))
})

const timeLabel = computed(() => {
  const total = appliedMode.value === 'story' ? Math.max(storyElapsedSeconds.value, 0) : Math.max(timeLeft.value, 0)
  const minute = Math.floor(total / 60)
  const second = total % 60
  return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
})

const playedSeconds = computed(() => {
  if (appliedMode.value === 'timed') {
    return Math.max(0, startTimeBySetup.value - timeLeft.value)
  }
  if (appliedMode.value === 'classic') {
    return 0
  }
  return storyElapsedSeconds.value
})

const timeProgress = computed(() => {
  if (appliedMode.value !== 'timed') {
    return 100
  }
  return Math.max(0, Math.min(100, Math.round((timeLeft.value / startTimeBySetup.value) * 100)))
})

const cellSizeClass = computed(() => {
  if (largestBoardEdge.value <= 10) {
    return 'h-12 w-12 text-[28px] sm:h-[53px] sm:w-[53px] sm:text-[31px]'
  }
  if (largestBoardEdge.value <= 20) {
    return 'h-[26px] w-[26px] text-[17px] sm:h-[31px] sm:w-[31px] sm:text-[20px]'
  }
  return 'h-5 w-5 text-[13px] sm:h-[22px] sm:w-[22px] sm:text-[15px]'
})

const portraitCellSizeClass = computed(() => {
  if (!isMobilePortrait.value) {
    return cellSizeClass.value
  }

  if (largestBoardEdge.value <= 10) {
    return 'h-9 w-9 text-xl'
  }
  if (largestBoardEdge.value <= 20) {
    return 'h-5 w-5 text-sm'
  }
  return 'h-4 w-4 text-xs'
})

const pathPolylinePoints = computed(() => {
  return flashPath.value.map((point) => `${point.x + 0.5},${point.y + 0.5}`).join(' ')
})

const wrapperClass = computed(() => {
  return isLightMode.value ? 'bg-text-primary text-bg-deep' : 'bg-bg-deep text-text-primary'
})

const surfaceClass = computed(() => {
  return isLightMode.value ? 'bg-text-primary border-border-default' : 'bg-bg-surface border-border-default'
})

const panelInnerClass = computed(() => {
  return isLightMode.value ? 'bg-text-primary border-border-default' : 'bg-bg-deep border-border-default'
})

const textMutedClass = computed(() => {
  return isLightMode.value ? 'text-bg-elevated' : 'text-text-secondary'
})

const classicBoard = computed(() => leaderboardBy(leaderboardDifficulty.value, 'classic'))
const timedBoard = computed(() => leaderboardBy(leaderboardDifficulty.value, 'timed'))
const storyBoard = computed(() => {
  return records.value
    .filter((item) => item.mode === 'story')
    .sort((a, b) => a.timeSpent - b.timeSpent || b.score - a.score)
    .slice(0, 10)
})
const easterEggBoard = computed(() => {
  return [...easterEggFinders.value].slice(0, 30)
})
const creditsTransformStyle = computed(() => {
  return { transform: `translateY(${creditsOffsetY.value}px)` }
})

function storyDifficultyByLevel(level: number): number {
  const ratio = (level - 1) / Math.max(1, STORY_TOTAL_LEVELS - 1)
  return Math.max(0, Math.min(8, Math.round(ratio * 8)))
}

const displayCells = computed<DisplayCell[]>(() => {
  const cells: DisplayCell[] = []
  for (let y = 0; y < extRows.value; y++) {
    for (let x = 0; x < extCols.value; x++) {
      const isOuter = y === 0 || y === extRows.value - 1 || x === 0 || x === extCols.value - 1
      cells.push({
        key: `${x}-${y}`,
        x,
        y,
        tile: isOuter ? null : getTile(y - 1, x - 1),
        isOuter,
      })
    }
  }
  return cells
})

function loadRecords(): void {
  let cachedRecords: RecordItem[] = []
  try {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached) {
      cachedRecords = sanitizeRecordList(JSON.parse(cached))
    }
  } catch {
    // fallback
  }
  records.value = mergeRecordSeeds(cachedRecords)
  persistRecords()
}

function persistRecords(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value))
}

function loadEasterEggFinders(): void {
  let cachedFinders: EasterEggFinder[] = []
  try {
    const cached = localStorage.getItem(EASTER_EGG_STORAGE_KEY)
    if (cached) {
      cachedFinders = sanitizeEasterEggFinderList(JSON.parse(cached))
    }
  } catch {
    // fallback
  }
  easterEggFinders.value = mergeEasterEggFinderSeeds(cachedFinders)
  persistEasterEggFinders()
}

function persistEasterEggFinders(): void {
  localStorage.setItem(EASTER_EGG_STORAGE_KEY, JSON.stringify(easterEggFinders.value))
}

function leaderboardBy(difficulty: number, mode: GameMode): RecordItem[] {
  return records.value
    .filter((item) => item.difficulty === difficulty && item.mode === mode)
    .sort((a, b) => b.score - a.score || a.timeSpent - b.timeSpent)
    .slice(0, 10)
}

function isGameMode(value: unknown): value is GameMode {
  return value === 'classic' || value === 'timed' || value === 'story'
}

function sanitizeRecordList(raw: unknown): RecordItem[] {
  if (!Array.isArray(raw)) {
    return []
  }

  const next: RecordItem[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue
    }
    const candidate = item as Partial<RecordItem>
    if (
      typeof candidate.name !== 'string' ||
      typeof candidate.score !== 'number' ||
      typeof candidate.difficulty !== 'number' ||
      !isGameMode(candidate.mode) ||
      typeof candidate.timeSpent !== 'number' ||
      typeof candidate.createdAt !== 'string'
    ) {
      continue
    }
    next.push({
      name: candidate.name.trim().slice(0, 24) || 'Anonymous',
      score: Math.max(0, Math.floor(candidate.score)),
      difficulty: Math.max(0, Math.floor(candidate.difficulty)),
      mode: candidate.mode,
      timeSpent: Math.max(0, Math.floor(candidate.timeSpent)),
      createdAt: candidate.createdAt,
    })
  }
  return next
}

function mergeRecordSeeds(existing: RecordItem[]): RecordItem[] {
  const merged = [...existing]
  const existingKeys = new Set(
    existing.map(
      (item) => `${item.name}|${item.mode}|${item.difficulty}|${item.score}|${item.timeSpent}|${item.createdAt}`,
    ),
  )

  for (const seed of DEFAULT_RECORDS) {
    const key = `${seed.name}|${seed.mode}|${seed.difficulty}|${seed.score}|${seed.timeSpent}|${seed.createdAt}`
    if (!existingKeys.has(key)) {
      merged.push({ ...seed })
    }
  }

  return merged
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-400)
}

function sanitizeEasterEggFinderList(raw: unknown): EasterEggFinder[] {
  if (!Array.isArray(raw)) {
    return []
  }

  const next: EasterEggFinder[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue
    }
    const candidate = item as Partial<EasterEggFinder>
    if (typeof candidate.name !== 'string' || typeof candidate.createdAt !== 'string') {
      continue
    }
    const name = candidate.name.trim().slice(0, 24)
    if (!name) {
      continue
    }
    next.push({ name, createdAt: candidate.createdAt })
  }
  return next
}

function mergeEasterEggFinderSeeds(existing: EasterEggFinder[]): EasterEggFinder[] {
  const merged = [...existing]
  const existingKeys = new Set(existing.map((item) => `${item.name}|${item.createdAt}`))

  for (const seed of DEFAULT_EASTER_EGG_FINDERS) {
    const key = `${seed.name}|${seed.createdAt}`
    if (!existingKeys.has(key)) {
      merged.push({ ...seed })
    }
  }

  return merged
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-100)
}

function initBgm(): void {
  if (bgmAudio || typeof Audio === 'undefined') {
    return
  }

  bgmAudio = new Audio(bgmTrack)
  bgmAudio.loop = true
  bgmAudio.preload = 'auto'
}

function syncBgmVolume(): void {
  if (!bgmAudio) {
    return
  }

  const volume = Math.max(0, Math.min(1, (bgmVolume.value / 100) * 0.55))
  bgmAudio.volume = isBgmOn.value ? volume : 0
}

async function ensureBgmPlayback(): Promise<void> {
  initBgm()
  syncBgmVolume()
  if (!bgmAudio || !isBgmOn.value) {
    return
  }

  try {
    await bgmAudio.play()
  } catch {
    // Autoplay can be blocked until user interacts with the page.
  }
}

function getAudioContext(): AudioContext | null {
  if (!isSoundOn.value || typeof AudioContext === 'undefined') {
    return null
  }

  if (!audioContext) {
    audioContext = new AudioContext()
  }

  if (audioContext.state === 'suspended') {
    void audioContext.resume()
  }

  return audioContext
}

function playTone(frequency: number, durationMs: number, volume: number, type: OscillatorType = 'sine', delaySeconds = 0): void {
  const ctx = getAudioContext()
  if (!ctx) {
    return
  }

  const start = ctx.currentTime + delaySeconds
  const end = start + durationMs / 1000
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(frequency, start)
  gain.gain.setValueAtTime(0.0001, start)
  const adjustedVolume = Math.max(0, Math.min(1, volume * (sfxVolume.value / 100) * 8.0))
  gain.gain.linearRampToValueAtTime(adjustedVolume, start + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, end)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(start)
  osc.stop(end + 0.01)
}

function playSelectSound(): void {
  playTone(760, 70, 0.035, 'triangle')
}

function playMatchSound(): void {
  playTone(880, 90, 0.05, 'triangle')
  playTone(1175, 110, 0.04, 'triangle', 0.08)
}

function playFailSound(): void {
  playTone(260, 80, 0.05, 'sawtooth')
  playTone(220, 110, 0.045, 'sawtooth', 0.06)
}

function playHintSound(): void {
  playTone(680, 90, 0.04, 'sine')
  playTone(980, 90, 0.035, 'sine', 0.08)
}

function playPauseSound(paused: boolean): void {
  if (paused) {
    playTone(420, 90, 0.03, 'square')
    playTone(320, 120, 0.03, 'square', 0.08)
    return
  }
  playTone(320, 90, 0.03, 'square')
  playTone(420, 120, 0.03, 'square', 0.08)
}

function playWinSound(): void {
  playTone(660, 120, 0.045, 'triangle')
  playTone(880, 120, 0.045, 'triangle', 0.1)
  playTone(1320, 180, 0.045, 'triangle', 0.2)
}

function stopTimer(): void {
  if (timerId !== null) {
    clearInterval(timerId)
    timerId = null
  }
}

function startTimerIfNeeded(): void {
  stopTimer()
  if (isPaused.value || isGameOver.value) {
    return
  }

  timerId = setInterval(() => {
    if (isPaused.value || isGameOver.value) {
      return
    }

    if (appliedMode.value === 'timed') {
      timeLeft.value = Math.max(0, timeLeft.value - 1)
      if (timeLeft.value === 0) {
        message.value = 'Hết giờ!'
        stopTimer()
      }
      return
    }

    if (appliedMode.value === 'classic') {
      return
    }

    storyElapsedSeconds.value += 1
  }, 1000)
}

function getTile(y: number, x: number): Tile | null {
  const row = grid.value[y]
  if (!row) {
    return null
  }
  return row[x] ?? null
}

function inBounds(x: number, y: number): boolean {
  return x >= 0 && x < boardCols.value && y >= 0 && y < boardRows.value
}

function inExtendedBounds(x: number, y: number): boolean {
  return x >= -1 && x <= boardCols.value && y >= -1 && y <= boardRows.value
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = result[i] as T
    result[i] = result[j] as T
    result[j] = temp
  }
  return result
}

function obstacleCountByDifficulty(totalCells: number, level: number): number {
  if (level <= 0) {
    return 0
  }
  const density = Math.min(0.04 + level * 0.02, 0.2)
  return Math.floor(totalCells * density)
}

function linearIndex(x: number, y: number, cols: number): number {
  return y * cols + x
}

function isOpenAreaConnected(rows: number, cols: number, walls: Set<number>): boolean {
  const totalCells = rows * cols
  const openCells = totalCells - walls.size
  if (openCells <= 1) {
    return false
  }

  let start = -1
  for (let i = 0; i < totalCells; i++) {
    if (!walls.has(i)) {
      start = i
      break
    }
  }

  if (start < 0) {
    return false
  }

  const stack: number[] = [start]
  const visited = new Set<number>([start])

  while (stack.length > 0) {
    const current = stack.pop()
    if (current === undefined) {
      break
    }
    const y = Math.floor(current / cols)
    const x = current % cols

    const neighbors: Array<readonly [number, number]> = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ]
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) {
        continue
      }
      const idx = linearIndex(nx, ny, cols)
      if (walls.has(idx) || visited.has(idx)) {
        continue
      }
      visited.add(idx)
      stack.push(idx)
    }
  }

  return visited.size === openCells
}

function generateConnectedWalls(rows: number, cols: number, targetWalls: number): Set<number> {
  const walls = new Set<number>()
  const candidates = shuffle(
    Array.from({ length: rows * cols }, (_, index) => ({
      x: index % cols,
      y: Math.floor(index / cols),
      index,
    })),
  )

  for (const candidate of candidates) {
    if (walls.size >= targetWalls) {
      break
    }
    walls.add(candidate.index)
    if (!isOpenAreaConnected(rows, cols, walls)) {
      walls.delete(candidate.index)
    }
  }

  return walls
}

function buildBoard(): void {
  const rows = boardRows.value
  const cols = boardCols.value
  const totalCells = rows * cols

  let obstacles = Math.min(obstacleCountByDifficulty(totalCells, appliedDifficulty.value), Math.max(0, totalCells - 2))
  if ((totalCells - obstacles) % 2 !== 0) {
    obstacles = Math.max(0, obstacles - 1)
  }

  let playableCells = totalCells - obstacles
  if (playableCells < 2) {
    playableCells = 2
    obstacles = totalCells - playableCells
  }

  const walls = generateConnectedWalls(rows, cols, obstacles)
  if ((totalCells - walls.size) % 2 !== 0) {
    const removable = Array.from(walls)
    const removed = removable[removable.length - 1]
    if (removed !== undefined) {
      walls.delete(removed)
    }
  }

  playableCells = totalCells - walls.size
  const pairs = playableCells / 2
  const iconTypes: number[] = []
  for (let i = 0; i < pairs; i++) {
    const type = Math.floor(Math.random() * iconSet.length)
    iconTypes.push(type, type)
  }
  const shuffledIcons = shuffle(iconTypes)

  const next: Tile[][] = []
  let id = 0
  let iconCursor = 0

  for (let y = 0; y < rows; y++) {
    const row: Tile[] = []
    for (let x = 0; x < cols; x++) {
      const index = linearIndex(x, y, cols)
      const isWall = walls.has(index)
      const iconType = isWall ? -1 : (shuffledIcons[iconCursor] ?? 0)
      if (!isWall) {
        iconCursor += 1
      }
      row.push({
        id,
        kind: isWall ? 'wall' : 'icon',
        type: iconType,
        icon: isWall ? '' : (iconSet[iconType] ?? ''),
        x,
        y,
        isVisible: true,
      })
      id++
    }
    next.push(row)
  }

  grid.value = next
}

function applyNewGameSettings(): void {
  appliedMode.value = pendingMainMode.value === 'story' ? 'story' : pendingCustomMode.value
  storyLevel.value = 1
  storyElapsedSeconds.value = 0

  if (pendingMainMode.value === 'story') {
    appliedSize.value = STORY_GRID_SIZE
    appliedDifficulty.value = storyDifficultyByLevel(1)
  } else {
    appliedSize.value = pendingSize.value
    appliedDifficulty.value = pendingDifficulty.value
  }

  score.value = 0
  timeLeft.value = startTimeBySetup.value
  assistsLeft.value = Math.max(1, totalAssists.value)
  message.value = 'Chọn 2 hình giống nhau!'
  isPaused.value = false
  isResolvingPair.value = false
  firstSelected.value = null
  secondSelected.value = null
  flashPath.value = []
  isHintVisible.value = false
  showRecordPrompt.value = false
  playerName.value = ''

  buildBoard()
  startTimerIfNeeded()
  void ensureBgmPlayback()
  showNewGameModal.value = false
}

function isWalkable(x: number, y: number, from: Tile, to: Tile): boolean {
  if ((x === from.x && y === from.y) || (x === to.x && y === to.y)) {
    return true
  }

  if (!inBounds(x, y)) {
    return true
  }

  const tile = getTile(y, x)
  if (!tile || tile.kind === 'wall') {
    return false
  }

  return !tile.isVisible
}

function reconstructPath(nodes: SearchNode[], endIndex: number): Point[] {
  const points: Point[] = []
  let cursor = endIndex

  while (cursor >= 0) {
    const node = nodes[cursor]
    if (!node) {
      break
    }
    points.push({ x: node.x + 1, y: node.y + 1 })
    cursor = node.parent
  }

  return points.reverse()
}

function compressPath(points: Point[]): Point[] {
  if (points.length <= 2) {
    return points
  }

  const compact: Point[] = [points[0] as Point]
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1] as Point
    const cur = points[i] as Point
    const next = points[i + 1] as Point

    const dx1 = cur.x - prev.x
    const dy1 = cur.y - prev.y
    const dx2 = next.x - cur.x
    const dy2 = next.y - cur.y

    if (dx1 * dy2 !== dy1 * dx2) {
      compact.push(cur)
    }
  }
  compact.push(points[points.length - 1] as Point)
  return compact
}

function findConnectionPath(from: Tile, to: Tile): Point[] | null {
  if (from.kind !== 'icon' || to.kind !== 'icon' || from.type < 0 || to.type < 0 || from.type !== to.type || from.id === to.id) {
    return null
  }

  const queue: SearchNode[] = [{ x: from.x, y: from.y, dir: -1, turns: 0, parent: -1 }]
  const visited = new Map<string, number>()
  let head = 0

  while (head < queue.length) {
    const current = queue[head]
    if (!current) {
      break
    }
    const currentIndex = head
    head++

    for (let i = 0; i < directions.length; i++) {
      const dir = i as Direction
      const vector = directions[dir] as readonly [number, number]
      const nextTurns = current.dir === -1 || current.dir === dir ? current.turns : current.turns + 1
      if (nextTurns > 2) {
        continue
      }

      let nx = current.x + vector[0]
      let ny = current.y + vector[1]

      while (inExtendedBounds(nx, ny) && isWalkable(nx, ny, from, to)) {
        const key = `${nx},${ny},${dir}`
        const seenTurns = visited.get(key)

        if (seenTurns === undefined || seenTurns > nextTurns) {
          visited.set(key, nextTurns)
          queue.push({ x: nx, y: ny, dir, turns: nextTurns, parent: currentIndex })
          const nodeIndex = queue.length - 1

          if (nx === to.x && ny === to.y) {
            return compressPath(reconstructPath(queue, nodeIndex))
          }
        }

        nx += vector[0]
        ny += vector[1]
      }
    }
  }

  return null
}

function togglePause(): void {
  if (isGameOver.value) {
    return
  }

  isPaused.value = !isPaused.value
  if (isPaused.value) {
    stopTimer()
    message.value = 'Đã tạm dừng.'
  } else {
    message.value = 'Tiếp tục nào!'
    startTimerIfNeeded()
  }
  void ensureBgmPlayback()
  playPauseSound(isPaused.value)
}

function finishWithWin(): void {
  stopTimer()
  playWinSound()
  if (appliedMode.value === 'story') {
    message.value = `Hoàn thành Story ${STORY_TOTAL_LEVELS} level trong ${timeLabel.value}.`
  } else {
    message.value = 'Bạn chiến thắng!'
  }
  showRecordPrompt.value = true
}

function advanceStoryLevel(): void {
  const nextLevel = storyLevel.value + 1
  storyLevel.value = nextLevel
  appliedDifficulty.value = storyDifficultyByLevel(nextLevel)
  assistsLeft.value = Math.max(1, totalAssists.value)
  firstSelected.value = null
  secondSelected.value = null
  flashPath.value = []
  isResolvingPair.value = false
  buildBoard()
  message.value = `Qua level ${nextLevel - 1}. Sang level ${nextLevel}/${STORY_TOTAL_LEVELS}.`
}

function resolveMatchedPair(first: Tile, second: Tile, path: Point[]): void {
  isResolvingPair.value = true
  flashPath.value = path

  setTimeout(() => {
    first.isVisible = false
    first.type = -1
    first.icon = ''

    second.isVisible = false
    second.type = -1
    second.icon = ''

    score.value += 10
    flashPath.value = []
    isResolvingPair.value = false

    if (isCleared.value) {
      if (appliedMode.value === 'story' && storyLevel.value < STORY_TOTAL_LEVELS) {
        advanceStoryLevel()
      } else {
        finishWithWin()
      }
    } else {
      message.value = 'Nối thành công!'
    }
  }, 260)
}

function selectTile(tile: Tile): void {
  if (isPaused.value || isGameOver.value || isResolvingPair.value) {
    return
  }
  if (tile.kind !== 'icon' || !tile.isVisible || tile.type < 0) {
    return
  }

  if (!firstSelected.value) {
    firstSelected.value = tile
    void ensureBgmPlayback()
    playSelectSound()
    return
  }

  if (firstSelected.value.id === tile.id) {
    firstSelected.value = null
    return
  }

  const first = firstSelected.value
  const second = tile
  if (isHintVisible.value) {
    flashPath.value = []
    isHintVisible.value = false
  }
  const path = findConnectionPath(first, second)

  if (path !== null) {
    secondSelected.value = second
    playMatchSound()
    resolveMatchedPair(first, second, path)
  } else {
    message.value = 'Không nối được!'
    playFailSound()
    failedPairIds.value = [first.id, second.id]
    firstSelected.value = null
    secondSelected.value = null
    setTimeout(() => {
      failedPairIds.value = []
    }, 280)
    return
  }

  setTimeout(() => {
    firstSelected.value = null
    secondSelected.value = null
  }, 300)
}

function consumeAssist(): boolean {
  if (assistsLeft.value <= 0) {
    message.value = 'Hết lượt trợ giúp.'
    return false
  }
  assistsLeft.value -= 1
  return true
}

function findHintPath(): { first: Tile; second: Tile; path: Point[] } | null {
  const grouped = new Map<number, Tile[]>()

  for (const row of grid.value) {
    for (const tile of row) {
      if (tile.kind !== 'icon' || !tile.isVisible || tile.type < 0) {
        continue
      }

      const list = grouped.get(tile.type)
      if (list) {
        list.push(tile)
      } else {
        grouped.set(tile.type, [tile])
      }
    }
  }

  for (const [, list] of grouped) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i] as Tile
        const b = list[j] as Tile
        const path = findConnectionPath(a, b)
        if (path !== null) {
          return { first: a, second: b, path }
        }
      }
    }
  }

  return null
}

function useHint(): void {
  if (isPaused.value || isGameOver.value || isResolvingPair.value) {
    return
  }
  if (!consumeAssist()) {
    return
  }

  const hint = findHintPath()
  if (!hint) {
    message.value = 'Không có đường đi an toàn.'
    return
  }

  flashPath.value = hint.path
  isHintVisible.value = true
  message.value = 'Gợi ý đã hiển thị.'
  void ensureBgmPlayback()
  playHintSound()
}

function useReload(): void {
  if (isPaused.value || isGameOver.value || isResolvingPair.value) {
    return
  }
  if (!consumeAssist()) {
    return
  }

  const activeTiles: Tile[] = []
  const items: Array<{ kind: 'icon' | 'wall'; type: number; icon: string }> = []

  for (const row of grid.value) {
    for (const tile of row) {
      if (tile.kind === 'wall') {
        activeTiles.push(tile)
        items.push({ kind: 'wall', type: -1, icon: '' })
      } else if (tile.isVisible && tile.type >= 0) {
        activeTiles.push(tile)
        items.push({ kind: 'icon', type: tile.type, icon: tile.icon })
      }
    }
  }

  const shuffled = shuffle(items)
  for (let i = 0; i < activeTiles.length; i++) {
    const tile = activeTiles[i] as Tile
    const item = shuffled[i]
    tile.kind = item?.kind ?? tile.kind
    tile.type = item?.type ?? tile.type
    tile.icon = item?.icon ?? tile.icon
    tile.isVisible = true
  }

  firstSelected.value = null
  secondSelected.value = null
  flashPath.value = []
  isHintVisible.value = false
  message.value = 'Đã tải lại bàn chơi.'
}

function saveRecord(): void {
  const name = playerName.value.trim()
  if (!name) {
    return
  }

  const record: RecordItem = {
    name,
    score: score.value,
    difficulty: appliedDifficulty.value,
    mode: appliedMode.value,
    timeSpent: playedSeconds.value,
    createdAt: new Date().toISOString(),
  }

  records.value = [...records.value, record].slice(-400)

  persistRecords()
  showRecordPrompt.value = false
  playerName.value = ''
  message.value = 'Đã lưu điểm cao.'
}

function openLeaderboardFlow(): void {
  leaderboardDifficulty.value = appliedDifficulty.value
  leaderboardCategory.value = 'story'
  leaderboardStep.value = 'pick'
  showLeaderboardModal.value = true
}

function unlockEasterEgg(): void {
  easterUnlocked.value = true
  easterMessage.value = ''
}

function saveEasterEggFinder(): void {
  const name = easterName.value.trim()
  if (!name) {
    easterMessage.value = 'Nhập tên trước khi ghi danh.'
    return
  }

  const duplicated = easterEggFinders.value.some((item) => item.name.toLowerCase() === name.toLowerCase())
  if (duplicated) {
    easterMessage.value = 'Tên này đã có trong danh sách rồi.'
    return
  }

  easterEggFinders.value = [{ name, createdAt: new Date().toISOString() }, ...easterEggFinders.value].slice(0, 100)
  persistEasterEggFinders()
  easterName.value = ''
  easterMessage.value = 'Đã ghi danh Easter Egg Finder.'
}

function startCreditsBoost(): void {
  isCreditsBoosted.value = true
}

function stopCreditsBoost(): void {
  isCreditsBoosted.value = false
}

function resetCreditsPosition(): void {
  const container = creditsContainerRef.value
  if (!container) {
    return
  }
  creditsOffsetY.value = container.clientHeight * 0.35
}

function stopCreditsLoop(): void {
  if (creditsRafId !== null) {
    cancelAnimationFrame(creditsRafId)
    creditsRafId = null
  }
  creditsLastFrame = 0
}

function tickCredits(timestamp: number): void {
  const container = creditsContainerRef.value
  const content = creditsContentRef.value
  const easterButton = creditsEasterButtonRef.value
  if (!showCreditsModal.value || !container || !content) {
    stopCreditsLoop()
    return
  }

  if (creditsLastFrame === 0) {
    creditsLastFrame = timestamp
  }

  const delta = (timestamp - creditsLastFrame) / 1000
  creditsLastFrame = timestamp
  if (!isCreditsAutoStopped.value) {
    const speed = isCreditsBoosted.value ? 56 : 28
    creditsOffsetY.value -= speed * delta

    if (creditsOffsetY.value < -content.clientHeight - 24) {
      creditsOffsetY.value = container.clientHeight * 0.35
    }

    if (easterButton) {
      const buttonTop = creditsOffsetY.value + easterButton.offsetTop
      const buttonCenter = buttonTop + easterButton.clientHeight / 2
      if (buttonCenter <= container.clientHeight / 2) {
        isCreditsAutoStopped.value = true
        stopCreditsBoost()
        stopCreditsLoop()
        return
      }
    }
  }

  creditsRafId = requestAnimationFrame(tickCredits)
}

function startCreditsLoop(): void {
  if (creditsRafId !== null) {
    return
  }
  creditsRafId = requestAnimationFrame(tickCredits)
}

function updateViewportMode(): void {
  isMobilePortrait.value = window.innerWidth < 768 && window.innerHeight > window.innerWidth
}

onMounted(() => {
  loadRecords()
  loadEasterEggFinders()
  showNewGameModal.value = true
  updateViewportMode()
  window.addEventListener('resize', updateViewportMode)
  void ensureBgmPlayback()
})

watch(
  () => [isBgmOn.value, bgmVolume.value],
  () => {
    initBgm()
    syncBgmVolume()
    if (isBgmOn.value) {
      void ensureBgmPlayback()
      return
    }
    bgmAudio?.pause()
  },
)

watch(
  () => showCreditsModal.value,
  async (opened) => {
    if (!opened) {
      stopCreditsLoop()
      stopCreditsBoost()
      isCreditsAutoStopped.value = false
      return
    }

    await nextTick()
    resetCreditsPosition()
    isCreditsAutoStopped.value = false
    startCreditsLoop()
  },
)

onUnmounted(() => {
  stopTimer()
  stopCreditsLoop()
  window.removeEventListener('resize', updateViewportMode)
  if (audioContext) {
    void audioContext.close()
    audioContext = null
  }
  if (bgmAudio) {
    bgmAudio.pause()
    bgmAudio.currentTime = 0
    bgmAudio = null
  }
})
</script>

<template>
  <div class="min-h-screen px-4 py-6 sm:px-6 sm:py-10" :class="wrapperClass">
    <div class="mx-auto flex w-full max-w-[1900px] flex-col gap-4">
      <header class="animate-fade-up border p-3 sm:p-4" :class="surfaceClass">
        <div class="mb-2 flex items-center justify-between gap-3">
          <p class="font-display text-xs tracking-widest text-accent-amber">TIME BAR // LIVE</p>
          <p class="font-display text-sm text-accent-coral">
            {{ appliedMode === 'timed' ? timeLabel : '∞' }}
          </p>
        </div>
        <div class="h-2 w-full border border-border-default bg-bg-deep">
          <div
            class="h-full bg-accent-coral transition-all duration-300"
            :style="{ width: `${timeProgress}%` }"
          />
        </div>
      </header>

      <div
        v-if="isMobilePortrait"
        class="animate-fade-up border px-3 py-2 text-center text-xs sm:hidden"
        :class="surfaceClass"
      >
        <p class="font-display tracking-wide text-accent-amber">↔ Xoay ngang điện thoại để có trải nghiệm tốt nhất</p>
      </div>

      <section class="grid gap-4 lg:grid-cols-[210px_1fr_280px] lg:items-start">
        <aside class="animate-fade-up animate-delay-1 border p-3" :class="surfaceClass">
          <h2 class="mb-2.5 flex items-center gap-2 font-display text-base font-semibold">
            <span class="text-accent-coral text-xs tracking-widest">//</span>
            Menu
          </h2>

          <div class="grid gap-1.5">
            <button type="button" class="border px-2.5 py-1.5 text-xs transition hover:border-accent-coral" :class="panelInnerClass" @click="showNewGameModal = true">
              Bắt đầu ván mới
            </button>
            <button type="button" class="border px-2.5 py-1.5 text-xs transition hover:border-accent-amber" :class="panelInnerClass" @click="showSettingsModal = true">
              Setting
            </button>
            <button type="button" class="border px-2.5 py-1.5 text-xs transition hover:border-accent-sky" :class="panelInnerClass" @click="togglePause">
              {{ isPaused ? 'Tiếp tục' : 'Tạm dừng' }}
            </button>
            <button type="button" class="border px-2.5 py-1.5 text-xs transition hover:border-accent-coral" :class="panelInnerClass" @click="openLeaderboardFlow">
              Kỷ lục
            </button>
            <button type="button" class="border px-2.5 py-1.5 text-xs transition hover:border-accent-amber" :class="panelInnerClass" @click="showCreditsModal = true">
              Credit
            </button>
          </div>

          <div class="mt-2.5 border p-2" :class="panelInnerClass">
            <p class="text-[10px] font-display tracking-widest" :class="textMutedClass">BGM {{ bgmVolume }}%</p>
            <input v-model.number="bgmVolume" type="range" min="0" max="100" step="1" class="mt-1 w-full accent-accent-coral">
            <p class="mt-2 text-[10px] font-display tracking-widest" :class="textMutedClass">SFX {{ sfxVolume }}%</p>
            <input v-model.number="sfxVolume" type="range" min="0" max="100" step="1" class="mt-1 w-full accent-accent-coral">
          </div>

          <RouterLink to="/" class="mt-2.5 inline-flex w-full items-center justify-center border px-2.5 py-1.5 text-xs transition hover:border-accent-amber" :class="panelInnerClass">
            ← Về trang chủ
          </RouterLink>
        </aside>

        <div class="animate-fade-up animate-delay-2 border p-3 sm:p-4" :class="surfaceClass">
          <div class="flex justify-center overflow-x-auto">
            <div class="relative overflow-visible">
              <div class="grid gap-[2px]" :style="{ gridTemplateColumns: `repeat(${extCols}, minmax(0, 1fr))`, width: 'fit-content' }">
                <div
                  v-for="cell in displayCells"
                  :key="cell.key"
                  class="border transition-all duration-150"
                  :class="[
                    portraitCellSizeClass,
                    cell.isOuter ? 'border-transparent bg-transparent' : '',
                    !cell.isOuter && cell.tile?.kind === 'wall' ? 'border-[#707070] bg-[#707070]' : '',
                    !cell.isOuter && cell.tile?.kind === 'icon' && cell.tile.isVisible ? 'cursor-pointer border-border-default bg-bg-deep hover:border-accent-amber hover:bg-bg-elevated flex items-center justify-center' : '',
                    !cell.isOuter && cell.tile?.kind === 'icon' && !cell.tile.isVisible ? 'border-border-default/40 bg-bg-deep/30' : '',
                    cell.tile && firstSelected?.id === cell.tile.id ? '!border-accent-amber !bg-accent-amber/45 ring-2 ring-accent-amber/80 shadow-[0_0_10px_rgba(255,184,48,0.65)]' : '',
                    cell.tile && secondSelected?.id === cell.tile.id ? 'border-accent-amber bg-accent-amber/25' : '',
                    cell.tile && failedPairIds.includes(cell.tile.id) ? 'tile-fail-shake border-accent-coral bg-accent-amber/25' : '',
                    isPaused || isGameOver ? 'pointer-events-none opacity-80' : '',
                  ]"
                  @click="cell.tile && selectTile(cell.tile)"
                >
                  <template v-if="cell.tile?.kind === 'icon' && cell.tile.isVisible">{{ cell.tile.icon }}</template>
                </div>
              </div>

              <svg class="pointer-events-none absolute inset-0 h-full w-full" :viewBox="`0 0 ${extCols} ${extRows}`" preserveAspectRatio="none">
                <polyline
                  v-if="flashPath.length > 1"
                  :points="pathPolylinePoints"
                  class="connect-line"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="0.14"
                />
              </svg>

              <div
                v-if="isPaused && !isGameOver"
                class="absolute inset-0 z-10 flex items-center justify-center border border-border-default bg-bg-deep"
              >
                <p class="font-display text-xs tracking-[0.2em] text-accent-coral sm:text-sm">PAUSED</p>
              </div>
            </div>
          </div>
        </div>

        <aside class="animate-fade-up animate-delay-3 border p-3" :class="surfaceClass">
          <h2 class="mb-2.5 flex items-center gap-2 font-display text-base font-semibold">
            <span class="text-accent-amber text-xs tracking-widest">//</span>
            Thông tin màn chơi
          </h2>

          <div class="grid grid-cols-2 gap-1.5">
            <div class="border p-2.5" :class="panelInnerClass">
              <p class="font-display text-[10px] tracking-widest" :class="textMutedClass">SCORE</p>
              <p class="font-display text-xl font-semibold text-accent-coral">{{ score }}</p>
            </div>
            <div class="border p-2.5" :class="panelInnerClass">
              <p class="font-display text-[10px] tracking-widest" :class="textMutedClass">TIME</p>
              <p class="font-display text-xl font-semibold text-accent-sky">{{ appliedMode === 'timed' ? timeLabel : '∞' }}</p>
            </div>
            <div class="border p-2.5" :class="panelInnerClass">
              <p class="font-display text-[10px] tracking-widest" :class="textMutedClass">MODE</p>
              <p class="font-display text-sm font-semibold text-accent-amber">
                {{ appliedMode === 'story' ? 'STORY' : `CUSTOM / ${appliedMode === 'timed' ? 'TIMED' : 'CLASSIC'}` }}
              </p>
            </div>
            <div class="border p-2.5" :class="panelInnerClass">
              <p class="font-display text-[10px] tracking-widest" :class="textMutedClass">{{ isStoryMode ? 'STORY LEVEL' : 'DIFFICULTY' }}</p>
              <p class="font-display text-sm font-semibold text-accent-coral">
                {{ isStoryMode ? `${storyLevel}/${STORY_TOTAL_LEVELS}` : `LEVEL ${appliedDifficulty}` }}
              </p>
            </div>
          </div>

          <h3 class="mt-5 flex items-center gap-2 font-display text-sm font-semibold">
            <span class="text-accent-sky text-[10px] tracking-widest">//</span>
            Trợ giúp (Power-up)
          </h3>

          <p class="mt-1 text-xs" :class="textMutedClass">Lượt còn lại: <span class="text-accent-amber">{{ assistsLeft }}</span></p>
          <div class="mt-2 grid grid-cols-2 gap-2">
            <button type="button" class="border px-2 py-2 text-xs transition hover:border-accent-amber" :class="panelInnerClass" @click="useHint">Gợi ý</button>
            <button type="button" class="border px-2 py-2 text-xs transition hover:border-accent-coral" :class="panelInnerClass" @click="useReload">Tải lại</button>
          </div>

          <p class="mt-3 text-xs" :class="textMutedClass">{{ message }}</p>
        </aside>
      </section>

      <footer class="animate-fade-up animate-delay-3 border px-3 py-2 text-center text-xs sm:text-sm" :class="surfaceClass">
        <p class="font-display text-accent-amber">// {{ pageMeta.name }}</p>
        <p class="mt-1" :class="textMutedClass">{{ pageMeta.description }}</p>
        <p class="mt-1 text-[11px]" :class="textMutedClass">Tác giả: {{ pageMeta.author }}</p>
      </footer>
    </div>

    <div v-if="showNewGameModal" class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/80 px-4">
      <div class="w-full max-w-md border p-5" :class="surfaceClass">
        <h2 class="font-display text-xl font-semibold text-accent-coral">Bắt đầu ván mới</h2>

        <div class="mt-4 grid gap-3">
          <div>
            <p class="mb-1 text-xs font-display tracking-widest" :class="textMutedClass">MODE</p>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" class="border px-2 py-1.5 text-xs transition" :class="[panelInnerClass, pendingMainMode === 'story' ? 'border-accent-coral text-accent-coral' : 'hover:border-accent-amber']" @click="pendingMainMode = 'story'">Story mode</button>
              <button type="button" class="border px-2 py-1.5 text-xs transition" :class="[panelInnerClass, pendingMainMode === 'custom' ? 'border-accent-coral text-accent-coral' : 'hover:border-accent-amber']" @click="pendingMainMode = 'custom'">Custom mode</button>
            </div>
          </div>

          <div v-if="pendingMainMode === 'custom'">
            <p class="mb-1 text-xs font-display tracking-widest" :class="textMutedClass">CUSTOM TYPE</p>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" class="border px-2 py-1.5 text-xs transition" :class="[panelInnerClass, pendingCustomMode === 'classic' ? 'border-accent-coral text-accent-coral' : 'hover:border-accent-amber']" @click="pendingCustomMode = 'classic'">Classic</button>
              <button type="button" class="border px-2 py-1.5 text-xs transition" :class="[panelInnerClass, pendingCustomMode === 'timed' ? 'border-accent-coral text-accent-coral' : 'hover:border-accent-amber']" @click="pendingCustomMode = 'timed'">Timed</button>
            </div>
          </div>

          <div>
            <p class="mb-1 text-xs font-display tracking-widest" :class="textMutedClass">GRID SIZE</p>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="size in sizeOptions"
                :key="size"
                type="button"
                class="border px-2 py-1.5 text-xs transition"
                :class="[panelInnerClass, pendingSize === size ? 'border-accent-coral text-accent-coral' : 'hover:border-accent-amber', pendingMainMode === 'story' ? 'pointer-events-none opacity-50' : '']"
                @click="pendingSize = size"
              >
                {{ size }}
              </button>
            </div>
            <p v-if="pendingMainMode === 'story'" class="mt-1 text-xs" :class="textMutedClass">Story mode dùng bàn cố định 10x20.</p>
          </div>

          <div>
            <p class="mb-1 text-xs font-display tracking-widest" :class="textMutedClass">DIFFICULTY</p>
            <input v-model.number="pendingDifficulty" type="range" min="0" max="8" step="1" class="w-full accent-accent-coral" :disabled="pendingMainMode === 'story'">
            <p class="text-xs" :class="textMutedClass">
              {{ pendingMainMode === 'story' ? `Tự tăng theo ${STORY_TOTAL_LEVELS} level` : `Level ${pendingDifficulty}` }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button type="button" class="border px-3 py-2 text-sm transition hover:border-accent-coral" :class="panelInnerClass" @click="applyNewGameSettings">Bắt đầu</button>
            <button type="button" class="border px-3 py-2 text-sm transition hover:border-accent-amber" :class="panelInnerClass" @click="showNewGameModal = false">Đóng</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showSettingsModal" class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/80 px-4">
      <div class="w-full max-w-sm border p-5" :class="surfaceClass">
        <h2 class="font-display text-xl font-semibold text-accent-amber">Setting</h2>
        <button type="button" class="mt-4 w-full border px-3 py-2 text-sm transition hover:border-accent-coral" :class="panelInnerClass" @click="isLightMode = !isLightMode">
          {{ isLightMode ? 'Bật dark mode' : 'Bật light mode' }}
        </button>
        <button type="button" class="mt-2 w-full border px-3 py-2 text-sm transition hover:border-accent-sky" :class="panelInnerClass" @click="isBgmOn = !isBgmOn">
          {{ isBgmOn ? 'Tắt nhạc nền' : 'Bật nhạc nền' }}
        </button>
        <div class="mt-2 border p-3" :class="panelInnerClass">
          <p class="text-xs font-display tracking-widest" :class="textMutedClass">ÂM LƯỢNG NHẠC NỀN: {{ bgmVolume }}%</p>
          <input v-model.number="bgmVolume" type="range" min="0" max="100" step="1" class="mt-2 w-full accent-accent-coral">
        </div>
        <button type="button" class="mt-2 w-full border px-3 py-2 text-sm transition hover:border-accent-amber" :class="panelInnerClass" @click="isSoundOn = !isSoundOn">
          {{ isSoundOn ? 'Tắt sound effect' : 'Bật sound effect' }}
        </button>
        <div class="mt-2 border p-3" :class="panelInnerClass">
          <p class="text-xs font-display tracking-widest" :class="textMutedClass">ÂM LƯỢNG HIỆU ỨNG: {{ sfxVolume }}%</p>
          <input v-model.number="sfxVolume" type="range" min="0" max="100" step="1" class="mt-2 w-full accent-accent-coral">
        </div>
        <button type="button" class="mt-2 w-full border px-3 py-2 text-sm transition hover:border-accent-amber" :class="panelInnerClass" @click="showSettingsModal = false">
          Đóng
        </button>
      </div>
    </div>

    <div v-if="showCreditsModal" class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/85 px-4">
      <div class="w-full max-w-lg border p-5 overflow-hidden" :class="surfaceClass">
        <h2 class="font-display text-xl font-semibold text-accent-coral">Credit</h2>
        <div
          class="relative mt-4 h-56 overflow-hidden border"
          ref="creditsContainerRef"
          :class="panelInnerClass"
          @mousedown="startCreditsBoost"
          @mouseup="stopCreditsBoost"
          @mouseleave="stopCreditsBoost"
          @touchstart="startCreditsBoost"
          @touchend="stopCreditsBoost"
          @touchcancel="stopCreditsBoost"
        >
          <div ref="creditsContentRef" class="credits-scroll px-4 py-3 text-center text-sm" :style="creditsTransformStyle">
            <p class="font-display text-accent-amber">// Pikachu Puzzle</p>
            <p class="mt-4 text-accent-coral">Ý tưởng</p>
            <p>Gemini</p>
            <p class="mt-4 text-accent-coral">Coding</p>
            <p>CodeX</p>
            <p class="mt-4 text-accent-coral">Nhạc</p>
            <p>Gemini (Lyria) + Online Audio Joiner</p>
            <p class="mt-4 text-accent-coral">Người ngồi xem</p>
            <p>Tôi</p>
            <p class="mt-4" :class="textMutedClass">Cảm ơn vì đã chơi.</p>
            <p class="mt-80" :class="textMutedClass">Hết rồi, đừng xem nữa</p>
            <p class="mt-56" :class="textMutedClass">Đã bảo đừng xem nữa, chơi game đi</p>
            <p class="mt-56" :class="textMutedClass">...</p>
            <button ref="creditsEasterButtonRef" type="button" class="mt-56 border px-2 py-1 text-xs transition hover:border-accent-coral" :class="panelInnerClass" @click="unlockEasterEgg">
              Được rồi, đây là Easter Egg
            </button>
          </div>
        </div>
        <div v-if="easterUnlocked" class="mt-4 border p-3" :class="panelInnerClass">
          <p class="text-xs" :class="textMutedClass">Nhập tên để ghi danh Easter Egg Finder.</p>
          <input v-model="easterName" type="text" maxlength="24" placeholder="Tên của bạn" class="mt-2 w-full border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent-coral" :class="panelInnerClass">
          <button type="button" class="mt-2 w-full border px-3 py-2 text-sm transition hover:border-accent-coral" :class="panelInnerClass" @click="saveEasterEggFinder">
            Ghi danh
          </button>
          <p v-if="easterMessage" class="mt-2 text-xs" :class="textMutedClass">{{ easterMessage }}</p>
        </div>
        <button type="button" class="mt-4 w-full border px-3 py-2 text-sm transition hover:border-accent-coral" :class="panelInnerClass" @click="showCreditsModal = false">
          Đóng
        </button>
      </div>
    </div>

    <div v-if="showLeaderboardModal" class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/80 px-4">
      <div class="w-full max-w-3xl border p-5" :class="surfaceClass">
        <h2 class="font-display text-xl font-semibold text-accent-coral">Kỷ lục</h2>
        <div class="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            class="border px-2 py-2 text-xs transition"
            :class="[panelInnerClass, leaderboardCategory === 'story' ? 'border-accent-coral text-accent-coral' : 'hover:border-accent-amber']"
            @click="leaderboardCategory = 'story'"
          >
            Kỷ lục (Story mode)
          </button>
          <button
            type="button"
            class="border px-2 py-2 text-xs transition"
            :class="[panelInnerClass, leaderboardCategory === 'custom' ? 'border-accent-coral text-accent-coral' : 'hover:border-accent-amber']"
            @click="leaderboardCategory = 'custom'; leaderboardStep = 'pick'"
          >
            Custom mode
          </button>
          <button
            type="button"
            class="col-span-2 border px-2 py-2 text-xs transition"
            :class="[panelInnerClass, leaderboardCategory === 'easter' ? 'border-accent-coral text-accent-coral' : 'hover:border-accent-amber']"
            @click="leaderboardCategory = 'easter'"
          >
            Easter Egg Finder
          </button>
        </div>

        <div v-if="leaderboardCategory === 'story'" class="mt-4 border p-3" :class="panelInnerClass">
          <h3 class="font-display text-sm font-semibold text-accent-coral">Story Mode (Kỷ lục chính)</h3>
          <ol v-if="storyBoard.length > 0" class="mt-2 grid gap-1 text-xs">
            <li v-for="(item, idx) in storyBoard" :key="`${item.name}-${item.createdAt}-s`" class="flex justify-between gap-2">
              <span class="truncate">{{ idx + 1 }}. {{ item.name }}</span>
              <span class="text-accent-amber">{{ Math.floor(item.timeSpent / 60).toString().padStart(2, '0') }}:{{ (item.timeSpent % 60).toString().padStart(2, '0') }}</span>
            </li>
          </ol>
          <p v-else class="mt-2 text-xs" :class="textMutedClass">Chưa có dữ liệu Story mode.</p>
        </div>

        <div v-if="leaderboardCategory === 'custom' && leaderboardStep === 'pick'" class="mt-4">
          <p class="mb-2 text-sm" :class="textMutedClass">Chọn độ khó để xem bảng điểm Classic/Timed.</p>
          <div class="grid grid-cols-3 gap-2 sm:grid-cols-5">
            <button
              v-for="level in difficultyOptions"
              :key="level"
              type="button"
              class="border px-2 py-1.5 text-xs transition"
              :class="[panelInnerClass, leaderboardDifficulty === level ? 'border-accent-coral text-accent-coral' : 'hover:border-accent-amber']"
              @click="leaderboardDifficulty = level; leaderboardStep = 'view'"
            >
              Level {{ level }}
            </button>
          </div>
        </div>

        <div v-if="leaderboardCategory === 'custom' && leaderboardStep === 'view'" class="mt-4">
          <div class="mb-3 flex items-center justify-between">
            <p class="text-sm" :class="textMutedClass">Độ khó: Level {{ leaderboardDifficulty }}</p>
            <button type="button" class="border px-2 py-1 text-xs transition hover:border-accent-amber" :class="panelInnerClass" @click="leaderboardStep = 'pick'">Chọn lại độ khó</button>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div class="border p-3" :class="panelInnerClass">
              <h3 class="font-display text-sm font-semibold text-accent-amber">Không thời gian</h3>
              <ol v-if="classicBoard.length > 0" class="mt-2 grid gap-1 text-xs">
                <li v-for="(item, idx) in classicBoard" :key="`${item.name}-${item.createdAt}-c`" class="flex justify-between gap-2">
                  <span class="truncate">{{ idx + 1 }}. {{ item.name }}</span>
                  <span class="text-accent-coral">{{ item.score }}</span>
                </li>
              </ol>
              <p v-else class="mt-2 text-xs" :class="textMutedClass">Chưa có dữ liệu.</p>
            </div>

            <div class="border p-3" :class="panelInnerClass">
              <h3 class="font-display text-sm font-semibold text-accent-sky">Có thời gian</h3>
              <ol v-if="timedBoard.length > 0" class="mt-2 grid gap-1 text-xs">
                <li v-for="(item, idx) in timedBoard" :key="`${item.name}-${item.createdAt}-t`" class="flex justify-between gap-2">
                  <span class="truncate">{{ idx + 1 }}. {{ item.name }}</span>
                  <span class="text-accent-coral">{{ item.score }}</span>
                </li>
              </ol>
              <p v-else class="mt-2 text-xs" :class="textMutedClass">Chưa có dữ liệu.</p>
            </div>
          </div>
        </div>

        <div v-if="leaderboardCategory === 'easter'" class="mt-4 border p-3" :class="panelInnerClass">
          <h3 class="font-display text-sm font-semibold text-accent-amber">Easter Egg Finder</h3>
          <ol v-if="easterEggBoard.length > 0" class="mt-2 grid gap-1 text-xs">
            <li v-for="(item, idx) in easterEggBoard" :key="`${item.name}-${item.createdAt}`" class="flex justify-between gap-2">
              <span class="truncate">{{ idx + 1 }}. {{ item.name }}</span>
              <span :class="textMutedClass">{{ new Date(item.createdAt).toLocaleDateString('vi-VN') }}</span>
            </li>
          </ol>
          <p v-else class="mt-2 text-xs" :class="textMutedClass">Chưa ai tìm thấy Easter Egg.</p>
        </div>

        <button type="button" class="mt-4 w-full border px-3 py-2 text-sm transition hover:border-accent-coral" :class="panelInnerClass" @click="showLeaderboardModal = false">
          Đóng
        </button>
      </div>
    </div>

    <div v-if="showRecordPrompt" class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/80 px-4">
      <div class="w-full max-w-sm border p-5" :class="surfaceClass">
        <h2 class="font-display text-xl font-semibold text-accent-coral">Lưu điểm cao</h2>
        <p class="mt-2 text-sm" :class="textMutedClass">
          {{ appliedMode === 'story' ? `Bạn vừa hoàn thành Story ${STORY_TOTAL_LEVELS} level trong ${timeLabel}. Nhập tên để lưu kỷ lục chính.` : 'Nhập tên để lưu bảng xếp hạng theo độ khó/mode hiện tại.' }}
        </p>
        <input v-model="playerName" type="text" maxlength="20" placeholder="Tên của bạn" class="mt-4 w-full border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent-coral" :class="panelInnerClass">
        <div class="mt-4 grid grid-cols-2 gap-2">
          <button type="button" class="border px-3 py-2 text-sm transition hover:border-accent-coral" :class="panelInnerClass" @click="saveRecord">Lưu</button>
          <button type="button" class="border px-3 py-2 text-sm transition hover:border-accent-amber" :class="panelInnerClass" @click="showRecordPrompt = false">Bỏ qua</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.connect-line {
  stroke: #ffb830;
  filter: drop-shadow(0 0 6px rgb(255 184 48 / 75%));
  animation: connect-flash 0.28s ease-in-out 2;
}

@keyframes connect-flash {
  0%,
  100% {
    opacity: 0.2;
  }
  50% {
    opacity: 1;
  }
}

.tile-fail-shake {
  animation: tile-fail-shake 0.28s ease-in-out 1;
}

.credits-scroll {
  will-change: transform;
}

@keyframes tile-fail-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-2px);
  }
  75% {
    transform: translateX(2px);
  }
}

</style>
