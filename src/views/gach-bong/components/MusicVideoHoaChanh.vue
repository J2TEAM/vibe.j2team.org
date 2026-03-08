<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { GachBongModule, RenderOptions } from '../composables/types'
import { useMusicPlayer } from '../composables/useMusicPlayer'

interface Props {
  engine: GachBongModule
  totalDuration?: number
}

const props = withDefaults(defineProps<Props>(), {
  totalDuration: 40,
})

const emit = defineEmits<{
  back: []
}>()

const SCENES = [
  { id: 'single-tile', startTime: 0, duration: 6 },
  { id: 'spread', startTime: 6, duration: 8 },
  { id: 'parallax', startTime: 14, duration: 10 },
  { id: 'time-morph', startTime: 24, duration: 8 },
  { id: 'credits', startTime: 32, duration: 8 },
]

const SINGLE_PLAY_DURATION = 40
const LOOP_BODY_DURATION = 32

const HOA_CHANH_PATTERN = 4
const PALETTE_SAIGON_RETRO = 6
const PALETTE_GACH_CU = 0
const PALETTE_CA_PHE = 2

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

function lerpOptions(a: RenderOptions, b: RenderOptions, t: number): RenderOptions {
  const lerp = (x: number, y: number) => x + (y - x) * t
  return {
    ...a,
    brightness: lerp(a.brightness!, b.brightness!),
    saturation: lerp(a.saturation!, b.saturation!),
    bevelSize: lerp(a.bevelSize!, b.bevelSize!),
    groutWidth: Math.round(lerp(a.groutWidth!, b.groutWidth!)),
  }
}

const { play: playMusic, stop: stopMusic } = useMusicPlayer('hoa-chanh')

const canvasRef = ref<HTMLCanvasElement | null>(null)
const animFrameRef = ref(0)
const startTimeRef = ref(0)
const pausedAtRef = ref(0)

const currentScene = ref('')
const progress = ref(0)
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
  const key = `${patternIdx}-${paletteIdx}-${pixelSize}-${opts.brightness?.toFixed(2)}-${opts.saturation?.toFixed(2)}`

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

function renderSingleTileScene(ctx: CanvasRenderingContext2D, w: number, h: number, elapsed: number) {
  const sceneTime = elapsed - SCENES[0]!.startTime

  ctx.fillStyle = BG_DARK
  ctx.fillRect(0, 0, w, h)

  const tileSize = Math.floor(Math.min(w, h) * 0.3)
  const tileCenterY = h * 0.38
  const tile = getHiResTile(HOA_CHANH_PATTERN, PALETTE_SAIGON_RETRO, tileSize, {
    ...BASE_RENDER_OPTIONS,
    showGrout: false,
  })

  if (tile) {
    const enterProgress = easeOutBack(Math.min(sceneTime / 1.5, 1))
    const rotation = easeOutQuart(Math.min(sceneTime / 3, 1)) * (Math.PI / 4)

    const spotlightAlpha = easeOutCubic(Math.min(sceneTime / 2, 1)) * 0.08
    const spotlight = ctx.createRadialGradient(w / 2, tileCenterY, 0, w / 2, tileCenterY, w * 0.45)
    spotlight.addColorStop(0, `rgba(212, 165, 116, ${spotlightAlpha})`)
    spotlight.addColorStop(1, 'rgba(212, 165, 116, 0)')
    ctx.fillStyle = spotlight
    ctx.fillRect(0, 0, w, h)

    ctx.save()
    ctx.translate(w / 2, tileCenterY)
    ctx.rotate(rotation)
    ctx.scale(enterProgress, enterProgress)
    ctx.drawImage(tile, 0, 0, tile.width, tile.height, -tileSize / 2, -tileSize / 2, tileSize, tileSize)
    ctx.restore()
  }

  const textAlpha = easeOutCubic(Math.min(Math.max(sceneTime - 0.8, 0) / 1.5, 1))
  if (textAlpha > 0) {
    const textY = tileCenterY + tileSize / 2 + h * 0.1

    ctx.save()
    ctx.globalAlpha = textAlpha
    ctx.textAlign = 'center'

    ctx.font = `800 ${Math.floor(
      Math.min(w * 0.12, 86),
    )}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.fillText('Hoa Chanh', w / 2, textY)

    ctx.font = `500 ${Math.floor(
      Math.min(w * 0.05, 32),
    )}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
    ctx.fillStyle = 'rgba(212, 165, 116, 0.75)'
    ctx.letterSpacing = '0.12em'
    ctx.fillText('Ngôi sao tám cánh của Sài Gòn', w / 2, textY + Math.floor(Math.min(w * 0.07, 52)))

    ctx.restore()
  }

  const vignette = ctx.createRadialGradient(w / 2, tileCenterY, w * 0.15, w / 2, h / 2, w * 0.6)
  vignette.addColorStop(0, `${BG_VIGNETTE} 0)`)
  vignette.addColorStop(1, `${BG_VIGNETTE} 0.85)`)
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, w, h)
}

