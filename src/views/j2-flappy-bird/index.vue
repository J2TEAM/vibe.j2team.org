<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useStorage } from '@vueuse/core'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const bestScore = useStorage('j2-flappy-best-score', 0)
const currentScore = ref(0)
const gameState = ref<'START' | 'PLAYING' | 'GAMEOVER'>('START')

let ctx: CanvasRenderingContext2D | null = null
let animationId = 0

// Game constants
const CANVAS_WIDTH = 400
const CANVAS_HEIGHT = 600
const GRAVITY = 0.35
const JUMP = -7
const PIPE_SPEED = 2.5
const PIPE_SPAWN_FRAMES = 100
const PIPE_WIDTH = 56
const BIRD_RADIUS = 14
const GAP = 160

// Entities
let bird = { x: 80, y: CANVAS_HEIGHT / 2, velocity: 0 }
let pipes: { x: number; topHeight: number; passed: boolean }[] = []
let frames = 0
let groundX = 0

// Stars Background
const stars = Array.from({ length: 30 }).map(() => ({
  x: Math.random() * CANVAS_WIDTH,
  y: Math.random() * (CANVAS_HEIGHT - 40),
  size: Math.random() * 2 + 1,
  speed: Math.random() * 0.5 + 0.1,
}))

function resetGame() {
  bird = { x: 80, y: CANVAS_HEIGHT / 2, velocity: 0 }
  pipes = []
  frames = 0
  groundX = 0
  currentScore.value = 0
  gameState.value = 'START'
  draw()
}

function startGame() {
  resetGame()
  gameState.value = 'PLAYING'
  bird.velocity = JUMP
  gameLoop()
}

function gameOver() {
  gameState.value = 'GAMEOVER'
  if (currentScore.value > bestScore.value) {
    bestScore.value = currentScore.value
  }
}

function jump() {
  if (gameState.value === 'PLAYING') {
    bird.velocity = JUMP
  } else if (gameState.value === 'START' || gameState.value === 'GAMEOVER') {
    startGame()
  }
}

