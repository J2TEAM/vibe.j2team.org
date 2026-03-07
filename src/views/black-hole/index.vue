<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
  hue: number
  trail: { x: number; y: number }[]
  dead: boolean
  isJet: boolean
}

interface BlackHole {
  x: number
  y: number
  mass: number
  radius: number
  accretionRadius: number
}

interface Ripple {
  x: number
  y: number
  radius: number
  maxRadius: number
  life: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isPaused = ref(false)
const particleCount = ref(0)
const closestParticle = ref(0)
const fpsDisplay = ref(60)
const massLevel = ref(1)

let ctx: CanvasRenderingContext2D | null = null
let animId: number | null = null
let W = 0
let H = 0

const G = 6000
const TRAIL_LENGTH = 16
const MAX_PARTICLES = 350
const SPAWN_RATE = 2

const blackHole: BlackHole = { x: 0, y: 0, mass: 1, radius: 36, accretionRadius: 100 }
const particles: Particle[] = []
const ripples: Ripple[] = []

let starBitmap: ImageBitmap | null = null

let isDragging = false
let dragLastX = 0
let dragLastY = 0
let diskAngle = 0
let time = 0
let lastFrameTime = 0
let frameCount = 0
let fpsTimer = 0

onMounted(async () => {
  const canvas = canvasRef.value!
  ctx = canvas.getContext('2d')!
  resize()
  window.addEventListener('resize', resize)
  canvas.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('mousedown', onMouseDown)
  canvas.addEventListener('mouseup', onMouseUp)
  canvas.addEventListener('touchstart', onTouchStart, { passive: true })
  canvas.addEventListener('touchmove', onTouchMove, { passive: true })
  canvas.addEventListener('touchend', onTouchEnd, { passive: true })
  await buildStarfield()
  loop(0)
})

onUnmounted(() => {
  if (animId !== null) cancelAnimationFrame(animId)
  window.removeEventListener('resize', resize)
})

function resize() {
  const canvas = canvasRef.value!
  W = canvas.width = canvas.offsetWidth
  H = canvas.height = canvas.offsetHeight
  blackHole.x = W / 2
  blackHole.y = H / 2
  buildStarfield()
}

async function buildStarfield() {
  if (!W || !H) return
  const off = new OffscreenCanvas(W, H)
  const octx = off.getContext('2d')!
  octx.clearRect(0, 0, W, H)
  const starCount = Math.floor((W * H) / 6000)
  for (let i = 0; i < starCount; i++) {
    const x = Math.random() * W
    const y = Math.random() * H
    const r = Math.random() < 0.08 ? 1.5 : 0.6
    const a = 0.15 + Math.random() * 0.55
    const warm = Math.random()
    const color = warm < 0.4
      ? `rgba(240,230,200,${a})`
      : warm < 0.7
        ? `rgba(180,210,255,${a})`
        : `rgba(255,200,160,${a})`
    octx.beginPath()
    octx.arc(x, y, r, 0, Math.PI * 2)
    octx.fillStyle = color
    octx.fill()
  }
  starBitmap = await createImageBitmap(off)
}

function spawnParticle() {
  if (particles.length >= MAX_PARTICLES) return
  const edge = Math.floor(Math.random() * 4)
  let x = 0, y = 0
  if (edge === 0) { x = Math.random() * W; y = -10 }
  else if (edge === 1) { x = W + 10; y = Math.random() * H }
  else if (edge === 2) { x = Math.random() * W; y = H + 10 }
  else { x = -10; y = Math.random() * H }

  const dx = blackHole.x - x
  const dy = blackHole.y - y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const tangX = -dy / dist
  const tangY = dx / dist
  const speed = 0.4 + Math.random() * 1.2
  const tangential = 0.4 + Math.random() * 0.8
  const hue = Math.random() < 0.55
    ? 10 + Math.random() * 30
    : Math.random() < 0.5
      ? 35 + Math.random() * 25
      : 195 + Math.random() * 30

  particles.push({
    x, y,
    vx: (dx / dist) * speed + tangX * tangential,
    vy: (dy / dist) * speed + tangY * tangential,
    radius: 0.8 + Math.random() * 2,
    opacity: 0.6 + Math.random() * 0.4,
    hue,
    trail: [],
    dead: false,
    isJet: false,
  })
}

function spawnJetParticle() {
  if (particles.length >= MAX_PARTICLES) return
  const sign = Math.random() < 0.5 ? 1 : -1
  const spread = (Math.random() - 0.5) * 1.2
  const speed = 3.5 + Math.random() * 2.5
  const hue = 185 + Math.random() * 30

  particles.push({
    x: blackHole.x + (Math.random() - 0.5) * blackHole.radius * 0.8,
    y: blackHole.y,
    vx: spread,
    vy: sign * speed,
    radius: 0.5 + Math.random() * 1,
    opacity: 0.5 + Math.random() * 0.4,
    hue,
    trail: [],
    dead: false,
    isJet: true,
  })
}

function spawnHawkingParticle() {
  if (particles.length >= MAX_PARTICLES) return
  const angle = Math.random() * Math.PI * 2
  const r = blackHole.radius + 2
  const speed = 0.8 + Math.random() * 1.2
  particles.push({
    x: blackHole.x + Math.cos(angle) * r,
    y: blackHole.y + Math.sin(angle) * r,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 0.4 + Math.random() * 0.6,
    opacity: 0.4 + Math.random() * 0.3,
    hue: 50 + Math.random() * 40,
    trail: [],
    dead: false,
    isJet: false,
  })
}

function simulate() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    if (p.dead) { particles.splice(i, 1); continue }

