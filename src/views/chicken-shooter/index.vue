<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

interface Chicken {
  x: number
  y: number
  speed: number
  radius: number
  hit: boolean
  hitTimer: number
  emoji: string
  bobOffset: number
  isPenguin: boolean
}

const CHICKEN_EMOJIS = ['🐔', '🐓', '🐤', '🐥']

const canvasRef = ref<HTMLCanvasElement | null>(null)
const score = ref(0)
const timeLeft = ref(60)
const isGameOver = ref(false)
const isGameStarted = ref(false)
const isPaused = ref(false)
const isFrozen = ref(false)
const freezeTimeLeft = ref(0)

let chickens: Chicken[] = []
let animationId = 0
let lastSpawnTime = 0
let spawnInterval = 1000
let lastFrameTime = 0
let timerIntervalId = 0
let canvasWidth = 0
let canvasHeight = 0
let cachedCtx: CanvasRenderingContext2D | null = null
let bgGradient: CanvasGradient | null = null

const FREEZE_DURATION = 3000

const GAME_DURATION = 60
function getDifficulty(): number {
  const elapsed = GAME_DURATION - timeLeft.value
  const linear = Math.min(elapsed / GAME_DURATION, 1)
  return Math.pow(linear, 0.55)
}

function createChicken(): Chicken {
  const diff = getDifficulty()
  const radius = 24 + Math.random() * 12
  const fromLeft = Math.random() > 0.5

  const baseSpeed = 90 + diff * 90
  const speedRange = 150 + diff * 150
  const speed = (baseSpeed + Math.random() * speedRange) * (fromLeft ? 1 : -1)

  const isPenguin = Math.random() < 0.15

  return {
    x: fromLeft ? -radius : canvasWidth + radius,
    y: 60 + Math.random() * (canvasHeight - 120),
    speed: isPenguin ? speed * 0.7 : speed,
    radius: isPenguin ? 30 : radius,
    hit: false,
    hitTimer: 0,
    emoji: isPenguin
      ? '🐧'
      : (CHICKEN_EMOJIS[Math.floor(Math.random() * CHICKEN_EMOJIS.length)] ?? '🐔'),
    bobOffset: Math.random() * Math.PI * 2,
    isPenguin,
  }
}

function gameLoop(timestamp: number) {
  if (isGameOver.value || isPaused.value) return

  if (!canvasRef.value || !cachedCtx) return
  const ctx = cachedCtx

  const deltaTime = timestamp - lastFrameTime
  lastFrameTime = timestamp

  if (timestamp - lastSpawnTime > spawnInterval) {
    const diff = getDifficulty()

    const spawnCount = 1 + Math.floor(diff * 2 * Math.random())
    for (let s = 0; s < spawnCount; s++) {
      chickens.push(createChicken())
    }

    lastSpawnTime = timestamp
    const minInterval = 1000 - diff * 600
    const intervalRange = 1000 - diff * 600
    spawnInterval = minInterval + Math.random() * intervalRange
  }

  if (isFrozen.value) {
    freezeTimeLeft.value -= deltaTime
    if (freezeTimeLeft.value <= 0) {
      isFrozen.value = false
      freezeTimeLeft.value = 0
    }
  }

  const dt = deltaTime / 1000
  for (const chicken of chickens) {
    if (chicken.hit) {
      chicken.hitTimer -= deltaTime
    } else if (!isFrozen.value) {
      chicken.x += chicken.speed * dt
    }
  }

  chickens = chickens.filter((c) => {
    if (c.hit) return c.hitTimer > 0
    return c.x > -50 && c.x < canvasWidth + 50
  })

  draw(ctx, timestamp)

  animationId = requestAnimationFrame(gameLoop)
}

function draw(ctx: CanvasRenderingContext2D, timestamp: number) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  ctx.fillStyle = bgGradient || '#0c1520'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  drawStars(ctx)

  drawGround(ctx)

  for (const chicken of chickens) {
    ctx.save()

    if (chicken.hit) {
      const progress = 1 - chicken.hitTimer / 300
      const scale = 1 + progress * 1.5
      const alpha = 1 - progress

      ctx.globalAlpha = alpha
      ctx.translate(chicken.x, chicken.y)
      ctx.scale(scale, scale)
      ctx.font = `${chicken.radius * 2}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(chicken.isPenguin ? '❄️' : '💥', 0, 0)
    } else {
      const bob = Math.sin(timestamp / 200 + chicken.bobOffset) * 3
      ctx.translate(chicken.x, chicken.y + bob)

      if (chicken.speed < 0) {
        ctx.scale(-1, 1)
      }

      ctx.font = `${chicken.radius * 2}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(chicken.emoji, 0, 0)
    }

    ctx.restore()
  }

  if (isFrozen.value) {
    const freezeAlpha = Math.min(freezeTimeLeft.value / FREEZE_DURATION, 0.3)
    ctx.fillStyle = `rgba(56, 189, 248, ${freezeAlpha})`
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    const iceCount = 15
    ctx.font = '20px serif'
    ctx.textAlign = 'center'
    for (let i = 0; i < iceCount; i++) {
      const ix = (timestamp / 3 + i * 137) % canvasWidth
      const iy = (timestamp / 5 + i * 89) % canvasHeight
      ctx.globalAlpha = 0.4
      ctx.fillText('❄️', ix, iy)
    }
    ctx.globalAlpha = 1
  }
}

