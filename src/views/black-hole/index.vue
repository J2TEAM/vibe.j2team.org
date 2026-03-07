<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

interface Particle {
  x: number; y: number; vx: number; vy: number
  radius: number; opacity: number; hue: number
  trail: { x: number; y: number }[]
  dead: boolean; isJet: boolean
}

interface BlackHole {
  x: number; y: number; mass: number; radius: number; accretionRadius: number
}

interface Ring {
  x: number; y: number; radius: number; life: number
  r: number; g: number; b: number; speed: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isPaused = ref(false)
const particleCount = ref(0)
const closestParticle = ref(0)
const fpsDisplay = ref(60)
const isVortex = ref(false)

const massSlider = ref(1)
const speedSlider = ref(1)
const maxParticlesSlider = ref(350)

const massFill = () => `${((massSlider.value - 1) / 7) * 100}%`
const speedFill = () => `${((speedSlider.value - 0.25) / 2.75) * 100}%`
const pFill = () => `${((maxParticlesSlider.value - 50) / 450) * 100}%`

let ctx: CanvasRenderingContext2D | null = null
let animId: number | null = null
let W = 0; let H = 0

const G = 6000
const TRAIL_LENGTH = 22

const blackHole: BlackHole = { x: 0, y: 0, mass: 1, radius: 36, accretionRadius: 100 }
const particles: Particle[] = []
const rings: Ring[] = []

let starBitmap: ImageBitmap | null = null
let isDragging = false
let diskAngle = 0; let time = 0
let lastFrameTime = 0; let frameCount = 0; let fpsTimer = 0
let gravWaveTimer = 0
let simFrameSkip = 0

watch(massSlider, (val) => {
  blackHole.mass = val
  blackHole.radius = 20 + val * 5
  blackHole.accretionRadius = 65 + val * 18
})

onMounted(async () => {
  const canvas = canvasRef.value!
  ctx = canvas.getContext('2d')!
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  resize()
  window.addEventListener('resize', resize)
  canvas.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('mousedown', onMouseDown)
  canvas.addEventListener('mouseup', onMouseUp)
  canvas.addEventListener('touchstart', onTouchStart, { passive: true })
  canvas.addEventListener('touchmove', onTouchMove, { passive: true })
  canvas.addEventListener('touchend', onTouchEnd, { passive: true })
  await buildBackground()
  loop(0)
})

onUnmounted(() => {
  if (animId !== null) cancelAnimationFrame(animId)
  window.removeEventListener('resize', resize)
  if (ctx) { ctx.clearRect(0, 0, W, H); ctx = null }
})

function resize() {
  const canvas = canvasRef.value!
  W = canvas.width = canvas.offsetWidth
  H = canvas.height = canvas.offsetHeight
  blackHole.x = W / 2
  blackHole.y = H / 2
  buildBackground()
}

async function buildBackground() {
  if (!W || !H) return
  const off = new OffscreenCanvas(W, H)
  const octx = off.getContext('2d')!
  octx.fillStyle = '#0F1923'
  octx.fillRect(0, 0, W, H)

  const nebulae = [
    { x: W * 0.15, y: H * 0.2,  r: W * 0.45, cr: 80,  cg: 30,  cb: 15,  a: 0.22 },
    { x: W * 0.85, y: H * 0.75, r: W * 0.40, cr: 20,  cg: 60,  cb: 100, a: 0.18 },
    { x: W * 0.5,  y: H * 0.9,  r: W * 0.35, cr: 100, cg: 55,  cb: 10,  a: 0.14 },
    { x: W * 0.7,  y: H * 0.15, r: W * 0.3,  cr: 15,  cg: 70,  cb: 120, a: 0.12 },
  ]
  for (const n of nebulae) {
    const g = octx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r)
    g.addColorStop(0, `rgba(${n.cr},${n.cg},${n.cb},${n.a})`)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    octx.fillStyle = g
    octx.fillRect(0, 0, W, H)
  }

