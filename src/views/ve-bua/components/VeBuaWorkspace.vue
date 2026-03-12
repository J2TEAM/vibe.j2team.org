<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useIntervalFn } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import BuaActionMenuPanel from './BuaActionMenuPanel.vue'
import BuaAxisPanel from './BuaAxisPanel.vue'
import BuaBrushPanel from './BuaBrushPanel.vue'
import BuaChantPanel from './BuaChantPanel.vue'
import BuaCollectionModal from './BuaCollectionModal.vue'
import BuaCreditsModal from './BuaCreditsModal.vue'
import BuaDrawingTransformPanel from './BuaDrawingTransformPanel.vue'
import BuaDrawablePanel from './BuaDrawablePanel.vue'
import BuaExportModal from './BuaExportModal.vue'
import BuaHeaderPanel from './BuaHeaderPanel.vue'
import BuaImportModal from './BuaImportModal.vue'
import BuaMandalaPaper from './BuaMandalaPaper.vue'
import BuaMokPanel from './BuaMokPanel.vue'
import BuaPaperTransformPanel from './BuaPaperTransformPanel.vue'
import BuaPatternBg from './BuaPatternBg.vue'
import type {
  BuaDrawingPayloadV2,
  DrawingStats,
  StrokeRecord,
  StrokeRecordEncoded,
} from '../types/drawing'
import {
  deleteCollectionRecord,
  getAllCollectionRecords,
  putCollectionRecord,
  type VeBuaCollectionRecord,
} from '../utils/veBuaIdb'
import { decodeStroke, encodeStroke } from '../utils/strokeCodec'

type Point = {
  x: number
  y: number
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

type PaperSnapshot = {
  drawingDataUrl: string
  center: Point
  axisAngles: number[]
}

type BuaStylePayload = {
  version: 1
  createdAt: string
  name: string
  style: {
    brushColor: string
    brushSize: number
    brushOpacity?: number
    brushSizeRandomness?: number
    brushOpacityRandomness?: number
    paperTint: string
    frameTint: string
    axisCount: number
    showGuides: boolean
    showAxisEditor: boolean
    freeDraw?: boolean
    drawableBox: DrawableBox
    paperTransform?: PaperTransform
  }
  axis: {
    center: Point
    axisAngles: number[]
  }
}

type BuaDrawingPayloadV1 = {
  version: 1
  createdAt: string
  name: string
  drawingDataUrl: string
}

type BuaExportPayload = {
  version: 1
  createdAt: string
  name: string
  settings: BuaStylePayload['style']
  snapshot: PaperSnapshot
}

type PaperApi = {
  clearDrawing: () => void
  undoLastStroke: () => Promise<boolean>
  randomizeAxes: () => void
  burnAndReset: () => void
  resetAxesEven: () => void
  getSnapshot: () => PaperSnapshot
  getDrawingDataUrl: () => string
  getDrawingStrokes: () => StrokeRecord[]
  getDrawingStats: () => DrawingStats
  getPreviewBlob: (maxWidth?: number) => Promise<Blob | null>
  applyDrawingDataUrl: (dataUrl: string) => Promise<void>
  applyDrawingStrokes: (strokes: StrokeRecord[], drawableBox?: DrawableBox | null) => Promise<void>
  applySnapshot: (snapshot: PaperSnapshot) => Promise<void>
}

type CollectionItem = {
  id: string
  name: string
  styleCode: string
  drawingCode: string
  createdAt: string
}

type LegacyCollectionItem = {
  id: string
  name: string
  createdAt: string
  payload: BuaExportPayload
}

type CollectionPreview = {
  id: string
  name: string
  createdAt: string
  stylePayload: BuaStylePayload
  drawingPayload: BuaDrawingPayloadV1 | BuaDrawingPayloadV2
  previewSrc: string | null
  stats: DrawingStats | null
}

const STORAGE_KEY = 've-bua-collection-v3'
const LEGACY_STORAGE_KEY = 've-bua-collection-v1'
const MIGRATION_FLAG_KEY = 've-bua-collection-idb-migrated-v1'
const PAPER_TRANSFORM_KEY = 've-bua-paper-transform-v1'

const paperRef = ref<PaperApi | null>(null)
const brushColor = ref('#ff2d2d')
const brushSize = ref(7)
const brushOpacity = ref(100)
const brushSizeRandomness = ref(50)
const brushOpacityRandomness = ref(50)
const brushTool = ref<'draw' | 'erase'>('draw')
const paperTint = ref('#B96F0E')
const frameTint = ref('#8f3d2d')
const axisCount = ref(6)
const showGuides = ref(true)
const showMenu = ref(true)
const showMobileControlHub = ref(false)
const showBrushPanel = ref(false)
const showAxisEditor = ref(false)
const restoreAxisEditorAfterBurn = ref(false)
const freeDraw = ref(false)
const showDrawableEditor = ref(false)
const restoreDrawableEditorAfterBurn = ref(false)
const showPaperTransformEditor = ref(false)
const showDrawingTransformEditor = ref(false)
const isBurning = ref(false)
const drawableBox = ref<DrawableBox>({ x: 0.13, y: 0.1, width: 0.74, height: 0.78 })
const paperTransform = ref<PaperTransform>(loadPaperTransform())
const drawingTransform = ref<DrawingTransform>({ offsetX: 0, offsetY: 0, scale: 1 })

const designName = ref('')
const exportCodeText = ref('')
const importCodeText = ref('')
const exportMode = ref<'style' | 'drawing'>('style')
const infoText = ref('')
const showCollection = ref(false)
const showExportModal = ref(false)
const showImportModal = ref(false)
const showChantPanel = ref(false)
const showMokPanel = ref(false)
const showAxisPanel = ref(false)
const showTransferActions = ref(false)
const burnProgress = ref(0)
const chantEnabled = ref(true)
const chantText = ref('')
const chantDisplayText = ref('')
const showChantOverlay = ref(false)
const mokEnabled = ref(true)
const mokSpeed = ref(96)
const isPostBurnHolding = ref(false)
const showCreditsModal = ref(false)
const creditsOffsetY = ref(0)
const creditsBoosting = ref(false)
const creditsContainerRef = ref<HTMLElement | null>(null)
const creditsContentRef = ref<HTMLElement | null>(null)
const collectionPreviews = ref<CollectionPreview[]>([])
const collectionPreviewUrls = new Map<string, string>()
const drawingStats = ref<DrawingStats | null>(null)

const operation = ref<{
  active: boolean
  label: string
  progress: number
}>({ active: false, label: '', progress: 0 })
let operationHideTimeout = 0

function startOperation(label: string) {
  if (operationHideTimeout) {
    window.clearTimeout(operationHideTimeout)
    operationHideTimeout = 0
  }
  operation.value = { active: true, label, progress: 6 }
}

function updateOperationProgress(progress: number, label?: string) {
  operation.value = {
    active: true,
    label: label ?? operation.value.label,
    progress: Math.min(100, Math.max(0, Math.round(progress))),
  }
}

function finishOperation(label?: string) {
  operation.value = {
    active: true,
    label: label ?? operation.value.label,
    progress: 100,
  }
  operationHideTimeout = window.setTimeout(() => {
    operation.value = { active: false, label: '', progress: 0 }
    operationHideTimeout = 0
  }, 550)
}

const CHANT_SAMPLES = [
  'Nam mô hộ pháp, xin cho công việc hanh thông, bug tiêu tán.',
  'Cầu cho test pass xanh, deploy êm, khách hàng vui vẻ.',
  'Nguyện cho tâm tĩnh, code sạch, xử lý sự cố bình an.',
]
const CHANT_PLACEHOLDER =
  'Ví dụ: Xin cho mọi thứ thuận lợi, không bug production, công việc suôn sẻ.'
const activeChantText = computed(() => {
  const trimmed = chantText.value.trim()
  return trimmed || CHANT_SAMPLES[0] || ''
})

let chantHideTimeout = 0
let savePaperTransformTimeout = 0
let creditsRaf = 0
let creditsLastFrame = 0
let mokLoopTimeout = 0
let mokAudioContext: AudioContext | null = null

function syncDrawingStats() {
  drawingStats.value = paperRef.value?.getDrawingStats() ?? null
}

const { pause: pauseStatsLoop, resume: resumeStatsLoop } = useIntervalFn(
  () => {
    if (showMenu.value) syncDrawingStats()
  },
  350,
  { immediate: true },
)

watch(
  showMenu,
  (open) => {
    if (open) {
      syncDrawingStats()
      resumeStatsLoop()
      return
    }
    pauseStatsLoop()
  },
  { immediate: true },
)

function clearDrawing() {
  paperRef.value?.clearDrawing()
  drawingStats.value = paperRef.value?.getDrawingStats() ?? null
}

async function undoDrawing() {
  const restored = await paperRef.value?.undoLastStroke()
  drawingStats.value = paperRef.value?.getDrawingStats() ?? null
  if (!restored) {
    infoText.value = 'Không còn bước vẽ nào để hoàn tác.'
  }
}

function randomAxes() {
  paperRef.value?.randomizeAxes()
}

function burnPaper() {
  if (isBurning.value) return
  if (chantHideTimeout) {
    window.clearTimeout(chantHideTimeout)
    chantHideTimeout = 0
  }
  if (chantEnabled.value) {
    showChantOverlay.value = true
    chantDisplayText.value = ''
  } else {
    showChantOverlay.value = false
    chantDisplayText.value = ''
  }
  isPostBurnHolding.value = false
  showMobileControlHub.value = false
  showMenu.value = false
  showBrushPanel.value = false
  restoreAxisEditorAfterBurn.value = showAxisEditor.value
  restoreDrawableEditorAfterBurn.value = showDrawableEditor.value
  if (showAxisEditor.value) {
    showAxisEditor.value = false
  }
  if (showDrawableEditor.value) {
    showDrawableEditor.value = false
  }
  showCollection.value = false
  showExportModal.value = false
  showImportModal.value = false
  showChantPanel.value = false
  showMokPanel.value = false
  showAxisPanel.value = false
  showTransferActions.value = false
  showPaperTransformEditor.value = false
  showDrawingTransformEditor.value = false
  paperRef.value?.burnAndReset()
}

function handleBurned() {
  const finishBurnUi = () => {
    isPostBurnHolding.value = false
    showMenu.value = true
    if (restoreAxisEditorAfterBurn.value) {
      showAxisEditor.value = true
    }
    if (restoreDrawableEditorAfterBurn.value) {
      showDrawableEditor.value = true
    }
    restoreAxisEditorAfterBurn.value = false
    restoreDrawableEditorAfterBurn.value = false
    infoText.value = 'Đã đốt bùa xong, menu đã hiện lại.'
  }

  const shouldHoldAfterBurn = chantEnabled.value && activeChantText.value.length > 0
  if (shouldHoldAfterBurn) {
    isPostBurnHolding.value = true
  }
  if (chantEnabled.value) {
    chantDisplayText.value = activeChantText.value
    showChantOverlay.value = Boolean(chantDisplayText.value)
    if (showChantOverlay.value) {
      chantHideTimeout = window.setTimeout(() => {
        showChantOverlay.value = false
        chantDisplayText.value = ''
        finishBurnUi()
        chantHideTimeout = 0
      }, 1000)
      return
    }
  } else {
    showChantOverlay.value = false
    chantDisplayText.value = ''
  }
  finishBurnUi()
}

function handleBurningChange(value: boolean) {
  isBurning.value = value
  if (value) {
    startMokLoop()
    return
  }
  stopMokLoop()
}

function handleBurningProgress(value: number) {
  burnProgress.value = Math.min(1, Math.max(0, value))
  if (!isBurning.value || !chantEnabled.value) return
  const source = activeChantText.value
  if (!source) {
    chantDisplayText.value = ''
    return
  }
  const count = Math.max(0, Math.min(source.length, Math.ceil(source.length * burnProgress.value)))
  chantDisplayText.value = source.slice(0, count)
}

function resetAxesEven() {
  paperRef.value?.resetAxesEven()
}

function resetBrushColor() {
  brushColor.value = '#ff2d2d'
}

function resetBrushSize() {
  brushSize.value = 7
}

function resetBrushOpacity() {
  brushOpacity.value = 100
}

function resetBrushRandomness() {
  brushSizeRandomness.value = 50
  brushOpacityRandomness.value = 50
}

function ensureMokAudioContext(): AudioContext | null {
  if (mokAudioContext) return mokAudioContext
  const Ctx =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return null
  mokAudioContext = new Ctx()
  return mokAudioContext
}

function playMokSound() {
  const ctx = ensureMokAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(980, now)
  osc.frequency.exponentialRampToValueAtTime(380, now + 0.07)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.32, now + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.095)
}

