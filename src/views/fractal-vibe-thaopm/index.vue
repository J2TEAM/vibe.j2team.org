<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col">
    <!-- Header / Status Bar -->
    <header
      class="border-b border-border-default bg-bg-elevated/80 backdrop-blur-sm p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
    >
      <div>
        <h1
          class="font-display text-5xl md:text-6xl font-bold tracking-tight text-accent-coral animate-fade-up"
        >
          TÔI LÀ BUG
        </h1>
        <p class="mt-2 text-text-secondary text-lg md:text-xl animate-fade-up animate-delay-1">
          Làm Dev đủ rồi, hôm nay mình làm con bug trốn Dev nhóa!?
        </p>
      </div>

      <div class="flex items-center gap-8 md:gap-10 flex-wrap justify-end">
        <div class="text-right">
          <div class="text-xs text-text-dim font-display tracking-widest">ĐIỂM</div>
          <div class="text-4xl md:text-5xl font-bold tabular-nums text-accent-amber">
            {{ Math.floor(score) }}
          </div>
        </div>
        <div class="text-right">
          <div class="text-xs text-text-dim font-display tracking-widest">THỜI GIAN SỐNG</div>
          <div class="text-4xl md:text-5xl font-bold tabular-nums text-accent-sky">{{ time }}s</div>
        </div>
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 px-6 py-3 border border-border-default bg-bg-surface text-text-secondary text-sm md:text-base font-display tracking-wide transition-all duration-300 hover:border-accent-coral hover:text-text-primary hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent-coral/10 animate-fade-up animate-delay-2"
        >
          ← VỀ TRANG CHỦ
        </RouterLink>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col items-center justify-center p-6 md:p-10 gap-10">
      <div class="w-full max-w-5xl mx-auto">
        <h2
          class="font-display text-2xl md:text-3xl font-semibold mb-6 md:mb-8 flex items-center gap-3 animate-fade-up animate-delay-1"
        >
          <span class="text-accent-coral text-sm md:text-base tracking-widest">//</span>
          TRÒ CHƠI Né SENIOR DEV
        </h2>

        <!-- Game Container -->
        <div
          class="relative border border-border-default bg-bg-surface overflow-hidden shadow-lg shadow-black/30 transition-all duration-300 hover:shadow-xl hover:shadow-accent-coral/5"
        >
          <canvas
            id="gameCanvas"
            width="800"
            height="420"
            class="w-full h-auto cursor-none block"
          ></canvas>

          <!-- Game Over Overlay -->
          <div
            v-if="gameState === 'over'"
            class="absolute inset-0 bg-bg-deep/95 flex flex-col items-center justify-center p-6 md:p-10 text-center animate-fade-up"
          >
            <div class="text-7xl md:text-8xl mb-6 animate-pulse">💀</div>
            <div
              class="font-display text-4xl md:text-6xl font-bold text-accent-coral mb-4 tracking-tight"
            >
              {{ deathMessage }}
            </div>
            <div class="text-xl md:text-2xl text-text-secondary mb-8 md:mb-10">
              Bạn sống sót được <span class="text-accent-amber font-bold">{{ time }}</span> giây
            </div>
            <button
              @click="restartGame"
              class="px-8 md:px-12 py-4 md:py-5 bg-accent-coral text-bg-deep font-display font-bold text-xl md:text-2xl tracking-wide transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-accent-coral/20"
            >
              CHƠI LẠI
            </button>
          </div>

          <!-- Dev Alert -->
          <div
            v-if="devAlert"
            class="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 bg-accent-coral text-bg-deep px-6 md:px-10 py-3 md:py-4 text-lg md:text-2xl font-display font-bold animate-pulse tracking-wider shadow-lg"
          >
            ⚠️ SENIOR DEV ĐANG COMPILE ⚠️
          </div>
        </div>

        <!-- Instruction -->
        <div
          class="mt-8 md:mt-10 text-center text-text-secondary text-base md:text-lg max-w-2xl mx-auto animate-fade-up animate-delay-3"
        >
          🐛 Di chuột né Senior Dev<br />
          <span class="text-accent-amber font-semibold"
            >RÊ CHUỘT + CLICK NHANH vào 3 nút skill đang di chuyển!</span
          ><br />
          Chỉ có ~2.2 giây cho mỗi nút trước khi nó nhảy chỗ khác 🔥
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer
      class="text-center py-6 md:py-8 text-text-dim text-xs md:text-sm font-display tracking-widest border-t border-border-default"
    >
      bởi Phạm Minh Thảo • vibe.j2team.org • 2026
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

