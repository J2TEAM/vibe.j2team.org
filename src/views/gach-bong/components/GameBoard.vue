<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import type { GachBongModule } from '../composables/types'
import type { GameStatus } from '../composables/useGameState'

interface Props {
  engine: GachBongModule
  tileSize: number
  status: GameStatus
  remainingTiles: number
  boardVersion: number
  selectedTile: { row: number; col: number } | null
  hintTiles: [{ row: number; col: number }, { row: number; col: number }] | null
  matchPath: [number, number][] | null
}

const emit = defineEmits<{
  tileClick: [row: number, col: number]
  animationDone: []
}>()

const props = defineProps<Props>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctxReady = false

// Reactive dimensions based on current tileSize
const rows = computed(() => props.engine.getBoardRows())
const cols = computed(() => props.engine.getBoardCols())
const canvasWidth = computed(() => cols.value * props.tileSize)
const canvasHeight = computed(() => rows.value * props.tileSize)

// Khởi tạo canvas và engine context
onMounted(() => {
  initCanvas()
})

function initCanvas() {
  const canvas = canvasRef.value
  const width = canvasWidth.value
  const height = canvasHeight.value

  if (!canvas || width === 0 || height === 0) return

  const dpr = window.devicePixelRatio || 1
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)

  props.engine.initEngine(ctx)
  ctxReady = true
  renderBoard()
}

// Re-init canvas when tileSize changes
watch(
  () => props.tileSize,
  () => {
    if (props.status === 'menu' || !ctxReady) return
    initCanvas()
  },
)

// Re-init when board dimensions change (new game)
watch(
  () => props.boardVersion,
  () => {
    if (props.status === 'menu') return
    initCanvas()
  },
)

function renderBoard() {
  const canvas = canvasRef.value
  if (!canvas || !ctxReady) return

  const dpr = window.devicePixelRatio || 1
  const width = canvasWidth.value
  const height = canvasHeight.value

  // Re-setup canvas size in case of resize
  canvas.width = width * dpr
  canvas.height = height * dpr

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)

  // Re-init engine context after resize
  props.engine.initEngine(ctx)
  props.engine.renderBoard(props.tileSize)
}

// Re-render khi state thay đổi
watch(
  () =>
    [
      props.selectedTile,
      props.hintTiles,
      props.remainingTiles,
      props.boardVersion,
      props.status,
    ] as const,
  () => {
    if (props.status === 'menu' || !ctxReady) return

    props.engine.renderBoard(props.tileSize)

    if (props.selectedTile) {
      props.engine.renderSingleTile(
        props.selectedTile.row,
        props.selectedTile.col,
        props.tileSize,
        true,
        false,
      )
    }

    if (props.hintTiles) {
      props.engine.renderSingleTile(
        props.hintTiles[0].row,
        props.hintTiles[0].col,
        props.tileSize,
        false,
        true,
      )
      props.engine.renderSingleTile(
        props.hintTiles[1].row,
        props.hintTiles[1].col,
        props.tileSize,
        false,
        true,
      )
    }
  },
  { deep: true },
)

// Path animation
watch(
  () => props.matchPath,
  (path) => {
    if (!path || path.length < 2 || !ctxReady) return

    props.engine.renderBoard(props.tileSize)
    props.engine.renderPath(path, props.tileSize)

    setTimeout(() => {
      props.engine.renderBoard(props.tileSize)
      emit('animationDone')
    }, 450)
  },
)

function handleInteraction(clientX: number, clientY: number) {
  if (props.status !== 'playing') return
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const scaleX = canvasWidth.value / rect.width
  const scaleY = canvasHeight.value / rect.height

  const x = (clientX - rect.left) * scaleX
  const y = (clientY - rect.top) * scaleY

  const col = Math.floor(x / props.tileSize)
  const row = Math.floor(y / props.tileSize)

  if (row >= 0 && row < rows.value && col >= 0 && col < cols.value) {
    emit('tileClick', row, col)
  }
}

function handleClick(e: MouseEvent) {
  handleInteraction(e.clientX, e.clientY)
}

function handleTouch(e: TouchEvent) {
  e.preventDefault()
  if (e.touches.length > 0) {
    const touch = e.touches[0]
    if (touch) {
      handleInteraction(touch.clientX, touch.clientY)
    }
  }
}
</script>

<template>
  <div class="flex justify-center w-full">
    <div
      class="relative inline-block"
      :style="{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }"
    >
      <canvas
        ref="canvasRef"
        class="cursor-pointer absolute inset-0 rounded shadow-md"
        @click="handleClick"
        @touchstart.prevent="handleTouch"
      />

      <!-- Gợi ý nhấp nháy 2 ô -->
      <template v-if="hintTiles">
        <div
          v-for="(tile, i) in hintTiles"
          :key="`hint-${i}`"
          class="absolute rounded border-[3px] border-accent-amber pointer-events-none transition-all duration-300"
          :style="{
            width: `${tileSize}px`,
            height: `${tileSize}px`,
            left: `${tile.col * tileSize}px`,
            top: `${tile.row * tileSize}px`,
            boxShadow: '0 0 20px rgba(255, 187, 0, 0.9), inset 0 0 20px rgba(255, 187, 0, 0.7)',
            animation: 'custom-pulse 1s infinite alternate',
          }"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
@keyframes custom-pulse {
  0% {
    opacity: 0.6;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1.05);
  }
}
</style>
