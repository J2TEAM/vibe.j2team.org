<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useIntervalFn, useEventListener, useLocalStorage, useWindowSize } from '@vueuse/core'
import { Icon } from '@iconify/vue'

const dinoLogo = '/j2-bird/logo.png'

const { width: windowWidth } = useWindowSize()

// Game constants
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 200
const GRAVITY = 0.6
const JUMP_FORCE = -12
const INITIAL_SPEED = 6
const SPEED_INCREMENT = 0.001
const SPAWN_INTERVAL_MIN = 1000
const SPAWN_INTERVAL_MAX = 2000

// Refs
const canvasRef = ref<HTMLCanvasElement | null>(null)
const gameState = ref<'idle' | 'playing' | 'gameover'>('idle')
const score = ref(0)
const highScore = useLocalStorage('dino-high-score', 0)
const currentSpeed = ref(INITIAL_SPEED)
const isNight = ref(false)
const isMuted = useLocalStorage('dino-muted', false)

// Dino image
const dinoImg = new Image()
dinoImg.src = dinoLogo
const isDinoImgLoaded = ref(false)
dinoImg.onload = () => {
  isDinoImgLoaded.value = true
  draw()
}

watch(isDinoImgLoaded, () => {
  draw()
})

// Audio logic
let audioCtx: AudioContext | null = null

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )()
  }
}

const playBeep = (freq: number, type: OscillatorType, duration: number, volume: number = 0.1) => {
  if (isMuted.value || !audioCtx) return
  try {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime)
    gain.gain.setValueAtTime(volume, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start()
    osc.stop(audioCtx.currentTime + duration)
  } catch (e) {
    console.warn('Audio play failed', e)
  }
}

const playJumpSound = () => playBeep(440, 'square', 0.1)
const playHitSound = () => playBeep(110, 'sawtooth', 0.3, 0.2)
const playScoreSound = () => {
  playBeep(880, 'square', 0.1)
  setTimeout(() => playBeep(880, 'square', 0.1), 100)
}

// Dino state
interface Dino {
  x: number
  y: number
  width: number
  height: number
  vy: number
  isJumping: boolean
}

// Background state
interface Particle {
  x: number
  y: number
  speed: number
  size: number
}
const particles = ref<Particle[]>([])

const dino = ref<Dino>({
  x: 50,
  y: CANVAS_HEIGHT - 44,
  width: 44, // Sized for the logo
  height: 44,
  vy: 0,
  isJumping: false,
})

// Obstacle state
interface Obstacle {
  x: number
  y: number
  width: number
  height: number
  type: 'small' | 'large' | 'multiple'
}

const obstacles = ref<Obstacle[]>([])
let nextSpawnTime = 0

// Game Loop
const update = () => {
  if (gameState.value !== 'playing') return

  // Update Dino
  dino.value.vy += GRAVITY
  dino.value.y += dino.value.vy

  if (dino.value.y > CANVAS_HEIGHT - dino.value.height - 5) {
    dino.value.y = CANVAS_HEIGHT - dino.value.height - 5
    dino.value.vy = 0
    dino.value.isJumping = false
  }

  // Update Obstacles
  currentSpeed.value += SPEED_INCREMENT
  obstacles.value.forEach((obs) => {
    obs.x -= currentSpeed.value
  })

  // Remove off-screen obstacles
  obstacles.value = obstacles.value.filter((obs) => obs.x + obs.width > 0)

  // Spawn obstacles
  const now = Date.now()
  if (now > nextSpawnTime) {
    spawnObstacle()
    nextSpawnTime =
      now +
      Math.random() * (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN) +
      SPAWN_INTERVAL_MIN / (currentSpeed.value / INITIAL_SPEED)
  }

  // Check collision
  for (const obs of obstacles.value) {
    // Tighter collision for Dino logo
    const padding = 10
    if (
      dino.value.x + padding < obs.x + obs.width &&
      dino.value.x + dino.value.width - padding > obs.x &&
      dino.value.y + padding < obs.y + obs.height &&
      dino.value.y + dino.value.height - padding > obs.y
    ) {
      gameOver()
      break
    }
  }

  // Update Particles (Clouds)
  particles.value.forEach((p) => {
    p.x -= p.speed * (currentSpeed.value / INITIAL_SPEED)
  })
  particles.value = particles.value.filter((p) => p.x + p.size > 0)
  if (Math.random() < 0.015) spawnParticle()

  // Update Score
  score.value += 1
  if (score.value > 0 && score.value % 100 === 0) {
    playScoreSound()
  }

  draw()
}

