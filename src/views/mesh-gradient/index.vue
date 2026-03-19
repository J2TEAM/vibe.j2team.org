<script setup lang="ts">
import { ref, computed, reactive, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'

// --- J2Team background gradient (randomized per load) ---
const J2_COLORS = ['#FF6B4A', '#FFB830', '#38BDF8', '#2563EB']
function rndBg(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min))
}
const pageBg = J2_COLORS.map(
  (c) =>
    `radial-gradient(ellipse ${rndBg(60, 110)}% ${rndBg(60, 110)}% at ${rndBg(5, 95)}% ${rndBg(5, 95)}%, ${c} 0%, transparent 70%)`,
).join(', ')
const showBg = ref(true)

// --- Export settings ---
const RATIOS = [
  { label: '16:9', value: '16/9' },
  { label: '1:1', value: '1/1' },
  { label: '4:3', value: '4/3' },
  { label: '9:16', value: '9/16' },
  { label: '3:2', value: '3/2' },
]
const EXPORT_PRESETS = [
  { label: '1080p', w: 1920 },
  { label: '1440p', w: 2560 },
  { label: '4K', w: 3840 },
]
const exportRatio = ref('16/9')
const exportWidth = ref(1920)
const customWidth = ref(1920)
const useCustomWidth = ref(false)

const resolvedExportWidth = computed(() =>
  useCustomWidth.value ? Math.max(100, Math.min(8192, customWidth.value)) : exportWidth.value,
)
const resolvedExportHeight = computed(() => {
  const [rw, rh] = exportRatio.value.split('/').map(Number)
  return Math.round((resolvedExportWidth.value * (rh ?? 9)) / (rw ?? 16))
})

// --- Types ---
interface Blob {
  id: number
  color: string
  x: number // % 0-100
  y: number // % 0-100
  size: number // % 20-120
  opacity: number // 0.3-1
}

// --- Presets ---
type PaletteCategory =
  | 'Mood'
  | 'Complementary'
  | 'Analogous'
  | 'Triadic'
  | 'Tetradic'
  | 'Split-Comp'
  | 'Brand'
const CATEGORIES: PaletteCategory[] = [
  'Mood',
  'Complementary',
  'Analogous',
  'Triadic',
  'Tetradic',
  'Split-Comp',
  'Brand',
]

