<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'

// ---------------------------------------------------------------------------
// Audio system (Web Audio API — no files needed)
// ---------------------------------------------------------------------------
const AUDIO_KEY = 'blockfit-muted'
const audioMuted = ref(localStorage.getItem(AUDIO_KEY) === '1')
watch(audioMuted, (m) => {
  try {
    localStorage.setItem(AUDIO_KEY, m ? '1' : '0')
  } catch {
    /* */
  }
})

let _audioCtx: AudioContext | null = null
function getAudioCtx(): AudioContext {
  if (!_audioCtx) _audioCtx = new AudioContext()
  if (_audioCtx.state === 'suspended') _audioCtx.resume()
  return _audioCtx
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', vol = 0.12) {
  if (audioMuted.value) return
  const ctx = getAudioCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(vol, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + duration)
}

function playNoise(duration: number, vol = 0.06) {
  if (audioMuted.value) return
  const ctx = getAudioCtx()
  const bufSize = ctx.sampleRate * duration
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buf
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(vol, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  src.connect(gain).connect(ctx.destination)
  src.start()
}

const sfx = {
  click() {
    playTone(800, 0.06, 'square', 0.06)
  },
  select() {
    playTone(600, 0.1, 'sine', 0.08)
  },
  place() {
    playTone(520, 0.12, 'triangle', 0.1)
    setTimeout(() => playTone(680, 0.1, 'triangle', 0.08), 60)
  },
  rotate() {
    playTone(440, 0.08, 'square', 0.05)
  },
  eject() {
    playTone(300, 0.15, 'sine', 0.06)
  },
  win() {
    const notes = [523, 659, 784, 1047]
    notes.forEach((f, i) => setTimeout(() => playTone(f, 0.25, 'sine', 0.1), i * 100))
  },
  timeout() {
    playTone(220, 0.4, 'sawtooth', 0.08)
    setTimeout(() => playTone(165, 0.5, 'sawtooth', 0.06), 200)
  },
  streak() {
    playTone(880, 0.15, 'sine', 0.08)
    setTimeout(() => playTone(1100, 0.12, 'sine', 0.06), 80)
  },
  warning() {
    playTone(350, 0.1, 'square', 0.04)
  },
  pause() {
    playTone(400, 0.15, 'triangle', 0.06)
  },
  resume() {
    playTone(500, 0.1, 'triangle', 0.06)
  },
  reset() {
    playNoise(0.12, 0.05)
    playTone(250, 0.15, 'sawtooth', 0.04)
  },
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type RC = [number, number]
type CellState = 'outside' | 'target' | 'obstacle'
type ColorMode = 1 | 2 | 3

interface BoardCell {
  state: CellState
}

interface Piece {
  baseCells: RC[]
  colorId: number
}

interface Level {
  id: number
  name: string
  rows: number
  cols: number
  targets: RC[]
  targetColors?: number[] // parallel to targets — colorId per target cell
  obstacles: RC[]
  pieces: Piece[]
  colorMode: ColorMode
  solution?: { anchor: RC; rotation: number }[]
}

type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme'
const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Dễ',
  medium: 'Trung bình',
  hard: 'Nâng cao',
  extreme: 'Cực khó',
}
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'extreme']
const PACK_SIZE: Record<Difficulty, number> = { easy: 10, medium: 10, hard: 15, extreme: 20 }
function packSize(diff: Difficulty): number {
  return PACK_SIZE[diff]
}
const TIMER_DURATION: Record<Difficulty, number> = { easy: 30, medium: 45, hard: 60, extreme: 90 }
const SCORE_MULTIPLIER: Record<Difficulty, number> = { easy: 0.5, medium: 1, hard: 1.5, extreme: 3 }

interface DragState {
  pieceIdx: number
  rotation: number
  x: number
  y: number
  startX: number
  startY: number
  hasMoved: boolean
  grabDr: number
  grabDc: number
}

type PlacedInfo = { anchor: RC; rotation: number } | null

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32)
// ---------------------------------------------------------------------------
function mulberry32(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------------------------------------------------------------------------
// Piece colors — 3 hues mapped to design system accents
// ---------------------------------------------------------------------------
const COLOR_CONFIGS = [
  { hue: 11, sat: 100, l: 65 }, // accent-coral (#FF6B4A)
  { hue: 198, sat: 93, l: 60 }, // accent-sky (#38BDF8)
  { hue: 39, sat: 100, l: 59 }, // accent-amber (#FFB830)
] as const

function cellColorForPiece(colorId: number): string {
  const c = COLOR_CONFIGS[colorId] ?? COLOR_CONFIGS[0]!
  return `hsl(${c.hue}, ${c.sat}%, ${c.l}%)`
}
function cellBorderForPiece(colorId: number): string {
  const c = COLOR_CONFIGS[colorId] ?? COLOR_CONFIGS[0]!
  return `hsl(${c.hue}, ${c.sat}%, ${Math.max(c.l - 15, 20)}%)`
}
function pieceGhostColor(colorId: number): string {
  const c = COLOR_CONFIGS[colorId] ?? COLOR_CONFIGS[0]!
  return `hsla(${c.hue}, ${c.sat}%, 55%, 0.4)`
}
function pieceGhostBorder(colorId: number): string {
  const c = COLOR_CONFIGS[colorId] ?? COLOR_CONFIGS[0]!
  return `hsl(${c.hue}, ${c.sat}%, 38%)`
}
// Compat wrappers — lookup piece color from piece index
function colorIdForPieceIdx(pieceIdx: number): number {
  return level.value.pieces[pieceIdx]?.colorId ?? 0
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function rotateCW(cells: RC[]): RC[] {
  const rot: RC[] = cells.map(([r, c]) => [c, -r])
  const minR = Math.min(...rot.map(([r]) => r))
  const minC = Math.min(...rot.map(([, c]) => c))
  return rot.map(([r, c]) => [r - minR, c - minC])
}

function getRotated(base: RC[], rot: number): RC[] {
  let cells: RC[] = base.map(([r, c]) => [r, c])
  for (let i = 0; i < rot % 4; i++) cells = rotateCW(cells)
  return cells
}

// ---------------------------------------------------------------------------
// Shape pool for puzzle generation
// ---------------------------------------------------------------------------
const SHAPE_POOL: RC[][] = [
  // Dominoes (2 cells)
  [
    [0, 0],
    [0, 1],
  ],
  // Trominoes (3 cells)
  [
    [0, 0],
    [0, 1],
    [0, 2],
  ], // I-3
  [
    [0, 0],
    [0, 1],
    [1, 0],
  ], // L-3
  [
    [0, 0],
    [0, 1],
    [1, 1],
  ], // L-3 mirror
  // Tetrominoes (4 cells)
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
  ], // I-4
  [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ], // O
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
  ], // S
  [
    [0, 1],
    [1, 0],
    [1, 1],
    [2, 0],
  ], // Z
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
  ], // L-4
  [
    [0, 1],
    [1, 1],
    [2, 0],
    [2, 1],
  ], // J-4
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 1],
  ], // T-4
  // Pentominoes (5 cells)
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
    [2, 2],
  ], // L-5
  [
    [0, 2],
    [1, 2],
    [2, 0],
    [2, 1],
    [2, 2],
  ], // J-5
  [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, 2],
    [2, 1],
  ], // cross / plus
  [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 2],
    [2, 2],
  ], // S-5
]

// ---------------------------------------------------------------------------
// Puzzle generator — creates guaranteed-solvable random puzzles
// ---------------------------------------------------------------------------
interface GeneratorConfig {
  rows: number
  cols: number
  minPieces: number
  maxPieces: number
  minPieceSize: number
  maxPieceSize: number
  maxObstacles: number
}

const DIFFICULTY_CONFIGS: Record<Difficulty, GeneratorConfig[]> = {
  easy: [
    {
      rows: 3,
      cols: 3,
      minPieces: 2,
      maxPieces: 3,
      minPieceSize: 2,
      maxPieceSize: 4,
      maxObstacles: 1,
    },
    {
      rows: 3,
      cols: 4,
      minPieces: 3,
      maxPieces: 4,
      minPieceSize: 2,
      maxPieceSize: 4,
      maxObstacles: 2,
    },
  ],
  medium: [
    {
      rows: 4,
      cols: 4,
      minPieces: 3,
      maxPieces: 5,
      minPieceSize: 2,
      maxPieceSize: 4,
      maxObstacles: 2,
    },
    {
      rows: 4,
      cols: 5,
      minPieces: 4,
      maxPieces: 6,
      minPieceSize: 3,
      maxPieceSize: 5,
      maxObstacles: 3,
    },
  ],
  hard: [
    {
      rows: 5,
      cols: 5,
      minPieces: 4,
      maxPieces: 7,
      minPieceSize: 3,
      maxPieceSize: 5,
      maxObstacles: 4,
    },
    {
      rows: 5,
      cols: 6,
      minPieces: 5,
      maxPieces: 8,
      minPieceSize: 3,
      maxPieceSize: 5,
      maxObstacles: 5,
    },
  ],
  extreme: [
    {
      rows: 6,
      cols: 7,
      minPieces: 6,
      maxPieces: 10,
      minPieceSize: 3,
      maxPieceSize: 5,
      maxObstacles: 7,
    },
    {
      rows: 7,
      cols: 8,
      minPieces: 7,
      maxPieces: 12,
      minPieceSize: 3,
      maxPieceSize: 5,
      maxObstacles: 9,
    },
  ],
}

// Freeplay difficulty slider configs (for the old 1-6 slider)
const FREEPLAY_CONFIGS: GeneratorConfig[] = [
  {
    rows: 3,
    cols: 3,
    minPieces: 2,
    maxPieces: 3,
    minPieceSize: 2,
    maxPieceSize: 4,
    maxObstacles: 2,
  },
  {
    rows: 3,
    cols: 4,
    minPieces: 3,
    maxPieces: 4,
    minPieceSize: 2,
    maxPieceSize: 4,
    maxObstacles: 2,
  },
  {
    rows: 4,
    cols: 4,
    minPieces: 3,
    maxPieces: 5,
    minPieceSize: 3,
    maxPieceSize: 5,
    maxObstacles: 4,
  },
  {
    rows: 4,
    cols: 5,
    minPieces: 4,
    maxPieces: 6,
    minPieceSize: 3,
    maxPieceSize: 5,
    maxObstacles: 4,
  },
  {
    rows: 5,
    cols: 5,
    minPieces: 4,
    maxPieces: 7,
    minPieceSize: 3,
    maxPieceSize: 5,
    maxObstacles: 6,
  },
  {
    rows: 5,
    cols: 6,
    minPieces: 5,
    maxPieces: 8,
    minPieceSize: 3,
    maxPieceSize: 5,
    maxObstacles: 6,
  },
  {
    rows: 6,
    cols: 7,
    minPieces: 6,
    maxPieces: 10,
    minPieceSize: 3,
    maxPieceSize: 5,
    maxObstacles: 8,
  },
  {
    rows: 7,
    cols: 8,
    minPieces: 7,
    maxPieces: 12,
    minPieceSize: 3,
    maxPieceSize: 5,
    maxObstacles: 10,
  },
]

function generatePuzzle(cfg: GeneratorConfig, colorMode: ColorMode, seed?: number): Level {
  const rng = seed != null ? mulberry32(seed) : () => Math.random()
  const maxAttempts = 50

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = _attemptGenerate(cfg, colorMode, rng)
    if (result) return { ...result, id: 0, name: 'Generated', colorMode }
  }
  // Fallback
  return {
    id: 0,
    name: 'Generated',
    rows: cfg.rows,
    cols: cfg.cols,
    colorMode,
    targets: Array.from({ length: cfg.rows }, (_, r) =>
      Array.from({ length: cfg.cols }, (_, c) => [r, c] as RC),
    ).flat(),
    obstacles: [],
    pieces: [
      {
        baseCells: [
          [0, 0],
          [0, 1],
        ],
        colorId: 0,
      },
      {
        baseCells: [
          [0, 0],
          [1, 0],
        ],
        colorId: 0,
      },
    ],
  }
}

function _attemptGenerate(
  cfg: GeneratorConfig,
  colorMode: ColorMode,
  rng: () => number,
): Omit<Level, 'id' | 'name' | 'colorMode'> | null {
  const { rows, cols } = cfg
  const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(-1))

  const numObstacles = Math.floor(rng() * (cfg.maxObstacles + 1))
  const obstacles: RC[] = []
  for (let i = 0; i < numObstacles; i++) {
    const r = Math.floor(rng() * rows)
    const c = Math.floor(rng() * cols)
    if (grid[r]![c] === -1) {
      grid[r]![c] = -2
      obstacles.push([r, c])
    }
  }

  const validShapes = SHAPE_POOL.filter(
    (s) => s.length >= cfg.minPieceSize && s.length <= cfg.maxPieceSize,
  )
  if (validShapes.length === 0) return null

  const pieces: {
    baseCells: RC[]
    placedCells: RC[]
    colorId: number
    solAnchor: RC
    solRotation: number
  }[] = []
  const targetPieces = cfg.minPieces + Math.floor(rng() * (cfg.maxPieces - cfg.minPieces + 1))

  for (let p = 0; p < targetPieces; p++) {
    const placed = _tryPlaceRandomPiece(grid, rows, cols, validShapes, pieces.length, rng)
    if (!placed) break
    const colorId = colorMode >= 2 ? Math.floor(rng() * colorMode) : 0
    pieces.push({ ...placed, colorId })
  }

  // Guarantee all colors appear in multi-color mode
  if (colorMode >= 2 && pieces.length >= colorMode) {
    for (let cid = 0; cid < colorMode; cid++) {
      if (!pieces.some((p) => p.colorId === cid)) {
        // Find a piece whose color has multiple representatives
        const candidates = pieces.filter(
          (p) => pieces.filter((q) => q.colorId === p.colorId).length > 1,
        )
        if (candidates.length > 0) {
          candidates[Math.floor(rng() * candidates.length)]!.colorId = cid
        } else {
          // Fallback: just assign to a random piece
          pieces[Math.floor(rng() * pieces.length)]!.colorId = cid
        }
      }
    }
  }

  if (pieces.length < cfg.minPieces) return null
  // Need at least colorMode pieces to show all colors
  if (pieces.length < colorMode) return null

  const targets: RC[] = []
  const targetColors: number[] = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (grid[r]![c]! >= 0) {
        targets.push([r, c])
        targetColors.push(pieces[grid[r]![c]!]!.colorId)
      }

  if (targets.length < pieces.length * 2) return null

  const finalObstacles: RC[] = [...obstacles]
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) if (grid[r]![c] === -1) finalObstacles.push([r, c])

  return {
    rows,
    cols,
    targets,
    targetColors: colorMode >= 2 ? targetColors : undefined,
    obstacles: finalObstacles,
    pieces: pieces.map((p) => ({ baseCells: p.baseCells, colorId: p.colorId })),
    solution: pieces.map((p) => ({ anchor: p.solAnchor, rotation: p.solRotation })),
  }
}

