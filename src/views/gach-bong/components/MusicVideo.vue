<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { GachBongModule, RenderOptions } from '../composables/types'
import { useMusicPlayer } from '../composables/useMusicPlayer'

interface Props {
  engine: GachBongModule
  totalDuration?: number
}

const props = withDefaults(defineProps<Props>(), {
  totalDuration: 34,
})

const emit = defineEmits<{
  back: []
  playNext: []
}>()

const SCENES = [
  { id: 'title', startTime: 0, duration: 8 },
  { id: 'patterns', startTime: 8, duration: 10 },
  { id: 'kaleidoscope', startTime: 18, duration: 8 },
  { id: 'credits', startTime: 26, duration: 8 },
]

const SINGLE_PLAY_DURATION = 34
const LOOP_BODY_DURATION = 26

const FEATURED_PATTERNS = [
  { patternIdx: 0, paletteIdx: 3 },
  { patternIdx: 4, paletteIdx: 6 },
  { patternIdx: 7, paletteIdx: 8 },
  { patternIdx: 1, paletteIdx: 0 },
  { patternIdx: 5, paletteIdx: 1 },
]

const PATTERN_INFO: Record<number, { name: string; emoji: string }> = {
  0: { name: 'Hoa Sen', emoji: '🪷' },
  1: { name: 'Bông Mai', emoji: '🌸' },
  4: { name: 'Hoa Chanh', emoji: '⭐' },
  5: { name: 'Hoa Cúc Đại', emoji: '🌻' },
  7: { name: 'Cánh Quạt', emoji: '🌀' },
}

const BG_DARK = '#0D0A08'
const BG_VIGNETTE = 'rgba(13, 10, 8,'

const BASE_RENDER_OPTIONS: RenderOptions = {
  enableTexture: false,
  enableWear: false,
  enableBevel: true,
  bevelSize: 0.02,
  saturation: 1.0,
  brightness: 1.0,
  showGrout: true,
  groutWidth: 2,
  groutColor: { r: 40, g: 30, b: 25 },
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)
const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
const easeOutBack = (t: number) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const { play: playMusic, stop: stopMusic } = useMusicPlayer('intro')

const canvasRef = ref<HTMLCanvasElement | null>(null)
const animFrameRef = ref(0)
const startTimeRef = ref(0)
const pausedAtRef = ref(0)

const currentScene = ref('')
const transitioning = ref(false)
const progress = ref(0)
const currentPatternLabel = ref<{ emoji: string; name: string } | null>(null)
const finished = ref(false)
const paused = ref(false)

let prevScene = ''
let hasStarted = false
const tileCache = new Map<string, HTMLCanvasElement>()

function getScene(elapsed: number) {
  for (const scene of SCENES) {
    if (elapsed >= scene.startTime && elapsed < scene.startTime + scene.duration) {
      return scene
    }
  }
  return null
}

function getHiResTile(
  patternIdx: number,
  paletteIdx: number,
  logicalSize: number,
  opts: RenderOptions,
): HTMLCanvasElement | null {
  const dpr = window.devicePixelRatio || 1
  const pixelSize = Math.floor(logicalSize * dpr)
  const key = `${patternIdx}-${paletteIdx}-${pixelSize}`

  if (tileCache.has(key)) return tileCache.get(key)!

  const offscreen = document.createElement('canvas')
  offscreen.width = pixelSize
  offscreen.height = pixelSize
  const ctx = offscreen.getContext('2d')
  if (!ctx) return null

  try {
    props.engine.renderTessellation(ctx, patternIdx, paletteIdx, 1, 1, pixelSize, opts)
  } catch {
    return null
  }

  tileCache.set(key, offscreen)
  return offscreen
}

