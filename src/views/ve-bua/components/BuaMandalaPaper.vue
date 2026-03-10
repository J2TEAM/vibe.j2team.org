<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import nenGiayImage from '../res/nenGiay.png'
import vienBuaImage from '../res/vienBua.png'
import type { BrushSettings, DrawingStats, Point01, StrokeRecord } from '../types/drawing'
import { createRng, randomSeed, type Rng } from '../utils/rng'

type Point = {
  x: number
  y: number
}

type HslColor = {
  h: number
  s: number
  l: number
}

type DrawableBox = {
  x: number
  y: number
  width: number
  height: number
}

type PaperTransform = {
  offsetX: number
  offsetY: number
  scale: number
}

type DrawingTransform = {
  offsetX: number
  offsetY: number
  scale: number
}

type BurnParticle = {
  id: number
  x: number
  size: number
  duration: number
  drift: number
  vertical: number
  scale: number
  opacity: number
  start: number
}

type PaperSnapshot = {
  drawingDataUrl: string
  center: Point
  axisAngles: number[]
}

type PaperPresetState = {
  center: Point
  axisAngles: number[]
  clearDrawing: boolean
}

const props = defineProps<{
  brushColor: string
  brushSize: number
  brushOpacity: number
  brushSizeRandomness: number
  brushOpacityRandomness: number
  brushTool: 'draw' | 'erase'
  paperTint: string
  frameTint: string
  axisCount: number
  showGuides: boolean
  showAxisEditor: boolean
  freeDraw: boolean
  drawableBox: DrawableBox
  showDrawableEditor: boolean
  paperTransform: PaperTransform
  showPaperTransformEditor: boolean
  drawingTransform: DrawingTransform
  showDrawingTransformEditor: boolean
}>()

const emit = defineEmits<{
  burned: []
  'update:drawableBox': [value: DrawableBox]
  'update:paperTransform': [value: PaperTransform]
  'update:drawingTransform': [value: DrawingTransform]
  'burning-change': [value: boolean]
  'burning-progress': [value: number]
  'toggle-drawable-editor': []
  'reset-drawing-transform': []
}>()

const paperRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const paperWidth = ref(0)
const paperHeight = ref(0)
const axisAngles = ref<number[]>([])
const isDrawing = ref(false)
const lastPoint = ref<Point | null>(null)
const hasStrokeChanges = ref(false)
const tapStartPoint = ref<Point | null>(null)
const tapMoved = ref(false)
const isBurning = ref(false)
const burnProgress = ref(0)
const activeDrag = ref<'none' | 'center' | 'axis'>('none')
const draggedAxisIndex = ref(-1)
const center = ref<Point>({ x: 0.5, y: 0.74 })
const burnTrailParticles = ref<BurnParticle[]>([])
const baseRasterDataUrl = ref('')
const strokes = ref<StrokeRecord[]>([])
const activeStroke = ref<{
  record: StrokeRecord
  rng: Rng
  lastBrush: BrushSettings
} | null>(null)

const drawableDragMode = ref<'none' | 'move' | 'nw' | 'ne' | 'sw' | 'se'>('none')
const drawableStartPoint = ref<Point | null>(null)
const drawableStartBox = ref<DrawableBox | null>(null)
const paperTransformDragMode = ref<'none' | 'move' | 'scale'>('none')
const paperTransformStartPoint = ref<Point | null>(null)
const paperTransformStart = ref<PaperTransform | null>(null)
const paperTransformStartDistance = ref(1)
const paperTransformStartClient = ref<Point | null>(null)
const paperTransformCenterClient = ref<Point | null>(null)
const transformCacheBitmap = ref<ImageBitmap | null>(null)
const transformCacheCanvas = ref<HTMLCanvasElement | null>(null)
const drawingTransformDragMode = ref<'none' | 'move' | 'scale'>('none')
const drawingTransformStartClient = ref<Point | null>(null)
const drawingTransformStart = ref<DrawingTransform | null>(null)
const drawingTransformStartDistance = ref(1)
const drawingTransformCenterClient = ref<Point | null>(null)
const drawingTransformCacheBitmap = ref<ImageBitmap | null>(null)
const drawingTransformCacheCanvas = ref<HTMLCanvasElement | null>(null)
const drawableCacheBitmap = ref<ImageBitmap | null>(null)
const drawableCacheCanvas = ref<HTMLCanvasElement | null>(null)
const drawableCacheRect = ref<{ left: number; top: number; width: number; height: number } | null>(
  null,
)

let resizeObserver: ResizeObserver | null = null
let burnRaf = 0
let undoRenderTimeout = 0
const BURN_DURATION_MS = 2850
const TRAIL_DURATION_BASE_MS = 5700

const drawableRect = computed(() => ({
  left: paperWidth.value * props.drawableBox.x,
  top: paperHeight.value * props.drawableBox.y,
  width: paperWidth.value * props.drawableBox.width,
  height: paperHeight.value * props.drawableBox.height,
}))

const centerPixels = computed<Point>(() => ({
  x: center.value.x * paperWidth.value,
  y: center.value.y * paperHeight.value,
}))

const artifactLayerStyle = computed(() => {
  const remain = Math.max(0, 1 - burnProgress.value)
  return {
    clipPath: `inset(0 0 ${Math.min(100, burnProgress.value * 100)}% 0)`,
    opacity: `${remain}`,
    transform: `translateY(${burnProgress.value * 10}px) scale(${1 - burnProgress.value * 0.22})`,
  }
})

const paperImageStyle = computed(() => buildHueFilter(props.paperTint, 45, 1.08, 1.02))
const frameImageStyle = computed(() => buildHueFilter(props.frameTint, 7, 1.25, 0.96))
const paperShellStyle = computed(() => ({
  width: `calc(min(84vw, 430px, 62vh) * ${props.paperTransform.scale})`,
  aspectRatio: '3 / 5',
  left: `calc(50% + ${props.paperTransform.offsetX}px)`,
  top: `calc(50% + ${props.paperTransform.offsetY}px)`,
  transform: 'translate(-50%, -50%)',
}))

function sanitizeDrawableBox(box: DrawableBox): DrawableBox {
  const minWidth = 0.2
  const minHeight = 0.2
  const width = Math.max(minWidth, Math.min(0.95, box.width))
  const height = Math.max(minHeight, Math.min(0.95, box.height))
  const x = Math.min(1 - width, Math.max(0, box.x))
  const y = Math.min(1 - height, Math.max(0, box.y))
  return { x, y, width, height }
}

function sanitizeBrushTool(tool: string | undefined): 'draw' | 'erase' {
  return tool === 'erase' ? 'erase' : 'draw'
}

function normalizeLineAngle(angle: number): number {
  let fixed = angle
  while (fixed < 0) fixed += Math.PI
  while (fixed >= Math.PI) fixed -= Math.PI
  return fixed
}

function randomAngles(count: number): number[] {
  const values: number[] = []
  for (let i = 0; i < count; i += 1) {
    values.push(normalizeLineAngle(Math.random() * Math.PI))
  }
  return values
}

function evenAngles(count: number): number[] {
  const values: number[] = []
  for (let i = 0; i < count; i += 1) {
    values.push((Math.PI * i) / count)
  }
  return values
}

function setPaperSize() {
  const el = paperRef.value
  if (!el) return
  const bounds = el.getBoundingClientRect()
  paperWidth.value = bounds.width
  paperHeight.value = bounds.height
  resizeCanvas()
}