function _tryPlaceRandomPiece(
  grid: number[][],
  rows: number,
  cols: number,
  validShapes: RC[][],
  pieceIdx: number,
  rng: () => number,
): { baseCells: RC[]; placedCells: RC[]; solAnchor: RC; solRotation: number } | null {
  const shuffled = [...validShapes].sort(() => rng() - 0.5)

  for (const baseShape of shuffled) {
    const rot = Math.floor(rng() * 4)
    const cells = getRotated(baseShape, rot)

    // Find bounding box
    const maxR = Math.max(...cells.map(([r]) => r))
    const maxC = Math.max(...cells.map(([, c]) => c))

    // Collect all valid positions
    const positions: RC[] = []
    for (let r = 0; r <= rows - maxR - 1; r++) {
      for (let c = 0; c <= cols - maxC - 1; c++) {
        const ok = cells.every(([dr, dc]) => grid[r + dr]![c + dc] === -1)
        if (ok) positions.push([r, c])
      }
    }

    if (positions.length === 0) continue

    const [ar, ac] = positions[Math.floor(rng() * positions.length)]!
    const placedCells: RC[] = cells.map(([dr, dc]) => [ar + dr, ac + dc])

    // Place on grid
    for (const [pr, pc] of placedCells) grid[pr]![pc] = pieceIdx

    return { baseCells: baseShape, placedCells, solAnchor: [ar, ac], solRotation: rot }
  }

  return null
}

// ---------------------------------------------------------------------------
// Pre-generated level packs — seed-based deterministic generation
// ---------------------------------------------------------------------------
function packKey(difficulty: Difficulty, colorMode: ColorMode): string {
  return `${difficulty}_${colorMode}c`
}

function generateLevelPack(difficulty: Difficulty, colorMode: ColorMode): Level[] {
  const cfgs = DIFFICULTY_CONFIGS[difficulty]
  const total = packSize(difficulty)
  const baseSeed = DIFFICULTIES.indexOf(difficulty) * 1000 + colorMode * 10000
  const levels: Level[] = []
  for (let i = 0; i < total; i++) {
    const cfg = cfgs[i % cfgs.length]!
    const seed = baseSeed + i * 7 + 31
    const lv = generatePuzzle(cfg, colorMode, seed)
    lv.id = i + 1
    lv.name = `${DIFFICULTY_LABELS[difficulty]} ${i + 1}`
    levels.push(lv)
  }
  return levels
}

// Cache generated packs
const _packCache = new Map<string, Level[]>()
function getLevelPack(difficulty: Difficulty, colorMode: ColorMode): Level[] {
  const key = packKey(difficulty, colorMode)
  if (!_packCache.has(key)) _packCache.set(key, generateLevelPack(difficulty, colorMode))
  return _packCache.get(key)!
}

// ---------------------------------------------------------------------------
// Progress tracking (localStorage)
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'blockfit-progress'

interface ProgressData {
  completed: Record<string, number[]> // packKey → completed level indices
}

function loadProgress(): ProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return { completed: {} }
}