const stars: { x: number; y: number; size: number; alpha: number }[] = []
function initStars() {
  stars.length = 0
  const count = Math.floor((canvasWidth * canvasHeight) / 8000)
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight * 0.7,
      size: 0.5 + Math.random() * 1.5,
      alpha: 0.2 + Math.random() * 0.5,
    })
  }
}

function drawStars(ctx: CanvasRenderingContext2D) {
  for (const star of stars) {
    ctx.beginPath()
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(240, 237, 230, ${star.alpha})`
    ctx.fill()
  }
}

let grassHeights: number[] = []
function initGrass() {
  grassHeights = []
  for (let x = 0; x < canvasWidth; x += 8) {
    grassHeights.push(4 + Math.random() * 8)
  }
}

function drawGround(ctx: CanvasRenderingContext2D) {
  const groundY = canvasHeight - 50
  const groundGradient = ctx.createLinearGradient(0, groundY, 0, canvasHeight)
  groundGradient.addColorStop(0, '#1a3a28')
  groundGradient.addColorStop(1, '#0f2318')
  ctx.fillStyle = groundGradient
  ctx.fillRect(0, groundY, canvasWidth, 50)

  ctx.strokeStyle = '#2a5a3a'
  ctx.lineWidth = 1
  for (let i = 0; i < grassHeights.length; i++) {
    const x = i * 8
    ctx.beginPath()
    ctx.moveTo(x, groundY)
    ctx.lineTo(x + 2, groundY - (grassHeights[i] ?? 6))
    ctx.stroke()
  }
}

function handleCanvasClick(event: MouseEvent) {
  if (isGameOver.value || !isGameStarted.value || isPaused.value || isFrozen.value) return

  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const clickX = (event.clientX - rect.left) * scaleX
  const clickY = (event.clientY - rect.top) * scaleY

  for (let i = chickens.length - 1; i >= 0; i--) {
    const chicken = chickens[i]
    if (!chicken || chicken.hit) continue

    const dx = clickX - chicken.x
    const dy = clickY - chicken.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < chicken.radius * 1.3) {
      chicken.hit = true
      chicken.hitTimer = 300
      score.value += 1

      if (chicken.isPenguin) {
        isFrozen.value = true
        freezeTimeLeft.value = FREEZE_DURATION
      }

      break
    }
  }
}

function handleCanvasTouch(event: TouchEvent) {
  event.preventDefault()
  if (isGameOver.value || !isGameStarted.value || isPaused.value || isFrozen.value) return

  const canvas = canvasRef.value
  if (!canvas) return

  const touch = event.touches[0]
  if (!touch) return

  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const clickX = (touch.clientX - rect.left) * scaleX
  const clickY = (touch.clientY - rect.top) * scaleY

  for (let i = chickens.length - 1; i >= 0; i--) {
    const chicken = chickens[i]
    if (!chicken || chicken.hit) continue

    const dx = clickX - chicken.x
    const dy = clickY - chicken.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < chicken.radius * 1.3) {
      chicken.hit = true
      chicken.hitTimer = 300
      score.value += 1

      if (chicken.isPenguin) {
        isFrozen.value = true
        freezeTimeLeft.value = FREEZE_DURATION
      }

      break
    }
  }
}

function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  canvasWidth = window.innerWidth
  canvasHeight = window.innerHeight
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  cachedCtx = canvas.getContext('2d')
  if (cachedCtx) {
    bgGradient = cachedCtx.createLinearGradient(0, 0, 0, canvasHeight)
    bgGradient.addColorStop(0, '#0c1520')
    bgGradient.addColorStop(1, '#162232')
  }

  initStars()
  initGrass()
}

function startTimer() {
  timerIntervalId = window.setInterval(() => {
    if (isPaused.value) return
    timeLeft.value -= 1
    if (timeLeft.value <= 0) {
      timeLeft.value = 0
      endGame()
    }
  }, 1000)
}

function togglePause() {
  if (isGameOver.value || !isGameStarted.value) return

  isPaused.value = !isPaused.value

  if (!isPaused.value) {
    lastFrameTime = performance.now()
    animationId = requestAnimationFrame(gameLoop)
  } else {
    cancelAnimationFrame(animationId)
  }
}

function quitGame() {
  cancelAnimationFrame(animationId)
  clearInterval(timerIntervalId)
  router.push('/')
}

function endGame() {
  isGameOver.value = true
  cancelAnimationFrame(animationId)
  clearInterval(timerIntervalId)
}

function startGame() {
  score.value = 0
  timeLeft.value = 60
  isGameOver.value = false
  isGameStarted.value = true
  isPaused.value = false
  isFrozen.value = false
  freezeTimeLeft.value = 0
  chickens = []
  lastSpawnTime = 0
  spawnInterval = 1000

  resizeCanvas()
  startTimer()
  lastFrameTime = performance.now()
  animationId = requestAnimationFrame(gameLoop)
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
    if (isGameStarted.value && !isGameOver.value) {
      togglePause()
    }
  }
}

onMounted(() => {
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  clearInterval(timerIntervalId)
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div
    class="bg-bg-deep text-text-primary font-body overflow-hidden"
    style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 50"
  >
    <canvas
      ref="canvasRef"
      class="cursor-crosshair block"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%"
      @click="handleCanvasClick"
      @touchstart="handleCanvasTouch"
    />

    <button
      v-if="isGameStarted && !isGameOver && !isPaused"
      class="flex items-center gap-2 bg-bg-surface/80 backdrop-blur-sm border border-border-default px-4 py-2 font-display font-bold text-lg text-text-secondary transition hover:border-accent-coral hover:text-text-primary cursor-pointer"
      style="position: fixed; top: 16px; right: 16px; z-index: 60"
      @click.stop="togglePause"
    >
      ⏸ Tạm dừng
    </button>

    <div
      v-if="isGameStarted && !isPaused"
      class="flex items-center gap-2 bg-bg-surface/80 backdrop-blur-sm border border-border-default px-4 py-2"
      style="position: fixed; top: 16px; left: 16px; z-index: 60"
    >
      <span class="text-accent-amber font-display font-bold text-lg">🎯</span>
      <span class="font-display font-semibold text-lg text-text-primary">{{ score }}</span>
    </div>

    <div
      v-if="isGameStarted && !isPaused"
      class="flex items-center gap-2 bg-bg-surface/80 backdrop-blur-sm border px-5 py-2"
      :class="timeLeft <= 10 ? 'border-accent-coral' : 'border-border-default'"
      style="position: fixed; top: 16px; left: 50%; transform: translateX(-50%); z-index: 60"
    >
      <span class="text-accent-coral font-display font-bold text-lg">⏱</span>
      <span
        class="font-display font-semibold text-lg"
        :class="timeLeft <= 10 ? 'text-accent-coral' : 'text-text-primary'"
      >
        {{ formatTime(timeLeft) }}
      </span>
    </div>

    <div
      v-if="isFrozen && isGameStarted && !isPaused && !isGameOver"
      class="flex items-center gap-2 bg-accent-sky/20 backdrop-blur-sm border border-accent-sky px-5 py-2"
      style="position: fixed; top: 60px; left: 50%; transform: translateX(-50%); z-index: 60"
    >
      <span class="font-display font-bold text-lg text-accent-sky">❄️ ĐÓNG BĂNG!</span>
    </div>

    <div
      v-if="!isGameStarted"
      class="flex flex-col items-center justify-center bg-bg-deep/90 backdrop-blur-sm px-4"
      style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 70"
    >
      <button
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary animate-fade-up"
        style="position: absolute; top: 16px; left: 16px"
        @click="quitGame"
      >
        &larr; Về trang chủ
      </button>

      <h1
        class="font-display text-5xl sm:text-6xl md:text-7xl font-bold text-accent-coral mb-3 text-center animate-fade-up"
      >
        Chicken 🐔 Shooter
      </h1>
      <p
        class="text-text-secondary text-base sm:text-lg mb-8 text-center animate-fade-up animate-delay-1"
      >
        Bắn gà để ghi điểm! Bạn có 60 giây.
      </p>

      <button
        class="px-10 py-4 bg-accent-coral text-bg-deep font-display font-bold text-xl tracking-wide transition hover:scale-105 hover:shadow-lg hover:shadow-accent-coral/30 animate-fade-up animate-delay-2 cursor-pointer"
        @click="startGame"
      >
        🎮 Bắt đầu chơi
      </button>

      <div
        class="mt-8 max-w-[500px] w-full bg-bg-surface border border-border-default p-5 animate-fade-up animate-delay-3"
      >
        <h2
          class="font-display text-lg font-semibold text-text-primary mb-3 flex items-center gap-2"
        >
          <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
          Hướng dẫn
        </h2>
        <ul class="space-y-2 text-text-secondary text-sm">
          <li class="flex items-start gap-2">
            <span class="text-accent-coral">▸</span>
            Click / chạm vào gà để bắn và ghi điểm
          </li>
          <li class="flex items-start gap-2">
            <span class="text-accent-coral">▸</span>
            Gà xuất hiện ngẫu nhiên và bay qua màn hình
          </li>
          <li class="flex items-start gap-2">
            <span class="text-accent-coral">▸</span>
            Bạn có 60 giây — bắn càng nhiều càng tốt!
          </li>
          <li class="flex items-start gap-2">
            <span class="text-accent-coral">▸</span>
            Nhấn
            <kbd class="bg-bg-elevated px-1.5 py-0.5 text-xs border border-border-default">Esc</kbd>
            hoặc
            <kbd class="bg-bg-elevated px-1.5 py-0.5 text-xs border border-border-default">P</kbd>
            để tạm dừng
          </li>
          <li class="flex items-start gap-2 uppercase">
            <span class="text-accent-coral">▸</span>
            Lưu ý: Đừng bắn vào chim cánh cụt 🐧
          </li>
        </ul>
      </div>

      <p
        class="mt-6 text-text-dim text-xs font-display tracking-wide animate-fade-up animate-delay-4"
      >
        Made with ❤️ by
        <a
          href="https://github.com/pkucpkam"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-accent-coral transition-colors"
          >pkucpkam</a
        >
      </p>
    </div>

    <div
      v-if="isPaused && !isGameOver"
      class="flex flex-col items-center justify-center bg-bg-deep/85 backdrop-blur-sm"
      style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 70"
    >
      <h2
        class="font-display text-4xl sm:text-5xl font-bold text-accent-amber mb-2 animate-fade-up"
      >
        ⏸ Tạm dừng
      </h2>
      <p class="text-text-secondary text-base mb-8 animate-fade-up animate-delay-1">
        Điểm hiện tại: <span class="text-accent-coral font-display font-bold">{{ score }}</span>
      </p>

      <div class="flex flex-col sm:flex-row gap-4 animate-fade-up animate-delay-2">
        <button
          class="px-8 py-3 bg-accent-coral text-bg-deep font-display font-bold text-lg tracking-wide transition hover:scale-105 hover:shadow-lg hover:shadow-accent-coral/30 cursor-pointer"
          @click="togglePause"
        >
          ▶ Tiếp tục
        </button>

        <button
          class="px-8 py-3 border border-border-default bg-bg-surface text-text-secondary font-display font-bold text-lg tracking-wide transition hover:border-accent-coral hover:text-text-primary cursor-pointer"
          @click="quitGame"
        >
          🏠 Về trang chủ
        </button>
      </div>
    </div>

    <div
      v-if="isGameOver"
      class="flex flex-col items-center justify-center bg-bg-deep/85 backdrop-blur-sm"
      style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 70"
    >
      <h2
        class="font-display text-5xl sm:text-6xl font-bold text-accent-coral mb-4 animate-fade-up"
      >
        GAME OVER
      </h2>

      <div
        class="bg-bg-surface border border-accent-coral p-6 sm:p-8 text-center mb-6 animate-fade-up animate-delay-1"
      >
        <p class="text-text-secondary text-sm mb-1">Kết quả</p>
        <p class="font-display text-5xl sm:text-6xl font-bold text-accent-amber">{{ score }}</p>
        <p class="text-text-secondary text-sm mt-1">điểm</p>
      </div>

      <div class="flex flex-col sm:flex-row gap-4 animate-fade-up animate-delay-2">
        <button
          class="px-8 py-3 bg-accent-coral text-bg-deep font-display font-bold text-lg tracking-wide transition hover:scale-105 hover:shadow-lg hover:shadow-accent-coral/30"
          @click="startGame"
        >
          🔄 Chơi lại
        </button>

        <button
          class="px-8 py-3 border border-border-default bg-bg-surface text-text-secondary font-display font-bold text-lg tracking-wide transition hover:border-accent-coral hover:text-text-primary"
          @click="quitGame"
        >
          🏠 Về trang chủ
        </button>
      </div>
    </div>
  </div>
</template>
