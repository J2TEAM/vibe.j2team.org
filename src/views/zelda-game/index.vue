<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Game } from './engine/Game'
import type { VictoryStats } from './utils/types'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './utils/constants'
import { clearSpriteCache } from './utils/sprites'

const canvasRef = ref<HTMLCanvasElement>()
const gameState = ref<string>('loading')
const currentStage = ref(1)
const victoryStats = ref<VictoryStats | null>(null)
const isTouchDevice = ref(false)
const hasWeapons = ref(false)
const joystickKnobPos = ref({ x: 0, y: 0 })
let game: Game | null = null
let stateInterval: ReturnType<typeof setInterval> | null = null

const router = useRouter()
function onResume() {
  game?.resume()
}
function onRestart() {
  game?.restart()
}
function onFullRestart() {
  game?.fullRestart()
}
function onHome() {
  if (stateInterval) clearInterval(stateInterval)
  game?.stop()
  game = null
  router.push('/')
}
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

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

function resetTouchState(): void {
  game?.input.setTouchDirection(0, 0)
  game?.input.clearAllTouchActions()
  joystickKnobPos.value = { x: 0, y: 0 }
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
  joystickKnobPos.value = { x: 0, y: 0 }
}

const JOYSTICK_RADIUS = 48

function updateJoystick(touch: Touch): void {
  const dx = touch.clientX - joystickCenter.x
  const dy = touch.clientY - joystickCenter.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist === 0) {
    game?.input.setTouchDirection(0, 0)
    joystickKnobPos.value = { x: 0, y: 0 }
    return
  }

  const nx = dx / dist
  const ny = dy / dist
  game?.input.setTouchDirection(nx, ny)

  // Clamp knob position to radius
  const clampedDist = Math.min(dist, JOYSTICK_RADIUS)
  joystickKnobPos.value = {
    x: (dx / dist) * clampedDist,
    y: (dy / dist) * clampedDist,
  }
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
      currentStage.value = game.getCurrentStageNumber()
      hasWeapons.value = game.playerHasWeapons()
      if (game.state === 'victory') {
        victoryStats.value = game.getVictoryStats()
      }

      if (game.isHomeRequested()) {
        game.clearHomeRequest()
        game.stop()
        game = null
        router.push('/')
      }
    }
  }, 100)
})

// Watch for gameState changes to reset touch controls when game stops playing
watch(gameState, (newState) => {
  if (newState !== 'playing') {
    resetTouchState()
  }
})