function renderSpreadScene(ctx: CanvasRenderingContext2D, w: number, h: number, elapsed: number) {
  const sceneTime = elapsed - SCENES[1]!.startTime

  ctx.fillStyle = BG_DARK
  ctx.fillRect(0, 0, w, h)

  const gridProgress = easeOutCubic(Math.min(sceneTime / 4, 1))
  const gridSize = 2 + Math.floor(gridProgress * 4)
  const tileSize = Math.floor(Math.min(w, h) / (gridSize + 1))
  const gridW = gridSize * tileSize
  const gridH = gridSize * tileSize

  const tile = getHiResTile(HOA_CHANH_PATTERN, PALETTE_SAIGON_RETRO, tileSize, {
    ...BASE_RENDER_OPTIONS,
    showGrout: false,
  })

  if (tile) {
    const center = Math.floor(gridSize / 2)

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const dist = Math.abs(col - center) + Math.abs(row - center)
        const delay = dist * 0.2
        const tileTime = sceneTime - delay

        if (tileTime <= 0) continue

        const tileProgress = Math.min(tileTime / 0.6, 1)
        const scale = easeOutBack(tileProgress)
        const alpha = easeOutCubic(Math.min(tileProgress * 2, 1))

        const x = w / 2 - gridW / 2 + col * tileSize
        const y = h / 2 - gridH / 2 + row * tileSize

        ctx.save()
        ctx.globalAlpha = alpha
        ctx.translate(x + tileSize / 2, y + tileSize / 2)
        ctx.scale(scale, scale)
        ctx.drawImage(tile, 0, 0, tile.width, tile.height, -tileSize / 2, -tileSize / 2, tileSize, tileSize)
        ctx.restore()
      }
    }

    if (sceneTime > 2) {
      const groutAlpha = easeOutCubic(Math.min((sceneTime - 2) / 1, 1))
      ctx.save()
      ctx.globalAlpha = groutAlpha * 0.6
      ctx.strokeStyle = 'rgba(60, 45, 35, 0.8)'
      ctx.lineWidth = 2
      const startX = w / 2 - gridW / 2
      const startY = h / 2 - gridH / 2
      for (let i = 1; i < gridSize; i++) {
        ctx.beginPath()
        ctx.moveTo(startX + i * tileSize, startY)
        ctx.lineTo(startX + i * tileSize, startY + gridH)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(startX, startY + i * tileSize)
        ctx.lineTo(startX + gridW, startY + i * tileSize)
        ctx.stroke()
      }
      ctx.restore()
    }
  }

  const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.65)
  vignette.addColorStop(0, `${BG_VIGNETTE} 0)`)
  vignette.addColorStop(1, `${BG_VIGNETTE} 0.88)`)
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, w, h)
}

