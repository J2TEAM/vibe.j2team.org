<template>
  <div class="min-h-screen bg-bg-base px-4 py-8 md:px-8">
    <div class="max-w-6xl mx-auto">
      <!-- Back Home -->
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
      >
        &larr; Về trang chủ
      </RouterLink>

      <h1 class="mt-6 mb-1 text-3xl font-bold text-text-primary">🧱 Lego Mosaic Generator</h1>
      <p class="mb-6 text-sm text-text-secondary">
        Tải ảnh lên và chuyển đổi thành ảnh ghép LEGO sử dụng bảng màu LEGO thực tế.
      </p>

      <!-- Upload section — full-width, prominent -->
      <div class="mb-4">
        <label class="block cursor-pointer group" @dragover.prevent @drop.prevent="handleDrop">
          <input type="file" accept="image/*" class="sr-only" @change="handleUpload" />
          <div
            class="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border-default bg-bg-surface px-6 text-center transition-all duration-200 group-hover:border-accent-coral group-hover:bg-accent-coral/5"
            :class="originalImageUrl ? 'py-5' : 'py-10'"
          >
            <div
              class="flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-orange-400 to-red-500 text-2xl shadow-lg transition-transform duration-200 group-hover:scale-110"
            >
              📁
            </div>
            <div>
              <p class="text-base font-semibold text-text-primary">
                {{ originalImageUrl ? 'Chọn ảnh khác' : 'Chọn ảnh để tạo LEGO Mosaic' }}
              </p>
              <p class="mt-1 text-xs text-text-secondary">
                Hỗ trợ JPG, PNG, WebP — kéo thả hoặc click để chọn
              </p>
            </div>
            <span
              class="rounded-lg bg-linear-to-r from-orange-500 to-red-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 group-hover:shadow-lg group-hover:opacity-90"
            >
              Chọn ảnh
            </span>
          </div>
        </label>
      </div>

      <!-- Controls card -->
      <div class="rounded-xl border border-border-default bg-bg-surface shadow p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

          <!-- Grid Size -->
          <div>
            <label class="text-sm font-semibold text-text-primary block mb-1">
              Số viên gạch: <span class="text-accent-coral font-bold">{{ gridSize }} × {{ gridSize }}</span>
            </label>
            <input
              type="range"
              min="32"
              max="2048"
              step="32"
              v-model.number="gridSize"
              class="w-full accent-accent-coral touch-manipulation mb-1"
            />
            <div class="flex justify-between text-xs text-text-secondary mb-2">
              <span>32</span>
              <span>512</span>
              <span>1024</span>
              <span>2048</span>
            </div>
            <p class="text-xs text-text-secondary leading-relaxed rounded-lg bg-bg-base border border-border-default px-3 py-2">
              Số viên gạch LEGO theo mỗi chiều.
              <strong class="text-text-primary">{{ gridSize }}</strong> → mosaic gồm
              {{ (gridSize * gridSize).toLocaleString('vi-VN') }} viên.
              Độ phân giải cao hơn → chi tiết hơn, xử lý lâu hơn.
            </p>
          </div>

          <!-- Brick pixel size -->
          <div>
            <label class="text-sm font-semibold text-text-primary block mb-1">
              Kích thước viên gạch: <span class="text-accent-coral font-bold">{{ effectiveBrick }}px</span>
              <span v-if="effectiveBrick !== brickSize" class="text-xs text-text-secondary ml-1">(đã giới hạn)</span>
            </label>
            <input
              type="range"
              min="1"
              max="16"
              v-model.number="brickSize"
              class="w-full accent-accent-coral touch-manipulation mb-1"
            />
            <div class="flex justify-between text-xs text-text-secondary mb-2">
              <span>1px</span><span>16px</span>
            </div>
            <p class="text-xs text-text-secondary leading-relaxed rounded-lg bg-bg-base border border-border-default px-3 py-2">
              Kích thước pixel của mỗi viên gạch trong ảnh xuất.
              Canvas tối đa {{ MAX_CANVAS_DIM.toLocaleString() }}px — brick tự động giới hạn nếu cần.
            </p>
          </div>

        </div>
      </div>

      <!-- Preview: mobile = 1 col, desktop = 25% original | 75% mosaic -->
      <div class="preview-grid gap-6 mb-6">

        <!-- Left (25%): original image -->
        <div class="rounded-xl border border-border-default bg-bg-surface shadow p-4 flex flex-col">
          <h2 class="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">Ảnh gốc</h2>
          <div
            class="flex flex-1 items-center justify-center overflow-hidden rounded-lg bg-bg-base"
            style="min-height: 120px; max-height: 280px"
          >
            <img
              v-if="originalImageUrl"
              :src="originalImageUrl"
              alt="Ảnh gốc"
              class="max-w-full object-contain"
              style="max-height: 280px"
            />
            <span v-else class="text-xs text-text-secondary text-center px-2">Chưa có ảnh</span>
          </div>
          <p v-if="originalImageUrl" class="mt-2 text-center text-xs text-text-secondary">Ảnh tham chiếu</p>
        </div>

        <!-- Right (75%): mosaic viewer + loading overlay -->
        <div class="relative rounded-xl border border-border-default bg-bg-surface shadow p-4 flex flex-col">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-xs font-semibold text-text-secondary uppercase tracking-widest">
              Ảnh ghép gạch LEGO
            </h2>
            <span v-if="hasMosaic && !isProcessing" class="text-xs text-text-secondary">
              {{ gridSize }}&thinsp;×&thinsp;{{ gridSize }} viên
              &middot; {{ effectiveBrick }}px/viên
              <span v-if="showGrid"> &middot; ⊞ lưới</span>
            </span>
          </div>

          <MosaicViewer
            ref="viewerRef"
            :show-grid="showGrid"
            @toggle-grid="onToggleGrid"
          />

          <!-- Processing overlay -->
          <div
            v-if="isProcessing"
            class="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-bg-base/80 backdrop-blur-sm"
          >
            <div class="flex flex-col items-center gap-3">
              <div class="h-8 w-8 animate-spin rounded-full border-2 border-border-default border-t-accent-coral"></div>
              <span class="text-sm text-text-secondary">Đang xử lý…</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Brick statistics -->
      <BrickStats
        v-if="hasMosaic && !isProcessing"
        :stats="brickStats"
        :total-bricks="totalBricks"
        :color-count="colorCount"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import MosaicViewer from './MosaicViewer.vue'
