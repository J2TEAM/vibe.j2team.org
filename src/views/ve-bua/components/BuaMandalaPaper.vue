<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import nenGiayImage from '../res/nenGiay.png'
import vienBuaImage from '../res/vienBua.png'

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
}>()

const emit = defineEmits<{
  burned: []
  'update:drawableBox': [value: DrawableBox]
  'update:paperTransform': [value: PaperTransform]
  'burning-change': [value: boolean]
  'burning-progress': [value: number]
}>()

const paperRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const paperWidth = ref(0)
const paperHeight = ref(0)
const axisAngles = ref<number[]>([])
const isDrawing = ref(false)
const lastPoint = ref<Point | null>(null)
const strokeStartSnapshot = ref<string | null>(null)
const hasStrokeChanges = ref(false)
const isBurning = ref(false)
const burnProgress = ref(0)
const activeDrag = ref<'none' | 'center' | 'axis'>('none')
const draggedAxisIndex = ref(-1)
const center = ref<Point>({ x: 0.5, y: 0.74 })
const burnTrailParticles = ref<BurnParticle[]>([])
const undoStack = ref<string[]>([])
const UNDO_LIMIT = 5

const drawableDragMode = ref<'none' | 'move' | 'nw' | 'ne' | 'sw' | 'se'>('none')
const drawableStartPoint = ref<Point | null>(null)
const drawableStartBox = ref<DrawableBox | null>(null)
const paperTransformDragMode = ref<'none' | 'move' | 'scale'>('none')
const paperTransformStartPoint = ref<Point | null>(null)
const paperTransformStart = ref<PaperTransform | null>(null)
const paperTransformStartDistance = ref(1)
const paperTransformStartClient = ref<Point | null>(null)
const paperTransformCenterClient = ref<Point | null>(null)

let resizeObserver: ResizeObserver | null = null
let burnRaf = 0
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
  if (hasBackup) {
    ctx.drawImage(backup, 0, 0, backup.width, backup.height, 0, 0, rect.width, rect.height)
  }
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

function reflectPoint(point: Point, axisAngle: number): Point {
  const cx = centerPixels.value.x
  const cy = centerPixels.value.y
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

function drawBlurDot(ctx: CanvasRenderingContext2D, point: Point, color: string, baseSize: number) {
  const size = baseSize * (0.7 + Math.random() * 0.5)
  const alpha = 0.06 + Math.random() * 0.14
  ctx.fillStyle = hexToRgba(color, alpha)
  ctx.beginPath()
  ctx.arc(point.x, point.y, size, 0, Math.PI * 2)
  ctx.fill()
}

function drawSegment(ctx: CanvasRenderingContext2D, from: Point, to: Point, color: string) {
  const layers = 3
  const base = Math.max(1, props.brushSize)
  const baseOpacity = Math.min(1, Math.max(0.1, props.brushOpacity / 100))
  const sizeRandomness = Math.min(1, Math.max(0, props.brushSizeRandomness / 100))
  const opacityRandomness = Math.min(1, Math.max(0, props.brushOpacityRandomness / 100))
  for (let i = 0; i < layers; i += 1) {
    const minThickness = Math.max(0.6, base * Math.max(0.15, 1 - sizeRandomness * 0.85))
    const maxThickness = Math.max(minThickness + 0.2, base * (1 + sizeRandomness * 2.8))
    const thickness = minThickness + Math.random() * (maxThickness - minThickness)
    const minOpacity = Math.max(0.06, 0.24 - opacityRandomness * 0.2)
    const maxOpacity = Math.min(0.95, 0.42 + opacityRandomness * 0.45)
    const opacity = Math.min(
      0.98,
      (minOpacity + Math.random() * (maxOpacity - minOpacity)) * baseOpacity,
    )
    const jitter = Math.max(0.2, base * (0.08 + sizeRandomness * 0.46))
    const jx1 = (Math.random() - 0.5) * jitter
    const jy1 = (Math.random() - 0.5) * jitter
    const jx2 = (Math.random() - 0.5) * jitter
    const jy2 = (Math.random() - 0.5) * jitter
    ctx.strokeStyle = hexToRgba(color, opacity)
    ctx.lineWidth = thickness
    ctx.beginPath()
    ctx.moveTo(from.x + jx1, from.y + jy1)
    ctx.lineTo(to.x + jx2, to.y + jy2)
    ctx.stroke()
    if (Math.random() > 0.42) {
      drawBlurDot(ctx, to, color, thickness * 0.42)
    }
  }
}

function drawSymmetry(fromCanvas: Point, toCanvas: Point) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  if (props.freeDraw) {
    drawSegment(ctx, fromCanvas, toCanvas, props.brushColor)
    return
  }

  const rect = drawableRect.value
  const fromAbs = { x: fromCanvas.x + rect.left, y: fromCanvas.y + rect.top }
  const toAbs = { x: toCanvas.x + rect.left, y: toCanvas.y + rect.top }

  const basePairs: Array<{ from: Point; to: Point }> = [{ from: fromAbs, to: toAbs }]
  for (const angle of axisAngles.value) {
    basePairs.push({
      from: reflectPoint(fromAbs, angle),
      to: reflectPoint(toAbs, angle),
    })
  }

  for (const pair of basePairs) {
    const start = { x: pair.from.x - rect.left, y: pair.from.y - rect.top }
    const end = { x: pair.to.x - rect.left, y: pair.to.y - rect.top }
    drawSegment(ctx, start, end, props.brushColor)
  }
}