function renderTitleScene(ctx: CanvasRenderingContext2D, w: number, h: number, elapsed: number) {
  const sceneTime = elapsed - SCENES[0]!.startTime

  ctx.fillStyle = BG_DARK
  ctx.fillRect(0, 0, w, h)

  const tileSize = Math.floor(Math.min(w, h) / 5)
  const cols = Math.ceil(w / tileSize) + 1
  const rows = Math.ceil(h / tileSize) + 1
  const centerCol = cols / 2
  const centerRow = rows / 2
  const maxDist = Math.sqrt(centerCol * centerCol + centerRow * centerRow)

  const staggerDuration = 3.5
  const tileAppearDuration = 0.8

  const tileCanvas = getHiResTile(0, 3, tileSize, {
    ...BASE_RENDER_OPTIONS,
    brightness: 0.5,
    saturation: 0.6,
    showGrout: false,
  })

  if (tileCanvas && sceneTime > 0.3) {
    const animTime = sceneTime - 0.3
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const distFromCenter = Math.sqrt(Math.pow(col - centerCol, 2) + Math.pow(row - centerRow, 2))
        const normalizedDist = distFromCenter / maxDist
        const delay = normalizedDist * staggerDuration
        const tileTime = animTime - delay
        if (tileTime <= 0) continue

        const tileProgress = Math.min(tileTime / tileAppearDuration, 1)
        const easedProgress = easeOutBack(tileProgress)
        const opacity = easeOutCubic(Math.min(tileProgress * 1.5, 1))
        const floatY = (1 - easeOutQuart(tileProgress)) * 20

        const x = col * tileSize
        const y = row * tileSize

        ctx.save()
        ctx.globalAlpha = opacity * 0.4
        ctx.translate(x + tileSize / 2, y + tileSize / 2 + floatY)
        ctx.scale(easedProgress, easedProgress)
        ctx.drawImage(
          tileCanvas,
          0,
          0,
          tileCanvas.width,
          tileCanvas.height,
          -tileSize / 2,
          -tileSize / 2,
          tileSize,
          tileSize,
        )
        ctx.restore()
      }
    }
  }

  const gradient = ctx.createRadialGradient(w / 2, h / 2, w * 0.15, w / 2, h / 2, w * 0.65)
  gradient.addColorStop(0, `${BG_VIGNETTE} 0)`)
  gradient.addColorStop(0.6, `${BG_VIGNETTE} 0.4)`)
  gradient.addColorStop(1, `${BG_VIGNETTE} 0.92)`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  if (sceneTime > 1) {
    const glowProgress = easeOutCubic(Math.min((sceneTime - 1) / 2, 1))
    const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.4)
    glow.addColorStop(0, `rgba(200, 90, 60, ${glowProgress * 0.06})`)
    glow.addColorStop(0.5, `rgba(212, 165, 116, ${glowProgress * 0.03})`)
    glow.addColorStop(1, 'rgba(212, 165, 116, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, w, h)
  }
}