onUnmounted(() => {
  resetTouchState()
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

      <div class="flex justify-center relative">
        <canvas
          ref="canvasRef"
          class="border border-border-default bg-black cursor-pointer touch-none"
          :width="CANVAS_WIDTH"
          :height="CANVAS_HEIGHT"
          @click="handleCanvasClick"
        />
        <!-- Pause Menu Overlay -->
        <div
          v-if="gameState === 'paused'"
          class="absolute inset-0 flex items-center justify-center bg-black/70 z-20 backdrop-blur-sm"
        >
          <div
            class="text-center space-y-6 bg-bg-surface border border-accent-coral/30 p-8 rounded-lg shadow-2xl max-w-sm w-full"
          >
            <h2 class="text-3xl font-display text-accent-coral tracking-wide">⏸ Tạm dừng</h2>
            <div class="flex flex-col gap-3">
              <button
                @click="onResume"
                class="bg-accent-coral text-white px-6 py-3 rounded font-bold hover:brightness-110 transition shadow-lg"
              >
                Tiếp tục
              </button>
              <button
                @click="onRestart"
                class="bg-bg-elevated text-text-primary px-6 py-3 rounded hover:bg-bg-highlight transition border border-border-default"
              >
                Chơi lại màn này
              </button>
              <button
                @click="onHome"
                class="text-text-secondary hover:text-text-primary transition py-2 text-sm"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>

        <!-- Game Over Overlay -->
        <div
          v-if="gameState === 'game_over'"
          class="absolute inset-0 flex items-center justify-center bg-black/85 z-20 animate-fade-in"
        >
          <div class="text-center space-y-4 max-w-md w-full p-6">
            <h2 class="text-5xl font-display text-red-500 mb-2 drop-shadow-lg">
              Trò Chơi Kết Thúc
            </h2>
            <p class="text-text-secondary text-lg">Link đã ngã xuống...</p>
            <div class="flex flex-col gap-4 mt-8">
              <button
                @click="onRestart"
                class="bg-red-600 text-white px-8 py-3 rounded text-lg font-bold hover:bg-red-500 transition shadow-red-900/50 shadow-lg"
              >
                Thử lại
              </button>
              <button @click="onHome" class="text-text-dim hover:text-text-primary transition">
                Về trang chủ
              </button>
            </div>
          </div>
        </div>

        <!-- Victory Overlay -->
        <div
          v-if="gameState === 'victory'"
          class="absolute inset-0 flex items-center justify-center bg-black/85 z-20 animate-fade-in"
        >
          <div
            class="text-center space-y-6 max-w-md w-full bg-bg-surface/10 p-8 rounded-xl backdrop-blur-md border border-accent-amber/30"
          >
            <h2 class="text-4xl font-display text-accent-amber mb-2 drop-shadow-gold">
              🏆 Chiến Thắng!
            </h2>
            <p class="text-xl text-accent-coral">Hyrule đã được cứu!</p>

            <div
              v-if="victoryStats"
              class="grid grid-cols-3 gap-4 text-center mt-6 bg-black/30 p-4 rounded-lg"
            >
              <div>
                <div class="text-2xl mb-1">⏱</div>
                <div class="text-text-primary font-mono text-lg">
                  {{ formatTime(victoryStats.totalTime) }}
                </div>
                <div class="text-text-dim text-xs uppercase tracking-wider mt-1">Thời gian</div>
              </div>
              <div>
                <div class="text-2xl mb-1">⚔</div>
                <div class="text-text-primary font-mono text-lg">
                  {{ victoryStats.enemiesDefeated }}
                </div>
                <div class="text-text-dim text-xs uppercase tracking-wider mt-1">Tiêu diệt</div>
              </div>
              <div>
                <div class="text-2xl mb-1">💔</div>
                <div class="text-text-primary font-mono text-lg">
                  {{ victoryStats.damageTaken }}
                </div>
                <div class="text-text-dim text-xs uppercase tracking-wider mt-1">Sát thương</div>
              </div>
            </div>

            <div class="flex flex-col gap-3 mt-8">
              <button
                @click="onFullRestart"
                class="bg-accent-amber text-black px-8 py-3 rounded text-lg font-bold hover:bg-yellow-400 transition shadow-lg"
              >
                Chơi lại
              </button>
              <button
                @click="onHome"
                class="text-text-secondary hover:text-text-primary transition border border-transparent hover:border-text-dim px-4 py-2 rounded"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>

        <!-- Joystick (bottom-left, over canvas) -->
        <div
          v-if="isTouchDevice && gameState === 'playing'"
          class="absolute bottom-4 left-4 w-32 h-32 rounded-full bg-black/40 flex items-center justify-center touch-none"
          @touchstart.prevent="onJoystickStart"
          @touchmove.prevent="onJoystickMove"
          @touchend.prevent="onJoystickEnd"
          @touchcancel.prevent="onJoystickEnd"
        >
          <!-- Inner knob -->
          <div
            class="absolute w-8 h-8 rounded-full bg-accent-coral/60 transition-all pointer-events-none"
            :style="{
              transform: `translate(${joystickKnobPos.x}px, ${joystickKnobPos.y}px) translate(-50%, -50%)`,
            }"
          />
        </div>

        <!-- Action buttons (bottom-right, over canvas) -->
        <div
          v-if="isTouchDevice && gameState === 'playing'"
          class="absolute bottom-4 right-4 flex flex-col gap-3 touch-none z-10 select-none"
        >
          <!-- If no weapons: show only Interact and Pause (horizontal) -->
          <template v-if="!hasWeapons">
            <div class="flex gap-3">
              <button
                class="w-16 h-16 rounded-full bg-black/40 text-2xl flex items-center justify-center active:bg-black/70 transition hover:bg-black/50"
                @touchstart.prevent="onTouchAction('interact', true)"
                @touchend.prevent="onTouchAction('interact', false)"
                @touchcancel.prevent="onTouchAction('interact', false)"
              >
                💬
              </button>
              <button
                class="w-16 h-16 rounded-full bg-black/40 text-2xl flex items-center justify-center active:bg-black/70 transition hover:bg-black/50"
                @touchstart.prevent="onTouchAction('pause', true)"
                @touchend.prevent="onTouchAction('pause', false)"
                @touchcancel.prevent="onTouchAction('pause', false)"
              >
                ⏸️
              </button>
            </div>
          </template>

          <!-- If has weapons: show Sword, Bow on top; Shield, Interact, Pause on bottom -->
          <template v-else>
            <!-- Top row: Sword, Bow -->
            <div class="flex gap-3 justify-end">
              <button
                class="w-16 h-16 rounded-full bg-black/40 text-2xl flex items-center justify-center active:bg-black/70 transition hover:bg-black/50"
                @touchstart.prevent="onTouchAction('attack', true)"
                @touchend.prevent="onTouchAction('attack', false)"
                @touchcancel.prevent="onTouchAction('attack', false)"
              >
                ⚔️
              </button>
              <button
                class="w-16 h-16 rounded-full bg-black/40 text-2xl flex items-center justify-center active:bg-black/70 transition hover:bg-black/50"
                @touchstart.prevent="onTouchAction('ranged', true)"
                @touchend.prevent="onTouchAction('ranged', false)"
                @touchcancel.prevent="onTouchAction('ranged', false)"
              >
                🏹
              </button>
            </div>

            <!-- Bottom row: Shield, Interact, Pause -->
            <div class="flex gap-3 justify-end">
              <button
                class="w-16 h-16 rounded-full bg-black/40 text-2xl flex items-center justify-center active:bg-black/70 transition hover:bg-black/50"
                @touchstart.prevent="onTouchAction('block', true)"
                @touchend.prevent="onTouchAction('block', false)"
                @touchcancel.prevent="onTouchAction('block', false)"
              >
                🛡️
              </button>
              <button
                class="w-16 h-16 rounded-full bg-black/40 text-2xl flex items-center justify-center active:bg-black/70 transition hover:bg-black/50"
                @touchstart.prevent="onTouchAction('interact', true)"
                @touchend.prevent="onTouchAction('interact', false)"
                @touchcancel.prevent="onTouchAction('interact', false)"
              >
                💬
              </button>
              <button
                class="w-16 h-16 rounded-full bg-black/40 text-2xl flex items-center justify-center active:bg-black/70 transition hover:bg-black/50"
                @touchstart.prevent="onTouchAction('pause', true)"
                @touchend.prevent="onTouchAction('pause', false)"
                @touchcancel.prevent="onTouchAction('pause', false)"
              >
                ⏸️
              </button>
            </div>
          </template>
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