function renderParallaxScene(ctx: CanvasRenderingContext2D, w: number, h: number, elapsed: number) {
  const sceneTime = elapsed - SCENES[2]!.startTime

  ctx.fillStyle = BG_DARK
  ctx.fillRect(0, 0, w, h)

  const fadeIn = easeOutCubic(Math.min(sceneTime / 1.5, 1))
  const bandHeight = Math.floor(h / 3)
  const tileSize = Math.floor(bandHeight * 0.9)
  const cols = Math.ceil(w / tileSize) + 3

  const bands = [
    { palette: PALETTE_SAIGON_RETRO, speed: 30, direction: 1 },
    { palette: PALETTE_GACH_CU, speed: 20, direction: -1 },
    { palette: PALETTE_CA_PHE, speed: 25, direction: 1 },
  ]

  bands.forEach((band, bandIdx) => {
    const y = bandIdx * bandHeight
    const scrollX = sceneTime * band.speed * band.direction

    ctx.save()
    ctx.globalAlpha = fadeIn
    ctx.beginPath()
    ctx.rect(0, y, w, bandHeight)
    ctx.clip()

    try {
      const offsetX = ((scrollX % tileSize) + tileSize) % tileSize
      ctx.translate(-offsetX, y + (bandHeight - tileSize) / 2)

      props.engine.renderTessellation(ctx, HOA_CHANH_PATTERN, band.palette, cols, 1, tileSize, {
        ...BASE_RENDER_OPTIONS,
        brightness: 0.9,
        saturation: 0.9,
        showGrout: true,
        groutWidth: 1,
      })
    } catch {
      //
    }

    ctx.restore()

    if (bandIdx > 0) {
      const sep = ctx.createLinearGradient(0, y - 8, 0, y + 8)
      sep.addColorStop(0, `${BG_VIGNETTE} 0.8)`)
      sep.addColorStop(0.5, `${BG_VIGNETTE} 0.3)`)
      sep.addColorStop(1, `${BG_VIGNETTE} 0.8)`)
      ctx.fillStyle = sep
      ctx.fillRect(0, y - 8, w, 16)
    }
  })

  const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.65)
  vignette.addColorStop(0, `${BG_VIGNETTE} 0)`)
  vignette.addColorStop(1, `${BG_VIGNETTE} 0.75)`)
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, w, h)
}

function renderTimeMorphScene(ctx: CanvasRenderingContext2D, w: number, h: number, elapsed: number) {
  const sceneTime = elapsed - SCENES[3]!.startTime
  const duration = SCENES[3]!.duration

  ctx.fillStyle = BG_DARK
  ctx.fillRect(0, 0, w, h)

  const styles: RenderOptions[] = [
    { ...BASE_RENDER_OPTIONS, brightness: 1.0, saturation: 1.0, enableBevel: true, bevelSize: 0.03, showGrout: true, groutWidth: 3 },
    { ...BASE_RENDER_OPTIONS, brightness: 0.9, saturation: 0.85, enableBevel: true, bevelSize: 0.02, showGrout: true, groutWidth: 2 },
    { ...BASE_RENDER_OPTIONS, brightness: 0.75, saturation: 0.6, enableBevel: true, bevelSize: 0.015, showGrout: true, groutWidth: 2, groutColor: { r: 80, g: 70, b: 55 } },
    { ...BASE_RENDER_OPTIONS, brightness: 0.55, saturation: 0.35, enableBevel: false, bevelSize: 0, showGrout: true, groutWidth: 1, groutColor: { r: 60, g: 55, b: 45 } },
  ]

  const styleTime = duration / styles.length
  const idx = Math.min(Math.floor(sceneTime / styleTime), styles.length - 1)
  const nextIdx = Math.min(idx + 1, styles.length - 1)
  const t = (sceneTime - idx * styleTime) / styleTime
  const lerpT = easeInOutQuad(Math.min(t, 1))

  const currentOpts = lerpOptions(styles[idx]!, styles[nextIdx]!, lerpT)

  const tileSize = Math.floor(Math.min(w, h) / 5)
  const cols = Math.ceil(w / tileSize) + 1
  const rows = Math.ceil(h / tileSize) + 1

  const fadeIn = easeOutCubic(Math.min(sceneTime / 1, 1))
  ctx.globalAlpha = fadeIn

  try {
    props.engine.renderTessellation(ctx, HOA_CHANH_PATTERN, PALETTE_SAIGON_RETRO, cols, rows, tileSize, currentOpts)
  } catch {
    //
  }

  ctx.globalAlpha = 1

  const darkening = sceneTime / duration
  const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.12, w / 2, h / 2, w * 0.55)
  vignette.addColorStop(0, `${BG_VIGNETTE} ${darkening * 0.3})`)
  vignette.addColorStop(1, `${BG_VIGNETTE} ${0.7 + darkening * 0.25})`)
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, w, h)
}

