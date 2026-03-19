<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useClipboard, useEventListener, useIntervalFn, useWindowSize } from '@vueuse/core'
import type { BlindMazeStats, MazeData, MazePoint, TrailPoint } from './types'
import { formatTime, getDateKey, getTodaysMaze } from './utils'
import {
  getShareText,
  hasPlayedToday,
  loadStats,
  loadTodayResult,
  recordGameComplete,
  recordPlayedSession,
} from './storage'

const logoUrl = '/shared/web-logo.svg'

const route = useRoute()
const router = useRouter()
const { copy } = useClipboard()

const canvasRef = ref<HTMLCanvasElement | null>(null)

const currentDate = computed(() => {
  const value = route.query.date
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
})
const isHistoricalGame = computed(() => currentDate.value !== null)

const maze = ref<MazeData | null>(null)
const playerPos = ref<MazePoint>({ x: 0, y: 0 })
const playerVisualPos = ref<MazePoint>({ x: 0, y: 0 })
const trail = ref<TrailPoint[]>([])
const moves = ref(0)
const gameComplete = ref(false)
const completionTime = ref<number | null>(null)
const visibilityRadius = ref(4)
const isRevealActive = ref(false)
const sosCooldownUntil = ref(0)
const nowTick = ref(Date.now())
const stats = ref<BlindMazeStats>(loadStats())
const showHelp = ref(false)
const showStats = ref(false)
const showVictory = ref(false)
const showCalendar = ref(false)
const message = ref('')
const selectedHistoricalDate = ref(getDateKey())

const cellSize = 14
const wallWidth = 4
const buffer = 1
const trailDuration = 8000
const colors = {
  background: '#08111A',
  wall: '#F4E6C8',
  path: '#1C2D3D',
  player: '#FF6B4A',
  exit: '#FF4D4F',
  goalArrow: '#00E5FF',
  trail: '#7DD3FC',
  fog: '#08111A',
}

let animationFrame = 0
let sessionStartTime = 0
let revealTimeout = 0
let messageTimeout = 0

const { pause: pauseTimer, resume: resumeTimer } = useIntervalFn(
  () => {
    timerDisplay.value = formatTime(getElapsedTime())
  },
  1000,
  { immediate: false },
)
const { pause: pauseSosTicker } = useIntervalFn(
  () => {
    nowTick.value = Date.now()
  },
  250,
  { immediate: true },
)

const timerDisplay = ref('00:00')
const mazeNumber = computed(() => maze.value?.mazeNumber ?? 0)
const canShare = computed(() => gameComplete.value && completionTime.value !== null)
const recentHistory = computed(() => [...stats.value.history].slice(-5).reverse())
const playedToday = computed(() => hasPlayedToday() && !isHistoricalGame.value)
const isSosLocked = computed(() => isRevealActive.value || nowTick.value < sosCooldownUntil.value)
const sosCountdown = computed(() => {
  const remainingMs = sosCooldownUntil.value - nowTick.value
  if (remainingMs <= 0) return 0
  return Math.ceil(remainingMs / 1000)
})

function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const quickDateOptions = computed(() => {
  const base = new Date()
  base.setHours(0, 0, 0, 0)

  return [
    { label: 'Hôm nay', value: getDateKey() },
    {
      label: 'Hôm qua',
      value: formatLocalDate(new Date(base.getTime() - 86400000)),
    },
    {
      label: '7 ngày trước',
      value: formatLocalDate(new Date(base.getTime() - 86400000 * 7)),
    },
  ]
})
const canStepDateBackward = computed(() => selectedHistoricalDate.value > '2026-01-01')
const canStepDateForward = computed(() => selectedHistoricalDate.value < getDateKey())
const { width: windowWidth, height: windowHeight } = useWindowSize()
const canvasDisplayStyle = computed(() => {
  const mazeData = maze.value
  if (!mazeData) return {}

  const canvasWidth = mazeData.width * cellSize + wallWidth
  const canvasHeight = mazeData.height * cellSize + wallWidth
  const isDesktop = windowWidth.value >= 1024
  const horizontalPadding = windowWidth.value >= 640 ? 48 : 32
  const reservedColumns = isDesktop ? 420 + 24 : 0
  const maxWidth = Math.max(260, windowWidth.value - horizontalPadding - reservedColumns)
  const maxHeight = Math.max(260, windowHeight.value - 200)
  const scale = Math.min(maxWidth / canvasWidth, maxHeight / canvasHeight, 1)
  const size = Math.floor(Math.min(canvasWidth * scale, canvasHeight * scale))

  return {
    width: `${size}px`,
    height: `${size}px`,
    maxWidth: '100%',
    maxHeight: 'calc(100vh - 200px)',
    aspectRatio: '1 / 1',
    margin: '0 auto',
  }
})

