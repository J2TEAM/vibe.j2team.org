import { useElementSize, useRafFn } from '@vueuse/core'
import { computed, reactive, ref, type CSSProperties } from 'vue'
import type {
  BoatState,
  DifficultyLevel,
  GameMode,
  GamePhase,
  Obstacle,
  Point,
  TrailPoint,
  Whirlpool,
  WindState,
} from '../types'
import { calculateTurnScore, resolveTurnEnd, type SummaryAction } from '../utils/campaign'
import { buildCourse as buildCourseFromSeed } from '../utils/course'
import { difficultyConfigs } from '../utils/difficulty'

const DEFAULT_DIFFICULTY: DifficultyLevel = 'medium'
const TOTAL_STAGES = 3
const BOAT_RADIUS = 14
const EDGE_MARGIN = 16
const MAX_WIND = 240

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function usePaperBoatRushGame() {
  const gameMode = ref<GameMode>('single')
  const difficultyLevel = ref<DifficultyLevel>(DEFAULT_DIFFICULTY)
  const phase = ref<GamePhase>('setup')
  const stageIndex = ref(0)
  const turnIndex = ref(0)
  const summaryAction = ref<SummaryAction>(null)
  const scores = ref<number[]>([])

  const difficultyConfig = computed(() => difficultyConfigs[difficultyLevel.value])
  const difficultyLabel = computed(() => difficultyConfig.value.label)

  const timeLeft = ref(difficultyConfigs[DEFAULT_DIFFICULTY].timeLimit)
  const progress = ref(0)
  const turnSuccess = ref(false)
  const turnMessage = ref('Vuốt trên sông để tạo gió và bẻ hướng dòng nước.')

  const seed = ref(Date.now() % 100000)
  const riverTick = ref(0)
  const collisionCooldown = ref(0)
  const trailCounter = ref(0)

  const boardElement = ref<HTMLElement | null>(null)
  const { width: boardWidth, height: boardHeight } = useElementSize(boardElement)

  const isPointerDown = ref(false)
  const lastPointer = ref<Point | null>(null)

  const wind = reactive<WindState>({
    x: 0,
    y: 0,
  })

  const boat = reactive<BoatState>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    hits: 0,
  })

  const obstacles = ref<Obstacle[]>([])
  const whirlpools = ref<Whirlpool[]>([])
  const trailPoints = ref<TrailPoint[]>([])

  const activePlayerLabel = computed(() => {
    if (gameMode.value === 'single') {
      return 'Bạn'
    }
    return `Người chơi ${turnIndex.value + 1}`
  })

  const stageLabel = computed(() => `Màn ${stageIndex.value + 1}/${TOTAL_STAGES}`)

  const turnSummaryButtonLabel = computed(() => {
    if (summaryAction.value === 'next-player') {
      return 'Bắt đầu lượt người chơi 2'
    }

    const nextStage = stageIndex.value + 2
    return `Sang màn ${nextStage}/${TOTAL_STAGES}`
  })

  const windPower = computed(() => {
    const rawPower = Math.hypot(wind.x, wind.y)
    return Math.round(clamp((rawPower / MAX_WIND) * 100, 0, 100))
  })

  const boatAngle = computed(() => {
    const headingY = boat.vy === 0 ? -1 : -boat.vy
    return (Math.atan2(boat.vx, headingY) * 180) / Math.PI
  })

  const playerOneScore = computed(() => scores.value[0] ?? null)
  const playerTwoScore = computed(() => scores.value[1] ?? null)

  const summaryHeadline = computed(() => {
    if (gameMode.value === 'single') {
      const score = scores.value[0] ?? 0
      return turnSuccess.value
        ? `Về đích! Bạn ghi được ${score} điểm.`
        : `Lượt chơi kết thúc với ${score} điểm.`
    }

    const scoreOne = scores.value[0] ?? 0
    const scoreTwo = scores.value[1] ?? 0

    if (scoreOne === scoreTwo) {
      return `Hòa kịch tính ${scoreOne} - ${scoreTwo}.`
    }

    return scoreOne > scoreTwo
      ? `Người chơi 1 thắng ${scoreOne} - ${scoreTwo}.`
      : `Người chơi 2 thắng ${scoreTwo} - ${scoreOne}.`
  })

  const riverStyle = computed<CSSProperties>(() => {
    const shiftX = Math.round(riverTick.value * -28)
    const shiftY = Math.round(riverTick.value * 18)

    return {
      backgroundImage:
        'linear-gradient(180deg, rgba(56,189,248,0.14) 0%, rgba(22,34,50,0.1) 100%), repeating-linear-gradient(135deg, rgba(240,237,230,0.08) 0px, rgba(240,237,230,0.08) 2px, transparent 2px, transparent 34px)',
      backgroundPosition: `0 0, ${shiftX}px ${shiftY}px`,
    }
  })

  function getBoardSize() {
    const width = Math.max(300, Math.round(boardWidth.value || 360))
    const height = Math.max(420, Math.round(boardHeight.value || 560))
    return { width, height }
  }

  function setBoardElement(element: HTMLElement | null) {
    boardElement.value = element
  }

  function resetBoatPosition() {
    const { width, height } = getBoardSize()

    boat.x = width / 2
    boat.y = height - 42
    boat.vx = 0
    boat.vy = 0
    boat.hits = 0

    wind.x = 0
    wind.y = 0
    progress.value = 0
    collisionCooldown.value = 0
    trailPoints.value = []
  }

  function buildCourse() {
    const { width, height } = getBoardSize()
    const generatedCourse = buildCourseFromSeed(seed.value, width, height, difficultyConfig.value)

    obstacles.value = generatedCourse.obstacles
    whirlpools.value = generatedCourse.whirlpools
  }

  function setMode(nextMode: GameMode) {
    if (phase.value !== 'setup') {
      return
    }
    gameMode.value = nextMode
  }

  function setDifficulty(nextDifficulty: DifficultyLevel) {
    if (phase.value !== 'setup') {
      return
    }

    difficultyLevel.value = nextDifficulty
    timeLeft.value = difficultyConfigs[nextDifficulty].timeLimit
  }

  function startMatch() {
    scores.value = gameMode.value === 'single' ? [0] : [0, 0]
    stageIndex.value = 0
    turnIndex.value = 0
    summaryAction.value = null
    seed.value = Date.now() % 100000
    startTurn()
  }

  function startTurn() {
    const config = difficultyConfig.value

    buildCourse()
    resetBoatPosition()

    turnSuccess.value = false
    timeLeft.value = config.timeLimit
    phase.value = 'running'

    turnMessage.value = `Mức ${config.label} • ${stageLabel.value}: Vuốt để tạo luồng gió, tránh rác và vùng xoáy để cập bờ.`
  }

  function startSecondPlayerTurn() {
    if (phase.value !== 'turn-summary') {
      return
    }

    if (summaryAction.value === 'next-player') {
      summaryAction.value = null
      turnIndex.value = 1
      startTurn()
      return
    }

    if (summaryAction.value === 'next-stage') {
      summaryAction.value = null
      stageIndex.value += 1
      turnIndex.value = 0
      seed.value = (Date.now() + stageIndex.value * 733) % 100000
      startTurn()
    }
  }

  function returnToSetup() {
    phase.value = 'setup'
    stageIndex.value = 0
    turnIndex.value = 0
    summaryAction.value = null
    timeLeft.value = difficultyConfig.value.timeLimit
    turnMessage.value = 'Vuốt trên sông để tạo gió và bẻ hướng dòng nước.'
  }

  function replayMatch() {
    startMatch()
  }

  function finishTurn(success: boolean, reason: string) {
    if (phase.value !== 'running') {
      return
    }

    turnSuccess.value = success
    turnMessage.value = reason

    const gainedScore = calculateTurnScore({
      progress: progress.value,
      timeLeft: timeLeft.value,
      success,
      hits: boat.hits,
      difficultyMultiplier: difficultyConfig.value.scoreMultiplier,
    })

    const resolvedTurn = resolveTurnEnd({
      scores: scores.value,
      turnIndex: turnIndex.value,
      gainedScore,
      gameMode: gameMode.value,
      stageIndex: stageIndex.value,
      totalStages: TOTAL_STAGES,
    })

    scores.value = resolvedTurn.scores
    summaryAction.value = resolvedTurn.summaryAction
    phase.value = resolvedTurn.phase
  }

  function pointerToBoardPoint(event: PointerEvent): Point | null {
    if (!boardElement.value) {
      return null
    }

    const rect = boardElement.value.getBoundingClientRect()
    return {
      x: clamp(event.clientX - rect.left, 0, rect.width),
      y: clamp(event.clientY - rect.top, 0, rect.height),
    }
  }

  function handleBoardPointerDown(event: PointerEvent) {
    if (phase.value !== 'running') {
      return
    }

    const point = pointerToBoardPoint(event)
    if (!point) {
      return
    }

    isPointerDown.value = true
    lastPointer.value = point
    boardElement.value?.setPointerCapture(event.pointerId)
  }

  function handleBoardPointerMove(event: PointerEvent) {
    if (!isPointerDown.value || phase.value !== 'running') {
      return
    }

    const point = pointerToBoardPoint(event)
    if (!point || !lastPointer.value) {
      return
    }

    const dx = point.x - lastPointer.value.x
    const dy = point.y - lastPointer.value.y

    wind.x += dx * 2.1
    wind.y += dy * 2.1

    const magnitude = Math.hypot(wind.x, wind.y)
    if (magnitude > MAX_WIND) {
      const scale = MAX_WIND / magnitude
      wind.x *= scale
      wind.y *= scale
    }

    trailCounter.value += 1
    trailPoints.value = [
      ...trailPoints.value.slice(-24),
      {
        id: trailCounter.value,
        x: point.x,
        y: point.y,
        life: 1,
      },
    ]
    lastPointer.value = point
  }

  function handleBoardPointerUp(event: PointerEvent) {
    if (boardElement.value?.hasPointerCapture(event.pointerId)) {
      boardElement.value.releasePointerCapture(event.pointerId)
    }

    isPointerDown.value = false
    lastPointer.value = null
  }

  function applyCollision(pushX: number, pushY: number) {
    if (collisionCooldown.value > 0) {
      return
    }

    collisionCooldown.value = 0.48
    boat.hits += 1
    boat.vx += pushX
    boat.vy += pushY
    timeLeft.value = Math.max(0, timeLeft.value - difficultyConfig.value.collisionPenaltySeconds)
  }

  function stepSimulation(dt: number) {
    if (phase.value !== 'running') {
      return
    }

    const config = difficultyConfig.value
    const { width, height } = getBoardSize()
    riverTick.value += dt
    timeLeft.value = Math.max(0, timeLeft.value - dt)
    collisionCooldown.value = Math.max(0, collisionCooldown.value - dt)

    if (timeLeft.value <= 0) {
      finishTurn(false, 'Hết giờ! Thử vuốt nhanh và ngắn để tạo gió chính xác hơn.')
      return
    }

    const elapsed = config.timeLimit - timeLeft.value

    for (const obstacle of obstacles.value) {
      obstacle.y += obstacle.speed * dt
      if (obstacle.y > height + obstacle.radius + 12) {
        obstacle.y = -obstacle.radius - 10
      }

      obstacle.x = clamp(
        obstacle.baseX + Math.sin(elapsed * 1.4 + obstacle.phase) * obstacle.sway,
        16,
        width - 16,
      )
    }

    const currentX =
      Math.sin((boat.y / height) * Math.PI * 2.6 + elapsed * 1.8) * config.riverCurrentX
    const currentY =
      config.riverCurrentYBase +
      Math.cos((boat.x / width) * Math.PI * 2.2 + elapsed * 1.2) * config.riverCurrentYWave

    const targetVx = currentX + wind.x
    const targetVy = currentY + wind.y
    const blend = Math.min(1, dt * 3.8)

    boat.vx += (targetVx - boat.vx) * blend
    boat.vy += (targetVy - boat.vy) * blend

    for (const whirlpool of whirlpools.value) {
      const dx = whirlpool.x - boat.x
      const dy = whirlpool.y - boat.y
      const distance = Math.hypot(dx, dy)
      if (distance >= whirlpool.radius || distance < 0.1) {
        continue
      }

      const pull = (1 - distance / whirlpool.radius) * whirlpool.strength
      boat.vx += (dx / distance) * pull * dt
      boat.vy += (dy / distance) * pull * dt
    }

    boat.x += boat.vx * dt
    boat.y += boat.vy * dt

    if (boat.x <= EDGE_MARGIN) {
      boat.x = EDGE_MARGIN
      applyCollision(28, -12)
    } else if (boat.x >= width - EDGE_MARGIN) {
      boat.x = width - EDGE_MARGIN
      applyCollision(-28, -12)
    }

    boat.y = clamp(boat.y, 18, height - 18)

    for (const obstacle of obstacles.value) {
      const dx = boat.x - obstacle.x
      const dy = boat.y - obstacle.y
      const distance = Math.hypot(dx, dy)
      if (distance >= obstacle.radius + BOAT_RADIUS || distance < 0.1) {
        continue
      }

      const normalX = dx / distance
      const normalY = dy / distance
      applyCollision(normalX * 84, normalY * 58)
    }

    const windDecay = Math.exp(-dt * 2.8)
    wind.x *= windDecay
    wind.y *= windDecay

    trailPoints.value = trailPoints.value
      .map((point) => ({
        ...point,
        life: point.life - dt * 1.9,
      }))
      .filter((point) => point.life > 0)

    progress.value = clamp((height - boat.y) / (height - 30), 0, 1)

    if (boat.y <= 28) {
      finishTurn(true, 'Cập bờ thành công! Luồng gió của bạn quá chuẩn.')
    }
  }

  useRafFn(({ delta }) => {
    if (phase.value !== 'running') {
      return
    }

    const dt = clamp(delta / 1000, 0, 0.033)
    stepSimulation(dt)
  })

  return {
    gameMode,
    difficultyLevel,
    difficultyLabel,
    phase,
    timeLeft,
    progress,
    turnMessage,
    riverTick,
    boat,
    obstacles,
    whirlpools,
    trailPoints,
    windPower,
    boatAngle,
    activePlayerLabel,
    stageLabel,
    turnSummaryButtonLabel,
    playerOneScore,
    playerTwoScore,
    summaryHeadline,
    riverStyle,
    setBoardElement,
    setMode,
    setDifficulty,
    startMatch,
    startSecondPlayerTurn,
    returnToSetup,
    replayMatch,
    handleBoardPointerDown,
    handleBoardPointerMove,
    handleBoardPointerUp,
  }
}