function renderCreditsScene(ctx: CanvasRenderingContext2D, w: number, h: number, elapsed: number) {
  const sceneTime = elapsed - SCENES[4]!.startTime

  ctx.fillStyle = BG_DARK
  ctx.fillRect(0, 0, w, h)

  const tileSize = Math.floor(Math.min(w, h) * 0.25)
  const tile = getHiResTile(HOA_CHANH_PATTERN, PALETTE_SAIGON_RETRO, tileSize, {
    ...BASE_RENDER_OPTIONS,
    brightness: 0.4,
    saturation: 0.3,
    showGrout: false,
  })

  if (tile) {
    const fadeOut = Math.max(0, 1 - sceneTime / SCENES[4]!.duration)
    const slowRotation = sceneTime * 0.05

    ctx.save()
    ctx.globalAlpha = fadeOut * 0.3
    ctx.translate(w / 2, h / 2)
    ctx.rotate(slowRotation)
    ctx.drawImage(tile, 0, 0, tile.width, tile.height, -tileSize / 2, -tileSize / 2, tileSize, tileSize)
    ctx.restore()
  }

  const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.08, w / 2, h / 2, w * 0.5)
  vignette.addColorStop(0, `${BG_VIGNETTE} 0.3)`)
  vignette.addColorStop(1, `${BG_VIGNETTE} 0.95)`)
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, w, h)
}

function getSceneAlpha(scene: { startTime: number; duration: number }, elapsed: number): number {
  const sceneTime = elapsed - scene.startTime
  const fadeInDuration = 0.8
  const fadeOutDuration = 0.6

  let alpha = 1
  if (sceneTime < fadeInDuration) {
    alpha = easeOutCubic(sceneTime / fadeInDuration)
  }
  const timeLeft = scene.duration - sceneTime
  if (timeLeft < fadeOutDuration) {
    alpha = Math.min(alpha, easeOutCubic(Math.max(timeLeft / fadeOutDuration, 0)))
  }
  return alpha
}

function renderSceneById(ctx: CanvasRenderingContext2D, id: string, w: number, h: number, elapsed: number) {
  switch (id) {
    case 'single-tile':
      renderSingleTileScene(ctx, w, h, elapsed)
      break
    case 'spread':
      renderSpreadScene(ctx, w, h, elapsed)
      break
    case 'parallax':
      renderParallaxScene(ctx, w, h, elapsed)
      break
    case 'time-morph':
      renderTimeMorphScene(ctx, w, h, elapsed)
      break
    case 'credits':
      renderCreditsScene(ctx, w, h, elapsed)
      break
  }
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
    stopMusic()
    return
  }

  progress.value = (elapsed / effectiveDuration) * 100

  let localElapsed: number
  const isLooping = effectiveDuration > SINGLE_PLAY_DURATION

  if (isLooping) {
    const creditsStartTime = effectiveDuration - SCENES[4]!.duration
    if (elapsed >= creditsStartTime) {
      localElapsed = SCENES[4]!.startTime + (elapsed - creditsStartTime)
    } else {
      localElapsed = elapsed % LOOP_BODY_DURATION
    }
  } else {
    localElapsed = elapsed
  }

  const scene = getScene(localElapsed)
  if (!scene) return

  if (scene.id !== prevScene) {
    prevScene = scene.id
    currentScene.value = scene.id
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

  ctx.fillStyle = BG_DARK
  ctx.fillRect(0, 0, w, h)

  const sceneAlpha = getSceneAlpha(scene, localElapsed)
  ctx.save()
  ctx.globalAlpha = sceneAlpha
  renderSceneById(ctx, scene.id, w, h, localElapsed)
  ctx.restore()

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
  tileCache.clear()
  cancelAnimationFrame(animFrameRef.value)
  stopMusic()
  hasStarted = false
  startPlayback()
}