function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = drawableRect.value
  const ratio = window.devicePixelRatio || 1
  const previousWidth = canvas.width
  const previousHeight = canvas.height
  const backup = document.createElement('canvas')
  let hasBackup = false
  if (previousWidth > 0 && previousHeight > 0) {
    backup.width = previousWidth
    backup.height = previousHeight
    const backupCtx = backup.getContext('2d')
    if (backupCtx) {
      backupCtx.drawImage(canvas, 0, 0)
      hasBackup = true
    }
  }
  canvas.width = Math.max(1, Math.round(rect.width * ratio))
  canvas.height = Math.max(1, Math.round(rect.height * ratio))
  canvas.style.width = `${rect.width}px`
  canvas.style.height = `${rect.height}px`
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  if (
    props.showPaperTransformEditor &&
    (transformCacheBitmap.value || transformCacheCanvas.value)
  ) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const source = transformCacheBitmap.value ?? transformCacheCanvas.value
    if (source) {
      ctx.drawImage(source, 0, 0, rect.width, rect.height)
    }
    return
  }
  if (
    props.showDrawingTransformEditor &&
    (drawingTransformCacheBitmap.value || drawingTransformCacheCanvas.value)
  ) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const source = drawingTransformCacheBitmap.value ?? drawingTransformCacheCanvas.value
    if (source) {
      drawDrawingTransformSource(ctx, source, rect, props.drawingTransform)
    }
    return
  }
  if (
    props.showDrawableEditor &&
    drawableCacheRect.value &&
    (drawableCacheBitmap.value || drawableCacheCanvas.value)
  ) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const source = drawableCacheBitmap.value ?? drawableCacheCanvas.value
    const cached = drawableCacheRect.value
    if (source && cached) {
      const dx = cached.left - rect.left
      const dy = cached.top - rect.top
      ctx.drawImage(source, dx, dy, cached.width, cached.height)
    }
    return
  }
  if (strokes.value.length > 0 || baseRasterDataUrl.value) {
    void renderAllStrokes()
    return
  }
  if (hasBackup) {
    ctx.drawImage(backup, 0, 0, backup.width, backup.height, 0, 0, rect.width, rect.height)
  }
}

function drawDrawingTransformSource(
  ctx: CanvasRenderingContext2D,
  source: ImageBitmap | HTMLCanvasElement,
  rect: { width: number; height: number },
  transform: DrawingTransform,
) {
  const pivotX = rect.width * 0.5
  const pivotY = rect.height * 0.5
  ctx.save()
  ctx.translate(pivotX, pivotY)
  ctx.scale(transform.scale, transform.scale)
  ctx.translate(-pivotX, -pivotY)
  ctx.translate(transform.offsetX, transform.offsetY)
  ctx.drawImage(source, 0, 0, rect.width, rect.height)
  ctx.restore()
}

function getLocalPoint(event: PointerEvent): Point | null {
  const el = paperRef.value
  if (!el) return null
  const bounds = el.getBoundingClientRect()
  return {
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top,
  }
}

function toCanvasPoint(localPoint: Point): Point | null {
  const rect = drawableRect.value
  const x = localPoint.x - rect.left
  const y = localPoint.y - rect.top
  if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null
  return { x, y }
}

function axisPointAt(index: number, dir: 1 | -1): Point {
  const angle = axisAngles.value[index] ?? 0
  const radius = Math.min(paperWidth.value, paperHeight.value) * 0.44
  const cx = centerPixels.value.x
  const cy = centerPixels.value.y
  return {
    x: cx + Math.cos(angle) * radius * dir,
    y: cy + Math.sin(angle) * radius * dir,
  }
}

function reflectPoint(point: Point, axisAngle: number, centerPx: Point): Point {
  const cx = centerPx.x
  const cy = centerPx.y
  const vx = Math.cos(axisAngle)
  const vy = Math.sin(axisAngle)
  const dx = point.x - cx
  const dy = point.y - cy
  const projection = dx * vx + dy * vy
  const px = projection * vx
  const py = projection * vy
  const perpX = dx - px
  const perpY = dy - py
  return {
    x: cx + px - perpX,
    y: cy + py - perpY,
  }
}

function drawBlurDot(
  ctx: CanvasRenderingContext2D,
  point: Point,
  color: string,
  baseSize: number,
  rng: Rng,
) {
  const size = baseSize * (0.7 + rng() * 0.5)
  const alpha = 0.06 + rng() * 0.14
  ctx.fillStyle = hexToRgba(color, alpha)
  ctx.beginPath()
  ctx.arc(point.x, point.y, size, 0, Math.PI * 2)
  ctx.fill()
}

function drawSegment(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  brush: BrushSettings,
  rng: Rng,
) {
  const layers = 3
  const rect = drawableRect.value
  const basis = Math.max(1, Math.min(rect.width, rect.height))
  const base = Math.max(
    1,
    (brush.brushSizeRel ?? 0) > 0 ? brush.brushSizeRel! * basis : brush.brushSize,
  )
  const baseOpacity = Math.min(1, Math.max(0.1, brush.brushOpacity / 100))
  const tool = brush.tool ?? 'draw'

  if (tool === 'erase') {
    ctx.save()
    ctx.globalCompositeOperation = 'destination-out'
    ctx.strokeStyle = `rgb(0 0 0 / ${baseOpacity})`
    ctx.lineWidth = base
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
    ctx.restore()
    return
  }

  ctx.globalCompositeOperation = 'source-over'
  const sizeRandomness = Math.min(1, Math.max(0, brush.brushSizeRandomness / 100))
  const opacityRandomness = Math.min(1, Math.max(0, brush.brushOpacityRandomness / 100))
  for (let i = 0; i < layers; i += 1) {
    const minThickness = Math.max(0.6, base * Math.max(0.15, 1 - sizeRandomness * 0.85))
    const maxThickness = Math.max(minThickness + 0.2, base * (1 + sizeRandomness * 2.8))
    const thickness = minThickness + rng() * (maxThickness - minThickness)
    const minOpacity = Math.max(0.06, 0.24 - opacityRandomness * 0.2)
    const maxOpacity = Math.min(0.95, 0.42 + opacityRandomness * 0.45)
    const opacity = Math.min(0.98, (minOpacity + rng() * (maxOpacity - minOpacity)) * baseOpacity)
    const jitter = Math.max(0.2, base * (0.08 + sizeRandomness * 0.46))
    const jx1 = (rng() - 0.5) * jitter
    const jy1 = (rng() - 0.5) * jitter
    const jx2 = (rng() - 0.5) * jitter
    const jy2 = (rng() - 0.5) * jitter
    ctx.strokeStyle = hexToRgba(brush.brushColor, opacity)
    ctx.lineWidth = thickness
    ctx.beginPath()
    ctx.moveTo(from.x + jx1, from.y + jy1)
    ctx.lineTo(to.x + jx2, to.y + jy2)
    ctx.stroke()
    if (rng() > 0.42) {
      drawBlurDot(ctx, to, brush.brushColor, thickness * 0.42, rng)
    }
  }
}

function drawSymmetry(
  fromCanvas: Point,
  toCanvas: Point,
  brush: BrushSettings,
  rng: Rng,
  snapshot: { axisAngles: number[]; centerPx: Point },
) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  if (brush.freeDraw) {
    drawSegment(ctx, fromCanvas, toCanvas, brush, rng)
    return
  }

  const rect = drawableRect.value
  const fromAbs = { x: fromCanvas.x + rect.left, y: fromCanvas.y + rect.top }
  const toAbs = { x: toCanvas.x + rect.left, y: toCanvas.y + rect.top }

  const basePairs: Array<{ from: Point; to: Point }> = [{ from: fromAbs, to: toAbs }]
  for (const angle of snapshot.axisAngles) {
    basePairs.push({
      from: reflectPoint(fromAbs, angle, snapshot.centerPx),
      to: reflectPoint(toAbs, angle, snapshot.centerPx),
    })
  }

  for (const pair of basePairs) {
    const start = { x: pair.from.x - rect.left, y: pair.from.y - rect.top }
    const end = { x: pair.to.x - rect.left, y: pair.to.y - rect.top }
    drawSegment(ctx, start, end, brush, rng)
  }
}

function getCurrentDrawingDataUrl(): string {
  const canvas = canvasRef.value
  if (!canvas) return ''
  return canvas.toDataURL('image/png')
}

