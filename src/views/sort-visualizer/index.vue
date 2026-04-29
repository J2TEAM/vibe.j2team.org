<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { algorithms, algorithmMap } from './algorithms'
import type { SortStep, AlgorithmId, VisualizationMode, InputType, PivotStrategy } from './types'

// ── State ──────────────────────────────────────────────────────────────────
const soundEnabled = ref(false)
const showLearn = ref(true)
const vizMode = ref<VisualizationMode>('bar')
const currentAlgoId = ref<AlgorithmId>('bubble')
const pivotStrategy = ref<PivotStrategy>('last')
const arraySize = ref(60)
const speed = ref(5)
const inputType = ref<InputType>('random')
const customInput = ref('')
const showCustomInput = ref(false)

const isPlaying = ref(false)
const currentStepIndex = ref(0)
const steps = ref<SortStep[]>([])
const startTime = ref(0)
const elapsedMs = ref(0)

// learnStep: phiên bản throttled của currentStep dành cho UI panel (description, pseudocode, stats)
// Canvas luôn dùng currentStep gốc — chỉ learnStep mới bị giới hạn tốc độ cập nhật
const defaultStep: SortStep = {
  array: [],
  comparing: [],
  swapping: [],
  sorted: [],
  description: 'Nhấn ▶ để bắt đầu',
  pseudoCodeLine: -1,
  comparisons: 0,
  swaps: 0,
}
const learnStep = ref<SortStep>(defaultStep)
let learnLastUpdated = 0
const LEARN_THROTTLE_MS = 150 // tối đa ~6 lần/giây

function syncLearnStep(force = false) {
  const now = Date.now()
  if (force || now - learnLastUpdated >= LEARN_THROTTLE_MS) {
    learnLastUpdated = now
    learnStep.value = steps.value[currentStepIndex.value] ?? defaultStep
  }
}

// Race mode
const raceMode = ref(false)
const raceAlgo1 = ref<AlgorithmId>('bubble')
const raceAlgo2 = ref<AlgorithmId>('merge')
const raceSteps1 = ref<SortStep[]>([])
const raceSteps2 = ref<SortStep[]>([])
const raceIdx1 = ref(0)
const raceIdx2 = ref(0)
const raceFinished1 = ref(false)
const raceFinished2 = ref(false)
const raceWinner = ref<1 | 2 | null>(null)

const canvas = ref<HTMLCanvasElement | null>(null)
const raceCanvas1 = ref<HTMLCanvasElement | null>(null)
const raceCanvas2 = ref<HTMLCanvasElement | null>(null)
const vizContainer = ref<HTMLDivElement | null>(null)

let audioCtx: AudioContext | null = null
let animTimer: ReturnType<typeof setTimeout> | null = null
// ── Computed ───────────────────────────────────────────────────────────────
const currentAlgo = computed(() => algorithmMap.get(currentAlgoId.value)!)
const currentStep = computed<SortStep>(
  () =>
    steps.value[currentStepIndex.value] ?? {
      array: [],
      comparing: [],
      swapping: [],
      sorted: [],
      description: 'Nhấn ▶ để bắt đầu',
      pseudoCodeLine: -1,
      comparisons: 0,
      swaps: 0,
    },
)
const progress = computed(() =>
  steps.value.length > 0
    ? Math.round((currentStepIndex.value / (steps.value.length - 1)) * 100)
    : 0,
)
const speedDelay = computed(() => Math.max(1, Math.round(300 / speed.value)))
const isDone = computed(
  () => currentStepIndex.value >= steps.value.length - 1 && steps.value.length > 0,
)

// ── Array generation ───────────────────────────────────────────────────────
function generateArray(): number[] {
  const n = currentAlgoId.value === 'bogo' ? Math.min(arraySize.value, 8) : arraySize.value
  switch (inputType.value) {
    case 'nearly-sorted': {
      const a = Array.from({ length: n }, (_, i) => i + 1)
      const swaps = Math.max(1, Math.floor(n * 0.1))
      for (let i = 0; i < swaps; i++) {
        const x = Math.floor(Math.random() * n)
        const y = Math.floor(Math.random() * n)
        ;[a[x], a[y]] = [a[y]!, a[x]!]
      }
      return a
    }
    case 'reversed':
      return Array.from({ length: n }, (_, i) => n - i)
    case 'duplicates':
      return Array.from(
        { length: n },
        () => Math.floor(Math.random() * Math.max(5, Math.floor(n / 5))) + 1,
      )
    default:
      return Array.from({ length: n }, () => Math.floor(Math.random() * 100) + 1)
  }
}

