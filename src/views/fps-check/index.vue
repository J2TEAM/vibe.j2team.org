<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { RouterLink } from 'vue-router'

// --- Types ---
interface Lane {
  label: string
  targetFps: number
  color: string
  glow: string
  position: number
  lastDrawTime: number
}

// --- FPS tracking (actual browser) ---
const fps = ref(0)
const frameTime = ref(0)
const frameTimeHistory = ref<number[]>([])
const maxHistoryLength = 120

let lastTimestamp = 0
let frameCount = 0
let fpsAccumulator = 0
let animationId = 0

// --- Presets ---
interface Preset {
  name: string
  rates: number[]
}

const presets: Preset[] = [
  { name: '15 vs 30 vs 60', rates: [15, 30, 60] },
  { name: '30 vs 60', rates: [30, 60] },
  { name: '30 vs 60 vs 120', rates: [30, 60, 120] },
  { name: '60 vs 120 vs 144', rates: [60, 120, 144] },
  { name: '60 vs 144 vs 240', rates: [60, 144, 240] },
  { name: 'Tuỳ chỉnh', rates: [] },
]

const selectedPresetIndex = ref(0)

const laneColors = [
  { color: '#FF6B4A', glow: 'rgba(255,107,74,0.3)' },
  { color: '#38BDF8', glow: 'rgba(56,189,248,0.3)' },
  { color: '#FFB830', glow: 'rgba(255,184,48,0.3)' },
  { color: '#fb7185', glow: 'rgba(251,113,133,0.3)' },
  { color: '#34d399', glow: 'rgba(52,211,153,0.3)' },
]

// --- Lanes ---
const lanes = reactive<Lane[]>([])

function buildLanes(rates: number[]) {
  lanes.length = 0
  rates.forEach((targetFps, i) => {
    const idx = i % laneColors.length
    const color = laneColors[idx]?.color ?? '#FF6B4A'
    const glow = laneColors[idx]?.glow ?? 'rgba(255,107,74,0.3)'
    lanes.push({
      label: `${targetFps} FPS`,
      targetFps,
      color,
      glow,
      position: 0,
      lastDrawTime: 0,
    })
  })
}

function applyPreset(index: number) {
  selectedPresetIndex.value = index
  const preset = presets[index]
  if (preset && preset.rates.length > 0) {
    buildLanes(preset.rates)
  }
}

// --- Custom lane input ---
const customFpsInput = ref('60')

function addCustomLane() {
  const val = parseInt(customFpsInput.value)
  if (val > 0 && val <= 1000 && lanes.length < 5) {
    const idx = lanes.length % laneColors.length
    const color = laneColors[idx]?.color ?? '#FF6B4A'
    const glow = laneColors[idx]?.glow ?? 'rgba(255,107,74,0.3)'
    lanes.push({
      label: `${val} FPS`,
      targetFps: val,
      color,
      glow,
      position: 0,
      lastDrawTime: 0,
    })
    selectedPresetIndex.value = presets.length - 1
  }
}

function removeLane(index: number) {
  lanes.splice(index, 1)
  selectedPresetIndex.value = presets.length - 1
}

// --- Test settings ---
const speeds: readonly number[] = [480, 960, 1920, 3840] as const
const selectedSpeedIndex = ref(1)
const speed = computed(() => speeds[selectedSpeedIndex.value] ?? 960)
const isPaused = ref(false)
const showGraph = ref(true)
const showSettings = ref(false)
const testMode = ref<'bars' | 'chase'>('bars')
const activeTab = ref<'framerate' | 'jank' | 'scroll' | 'ghosting'>('framerate')

// --- Screen info ---
const screenWidth = ref(window.screen.width)
const screenHeight = ref(window.screen.height)
const devicePixelRatio = ref(window.devicePixelRatio)
const detectedHz = ref(0)

function detectRefreshRate() {
  let hzFrames = 0
  let hzStart = 0
  let hzId = 0
  function hzLoop(ts: number) {
    if (hzStart === 0) { hzStart = ts; hzFrames = 0 }
    hzFrames++
    const elapsed = ts - hzStart
    if (elapsed >= 1000) {
      detectedHz.value = Math.round(hzFrames / (elapsed / 1000))
    } else {
      hzId = requestAnimationFrame(hzLoop)
    }
  }
  hzId = requestAnimationFrame(hzLoop)
  // cleanup handled by onUnmounted canceling animationId; hzId runs only ~1s
  setTimeout(() => cancelAnimationFrame(hzId), 1500)
}

// --- Jank / Stutter Detector ---
interface JankEvent {
  timestamp: number
  frameDuration: number
}
const jankEvents = ref<JankEvent[]>([])
const jankTimelineLength = 300 // ~5 seconds at 60fps
const jankFrameTimes = ref<number[]>([])
const jankScore = ref(100)
const jankTotalDropped = ref(0)
const jankRecording = ref(true)
const jankStartTime = ref(0)
const jankThreshold = 25 // ms — frames longer than this are considered janky