function getCurrentDrawingDataUrl(): string {
  const canvas = canvasRef.value
  if (!canvas) return ''
  return canvas.toDataURL('image/png')
}

function clearUndoHistory() {
  undoStack.value = []
}

function pushUndoSnapshot(snapshot: string) {
  const last = undoStack.value[undoStack.value.length - 1]
  if (last === snapshot) return
  const next = [...undoStack.value, snapshot]
  if (next.length > UNDO_LIMIT) {
    next.splice(0, next.length - UNDO_LIMIT)
  }
  undoStack.value = next
}

function beginDrawing(event: PointerEvent) {
  if (
    isBurning.value ||
    props.showPaperTransformEditor ||
    activeDrag.value !== 'none' ||
    drawableDragMode.value !== 'none'
  )
    return
  const target = event.target
  if (target instanceof HTMLElement && target.dataset.uiHandle === '1') return
  const localPoint = getLocalPoint(event)
  if (!localPoint) return
  const canvasPoint = toCanvasPoint(localPoint)
  if (!canvasPoint) return
  strokeStartSnapshot.value = getCurrentDrawingDataUrl()
  hasStrokeChanges.value = false
  isDrawing.value = true
  lastPoint.value = canvasPoint
}

function continueDrawing(event: PointerEvent) {
  if (
    !isDrawing.value ||
    isBurning.value ||
    props.showPaperTransformEditor ||
    activeDrag.value !== 'none' ||
    drawableDragMode.value !== 'none'
  )
    return
  const localPoint = getLocalPoint(event)
  if (!localPoint) return
  const canvasPoint = toCanvasPoint(localPoint)
  if (!canvasPoint) return
  const previous = lastPoint.value
  if (!previous) return
  drawSymmetry(previous, canvasPoint)
  hasStrokeChanges.value = true
  lastPoint.value = canvasPoint
}

function stopDrawing() {
  const wasDrawing = isDrawing.value
  isDrawing.value = false
  lastPoint.value = null
  if (wasDrawing && hasStrokeChanges.value && strokeStartSnapshot.value !== null) {
    pushUndoSnapshot(strokeStartSnapshot.value)
  }
  hasStrokeChanges.value = false
  strokeStartSnapshot.value = null
}

function clearDrawing(resetUndo = true) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  if (resetUndo) {
    clearUndoHistory()
  }
}

async function undoLastStroke(): Promise<boolean> {
  if (isBurning.value || isDrawing.value) return false
  const snapshot = undoStack.value.pop()
  if (snapshot === undefined) return false
  await drawDataUrl(snapshot)
  return true
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
  return Math.min(2.6, Math.max(0.45, value))
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
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
}

async function applySnapshot(snapshot: PaperSnapshot) {
  center.value = {
    x: Math.min(0.9, Math.max(0.1, snapshot.center.x)),
    y: Math.min(0.9, Math.max(0.1, snapshot.center.y)),
  }
  axisAngles.value = snapshot.axisAngles.map((angle) => normalizeLineAngle(angle))
  await nextTick()
  await drawDataUrl(snapshot.drawingDataUrl)
  clearUndoHistory()
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
    if (!visible) stopDrawableDrag()
  },
)

watch(
  () => props.showPaperTransformEditor,
  (visible) => {
    if (!visible) stopPaperTransform()
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
})

onBeforeUnmount(() => {
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
})

defineExpose({
  clearDrawing,
  undoLastStroke,
  randomizeAxes,
  burnAndReset,
  resetAxesEven,
  getSnapshot,
  getDrawingDataUrl: getCurrentDrawingDataUrl,
  applyDrawingDataUrl: drawDataUrl,
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