function normalizeCanvasPoint(point: Point): Point01 {
  const rect = drawableRect.value
  const x = rect.width > 0 ? point.x / rect.width : 0
  const y = rect.height > 0 ? point.y / rect.height : 0
  return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) }
}

function brushSettings(): BrushSettings {
  const rect = drawableRect.value
  const basis = Math.max(1, Math.min(rect.width, rect.height))
  const tool = props.brushTool
  const isEraser = tool === 'erase'
  return {
    brushColor: isEraser ? '#000000' : props.brushColor,
    brushSize: props.brushSize,
    brushSizeRel: props.brushSize / basis,
    brushOpacity: props.brushOpacity,
    brushSizeRandomness: isEraser ? 0 : props.brushSizeRandomness,
    brushOpacityRandomness: isEraser ? 0 : props.brushOpacityRandomness,
    freeDraw: props.freeDraw,
    tool,
  }
}

function isSameBrush(a: BrushSettings, b: BrushSettings): boolean {
  return (
    a.brushColor === b.brushColor &&
    a.brushSize === b.brushSize &&
    a.brushSizeRel === b.brushSizeRel &&
    a.brushOpacity === b.brushOpacity &&
    a.brushSizeRandomness === b.brushSizeRandomness &&
    a.brushOpacityRandomness === b.brushOpacityRandomness &&
    a.freeDraw === b.freeDraw &&
    (a.tool ?? 'draw') === (b.tool ?? 'draw')
  )
}

function beginDrawing(event: PointerEvent) {
  if (
    isBurning.value ||
    props.showPaperTransformEditor ||
    props.showDrawingTransformEditor ||
    activeDrag.value !== 'none' ||
    drawableDragMode.value !== 'none'
  )
    return
  const target = event.target
  if (target instanceof HTMLElement && target.dataset.uiHandle === '1') return
  if (props.showDrawableEditor) return
  const localPoint = getLocalPoint(event)
  if (!localPoint) return
  const canvasPoint = toCanvasPoint(localPoint)
  if (!canvasPoint) return
  hasStrokeChanges.value = false
  tapStartPoint.value = { x: canvasPoint.x, y: canvasPoint.y }
  tapMoved.value = false
  isDrawing.value = true
  lastPoint.value = canvasPoint
  const brush = brushSettings()
  const seed = randomSeed()
  const rect = drawableRect.value
  activeStroke.value = {
    record: {
      version: 1,
      seed,
      points: [normalizeCanvasPoint(canvasPoint)],
      axis: {
        center: { x: center.value.x, y: center.value.y },
        axisAngles: axisAngles.value.slice(),
      },
      brushTimeline: [{ atPointIndex: 0, brush }],
      meta: { canvasWidth: rect.width, canvasHeight: rect.height },
    },
    rng: createRng(seed),
    lastBrush: brush,
  }
}

function continueDrawing(event: PointerEvent) {
  if (
    !isDrawing.value ||
    isBurning.value ||
    props.showPaperTransformEditor ||
    props.showDrawingTransformEditor ||
    activeDrag.value !== 'none' ||
    drawableDragMode.value !== 'none'
  )
    return
  const localPoint = getLocalPoint(event)
  if (!localPoint) return
  const canvasPoint = toCanvasPoint(localPoint)
  if (!canvasPoint) return
  const start = tapStartPoint.value
  if (start && !tapMoved.value) {
    const dx = canvasPoint.x - start.x
    const dy = canvasPoint.y - start.y
    if (dx * dx + dy * dy >= 4) tapMoved.value = true
  }
  const previous = lastPoint.value
  if (!previous) return
  const snapshot = activeStroke.value
  if (!snapshot) return
  const nextBrush = brushSettings()
  if (!isSameBrush(snapshot.lastBrush, nextBrush)) {
    snapshot.lastBrush = nextBrush
    snapshot.record.brushTimeline.push({
      atPointIndex: Math.max(0, snapshot.record.points.length - 1),
      brush: nextBrush,
    })
  }
  drawSymmetry(previous, canvasPoint, nextBrush, snapshot.rng, {
    axisAngles: snapshot.record.axis.axisAngles,
    centerPx: {
      x: snapshot.record.axis.center.x * paperWidth.value,
      y: snapshot.record.axis.center.y * paperHeight.value,
    },
  })
  snapshot.record.points.push(normalizeCanvasPoint(canvasPoint))
  hasStrokeChanges.value = true
  lastPoint.value = canvasPoint
}

function stopDrawing() {
  const wasDrawing = isDrawing.value
  isDrawing.value = false
  lastPoint.value = null
  if (wasDrawing && hasStrokeChanges.value && activeStroke.value) {
    const record = activeStroke.value.record
    if (record.points.length >= 2) {
      strokes.value = [...strokes.value, record]
    }
  }
  hasStrokeChanges.value = false
  activeStroke.value = null
  tapStartPoint.value = null
  tapMoved.value = false
}

function clearDrawing(resetHistory = true) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  if (resetHistory) {
    baseRasterDataUrl.value = ''
    strokes.value = []
  }
}

async function undoLastStroke(): Promise<boolean> {
  if (isBurning.value || isDrawing.value) return false
  if (strokes.value.length === 0) return false
  strokes.value = strokes.value.slice(0, -1)
  scheduleUndoRender()
  return true
}

function scheduleUndoRender() {
  if (undoRenderTimeout) {
    window.clearTimeout(undoRenderTimeout)
  }
  undoRenderTimeout = window.setTimeout(() => {
    undoRenderTimeout = 0
    if (
      props.showPaperTransformEditor ||
      props.showDrawableEditor ||
      props.showDrawingTransformEditor
    )
      return
    void renderAllStrokes()
  }, 300)
}

function randomizeAxes() {
  axisAngles.value = randomAngles(Math.max(1, props.axisCount))
}

function resetAxesEven() {
  axisAngles.value = evenAngles(Math.max(1, props.axisCount))
}

function createBurnTrailParticles(): BurnParticle[] {
  const count = 220
  const result: BurnParticle[] = []
  for (let i = 0; i < count; i += 1) {
    const goesUp = Math.random() > 0.38
    result.push({
      id: i,
      x: 3 + Math.random() * 94,
      size: 0.9 + Math.random() * 4.1,
      duration: Math.round(TRAIL_DURATION_BASE_MS * (0.42 + Math.random() * 0.2)),
      drift: -44 + Math.random() * 88,
      vertical: goesUp ? -(84 + Math.random() * 210) : 34 + Math.random() * 120,
      scale: goesUp ? 0.08 + Math.random() * 0.22 : 0.2 + Math.random() * 0.45,
      opacity: 0.18 + Math.random() * 0.78,
      start: -2 + Math.random() * 6,
    })
  }
  return result
}

function burnAndReset() {
  if (isBurning.value) return
  isBurning.value = true
  emit('burning-change', true)
  stopDrawing()
  stopDrag()
  stopDrawableDrag()
  baseRasterDataUrl.value = ''
  strokes.value = []
  burnProgress.value = 0
  emit('burning-progress', 0)
  burnTrailParticles.value = createBurnTrailParticles()
  const start = performance.now()
  const duration = BURN_DURATION_MS
  const tick = (now: number) => {
    const progress = Math.min(1, (now - start) / duration)
    burnProgress.value = progress
    emit('burning-progress', progress)
    if (progress < 1) {
      burnRaf = requestAnimationFrame(tick)
      return
    }
    clearDrawing()
    randomizeAxes()
    burnProgress.value = 0
    burnTrailParticles.value = []
    isBurning.value = false
    emit('burning-change', false)
    emit('burning-progress', 0)
    emit('burned')
  }
  burnRaf = requestAnimationFrame(tick)
}

function startCenterDrag(event: PointerEvent) {
  if (!props.showAxisEditor || isBurning.value) return
  event.preventDefault()
  event.stopPropagation()
  stopDrawing()
  activeDrag.value = 'center'
}