function getElapsedTime(): number {
  if (!sessionStartTime) return 0
  return Math.floor((Date.now() - sessionStartTime) / 1000)
}

function startTimer() {
  sessionStartTime = Date.now()
  timerDisplay.value = '00:00'
  resumeTimer()
}

function stopTimer() {
  pauseTimer()
}

function initGame() {
  stopTimer()
  cancelAnimationFrame(animationFrame)
  window.clearTimeout(revealTimeout)
  isRevealActive.value = false
  sosCooldownUntil.value = 0
  nowTick.value = Date.now()

  const selectedDate = currentDate.value
  if (selectedDate && selectedDate > getDateKey()) return

  maze.value = getTodaysMaze(selectedDate)
  if (!maze.value) return

  if (hasPlayedToday() && !isHistoricalGame.value) {
    const todayData = loadTodayResult()
    playerPos.value = { ...maze.value.end }
    playerVisualPos.value = { ...maze.value.end }
    trail.value = []
    visibilityRadius.value = 1000
    moves.value = todayData?.moves ?? 0
    completionTime.value = todayData?.time ?? null
    timerDisplay.value = formatTime(todayData?.time ?? 0)
    gameComplete.value = true
    if (todayData?.won) {
      message.value = `Bạn đã thoát mê cung hôm nay trong ${todayData.moves} bước.`
    }
  } else {
    playerPos.value = { ...maze.value.start }
    playerVisualPos.value = { ...maze.value.start }
    trail.value = [{ ...maze.value.start, time: Date.now() }]
    moves.value = 0
    message.value = ''
    gameComplete.value = false
    completionTime.value = null
    visibilityRadius.value = 4
    startTimer()
  }

  draw()
  startRenderLoop()
}

function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
}

function canMoveTo(x: number, y: number): boolean {
  const mazeData = maze.value
  if (!mazeData) return false
  if (x < 0 || x >= mazeData.width || y < 0 || y >= mazeData.height) return false

  const dx = x - playerPos.value.x
  const dy = y - playerPos.value.y
  if (Math.abs(dx) + Math.abs(dy) !== 1) return false

  const currentCell = mazeData.cells[playerPos.value.y]?.[playerPos.value.x]
  if (!currentCell) return false
  if (dx === 1 && currentCell.walls.east) return false
  if (dx === -1 && currentCell.walls.west) return false
  if (dy === 1 && currentCell.walls.south) return false
  if (dy === -1 && currentCell.walls.north) return false

  return true
}

function movePlayer(dx: number, dy: number) {
  if (gameComplete.value) return

  const nextX = playerPos.value.x + dx
  const nextY = playerPos.value.y + dy
  if (!canMoveTo(nextX, nextY)) return

  playerPos.value = { x: nextX, y: nextY }
  moves.value++

  const now = Date.now()
  const existing = trail.value.find((item) => item.x === nextX && item.y === nextY)
  if (existing) existing.time = now
  else trail.value.push({ x: nextX, y: nextY, time: now })

  trail.value = trail.value.filter((item) => now - item.time < trailDuration)

  if (maze.value && nextX === maze.value.end.x && nextY === maze.value.end.y) {
    handleVictory()
  }
}

function handleVictory() {
  if (!maze.value) return
  gameComplete.value = true
  stopTimer()
  completionTime.value = getElapsedTime()
  if (!isHistoricalGame.value && completionTime.value !== null) {
    recordGameComplete(true, moves.value, completionTime.value, maze.value.mazeNumber)
    stats.value = loadStats()
  }
  showVictory.value = true
}

function handleKeydown(event: KeyboardEvent) {
  let dx = 0
  let dy = 0

  switch (event.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      dy = -1
      break
    case 'ArrowDown':
    case 's':
    case 'S':
      dy = 1
      break
    case 'ArrowLeft':
    case 'a':
    case 'A':
      dx = -1
      break
    case 'ArrowRight':
    case 'd':
    case 'D':
      dx = 1
      break
    default:
      return
  }

  event.preventDefault()
  movePlayer(dx, dy)
}

function handleCanvasClick(event: MouseEvent) {
  const mazeData = maze.value
  const canvas = canvasRef.value
  if (!mazeData || !canvas) return

  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const clickX = (event.clientX - rect.left) * scaleX
  const clickY = (event.clientY - rect.top) * scaleY
  const cellX = Math.floor((clickX - wallWidth) / cellSize)
  const cellY = Math.floor((clickY - wallWidth) / cellSize)

  if (canMoveTo(cellX, cellY)) {
    movePlayer(cellX - playerPos.value.x, cellY - playerPos.value.y)
  }
}

