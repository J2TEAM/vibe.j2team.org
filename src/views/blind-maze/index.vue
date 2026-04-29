<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useClipboard, useEventListener, useIntervalFn, useWindowSize } from '@vueuse/core'
import type { BlindMazeStats, MazeData, MazeEvent, MazePoint, TrailPoint } from './types'
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
const defaultVisibilityRadius = 4
const beaconUntil = ref(0)
const snareUntil = ref(0)
const echoUntil = ref(0)
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
const isEchoActive = computed(() => nowTick.value < echoUntil.value)
const visibilityRadius = computed(() => {
  if (gameComplete.value || isRevealActive.value) return 1000

  let radius = defaultVisibilityRadius
  if (nowTick.value < beaconUntil.value) radius += 3
  if (nowTick.value < snareUntil.value) radius = Math.max(2, radius - 2)
  return radius
})
const activeEffects = computed(() => {
  const effects: string[] = []
  if (nowTick.value < beaconUntil.value) effects.push('Beacon +3 tầm nhìn')
  if (nowTick.value < snareUntil.value) effects.push('Snare -2 tầm nhìn')
  if (isEchoActive.value) effects.push('Echo đang chỉ hướng')
  return effects
})
const sosCountdown = computed(() => {
  const remainingMs = sosCooldownUntil.value - nowTick.value
  if (remainingMs <= 0) return 0
  return Math.ceil(remainingMs / 1000)
})
const eventLegend = [
  { label: 'A/B', text: 'Cổng dịch chuyển cố định (đi A → ra B)', color: 'text-accent-amber' },
  { label: '?', text: 'Cổng bí ẩn — dùng 1 lần, đến ô ngẫu nhiên', color: 'text-accent-sky' },
  { label: '+', text: 'Beacon — tăng tầm nhìn tạm thời', color: 'text-green-400' },
  { label: '!', text: 'Snare — giảm tầm nhìn tạm thời', color: 'text-red-400' },
  { label: '>', text: 'Echo (nhìn xa hơn) hoặc Surge (dịch chuyển)', color: 'text-accent-coral' },
]

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
  const isWideDesktop = windowWidth.value >= 1440
  const pagePadding = isDesktop ? 48 : 24
  const cardPadding = isDesktop ? 36 : 20
  const cardBorder = 2
  const reservedColumns = isDesktop ? (isWideDesktop ? 460 : 420) + 24 : 0
  const availableWidth =
    windowWidth.value - pagePadding - cardPadding - cardBorder - reservedColumns
  const maxWidth = Math.max(220, availableWidth)
  const verticalReserve = isDesktop ? 232 : 164
  const maxHeight = Math.max(260, windowHeight.value - verticalReserve)
  const scale = Math.min(maxWidth / canvasWidth, maxHeight / canvasHeight, 1)
  const width = Math.floor(canvasWidth * scale)
  const height = Math.floor(canvasHeight * scale)

  return {
    width: `${width}px`,
    height: `${height}px`,
    maxWidth: '100%',
    maxHeight: isDesktop ? 'calc(100vh - 232px)' : 'calc(100vh - 164px)',
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

function getPointKey(point: MazePoint): string {
  return `${point.x},${point.y}`
}

function setTimedMessage(value: string, duration = 2200) {
  message.value = value
  window.clearTimeout(messageTimeout)
  messageTimeout = window.setTimeout(() => {
    message.value = ''
  }, duration)
}

function touchTrailPoint(point: MazePoint, time = Date.now()) {
  const existing = trail.value.find((item) => item.x === point.x && item.y === point.y)
  if (existing) existing.time = time
  else trail.value.push({ ...point, time })
  trail.value = trail.value.filter((item) => time - item.time < trailDuration)
}

function getCurrentEvent(): MazeEvent | null {
  if (!maze.value) return null
  return maze.value.events[getPointKey(playerPos.value)] ?? null
}

function clearConsumableEvent(point = playerPos.value) {
  if (!maze.value) return
  delete maze.value.events[getPointKey(point)]
}

function applyTimedPenalty(seconds: number) {
  sessionStartTime -= seconds * 1000
  timerDisplay.value = formatTime(getElapsedTime())
}

function moveDirectlyTo(point: MazePoint, countsAsMove: boolean) {
  playerPos.value = { ...point }
  if (countsAsMove) moves.value++
  touchTrailPoint(point)
}

function refreshNearbyTrail(center: MazePoint) {
  const now = Date.now()
  for (let y = center.y - 2; y <= center.y + 2; y++) {
    for (let x = center.x - 2; x <= center.x + 2; x++) {
      const distance = Math.abs(x - center.x) + Math.abs(y - center.y)
      if (distance > 2) continue
      touchTrailPoint({ x, y }, now)
    }
  }
}

function isAtExit(): boolean {
  return (
    !!maze.value && playerPos.value.x === maze.value.end.x && playerPos.value.y === maze.value.end.y
  )
}

function triggerCellEvent(dx: number, dy: number, chainDepth: number) {
  const mazeData = maze.value
  if (!mazeData || gameComplete.value || chainDepth > 3) return

  const event = getCurrentEvent()
  if (!event) return

  switch (event.type) {
    case 'teleport-pair':
      if (event.target) {
        playerPos.value = { ...event.target }
        playerVisualPos.value = { ...event.target }
        touchTrailPoint(event.target)
        setTimedMessage(`Cổng ${event.pairId ?? ''} kéo bạn sang một nhánh khác.`)
      }
      break
    case 'teleport-mystery':
      clearConsumableEvent()
      if (event.target) {
        playerPos.value = { ...event.target }
        playerVisualPos.value = { ...event.target }
        touchTrailPoint(event.target)
        setTimedMessage('Cổng bí ẩn vừa ném bạn tới một góc rất xa.')
      }
      break
    case 'beacon':
      clearConsumableEvent()
      beaconUntil.value = Date.now() + 7000
      setTimedMessage('Beacon sáng lên, vùng nhìn của bạn mở rộng.')
      break
    case 'snare':
      clearConsumableEvent()
      snareUntil.value = Date.now() + 6500
      applyTimedPenalty(4)
      setTimedMessage('Snare siết sương mù lại và cộng thêm 4 giây áp lực.')
      break
    case 'echo':
      clearConsumableEvent()
      echoUntil.value = Date.now() + 5000
      setTimedMessage('Echo vang lên, lối ra hiện hướng trong chốc lát.')
      break
    case 'trail-refresh':
      clearConsumableEvent()
      refreshNearbyTrail(playerPos.value)
      setTimedMessage('Dấu chân quanh bạn sáng lại, dễ lần đường hơn.')
      break
    case 'surge':
      clearConsumableEvent()
      setTimedMessage('Surge đẩy bạn lao thêm một ô cùng hướng.')
      if ((dx !== 0 || dy !== 0) && canMoveTo(playerPos.value.x + dx, playerPos.value.y + dy)) {
        movePlayer(dx, dy, chainDepth + 1, false)
      }
      break
  }
}

function initGame() {
  stopTimer()
  cancelAnimationFrame(animationFrame)
  window.clearTimeout(revealTimeout)
  isRevealActive.value = false
  sosCooldownUntil.value = 0
  beaconUntil.value = 0
  snareUntil.value = 0
  echoUntil.value = 0
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

function movePlayer(dx: number, dy: number, chainDepth = 0, countsAsMove = true) {
  if (gameComplete.value) return

  const nextX = playerPos.value.x + dx
  const nextY = playerPos.value.y + dy
  if (!canMoveTo(nextX, nextY)) return

  moveDirectlyTo({ x: nextX, y: nextY }, countsAsMove)

  if (isAtExit()) {
    handleVictory()
    return
  }

  triggerCellEvent(dx, dy, chainDepth)

  if (isAtExit()) handleVictory()
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

  drawEvents(ctx)
  drawTrail(ctx)
  drawPlayer(ctx)
  drawGoalArrow(ctx, canvas)
  drawFog(ctx, canvas)
}

function drawEvents(ctx: CanvasRenderingContext2D) {
  const mazeData = maze.value
  if (!mazeData) return

  ctx.save()

  for (const [key, event] of Object.entries(mazeData.events)) {
    const [xText, yText] = key.split(',')
    const x = Number(xText)
    const y = Number(yText)
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue

    const distance = getDistance(x, y, playerPos.value.x, playerPos.value.y)
    if (distance > visibilityRadius.value + 1.5) continue

    const px = x * cellSize + wallWidth
    const py = y * cellSize + wallWidth
    const centerX = px + (cellSize - wallWidth) / 2
    const centerY = py + (cellSize - wallWidth) / 2
    const size = cellSize - wallWidth - 4

    ctx.fillStyle = 'rgba(8, 17, 26, 0.5)'
    ctx.fillRect(px + 2, py + 2, size, size)

    switch (event.type) {
      case 'teleport-pair':
        ctx.strokeStyle = event.pairId === 'A' ? '#FFB830' : '#38BDF8'
        ctx.lineWidth = 1.5
        ctx.strokeRect(px + 2, py + 2, size, size)
        ctx.fillStyle = event.pairId === 'A' ? '#FFB830' : '#38BDF8'
        ctx.font = 'bold 10px sans-serif'
        ctx.fillText(event.pairId ?? 'T', centerX - 3.5, centerY + 3.5)
        break
      case 'teleport-mystery':
        ctx.fillStyle = '#FF6B4A'
        ctx.font = 'bold 11px sans-serif'
        ctx.fillText('?', centerX - 3, centerY + 4)
        break
      case 'beacon':
        ctx.fillStyle = '#FFB830'
        ctx.beginPath()
        ctx.arc(centerX, centerY, 3.5, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'snare':
        ctx.strokeStyle = '#FF6B4A'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(px + 3, py + 3)
        ctx.lineTo(px + size + 1, py + size + 1)
        ctx.moveTo(px + size + 1, py + 3)
        ctx.lineTo(px + 3, py + size + 1)
        ctx.stroke()
        break
      case 'echo':
        ctx.strokeStyle = '#38BDF8'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(px + 3, centerY)
        ctx.lineTo(px + size + 1, centerY)
        ctx.lineTo(px + size - 2, centerY - 3)
        ctx.moveTo(px + size + 1, centerY)
        ctx.lineTo(px + size - 2, centerY + 3)
        ctx.stroke()
        break
      case 'trail-refresh':
        ctx.fillStyle = '#38BDF8'
        ctx.fillRect(centerX - 3, centerY - 3, 6, 6)
        break
      case 'surge':
        ctx.fillStyle = '#FF6B4A'
        ctx.beginPath()
        ctx.moveTo(centerX - 3, centerY - 4)
        ctx.lineTo(centerX + 4, centerY)
        ctx.lineTo(centerX - 3, centerY + 4)
        ctx.closePath()
        ctx.fill()
        break
    }
  }

  ctx.restore()
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
  if (!mazeData || (!isRevealActive.value && !isEchoActive.value)) return

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
    ctx.lineWidth = isRevealActive.value ? 3 : 2
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

    if (isRevealActive.value) {
      ctx.font = 'bold 11px sans-serif'
      ctx.fillText('EXIT', baseX - Math.cos(angle) * 18 - 12, baseY - Math.sin(angle) * 18 - 8)
    }
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
  isRevealActive.value = true
  sosCooldownUntil.value = Date.now() + 60000
  sessionStartTime -= 10000
  timerDisplay.value = formatTime(getElapsedTime())
  window.clearTimeout(revealTimeout)
  revealTimeout = window.setTimeout(() => {
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
  setTimedMessage('Đã copy kết quả', 2000)
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
  <div class="relative min-h-screen overflow-hidden bg-bg-deep px-3 py-2 text-text-primary sm:px-6">
    <img
      :src="logoUrl"
      alt="J2TEAMlogo"
      class="pointer-events-none absolute right-3 top-3 z-0 w-28 rotate-12 opacity-70 mix-blend-screen drop-shadow-[0_0_18px_rgba(255,107,74,0.18)] sm:right-5 sm:top-4 sm:w-36 md:w-44"
      style="filter: brightness(0) invert(1)"
    />
    <div class="mx-auto flex w-full max-w-[1360px] flex-col gap-2.5 lg:min-h-[calc(100vh-1rem)]">
      <div class="animate-fade-up">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-1.5 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          ← Trang chủ
        </RouterLink>
      </div>

      <div class="animate-fade-up animate-delay-1 text-center">
        <h1 class="font-display text-3xl font-bold tracking-tight sm:text-5xl">
          <span
            class="bg-gradient-to-r from-accent-coral to-accent-amber bg-clip-text text-transparent"
          >
            Blind Maze
          </span>
          <span
            class="ml-1 inline-flex translate-y-0 items-center border border-border-default bg-bg-surface px-2 py-0.5 text-[10px] font-display tracking-wide text-text-secondary sm:ml-2 sm:-translate-y-1 sm:text-[11px]"
          >
            v1.0.1
          </span>
        </h1>
        <p class="mt-1 text-xs text-text-secondary sm:text-base">
          Đi trong mê cung phủ sương mù và tìm đường ra trước khi lạc hướng.
        </p>
      </div>

      <div
        class="grid gap-2 lg:flex-1 lg:grid-cols-[200px_minmax(0,1fr)_200px] lg:items-start lg:overflow-hidden xl:grid-cols-[220px_minmax(0,1fr)_220px]"
      >
        <aside
          class="order-2 min-w-0 border border-border-default bg-bg-surface animate-fade-up animate-delay-2 lg:order-none lg:self-stretch lg:overflow-y-auto"
        >
          <details class="group lg:hidden">
            <summary
              class="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 font-display text-sm font-semibold text-text-primary"
            >
              <span class="flex items-center gap-2">
                <span class="tracking-widest text-accent-coral">//</span>
                Hướng dẫn nhanh
              </span>
              <span class="text-xs text-text-dim transition group-open:rotate-45">+</span>
            </summary>

            <div class="border-t border-border-default px-3 pb-3 pt-2">
              <div class="space-y-3 text-xs leading-relaxed text-text-secondary">
                <div>
                  <p class="mb-1.5 font-display text-[10px] tracking-[0.15em] text-text-dim">
                    ĐIỀU KHIỂN
                  </p>
                  <div class="flex flex-wrap items-center gap-1">
                    <span
                      class="border border-border-default bg-bg-elevated px-1.5 py-0.5 font-display text-[10px] text-text-primary"
                      >↑↓←→</span
                    >
                    <span class="text-text-dim">/</span>
                    <span
                      class="border border-border-default bg-bg-elevated px-1.5 py-0.5 font-display text-[10px] text-text-primary"
                      >WASD</span
                    >
                  </div>
                  <p class="mt-1 text-[11px] text-text-dim">Mobile: chạm hoặc dùng D-pad</p>
                </div>

                <div>
                  <p class="mb-1 font-display text-[10px] tracking-[0.15em] text-text-dim">
                    MỤC TIÊU
                  </p>
                  <p>
                    Tìm đường thoát mê cung trong sương mù. Sương mù giới hạn tầm nhìn nên bạn chỉ
                    thấy vùng rất gần.
                  </p>
                </div>

                <div>
                  <p class="mb-1 font-display text-[10px] tracking-[0.15em] text-text-dim">SOS</p>
                  <p>
                    Nhấn <span class="font-display text-text-primary">SOS</span> để mở bản đồ toàn
                    bộ trong vài giây, đổi lại sẽ bị cộng phạt thời gian.
                  </p>
                </div>

                <div class="border-t border-border-default pt-3">
                  <p class="mb-2 font-display text-[10px] tracking-[0.15em] text-accent-coral">
                    EVENTS
                  </p>
                  <div class="space-y-1.5">
                    <div
                      v-for="item in eventLegend"
                      :key="item.label"
                      class="flex items-start gap-2"
                    >
                      <span
                        class="mt-0.5 inline-flex shrink-0 items-center justify-center border border-border-default bg-bg-elevated px-1 py-0.5 font-display text-[10px] leading-none text-text-primary"
                        :style="{ minWidth: item.label.length > 1 ? '1.75rem' : '1.25rem' }"
                      >
                        {{ item.label }}
                      </span>
                      <span :class="['text-[11px] leading-snug', item.color]">{{ item.text }}</span>
                    </div>
                  </div>
                </div>

                <p
                  v-if="isHistoricalGame"
                  class="border-t border-border-default pt-2 text-text-dim"
                >
                  Đang chơi mê cung ngày {{ currentDate }}.
                </p>
              </div>
            </div>
          </details>

          <div class="hidden p-3 lg:block">
            <h2
              class="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-text-primary"
            >
              <span class="tracking-widest text-accent-coral">//</span>
              Hướng dẫn
            </h2>

            <div class="space-y-3 text-xs leading-relaxed text-text-secondary">
              <div>
                <p class="mb-1.5 font-display text-[10px] tracking-[0.15em] text-text-dim">
                  ĐIỀU KHIỂN
                </p>
                <div class="flex flex-wrap items-center gap-1">
                  <span
                    class="border border-border-default bg-bg-elevated px-1.5 py-0.5 font-display text-[10px] text-text-primary"
                    >↑↓←→</span
                  >
                  <span class="text-text-dim">/</span>
                  <span
                    class="border border-border-default bg-bg-elevated px-1.5 py-0.5 font-display text-[10px] text-text-primary"
                    >WASD</span
                  >
                </div>
                <p class="mt-1 text-[11px] text-text-dim">Mobile: chạm hoặc dùng D-pad</p>
              </div>

              <div>
                <p class="mb-1 font-display text-[10px] tracking-[0.15em] text-text-dim">
                  MỤC TIÊU
                </p>
                <p>
                  Tìm đường thoát mê cung trong sương mù. Sương mù giới hạn tầm nhìn — chỉ thấy các
                  ô xung quanh.
                </p>
              </div>

              <div>
                <p class="mb-1 font-display text-[10px] tracking-[0.15em] text-text-dim">SOS</p>
                <p>
                  Nhấn <span class="font-display text-text-primary">SOS</span> để mở bản đồ toàn bộ
                  trong vài giây. Có phạt cộng thêm thời gian.
                </p>
              </div>

              <div class="border-t border-border-default pt-3">
                <p class="mb-2 font-display text-[10px] tracking-[0.15em] text-accent-coral">
                  EVENTS
                </p>
                <div class="space-y-1.5">
                  <div v-for="item in eventLegend" :key="item.label" class="flex items-start gap-2">
                    <span
                      class="mt-0.5 inline-flex shrink-0 items-center justify-center border border-border-default bg-bg-elevated px-1 py-0.5 font-display text-[10px] leading-none text-text-primary"
                      :style="{ minWidth: item.label.length > 1 ? '1.75rem' : '1.25rem' }"
                    >
                      {{ item.label }}
                    </span>
                    <span :class="['text-[11px] leading-snug', item.color]">{{ item.text }}</span>
                  </div>
                </div>
              </div>

              <p v-if="isHistoricalGame" class="border-t border-border-default pt-2 text-text-dim">
                Đang chơi mê cung ngày {{ currentDate }}.
              </p>
            </div>
          </div>
        </aside>

        <section
          class="order-1 flex min-w-0 justify-center overflow-hidden animate-fade-up animate-delay-3 lg:order-none lg:self-stretch"
        >
          <div
            class="mx-auto flex w-full min-w-0 max-w-full flex-col overflow-hidden border border-border-default bg-bg-surface p-2.5 sm:p-4 lg:self-stretch"
          >
            <div class="mb-2 flex justify-center">
              <div
                class="grid w-full max-w-full gap-1.5 border border-accent-coral/40 bg-bg-deep px-2 py-2 sm:inline-flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-center sm:py-1.5"
              >
                <div class="text-center text-[10px] text-text-secondary sm:text-xs">
                  <span class="mr-2 text-accent-coral">//</span>Mê cung #{{ mazeNumber }}
                </div>
                <div
                  class="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-2"
                >
                  <div
                    class="border border-border-default bg-bg-surface px-2 py-1 text-center text-[10px] font-display tracking-wide text-text-primary sm:text-[11px]"
                  >
                    <span class="text-text-dim">Time</span>
                    <span class="ml-2 text-accent-amber">{{ timerDisplay }}</span>
                  </div>
                  <div
                    class="border border-border-default bg-bg-surface px-2 py-1 text-center text-[10px] font-display tracking-wide text-text-primary sm:text-[11px]"
                  >
                    <span class="text-text-dim">Moves</span>
                    <span class="ml-2 text-accent-coral">{{ moves }}</span>
                  </div>
                  <button
                    class="border border-border-default bg-bg-surface px-2 py-1 text-[10px] font-display tracking-wide text-text-primary transition hover:border-accent-coral hover:text-accent-coral sm:text-[11px]"
                    @click="showCalendar = true"
                  >
                    Chọn ngày
                  </button>
                  <button
                    :disabled="isSosLocked"
                    :class="[
                      'border px-2 py-1 text-[10px] font-display tracking-wide transition sm:text-[11px]',
                      isSosLocked
                        ? 'cursor-not-allowed border-border-default bg-bg-surface text-text-dim opacity-60'
                        : 'border-accent-coral bg-bg-elevated text-accent-coral hover:bg-accent-coral hover:text-bg-deep',
                    ]"
                    @click="revealMaze"
                  >
                    {{ sosCountdown > 0 ? `SOS ${sosCountdown}` : 'SOS' }}
                  </button>
                  <div
                    v-if="activeEffects.length"
                    class="col-span-2 border border-accent-sky/40 bg-bg-surface px-2 py-1 text-center text-[10px] font-display tracking-wide text-accent-sky sm:text-[11px]"
                  >
                    {{ activeEffects.join(' · ') }}
                  </div>
                </div>
              </div>
            </div>

            <div class="flex min-w-0 justify-center overflow-hidden">
              <div class="max-w-full overflow-hidden">
                <canvas
                  ref="canvasRef"
                  class="block cursor-pointer"
                  :style="canvasDisplayStyle"
                  @click="handleCanvasClick"
                />
              </div>
            </div>

            <div class="mt-3 grid grid-cols-3 gap-1.5 sm:hidden">
              <div />
              <button
                class="border border-border-default bg-bg-elevated py-2.5 text-lg"
                @click="moveUp"
              >
                ▲
              </button>
              <div />
              <button
                class="border border-border-default bg-bg-elevated py-2.5 text-lg"
                @click="moveLeft"
              >
                ◀
              </button>
              <button
                :disabled="isSosLocked"
                :class="[
                  'py-2.5 text-sm font-display',
                  isSosLocked
                    ? 'cursor-not-allowed border border-border-default bg-bg-surface text-text-dim opacity-60'
                    : 'border border-border-default bg-bg-surface text-text-dim',
                ]"
                @click="revealMaze"
              >
                {{ sosCountdown > 0 ? `SOS ${sosCountdown}` : 'SOS' }}
              </button>
              <button
                class="border border-border-default bg-bg-elevated py-2.5 text-lg"
                @click="moveRight"
              >
                ▶
              </button>
              <div />
              <button
                class="border border-border-default bg-bg-elevated py-2.5 text-lg"
                @click="moveDown"
              >
                ▼
              </button>
              <div />
            </div>

            <div
              class="mt-2.5 flex flex-wrap items-center justify-center gap-2 border-t border-border-default pt-2.5"
            >
              <button
                v-if="canShare"
                class="px-2 py-1 text-xs font-display text-text-secondary transition hover:text-accent-coral sm:text-sm"
                @click="handleShare"
              >
                Chia sẻ
              </button>
            </div>

            <p class="mt-2 min-h-[1.25rem] text-center text-xs text-text-dim sm:text-sm">
              {{ message }}
            </p>

            <p
              v-if="playedToday && gameComplete"
              class="mt-2 text-center text-[11px] text-accent-amber sm:text-xs"
            >
              Bạn đã hoàn thành mê cung hôm nay. Có thể xem lại hoặc chơi mê cung ngày khác.
            </p>
          </div>
        </section>

        <aside
          class="order-3 min-w-0 border border-border-default bg-bg-surface animate-fade-up animate-delay-4 lg:order-none lg:self-stretch lg:overflow-y-auto"
        >
          <details class="group lg:hidden">
            <summary
              class="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 font-display text-sm font-semibold text-text-primary"
            >
              <span class="flex items-center gap-2">
                <span class="tracking-widest text-accent-coral">//</span>
                Thống kê
              </span>
              <span class="text-xs text-text-dim transition group-open:rotate-45">+</span>
            </summary>

            <div class="border-t border-border-default px-3 pb-3 pt-2">
              <div class="border border-border-default bg-bg-elevated p-2.5">
                <div class="mb-1.5 text-[10px] font-display tracking-[0.15em] text-text-dim">
                  THỐNG KÊ LOCAL
                </div>
                <div class="grid grid-cols-2 gap-1.5">
                  <div class="border border-border-default bg-bg-surface p-2">
                    <div class="text-[11px] text-text-dim">Đã chơi</div>
                    <div class="mt-0.5 font-display text-lg text-text-primary">
                      {{ stats.mazesPlayed }}
                    </div>
                  </div>
                  <div class="border border-border-default bg-bg-surface p-2">
                    <div class="text-[11px] text-text-dim">Đã thoát</div>
                    <div class="mt-0.5 font-display text-lg text-accent-amber">
                      {{ stats.mazesWon }}
                    </div>
                  </div>
                  <div class="border border-border-default bg-bg-surface p-2">
                    <div class="text-[11px] text-text-dim">Best Moves</div>
                    <div class="mt-0.5 font-display text-base text-text-primary">
                      {{ stats.bestMoves ?? '-' }}
                    </div>
                  </div>
                  <div class="border border-border-default bg-bg-surface p-2">
                    <div class="text-[11px] text-text-dim">Best Time</div>
                    <div class="mt-0.5 font-display text-base text-text-primary">
                      {{ stats.bestTime !== null ? formatTime(stats.bestTime) : '-' }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-2 border border-border-default bg-bg-elevated p-2.5">
                <div class="mb-1.5 text-[10px] font-display tracking-[0.15em] text-text-dim">
                  LỊCH SỬ GẦN ĐÂY
                </div>
                <div v-if="recentHistory.length" class="space-y-1">
                  <div
                    v-for="entry in recentHistory"
                    :key="`${entry.date}-${entry.mazeNumber}`"
                    class="flex items-center justify-between border border-border-default bg-bg-surface px-2 py-1.5 text-[11px]"
                  >
                    <div>
                      <div class="font-display text-text-primary">#{{ entry.mazeNumber }}</div>
                      <div class="text-text-dim">{{ entry.date }}</div>
                    </div>
                    <div class="text-right">
                      <div :class="entry.won ? 'text-accent-amber' : 'text-text-secondary'">
                        {{ entry.won ? 'Escaped' : 'Failed' }}
                      </div>
                      <div class="text-text-dim">
                        {{ entry.moves }}b · {{ formatTime(entry.time) }}
                      </div>
                    </div>
                  </div>
                </div>
                <p v-else class="text-[11px] text-text-dim">Chưa có lịch sử.</p>
              </div>
            </div>
          </details>

          <div class="hidden p-3 lg:block">
            <h2
              class="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-text-primary"
            >
              <span class="tracking-widest text-accent-coral">//</span>
              Thống kê
            </h2>

            <div class="border border-border-default bg-bg-elevated p-2.5">
              <div class="mb-1.5 text-[10px] font-display tracking-[0.15em] text-text-dim">
                THỐNG KÊ LOCAL
              </div>
              <div class="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
                <div class="border border-border-default bg-bg-surface p-2">
                  <div class="text-[11px] text-text-dim">Đã chơi</div>
                  <div class="mt-0.5 font-display text-xl text-text-primary">
                    {{ stats.mazesPlayed }}
                  </div>
                </div>
                <div class="border border-border-default bg-bg-surface p-2">
                  <div class="text-[11px] text-text-dim">Đã thoát</div>
                  <div class="mt-0.5 font-display text-xl text-accent-amber">
                    {{ stats.mazesWon }}
                  </div>
                </div>
                <div class="border border-border-default bg-bg-surface p-2">
                  <div class="text-[11px] text-text-dim">Best Moves</div>
                  <div class="mt-0.5 font-display text-lg text-text-primary">
                    {{ stats.bestMoves ?? '-' }}
                  </div>
                </div>
                <div class="border border-border-default bg-bg-surface p-2">
                  <div class="text-[11px] text-text-dim">Best Time</div>
                  <div class="mt-0.5 font-display text-lg text-text-primary">
                    {{ stats.bestTime !== null ? formatTime(stats.bestTime) : '-' }}
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-2 border border-border-default bg-bg-elevated p-2.5">
              <div class="mb-1.5 text-[10px] font-display tracking-[0.15em] text-text-dim">
                LỊCH SỬ GẦN ĐÂY
              </div>
              <div v-if="recentHistory.length" class="space-y-1">
                <div
                  v-for="entry in recentHistory"
                  :key="`${entry.date}-${entry.mazeNumber}`"
                  class="flex items-center justify-between border border-border-default bg-bg-surface px-2 py-1.5 text-[11px]"
                >
                  <div>
                    <div class="font-display text-text-primary">#{{ entry.mazeNumber }}</div>
                    <div class="text-text-dim">{{ entry.date }}</div>
                  </div>
                  <div class="text-right">
                    <div :class="entry.won ? 'text-accent-amber' : 'text-text-secondary'">
                      {{ entry.won ? 'Escaped' : 'Failed' }}
                    </div>
                    <div class="text-text-dim">
                      {{ entry.moves }}b · {{ formatTime(entry.time) }}
                    </div>
                  </div>
                </div>
              </div>
              <p v-else class="text-[11px] text-text-dim">Chưa có lịch sử.</p>
            </div>
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