function updateJank(delta: number, timestamp: number) {
  if (activeTab.value !== 'jank' || !jankRecording.value) return
  if (jankStartTime.value === 0) jankStartTime.value = timestamp

  jankFrameTimes.value.push(delta)
  if (jankFrameTimes.value.length > jankTimelineLength) {
    jankFrameTimes.value.shift()
  }

  if (delta > jankThreshold) {
    jankTotalDropped.value++
    jankEvents.value.push({ timestamp: timestamp - jankStartTime.value, frameDuration: Math.round(delta) })
    if (jankEvents.value.length > 200) jankEvents.value.shift()
  }

  // Smoothness score: percentage of frames within budget
  const recent = jankFrameTimes.value.slice(-120)
  const goodFrames = recent.filter((t) => t <= jankThreshold).length
  jankScore.value = recent.length > 0 ? Math.round((goodFrames / recent.length) * 100) : 100
}

function resetJank() {
  jankEvents.value = []
  jankFrameTimes.value = []
  jankScore.value = 100
  jankTotalDropped.value = 0
  jankStartTime.value = 0
}

const jankTimelinePoints = computed(() => {
  const history = jankFrameTimes.value
  if (history.length < 2) return ''
  const w = 360
  const h = 80
  const maxMs = 60
  const step = w / (jankTimelineLength - 1)
  return history
    .map((ms, i) => {
      const x = i * step
      const y = h - Math.min(ms / maxMs, 1) * h
      return `${x},${y}`
    })
    .join(' ')
})

const jankTimelineFill = computed(() => {
  const pts = jankTimelinePoints.value
  if (!pts) return ''
  const lastX = ((jankFrameTimes.value.length - 1) / (jankTimelineLength - 1)) * 360
  return `0,80 ${pts} ${lastX},80`
})

function jankScoreColor(score: number): string {
  if (score >= 95) return 'text-green-400'
  if (score >= 80) return 'text-accent-amber'
  return 'text-red-400'
}

function jankScoreLabel(score: number): string {
  if (score >= 98) return 'Hoàn hảo'
  if (score >= 95) return 'Rất mượt'
  if (score >= 85) return 'Ổn'
  if (score >= 70) return 'Hơi trễ'
  return 'Trễ nhiều'
}

// --- Scroll Jank Test ---
const scrollJankScore = ref(100)
const scrollFrameTimes = ref<number[]>([])
const scrollDroppedFrames = ref(0)
const scrollIsMonitoring = ref(false)
const scrollTotalFrames = ref(0)
let scrollRafId = 0
let scrollLastTs = 0
let scrolling = false
let scrollTimeout = 0

function onScroll() {
  scrolling = true
  clearTimeout(scrollTimeout)
  scrollTimeout = window.setTimeout(() => { scrolling = false }, 150)
}

function scrollMonitorLoop(ts: number) {
  if (!scrollIsMonitoring.value) return
  if (scrollLastTs > 0 && scrolling) {
    const delta = ts - scrollLastTs
    scrollTotalFrames.value++
    scrollFrameTimes.value.push(delta)
    if (scrollFrameTimes.value.length > 300) scrollFrameTimes.value.shift()
    if (delta > jankThreshold) scrollDroppedFrames.value++
    const recent = scrollFrameTimes.value.slice(-120)
    const good = recent.filter((t) => t <= jankThreshold).length
    scrollJankScore.value = recent.length > 0 ? Math.round((good / recent.length) * 100) : 100
  }
  scrollLastTs = ts
  scrollRafId = requestAnimationFrame(scrollMonitorLoop)
}

function startScrollMonitor() {
  scrollIsMonitoring.value = true
  scrollLastTs = 0
  scrollRafId = requestAnimationFrame(scrollMonitorLoop)
}

function stopScrollMonitor() {
  scrollIsMonitoring.value = false
  cancelAnimationFrame(scrollRafId)
}

function resetScrollJank() {
  scrollJankScore.value = 100
  scrollFrameTimes.value = []
  scrollDroppedFrames.value = 0
  scrollTotalFrames.value = 0
}

const scrollTimelinePoints = computed(() => {
  const history = scrollFrameTimes.value
  if (history.length < 2) return ''
  const w = 360
  const h = 60
  const maxMs = 60
  const step = w / 299
  return history
    .map((ms, i) => {
      const x = i * step
      const y = h - Math.min(ms / maxMs, 1) * h
      return `${x},${y}`
    })
    .join(' ')
})

// --- Ghosting test ---
const ghostingSpeed = ref(2)
const ghostingPosition = ref(0)
const ghostingTileWidth = 384 // px width of one repeating tile segment

// --- Container ---
const containerWidth = ref(1200)
const laneHeight = computed(() => {
  if (lanes.length === 0) return 80
  const available = 400
  return Math.max(40, Math.floor(available / lanes.length) - 8)
})

