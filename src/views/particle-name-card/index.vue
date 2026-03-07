<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { RouterLink } from 'vue-router'

// --- Types ---
interface Particle {
  x: number
  y: number
  tx: number
  ty: number
  vx: number
  vy: number
  size: number
  hue: number
  alpha: number
  baseSize: number
}

interface AmbientParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  hue: number
  pulse: number
  pulseSpeed: number
}

interface ClickBurst {
  x: number
  y: number
  particles: Array<{
    x: number
    y: number
    vx: number
    vy: number
    life: number
    maxLife: number
    size: number
    hue: number
  }>
}

// --- Color Themes ---
const COLOR_THEMES = {
  coral: {
    name: 'Lửa',
    colors: [
      { r: 255, g: 107, b: 74 },
      { r: 255, g: 184, b: 48 },
      { r: 56, g: 189, b: 248 },
    ],
    icon: '🔥',
  },
  neon: {
    name: 'Neon',
    colors: [
      { r: 0, g: 255, b: 136 },
      { r: 0, g: 200, b: 255 },
      { r: 180, g: 0, b: 255 },
    ],
    icon: '💚',
  },
  sunset: {
    name: 'Hoàng hôn',
    colors: [
      { r: 255, g: 50, b: 80 },
      { r: 255, g: 120, b: 50 },
      { r: 255, g: 200, b: 80 },
    ],
    icon: '🌅',
  },
  ice: {
    name: 'Băng',
    colors: [
      { r: 100, g: 200, b: 255 },
      { r: 200, g: 230, b: 255 },
      { r: 150, g: 100, b: 255 },
    ],
    icon: '❄️',
  },
  gold: {
    name: 'Vàng',
    colors: [
      { r: 255, g: 215, b: 0 },
      { r: 255, g: 170, b: 50 },
      { r: 255, g: 240, b: 150 },
    ],
    icon: '✨',
  },
} as const

type ThemeKey = keyof typeof COLOR_THEMES

// --- Refs ---
const canvasRef = ref<HTMLCanvasElement | null>(null)
const nameInput = ref('J2TEAM')
const particleSize = ref(2)
const particleDensity = ref(3)
const mouseRadius = ref(80)
const isExporting = ref(false)
const showConstellations = ref(true)
const currentTheme = ref<ThemeKey>('coral')
const mouseMode = ref<'repel' | 'attract'>('repel')

// --- State ---
let ctx: CanvasRenderingContext2D | null = null
let particles: Particle[] = []
let ambientParticles: AmbientParticle[] = []
const clickBursts: ClickBurst[] = []
const mouse = { x: -9999, y: -9999, pressed: false }
const cursorTrail: Array<{ x: number; y: number; alpha: number }> = []
let animFrame = 0
let canvasWidth = 0
let canvasHeight = 0
let dpr = 1
let frameCount = 0

const BG = { r: 15, g: 25, b: 35 }

function getThemeColors() {
  return COLOR_THEMES[currentTheme.value].colors
}

function getParticleColor(hue: number, alpha: number = 1): string {
  const colors = getThemeColors()
  let r: number, g: number, b: number

  if (hue < 0.5) {
    const t = hue * 2
    r = Math.round(colors[0].r + (colors[1].r - colors[0].r) * t)
    g = Math.round(colors[0].g + (colors[1].g - colors[0].g) * t)
    b = Math.round(colors[0].b + (colors[1].b - colors[0].b) * t)
  } else {
    const t = (hue - 0.5) * 2
    r = Math.round(colors[1].r + (colors[2].r - colors[1].r) * t)
    g = Math.round(colors[1].g + (colors[2].g - colors[1].g) * t)
    b = Math.round(colors[1].b + (colors[2].b - colors[1].b) * t)
  }

  return `rgba(${r},${g},${b},${alpha})`
}

function createAmbientParticles() {
  ambientParticles = []
  const count = Math.min(Math.floor((canvasWidth * canvasHeight) / 8000), 80)
  for (let i = 0; i < count; i++) {
    ambientParticles.push({
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: 1 + Math.random() * 2,
      alpha: 0.1 + Math.random() * 0.25,
      hue: Math.random(),
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.02,
    })
  }
}