import BrickStats   from './BrickStats.vue'
import { LEGO_COLORS } from './utils/lego-colors'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_CANVAS_DIM = 4096

// ─── Viewer ref ───────────────────────────────────────────────────────────────

const viewerRef = ref<InstanceType<typeof MosaicViewer> | null>(null)

// ─── Image state ──────────────────────────────────────────────────────────────

const originalImageUrl = ref<string | null>(null)
let originalImage: HTMLImageElement | null = null

// ─── Controls ─────────────────────────────────────────────────────────────────

const gridSize      = ref<number>(64)
const brickSize     = ref<number>(4)
const showGrid      = ref<boolean>(false)
const isProcessing  = ref<boolean>(false)
const effectiveBrick = ref<number>(4)

// ─── Cached color-index grid (Uint8Array — indices into LEGO_COLORS) ──────────

let cachedColorGrid  = new Uint8Array(0)
let cachedSize       = 0
let cachedBrick      = 0

// ─── Stats ────────────────────────────────────────────────────────────────────

interface BrickStat {
  color:   string
  name:    string
  count:   number
  percent: number
}

const brickCount   = ref<Record<string, number>>({})
const colorNameMap = ref<Record<string, string>>({})

// ─── Computed ─────────────────────────────────────────────────────────────────

const hasMosaic   = computed(() => Object.keys(brickCount.value).length > 0)
const totalBricks = computed(() => Object.values(brickCount.value).reduce((s, n) => s + n, 0))
const colorCount  = computed(() => Object.keys(brickCount.value).length)

