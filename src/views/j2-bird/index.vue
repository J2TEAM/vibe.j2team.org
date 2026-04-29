<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import {
  GRAVITY,
  FLAP_FORCE,
  PIPE_GAP,
  PIPE_WIDTH,
  PIPE_INTERVAL,
  BIRD_RADIUS,
  POWERUP_RADIUS,
  POWERUP_DURATION,
  CANVAS_H,
  createBird,
  createFirewall,
  createPowerUp,
  applyGravity,
  flap,
  getPipeSpeed,
  checkCollision,
  collectPowerUps,
  type Bird,
  type Firewall,
  type PowerUp,
} from './logic/PhysicsEngine'
import { loadHighScores, saveHighScore, isHighScore, type ScoreEntry } from './logic/ScoreManager'
import GameLeaderboard from './components/GameLeaderboard.vue'

// Suppress unused lint — FLAP_FORCE, GRAVITY needed by imports used elsewhere in physics funcs
void GRAVITY
void FLAP_FORCE
void PIPE_GAP
void POWERUP_RADIUS
void POWERUP_DURATION

// ============================================================
// CANVAS REF & DIMENSIONS
// ============================================================
const canvasRef = ref<HTMLCanvasElement | null>(null)
let canvasW = 420

// ── Bird image (PNG) ──
let birdImg: HTMLImageElement | null = null
let birdImgReady = false

function loadBirdImage(): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = '/j2-bird/logo.png'
    img.onload = () => {
      birdImg = img
      birdImgReady = true
      resolve()
    }
    img.onerror = () => {
      birdImgReady = false
      resolve()
    } // graceful fallback
  })
}

// ============================================================
// GAME STATE
// ============================================================
type GameState = 'idle' | 'playing' | 'dead'

const gameState = ref<GameState>('idle')
const score = ref(0)
const bestScore = ref(0)
const scores = ref<ScoreEntry[]>(loadHighScores())

// ── Game objects ──
let bird: Bird = createBird(canvasW * 0.22)
let firewalls: Firewall[] = []
let powerUps: PowerUp[] = []

// ── Counters ──
let frameCount = 0
let nextPipeId = 0
let nextPowerUpId = 0
let pipesSinceLastPowerUp = 0

// ── Animation ──
let rafId = 0
let idleRafId = 0
let idleAngle = 0

// ── Invincible UI timer ──
const invincibleLeftMs = ref(0)
let invincibleInterval: ReturnType<typeof setInterval> | null = null

// ── Game over UI ──
const playerName = ref('')
const scoreSaved = ref(false)
const showBoard = ref(false)

// ============================================================
// CANVAS DRAW — HELPERS
// ============================================================
function getCtx(): CanvasRenderingContext2D | null {
  return canvasRef.value?.getContext('2d') ?? null
}

// --- Background ---
function drawBackground(ctx: CanvasRenderingContext2D) {
  const { width: W, height: H } = ctx.canvas
  // Deep space background
  ctx.fillStyle = '#050d1f'
  ctx.fillRect(0, 0, W, H)

  // Grid
  ctx.strokeStyle = '#091428'
  ctx.lineWidth = 1
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, H)
    ctx.stroke()
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
  }

  // Subtle scan line
  ctx.fillStyle = 'rgba(0,255,100,0.015)'
  const scanLine = (Date.now() / 20) % H
  ctx.fillRect(0, scanLine, W, 2)
}