function sampleTextPixels(text: string): Array<{ x: number; y: number }> {
  if (!text.trim()) return []

  const offscreen = document.createElement('canvas')
  const offCtx = offscreen.getContext('2d')
  if (!offCtx) return []

  offscreen.width = canvasWidth
  offscreen.height = canvasHeight

  let fontSize = Math.min(canvasWidth / (text.length * 0.55), canvasHeight * 0.4, 200)
  fontSize = Math.max(fontSize, 32)

  offCtx.fillStyle = '#fff'
  offCtx.font = `800 ${fontSize}px "Anybody", sans-serif`
  offCtx.textAlign = 'center'
  offCtx.textBaseline = 'middle'
  offCtx.fillText(text, canvasWidth / 2, canvasHeight / 2 - 30)

  const imageData = offCtx.getImageData(0, 0, canvasWidth, canvasHeight)
  const pixels = imageData.data
  const points: Array<{ x: number; y: number }> = []
  const gap = particleDensity.value

  for (let y = 0; y < canvasHeight; y += gap) {
    for (let x = 0; x < canvasWidth; x += gap) {
      const alphaIndex = (y * canvasWidth + x) * 4 + 3
      if ((pixels[alphaIndex] ?? 0) > 128) {
        points.push({ x, y })
      }
    }
  }

  return points
}

function createParticles(text: string) {
  const points = sampleTextPixels(text)

  particles = points.map((p) => ({
    x: canvasWidth / 2 + (Math.random() - 0.5) * 100,
    y: canvasHeight + Math.random() * 200,
    tx: p.x,
    ty: p.y,
    vx: (Math.random() - 0.5) * 15,
    vy: -Math.random() * 20 - 5,
    size: particleSize.value + Math.random() * 1.5,
    baseSize: particleSize.value + Math.random() * 1.5,
    hue: Math.random(),
    alpha: 0.6 + Math.random() * 0.4,
  }))
}

function createClickBurst(x: number, y: number) {
  const count = 30 + Math.floor(Math.random() * 20)
  const burstParticles = []

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
    const speed = 3 + Math.random() * 8
    burstParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 0.6 + Math.random() * 0.6,
      size: 1 + Math.random() * 3,
      hue: Math.random(),
    })
  }

  clickBursts.push({ x, y, particles: burstParticles })
}

function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  const container = canvas.parentElement
  if (!container) return

  dpr = window.devicePixelRatio || 1
  canvasWidth = container.clientWidth
  canvasHeight = container.clientHeight

  canvas.width = canvasWidth * dpr
  canvas.height = canvasHeight * dpr
  canvas.style.width = `${canvasWidth}px`
  canvas.style.height = `${canvasHeight}px`

  ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.scale(dpr, dpr)
  }

  createParticles(nameInput.value)
  createAmbientParticles()
}

function drawConstellationLines(c: CanvasRenderingContext2D) {
  const maxDist = 50
  const maxDistSq = maxDist * maxDist
  const len = particles.length

  // Only check a subset for performance
  const step = len > 5000 ? 3 : len > 2000 ? 2 : 1

  for (let i = 0; i < len; i += step) {
    const p1 = particles[i]!
    for (let j = i + step; j < len; j += step) {
      const p2 = particles[j]!
      const dx = p1.x - p2.x
      const dy = p1.y - p2.y
      const distSq = dx * dx + dy * dy

      if (distSq < maxDistSq) {
        const alpha = (1 - distSq / maxDistSq) * 0.12
        c.beginPath()
        c.moveTo(p1.x, p1.y)
        c.lineTo(p2.x, p2.y)
        c.strokeStyle = getParticleColor((p1.hue + p2.hue) / 2, alpha)
        c.lineWidth = 0.5
        c.stroke()
      }
    }
  }
}

function drawCursorGlow(c: CanvasRenderingContext2D) {
  if (mouse.x < 0 || mouse.y < 0) return

  // Add to trail
  cursorTrail.unshift({ x: mouse.x, y: mouse.y, alpha: 0.6 })
  if (cursorTrail.length > 20) cursorTrail.pop()

  // Draw trail
  for (let i = cursorTrail.length - 1; i >= 0; i--) {
    const t = cursorTrail[i]!
    t.alpha *= 0.88

    if (t.alpha < 0.01) {
      cursorTrail.splice(i, 1)
      continue
    }

    const radius = 4 + (1 - t.alpha) * 15
    const gradient = c.createRadialGradient(t.x, t.y, 0, t.x, t.y, radius)
    gradient.addColorStop(0, getParticleColor(0.3, t.alpha * 0.5))
    gradient.addColorStop(1, getParticleColor(0.3, 0))
    c.beginPath()
    c.arc(t.x, t.y, radius, 0, Math.PI * 2)
    c.fillStyle = gradient
    c.fill()
  }

  // Main cursor glow
  const glowRadius = mouseRadius.value * 0.5
  const gradient = c.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, glowRadius)
  const modeColor = mouseMode.value === 'attract' ? 0.7 : 0.1
  gradient.addColorStop(0, getParticleColor(modeColor, 0.08))
  gradient.addColorStop(0.5, getParticleColor(modeColor, 0.03))
  gradient.addColorStop(1, getParticleColor(modeColor, 0))
  c.beginPath()
  c.arc(mouse.x, mouse.y, glowRadius, 0, Math.PI * 2)
  c.fillStyle = gradient
  c.fill()
}