function stopMokLoop() {
  if (mokLoopTimeout) {
    window.clearTimeout(mokLoopTimeout)
    mokLoopTimeout = 0
  }
}

function startMokLoop() {
  stopMokLoop()
  if (!isBurning.value || !mokEnabled.value) return
  const step = () => {
    playMokSound()
    const bpm = Math.min(260, Math.max(40, mokSpeed.value))
    const interval = Math.max(110, Math.round(60000 / bpm))
    mokLoopTimeout = window.setTimeout(step, interval)
  }
  step()
}

function resetPaperTint() {
  paperTint.value = '#B96F0E'
}

function resetFrameTint() {
  frameTint.value = '#8f3d2d'
}

function randomHexColor(): string {
  const value = Math.floor(Math.random() * 0xffffff)
  return `#${value.toString(16).padStart(6, '0')}`
}

function randomizeBuaColors() {
  paperTint.value = randomHexColor()
  frameTint.value = randomHexColor()
}

function resetDrawableBox() {
  drawableBox.value = { x: 0.13, y: 0.1, width: 0.74, height: 0.78 }
}

function updateDrawableBox(next: DrawableBox) {
  drawableBox.value = next
}

function sanitizePaperTransform(next: PaperTransform): PaperTransform {
  return {
    offsetX: Number.isFinite(next.offsetX) ? next.offsetX : 0,
    offsetY: Number.isFinite(next.offsetY) ? next.offsetY : 0,
    scale: Math.min(3, Math.max(0.01, Number.isFinite(next.scale) ? next.scale : 1)),
  }
}

function savePaperTransform() {
  try {
    localStorage.setItem(PAPER_TRANSFORM_KEY, JSON.stringify(paperTransform.value))
  } catch {
    infoText.value = 'Không lưu được vị trí lá bùa.'
  }
}

function loadPaperTransform(): PaperTransform {
  try {
    const raw = localStorage.getItem(PAPER_TRANSFORM_KEY)
    if (!raw) return { offsetX: 0, offsetY: 0, scale: 1 }
    const parsed = JSON.parse(raw) as PaperTransform
    return sanitizePaperTransform(parsed)
  } catch {
    return { offsetX: 0, offsetY: 0, scale: 1 }
  }
}

function updatePaperTransform(next: PaperTransform) {
  paperTransform.value = sanitizePaperTransform(next)
}

function resetPaperTransform() {
  paperTransform.value = { offsetX: 0, offsetY: 0, scale: 1 }
  savePaperTransform()
}

function resetDrawingTransform() {
  drawingTransform.value = { offsetX: 0, offsetY: 0, scale: 1 }
}

function togglePaperTransformTool() {
  const next = !showPaperTransformEditor.value
  showPaperTransformEditor.value = next
  if (next) {
    showDrawableEditor.value = false
    showDrawingTransformEditor.value = false
  }
}

function toggleDrawableTool() {
  const next = !showDrawableEditor.value
  showDrawableEditor.value = next
  if (next) {
    showPaperTransformEditor.value = false
    showDrawingTransformEditor.value = false
  }
}

