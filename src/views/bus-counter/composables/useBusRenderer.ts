import { ref, type Ref } from 'vue'
import type { Passenger } from '../types'
import {
  BUS_X,
  BUS_Y,
  BUS_W,
  BUS_H,
  SEAT_W,
  SEAT_H,
  COL_PITCH,
  NUM_COLS,
  SEAT_POSITIONS,
  ROW_Y_CENTERS,
  BUS_INTERIOR_START_X,
} from './usePassengerManager'

// Canvas
const CANVAS_BASE_W = 580
const CANVAS_BASE_H = 210
const ROAD_STRIP_H = 22
const BUS_OFFSET_Y = ROAD_STRIP_H
const BUS_RADIUS = 10

// Colors
const BUS_BODY_COLOR = '#1a3a5c'
const BUS_BODY_STROKE = '#2d5a8a'
const BUS_ROOF_COLOR = '#1e4470'
const SEAT_COLOR = '#253549'
const SEAT_STROKE = '#2d5a8a'
const AISLE_COLOR = '#0f1923'
const DOOR_OPEN_COLOR = '#38BDF8'
const DOOR_CLOSED_COLOR = '#253549'
const WINDOW_COLOR = '#38BDF880'
const ROAD_COLOR = '#1a1a2e'
const SIDEWALK_COLOR = '#252540'
const ROAD_LINE_COLOR = '#FFB83080'
const BUILDING_COLORS = ['#141428', '#1a1a35', '#12122a', '#1e1e38', '#161630']
const WINDOW_LIT_COLOR = '#FFB83040'
const TREE_GREEN = '#2d6b30'
const TREE_DARK = '#1e4a20'

interface SceneryElement {
  x: number
  w: number
  h: number
  type: 'building' | 'tree'
  color: string
  windowCols: number
  windowRows: number
}
const SCENERY_REPEAT = 900

function generateScenery(): SceneryElement[] {
  const elements: SceneryElement[] = []
  let cx = 0
  while (cx < SCENERY_REPEAT) {
    if (Math.random() < 0.72) {
      const w = 18 + Math.random() * 35
      const h = 8 + Math.random() * 18
      elements.push({
        x: cx,
        w,
        h,
        type: 'building',
        color: BUILDING_COLORS[Math.floor(Math.random() * BUILDING_COLORS.length)]!,
        windowCols: Math.floor(w / 9),
        windowRows: Math.floor(h / 7),
      })
      cx += w + 2 + Math.random() * 6
    } else {
      elements.push({
        x: cx,
        w: 8,
        h: 8,
        type: 'tree',
        color: Math.random() < 0.5 ? TREE_GREEN : TREE_DARK,
        windowCols: 0,
        windowRows: 0,
      })
      cx += 14 + Math.random() * 8
    }
  }
  return elements
}

// Door gap geometry
function getDoorGap(doorCols: number[]): { left: number; right: number; centerX: number } {
  const minCol = Math.min(...doorCols)
  const maxCol = Math.max(...doorCols)
  const left = BUS_INTERIOR_START_X + minCol * COL_PITCH - 4
  const right = BUS_INTERIOR_START_X + maxCol * COL_PITCH + SEAT_W + 4
  return { left, right, centerX: (left + right) / 2 }
}
const DOOR_1_GAP = getDoorGap([3, 4])
const DOOR_2_GAP = getDoorGap([8, 9])