function parseCustomInput(): number[] | null {
  const nums = customInput.value
    .split(/[\s,]+/)
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n) && n > 0)
  return nums.length >= 2 ? nums.slice(0, 200) : null
}

// ── Step generation ────────────────────────────────────────────────────────
function generateSteps(arr: number[], algoId: AlgorithmId): SortStep[] {
  const def = algorithmMap.get(algoId)!
  const gen = def.generate(arr, pivotStrategy.value)
  const stepsArr: SortStep[] = []
  const MAX = 100000
  while (stepsArr.length < MAX) {
    const r = gen.next()
    if (r.done) break
    stepsArr.push(r.value)
  }
  return stepsArr
}

function initSort() {
  stop()

  let arr: number[]
  if (inputType.value === 'duplicates' && showCustomInput.value && customInput.value.trim()) {
    arr = parseCustomInput() ?? generateArray()
  } else if (showCustomInput.value && customInput.value.trim()) {
    arr = parseCustomInput() ?? generateArray()
  } else {
    arr = generateArray()
  }

  steps.value = generateSteps(arr, currentAlgoId.value)
  currentStepIndex.value = 0
  elapsedMs.value = 0
  learnStep.value = defaultStep
  learnLastUpdated = 0

  nextTick(() => {
    drawFrame()
    syncLearnStep(true)
  })
}

function initRace() {
  stop()
  const arr = generateArray()
  raceSteps1.value = generateSteps([...arr], raceAlgo1.value)
  raceSteps2.value = generateSteps([...arr], raceAlgo2.value)
  raceIdx1.value = 0
  raceIdx2.value = 0
  raceFinished1.value = false
  raceFinished2.value = false
  raceWinner.value = null
  nextTick(() => {
    drawRaceFrame(raceCanvas1.value, raceSteps1.value, raceIdx1.value)
    drawRaceFrame(raceCanvas2.value, raceSteps2.value, raceIdx2.value)
  })
}

// ── Playback control ────────────────────────────────────────────────────────
function play() {
  if (isPlaying.value) return
  if (isDone.value) {
    currentStepIndex.value = 0
  }
  isPlaying.value = true
  startTime.value = Date.now() - elapsedMs.value

  function tick() {
    if (!isPlaying.value) return

    if (raceMode.value) {
      let advanced = false
      if (raceIdx1.value < raceSteps1.value.length - 1) {
        raceIdx1.value++
        drawRaceFrame(raceCanvas1.value, raceSteps1.value, raceIdx1.value)
        advanced = true
        if (raceIdx1.value >= raceSteps1.value.length - 1 && !raceFinished1.value) {
          raceFinished1.value = true
          if (!raceWinner.value) raceWinner.value = 1
        }
      }
      if (raceIdx2.value < raceSteps2.value.length - 1) {
        raceIdx2.value++
        drawRaceFrame(raceCanvas2.value, raceSteps2.value, raceIdx2.value)
        advanced = true
        if (raceIdx2.value >= raceSteps2.value.length - 1 && !raceFinished2.value) {
          raceFinished2.value = true
          if (!raceWinner.value) raceWinner.value = 2
        }
      }
      if (!advanced) {
        stop()
        return
      }
    } else {
      if (currentStepIndex.value >= steps.value.length - 1) {
        stop()
        syncLearnStep(true)
        return
      }
      currentStepIndex.value++
      elapsedMs.value = Date.now() - startTime.value
      drawFrame()
      syncLearnStep() // throttled: chỉ update UI ~6fps
      if (soundEnabled.value) playSound(currentStep.value)
    }

    animTimer = setTimeout(tick, speedDelay.value)
  }
  tick()
}

function stop() {
  isPlaying.value = false
  if (animTimer) {
    clearTimeout(animTimer)
    animTimer = null
  }
  syncLearnStep(true) // hiển thị đúng bước cuối cùng ngay khi dừng
}

function togglePlay() {
  if (isPlaying.value) stop()
  else play()
}

function stepForward() {
  stop()
  if (raceMode.value) {
    if (raceIdx1.value < raceSteps1.value.length - 1) {
      raceIdx1.value++
      drawRaceFrame(raceCanvas1.value, raceSteps1.value, raceIdx1.value)
    }
    if (raceIdx2.value < raceSteps2.value.length - 1) {
      raceIdx2.value++
      drawRaceFrame(raceCanvas2.value, raceSteps2.value, raceIdx2.value)
    }
  } else if (currentStepIndex.value < steps.value.length - 1) {
    currentStepIndex.value++
    drawFrame()
    syncLearnStep(true) // bước thủ công → cập nhật ngay
  }
}

