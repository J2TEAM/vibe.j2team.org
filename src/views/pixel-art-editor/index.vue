<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useEventListener, useMediaQuery } from '@vueuse/core'

type GridSize = 16 | 32 | 64
type Tool = 'pencil' | 'eraser' | 'fill'

const GRID_SIZES: GridSize[] = [16, 32, 64]
const MAX_HISTORY = 120
const DEFAULT_BG_COLOR = '#fff7eb'

const paletteColors = [
  '#101820',
  '#f24f35',
  '#fca311',
  '#20a4f3',
  '#2a9d8f',
  '#7b2cbf',
  '#e9c46a',
  '#e76f51',
  '#ffffff',
  '#b8c0cc',
]

const gridSize = ref<GridSize>(32)
const activeTool = ref<Tool>('pencil')
const selectedColor = ref('#f24f35')
const customColor = ref('#f24f35')
const backgroundColor = ref(DEFAULT_BG_COLOR)
const showGrid = ref(true)
const isDrawing = ref(false)
const lastPaintedIndex = ref<number | null>(null)
const statusText = ref('Sẵn sàng vẽ!')

const canvasRef = ref<HTMLCanvasElement | null>(null)
const cells = ref<number[]>([])
const undoStack = ref<number[][]>([])
const redoStack = ref<number[][]>([])

const isMobile = useMediaQuery('(max-width: 768px)')

const pixelScale = computed(() => {
  if (gridSize.value === 16) return 24
  if (gridSize.value === 32) return 14
  return 10
})

const canvasPixels = computed(() => gridSize.value * pixelScale.value)
const selectedColorInt = computed(() => hexToColorInt(selectedColor.value))
const eraseColorInt = computed(() => hexToColorInt(backgroundColor.value))
const canUndo = computed(() => undoStack.value.length > 0)
const canRedo = computed(() => redoStack.value.length > 0)

function hexToColorInt(hex: string): number {
  const normalized = /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : '#000000'
  return Number.parseInt(normalized.slice(1), 16)
}

function colorIntToCss(colorInt: number): string {
  return `#${colorInt.toString(16).padStart(6, '0')}`
}

function createBlankCells(size: GridSize, color: number): number[] {
  return Array.from({ length: size * size }, () => color)
}

function resetCanvas(size: GridSize): void {
  cells.value = createBlankCells(size, eraseColorInt.value)
  undoStack.value = []
  redoStack.value = []
  isDrawing.value = false
  lastPaintedIndex.value = null
  statusText.value = `Tạo canvas mới ${size}x${size}`
  renderCanvas()
}

function pushUndoSnapshot(): void {
  undoStack.value.push(cells.value.slice())
  if (undoStack.value.length > MAX_HISTORY) {
    undoStack.value.shift()
  }
  redoStack.value = []
}

function pointerToCellIndex(event: PointerEvent): number | null {
  const canvas = canvasRef.value
  if (!canvas) return null

  const rect = canvas.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return null

  const x = Math.floor(((event.clientX - rect.left) / rect.width) * gridSize.value)
  const y = Math.floor(((event.clientY - rect.top) / rect.height) * gridSize.value)

  if (x < 0 || x >= gridSize.value || y < 0 || y >= gridSize.value) {
    return null
  }

  return y * gridSize.value + x
}

function paintCell(index: number): boolean {
  const nextColor = activeTool.value === 'eraser' ? eraseColorInt.value : selectedColorInt.value
  const current = cells.value[index]
  if (current === undefined || current === nextColor) return false

  cells.value[index] = nextColor
  return true
}

function floodFill(startIndex: number, fillColor: number): boolean {
  const startColor = cells.value[startIndex]
  if (startColor === undefined || startColor === fillColor) {
    return false
  }

  const size = gridSize.value
  const queue: number[] = [startIndex]
  const visited = new Uint8Array(cells.value.length)
  let changed = false

  while (queue.length > 0) {
    const index = queue.pop()
    if (index === undefined || visited[index] === 1) continue
    visited[index] = 1

    if (cells.value[index] !== startColor) continue

    cells.value[index] = fillColor
    changed = true

    const x = index % size
    const y = Math.floor(index / size)

    if (x > 0) queue.push(index - 1)
    if (x + 1 < size) queue.push(index + 1)
    if (y > 0) queue.push(index - size)
    if (y + 1 < size) queue.push(index + size)
  }

  return changed
}