function draw() {
  const mazeData = maze.value
  const canvas = canvasRef.value
  if (!mazeData || !canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = mazeData.width * cellSize + wallWidth
  canvas.height = mazeData.height * cellSize + wallWidth

  ctx.fillStyle = colors.background
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (let y = 0; y < mazeData.height; y++) {
    for (let x = 0; x < mazeData.width; x++) {
      const cell = mazeData.cells[y]?.[x]
      if (!cell) continue

      const distance = getDistance(x, y, playerPos.value.x, playerPos.value.y)
      if (distance > visibilityRadius.value + 4) continue

      const px = x * cellSize + wallWidth
      const py = y * cellSize + wallWidth

      ctx.fillStyle = colors.path
      ctx.fillRect(px, py, cellSize - wallWidth, cellSize - wallWidth)

      if (x === mazeData.end.x && y === mazeData.end.y) {
        ctx.fillStyle = 'rgba(255, 77, 79, 0.26)'
        ctx.fillRect(px - 1, py - 1, cellSize - wallWidth + 2, cellSize - wallWidth + 2)
        ctx.fillStyle = colors.exit
        ctx.fillRect(
          px + buffer,
          py + buffer,
          cellSize - wallWidth - buffer * 2,
          cellSize - wallWidth - buffer * 2,
        )
      }

      ctx.fillStyle = colors.wall
      if (cell.walls.north) ctx.fillRect(px - wallWidth, py - wallWidth, cellSize, wallWidth)
      if (cell.walls.east)
        ctx.fillRect(px + cellSize - wallWidth, py - wallWidth, wallWidth, cellSize)
      if (cell.walls.south)
        ctx.fillRect(px - wallWidth, py + cellSize - wallWidth, cellSize, wallWidth)
      if (cell.walls.west) ctx.fillRect(px - wallWidth, py - wallWidth, wallWidth, cellSize)
    }
  }

  drawTrail(ctx)
  drawPlayer(ctx)
  drawGoalArrow(ctx, canvas)
  drawFog(ctx, canvas)
}

function drawTrail(ctx: CanvasRenderingContext2D) {
  if (trail.value.length < 2) return
  const now = Date.now()
  const ordered = [...trail.value].sort((a, b) => a.time - b.time)

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (let i = 1; i < ordered.length; i++) {
    const prev = ordered[i - 1]
    const curr = ordered[i]
    if (!prev || !curr) continue

    const age = now - prev.time
    const alpha = Math.max(0.05, 0.6 * (1 - age / trailDuration))
    const dist = Math.abs(curr.x - prev.x) + Math.abs(curr.y - prev.y)
    if (dist !== 1) continue

    const prevPx = prev.x * cellSize + wallWidth + (cellSize - wallWidth) / 2
    const prevPy = prev.y * cellSize + wallWidth + (cellSize - wallWidth) / 2
    const currPx = curr.x * cellSize + wallWidth + (cellSize - wallWidth) / 2
    const currPy = curr.y * cellSize + wallWidth + (cellSize - wallWidth) / 2

    ctx.beginPath()
    ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`
    ctx.lineWidth = cellSize - wallWidth - buffer * 2
    ctx.moveTo(prevPx, prevPy)
    ctx.lineTo(currPx, currPy)
    ctx.stroke()
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D) {
  const px = playerVisualPos.value.x * cellSize + wallWidth + buffer
  const py = playerVisualPos.value.y * cellSize + wallWidth + buffer
  const size = cellSize - wallWidth - buffer * 2

  ctx.fillStyle = 'rgba(255, 107, 74, 0.25)'
  ctx.fillRect(px - 1, py - 1, size + 2, size + 2)
  ctx.fillStyle = colors.player
  ctx.fillRect(px, py, size, size)
}

function drawGoalArrow(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  const mazeData = maze.value
  if (!mazeData || !isRevealActive.value) return

  const targetX = mazeData.end.x * cellSize + wallWidth + (cellSize - wallWidth) / 2
  const targetY = mazeData.end.y * cellSize + wallWidth + (cellSize - wallWidth) / 2
  const arrowLength = 26
  const edgePadding = 34

  let startX = targetX
  let startY = targetY

  if (mazeData.end.x < mazeData.width / 2) startX = targetX - arrowLength - edgePadding
  else startX = targetX + arrowLength + edgePadding

  if (mazeData.end.y < mazeData.height / 2) startY = targetY - arrowLength - edgePadding
  else startY = targetY + arrowLength + edgePadding

  startX = Math.max(14, Math.min(canvas.width - 14, startX))
  startY = Math.max(18, Math.min(canvas.height - 14, startY))

  const dx = targetX - startX
  const dy = targetY - startY
  const angle = Math.atan2(dy, dx)
  const tipDistanceFromExit = 12
  const headLength = 12
  const tipX = targetX - Math.cos(angle) * tipDistanceFromExit
  const tipY = targetY - Math.sin(angle) * tipDistanceFromExit
  const baseX = tipX - Math.cos(angle) * arrowLength
  const baseY = tipY - Math.sin(angle) * arrowLength
  if (![startX, startY, targetX, targetY, angle, tipX, tipY, baseX, baseY].every(Number.isFinite))
    return

  ctx.save()
  try {
    ctx.strokeStyle = colors.goalArrow
    ctx.fillStyle = colors.goalArrow
    ctx.lineWidth = 3
    ctx.lineCap = 'round'

    ctx.beginPath()
    ctx.moveTo(baseX, baseY)
    ctx.lineTo(tipX, tipY)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(tipX, tipY)
    ctx.lineTo(
      tipX - headLength * Math.cos(angle - Math.PI / 6),
      tipY - headLength * Math.sin(angle - Math.PI / 6),
    )
    ctx.lineTo(
      tipX - headLength * Math.cos(angle + Math.PI / 6),
      tipY - headLength * Math.sin(angle + Math.PI / 6),
    )
    ctx.closePath()
    ctx.fill()

    ctx.font = 'bold 11px sans-serif'
    ctx.fillText('EXIT', baseX - Math.cos(angle) * 18 - 12, baseY - Math.sin(angle) * 18 - 8)
  } finally {
    ctx.restore()
  }
}

function drawFog(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  const playerPx = playerVisualPos.value.x * cellSize + wallWidth + (cellSize - wallWidth) / 2
  const playerPy = playerVisualPos.value.y * cellSize + wallWidth + (cellSize - wallWidth) / 2
  const innerRadius = (visibilityRadius.value + 0.5) * cellSize
  const outerRadius = (visibilityRadius.value + 2.5) * cellSize

  const gradient = ctx.createRadialGradient(
    playerPx,
    playerPy,
    innerRadius,
    playerPx,
    playerPy,
    outerRadius,
  )
  gradient.addColorStop(0, 'rgba(15, 25, 35, 0)')
  gradient.addColorStop(0.5, 'rgba(15, 25, 35, 0.3)')
  gradient.addColorStop(0.8, 'rgba(15, 25, 35, 0.55)')
  gradient.addColorStop(1, 'rgba(15, 25, 35, 0.85)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.beginPath()
  ctx.rect(0, 0, canvas.width, canvas.height)
  ctx.arc(playerPx, playerPy, outerRadius, 0, Math.PI * 2, true)
  ctx.fillStyle = colors.fog
  ctx.fill()
}

function startRenderLoop() {
  cancelAnimationFrame(animationFrame)
  let lastTime = Date.now()

  const loop = () => {
    const now = Date.now()
    const dt = (now - lastTime) / 1000
    lastTime = now

    const dx = playerPos.value.x - playerVisualPos.value.x
    const dy = playerPos.value.y - playerVisualPos.value.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > 0.01) {
      const move = Math.min(dist, 12 * dt)
      playerVisualPos.value.x += (dx / dist) * move
      playerVisualPos.value.y += (dy / dist) * move
    } else {
      playerVisualPos.value = { ...playerPos.value }
    }

    draw()
    animationFrame = requestAnimationFrame(loop)
  }

  animationFrame = requestAnimationFrame(loop)
}

function revealMaze() {
  if (isSosLocked.value || gameComplete.value) return
  const saved = visibilityRadius.value
  isRevealActive.value = true
  sosCooldownUntil.value = Date.now() + 60000
  sessionStartTime -= 10000
  timerDisplay.value = formatTime(getElapsedTime())
  visibilityRadius.value = 1000
  window.clearTimeout(revealTimeout)
  revealTimeout = window.setTimeout(() => {
    visibilityRadius.value = saved
    isRevealActive.value = false
  }, 1500)
}

async function handleShare() {
  if (!maze.value) return
  const text = getShareText(
    maze.value.mazeNumber,
    moves.value,
    completionTime.value ?? getElapsedTime(),
  )
  await copy(text)
  message.value = 'Đã copy kết quả'
  window.clearTimeout(messageTimeout)
  messageTimeout = window.setTimeout(() => {
    message.value = ''
  }, 2000)
}

function moveUp() {
  movePlayer(0, -1)
}

function moveDown() {
  movePlayer(0, 1)
}

function moveLeft() {
  movePlayer(-1, 0)
}

function moveRight() {
  movePlayer(1, 0)
}

function pickHistoricalDate(value: string) {
  selectedHistoricalDate.value = value
}

function shiftHistoricalDate(days: number) {
  const current = selectedHistoricalDate.value || getDateKey()
  const [year, month, day] = current.split('-').map(Number)
  const date = new Date(year ?? 2026, (month ?? 1) - 1, day ?? 1)
  date.setDate(date.getDate() + days)

  const nextValue = getDateKey(
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
  )
  if (nextValue < '2026-01-01') {
    selectedHistoricalDate.value = '2026-01-01'
    return
  }

  const today = getDateKey()
  if (nextValue > today) {
    selectedHistoricalDate.value = today
    return
  }

  selectedHistoricalDate.value = nextValue
}

function openHistoricalMaze() {
  if (!selectedHistoricalDate.value) return
  showCalendar.value = false
  router.push({
    path: route.path,
    query: { date: selectedHistoricalDate.value },
  })
}

useEventListener(window, 'keydown', handleKeydown)

onMounted(() => {
  initGame()
})

watch(currentDate, () => {
  selectedHistoricalDate.value = currentDate.value ?? getDateKey()
  initGame()
})

watch(
  [timerDisplay, gameComplete, maze],
  () => {
    if (isHistoricalGame.value || gameComplete.value || !maze.value || hasPlayedToday()) return
    if (getElapsedTime() < 300) return

    recordPlayedSession(maze.value.mazeNumber, getElapsedTime())
    stats.value = loadStats()
  },
  { flush: 'post' },
)

onUnmounted(() => {
  stopTimer()
  pauseSosTicker()
  cancelAnimationFrame(animationFrame)
  window.clearTimeout(revealTimeout)
  window.clearTimeout(messageTimeout)
})
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-bg-deep px-4 py-2 text-text-primary sm:px-6">
    <img
      :src="logoUrl"
      alt="J2TEAMlogo"
      class="pointer-events-none absolute right-3 top-3 z-0 w-28 rotate-12 opacity-70 mix-blend-screen drop-shadow-[0_0_18px_rgba(255,107,74,0.18)] sm:right-5 sm:top-4 sm:w-36 md:w-44"
      style="filter: brightness(0) invert(1)"
    />
    <div class="mx-auto flex w-full max-w-[1320px] flex-col gap-2">
      <div class="animate-fade-up">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-1.5 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          ← Trang chủ
        </RouterLink>
      </div>

      <div class="animate-fade-up animate-delay-1 text-center">
        <h1 class="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          <span
            class="bg-gradient-to-r from-accent-coral to-accent-amber bg-clip-text text-transparent"
          >
            Blind Maze
          </span>
          <span
            class="ml-2 inline-flex -translate-y-1 items-center border border-border-default bg-bg-surface px-2 py-0.5 text-[11px] font-display tracking-wide text-text-secondary"
          >
            v1.0.1
          </span>
        </h1>
        <p class="mt-1 text-sm text-text-secondary sm:text-base">
          Đi trong mê cung phủ sương mù và tìm đường ra trước khi lạc hướng.
        </p>
      </div>

      <div
        class="grid gap-2 lg:grid-cols-[210px_minmax(0,1fr)_210px] lg:items-start xl:grid-cols-[230px_minmax(0,1fr)_230px]"
      >
        <aside
          class="min-w-0 overflow-hidden border border-border-default bg-bg-surface p-3 animate-fade-up animate-delay-2"
        >
          <h2
            class="mb-2.5 flex items-center gap-3 font-display text-xl font-semibold text-text-primary"
          >
            <span class="text-sm tracking-widest text-accent-coral">//</span>
            Hướng dẫn
          </h2>

          <div class="space-y-3 text-sm text-text-secondary">
            <div class="space-y-1.5">
              <p class="text-text-primary">Điều khiển (PC)</p>
              <p class="text-[11px] text-text-secondary">
                Khuyến nghị chơi trên PC để điều khiển chính xác hơn.
              </p>
              <div class="flex flex-wrap items-center gap-1.5">
                <span
                  class="border border-border-default bg-bg-elevated px-2 py-1 text-[11px] font-display tracking-wide text-text-primary"
                  >↑</span
                >
                <span
                  class="border border-border-default bg-bg-elevated px-2 py-1 text-[11px] font-display tracking-wide text-text-primary"
                  >↓</span
                >
                <span
                  class="border border-border-default bg-bg-elevated px-2 py-1 text-[11px] font-display tracking-wide text-text-primary"
                  >←</span
                >
                <span
                  class="border border-border-default bg-bg-elevated px-2 py-1 text-[11px] font-display tracking-wide text-text-primary"
                  >→</span
                >
                <span class="mx-1 text-text-dim">hoặc</span>
                <span
                  class="border border-border-default bg-bg-elevated px-2 py-1 text-[11px] font-display tracking-wide text-text-primary"
                  >W</span
                >
                <span
                  class="border border-border-default bg-bg-elevated px-2 py-1 text-[11px] font-display tracking-wide text-text-primary"
                  >A</span
                >
                <span
                  class="border border-border-default bg-bg-elevated px-2 py-1 text-[11px] font-display tracking-wide text-text-primary"
                  >S</span
                >
                <span
                  class="border border-border-default bg-bg-elevated px-2 py-1 text-[11px] font-display tracking-wide text-text-primary"
                  >D</span
                >
              </div>
            </div>

            <div class="space-y-1.5">
              <p class="text-text-primary">Điều khiển (điện thoại)</p>
              <p>
                Chạm vào <span class="text-text-primary">ô kề</span> để di chuyển, hoặc dùng
                <span class="text-text-primary">d-pad</span> bên dưới mê cung.
              </p>
            </div>

            <div class="space-y-1.5">
              <p class="text-text-primary">Cơ chế</p>
              <p>Sương mù chỉ cho bạn nhìn thấy một vùng nhỏ quanh nhân vật.</p>
              <p>
                Nhấn <span class="text-text-primary">SOS</span> để hiện mê cung trong thời gian ngắn
                (có hồi lại).
              </p>
            </div>

            <p v-if="isHistoricalGame" class="text-text-dim">
              Bạn đang chơi mê cung ngày {{ currentDate }}.
            </p>
          </div>
        </aside>

        <section class="flex min-w-0 justify-center animate-fade-up animate-delay-3">
          <div
            class="mx-auto inline-flex max-w-full flex-col overflow-hidden border border-border-default bg-bg-surface p-3 sm:p-4"
          >
            <div class="mb-2 flex justify-center">
              <div
                class="inline-flex max-w-full flex-wrap items-center justify-center gap-1.5 border border-accent-coral/40 bg-bg-deep px-2 py-1.5"
              >
                <div class="text-[11px] text-text-secondary sm:text-xs">
                  <span class="mr-2 text-accent-coral">//</span>Mê cung #{{ mazeNumber }}
                </div>
                <div class="flex flex-wrap items-center justify-center gap-2">
                  <div
                    class="border border-border-default bg-bg-surface px-2 py-1 text-[11px] font-display tracking-wide text-text-primary"
                  >
                    <span class="text-text-dim">Time</span>
                    <span class="ml-2 text-accent-amber">{{ timerDisplay }}</span>
                  </div>
                  <div
                    class="border border-border-default bg-bg-surface px-2 py-1 text-[11px] font-display tracking-wide text-text-primary"
                  >
                    <span class="text-text-dim">Moves</span>
                    <span class="ml-2 text-accent-coral">{{ moves }}</span>
                  </div>
                  <button
                    class="border border-border-default bg-bg-surface px-2 py-1 text-[11px] font-display tracking-wide text-text-primary transition hover:border-accent-coral hover:text-accent-coral"
                    @click="showCalendar = true"
                  >
                    Chọn ngày
                  </button>
                  <button
                    :disabled="isSosLocked"
                    :class="[
                      'border px-2 py-1 text-[11px] font-display tracking-wide transition',
                      isSosLocked
                        ? 'cursor-not-allowed border-border-default bg-bg-surface text-text-dim opacity-60'
                        : 'border-accent-coral bg-bg-elevated text-accent-coral hover:bg-accent-coral hover:text-bg-deep',
                    ]"
                    @click="revealMaze"
                  >
                    {{ sosCountdown > 0 ? `SOS ${sosCountdown}` : 'SOS' }}
                  </button>
                </div>
              </div>
            </div>

            <div class="flex justify-center overflow-hidden">
              <div class="inline-block shrink-0 overflow-hidden">
                <canvas
                  ref="canvasRef"
                  class="block cursor-pointer"
                  :style="canvasDisplayStyle"
                  @click="handleCanvasClick"
                />
              </div>
            </div>

            <div class="mt-4 grid grid-cols-3 gap-2 sm:hidden">
              <div />
              <button class="border border-border-default bg-bg-elevated py-3" @click="moveUp">
                ▲
              </button>
              <div />
              <button class="border border-border-default bg-bg-elevated py-3" @click="moveLeft">
                ◀
              </button>
              <button
                :disabled="isSosLocked"
                :class="[
                  'py-3',
                  isSosLocked
                    ? 'cursor-not-allowed border border-border-default bg-bg-surface text-text-dim opacity-60'
                    : 'border border-border-default bg-bg-surface text-text-dim',
                ]"
                @click="revealMaze"
              >
                {{ sosCountdown > 0 ? `SOS ${sosCountdown}` : 'SOS' }}
              </button>
              <button class="border border-border-default bg-bg-elevated py-3" @click="moveRight">
                ▶
              </button>
              <div />
              <button class="border border-border-default bg-bg-elevated py-3" @click="moveDown">
                ▼
              </button>
              <div />
            </div>

            <div
              class="mt-3 flex flex-wrap items-center justify-center gap-3 border-t border-border-default pt-3"
            >
              <button
                v-if="canShare"
                class="px-2 py-1 text-sm font-display text-text-secondary transition hover:text-accent-coral"
                @click="handleShare"
              >
                Chia sẻ
              </button>
            </div>

            <p class="mt-2 text-center text-sm text-text-dim">{{ message }}</p>

            <p
              v-if="playedToday && gameComplete"
              class="mt-2 text-center text-xs text-accent-amber"
            >
              Bạn đã hoàn thành mê cung hôm nay. Có thể xem lại hoặc chơi mê cung ngày khác.
            </p>
          </div>
        </section>

        <aside
          class="min-w-0 overflow-hidden border border-border-default bg-bg-surface p-3 animate-fade-up animate-delay-4"
        >
          <h2
            class="mb-2.5 flex items-center gap-3 font-display text-xl font-semibold text-text-primary"
          >
            <span class="text-sm tracking-widest text-accent-coral">//</span>
            Thống kê
          </h2>

          <div class="border border-border-default bg-bg-elevated p-4">
            <div class="mb-3 text-xs font-display tracking-wide text-text-dim">THỐNG KÊ LOCAL</div>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div class="border border-border-default bg-bg-surface p-3">
                <div class="text-xs text-text-dim">Đã chơi</div>
                <div class="mt-1 font-display text-2xl text-text-primary">
                  {{ stats.mazesPlayed }}
                </div>
              </div>
              <div class="border border-border-default bg-bg-surface p-3">
                <div class="text-xs text-text-dim">Đã thoát</div>
                <div class="mt-1 font-display text-2xl text-accent-amber">{{ stats.mazesWon }}</div>
              </div>
              <div class="border border-border-default bg-bg-surface p-3">
                <div class="text-xs text-text-dim">Best Moves</div>
                <div class="mt-1 font-display text-xl text-text-primary">
                  {{ stats.bestMoves ?? '-' }}
                </div>
              </div>
              <div class="border border-border-default bg-bg-surface p-3">
                <div class="text-xs text-text-dim">Best Time</div>
                <div class="mt-1 font-display text-xl text-text-primary">
                  {{ stats.bestTime !== null ? formatTime(stats.bestTime) : '-' }}
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4 border border-border-default bg-bg-elevated p-4">
            <div class="mb-3 text-xs font-display tracking-wide text-text-dim">LỊCH SỬ GẦN ĐÂY</div>
            <div v-if="recentHistory.length" class="space-y-2">
              <div
                v-for="entry in recentHistory"
                :key="`${entry.date}-${entry.mazeNumber}`"
                class="flex items-center justify-between border border-border-default bg-bg-surface px-3 py-2 text-xs"
              >
                <div>
                  <div class="font-display text-text-primary">#{{ entry.mazeNumber }}</div>
                  <div class="mt-1 text-text-dim">{{ entry.date }}</div>
                </div>
                <div class="text-right">
                  <div :class="entry.won ? 'text-accent-amber' : 'text-text-secondary'">
                    {{ entry.won ? 'Escaped' : 'Failed' }}
                  </div>
                  <div class="mt-1 text-text-dim">
                    {{ entry.moves }} bước · {{ formatTime(entry.time) }}
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-text-dim">Chưa có lịch sử chơi nào.</p>
          </div>
        </aside>
      </div>
    </div>

    <div
      class="mx-auto mt-6 flex flex-wrap items-center justify-center gap-2 text-center text-xs font-display tracking-wide text-text-dim animate-fade-up animate-delay-7"
    >
      <span>Made by</span>
      <a
        href="https://www.facebook.com/kaiyo.dang"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-block text-accent-coral transition hover:-translate-y-0.5 hover:text-text-primary"
      >
        KaiyoDang
      </a>
      <span>· J2TEAM Community with love</span>
    </div>

    <div
      v-if="showCalendar"
      class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/80 px-4 backdrop-blur-sm"
      @click.self="showCalendar = false"
    >
      <div class="w-full max-w-lg border border-border-default bg-bg-surface p-6">
        <h2 class="mb-4 font-display text-2xl text-accent-coral">Chọn ngày mê cung</h2>
        <div class="space-y-4">
          <p class="text-sm text-text-secondary">Chọn một ngày để chơi mê cung cũ.</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="option in quickDateOptions"
              :key="option.value"
              class="border border-border-default bg-bg-elevated px-3 py-2 text-xs font-display text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              @click="pickHistoricalDate(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
          <div class="flex items-center gap-2">
            <button
              :disabled="!canStepDateBackward"
              :class="[
                'border px-3 py-3 text-sm font-display transition',
                canStepDateBackward
                  ? 'border-border-default bg-bg-elevated text-text-primary hover:border-accent-coral hover:text-accent-coral'
                  : 'cursor-not-allowed border-border-default bg-bg-surface text-text-dim opacity-50',
              ]"
              @click="shiftHistoricalDate(-1)"
            >
              -1 ngày
            </button>
            <input
              v-model="selectedHistoricalDate"
              type="date"
              min="2026-01-01"
              :max="getDateKey()"
              class="w-full border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-coral"
            />
            <button
              :disabled="!canStepDateForward"
              :class="[
                'border px-3 py-3 text-sm font-display transition',
                canStepDateForward
                  ? 'border-border-default bg-bg-elevated text-text-primary hover:border-accent-coral hover:text-accent-coral'
                  : 'cursor-not-allowed border-border-default bg-bg-surface text-text-dim opacity-50',
              ]"
              @click="shiftHistoricalDate(1)"
            >
              +1 ngày
            </button>
          </div>
          <div class="flex flex-wrap gap-3">
            <button
              class="border border-accent-coral bg-bg-elevated px-4 py-2 text-sm font-display text-accent-coral transition hover:bg-accent-coral hover:text-bg-deep"
              @click="openHistoricalMaze"
            >
              Mở mê cung
            </button>
            <button
              class="border border-border-default bg-bg-surface px-4 py-2 text-sm font-display text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              @click="showCalendar = false"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showHelp"
      class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/80 px-4 backdrop-blur-sm"
      @click.self="showHelp = false"
    >
      <div class="w-full max-w-lg border border-border-default bg-bg-surface p-6">
        <h2 class="mb-4 font-display text-2xl text-accent-coral">Cách chơi</h2>
        <div class="space-y-3 text-sm text-text-secondary">
          <p>Bắt đầu ở góc trên bên trái và tìm đường ra ở góc dưới bên phải.</p>
          <p>Bạn chỉ nhìn thấy vùng gần nhân vật, nên phải ghi nhớ đường đã đi.</p>
          <p>Dùng bàn phím hoặc chạm để di chuyển từng ô một.</p>
        </div>
      </div>
    </div>

    <div
      v-if="showStats"
      class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/80 px-4 backdrop-blur-sm"
      @click.self="showStats = false"
    >
      <div class="w-full max-w-lg border border-border-default bg-bg-surface p-6">
        <h2 class="mb-4 font-display text-2xl text-accent-coral">Thống kê</h2>
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="border border-border-default bg-bg-elevated p-4">
            <div class="text-xs text-text-dim">Đã chơi</div>
            <div class="mt-2 font-display text-3xl">{{ stats.mazesPlayed }}</div>
          </div>
          <div class="border border-border-default bg-bg-elevated p-4">
            <div class="text-xs text-text-dim">Đã thắng</div>
            <div class="mt-2 font-display text-3xl">{{ stats.mazesWon }}</div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showVictory && completionTime !== null"
      class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/85 px-4 backdrop-blur-sm"
      @click.self="showVictory = false"
    >
      <div class="w-full max-w-md border border-border-default bg-bg-surface p-6 text-center">
        <div class="mb-3 text-xs font-display tracking-widest text-accent-coral">YOU ESCAPED</div>
        <h2 class="font-display text-3xl text-text-primary">Blind Maze #{{ mazeNumber }}</h2>
        <p class="mt-3 text-text-secondary">{{ moves }} bước · {{ formatTime(completionTime) }}</p>
        <div class="mt-6 flex justify-center gap-3">
          <button
            class="border border-accent-coral bg-bg-elevated px-4 py-2 text-sm font-display text-accent-coral transition hover:bg-accent-coral hover:text-bg-deep"
            @click="handleShare"
          >
            Chia sẻ
          </button>
          <button
            class="border border-border-default bg-bg-surface px-4 py-2 text-sm font-display text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            @click="showVictory = false"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