const brickStats = computed<BrickStat[]>(() => {
  const total = totalBricks.value
  return Object.entries(brickCount.value)
    .map(([hex, count]) => ({
      color:   hex,
      name:    colorNameMap.value[hex] ?? hex,
      count,
      percent: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
})

// ─── Web Worker ───────────────────────────────────────────────────────────────

let worker: Worker | null = null

function handleWorkerMessage(e: MessageEvent) {
  const { type, imgBuffer, size, brick } = e.data as {
    type:      'process' | 'render'
    imgBuffer: ArrayBuffer
    size:      number
    brick:     number
  }

  // Draw the received ImageData onto the viewer's canvas
  const canvas = viewerRef.value?.canvasEl
  if (!canvas) { isProcessing.value = false; return }

  const cw = size * brick
  canvas.width  = cw
  canvas.height = cw
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.putImageData(new ImageData(new Uint8ClampedArray(imgBuffer), cw, cw), 0, 0)
  }

  // On a full 'process' run also update stats + cached grid
  if (type === 'process') {
    const { idxGrid: idxBuf, statsBuffer } = e.data as {
      idxGrid:     ArrayBuffer
      statsBuffer: ArrayBuffer
    }

    // Re-own the transferred buffers
    cachedColorGrid = new Uint8Array(idxBuf)
    cachedSize      = size
    cachedBrick     = brick
    effectiveBrick.value = brick

    // Build human-readable stats from the Uint32Array counter
    const statsArr = new Uint32Array(statsBuffer)
    const counts: Record<string, number> = {}
    const nameMap:  Record<string, string> = {}
    for (let i = 0; i < LEGO_COLORS.length; i++) {
      if (statsArr[i]! > 0) {
        const lego      = LEGO_COLORS[i]!
        counts[lego.hex] = statsArr[i]!
        nameMap[lego.hex] = lego.name
      }
    }
    brickCount.value   = counts
    colorNameMap.value = nameMap

  } else {
    // Render-only: update cached brick size
    cachedBrick = brick
    effectiveBrick.value = brick
  }

  viewerRef.value?.notifyDrawn(size, brick)
  isProcessing.value = false
}

// ─── Upload handlers ──────────────────────────────────────────────────────────

function loadImageFile(file: File) {
  if (!file.type.startsWith('image/')) return
  if (originalImageUrl.value) URL.revokeObjectURL(originalImageUrl.value)
  const url = URL.createObjectURL(file)
  originalImageUrl.value = url
  const img = new Image()
  img.src = url
  img.onload = () => { originalImage = img; processFullPipeline() }
}

function handleDrop(e: DragEvent) {
  const file = e.dataTransfer?.files[0]
  if (file) loadImageFile(file)
}

function handleUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) loadImageFile(file)
}

// ─── Core: compute effective brick size (respects MAX_CANVAS_DIM) ─────────────

function computeBrick(size: number, raw: number): number {
  return (size * raw) > MAX_CANVAS_DIM
    ? Math.max(1, Math.floor(MAX_CANVAS_DIM / size))
    : raw
}

// ─── Core: full pipeline — send pixels to worker for color-match + render ─────

function processFullPipeline() {
  if (!originalImage || !worker) return

  const size  = gridSize.value
  const brick = computeBrick(size, brickSize.value)
  effectiveBrick.value = brick
  isProcessing.value   = true

  // Downscale source image to grid resolution
  const tmp = document.createElement('canvas')
  tmp.width = tmp.height = size
  const tmpCtx = tmp.getContext('2d')
  if (!tmpCtx) { isProcessing.value = false; return }
  tmpCtx.drawImage(originalImage, 0, 0, size, size)

  // Transfer pixel data to worker (zero-copy)
  const pixelBuf = tmpCtx.getImageData(0, 0, size, size).data.buffer.slice(0) as ArrayBuffer
  worker.postMessage({ type: 'process', pixels: pixelBuf, size, brick }, [pixelBuf])
}

// ─── Core: render-only — resend cached grid to worker at new brick size ────────

function rerenderBricks() {
  if (!cachedColorGrid.length || !worker) return

  const brick = computeBrick(cachedSize, brickSize.value)
  if (brick === cachedBrick) return  // nothing changed
  isProcessing.value = true

  // Copy (not transfer) so we keep cachedColorGrid intact
  const idxCopy = cachedColorGrid.buffer.slice(0) as ArrayBuffer
  worker.postMessage(
    { type: 'render', idxGrid: idxCopy, size: cachedSize, brick },
    [idxCopy],
  )
}

// ─── Grid toggle: just flip the ref — MosaicViewer watches it ────────────────

function onToggleGrid() {
  showGrid.value = !showGrid.value
}

// ─── Watchers ─────────────────────────────────────────────────────────────────

let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(gridSize, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  // Larger grids need a longer debounce to avoid flooding the worker
  const delay = gridSize.value > 512 ? 500 : 250
  debounceTimer = setTimeout(processFullPipeline, delay)
})

watch(brickSize, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(rerenderBricks, 150)
})

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  worker = new Worker(
    new URL('./utils/mosaic-worker.ts', import.meta.url),
    { type: 'module' },
  )
  worker.onmessage = handleWorkerMessage
  worker.onerror   = (err) => {
    console.error('[MosaicWorker]', err)
    isProcessing.value = false
  }
})

onUnmounted(() => {
  worker?.terminate()
  worker = null
  if (originalImageUrl.value) URL.revokeObjectURL(originalImageUrl.value)
})
</script>

<style scoped>
/* 25% original | 75% mosaic on desktop, single column on mobile */
.preview-grid {
  display: grid;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .preview-grid {
    grid-template-columns: 1fr 3fr;
  }
}
</style>