    const dx = blackHole.x - p.x
    const dy = blackHole.y - p.y
    const distSq = dx * dx + dy * dy
    const dist = Math.sqrt(distSq)

    if (dist < blackHole.radius - 4) {
      p.dead = true
      if (ripples.length < 12) {
        ripples.push({ x: p.x, y: p.y, radius: blackHole.radius, maxRadius: blackHole.radius + 45, life: 1 })
      }
      continue
    }

    if (!p.isJet) {
      const acc = (G * blackHole.mass) / distSq
      p.vx += (dx / dist) * acc
      p.vy += (dy / dist) * acc
      p.vx *= 0.999
      p.vy *= 0.999
    }

    p.trail.push({ x: p.x, y: p.y })
    if (p.trail.length > TRAIL_LENGTH) p.trail.shift()

    p.x += p.vx
    p.y += p.vy

    if (p.x < -200 || p.x > W + 200 || p.y < -200 || p.y > H + 200) {
      p.dead = true
    }
  }

  for (let i = ripples.length - 1; i >= 0; i--) {
    const rp = ripples[i]
    rp.life -= 0.045
    rp.radius += 2.5
    if (rp.life <= 0) ripples.splice(i, 1)
  }
}

function draw(now: number) {
  if (!ctx) return

  frameCount++
  fpsTimer += now - lastFrameTime
  lastFrameTime = now
  if (fpsTimer >= 500) {
    fpsDisplay.value = Math.round(frameCount / (fpsTimer / 1000))
    frameCount = 0
    fpsTimer = 0
  }

  if (starBitmap) {
    ctx.globalAlpha = 1
    ctx.drawImage(starBitmap, 0, 0)
  } else {
    ctx.fillStyle = '#0F1923'
    ctx.fillRect(0, 0, W, H)
  }

  ctx.fillStyle = 'rgba(15, 25, 35, 0.78)'
  ctx.fillRect(0, 0, W, H)

  drawRipples()
  drawBlackHole()
  drawParticles()

  diskAngle += 0.008
  time += 0.03
}

