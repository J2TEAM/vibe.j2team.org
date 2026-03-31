<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import { useClipboard } from '@vueuse/core'
import { Icon } from '@iconify/vue'

import {
  TOTAL_CHECKBOXES,
  ZOOM_LEVELS,
  MINIMAP_SIZE,
  MINIMAP_DEBOUNCE_MS,
  COLS,
  CELL_SIZE,
} from './constants/gridConfig'

import { encodeRLE, decodeRLE } from './utils/compression'
import { useSpatialGrid } from './composables/useSpatialGrid'
import { usePixelState } from './composables/usePixelState'
import { useCanvasRenderer } from './composables/useCanvasRenderer'
import { useMinimap } from './composables/useMinimap'
import { useZoomControls } from './composables/useZoomControls'
import { useDrawingInteraction } from './composables/useDrawingInteraction'
import { useMqttSync } from './composables/useMqttSync'

// Refs
const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const minimapRef = ref<HTMLCanvasElement | null>(null)

// State
const showMinimap = ref(false)
const {
  checkedSet,
  togglePixel,
  setPixel,
  clearAll: clearAllState,
  importState: importStateRaw,
  exportState: exportStateRaw,
  markDirtyAndSave,
} = usePixelState()

// Pending changes for MQTT
const pendingAdd = new Set<number>()
const pendingDel = new Set<number>()

// Spatial Grid
const { spatialGrid, rebuildSpatialGrid, updateSpatialGrid } = useSpatialGrid()
rebuildSpatialGrid(checkedSet.value)

// Instantiations
const { zoomIndex, zoom, zoomIn, zoomOut, resetZoom, fitToScreen, handleKeyboard, handleWheel } =
  useZoomControls(
    containerRef,
    () => draw(),
    () => drawMinimap(),
    showMinimap,
  )

const { draw } = useCanvasRenderer(canvasRef, containerRef, zoom, checkedSet, spatialGrid)

const { drawMinimap, handleMinimapPointerDown, handleMinimapPointerMove, handleMinimapPointerUp } =
  useMinimap(minimapRef, containerRef, zoom, checkedSet, spatialGrid, showMinimap)

const { isDrawMode, handlePointerDown, handlePointerMove, handlePointerUp } = useDrawingInteraction(
  containerRef,
  zoom,
  togglePixel,
  setPixel,
  updateSpatialGrid,
  () => {
    draw()
    if (showMinimap.value) drawMinimap()
  },
  pendingAdd,
  pendingDel,
)

const { isConnected, syncCount } = useMqttSync(
  checkedSet,
  updateSpatialGrid,
  () => {
    draw()
    if (showMinimap.value) drawMinimap()
  },
  pendingAdd,
  pendingDel,
  markDirtyAndSave,
)

// Scroll Handling
let scrollTimeout: number | null = null
function handleScroll() {
  if (scrollTimeout) clearTimeout(scrollTimeout)
  scrollTimeout = window.setTimeout(() => {
    if (showMinimap.value) drawMinimap()
  }, MINIMAP_DEBOUNCE_MS)
  draw()
}

// Global Handlers
onMounted(() => {
  window.addEventListener('keydown', handleKeyboard)
  window.addEventListener('wheel', handleWheel, { passive: false })
  window.addEventListener('resize', draw)

  // Initial draw
  requestAnimationFrame(() => draw())
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyboard)
  window.removeEventListener('wheel', handleWheel)
  window.removeEventListener('resize', draw)
})

// UI Actions
const { copy, copied } = useClipboard()

function exportState() {
  const indices = exportStateRaw()
  const code = encodeRLE(indices, 500000)
  copy(code)
}

function importState() {
  const code = prompt('Enter a vibe code (RLE encoded base64) to import:')
  if (!code) return
  try {
    const indices = decodeRLE(code)
    if (indices && Array.isArray(indices) && indices.length > 0) {
      importStateRaw(indices)
      rebuildSpatialGrid(checkedSet.value)

      // Pan to the imported content
      let minCol = Infinity
      let minRow = Infinity
      for (let i = 0; i < indices.length; i++) {
        const idx = indices[i]!
        const c = idx % COLS
        const r = Math.floor(idx / COLS)
        if (c < minCol) minCol = c
        if (r < minRow) minRow = r
      }

      if (minCol !== Infinity && minRow !== Infinity && containerRef.value) {
        const cellSize = CELL_SIZE * zoom.value
        // Center the import by adding some padding
        const paddingX = Math.max(0, (containerRef.value.clientWidth - 400) / 2)
        const paddingY = Math.max(0, (containerRef.value.clientHeight - 400) / 2)
        containerRef.value.scrollLeft = Math.max(0, minCol * cellSize - paddingX)
        containerRef.value.scrollTop = Math.max(0, minRow * cellSize - paddingY)
      }

      draw()
      if (showMinimap.value) drawMinimap()
    } else {
      alert('Invalid format or empty state.')
    }
  } catch {
    alert('Failed to parse vibe code.')
  }
}