function updateGhosting(delta: number) {
  if (activeTab.value !== 'ghosting' || isPaused.value) return
  const pxPerMs = (ghostingSpeed.value * 200) / 1000
  ghostingPosition.value = (ghostingPosition.value + pxPerMs * delta) % ghostingTileWidth
}

// --- Stats ---
const minFps = ref(Infinity)
const maxFps = ref(0)
const avgFps = ref(0)
const fpsSum = ref(0)
const fpsSamples = ref(0)
const droppedFrames = ref(0)

function resetStats() {
  minFps.value = Infinity
  maxFps.value = 0
  avgFps.value = 0
  fpsSum.value = 0
  fpsSamples.value = 0
  droppedFrames.value = 0
  frameTimeHistory.value = []
  for (const lane of lanes) {
    lane.position = 0
    lane.lastDrawTime = 0
  }
}

// --- Frame time graph ---
const graphPoints = computed(() => {
  const history = frameTimeHistory.value
  if (history.length < 2) return ''
  const w = 360
  const h = 80
  const maxMs = 50
  const step = w / (maxHistoryLength - 1)
  return history
    .map((ms, i) => {
      const x = i * step
      const y = h - Math.min(ms / maxMs, 1) * h
      return `${x},${y}`
    })
    .join(' ')
})

const graphFill = computed(() => {
  const pts = graphPoints.value
  if (!pts) return ''
  return `0,80 ${pts} 360,80`
})

const targetY = computed(() => 80 - (16.67 / 50) * 80)

// --- Main animation loop ---
function animate(timestamp: number) {
  if (lastTimestamp === 0) {
    lastTimestamp = timestamp
    for (const lane of lanes) {
      lane.lastDrawTime = timestamp
    }
    animationId = requestAnimationFrame(animate)
    return
  }

  const delta = timestamp - lastTimestamp
  lastTimestamp = timestamp
  frameTime.value = delta

  // Track frame times
  frameTimeHistory.value.push(delta)
  if (frameTimeHistory.value.length > maxHistoryLength) {
    frameTimeHistory.value.shift()
  }

  if (delta > 20) droppedFrames.value++

  // FPS calculation
  frameCount++
  fpsAccumulator += delta
  if (fpsAccumulator >= 500) {
    const currentFps = Math.round((frameCount / fpsAccumulator) * 1000)
    fps.value = currentFps
    frameCount = 0
    fpsAccumulator = 0

    if (currentFps > 0 && currentFps < 1000) {
      if (currentFps < minFps.value) minFps.value = currentFps
      if (currentFps > maxFps.value) maxFps.value = currentFps
      fpsSum.value += currentFps
      fpsSamples.value++
      avgFps.value = Math.round(fpsSum.value / fpsSamples.value)
    }
  }

  // Move each lane at its simulated framerate
  if (!isPaused.value) {
    const pxPerMs = speed.value / 1000
    const w = containerWidth.value

    for (const lane of lanes) {
      const interval = 1000 / lane.targetFps
      const elapsed = timestamp - lane.lastDrawTime

      if (elapsed >= interval) {
        const steps = Math.floor(elapsed / interval)
        const dx = pxPerMs * interval * steps
        lane.position = (lane.position + dx) % (w + 80)
        lane.lastDrawTime = timestamp - (elapsed % interval)
      }
    }
  }

  // Ghosting animation
  updateGhosting(delta)

  // Jank detector
  updateJank(delta, timestamp)

  animationId = requestAnimationFrame(animate)
}

// --- Container resize ---
const trackContainer = ref<HTMLDivElement | null>(null)

function updateContainerWidth() {
  if (trackContainer.value) {
    containerWidth.value = trackContainer.value.clientWidth
  }
}

// --- Lifecycle ---
onMounted(() => {
  applyPreset(0)
  updateContainerWidth()
  detectRefreshRate()
  window.addEventListener('resize', updateContainerWidth)
  animationId = requestAnimationFrame(animate)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  stopScrollMonitor()
  window.removeEventListener('resize', updateContainerWidth)
})

// --- Helpers ---
function fpsColor(value: number): string {
  if (value >= 55) return 'text-green-400'
  if (value >= 30) return 'text-accent-amber'
  return 'text-red-400'
}