function drawRipples() {
  if (!ctx) return
  for (const rp of ripples) {
    ctx.beginPath()
    ctx.arc(rp.x, rp.y, rp.radius, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(255, 130, 60, ${rp.life * 0.6})`
    ctx.lineWidth = 1.5 * rp.life
    ctx.stroke()
  }
}

function drawBlackHole() {
  if (!ctx) return
  const bh = blackHole
  const pulse = 1 + 0.06 * Math.sin(time * 1.5)

  const glowGradient = ctx.createRadialGradient(bh.x, bh.y, bh.radius * 0.5, bh.x, bh.y, bh.accretionRadius * 2.5 * pulse)
  glowGradient.addColorStop(0,   'rgba(255, 107, 74, 0.22)')
  glowGradient.addColorStop(0.3, 'rgba(255, 184, 48, 0.10)')
  glowGradient.addColorStop(0.6, 'rgba(56, 189, 248, 0.06)')
  glowGradient.addColorStop(1,   'rgba(0,0,0,0)')
  ctx.beginPath()
  ctx.arc(bh.x, bh.y, bh.accretionRadius * 2.5 * pulse, 0, Math.PI * 2)
  ctx.fillStyle = glowGradient
  ctx.fill()

  drawAccretionDisk(bh, pulse)

  const lensRadius = bh.radius * 2.0
  for (let arc = 0; arc < 3; arc++) {
    const alpha = (0.35 - arc * 0.1) * pulse
    const gr = lensRadius + arc * 6
    const lensGrad = ctx.createRadialGradient(bh.x, bh.y, gr - 3, bh.x, bh.y, gr + 3)
    lensGrad.addColorStop(0, `rgba(255,107,74,0)`)
    lensGrad.addColorStop(0.5, `rgba(255,220,150,${alpha})`)
    lensGrad.addColorStop(1, `rgba(255,107,74,0)`)
    ctx.beginPath()
    ctx.arc(bh.x, bh.y, gr, 0, Math.PI * 2)
    ctx.strokeStyle = lensGrad
    ctx.lineWidth = 6 - arc * 1.5
    ctx.stroke()
  }

  const singGrad = ctx.createRadialGradient(bh.x - bh.radius * 0.3, bh.y - bh.radius * 0.3, 0, bh.x, bh.y, bh.radius)
  singGrad.addColorStop(0, '#0a0f15')
  singGrad.addColorStop(1, '#000000')
  ctx.beginPath()
  ctx.arc(bh.x, bh.y, bh.radius, 0, Math.PI * 2)
  ctx.fillStyle = singGrad
  ctx.fill()

  const rimGrad = ctx.createRadialGradient(bh.x, bh.y, bh.radius - 4, bh.x, bh.y, bh.radius + 8)
  rimGrad.addColorStop(0, `rgba(255,130,60,${0.45 * pulse})`)
  rimGrad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.beginPath()
  ctx.arc(bh.x, bh.y, bh.radius + 8, 0, Math.PI * 2)
  ctx.fillStyle = rimGrad
  ctx.fill()
}

function drawAccretionDisk(bh: BlackHole, pulse: number) {
  if (!ctx) return
  const rx = bh.accretionRadius * 1.5 * pulse
  const ry = rx * 0.2

  ctx.save()
  ctx.translate(bh.x, bh.y)
  ctx.rotate(diskAngle)

  for (let pass = 0; pass < 2; pass++) {
    const flip = pass === 0 ? 1 : -1
    ctx.save()
    ctx.scale(1, flip * ry / rx)
    ctx.beginPath()

    const diskGrad = ctx.createLinearGradient(-rx, 0, rx, 0)
    diskGrad.addColorStop(0,    'rgba(255, 107, 74, 0)')
    diskGrad.addColorStop(0.25, 'rgba(255, 184, 48, 0.85)')
    diskGrad.addColorStop(0.5,  'rgba(255, 240, 200, 0.95)')
    diskGrad.addColorStop(0.75, 'rgba(255, 107, 74, 0.80)')
    diskGrad.addColorStop(1,    'rgba(255, 107, 74, 0)')

    ctx.arc(0, 0, rx, 0, Math.PI)
    ctx.strokeStyle = diskGrad
    ctx.lineWidth = 10 + 4 * Math.sin(time * 2.5 + pass)
    ctx.shadowColor = 'rgba(255,184,48,0.6)'
    ctx.shadowBlur = 18
    ctx.stroke()
    ctx.shadowBlur = 0
    ctx.restore()
  }

  ctx.restore()
}

function drawParticles() {
  if (!ctx) return
  let minDist = Infinity

  for (const p of particles) {
    const dx = blackHole.x - p.x
    const dy = blackHole.y - p.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < minDist) minDist = dist

    const proximity = Math.max(0, 1 - dist / (blackHole.accretionRadius * 2))
    const glowFactor = 1 + proximity * 3
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
    const saturation = p.isJet ? 90 : Math.max(20, 90 - speed * 4)
    const lightness = p.isJet ? Math.min(95, 65 + speed * 3) : Math.min(92, 55 + speed * 6)

    for (let t = 1; t < p.trail.length; t += 2) {
      const pt = p.trail[t]
      const trailFade = t / p.trail.length
      const trailOpacity = trailFade * p.opacity * (p.isJet ? 0.25 : 0.1 + proximity * 0.4)
      if (trailOpacity < 0.02) continue
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, Math.max(0.3, p.radius * trailFade * 0.8), 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${p.hue}, ${saturation}%, ${lightness}%, ${trailOpacity})`
      ctx.fill()
    }

    const glowSize = p.radius * glowFactor
    if (proximity > 0.5 || p.isJet) {
      ctx.shadowColor = `hsl(${p.hue}, ${saturation}%, ${lightness}%)`
      ctx.shadowBlur = p.isJet ? 6 : glowSize * 3
    }
    ctx.beginPath()
    ctx.arc(p.x, p.y, Math.max(0.5, glowSize), 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${p.hue}, ${saturation}%, ${lightness}%, ${p.opacity})`
    ctx.fill()
    ctx.shadowBlur = 0
  }

  closestParticle.value = Math.round(minDist === Infinity ? 0 : minDist)
  particleCount.value = particles.length
}

function loop(now: number) {
  if (!isPaused.value) {
    for (let i = 0; i < SPAWN_RATE; i++) spawnParticle()
    if (Math.random() < 0.25) spawnJetParticle()
    if (Math.random() < 0.04) spawnHawkingParticle()
    simulate()
    draw(now)
  } else {
    lastFrameTime = now
  }
  animId = requestAnimationFrame(loop)
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging) return
  const rect = canvasRef.value!.getBoundingClientRect()
  blackHole.x = e.clientX - rect.left
  blackHole.y = e.clientY - rect.top
  dragLastX = blackHole.x
  dragLastY = blackHole.y
}

function onMouseDown(e: MouseEvent) {
  isDragging = true
  const rect = canvasRef.value!.getBoundingClientRect()
  dragLastX = e.clientX - rect.left
  dragLastY = e.clientY - rect.top
  blackHole.x = dragLastX
  blackHole.y = dragLastY
}

function onMouseUp() { isDragging = false }

function onTouchStart(e: TouchEvent) {
  const rect = canvasRef.value!.getBoundingClientRect()
  const t = e.touches[0]
  dragLastX = t.clientX - rect.left
  dragLastY = t.clientY - rect.top
  isDragging = true
}

function onTouchMove(e: TouchEvent) {
  const rect = canvasRef.value!.getBoundingClientRect()
  const t = e.touches[0]
  blackHole.x = t.clientX - rect.left
  blackHole.y = t.clientY - rect.top
  dragLastX = blackHole.x
  dragLastY = blackHole.y
}

function onTouchEnd() { isDragging = false }

function togglePause() { isPaused.value = !isPaused.value }

function clearParticles() { particles.length = 0 }

function shootParticle() {
  const cx = blackHole.x + (Math.random() - 0.5) * 300
  const cy = blackHole.y + (Math.random() - 0.5) * 300
  for (let i = 0; i < 30; i++) {
    if (particles.length >= MAX_PARTICLES) break
    const angle = Math.random() * Math.PI * 2
    const speed = 1 + Math.random() * 3
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 1 + Math.random() * 2.5,
      opacity: 0.7 + Math.random() * 0.3,
      hue: Math.random() < 0.5 ? 15 + Math.random() * 20 : 195 + Math.random() * 30,
      trail: [],
      dead: false,
      isJet: false,
    })
  }
}

function setMass(level: number) {
  massLevel.value = level
  blackHole.mass = level
  blackHole.radius = 28 + level * 8
  blackHole.accretionRadius = 80 + level * 20
}
</script>

<template>
  <div class="relative min-h-screen bg-bg-deep overflow-hidden font-body select-none">

    <canvas
      ref="canvasRef"
      class="absolute inset-0 w-full h-full cursor-crosshair"
    />

    <div class="absolute top-4 left-4 z-10 flex flex-col gap-2 animate-fade-up">
      <div class="border border-border-default bg-bg-surface/80 backdrop-blur-sm px-4 py-3">
        <div class="flex items-center gap-2 mb-0.5">
          <span class="font-display text-xs tracking-widest text-accent-coral">// VŨ TRỤ</span>
        </div>
        <h1 class="font-display text-2xl font-bold text-text-primary leading-tight">Hố Đen</h1>
        <p class="text-text-dim text-xs mt-0.5 font-display tracking-wide">GRAVITY SIMULATOR</p>
      </div>

      <div class="border border-border-default bg-bg-surface/80 backdrop-blur-sm px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-1">
        <div>
          <div class="text-text-dim text-xs font-display tracking-widest">HẠT</div>
          <div class="text-accent-amber font-display text-lg font-semibold">{{ particleCount }}</div>
        </div>
        <div>
          <div class="text-text-dim text-xs font-display tracking-widest">GẦN</div>
          <div class="text-accent-sky font-display text-lg font-semibold">{{ closestParticle }}<span class="text-xs">px</span></div>
        </div>
        <div>
          <div class="text-text-dim text-xs font-display tracking-widest">FPS</div>
          <div
            class="font-display text-lg font-semibold"
            :class="fpsDisplay >= 50 ? 'text-accent-coral' : fpsDisplay >= 30 ? 'text-accent-amber' : 'text-red-400'"
          >{{ fpsDisplay }}</div>
        </div>
      </div>
    </div>

    <div class="absolute top-4 right-4 z-10 animate-fade-up animate-delay-2">
      <div class="bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-3 inline-block">
        INTERACTIVE
      </div>
    </div>

    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 animate-fade-up animate-delay-3 w-max">
      <div class="flex flex-col gap-2 border border-border-default bg-bg-surface/90 backdrop-blur-sm px-4 py-3">
        <div class="flex gap-2 items-center">
          <button
            @click="togglePause"
            class="flex items-center gap-2 px-4 py-2 border font-display text-xs tracking-widest transition-all duration-200"
            :class="isPaused
              ? 'border-accent-coral text-accent-coral bg-accent-coral/10 hover:bg-accent-coral/20'
              : 'border-border-default text-text-secondary hover:border-accent-coral hover:text-text-primary'"
          >
            {{ isPaused ? '▶ TIẾP TỤC' : '⏸ TẠM DỪNG' }}
          </button>
          <button
            @click="shootParticle"
            class="px-4 py-2 border border-border-default text-text-secondary font-display text-xs tracking-widest transition-all duration-200 hover:border-accent-amber hover:text-accent-amber"
          >
            ✦ PHÓNG HẠT
          </button>
          <button
            @click="clearParticles"
            class="px-4 py-2 border border-border-default text-text-secondary font-display text-xs tracking-widest transition-all duration-200 hover:border-accent-sky hover:text-accent-sky"
          >
            ✕ XÓA
          </button>
        </div>
        <div class="flex items-center gap-3">
          <span class="font-display text-xs tracking-widest text-text-dim">KHỐI LƯỢNG</span>
          <div class="flex gap-1.5">
            <button
              v-for="n in 4"
              :key="n"
              @click="setMass(n)"
              class="w-7 h-7 font-display text-xs border transition-all duration-200"
              :class="massLevel === n
                ? 'border-accent-coral bg-accent-coral/20 text-accent-coral'
                : 'border-border-default text-text-dim hover:border-accent-coral hover:text-text-secondary'"
            >
              {{ n }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 text-center animate-fade-up animate-delay-4 pointer-events-none">
      <p class="text-text-dim text-xs font-display tracking-wide">
        CLICK &amp; KÉO để di chuyển hố đen • PHÓNG HẠT để tạo vụ nổ
      </p>
    </div>

    <div class="absolute bottom-4 right-4 z-10 animate-fade-up animate-delay-5">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface/80 backdrop-blur-sm px-4 py-2 text-xs text-text-secondary font-display tracking-widest transition-all duration-200 hover:border-accent-coral hover:text-text-primary"
      >
        ← TRANG CHỦ
      </RouterLink>
    </div>

    <div class="hidden lg:block absolute top-1/2 -translate-y-1/2 right-4 z-10 w-52 animate-fade-up animate-delay-3">
      <div class="border border-border-default bg-bg-surface/75 backdrop-blur-sm p-4 flex flex-col gap-3">
        <h2 class="font-display text-xs tracking-widest text-accent-coral flex items-center gap-2">
          <span>//</span> VẬT LÝ
        </h2>
        <div class="flex flex-col gap-2">
          <div class="border-l-2 border-accent-coral pl-2">
            <div class="text-text-dim text-xs font-display tracking-wide mb-0.5">LỰC HẤP DẪN</div>
            <div class="text-text-secondary text-xs leading-snug">F = G·m·M / r²</div>
          </div>
          <div class="border-l-2 border-accent-amber pl-2">
            <div class="text-text-dim text-xs font-display tracking-wide mb-0.5">ĐĨA BỒI TỤ</div>
            <div class="text-text-secondary text-xs leading-snug">Vật chất xoáy quanh chân trời sự kiện</div>
          </div>
          <div class="border-l-2 border-accent-sky pl-2">
            <div class="text-text-dim text-xs font-display tracking-wide mb-0.5">TIA JET TƯƠNG ĐỐI TÍNH</div>
            <div class="text-text-secondary text-xs leading-snug">Plasma phun ra theo trục từ trường</div>
          </div>
          <div class="border-l-2 border-border-default pl-2">
            <div class="text-text-dim text-xs font-display tracking-wide mb-0.5">BỨC XẠ HAWKING</div>
            <div class="text-text-secondary text-xs leading-snug">Hạt lượng tử thoát khỏi chân trời</div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