function renderPatternsScene(ctx: CanvasRenderingContext2D, w: number, h: number, elapsed: number) {
  const sceneTime = elapsed - SCENES[1]!.startTime
  const duration = SCENES[1]!.duration

  const patternDuration = duration / FEATURED_PATTERNS.length
  const patternIndex = Math.min(Math.floor(sceneTime / patternDuration), FEATURED_PATTERNS.length - 1)
  const patternTime = sceneTime - patternIndex * patternDuration
  const featured = FEATURED_PATTERNS[patternIndex]!

  const info = PATTERN_INFO[featured.patternIdx]
  if (info) {
    currentPatternLabel.value = info
  }

  ctx.fillStyle = BG_DARK
  ctx.fillRect(0, 0, w, h)

  const gridCols = 3
  const gridRows = 3
  const tileSize = Math.floor(Math.min(w, h) * 0.28)
  const gridW = gridCols * tileSize
  const gridH = gridRows * tileSize

  const tileCanvas = getHiResTile(featured.patternIdx, featured.paletteIdx, tileSize, {
    ...BASE_RENDER_OPTIONS,
    showGrout: false,
    groutWidth: 0,
  })

  if (tileCanvas) {
    const staggerTime = 0.6
    const tileDuration = 0.5

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const distFromCenter = Math.abs(col - 1) + Math.abs(row - 1)
        const delay = distFromCenter * (staggerTime / 2)
        const tileTime = patternTime - delay

        if (tileTime <= 0) continue

        const tileProgress = Math.min(tileTime / tileDuration, 1)
        const easedScale = easeOutBack(tileProgress)
        const easedAlpha = easeOutCubic(Math.min(tileProgress * 2, 1))

        const x = w / 2 - gridW / 2 + col * tileSize
        const y = h / 2 - gridH / 2 + row * tileSize
        const riseY = (1 - easeOutQuart(tileProgress)) * 15

        ctx.save()
        ctx.globalAlpha = easedAlpha
        ctx.translate(x + tileSize / 2, y + tileSize / 2 + riseY)
        ctx.scale(easedScale, easedScale)
        ctx.drawImage(
          tileCanvas,
          0,
          0,
          tileCanvas.width,
          tileCanvas.height,
          -tileSize / 2,
          -tileSize / 2,
          tileSize,
          tileSize,
        )
        ctx.restore()
      }
    }

    const allTilesProgress = Math.min(patternTime / (staggerTime + tileDuration), 1)
    if (allTilesProgress > 0.5) {
      const groutAlpha = easeOutCubic((allTilesProgress - 0.5) * 2)
      ctx.save()
      ctx.globalAlpha = groutAlpha
      ctx.strokeStyle = 'rgba(60, 45, 35, 0.8)'
      ctx.lineWidth = 2

      const startX = w / 2 - gridW / 2
      const startY = h / 2 - gridH / 2

      for (let i = 1; i < gridCols; i++) {
        ctx.beginPath()
        ctx.moveTo(startX + i * tileSize, startY)
        ctx.lineTo(startX + i * tileSize, startY + gridH)
        ctx.stroke()
      }
      for (let i = 1; i < gridRows; i++) {
        ctx.beginPath()
        ctx.moveTo(startX, startY + i * tileSize)
        ctx.lineTo(startX + gridW, startY + i * tileSize)
        ctx.stroke()
      }
      ctx.restore()
    }
  }

  const exitStart = patternDuration - 0.4
  if (patternTime > exitStart && patternIndex < FEATURED_PATTERNS.length - 1) {
    const exitProgress = (patternTime - exitStart) / 0.4
    const fadeOut = easeInOutQuad(exitProgress)
    ctx.fillStyle = `${BG_VIGNETTE} ${fadeOut * 0.95})`
    ctx.fillRect(0, 0, w, h)
  }

  const glow = ctx.createRadialGradient(w / 2, h / 2, tileSize * 0.3, w / 2, h / 2, tileSize * 2.5)
  glow.addColorStop(0, 'rgba(212, 165, 116, 0.04)')
  glow.addColorStop(1, `${BG_VIGNETTE} 0)`)
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)

  const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.65)
  vignette.addColorStop(0, `${BG_VIGNETTE} 0)`)
  vignette.addColorStop(1, `${BG_VIGNETTE} 0.88)`)
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, w, h)
}

function renderKaleidoscopeScene(ctx: CanvasRenderingContext2D, w: number, h: number, elapsed: number) {
  const sceneTime = elapsed - SCENES[2]!.startTime

  ctx.fillStyle = BG_DARK
  ctx.fillRect(0, 0, w, h)

  const slowRotation = sceneTime * 0.04
  const breathe = 1 + Math.sin(sceneTime * 0.4) * 0.06
  const patternCycle = Math.floor(sceneTime / 2.5) % Math.min(props.engine.getPatternCount(), 8)
  const paletteCycle = Math.floor(sceneTime / 3) % Math.min(props.engine.getPaletteCount(), 10)
  const brightness = 0.85 + Math.sin(sceneTime * 0.6) * 0.15
  const saturation = 0.8 + Math.cos(sceneTime * 0.5) * 0.2

  const tileSize = Math.floor(Math.min(w, h) / 5)
  const cols = Math.ceil(w / tileSize) + 2
  const rows = Math.ceil(h / tileSize) + 2

  const fadeIn = easeOutCubic(Math.min(sceneTime / 1.5, 1))

  ctx.save()
  ctx.globalAlpha = fadeIn
  ctx.translate(w / 2, h / 2)
  ctx.rotate(slowRotation)
  ctx.scale(breathe, breathe)
  ctx.translate(-w / 2, -h / 2)

  try {
    props.engine.renderTessellation(ctx, patternCycle, paletteCycle, cols, rows, tileSize, {
      ...BASE_RENDER_OPTIONS,
      brightness,
      saturation,
      showGrout: true,
      groutWidth: 1,
      groutColor: { r: 35, g: 25, b: 20 },
    })
  } catch {
    //
  }

  ctx.restore()

  const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.15, w / 2, h / 2, w * 0.6)
  vignette.addColorStop(0, `${BG_VIGNETTE} 0)`)
  vignette.addColorStop(1, `${BG_VIGNETTE} 0.7)`)
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, w, h)
}