interface Palette {
  name: string
  category: PaletteCategory
  bg: string
  colors: string[]
}
const palettes: Palette[] = [
  // Mood
  {
    name: 'Sunset',
    category: 'Mood',
    bg: '#1a0a0f',
    colors: ['#ff6b4a', '#ff3d8a', '#ffb347', '#c026d3'],
  },
  {
    name: 'Ocean',
    category: 'Mood',
    bg: '#020d18',
    colors: ['#0ea5e9', '#6366f1', '#06b6d4', '#3b82f6'],
  },
  {
    name: 'Forest',
    category: 'Mood',
    bg: '#021208',
    colors: ['#22c55e', '#84cc16', '#10b981', '#14b8a6'],
  },
  {
    name: 'Neon',
    category: 'Mood',
    bg: '#050508',
    colors: ['#a855f7', '#ec4899', '#06b6d4', '#facc15'],
  },
  {
    name: 'Lava',
    category: 'Mood',
    bg: '#0d0502',
    colors: ['#ef4444', '#f97316', '#dc2626', '#fb923c'],
  },
  {
    name: 'Aurora',
    category: 'Mood',
    bg: '#020b10',
    colors: ['#34d399', '#818cf8', '#38bdf8', '#a78bfa'],
  },
  {
    name: 'Pastel',
    category: 'Mood',
    bg: '#0f0f18',
    colors: ['#f9a8d4', '#a5b4fc', '#86efac', '#fde68a'],
  },
  {
    name: 'Monochrome',
    category: 'Mood',
    bg: '#080808',
    colors: ['#ffffff', '#aaaaaa', '#cccccc', '#666666'],
  },
  // Complementary — opposite hues on the wheel
  {
    name: 'Blue / Orange',
    category: 'Complementary',
    bg: '#070d1e',
    colors: ['#2563eb', '#ea580c', '#1e40af', '#f97316'],
  },
  {
    name: 'Purple / Yellow',
    category: 'Complementary',
    bg: '#0d0a1a',
    colors: ['#7c3aed', '#ca8a04', '#6d28d9', '#fbbf24'],
  },
  {
    name: 'Red / Cyan',
    category: 'Complementary',
    bg: '#0f0505',
    colors: ['#dc2626', '#06b6d4', '#b91c1c', '#0891b2'],
  },
  {
    name: 'Green / Magenta',
    category: 'Complementary',
    bg: '#05100a',
    colors: ['#16a34a', '#db2777', '#15803d', '#be185d'],
  },
  // Analogous — neighbouring hues
  {
    name: 'Aqua Drift',
    category: 'Analogous',
    bg: '#061212',
    colors: ['#10b981', '#06b6d4', '#0ea5e9', '#14b8a6'],
  },
  {
    name: 'Purple Haze',
    category: 'Analogous',
    bg: '#080514',
    colors: ['#8b5cf6', '#6366f1', '#ec4899', '#a855f7'],
  },
  {
    name: 'Golden Hour',
    category: 'Analogous',
    bg: '#1a0e00',
    colors: ['#f59e0b', '#ef4444', '#f97316', '#fbbf24'],
  },
  {
    name: 'Jade Garden',
    category: 'Analogous',
    bg: '#041208',
    colors: ['#22c55e', '#84cc16', '#10b981', '#a3e635'],
  },
  // Triadic — 3 hues equally spaced (120°)
  {
    name: 'Primary',
    category: 'Triadic',
    bg: '#0a0808',
    colors: ['#dc2626', '#ca8a04', '#1d4ed8', '#b45309'],
  },
  {
    name: 'Secondary',
    category: 'Triadic',
    bg: '#060f06',
    colors: ['#16a34a', '#7c3aed', '#ea580c', '#15803d'],
  },
  {
    name: 'Teal · Pink · Sun',
    category: 'Triadic',
    bg: '#05100f',
    colors: ['#0d9488', '#ec4899', '#ca8a04', '#0f766e'],
  },
  {
    name: 'Slate · Rose · Lime',
    category: 'Triadic',
    bg: '#080a08',
    colors: ['#475569', '#f43f5e', '#84cc16', '#334155'],
  },
  // Tetradic — 4 hues equally spaced (90°)
  {
    name: 'Classic',
    category: 'Tetradic',
    bg: '#080808',
    colors: ['#e11d48', '#ca8a04', '#0891b2', '#7c3aed'],
  },
  {
    name: 'Vivid',
    category: 'Tetradic',
    bg: '#080808',
    colors: ['#ef4444', '#eab308', '#22c55e', '#3b82f6'],
  },
  {
    name: 'Muted',
    category: 'Tetradic',
    bg: '#070707',
    colors: ['#9f1239', '#854d0e', '#164e63', '#4c1d95'],
  },
  {
    name: 'Electric',
    category: 'Tetradic',
    bg: '#050508',
    colors: ['#f43f5e', '#f59e0b', '#06b6d4', '#8b5cf6'],
  },
  // Split-Complementary — base + 2 hues adjacent to its complement
  {
    name: 'Blue base',
    category: 'Split-Comp',
    bg: '#06091a',
    colors: ['#1d4ed8', '#f59e0b', '#f43f5e', '#1e40af'],
  },
  {
    name: 'Red base',
    category: 'Split-Comp',
    bg: '#100506',
    colors: ['#dc2626', '#22d3ee', '#34d399', '#b91c1c'],
  },
  {
    name: 'Purple base',
    category: 'Split-Comp',
    bg: '#0d0a1a',
    colors: ['#7c3aed', '#84cc16', '#fbbf24', '#6d28d9'],
  },
  {
    name: 'Green base',
    category: 'Split-Comp',
    bg: '#05100a',
    colors: ['#16a34a', '#818cf8', '#f472b6', '#15803d'],
  },
  // Brand
  {
    name: 'J2Team',
    category: 'Brand',
    bg: '#0F1923',
    colors: ['#FF6B4A', '#FFB830', '#38BDF8', '#2563EB'],
  },
  {
    name: 'J2Team Invert',
    category: 'Brand',
    bg: '#1a0f08',
    colors: ['#0094B5', '#0047CF', '#C74207', '#4A6180'],
  },
]

type CategoryFilter = 'All' | PaletteCategory
const activeCategory = ref<CategoryFilter>('All')
const filteredPalettes = computed(() =>
  activeCategory.value === 'All'
    ? palettes
    : palettes.filter((p) => p.category === activeCategory.value),
)

let nextId = 5
const selectedPaletteName = ref(palettes[0]!.name)
const bgColor = ref(palettes[0]!.bg)

function makeBlob(id: number, color: string): Blob {
  return {
    id,
    color,
    x: Math.round(15 + Math.random() * 70),
    y: Math.round(15 + Math.random() * 70),
    size: Math.round(50 + Math.random() * 40),
    opacity: Math.round((0.6 + Math.random() * 0.3) * 10) / 10,
  }
}