function startAxisDrag(index: number, event: PointerEvent) {
  if (!props.showAxisEditor || isBurning.value) return
  event.preventDefault()
  event.stopPropagation()
  stopDrawing()
  activeDrag.value = 'axis'
  draggedAxisIndex.value = index
}

function moveDrag(event: PointerEvent) {
  if (!props.showAxisEditor || activeDrag.value === 'none' || isBurning.value) return
  const localPoint = getLocalPoint(event)
  if (!localPoint) return
  if (activeDrag.value === 'center') {
    center.value = {
      x: Math.min(0.9, Math.max(0.1, localPoint.x / paperWidth.value)),
      y: Math.min(0.9, Math.max(0.1, localPoint.y / paperHeight.value)),
    }
    return
  }
  if (activeDrag.value === 'axis' && draggedAxisIndex.value >= 0) {
    if (axisAngles.value[draggedAxisIndex.value] === undefined) return
    const dx = localPoint.x - centerPixels.value.x
    const dy = localPoint.y - centerPixels.value.y
    axisAngles.value[draggedAxisIndex.value] = normalizeLineAngle(Math.atan2(dy, dx))
  }
}

function stopDrag() {
  activeDrag.value = 'none'
  draggedAxisIndex.value = -1
}

function startDrawableDrag(mode: 'move' | 'nw' | 'ne' | 'sw' | 'se', event: PointerEvent) {
  if (!props.showDrawableEditor || isBurning.value) return
  const localPoint = getLocalPoint(event)
  if (!localPoint) return
  event.preventDefault()
  event.stopPropagation()
  stopDrawing()
  drawableDragMode.value = mode
  drawableStartPoint.value = localPoint
  drawableStartBox.value = { ...props.drawableBox }
}

function moveDrawableDrag(event: PointerEvent) {
  if (drawableDragMode.value === 'none' || isBurning.value) return
  const localPoint = getLocalPoint(event)
  const startPoint = drawableStartPoint.value
  const startBox = drawableStartBox.value
  if (!localPoint || !startPoint || !startBox) return

  const dx = (localPoint.x - startPoint.x) / Math.max(1, paperWidth.value)
  const dy = (localPoint.y - startPoint.y) / Math.max(1, paperHeight.value)

  const next: DrawableBox = {
    x: startBox.x,
    y: startBox.y,
    width: startBox.width,
    height: startBox.height,
  }

  if (drawableDragMode.value === 'move') {
    next.x = startBox.x + dx
    next.y = startBox.y + dy
  }
  if (drawableDragMode.value === 'nw') {
    next.x = startBox.x + dx
    next.y = startBox.y + dy
    next.width = startBox.width - dx
    next.height = startBox.height - dy
  }
  if (drawableDragMode.value === 'ne') {
    next.y = startBox.y + dy
    next.width = startBox.width + dx
    next.height = startBox.height - dy
  }
  if (drawableDragMode.value === 'sw') {
    next.x = startBox.x + dx
    next.width = startBox.width - dx
    next.height = startBox.height + dy
  }
  if (drawableDragMode.value === 'se') {
    next.width = startBox.width + dx
    next.height = startBox.height + dy
  }

  emit('update:drawableBox', sanitizeDrawableBox(next))
}

function stopDrawableDrag() {
  drawableDragMode.value = 'none'
  drawableStartPoint.value = null
  drawableStartBox.value = null
}

function clampPaperScale(value: number): number {
  return Math.min(3, Math.max(0.01, value))
}

function clampDrawingScale(value: number): number {
  return Math.min(3, Math.max(0.01, value))
}

function startPaperMove(event: PointerEvent) {
  if (!props.showPaperTransformEditor || isBurning.value) return
  event.preventDefault()
  event.stopPropagation()
  stopDrawing()
  paperTransformDragMode.value = 'move'
  paperTransformStartPoint.value = getLocalPoint(event)
  paperTransformStartClient.value = { x: event.clientX, y: event.clientY }
  paperTransformStart.value = { ...props.paperTransform }
}

function startPaperScale(event: PointerEvent) {
  if (!props.showPaperTransformEditor || isBurning.value) return
  const localPoint = getLocalPoint(event)
  if (!localPoint || !paperRef.value) return
  event.preventDefault()
  event.stopPropagation()
  stopDrawing()
  paperTransformDragMode.value = 'scale'
  paperTransformStartPoint.value = localPoint
  paperTransformStartClient.value = { x: event.clientX, y: event.clientY }
  paperTransformStart.value = { ...props.paperTransform }
  const bounds = paperRef.value.getBoundingClientRect()
  const centerClient = {
    x: bounds.left + bounds.width * 0.5,
    y: bounds.top + bounds.height * 0.5,
  }
  paperTransformCenterClient.value = centerClient
  paperTransformStartDistance.value = Math.max(
    24,
    Math.hypot(event.clientX - centerClient.x, event.clientY - centerClient.y),
  )
}

function movePaperTransform(event: PointerEvent) {
  if (paperTransformDragMode.value === 'none' || isBurning.value) return
  const startClient = paperTransformStartClient.value
  const start = paperTransformStart.value
  if (!startClient || !start) return

  if (paperTransformDragMode.value === 'move') {
    emit('update:paperTransform', {
      offsetX: start.offsetX + (event.clientX - startClient.x),
      offsetY: start.offsetY + (event.clientY - startClient.y),
      scale: start.scale,
    })
    return
  }

  const centerClient = paperTransformCenterClient.value
  if (!centerClient) return
  const nextDistance = Math.max(
    24,
    Math.hypot(event.clientX - centerClient.x, event.clientY - centerClient.y),
  )
  const ratio = nextDistance / Math.max(24, paperTransformStartDistance.value)
  emit('update:paperTransform', {
    offsetX: start.offsetX,
    offsetY: start.offsetY,
    scale: clampPaperScale(start.scale * ratio),
  })
}

function stopPaperTransform() {
  paperTransformDragMode.value = 'none'
  paperTransformStartPoint.value = null
  paperTransformStart.value = null
  paperTransformStartClient.value = null
  paperTransformCenterClient.value = null
}

function startDrawingTransformMove(event: PointerEvent) {
  if (!props.showDrawingTransformEditor || isBurning.value) return
  event.preventDefault()
  event.stopPropagation()
  stopDrawing()
  drawingTransformDragMode.value = 'move'
  drawingTransformStartClient.value = { x: event.clientX, y: event.clientY }
  drawingTransformStart.value = { ...props.drawingTransform }
}

function startDrawingTransformScale(event: PointerEvent) {
  if (!props.showDrawingTransformEditor || isBurning.value) return
  if (!paperRef.value) return
  event.preventDefault()
  event.stopPropagation()
  stopDrawing()
  drawingTransformDragMode.value = 'scale'
  drawingTransformStartClient.value = { x: event.clientX, y: event.clientY }
  drawingTransformStart.value = { ...props.drawingTransform }
  const bounds = paperRef.value.getBoundingClientRect()
  const rect = drawableRect.value
  const centerClient = {
    x: bounds.left + rect.left + rect.width * 0.5,
    y: bounds.top + rect.top + rect.height * 0.5,
  }
  drawingTransformCenterClient.value = centerClient
  drawingTransformStartDistance.value = Math.max(
    24,
    Math.hypot(event.clientX - centerClient.x, event.clientY - centerClient.y),
  )
}

function moveDrawingTransform(event: PointerEvent) {
  if (drawingTransformDragMode.value === 'none' || isBurning.value) return
  const startClient = drawingTransformStartClient.value
  const start = drawingTransformStart.value
  if (!startClient || !start) return

  if (drawingTransformDragMode.value === 'move') {
    emit('update:drawingTransform', {
      offsetX: start.offsetX + (event.clientX - startClient.x),
      offsetY: start.offsetY + (event.clientY - startClient.y),
      scale: start.scale,
    })
    return
  }

  const centerClient = drawingTransformCenterClient.value
  if (!centerClient) return
  const nextDistance = Math.max(
    24,
    Math.hypot(event.clientX - centerClient.x, event.clientY - centerClient.y),
  )
  const ratio = nextDistance / Math.max(24, drawingTransformStartDistance.value)
  emit('update:drawingTransform', {
    offsetX: start.offsetX,
    offsetY: start.offsetY,
    scale: clampDrawingScale(start.scale * ratio),
  })
}