function renderCreditsScene(ctx: CanvasRenderingContext2D, w: number, h: number, elapsed: number) {
  const sceneTime = elapsed - SCENES[3]!.startTime

  ctx.fillStyle = BG_DARK
  ctx.fillRect(0, 0, w, h)

  const fadeOut = Math.max(0, 1 - sceneTime / SCENES[3]!.duration)
  ctx.globalAlpha = fadeOut * 0.15

  const tileSize = Math.floor(Math.min(w, h) / 6)
  const cols = Math.ceil(w / tileSize) + 1
  const rows = Math.ceil(h / tileSize) + 1

  try {
    props.engine.renderTessellation(ctx, 0, 9, cols, rows, tileSize, {
      ...BASE_RENDER_OPTIONS,
      brightness: 0.4,
      saturation: 0.3,
      showGrout: false,
    })
  } catch {
    //
  }

  ctx.globalAlpha = 1

  const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.08, w / 2, h / 2, w * 0.5)
  vignette.addColorStop(0, `${BG_VIGNETTE} 0.2)`)
  vignette.addColorStop(1, `${BG_VIGNETTE} 0.95)`)
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, w, h)
}

function animate() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const now = performance.now() / 1000
  const elapsed = now - startTimeRef.value

  const effectiveDuration = props.totalDuration > SINGLE_PLAY_DURATION ? props.totalDuration : SINGLE_PLAY_DURATION

  if (elapsed >= effectiveDuration) {
    finished.value = true
    currentScene.value = ''
    currentPatternLabel.value = null
    stopMusic()
    return
  }

  progress.value = (elapsed / effectiveDuration) * 100

  let localElapsed: number
  const isLooping = effectiveDuration > SINGLE_PLAY_DURATION

  if (isLooping) {
    const creditsStartTime = effectiveDuration - SCENES[3]!.duration
    if (elapsed >= creditsStartTime) {
      localElapsed = SCENES[3]!.startTime + (elapsed - creditsStartTime)
    } else {
      localElapsed = elapsed % LOOP_BODY_DURATION
    }
  } else {
    localElapsed = elapsed
  }

  const scene = getScene(localElapsed)
  if (!scene) return

  if (scene.id !== prevScene) {
    if (prevScene) {
      transitioning.value = true
      setTimeout(() => {
        transitioning.value = false
      }, 500)
    }
    prevScene = scene.id
    currentScene.value = scene.id
    if (scene.id !== 'patterns') {
      currentPatternLabel.value = null
    }
  }

  const dpr = window.devicePixelRatio || 1
  const w = window.innerWidth
  const h = window.innerHeight
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    ctx.scale(dpr, dpr)
  }

  ctx.clearRect(0, 0, w, h)
  switch (scene.id) {
    case 'title':
      renderTitleScene(ctx, w, h, elapsed)
      break
    case 'patterns':
      renderPatternsScene(ctx, w, h, elapsed)
      break
    case 'kaleidoscope':
      renderKaleidoscopeScene(ctx, w, h, elapsed)
      break
    case 'credits':
      renderCreditsScene(ctx, w, h, elapsed)
      break
  }

  animFrameRef.value = requestAnimationFrame(animate)
}