const blobs = reactive<Blob[]>(palettes[0]!.colors.map((c, i) => makeBlob(i + 1, c)))

function applyPalette(p: Palette) {
  selectedPaletteName.value = p.name
  bgColor.value = p.bg
  blobs.splice(0, blobs.length, ...p.colors.map((c, i) => makeBlob(i + 1, c)))
  nextId = blobs.length + 1
  // Re-init anims if video mode is active
  if (mode.value === 'video') {
    blobs.forEach((b) => {
      blobAnims.set(b.id, { sx: b.x, sy: b.y, tx: rndPos(), ty: rndPos(), p: 0 })
    })
  }
}

function randomize() {
  blobs.forEach((b) => {
    b.x = Math.round(10 + Math.random() * 80)
    b.y = Math.round(10 + Math.random() * 80)
    b.size = Math.round(45 + Math.random() * 50)
    b.opacity = Math.round((0.5 + Math.random() * 0.4) * 10) / 10
  })
}

function addBlob() {
  if (blobs.length >= 8) return
  const p = palettes.find((p) => p.name === selectedPaletteName.value) ?? palettes[0]!
  const color = p.colors[blobs.length % p.colors.length] ?? '#ffffff'
  const b = makeBlob(nextId++, color)
  blobs.push(b)
  if (mode.value === 'video') {
    blobAnims.set(b.id, { sx: b.x, sy: b.y, tx: rndPos(), ty: rndPos(), p: 0 })
  }
}

function removeBlob(id: number) {
  if (blobs.length <= 2) return
  const idx = blobs.findIndex((b) => b.id === id)
  if (idx !== -1) blobs.splice(idx, 1)
  blobAnims.delete(id)
}

// --- Selected blob ---
const selectedId = ref<number | null>(blobs[0]?.id ?? null)
const selectedBlob = computed(() => blobs.find((b) => b.id === selectedId.value) ?? null)

// --- Drag ---
const previewEl = ref<HTMLElement | null>(null)
const draggingId = ref<number | null>(null)

function onMouseDown(e: MouseEvent, blob: Blob) {
  draggingId.value = blob.id
  selectedId.value = blob.id
  e.preventDefault()
}

function onMouseMove(e: MouseEvent) {
  if (draggingId.value === null || !previewEl.value) return
  const blob = blobs.find((b) => b.id === draggingId.value)
  if (!blob) return
  const rect = previewEl.value.getBoundingClientRect()
  blob.x = Math.min(100, Math.max(0, Math.round(((e.clientX - rect.left) / rect.width) * 100)))
  blob.y = Math.min(100, Math.max(0, Math.round(((e.clientY - rect.top) / rect.height) * 100)))
}

function onMouseUp() {
  if (draggingId.value !== null && mode.value === 'video') {
    const b = blobs.find((b) => b.id === draggingId.value)
    if (b) {
      // Reset this blob's animation from its current drag position
      blobAnims.set(b.id, { sx: b.x, sy: b.y, tx: rndPos(), ty: rndPos(), p: 0 })
    }
  }
  draggingId.value = null
}

// Touch support
function onTouchMove(e: TouchEvent) {
  if (draggingId.value === null || !previewEl.value || !e.touches[0]) return
  const blob = blobs.find((b) => b.id === draggingId.value)
  if (!blob) return
  const rect = previewEl.value.getBoundingClientRect()
  const t = e.touches[0]
  blob.x = Math.min(100, Math.max(0, Math.round(((t.clientX - rect.left) / rect.width) * 100)))
  blob.y = Math.min(100, Math.max(0, Math.round(((t.clientY - rect.top) / rect.height) * 100)))
  e.preventDefault()
}

// --- Animation ---
type AnimMode = 'image' | 'video'
type AnimEasing = 'linear' | 'ease' | 'spring'

const mode = ref<AnimMode>('image')
const animSpeed = ref(1)
const animEasing = ref<AnimEasing>('ease')

interface BlobAnim {
  sx: number
  sy: number
  tx: number
  ty: number
  p: number
}
const blobAnims = new Map<number, BlobAnim>()
let rafId: number | null = null
let lastTime = 0

function rndPos() {
  return Math.round(8 + Math.random() * 84)
}

function eased(t: number, type: AnimEasing): number {
  if (type === 'linear') return t
  if (type === 'ease') return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  // spring — elastic ease-out
  if (t === 0) return 0
  if (t === 1) return 1
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1
}