export function useBusRenderer(
  canvasRef: Ref<HTMLCanvasElement | null>,
  passengers: Ref<Passenger[]>,
) {
  const isDoorOpen = ref(false)
  const isTransit = ref(false)
  let scrollX = 0
  let transitFrame = 0

  const topScenery = generateScenery()
  const bottomScenery = generateScenery()

  function getScale(): number {
    const canvas = canvasRef.value
    if (!canvas) return 1
    return canvas.width / CANVAS_BASE_W
  }

  function draw() {
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (isTransit.value) {
      scrollX += 1.5
      transitFrame++
    }
    const scale = getScale()
    ctx.save()
    ctx.scale(scale, scale)
    ctx.clearRect(0, 0, CANVAS_BASE_W, CANVAS_BASE_H)

    // Road strips
    drawRoadStrip(ctx, 0, ROAD_STRIP_H, topScenery, 'top')
    drawRoadStrip(ctx, CANVAS_BASE_H - ROAD_STRIP_H, CANVAS_BASE_H, bottomScenery, 'bottom')

    // Bus area
    ctx.save()
    ctx.translate(0, BUS_OFFSET_Y)
    if (isTransit.value) {
      ctx.translate(Math.sin(transitFrame * 0.8) * 0.6, Math.cos(transitFrame * 1.2) * 0.4)
    }
    drawBusBody(ctx)
    drawAisle(ctx)
    drawSeats(ctx)
    drawDoors(ctx)
    drawPassengers(ctx)
    drawWindowStrips(ctx)
    ctx.restore()

    ctx.restore()
  }

  // ── Road & Scenery ──
  function drawRoadStrip(
    ctx: CanvasRenderingContext2D,
    yS: number,
    yE: number,
    scenery: SceneryElement[],
    side: 'top' | 'bottom',
  ) {
    const h = yE - yS
    const sw = 8
    if (side === 'top') {
      ctx.fillStyle = SIDEWALK_COLOR
      ctx.fillRect(0, yS, CANVAS_BASE_W, sw)
      ctx.fillStyle = ROAD_COLOR
      ctx.fillRect(0, yS + sw, CANVAS_BASE_W, h - sw)
      drawDashedLine(ctx, yS + sw + (h - sw) / 2)
      drawSceneryElements(ctx, scenery, yS, side)
    } else {
      ctx.fillStyle = ROAD_COLOR
      ctx.fillRect(0, yS, CANVAS_BASE_W, h - sw)
      ctx.fillStyle = SIDEWALK_COLOR
      ctx.fillRect(0, yE - sw, CANVAS_BASE_W, sw)
      drawDashedLine(ctx, yS + (h - sw) / 2)
      drawSceneryElements(ctx, scenery, yE, side)
    }
  }

  function drawDashedLine(ctx: CanvasRenderingContext2D, y: number) {
    ctx.strokeStyle = ROAD_LINE_COLOR
    ctx.lineWidth = 1.5
    ctx.setLineDash([6, 10])
    ctx.lineDashOffset = -scrollX
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(CANVAS_BASE_W, y)
    ctx.stroke()
    ctx.setLineDash([])
  }

  function drawSceneryElements(
    ctx: CanvasRenderingContext2D,
    scenery: SceneryElement[],
    baseline: number,
    side: 'top' | 'bottom',
  ) {
    for (const el of scenery) {
      let ex = (el.x - scrollX * 0.8) % SCENERY_REPEAT
      if (ex < -60) ex += SCENERY_REPEAT
      if (ex > CANVAS_BASE_W + 60) continue
      if (el.type === 'building') {
        const by = side === 'top' ? baseline - el.h : baseline
        ctx.fillStyle = el.color
        ctx.fillRect(ex, by, el.w, el.h)
        for (let r = 0; r < el.windowRows; r++)
          for (let c = 0; c < el.windowCols; c++) {
            if ((c + r) % 3 !== 0) continue
            ctx.fillStyle = WINDOW_LIT_COLOR
            ctx.fillRect(ex + 3 + c * 9, by + 3 + r * 7, 3, 3)
          }
      } else {
        const ty = side === 'top' ? baseline - 2 : baseline + 2
        ctx.fillStyle = '#4a3520'
        ctx.fillRect(ex + 3, side === 'top' ? ty - 3 : ty, 2, 4)
        ctx.beginPath()
        ctx.arc(ex + 4, side === 'top' ? ty - 6 : ty + 7, el.h / 2, 0, Math.PI * 2)
        ctx.fillStyle = el.color
        ctx.fill()
      }
    }
  }

  // ── Bus Body ──
  function drawBusBody(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    roundRect(ctx, BUS_X + 3, BUS_Y + 3, BUS_W, BUS_H, BUS_RADIUS)
    ctx.fill()

    ctx.fillStyle = BUS_BODY_COLOR
    roundRect(ctx, BUS_X, BUS_Y, BUS_W, BUS_H, BUS_RADIUS)
    ctx.fill()
    ctx.strokeStyle = BUS_BODY_STROKE
    ctx.lineWidth = 2
    roundRect(ctx, BUS_X, BUS_Y, BUS_W, BUS_H, BUS_RADIUS)
    ctx.stroke()

    // Roof accent
    ctx.fillStyle = BUS_ROOF_COLOR
    ctx.fillRect(BUS_X + 6, BUS_Y + BUS_H - 6, BUS_W - 12, 4)

    // Front indicator (left side)
    ctx.fillStyle = '#FFB830'
    ctx.fillRect(BUS_X + 4, BUS_Y + BUS_H / 2 - 8, 4, 16)

    // Route number
    ctx.fillStyle = '#FFB830'
    ctx.font = 'bold 11px "Anybody", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('02', BUS_X + 22, BUS_Y + BUS_H / 2 + 4)

    // Rear light (right side)
    ctx.fillStyle = '#FF4444'
    ctx.fillRect(BUS_X + BUS_W - 8, BUS_Y + 20, 4, 10)
    ctx.fillRect(BUS_X + BUS_W - 8, BUS_Y + BUS_H - 30, 4, 10)
  }

  // ── Aisle (center corridor) ──
  function drawAisle(ctx: CanvasRenderingContext2D) {
    const aisleTop = ROW_Y_CENTERS[1]! + SEAT_H / 2 + 2
    const aisleBottom = ROW_Y_CENTERS[2]! - SEAT_H / 2 - 2
    ctx.fillStyle = AISLE_COLOR
    ctx.fillRect(
      BUS_INTERIOR_START_X - 5,
      aisleTop,
      NUM_COLS * COL_PITCH + SEAT_W + 5,
      aisleBottom - aisleTop,
    )
  }

  // ── Seats ──
  function drawSeats(ctx: CanvasRenderingContext2D) {
    for (const seat of SEAT_POSITIONS) {
      const sx = BUS_INTERIOR_START_X + seat.col * COL_PITCH
      const sy = seat.y - SEAT_H / 2
      ctx.fillStyle = SEAT_COLOR
      ctx.fillRect(sx, sy, SEAT_W, SEAT_H)
      ctx.strokeStyle = SEAT_STROKE
      ctx.lineWidth = 0.5
      ctx.strokeRect(sx, sy, SEAT_W, SEAT_H)
    }
  }

  // ── Doors (top edge) ──
  function drawDoors(ctx: CanvasRenderingContext2D) {
    drawSingleDoor(ctx, DOOR_1_GAP, 'CỬA 1')
    drawSingleDoor(ctx, DOOR_2_GAP, 'CỬA 2')
  }

  function drawSingleDoor(
    ctx: CanvasRenderingContext2D,
    gap: { left: number; right: number; centerX: number },
    label: string,
  ) {
    const doorW = gap.right - gap.left
    const doorH = 20
    const doorY = BUS_Y - 2

    if (isDoorOpen.value) {
      ctx.fillStyle = DOOR_OPEN_COLOR + '20'
      ctx.fillRect(gap.left - 2, doorY - 4, doorW + 4, doorH + 8)
      ctx.fillStyle = DOOR_OPEN_COLOR
      ctx.fillRect(gap.left, doorY, 3, doorH)
      ctx.fillRect(gap.right - 3, doorY, 3, doorH)
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillStyle = DOOR_OPEN_COLOR
      ctx.fillText('⇅', gap.centerX, doorY + doorH / 2 + 3)
    } else {
      ctx.fillStyle = DOOR_CLOSED_COLOR
      ctx.fillRect(gap.left, doorY, doorW, doorH)
      ctx.strokeStyle = BUS_BODY_STROKE
      ctx.lineWidth = 1
      ctx.strokeRect(gap.left, doorY, doorW, doorH)
      ctx.beginPath()
      ctx.moveTo(gap.centerX, doorY)
      ctx.lineTo(gap.centerX, doorY + doorH)
      ctx.stroke()
    }

    ctx.fillStyle = isDoorOpen.value ? DOOR_OPEN_COLOR : DOOR_OPEN_COLOR + '50'
    ctx.font = 'bold 6px "Anybody", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(label, gap.centerX, doorY - 5)
  }

  // ── Window strips (bottom edge — no doors there) ──
  function drawWindowStrips(ctx: CanvasRenderingContext2D) {
    const winSize = 8
    const gap = 32
    // Bottom edge windows
    for (let i = 0; i < 15; i++) {
      const x = BUS_X + 40 + i * gap
      if (x > BUS_X + BUS_W - 30) break
      ctx.fillStyle = WINDOW_COLOR
      ctx.fillRect(x, BUS_Y + BUS_H - 4, winSize, 3)
    }
    // Top edge windows (between doors)
    for (let i = 0; i < 15; i++) {
      const x = BUS_X + 40 + i * gap
      if (x > BUS_X + BUS_W - 30) break
      // Skip if in door gap
      if (x >= DOOR_1_GAP.left - 5 && x <= DOOR_1_GAP.right + 5) continue
      if (x >= DOOR_2_GAP.left - 5 && x <= DOOR_2_GAP.right + 5) continue
      ctx.fillStyle = WINDOW_COLOR
      ctx.fillRect(x, BUS_Y + 1, winSize, 3)
    }
  }

  // ── Passengers ──
  function drawPassengers(ctx: CanvasRenderingContext2D) {
    for (const p of passengers.value) {
      p.x += (p.targetX - p.x) * 0.12
      p.y += (p.targetY - p.y) * 0.12
      const r = 6
      ctx.beginPath()
      ctx.arc(p.x, p.y, r + 2, 0, Math.PI * 2)
      ctx.fillStyle = p.color + '30'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.fill()
      ctx.beginPath()
      ctx.arc(p.x - 1.5, p.y - 1.5, 2, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.fill()
    }
  }

  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  function setDoorOpen(open: boolean) {
    isDoorOpen.value = open
  }
  function setTransit(transit: boolean) {
    isTransit.value = transit
    if (!transit) transitFrame = 0
  }

  return { draw, setDoorOpen, setTransit, isDoorOpen, isTransit, CANVAS_BASE_W, CANVAS_BASE_H }
}