const sceneTexts: Record<string, { title?: string; sub?: string }> = {
  'spread': { sub: '"Hai hình vuông xoay 45° lồng vào nhau"' },
  'parallax': { title: 'Đường Phố Sài Gòn' },
  'time-morph': { sub: 'Từ mới tinh... đến rêu phong' },
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-bg-deep overflow-hidden select-none font-body text-text-primary h-screen w-screen">
    <!-- Canvas layer -->
    <div
      class="absolute inset-0 flex items-center justify-center -z-10"
      :class="{ 'mix-blend-lighten': currentScene === 'parallax' }"
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
    <div
      v-if="!paused && !finished && (sceneTexts[currentScene] || currentScene === 'single-tile')"
      class="pointer-events-none absolute inset-0 z-20 flex flex-col p-8"
      :class="currentScene === 'single-tile' ? 'justify-between pb-0' : 'justify-end pb-[10%]'"
    >
      <button
        class="pointer-events-auto self-end p-2 text-2xl text-white/50 transition hover:text-white"
        @click.stop="handleBack"
      >
        ✕
      </button>

      <!-- Scene 1: Drawn on Canvas via renderSingleTileScene -->

      <!-- Other scenes pill label -->
      <div
        v-if="currentScene !== 'single-tile'"
        class="self-center flex flex-col items-center justify-center text-center max-w-sm px-6 py-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-full"
      >
        <span v-if="sceneTexts[currentScene]?.title" class="font-display text-xl tracking-widest text-white uppercase mb-1">
          {{ sceneTexts[currentScene]!.title }}
        </span>
        <span
          v-if="sceneTexts[currentScene]?.sub"
          class="font-display text-sm text-[#D4A574]/80 tracking-[0.1em]"
          :class="{ 'italic': currentScene === 'spread' || currentScene === 'time-morph' }"
        >
          {{ sceneTexts[currentScene]!.sub }}
        </span>
      </div>
    </div>

    <!-- Credits -->
    <div v-if="!paused && !finished && currentScene === 'credits'" class="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-8">
      <button
        class="pointer-events-auto self-end p-2 text-2xl text-white/50 transition hover:text-white"
        @click.stop="handleBack"
      >
        ✕
      </button>
      <div class="flex flex-col items-center justify-center h-full text-center pb-[5vh] gap-3">
        <p class="font-display text-3xl font-bold text-[#FF6B4A] tracking-widest uppercase">Hoa Chanh</p>
        <p class="font-display text-lg tracking-widest text-white/40 uppercase">Sài Gòn Retro</p>
        <div class="w-8 h-[1px] bg-white/20 my-2" />
        <p class="font-display text-sm tracking-[0.2em] text-[#D4A574]/80">Ngôi sao 8 cánh</p>
        <p class="font-display text-sm tracking-[0.2em] text-[#D4A574]/80">Vinh quang, rực rỡ</p>
        <div class="w-8 h-[1px] bg-white/20 my-2" />
        <p class="text-2xl animate-pulse">🇻🇳</p>
        <p class="font-display text-xs tracking-[0.3em] text-white/30 uppercase mt-2">Made with <span class="text-red-500">❤️</span> in Vietnam</p>
        <p class="font-display text-[10px] tracking-[0.4em] text-white/20 uppercase mt-4">A Yellow Studio Labs product</p>
      </div>
    </div>

    <!-- Close button only -->
    <div v-if="!paused && !finished && !sceneTexts[currentScene] && currentScene !== 'single-tile' && currentScene !== 'credits'" class="pointer-events-none absolute inset-0 z-20 p-8">
      <button
        class="pointer-events-auto float-right p-2 text-2xl text-white/50 transition hover:text-white"
        @click.stop="handleBack"
      >
        ✕
      </button>
    </div>

    <!-- End screen -->
    <div v-if="finished" class="absolute inset-0 z-30 flex items-center justify-center bg-bg-deep/90 backdrop-blur-sm p-4">
      <div class="flex flex-col items-center bg-bg-surface border border-border-default max-w-lg w-full p-10 text-center animate-fade-up shadow-2xl">
        <h2 class="font-display text-4xl font-bold text-accent-coral mb-2">Hoa Chanh</h2>
        <p class="text-text-secondary tracking-widest uppercase text-sm font-display mb-10">Sài Gòn Retro</p>

        <div class="flex flex-col w-full gap-3 mb-10">
          <button
            class="flex items-center justify-center gap-2 border border-accent-amber bg-accent-amber/10 w-full py-3.5 font-display font-semibold transition hover:bg-accent-amber/20 text-accent-amber"
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
      </div>
    </div>

    <!-- Progress bar -->
    <div v-if="!finished" class="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-20">
      <div
        class="h-full bg-gradient-to-r from-accent-amber to-yellow-300 transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(255,184,48,0.5)]"
        :style="{ width: `${progress}%` }"
      />
    </div>
  </div>
</template>