function stopDrawingTransform() {
  drawingTransformDragMode.value = 'none'
  drawingTransformStartClient.value = null
  drawingTransformStart.value = null
  drawingTransformCenterClient.value = null
}

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace('#', '')
  const value =
    raw.length === 3
      ? raw
          .split('')
          .map((x) => x + x)
          .join('')
      : raw
  const r = Number.parseInt(value.slice(0, 2), 16)
  const g = Number.parseInt(value.slice(2, 4), 16)
  const b = Number.parseInt(value.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function hexToHsl(hex: string): HslColor {
  const raw = hex.replace('#', '')
  const value =
    raw.length === 3
      ? raw
          .split('')
          .map((x) => x + x)
          .join('')
      : raw
  const r = Number.parseInt(value.slice(0, 2), 16) / 255
  const g = Number.parseInt(value.slice(2, 4), 16) / 255
  const b = Number.parseInt(value.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  const light = (max + min) / 2
  let hue = 0
  let sat = 0

  if (delta > 0) {
    sat = delta / (1 - Math.abs(2 * light - 1))
    if (max === r) hue = ((g - b) / delta) % 6
    else if (max === g) hue = (b - r) / delta + 2
    else hue = (r - g) / delta + 4
    hue *= 60
    if (hue < 0) hue += 360
  }

  return { h: hue, s: sat, l: light }
}

function buildHueFilter(
  targetHex: string,
  baseHue: number,
  satFactor: number,
  lightFactor: number,
): Record<string, string> {
  const target = hexToHsl(targetHex)
  const hueRotate = target.h - baseHue
  const saturation = Math.max(0.55, Math.min(2.25, 0.62 + target.s * satFactor))
  const brightness = Math.max(0.68, Math.min(1.38, 0.72 + target.l * lightFactor))
  return {
    filter: `hue-rotate(${hueRotate}deg) saturate(${saturation}) brightness(${brightness})`,
  }
}

function getSnapshot(): PaperSnapshot {
  const canvas = canvasRef.value
  return {
    drawingDataUrl: canvas ? canvas.toDataURL('image/png') : '',
    center: { x: center.value.x, y: center.value.y },
    axisAngles: axisAngles.value.slice(),
  }
}

function readImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Khong tai duoc du lieu hinh ve'))
    image.src = dataUrl
  })
}

async function drawDataUrl(dataUrl: string) {
  if (!dataUrl) {
    clearDrawing(false)
    return
  }
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const image = await readImage(dataUrl)
  clearDrawing(false)
  const rect = drawableRect.value
  ctx.drawImage(image, 0, 0, rect.width, rect.height)
}

let renderSeq = 0

function brushAtPointIndex(record: StrokeRecord, pointIndex: number): BrushSettings {
  let current = record.brushTimeline[0]?.brush ?? brushSettings()
  for (const keyframe of record.brushTimeline) {
    if (keyframe.atPointIndex > pointIndex) break
    current = keyframe.brush
  }
  return current
}

async function renderAllStrokes() {
  const seq = (renderSeq += 1)
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  if (baseRasterDataUrl.value) {
    try {
      await drawDataUrl(baseRasterDataUrl.value)
    } catch {
      baseRasterDataUrl.value = ''
    }
  }
  if (seq !== renderSeq) return

  const rect = drawableRect.value
  for (const record of strokes.value) {
    const rng = createRng(record.seed)
    const centerPx = {
      x: record.axis.center.x * paperWidth.value,
      y: record.axis.center.y * paperHeight.value,
    }
    const points = record.points.map((p) => ({ x: p.x * rect.width, y: p.y * rect.height }))
    for (let i = 0; i < points.length - 1; i += 1) {
      const brush = brushAtPointIndex(record, i)
      drawSymmetry(points[i]!, points[i + 1]!, brush, rng, {
        axisAngles: record.axis.axisAngles,
        centerPx,
      })
    }
  }
}

function getDrawingStrokes(): StrokeRecord[] {
  return strokes.value.map((stroke) => ({
    version: stroke.version,
    seed: stroke.seed,
    points: stroke.points.map((p) => ({ x: p.x, y: p.y })),
    axis: {
      center: { x: stroke.axis.center.x, y: stroke.axis.center.y },
      axisAngles: stroke.axis.axisAngles.slice(),
    },
    brushTimeline: stroke.brushTimeline.map((k) => ({
      atPointIndex: k.atPointIndex,
      brush: { ...k.brush },
    })),
    meta: { canvasWidth: stroke.meta.canvasWidth, canvasHeight: stroke.meta.canvasHeight },
  }))
}

function getDrawingStats(): DrawingStats {
  const rect = drawableRect.value
  let pointCount = 0
  for (const stroke of strokes.value) {
    pointCount += stroke.points.length
  }
  return {
    canvasWidth: rect.width,
    canvasHeight: rect.height,
    strokeCount: strokes.value.length,
    pointCount,
  }
}

async function getPreviewBlob(maxWidth = 260): Promise<Blob | null> {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = drawableRect.value
  if (rect.width <= 0 || rect.height <= 0) return null
  const scale = Math.min(1, maxWidth / rect.width)
  const out = document.createElement('canvas')
  out.width = Math.max(1, Math.round(rect.width * scale))
  out.height = Math.max(1, Math.round(rect.height * scale))
  const outCtx = out.getContext('2d')
  if (!outCtx) return null
  outCtx.imageSmoothingEnabled = true
  outCtx.imageSmoothingQuality = 'high'
  outCtx.drawImage(canvas, 0, 0, out.width, out.height)
  return new Promise((resolve) => {
    out.toBlob((blob) => resolve(blob), 'image/webp', 0.86)
  })
}

async function applyDrawingDataUrl(dataUrl: string) {
  baseRasterDataUrl.value = dataUrl
  strokes.value = []
  await renderAllStrokes()
}

async function applyDrawingStrokes(
  next: StrokeRecord[],
  snapshotDrawableBox: DrawableBox | null = null,
) {
  const sanitized = next
    .map((stroke) => {
      if (stroke.version !== 1) return null
      if (!Number.isFinite(stroke.seed)) return null
      const points = stroke.points
        .map((p) => ({
          x: Number.isFinite(p.x) ? Math.min(1, Math.max(0, p.x)) : 0,
          y: Number.isFinite(p.y) ? Math.min(1, Math.max(0, p.y)) : 0,
        }))
        .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
      if (points.length < 2) return null
      const axisAnglesSanitized = stroke.axis.axisAngles.map((angle) => normalizeLineAngle(angle))
      const centerSanitized = {
        x: Math.min(0.9, Math.max(0.1, stroke.axis.center.x)),
        y: Math.min(0.9, Math.max(0.1, stroke.axis.center.y)),
      }
      const brushTimeline = stroke.brushTimeline
        .map((k) => ({
          atPointIndex: Number.isFinite(k.atPointIndex)
            ? Math.max(0, Math.round(k.atPointIndex))
            : 0,
          brush: {
            brushColor: k.brush.brushColor,
            brushSize: k.brush.brushSize,
            brushSizeRel: Number.isFinite(k.brush.brushSizeRel)
              ? Math.max(0, k.brush.brushSizeRel ?? 0)
              : 0,
            brushOpacity: k.brush.brushOpacity,
            brushSizeRandomness: k.brush.brushSizeRandomness,
            brushOpacityRandomness: k.brush.brushOpacityRandomness,
            freeDraw: Boolean(k.brush.freeDraw),
            tool: sanitizeBrushTool(k.brush.tool),
          },
        }))
        .sort((a, b) => a.atPointIndex - b.atPointIndex)
      const meta = {
        canvasWidth: Number.isFinite(stroke.meta.canvasWidth)
          ? Math.max(1, stroke.meta.canvasWidth)
          : 1,
        canvasHeight: Number.isFinite(stroke.meta.canvasHeight)
          ? Math.max(1, stroke.meta.canvasHeight)
          : 1,
      }
      const metaBasis = Math.max(1, Math.min(meta.canvasWidth, meta.canvasHeight))
      for (const keyframe of brushTimeline) {
        if (!keyframe.brush.brushSizeRel) {
          keyframe.brush.brushSizeRel = Math.max(0, keyframe.brush.brushSize / metaBasis)
        }
      }
      return {
        version: 1,
        seed: Math.round(stroke.seed) >>> 0,
        points,
        axis: { center: centerSanitized, axisAngles: axisAnglesSanitized },
        brushTimeline:
          brushTimeline.length > 0 ? brushTimeline : [{ atPointIndex: 0, brush: brushSettings() }],
        meta,
      } satisfies StrokeRecord
    })
    .filter((stroke): stroke is StrokeRecord => stroke !== null)
  baseRasterDataUrl.value = ''
  strokes.value = sanitized
  if (snapshotDrawableBox) {
    emit('update:drawableBox', sanitizeDrawableBox(snapshotDrawableBox))
  }
  await nextTick()
  await renderAllStrokes()
}

