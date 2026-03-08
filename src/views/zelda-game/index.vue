<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Game } from './engine/Game'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './utils/constants'
import { clearSpriteCache } from './utils/sprites'

const canvasRef = ref<HTMLCanvasElement>()
const gameState = ref<string>('loading')
const isTouchDevice = ref(false)
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
    game.setState('playing')
  }
}

function handleKeyEscape(e: KeyboardEvent): void {
  if (e.key === 'Escape' && game && game.state === 'paused') {
    game.setState('playing')
  }
}

// Virtual joystick state
let joystickActive = false
let joystickCenter = { x: 0, y: 0 }

function getJoystickCenter(el: HTMLElement): { x: number; y: number } {
  const rect = el.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

function onJoystickStart(e: TouchEvent): void {
  e.preventDefault()
  joystickActive = true
  const el = e.currentTarget as HTMLElement
  joystickCenter = getJoystickCenter(el)
  const touch = e.touches[0]
  if (touch) updateJoystick(touch)
}

function onJoystickMove(e: TouchEvent): void {
  e.preventDefault()
  if (!joystickActive) return
  const touch = e.touches[0]
  if (touch) updateJoystick(touch)
}

function onJoystickEnd(e: TouchEvent): void {
  e.preventDefault()
  joystickActive = false
  game?.input.setTouchDirection(0, 0)
}

function updateJoystick(touch: Touch): void {
  const dx = touch.clientX - joystickCenter.x
  const dy = touch.clientY - joystickCenter.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist === 0) {
    game?.input.setTouchDirection(0, 0)
    return
  }
  const nx = dx / dist
  const ny = dy / dist
  game?.input.setTouchDirection(nx, ny)
}

type TouchAction = 'attack' | 'block' | 'ranged' | 'interact' | 'pause'

function onTouchAction(action: TouchAction, pressed: boolean): void {
  game?.input.setTouchAction(action, pressed)
}

onMounted(() => {
  isTouchDevice.value = window.matchMedia('(pointer: coarse)').matches

  if (!canvasRef.value) return
  game = new Game(canvasRef.value)
  game.start()
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  window.addEventListener('keydown', handleKeyEscape)

  // Sync game state to reactive ref for template; also handle home navigation
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
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center px-4 py-6">
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

      <div class="flex justify-center relative">
        <canvas
          ref="canvasRef"
          class="border border-border-default bg-black cursor-pointer"
          :width="CANVAS_WIDTH"
          :height="CANVAS_HEIGHT"
          @click="handleCanvasClick"
        />
        <!-- Paused overlay -->
        <div
          v-if="gameState === 'paused'"
          class="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none"
        >
          <p class="font-display text-2xl text-accent-coral">⏸ TẠM DỪNG — nhấn ESC hoặc chạm để tiếp tục</p>
        </div>
      </div>

      <!-- Mobile touch controls -->
      <div v-if="isTouchDevice" class="mt-4 flex items-center justify-between gap-4 select-none">
        <!-- Virtual joystick -->
        <div
          class="relative w-32 h-32 rounded-full border-2 border-border-default bg-bg-surface/80 flex items-center justify-center touch-none"
          @touchstart.prevent="onJoystickStart"
          @touchmove.prevent="onJoystickMove"
          @touchend.prevent="onJoystickEnd"
          @touchcancel.prevent="onJoystickEnd"
        >
          <span class="text-text-secondary text-xs select-none">🕹️</span>
        </div>

        <!-- Action buttons -->
        <div class="flex flex-col gap-3">
          <div class="flex gap-3">
            <button
              class="w-14 h-14 rounded-full border border-border-default bg-bg-surface text-xl flex items-center justify-center active:bg-bg-elevated touch-none"
              @touchstart.prevent="onTouchAction('attack', true)"
              @touchend.prevent="onTouchAction('attack', false)"
              @touchcancel.prevent="onTouchAction('attack', false)"
            >⚔️</button>
            <button
              class="w-14 h-14 rounded-full border border-border-default bg-bg-surface text-xl flex items-center justify-center active:bg-bg-elevated touch-none"
              @touchstart.prevent="onTouchAction('ranged', true)"
              @touchend.prevent="onTouchAction('ranged', false)"
              @touchcancel.prevent="onTouchAction('ranged', false)"
            >🏹</button>
          </div>
          <div class="flex gap-3">
            <button
              class="w-14 h-14 rounded-full border border-border-default bg-bg-surface text-xl flex items-center justify-center active:bg-bg-elevated touch-none"
              @touchstart.prevent="onTouchAction('block', true)"
              @touchend.prevent="onTouchAction('block', false)"
              @touchcancel.prevent="onTouchAction('block', false)"
            >🛡️</button>
            <button
              class="w-14 h-14 rounded-full border border-border-default bg-bg-surface text-xl flex items-center justify-center active:bg-bg-elevated touch-none"
              @touchstart.prevent="onTouchAction('interact', true)"
              @touchend.prevent="onTouchAction('interact', false)"
              @touchcancel.prevent="onTouchAction('interact', false)"
            >💬</button>
          </div>
          <div class="flex justify-center">
            <button
              class="w-14 h-14 rounded-full border border-border-default bg-bg-surface text-xl flex items-center justify-center active:bg-bg-elevated touch-none"
              @touchstart.prevent="onTouchAction('pause', true)"
              @touchend.prevent="onTouchAction('pause', false)"
              @touchcancel.prevent="onTouchAction('pause', false)"
            >⏸️</button>
          </div>
        </div>
      </div>

      <p v-if="!isTouchDevice" class="mt-3 text-xs text-text-secondary text-center">
        WASD / mũi tên: di chuyển &nbsp;|&nbsp; ESC / P: tạm dừng
      </p>
      <p v-if="!isTouchDevice" class="mt-1 text-xs text-text-secondary text-center">
        Space: kiếm &nbsp;|&nbsp; Shift: khiên &nbsp;|&nbsp; E: cung &nbsp;|&nbsp; F: tương tác
      </p>
    </div>
  </div>
</template>