function animStep(ts: number) {
  if (mode.value !== 'video') {
    rafId = null
    return
  }
  const dt = lastTime ? Math.min((ts - lastTime) / 16.67, 3) : 1
  lastTime = ts

  blobs.forEach((b) => {
    if (b.id === draggingId.value) return // skip while dragging
    let anim = blobAnims.get(b.id)
    if (!anim) {
      anim = { sx: b.x, sy: b.y, tx: rndPos(), ty: rndPos(), p: 0 }
      blobAnims.set(b.id, anim)
    }
    anim.p = Math.min(1, anim.p + animSpeed.value * 0.006 * dt)
    const t = eased(anim.p, animEasing.value)
    b.x = Math.min(95, Math.max(5, anim.sx + (anim.tx - anim.sx) * t))
    b.y = Math.min(95, Math.max(5, anim.sy + (anim.ty - anim.sy) * t))
    if (anim.p >= 1) {
      anim.sx = b.x
      anim.sy = b.y
      anim.tx = rndPos()
      anim.ty = rndPos()
      anim.p = 0
    }
  })

  // Draw current frame to recording canvas if active
  if (recording.value && recordCanvas && recordCtx) {
    drawFrame(recordCtx, recordCanvas.width, recordCanvas.height)
  }

  rafId = requestAnimationFrame(animStep)
}

function setMode(m: AnimMode) {
  mode.value = m
  if (m === 'video') {
    lastTime = 0
    blobs.forEach((b) => {
      blobAnims.set(b.id, { sx: b.x, sy: b.y, tx: rndPos(), ty: rndPos(), p: 0 })
    })
    rafId = requestAnimationFrame(animStep)
  } else {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }
}

onUnmounted(() => {
  if (rafId !== null) cancelAnimationFrame(rafId)
})

// --- Video export ---
const RECORD_DURATIONS = [3, 5, 10, 15]
const recordDuration = ref(5)
const recording = ref(false)
const recordSecsLeft = ref(0)
let recordCanvas: HTMLCanvasElement | null = null
let recordCtx: CanvasRenderingContext2D | null = null

function drawFrame(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = bgColor.value
  ctx.fillRect(0, 0, w, h)
  blobs.forEach((b) => {
    const cx = (b.x / 100) * w
    const cy = (b.y / 100) * h
    const r = (b.size / 100) * w * 0.75
    ctx.save()
    ctx.filter = `blur(${Math.round(w * 0.055)}px)`
    ctx.globalAlpha = b.opacity
    ctx.fillStyle = b.color
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  })
}

async function startRecording() {
  if (recording.value) return
  const W = resolvedExportWidth.value
  const H = resolvedExportHeight.value
  recordCanvas = document.createElement('canvas')
  recordCanvas.width = W
  recordCanvas.height = H
  recordCtx = recordCanvas.getContext('2d')!

  const stream = recordCanvas.captureStream(30)
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm'
  const recorder = new MediaRecorder(stream, { mimeType })
  const chunks: BlobPart[] = []

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mesh-gradient.webm'
    a.click()
    URL.revokeObjectURL(url)
    recording.value = false
    recordCanvas = null
    recordCtx = null
  }

  recording.value = true
  recordSecsLeft.value = recordDuration.value
  recorder.start()

  const interval = setInterval(() => {
    recordSecsLeft.value--
    if (recordSecsLeft.value <= 0) {
      clearInterval(interval)
      recorder.stop()
    }
  }, 1000)
}

// --- CSS output ---
const cssOutput = computed(() => {
  const layers = blobs
    .map((b) => {
      const hex = b.color.replace('#', '')
      const alpha = Math.round(b.opacity * 255)
        .toString(16)
        .padStart(2, '0')
      return `  radial-gradient(ellipse ${b.size}% ${b.size}% at ${b.x}% ${b.y}%, #${hex}${alpha} 0%, transparent 70%)`
    })
    .join(',\n')
  return `background-color: ${bgColor.value};\nbackground-image:\n${layers};`
})