function stepBack() {
  stop()
  if (!raceMode.value && currentStepIndex.value > 0) {
    currentStepIndex.value--
    drawFrame()
    syncLearnStep(true) // bước thủ công → cập nhật ngay
  }
}

function shuffle() {
  stop()
  showCustomInput.value = false
  initSort()
}

// ── Canvas drawing ──────────────────────────────────────────────────────────
function getColors() {
  return {
    default: '#38BDF8', // accent-sky
    comparing: '#FFB830', // accent-amber
    swapping: '#FF6B4A', // accent-coral
    sorted: '#34d399', // green
    pivot: '#FFB830', // accent-amber (no purple per design system)
    bg: '#0F1923', // bg-deep
  }
}

function drawOnCanvas(c: HTMLCanvasElement, step: SortStep, mode: VisualizationMode = 'bar') {
  const ctx = c.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const W = c.width
  const H = c.height
  const w = W / dpr
  const h = H / dpr

  ctx.clearRect(0, 0, W, H)

  const { array, comparing, swapping, sorted, pivot } = step
  const n = array.length
  if (n === 0) return
  const max = Math.max(...array) || 1

  const comparingSet = new Set(comparing)
  const swappingSet = new Set(swapping)
  const sortedSet = new Set(sorted)
  const colors = getColors()

  function getColor(i: number): string {
    if (i === pivot) return colors.pivot
    if (swappingSet.has(i)) return colors.swapping
    if (comparingSet.has(i)) return colors.comparing
    if (sortedSet.has(i)) return colors.sorted
    return colors.default
  }

  ctx.save()
  ctx.scale(dpr, dpr)

  if (mode === 'bar') {
    const bw = w / n
    for (let i = 0; i < n; i++) {
      const bh = Math.max(1, ((array[i] ?? 0) / max) * (h - 4))
      ctx.fillStyle = getColor(i)
      ctx.fillRect(i * bw, h - bh, Math.max(1, bw - (n > 80 ? 0 : 1)), bh)
    }
  } else if (mode === 'hue') {
    const bw = w / n
    for (let i = 0; i < n; i++) {
      const hue = ((array[i] ?? 0) / max) * 300
      let lit = 50
      if (swappingSet.has(i)) lit = 75
      else if (comparingSet.has(i)) lit = 80
      ctx.fillStyle = `hsl(${hue}, 100%, ${lit}%)`
      ctx.fillRect(i * bw, 0, Math.max(1, bw - (n > 80 ? 0 : 0.5)), h)
    }
  } else if (mode === 'dot') {
    const r = Math.max(1.5, Math.min(6, (w / n) * 0.4))
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * (w / n)
      const y = h - 4 - ((array[i] ?? 0) / max) * (h - 12)
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = getColor(i)
      ctx.fill()
    }
  }

  ctx.restore()
}

function resizeCanvas(c: HTMLCanvasElement | null, container: HTMLElement | null) {
  if (!c || !container) return
  const dpr = window.devicePixelRatio || 1
  const rect = container.getBoundingClientRect()
  c.width = rect.width * dpr
  c.height = rect.height * dpr
  c.style.width = rect.width + 'px'
  c.style.height = rect.height + 'px'
}

function drawFrame() {
  if (!canvas.value) return
  const step = steps.value[currentStepIndex.value]
  if (!step) return
  drawOnCanvas(canvas.value, step, vizMode.value)
}

function drawRaceFrame(c: HTMLCanvasElement | null, stepsArr: SortStep[], idx: number) {
  if (!c) return
  const step = stepsArr[idx]
  if (!step) return
  drawOnCanvas(c, step, 'bar')
}

function handleResize() {
  resizeCanvas(canvas.value, vizContainer.value)
  drawFrame()
  if (raceMode.value) {
    const rc1 = document.getElementById('race-canvas-1') as HTMLCanvasElement | null
    const rc2 = document.getElementById('race-canvas-2') as HTMLCanvasElement | null
    const rp1 = document.getElementById('race-panel-1')
    const rp2 = document.getElementById('race-panel-2')
    resizeCanvas(rc1, rp1)
    resizeCanvas(rc2, rp2)
    drawRaceFrame(rc1, raceSteps1.value, raceIdx1.value)
    drawRaceFrame(rc2, raceSteps2.value, raceIdx2.value)
  }
}