function clearAll() {
  if (confirm('Are you sure you want to clear all your checkboxes?')) {
    clearAllState()
    spatialGrid.clear()
    pendingAdd.clear()
    pendingDel.clear()
    draw()
    if (showMinimap.value) drawMinimap()
  }
}
</script>

<template>
  <div
    class="relative w-full h-[100dvh] bg-bg-deep text-text-primary overflow-hidden font-body flex flex-col"
  >
    <!-- Header -->
    <header
      class="absolute top-0 left-0 right-0 z-10 flex flex-wrap items-center justify-between gap-2 p-2 sm:p-4 bg-bg-surface/80 backdrop-blur-md border-b border-border-default shadow-sm pointer-events-none"
    >
      <div class="flex items-center gap-2 sm:gap-3">
        <RouterLink
          to="/"
          class="p-1.5 rounded hover:bg-bg-elevated transition-colors text-text-secondary hover:text-text-primary pointer-events-auto shrink-0"
          title="Back to Home"
        >
          <Icon icon="lucide:arrow-left" class="size-5" />
        </RouterLink>
        <h1
          class="text-lg sm:text-xl font-display font-bold text-accent-coral flex items-center gap-1 sm:gap-2 shrink-0"
        >
          <Icon icon="lucide:check-square" class="size-5 sm:size-6 shrink-0" />
          <span class="hidden sm:inline whitespace-nowrap">1 Billion Checkboxes</span>
          <span class="sm:hidden whitespace-nowrap">1B Checkboxes</span>
        </h1>
        <div
          class="px-2 py-1 rounded bg-bg-elevated text-[10px] sm:text-xs font-mono text-text-secondary border border-border-default flex items-center gap-1.5 shrink-0"
        >
          <div
            :class="[
              'size-1.5 sm:size-2 rounded-full',
              isConnected
                ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                : 'bg-red-500 animate-pulse',
            ]"
          ></div>
          {{ isConnected ? 'Live' : 'Connecting' }}
        </div>
        <div
          v-if="syncCount > 0"
          class="text-[10px] sm:text-xs text-accent-amber animate-pulse whitespace-nowrap"
        >
          Sync ({{ syncCount }})
        </div>
      </div>

      <div class="flex items-center gap-1 sm:gap-2 pointer-events-auto">
        <div class="bg-bg-elevated rounded-lg p-0.5 sm:p-1 border border-border-default flex">
          <button
            @click="isDrawMode = false"
            :class="[
              'px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 sm:gap-1.5',
              !isDrawMode
                ? 'bg-accent-coral text-white'
                : 'text-text-secondary hover:text-text-primary',
            ]"
          >
            <Icon icon="lucide:hand" class="size-3 sm:size-4" />
            <span class="hidden sm:inline">Pan</span>
          </button>
          <button
            @click="isDrawMode = true"
            :class="[
              'px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 sm:gap-1.5',
              isDrawMode
                ? 'bg-accent-coral text-white'
                : 'text-text-secondary hover:text-text-primary',
            ]"
          >
            <Icon icon="lucide:pen-tool" class="size-3 sm:size-4" />
            <span class="hidden sm:inline">Draw</span>
          </button>
        </div>

        <div class="w-px h-6 sm:h-8 bg-border-default mx-0.5 sm:mx-1"></div>

        <button
          @click="exportState"
          class="p-1.5 sm:p-2 rounded-lg bg-bg-elevated hover:bg-bg-surface border border-border-default transition-colors text-text-secondary hover:text-text-primary"
          title="Export State"
        >
          <Icon :icon="copied ? 'lucide:check' : 'lucide:download'" class="size-4 sm:size-5" />
        </button>
        <button
          @click="importState"
          class="p-1.5 sm:p-2 rounded-lg bg-bg-elevated hover:bg-bg-surface border border-border-default transition-colors text-text-secondary hover:text-text-primary"
          title="Import State"
        >
          <Icon icon="lucide:upload" class="size-4 sm:size-5" />
        </button>
        <button
          @click="clearAll"
          class="p-1.5 sm:p-2 rounded-lg bg-bg-elevated hover:bg-red-500/20 border border-border-default transition-colors text-text-secondary hover:text-red-400"
          title="Clear All"
        >
          <Icon icon="lucide:trash-2" class="size-4 sm:size-5" />
        </button>
      </div>
    </header>

    <!-- Main Canvas Container -->
    <main
      ref="containerRef"
      class="flex-1 w-full h-full overflow-auto overscroll-none outline-none"
      :class="{
        'cursor-grab active:cursor-grabbing': !isDrawMode,
        'cursor-crosshair touch-none': isDrawMode,
      }"
      tabindex="0"
      @scroll="handleScroll"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointerleave="handlePointerUp"
    >
      <div
        class="relative bg-bg-deep origin-top-left"
        :style="{
          width: `${COLS * CELL_SIZE * zoom}px`,
          height: `${Math.ceil(TOTAL_CHECKBOXES / COLS) * CELL_SIZE * zoom}px`,
        }"
      >
        <!-- The canvas itself is fixed size equal to viewport, we just draw what's visible -->
      </div>
    </main>

    <!-- Canvas layer (fixed position overlay that we draw to) -->
    <canvas ref="canvasRef" class="absolute inset-0 pointer-events-none z-0"></canvas>

    <!-- Controls Overlay -->
    <div
      class="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 flex flex-col items-end gap-2 sm:gap-4 pointer-events-none max-w-[calc(100vw-2rem)]"
    >
      <!-- Minimap Container -->
      <div
        v-show="showMinimap"
        class="bg-bg-surface border border-border-default rounded-lg shadow-xl overflow-hidden pointer-events-auto"
      >
        <div
          class="bg-bg-elevated px-3 py-1.5 text-xs font-mono text-text-secondary border-b border-border-default flex justify-between items-center"
        >
          <span>Minimap</span>
          <button @click="showMinimap = false" class="hover:text-text-primary">
            <Icon icon="lucide:x" class="size-3" />
          </button>
        </div>
        <canvas
          ref="minimapRef"
          :width="MINIMAP_SIZE"
          :height="MINIMAP_SIZE"
          class="block cursor-crosshair max-w-full max-h-[30vh] w-auto h-auto object-contain"
          @pointerdown="handleMinimapPointerDown"
          @pointermove="handleMinimapPointerMove"
          @pointerup="handleMinimapPointerUp"
          @pointerleave="handleMinimapPointerUp"
        ></canvas>
      </div>

      <!-- Zoom Controls -->
      <div
        class="flex items-center gap-1 sm:gap-2 bg-bg-surface/90 backdrop-blur border border-border-default rounded-lg p-1 shadow-lg pointer-events-auto overflow-x-auto overscroll-x-contain touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-w-full"
      >
        <button
          @click="showMinimap = !showMinimap"
          class="p-1.5 sm:p-2 rounded hover:bg-bg-elevated transition-colors text-text-secondary shrink-0"
          :class="{ 'text-accent-sky bg-accent-sky/10': showMinimap }"
          title="Toggle Minimap"
        >
          <Icon icon="lucide:map" class="size-4 sm:size-5" />
        </button>

        <div class="w-px h-5 sm:h-6 bg-border-default mx-0.5 sm:mx-1 shrink-0"></div>

        <button
          @click="zoomOut"
          class="p-1.5 sm:p-2 rounded hover:bg-bg-elevated transition-colors text-text-secondary hover:text-text-primary shrink-0"
          :disabled="zoomIndex === 0"
        >
          <Icon icon="lucide:minus" class="size-4 sm:size-5" />
        </button>

        <div
          class="px-1 sm:px-2 text-xs sm:text-sm font-mono font-medium text-text-primary min-w-[3.5rem] sm:min-w-[4rem] text-center shrink-0"
          title="Zoom Level"
        >
          {{ Number((zoom * 100).toFixed(2)) }}%
        </div>

        <button
          @click="zoomIn"
          class="p-1.5 sm:p-2 rounded hover:bg-bg-elevated transition-colors text-text-secondary hover:text-text-primary shrink-0"
          :disabled="zoomIndex === ZOOM_LEVELS.length - 1"
        >
          <Icon icon="lucide:plus" class="size-4 sm:size-5" />
        </button>

        <div class="w-px h-5 sm:h-6 bg-border-default mx-0.5 sm:mx-1 shrink-0"></div>

        <button
          @click="resetZoom"
          class="p-1.5 sm:p-2 rounded hover:bg-bg-elevated transition-colors text-text-secondary hover:text-text-primary shrink-0"
          title="Reset Zoom"
        >
          <Icon icon="lucide:zoom-in" class="size-4 sm:size-5" />
        </button>
        <button
          @click="fitToScreen"
          class="p-1.5 sm:p-2 rounded hover:bg-bg-elevated transition-colors text-text-secondary hover:text-text-primary shrink-0"
          title="Fit to Screen"
        >
          <Icon icon="lucide:maximize" class="size-4 sm:size-5" />
        </button>
      </div>
    </div>
  </div>
</template>