// --- Firewall wall segment ---
function drawWallSegment(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  label: string,
  isTop: boolean,
) {
  if (h <= 0) return

  // Body gradient
  const g = ctx.createLinearGradient(x, 0, x + PIPE_WIDTH, 0)
  g.addColorStop(0, '#160000')
  g.addColorStop(0.4, '#2a0404')
  g.addColorStop(0.6, '#2a0404')
  g.addColorStop(1, '#160000')
  ctx.fillStyle = g
  ctx.fillRect(x, y, PIPE_WIDTH, h)

  // Circuit lines
  ctx.strokeStyle = '#440000'
  ctx.lineWidth = 1
  for (let ly = y % 12; ly < h; ly += 12) {
    ctx.beginPath()
    ctx.moveTo(x + 6, y + ly)
    ctx.lineTo(x + PIPE_WIDTH - 6, y + ly)
    ctx.stroke()
  }
  // Vertical channel
  ctx.beginPath()
  ctx.moveTo(x + PIPE_WIDTH / 2, y)
  ctx.lineTo(x + PIPE_WIDTH / 2, y + h)
  ctx.stroke()

  // Glow border
  ctx.shadowColor = '#ff2200'
  ctx.shadowBlur = 6
  ctx.strokeStyle = '#cc2200'
  ctx.lineWidth = 2
  ctx.strokeRect(x, y, PIPE_WIDTH, h)
  ctx.shadowBlur = 0

  // Cap at gap end
  const capH = 22
  const capY = isTop ? y + h - capH : y
  ctx.fillStyle = '#880000'
  ctx.fillRect(x - 5, capY, PIPE_WIDTH + 10, capH)

  // Cap border
  ctx.strokeStyle = '#ff4444'
  ctx.lineWidth = 1.5
  ctx.strokeRect(x - 5, capY, PIPE_WIDTH + 10, capH)

  // Cap label
  ctx.shadowColor = '#ff4444'
  ctx.shadowBlur = 4
  ctx.font = 'bold 7px monospace'
  ctx.fillStyle = '#ffaaaa'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x + PIPE_WIDTH / 2, capY + capH / 2)
  ctx.shadowBlur = 0
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

// --- Firewall pair ---
function drawFirewall(ctx: CanvasRenderingContext2D, fw: Firewall) {
  const gapTop = fw.gapY - PIPE_GAP / 2
  const gapBottom = fw.gapY + PIPE_GAP / 2
  drawWallSegment(ctx, fw.x, 0, gapTop, 'FIREWALL', true)
  drawWallSegment(ctx, fw.x, gapBottom, CANVAS_H - gapBottom, fw.errorCode, false)
}

// --- Power-up (J2 shield) ---
function drawPowerUp(ctx: CanvasRenderingContext2D, pu: PowerUp) {
  ctx.save()
  ctx.translate(pu.x, pu.y)
  ctx.rotate(pu.angle)

  // Glow
  ctx.shadowColor = '#ffcc00'
  ctx.shadowBlur = 15

  // Shield shape (pentagon-ish)
  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2
    const r = POWERUP_RADIUS
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  ctx.closePath()
  ctx.fillStyle = '#cc8800'
  ctx.fill()
  ctx.strokeStyle = '#ffe066'
  ctx.lineWidth = 2
  ctx.stroke()

  // J2 text
  ctx.shadowBlur = 0
  ctx.font = 'bold 9px monospace'
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('J2', 0, 0)

  ctx.restore()
}