async function captureTransformCache() {
  const canvas = canvasRef.value
  if (!canvas) return
  try {
    if (transformCacheBitmap.value) {
      transformCacheBitmap.value.close()
      transformCacheBitmap.value = null
    }
    transformCacheCanvas.value = null
    if (typeof createImageBitmap === 'function') {
      transformCacheBitmap.value = await createImageBitmap(canvas)
      return
    }
  } catch {
    transformCacheBitmap.value = null
  }
  const fallback = document.createElement('canvas')
  fallback.width = canvas.width
  fallback.height = canvas.height
  const ctx = fallback.getContext('2d')
  if (!ctx) return
  ctx.drawImage(canvas, 0, 0)
  transformCacheCanvas.value = fallback
}

function clearTransformCache() {
  if (transformCacheBitmap.value) {
    transformCacheBitmap.value.close()
    transformCacheBitmap.value = null
  }
  transformCacheCanvas.value = null
}

async function captureDrawingTransformCache() {
  const canvas = canvasRef.value
  if (!canvas) return
  try {
    if (drawingTransformCacheBitmap.value) {
      drawingTransformCacheBitmap.value.close()
      drawingTransformCacheBitmap.value = null
    }
    drawingTransformCacheCanvas.value = null
    if (typeof createImageBitmap === 'function') {
      drawingTransformCacheBitmap.value = await createImageBitmap(canvas)
      return
    }
  } catch {
    drawingTransformCacheBitmap.value = null
  }
  const fallback = document.createElement('canvas')
  fallback.width = canvas.width
  fallback.height = canvas.height
  const ctx = fallback.getContext('2d')
  if (!ctx) return
  ctx.drawImage(canvas, 0, 0)
  drawingTransformCacheCanvas.value = fallback
}

function clearDrawingTransformCache() {
  if (drawingTransformCacheBitmap.value) {
    drawingTransformCacheBitmap.value.close()
    drawingTransformCacheBitmap.value = null
  }
  drawingTransformCacheCanvas.value = null
}

function renderDrawingTransformPreview() {
  if (!props.showDrawingTransformEditor) return
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const rect = drawableRect.value
  const source = drawingTransformCacheBitmap.value ?? drawingTransformCacheCanvas.value
  if (!source) return
  const ratio = window.devicePixelRatio || 1
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  drawDrawingTransformSource(ctx, source, rect, props.drawingTransform)
}

async function applyDrawingTransformToRaster(
  dataUrl: string,
  transform: DrawingTransform,
): Promise<string> {
  if (!dataUrl) return ''
  const canvas = canvasRef.value
  if (!canvas) return dataUrl
  const rect = drawableRect.value
  const ratio = window.devicePixelRatio || 1
  const out = document.createElement('canvas')
  out.width = canvas.width
  out.height = canvas.height
  const ctx = out.getContext('2d')
  if (!ctx) return dataUrl
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  const image = await readImage(dataUrl)
  ctx.clearRect(0, 0, out.width, out.height)
  const pivotX = rect.width * 0.5
  const pivotY = rect.height * 0.5
  ctx.save()
  ctx.translate(pivotX, pivotY)
  ctx.scale(transform.scale, transform.scale)
  ctx.translate(-pivotX, -pivotY)
  ctx.translate(transform.offsetX, transform.offsetY)
  ctx.drawImage(image, 0, 0, rect.width, rect.height)
  ctx.restore()
  return out.toDataURL('image/png')
}

function applyDrawingTransformToPoint01(
  point: Point01,
  rect: { width: number; height: number },
  transform: DrawingTransform,
): Point01 {
  const pivotX = rect.width * 0.5
  const pivotY = rect.height * 0.5
  const xPx = point.x * rect.width
  const yPx = point.y * rect.height
  const nextX = pivotX + (xPx - pivotX) * transform.scale + transform.offsetX
  const nextY = pivotY + (yPx - pivotY) * transform.scale + transform.offsetY
  return {
    x: Math.min(1, Math.max(0, nextX / rect.width)),
    y: Math.min(1, Math.max(0, nextY / rect.height)),
  }
}

function applyDrawingTransformToAxisCenter(
  axisCenter: Point01,
  rect: { left: number; top: number; width: number; height: number },
  transform: DrawingTransform,
): Point01 {
  const pivotX = rect.width * 0.5
  const pivotY = rect.height * 0.5
  const paperPx = { x: axisCenter.x * paperWidth.value, y: axisCenter.y * paperHeight.value }
  const canvasPx = { x: paperPx.x - rect.left, y: paperPx.y - rect.top }
  const nextCanvasPx = {
    x: pivotX + (canvasPx.x - pivotX) * transform.scale + transform.offsetX,
    y: pivotY + (canvasPx.y - pivotY) * transform.scale + transform.offsetY,
  }
  const nextPaperPx = { x: nextCanvasPx.x + rect.left, y: nextCanvasPx.y + rect.top }
  const nextX = nextPaperPx.x / Math.max(1, paperWidth.value)
  const nextY = nextPaperPx.y / Math.max(1, paperHeight.value)
  return {
    x: Math.min(0.99, Math.max(0.01, nextX)),
    y: Math.min(0.99, Math.max(0.01, nextY)),
  }
}

async function captureDrawableCache() {
  const canvas = canvasRef.value
  if (!canvas) return
  drawableCacheRect.value = { ...drawableRect.value }
  try {
    if (drawableCacheBitmap.value) {
      drawableCacheBitmap.value.close()
      drawableCacheBitmap.value = null
    }
    drawableCacheCanvas.value = null
    if (typeof createImageBitmap === 'function') {
      drawableCacheBitmap.value = await createImageBitmap(canvas)
      return
    }
  } catch {
    drawableCacheBitmap.value = null
  }
  const fallback = document.createElement('canvas')
  fallback.width = canvas.width
  fallback.height = canvas.height
  const ctx = fallback.getContext('2d')
  if (!ctx) return
  ctx.drawImage(canvas, 0, 0)
  drawableCacheCanvas.value = fallback
}

function clearDrawableCache() {
  if (drawableCacheBitmap.value) {
    drawableCacheBitmap.value.close()
    drawableCacheBitmap.value = null
  }
  drawableCacheCanvas.value = null
  drawableCacheRect.value = null
}