function draw() {
  if (!ctx) return

  // 1. Draw Background (Night Sky)
  ctx.fillStyle = '#0f172a' // slate-900 equivalent
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Draw Stars
  ctx.fillStyle = '#f8fafc' // slate-50
  stars.forEach((star) => {
    ctx!.fillRect(star.x, star.y, star.size, star.size)
  })

  // 2. Draw Pipes
  pipes.forEach((p) => {
    // Pipe Body Gradient
    const pipeGradient = ctx!.createLinearGradient(p.x, 0, p.x + PIPE_WIDTH, 0)
    pipeGradient.addColorStop(0, '#10B981') // emerald-500
    pipeGradient.addColorStop(1, '#047857') // emerald-700

    ctx!.fillStyle = pipeGradient

    // Top pipe
    ctx!.fillRect(p.x, 0, PIPE_WIDTH, p.topHeight)
    // Top pipe cap
    ctx!.fillRect(p.x - 2, p.topHeight - 20, PIPE_WIDTH + 4, 20)

    // Bottom pipe
    const bottomY = p.topHeight + GAP
    ctx!.fillRect(p.x, bottomY, PIPE_WIDTH, CANVAS_HEIGHT - bottomY)
    // Bottom pipe cap
    ctx!.fillRect(p.x - 2, bottomY, PIPE_WIDTH + 4, 20)
  })

  // 3. Draw Ground
  ctx.fillStyle = '#374151' // gray-700
  ctx.fillRect(0, CANVAS_HEIGHT - 40, CANVAS_WIDTH, 40)

  // Ground stripes for movement effect
  ctx.fillStyle = '#4B5563' // gray-600
  for (let i = 0; i < CANVAS_WIDTH + 40; i += 40) {
    ctx.fillRect(i - groundX, CANVAS_HEIGHT - 40, 20, 40)
  }

  // Ground Top Border
  ctx.fillStyle = '#10B981' // emerald-500
  ctx.fillRect(0, CANVAS_HEIGHT - 40, CANVAS_WIDTH, 5)

  // 4. Draw Bird
  ctx.save()
  ctx.translate(bird.x, bird.y)

  // Rotation based on velocity
  let rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, bird.velocity * 0.1))
  if (gameState.value === 'START') rotation = 0 // Flat when starting
  ctx.rotate(rotation)

  // Bird Body
  ctx.fillStyle = '#FBBF24' // amber-400
  ctx.beginPath()
  ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2)
  ctx.fill()

  // Bird Eye White
  ctx.fillStyle = '#FFF'
  ctx.beginPath()
  ctx.arc(6, -4, 5, 0, Math.PI * 2)
  ctx.fill()

  // Bird Eye Pupil
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.arc(7, -4, 2, 0, Math.PI * 2)
  ctx.fill()

  // Lips/Beak
  ctx.fillStyle = '#EF4444' // red-500
  ctx.beginPath()
  ctx.ellipse(10, 4, 8, 4, Math.PI / 6, 0, Math.PI * 2)
  ctx.fill()

  // Wing
  ctx.fillStyle = '#F59E0B' // amber-500
  ctx.beginPath()
  const wingOffset = gameState.value === 'PLAYING' && frames % 20 < 10 ? -3 : 2
  ctx.ellipse(-4, wingOffset, 7, 4, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

function gameLoop() {
  if (gameState.value !== 'PLAYING') return

  ctx = canvasRef.value?.getContext('2d') || null
  if (!ctx) return

  frames++

  // Update Stars
  stars.forEach((star) => {
    star.x -= star.speed
    if (star.x < 0) {
      star.x = CANVAS_WIDTH
      star.y = Math.random() * (CANVAS_HEIGHT - 40)
    }
  })

  // Update Ground scrolling
  groundX = (groundX + PIPE_SPEED) % 40

  // Update Bird Physics
  bird.velocity += GRAVITY
  bird.y += bird.velocity

  // Pipe spawn
  if (frames % PIPE_SPAWN_FRAMES === 0) {
    const minHeight = 60
    const maxHeight = CANVAS_HEIGHT - 40 - GAP - minHeight
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight)
    pipes.push({ x: CANVAS_WIDTH, topHeight, passed: false })
  }

  // Update Pipes and Collision
  pipes.forEach((p) => {
    p.x -= PIPE_SPEED

    // AABB Collision detection
    // Let's create a bounding box for the bird slightly smaller than its radius to be forgiving
    const collisionBox = BIRD_RADIUS - 3

    const hitTop =
      bird.x + collisionBox > p.x &&
      bird.x - collisionBox < p.x + PIPE_WIDTH &&
      bird.y - collisionBox < p.topHeight

    const hitBottom =
      bird.x + collisionBox > p.x &&
      bird.x - collisionBox < p.x + PIPE_WIDTH &&
      bird.y + collisionBox > p.topHeight + GAP

    if (hitTop || hitBottom) {
      gameOver()
    }

    // Scoring
    if (p.x + PIPE_WIDTH < bird.x && !p.passed) {
      currentScore.value++
      p.passed = true
    }
  })

  // Ground / ceiling collision
  if (bird.y + BIRD_RADIUS > CANVAS_HEIGHT - 40 || bird.y - BIRD_RADIUS < 0) {
    gameOver()
  }

  // Remove offscreen pipes
  if (pipes.length > 0 && pipes[0] && pipes[0].x < -PIPE_WIDTH) {
    pipes.shift()
  }

  draw()

  if (gameState.value === 'PLAYING') {
    animationId = requestAnimationFrame(gameLoop)
  }
}

// Controls
function handleKeydown(e: KeyboardEvent) {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault() // Prevent page scrolling
    jump()
  }
}

function handleCanvasClick(e: MouseEvent | TouchEvent) {
  e.preventDefault()
  jump()
}