const showCss = ref(false)
const showExport = ref(false)
function toggleCss() {
  showCss.value = !showCss.value
  showExport.value = false
}
function toggleExport() {
  showExport.value = !showExport.value
  showCss.value = false
}
function selectPreset(w: number) {
  exportWidth.value = w
  useCustomWidth.value = false
}
const copied = ref(false)
async function copyCSS() {
  await navigator.clipboard.writeText(cssOutput.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

// --- PNG download ---
const exporting = ref(false)
function downloadPNG() {
  exporting.value = true
  const W = resolvedExportWidth.value
  const H = resolvedExportHeight.value
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  drawFrame(ctx, W, H)
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mesh-gradient.png'
    a.click()
    URL.revokeObjectURL(url)
    exporting.value = false
  }, 'image/png')
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body relative">
    <!-- J2Team ambient background -->
    <div
      v-if="showBg"
      class="fixed inset-0 pointer-events-none z-0"
      :style="{ opacity: 0.2, backgroundImage: pageBg }"
    />

    <!-- Header -->
    <div class="max-w-6xl mx-auto px-4 pt-8 pb-4 flex items-center justify-between relative z-10">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-1.5 text-text-dim text-sm hover:text-text-primary transition shrink-0"
      >
        <Icon icon="lucide:arrow-left" class="size-4" />
        <span class="hidden sm:inline">Trang chủ</span>
      </RouterLink>
      <div class="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <h1 class="font-display text-2xl font-bold text-accent-coral">Mesh Gradient</h1>
        <p class="text-text-dim text-xs">Tạo gradient · kéo blob · xuất CSS</p>
      </div>
      <button
        class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 border transition shrink-0"
        :class="
          showBg
            ? 'border-accent-coral/40 text-accent-coral'
            : 'border-border-default text-text-dim'
        "
        @click="showBg = !showBg"
      >
        <Icon icon="lucide:sparkles" class="size-3" />
        <span class="hidden sm:inline">{{ showBg ? 'Màu nền' : 'Tắt nền' }}</span>
      </button>
    </div>

    <!-- Toolbar -->
    <div class="max-w-6xl mx-auto px-4 pb-4 relative z-20">
      <div class="flex items-center justify-center gap-2 flex-wrap">
        <!-- Ảnh / Video toggle -->
        <div
          class="inline-flex items-center border border-border-default overflow-hidden rounded text-xs"
        >
          <button
            class="px-4 py-1.5 inline-flex items-center gap-1.5 transition-colors"
            :class="
              mode === 'image'
                ? 'bg-bg-elevated text-text-primary'
                : 'text-text-dim hover:text-text-secondary'
            "
            @click="setMode('image')"
          >
            <Icon icon="lucide:image" class="size-3" />
            Ảnh
          </button>
          <div class="w-px self-stretch bg-border-default" />
          <button
            class="px-4 py-1.5 inline-flex items-center gap-1.5 transition-colors"
            :class="
              mode === 'video'
                ? 'bg-bg-elevated text-accent-coral'
                : 'text-text-dim hover:text-text-secondary'
            "
            @click="setMode('video')"
          >
            <Icon icon="lucide:clapperboard" class="size-3" />
            Video
          </button>
        </div>

        <!-- CSS dropdown button -->
        <button
          class="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border transition"
          :class="
            showCss
              ? 'border-accent-amber text-accent-amber bg-accent-amber/10'
              : 'border-border-default text-text-secondary hover:border-accent-amber/50'
          "
          @click="toggleCss"
        >
          <Icon icon="lucide:code-2" class="size-3" />
          CSS
          <Icon
            :icon="showCss ? 'lucide:chevron-up' : 'lucide:chevron-down'"
            class="size-3 ml-0.5"
          />
        </button>

        <!-- Export dropdown button -->
        <button
          class="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border transition"
          :class="
            showExport
              ? 'border-accent-sky text-accent-sky bg-accent-sky/10'
              : 'border-border-default text-text-secondary hover:border-accent-sky/50'
          "
          @click="toggleExport"
        >
          <Icon icon="lucide:download" class="size-3" />
          Export
          <Icon
            :icon="showExport ? 'lucide:chevron-up' : 'lucide:chevron-down'"
            class="size-3 ml-0.5"
          />
        </button>

        <!-- Video mode: easing + speed (realtime controls stay in toolbar) -->
        <template v-if="mode === 'video'">
          <div class="w-px h-4 bg-border-default" />

          <div
            class="inline-flex items-center border border-border-default overflow-hidden rounded text-xs"
          >
            <button
              v-for="e in ['linear', 'ease', 'spring'] as const"
              :key="e"
              class="px-3 py-1.5 transition-colors capitalize"
              :class="
                animEasing === e
                  ? 'bg-bg-elevated text-accent-amber'
                  : 'text-text-dim hover:text-text-secondary'
              "
              @click="animEasing = e"
            >
              {{ e }}
            </button>
          </div>

          <div class="flex items-center gap-2">
            <Icon icon="lucide:gauge" class="size-3 text-text-dim" />
            <input
              v-model.number="animSpeed"
              type="range"
              min="0.2"
              max="3"
              step="0.1"
              class="w-24 accent-accent-coral"
            />
            <span class="text-xs font-mono text-text-dim w-8">{{ animSpeed }}×</span>
          </div>
        </template>
      </div>

      <!-- CSS dropdown panel -->
      <Transition name="css-panel">
        <div
          v-if="showCss"
          class="mt-2 border border-border-default bg-bg-surface rounded-lg overflow-hidden"
        >
          <div class="flex items-center justify-between px-4 py-2 border-b border-border-default">
            <span class="text-text-dim text-xs font-mono">CSS output</span>
            <button
              class="inline-flex items-center gap-1.5 text-xs px-3 py-1 border border-border-default transition hover:border-accent-coral"
              :class="copied ? 'text-green-400 border-green-500/40' : 'text-text-secondary'"
              @click="copyCSS"
            >
              <Icon :icon="copied ? 'lucide:check' : 'lucide:copy'" class="size-3" />
              {{ copied ? 'Đã copy' : 'Copy CSS' }}
            </button>
          </div>
          <pre
            class="text-[11px] text-text-secondary font-mono p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap"
            >{{ cssOutput }}</pre
          >
        </div>
      </Transition>

      <!-- Export dropdown panel -->
      <Transition name="css-panel">
        <div
          v-if="showExport"
          class="mt-2 border border-border-default bg-bg-surface rounded-lg p-4 flex flex-col gap-4"
        >
          <!-- Ratio -->
          <div class="flex items-center gap-3 flex-wrap">
            <span class="text-text-dim text-xs w-16 shrink-0">Tỉ lệ</span>
            <div class="flex gap-1 flex-wrap">
              <button
                v-for="r in RATIOS"
                :key="r.value"
                class="text-[10px] px-2 py-0.5 border transition"
                :class="
                  exportRatio === r.value
                    ? 'border-accent-sky text-accent-sky bg-accent-sky/10'
                    : 'border-border-default text-text-dim hover:border-accent-sky/50'
                "
                @click="exportRatio = r.value"
              >
                {{ r.label }}
              </button>
            </div>
          </div>

          <!-- Size -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-3 flex-wrap">
              <span class="text-text-dim text-xs w-16 shrink-0">Kích thước</span>
              <div class="flex gap-1 flex-wrap">
                <button
                  v-for="ep in EXPORT_PRESETS"
                  :key="ep.w"
                  class="text-[10px] px-2 py-0.5 border transition"
                  :class="
                    !useCustomWidth && exportWidth === ep.w
                      ? 'border-accent-sky text-accent-sky bg-accent-sky/10'
                      : 'border-border-default text-text-dim hover:border-accent-sky/50'
                  "
                  @click="selectPreset(ep.w)"
                >
                  {{ ep.label }}
                </button>
                <button
                  class="text-[10px] px-2 py-0.5 border transition"
                  :class="
                    useCustomWidth
                      ? 'border-accent-sky text-accent-sky bg-accent-sky/10'
                      : 'border-border-default text-text-dim hover:border-accent-sky/50'
                  "
                  @click="useCustomWidth = true"
                >
                  Custom
                </button>
              </div>
            </div>
            <div class="flex items-center gap-2 pl-[76px]">
              <template v-if="useCustomWidth">
                <input
                  v-model.number="customWidth"
                  type="number"
                  min="100"
                  max="8192"
                  class="w-20 bg-bg-elevated border border-border-default px-2 py-0.5 text-xs font-mono text-text-primary focus:outline-none focus:border-accent-sky"
                />
                <span class="text-text-dim text-[11px]">× {{ resolvedExportHeight }}px</span>
              </template>
              <span v-else class="text-text-dim text-[11px]"
                >{{ resolvedExportWidth }} × {{ resolvedExportHeight }}px</span
              >
            </div>
          </div>

          <!-- Divider -->
          <div class="border-t border-border-default" />

          <!-- Download actions -->
          <div class="flex items-center gap-3 flex-wrap">
            <!-- Image mode: PNG -->
            <button
              v-if="mode === 'image'"
              class="inline-flex items-center gap-1.5 text-xs px-4 py-2 border border-border-default text-text-secondary transition hover:border-accent-sky hover:text-accent-sky"
              @click="downloadPNG"
            >
              <Icon icon="lucide:image" class="size-3" />
              Tải PNG
            </button>

            <!-- Video mode: duration + record -->
            <template v-if="mode === 'video'">
              <div
                class="inline-flex items-center border border-border-default overflow-hidden rounded text-xs"
              >
                <button
                  v-for="d in RECORD_DURATIONS"
                  :key="d"
                  class="px-2.5 py-1.5 transition-colors"
                  :class="
                    recordDuration === d
                      ? 'bg-bg-elevated text-text-primary'
                      : 'text-text-dim hover:text-text-secondary'
                  "
                  :disabled="recording"
                  @click="recordDuration = d"
                >
                  {{ d }}s
                </button>
              </div>
              <button
                class="inline-flex items-center gap-1.5 text-xs px-4 py-2 border transition min-w-36 justify-center"
                :class="
                  recording
                    ? 'border-red-500/40 text-red-400 cursor-not-allowed'
                    : 'border-border-default text-text-secondary hover:border-red-500 hover:text-red-400'
                "
                :disabled="recording"
                @click="startRecording"
              >
                <span
                  class="inline-block size-2 rounded-full shrink-0"
                  :class="recording ? 'bg-red-500 animate-pulse' : 'bg-text-dim'"
                />
                <span v-if="recording">Rendering... {{ recordSecsLeft }}s</span>
                <span v-else>Xuất WebM</span>
              </button>
            </template>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Preview — full width -->
    <div class="max-w-6xl mx-auto px-4 pb-4 relative z-10">
      <div
        ref="previewEl"
        class="relative w-full rounded-xl overflow-hidden select-none cursor-crosshair"
        :style="{ aspectRatio: exportRatio, backgroundColor: bgColor }"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseUp"
        @touchmove.prevent="onTouchMove"
        @touchend="onMouseUp"
      >
        <!-- Blobs -->
        <div
          v-for="blob in blobs"
          :key="blob.id"
          class="absolute rounded-full pointer-events-none"
          :style="{
            left: blob.x + '%',
            top: blob.y + '%',
            width: blob.size * 1.5 + '%',
            height: blob.size * 1.5 + '%',
            transform: 'translate(-50%, -50%)',
            background: blob.color,
            opacity: blob.opacity,
            filter: 'blur(60px)',
          }"
        />

        <!-- Drag handles (hidden during export) -->
        <div
          v-for="blob in blobs"
          v-show="!exporting"
          :key="'h' + blob.id"
          class="absolute size-5 rounded-full border-2 cursor-grab active:cursor-grabbing transition-transform hover:scale-125 z-10"
          :style="{
            left: blob.x + '%',
            top: blob.y + '%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: blob.color,
            borderColor: selectedId === blob.id ? '#fff' : 'rgba(255,255,255,0.4)',
            boxShadow: selectedId === blob.id ? '0 0 0 2px ' + blob.color : 'none',
          }"
          @mousedown="onMouseDown($event, blob)"
          @touchstart.prevent="
            () => {
              draggingId = blob.id
              selectedId = blob.id
            }
          "
          @click="selectedId = blob.id"
        />
      </div>
    </div>

    <!-- Controls row -->
    <div class="max-w-6xl mx-auto px-4 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
      <!-- Palettes -->
      <div class="border border-border-default bg-bg-surface p-4 rounded-lg">
        <!-- Header -->
        <div class="flex items-center justify-between mb-3">
          <p class="text-text-dim text-xs">Palette</p>
          <button
            class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 border border-border-default text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            @click="randomize"
          >
            <Icon icon="lucide:shuffle" class="size-3" />
            Randomize
          </button>
        </div>
        <!-- Category tabs -->
        <div class="flex gap-1.5 flex-wrap mb-3">
          <button
            class="text-[10px] px-2 py-0.5 border transition"
            :class="
              activeCategory === 'All'
                ? 'border-accent-amber text-accent-amber bg-accent-amber/10'
                : 'border-border-default text-text-dim hover:border-accent-amber/50 hover:text-text-secondary'
            "
            @click="activeCategory = 'All'"
          >
            All
          </button>
          <button
            v-for="cat in CATEGORIES"
            :key="cat"
            class="text-[10px] px-2 py-0.5 border transition"
            :class="
              activeCategory === cat
                ? 'border-accent-amber text-accent-amber bg-accent-amber/10'
                : 'border-border-default text-text-dim hover:border-accent-amber/50 hover:text-text-secondary'
            "
            @click="activeCategory = cat"
          >
            {{ cat }}
          </button>
        </div>
        <!-- Palette grid -->
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="p in filteredPalettes"
            :key="p.name"
            class="flex items-center gap-2 px-3 py-2 border transition text-sm"
            :class="
              selectedPaletteName === p.name
                ? 'border-accent-amber bg-accent-amber/10 text-accent-amber'
                : 'border-border-default text-text-secondary hover:border-accent-amber/50'
            "
            @click="applyPalette(p)"
          >
            <span class="flex gap-0.5 shrink-0">
              <span
                v-for="c in p.colors.slice(0, 4)"
                :key="c"
                class="inline-block w-2.5 h-2.5 rounded-full"
                :style="{ background: c }"
              />
            </span>
            <span class="text-xs truncate">{{ p.name }}</span>
          </button>
        </div>
      </div>

      <!-- Blob editor -->
      <div class="border border-border-default bg-bg-surface p-4 rounded-lg">
        <!-- Header: title + bg color + add button -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <p class="text-text-dim text-xs">
              Blobs
              <span class="font-mono ml-1">({{ blobs.length }}/8)</span>
            </p>
            <div class="flex items-center gap-1.5">
              <span class="text-text-dim text-xs">Nền</span>
              <input
                v-model="bgColor"
                type="color"
                class="w-6 h-6 rounded cursor-pointer border border-border-default bg-transparent"
              />
            </div>
          </div>
          <button
            class="inline-flex items-center gap-1 text-xs px-2.5 py-1 border border-border-default text-text-secondary transition hover:border-green-500 hover:text-green-400"
            :disabled="blobs.length >= 8"
            :class="blobs.length >= 8 ? 'opacity-40 cursor-not-allowed' : ''"
            @click="addBlob"
          >
            <Icon icon="lucide:plus" class="size-3" />
            Thêm blob
          </button>
        </div>

        <!-- Blob list -->
        <div class="flex flex-col gap-2 mb-4">
          <div
            v-for="blob in blobs"
            :key="blob.id"
            role="button"
            tabindex="0"
            class="flex items-center gap-2 px-3 py-2 border transition text-left cursor-pointer"
            :class="
              selectedId === blob.id
                ? 'border-white/20 bg-bg-elevated'
                : 'border-border-default hover:border-border-default/80'
            "
            @click="selectedId = blob.id"
            @keydown.enter.space="selectedId = blob.id"
          >
            <span
              class="inline-block w-4 h-4 rounded-full shrink-0"
              :style="{ background: blob.color }"
            />
            <span class="font-mono text-xs text-text-secondary flex-1">{{ blob.color }}</span>
            <span class="text-text-dim text-[11px]"
              >{{ Math.round(blob.x) }},{{ Math.round(blob.y) }}</span
            >
            <span
              role="button"
              tabindex="0"
              class="text-text-dim hover:text-red-400 transition ml-1"
              :class="blobs.length <= 2 ? 'opacity-30 pointer-events-none' : 'cursor-pointer'"
              @click.stop="removeBlob(blob.id)"
              @keydown.enter.space.stop="removeBlob(blob.id)"
            >
              <Icon icon="lucide:x" class="size-3" />
            </span>
          </div>
        </div>

        <!-- Selected blob controls -->
        <template v-if="selectedBlob">
          <div class="border-t border-border-default pt-4 flex flex-col gap-3">
            <p class="text-text-dim text-[11px]">Chỉnh blob đang chọn</p>

            <!-- Color -->
            <div class="flex items-center gap-3">
              <label class="text-text-dim text-xs w-14">Màu</label>
              <input
                v-model="selectedBlob.color"
                type="color"
                class="w-8 h-8 rounded cursor-pointer border border-border-default bg-transparent"
              />
              <input
                v-model="selectedBlob.color"
                type="text"
                class="flex-1 bg-bg-elevated border border-border-default px-2 py-1 text-xs font-mono text-text-primary focus:outline-none"
              />
            </div>

            <!-- Size -->
            <div class="flex items-center gap-3">
              <label class="text-text-dim text-xs w-14">Kích thước</label>
              <input
                v-model.number="selectedBlob.size"
                type="range"
                min="20"
                max="120"
                class="flex-1 accent-accent-coral"
              />
              <span class="text-text-dim text-xs font-mono w-8 text-right">{{
                selectedBlob.size
              }}</span>
            </div>

            <!-- Opacity -->
            <div class="flex items-center gap-3">
              <label class="text-text-dim text-xs w-14">Opacity</label>
              <input
                v-model.number="selectedBlob.opacity"
                type="range"
                min="0.2"
                max="1"
                step="0.05"
                class="flex-1 accent-accent-coral"
              />
              <span class="text-text-dim text-xs font-mono w-8 text-right">{{
                selectedBlob.opacity
              }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.css-panel-enter-active,
.css-panel-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.css-panel-enter-from,
.css-panel-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