  const starCount = Math.floor((W * H) / 5000)
  for (let i = 0; i < starCount; i++) {
    const x = Math.random() * W
    const y = Math.random() * H
    const big = Math.random() < 0.06
    const r = big ? 1.2 + Math.random() * 0.8 : 0.4 + Math.random() * 0.4
    const a = big ? 0.5 + Math.random() * 0.5 : 0.1 + Math.random() * 0.5
    const warm = Math.random()
    const c = warm < 0.35 ? `rgba(248,240,220,${a})` : warm < 0.65 ? `rgba(180,215,255,${a})` : `rgba(255,210,170,${a})`
    octx.beginPath()
    octx.arc(x, y, r, 0, Math.PI * 2)
    octx.fillStyle = c
    octx.fill()
    if (big) {
      const sg = octx.createRadialGradient(x, y, 0, x, y, r * 4)
      sg.addColorStop(0, `rgba(220,235,255,${a * 0.4})`)
      sg.addColorStop(1, 'rgba(0,0,0,0)')
      octx.fillStyle = sg
      octx.beginPath()
      octx.arc(x, y, r * 4, 0, Math.PI * 2)
      octx.fill()
    }
  }
  starBitmap = await createImageBitmap(off)
}

function spawnParticle() {
  if (particles.length >= maxParticlesSlider.value) return
  const edge = Math.floor(Math.random() * 4)
  let x = 0, y = 0
  if (edge === 0) { x = Math.random() * W; y = -10 }
  else if (edge === 1) { x = W + 10; y = Math.random() * H }
  else if (edge === 2) { x = Math.random() * W; y = H + 10 }
  else { x = -10; y = Math.random() * H }

  const dx = blackHole.x - x, dy = blackHole.y - y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const tx = -dy / dist, ty = dx / dist
  const speed = 0.4 + Math.random() * 1.2
  const tang = 0.4 + Math.random() * 0.8
  const hue = Math.random() < 0.55 ? 10 + Math.random() * 30 : Math.random() < 0.5 ? 35 + Math.random() * 25 : 195 + Math.random() * 30

  particles.push({
    x, y,
    vx: (dx / dist) * speed + tx * tang,
    vy: (dy / dist) * speed + ty * tang,
    radius: 0.8 + Math.random() * 2,
    opacity: 0.65 + Math.random() * 0.35,
    hue, trail: [], dead: false, isJet: false,
  })
}

function spawnJetParticle() {
  if (particles.length >= maxParticlesSlider.value) return
  const sign = Math.random() < 0.5 ? 1 : -1
  particles.push({
    x: blackHole.x + (Math.random() - 0.5) * blackHole.radius * 0.7,
    y: blackHole.y,
    vx: (Math.random() - 0.5) * 1.0,
    vy: sign * (4 + Math.random() * 3),
    radius: 0.4 + Math.random() * 0.9,
    opacity: 0.45 + Math.random() * 0.4,
    hue: 185 + Math.random() * 30,
    trail: [], dead: false, isJet: true,
  })
}

function spawnHawkingParticle() {
  if (particles.length >= maxParticlesSlider.value) return
  const angle = Math.random() * Math.PI * 2
  const r = blackHole.radius + 2
  const speed = 0.9 + Math.random() * 1.3
  particles.push({
    x: blackHole.x + Math.cos(angle) * r,
    y: blackHole.y + Math.sin(angle) * r,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 0.35 + Math.random() * 0.55,
    opacity: 0.35 + Math.random() * 0.3,
    hue: 45 + Math.random() * 40,
    trail: [], dead: false, isJet: false,
  })
}

function simulate(speed: number) {
  const gDir = isVortex.value ? -1 : 1

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    if (!p || p.dead) { particles.splice(i, 1); continue }

    const dx = blackHole.x - p.x, dy = blackHole.y - p.y
    const distSq = dx * dx + dy * dy
    const dist = Math.sqrt(distSq)

    if (!isVortex.value && dist < blackHole.radius - 4) {
      p.dead = true
      if (rings.length < 16) {
        rings.push({ x: p.x, y: p.y, radius: blackHole.radius * 0.8, life: 1, r: 255, g: 120, b: 60, speed: 2.5 })
      }
      continue
    }

    if (!p.isJet) {
      const acc = (G * blackHole.mass * gDir * speed) / distSq
      p.vx += (dx / dist) * acc
      p.vy += (dy / dist) * acc
      p.vx *= 0.999
      p.vy *= 0.999
    }

    p.trail.push({ x: p.x, y: p.y })
    if (p.trail.length > TRAIL_LENGTH) p.trail.shift()

    p.x += p.vx * speed
    p.y += p.vy * speed

    if (p.x < -250 || p.x > W + 250 || p.y < -250 || p.y > H + 250) p.dead = true
  }

  for (let i = rings.length - 1; i >= 0; i--) {
    const ring = rings[i]
    if (!ring) continue
    ring.life -= 0.04 * speed
    ring.radius += ring.speed * speed
    if (ring.life <= 0) rings.splice(i, 1)
  }

  gravWaveTimer += speed
  if (gravWaveTimer > 160) {
    gravWaveTimer = 0
    if (rings.length < 16)
      rings.push({ x: blackHole.x, y: blackHole.y, radius: blackHole.radius * 1.2, life: 1, r: 255, g: 184, b: 48, speed: 1.8 })
  }
}

