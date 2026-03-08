<template>
  <div
    ref="containerRef"
    class="relative w-full overflow-hidden rounded-lg bg-bg-base select-none"
    style="height: 500px; touch-action: none"
    @wheel.prevent="onWheel"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @mouseup="onMouseEnd"
    @mouseleave="onMouseEnd"
    @touchstart="onTouchStart"
    @touchmove.prevent="onTouchMove"
    @touchend="onTouchEnd"
  >
    <!-- Transform wrapper: both canvases move together -->
    <div class="absolute top-0 left-0" :style="wrapperStyle">
      <!-- Main canvas: solid brick colors (rendered by Web Worker) -->
      <canvas ref="canvasEl" style="image-rendering: pixelated; display: block"></canvas>
      <!-- Grid overlay: transparent canvas drawn with stroke lines (instant toggle) -->
      <canvas
        ref="gridCanvasEl"
        v-show="showGrid"
        style="image-rendering: pixelated; position: absolute; top: 0; left: 0; pointer-events: none"
      ></canvas>
    </div>

    <!-- Empty state -->
    <div
      v-if="!hasContent"
      class="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <p class="text-sm text-text-secondary">Tải ảnh lên để tạo mosaic LEGO</p>
    </div>

    <!-- Toolbar: top-right -->
    <div
      v-if="hasContent"
      class="absolute top-2 right-2 z-10 flex gap-1"
      @mousedown.stop
      @touchstart.stop
    >
      <button
        class="rounded border border-border-default bg-bg-surface/90 px-2 py-1 text-xs font-medium text-text-secondary shadow backdrop-blur-sm transition hover:border-accent-coral hover:text-text-primary"
        title="Reset 1:1"
        @click.stop="resetZoom"
      >
        1:1
      </button>

      <button
        class="rounded border border-border-default bg-bg-surface/90 px-2 py-1 text-xs font-medium text-text-secondary shadow backdrop-blur-sm transition hover:border-accent-coral hover:text-text-primary"
        title="Vừa màn hình"
        @click.stop="fit"
      >
        ⤢
      </button>

      <button
        class="rounded border border-border-default bg-bg-surface/90 px-2 py-1 text-xs font-medium text-text-secondary shadow backdrop-blur-sm transition hover:border-accent-coral hover:text-text-primary"
        title="Tải xuống PNG"
        @click.stop="downloadCanvas"
      >
        ↓ PNG
      </button>

      <!-- Grid toggle — highlighted when active -->
      <button
        class="rounded border bg-bg-surface/90 px-2 py-1 text-xs font-medium shadow backdrop-blur-sm transition"
        :class="
          showGrid
            ? 'border-accent-coral text-accent-coral'
            : 'border-border-default text-text-secondary hover:border-accent-coral hover:text-text-primary'
        "
        title="Hiện/ẩn đường lưới gạch"
        @click.stop="emit('toggleGrid')"
      >
        ⊞ Lưới
      </button>
    </div>

    <!-- Zoom slider: bottom-center -->
    <div
      v-if="hasContent"
      class="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border-default bg-bg-surface/90 px-3 py-1.5 shadow backdrop-blur-sm"
      @mousedown.stop
      @touchstart.stop
    >
      <span class="select-none text-xs text-text-secondary">0.5×</span>
      <input
        type="range"
        min="0.5"
        max="15"
        step="0.1"
        :value="scale.toFixed(1)"
        class="w-28 accent-accent-coral touch-manipulation"
        @input="onSliderZoom"
      />
      <span class="w-12 select-none text-center font-mono text-xs text-text-primary">
        {{ scale.toFixed(1) }}×
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// ─── Props / Emits ────────────────────────────────────────────────────────────

const props = defineProps<{ showGrid?: boolean }>()
const emit  = defineEmits<{ toggleGrid: [] }>()

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_SCALE  = 0.1
const MAX_SCALE  = 15
const CLAMP_PAD  = 80

// ─── Refs ─────────────────────────────────────────────────────────────────────

const containerRef  = ref<HTMLDivElement      | null>(null)
const canvasEl      = ref<HTMLCanvasElement   | null>(null)
const gridCanvasEl  = ref<HTMLCanvasElement   | null>(null)

const scale      = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const hasContent = ref(false)

// ─── Grid overlay state (non-reactive — only used inside draw functions) ──────

let innerSize  = 0
let innerBrick = 0