const score = ref(0)
const time = ref(0)
const gameState = ref<'playing' | 'over'>('playing')
const deathMessage = ref('')
const devAlert = ref(false)

let canvas!: HTMLCanvasElement
let ctx!: CanvasRenderingContext2D
const bug = { x: 400, y: 210, radius: 18 }
const devCursor = { x: 850, y: 210, speed: 1.8, active: false }

interface Particle {
  text: string
  x: number
  y: number
  vy: number
  life: number
  alpha: number
}
let particles: Particle[] = []

let lastSpawn = 0
let invincible = 0
let loopSlow = 0
const mouse = { x: 400, y: 210 }
let gameRunning = true
let animFrameId = 0
let startTime = Date.now()

// 12 TRICK BẤT NGỜ
const surpriseDeaths = [
  { name: 'ANTI-VIRUS', emoji: '🛡️', message: 'ANTI-VIRUS QUARANTINE - CHẾT QUEO!' },
  { name: 'GIT REVERT', emoji: '🔙', message: 'GIT REVERT ĐÃ XÓA BẠN!' },
  { name: 'COPILOT', emoji: '🤖', message: 'GITHUB COPILOT AUTO-FIX - BIẾN MẤT!' },
  { name: 'LINTER', emoji: '🧹', message: 'ESLINT DỌN SẠCH - BUG BỊ XÓA!' },
  { name: 'UNIT TEST', emoji: '🧪', message: 'UNIT TEST BẮT ĐƯỢC - CHẾT!' },
  { name: 'DEBUGGER', emoji: '🔍', message: 'BREAKPOINT TRIGGER - KILL!' },
  { name: 'PROD MODE', emoji: '🏭', message: 'PRODUCTION MODE XÓA TOÀN BỘ!' },
  { name: 'BACKUP', emoji: '💾', message: 'RESTORE BẢN CŨ - KHÔNG CÓ BẠN!' },
  { name: 'SECURITY', emoji: '🔒', message: 'SECURITY PATCH FIX BẠN!' },
  { name: 'JUNIOR HOTFIX', emoji: '👦', message: 'JUNIOR DEV LÀM HOTFIX - MẤT TÍCH!' },
  { name: 'QA REPORT', emoji: '📋', message: 'QA PHÁT HIỆN - BẠN BỊ XÓA!' },
  { name: 'OPTIMIZER', emoji: '⚡', message: 'COMPILER TỐI ƯU - BUG LOẠI BỎ!' },
] as const

let currentSurpriseIndex = -1
let surpriseActive = false
let surpriseEndTime = 0
let nextSurpriseTime = 0

// 3 NÚT SKILL
type ActionButton = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  icon: string
  name: string
  points: number
  life: number
  size: number
}

const actionButtons: ActionButton[] = [
  {
    id: 0,
    x: 180,
    y: 260,
    vx: 1.4,
    vy: 0.9,
    color: '#ef4444',
    icon: '🛠️',
    name: 'PHÁ HÀM',
    points: 80,
    life: 2250,
    size: 92,
  },
  {
    id: 1,
    x: 400,
    y: 310,
    vx: -1.1,
    vy: 1.6,
    color: '#eab308',
    icon: '♾️',
    name: 'INFINITE',
    points: 150,
    life: 2250,
    size: 92,
  },
  {
    id: 2,
    x: 620,
    y: 240,
    vx: 1.3,
    vy: -1.2,
    color: '#22d3ee',
    icon: '📝',
    name: 'COMMENT',
    points: 0,
    life: 2250,
    size: 92,
  },
]

let screenShake = 0
let flashAlpha = 0