function renderCanvas(): void {
  const canvas = canvasRef.value
  if (!canvas) return

  const size = gridSize.value
  const cellSize = pixelScale.value
  const outputSize = canvasPixels.value

  canvas.width = outputSize
  canvas.height = outputSize

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, outputSize, outputSize)

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = y * size + x
      const colorInt = cells.value[index]
      if (colorInt === undefined) continue
      ctx.fillStyle = colorIntToCss(colorInt)
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
    }
  }

  if (!showGrid.value) return

  ctx.strokeStyle = 'rgba(16, 24, 32, 0.18)'
  ctx.lineWidth = 1

  for (let i = 0; i <= size; i += 1) {
    const p = Math.round(i * cellSize) + 0.5

    ctx.beginPath()
    ctx.moveTo(p, 0)
    ctx.lineTo(p, outputSize)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, p)
    ctx.lineTo(outputSize, p)
    ctx.stroke()
  }
}

function setTool(tool: Tool): void {
  activeTool.value = tool
}

function selectPaletteColor(color: string): void {
  selectedColor.value = color
  customColor.value = color
  if (activeTool.value === 'eraser') {
    activeTool.value = 'pencil'
  }
}

function clearCanvas(): void {
  const clearColor = eraseColorInt.value
  let changed = false

  pushUndoSnapshot()

  for (let i = 0; i < cells.value.length; i += 1) {
    const current = cells.value[i]
    if (current === undefined || current === clearColor) continue
    cells.value[i] = clearColor
    changed = true
  }

  if (!changed) {
    undoStack.value.pop()
    return
  }

  statusText.value = 'Đã xóa toàn bộ canvas'
  renderCanvas()
}

function undo(): void {
  const previous = undoStack.value.pop()
  if (!previous) return

  redoStack.value.push(cells.value.slice())
  cells.value = previous
  isDrawing.value = false
  lastPaintedIndex.value = null
  statusText.value = 'Hoàn tác'
  renderCanvas()
}

function redo(): void {
  const next = redoStack.value.pop()
  if (!next) return

  undoStack.value.push(cells.value.slice())
  cells.value = next
  isDrawing.value = false
  lastPaintedIndex.value = null
  statusText.value = 'Làm lại'
  renderCanvas()
}

function onCanvasPointerDown(event: PointerEvent): void {
  if (event.button !== 0) return

  const index = pointerToCellIndex(event)
  if (index === null) return

  event.preventDefault()
  const canvas = canvasRef.value
  canvas?.setPointerCapture(event.pointerId)

  if (activeTool.value === 'fill') {
    pushUndoSnapshot()
    const changed = floodFill(index, selectedColorInt.value)
    if (!changed) {
      undoStack.value.pop()
      return
    }

    statusText.value = 'Tô vùng thành công'
    renderCanvas()
    return
  }

  pushUndoSnapshot()
  isDrawing.value = true
  lastPaintedIndex.value = index

  const changed = paintCell(index)
  if (changed) {
    renderCanvas()
  }
}

function onCanvasPointerMove(event: PointerEvent): void {
  if (!isDrawing.value) return

  const index = pointerToCellIndex(event)
  if (index === null || index === lastPaintedIndex.value) return

  lastPaintedIndex.value = index

  const changed = paintCell(index)
  if (changed) {
    renderCanvas()
  }
}

function stopDrawing(): void {
  isDrawing.value = false
  lastPaintedIndex.value = null
}

function handleKeyboardShortcut(event: KeyboardEvent): void {
  const isMetaPressed = event.ctrlKey || event.metaKey
  if (!isMetaPressed) return

  const key = event.key.toLowerCase()
  if (key === 'z' && !event.shiftKey) {
    event.preventDefault()
    undo()
    return
  }

  if (key === 'y' || (key === 'z' && event.shiftKey)) {
    event.preventDefault()
    redo()
  }
}