async function startPlayback() {
  if (hasStarted) return
  hasStarted = true

  tileCache.clear()
  startTimeRef.value = performance.now() / 1000
  prevScene = ''
  finished.value = false
  paused.value = false

  try {
    await playMusic()
  } catch (e) {
    console.warn('Strudel music failed to start:', e)
  }

  animFrameRef.value = requestAnimationFrame(animate)
}

onMounted(() => {
  startPlayback()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animFrameRef.value)
  stopMusic()
})

function handleTogglePause() {
  if (finished.value) return

  if (paused.value) {
    const pausedDuration = performance.now() / 1000 - pausedAtRef.value
    startTimeRef.value += pausedDuration
    paused.value = false
    playMusic().catch(() => {})
    animFrameRef.value = requestAnimationFrame(animate)
  } else {
    pausedAtRef.value = performance.now() / 1000
    cancelAnimationFrame(animFrameRef.value)
    stopMusic()
    paused.value = true
  }
}

function handleBack() {
  cancelAnimationFrame(animFrameRef.value)
  stopMusic()
  emit('back')
}

async function handleReplay() {
  finished.value = false
  paused.value = false
  currentScene.value = ''
  progress.value = 0
  currentPatternLabel.value = null
  tileCache.clear()
  cancelAnimationFrame(animFrameRef.value)
  stopMusic()

  hasStarted = false
  startPlayback()
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-bg-deep overflow-hidden select-none font-body text-text-primary h-screen w-screen">
    <!-- Canvas layer -->
    <div
      class="absolute inset-0 flex items-center justify-center -z-10"
      :class="{ 'mix-blend-lighten': currentScene === 'kaleidoscope' }"
      @click="handleTogglePause"
      :style="{ cursor: finished ? 'default' : 'pointer' }"
    >
      <canvas ref="canvasRef" class="block object-contain" />
    </div>

    <!-- Vignette -->
    <div
      class="pointer-events-none absolute inset-0 -z-10"
      style="box-shadow: inset 0 0 150px rgba(13, 10, 8, 0.9);"
    />

    <!-- Transition overlay -->
    <div
      class="pointer-events-none absolute inset-0 bg-transparent transition-colors duration-500 z-10"
      :class="{ 'bg-black/20': transitioning }"
    />

    <!-- Pause overlay -->
    <div
      v-if="paused && !finished"
      class="absolute inset-0 z-40 flex cursor-pointer flex-col items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300"
      @click="handleTogglePause"
    >
      <div class="text-6xl text-white/50 mb-4 tracking-[-8px]">❚❚</div>
      <p class="font-display text-2xl font-bold tracking-[0.2em] text-white">Tạm dừng</p>
      <p class="font-display text-sm uppercase tracking-widest text-[#D4A574]/60 mt-3">Nhấn để tiếp tục</p>
    </div>

    <!-- Interactive Overlays -->
    <div v-if="!paused && !finished" class="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-8">
      <button
        class="pointer-events-auto self-end p-2 text-2xl text-white/50 transition hover:text-white"
        @click.stop="handleBack"
      >
        ✕
      </button>

      <!-- Title Scene -->
      <div v-if="currentScene === 'title'" class="flex flex-col items-center justify-center h-full text-center pb-[10vh]">
        <h1 class="font-display text-[9vw] font-black tracking-tight leading-none text-white drop-shadow-lg">
          Gạch Bông
        </h1>
        <div class="w-16 h-1 my-6 bg-[#FF6B4A]/80 shadow-[0_0_15px_rgba(255,107,74,0.5)]" />
        <p class="font-display text-[3.5vw] font-medium tracking-[0.05em] text-[#D4A574]">
          Hoa Văn Truyền Thống Việt Nam
        </p>
        <p class="font-display text-[1.8vw] tracking-[0.3em] font-medium text-white/50 uppercase block mt-12 px-6 py-2 border-y border-white/20">
          Âm nhạc · Hoạ tiết · Hình học
        </p>
      </div>

      <!-- Pattern Label -->
      <div
        v-if="currentScene === 'patterns' && currentPatternLabel"
        class="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-md px-6 py-3 border border-white/10 rounded-full"
      >
        <span class="text-2xl">{{ currentPatternLabel.emoji }}</span>
        <span class="font-display text-xl font-semibold tracking-widest text-white uppercase">{{ currentPatternLabel.name }}</span>
      </div>

      <!-- Credits -->
      <div v-if="currentScene === 'credits'" class="flex flex-col items-center justify-center h-full text-center pb-[5vh] gap-3">
        <p class="font-display text-3xl font-bold text-[#FF6B4A] tracking-widest uppercase">Gạch Bông</p>
        <p class="font-display text-lg tracking-widest text-white/40 uppercase">Hoa văn truyền thống Việt Nam</p>
        <div class="w-8 h-[1px] bg-white/20 my-2" />
        <p class="font-display text-sm tracking-[0.2em] text-[#D4A574]/80">20 hoạ tiết truyền thống</p>
        <p class="font-display text-sm tracking-[0.2em] text-[#D4A574]/80">Tất cả render bằng hình học thuần tuý</p>
        <p class="font-display text-sm tracking-[0.2em] text-[#D4A574]/80">Không dùng hình ảnh</p>
        <div class="w-8 h-[1px] bg-white/20 my-2" />
        <p class="text-2xl animate-pulse">🇻🇳</p>
        <p class="font-display text-xs tracking-[0.3em] text-white/30 uppercase mt-2">Made with <span class="text-red-500">❤️</span> in Vietnam</p>
        <p class="font-display text-[10px] tracking-[0.4em] text-white/20 uppercase mt-4">A Yellow Studio Labs product</p>
      </div>
    </div>

    <!-- End screen -->
    <div v-if="finished" class="absolute inset-0 z-30 flex items-center justify-center bg-bg-deep/90 backdrop-blur-sm p-4">
      <div class="flex flex-col items-center bg-bg-surface border border-border-default max-w-lg w-full p-10 text-center animate-fade-up shadow-2xl">
        <h2 class="font-display text-4xl font-bold text-accent-coral mb-2">Gạch Bông</h2>
        <p class="text-text-secondary tracking-widest uppercase text-sm font-display mb-10">MV Intro</p>

        <div class="flex flex-col w-full gap-3 mb-10">
          <button
            class="flex items-center justify-center gap-2 border border-accent-coral bg-accent-coral/10 w-full py-3.5 font-display font-semibold transition hover:bg-accent-coral/20 text-accent-coral"
            @click="handleReplay"
          >
            <span>↻</span> Phát lại
          </button>
          <button
            class="flex items-center justify-center gap-2 border border-border-default bg-bg-surface w-full py-3.5 text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            @click="handleBack"
          >
            <span>←</span> Quay lại
          </button>
        </div>

        <div class="w-full text-left">
          <p class="font-display text-xs tracking-widest text-text-dim mb-3">MV TIẾP THEO</p>
          <div
            class="group flex items-center p-4 border border-border-default bg-bg-elevated cursor-pointer transition-all hover:border-accent-amber hover:-translate-y-1 hover:shadow-lg"
            @click="emit('playNext')"
          >
            <span class="text-4xl mr-4">⭐</span>
            <div class="flex-1 min-w-0">
              <span class="block font-display text-lg font-bold text-text-primary group-hover:text-accent-amber transition-colors">
                Hoa Chanh – Sài Gòn Retro
              </span>
              <span class="block text-sm text-text-secondary truncate mt-1">
                Ngôi sao 8 cánh rực rỡ trên đường phố Sài Gòn
              </span>
            </div>
            <span class="text-xs tracking-wider uppercase bg-accent-amber/20 text-accent-amber px-2.5 py-1 ml-4 whitespace-nowrap hidden sm:block">
              XEM NGAY
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Progress bar -->
    <div v-if="!finished" class="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-20">
      <div
        class="h-full bg-gradient-to-r from-accent-coral to-accent-amber transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(255,107,74,0.5)]"
        :style="{ width: `${progress}%` }"
      />
    </div>
  </div>
</template>