function saveProgress(data: ProgressData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

const progress = ref<ProgressData>(loadProgress())

// ---------------------------------------------------------------------------
// Streak & highscore (localStorage)
// ---------------------------------------------------------------------------
const STREAK_KEY = 'blockfit-streak'
const MODE_STATS_KEY = 'blockfit-mode-stats'
interface ModeStatsEntry {
  currentStreak: number
  bestStreak: number
  bestScore: number
}
type ModeStatsData = Record<string, ModeStatsEntry>
function loadModeStats(): ModeStatsData {
  try {
    const raw = localStorage.getItem(MODE_STATS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  // Migrate from old global streak if present
  try {
    const old = localStorage.getItem(STREAK_KEY)
    if (old) {
      const parsed = JSON.parse(old)
      localStorage.removeItem(STREAK_KEY)
      // Put old global stats into '1c' as a reasonable default
      return {
        '1c': {
          currentStreak: parsed.current ?? 0,
          bestStreak: parsed.best ?? 0,
          bestScore: parsed.bestScore ?? 0,
        },
      }
    }
  } catch {
    /* ignore */
  }
  return {}
}
function saveModeStats(data: ModeStatsData) {
  try {
    localStorage.setItem(MODE_STATS_KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}
const modeStats = ref<ModeStatsData>(loadModeStats())
const showResetConfirm = ref(false)
const showModeResetConfirm = ref(false)
const modeResetTarget = ref<'1c' | '2c' | '3c' | null>(null)

// ---------------------------------------------------------------------------
// Timer & Scoring
// ---------------------------------------------------------------------------
const timerEnabled = computed(() => !isFreeplay.value || freeplayTimerEnabled.value)
function getTimerDuration(): number {
  if (isFreeplay.value) return freeplayTimerDuration.value
  return TIMER_DURATION[selectedDifficulty.value]
}
const timerTotal = ref(30)
const timerLeft = ref(30)
const timerStarted = ref(false) // becomes true on first piece drop
const timerRunning = ref(false)
const showPause = ref(false)
const timerExpired = ref(false)
const navWarning = ref(false)
let navWarningTimer: ReturnType<typeof setTimeout> | null = null
const resetNotice = ref(false)
let resetNoticeTimer: ReturnType<typeof setTimeout> | null = null
const randomNotice = ref(false)
let randomNoticeTimer: ReturnType<typeof setTimeout> | null = null
const showSolutionConfirm = ref(false)
const lastScore = ref(0)
const lastMultiplier = ref(1)
let timerInterval: ReturnType<typeof setInterval> | null = null

function resetTimer() {
  stopTimerInterval()
  const dur = getTimerDuration()
  timerTotal.value = dur
  timerLeft.value = dur
  timerStarted.value = false
  timerRunning.value = false
  timerExpired.value = false
  showPause.value = false
  lastScore.value = 0
}

function startTimer() {
  if (timerRunning.value) return
  timerRunning.value = true
  timerInterval = setInterval(() => {
    timerLeft.value = Math.max(0, +(timerLeft.value - 0.1).toFixed(1))
    const t = timerLeft.value
    if (t > 0 && t <= 10 && Math.abs(t - Math.round(t)) < 0.05) sfx.warning()
    if (timerLeft.value <= 0) {
      stopTimerInterval()
      timerRunning.value = false
      timerExpired.value = true
      sfx.timeout()
      resetStreak()
    }
  }, 100)
}

function pauseTimer() {
  stopTimerInterval()
  timerRunning.value = false
  showPause.value = true
  sfx.pause()
}

function resumeTimer() {
  sfx.resume()
  showPause.value = false
  if (timerStarted.value && !won.value && !timerExpired.value) {
    startTimer()
  }
}

function stopTimerInterval() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function getScoreMultiplier(): number {
  if (isFreeplay.value) return 1 + currentStreak.value * 0.25
  return SCORE_MULTIPLIER[selectedDifficulty.value]
}

function computeScore(): number {
  if (timerExpired.value) return 0
  const base = Math.ceil((timerLeft.value / timerTotal.value) * 1000)
  return Math.ceil(base * getScoreMultiplier())
}

const timerPercent = computed(() => Math.max(0, (timerLeft.value / timerTotal.value) * 100))
const timerColor = computed(() => {
  const t = timerLeft.value
  const half = timerTotal.value / 2
  if (t <= 10) return 'var(--color-accent-coral, #FF6B4A)'
  if (t <= half) return 'var(--color-accent-amber, #FFB830)'
  return 'var(--color-accent-sky, #38BDF8)'
})
const timerDisplay = computed(() => {
  const t = Math.ceil(timerLeft.value)
  const m = Math.floor(t / 60)
  const s = t % 60
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`
})

function currentModeKey(): string {
  if (isFreeplay.value) return 'free'
  return `${selectedColorMode.value}c`
}
function getModeEntry(key: string): ModeStatsEntry {
  return modeStats.value[key] ?? { currentStreak: 0, bestStreak: 0, bestScore: 0 }
}
function getModeStats(key: string): ModeStatsEntry {
  return getModeEntry(key)
}
function writeModeEntry(key: string, entry: ModeStatsEntry) {
  modeStats.value = { ...modeStats.value, [key]: entry }
  saveModeStats(modeStats.value)
}

const currentStreak = computed(() => getModeEntry(currentModeKey()).currentStreak)
const bestStreak = computed(() => getModeEntry(currentModeKey()).bestStreak)

function incrementStreak() {
  const key = currentModeKey()
  const entry = { ...getModeEntry(key) }
  entry.currentStreak++
  if (entry.currentStreak > entry.bestStreak) entry.bestStreak = entry.currentStreak
  writeModeEntry(key, entry)
  if (entry.currentStreak > 1) sfx.streak()
}
function updateBestScore(score: number) {
  const key = currentModeKey()
  const entry = { ...getModeEntry(key) }
  if (score > entry.bestScore) entry.bestScore = score
  writeModeEntry(key, entry)
}
function resetStreak() {
  const key = currentModeKey()
  const entry = { ...getModeEntry(key) }
  entry.currentStreak = 0
  writeModeEntry(key, entry)
}
const showingSolution = ref(false)

function showSolution() {
  const sol = level.value.solution
  if (!sol) return
  resetStreak()
  timerExpired.value = false
  showingSolution.value = true
  placed.value = sol.map((s) => ({ anchor: s.anchor, rotation: s.rotation }))
}

function showResetNotice() {
  resetNotice.value = true
  if (resetNoticeTimer) clearTimeout(resetNoticeTimer)
  resetNoticeTimer = setTimeout(() => {
    resetNotice.value = false
  }, 2000)
}

function showRandomNotice() {
  randomNotice.value = true
  if (randomNoticeTimer) clearTimeout(randomNoticeTimer)
  randomNoticeTimer = setTimeout(() => {
    randomNotice.value = false
  }, 2000)
}

function tryReset() {
  if (currentStreak.value > 0) {
    showResetConfirm.value = true
  } else {
    init()
    showResetNotice()
  }
}
function confirmReset() {
  sfx.reset()
  showResetConfirm.value = false
  resetStreak()
  init()
  showResetNotice()
}

function askResetMode(tab: '1c' | '2c' | '3c') {
  modeResetTarget.value = tab
  showModeResetConfirm.value = true
}
function confirmModeReset() {
  if (!modeResetTarget.value) return
  const cm = modeResetTarget.value === '1c' ? 1 : modeResetTarget.value === '2c' ? 2 : 3
  for (const diff of DIFFICULTIES) {
    const key = packKey(diff, cm as ColorMode)
    delete progress.value.completed[key]
  }
  saveProgress(progress.value)
  // Reset mode stats
  const mKey = modeResetTarget.value
  if (modeStats.value[mKey]) {
    const { [mKey]: _discarded, ...rest } = modeStats.value
    void _discarded
    modeStats.value = rest as ModeStatsData
    saveModeStats(modeStats.value)
  }
  showModeResetConfirm.value = false
  modeResetTarget.value = null
}

function markCompleted(difficulty: Difficulty, colorMode: ColorMode, levelIndex: number) {
  const key = packKey(difficulty, colorMode)
  if (!progress.value.completed[key]) progress.value.completed[key] = []
  if (!progress.value.completed[key]!.includes(levelIndex)) {
    progress.value.completed[key]!.push(levelIndex)
    saveProgress(progress.value)
  }
}

function isLevelCompleted(
  difficulty: Difficulty,
  colorMode: ColorMode,
  levelIndex: number,
): boolean {
  const key = packKey(difficulty, colorMode)
  return progress.value.completed[key]?.includes(levelIndex) ?? false
}

function packCompletedCount(difficulty: Difficulty, colorMode: ColorMode): number {
  const key = packKey(difficulty, colorMode)
  return progress.value.completed[key]?.length ?? 0
}

function isPackDone(difficulty: Difficulty, colorMode: ColorMode): boolean {
  return packCompletedCount(difficulty, colorMode) >= packSize(difficulty)
}

// ---------------------------------------------------------------------------
// Responsive cell sizing
// ---------------------------------------------------------------------------
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 400)
const windowHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 700)

function onResize() {
  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
}
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const INDICATOR_SIZE = 28 // space for row/col count bar indicators
const cellSize = computed(() => {
  const lv = level.value
  const availW = Math.min(windowWidth.value - 32, 480) - INDICATOR_SIZE
  const maxFromW = Math.floor((availW - (lv.cols - 1) * 4) / lv.cols)
  // Reserve ~190px for top bar + palette; remaining height for board
  const availH = windowHeight.value - 190 - INDICATOR_SIZE
  const maxFromH = Math.floor((availH - (lv.rows - 1) * 4) / lv.rows)
  return Math.max(28, Math.min(52, Math.min(maxFromW, maxFromH)))
})

const GAP = 4
const step = computed(() => cellSize.value + GAP)

// Palette piece cell size — scales with viewport
const palCellSize = computed(() => {
  const w = windowWidth.value
  if (w >= 1024) return 36
  if (w >= 768) return 30
  return 24
})
const palMinCard = computed(() => palCellSize.value * 3 + 20)

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const DRAG_THRESHOLD = 8
let paletteTouchPending: {
  idx: number
  startX: number
  startY: number
  moveHandler: (e: TouchEvent) => void
  endHandler: () => void
} | null = null

function cleanupPaletteTouchPending() {
  if (!paletteTouchPending) return
  document.removeEventListener('touchmove', paletteTouchPending.moveHandler)
  document.removeEventListener('touchend', paletteTouchPending.endHandler)
  document.removeEventListener('touchcancel', paletteTouchPending.endHandler)
  paletteTouchPending = null
}

type GameScreen = 'start' | 'levelSelect' | 'play'
const screen = ref<GameScreen>('start')
const transDir = ref<'fwd' | 'back'>('fwd')

// Current selection state
const selectedColorMode = ref<ColorMode>(1)
const selectedDifficulty = ref<Difficulty>('easy')
const selectedLevelIdx = ref(0) // index within the pack (0-9)
const isFreeplay = ref(false)
const freeplayDifficulty = ref(0) // 0-5 slider for freeplay
const freeplayColorMode = ref<ColorMode>(1)
const freeplayTimerEnabled = ref(true)
const freeplayTimerDuration = ref(60) // 30-90s slider
const levelSelectTab = ref<'1c' | '2c' | '3c' | 'free'>('1c')
function setLevelSelectTab(tab: '1c' | '2c' | '3c' | 'free') {
  levelSelectTab.value = tab
  if (tab === '1c') selectedColorMode.value = 1
  else if (tab === '2c') selectedColorMode.value = 2
  else if (tab === '3c') selectedColorMode.value = 3
}

const generatedLevel = ref<Level | null>(null)
const level = computed(() => {
  if (generatedLevel.value) return generatedLevel.value
  const pack = getLevelPack(selectedDifficulty.value, selectedColorMode.value)
  return pack[selectedLevelIdx.value]!
})
const board = ref<BoardCell[][]>([])
const placed = ref<PlacedInfo[]>([])
const drag = ref<DragState | null>(null)
const won = ref(false)
const selectedPieceIdx = ref(-1) // click-to-select

const boardEl = ref<HTMLElement | null>(null)

// Whole-piece overlay animations
interface PieceOverlay {
  pieceIdx: number
  anchor: RC
  rotation: number
  type: 'snap' | 'pullout'
}
const pieceOverlays = ref<PieceOverlay[]>([])

// Rotate overlay: renders piece shape at old rotation, animates 90deg turn
interface RotateOverlay {
  pieceIdx: number
  anchor: RC
  oldRotation: number
  newRotation: number
  pivotCell: RC
}
const rotateOverlay = ref<RotateOverlay | null>(null)

// Fly-back eject animation
interface FlybackAnim {
  pieceIdx: number
  rotation: number
  fromX: number
  fromY: number
  toX: number
  toY: number
  active: boolean
}
const flybackAnim = ref<FlybackAnim | null>(null)

function triggerPieceOverlay(
  pieceIdx: number,
  anchor: RC,
  rotation: number,
  type: 'snap' | 'pullout',
  duration: number,
) {
  // Clear any existing overlays for this piece to prevent visual duplication
  pieceOverlays.value = pieceOverlays.value.filter((o) => o.pieceIdx !== pieceIdx)
  const ov: PieceOverlay = { pieceIdx, anchor, rotation, type }
  pieceOverlays.value = [...pieceOverlays.value, ov]
  setTimeout(() => {
    pieceOverlays.value = pieceOverlays.value.filter((o) => o !== ov)
  }, duration)
}

function init() {
  const lv = level.value
  board.value = Array.from({ length: lv.rows }, (_, r) =>
    Array.from({ length: lv.cols }, (_, c) => ({
      state: (lv.obstacles.some(([or, oc]) => or === r && oc === c)
        ? 'obstacle'
        : lv.targets.some(([tr, tc]) => tr === r && tc === c)
          ? 'target'
          : 'outside') as CellState,
    })),
  )
  placed.value = lv.pieces.map(() => null)
  drag.value = null
  won.value = false
  showingSolution.value = false
  selectedPieceIdx.value = -1
  pieceOverlays.value = []
  rotateOverlay.value = null
  flybackAnim.value = null
  resetTimer()
}

init()

// ---------------------------------------------------------------------------
// Coverage
// ---------------------------------------------------------------------------
const coverage = computed((): number[][] => {
  const lv = level.value
  const map: number[][] = Array.from({ length: lv.rows }, () =>
    Array.from({ length: lv.cols }, () => -1),
  )
  placed.value.forEach((p, idx) => {
    if (!p) return
    const cells = getRotated(lv.pieces[idx]!.baseCells, p.rotation)
    for (const [dr, dc] of cells) {
      const r = p.anchor[0] + dr
      const c = p.anchor[1] + dc
      const row = map[r]
      if (!row || c < 0 || c >= lv.cols) continue
      row[c] = idx
    }
  })
  return map
})

// ---------------------------------------------------------------------------
// Out-of-grid cells — pieces rotated partially outside the board
// ---------------------------------------------------------------------------
interface OutOfGridCell {
  pieceIdx: number
  cellIdx: number
  r: number
  c: number
}
const outOfGridCells = computed((): OutOfGridCell[] => {
  const lv = level.value
  const result: OutOfGridCell[] = []
  placed.value.forEach((p, idx) => {
    if (!p) return
    // Suppress during rotation — the overlay handles the visual
    if (idx === rotatingPieceIdx.value) return
    const cells = getRotated(lv.pieces[idx]!.baseCells, p.rotation)
    cells.forEach(([dr, dc], ci) => {
      const r = p.anchor[0] + dr
      const c = p.anchor[1] + dc
      if (r < 0 || r >= lv.rows || c < 0 || c >= lv.cols) {
        result.push({ pieceIdx: idx, cellIdx: ci, r, c })
      }
    })
  })
  return result
})

// ---------------------------------------------------------------------------
// Drag ghost — Endfield style: hint always shows, red if conflict
// ---------------------------------------------------------------------------
function snapCell(): RC | null {
  if (!drag.value || !boardEl.value) return null
  const rect = boardEl.value.getBoundingClientRect()
  // Determine which cell the cursor is over, then subtract grab offset for anchor
  const cursorCol = Math.floor((drag.value.x - rect.left) / step.value)
  const cursorRow = Math.floor((drag.value.y - rect.top) / step.value)
  return [cursorRow - drag.value.grabDr, cursorCol - drag.value.grabDc]
}

// Ghost cells on the board
const dragGhostCells = computed((): { key: string; conflict: boolean }[] => {
  if (!drag.value || !drag.value.hasMoved) return []
  const snap = snapCell()
  if (!snap) return []
  const piece = level.value.pieces[drag.value.pieceIdx]
  if (!piece) return []
  const [sr, sc] = snap
  const lv = level.value
  const cells = getRotated(piece.baseCells, drag.value.rotation)
  const result: { key: string; conflict: boolean }[] = []

  for (const [dr, dc] of cells) {
    const r = sr + dr,
      c = sc + dc
    // Skip cells entirely outside the board grid (can't render on board)
    if (r < 0 || r >= lv.rows || c < 0 || c >= lv.cols) continue
    const cell = board.value[r]?.[c]
    // Conflict: obstacle, outside, or overlapping another piece
    const conflict = !cell || cell.state === 'obstacle' || cell.state === 'outside'
    result.push({ key: `${r},${c}`, conflict })
  }
  return result
})

const dragGhostSet = computed(() => new Set(dragGhostCells.value.map((g) => g.key)))
const dragGhostConflictSet = computed(
  () => new Set(dragGhostCells.value.filter((g) => g.conflict).map((g) => g.key)),
)

// Can drop = at least one cell is within the board grid (partial placement allowed)
const canDrop = computed((): boolean => {
  if (!drag.value || !drag.value.hasMoved) return false
  const snap = snapCell()
  if (!snap) return false
  const piece = level.value.pieces[drag.value.pieceIdx]
  if (!piece) return false
  const [sr, sc] = snap
  const lv = level.value
  const cells = getRotated(piece.baseCells, drag.value.rotation)
  // At least one cell must be within the board grid
  return cells.some(([dr, dc]) => {
    const r = sr + dr,
      c = sc + dc
    return r >= 0 && r < lv.rows && c >= 0 && c < lv.cols
  })
})

// ---------------------------------------------------------------------------
// Row/column target counts (how many target cells per row/col) and current fill counts
// ---------------------------------------------------------------------------
// Per-color target counts for indicators: [colorId0count, colorId1count, ...]
const rowTargetByColor = computed(() => {
  const lv = level.value
  const nColors = lv.targetColors ? lv.colorMode : 1
  return Array.from({ length: lv.rows }, (_, r) => {
    const counts = Array(nColors).fill(0) as number[]
    lv.targets.forEach(([tr], i) => {
      if (tr === r) counts[lv.targetColors?.[i] ?? 0]!++
    })
    return counts
  })
})
const colTargetByColor = computed(() => {
  const lv = level.value
  const nColors = lv.targetColors ? lv.colorMode : 1
  return Array.from({ length: lv.cols }, (_, c) => {
    const counts = Array(nColors).fill(0) as number[]
    lv.targets.forEach(([, tc], i) => {
      if (tc === c) counts[lv.targetColors?.[i] ?? 0]!++
    })
    return counts
  })
})
// Totals for backwards compat
const rowTargetCounts = computed(() =>
  rowTargetByColor.value.map((arr) => arr.reduce((a, b) => a + b, 0)),
)
const colTargetCounts = computed(() =>
  colTargetByColor.value.map((arr) => arr.reduce((a, b) => a + b, 0)),
)
// Per-color fill counts
const rowFillByColor = computed(() => {
  const lv = level.value
  const cov = coverage.value
  const nColors = lv.targetColors ? lv.colorMode : 1
  return Array.from({ length: lv.rows }, (_, r) => {
    const counts = Array(nColors).fill(0) as number[]
    for (let c = 0; c < lv.cols; c++) {
      const pidx = cov[r]?.[c] ?? -1
      if (pidx >= 0) counts[colorIdForPieceIdx(pidx)]!++
    }
    return counts
  })
})
const colFillByColor = computed(() => {
  const lv = level.value
  const cov = coverage.value
  const nColors = lv.targetColors ? lv.colorMode : 1
  return Array.from({ length: lv.cols }, (_, c) => {
    const counts = Array(nColors).fill(0) as number[]
    for (let r = 0; r < lv.rows; r++) {
      const pidx = cov[r]?.[c] ?? -1
      if (pidx >= 0) counts[colorIdForPieceIdx(pidx)]!++
    }
    return counts
  })
})
// Bar indicator items: [{colorId, filled, overfilled}] per row/col
type BarItem = { colorId: number; filled: boolean; over: boolean }
function buildBars(targetByColor: number[], fillByColor: number[]): BarItem[] {
  const items: BarItem[] = []
  for (let cid = 0; cid < targetByColor.length; cid++) {
    const t = targetByColor[cid]!
    const f = fillByColor[cid] ?? 0
    for (let b = 0; b < t; b++) {
      items.push({ colorId: cid, filled: f >= b + 1, over: f > t })
    }
  }
  return items
}
const colBarItems = computed(() =>
  colTargetByColor.value.map((tc, c) => buildBars(tc, colFillByColor.value[c]!)),
)
const rowBarItems = computed(() =>
  rowTargetByColor.value.map((tc, r) => buildBars(tc, rowFillByColor.value[r]!)),
)
function barColor(item: BarItem, dim: boolean): string {
  const c = COLOR_CONFIGS[item.colorId] ?? COLOR_CONFIGS[0]!
  if (item.over && item.filled) return '#FF6B4A'
  if (item.filled) return `hsl(${c.hue}, ${c.sat}%, ${c.l}%)`
  return dim
    ? `hsla(${c.hue}, ${c.sat}%, ${c.l}%, 0.2)`
    : `hsla(${c.hue}, ${c.sat}%, ${c.l}%, 0.25)`
}

// ---------------------------------------------------------------------------
// Check win
// ---------------------------------------------------------------------------
function checkWin() {
  const lv = level.value
  const cov = coverage.value
  if (placed.value.some((p) => p === null)) return
  // Every target cell must be covered
  for (const [tr, tc] of lv.targets) {
    if ((cov[tr]?.[tc] ?? -1) < 0) return
  }
  // Every piece cell must be on a target (no piece on non-target)
  for (const [idx, p] of placed.value.entries()) {
    if (!p) return
    const cells = getRotated(lv.pieces[idx]!.baseCells, p.rotation)
    for (const [dr, dc] of cells) {
      const r = p.anchor[0] + dr
      const c = p.anchor[1] + dc
      const cell = board.value[r]?.[c]
      if (!cell || cell.state !== 'target') return
    }
  }
  won.value = true
  sfx.win()
}

// ---------------------------------------------------------------------------
// Rotate placed piece (tap)
// ---------------------------------------------------------------------------
function rotatePlacedPiece(idx: number) {
  sfx.rotate()
  const p = placed.value[idx]
  if (!p) return
  if (rotateOverlay.value) return // animation in progress
  const piece = level.value.pieces[idx]
  if (!piece) return

  const oldRot = p.rotation
  const newRot = (oldRot + 1) % 4

  // Pivot cell in board coords (the cell the user tapped)
  const [pivR, pivC] = boardDragCell

  // The clicked cell's position relative to the piece anchor
  const pivDr = pivR - p.anchor[0]
  const pivDc = pivC - p.anchor[1]

  // Rotate the pivot offset 90° CW around (0,0): (dr, dc) → (dc, -dr)
  // The pivot cell in the new rotation moves to:
  const newPivDr = pivDc
  const newPivDc = -pivDr

  // The canonical shape for newRot, normalized to (0,0) origin
  const newShape = getRotated(piece.baseCells, newRot)
  const nsMinR = Math.min(...newShape.map(([r]) => r))
  const nsMinC = Math.min(...newShape.map(([, c]) => c))

  // Find where the pivot cell is within the new canonical shape
  // The old pivot within the old shape was at offset (pivDr, pivDc)
  // After rotation, it maps to (newPivDr, newPivDc) but we need to find
  // it via the canonical shape's cell list
  const oldCells = getRotated(piece.baseCells, oldRot)
  const pivotCellIdx = oldCells.findIndex(([r, c]) => r === pivDr && c === pivDc)

  let newAnchor: RC
  if (pivotCellIdx >= 0 && pivotCellIdx < newShape.length) {
    // The same cell in canonical newRot shape
    const [nsr, nsc] = newShape[pivotCellIdx]!
    // Anchor = board pivot position - cell offset in new shape
    newAnchor = [pivR - nsr, pivC - nsc]
  } else {
    // Fallback: keep pivot board position fixed, use rotated offset
    // newAnchor + newPivDr_normalized = pivR (board coords)
    // We shift newPivDr by nsMinR to account for normalization
    newAnchor = [pivR - (newPivDr - nsMinR + nsMinR), pivC - (newPivDc - nsMinC + nsMinC)]
  }

  // Clear any lingering snap/pullout overlays
  pieceOverlays.value = pieceOverlays.value.filter((o) => o.pieceIdx !== idx)

  // Store pending result so it can be finalized early if dragged mid-animation
  pendingRotation = { idx, anchor: newAnchor, rotation: newRot }

  // Keep piece in placed (cells suppressed via rotatingPieceIdx).
  rotateOverlay.value = {
    pieceIdx: idx,
    anchor: p.anchor,
    oldRotation: oldRot,
    newRotation: newRot,
    pivotCell: [pivR, pivC],
  }

  setTimeout(() => {
    if (pendingRotation?.idx === idx) commitPendingRotation()
  }, 250)
}

let pendingRotation: { idx: number; anchor: RC; rotation: number } | null = null

function commitPendingRotation() {
  if (!pendingRotation) return
  const { idx, anchor, rotation } = pendingRotation
  pendingRotation = null
  const updated = placed.value.slice()
  updated[idx] = { anchor, rotation }
  placed.value = updated
  rotateOverlay.value = null
  checkWin()
}

// ---------------------------------------------------------------------------
// Drag handlers
// ---------------------------------------------------------------------------
let boardDragPieceIdx = -1
let boardDragCell: RC = [0, 0]
let boardDragIsOutOfGrid = false

function getXY(e: MouseEvent | TouchEvent): [number, number] {
  if (e instanceof MouseEvent) return [e.clientX, e.clientY]
  const t = e.touches[0] ?? (e as TouchEvent).changedTouches[0]
  return t ? [t.clientX, t.clientY] : [0, 0]
}

function startDragFromPalette(e: MouseEvent | TouchEvent, idx: number) {
  if (timerExpired.value || showPause.value || showingSolution.value) return
  // Mouse: start drag immediately
  if (e.type === 'mousedown') {
    e.preventDefault()
    selectedPieceIdx.value = -1
    const [x, y] = getXY(e)
    boardDragPieceIdx = -1
    boardDragIsOutOfGrid = false
    drag.value = {
      pieceIdx: idx,
      rotation: 0,
      x,
      y,
      startX: x,
      startY: y,
      hasMoved: true,
      grabDr: 0,
      grabDc: 0,
    }
    return
  }
  // Touch: defer drag until vertical movement detected (so horizontal scroll still works)
  const [sx, sy] = getXY(e)
  cleanupPaletteTouchPending()
  const moveHandler = (te: TouchEvent) => {
    const t = te.touches[0]
    if (!t) return
    const dx = Math.abs(t.clientX - sx)
    const dy = t.clientY - sy // negative = moving up = drag gesture
    if (dx > DRAG_THRESHOLD) {
      // Horizontal motion — let browser scroll
      cleanupPaletteTouchPending()
      return
    }
    if (Math.abs(dy) > DRAG_THRESHOLD) {
      // Vertical motion — start drag
      cleanupPaletteTouchPending()
      selectedPieceIdx.value = -1
      boardDragPieceIdx = -1
      boardDragIsOutOfGrid = false
      drag.value = {
        pieceIdx: idx,
        rotation: 0,
        x: t.clientX,
        y: t.clientY,
        startX: sx,
        startY: sy,
        hasMoved: true,
        grabDr: 0,
        grabDc: 0,
      }
    }
  }
  const endHandler = () => {
    cleanupPaletteTouchPending()
  }
  paletteTouchPending = { idx, startX: sx, startY: sy, moveHandler, endHandler }
  document.addEventListener('touchmove', moveHandler, { passive: false })
  document.addEventListener('touchend', endHandler)
  document.addEventListener('touchcancel', endHandler)
}

let solutionDragSnapshot: { anchor: [number, number]; rotation: number } | null = null

function startDragFromBoard(e: MouseEvent | TouchEvent, idx: number, r: number, c: number) {
  if (timerExpired.value || showPause.value) return
  if (drag.value) return // already dragging
  // If this piece is mid-rotation, finalize it instantly before dragging
  if (pendingRotation?.idx === idx) commitPendingRotation()
  e.preventDefault()
  e.stopPropagation()
  const [x, y] = getXY(e)
  boardDragPieceIdx = idx
  boardDragCell = [r, c]
  const lv = level.value
  boardDragIsOutOfGrid = r < 0 || r >= lv.rows || c < 0 || c >= lv.cols

  // Compute grabbed cell's offset within the piece shape
  const p = placed.value[idx]
  let grabDr = 0,
    grabDc = 0
  if (p) {
    grabDr = r - p.anchor[0]
    grabDc = c - p.anchor[1]
  }

  // In solution mode, save the piece's current position so we can restore it on release
  if (showingSolution.value && p) {
    solutionDragSnapshot = { anchor: [...p.anchor] as [number, number], rotation: p.rotation }
  } else {
    solutionDragSnapshot = null
  }

  drag.value = {
    pieceIdx: idx,
    rotation: p?.rotation ?? 0,
    x,
    y,
    startX: x,
    startY: y,
    hasMoved: false,
    grabDr,
    grabDc,
  }
}

function onMove(e: MouseEvent | TouchEvent) {
  if (!drag.value) return
  e.preventDefault()
  const [x, y] = getXY(e)

  if (!drag.value.hasMoved) {
    const dx = x - drag.value.startX
    const dy = y - drag.value.startY
    if (Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return
    drag.value.hasMoved = true
    selectedPieceIdx.value = -1
    if (boardDragPieceIdx >= 0) {
      // Pull-out animation as whole piece overlay
      const info = placed.value[boardDragPieceIdx]
      if (info) triggerPieceOverlay(boardDragPieceIdx, info.anchor, info.rotation, 'pullout', 250)
      // Remove piece from board (immutable update for reliable reactivity)
      const newPlaced = [...placed.value]
      newPlaced[boardDragPieceIdx] = null
      placed.value = newPlaced
    }
  }

  drag.value = { ...drag.value, x, y }
}

// Is cursor over (or near) the board?
function isOverBoard(): boolean {
  if (!drag.value || !boardEl.value) return false
  const rect = boardEl.value.getBoundingClientRect()
  const margin = cellSize.value * 1.5
  return (
    drag.value.x >= rect.left - margin &&
    drag.value.x <= rect.right + margin &&
    drag.value.y >= rect.top - margin &&
    drag.value.y <= rect.bottom + margin
  )
}

function placePiece(pieceIdx: number, anchor: RC, rotation: number) {
  // Immutable update for reliable reactivity
  const newPlaced = [...placed.value]
  newPlaced[pieceIdx] = { anchor, rotation }
  placed.value = newPlaced
  triggerPieceOverlay(pieceIdx, anchor, rotation, 'snap', 300)
  sfx.place()
  // Start timer on first piece placement
  if (!timerStarted.value && timerEnabled.value) {
    timerStarted.value = true
    startTimer()
  }
}

function ejectToPalette(d: DragState) {
  const card = document.querySelector(`[data-palette-idx="${d.pieceIdx}"]`) as HTMLElement | null
  if (!card) return
  const rect = card.getBoundingClientRect()
  flybackAnim.value = {
    pieceIdx: d.pieceIdx,
    rotation: d.rotation,
    fromX: d.x,
    fromY: d.y,
    toX: rect.left + rect.width / 2,
    toY: rect.top + rect.height / 2,
    active: false,
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (flybackAnim.value) flybackAnim.value = { ...flybackAnim.value, active: true }
    })
  })
  setTimeout(() => {
    flybackAnim.value = null
  }, 350)
}

function onUp(e: MouseEvent | TouchEvent) {
  if (!drag.value) return

  // Tap on board piece → select or rotate (disabled in solution mode)
  if (!drag.value.hasMoved && boardDragPieceIdx >= 0 && !boardDragIsOutOfGrid) {
    if (!showingSolution.value) {
      if (selectedPieceIdx.value === boardDragPieceIdx) {
        rotatePlacedPiece(boardDragPieceIdx)
      } else {
        sfx.select()
        selectedPieceIdx.value = boardDragPieceIdx
      }
    }
    solutionDragSnapshot = null
    drag.value = null
    boardDragPieceIdx = -1
    return
  }

  if (drag.value.hasMoved) {
    if (e instanceof MouseEvent) {
      drag.value = { ...drag.value, x: e.clientX, y: e.clientY }
    }

    // Solution mode: always snap piece back to its original position
    if (showingSolution.value && solutionDragSnapshot) {
      placed.value[drag.value.pieceIdx] = {
        anchor: solutionDragSnapshot.anchor,
        rotation: solutionDragSnapshot.rotation,
      }
      solutionDragSnapshot = null
      drag.value = null
      boardDragPieceIdx = -1
      return
    }

    if (!isOverBoard()) {
      // Released away from board — return piece to palette
      sfx.eject()
      ejectToPalette(drag.value)
    } else if (canDrop.value) {
      const snap = snapCell()!
      placePiece(drag.value.pieceIdx, snap, drag.value.rotation)
    } else {
      sfx.eject()
      ejectToPalette(drag.value)
    }
  }

  drag.value = null
  boardDragPieceIdx = -1
  checkWin()
}

function onKeydown(e: KeyboardEvent) {
  if (!drag.value) return
  if (e.key === 'r' || e.key === 'R')
    drag.value = { ...drag.value, rotation: (drag.value.rotation + 1) % 4 }
  if (e.key === 'Escape') {
    drag.value = null
    boardDragPieceIdx = -1
    selectedPieceIdx.value = -1
  }
}

function onCellDown(e: MouseEvent | TouchEvent, r: number, c: number) {
  if (timerExpired.value || showPause.value) return
  const pieceIdx = coverage.value[r]?.[c] ?? -1
  if (pieceIdx < 0) {
    if (!showingSolution.value) {
      sfx.click()
      selectedPieceIdx.value = -1
    }
    return
  }
  e.preventDefault()
  startDragFromBoard(e, pieceIdx, r, c)
}

onMounted(() => {
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
  document.addEventListener('touchmove', onMove, { passive: false })
  document.addEventListener('touchend', onUp)
  document.addEventListener('touchcancel', onUp)
  document.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  document.removeEventListener('mousemove', onMove)
  document.removeEventListener('mouseup', onUp)
  document.removeEventListener('touchmove', onMove)
  document.removeEventListener('touchend', onUp)
  document.removeEventListener('touchcancel', onUp)
  document.removeEventListener('keydown', onKeydown)
  stopTimerInterval()
  if (navWarningTimer) clearTimeout(navWarningTimer)
  if (resetNoticeTimer) clearTimeout(resetNoticeTimer)
  if (randomNoticeTimer) clearTimeout(randomNoticeTimer)
  cleanupPaletteTouchPending()
})

// ---------------------------------------------------------------------------
// Palette piece preview
// ---------------------------------------------------------------------------
function piecePreviewGrid(baseCells: RC[], rotation: number) {
  const cells = getRotated(baseCells, rotation)
  const maxR = Math.max(...cells.map(([r]) => r))
  const maxC = Math.max(...cells.map(([, c]) => c))
  const set = new Set(cells.map(([r, c]) => `${r},${c}`))
  // Map (r,c) → cell index within the piece for per-cell lightness
  const ciMap = new Map<string, number>()
  cells.forEach(([r, c], i) => ciMap.set(`${r},${c}`, i))
  const rowArr = Array.from({ length: maxR + 1 }, (_, i) => i)
  const colArr = Array.from({ length: maxC + 1 }, (_, i) => i)
  return { set, ciMap, rowArr, colArr }
}

// Style for a cell within a piece shape (overlays, palette, drag, flyback)
function pieceCellStyle(
  key: string,
  ciMap: Map<string, number>,
  sz: number,
  pieceIdx?: number,
): string {
  const ci = ciMap.get(key)
  if (ci !== undefined) {
    const colorId = pieceIdx != null ? colorIdForPieceIdx(pieceIdx) : 0
    return `width:${sz}px;height:${sz}px;background-color:${cellColorForPiece(colorId)};border-color:${cellBorderForPiece(colorId)}`
  }
  return `width:${sz}px;height:${sz}px;border-color:transparent;background:transparent`
}

const palettePreviews = computed(() =>
  level.value.pieces.map((piece) => piecePreviewGrid(piece.baseCells, 0)),
)

// ---------------------------------------------------------------------------
// Piece outline — SVG contour around each placed piece
// ---------------------------------------------------------------------------
interface PieceOutlinePath {
  pathD: string
  color: string
}
const pieceOutlinePaths = computed((): PieceOutlinePath[] => {
  const result: PieceOutlinePath[] = []
  const lv = level.value
  const s = step.value
  const cs = cellSize.value
  const placedArr = placed.value
  for (let idx = 0; idx < placedArr.length; idx++) {
    const p = placedArr[idx]
    if (!p) continue
    if (idx === rotatingPieceIdx.value) continue
    const piece = lv.pieces[idx]
    if (!piece) continue
    const cells = getRotated(piece.baseCells, p.rotation)
    const cellSet = new Set(cells.map(([dr, dc]) => `${p.anchor[0] + dr},${p.anchor[1] + dc}`))
    const segs: string[] = []
    for (const [dr, dc] of cells) {
      const r = p.anchor[0] + dr
      const c = p.anchor[1] + dc
      const x = c * s
      const y = r * s
      if (!cellSet.has(`${r - 1},${c}`)) segs.push(`M${x},${y}L${x + cs},${y}`)
      if (!cellSet.has(`${r},${c + 1}`)) segs.push(`M${x + cs},${y}L${x + cs},${y + cs}`)
      if (!cellSet.has(`${r + 1},${c}`)) segs.push(`M${x},${y + cs}L${x + cs},${y + cs}`)
      if (!cellSet.has(`${r},${c - 1}`)) segs.push(`M${x},${y}L${x},${y + cs}`)
    }
    const cc = COLOR_CONFIGS[colorIdForPieceIdx(idx)] ?? COLOR_CONFIGS[0]!
    const color = selectedPieceIdx.value === idx ? '#F0EDE6' : `hsl(${cc.hue}, 100%, 60%)`
    result.push({ pathD: segs.join(''), color })
  }
  return result
})

// Floating drag piece offset: shift so the grabbed cell is under cursor
const dragVisualOffset = computed(() => {
  if (!drag.value) return { mx: 0, my: 0 }
  const piece = level.value.pieces[drag.value.pieceIdx]
  if (!piece) return { mx: 0, my: 0 }
  const cells = getRotated(piece.baseCells, drag.value.rotation)
  const maxR = Math.max(...cells.map(([r]) => r))
  const maxC = Math.max(...cells.map(([, c]) => c))
  const centerR = maxR / 2
  const centerC = maxC / 2
  const s = step.value
  return {
    mx: -(drag.value.grabDc - centerC) * s,
    my: -(drag.value.grabDr - centerR) * s,
  }
})

// ---------------------------------------------------------------------------
// Cell style helper
// ---------------------------------------------------------------------------
// Pieces currently being snap-animated (overlay handles the visual)
const snapAnimatingPieces = computed(
  () => new Set(pieceOverlays.value.filter((o) => o.type === 'snap').map((o) => o.pieceIdx)),
)
const rotatingPieceIdx = computed(() => rotateOverlay.value?.pieceIdx ?? -1)

function cellStyle(r: number, c: number): string {
  const sz = cellSize.value
  const base = `width:${sz}px;height:${sz}px;`
  const cell = board.value[r]?.[c]

  // Obstacle cell — dark with diagonal hatching
  if (cell?.state === 'obstacle') {
    return (
      base +
      `background: repeating-linear-gradient(-45deg, #162232, #162232 3px, #1E2F42 3px, #1E2F42 6px);`
    )
  }

  const cid = coverage.value[r]?.[c] ?? -1
  const key = `${r},${c}`

  // Placed piece cell — suppress if snap or rotate overlay is handling the visual
  if (cid >= 0) {
    if (snapAnimatingPieces.value.has(cid) || cid === rotatingPieceIdx.value) return base
    const colorId = colorIdForPieceIdx(cid)
    const dimmed = selectedPieceIdx.value >= 0 && selectedPieceIdx.value !== cid
    const opacity = dimmed ? 'opacity:0.3;' : ''
    return (
      base +
      `background-color:${cellColorForPiece(colorId)};border-color:${cellBorderForPiece(colorId)};${opacity}`
    )
  }
  // Ghost hint
  if (dragGhostSet.value.has(key) && drag.value) {
    const isConflict = dragGhostConflictSet.value.has(key)
    if (isConflict) {
      return base + `background-color:#FF6B4A33;border-color:#FF6B4A;`
    }
    const dragColorId = colorIdForPieceIdx(drag.value.pieceIdx)
    return (
      base +
      `background-color:${pieceGhostColor(dragColorId)};border-color:${pieceGhostBorder(dragColorId)};`
    )
  }
  return base
}

function cellClass(r: number, c: number, cell: BoardCell): string {
  if (cell.state === 'outside') return 'border-transparent bg-transparent pointer-events-none'
  if (cell.state === 'obstacle') return 'border-border-default bg-bg-surface'

  const cid = coverage.value[r]?.[c] ?? -1
  const key = `${r},${c}`

  if (cid >= 0) {
    if (snapAnimatingPieces.value.has(cid) || cid === rotatingPieceIdx.value)
      return 'border-border-default bg-bg-surface'
    return 'border-2'
  }

  // Ghost hint styling
  if (dragGhostSet.value.has(key)) {
    const isConflict = dragGhostConflictSet.value.has(key)
    return isConflict ? 'border-2 border-dashed' : 'border-2 border-dashed'
  }

  return 'border-border-default bg-bg-surface'
}

// Piece overlay positioning: compute bounding box in board-relative px
function pieceOverlayStyle(ov: PieceOverlay): string {
  const piece = level.value.pieces[ov.pieceIdx]
  if (!piece) return ''
  const cells = getRotated(piece.baseCells, ov.rotation)
  const minR = Math.min(...cells.map(([r]) => r))
  const maxR = Math.max(...cells.map(([r]) => r))
  const minC = Math.min(...cells.map(([, c]) => c))
  const maxC = Math.max(...cells.map(([, c]) => c))
  const s = step.value
  const top = (ov.anchor[0] + minR) * s
  const left = (ov.anchor[1] + minC) * s
  const w = (maxC - minC + 1) * s - GAP
  const h = (maxR - minR + 1) * s - GAP
  return `top:${top}px;left:${left}px;width:${w}px;height:${h}px;`
}

// Rotate overlay positioning: compute bounding box in board-relative px
const rotateOverlayStyle = computed(() => {
  const ov = rotateOverlay.value
  if (!ov || !boardEl.value) return ''
  const piece = level.value.pieces[ov.pieceIdx]
  if (!piece) return ''
  const oldCells = getRotated(piece.baseCells, ov.oldRotation)
  const minR = Math.min(...oldCells.map(([r]) => r))
  const maxR = Math.max(...oldCells.map(([r]) => r))
  const minC = Math.min(...oldCells.map(([, c]) => c))
  const maxC = Math.max(...oldCells.map(([, c]) => c))
  const sz = cellSize.value
  const s = step.value
  // Position of the bounding box top-left in the board grid
  const top = (ov.anchor[0] + minR) * s
  const left = (ov.anchor[1] + minC) * s
  const w = (maxC - minC + 1) * s - GAP
  const h = (maxR - minR + 1) * s - GAP
  // Transform-origin at the pivot cell's center within the overlay
  const pivDr = ov.pivotCell[0] - ov.anchor[0] - minR
  const pivDc = ov.pivotCell[1] - ov.anchor[1] - minC
  const ox = pivDc * s + sz / 2
  const oy = pivDr * s + sz / 2
  return `top:${top}px;left:${left}px;width:${w}px;height:${h}px;transform-origin:${ox}px ${oy}px;`
})

function showNavWarning() {
  navWarning.value = true
  if (navWarningTimer) clearTimeout(navWarningTimer)
  navWarningTimer = setTimeout(() => {
    navWarning.value = false
  }, 2000)
}

function navLevel(dir: -1 | 1) {
  if (timerStarted.value && !won.value && !timerExpired.value) {
    showNavWarning()
    return
  }
  if (isFreeplay.value) {
    startRandomPuzzle()
    return
  }
  const total = packSize(selectedDifficulty.value)
  const next = selectedLevelIdx.value + dir
  if (next < 0 || next >= total) return
  startPackLevel(selectedDifficulty.value, selectedColorMode.value, next)
}

function startPackLevel(difficulty: Difficulty, colorMode: ColorMode, idx: number) {
  isFreeplay.value = false
  generatedLevel.value = null
  selectedDifficulty.value = difficulty
  selectedColorMode.value = colorMode
  selectedLevelIdx.value = idx
  init()
  transDir.value = 'fwd'
  screen.value = 'play'
}

function startRandomPuzzle() {
  isFreeplay.value = true
  const cfg = FREEPLAY_CONFIGS[Math.min(freeplayDifficulty.value, FREEPLAY_CONFIGS.length - 1)]!
  const lv = generatePuzzle(cfg, freeplayColorMode.value)
  generatedLevel.value = lv
  init()
  transDir.value = 'fwd'
  screen.value = 'play'
}

function nextPackLevel() {
  if (isFreeplay.value) {
    startRandomPuzzle()
    return
  }
  const nextIdx = selectedLevelIdx.value + 1
  if (nextIdx < packSize(selectedDifficulty.value)) {
    startPackLevel(selectedDifficulty.value, selectedColorMode.value, nextIdx)
  } else {
    goToLevelSelect()
  }
}

function goToLevelSelect(dir: 'fwd' | 'back' = 'back') {
  // Exiting during play loses streak — but only if user placed at least one block
  if (screen.value === 'play' && !won.value && placed.value.some((p) => p !== null)) {
    resetStreak()
  }
  stopTimerInterval()
  timerRunning.value = false
  showPause.value = false
  won.value = false
  timerExpired.value = false
  transDir.value = dir
  screen.value = 'levelSelect'
}

function goToStart() {
  transDir.value = 'back'
  screen.value = 'start'
}

// On win, mark progress + streak + score
watch(won, (w) => {
  if (w) {
    stopTimerInterval()
    timerRunning.value = false
    const isReplay =
      !isFreeplay.value &&
      isLevelCompleted(selectedDifficulty.value, selectedColorMode.value, selectedLevelIdx.value)
    lastMultiplier.value = isReplay ? getScoreMultiplier() * 0.1 : getScoreMultiplier()
    lastScore.value = isReplay ? Math.ceil(computeScore() * 0.1) : computeScore()
    updateBestScore(lastScore.value)
    if (!isReplay) incrementStreak()
    if (!isFreeplay.value) {
      markCompleted(selectedDifficulty.value, selectedColorMode.value, selectedLevelIdx.value)
    }
  }
})
</script>

<template>
  <div
    class="fixed inset-0 bg-bg-deep text-text-primary font-body select-none touch-none overscroll-none flex flex-col overflow-hidden"
  >
    <Transition :name="transDir === 'fwd' ? 'screen-fwd' : 'screen-back'" mode="out-in">
      <div
        v-if="screen === 'start'"
        key="start"
        class="flex-1 flex flex-col items-center justify-center px-6 gap-8"
      >
        <div class="w-full max-w-2xl flex flex-col items-center gap-8">
          <!-- Logo / Title -->
          <div class="text-center anim-title-in">
            <div class="text-accent-amber font-display text-xs tracking-[0.3em] mb-3 uppercase">
              Bạn có phải... thợ xếp hình?
            </div>
            <h1
              class="font-display text-6xl sm:text-7xl font-bold text-accent-coral leading-none tracking-tight"
            >
              Block<span class="text-text-primary">Fit</span>
            </h1>
            <div class="mt-3 flex items-center justify-center gap-2">
              <div class="h-px w-8 bg-border-default" />
              <span class="text-text-dim text-[10px] font-display tracking-widest uppercase"
                >Xếp hình kiểu Endfield</span
              >
              <div class="h-px w-8 bg-border-default" />
            </div>
          </div>

          <!-- Play Button -->
          <button
            class="group relative border-2 border-accent-coral px-12 py-4 font-display text-lg tracking-widest text-accent-coral uppercase transition-all hover:bg-accent-coral hover:text-bg-deep active:scale-95 anim-fade-in-delay"
            @click="
              sfx.click();
              goToLevelSelect('fwd')
            "
          >
            <span class="relative z-10">Chơi</span>
          </button>

          <!-- Mute toggle -->
          <button
            class="flex items-center gap-2 text-text-dim text-xs font-display tracking-wide hover:text-text-secondary transition anim-fade-in-delay"
            @click="
              audioMuted = !audioMuted;
              if (!audioMuted) sfx.click()
            "
          >
            <Icon :icon="audioMuted ? 'lucide:volume-x' : 'lucide:volume-2'" class="size-4" />
            {{ audioMuted ? 'Bật âm thanh' : 'Tắt âm thanh' }}
          </button>

          <!-- Back link -->
          <RouterLink
            to="/"
            class="text-text-dim text-xs font-display tracking-wide hover:text-text-secondary transition anim-fade-in-delay-2"
          >
            <Icon icon="lucide:arrow-left" class="inline size-3 mr-1 -mt-0.5" />Về trang chủ
          </RouterLink>
          <a
            href="https://github.com/SihenZhang/ak-endfield-puzzle"
            target="_blank"
            rel="noopener noreferrer"
            class="text-text-dim/40 text-[9px] font-display tracking-wide hover:text-text-dim transition anim-fade-in-delay-2"
          >
            Credit: <span class="underline">ak-endfield-puzzle</span>
          </a>
        </div>
      </div>

      <div
        v-else-if="screen === 'levelSelect'"
        key="levelSelect"
        class="flex-1 flex flex-col overflow-y-auto items-center j2-scrollbar"
      >
        <div class="w-full max-w-2xl flex flex-col flex-1 px-4">
          <!-- Top back button -->
          <div class="pt-3 pb-1">
            <button
              class="flex items-center gap-1.5 text-text-dim text-xs font-display tracking-wide hover:text-text-secondary transition active:scale-95"
              @click="
                sfx.click();
                goToStart()
              "
            >
              <Icon icon="lucide:arrow-left" class="size-3.5" />Quay lại
            </button>
          </div>
          <!-- Header -->
          <div class="text-center py-3 anim-title-in">
            <div class="text-accent-amber font-display text-xs tracking-[0.3em] mb-2 uppercase">
              Chọn màn
            </div>
            <h2 class="font-display text-2xl sm:text-3xl font-bold text-text-primary">BlockFit</h2>
          </div>

          <!-- Best stats box -->
          <div
            class="flex items-center justify-center gap-6 py-3 mb-3 border-2 border-border-default/50 anim-fade-in-delay"
          >
            <div class="flex flex-col items-center">
              <span
                class="flex items-center gap-1 text-accent-amber font-display text-lg font-bold"
              >
                <Icon icon="lucide:flame" class="size-4" />
                {{ getModeStats(levelSelectTab === 'free' ? 'free' : levelSelectTab).bestStreak }}
              </span>
              <span class="text-text-dim text-[10px] font-display">Chuỗi cao nhất</span>
            </div>
            <div class="w-px h-8 bg-border-default" />
            <div class="flex flex-col items-center">
              <span class="text-accent-sky font-display text-lg font-bold">{{
                getModeStats(levelSelectTab === 'free' ? 'free' : levelSelectTab).bestScore
              }}</span>
              <span class="text-text-dim text-[10px] font-display">Điểm cao nhất</span>
            </div>
          </div>

          <!-- Mode tabs -->
          <div class="flex justify-center gap-2 mb-5 anim-fade-in-delay">
            <button
              v-for="tab in ['1c', '2c', '3c', 'free'] as const"
              :key="tab"
              class="px-4 py-2 border-2 font-display text-sm tracking-wide transition-all active:scale-95"
              :class="
                levelSelectTab === tab
                  ? tab === 'free'
                    ? 'border-accent-amber bg-accent-amber/15 text-accent-amber'
                    : 'border-accent-coral bg-accent-coral/15 text-accent-coral'
                  : 'border-border-default text-text-dim hover:border-text-dim'
              "
              @click="
                sfx.click();
                setLevelSelectTab(tab)
              "
            >
              {{
                tab === '1c' ? '1 Màu' : tab === '2c' ? '2 Màu' : tab === '3c' ? '3 Màu' : 'Tự do'
              }}
            </button>
          </div>

          <Transition name="tab-content" mode="out-in">
            <!-- Difficulty packs -->
            <div v-if="levelSelectTab !== 'free'" :key="levelSelectTab" class="px-4 space-y-3 pb-4">
              <div
                v-for="diff in DIFFICULTIES"
                :key="diff"
                class="border-2 border-border-default p-3"
              >
                <!-- Difficulty header -->
                <div class="flex items-center justify-between mb-2.5">
                  <div class="flex items-center gap-2">
                    <span
                      class="font-display text-sm font-bold"
                      :class="
                        isPackDone(diff, selectedColorMode)
                          ? 'text-accent-sky'
                          : 'text-text-primary'
                      "
                    >
                      {{ DIFFICULTY_LABELS[diff] }}
                    </span>
                    <Icon
                      v-if="isPackDone(diff, selectedColorMode)"
                      icon="lucide:check-circle"
                      class="size-4 text-accent-sky"
                    />
                  </div>
                  <span class="text-text-dim text-[10px] font-display">
                    {{ packCompletedCount(diff, selectedColorMode) }}/{{ packSize(diff) }}
                  </span>
                </div>
                <!-- Level grid -->
                <div class="grid grid-cols-5 gap-1.5">
                  <button
                    v-for="i in packSize(diff)"
                    :key="i"
                    class="aspect-square border-2 flex items-center justify-center font-display text-sm font-bold transition-all active:scale-90"
                    :class="
                      isLevelCompleted(diff, selectedColorMode, i - 1)
                        ? 'border-accent-sky/50 bg-accent-sky/10 text-accent-sky'
                        : 'border-border-default text-text-dim hover:border-accent-coral hover:text-accent-coral'
                    "
                    @click="
                      sfx.click();
                      startPackLevel(diff, selectedColorMode, i - 1)
                    "
                  >
                    {{ i }}
                  </button>
                </div>
              </div>
              <!-- Reset mode button -->
              <button
                class="mt-3 w-full border-2 border-accent-coral/40 py-2 font-display text-xs tracking-wider text-accent-coral/60 uppercase transition-all hover:border-accent-coral hover:text-accent-coral active:scale-95"
                @click="
                  sfx.click();
                  askResetMode(levelSelectTab as '1c' | '2c' | '3c')
                "
              >
                <Icon icon="lucide:trash-2" class="size-3 inline-block mr-1 -mt-0.5" />Đặt lại tiến
                trình
              </button>
            </div>

            <!-- Freeplay section -->
            <div v-else key="free" class="px-4 pb-4 flex-1 flex flex-col">
              <div class="border-2 border-accent-amber/30 p-4 flex flex-col items-center gap-4">
                <!-- Freeplay color mode -->
                <div class="flex gap-2">
                  <button
                    v-for="cm in [1, 2, 3] as ColorMode[]"
                    :key="'fp' + cm"
                    class="px-4 py-1.5 border-2 font-display text-xs tracking-wide transition-all active:scale-95"
                    :class="
                      freeplayColorMode === cm
                        ? 'border-accent-amber bg-accent-amber/15 text-accent-amber'
                        : 'border-border-default text-text-dim hover:border-text-dim'
                    "
                    @click="freeplayColorMode = cm"
                  >
                    {{ cm }} Màu
                  </button>
                </div>
                <!-- Board size selector -->
                <div class="grid grid-cols-4 gap-2 w-full">
                  <button
                    v-for="(cfg, d) in FREEPLAY_CONFIGS"
                    :key="d"
                    class="h-9 border-2 font-display text-xs font-bold transition-all active:scale-90"
                    :class="
                      freeplayDifficulty === d
                        ? 'border-accent-amber bg-accent-amber/20 text-accent-amber'
                        : 'border-border-default text-text-dim hover:border-text-dim'
                    "
                    @click="freeplayDifficulty = d"
                  >
                    {{ cfg.rows }}X{{ cfg.cols }}
                  </button>
                </div>
                <!-- Timer toggle + slider -->
                <div class="w-full flex flex-col gap-2">
                  <div class="flex items-center justify-between">
                    <span
                      class="text-text-dim text-xs font-display tracking-wide flex items-center gap-1"
                    >
                      <Icon icon="lucide:timer" class="size-3" />Hẹn giờ
                    </span>
                    <button
                      class="relative w-9 h-5 rounded-full transition-colors"
                      :class="freeplayTimerEnabled ? 'bg-accent-amber' : 'bg-border-default'"
                      @click="freeplayTimerEnabled = !freeplayTimerEnabled"
                    >
                      <span
                        class="absolute top-0.5 left-0.5 size-4 rounded-full bg-bg-deep transition-transform"
                        :class="freeplayTimerEnabled ? 'translate-x-4' : 'translate-x-0'"
                      />
                    </button>
                  </div>
                  <div v-if="freeplayTimerEnabled" class="flex items-center gap-3">
                    <span class="text-text-dim text-[10px] font-display w-7 text-right tabular-nums"
                      >{{ freeplayTimerDuration }}s</span
                    >
                    <input
                      type="range"
                      min="30"
                      max="90"
                      step="5"
                      :value="freeplayTimerDuration"
                      @input="freeplayTimerDuration = +($event.target as HTMLInputElement).value"
                      class="flex-1 h-1 appearance-none bg-border-default rounded cursor-pointer accent-amber"
                    />
                  </div>
                </div>
                <button
                  class="border-2 border-accent-amber px-6 py-2 font-display text-sm tracking-wider text-accent-amber uppercase transition-all hover:bg-accent-amber hover:text-bg-deep active:scale-95"
                  @click="
                    sfx.click();
                    startRandomPuzzle()
                  "
                >
                  Chơi ngay
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <div v-else key="play" class="flex-1 flex flex-col items-center">
        <div class="w-full max-w-2xl flex flex-col flex-1">
          <!-- Top bar -->
          <div
            class="flex items-center justify-between px-4 py-4 border-b border-border-default/50 relative"
          >
            <button
              class="flex items-center gap-1 text-text-dim font-display tracking-wide hover:text-accent-amber transition active:scale-95 shrink-0"
              :disabled="won || timerExpired"
              @click="
                sfx.click();
                pauseTimer()
              "
            >
              <Icon icon="lucide:pause" class="size-5" />
            </button>
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="flex items-center gap-2 pointer-events-auto">
                <button
                  v-if="!isFreeplay"
                  class="text-text-dim hover:text-accent-amber transition active:scale-90"
                  :class="{ 'opacity-30 pointer-events-none': selectedLevelIdx <= 0 }"
                  @click="
                    sfx.click();
                    navLevel(-1)
                  "
                >
                  <Icon icon="lucide:chevron-left" class="size-4" />
                </button>
                <span
                  class="text-accent-amber font-display text-sm tracking-[0.15em] uppercase font-bold"
                >
                  {{
                    isFreeplay
                      ? 'Tự do'
                      : `${DIFFICULTY_LABELS[selectedDifficulty]} — ${level.id}/${packSize(selectedDifficulty)}`
                  }}
                </span>
                <button
                  v-if="!isFreeplay"
                  class="text-text-dim hover:text-accent-amber transition active:scale-90"
                  :class="{
                    'opacity-30 pointer-events-none':
                      selectedLevelIdx >= packSize(selectedDifficulty) - 1,
                  }"
                  @click="
                    sfx.click();
                    navLevel(1)
                  "
                >
                  <Icon icon="lucide:chevron-right" class="size-4" />
                </button>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button
                v-if="isFreeplay"
                class="flex items-center gap-1 text-text-dim font-display tracking-wide hover:text-accent-amber transition active:scale-95"
                @click="
                  sfx.click();
                  timerStarted && !won && !timerExpired
                    ? showNavWarning()
                    : (startRandomPuzzle(), showRandomNotice())
                "
              >
                <Icon icon="lucide:shuffle" class="size-5" />
              </button>
              <button
                v-else
                class="flex items-center gap-1 text-text-dim font-display tracking-wide hover:text-accent-amber transition active:scale-95"
                @click="
                  sfx.click();
                  tryReset()
                "
              >
                <Icon icon="lucide:rotate-ccw" class="size-5" />
              </button>
            </div>
          </div>

          <!-- Nav warning tooltip -->
          <Transition name="fade">
            <div
              v-if="navWarning"
              class="flex justify-center px-4 py-1.5 bg-accent-coral/10 border-b border-accent-coral/20"
            >
              <span class="text-accent-coral text-xs font-display tracking-wide"
                >Không thể đổi màn trong lúc chơi</span
              >
            </div>
          </Transition>

          <!-- Reset notice tooltip -->
          <Transition name="fade">
            <div
              v-if="resetNotice"
              class="flex justify-center px-4 py-1.5 bg-accent-sky/10 border-b border-accent-sky/20"
            >
              <span class="text-accent-sky text-xs font-display tracking-wide"
                >Đã đặt lại màn chơi</span
              >
            </div>
          </Transition>

          <!-- Random notice tooltip -->
          <Transition name="fade">
            <div
              v-if="randomNotice"
              class="flex justify-center px-4 py-1.5 bg-accent-amber/10 border-b border-accent-amber/20"
            >
              <span class="text-accent-amber text-xs font-display tracking-wide"
                >Đã tạo màn chơi mới</span
              >
            </div>
          </Transition>

          <!-- Solution mode banner -->
          <div
            v-if="showingSolution"
            class="flex items-center justify-center gap-2 px-4 py-2 bg-accent-amber/10 border-b border-accent-amber/20"
          >
            <Icon icon="lucide:eye" class="size-3 text-accent-amber" />
            <span class="text-accent-amber text-xs font-display tracking-wide"
              >Chế độ xem đáp án — bấm chơi lại ở góc phải</span
            >
          </div>

          <!-- Timer bar -->
          <div class="relative border-b border-border-default/30">
            <div
              class="flex items-center justify-between px-4 py-2.5 text-[10px] font-display tracking-wider relative z-10"
            >
              <span class="flex items-center gap-1 text-accent-amber">
                <Icon icon="lucide:flame" class="size-3" />
                {{ currentStreak }}
              </span>
              <span
                v-if="timerEnabled"
                class="absolute left-1/2 -translate-x-1/2 font-bold tabular-nums"
                :style="{ color: timerColor }"
              >
                {{ timerDisplay }}
              </span>
              <span v-else class="absolute left-1/2 -translate-x-1/2 text-text-dim">∞</span>
              <span class="text-text-dim">
                Kỷ lục: <span class="text-text-secondary">{{ bestStreak }}</span>
              </span>
            </div>
            <!-- Timer progress bar -->
            <div
              v-if="timerEnabled"
              class="absolute bottom-0 left-0 h-[2px] transition-all duration-100 ease-linear"
              :style="{ width: timerPercent + '%', backgroundColor: timerColor }"
            />
          </div>

          <!-- Board — centered in remaining space -->
          <div
            class="flex-1 flex items-center justify-center px-4 min-h-0 touch-none relative"
            @click.self="selectedPieceIdx = -1"
          >
            <!-- Darken overlay when a piece is selected -->
            <div
              v-if="selectedPieceIdx >= 0"
              class="absolute inset-0 bg-black/30 pointer-events-none z-0 transition-opacity"
            />
            <div
              class="flex flex-col items-start"
              :style="`transform: translateX(-${(INDICATOR_SIZE + 4) / 2}px)`"
            >
              <!-- Column count indicators (top) - bar marks -->
              <div
                class="flex"
                :style="`margin-left: ${INDICATOR_SIZE + 4}px; gap: ${GAP}px; margin-bottom: 4px`"
              >
                <div
                  v-for="(cnt, c) in colTargetCounts"
                  :key="'ct' + c"
                  class="flex flex-col items-center justify-end select-none"
                  :style="`width:${cellSize}px; height:${INDICATOR_SIZE}px`"
                >
                  <template v-if="cnt === 0">
                    <svg :width="12" :height="12" viewBox="0 0 12 12" class="opacity-40">
                      <line
                        x1="2"
                        y1="2"
                        x2="10"
                        y2="10"
                        stroke="#8B9DB5"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                      <line
                        x1="10"
                        y1="2"
                        x2="2"
                        y2="10"
                        stroke="#8B9DB5"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                    </svg>
                  </template>
                  <template v-else>
                    <div
                      v-for="(item, bi) in colBarItems[c]"
                      :key="bi"
                      class="rounded-sm"
                      :style="`width:${Math.min(cellSize * 0.6, 20)}px; height:3px; margin-bottom:1px; background-color:${barColor(item, false)}`"
                    />
                  </template>
                </div>
              </div>
              <div class="flex items-start">
                <!-- Row count indicators (left) - bar marks -->
                <div class="flex flex-col" :style="`gap: ${GAP}px; margin-right: 4px`">
                  <div
                    v-for="(cnt, r) in rowTargetCounts"
                    :key="'rt' + r"
                    class="flex items-center justify-end select-none"
                    :style="`height:${cellSize}px; width:${INDICATOR_SIZE}px; gap:1px`"
                  >
                    <template v-if="cnt === 0">
                      <svg :width="12" :height="12" viewBox="0 0 12 12" class="opacity-40">
                        <line
                          x1="2"
                          y1="2"
                          x2="10"
                          y2="10"
                          stroke="#8B9DB5"
                          stroke-width="2"
                          stroke-linecap="round"
                        />
                        <line
                          x1="10"
                          y1="2"
                          x2="2"
                          y2="10"
                          stroke="#8B9DB5"
                          stroke-width="2"
                          stroke-linecap="round"
                        />
                      </svg>
                    </template>
                    <template v-else>
                      <div
                        v-for="(item, bi) in rowBarItems[r]"
                        :key="bi"
                        class="rounded-sm"
                        :style="`height:${Math.min(cellSize * 0.5, 16)}px; width:3px; background-color:${barColor(item, true)}`"
                      />
                    </template>
                  </div>
                </div>
                <div class="relative inline-block">
                  <div
                    ref="boardEl"
                    class="inline-grid relative"
                    :style="`grid-template-columns: repeat(${level.cols}, ${cellSize}px); gap: ${GAP}px`"
                  >
                    <template v-for="(row, r) in board" :key="r">
                      <div
                        v-for="(cell, c) in row"
                        :key="c"
                        class="flex items-center justify-center border relative"
                        :class="[
                          cellClass(r, c, cell),
                          (coverage[r]?.[c] ?? -1) >= 0 ? 'cursor-pointer' : '',
                        ]"
                        :style="cellStyle(r, c)"
                        @mousedown="onCellDown($event, r, c)"
                        @touchstart="onCellDown($event, r, c)"
                      >
                        <template v-if="cell.state === 'obstacle'">
                          <svg
                            :width="cellSize * 0.55"
                            :height="cellSize * 0.55"
                            viewBox="0 0 16 16"
                            class="opacity-50"
                          >
                            <line
                              x1="3"
                              y1="3"
                              x2="13"
                              y2="13"
                              stroke="#4A6180"
                              stroke-width="2.5"
                              stroke-linecap="round"
                            />
                            <line
                              x1="13"
                              y1="3"
                              x2="3"
                              y2="13"
                              stroke="#4A6180"
                              stroke-width="2.5"
                              stroke-linecap="round"
                            />
                          </svg>
                        </template>
                      </div>
                    </template>

                    <!-- Out-of-grid piece cells (rotated outside the board) -->
                    <div
                      v-for="(ooc, ooci) in outOfGridCells"
                      :key="'ooc' + ooci"
                      class="absolute border-2"
                      :style="`width:${cellSize}px;height:${cellSize}px;top:${ooc.r * step}px;left:${ooc.c * step}px;background-color:${cellColorForPiece(colorIdForPieceIdx(ooc.pieceIdx))};border-color:${cellBorderForPiece(colorIdForPieceIdx(ooc.pieceIdx))};opacity:${selectedPieceIdx >= 0 && selectedPieceIdx !== ooc.pieceIdx ? 0.2 : 0.7};z-index:5;cursor:pointer;`"
                      @mousedown="startDragFromBoard($event, ooc.pieceIdx, ooc.r, ooc.c)"
                      @touchstart.prevent="startDragFromBoard($event, ooc.pieceIdx, ooc.r, ooc.c)"
                    />

                    <!-- Snap / Pull-out overlays: whole-piece animation -->
                    <div
                      v-for="(ov, ovi) in pieceOverlays"
                      :key="'ov' + ovi"
                      class="absolute pointer-events-none"
                      :class="ov.type === 'snap' ? 'anim-snap-piece' : 'anim-pullout-piece'"
                      :style="pieceOverlayStyle(ov)"
                    >
                      <div
                        class="inline-grid w-full h-full"
                        :style="
                          (() => {
                            const piece = level.pieces[ov.pieceIdx]
                            if (!piece) return ''
                            const cells = getRotated(piece.baseCells, ov.rotation)
                            const minC = Math.min(...cells.map(([, c]) => c))
                            const maxC = Math.max(...cells.map(([, c]) => c))
                            return `grid-template-columns:repeat(${maxC - minC + 1},${cellSize}px);gap:${GAP}px`
                          })()
                        "
                      >
                        <template
                          v-for="pr in (() => {
                            const piece = level.pieces[ov.pieceIdx]
                            if (!piece) return []
                            const cells = getRotated(piece.baseCells, ov.rotation)
                            const minR = Math.min(...cells.map(([r]) => r))
                            const maxR = Math.max(...cells.map(([r]) => r))
                            return Array.from({ length: maxR - minR + 1 }, (_, i) => i + minR)
                          })()"
                          :key="pr"
                        >
                          <div
                            v-for="pc in (() => {
                              const piece = level.pieces[ov.pieceIdx]
                              if (!piece) return []
                              const cells = getRotated(piece.baseCells, ov.rotation)
                              const minC = Math.min(...cells.map(([, c]) => c))
                              const maxC = Math.max(...cells.map(([, c]) => c))
                              return Array.from({ length: maxC - minC + 1 }, (_, i) => i + minC)
                            })()"
                            :key="pc"
                            class="border-2"
                            :style="
                              (() => {
                                const piece = level.pieces[ov.pieceIdx]
                                if (!piece) return ''
                                const grid = piecePreviewGrid(piece.baseCells, ov.rotation)
                                return pieceCellStyle(
                                  `${pr},${pc}`,
                                  grid.ciMap,
                                  cellSize,
                                  ov.pieceIdx,
                                )
                              })()
                            "
                          />
                        </template>
                      </div>
                    </div>

                    <!-- Rotate overlay: renders old-rotation piece shape + animates 90deg turn -->
                    <div
                      v-if="rotateOverlay"
                      class="absolute pointer-events-none anim-piece-rotate"
                      :style="rotateOverlayStyle"
                    >
                      <div
                        class="inline-grid w-full h-full"
                        :style="
                          (() => {
                            const piece = level.pieces[rotateOverlay!.pieceIdx]
                            if (!piece) return ''
                            const cells = getRotated(piece.baseCells, rotateOverlay!.oldRotation)
                            const maxC = Math.max(...cells.map(([, c]) => c))
                            return `grid-template-columns:repeat(${maxC + 1},${cellSize}px);gap:${GAP}px`
                          })()
                        "
                      >
                        <template
                          v-for="pr in (() => {
                            const piece = level.pieces[rotateOverlay!.pieceIdx]
                            if (!piece) return []
                            const cells = getRotated(piece.baseCells, rotateOverlay!.oldRotation)
                            const maxR = Math.max(...cells.map(([r]) => r))
                            return Array.from({ length: maxR + 1 }, (_, i) => i)
                          })()"
                          :key="pr"
                        >
                          <div
                            v-for="pc in (() => {
                              const piece = level.pieces[rotateOverlay!.pieceIdx]
                              if (!piece) return []
                              const cells = getRotated(piece.baseCells, rotateOverlay!.oldRotation)
                              const maxC = Math.max(...cells.map(([, c]) => c))
                              return Array.from({ length: maxC + 1 }, (_, i) => i)
                            })()"
                            :key="pc"
                            :style="`width:${cellSize}px;height:${cellSize}px;${(() => {
                              const piece = level.pieces[rotateOverlay!.pieceIdx]
                              if (!piece) return ''
                              const grid = piecePreviewGrid(
                                piece.baseCells,
                                rotateOverlay!.oldRotation,
                              )
                              const ci = grid.ciMap.get(`${pr},${pc}`)
                              if (ci === undefined) return 'background:transparent'
                              const colorId = colorIdForPieceIdx(rotateOverlay!.pieceIdx)
                              const isSelected = selectedPieceIdx === rotateOverlay!.pieceIdx
                              const cc = COLOR_CONFIGS[colorId] ?? COLOR_CONFIGS[0]!
                              const borderColor = isSelected
                                ? '#F0EDE6'
                                : `hsl(${cc.hue}, 100%, 60%)`
                              const cellSet = grid.set
                              const innerBorder = `2px solid ${cellBorderForPiece(colorId)}`
                              const bT = !cellSet.has(`${pr - 1},${pc}`)
                                ? `3px solid ${borderColor}`
                                : innerBorder
                              const bR = !cellSet.has(`${pr},${pc + 1}`)
                                ? `3px solid ${borderColor}`
                                : innerBorder
                              const bB = !cellSet.has(`${pr + 1},${pc}`)
                                ? `3px solid ${borderColor}`
                                : innerBorder
                              const bL = !cellSet.has(`${pr},${pc - 1}`)
                                ? `3px solid ${borderColor}`
                                : innerBorder
                              return `background-color:${cellColorForPiece(colorId)};border-top:${bT};border-right:${bR};border-bottom:${bB};border-left:${bL};`
                            })()}`"
                          />
                        </template>
                      </div>
                    </div>

                    <!-- Piece outline: SVG contour around each placed piece -->
                  </div>
                  <svg
                    class="absolute top-0 left-0 pointer-events-none"
                    :width="level.cols * step - GAP"
                    :height="level.rows * step - GAP"
                    :style="`z-index:20;overflow:visible`"
                  >
                    <path
                      v-for="(o, oi) in pieceOutlinePaths"
                      :key="'po' + oi"
                      :d="o.pathD"
                      fill="none"
                      :stroke="o.color"
                      stroke-width="3"
                      stroke-linecap="square"
                      stroke-linejoin="miter"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Palette — fixed at bottom -->
          <div
            class="border-t border-border-default/50 bg-bg-deep px-4 py-6 overflow-x-auto flex items-center touch-pan-x"
          >
            <div class="flex gap-2 sm:gap-3 items-center shrink-0 mx-auto">
              <div
                v-for="(piece, idx) in level.pieces"
                :key="idx"
                :data-palette-idx="idx"
                class="border p-3 sm:p-4 transition-all relative flex items-center justify-center active:scale-95"
                :style="`min-width:${palMinCard}px; min-height:${palMinCard}px; ${placed[idx] !== null ? 'opacity:0.25; cursor:not-allowed' : 'cursor:grab; background:var(--color-bg-surface)'}`"
                :class="
                  placed[idx] !== null
                    ? 'border-border-default'
                    : 'border-border-default hover:bg-bg-elevated'
                "
              >
                <div
                  class="flex flex-col pointer-events-none"
                  :style="`gap:${palCellSize > 16 ? 2 : 2}px`"
                >
                  <div
                    v-for="pr in palettePreviews[idx]!.rowArr"
                    :key="pr"
                    class="flex"
                    :style="`gap:${palCellSize > 16 ? 2 : 2}px`"
                  >
                    <div
                      v-for="pc in palettePreviews[idx]!.colArr"
                      :key="pc"
                      class="border"
                      :style="
                        (() => {
                          const grid = palettePreviews[idx]!
                          const ci = grid.ciMap.get(`${pr},${pc}`)
                          const colorId = colorIdForPieceIdx(idx)
                          const sz = `width:${palCellSize}px;height:${palCellSize}px;`
                          return ci !== undefined
                            ? sz +
                                `background-color:${cellColorForPiece(colorId)};border-color:${cellBorderForPiece(colorId)}`
                            : sz + 'border-color:transparent;background:transparent'
                        })()
                      "
                    />
                  </div>
                </div>
                <div
                  v-if="placed[idx] === null"
                  class="absolute inset-0 cursor-pointer"
                  @mousedown="startDragFromPalette($event, idx)"
                  @touchstart="startDragFromPalette($event, idx)"
                />
                <div
                  v-if="placed[idx] !== null"
                  class="absolute inset-0 flex items-center justify-center bg-bg-deep/60"
                >
                  <Icon icon="lucide:check" class="size-3.5 text-accent-sky" />
                </div>
              </div>
            </div>
          </div>
          <div class="pb-safe bg-bg-deep"></div>
        </div>
      </div>
    </Transition>

    <!-- Win overlay -->
    <Transition name="win-overlay">
      <div v-if="won" class="fixed inset-0 z-40 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60" />
        <div
          class="relative z-10 flex flex-col items-center gap-6 px-8 py-10 border-2 border-accent-sky/40 bg-bg-deep/95 backdrop-blur-sm max-w-xs w-full mx-4 anim-win-card"
        >
          <div class="text-center">
            <div class="font-display text-3xl font-bold text-accent-sky mb-2">Hoàn thành!</div>
            <div class="text-text-dim text-sm font-display">
              {{
                isFreeplay ? 'Tự do' : `${DIFFICULTY_LABELS[selectedDifficulty]} — Màn ${level.id}`
              }}
            </div>
          </div>
          <div class="flex items-center justify-center gap-6">
            <div class="flex flex-col items-center">
              <span
                class="flex items-center gap-1 text-accent-amber font-display text-lg font-bold"
              >
                <Icon icon="lucide:flame" class="size-4" />
                {{ currentStreak }}
              </span>
              <span class="text-text-dim text-[10px] font-display">Chuỗi</span>
            </div>
            <template v-if="timerEnabled">
              <div class="w-px h-8 bg-border-default" />
              <div class="flex flex-col items-center">
                <span class="text-accent-sky font-display text-lg font-bold">{{ lastScore }}</span>
                <span class="text-text-dim text-[10px] font-display"
                  >Điểm
                  <span class="text-text-dim/60"
                    >×{{
                      lastMultiplier % 1 === 0 ? lastMultiplier : lastMultiplier.toFixed(2)
                    }}</span
                  ></span
                >
              </div>
            </template>
            <div class="w-px h-8 bg-border-default" />
            <div class="flex flex-col items-center">
              <span class="text-accent-coral font-display text-lg font-bold">{{ bestStreak }}</span>
              <span class="text-text-dim text-[10px] font-display">Kỷ lục</span>
            </div>
          </div>
          <div class="flex flex-col gap-2.5 w-full">
            <button
              v-if="isFreeplay"
              class="w-full border-2 border-accent-sky px-5 py-3 font-display text-sm tracking-wider text-accent-sky uppercase transition-all hover:bg-accent-sky hover:text-bg-deep active:scale-95"
              @click="
                sfx.click();
                startRandomPuzzle()
              "
            >
              Tiếp theo
            </button>
            <button
              v-else-if="selectedLevelIdx < packSize(selectedDifficulty) - 1"
              class="w-full border-2 border-accent-sky px-5 py-3 font-display text-sm tracking-wider text-accent-sky uppercase transition-all hover:bg-accent-sky hover:text-bg-deep active:scale-95"
              @click="
                sfx.click();
                nextPackLevel()
              "
            >
              Tiếp theo
            </button>
            <button
              v-else
              class="w-full border-2 border-accent-sky px-5 py-3 font-display text-sm tracking-wider text-accent-sky uppercase transition-all hover:bg-accent-sky hover:text-bg-deep active:scale-95"
              @click="
                sfx.click();
                goToLevelSelect()
              "
            >
              Hoàn thành
            </button>
            <button
              class="w-full border-2 border-border-default px-5 py-2.5 font-display text-xs tracking-wider text-text-dim uppercase transition-all hover:border-text-dim hover:text-text-secondary active:scale-95"
              @click="
                sfx.click();
                goToLevelSelect()
              "
            >
              Trở về
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Pause overlay -->
    <Transition name="win-overlay">
      <div v-if="showPause" class="fixed inset-0 z-40 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60" />
        <div
          class="relative z-10 flex flex-col items-center gap-5 px-8 py-8 border-2 border-accent-sky/40 bg-bg-deep/95 backdrop-blur-sm max-w-xs w-full mx-4 anim-win-card"
        >
          <div class="text-center">
            <div class="font-display text-xl font-bold text-accent-sky mb-2">Tạm dừng</div>
            <div class="text-text-dim text-sm font-display tabular-nums">
              Thời gian còn lại: <span class="text-accent-amber font-bold">{{ timerDisplay }}</span>
            </div>
          </div>
          <div class="flex gap-3 w-full">
            <button
              class="flex-1 border-2 border-border-default px-4 py-2.5 font-display text-sm tracking-wider text-text-dim uppercase transition-all hover:border-text-dim hover:text-text-secondary active:scale-95"
              @click="
                sfx.click();
                goToLevelSelect()
              "
            >
              Trở về
            </button>
            <button
              class="flex-1 border-2 border-accent-sky px-4 py-2.5 font-display text-sm tracking-wider text-accent-sky uppercase transition-all hover:bg-accent-sky hover:text-bg-deep active:scale-95"
              @click="
                sfx.click();
                resumeTimer()
              "
            >
              Tiếp tục
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Time expired overlay -->
    <Transition name="win-overlay">
      <div v-if="timerExpired && !won" class="fixed inset-0 z-40 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60" />
        <div
          class="relative z-10 flex flex-col items-center gap-5 px-8 py-8 border-2 border-accent-coral/40 bg-bg-deep/95 backdrop-blur-sm max-w-xs w-full mx-4 anim-win-card"
        >
          <div class="text-center">
            <div class="font-display text-xl font-bold text-accent-coral mb-2">Hết giờ!</div>
            <div class="text-text-dim text-sm font-display">Bạn đã hết thời gian</div>
          </div>
          <div class="flex flex-col gap-2.5 w-full">
            <div class="flex gap-3 w-full">
              <button
                class="flex-1 border-2 border-border-default px-4 py-2.5 font-display text-sm tracking-wider text-text-dim uppercase transition-all hover:border-text-dim hover:text-text-secondary active:scale-95"
                @click="
                  sfx.click();
                  goToLevelSelect()
                "
              >
                Trở về
              </button>
              <button
                class="flex-1 border-2 border-accent-coral px-4 py-2.5 font-display text-sm tracking-wider text-accent-coral uppercase transition-all hover:bg-accent-coral hover:text-bg-deep active:scale-95"
                @click="
                  sfx.click();
                  resetStreak();
                  init()
                "
              >
                Chơi lại
              </button>
            </div>
            <button
              v-if="level.solution && !showSolutionConfirm"
              class="w-full border-2 border-accent-amber/40 px-4 py-2 font-display text-xs tracking-wider text-accent-amber/60 uppercase transition-all hover:border-accent-amber hover:text-accent-amber active:scale-95"
              @click="
                sfx.click();
                currentStreak > 0 ? (showSolutionConfirm = true) : showSolution()
              "
            >
              <Icon icon="lucide:eye" class="size-3 inline-block mr-1 -mt-0.5" />Xem đáp án
            </button>
            <div v-if="showSolutionConfirm" class="w-full flex flex-col gap-2">
              <div class="text-center text-accent-amber text-xs font-display">
                Chuỗi thắng
                <span class="font-bold">{{ currentStreak }}</span> sẽ bị mất
              </div>
              <div class="flex gap-2">
                <button
                  class="flex-1 border-2 border-border-default px-3 py-1.5 font-display text-xs tracking-wider text-text-dim uppercase transition-all hover:border-text-dim hover:text-text-secondary active:scale-95"
                  @click="
                    sfx.click();
                    showSolutionConfirm = false
                  "
                >
                  Hủy
                </button>
                <button
                  class="flex-1 border-2 border-accent-amber/40 px-3 py-1.5 font-display text-xs tracking-wider text-accent-amber uppercase transition-all hover:border-accent-amber hover:text-accent-amber active:scale-95"
                  @click="
                    sfx.click();
                    showSolutionConfirm = false;
                    showSolution()
                  "
                >
                  Xem đáp án
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Reset confirm overlay -->
    <Transition name="win-overlay">
      <div v-if="showResetConfirm" class="fixed inset-0 z-40 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60" @click="showResetConfirm = false" />
        <div
          class="relative z-10 flex flex-col items-center gap-5 px-8 py-8 border-2 border-accent-coral/40 bg-bg-deep/95 backdrop-blur-sm max-w-xs w-full mx-4 anim-win-card"
        >
          <div class="text-center">
            <div class="font-display text-xl font-bold text-accent-coral mb-2">Chơi lại?</div>
            <div class="text-text-dim text-sm font-display">
              Bạn sẽ mất chuỗi hiện tại
              <span class="text-accent-amber font-bold">{{ currentStreak }}</span>
            </div>
          </div>
          <div class="flex gap-3 w-full">
            <button
              class="flex-1 border-2 border-border-default px-4 py-2.5 font-display text-sm tracking-wider text-text-dim uppercase transition-all hover:border-text-dim hover:text-text-secondary active:scale-95"
              @click="
                sfx.click();
                showResetConfirm = false
              "
            >
              Quay lại
            </button>
            <button
              class="flex-1 border-2 border-accent-coral px-4 py-2.5 font-display text-sm tracking-wider text-accent-coral uppercase transition-all hover:bg-accent-coral hover:text-bg-deep active:scale-95"
              @click="
                sfx.click();
                confirmReset()
              "
            >
              Chơi lại
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Mode reset confirm overlay -->
    <Transition name="win-overlay">
      <div v-if="showModeResetConfirm" class="fixed inset-0 z-40 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60" @click="showModeResetConfirm = false" />
        <div
          class="relative z-10 flex flex-col items-center gap-5 px-8 py-8 border-2 border-accent-coral/40 bg-bg-deep/95 backdrop-blur-sm max-w-xs w-full mx-4 anim-win-card"
        >
          <div class="text-center">
            <div class="font-display text-xl font-bold text-accent-coral mb-2">
              Đặt lại tiến trình?
            </div>
            <div class="text-text-dim text-sm font-display">
              Tất cả tiến trình chế độ
              <span class="text-accent-amber font-bold">{{
                modeResetTarget === '1c' ? '1 Màu' : modeResetTarget === '2c' ? '2 Màu' : '3 Màu'
              }}</span>
              sẽ bị xóa
            </div>
          </div>
          <div class="flex gap-3 w-full">
            <button
              class="flex-1 border-2 border-border-default px-4 py-2.5 font-display text-sm tracking-wider text-text-dim uppercase transition-all hover:border-text-dim hover:text-text-secondary active:scale-95"
              @click="
                sfx.click();
                showModeResetConfirm = false
              "
            >
              Hủy
            </button>
            <button
              class="flex-1 border-2 border-accent-coral px-4 py-2.5 font-display text-sm tracking-wider text-accent-coral uppercase transition-all hover:bg-accent-coral hover:text-bg-deep active:scale-95"
              @click="
                sfx.click();
                confirmModeReset()
              "
            >
              Đặt lại
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Floating drag piece -->
    <div
      v-if="drag && drag.hasMoved"
      class="fixed pointer-events-none z-50 anim-pickup"
      :style="`left:${drag.x}px; top:${drag.y}px; transform:translate(-50%,-50%); margin-left:${dragVisualOffset.mx}px; margin-top:${dragVisualOffset.my}px`"
    >
      <div class="flex flex-col opacity-80 drop-shadow-lg" :style="`gap:${GAP}px`">
        <div
          v-for="pr in piecePreviewGrid(level.pieces[drag.pieceIdx]!.baseCells, drag.rotation)
            .rowArr"
          :key="pr"
          class="flex"
          :style="`gap:${GAP}px`"
        >
          <div
            v-for="pc in piecePreviewGrid(level.pieces[drag.pieceIdx]!.baseCells, drag.rotation)
              .colArr"
            :key="pc"
            class="border-2"
            :style="
              pieceCellStyle(
                `${pr},${pc}`,
                piecePreviewGrid(level.pieces[drag.pieceIdx]!.baseCells, drag.rotation).ciMap,
                cellSize,
                drag.pieceIdx,
              )
            "
          />
        </div>
      </div>
    </div>

    <!-- Fly-back eject piece -->
    <div
      v-if="flybackAnim"
      class="fixed pointer-events-none z-50"
      :style="`left:${flybackAnim.active ? flybackAnim.toX : flybackAnim.fromX}px; top:${flybackAnim.active ? flybackAnim.toY : flybackAnim.fromY}px; transform:translate(-50%,-50%) ${flybackAnim.active ? 'scale(0.3)' : 'scale(1)'}; opacity:${flybackAnim.active ? '0' : '0.8'}; transition: all 0.3s ease-in`"
    >
      <div class="flex flex-col drop-shadow-lg" :style="`gap:${GAP}px`">
        <div
          v-for="pr in piecePreviewGrid(
            level.pieces[flybackAnim.pieceIdx]!.baseCells,
            flybackAnim.rotation,
          ).rowArr"
          :key="pr"
          class="flex"
          :style="`gap:${GAP}px`"
        >
          <div
            v-for="pc in piecePreviewGrid(
              level.pieces[flybackAnim.pieceIdx]!.baseCells,
              flybackAnim.rotation,
            ).colArr"
            :key="pc"
            class="border-2"
            :style="
              pieceCellStyle(
                `${pr},${pc}`,
                piecePreviewGrid(
                  level.pieces[flybackAnim.pieceIdx]!.baseCells,
                  flybackAnim.rotation,
                ).ciMap,
                cellSize,
                flybackAnim.pieceIdx,
              )
            "
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Range slider (amber) ── */
.accent-amber::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-accent-amber, #ffb830);
  cursor: pointer;
}
.accent-amber::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: none;
  border-radius: 50%;
  background: var(--color-accent-amber, #ffb830);
  cursor: pointer;
}

/* ── J2 themed scrollbar ── */
.j2-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-default, #253549) transparent;
}
.j2-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.j2-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.j2-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-border-default, #253549);
  border-radius: 3px;
}
.j2-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--color-bg-elevated, #1e2f42);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Win overlay */
.win-overlay-enter-active {
  transition: opacity 0.3s ease;
}
.win-overlay-enter-active .anim-win-card {
  animation: win-card-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
}
.win-overlay-leave-active {
  transition: opacity 0.2s ease;
}
.win-overlay-enter-from {
  opacity: 0;
}
.win-overlay-leave-to {
  opacity: 0;
}
@keyframes win-card-in {
  0% {
    transform: scale(0.85) translateY(20px);
    opacity: 0;
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

/* ── Screen transitions ── */
.screen-fwd-leave-active {
  animation: screen-exit-up 0.18s ease-in forwards;
}
.screen-fwd-enter-active {
  animation: screen-enter-up 0.25s ease-out forwards;
}
.screen-back-leave-active {
  animation: screen-exit-down 0.18s ease-in forwards;
}
.screen-back-enter-active {
  animation: screen-enter-down 0.25s ease-out forwards;
}

@keyframes screen-exit-up {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(-8%);
    opacity: 0;
  }
}
@keyframes screen-enter-up {
  0% {
    transform: translateY(15%);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}
@keyframes screen-exit-down {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(8%);
    opacity: 0;
  }
}
@keyframes screen-enter-down {
  0% {
    transform: translateY(-15%);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Title screen entrance */
.anim-title-in {
  animation: title-in 0.5s ease-out both;
}
@keyframes title-in {
  0% {
    transform: translateY(20px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}
.anim-fade-in-delay {
  animation: fade-in 0.5s ease 0.3s both;
}
.anim-fade-in-delay-2 {
  animation: fade-in 0.5s ease 0.6s both;
}

/* Tab content crossfade */
.tab-content-enter-active {
  animation: tab-in 0.2s ease-out both;
}
.tab-content-leave-active {
  animation: tab-out 0.12s ease-in both;
}
@keyframes tab-in {
  0% {
    opacity: 0;
    transform: translateY(6px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes tab-out {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-4px);
  }
}

@keyframes fade-in {
  0% {
    opacity: 0;
    transform: translateY(8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Safe area padding for bottom bar */
.pb-safe {
  padding-bottom: max(12px, env(safe-area-inset-bottom));
}

/* Snap into board — whole piece (clean pop, no pre-ghost) */
.anim-snap-piece {
  animation: snap-piece 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes snap-piece {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.06);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Piece rotate overlay — literal 90deg turn */
.anim-piece-rotate {
  animation: piece-rotate 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
@keyframes piece-rotate {
  0% {
    transform: rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: rotate(90deg);
    opacity: 1;
  }
}

/* Pull out of board — whole piece */
.anim-pullout-piece {
  animation: pullout-piece 0.25s ease-out forwards;
}
@keyframes pullout-piece {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0;
  }
}

/* Pick-up: subtle lift when grabbing a piece */
.anim-pickup {
  animation: pick-up 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes pick-up {
  0% {
    transform: translate(-50%, -50%) scale(0.85);
    opacity: 0.5;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
  }
  100% {
    transform: translate(-50%, -50%) scale(1.05);
    opacity: 0.8;
    filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3));
  }
}
</style>