function toggleDrawingTransformTool() {
  const next = !showDrawingTransformEditor.value
  showDrawingTransformEditor.value = next
  if (next) {
    showPaperTransformEditor.value = false
    showDrawableEditor.value = false
  }
}

function startCreditsBoost() {
  creditsBoosting.value = true
}

function stopCreditsBoost() {
  creditsBoosting.value = false
}

function openCreditsModal() {
  creditsBoosting.value = false
  showCreditsModal.value = true
}

function closeCreditsModal() {
  showCreditsModal.value = false
  creditsBoosting.value = false
}

function bindCreditsContainer(value: HTMLElement | null) {
  creditsContainerRef.value = value
}

function bindCreditsContent(value: HTMLElement | null) {
  creditsContentRef.value = value
}

const creditsTransformStyle = computed(() => ({
  transform: `translate3d(0, ${creditsOffsetY.value}px, 0)`,
}))

function syncCreditsStartPosition() {
  const container = creditsContainerRef.value
  if (!container) return
  creditsOffsetY.value = container.clientHeight * 0.35
}

function tickCredits(timestamp: number) {
  const container = creditsContainerRef.value
  const content = creditsContentRef.value
  if (!showCreditsModal.value || !container || !content) {
    creditsLastFrame = 0
    return
  }

  if (creditsLastFrame === 0) {
    creditsLastFrame = timestamp
  }
  const delta = (timestamp - creditsLastFrame) / 1000
  creditsLastFrame = timestamp
  const speed = creditsBoosting.value ? 120 : 48
  creditsOffsetY.value -= speed * delta

  if (creditsOffsetY.value < -content.clientHeight - 24) {
    creditsOffsetY.value = container.clientHeight * 0.35
  }
}

function createStylePayload(name: string): BuaStylePayload | null {
  const paper = paperRef.value
  if (!paper) return null
  const snapshot = paper.getSnapshot()
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    name,
    style: {
      brushColor: brushColor.value,
      brushSize: brushSize.value,
      brushOpacity: brushOpacity.value,
      brushSizeRandomness: brushSizeRandomness.value,
      brushOpacityRandomness: brushOpacityRandomness.value,
      paperTint: paperTint.value,
      frameTint: frameTint.value,
      axisCount: axisCount.value,
      showGuides: showGuides.value,
      showAxisEditor: showAxisEditor.value,
      freeDraw: freeDraw.value,
      drawableBox: { ...drawableBox.value },
      paperTransform: { ...paperTransform.value },
    },
    axis: {
      center: { ...snapshot.center },
      axisAngles: snapshot.axisAngles.slice(),
    },
  }
}

function createDrawingPayloadV2(name: string): BuaDrawingPayloadV2 | null {
  const paper = paperRef.value
  if (!paper) return null
  return {
    version: 2,
    createdAt: new Date().toISOString(),
    name,
    drawableBox: { ...drawableBox.value },
    strokes: paper.getDrawingStrokes().map((stroke) => encodeStroke(stroke)),
  }
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeBase64Url(value: string): string {
  let base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) {
    base64 += '='
  }
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function encodeStyleCode(payload: BuaStylePayload): string {
  return `BUA-S1.${encodeBase64Url(JSON.stringify(payload))}`
}

function encodeDrawingCodeV1(payload: BuaDrawingPayloadV1): string {
  return `BUA-D1.${encodeBase64Url(JSON.stringify(payload))}`
}

function encodeDrawingCodeV2(payload: BuaDrawingPayloadV2): string {
  return `BUA-D2.${encodeBase64Url(JSON.stringify(payload))}`
}

function isValidSnapshot(snapshot: PaperSnapshot): boolean {
  if (!Number.isFinite(snapshot.center.x) || !Number.isFinite(snapshot.center.y)) return false
  if (!Array.isArray(snapshot.axisAngles)) return false
  return snapshot.axisAngles.every((angle) => Number.isFinite(angle))
}

function isValidDrawableBox(box: DrawableBox): boolean {
  const values = [box.x, box.y, box.width, box.height]
  return values.every((value) => Number.isFinite(value))
}

function isValidLegacyPayload(payload: BuaExportPayload): boolean {
  if (payload.version !== 1) return false
  if (!payload.name || payload.name.length < 1) return false
  if (!Number.isFinite(payload.settings.brushSize)) return false
  if (
    payload.settings.brushOpacity !== undefined &&
    !Number.isFinite(payload.settings.brushOpacity)
  )
    return false
  if (!Number.isFinite(payload.settings.axisCount)) return false
  if (
    payload.settings.brushSizeRandomness !== undefined &&
    !Number.isFinite(payload.settings.brushSizeRandomness)
  )
    return false
  if (
    payload.settings.brushOpacityRandomness !== undefined &&
    !Number.isFinite(payload.settings.brushOpacityRandomness)
  )
    return false
  if (!isValidDrawableBox(payload.settings.drawableBox)) return false
  if (payload.settings.paperTransform) {
    const transform = payload.settings.paperTransform
    if (
      !Number.isFinite(transform.offsetX) ||
      !Number.isFinite(transform.offsetY) ||
      !Number.isFinite(transform.scale)
    )
      return false
  }
  return isValidSnapshot(payload.snapshot)
}

function isValidStylePayload(payload: BuaStylePayload): boolean {
  if (payload.version !== 1) return false
  if (!payload.name || payload.name.length < 1) return false
  if (!Number.isFinite(payload.style.brushSize)) return false
  if (payload.style.brushOpacity !== undefined && !Number.isFinite(payload.style.brushOpacity))
    return false
  if (!Number.isFinite(payload.style.axisCount)) return false
  if (
    payload.style.brushSizeRandomness !== undefined &&
    !Number.isFinite(payload.style.brushSizeRandomness)
  )
    return false
  if (
    payload.style.brushOpacityRandomness !== undefined &&
    !Number.isFinite(payload.style.brushOpacityRandomness)
  )
    return false
  if (!isValidDrawableBox(payload.style.drawableBox)) return false
  if (payload.style.paperTransform) {
    const transform = payload.style.paperTransform
    if (
      !Number.isFinite(transform.offsetX) ||
      !Number.isFinite(transform.offsetY) ||
      !Number.isFinite(transform.scale)
    )
      return false
  }
  return isValidSnapshot({
    drawingDataUrl: '',
    center: payload.axis.center,
    axisAngles: payload.axis.axisAngles,
  })
}

function isValidDrawingPayloadV1(payload: BuaDrawingPayloadV1): boolean {
  return (
    payload.version === 1 && payload.name.length > 0 && typeof payload.drawingDataUrl === 'string'
  )
}

function isValidDrawingPayloadV2(payload: BuaDrawingPayloadV2): boolean {
  if (payload.version !== 2) return false
  if (!payload.name || payload.name.length < 1) return false
  if (!isValidDrawableBox(payload.drawableBox)) return false
  if (!Array.isArray(payload.strokes)) return false
  return payload.strokes.every((stroke) => {
    const maybe = stroke as Partial<StrokeRecordEncoded> & {
      points?: Array<{ x: number; y: number }>
    }
    const commonOk =
      maybe.version === 1 &&
      typeof maybe.seed === 'number' &&
      Array.isArray(maybe.axis?.axisAngles) &&
      typeof maybe.axis?.center?.x === 'number' &&
      typeof maybe.axis?.center?.y === 'number' &&
      Array.isArray(maybe.brushTimeline) &&
      typeof maybe.meta?.canvasWidth === 'number' &&
      typeof maybe.meta?.canvasHeight === 'number'

    if (!commonOk) return false

    const pointsDeltaOk =
      maybe.pointsDelta !== undefined &&
      typeof maybe.pointsDelta.scale === 'number' &&
      Array.isArray(maybe.pointsDelta.deltas) &&
      Array.isArray(maybe.pointsDelta.start) &&
      maybe.pointsDelta.start.length === 2

    if (pointsDeltaOk) return true

    const pointsOk =
      Array.isArray(maybe.points) &&
      maybe.points.length >= 2 &&
      maybe.points.every((p) => typeof p.x === 'number' && typeof p.y === 'number')

    return pointsOk
  })
}

function decodeLegacyBuaCode(code: string): BuaExportPayload | null {
  const trimmed = code.trim()
  if (!trimmed.startsWith('BUA1.')) return null
  const encoded = trimmed.slice(5)
  if (!encoded) return null
  try {
    const raw = decodeBase64Url(encoded)
    const payload = JSON.parse(raw) as BuaExportPayload
    return isValidLegacyPayload(payload) ? payload : null
  } catch {
    return null
  }
}

function decodeStyleCode(code: string): BuaStylePayload | null {
  const trimmed = code.trim()
  if (!trimmed.startsWith('BUA-S1.')) return null
  const encoded = trimmed.slice(7)
  if (!encoded) return null
  try {
    const raw = decodeBase64Url(encoded)
    const payload = JSON.parse(raw) as BuaStylePayload
    return isValidStylePayload(payload) ? payload : null
  } catch {
    return null
  }
}

function decodeDrawingCode(code: string): BuaDrawingPayloadV1 | BuaDrawingPayloadV2 | null {
  const trimmed = code.trim()
  const prefixV1 = 'BUA-D1.'
  const prefixV2 = 'BUA-D2.'
  const prefix = trimmed.startsWith(prefixV1)
    ? prefixV1
    : trimmed.startsWith(prefixV2)
      ? prefixV2
      : null
  if (!prefix) return null
  const encoded = trimmed.slice(prefix.length)
  if (!encoded) return null
  try {
    const raw = decodeBase64Url(encoded)
    if (prefix === prefixV1) {
      const payload = JSON.parse(raw) as BuaDrawingPayloadV1
      return isValidDrawingPayloadV1(payload) ? payload : null
    }
    const payload = JSON.parse(raw) as BuaDrawingPayloadV2
    return isValidDrawingPayloadV2(payload) ? payload : null
  } catch {
    return null
  }
}

function loadCollectionFromLocalStorage(): CollectionItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as CollectionItem[]
    }

    const v2Raw = localStorage.getItem('ve-bua-collection-v2')
    if (v2Raw) {
      const v2Items = JSON.parse(v2Raw) as Array<{
        id: string
        name: string
        code: string
        createdAt: string
      }>
      const migratedV2: CollectionItem[] = v2Items
        .map((item) => {
          const legacy = decodeLegacyBuaCode(item.code)
          if (!legacy) return null
          const stylePayload: BuaStylePayload = {
            version: 1,
            createdAt: legacy.createdAt,
            name: legacy.name,
            style: { ...legacy.settings },
            axis: {
              center: { ...legacy.snapshot.center },
              axisAngles: legacy.snapshot.axisAngles.slice(),
            },
          }
          const drawingPayload: BuaDrawingPayloadV1 = {
            version: 1,
            createdAt: legacy.createdAt,
            name: legacy.name,
            drawingDataUrl: legacy.snapshot.drawingDataUrl,
          }
          return {
            id: item.id,
            name: item.name,
            createdAt: item.createdAt,
            styleCode: encodeStyleCode(stylePayload),
            drawingCode: encodeDrawingCodeV1(drawingPayload),
          }
        })
        .filter((item): item is CollectionItem => item !== null)
        .slice(0, 60)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedV2))
      return migratedV2
    }

    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!legacyRaw) return []

    const legacyItems = JSON.parse(legacyRaw) as LegacyCollectionItem[]
    const migrated: CollectionItem[] = legacyItems
      .map((item) => {
        const stylePayload: BuaStylePayload = {
          version: 1,
          createdAt: item.createdAt,
          name: item.name,
          style: { ...item.payload.settings },
          axis: {
            center: { ...item.payload.snapshot.center },
            axisAngles: item.payload.snapshot.axisAngles.slice(),
          },
        }
        const drawingPayload: BuaDrawingPayloadV1 = {
          version: 1,
          createdAt: item.createdAt,
          name: item.name,
          drawingDataUrl: item.payload.snapshot.drawingDataUrl,
        }
        return {
          id: item.id,
          name: item.name,
          createdAt: item.createdAt,
          styleCode: encodeStyleCode(stylePayload),
          drawingCode: encodeDrawingCodeV1(drawingPayload),
        }
      })
      .slice(0, 60)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
    return migrated
  } catch {
    return []
  }
}