// ── Sound ──────────────────────────────────────────────────────────────────
function playSound(step: SortStep) {
  if (!step.comparing.length && !step.swapping.length) return
  try {
    if (!audioCtx) audioCtx = new AudioContext()
    const arr = step.array
    const max = Math.max(...arr) || 1
    const indices = step.swapping.length ? step.swapping : step.comparing
    const val = arr[indices[0] ?? 0] ?? 1
    const freq = 180 + (val / max) * 880

    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.type = step.swapping.length ? 'sawtooth' : 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08)
    osc.start()
    osc.stop(audioCtx.currentTime + 0.08)
  } catch {}
}

async function playCompletionSound() {
  if (!soundEnabled.value) return
  try {
    if (!audioCtx) audioCtx = new AudioContext()
    const notes = [261, 294, 330, 349, 392, 440, 494, 523]
    for (let i = 0; i < notes.length; i++) {
      await new Promise<void>((res) => setTimeout(res, 60))
      const osc = audioCtx!.createOscillator()
      const gain = audioCtx!.createGain()
      osc.connect(gain)
      gain.connect(audioCtx!.destination)
      osc.frequency.value = notes[i] ?? 440
      gain.gain.setValueAtTime(0.1, audioCtx!.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx!.currentTime + 0.15)
      osc.start()
      osc.stop(audioCtx!.currentTime + 0.15)
    }
  } catch {}
}

// ── Watchers ────────────────────────────────────────────────────────────────
// drawFrame() được gọi trực tiếp trong tick()/stepForward()/stepBack() nên không cần watch ở đây
watch(currentStepIndex, () => {
  if (isDone.value) playCompletionSound()
})
watch(vizMode, drawFrame)
watch(currentAlgoId, () => {
  stop()
  initSort()
})
watch(arraySize, () => {
  stop()
  if (raceMode.value) initRace()
  else initSort()
})
watch(inputType, () => {
  stop()
  initSort()
})
watch(raceMode, async (val) => {
  stop()
  await nextTick()
  if (val) {
    await nextTick()
    handleResize()
    initRace()
  } else {
    await nextTick()
    resizeCanvas(canvas.value, vizContainer.value)
    initSort()
  }
})

// ── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(async () => {
  await nextTick()
  resizeCanvas(canvas.value, vizContainer.value)
  initSort()
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  stop()
  window.removeEventListener('resize', handleResize)
  audioCtx?.close()
})

// ── Helpers ──────────────────────────────────────────────────────────────────
const speedLabel = computed(() => {
  if (speed.value <= 2) return 'Rất chậm'
  if (speed.value <= 4) return 'Chậm'
  if (speed.value <= 6) return 'Bình thường'
  if (speed.value <= 8) return 'Nhanh'
  return 'Rất nhanh'
})