// ─── Drag bookkeeping ─────────────────────────────────────────────────────────

let dragStartX = 0, dragStartY  = 0
let dragStartTX = 0, dragStartTY = 0
let rafId: number | null = null

// ─── Touch bookkeeping ────────────────────────────────────────────────────────

let lastTouchX = 0, lastTouchY = 0, lastPinchDist = 0

// ─── Computed wrapper style ───────────────────────────────────────────────────

const wrapperStyle = computed(() => ({
  transformOrigin: '0 0',
  transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`,
  cursor: isDragging.value ? 'grabbing' : 'grab',
  willChange: 'transform',
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi)
}

function applyClamp() {
  const canvas    = canvasEl.value
  const container = containerRef.value
  if (!canvas || !container) return

  const cw = canvas.width  * scale.value
  const ch = canvas.height * scale.value
  const vw = container.clientWidth
  const vh = container.clientHeight

  translateX.value = clamp(translateX.value, -(cw - CLAMP_PAD), vw - CLAMP_PAD)
  translateY.value = clamp(translateY.value, -(ch - CLAMP_PAD), vh - CLAMP_PAD)
}

function zoomAt(cx: number, cy: number, newScale: number) {
  newScale = clamp(newScale, MIN_SCALE, MAX_SCALE)
  const ratio = newScale / scale.value
  translateX.value = cx - (cx - translateX.value) * ratio
  translateY.value = cy - (cy - translateY.value) * ratio
  scale.value = newScale
  applyClamp()
}

// ─── Grid overlay drawing ─────────────────────────────────────────────────────

/** Draw grid lines onto the overlay canvas using native stroke (very fast) */
function drawGridOverlay() {
  const canvas = gridCanvasEl.value
  if (!canvas || innerSize === 0 || innerBrick === 0) return

  const cw = innerSize * innerBrick
  canvas.width  = cw
  canvas.height = cw

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Thinner lines for small bricks, standard for larger
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)'
  ctx.lineWidth   = innerBrick >= 4 ? 1 : Math.max(0.5, innerBrick * 0.2)
  ctx.beginPath()

  for (let i = 1; i < innerSize; i++) {
    const pos = i * innerBrick
    ctx.moveTo(pos, 0);  ctx.lineTo(pos, cw)
    ctx.moveTo(0,   pos); ctx.lineTo(cw, pos)
  }

  ctx.stroke()
}

function clearGridOverlay() {
  const canvas = gridCanvasEl.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
}

// ─── Watch: redraw / clear grid when prop toggles ────────────────────────────

watch(() => props.showGrid, (show) => {
  if (show) drawGridOverlay()
  else      clearGridOverlay()
})

// ─── Public API (exposed to parent) ──────────────────────────────────────────

/** Scale canvas to fit container, centered */
function fit() {
  const container = containerRef.value
  const canvas    = canvasEl.value
  if (!container || !canvas || !canvas.width) return

  const s = clamp(
    Math.min(container.clientWidth / canvas.width, container.clientHeight / canvas.height),
    MIN_SCALE,
    MAX_SCALE,
  )
  scale.value      = s
  translateX.value = (container.clientWidth  - canvas.width  * s) / 2
  translateY.value = (container.clientHeight - canvas.height * s) / 2
}

/** Reset to 1:1, centered */
function resetZoom() {
  const container = containerRef.value
  const canvas    = canvasEl.value
  if (!container || !canvas) return

  scale.value      = 1
  translateX.value = (container.clientWidth  - canvas.width)  / 2
  translateY.value = (container.clientHeight - canvas.height) / 2
  applyClamp()
}

/**
 * Called by parent after a new mosaic is drawn.
 * Stores grid dimensions, fits to screen, and redraws the grid overlay if active.
 */
function notifyDrawn(size: number, brick: number) {
  innerSize  = size
  innerBrick = brick
  hasContent.value = true

  requestAnimationFrame(() => {
    fit()
    if (props.showGrid) drawGridOverlay()
  })
}

/** No-op — kept for API compatibility */
function refreshMinimap() { /* removed */ }

// ─── Download (merges main canvas + grid overlay) ────────────────────────────

function downloadCanvas() {
  const canvas = canvasEl.value
  if (!canvas) return

  const gridCanvas = gridCanvasEl.value
  const hasGrid    = props.showGrid && gridCanvas && gridCanvas.width > 0

  let url: string
  if (hasGrid) {
    // Merge mosaic + grid onto a temporary canvas before saving
    const merged = document.createElement('canvas')
    merged.width  = canvas.width
    merged.height = canvas.height
    const ctx = merged.getContext('2d')!
    ctx.drawImage(canvas,     0, 0)
    ctx.drawImage(gridCanvas, 0, 0)
    url = merged.toDataURL('image/png')
  } else {
    url = canvas.toDataURL('image/png')
  }

  const a = document.createElement('a')
  a.href     = url
  a.download = 'lego-mosaic.png'
  a.click()
}

// ─── Mouse wheel zoom ─────────────────────────────────────────────────────────

function onWheel(e: WheelEvent) {
  const container = containerRef.value
  if (!container) return
  const rect = container.getBoundingClientRect()
  zoomAt(e.clientX - rect.left, e.clientY - rect.top, scale.value * Math.exp(-e.deltaY / 300))
}

function onSliderZoom(e: Event) {
  const container = containerRef.value
  if (!container) return
  const newScale = parseFloat((e.target as HTMLInputElement).value)
  zoomAt(container.clientWidth / 2, container.clientHeight / 2, newScale)
}

// ─── Mouse drag ───────────────────────────────────────────────────────────────

function onMouseDown(e: MouseEvent) {
  if (e.button !== 0) return
  isDragging.value = true
  dragStartX  = e.clientX
  dragStartY  = e.clientY
  dragStartTX = translateX.value
  dragStartTY = translateY.value
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging.value || rafId !== null) return
  const dx = e.clientX - dragStartX
  const dy = e.clientY - dragStartY
  rafId = requestAnimationFrame(() => {
    translateX.value = dragStartTX + dx
    translateY.value = dragStartTY + dy
    applyClamp()
    rafId = null
  })
}

function onMouseEnd() {
  isDragging.value = false
}

// ─── Touch drag + pinch zoom ──────────────────────────────────────────────────

function pinchDist(e: TouchEvent) {
  const dx = e.touches[0]!.clientX - e.touches[1]!.clientX
  const dy = e.touches[0]!.clientY - e.touches[1]!.clientY
  return Math.hypot(dx, dy)
}

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 1) {
    isDragging.value = true
    lastTouchX = e.touches[0]!.clientX
    lastTouchY = e.touches[0]!.clientY
  } else if (e.touches.length === 2) {
    isDragging.value = false
    lastPinchDist    = pinchDist(e)
  }
}

function onTouchMove(e: TouchEvent) {
  if (e.touches.length === 1 && isDragging.value) {
    const dx = e.touches[0]!.clientX - lastTouchX
    const dy = e.touches[0]!.clientY - lastTouchY
    lastTouchX = e.touches[0]!.clientX
    lastTouchY = e.touches[0]!.clientY
    translateX.value += dx
    translateY.value += dy
    applyClamp()
  } else if (e.touches.length === 2) {
    const dist = pinchDist(e)
    if (lastPinchDist === 0) { lastPinchDist = dist; return }
    const container = containerRef.value
    if (!container) return
    const rect = container.getBoundingClientRect()
    const cx = (e.touches[0]!.clientX + e.touches[1]!.clientX) / 2 - rect.left
    const cy = (e.touches[0]!.clientY + e.touches[1]!.clientY) / 2 - rect.top
    zoomAt(cx, cy, scale.value * (dist / lastPinchDist))
    lastPinchDist = dist
  }
}

function onTouchEnd(e: TouchEvent) {
  if (e.touches.length === 0) {
    isDragging.value = false
    lastPinchDist    = 0
  } else if (e.touches.length === 1) {
    lastTouchX    = e.touches[0]!.clientX
    lastTouchY    = e.touches[0]!.clientY
    lastPinchDist = 0
    isDragging.value = true
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

let resizeObs: ResizeObserver | null = null

onMounted(() => {
  const el = containerRef.value
  if (!el) return
  resizeObs = new ResizeObserver(() => { if (hasContent.value) fit() })
  resizeObs.observe(el)
})

onUnmounted(() => {
  resizeObs?.disconnect()
  if (rafId) cancelAnimationFrame(rafId)
})

// ─── Expose ───────────────────────────────────────────────────────────────────

defineExpose({ canvasEl, fit, notifyDrawn, refreshMinimap })
</script>