function draw(now: number) {
  if (!ctx) return

  frameCount++
  fpsTimer += now - lastFrameTime
  lastFrameTime = now
  if (fpsTimer >= 600) {
    fpsDisplay.value = Math.round(frameCount / (fpsTimer / 1000))
    frameCount = 0; fpsTimer = 0
  }

  if (starBitmap) { ctx.globalAlpha = 1; ctx.drawImage(starBitmap, 0, 0) }
  else { ctx.fillStyle = '#0F1923'; ctx.fillRect(0, 0, W, H) }

  ctx.fillStyle = 'rgba(15,25,35,0.72)'
  ctx.fillRect(0, 0, W, H)

  drawRings()
  drawBlackHole()
  drawParticles()

  const ss = speedSlider.value
  diskAngle += 0.008 * ss
  time += 0.03 * ss
}

function drawRings() {
  if (!ctx) return
  for (const rg of rings) {
    ctx.beginPath()
    ctx.arc(rg.x, rg.y, rg.radius, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(${rg.r},${rg.g},${rg.b},${rg.life * 0.55})`
    ctx.lineWidth = 1.5 * rg.life
    ctx.stroke()
  }
}

function drawBlackHole() {
  if (!ctx) return
  const bh = blackHole
  const pulse = 1 + 0.06 * Math.sin(time * 1.5)

  const outerGlow = ctx.createRadialGradient(bh.x, bh.y, bh.radius, bh.x, bh.y, bh.accretionRadius * 3 * pulse)
  outerGlow.addColorStop(0,   'rgba(255,107,74,0.18)')
  outerGlow.addColorStop(0.35,'rgba(255,184,48,0.09)')
  outerGlow.addColorStop(0.7, 'rgba(56,189,248,0.05)')
  outerGlow.addColorStop(1,   'rgba(0,0,0,0)')
  ctx.beginPath()
  ctx.arc(bh.x, bh.y, bh.accretionRadius * 3 * pulse, 0, Math.PI * 2)
  ctx.fillStyle = outerGlow
  ctx.fill()

  drawOuterDisk(bh, pulse)
  drawInnerDisk(bh, pulse)

  const lensR = bh.radius * 2.1
  for (let arc = 0; arc < 4; arc++) {
    const alpha = (0.40 - arc * 0.08) * pulse
    const gr = lensR + arc * 5
    const lg = ctx.createRadialGradient(bh.x, bh.y, gr - 2.5, bh.x, bh.y, gr + 2.5)
    lg.addColorStop(0, 'rgba(255,107,74,0)')
    lg.addColorStop(0.5, `rgba(255,230,160,${alpha})`)
    lg.addColorStop(1, 'rgba(255,107,74,0)')
    ctx.beginPath()
    ctx.arc(bh.x, bh.y, gr, 0, Math.PI * 2)
    ctx.strokeStyle = lg
    ctx.lineWidth = 5 - arc * 1
    ctx.stroke()
  }

  const sg = ctx.createRadialGradient(bh.x - bh.radius * 0.28, bh.y - bh.radius * 0.28, 0, bh.x, bh.y, bh.radius)
  sg.addColorStop(0, '#0b1018')
  sg.addColorStop(1, '#000000')
  ctx.beginPath()
  ctx.arc(bh.x, bh.y, bh.radius, 0, Math.PI * 2)
  ctx.fillStyle = sg
  ctx.fill()

  const rim = ctx.createRadialGradient(bh.x, bh.y, bh.radius - 3, bh.x, bh.y, bh.radius + 10)
  rim.addColorStop(0, `rgba(255,140,60,${0.5 * pulse})`)
  rim.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.beginPath()
  ctx.arc(bh.x, bh.y, bh.radius + 10, 0, Math.PI * 2)
  ctx.fillStyle = rim
  ctx.fill()
}

function drawOuterDisk(bh: BlackHole, pulse: number) {
  if (!ctx) return
  const rx = bh.accretionRadius * 1.55 * pulse
  const ry = rx * 0.18
  ctx.save()
  ctx.translate(bh.x, bh.y)
  ctx.rotate(diskAngle)
  for (let pass = 0; pass < 2; pass++) {
    const flip = pass === 0 ? 1 : -1
    ctx.save()
    ctx.scale(1, flip * ry / rx)
    ctx.beginPath()
    const g = ctx.createLinearGradient(-rx, 0, rx, 0)
    g.addColorStop(0,    'rgba(255,107,74,0)')
    g.addColorStop(0.25, 'rgba(255,184,48,0.88)')
    g.addColorStop(0.5,  'rgba(255,242,200,0.96)')
    g.addColorStop(0.75, 'rgba(255,107,74,0.82)')
    g.addColorStop(1,    'rgba(255,107,74,0)')
    ctx.arc(0, 0, rx, 0, Math.PI)
    ctx.strokeStyle = g
    ctx.lineWidth = 11 + 4 * Math.sin(time * 2.3 + pass)
    ctx.shadowColor = 'rgba(255,184,48,0.55)'
    ctx.shadowBlur = 20
    ctx.stroke()
    ctx.shadowBlur = 0
    ctx.restore()
  }
  ctx.restore()
}

function drawInnerDisk(bh: BlackHole, pulse: number) {
  if (!ctx) return
  const rx = bh.radius * 2.1 * pulse
  const ry = rx * 0.14
  ctx.save()
  ctx.translate(bh.x, bh.y)
  ctx.rotate(-diskAngle * 1.8)
  for (let pass = 0; pass < 2; pass++) {
    const flip = pass === 0 ? 1 : -1
    ctx.save()
    ctx.scale(1, flip * ry / rx)
    ctx.beginPath()
    const g = ctx.createLinearGradient(-rx, 0, rx, 0)
    g.addColorStop(0,   'rgba(80,200,255,0)')
    g.addColorStop(0.3, 'rgba(180,230,255,0.75)')
    g.addColorStop(0.5, 'rgba(255,255,255,0.95)')
    g.addColorStop(0.7, 'rgba(180,230,255,0.75)')
    g.addColorStop(1,   'rgba(80,200,255,0)')
    ctx.arc(0, 0, rx, 0, Math.PI)
    ctx.strokeStyle = g
    ctx.lineWidth = 5 + 2 * Math.sin(time * 4 + pass * 1.5)
    ctx.shadowColor = 'rgba(150,220,255,0.8)'
    ctx.shadowBlur = 14
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
    const dx = blackHole.x - p.x, dy = blackHole.y - p.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < minDist) minDist = dist

    const proximity = Math.max(0, 1 - dist / (blackHole.accretionRadius * 2.2))
    const glowFactor = 1 + proximity * 2.5
    const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
    const sat = p.isJet ? 88 : Math.max(25, 92 - spd * 5)
    const lig = p.isJet ? Math.min(94, 66 + spd * 3) : Math.min(92, 52 + spd * 7)
    const trailAlpha = p.isJet ? 0.3 : 0.12 + proximity * 0.45

    for (let t = 1; t < p.trail.length; t++) {
      const a = p.trail[t - 1]
      const b = p.trail[t]
      if (!a || !b) continue
      const tFade = t / p.trail.length
      const opacity = tFade * p.opacity * trailAlpha
      if (opacity < 0.015) continue
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.strokeStyle = `hsla(${p.hue},${sat}%,${lig}%,${opacity})`
      ctx.lineWidth = Math.max(0.4, p.radius * tFade * (p.isJet ? 0.7 : 0.9))
      ctx.stroke()
    }

    const gs = p.radius * glowFactor
    if (proximity > 0.4 || p.isJet) {
      ctx.shadowColor = `hsl(${p.hue},${sat}%,${lig}%)`
      ctx.shadowBlur = p.isJet ? 7 : gs * 3
    }
    ctx.beginPath()
    ctx.arc(p.x, p.y, Math.max(0.5, gs), 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${p.hue},${sat}%,${lig}%,${p.opacity})`
    ctx.fill()

    if (proximity > 0.6 && !p.isJet) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, Math.max(0.3, gs * 0.35), 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${proximity * 0.7})`
      ctx.fill()
    }
    ctx.shadowBlur = 0
  }

  closestParticle.value = Math.round(minDist === Infinity ? 0 : minDist)
  particleCount.value = particles.length
}

function loop(now: number) {
  if (!isPaused.value) {
    const ss = speedSlider.value

    if (ss < 1) {
      simFrameSkip++
      if (simFrameSkip >= 2) {
        simFrameSkip = 0
        spawnParticle(); spawnParticle()
        if (Math.random() < 0.2) spawnJetParticle()
        if (Math.random() < 0.03) spawnHawkingParticle()
        simulate(ss)
      }
    } else {
      const steps = Math.round(ss)
      for (let s = 0; s < steps; s++) {
        spawnParticle(); spawnParticle()
        if (Math.random() < 0.2) spawnJetParticle()
        if (Math.random() < 0.03) spawnHawkingParticle()
        simulate(1)
      }
    }
    draw(now)
  } else {
    lastFrameTime = now
  }
  animId = requestAnimationFrame(loop)
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging) return
  const r = canvasRef.value!.getBoundingClientRect()
  blackHole.x = e.clientX - r.left
  blackHole.y = e.clientY - r.top
}

function onMouseDown(e: MouseEvent) {
  isDragging = true
  const r = canvasRef.value!.getBoundingClientRect()
  blackHole.x = e.clientX - r.left
  blackHole.y = e.clientY - r.top
}

function onMouseUp() { isDragging = false }

function onTouchStart(e: TouchEvent) {
  const t = e.touches[0]
  if (!t) return
  isDragging = true
  const r = canvasRef.value!.getBoundingClientRect()
  blackHole.x = t.clientX - r.left
  blackHole.y = t.clientY - r.top
}

function onTouchMove(e: TouchEvent) {
  const t = e.touches[0]
  if (!t) return
  const r = canvasRef.value!.getBoundingClientRect()
  blackHole.x = t.clientX - r.left
  blackHole.y = t.clientY - r.top
}

function onTouchEnd() { isDragging = false }
function togglePause() { isPaused.value = !isPaused.value }
function clearParticles() { particles.length = 0; rings.length = 0 }
function toggleVortex() { isVortex.value = !isVortex.value }

function tidalFlare() {
  const angle = Math.random() * Math.PI * 2
  const dist = blackHole.accretionRadius * 2.5
  const cx = blackHole.x + Math.cos(angle) * dist
  const cy = blackHole.y + Math.sin(angle) * dist
  for (let i = 0; i < 55; i++) {
    if (particles.length >= maxParticlesSlider.value) break
    const dx = blackHole.x - cx, dy = blackHole.y - cy
    const d = Math.sqrt(dx * dx + dy * dy)
    const speed = 0.6 + Math.random() * 1.8
    particles.push({
      x: cx + (Math.random() - 0.5) * 30,
      y: cy + (Math.random() - 0.5) * 30,
      vx: (dx / d) * speed + (Math.random() - 0.5) * 2.5,
      vy: (dy / d) * speed + (Math.random() - 0.5) * 2.5,
      radius: 1.2 + Math.random() * 2.8,
      opacity: 0.75 + Math.random() * 0.25,
      hue: Math.random() < 0.6 ? 15 + Math.random() * 25 : 50 + Math.random() * 30,
      trail: [], dead: false, isJet: false,
    })
  }
  if (rings.length < 16)
    rings.push({ x: cx, y: cy, radius: 5, life: 1, r: 255, g: 160, b: 60, speed: 4 })
}

function saveScreenshot() {
  canvasRef.value!.toBlob(blob => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'blackhole.png'; a.click()
    URL.revokeObjectURL(url)
  })
}
</script>

<template>
  <div class="relative min-h-screen bg-bg-deep overflow-hidden font-body select-none">

    <canvas ref="canvasRef" class="absolute inset-0 w-full h-full cursor-crosshair" />

    <div class="absolute top-4 left-4 z-10 flex flex-col gap-2 animate-fade-up">
      <div class="hud-panel px-4 py-3">
        <span class="font-display text-xs tracking-widest text-accent-coral">// VŨ TRỤ</span>
        <h1 class="font-display text-2xl font-bold text-text-primary leading-tight mt-0.5">Hố Đen</h1>
        <p class="text-text-dim text-xs font-display tracking-wide">GRAVITY SIMULATOR</p>
      </div>

      <div class="hud-panel px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-0.5">
        <div>
          <div class="stat-label">HẠT</div>
          <div class="stat-value text-accent-amber tabular-nums w-12">{{ particleCount }}</div>
        </div>
        <div>
          <div class="stat-label">GẦN</div>
          <div class="stat-value text-accent-sky tabular-nums w-12">{{ closestParticle }}</div>
        </div>
        <div>
          <div class="stat-label">FPS</div>
          <div
            class="stat-value tabular-nums w-12"
            :class="fpsDisplay >= 50 ? 'text-accent-coral' : fpsDisplay >= 30 ? 'text-accent-amber' : 'text-red-400'"
          >{{ fpsDisplay }}</div>
        </div>
      </div>

      <div v-if="isVortex" class="hud-panel px-4 py-2 border-accent-sky/50 animate-pulse-border">
        <span class="font-display text-xs tracking-widest text-accent-sky">⟲ VORTEX ACTIVE</span>
      </div>
    </div>

    <div class="absolute top-4 right-4 z-10 animate-fade-up animate-delay-2">
      <div class="bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-3 inline-block shadow-lg shadow-accent-coral/30">
        INTERACTIVE
      </div>
    </div>

    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 animate-fade-up animate-delay-3 w-max">
      <div class="control-panel">
        <div class="flex gap-1.5 items-center flex-wrap justify-center pb-3 border-b border-border-default mb-3">
          <button class="ctrl-btn" :class="isPaused ? 'ctrl-btn--coral active' : 'ctrl-btn--ghost'" @click="togglePause">
            {{ isPaused ? '▶ TIẾP TỤC' : '⏸ DỪNG' }}
          </button>
          <button class="ctrl-btn ctrl-btn--ghost hover:border-accent-amber hover:text-accent-amber" @click="tidalFlare">
            ✦ TIDAL FLARE
          </button>
          <button class="ctrl-btn" :class="isVortex ? 'ctrl-btn--sky active' : 'ctrl-btn--ghost hover:border-accent-sky hover:text-accent-sky'" @click="toggleVortex">
            ⟲ VORTEX
          </button>
          <button class="ctrl-btn ctrl-btn--ghost hover:border-accent-sky hover:text-accent-sky" @click="clearParticles">✕ XÓA</button>
          <button class="ctrl-btn ctrl-btn--ghost hover:border-accent-coral hover:text-accent-coral" @click="saveScreenshot">⬇ LƯU</button>
        </div>

        <div class="flex flex-col gap-3 min-w-80">
          <div class="slider-row">
            <span class="slider-label">KÍCH THƯỚC</span>
            <input
              v-model.number="massSlider"
              type="range" min="1" max="8" step="1"
              class="slider slider--coral"
              :style="{ '--fill': massFill() }"
            />
            <span class="slider-value text-accent-coral">{{ massSlider }}</span>
          </div>

          <div class="slider-row">
            <span class="slider-label">SỐ HẠT TỐI ĐA</span>
            <input
              v-model.number="maxParticlesSlider"
              type="range" min="50" max="500" step="50"
              class="slider slider--amber"
              :style="{ '--fill': pFill() }"
            />
            <span class="slider-value text-accent-amber">{{ maxParticlesSlider }}</span>
          </div>

          <div class="slider-row">
            <span class="slider-label">TỐC ĐỘ</span>
            <input
              v-model.number="speedSlider"
              type="range" min="0.25" max="3" step="0.25"
              class="slider slider--sky"
              :style="{ '--fill': speedFill() }"
            />
            <span class="slider-value text-accent-sky">{{ speedSlider }}×</span>
          </div>
        </div>
      </div>
    </div>

    <div class="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none animate-fade-up animate-delay-4">
      <p class="text-text-dim text-xs font-display tracking-wide">
        CLICK &amp; KÉO để di chuyển hố đen
      </p>
    </div>

    <div class="absolute bottom-4 right-4 z-10 animate-fade-up animate-delay-5">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface/80 backdrop-blur-sm px-4 py-2 text-xs text-text-secondary font-display tracking-widest transition-all duration-200 hover:border-accent-coral hover:text-text-primary"
      >← TRANG CHỦ</RouterLink>
    </div>

    <div class="hidden lg:block absolute top-1/2 -translate-y-1/2 right-4 z-10 w-52 animate-fade-up animate-delay-3">
      <div class="hud-panel p-4 flex flex-col gap-3">
        <h2 class="font-display text-xs tracking-widest text-accent-coral flex items-center gap-2">
          <span>//</span> VẬT LÝ
        </h2>
        <div class="flex flex-col gap-2.5">
          <div class="border-l-2 border-accent-coral pl-2">
            <div class="stat-label mb-0.5">LỰC HẤP DẪN</div>
            <div class="text-text-secondary text-xs leading-snug">F = G·m·M / r²</div>
          </div>
          <div class="border-l-2 border-accent-amber pl-2">
            <div class="stat-label mb-0.5">ĐĨA BỒI TỤ KÉP</div>
            <div class="text-text-secondary text-xs leading-snug">Đĩa ngoài (amber) + đĩa trong nóng hơn (cyan)</div>
          </div>
          <div class="border-l-2 border-accent-sky pl-2">
            <div class="stat-label mb-0.5">TIA JET + HAWKING</div>
            <div class="text-text-secondary text-xs leading-snug">Plasma phun ra & hạt lượng tử thoát khỏi chân trời</div>
          </div>
          <div class="border-l-2 border-border-default pl-2">
            <div class="stat-label mb-0.5">SÓNG HẤP DẪN</div>
            <div class="text-text-secondary text-xs leading-snug">Gợn không-thời gian lan tỏa ra ngoài</div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.hud-panel {
  border: 1px solid var(--color-border-default);
  background: rgba(22, 34, 50, 0.82);
  backdrop-filter: blur(10px);
}

.control-panel {
  border: 1px solid var(--color-border-default);
  background: rgba(22, 34, 50, 0.92);
  backdrop-filter: blur(14px);
  padding: 1rem 1.25rem;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.stat-label {
  font-family: var(--font-display);
  font-size: 0.65rem;
  letter-spacing: 0.12em;
  color: var(--color-text-dim);
}

.stat-value {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.3;
}

.ctrl-btn {
  font-family: var(--font-display);
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  padding: 0.4rem 0.75rem;
  border: 1px solid;
  transition: all 0.18s ease;
  cursor: pointer;
  background: transparent;
}

.ctrl-btn--ghost {
  border-color: var(--color-border-default);
  color: var(--color-text-secondary);
}

.ctrl-btn--ghost:hover {
  color: var(--color-text-primary);
}

.ctrl-btn--coral {
  border-color: var(--color-accent-coral);
  color: var(--color-accent-coral);
  background: rgba(255, 107, 74, 0.10);
}

.ctrl-btn--coral:hover, .ctrl-btn--coral.active {
  background: rgba(255, 107, 74, 0.18);
}

.ctrl-btn--sky {
  border-color: var(--color-accent-sky);
  color: var(--color-accent-sky);
  background: rgba(56, 189, 248, 0.10);
}

.ctrl-btn--sky:hover, .ctrl-btn--sky.active {
  background: rgba(56, 189, 248, 0.18);
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.slider-label {
  font-family: var(--font-display);
  font-size: 0.6rem;
  letter-spacing: 0.12em;
  color: var(--color-text-dim);
  min-width: 6.5rem;
}

.slider-value {
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 2.5rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.slider {
  -webkit-appearance: none;
  appearance: none;
  flex: 1;
  height: 3px;
  background: linear-gradient(to right, var(--thumb-color) var(--fill), var(--color-border-default) var(--fill));
  outline: none;
  cursor: pointer;
  transition: height 0.15s ease;
}

.slider:hover {
  height: 4px;
}

.slider--coral { --thumb-color: #FF6B4A; }
.slider--amber { --thumb-color: #FFB830; }
.slider--sky   { --thumb-color: #38BDF8; }

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: var(--thumb-color);
  border: 2px solid #0F1923;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 0 8px color-mix(in srgb, var(--thumb-color) 60%, transparent);
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.3);
  box-shadow: 0 0 16px color-mix(in srgb, var(--thumb-color) 80%, transparent);
}

.slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: var(--thumb-color);
  border: 2px solid #0F1923;
  border-radius: 0;
  cursor: pointer;
  box-shadow: 0 0 8px color-mix(in srgb, var(--thumb-color) 60%, transparent);
}

.slider::-moz-range-progress {
  background: var(--thumb-color);
  height: 3px;
}
</style>