function animate() {
  if (!ctx) return
  frameCount++

  // Clear
  ctx.fillStyle = `rgb(${BG.r},${BG.g},${BG.b})`
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // --- Ambient Particles ---
  for (const ap of ambientParticles) {
    ap.x += ap.vx
    ap.y += ap.vy
    ap.pulse += ap.pulseSpeed

    // Wrap around
    if (ap.x < -10) ap.x = canvasWidth + 10
    if (ap.x > canvasWidth + 10) ap.x = -10
    if (ap.y < -10) ap.y = canvasHeight + 10
    if (ap.y > canvasHeight + 10) ap.y = -10

    const pulseAlpha = ap.alpha * (0.5 + 0.5 * Math.sin(ap.pulse))
    ctx.beginPath()
    ctx.arc(ap.x, ap.y, ap.size, 0, Math.PI * 2)
    ctx.fillStyle = getParticleColor(ap.hue, pulseAlpha)
    ctx.fill()
  }

  // --- Cursor glow & trail ---
  drawCursorGlow(ctx)

  // --- Constellation lines ---
  if (showConstellations.value) {
    drawConstellationLines(ctx)
  }

  // --- Main particles ---
  const mRadius = mouseRadius.value
  const mRadiusSq = mRadius * mRadius
  const isAttract = mouseMode.value === 'attract'

  for (const p of particles) {
    // Mouse interaction
    const dx = p.x - mouse.x
    const dy = p.y - mouse.y
    const distSq = dx * dx + dy * dy

    if (distSq < mRadiusSq && distSq > 0) {
      const dist = Math.sqrt(distSq)
      const force = (mRadius - dist) / mRadius
      const angle = Math.atan2(dy, dx)
      const direction = isAttract ? -1 : 1
      p.vx += Math.cos(angle) * force * 8 * direction
      p.vy += Math.sin(angle) * force * 8 * direction
    }

    // Spring back to target
    const springForce = 0.04
    p.vx += (p.tx - p.x) * springForce
    p.vy += (p.ty - p.y) * springForce

    // Damping
    p.vx *= 0.88
    p.vy *= 0.88

    // Update position
    p.x += p.vx
    p.y += p.vy

    // Speed-based effects
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
    const glowAlpha = Math.min(speed / 8, 1)

    // Dynamic size based on speed
    p.size = p.baseSize + glowAlpha * 2

    // Glow layer
    if (glowAlpha > 0.05) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2)
      ctx.fillStyle = getParticleColor(p.hue, glowAlpha * 0.15)
      ctx.fill()
    }

    // Core particle
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fillStyle = getParticleColor(p.hue, p.alpha)
    ctx.fill()

    // Bright center dot for sparkle
    if (speed < 0.5) {
      const sparkle = 0.3 + 0.2 * Math.sin(frameCount * 0.05 + p.hue * 20)
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${sparkle})`
      ctx.fill()
    }
  }

  // --- Click Bursts ---
  for (let bi = clickBursts.length - 1; bi >= 0; bi--) {
    const burst = clickBursts[bi]!
    let allDead = true

    for (const bp of burst.particles) {
      bp.x += bp.vx
      bp.y += bp.vy
      bp.vx *= 0.96
      bp.vy *= 0.96
      bp.life -= 0.02

      if (bp.life > 0) {
        allDead = false
        const a = bp.life * 0.8
        // Glow
        ctx.beginPath()
        ctx.arc(bp.x, bp.y, bp.size * 3, 0, Math.PI * 2)
        ctx.fillStyle = getParticleColor(bp.hue, a * 0.3)
        ctx.fill()
        // Core
        ctx.beginPath()
        ctx.arc(bp.x, bp.y, bp.size, 0, Math.PI * 2)
        ctx.fillStyle = getParticleColor(bp.hue, a)
        ctx.fill()
      }
    }

    if (allDead) clickBursts.splice(bi, 1)
  }

  // --- Scanline ---
  ctx.fillStyle = 'rgba(255,255,255,0.008)'
  const scanY = (frameCount * 1.5) % canvasHeight
  ctx.fillRect(0, scanY, canvasWidth, 2)

  // --- Vignette ---
  const vGradient = ctx.createRadialGradient(
    canvasWidth / 2,
    canvasHeight / 2,
    canvasHeight * 0.3,
    canvasWidth / 2,
    canvasHeight / 2,
    canvasHeight * 0.9,
  )
  vGradient.addColorStop(0, 'rgba(0,0,0,0)')
  vGradient.addColorStop(1, 'rgba(0,0,0,0.4)')
  ctx.fillStyle = vGradient
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  animFrame = requestAnimationFrame(animate)
}

function handleMouseMove(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  mouse.x = e.clientX - rect.left
  mouse.y = e.clientY - rect.top
}

function handleTouchMove(e: TouchEvent) {
  e.preventDefault()
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const touch = e.touches[0]
  if (!touch) return
  mouse.x = touch.clientX - rect.left
  mouse.y = touch.clientY - rect.top
}

function handleMouseLeave() {
  mouse.x = -9999
  mouse.y = -9999
}

function handleTouchEnd() {
  mouse.x = -9999
  mouse.y = -9999
}

function handleCanvasClick(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  createClickBurst(x, y)
}

function handleTouchStart(e: TouchEvent) {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const touch = e.touches[0]
  if (!touch) return
  const x = touch.clientX - rect.left
  const y = touch.clientY - rect.top
  mouse.x = x
  mouse.y = y
  createClickBurst(x, y)
}

function toggleMouseMode() {
  mouseMode.value = mouseMode.value === 'repel' ? 'attract' : 'repel'
}

async function exportPNG() {
  const canvas = canvasRef.value
  if (!canvas) return

  isExporting.value = true
  await nextTick()

  setTimeout(() => {
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `particle-${nameInput.value || 'name'}.png`
      a.click()
      URL.revokeObjectURL(url)
      isExporting.value = false
    }, 'image/png')
  }, 100)
}

// Debounced text update
let updateTimeout: ReturnType<typeof setTimeout>
watch(nameInput, (newVal) => {
  clearTimeout(updateTimeout)
  updateTimeout = setTimeout(() => {
    createParticles(newVal)
  }, 300)
})

watch([particleSize, particleDensity], () => {
  createParticles(nameInput.value)
})

watch(currentTheme, () => {
  // Reassign hues to get fresh colors
  for (const p of particles) {
    p.hue = Math.random()
  }
  for (const ap of ambientParticles) {
    ap.hue = Math.random()
  }
})

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  resizeCanvas()
  animate()

  const container = canvasRef.value?.parentElement
  if (container) {
    resizeObserver = new ResizeObserver(() => {
      resizeCanvas()
    })
    resizeObserver.observe(container)
  }

  window.addEventListener('resize', resizeCanvas)
})

onUnmounted(() => {
  cancelAnimationFrame(animFrame)
  window.removeEventListener('resize', resizeCanvas)
  clearTimeout(updateTimeout)
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>

<template>
  <div class="particle-page min-h-screen bg-bg-deep text-text-primary font-body flex flex-col">
    <!-- Header -->
    <header
      class="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border-default animate-fade-up relative z-10"
    >
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-accent-coral"
      >
        &larr; Về trang chủ
      </RouterLink>
      <div class="font-display text-xs tracking-widest text-accent-coral">// PARTICLE NAME CARD</div>
    </header>

    <!-- Canvas Area -->
    <div class="flex-1 relative overflow-hidden">
      <div class="absolute inset-0">
        <canvas
          ref="canvasRef"
          @mousemove="handleMouseMove"
          @mouseleave="handleMouseLeave"
          @click="handleCanvasClick"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
          class="block w-full h-full cursor-crosshair"
        />
      </div>

      <!-- Floating Controls -->
      <div class="absolute bottom-0 left-0 right-0 p-4 sm:p-6 animate-fade-up animate-delay-2 relative z-10">
        <div class="max-w-2xl mx-auto bg-bg-surface/90 backdrop-blur-sm border border-border-default p-4 sm:p-5">
          <!-- Name Input + Export -->
          <div class="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div class="flex-1">
              <label class="block text-xs font-display tracking-widest text-text-dim mb-2">
                NHẬP TÊN CỦA BẠN
              </label>
              <input
                v-model="nameInput"
                type="text"
                placeholder="Tên của bạn..."
                maxlength="20"
                class="w-full bg-bg-deep border border-border-default px-4 py-2.5 text-text-primary font-display text-lg tracking-wide placeholder:text-text-dim/50 outline-none transition focus:border-accent-coral"
              />
            </div>
            <div class="flex gap-2 sm:items-end">
              <button
                @click="exportPNG"
                :disabled="isExporting"
                class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-accent-coral text-bg-deep font-display font-bold text-sm tracking-wide px-5 py-2.5 transition hover:bg-accent-amber disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {{ isExporting ? 'Đang xuất...' : 'Xuất PNG' }}
              </button>
            </div>
          </div>

          <!-- Theme Selector -->
          <div class="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border-default">
            <span class="text-xs font-display tracking-widest text-text-dim mr-1">MÀU SẮC</span>
            <button
              v-for="(theme, key) in COLOR_THEMES"
              :key="key"
              @click="currentTheme = key"
              :class="[
                'px-3 py-1 text-xs font-display tracking-wide border transition-all',
                currentTheme === key
                  ? 'border-accent-coral bg-accent-coral/10 text-text-primary'
                  : 'border-border-default text-text-dim hover:border-accent-coral/50 hover:text-text-secondary',
              ]"
            >
              {{ theme.icon }} {{ theme.name }}
            </button>
          </div>

          <!-- Toggles Row -->
          <div class="flex flex-wrap items-center gap-3 mt-3">
            <button
              @click="showConstellations = !showConstellations"
              :class="[
                'px-3 py-1 text-xs font-display tracking-wide border transition-all',
                showConstellations
                  ? 'border-accent-amber bg-accent-amber/10 text-accent-amber'
                  : 'border-border-default text-text-dim hover:text-text-secondary',
              ]"
            >
              ✦ Đường nối
            </button>
            <button
              @click="toggleMouseMode"
              :class="[
                'px-3 py-1 text-xs font-display tracking-wide border transition-all',
                mouseMode === 'attract'
                  ? 'border-accent-sky bg-accent-sky/10 text-accent-sky'
                  : 'border-border-default text-text-dim hover:text-text-secondary',
              ]"
            >
              {{ mouseMode === 'repel' ? '💥 Đẩy' : '🧲 Hút' }}
            </button>
            <span class="text-xs text-text-dim font-display ml-auto hidden sm:inline">
              Click canvas để tạo pháo hoa ✨
            </span>
          </div>

          <!-- Sliders -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-border-default">
            <div>
              <label class="flex items-center justify-between text-xs text-text-dim font-display tracking-wide mb-1.5">
                <span>Kích thước hạt</span>
                <span class="text-accent-amber">{{ particleSize }}</span>
              </label>
              <input v-model.number="particleSize" type="range" min="1" max="5" step="0.5" class="slider w-full" />
            </div>
            <div>
              <label class="flex items-center justify-between text-xs text-text-dim font-display tracking-wide mb-1.5">
                <span>Mật độ</span>
                <span class="text-accent-amber">{{ 6 - particleDensity }}</span>
              </label>
              <input v-model.number="particleDensity" type="range" min="2" max="5" step="1" class="slider w-full" />
            </div>
            <div>
              <label class="flex items-center justify-between text-xs text-text-dim font-display tracking-wide mb-1.5">
                <span>Vùng tương tác</span>
                <span class="text-accent-amber">{{ mouseRadius }}px</span>
              </label>
              <input v-model.number="mouseRadius" type="range" min="40" max="200" step="10" class="slider w-full" />
            </div>
          </div>

          <!-- Hints -->
          <p class="mt-3 text-xs text-text-dim text-center font-display tracking-wide sm:hidden">
            Kéo ngón tay trên canvas để tương tác · Chạm để tạo pháo hoa ✨
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.particle-page {
  height: 100vh;
  height: 100dvh;
}

.slider {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: #253549;
  outline: none;
  border-radius: 0;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: #ff6b4a;
  cursor: pointer;
  border: 2px solid #0f1923;
  border-radius: 0;
  transition: background 0.2s;
}

.slider::-webkit-slider-thumb:hover {
  background: #ffb830;
}

.slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: #ff6b4a;
  cursor: pointer;
  border: 2px solid #0f1923;
  border-radius: 0;
  transition: background 0.2s;
}

.slider::-moz-range-thumb:hover {
  background: #ffb830;
}
</style>
