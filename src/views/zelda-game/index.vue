<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Game } from './engine/Game'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './utils/constants'
import { clearSpriteCache } from './utils/sprites'

const canvasRef = ref<HTMLCanvasElement>()
const gameState = ref<string>('loading')
let game: Game | null = null
let stateInterval: ReturnType<typeof setInterval> | null = null

const router = useRouter()

function resizeCanvas(): void {
  if (!canvasRef.value) return
  const canvas = canvasRef.value
  const parent = canvas.parentElement
  if (!parent) return

  const maxW = parent.clientWidth
  const maxH = window.innerHeight * 0.8
  const scale = Math.min(maxW / CANVAS_WIDTH, maxH / CANVAS_HEIGHT)

  canvas.style.width = `${CANVAS_WIDTH * scale}px`
  canvas.style.height = `${CANVAS_HEIGHT * scale}px`
}

function handleCanvasClick(): void {
  if (game && game.state === 'paused') {
    game.resume()
  }
}

function handleKeyEscape(e: KeyboardEvent): void {
  if (e.key === 'Escape' && game && game.state === 'paused') {
    game.resume()
  }
}

onMounted(() => {
  if (!canvasRef.value) return
  game = new Game(canvasRef.value)
  game.start()
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  window.addEventListener('keydown', handleKeyEscape)

  // Sync game state ref (used nowhere in template currently, kept for future use)
  // Primary purpose: detect home navigation request every 100ms
  stateInterval = setInterval(() => {
    if (game) {
      gameState.value = game.state
      if (game.isHomeRequested()) {
        game.clearHomeRequest()
        game.stop()
        game = null
        router.push('/')
      }
    }
  }, 100)
})

onUnmounted(() => {
  game?.stop()
  game = null
  clearSpriteCache()
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('keydown', handleKeyEscape)
  if (stateInterval) clearInterval(stateInterval)
})
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center px-4 py-6"
  >
    <div class="w-full max-w-5xl">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary mb-4"
      >
        &larr; Về trang chủ
      </RouterLink>

      <h1 class="font-display text-3xl sm:text-4xl font-bold text-accent-coral mb-4">
        Zelda Adventure
      </h1>

      <div class="flex justify-center">
        <canvas
          ref="canvasRef"
          class="border border-border-default bg-black cursor-pointer touch-none"
          :width="CANVAS_WIDTH"
          :height="CANVAS_HEIGHT"
          @click="handleCanvasClick"
        />
      </div>

      <p class="mt-3 text-xs text-text-secondary text-center">
        WASD / arrow keys: move &nbsp;|&nbsp; ESC / P: pause
      </p>
      <p class="mt-1 text-xs text-text-secondary text-center">
        Space: sword &nbsp;|&nbsp; Shift: shield &nbsp;|&nbsp; E: bow &nbsp;|&nbsp; F: interact
      </p>
    </div>
  </div>
</template>
