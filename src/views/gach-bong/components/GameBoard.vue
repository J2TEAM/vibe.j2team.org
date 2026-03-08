<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
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

const rows = props.engine.getBoardRows()
const cols = props.engine.getBoardCols()

const canvasWidth = cols * props.tileSize
const canvasHeight = rows * props.tileSize

// Khởi tạo canvas và engine context
onMounted(() => {
  initCanvas()
})

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas || canvasWidth === 0 || canvasHeight === 0) return

  const dpr = window.devicePixelRatio || 1
  canvas.width = canvasWidth * dpr
  canvas.height = canvasHeight * dpr

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)

  props.engine.initEngine(ctx)
  ctxReady = true
  props.engine.renderBoard(props.tileSize)
}

// Re-render khi state thay đổi
watch(
  () => [props.selectedTile, props.hintTiles, props.remainingTiles, props.boardVersion, props.status] as const,
  () => {
    if (props.status === 'menu' || !ctxReady) return

    props.engine.renderBoard(props.tileSize)

    if (props.selectedTile) {
      props.engine.renderSingleTile(props.selectedTile.row, props.selectedTile.col, props.tileSize, true, false)
    }

    if (props.hintTiles) {
      props.engine.renderSingleTile(props.hintTiles[0].row, props.hintTiles[0].col, props.tileSize, false, true)
      props.engine.renderSingleTile(props.hintTiles[1].row, props.hintTiles[1].col, props.tileSize, false, true)
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
  const scaleX = canvasWidth / rect.width
  const scaleY = canvasHeight / rect.height

  const x = (clientX - rect.left) * scaleX
  const y = (clientY - rect.top) * scaleY

  const col = Math.floor(x / props.tileSize)
  const row = Math.floor(y / props.tileSize)

  if (row >= 0 && row < rows && col >= 0 && col < cols) {
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
    <div class="relative inline-block" :style="{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }">
      <canvas
        ref="canvasRef"
        :style="{ width: '100%', height: '100%' }"
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
            animation: 'custom-pulse 1s infinite alternate'
          }"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
@keyframes custom-pulse {
  0% { opacity: 0.6; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1.05); }
}
</style>