const spawnObstacle = () => {
  const type = Math.random() > 0.6 ? 'large' : Math.random() > 0.3 ? 'small' : 'multiple'
  let width = 20
  let height = 40

  if (type === 'small') {
    width = 15
    height = 30
  } else if (type === 'multiple') {
    width = 40
    height = 35
  }

  obstacles.value.push({
    x: CANVAS_WIDTH,
    y: CANVAS_HEIGHT - height - 5,
    width,
    height,
    type,
  })
}

const spawnParticle = () => {
  particles.value.push({
    x: CANVAS_WIDTH,
    y: Math.random() * (CANVAS_HEIGHT - 80) + 20,
    speed: 0.5 + Math.random(),
    size: 30 + Math.random() * 20,
  })
}

const draw = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Clear
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  const themeColor = '#CE3E27'

  // Draw Particles
  ctx.fillStyle = '#f1f1f1'
  particles.value.forEach((p) => {
    ctx.fillRect(p.x, p.y, p.size, 5)
    ctx.fillRect(p.x + 5, p.y - 5, p.size - 10, 15)
  })

  // Draw Ground
  ctx.strokeStyle = themeColor
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, CANVAS_HEIGHT - 5)
  ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 5)
  ctx.stroke()

  // Ground dots
  ctx.fillStyle = themeColor
  for (let i = 0; i < CANVAS_WIDTH; i += 40) {
    const offset = Math.sin(i + currentSpeed.value * 0.1) * 10
    ctx.fillRect(i + offset, CANVAS_HEIGHT - 3, 2, 1)
  }

  // Draw Dino (Image or fallback)
  if (isDinoImgLoaded.value) {
    ctx.drawImage(dinoImg, dino.value.x, dino.value.y, dino.value.width, dino.value.height)
  } else {
    ctx.fillStyle = themeColor
    ctx.fillRect(dino.value.x, dino.value.y + 10, dino.value.width, dino.value.height - 10)
    ctx.fillRect(dino.value.x + 15, dino.value.y, 15, 15)
  }

  // Draw Obstacles
  ctx.fillStyle = '#CE3E27'
  obstacles.value.forEach((obs) => {
    if (obs.type === 'multiple') {
      ctx.fillRect(obs.x, obs.y, obs.width / 2.5, obs.height)
      ctx.fillRect(obs.x + obs.width / 2, obs.y + 5, obs.width / 2.5, obs.height - 5)
    } else {
      ctx.fillRect(obs.x + obs.width / 4, obs.y, obs.width / 2, obs.height)
      ctx.fillRect(obs.x, obs.y + obs.height / 3, obs.width, obs.height / 4)
    }
  })
}

const jump = () => {
  initAudio()
  if (gameState.value === 'idle' || gameState.value === 'gameover') {
    startGame()
    return
  }
  if (!dino.value.isJumping) {
    dino.value.vy = JUMP_FORCE
    dino.value.isJumping = true
    playJumpSound()
  }
}

const startGame = () => {
  gameState.value = 'playing'
  score.value = 0
  currentSpeed.value = INITIAL_SPEED
  obstacles.value = []
  particles.value = []
  dino.value.y = CANVAS_HEIGHT - dino.value.height - 5
  dino.value.vy = 0
  isNight.value = false
  nextSpawnTime = Date.now() + 1000
}

const gameOver = () => {
  gameState.value = 'gameover'
  playHitSound()
  if (score.value > highScore.value) {
    highScore.value = score.value
  }
}

// Controls
useEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault()
    jump()
  }
})

// Frame Loop
useIntervalFn(() => {
  update()
}, 16)

onMounted(() => {
  draw()
})