onMounted(() => {
  ctx = canvasRef.value?.getContext('2d') || null
  window.addEventListener('keydown', handleKeydown)

  // Initial draw needs a tiny timeout for canvas to mount completely with styles
  setTimeout(() => {
    resetGame()
  }, 50)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep p-6 text-text-primary font-body overflow-hidden">
    <div class="mx-auto max-w-4xl space-y-8 animate-fade-up">
      <!-- Navigation -->
      <nav class="flex items-center">
        <RouterLink
          to="/"
          class="group flex w-fit items-center gap-2 rounded-xl bg-bg-surface px-4 py-2 text-sm font-medium text-text-secondary ring-1 ring-border-default transition-all hover:bg-bg-elevated hover:text-white"
        >
          <Icon
            icon="lucide:arrow-left"
            class="size-4 transition-transform group-hover:-translate-x-1"
          />
          <span>Về trang chủ</span>
        </RouterLink>
      </nav>

      <!-- Header -->
      <header class="flex flex-col items-center gap-4 text-center">
        <div
          class="flex size-16 items-center justify-center rounded-2xl bg-bg-surface shadow-[0_4px_16px_rgba(251,191,36,0.15)] ring-1 ring-border-default/50"
        >
          <Icon icon="lucide:bird" class="size-8 text-accent-amber" />
        </div>
        <div class="space-y-2">
          <h1
            class="font-display text-4xl font-bold md:text-5xl tracking-tight text-white drop-shadow-sm"
          >
            J2 Flappy Bird
          </h1>
          <p class="text-text-secondary">Trò chơi Flappy Bird huyền thoại.</p>
        </div>
      </header>

      <!-- Main Game Content -->
      <main class="relative grid gap-6 place-items-center">
        <div class="flex gap-6 w-full max-w-[400px] mb-2 justify-between px-2">
          <div class="flex flex-col">
            <span class="text-xs text-text-secondary font-display uppercase tracking-wider"
              >Điểm số</span
            >
            <span class="font-display text-2xl font-bold text-accent-amber tabular-nums">{{
              currentScore
            }}</span>
          </div>
          <div class="flex flex-col text-right">
            <span class="text-xs text-text-secondary font-display uppercase tracking-wider"
              >Điểm cao</span
            >
            <span class="font-display text-2xl font-bold text-emerald-400 tabular-nums">{{
              bestScore
            }}</span>
          </div>
        </div>

        <!-- Game Container -->
        <div
          class="relative rounded-2xl overflow-hidden shadow-xl ring-1 ring-border-default/50 touch-none select-none"
        >
          <canvas
            ref="canvasRef"
            :width="CANVAS_WIDTH"
            :height="CANVAS_HEIGHT"
            class="block bg-bg-deep cursor-pointer"
            @touchstart="handleCanvasClick"
            @mousedown="handleCanvasClick"
          ></canvas>

          <!-- UI Overlays -->
          <div
            v-if="gameState === 'START'"
            class="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none"
          >
            <Icon icon="lucide:bird" class="size-16 text-white mb-4 animate-bounce" />
            <h2 class="text-2xl font-display font-bold text-white mb-2">Sẵn sàng bay!</h2>
            <p class="text-text-secondary text-sm">Nhấn phím Space hoặc Chạm màn hình để nhảy</p>
          </div>

          <div
            v-if="gameState === 'GAMEOVER'"
            class="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center pointer-events-none"
          >
            <div
              class="bg-bg-surface p-6 rounded-2xl shadow-2xl ring-1 ring-border-default text-center animate-fade-up"
            >
              <h2 class="text-3xl font-display font-bold text-accent-coral mb-2">Game Over!</h2>
              <div class="flex justify-around gap-8 my-6">
                <div>
                  <p class="text-xs text-text-secondary uppercase">Điểm</p>
                  <p class="text-3xl font-bold text-white">{{ currentScore }}</p>
                </div>
                <div>
                  <p class="text-xs text-text-secondary uppercase">Kỷ lục</p>
                  <p class="text-3xl font-bold text-emerald-400">{{ bestScore }}</p>
                </div>
              </div>
              <p class="text-text-secondary text-sm mt-2">
                Nhấn phím Space hoặc Chạm màn hình để chơi lại
              </p>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="mt-8 text-center text-sm text-text-secondary pb-8">
        <p>Designed by mtdes23</p>
        <a
          href="https://www.mtdes23.id.vn"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-accent-amber transition-colors"
          >www.mtdes23.id.vn</a
        >
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* Prevent scrolling on mobile when tapping the canvas */
canvas {
  touch-action: none;
}
</style>