function exportPng(): void {
  const size = gridSize.value
  const exportScale = size === 64 ? 12 : 16
  const exportCanvas = document.createElement('canvas')
  exportCanvas.width = size * exportScale
  exportCanvas.height = size * exportScale

  const ctx = exportCanvas.getContext('2d')
  if (!ctx) return

  ctx.imageSmoothingEnabled = false

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = y * size + x
      const colorInt = cells.value[index]
      if (colorInt === undefined) continue
      ctx.fillStyle = colorIntToCss(colorInt)
      ctx.fillRect(x * exportScale, y * exportScale, exportScale, exportScale)
    }
  }

  const link = document.createElement('a')
  link.href = exportCanvas.toDataURL('image/png')
  link.download = `pixel-art-${size}x${size}.png`
  link.click()
  statusText.value = 'Đã export PNG'
}

watch(gridSize, (nextSize) => {
  resetCanvas(nextSize)
})

watch(customColor, (color) => {
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    selectedColor.value = color
  }
})

watch(showGrid, () => {
  renderCanvas()
})

watch(backgroundColor, () => {
  resetCanvas(gridSize.value)
})

onMounted(() => {
  resetCanvas(gridSize.value)
})

useEventListener(window, 'pointerup', stopDrawing)
useEventListener(window, 'pointercancel', stopDrawing)
useEventListener(window, 'keydown', handleKeyboardShortcut)
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header class="animate-fade-up">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="font-display text-xs tracking-[0.2em] text-accent-amber">PIXEL ART</p>
            <h1 class="font-display text-4xl font-bold text-accent-coral sm:text-5xl">
              Pixel Art Editor
            </h1>
            <p class="mt-2 max-w-2xl text-sm text-text-secondary sm:text-base">
              Vẽ tranh pixel với bút, tẩy, bucket fill, undo/redo và export PNG.
            </p>
          </div>

          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          >
            <Icon icon="lucide:house" class="size-4" />
            Trang chủ
          </RouterLink>
        </div>
      </header>

      <div class="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section class="border border-border-default bg-bg-surface p-4 sm:p-5 animate-fade-up animate-delay-2">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="font-display text-xl font-semibold">
              <span class="mr-2 text-accent-coral">//</span>
              Canvas
            </h2>
            <span class="text-xs text-text-dim">{{ gridSize }}x{{ gridSize }}</span>
          </div>

          <div class="canvas-shell border border-border-default bg-bg-elevated p-3 sm:p-4">
            <canvas
              ref="canvasRef"
              :width="canvasPixels"
              :height="canvasPixels"
              class="pixel-canvas mx-auto block w-full max-w-160 touch-none"
              @pointerdown="onCanvasPointerDown"
              @pointermove="onCanvasPointerMove"
            />
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 border px-3 py-2 text-sm transition"
              :class="
                activeTool === 'pencil'
                  ? 'border-accent-coral bg-accent-coral/15 text-text-primary'
                  : 'border-border-default bg-bg-elevated text-text-secondary hover:text-text-primary'
              "
              @click="setTool('pencil')"
            >
              <Icon icon="lucide:pencil" class="size-4" />
              Bút
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-2 border px-3 py-2 text-sm transition"
              :class="
                activeTool === 'eraser'
                  ? 'border-accent-coral bg-accent-coral/15 text-text-primary'
                  : 'border-border-default bg-bg-elevated text-text-secondary hover:text-text-primary'
              "
              @click="setTool('eraser')"
            >
              <Icon icon="lucide:eraser" class="size-4" />
              Tẩy
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-2 border px-3 py-2 text-sm transition"
              :class="
                activeTool === 'fill'
                  ? 'border-accent-coral bg-accent-coral/15 text-text-primary'
                  : 'border-border-default bg-bg-elevated text-text-secondary hover:text-text-primary'
              "
              @click="setTool('fill')"
            >
              <Icon icon="lucide:paint-bucket" class="size-4" />
              Fill
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-45"
              :disabled="!canUndo"
              @click="undo"
            >
              <Icon icon="lucide:undo-2" class="size-4" />
              Undo
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-45"
              :disabled="!canRedo"
              @click="redo"
            >
              <Icon icon="lucide:redo-2" class="size-4" />
              Redo
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary transition hover:text-text-primary"
              @click="clearCanvas"
            >
              <Icon icon="lucide:trash-2" class="size-4" />
              Xóa
            </button>
          </div>

          <p class="mt-4 text-xs text-text-dim">
            {{ statusText }}
          </p>
        </section>

        <aside class="space-y-4 animate-fade-up animate-delay-3">
          <section class="border border-border-default bg-bg-surface p-4">
            <h2 class="font-display text-xl font-semibold">
              <span class="mr-2 text-accent-amber">//</span>
              Kích thước
            </h2>
            <div class="mt-3 grid grid-cols-3 gap-2">
              <button
                v-for="size in GRID_SIZES"
                :key="size"
                type="button"
                class="border px-3 py-2 text-sm transition"
                :class="
                  size === gridSize
                    ? 'border-accent-coral bg-accent-coral/15 text-text-primary'
                    : 'border-border-default bg-bg-elevated text-text-secondary hover:text-text-primary'
                "
                @click="gridSize = size"
              >
                {{ size }}x{{ size }}
              </button>
            </div>
          </section>

          <section class="border border-border-default bg-bg-surface p-4">
            <h2 class="font-display text-xl font-semibold">
              <span class="mr-2 text-accent-sky">//</span>
              Màu sắc
            </h2>

            <div class="mt-3 grid grid-cols-5 gap-2">
              <button
                v-for="color in paletteColors"
                :key="color"
                type="button"
                :title="color"
                class="h-9 border transition"
                :class="
                  color === selectedColor
                    ? 'border-accent-coral ring-2 ring-accent-coral/70'
                    : 'border-border-default'
                "
                :style="{ backgroundColor: color }"
                @click="selectPaletteColor(color)"
              />
            </div>

            <div class="mt-4 flex items-center gap-3">
              <div class="h-10 w-10 border border-border-default" :style="{ backgroundColor: selectedColor }" />
              <div class="flex-1">
                <label class="mb-1 block text-xs text-text-dim">Màu tùy chỉnh</label>
                <input
                  v-model="customColor"
                  type="color"
                  class="h-10 w-full border border-border-default bg-bg-elevated"
                />
              </div>
            </div>
          </section>

          <section class="border border-border-default bg-bg-surface p-4">
            <h2 class="font-display text-xl font-semibold">
              <span class="mr-2 text-accent-coral">//</span>
              Export
            </h2>

            <label class="mt-3 block text-xs text-text-dim">Nền mặc định khi xóa</label>
            <input
              v-model="backgroundColor"
              type="color"
              class="mt-2 h-10 w-full border border-border-default bg-bg-elevated"
            />

            <label class="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
              <input v-model="showGrid" type="checkbox" class="h-4 w-4 border-border-default" />
              Hiển thị lưới
            </label>

            <button
              type="button"
              class="mt-4 inline-flex w-full items-center justify-center gap-2 border border-accent-coral bg-accent-coral/15 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-accent-coral/25"
              @click="exportPng"
            >
              <Icon icon="lucide:download" class="size-4" />
              Export PNG
            </button>

            <p class="mt-3 text-xs text-text-dim">
              Mẹo: dùng <span class="text-text-secondary">Ctrl/Cmd + Z</span> để Undo,
              <span class="text-text-secondary">Ctrl/Cmd + Y</span> hoặc
              <span class="text-text-secondary">Shift + Ctrl/Cmd + Z</span> để Redo.
            </p>
          </section>

          <p v-if="isMobile" class="text-xs text-text-dim">
            Trên mobile, giữ và kéo để vẽ liên tục.
          </p>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pixel-canvas {
  image-rendering: pixelated;
}

.canvas-shell {
  background-image:
    radial-gradient(circle at 20% 20%, rgb(255 255 255 / 3%), transparent 44%),
    radial-gradient(circle at 80% 80%, rgb(242 79 53 / 8%), transparent 42%);
}
</style>
