import { ref, type Ref } from 'vue'

/** Player colors matching design system: coral for P1, sky for P2 */
export const PLAYER_COLORS = {
  p1: { r: 255, g: 107, b: 74, hex: '#FF6B4A' }, // accent-coral
  p2: { r: 56, g: 189, b: 248, hex: '#38BDF8' }, // accent-sky
} as const

const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 400
const BRUSH_SIZE = 8
const ROUND_DURATION = 60 // seconds

export interface CanvasDrawEvent {
  x: number
  y: number
  /** previous x (for line interpolation) — -1 means no previous point */
  px: number
  /** previous y (for line interpolation) — -1 means no previous point */
  py: number
  s: number
  d: number // 1=drawing, 0=pen lifted
}

export function useSketchWarsGameCanvas(
  canvasRef: Ref<HTMLCanvasElement | null>,
  isHost: Ref<boolean>,
) {
  const timeLeft = ref(ROUND_DURATION)
  const isPlaying = ref(false)
  const scores = ref({ p1: 0, p2: 0 })
  const round = ref(1)
  const totalRounds = 3
  const winner = ref<'p1' | 'p2' | 'draw' | null>(null)
  const roundWins = ref({ p1: 0, p2: 0 })

  let ctx: CanvasRenderingContext2D | null = null
  let timerInterval: ReturnType<typeof setInterval> | null = null
  let lastPos: { x: number; y: number } | null = null
  let onDrawCallback: ((e: CanvasDrawEvent) => void) | null = null

  /** Register callback when local player draws */
  function onDraw(cb: (e: CanvasDrawEvent) => void) {
    onDrawCallback = cb
  }

  /** Initialize canvas with dark background */
  function initCanvas() {
    const canvas = canvasRef.value
    if (!canvas) return
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT
    ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    ctx.fillStyle = '#0F1923' // bg-deep
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  }

  /** Draw a circle at position with given player color */
  function drawAt(x: number, y: number, size: number, player: 'p1' | 'p2') {
    if (!ctx) return
    const color = PLAYER_COLORS[player]
    ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }

  /** Draw a line between two points for smooth strokes */
  function drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    size: number,
    player: 'p1' | 'p2',
  ) {
    if (!ctx) return
    const color = PLAYER_COLORS[player]
    ctx.strokeStyle = `rgb(${color.r}, ${color.g}, ${color.b})`
    ctx.lineWidth = size * 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  /** Handle remote player's draw event — draws line + dot just like local */
  function handleRemoteDraw(e: CanvasDrawEvent) {
    const remotePlayer = isHost.value ? 'p2' : 'p1'
    if (e.d === 1) {
      // If previous point exists, draw a line for smooth strokes
      if (e.px >= 0 && e.py >= 0) {
        drawLine(e.px, e.py, e.x, e.y, e.s, remotePlayer)
      }
      drawAt(e.x, e.y, e.s, remotePlayer)
    }
  }

  /** Get normalized coordinates from pointer event */
  function getCanvasPos(e: PointerEvent): { x: number; y: number } {
    const canvas = canvasRef.value
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  /** Pointer event handlers for local drawing */
  function handlePointerDown(e: PointerEvent) {
    if (!isPlaying.value) return
    const pos = getCanvasPos(e)
    const localPlayer = isHost.value ? 'p1' : 'p2'
    drawAt(pos.x, pos.y, BRUSH_SIZE, localPlayer)
    lastPos = pos
    onDrawCallback?.({ x: pos.x, y: pos.y, px: -1, py: -1, s: BRUSH_SIZE, d: 1 })
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isPlaying.value || !lastPos) return
    const pos = getCanvasPos(e)
    const localPlayer = isHost.value ? 'p1' : 'p2'
    drawLine(lastPos.x, lastPos.y, pos.x, pos.y, BRUSH_SIZE, localPlayer)
    drawAt(pos.x, pos.y, BRUSH_SIZE, localPlayer)
    const prevPos = lastPos
    lastPos = pos
    onDrawCallback?.({ x: pos.x, y: pos.y, px: prevPos.x, py: prevPos.y, s: BRUSH_SIZE, d: 1 })
  }

  function handlePointerUp() {
    lastPos = null
    onDrawCallback?.({ x: 0, y: 0, px: -1, py: -1, s: BRUSH_SIZE, d: 0 })
  }

  /** Count pixels for each player to determine score */
  function countPixels(): { p1: number; p2: number } {
    if (!ctx) return { p1: 0, p2: 0 }
    const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    const data = imageData.data
    let p1Count = 0
    let p2Count = 0

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] ?? 0
      const g = data[i + 1] ?? 0
      const b = data[i + 2] ?? 0
      // Match coral (P1): high red, moderate green, low-ish blue
      if (r > 200 && g < 150 && b < 120) p1Count++
      // Match sky (P2): low red, high green, high blue
      if (r < 100 && g > 150 && b > 200) p2Count++
    }

    return { p1: p1Count, p2: p2Count }
  }

  /** Start a round countdown */
  function startRound() {
    initCanvas()
    timeLeft.value = ROUND_DURATION
    isPlaying.value = true
    winner.value = null

    timerInterval = setInterval(() => {
      timeLeft.value--
      if (timeLeft.value <= 0) {
        endRound()
      }
    }, 1000)
  }

  /** End current round, count pixels, update scores */
  function endRound() {
    isPlaying.value = false
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }

    const pixelScores = countPixels()
    scores.value = pixelScores

    if (pixelScores.p1 > pixelScores.p2) {
      roundWins.value.p1++
    } else if (pixelScores.p2 > pixelScores.p1) {
      roundWins.value.p2++
    }

    // Check if match is over (best of 3)
    if (roundWins.value.p1 >= 2) {
      winner.value = 'p1'
    } else if (roundWins.value.p2 >= 2) {
      winner.value = 'p2'
    } else if (round.value >= totalRounds) {
      if (roundWins.value.p1 > roundWins.value.p2) winner.value = 'p1'
      else if (roundWins.value.p2 > roundWins.value.p1) winner.value = 'p2'
      else winner.value = 'draw'
    }

    return pixelScores
  }

  /** Move to next round */
  function nextRound() {
    round.value++
    startRound()
  }

  /** Reset entire match */
  function resetMatch() {
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = null
    isPlaying.value = false
    timeLeft.value = ROUND_DURATION
    scores.value = { p1: 0, p2: 0 }
    round.value = 1
    roundWins.value = { p1: 0, p2: 0 }
    winner.value = null
    lastPos = null
    initCanvas()
  }

  return {
    timeLeft,
    isPlaying,
    scores,
    round,
    totalRounds,
    winner,
    roundWins,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    initCanvas,
    onDraw,
    handleRemoteDraw,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    startRound,
    endRound,
    nextRound,
    resetMatch,
  }
}