function revokeCollectionPreviewUrls() {
  for (const url of collectionPreviewUrls.values()) {
    URL.revokeObjectURL(url)
  }
  collectionPreviewUrls.clear()
}

function buildCollectionPreviewsFromRecords(records: VeBuaCollectionRecord[]): CollectionPreview[] {
  revokeCollectionPreviewUrls()
  const ordered = records.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return ordered.map((record) => {
    let previewSrc: string | null = null
    if (record.previewBlob) {
      const url = URL.createObjectURL(record.previewBlob)
      collectionPreviewUrls.set(record.id, url)
      previewSrc = url
    } else if (record.drawingPayload.version === 1 && record.drawingPayload.drawingDataUrl) {
      previewSrc = record.drawingPayload.drawingDataUrl
    }
    return {
      id: record.id,
      name: record.name,
      createdAt: record.createdAt,
      stylePayload: record.stylePayload,
      drawingPayload: record.drawingPayload,
      previewSrc,
      stats: record.stats,
    }
  })
}

async function loadCollectionFromDb() {
  const records = await getAllCollectionRecords()
  collectionPreviews.value = buildCollectionPreviewsFromRecords(records)
}

async function enforceCollectionLimit(limit: number) {
  const records = await getAllCollectionRecords()
  const ordered = records.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const extra = ordered.slice(limit)
  for (const record of extra) {
    await deleteCollectionRecord(record.id)
  }
}

async function migrateLocalStorageCollectionIfNeeded() {
  if (localStorage.getItem(MIGRATION_FLAG_KEY) === '1') return
  const existing = await getAllCollectionRecords()
  if (existing.length > 0) {
    localStorage.setItem(MIGRATION_FLAG_KEY, '1')
    return
  }
  const items = loadCollectionFromLocalStorage()
  if (items.length === 0) {
    localStorage.setItem(MIGRATION_FLAG_KEY, '1')
    return
  }
  for (const item of items) {
    const stylePayload = decodeStyleCode(item.styleCode)
    const drawingPayload = decodeDrawingCode(item.drawingCode)
    if (!stylePayload || !drawingPayload) continue
    const record: VeBuaCollectionRecord = {
      id: item.id,
      name: item.name,
      createdAt: item.createdAt,
      stylePayload,
      drawingPayload,
      previewBlob: null,
      stats: null,
    }
    await putCollectionRecord(record)
  }
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(LEGACY_STORAGE_KEY)
  localStorage.removeItem('ve-bua-collection-v2')
  localStorage.setItem(MIGRATION_FLAG_KEY, '1')
}

async function saveDesign() {
  startOperation('Đang lưu vào bộ sưu tập...')
  const trimmed = designName.value.trim()
  if (!trimmed) {
    finishOperation()
    infoText.value = 'Hãy nhập tên thiết kế trước khi lưu.'
    return
  }

  updateOperationProgress(18, 'Đang đóng gói dữ liệu...')
  const stylePayload = createStylePayload(trimmed)
  const paper = paperRef.value
  const drawingPayload = createDrawingPayloadV2(trimmed)
  if (!stylePayload || !drawingPayload || !paper) {
    finishOperation()
    infoText.value = 'Không lấy được dữ liệu bùa hiện tại.'
    return
  }

  updateOperationProgress(38, 'Đang tạo preview...')
  const stats = paper.getDrawingStats()
  const previewBlob = await paper.getPreviewBlob(260)

  const record: VeBuaCollectionRecord = {
    id: `${Date.now()}-${Math.round(Math.random() * 100000)}`,
    name: trimmed,
    createdAt: stylePayload.createdAt,
    stylePayload,
    drawingPayload,
    previewBlob,
    stats,
  }

  updateOperationProgress(70, 'Đang ghi vào bộ nhớ...')
  await putCollectionRecord(record)
  await enforceCollectionLimit(60)
  updateOperationProgress(88, 'Đang cập nhật danh sách...')
  await loadCollectionFromDb()
  finishOperation('Đã lưu xong.')
  infoText.value = `Đã lưu "${trimmed}" vào bộ sưu tập.`
}