function formatMs(ms: number) {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

const raceStep1 = computed(() => raceSteps1.value[raceIdx1.value])
const raceStep2 = computed(() => raceSteps2.value[raceIdx2.value])
const raceProg1 = computed(() =>
  raceSteps1.value.length > 0
    ? Math.round((raceIdx1.value / (raceSteps1.value.length - 1)) * 100)
    : 0,
)
const raceProg2 = computed(() =>
  raceSteps2.value.length > 0
    ? Math.round((raceIdx2.value / (raceSteps2.value.length - 1)) * 100)
    : 0,
)

const algoGroups = [
  { label: 'Cơ bản', ids: ['bubble', 'selection', 'insertion'] as AlgorithmId[] },
  { label: 'Nâng cao', ids: ['merge', 'quick', 'heap', 'shell'] as AlgorithmId[] },
  { label: 'Đặc biệt', ids: ['counting', 'radix', 'bogo'] as AlgorithmId[] },
]
</script>

<template>
  <div class="flex flex-col min-h-screen bg-bg-deep text-text-primary text-sm">
    <!-- Header -->
    <header
      class="sticky top-0 z-20 flex items-center justify-between px-4 py-2 border-b bg-bg-surface border-border-default"
    >
      <div class="flex items-center gap-2">
        <RouterLink
          to="/"
          class="text-xs px-2 py-1 border border-border-default bg-bg-elevated text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          ← Trang chủ
        </RouterLink>
        <span class="text-text-dim">|</span>
        <span class="font-display font-bold text-base text-accent-sky">Sort Visualizer</span>
      </div>
      <div class="flex items-center gap-1">
        <button
          @click="showLearn = !showLearn"
          class="px-2 py-1 text-xs transition-colors"
          :class="
            showLearn
              ? 'bg-accent-coral text-bg-deep'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
          "
          title="Chế độ học"
        >
          📖 Học
        </button>
        <button
          @click="raceMode = !raceMode"
          class="px-2 py-1 text-xs transition-colors"
          :class="
            raceMode
              ? 'bg-accent-amber text-bg-deep'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
          "
          title="Race Mode"
        >
          ⚔️ Race
        </button>
        <button
          @click="soundEnabled = !soundEnabled"
          class="px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
          :title="soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'"
        >
          {{ soundEnabled ? '🔊' : '🔇' }}
        </button>
      </div>
    </header>

    <!-- Algorithm selector -->
    <div
      class="px-3 py-2 border-b flex flex-wrap gap-1 items-center bg-bg-surface border-border-default"
    >
      <template v-if="!raceMode">
        <template v-for="group in algoGroups" :key="group.label">
          <span class="text-xs mr-1 text-text-dim">{{ group.label }}:</span>
          <button
            v-for="id in group.ids"
            :key="id"
            @click="currentAlgoId = id"
            class="px-2 py-0.5 text-xs transition-all border"
            :class="
              currentAlgoId === id
                ? 'bg-accent-coral text-bg-deep border-accent-coral'
                : 'bg-bg-elevated text-text-secondary border-border-default hover:border-accent-coral hover:text-text-primary'
            "
          >
            {{ algorithmMap.get(id)?.name.replace(' Sort', '') }}
          </button>
          <span class="mr-1" />
        </template>
      </template>
      <template v-else>
        <span class="text-xs font-display font-bold text-accent-amber"
          >⚔️ Race Mode — Chọn 2 thuật toán:</span
        >
        <select
          v-model="raceAlgo1"
          class="ml-2 px-2 py-0.5 text-xs bg-bg-elevated text-text-primary border border-border-default"
          @change="initRace"
        >
          <option v-for="a in algorithms" :key="a.id" :value="a.id">{{ a.name }}</option>
        </select>
        <span class="text-accent-amber">vs</span>
        <select
          v-model="raceAlgo2"
          class="px-2 py-0.5 text-xs bg-bg-elevated text-text-primary border border-border-default"
          @change="initRace"
        >
          <option v-for="a in algorithms" :key="a.id" :value="a.id">{{ a.name }}</option>
        </select>
        <button
          @click="initRace"
          class="px-2 py-0.5 text-xs bg-accent-amber text-bg-deep hover:bg-accent-amber/80 transition-colors"
        >
          🔀 Mảng mới
        </button>
        <span v-if="raceWinner" class="ml-2 font-display font-bold text-accent-amber">
          🏆
          {{
            raceWinner === 1 ? algorithmMap.get(raceAlgo1)?.name : algorithmMap.get(raceAlgo2)?.name
          }}
          thắng!
        </span>
      </template>
    </div>

    <!-- Main area -->
    <div class="flex-1 flex min-h-0">
      <!-- Left: Visualization + controls -->
      <div class="flex-1 flex flex-col p-3 gap-2 min-h-0">
        <!-- Viz mode + pivot + options (non-race) -->
        <div v-if="!raceMode" class="flex flex-wrap items-center gap-2">
          <div class="flex border border-border-default overflow-hidden">
            <button
              v-for="m in [
                ['bar', '📊 Bar'],
                ['hue', '🌈 Hue'],
                ['dot', '⚫ Dot'],
              ] as const"
              :key="m[0]"
              @click="vizMode = m[0]"
              class="px-2 py-0.5 text-xs transition-colors"
              :class="
                vizMode === m[0]
                  ? 'bg-accent-sky text-bg-deep'
                  : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
              "
            >
              {{ m[1] }}
            </button>
          </div>

          <template v-if="currentAlgoId === 'quick'">
            <span class="text-xs text-text-dim">Pivot:</span>
            <select
              v-model="pivotStrategy"
              class="px-2 py-0.5 text-xs bg-bg-elevated text-text-primary border border-border-default"
              @change="initSort"
            >
              <option value="last">Last</option>
              <option value="first">First</option>
              <option value="random">Random</option>
              <option value="median">Median of 3</option>
            </select>
          </template>

          <div class="ml-auto flex items-center gap-2">
            <span class="text-xs text-text-dim">Input:</span>
            <select
              v-model="inputType"
              class="px-2 py-0.5 text-xs bg-bg-elevated text-text-primary border border-border-default"
            >
              <option value="random">Ngẫu nhiên</option>
              <option value="nearly-sorted">Gần đã sort</option>
              <option value="reversed">Đảo ngược</option>
              <option value="duplicates">Nhiều trùng lặp</option>
            </select>
            <button
              @click="showCustomInput = !showCustomInput"
              class="px-2 py-0.5 text-xs bg-bg-elevated text-text-secondary border border-border-default hover:border-accent-coral hover:text-text-primary transition-colors"
            >
              ✎ Custom
            </button>
          </div>
        </div>

        <!-- Custom input -->
        <div v-if="showCustomInput && !raceMode" class="flex gap-2 items-center">
          <input
            v-model="customInput"
            placeholder="Nhập số cách nhau bởi dấu phẩy hoặc space: 5, 3, 8, 1, 9..."
            class="flex-1 px-2 py-1 text-xs border bg-bg-elevated text-text-primary border-border-default placeholder-text-dim"
          />
          <button
            @click="initSort"
            class="px-3 py-1 text-xs bg-accent-coral text-bg-deep hover:bg-accent-coral/80 transition-colors"
          >
            Sort!
          </button>
        </div>

        <!-- Canvas visualization -->
        <div
          ref="vizContainer"
          class="relative overflow-hidden border flex-shrink-0 bg-bg-surface border-border-default"
          :style="{ height: raceMode ? 'auto' : '280px' }"
        >
          <canvas v-if="!raceMode" ref="canvas" class="w-full h-full" style="height: 280px" />

          <!-- Race mode -->
          <div v-if="raceMode" class="flex gap-2 p-2" style="height: 300px">
            <div class="flex-1 flex flex-col gap-1">
              <div class="flex items-center justify-between">
                <span
                  class="text-xs font-display font-bold"
                  :class="raceWinner === 1 ? 'text-accent-amber' : 'text-accent-sky'"
                >
                  {{ raceWinner === 1 ? '🏆 ' : '' }}{{ algorithmMap.get(raceAlgo1)?.name }}
                </span>
                <span class="text-xs text-text-dim"
                  >{{ raceStep1?.comparisons ?? 0 }} cmp / {{ raceStep1?.swaps ?? 0 }} swp</span
                >
              </div>
              <div
                id="race-panel-1"
                class="flex-1 overflow-hidden border bg-bg-deep border-border-default"
              >
                <canvas id="race-canvas-1" ref="raceCanvas1" class="w-full h-full" />
              </div>
              <div class="h-1 overflow-hidden bg-bg-elevated">
                <div
                  class="h-full bg-accent-sky transition-all"
                  :style="{ width: raceProg1 + '%' }"
                />
              </div>
            </div>
            <div class="flex-1 flex flex-col gap-1">
              <div class="flex items-center justify-between">
                <span
                  class="text-xs font-display font-bold"
                  :class="raceWinner === 2 ? 'text-accent-amber' : 'text-accent-coral'"
                >
                  {{ raceWinner === 2 ? '🏆 ' : '' }}{{ algorithmMap.get(raceAlgo2)?.name }}
                </span>
                <span class="text-xs text-text-dim"
                  >{{ raceStep2?.comparisons ?? 0 }} cmp / {{ raceStep2?.swaps ?? 0 }} swp</span
                >
              </div>
              <div
                id="race-panel-2"
                class="flex-1 overflow-hidden border bg-bg-deep border-border-default"
              >
                <canvas id="race-canvas-2" ref="raceCanvas2" class="w-full h-full" />
              </div>
              <div class="h-1 overflow-hidden bg-bg-elevated">
                <div
                  class="h-full bg-accent-coral transition-all"
                  :style="{ width: raceProg2 + '%' }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex flex-wrap items-center gap-2">
          <div class="flex gap-1">
            <button
              v-if="!raceMode"
              @click="stepBack"
              :disabled="currentStepIndex === 0"
              class="px-2 py-1 text-base bg-bg-elevated text-text-secondary border border-border-default hover:border-accent-coral hover:text-text-primary transition-colors disabled:opacity-30"
              title="Bước trước"
            >
              ⏮
            </button>
            <button
              @click="togglePlay"
              class="px-4 py-1 text-base font-display font-bold transition-colors"
              :class="
                isPlaying
                  ? 'bg-accent-amber text-bg-deep'
                  : 'bg-accent-coral text-bg-deep hover:bg-accent-coral/80'
              "
            >
              {{ isPlaying ? '⏸ Dừng' : isDone ? '↺ Chạy lại' : '▶ Chạy' }}
            </button>
            <button
              @click="stepForward"
              class="px-2 py-1 text-base bg-bg-elevated text-text-secondary border border-border-default hover:border-accent-coral hover:text-text-primary transition-colors"
              title="Bước tiếp"
            >
              ⏭
            </button>
          </div>

          <button
            @click="raceMode ? initRace() : shuffle()"
            class="px-3 py-1 text-xs bg-bg-elevated text-text-secondary border border-border-default hover:border-accent-coral hover:text-text-primary transition-colors"
          >
            🔀 Mảng mới
          </button>

          <button
            v-if="!raceMode"
            @click="initSort"
            class="px-3 py-1 text-xs bg-bg-elevated text-text-secondary border border-border-default hover:border-accent-coral hover:text-text-primary transition-colors"
          >
            ↺ Reset
          </button>

          <div class="flex items-center gap-2 ml-auto">
            <span class="text-xs text-text-dim">Tốc độ:</span>
            <input
              type="range"
              v-model.number="speed"
              min="1"
              max="10"
              class="w-20 accent-[#FF6B4A]"
            />
            <span class="text-xs w-16 text-text-secondary">{{ speedLabel }}</span>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs text-text-dim">
              {{ !raceMode && currentAlgoId === 'bogo' ? 'Phần tử (≤8):' : 'Số phần tử:' }}
            </span>
            <input
              type="range"
              v-model.number="arraySize"
              :min="5"
              :max="
                !raceMode && currentAlgoId === 'bogo'
                  ? 8
                  : !raceMode && (currentAlgoId === 'counting' || currentAlgoId === 'radix')
                    ? 150
                    : 200
              "
              class="w-20 accent-[#FF6B4A]"
            />
            <span class="text-xs w-8 text-text-secondary">
              {{ !raceMode && currentAlgoId === 'bogo' ? Math.min(arraySize, 8) : arraySize }}
            </span>
          </div>
        </div>

        <!-- Stats (non-race) -->
        <div v-if="!raceMode" class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div class="bg-bg-elevated px-3 py-1.5 text-center">
            <div class="text-xs text-text-dim">So sánh</div>
            <div class="text-base font-bold text-accent-amber">
              {{ learnStep.comparisons.toLocaleString() }}
            </div>
          </div>
          <div class="bg-bg-elevated px-3 py-1.5 text-center">
            <div class="text-xs text-text-dim">Hoán đổi</div>
            <div class="text-base font-bold text-accent-coral">
              {{ learnStep.swaps.toLocaleString() }}
            </div>
          </div>
          <div class="bg-bg-elevated px-3 py-1.5 text-center">
            <div class="text-xs text-text-dim">Thời gian</div>
            <div class="text-base font-bold text-accent-sky">{{ formatMs(elapsedMs) }}</div>
          </div>
          <div class="bg-bg-elevated px-3 py-1.5 text-center">
            <div class="text-xs text-text-dim">Bước</div>
            <div class="text-base font-bold text-text-primary">
              {{ currentStepIndex }}/{{ steps.length }}
            </div>
          </div>
        </div>

        <!-- Progress bar (non-race) -->
        <div v-if="!raceMode" class="relative h-1.5 overflow-hidden bg-bg-elevated">
          <div
            class="h-full transition-all duration-100"
            :class="isDone ? 'bg-accent-sky' : 'bg-accent-coral'"
            :style="{ width: progress + '%' }"
          />
        </div>

        <!-- Color legend -->
        <div class="flex flex-wrap gap-3 text-xs text-text-dim">
          <span
            ><span class="inline-block w-3 h-3 mr-1" style="background: #38bdf8" />Chưa xét</span
          >
          <span
            ><span class="inline-block w-3 h-3 mr-1" style="background: #ffb830" />Đang so
            sánh</span
          >
          <span
            ><span class="inline-block w-3 h-3 mr-1" style="background: #ff6b4a" />Đang swap</span
          >
          <span
            ><span class="inline-block w-3 h-3 mr-1" style="background: #34d399" />Đã sắp xếp</span
          >
          <span v-if="currentAlgoId === 'quick'"
            ><span class="inline-block w-3 h-3 mr-1" style="background: #ffb830" />Pivot</span
          >
        </div>
      </div>

      <!-- Right: Learn panel -->
      <div
        v-if="showLearn && !raceMode"
        class="w-72 xl:w-80 border-l border-border-default flex flex-col gap-3 p-3 overflow-y-auto hidden md:flex bg-bg-surface"
        style="max-height: calc(100vh - 100px)"
      >
        <!-- Step description -->
        <div class="p-3 border border-border-default bg-bg-elevated min-h-12">
          <div class="text-xs font-bold mb-1 text-accent-sky">💬 Bước hiện tại</div>
          <div class="text-xs leading-relaxed text-text-secondary">
            {{ learnStep.description || 'Nhấn ▶ để bắt đầu' }}
          </div>
        </div>

        <!-- Pseudocode -->
        <div class="border border-border-default overflow-hidden">
          <div
            class="px-3 py-1.5 text-xs font-bold border-b border-border-default bg-bg-elevated text-text-dim"
          >
            📝 Pseudo-code
          </div>
          <div class="bg-bg-deep">
            <div
              v-for="(line, idx) in currentAlgo.pseudoCode"
              :key="idx"
              class="px-3 py-0.5 text-xs font-mono transition-colors"
              :class="[
                learnStep.pseudoCodeLine === idx
                  ? 'bg-accent-sky/10 text-accent-sky border-l-2 border-accent-sky'
                  : 'text-text-dim',
                line === '' ? 'py-0' : '',
              ]"
            >
              {{ line || '\u00a0' }}
            </div>
          </div>
        </div>

        <!-- Algorithm info -->
        <div class="p-3 border border-border-default bg-bg-elevated">
          <div class="text-xs font-bold mb-2 text-accent-amber">ℹ️ {{ currentAlgo.name }}</div>
          <p class="text-xs leading-relaxed mb-2 text-text-secondary">
            {{ currentAlgo.description }}
          </p>
          <div class="grid grid-cols-2 gap-1 text-xs">
            <div class="text-text-dim">Best:</div>
            <div class="text-accent-sky font-mono">{{ currentAlgo.timeComplexity.best }}</div>
            <div class="text-text-dim">Average:</div>
            <div class="text-accent-amber font-mono">{{ currentAlgo.timeComplexity.average }}</div>
            <div class="text-text-dim">Worst:</div>
            <div class="text-accent-coral font-mono">{{ currentAlgo.timeComplexity.worst }}</div>
            <div class="text-text-dim">Space:</div>
            <div class="text-text-secondary font-mono">{{ currentAlgo.spaceComplexity }}</div>
            <div class="text-text-dim">Ổn định:</div>
            <div :class="currentAlgo.stable ? 'text-accent-sky' : 'text-accent-coral'">
              {{ currentAlgo.stable ? '✓ Có' : '✗ Không' }}
            </div>
          </div>
        </div>

        <!-- All algorithms complexity table -->
        <div class="border border-border-default overflow-hidden">
          <div
            class="px-3 py-1.5 text-xs font-bold border-b border-border-default bg-bg-elevated text-text-dim"
          >
            📊 So sánh độ phức tạp
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="bg-bg-elevated text-text-dim">
                  <th class="px-2 py-1 text-left font-normal">Thuật toán</th>
                  <th class="px-2 py-1 text-right font-normal">Avg</th>
                  <th class="px-2 py-1 text-right font-normal">Space</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="algo in algorithms"
                  :key="algo.id"
                  class="border-t border-border-default transition-colors cursor-pointer"
                  :class="
                    currentAlgoId === algo.id
                      ? 'bg-accent-sky/10 text-accent-sky'
                      : 'text-text-dim hover:bg-bg-elevated'
                  "
                  @click="currentAlgoId = algo.id"
                >
                  <td class="px-2 py-0.5">{{ algo.name }}</td>
                  <td class="px-2 py-0.5 text-right font-mono text-accent-amber/80">
                    {{ algo.timeComplexity.average }}
                  </td>
                  <td class="px-2 py-0.5 text-right font-mono text-text-secondary/80">
                    {{ algo.spaceComplexity }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile learn panel -->
    <div
      v-if="showLearn && !raceMode"
      class="md:hidden border-t border-border-default bg-bg-surface p-3 space-y-3"
    >
      <div class="text-xs font-bold text-accent-sky">
        💬 {{ learnStep.description || 'Nhấn ▶ để bắt đầu' }}
      </div>
      <div class="p-2 border border-border-default bg-bg-elevated text-xs">
        <div class="font-bold mb-1 text-text-secondary">{{ currentAlgo.name }}</div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-0.5 text-text-dim">
          <span
            >Avg:
            <span class="text-accent-amber">{{ currentAlgo.timeComplexity.average }}</span></span
          >
          <span
            >Space: <span class="text-text-secondary">{{ currentAlgo.spaceComplexity }}</span></span
          >
          <span
            >Ổn định:
            <span :class="currentAlgo.stable ? 'text-accent-sky' : 'text-accent-coral'">{{
              currentAlgo.stable ? 'Có' : 'Không'
            }}</span></span
          >
        </div>
      </div>
    </div>
  </div>
</template>