function drawBackground(t: number) {
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, 800, 420)
  ctx.font = '13px monospace'
  ctx.fillStyle = '#00ff8044'
  for (let i = 0; i < 18; i++) {
    const y = ((i * 28 + ((t * 0.8) % 28)) % 440) - 10
    ctx.fillText('function destroy() { return bug;', 40, y)
    ctx.fillText('if (dev) { fix(bug) }', 420, y + 8)
  }
  ctx.strokeStyle = '#00ff40'
  ctx.lineWidth = 3
  ctx.strokeRect(8, 8, 784, 404)
}

function drawBug() {
  const pulse = Math.sin(Date.now() / 120) * 1.5
  ctx.save()
  ctx.translate(bug.x, bug.y)
  ctx.fillStyle = '#00ff80'
  ctx.beginPath()
  ctx.ellipse(0, 0, bug.radius + pulse, bug.radius - 4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#00cc66'
  ctx.beginPath()
  ctx.arc(14, 0, 9, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.arc(18, -4, 3.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(18, 4, 3.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#00ff80'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(14, -8)
  ctx.lineTo(22, -22)
  ctx.moveTo(14, 8)
  ctx.lineTo(22, 22)
  ctx.stroke()
  ctx.strokeStyle = '#00cc66'
  ctx.lineWidth = 3
  for (let i = 0; i < 6; i++) {
    ctx.beginPath()
    ctx.moveTo(-6, -6 + i * 3)
    ctx.lineTo(-26, -12 + i * 4 + Math.sin(Date.now() / 140) * 4)
    ctx.stroke()
  }
  ctx.restore()
}

function drawDevCursor() {
  if (!devCursor.active) return
  ctx.save()
  ctx.translate(devCursor.x, devCursor.y)
  ctx.fillStyle = '#ff0044'
  ctx.fillRect(-12, -8, 28, 12)
  ctx.fillStyle = '#aa0022'
  ctx.fillRect(10, -18, 8, 28)
  ctx.restore()
}

function drawSurprise() {
  if (!surpriseActive) return
  const s = surpriseDeaths[currentSurpriseIndex]
  if (!s) return
  const pulse = Math.sin(Date.now() / 40) * 0.6 + 1.2
  ctx.save()
  ctx.globalAlpha = pulse * 0.95
  ctx.font = 'bold 72px monospace'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#ff0088'
  ctx.shadowColor = '#ff0088'
  ctx.shadowBlur = 80
  ctx.fillText(s.emoji + ' ' + s.name + '!', 400, 195)
  ctx.font = 'bold 28px monospace'
  ctx.fillStyle = '#ffff00'
  ctx.shadowBlur = 40
  ctx.fillText('NHẤN NÚT NGAY HOẶC CHẾT QUEO!', 400, 255)
  ctx.restore()
}

function drawFlash() {
  if (flashAlpha <= 0) return
  ctx.save()
  ctx.fillStyle = `rgba(255, 30, 80, ${flashAlpha})`
  ctx.fillRect(0, 0, 800, 420)
  ctx.restore()
}

function drawActionButtons() {
  actionButtons.forEach((btn) => {
    const pulse = Math.sin(Date.now() / 80) * 4 + 92
    const alpha = btn.life / 2250
    ctx.save()
    ctx.globalAlpha = alpha * 0.95
    ctx.translate(btn.x, btn.y)
    ctx.shadowColor = btn.color
    ctx.shadowBlur = 45
    ctx.fillStyle = '#111111'
    ctx.strokeStyle = btn.color
    ctx.lineWidth = 7
    ctx.beginPath()
    ctx.roundRect(-pulse / 2, -pulse / 2 - 8, pulse, pulse + 42, 16)
    ctx.fill()
    ctx.stroke()
    ctx.font = '52px system-ui'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(btn.icon, 0, 22)
    ctx.font = 'bold 14px monospace'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(btn.name, 0, 62)
    ctx.restore()
  })
}

function spawnParticle(text: string, x: number, y: number) {
  particles.push({ text, x, y, vy: -2.4, life: 52, alpha: 1 })
}

function updateActionButtons() {
  actionButtons.forEach((btn) => {
    btn.x += btn.vx
    btn.y += btn.vy
    btn.life -= 16.67
    if (btn.x < 80 || btn.x > 720) btn.vx *= -1
    if (btn.y < 70 || btn.y > 350) btn.vy *= -1
    if (btn.life <= 0) repositionButton(btn)
  })
}

function repositionButton(btn: ActionButton) {
  btn.x = 90 + Math.random() * 620
  btn.y = 80 + Math.random() * 260
  btn.vx = (Math.random() - 0.5) * 3.2
  btn.vy = (Math.random() - 0.5) * 3.2
  btn.life = 2150 + Math.random() * 700
}

function checkButtonHit(mx: number, my: number) {
  for (let i = 0; i < actionButtons.length; i++) {
    const btn = actionButtons[i]
    if (!btn) continue
    const dx = mx - btn.x
    const dy = my - btn.y
    if (Math.hypot(dx, dy) < btn.size / 2 + 12) {
      activateAction(i)
      repositionButton(btn)
      return true
    }
  }
  return false
}

function activateAction(idx: number) {
  const btn = actionButtons[idx]
  if (!btn) return
  if (btn.id === 0) {
    score.value += 80
    spawnParticle('🛠️ PHÁ HÀM!', bug.x, bug.y - 45)
    if (devCursor.active) devCursor.x += 75
  } else if (btn.id === 1) {
    score.value += 180
    loopSlow = 165
    spawnParticle('♾️ INFINITE!', bug.x + 25, bug.y - 35)
  } else if (btn.id === 2) {
    invincible = 285
    spawnParticle('📝 COMMENT!', bug.x, bug.y - 50)
  }
}

function checkCollision() {
  if (!devCursor.active || invincible > 0) return false
  const dx = bug.x - devCursor.x
  const dy = bug.y - devCursor.y
  return Math.hypot(dx, dy) < bug.radius + 18
}

function triggerSurprise(now: number) {
  currentSurpriseIndex = Math.floor(Math.random() * surpriseDeaths.length)
  surpriseActive = true
  surpriseEndTime = now + 1700
  const s = surpriseDeaths[currentSurpriseIndex]
  if (!s) return
  screenShake = 42
  flashAlpha = 0.98
  spawnParticle(s.emoji + ' ' + s.name, bug.x + (Math.random() - 0.5) * 120, bug.y - 90)
}

function gameLoop() {
  if (!gameRunning) return
  const now = Date.now()
  time.value = Math.floor((now - startTime) / 1000)
  score.value += 0.09

  bug.x += (mouse.x - bug.x) * 0.23
  bug.y += (mouse.y - bug.y) * 0.23
  bug.x = Math.max(35, Math.min(765, bug.x))
  bug.y = Math.max(35, Math.min(385, bug.y))

  if (!devCursor.active && now - lastSpawn > 1650 + Math.random() * 1950) {
    devCursor.x = 830
    devCursor.y = 50 + Math.random() * 320
    devCursor.speed = 1.75 + time.value / 65
    devCursor.active = true
    lastSpawn = now
    devAlert.value = true
    setTimeout(() => (devAlert.value = false), 1050)
  }

  if (devCursor.active) {
    const slow = loopSlow > 0 ? 0.33 : 1
    const dx = bug.x - devCursor.x
    const dy = bug.y - devCursor.y
    const dist = Math.hypot(dx, dy) || 1
    devCursor.x += (dx / dist) * devCursor.speed * slow
    devCursor.y += (dy / dist) * devCursor.speed * slow
    if (devCursor.x < -30) devCursor.active = false
  }

  if (!surpriseActive && now > nextSurpriseTime) {
    triggerSurprise(now)
    nextSurpriseTime = now + 5000
  }

  if (surpriseActive && now > surpriseEndTime) {
    const s = surpriseDeaths[currentSurpriseIndex]
    if (s) deathMessage.value = s.message
    gameOver()
    return
  }

  updateActionButtons()

  if (loopSlow > 0) loopSlow--
  if (invincible > 0) invincible--

  if (checkCollision()) {
    deathMessage.value = 'SENIOR DEV ĐÃ FIX BẠN! 💥'
    gameOver()
    return
  }

  screenShake = Math.max(screenShake - 2.2, 0)
  flashAlpha = Math.max(flashAlpha - 0.09, 0)

  ctx.save()
  if (screenShake > 0)
    ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake)

  ctx.clearRect(0, 0, 800, 420)
  const t = Date.now() / 30
  drawBackground(t)
  drawBug()
  drawDevCursor()
  drawSurprise()
  drawFlash()
  drawActionButtons()

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    if (!p) continue
    p.y += p.vy
    p.life--
    p.alpha = p.life / 52
    ctx.save()
    ctx.globalAlpha = p.alpha
    ctx.fillStyle = '#00ff80'
    ctx.font = 'bold 20px monospace'
    ctx.fillText(p.text, p.x, p.y)
    ctx.restore()
    if (p.life <= 0) particles.splice(i, 1)
  }

  ctx.restore()

  animFrameId = requestAnimationFrame(gameLoop)
}

function gameOver() {
  gameRunning = false
  gameState.value = 'over'
}

function startGame() {
  gameRunning = true
  gameState.value = 'playing'
  deathMessage.value = ''
  score.value = 0
  time.value = 0
  startTime = Date.now()
  particles = []
  devCursor.active = false
  invincible = 0
  loopSlow = 0
  bug.x = 400
  bug.y = 210
  surpriseActive = false
  screenShake = 0
  flashAlpha = 0
  nextSurpriseTime = Date.now() + 7000

  // Reset nút skill
  actionButtons[0]!.x = 180
  actionButtons[0]!.y = 260
  actionButtons[0]!.vx = 1.4
  actionButtons[0]!.vy = 0.9
  actionButtons[0]!.life = 2250

  actionButtons[1]!.x = 400
  actionButtons[1]!.y = 310
  actionButtons[1]!.vx = -1.1
  actionButtons[1]!.vy = 1.6
  actionButtons[1]!.life = 2250

  actionButtons[2]!.x = 620
  actionButtons[2]!.y = 240
  actionButtons[2]!.vx = 1.3
  actionButtons[2]!.vy = -1.2
  actionButtons[2]!.life = 2250

  animFrameId = requestAnimationFrame(gameLoop)
}

function restartGame() {
  startGame()
}

function handleMouse(e: MouseEvent) {
  const rect = canvas.getBoundingClientRect()
  mouse.x = e.clientX - rect.left
  mouse.y = e.clientY - rect.top
}

function handleCanvasClick(e: MouseEvent) {
  if (gameState.value !== 'playing') return
  const rect = canvas.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  checkButtonHit(mx, my)
}

function handleTouchMove(e: TouchEvent) {
  e.preventDefault()
  const touch = e.touches[0]
  if (!touch) return
  const rect = canvas.getBoundingClientRect()
  mouse.x = touch.clientX - rect.left
  mouse.y = touch.clientY - rect.top
}

function handleTouchEnd(e: TouchEvent) {
  if (gameState.value !== 'playing') return
  const rect = canvas.getBoundingClientRect()
  const touch = e.changedTouches[0]
  if (!touch) return
  const mx = touch.clientX - rect.left
  const my = touch.clientY - rect.top
  checkButtonHit(mx, my)
}

onMounted(() => {
  const canvasEl = document.getElementById('gameCanvas')
  if (!canvasEl) return
  canvas = canvasEl as HTMLCanvasElement
  const context = canvas.getContext('2d', { alpha: true })
  if (!context) return
  ctx = context

  canvas.addEventListener('mousemove', handleMouse)
  canvas.addEventListener('click', handleCanvasClick)
  canvas.addEventListener('touchmove', handleTouchMove)
  canvas.addEventListener('touchend', handleTouchEnd)

  startGame()
})

onUnmounted(() => {
  gameRunning = false
  cancelAnimationFrame(animFrameId)
  canvas.removeEventListener('mousemove', handleMouse)
  canvas.removeEventListener('click', handleCanvasClick)
  canvas.removeEventListener('touchmove', handleTouchMove)
  canvas.removeEventListener('touchend', handleTouchEnd)
})
</script>

<style scoped>
canvas {
  image-rendering: pixelated;
  touch-action: none;
}
</style>