function openExportModal(mode: 'style' | 'drawing') {
  startOperation('Đang tạo mã...')
  const name = designName.value.trim() || 'Bùa chưa đặt tên'
  exportMode.value = mode
  if (mode === 'style') {
    updateOperationProgress(35, 'Đang đóng gói style...')
    const payload = createStylePayload(name)
    if (!payload) {
      finishOperation()
      infoText.value = 'Không thể tạo mã lúc này.'
      return
    }
    exportCodeText.value = encodeStyleCode(payload)
    showExportModal.value = true
    finishOperation('Đã tạo mã style.')
    infoText.value = 'Đã tạo mã style.'
    return
  }
  updateOperationProgress(45, 'Đang đóng gói nét vẽ...')
  const payload = createDrawingPayloadV2(name)
  if (!payload) {
    finishOperation()
    infoText.value = 'Không thể tạo mã lúc này.'
    return
  }
  exportCodeText.value = encodeDrawingCodeV2(payload)
  showExportModal.value = true
  finishOperation('Đã tạo mã nét vẽ.')
  infoText.value = 'Đã tạo mã nét vẽ.'
}

async function applyStylePayload(payload: BuaStylePayload) {
  brushColor.value = payload.style.brushColor
  brushSize.value = payload.style.brushSize
  brushOpacity.value = Math.min(100, Math.max(10, payload.style.brushOpacity ?? 100))
  brushSizeRandomness.value = Math.min(100, Math.max(0, payload.style.brushSizeRandomness ?? 50))
  brushOpacityRandomness.value = Math.min(
    100,
    Math.max(0, payload.style.brushOpacityRandomness ?? 50),
  )
  paperTint.value = payload.style.paperTint
  frameTint.value = payload.style.frameTint
  axisCount.value = payload.style.axisCount
  showGuides.value = payload.style.showGuides
  showAxisEditor.value = payload.style.showAxisEditor
  freeDraw.value = Boolean(payload.style.freeDraw)
  drawableBox.value = { ...payload.style.drawableBox }
  paperTransform.value = sanitizePaperTransform(
    payload.style.paperTransform ?? { offsetX: 0, offsetY: 0, scale: 1 },
  )
  savePaperTransform()
  await nextTick()
  const current = paperRef.value?.getSnapshot()
  if (!current) return
  await paperRef.value?.applySnapshot({
    drawingDataUrl: current.drawingDataUrl,
    center: { ...payload.axis.center },
    axisAngles: payload.axis.axisAngles.slice(),
  })
}

async function applyDrawingPayload(payload: BuaDrawingPayloadV1 | BuaDrawingPayloadV2) {
  if (payload.version === 1) {
    await paperRef.value?.applyDrawingDataUrl(payload.drawingDataUrl)
    return
  }
  const rawStrokes = payload.strokes as Array<StrokeRecordEncoded | StrokeRecord>
  const decoded: StrokeRecord[] = rawStrokes.map((stroke) => {
    if ('pointsDelta' in stroke) return decodeStroke(stroke)
    return stroke
  })
  await paperRef.value?.applyDrawingStrokes(decoded, payload.drawableBox)
}

async function importFromCodeText(rawCode: string) {
  startOperation('Đang import...')
  updateOperationProgress(10, 'Đang đọc mã...')
  const stylePayload = decodeStyleCode(rawCode)
  if (stylePayload) {
    updateOperationProgress(45, 'Đang áp dụng style...')
    await applyStylePayload(stylePayload)
    designName.value = stylePayload.name
    finishOperation('Đã import style.')
    infoText.value = `Đã import style: ${stylePayload.name}`
    return
  }
  const drawingPayload = decodeDrawingCode(rawCode)
  if (drawingPayload) {
    updateOperationProgress(55, 'Đang vẽ lại nét...')
    await applyDrawingPayload(drawingPayload)
    if (!designName.value.trim()) {
      designName.value = drawingPayload.name
    }
    finishOperation('Đã import nét vẽ.')
    infoText.value = `Đã import nét vẽ: ${drawingPayload.name}`
    return
  }
  const legacyPayload = decodeLegacyBuaCode(rawCode)
  if (!legacyPayload) {
    finishOperation()
    infoText.value = 'Mã không hợp lệ (cần BUA-S1 hoặc BUA-D1).'
    return
  }
  updateOperationProgress(45, 'Đang áp dụng style...')
  await applyStylePayload({
    version: 1,
    createdAt: legacyPayload.createdAt,
    name: legacyPayload.name,
    style: { ...legacyPayload.settings },
    axis: {
      center: { ...legacyPayload.snapshot.center },
      axisAngles: legacyPayload.snapshot.axisAngles.slice(),
    },
  })
  updateOperationProgress(75, 'Đang vẽ lại nét...')
  await applyDrawingPayload({
    version: 1,
    createdAt: legacyPayload.createdAt,
    name: legacyPayload.name,
    drawingDataUrl: legacyPayload.snapshot.drawingDataUrl,
  })
  designName.value = legacyPayload.name
  finishOperation('Đã import mã cũ.')
  infoText.value = `Đã import mã bùa cũ: ${legacyPayload.name}`
}

async function confirmImportModal() {
  await importFromCodeText(importCodeText.value)
  if (infoText.value.startsWith('Đã import')) {
    showImportModal.value = false
  }
}

async function loadFromCollection(item: CollectionPreview, mode: 'style' | 'drawing' | 'both') {
  startOperation(
    mode === 'both'
      ? 'Đang nạp style + nét...'
      : mode === 'style'
        ? 'Đang nạp style...'
        : 'Đang nạp nét vẽ...',
  )
  try {
    if (mode === 'style' || mode === 'both') {
      updateOperationProgress(30, 'Đang áp dụng style...')
      await applyStylePayload(item.stylePayload)
    }
    if (mode === 'drawing' || mode === 'both') {
      updateOperationProgress(65, 'Đang vẽ lại nét...')
      await applyDrawingPayload(item.drawingPayload)
    }
    designName.value = item.name
    showCollection.value = false
    finishOperation('Đã nạp xong.')
    infoText.value =
      mode === 'both'
        ? `Đã nạp đầy đủ: ${item.name}`
        : mode === 'style'
          ? `Đã nạp style: ${item.name}`
          : `Đã nạp nét vẽ: ${item.name}`
  } catch {
    finishOperation()
    infoText.value = 'Không nạp được dữ liệu lúc này.'
  }
}

async function removeFromCollection(id: string) {
  await deleteCollectionRecord(id)
  await loadCollectionFromDb()
}

function useSampleChant(text: string) {
  chantText.value = text
}

function handleGlobalKeydown(event: KeyboardEvent) {
  if (!(event.ctrlKey || event.metaKey) || event.shiftKey) return
  if (event.key.toLowerCase() !== 'z') return
  const target = event.target
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  )
    return
  if (target instanceof HTMLElement && target.isContentEditable) return
  event.preventDefault()
  void undoDrawing()
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
  void migrateLocalStorageCollectionIfNeeded().then(loadCollectionFromDb)
  const frame = (timestamp: number) => {
    tickCredits(timestamp)
    creditsRaf = window.requestAnimationFrame(frame)
  }
  creditsRaf = window.requestAnimationFrame(frame)
})

watch(
  paperTransform,
  () => {
    if (savePaperTransformTimeout) {
      window.clearTimeout(savePaperTransformTimeout)
    }
    savePaperTransformTimeout = window.setTimeout(() => {
      savePaperTransform()
      savePaperTransformTimeout = 0
    }, 120)
  },
  { deep: true },
)