function frameTimeColor(ms: number): string {
  if (ms <= 17) return 'text-green-400'
  if (ms <= 33) return 'text-accent-amber'
  return 'text-red-400'
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col">
    <!-- Header -->
    <header
      class="border-b border-border-default bg-bg-surface px-4 py-3 flex items-center justify-between animate-fade-up"
    >
      <div class="flex items-center gap-4">
        <RouterLink
          to="/"
          class="text-text-secondary hover:text-accent-coral transition text-sm"
        >
          &larr; Trang chủ
        </RouterLink>
        <h1 class="font-display text-xl font-bold tracking-tight">
          FPS Check
        </h1>
      </div>
      <div class="flex items-center gap-3">
        <span class="font-display text-3xl font-bold tabular-nums" :class="fpsColor(fps)">
          {{ fps }}
        </span>
        <span class="text-text-dim text-xs uppercase tracking-wider">FPS</span>
      </div>
    </header>

    <!-- Stats bar -->
    <div
      class="border-b border-border-default bg-bg-surface/50 px-4 py-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs animate-fade-up animate-delay-1"
    >
      <div class="flex items-center gap-1.5">
        <span class="text-text-dim">Khung hình:</span>
        <span class="tabular-nums inline-block w-12 text-right" :class="frameTimeColor(frameTime)">
          {{ frameTime.toFixed(1) }}ms
        </span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-text-dim">Thấp nhất:</span>
        <span class="tabular-nums text-text-secondary">
          {{ minFps === Infinity ? '—' : minFps }}
        </span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-text-dim">Cao nhất:</span>
        <span class="tabular-nums text-text-secondary">{{ maxFps || '—' }}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-text-dim">Trung bình:</span>
        <span class="tabular-nums text-text-secondary">{{ avgFps || '—' }}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-text-dim">Rớt khung:</span>
        <span class="tabular-nums" :class="droppedFrames > 0 ? 'text-red-400' : 'text-text-secondary'">
          {{ droppedFrames }}
        </span>
      </div>
    </div>

    <!-- Toolbar -->
    <div
      class="border-b border-border-default bg-bg-surface/30 px-3 py-1.5 flex items-center gap-2 text-xs animate-fade-up animate-delay-2 overflow-x-auto"
    >
      <!-- Tabs -->
      <button
        class="px-2 py-1 border transition whitespace-nowrap"
        :class="
          activeTab === 'framerate'
            ? 'border-accent-sky text-accent-sky bg-accent-sky/10'
            : 'border-border-default text-text-secondary hover:border-text-dim'
        "
        @click="activeTab = 'framerate'"
      >
        🎬 Khung hình
      </button>
      <button
        class="px-2 py-1 border transition whitespace-nowrap"
        :class="
          activeTab === 'jank'
            ? 'border-accent-sky text-accent-sky bg-accent-sky/10'
            : 'border-border-default text-text-secondary hover:border-text-dim'
        "
        @click="activeTab = 'jank'"
      >
        📊 Trễ nhịp
      </button>
      <button
        class="px-2 py-1 border transition whitespace-nowrap"
        :class="
          activeTab === 'scroll'
            ? 'border-accent-sky text-accent-sky bg-accent-sky/10'
            : 'border-border-default text-text-secondary hover:border-text-dim'
        "
        @click="activeTab = 'scroll'; startScrollMonitor()"
      >
        📜 Cuộn
      </button>
      <button
        class="px-2 py-1 border transition whitespace-nowrap"
        :class="
          activeTab === 'ghosting'
            ? 'border-accent-sky text-accent-sky bg-accent-sky/10'
            : 'border-border-default text-text-secondary hover:border-text-dim'
        "
        @click="activeTab = 'ghosting'"
      >
        👻 Lưu ảnh
      </button>

      <div class="w-px h-4 bg-border-default mx-1"></div>

      <!-- Actions (always visible) -->
      <button
        v-if="activeTab === 'framerate'"
        class="px-2 py-1 border transition whitespace-nowrap"
        :class="
          showSettings
            ? 'border-accent-coral text-accent-coral bg-accent-coral/10'
            : 'border-border-default text-text-secondary hover:border-text-dim'
        "
        @click="showSettings = !showSettings"
      >
        ⚙ Cài đặt
      </button>
      <button
        class="px-2 py-1 border border-border-default text-text-secondary hover:border-accent-coral hover:text-accent-coral transition whitespace-nowrap"
        @click="isPaused = !isPaused"
      >
        {{ isPaused ? '▶ Tiếp' : '⏸ Dừng' }}
      </button>
      <button
        class="px-2 py-1 border border-border-default text-text-secondary hover:border-accent-coral hover:text-accent-coral transition whitespace-nowrap"
        @click="resetStats()"
      >
        ↺
      </button>
      <button
        class="px-2 py-1 border border-border-default text-text-secondary hover:border-accent-sky hover:text-accent-sky transition whitespace-nowrap"
        @click="showGraph = !showGraph"
      >
        {{ showGraph ? '▼ Ẩn biểu đồ' : '▶ Biểu đồ' }}
      </button>
    </div>

    <!-- Settings dropdown -->
    <div
      v-if="showSettings"
      class="border-b border-border-default bg-bg-surface/60 px-3 py-3 space-y-3 text-xs"
    >
      <!-- Presets -->
      <div class="space-y-1">
        <span class="text-text-dim uppercase tracking-wider text-[10px]">So sánh tốc độ khung hình</span>
        <div class="flex gap-1 flex-wrap">
          <button
            v-for="(preset, i) in presets"
            :key="preset.name"
            class="px-2.5 py-1 border transition whitespace-nowrap"
            :class="
              selectedPresetIndex === i
                ? 'border-accent-coral text-accent-coral bg-accent-coral/10'
                : 'border-border-default text-text-secondary hover:border-text-dim'
            "
            @click="applyPreset(i)"
          >
            {{ preset.name }}
          </button>
        </div>
      </div>

      <!-- Custom lane add -->
      <div v-if="selectedPresetIndex === presets.length - 1" class="space-y-1">
        <span class="text-text-dim uppercase tracking-wider text-[10px]">Tuỳ chỉnh</span>
        <div class="flex gap-1 flex-wrap items-center">
          <input
            v-model="customFpsInput"
            type="number"
            min="1"
            max="1000"
            class="w-16 px-2 py-1 bg-bg-surface border border-border-default text-text-primary focus:border-accent-sky outline-none"
            @keydown.enter="addCustomLane()"
          />
          <button
            class="px-2.5 py-1 border border-border-default text-accent-sky hover:border-accent-sky transition"
            :class="{ 'opacity-40 pointer-events-none': lanes.length >= 5 }"
            @click="addCustomLane()"
          >
            + Thêm
          </button>
          <span
            v-for="(lane, li) in lanes"
            :key="li"
            class="inline-flex items-center gap-1 px-2 py-0.5 border border-border-default"
          >
            <span class="w-2 h-2 inline-block" :style="{ background: lane.color }"></span>
            {{ lane.label }}
            <button
              class="ml-0.5 text-text-dim hover:text-red-400 transition"
              @click="removeLane(li)"
            >×</button>
          </span>
        </div>
      </div>

      <!-- Speed -->
      <div class="space-y-1">
        <span class="text-text-dim uppercase tracking-wider text-[10px]">Tốc độ (px/s)</span>
        <div class="flex gap-1 flex-wrap">
          <button
            v-for="(s, i) in speeds"
            :key="s"
            class="px-2.5 py-1 border transition"
            :class="
              selectedSpeedIndex === i
                ? 'border-accent-sky text-accent-sky bg-accent-sky/10'
                : 'border-border-default text-text-secondary hover:border-text-dim'
            "
            @click="selectedSpeedIndex = i"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <!-- Mode -->
      <div class="space-y-1">
        <span class="text-text-dim uppercase tracking-wider text-[10px]">Chế độ hiển thị</span>
        <div class="flex gap-1">
          <button
            class="px-2.5 py-1 border transition"
            :class="
              testMode === 'bars'
                ? 'border-accent-amber text-accent-amber bg-accent-amber/10'
                : 'border-border-default text-text-secondary hover:border-text-dim'
            "
            @click="testMode = 'bars'"
          >
            Thanh ngang
          </button>
          <button
            class="px-2.5 py-1 border transition"
            :class="
              testMode === 'chase'
                ? 'border-accent-amber text-accent-amber bg-accent-amber/10'
                : 'border-border-default text-text-secondary hover:border-text-dim'
            "
            @click="testMode = 'chase'"
          >
            UFO
          </button>
        </div>
      </div>
    </div>

    <!-- Frame time graph -->
    <div
      v-if="showGraph"
      class="border-b border-border-default bg-bg-surface/20 px-4 py-3 animate-fade-up animate-delay-3"
    >
      <div class="flex items-center gap-2 mb-2">
        <span class="text-text-dim text-xs uppercase tracking-wider">Thời gian khung hình</span>
        <span class="text-text-dim text-xs">(ms)</span>
      </div>
      <svg viewBox="0 0 360 80" class="w-full h-20" preserveAspectRatio="none">
        <line x1="0" :y1="targetY" x2="360" :y2="targetY" stroke="#4A6180" stroke-width="0.5" stroke-dasharray="4,4" />
        <text x="362" :y="targetY + 3" fill="#4A6180" font-size="6">16.7ms</text>
        <polygon
          v-if="graphFill"
          :points="graphFill"
          fill="rgba(56, 189, 248, 0.1)"
        />
        <polyline
          v-if="graphPoints"
          :points="graphPoints"
          fill="none"
          stroke="#38BDF8"
          stroke-width="1.5"
          vector-effect="non-scaling-stroke"
        />
      </svg>
      <div class="flex justify-between text-text-dim text-[10px] mt-0.5">
        <span>0ms</span>
        <span>50ms</span>
      </div>
    </div>

    <!-- Test area -->
    <div
      ref="trackContainer"
      class="flex-1 relative overflow-hidden bg-[#0a1018] min-h-[400px]"
    >
      <!-- === FRAMERATE TAB === -->
      <template v-if="activeTab === 'framerate'">
        <!-- Background grid -->
        <div class="absolute inset-0 opacity-[0.04]" style="background-image: repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 80px), repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 80px);"></div>

        <!-- Speed watermark -->
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span class="font-display text-[120px] font-bold text-white/[0.03] tabular-nums leading-none">
            {{ speed }}
          </span>
        </div>

        <!-- Lanes -->
        <div
          class="absolute top-1/2 left-0 w-full flex flex-col gap-2 -translate-y-1/2"
        >
          <div
            v-for="(lane, li) in lanes"
            :key="li"
            class="relative flex items-center"
            :style="{ height: laneHeight + 'px' }"
          >
            <div
              class="absolute left-3 z-10 font-display text-sm font-bold select-none"
              :style="{ color: lane.color }"
            >
              {{ lane.label }}
            </div>
            <div
              v-if="li < lanes.length - 1"
              class="absolute bottom-0 left-0 w-full h-px bg-white/5"
            />
            <template v-if="testMode === 'bars'">
              <div class="absolute top-1 bottom-1 left-0 w-full">
                <div
                  class="absolute top-0 h-full"
                  :style="{
                    width: '80px',
                    left: lane.position - 80 + 'px',
                    background: lane.color,
                    boxShadow: `0 0 20px ${lane.glow}`,
                  }"
                />
                <div
                  class="absolute top-0 h-full opacity-20"
                  :style="{
                    width: '160px',
                    left: lane.position - 240 + 'px',
                    background: `linear-gradient(to right, transparent, ${lane.color})`,
                  }"
                />
              </div>
            </template>
            <template v-else>
              <div
                class="absolute text-3xl select-none"
                :style="{ left: lane.position - 40 + 'px' }"
              >
                🛸
              </div>
              <div
                class="absolute top-1/2 left-0 w-full h-px -translate-y-1/2"
                :style="{ background: `linear-gradient(to right, transparent 0%, ${lane.color}33 50%, transparent 100%)` }"
              />
            </template>
          </div>
        </div>
      </template>

      <!-- === JANK DETECTOR TAB === -->
      <template v-if="activeTab === 'jank'">
        <div class="absolute inset-0 flex flex-col">
          <!-- Score + stats -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-border-default">
            <div class="flex items-center gap-4">
              <div class="text-center">
                <p class="font-display text-5xl font-bold tabular-nums" :class="jankScoreColor(jankScore)">
                  {{ jankScore }}
                </p>
                <p class="text-text-dim text-[10px] uppercase tracking-wider mt-0.5">Điểm mượt</p>
              </div>
              <div class="text-xs space-y-1">
                <p :class="jankScoreColor(jankScore)" class="font-display font-bold">{{ jankScoreLabel(jankScore) }}</p>
                <p class="text-text-dim">Trễ nhịp: <span class="tabular-nums" :class="jankTotalDropped > 0 ? 'text-red-400' : 'text-text-secondary'">{{ jankTotalDropped }} lần</span></p>
                <p class="text-text-dim">Giới hạn: <span class="text-text-secondary tabular-nums">{{ jankThreshold }}ms</span></p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="px-2.5 py-1 border text-xs transition"
                :class="jankRecording ? 'border-red-400 text-red-400 bg-red-400/10' : 'border-green-400 text-green-400 bg-green-400/10'"
                @click="jankRecording = !jankRecording"
              >
                {{ jankRecording ? '⏸ Dừng' : '▶ Ghi' }}
              </button>
              <button
                class="px-2.5 py-1 border border-border-default text-text-secondary hover:border-accent-coral hover:text-accent-coral text-xs transition"
                @click="resetJank()"
              >
                ↺ Đặt lại
              </button>
            </div>
          </div>

          <!-- Live timeline -->
          <div class="flex-1 flex flex-col px-4 py-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-text-dim text-xs uppercase tracking-wider">Thời gian khung hình (ms) — thời gian thực</span>
              <span class="text-text-dim text-[10px]">Vùng đỏ = trễ nhịp (>{{ jankThreshold }}ms)</span>
            </div>
            <div class="flex-1 relative min-h-[120px]">
              <svg viewBox="0 0 360 80" class="w-full h-full" preserveAspectRatio="none">
                <!-- Budget line (16.7ms) -->
                <line x1="0" :y1="80 - (16.67 / 60) * 80" x2="360" :y2="80 - (16.67 / 60) * 80" stroke="#4A6180" stroke-width="0.5" stroke-dasharray="4,4" />
                <text x="362" :y="80 - (16.67 / 60) * 80 + 3" fill="#4A6180" font-size="6">16.7ms</text>
                <!-- Jank threshold line -->
                <line x1="0" :y1="80 - (jankThreshold / 60) * 80" x2="360" :y2="80 - (jankThreshold / 60) * 80" stroke="#f87171" stroke-width="0.5" stroke-dasharray="2,4" />
                <text x="362" :y="80 - (jankThreshold / 60) * 80 + 3" fill="#f87171" font-size="6">{{ jankThreshold }}ms</text>
                <!-- Fill -->
                <polygon
                  v-if="jankTimelineFill"
                  :points="jankTimelineFill"
                  fill="rgba(56, 189, 248, 0.08)"
                />
                <!-- Line -->
                <polyline
                  v-if="jankTimelinePoints"
                  :points="jankTimelinePoints"
                  fill="none"
                  stroke="#38BDF8"
                  stroke-width="1.5"
                  vector-effect="non-scaling-stroke"
                />
                <!-- Jank spikes overlay -->
                <template v-for="(ft, fi) in jankFrameTimes" :key="fi">
                  <line
                    v-if="ft > jankThreshold"
                    :x1="(fi / (jankTimelineLength - 1)) * 360"
                    :y1="80"
                    :x2="(fi / (jankTimelineLength - 1)) * 360"
                    :y2="80 - Math.min(ft / 60, 1) * 80"
                    stroke="#f87171"
                    stroke-width="2"
                    opacity="0.6"
                  />
                </template>
              </svg>
            </div>
            <div class="flex justify-between text-text-dim text-[10px] mt-1">
              <span>0ms</span>
              <span>60ms</span>
            </div>
          </div>

          <!-- Recent jank events -->
          <div class="border-t border-border-default px-4 py-2 max-h-[120px] overflow-y-auto">
            <p class="text-text-dim text-[10px] uppercase tracking-wider mb-1">Lần trễ nhịp gần đây</p>
            <div v-if="jankEvents.length === 0" class="text-text-dim text-xs py-2 text-center">
              Chưa phát hiện trễ nhịp — màn hình đang mượt ✓
            </div>
            <div v-else class="space-y-0.5">
              <div
                v-for="(evt, ei) in [...jankEvents].reverse().slice(0, 20)"
                :key="ei"
                class="flex items-center gap-2 text-xs"
              >
                <span class="w-2 h-2 bg-red-400 shrink-0"></span>
                <span class="text-text-dim tabular-nums">{{ (evt.timestamp / 1000).toFixed(1) }}s</span>
                <span class="text-red-400 tabular-nums font-bold">{{ evt.frameDuration }}ms</span>
                <span class="text-text-dim">vượt {{ Math.round(evt.frameDuration / 16.67) }}× thời gian cho phép</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- === SCROLL JANK TAB === -->
      <template v-if="activeTab === 'scroll'">
        <div class="absolute inset-0 flex flex-col">
          <!-- Score header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-border-default shrink-0">
            <div class="flex items-center gap-4">
              <div class="text-center">
                <p class="font-display text-5xl font-bold tabular-nums" :class="jankScoreColor(scrollJankScore)">
                  {{ scrollJankScore }}
                </p>
                <p class="text-text-dim text-[10px] uppercase tracking-wider mt-0.5">Điểm cuộn</p>
              </div>
              <div class="text-xs space-y-1">
                <p :class="jankScoreColor(scrollJankScore)" class="font-display font-bold">{{ jankScoreLabel(scrollJankScore) }}</p>
                <p class="text-text-dim">Trễ nhịp: <span class="tabular-nums" :class="scrollDroppedFrames > 0 ? 'text-red-400' : 'text-text-secondary'">{{ scrollDroppedFrames }} lần</span></p>
                <p class="text-text-dim">Tổng khung: <span class="text-text-secondary tabular-nums">{{ scrollTotalFrames }}</span></p>
              </div>
            </div>
            <button
              class="px-2.5 py-1 border border-border-default text-text-secondary hover:border-accent-coral hover:text-accent-coral text-xs transition"
              @click="resetScrollJank()"
            >
              ↺ Đặt lại
            </button>
          </div>

          <!-- Scroll timeline -->
          <div v-if="scrollFrameTimes.length > 1" class="px-4 py-2 border-b border-border-default shrink-0">
            <div class="flex items-center justify-between mb-1">
              <span class="text-text-dim text-[10px] uppercase tracking-wider">Thời gian khung hình khi cuộn</span>
            </div>
            <svg viewBox="0 0 360 60" class="w-full h-14" preserveAspectRatio="none">
              <line x1="0" :y1="60 - (16.67 / 60) * 60" x2="360" :y2="60 - (16.67 / 60) * 60" stroke="#4A6180" stroke-width="0.5" stroke-dasharray="4,4" />
              <polyline
                :points="scrollTimelinePoints"
                fill="none"
                stroke="#38BDF8"
                stroke-width="1.5"
                vector-effect="non-scaling-stroke"
              />
              <template v-for="(ft, fi) in scrollFrameTimes" :key="fi">
                <line
                  v-if="ft > jankThreshold"
                  :x1="(fi / 299) * 360"
                  :y1="60"
                  :x2="(fi / 299) * 360"
                  :y2="60 - Math.min(ft / 60, 1) * 60"
                  stroke="#f87171"
                  stroke-width="2"
                  opacity="0.6"
                />
              </template>
            </svg>
          </div>

          <!-- Heavy scrollable content -->
          <div
            class="flex-1 overflow-y-auto"
            @scroll="onScroll"
          >
            <div class="px-4 py-3">
              <p class="text-text-dim text-xs mb-3">👆 Cuộn khu vực này để đo độ mượt. Nội dung được tạo nặng có chủ đích.</p>
            </div>
            <div
              v-for="block in 80"
              :key="block"
              class="mx-4 mb-3 border border-border-default p-3"
            >
              <div class="flex items-center gap-3 mb-2">
                <div
                  class="w-10 h-10 shrink-0"
                  :style="{
                    background: `linear-gradient(${block * 37}deg, ${laneColors[block % laneColors.length]?.color ?? '#FF6B4A'}, ${laneColors[(block + 1) % laneColors.length]?.color ?? '#38BDF8'})`,
                    filter: 'blur(0.5px)',
                  }"
                ></div>
                <div>
                  <p class="text-sm text-text-primary font-display font-bold">Khối #{{ block }}</p>
                  <p class="text-text-dim text-xs">Phần tử nặng với gradient, shadow, blur</p>
                </div>
              </div>
              <div class="flex gap-1 flex-wrap">
                <span
                  v-for="tag in 6"
                  :key="tag"
                  class="px-2 py-0.5 text-[10px] border border-border-default text-text-dim"
                  :style="{ boxShadow: `0 0 ${tag * 2}px ${laneColors[(block + tag) % laneColors.length]?.color ?? '#FF6B4A'}33` }"
                >
                  tag-{{ block }}-{{ tag }}
                </span>
              </div>
              <div
                class="mt-2 h-1 w-full"
                :style="{
                  background: `repeating-linear-gradient(90deg, ${laneColors[block % laneColors.length]?.color ?? '#FF6B4A'}40 0px, transparent 2px, transparent 4px)`,
                }"
              ></div>
            </div>
          </div>
        </div>
      </template>

      <!-- === GHOSTING TAB === -->
      <template v-if="activeTab === 'ghosting'">
        <div class="absolute inset-0 overflow-hidden">
          <!-- Speed control (inside test area) -->
          <div class="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 text-xs">
            <span class="text-text-dim">Tốc độ:</span>
            <button
              v-for="s in [1, 2, 3, 5]"
              :key="s"
              class="px-2 py-0.5 border transition"
              :class="
                ghostingSpeed === s
                  ? 'border-accent-sky text-accent-sky bg-accent-sky/10'
                  : 'border-border-default text-text-secondary hover:border-text-dim'
              "
              @click="ghostingSpeed = s"
            >
              {{ s }}x
            </button>
          </div>

          <!-- Scrolling text pattern -->
          <div
            class="absolute top-0 h-full flex flex-col justify-center gap-0"
            :style="{ left: -ghostingTileWidth + 'px', transform: `translateX(${-ghostingPosition}px)`, willChange: 'transform' }"
          >
            <div
              v-for="row in 12"
              :key="row"
              class="whitespace-nowrap font-display font-bold select-none leading-tight"
              :class="row % 2 === 0 ? 'text-white' : 'text-white/30'"
              :style="{ fontSize: row % 3 === 0 ? '32px' : row % 3 === 1 ? '24px' : '18px' }"
            >
              <span v-for="n in 60" :key="n">
                {{ row % 2 === 0 ? 'KIỂM TRA LƯU ẢNH ██ ' : '░░░░░░░░░░░░░░ ' }}
              </span>
            </div>
          </div>

          <!-- Black & white vertical bars overlay (CSS background, inherently seamless) -->
          <div
            class="absolute inset-0"
            :style="{
              backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 16px, #0a1018 16px, #0a1018 32px)',
              backgroundPositionX: -ghostingPosition * 1.5 + 'px',
              willChange: 'background-position',
            }"
          >
          </div>

          <!-- Instructions overlay -->
          <div class="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
            <p class="text-text-dim text-xs">
              Nếu bạn thấy viền mờ hoặc bóng ma (rõ hơn khi tăng tốc độ),
              màn hình của bạn có hiện tượng lưu ảnh
            </p>
          </div>
        </div>
      </template>

      <!-- Paused overlay -->
      <div
        v-if="isPaused && activeTab === 'framerate'"
        class="absolute inset-0 bg-bg-deep/60 flex items-center justify-center"
      >
        <span class="font-display text-2xl text-text-secondary">⏸ Đã tạm dừng</span>
      </div>
    </div>

    <!-- Footer -->
    <footer
      class="border-t border-border-default bg-bg-surface/50 px-4 py-2.5 text-xs text-text-dim flex flex-wrap items-center justify-between gap-2"
    >
      <div>
        Mẹo: Sử dụng toàn màn hình (F11) để có kết quả tốt nhất.
      </div>
      <div class="flex items-center gap-3 flex-wrap">
        <span>
          Màn hình:
          <span class="text-text-secondary tabular-nums">{{ screenWidth }}×{{ screenHeight }}</span>
        </span>
        <span>
          DPR:
          <span class="text-text-secondary tabular-nums">{{ devicePixelRatio }}x</span>
        </span>
        <span>
          Hz:
          <span class="text-text-secondary tabular-nums">{{ detectedHz || '…' }}</span>
        </span>
        <span>
          Khung nhìn:
          <span class="text-text-secondary tabular-nums">{{ containerWidth }}px</span>
        </span>
      </div>
    </footer>
  </div>
</template>