function remapStrokesForDrawableRectChange(
  fromRect: { left: number; top: number; width: number; height: number },
  toRect: { left: number; top: number; width: number; height: number },
) {
  if (fromRect.width <= 0 || fromRect.height <= 0 || toRect.width <= 0 || toRect.height <= 0) return
  strokes.value = strokes.value.map((stroke) => ({
    ...stroke,
    points: stroke.points.map((p) => {
      const absX = fromRect.left + p.x * fromRect.width
      const absY = fromRect.top + p.y * fromRect.height
      const nextX = (absX - toRect.left) / toRect.width
      const nextY = (absY - toRect.top) / toRect.height
      return {
        x: Math.min(1, Math.max(0, nextX)),
        y: Math.min(1, Math.max(0, nextY)),
      }
    }),
    meta: { canvasWidth: toRect.width, canvasHeight: toRect.height },
  }))
}

async function applySnapshot(snapshot: PaperSnapshot) {
  center.value = {
    x: Math.min(0.9, Math.max(0.1, snapshot.center.x)),
    y: Math.min(0.9, Math.max(0.1, snapshot.center.y)),
  }
  axisAngles.value = snapshot.axisAngles.map((angle) => normalizeLineAngle(angle))
  await nextTick()
  baseRasterDataUrl.value = snapshot.drawingDataUrl
  strokes.value = []
  await renderAllStrokes()
}

function applyPreset(state: PaperPresetState) {
  center.value = {
    x: Math.min(0.9, Math.max(0.1, state.center.x)),
    y: Math.min(0.9, Math.max(0.1, state.center.y)),
  }
  axisAngles.value = state.axisAngles.map((angle) => normalizeLineAngle(angle))
  if (state.clearDrawing) {
    clearDrawing()
  }
}

watch(
  () => props.axisCount,
  (next) => {
    axisAngles.value = evenAngles(Math.max(1, next))
  },
  { immediate: true },
)

watch(
  () => props.showAxisEditor,
  (visible) => {
    if (!visible) stopDrag()
  },
)

watch(
  () => props.showDrawableEditor,
  (visible) => {
    if (visible) {
      void captureDrawableCache()
      return
    }
    stopDrawableDrag()
    const cached = drawableCacheRect.value
    const nextRect = { ...drawableRect.value }
    if (cached) {
      if (strokes.value.length > 0) {
        remapStrokesForDrawableRectChange(cached, nextRect)
      } else if (baseRasterDataUrl.value) {
        baseRasterDataUrl.value = getCurrentDrawingDataUrl()
      }
    }
    clearDrawableCache()
    void renderAllStrokes()
  },
)

watch(
  () => props.showPaperTransformEditor,
  (visible) => {
    if (visible) {
      void captureTransformCache()
      return
    }
    stopPaperTransform()
    clearTransformCache()
    void renderAllStrokes()
  },
)

watch(
  () => props.showDrawingTransformEditor,
  (visible) => {
    if (visible) {
      void captureDrawingTransformCache().then(() => renderDrawingTransformPreview())
      return
    }
    stopDrawingTransform()
    const transform = props.drawingTransform
    const isIdentity = transform.scale === 1 && transform.offsetX === 0 && transform.offsetY === 0
    if (!isIdentity) {
      const rect = drawableRect.value
      strokes.value = strokes.value.map((stroke) => ({
        ...stroke,
        points: stroke.points.map((p) => applyDrawingTransformToPoint01(p, rect, transform)),
        axis: {
          ...stroke.axis,
          center: applyDrawingTransformToAxisCenter(stroke.axis.center, rect, transform),
        },
      }))
      center.value = applyDrawingTransformToAxisCenter(center.value, rect, transform)
      if (baseRasterDataUrl.value) {
        void applyDrawingTransformToRaster(baseRasterDataUrl.value, transform).then((next) => {
          baseRasterDataUrl.value = next
          clearDrawingTransformCache()
          emit('reset-drawing-transform')
          void renderAllStrokes()
        })
        return
      }
    }
    clearDrawingTransformCache()
    emit('reset-drawing-transform')
    void renderAllStrokes()
  },
)

watch(
  () => [
    props.drawingTransform.offsetX,
    props.drawingTransform.offsetY,
    props.drawingTransform.scale,
  ],
  () => {
    if (!props.showDrawingTransformEditor) return
    renderDrawingTransformPreview()
  },
)

watch(
  () => [
    props.drawableBox.x,
    props.drawableBox.y,
    props.drawableBox.width,
    props.drawableBox.height,
  ],
  () => {
    resizeCanvas()
  },
)

onMounted(() => {
  nextTick(() => {
    setPaperSize()
    if (paperRef.value) {
      resizeObserver = new ResizeObserver(() => setPaperSize())
      resizeObserver.observe(paperRef.value)
    }
  })
  window.addEventListener('pointermove', continueDrawing)
  window.addEventListener('pointerup', stopDrawing)
  window.addEventListener('pointercancel', stopDrawing)
  window.addEventListener('pointermove', moveDrag)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
  window.addEventListener('pointermove', moveDrawableDrag)
  window.addEventListener('pointerup', stopDrawableDrag)
  window.addEventListener('pointercancel', stopDrawableDrag)
  window.addEventListener('pointermove', movePaperTransform)
  window.addEventListener('pointerup', stopPaperTransform)
  window.addEventListener('pointercancel', stopPaperTransform)
  window.addEventListener('pointermove', moveDrawingTransform)
  window.addEventListener('pointerup', stopDrawingTransform)
  window.addEventListener('pointercancel', stopDrawingTransform)
})

onBeforeUnmount(() => {
  clearTransformCache()
  clearDrawingTransformCache()
  clearDrawableCache()
  if (undoRenderTimeout) {
    window.clearTimeout(undoRenderTimeout)
    undoRenderTimeout = 0
  }
  if (resizeObserver && paperRef.value) {
    resizeObserver.unobserve(paperRef.value)
  }
  if (burnRaf) cancelAnimationFrame(burnRaf)
  window.removeEventListener('pointermove', continueDrawing)
  window.removeEventListener('pointerup', stopDrawing)
  window.removeEventListener('pointercancel', stopDrawing)
  window.removeEventListener('pointermove', moveDrag)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
  window.removeEventListener('pointermove', moveDrawableDrag)
  window.removeEventListener('pointerup', stopDrawableDrag)
  window.removeEventListener('pointercancel', stopDrawableDrag)
  window.removeEventListener('pointermove', movePaperTransform)
  window.removeEventListener('pointerup', stopPaperTransform)
  window.removeEventListener('pointercancel', stopPaperTransform)
  window.removeEventListener('pointermove', moveDrawingTransform)
  window.removeEventListener('pointerup', stopDrawingTransform)
  window.removeEventListener('pointercancel', stopDrawingTransform)
})

defineExpose({
  clearDrawing,
  undoLastStroke,
  randomizeAxes,
  burnAndReset,
  resetAxesEven,
  getSnapshot,
  getDrawingDataUrl: getCurrentDrawingDataUrl,
  getDrawingStrokes,
  getDrawingStats,
  getPreviewBlob,
  applyDrawingDataUrl,
  applyDrawingStrokes,
  applySnapshot,
  applyPreset,
})
</script>