watch([mokEnabled, mokSpeed], () => {
  if (isBurning.value) {
    startMokLoop()
  }
})

watch(
  () => showCreditsModal.value,
  async (open) => {
    if (!open) {
      creditsBoosting.value = false
      creditsLastFrame = 0
      return
    }
    await nextTick()
    syncCreditsStartPosition()
    creditsLastFrame = 0
  },
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  revokeCollectionPreviewUrls()
  pauseStatsLoop()
  if (operationHideTimeout) {
    window.clearTimeout(operationHideTimeout)
  }
  if (chantHideTimeout) {
    window.clearTimeout(chantHideTimeout)
  }
  if (savePaperTransformTimeout) {
    window.clearTimeout(savePaperTransformTimeout)
    savePaperTransform()
  }
  if (creditsRaf) {
    window.cancelAnimationFrame(creditsRaf)
  }
  stopMokLoop()
  if (mokAudioContext) {
    void mokAudioContext.close()
  }
})
</script>

<template>
  <div class="relative h-screen w-full overflow-hidden bg-bg-deep text-text-primary">
    <div v-if="operation.active" class="pointer-events-none absolute inset-x-0 top-0 z-[70]">
      <div class="border-b border-border-default bg-bg-surface/75 px-4 py-2">
        <p class="text-[11px] uppercase tracking-wider text-text-dim">// {{ operation.label }}</p>
        <div class="mt-1 h-1 w-full border border-border-default bg-bg-elevated">
          <div
            class="h-full bg-accent-sky transition-[width] duration-200"
            :style="{ width: `${operation.progress}%` }"
          />
        </div>
      </div>
    </div>
    <BuaPatternBg />
    <BuaHeaderPanel v-if="!isBurning && !isPostBurnHolding" />

    <div v-if="!isBurning && !isPostBurnHolding" class="absolute inset-x-3 top-3 z-40 sm:hidden">
      <div class="flex items-center gap-2">
        <RouterLink
          to="/"
          class="inline-flex h-10 items-center border border-border-default bg-bg-surface px-3 text-xs font-display tracking-wide text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
        >
          ← Trang chủ
        </RouterLink>
        <button
          class="h-10 border border-[#8a1212] bg-black px-3 text-xs font-display uppercase tracking-wide text-red-500 transition hover:bg-[#140404] hover:text-red-400"
          aria-label="Đốt bùa"
          title="Đốt bùa"
          @click="burnPaper"
        >
          Đốt bùa
        </button>
        <button
          class="ml-auto inline-flex h-10 items-center border border-border-default bg-bg-surface px-3 text-xs font-display tracking-wide text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
          :class="showMobileControlHub ? 'border-white bg-white text-black' : ''"
          :aria-label="showMobileControlHub ? 'Ẩn công cụ' : 'Hiện công cụ'"
          @click="showMobileControlHub = !showMobileControlHub"
        >
          {{ showMobileControlHub ? 'Đóng công cụ' : 'Công cụ' }}
        </button>
      </div>

      <div
        v-if="showMobileControlHub"
        class="mt-2 space-y-2 border border-border-default bg-bg-surface p-2"
      >
        <div class="grid grid-cols-2 gap-2">
          <button
            class="h-10 border px-3 text-xs font-display tracking-wide transition hover:border-accent-amber"
            :class="
              showAxisEditor
                ? 'border-white bg-white text-black'
                : 'border-border-default bg-bg-elevated text-text-secondary hover:text-text-primary'
            "
            :title="showAxisEditor ? 'Ẩn trục' : 'Hiện trục'"
            @click="showAxisEditor = !showAxisEditor"
          >
            {{ showAxisEditor ? 'Ẩn trục' : 'Hiện trục' }}
          </button>
          <button
            class="h-10 border px-3 text-xs font-display tracking-wide text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            :class="
              showBrushPanel
                ? 'border-white bg-white text-black'
                : 'border-border-default bg-bg-elevated'
            "
            title="Bút"
            @click="showBrushPanel = !showBrushPanel"
          >
            Bút
          </button>
          <button
            class="h-10 border px-3 text-xs font-display tracking-wide transition hover:border-accent-amber hover:text-text-primary"
            :class="
              showMokPanel
                ? 'border-white bg-white text-black'
                : 'border-border-default bg-bg-elevated text-text-secondary'
            "
            title="Gõ mõ"
            @click="showMokPanel = !showMokPanel"
          >
            Mõ
          </button>
          <button
            class="h-10 border px-3 text-xs font-display tracking-wide text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
            :class="
              showAxisPanel
                ? 'border-white bg-white text-black'
                : 'border-border-default bg-bg-elevated'
            "
            title="Trục"
            @click="showAxisPanel = !showAxisPanel"
          >
            Trục
          </button>
          <button
            class="h-10 border border-border-default bg-bg-elevated px-3 text-xs font-display tracking-wide text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
            title="Bùa ngẫu nhiên"
            @click="randomizeBuaColors"
          >
            Ngẫu nhiên
          </button>
          <button
            class="h-10 border px-3 text-xs font-display tracking-wide text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
            :class="
              showMenu ? 'border-white bg-white text-black' : 'border-border-default bg-bg-elevated'
            "
            title="Menu"
            @click="showMenu = !showMenu"
          >
            Menu
          </button>
          <button
            class="h-10 border px-3 text-xs font-display tracking-wide text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
            :class="
              showChantPanel
                ? 'border-white bg-white text-black'
                : 'border-border-default bg-bg-elevated'
            "
            title="Khấn"
            @click="showChantPanel = !showChantPanel"
          >
            Khấn
          </button>
          <button
            class="flex h-10 items-center justify-center gap-2 border px-3 text-xs font-display tracking-wide text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            :class="
              showPaperTransformEditor
                ? 'border-white bg-white text-black'
                : 'border-border-default bg-bg-elevated'
            "
            title="Thu phóng"
            @click="togglePaperTransformTool"
          >
            <Icon icon="lucide:zoom-in" class="size-4" />
            Thu phóng
          </button>
          <button
            class="h-10 border px-3 text-xs font-display tracking-wide text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            :class="
              showDrawingTransformEditor
                ? 'border-white bg-white text-black'
                : 'border-border-default bg-bg-elevated'
            "
            title="Thu phóng nét vẽ"
            @click="toggleDrawingTransformTool"
          >
            Zoom nét
          </button>
          <button
            class="h-10 border px-3 text-xs font-display tracking-wide text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
            :class="
              showDrawableEditor
                ? 'border-white bg-white text-black'
                : 'border-border-default bg-bg-elevated'
            "
            title="Vùng vẽ"
            @click="toggleDrawableTool"
          >
            Vùng vẽ
          </button>
          <button
            class="h-10 border border-border-default bg-bg-elevated px-3 text-xs font-display tracking-wide text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
            title="Undo"
            @click="undoDrawing"
          >
            Undo
          </button>
          <button
            class="h-10 border border-border-default bg-bg-elevated px-3 text-xs font-display tracking-wide text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
            title="Xuất / nhập bùa"
            @click="showTransferActions = !showTransferActions"
            :class="showTransferActions ? 'border-white bg-white text-black' : ''"
          >
            Xuất/Nhập
          </button>
          <button
            class="col-span-2 h-10 border border-border-default bg-bg-elevated px-3 text-xs font-display tracking-wide text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
            title="Bộ sưu tập"
            @click="showCollection = true"
            :class="showCollection ? 'border-white bg-white text-black' : ''"
          >
            Bộ sưu tập
          </button>
        </div>

        <div
          v-if="showTransferActions"
          class="space-y-2 border border-border-default bg-bg-elevated p-2"
        >
          <button
            class="w-full border border-border-default px-3 py-2 text-left text-sm text-text-secondary transition hover:border-accent-sky hover:bg-bg-surface hover:text-text-primary"
            @click="(openExportModal('style'), (showTransferActions = false))"
          >
            Tạo mã style
          </button>
          <button
            class="w-full border border-border-default px-3 py-2 text-left text-sm text-text-secondary transition hover:border-accent-amber hover:bg-bg-surface hover:text-text-primary"
            @click="(openExportModal('drawing'), (showTransferActions = false))"
          >
            Tạo mã nét vẽ
          </button>
          <button
            class="w-full border border-border-default px-3 py-2 text-left text-sm text-text-secondary transition hover:border-accent-amber hover:bg-bg-surface hover:text-text-primary"
            @click="((showImportModal = true), (showTransferActions = false))"
          >
            Import style / nét
          </button>
        </div>

        <BuaMokPanel
          :open="showMokPanel && showMobileControlHub"
          :mok-enabled="mokEnabled"
          :mok-speed="mokSpeed"
          @update:mok-enabled="mokEnabled = $event"
          @update:mok-speed="mokSpeed = $event"
        />

        <BuaPaperTransformPanel
          :open="showPaperTransformEditor && showMobileControlHub"
          :paper-transform="paperTransform"
          @update:paper-transform="updatePaperTransform"
          @reset-paper-transform="resetPaperTransform"
        />

        <BuaDrawingTransformPanel
          :open="showDrawingTransformEditor && showMobileControlHub"
          :drawing-transform="drawingTransform"
          @update:drawing-transform="drawingTransform = $event"
          @reset-drawing-transform="resetDrawingTransform"
        />

        <BuaDrawablePanel
          :open="showDrawableEditor && showMobileControlHub"
          :show-drawable-editor="showDrawableEditor"
          @toggle-drawable-editor="toggleDrawableTool"
          @reset-drawable-box="resetDrawableBox"
        />

        <BuaAxisPanel
          :open="showAxisPanel && showMobileControlHub"
          :axis-count="axisCount"
          :show-guides="showGuides"
          :show-axis-editor="showAxisEditor"
          @update:axis-count="axisCount = $event"
          @update:show-guides="showGuides = $event"
          @toggle-axis-editor="showAxisEditor = !showAxisEditor"
          @random-axes="randomAxes"
          @reset-axes-even="resetAxesEven"
        />

        <BuaChantPanel
          :open="showChantPanel && showMobileControlHub"
          :chant-enabled="chantEnabled"
          :chant-text="chantText"
          :chant-samples="CHANT_SAMPLES"
          :placeholder="CHANT_PLACEHOLDER"
          @update:chant-enabled="chantEnabled = $event"
          @update:chant-text="chantText = $event"
          @use-sample="useSampleChant"
        />
      </div>
    </div>

    <div
      v-if="!isBurning && !isPostBurnHolding"
      class="absolute left-3 top-3 z-40 hidden flex-col items-start gap-2 sm:flex"
    >
      <div class="flex items-center gap-2">
        <RouterLink
          to="/"
          class="inline-flex items-center border border-border-default bg-bg-surface px-3 py-2 text-xs font-display tracking-wide text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
        >
          ← Trang chủ
        </RouterLink>
        <button
          class="h-10 border px-3 text-xs font-display tracking-wide transition hover:border-accent-amber"
          :class="
            showAxisEditor
              ? 'border-white bg-white text-black'
              : 'border-border-default bg-bg-surface text-text-secondary hover:text-text-primary'
          "
          :title="showAxisEditor ? 'Ẩn trục' : 'Hiện trục'"
          @click="showAxisEditor = !showAxisEditor"
        >
          {{ showAxisEditor ? 'Ẩn trục' : 'Hiện trục' }}
        </button>
        <button
          class="grid h-10 w-10 place-items-center border text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          :class="
            showBrushPanel
              ? 'border-white bg-white text-black'
              : 'border-border-default bg-bg-surface'
          "
          title="Bút"
          @click="showBrushPanel = !showBrushPanel"
        >
          ✎
        </button>
        <button
          class="h-10 border px-3 text-xs font-display tracking-wide transition hover:border-accent-amber hover:text-text-primary"
          :class="
            showMokPanel
              ? 'border-white bg-white text-black'
              : 'border-border-default bg-bg-surface text-text-secondary'
          "
          title="Gõ mõ"
          @click="showMokPanel = !showMokPanel"
        >
          Mõ
        </button>
        <button
          class="h-10 border px-3 text-xs font-display tracking-wide text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
          :class="
            showAxisPanel
              ? 'border-white bg-white text-black'
              : 'border-border-default bg-bg-surface'
          "
          title="Trục"
          @click="showAxisPanel = !showAxisPanel"
        >
          Trục
        </button>
        <button
          class="grid h-10 w-10 place-items-center border border-border-default bg-bg-surface text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
          title="Bùa ngẫu nhiên"
          aria-label="Bùa ngẫu nhiên"
          @click="randomizeBuaColors"
        >
          🔀
        </button>
      </div>

      <BuaMokPanel
        :open="showMokPanel"
        :mok-enabled="mokEnabled"
        :mok-speed="mokSpeed"
        @update:mok-enabled="mokEnabled = $event"
        @update:mok-speed="mokSpeed = $event"
      />

      <BuaAxisPanel
        :open="showAxisPanel"
        :axis-count="axisCount"
        :show-guides="showGuides"
        :show-axis-editor="showAxisEditor"
        @update:axis-count="axisCount = $event"
        @update:show-guides="showGuides = $event"
        @toggle-axis-editor="showAxisEditor = !showAxisEditor"
        @random-axes="randomAxes"
        @reset-axes-even="resetAxesEven"
      />
    </div>

    <div
      v-if="!isBurning && !isPostBurnHolding"
      class="absolute right-3 top-3 z-40 hidden flex-col items-end gap-2 sm:flex"
    >
      <div class="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
        <button
          class="grid h-10 w-10 place-items-center border text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
          :class="
            showMenu ? 'border-white bg-white text-black' : 'border-border-default bg-bg-surface'
          "
          :aria-label="showMenu ? 'Ẩn menu' : 'Hiện menu'"
          title="Menu"
          @click="showMenu = !showMenu"
        >
          <span class="flex flex-col gap-1">
            <span class="block h-0.5 w-4 bg-current" />
            <span class="block h-0.5 w-4 bg-current" />
            <span class="block h-0.5 w-4 bg-current" />
          </span>
        </button>
        <button
          class="h-10 border px-3 text-xs font-display tracking-wide text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
          :class="
            showChantPanel
              ? 'border-white bg-white text-black'
              : 'border-border-default bg-bg-surface'
          "
          title="Khấn"
          @click="showChantPanel = !showChantPanel"
        >
          Khấn
        </button>
        <button
          class="grid h-10 w-10 place-items-center border border-border-default bg-bg-surface text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          :class="showPaperTransformEditor ? 'border-white bg-white text-black' : ''"
          title="Thu phóng"
          aria-label="Thu phóng"
          @click="togglePaperTransformTool"
        >
          <Icon icon="lucide:zoom-in" class="size-4" />
        </button>
        <button
          class="grid h-10 w-10 place-items-center border border-border-default bg-bg-surface text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          :class="showDrawingTransformEditor ? 'border-white bg-white text-black' : ''"
          title="Thu phóng nét vẽ"
          aria-label="Thu phóng nét vẽ"
          @click="toggleDrawingTransformTool"
        >
          <Icon icon="lucide:scan-zoom" class="size-4" />
        </button>
        <button
          class="grid h-10 w-10 place-items-center border border-border-default bg-bg-surface text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
          :class="showDrawableEditor ? 'border-white bg-white text-black' : ''"
          title="Vùng vẽ"
          aria-label="Vùng vẽ"
          @click="toggleDrawableTool"
        >
          <Icon icon="lucide:crop" class="size-4" />
        </button>
        <button
          class="grid h-10 w-10 place-items-center border border-border-default bg-bg-surface text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
          title="Undo"
          @click="undoDrawing"
        >
          ↶
        </button>
        <button
          class="grid h-10 w-10 place-items-center border border-border-default bg-bg-surface text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
          title="Xuất / nhập bùa"
          @click="showTransferActions = !showTransferActions"
          :class="showTransferActions ? 'border-white bg-white text-black' : ''"
        >
          ⭳
        </button>
        <button
          class="grid h-10 w-10 place-items-center border border-border-default bg-bg-surface text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
          title="Bộ sưu tập"
          @click="showCollection = true"
          :class="showCollection ? 'border-white bg-white text-black' : ''"
        >
          📚
        </button>
      </div>

      <div
        v-if="showTransferActions"
        class="pointer-events-auto w-[220px] border border-border-default bg-bg-surface p-2"
      >
        <button
          class="w-full border border-border-default px-3 py-2 text-left text-sm text-text-secondary transition hover:border-accent-sky hover:bg-bg-elevated hover:text-text-primary"
          @click="(openExportModal('style'), (showTransferActions = false))"
        >
          Tạo mã style
        </button>
        <button
          class="mt-2 w-full border border-border-default px-3 py-2 text-left text-sm text-text-secondary transition hover:border-accent-amber hover:bg-bg-elevated hover:text-text-primary"
          @click="(openExportModal('drawing'), (showTransferActions = false))"
        >
          Tạo mã nét vẽ
        </button>
        <button
          class="mt-2 w-full border border-border-default px-3 py-2 text-left text-sm text-text-secondary transition hover:border-accent-amber hover:bg-bg-elevated hover:text-text-primary"
          @click="((showImportModal = true), (showTransferActions = false))"
        >
          Import style / nét
        </button>
      </div>

      <BuaPaperTransformPanel
        :open="showPaperTransformEditor"
        :paper-transform="paperTransform"
        @update:paper-transform="updatePaperTransform"
        @reset-paper-transform="resetPaperTransform"
      />

      <BuaDrawingTransformPanel
        :open="showDrawingTransformEditor"
        :drawing-transform="drawingTransform"
        @update:drawing-transform="drawingTransform = $event"
        @reset-drawing-transform="resetDrawingTransform"
      />

      <BuaDrawablePanel
        :open="showDrawableEditor"
        :show-drawable-editor="showDrawableEditor"
        @toggle-drawable-editor="toggleDrawableTool"
        @reset-drawable-box="resetDrawableBox"
      />

      <BuaChantPanel
        :open="showChantPanel"
        :chant-enabled="chantEnabled"
        :chant-text="chantText"
        :chant-samples="CHANT_SAMPLES"
        :placeholder="CHANT_PLACEHOLDER"
        @update:chant-enabled="chantEnabled = $event"
        @update:chant-text="chantText = $event"
        @use-sample="useSampleChant"
      />

      <button
        class="pointer-events-auto border border-[#8a1212] bg-black px-4 py-2 text-sm font-display uppercase tracking-wide text-red-500 transition hover:bg-[#140404] hover:text-red-400"
        aria-label="Đốt bùa"
        title="Đốt bùa"
        @click="burnPaper"
      >
        Đốt bùa
      </button>
    </div>

    <main class="relative z-20 h-full w-full px-3 pb-3 pt-20 sm:px-4 sm:pb-4 sm:pt-24">
      <div
        v-if="isBurning"
        class="pointer-events-none absolute inset-0 z-10"
        style="
          background: radial-gradient(
            circle at center,
            rgb(15 25 35 / 0.15) 0%,
            rgb(15 25 35 / 0.68) 58%,
            rgb(15 25 35 / 0.85) 100%
          );
        "
      />
      <div
        v-if="showChantOverlay"
        class="pointer-events-none absolute inset-x-3 bottom-6 z-20 border border-border-default bg-bg-surface/85 p-4 text-sm text-text-primary sm:inset-x-8 sm:text-base"
      >
        <p class="mb-2 text-xs uppercase tracking-wider text-accent-amber">// Lời khấn</p>
        <p class="max-h-[34vh] overflow-hidden whitespace-pre-wrap break-words leading-relaxed">
          {{ chantDisplayText }}
        </p>
      </div>
      <div class="relative h-full w-full">
        <div v-show="!isPostBurnHolding" class="absolute inset-0 z-30">
          <BuaMandalaPaper
            ref="paperRef"
            :axis-count="axisCount"
            :brush-color="brushColor"
            :brush-size="brushSize"
            :brush-opacity="brushOpacity"
            :brush-size-randomness="brushSizeRandomness"
            :brush-opacity-randomness="brushOpacityRandomness"
            :brush-tool="brushTool"
            :paper-tint="paperTint"
            :frame-tint="frameTint"
            :show-guides="showGuides"
            :show-axis-editor="showAxisEditor"
            :free-draw="freeDraw"
            :drawable-box="drawableBox"
            :show-drawable-editor="showDrawableEditor"
            :paper-transform="paperTransform"
            :show-paper-transform-editor="showPaperTransformEditor"
            :drawing-transform="drawingTransform"
            :show-drawing-transform-editor="showDrawingTransformEditor"
            @burned="handleBurned"
            @burning-change="handleBurningChange"
            @burning-progress="handleBurningProgress"
            @update:drawable-box="updateDrawableBox"
            @update:paper-transform="updatePaperTransform"
            @update:drawing-transform="drawingTransform = $event"
            @toggle-drawable-editor="toggleDrawableTool"
            @reset-drawing-transform="resetDrawingTransform"
          />
        </div>

        <BuaBrushPanel
          :open="showBrushPanel && !isBurning && !isPostBurnHolding"
          :brush-color="brushColor"
          :brush-size="brushSize"
          :brush-opacity="brushOpacity"
          :brush-size-randomness="brushSizeRandomness"
          :brush-opacity-randomness="brushOpacityRandomness"
          :brush-tool="brushTool"
          :free-draw="freeDraw"
          :paper-tint="paperTint"
          :frame-tint="frameTint"
          @update:brush-color="brushColor = $event"
          @update:brush-size="brushSize = $event"
          @update:brush-opacity="brushOpacity = $event"
          @update:brush-size-randomness="brushSizeRandomness = $event"
          @update:brush-opacity-randomness="brushOpacityRandomness = $event"
          @update:brush-tool="brushTool = $event"
          @update:free-draw="freeDraw = $event"
          @update:paper-tint="paperTint = $event"
          @update:frame-tint="frameTint = $event"
          @reset-brush-color="resetBrushColor"
          @reset-brush-size="resetBrushSize"
          @reset-brush-opacity="resetBrushOpacity"
          @reset-brush-randomness="resetBrushRandomness"
          @reset-paper-tint="resetPaperTint"
          @reset-frame-tint="resetFrameTint"
        />

        <BuaActionMenuPanel
          :open="showMenu && !isBurning && !isPostBurnHolding"
          :design-name="designName"
          :info-text="infoText"
          :drawing-stats="drawingStats"
          @update:design-name="designName = $event"
          @save-design="saveDesign"
          @open-credits="openCreditsModal"
          @reset-paper-transform="resetPaperTransform"
          @clear-drawing="clearDrawing"
          @undo-drawing="undoDrawing"
        />
      </div>
    </main>

    <BuaCollectionModal
      :open="showCollection"
      :items="collectionPreviews"
      @close="showCollection = false"
      @remove="removeFromCollection"
      @load="loadFromCollection"
    />

    <BuaExportModal
      :open="showExportModal"
      :mode="exportMode"
      :code="exportCodeText"
      :default-file-name="
        designName.trim() || (exportMode === 'style' ? 'bua-style' : 'bua-net-ve')
      "
      @close="showExportModal = false"
    />

    <BuaImportModal
      :open="showImportModal"
      :code="importCodeText"
      @close="showImportModal = false"
      @update:code="importCodeText = $event"
      @confirm="confirmImportModal"
    />

    <BuaCreditsModal
      :open="showCreditsModal"
      :credits-transform-style="creditsTransformStyle"
      @close="closeCreditsModal"
      @start-boost="startCreditsBoost"
      @stop-boost="stopCreditsBoost"
      @bind:container="bindCreditsContainer"
      @bind:content="bindCreditsContent"
    />
  </div>
</template>