// --- Bird (PNG with tilt + invincible glow, fallback to canvas shape) ---
function drawBird(ctx: CanvasRenderingContext2D, b: Bird, now: number) {
  ctx.save()
  ctx.translate(b.x, b.y)

  // Tilt based on velocity
  const tilt = Math.min(Math.max(b.vel * 3.5, -35), 75) * (Math.PI / 180)
  ctx.rotate(tilt)

  const inv = b.invincible && now < b.invincibleUntil

  // Invincible glow
  if (inv) {
    ctx.shadowColor = '#ffdd00'
    ctx.shadowBlur = 28
  }

  if (birdImgReady && birdImg) {
    // Draw PNG — centered on bird origin, 44×44 px
    const size = BIRD_RADIUS * 2.4
    ctx.drawImage(birdImg, -size / 2, -size / 2, size, size)

    // Gold tint overlay when invincible
    if (inv) {
      ctx.globalCompositeOperation = 'source-atop'
      ctx.fillStyle = 'rgba(255, 220, 0, 0.35)'
      ctx.fillRect(-size / 2, -size / 2, size, size)
      ctx.globalCompositeOperation = 'source-over'
    }
  } else {
    // ── Fallback: canvas-drawn bird ──
    const bodyGrad = ctx.createRadialGradient(-4, -4, 0, 0, 0, BIRD_RADIUS)
    if (inv) {
      bodyGrad.addColorStop(0, '#ffee88')
      bodyGrad.addColorStop(1, '#ff8800')
    } else {
      bodyGrad.addColorStop(0, '#00ffaa')
      bodyGrad.addColorStop(1, '#0055ff')
    }
    ctx.beginPath()
    ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = bodyGrad
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'
    ctx.lineWidth = 1.5
    ctx.stroke()
    // Wing
    ctx.beginPath()
    ctx.ellipse(-3, 9, 10, 5, -0.4, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0, 80, 180, 0.55)'
    ctx.fill()
    // Eye
    ctx.beginPath()
    ctx.arc(8, -7, 5.5, 0, Math.PI * 2)
    ctx.fillStyle = 'white'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(9, -6, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = '#100030'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(10, -7, 1, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.fill()
    // Beak
    ctx.beginPath()
    ctx.moveTo(13, -3)
    ctx.lineTo(22, 0)
    ctx.lineTo(13, 4)
    ctx.closePath()
    ctx.fillStyle = '#ff9500'
    ctx.fill()
    // J2 badge
    ctx.font = 'bold 8px monospace'
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('J2', -2, 3)
  }

  ctx.shadowBlur = 0
  ctx.restore()
}

// --- HUD ---
function drawHUD(ctx: CanvasRenderingContext2D) {
  const W = ctx.canvas.width

  // Score
  ctx.shadowColor = '#00ff88'
  ctx.shadowBlur = 8
  ctx.font = 'bold 26px monospace'
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText(String(score.value), W / 2, 14)
  ctx.shadowBlur = 0

  // Best score
  if (bestScore.value > 0) {
    ctx.font = '11px monospace'
    ctx.fillStyle = '#334455'
    ctx.fillText(`BEST ${bestScore.value}`, W / 2, 45)
  }

  // Invincible shield timer bar
  const now = Date.now()
  if (bird.invincible && now < bird.invincibleUntil) {
    const pct = (bird.invincibleUntil - now) / POWERUP_DURATION
    ctx.font = 'bold 9px monospace'
    ctx.fillStyle = '#ffcc00'
    ctx.textAlign = 'left'
    ctx.fillText('🛡 SHIELD', 10, 14)
    // Bar
    ctx.fillStyle = '#443300'
    ctx.fillRect(10, 26, 80, 6)
    ctx.fillStyle = '#ffdd00'
    ctx.fillRect(10, 26, 80 * pct, 6)
  }

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

// --- Idle/dead decorative screen ---
function drawIdleOverlay(birdY: number) {
  const ctx = getCtx()
  if (!ctx) return
  const W = ctx.canvas.width
  const H = ctx.canvas.height

  drawBackground(ctx)

  // Decorative "fake" fireballs in background
  ctx.globalAlpha = 0.12
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = '#ff2200'
    ctx.fillRect(W * 0.35 + i * 140, 0, PIPE_WIDTH, H * 0.35)
    ctx.fillRect(W * 0.35 + i * 140, H * 0.65, PIPE_WIDTH, H * 0.35)
  }
  ctx.globalAlpha = 1

  // Draw idle bird (bobbing)
  const idleBird: Bird = { x: W * 0.22, y: birdY, vel: 0, invincible: false, invincibleUntil: 0 }
  drawBird(ctx, idleBird, 0)

  // Title
  ctx.shadowColor = '#00ff88'
  ctx.shadowBlur = 20
  ctx.font = 'bold 28px monospace'
  ctx.fillStyle = '#00ff88'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('J2-BIRD', W / 2, H * 0.28)

  ctx.shadowBlur = 0
  ctx.font = '11px monospace'
  ctx.fillStyle = '#334455'
  ctx.fillText('HACK the FIREWALL', W / 2, H * 0.28 + 32)

  // Prompt
  ctx.font = 'bold 12px monospace'
  ctx.fillStyle = Math.sin(Date.now() / 400) > 0 ? '#00ff88' : '#007744'
  ctx.fillText('[ TAP / SPACE to START ]', W / 2, H * 0.55)

  // Best score
  if (bestScore.value > 0) {
    ctx.font = '10px monospace'
    ctx.fillStyle = '#334455'
    ctx.fillText(`BEST: ${bestScore.value}`, W / 2, H * 0.63)
  }

  // Controls hint
  ctx.font = '9px monospace'
  ctx.fillStyle = '#1a2a3a'
  ctx.fillText('⬆ COLLECT J2 SHIELD = 5s INVINCIBLE', W / 2, H - 18)

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

// ============================================================
// IDLE ANIMATION LOOP
// ============================================================
function startIdleLoop() {
  cancelAnimationFrame(idleRafId)
  idleAngle = 0
  function loop() {
    if (gameState.value !== 'idle') return
    idleAngle += 0.045
    const birdY = CANVAS_H / 2 + Math.sin(idleAngle) * 18
    drawIdleOverlay(birdY)
    idleRafId = requestAnimationFrame(loop)
  }
  idleRafId = requestAnimationFrame(loop)
}

// ============================================================
// GAME LOOP
// ============================================================
function tick() {
  const ctx = getCtx()
  if (!ctx || gameState.value !== 'playing') return

  frameCount++
  const now = Date.now()

  // 1. Physics
  bird = applyGravity(bird)

  // Expire invincibility
  if (bird.invincible && now > bird.invincibleUntil) {
    bird = { ...bird, invincible: false }
  }

  // 2. Move firewalls
  const speed = getPipeSpeed(score.value)
  firewalls = firewalls
    .map((fw) => ({ ...fw, x: fw.x - speed }))
    .filter((fw) => fw.x + PIPE_WIDTH > -10)

  // 3. Move power-ups
  powerUps = powerUps
    .map((pu) => ({ ...pu, x: pu.x - speed, angle: pu.angle + 0.06 }))
    .filter((pu) => pu.x > -30)

  // 4. Score: passed firewalls
  firewalls = firewalls.map((fw) => {
    if (!fw.passed && fw.x + PIPE_WIDTH < bird.x) {
      score.value++
      return { ...fw, passed: true }
    }
    return fw
  })

  // 5. Spawn firewalls
  if (frameCount % PIPE_INTERVAL === 0) {
    firewalls.push(createFirewall(nextPipeId++, canvasW))
    pipesSinceLastPowerUp++
    if (pipesSinceLastPowerUp >= 4) {
      powerUps.push(createPowerUp(nextPowerUpId++, canvasW))
      pipesSinceLastPowerUp = 0
    }
  }

  // 6. Collect power-ups
  const ids = collectPowerUps(bird, powerUps)
  if (ids.length > 0) {
    powerUps = powerUps.map((pu) => (ids.includes(pu.id) ? { ...pu, collected: true } : pu))
    bird = { ...bird, invincible: true, invincibleUntil: now + POWERUP_DURATION }
    score.value += 3 * ids.length
    invincibleLeftMs.value = POWERUP_DURATION
  }

  // 7. Collision
  if (checkCollision(bird, firewalls, now)) {
    handleGameOver()
    return
  }

  // 8. Render
  drawBackground(ctx)
  firewalls.forEach((fw) => drawFirewall(ctx, fw))
  powerUps.filter((pu) => !pu.collected).forEach((pu) => drawPowerUp(ctx, pu))
  drawBird(ctx, bird, now)
  drawHUD(ctx)
}

function startGameLoop() {
  cancelAnimationFrame(rafId)
  function loop() {
    if (gameState.value !== 'playing') return
    tick()
    rafId = requestAnimationFrame(loop)
  }
  rafId = requestAnimationFrame(loop)
}

// ============================================================
// GAME CONTROL
// ============================================================
function startGame() {
  score.value = 0
  frameCount = 0
  nextPipeId = 0
  nextPowerUpId = 0
  pipesSinceLastPowerUp = 0
  firewalls = []
  powerUps = []
  bird = createBird(canvasW * 0.22)
  scoreSaved.value = false
  playerName.value = ''
  showBoard.value = false
  gameState.value = 'playing'

  cancelAnimationFrame(idleRafId)
  startGameLoop()
}

function handleGameOver() {
  cancelAnimationFrame(rafId)
  gameState.value = 'dead'
  if (invincibleInterval) {
    clearInterval(invincibleInterval)
    invincibleInterval = null
  }
  if (score.value > bestScore.value) bestScore.value = score.value
  scores.value = loadHighScores()
}

function handleFlap() {
  if (gameState.value === 'idle') {
    startGame()
    return
  }
  if (gameState.value === 'dead') {
    return
  }
  bird = flap(bird)
}

function saveScore() {
  const name = playerName.value.trim() || 'Anonymous'
  const entry = { name, score: score.value, date: new Date().toISOString() }
  scores.value = saveHighScore(entry)
  scoreSaved.value = true
  showBoard.value = true
}

// ============================================================
// KEYBOARD / TOUCH
// ============================================================
function handleKey(e: KeyboardEvent) {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault()
    handleFlap()
  }
}

// ============================================================
// LIFECYCLE
// ============================================================
onMounted(async () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const container = canvas.parentElement
  canvasW = Math.min(container?.clientWidth ?? 520, 580)
  canvas.width = canvasW
  canvas.height = CANVAS_H

  bestScore.value = loadHighScores()[0]?.score ?? 0
  scores.value = loadHighScores()

  // Load bird PNG (non-blocking — idle loop starts immediately)
  loadBirdImage()

  window.addEventListener('keydown', handleKey)
  startIdleLoop()
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  cancelAnimationFrame(idleRafId)
  if (invincibleInterval) clearInterval(invincibleInterval)
  window.removeEventListener('keydown', handleKey)
})
</script>

<template>
  <div class="min-h-screen bg-[#030a15] text-green-400 font-mono flex flex-col">
    <!-- Nav -->
    <nav class="flex items-center justify-between px-4 sm:px-6 pt-4 pb-2 max-w-5xl mx-auto w-full">
      <RouterLink
        to="/"
        class="text-xs text-green-800 hover:text-green-500 border border-green-900 hover:border-green-700 px-3 py-1.5 transition-all"
      >
        ← EXIT
      </RouterLink>
      <span class="text-[10px] text-green-900 tracking-widest uppercase"
        >J2-BIRD v1.0 — Hack the Firewall</span
      >
    </nav>

    <!-- ===== MAIN LAYOUT ===== -->
    <div class="flex-1 flex flex-col md:flex-row gap-4 px-4 sm:px-6 pb-6 max-w-5xl mx-auto w-full">
      <!-- ── LEFT: Game area ── -->
      <div class="flex flex-col gap-3 flex-1 min-w-0">
        <!-- Canvas wrapper -->
        <div class="relative w-full border border-green-900/60">
          <canvas
            ref="canvasRef"
            class="block w-full cursor-pointer"
            style="touch-action: none"
            @click="handleFlap"
            @touchstart.prevent="handleFlap"
          />

          <!-- ── GAME OVER OVERLAY ── -->
          <Transition name="fade">
            <div
              v-if="gameState === 'dead'"
              class="absolute inset-0 flex flex-col items-center justify-center bg-black/65 backdrop-blur-sm px-4"
            >
              <div class="w-full max-w-xs border border-red-800/60 bg-black/85 p-5 relative">
                <div class="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500" />
                <div class="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500" />
                <div
                  class="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-500"
                />
                <div
                  class="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-500"
                />

                <div class="text-center mb-4">
                  <div class="text-2xl font-black text-red-400 tracking-widest">ACCESS DENIED</div>
                  <div class="text-[10px] text-red-700 mt-0.5">Firewall blocked your request</div>
                  <div class="mt-3 text-4xl font-black text-white">{{ score }}</div>
                  <div class="text-[10px] text-green-800">POINTS</div>
                </div>

                <!-- Save score form -->
                <div v-if="!scoreSaved && isHighScore(score)" class="mb-3 space-y-2">
                  <div class="text-[10px] text-green-600 tracking-widest uppercase">
                    🏆 New High Score! Enter your name:
                  </div>
                  <div class="flex gap-2">
                    <input
                      v-model="playerName"
                      type="text"
                      maxlength="16"
                      placeholder="Your name..."
                      class="flex-1 bg-black border border-green-800 text-green-300 placeholder-green-900 text-xs px-2 py-1.5 outline-none focus:border-green-500 transition-colors"
                      @keyup.enter="saveScore"
                    />
                    <button
                      class="px-3 py-1.5 border border-green-600 text-green-400 text-xs font-bold hover:bg-green-600/10 transition-all"
                      @click="saveScore"
                    >
                      SAVE
                    </button>
                  </div>
                </div>

                <!-- Mobile: toggle Leaderboard (hidden on md+ since sidebar is always visible) -->
                <div class="md:hidden">
                  <button
                    class="w-full text-[10px] text-green-800 hover:text-green-600 py-1 mb-2 transition-colors"
                    @click="showBoard = !showBoard"
                  >
                    {{ showBoard ? '▲ Hide' : '▼ Top 10' }} Leaderboard
                  </button>
                  <Transition name="slide">
                    <div v-if="showBoard" class="mb-3 border-t border-green-900 pt-2">
                      <GameLeaderboard :scores="scores" :current-score="score" />
                    </div>
                  </Transition>
                </div>

                <button
                  class="w-full py-2.5 border border-green-600 text-green-300 text-sm font-black tracking-wide hover:bg-green-600/10 transition-all"
                  @click="startGame"
                >
                  ▶ TRY AGAIN
                </button>
                <div class="mt-1.5 text-[10px] text-green-900 text-center">or press SPACE</div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Controls hint -->
        <div class="flex justify-between text-[10px] text-green-900">
          <span>SPACE / TAP to flap</span>
          <span>⭐ J2 Shield = 5s invincible</span>
        </div>
      </div>

      <!-- ── RIGHT: GameGameLeaderboard   sidebar (desktop only) ── -->
      <aside class="hidden md:flex flex-col gap-3 w-64 shrink-0">
        <div class="border border-green-900/50 bg-black/30 p-4">
          <!-- Corner accents -->
          <div
            class="absolute top-0 left-0 w-2 h-2 border-t border-l border-green-700 pointer-events-none"
          />

          <div
            class="text-[10px] text-green-700 tracking-widest uppercase mb-3 flex items-center gap-2"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            TOP 10 — LOCAL
          </div>
          <GameLeaderboard
            :scores="scores"
            :current-score="gameState === 'dead' ? score : undefined"
          />
        </div>

        <!-- How-to box -->
        <div
          class="border border-green-900/30 bg-black/20 p-4 text-[10px] text-green-900 space-y-1.5"
        >
          <div class="text-green-700 font-bold tracking-widest uppercase mb-2">CONTROLS</div>
          <div>⎵ SPACE — flap</div>
          <div>↑ ARROW UP — flap</div>
          <div>TAP — flap (mobile)</div>
          <div class="pt-1 border-t border-green-950 text-[9px]">
            Speed increases every 10 pts.<br />
            ⭐ J2 Shield → 5s invincible (+3 pts).
          </div>
        </div>

        <!-- Best score box -->
        <div v-if="bestScore > 0" class="border border-green-900/30 bg-black/20 p-4 text-center">
          <div class="text-[10px] text-green-800 tracking-widest uppercase mb-1">PERSONAL BEST</div>
          <div class="text-3xl font-black text-green-400">{{ bestScore }}</div>
        </div>
      </aside>
    </div>

    <!-- Footer -->
    <footer class="py-3 text-[10px] text-green-900 tracking-widest text-center">
      <RouterLink to="/" class="hover:text-green-700 transition-colors">vibe.j2team.org</RouterLink>
      &nbsp;·&nbsp; J2-Bird — Hack the Firewall
    </footer>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
}
.slide-enter-to,
.slide-leave-from {
  max-height: 400px;
}
</style>