<template>
  <div class="relative h-full w-full">
    <div
      ref="paperRef"
      class="absolute select-none touch-none"
      :style="paperShellStyle"
      @pointerdown.prevent="beginDrawing"
    >
      <div class="absolute inset-0 overflow-hidden" :style="artifactLayerStyle">
        <div class="absolute inset-0 overflow-hidden">
          <img
            class="h-full w-full object-cover"
            :src="nenGiayImage"
            :style="paperImageStyle"
            alt="Nền giấy bùa"
            draggable="false"
          />
        </div>

        <canvas
          ref="canvasRef"
          class="absolute"
          :style="{
            left: `${drawableRect.left}px`,
            top: `${drawableRect.top}px`,
          }"
        />

        <div class="pointer-events-none absolute inset-0 overflow-hidden">
          <img
            class="h-full w-full object-cover"
            :src="vienBuaImage"
            :style="frameImageStyle"
            alt="Viền bùa"
            draggable="false"
          />
        </div>
      </div>

      <svg
        v-if="props.showGuides && props.showAxisEditor"
        class="pointer-events-none absolute inset-0"
        :viewBox="`0 0 ${paperWidth} ${paperHeight}`"
        preserveAspectRatio="none"
      >
        <line
          v-for="(angle, index) in axisAngles"
          :key="`${index}-${angle}`"
          :x1="centerPixels.x + Math.cos(angle) * 1000"
          :y1="centerPixels.y + Math.sin(angle) * 1000"
          :x2="centerPixels.x - Math.cos(angle) * 1000"
          :y2="centerPixels.y - Math.sin(angle) * 1000"
          stroke="rgb(255 107 74 / 0.4)"
          stroke-dasharray="8 6"
          stroke-width="1.1"
        />
      </svg>

      <template v-if="props.showDrawableEditor">
        <div
          data-ui-handle="1"
          class="absolute cursor-move border border-accent-sky/80 bg-accent-sky/10"
          :style="{
            left: `${props.drawableBox.x * 100}%`,
            top: `${props.drawableBox.y * 100}%`,
            width: `${props.drawableBox.width * 100}%`,
            height: `${props.drawableBox.height * 100}%`,
          }"
          @pointerdown="startDrawableDrag('move', $event)"
        />

        <button
          data-ui-handle="1"
          class="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 border border-accent-sky bg-bg-surface"
          :style="{ left: `${props.drawableBox.x * 100}%`, top: `${props.drawableBox.y * 100}%` }"
          @pointerdown="startDrawableDrag('nw', $event)"
        />
        <button
          data-ui-handle="1"
          class="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 border border-accent-sky bg-bg-surface"
          :style="{
            left: `${(props.drawableBox.x + props.drawableBox.width) * 100}%`,
            top: `${props.drawableBox.y * 100}%`,
          }"
          @pointerdown="startDrawableDrag('ne', $event)"
        />
        <button
          data-ui-handle="1"
          class="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 border border-accent-sky bg-bg-surface"
          :style="{
            left: `${props.drawableBox.x * 100}%`,
            top: `${(props.drawableBox.y + props.drawableBox.height) * 100}%`,
          }"
          @pointerdown="startDrawableDrag('sw', $event)"
        />
        <button
          data-ui-handle="1"
          class="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 border border-accent-sky bg-bg-surface"
          :style="{
            left: `${(props.drawableBox.x + props.drawableBox.width) * 100}%`,
            top: `${(props.drawableBox.y + props.drawableBox.height) * 100}%`,
          }"
          @pointerdown="startDrawableDrag('se', $event)"
        />
      </template>

      <template v-if="props.showAxisEditor">
        <div
          v-for="(_, index) in axisAngles"
          :key="`handle-${index}`"
          data-ui-handle="1"
          class="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab border border-accent-amber bg-bg-surface active:cursor-grabbing"
          :style="{
            left: `${axisPointAt(index, 1).x}px`,
            top: `${axisPointAt(index, 1).y}px`,
          }"
          @pointerdown="startAxisDrag(index, $event)"
        />
      </template>

      <div
        v-if="props.showAxisEditor"
        data-ui-handle="1"
        class="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-move border-2 border-accent-sky bg-bg-elevated"
        :style="{
          left: `${centerPixels.x}px`,
          top: `${centerPixels.y}px`,
        }"
        @pointerdown="startCenterDrag"
      />

      <div v-if="isBurning" class="pointer-events-none absolute inset-0">
        <span
          v-for="particle in burnTrailParticles"
          :key="particle.id"
          class="burn-trail"
          :style="{
            left: `${particle.x}%`,
            bottom: `${Math.max(-3, Math.min(101, burnProgress * 100 + particle.start))}%`,
            width: `${particle.size}px`,
            height: `${particle.size * 1.8}px`,
            animationDuration: `${particle.duration}ms`,
            '--trail-drift': `${particle.drift}px`,
            '--trail-vertical': `${particle.vertical}px`,
            '--trail-scale': `${particle.scale}`,
            opacity: `${particle.opacity}`,
          }"
        />
      </div>

      <template v-if="props.showDrawingTransformEditor">
        <div
          data-ui-handle="1"
          class="absolute cursor-move border border-accent-coral/85 bg-accent-coral/10"
          :style="{
            left: `${drawableRect.left}px`,
            top: `${drawableRect.top}px`,
            width: `${drawableRect.width}px`,
            height: `${drawableRect.height}px`,
          }"
          @pointerdown="startDrawingTransformMove"
        />
        <button
          data-ui-handle="1"
          class="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-nesw-resize border border-accent-coral bg-bg-surface"
          :style="{ left: `${drawableRect.left}px`, top: `${drawableRect.top}px` }"
          @pointerdown="startDrawingTransformScale"
        />
        <button
          data-ui-handle="1"
          class="absolute h-4 w-4 -translate-y-1/2 translate-x-1/2 cursor-nwse-resize border border-accent-coral bg-bg-surface"
          :style="{
            left: `${drawableRect.left + drawableRect.width}px`,
            top: `${drawableRect.top}px`,
          }"
          @pointerdown="startDrawingTransformScale"
        />
        <button
          data-ui-handle="1"
          class="absolute h-4 w-4 -translate-x-1/2 translate-y-1/2 cursor-nwse-resize border border-accent-coral bg-bg-surface"
          :style="{
            left: `${drawableRect.left}px`,
            top: `${drawableRect.top + drawableRect.height}px`,
          }"
          @pointerdown="startDrawingTransformScale"
        />
        <button
          data-ui-handle="1"
          class="absolute h-4 w-4 translate-x-1/2 translate-y-1/2 cursor-nesw-resize border border-accent-coral bg-bg-surface"
          :style="{
            left: `${drawableRect.left + drawableRect.width}px`,
            top: `${drawableRect.top + drawableRect.height}px`,
          }"
          @pointerdown="startDrawingTransformScale"
        />
      </template>

      <template v-if="props.showPaperTransformEditor">
        <div
          data-ui-handle="1"
          class="absolute inset-0 cursor-move border border-accent-coral/85 bg-accent-coral/10"
          @pointerdown="startPaperMove"
        />
        <button
          data-ui-handle="1"
          class="absolute left-0 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-nesw-resize border border-accent-coral bg-bg-surface"
          @pointerdown="startPaperScale"
        />
        <button
          data-ui-handle="1"
          class="absolute right-0 top-0 h-4 w-4 translate-x-1/2 -translate-y-1/2 cursor-nwse-resize border border-accent-coral bg-bg-surface"
          @pointerdown="startPaperScale"
        />
        <button
          data-ui-handle="1"
          class="absolute bottom-0 left-0 h-4 w-4 -translate-x-1/2 translate-y-1/2 cursor-nwse-resize border border-accent-coral bg-bg-surface"
          @pointerdown="startPaperScale"
        />
        <button
          data-ui-handle="1"
          class="absolute bottom-0 right-0 h-4 w-4 translate-x-1/2 translate-y-1/2 cursor-nesw-resize border border-accent-coral bg-bg-surface"
          @pointerdown="startPaperScale"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.burn-trail {
  position: absolute;
  border-radius: 9999px;
  background: linear-gradient(
    to top,
    rgb(255 107 74 / 0.9),
    rgb(255 184 48 / 0.8),
    rgb(255 232 171 / 0)
  );
  filter: blur(0.25px);
  box-shadow: 0 0 8px rgb(255 184 48 / 0.36);
  animation-name: burn-trail-rise;
  animation-timing-function: linear;
  animation-iteration-count: 1;
  animation-fill-mode: both;
}

@keyframes burn-trail-rise {
  0% {
    transform: translate3d(0, 0, 0) scale(0.9);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  100% {
    transform: translate3d(var(--trail-drift), var(--trail-vertical), 0) scale(var(--trail-scale));
    opacity: 0;
  }
}
</style>