// Handle window resizing or canvas visibility
const canvasStyle = computed(() => {
  const scale = Math.min(1, (windowWidth.value - 40) / CANVAS_WIDTH)
  return {
    transform: `scale(${scale})`,
    transformOrigin: 'center top',
  }
})
</script>

<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center p-4 transition-colors duration-500 font-mono bg-[#f7f7f7]"
  >
    <!-- Header -->
    <div class="mb-12 text-center">
      <h1 class="text-2xl font-bold tracking-[0.2em] uppercase text-[#CE3E27]">J2 Dinosaur</h1>
    </div>

    <!-- Game Container -->
    <div
      class="relative w-full max-w-[800px] overflow-hidden"
      @mousedown="jump"
      @touchstart.prevent="jump"
    >
      <!-- Score Board -->
      <div class="mb-2 flex justify-end gap-4 px-2 text-sm tabular-nums text-[#CE3E27]">
        <div class="opacity-50">
          HI <span class="font-bold">{{ String(highScore).padStart(5, '0') }}</span>
        </div>
        <div>
          <span class="font-bold">{{ String(score).padStart(5, '0') }}</span>
        </div>
      </div>

      <div class="relative h-[200px]" :style="canvasStyle">
        <canvas
          ref="canvasRef"
          :width="CANVAS_WIDTH"
          :height="CANVAS_HEIGHT"
          class="block mx-auto"
        ></canvas>

        <!-- Overlays -->
        <div
          v-if="gameState === 'idle'"
          class="absolute inset-0 flex flex-col items-center justify-center text-[#CE3E27]"
        >
          <div
            class="mb-4 size-12 border-4 border-current border-t-transparent rounded-full animate-spin"
          ></div>
          <p class="text-xs font-bold tracking-widest">PRESS SPACE TO START</p>
        </div>

        <div
          v-if="gameState === 'gameover'"
          class="absolute inset-0 flex flex-col items-center justify-center bg-white/10 backdrop-blur-[2px]"
        >
          <div class="mb-4 flex flex-col items-center gap-2">
            <Icon
              icon="lucide:rotate-ccw"
              class="size-12 cursor-pointer transition-transform hover:rotate-180 active:scale-90 text-[#CE3E27]"
              @click.stop="startGame"
            />
            <span class="text-xs font-bold tracking-tighter text-[#CE3E27]">GAME OVER</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="mt-12 flex flex-col items-center gap-6">
      <button
        class="flex size-14 items-center justify-center rounded-full transition-colors hover:bg-black/5 text-[#CE3E27]"
        @click="isMuted = !isMuted"
      >
        <Icon :icon="isMuted ? 'lucide:volume-x' : 'lucide:volume-2'" class="size-6" />
      </button>

      <div class="flex gap-4 text-[10px] uppercase tracking-widest opacity-40 text-[#CE3E27]">
        <div class="flex items-center gap-2">
          <kbd class="rounded border border-current px-1.5 py-0.5">Space</kbd>
          <span>Jump</span>
        </div>
        <div class="flex items-center gap-2">
          <kbd class="rounded border border-current px-1.5 py-0.5">Tap</kbd>
          <span>Jump</span>
        </div>
      </div>
    </div>

    <!-- Author Branding -->
    <div class="mt-auto py-12 text-center text-[#CE3E27]">
      <p class="text-[10px] font-medium tracking-[0.3em] uppercase mb-1">Designed by mtdes23</p>
      <a
        href="https://www.mtdes23.id.vn"
        target="_blank"
        rel="noopener noreferrer"
        class="text-[10px] hover:underline"
      >
        www.mtdes23.id.vn
      </a>
    </div>

    <!-- Back to home -->
    <RouterLink
      to="/"
      class="fixed bottom-4 left-4 flex items-center gap-2 rounded-full border border-current px-4 py-2 text-xs transition-colors hover:bg-black/5 text-[#CE3E27]"
    >
      <Icon icon="lucide:chevron-left" />
      <span>TRANG CHỦ</span>
    </RouterLink>
  </div>
</template>

<style scoped>
canvas {
  image-rendering: pixelated;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 2s linear infinite;
}
</style>
