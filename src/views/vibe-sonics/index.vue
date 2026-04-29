<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, shallowRef } from 'vue'
import { Icon } from '@iconify/vue'
import { useRafFn } from '@vueuse/core'
import type { HighlighterCore } from 'shiki/core'

const codeInput = ref(`function helloVibe() {
  const message = "Welcome to J2TEAM";
  const year = 2026;
  if (year > 2000) {
    console.log(message);
    return true;
  }
}`)

const highlightedCode = ref('')
const highlighter = shallowRef<HighlighterCore | null>(null)
const isPlaying = ref(false)
const tokens = ref<{ text: string; type: string }[]>([])
const currentTokenIdx = ref(-1)

// --- AUDIO SYSTEM ---
let audioCtx: AudioContext | null = null
let analyzer: AnalyserNode | null = null
let masterGain: GainNode | null = null

function initAudio() {
  if (audioCtx) return
  audioCtx = new (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  )()
  analyzer = audioCtx.createAnalyser()
  masterGain = audioCtx.createGain()
  masterGain.gain.value = 0.5
  masterGain.connect(analyzer)
  analyzer.connect(audioCtx.destination)
}

function playNote(type: string) {
  if (!audioCtx || !masterGain) return
  const now = audioCtx.currentTime
  const osc = audioCtx.createOscillator()
  const g = audioCtx.createGain()

  osc.connect(g)
  g.connect(masterGain)

  if (type === 'keyword') {
    // Deep Bass
    osc.type = 'sine'
    osc.frequency.setValueAtTime(55, now) // A1
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.5)
    g.gain.setValueAtTime(0.8, now)
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.8)
    osc.start(now)
    osc.stop(now + 0.8)
  } else if (type === 'string') {
    // Clear Bell-like FM-ish
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(880, now) // A5
    const mod = audioCtx.createOscillator()
    const modG = audioCtx.createGain()
    mod.frequency.value = 440
    modG.gain.value = 200
    mod.connect(modG)
    modG.connect(osc.frequency)
    mod.start(now)

    g.gain.setValueAtTime(0.3, now)
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.2)
    osc.start(now)
    osc.stop(now + 1.2)
    mod.stop(now + 1.2)
  } else if (type === 'numeric') {
    // Percussion wood-block
    osc.type = 'square'
    osc.frequency.setValueAtTime(1200, now)
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.05)
    g.gain.setValueAtTime(0.4, now)
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
    osc.start(now)
    osc.stop(now + 0.1)
  } else {
    // Default soft tick
    osc.type = 'sine'
    osc.frequency.setValueAtTime(220, now)
    g.gain.setValueAtTime(0.05, now)
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
    osc.start(now)
    osc.stop(now + 0.05)
  }
}

// --- PARSER ---
function updateHighlighting() {
  if (!highlighter.value) return
  highlightedCode.value = highlighter.value.codeToHtml(codeInput.value, {
    lang: 'javascript',
    theme: 'vitesse-dark',
  })

  // Basic manual tokenization for audio (since Shiki output is complex HTML)
  const kw = [
    'if',
    'else',
    'function',
    'class',
    'const',
    'let',
    'var',
    'return',
    'import',
    'export',
    'await',
    'async',
    'try',
    'catch',
  ]
  const raw = codeInput.value
  const matches = raw.match(/\w+|"[^"]*"|'[^']*'|`[^`]*`|[^\s\w]/g) || []

  tokens.value = matches.map((t) => {
    if (kw.includes(t)) return { text: t, type: 'keyword' }
    if (/^["'`].*["'`]$/.test(t)) return { text: t, type: 'string' }
    if (/^\d+(\.\d+)?$/.test(t)) return { text: t, type: 'numeric' }
    return { text: t, type: 'other' }
  })
}

// --- VISUALIZER ---
const canvasRef = ref<HTMLCanvasElement | null>(null)
function drawVisualizer() {
  if (!canvasRef.value || !analyzer) return
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')!
  const bufferLength = analyzer.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)

  analyzer.getByteFrequencyData(dataArray)

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const barWidth = (canvas.width / bufferLength) * 2.5
  let barHeight
  let x = 0

  for (let i = 0; i < bufferLength; i++) {
    barHeight = dataArray[i]! / 2

    // Gradient coloring based on vibe colors
    const r = 255 - barHeight
    const g = 107
    const b = 74

    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

    x += barWidth + 1
  }
}

let lastBeatTime = 0
const BPM = 140
const BEAT_LEN = 60 / BPM

useRafFn(() => {
  drawVisualizer()

  if (!isPlaying.value || !audioCtx) return

  const now = audioCtx.currentTime
  if (now - lastBeatTime >= BEAT_LEN) {
    currentTokenIdx.value = (currentTokenIdx.value + 1) % tokens.value.length
    const token = tokens.value[currentTokenIdx.value]!
    playNote(token.type)
    lastBeatTime = now
  }
})

function togglePlay() {
  initAudio()
  if (audioCtx?.state === 'suspended') {
    audioCtx.resume()
  }
  isPlaying.value = !isPlaying.value
  if (!isPlaying.value) {
    currentTokenIdx.value = -1
  }
}

onMounted(async () => {
  const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
    import('shiki/core'),
    import('shiki/engine/javascript'),
  ])
  highlighter.value = await createHighlighterCore({
    themes: [import('@shikijs/themes/vitesse-dark')],
    langs: [import('@shikijs/langs/javascript')],
    engine: createJavaScriptRegexEngine(),
  })
  updateHighlighting()
})

onBeforeUnmount(() => {
  highlighter.value?.dispose()
  audioCtx?.close()
})

watch(codeInput, () => {
  updateHighlighting()
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep p-6 font-body text-text-primary md:p-12">
    <div class="mx-auto max-w-5xl">
      <!-- HEADER -->
      <div
        class="mb-12 flex items-center justify-between border-b border-border-default pb-8 animate-fade-up"
      >
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center bg-accent-sky text-bg-deep">
            <Icon icon="lucide:music" class="size-7" />
          </div>
          <div>
            <h1 class="font-display text-4xl font-bold uppercase tracking-tight">Vibe Sonics</h1>
            <p class="font-display text-xs tracking-widest text-text-secondary">
              // BIẾN CODE THÀNH GIAI ĐIỆU LO-FI
            </p>
            <a
              href="https://www.facebook.com/nmdung.dev"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-1 block font-display text-[9px] font-bold tracking-[0.2em] text-text-dim uppercase transition-colors hover:text-accent-coral"
              >By nmdung.dev</a
            >
          </div>
        </div>

        <RouterLink
          to="/"
          class="group hidden items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm font-bold uppercase tracking-widest transition-all hover:border-accent-coral md:flex"
        >
          <Icon
            icon="lucide:arrow-left"
            class="size-4 transition-transform group-hover:-translate-x-1"
          />
          Quay lại
        </RouterLink>
      </div>

      <!-- MAIN LAYOUT -->
      <div class="grid gap-8 lg:grid-cols-2">
        <!-- Input side -->
        <div class="space-y-6 animate-fade-up animate-delay-1">
          <div class="flex flex-col border border-border-default bg-bg-surface p-6">
            <div class="mb-4 flex items-center justify-between">
              <h3
                class="font-display text-sm font-bold uppercase tracking-widest text-text-secondary"
              >
                // CODE EDITOR
              </h3>
              <div class="flex gap-2">
                <div class="size-2 rounded-full bg-accent-coral"></div>
                <div class="size-2 rounded-full bg-accent-amber"></div>
                <div class="size-2 rounded-full bg-accent-sky"></div>
              </div>
            </div>
            <textarea
              v-model="codeInput"
              class="min-h-[300px] w-full bg-transparent font-mono text-sm leading-relaxed focus:outline-none"
              spellcheck="false"
              placeholder="Dán code của bạn vào đây..."
            ></textarea>
          </div>

          <!-- Controls -->
          <div class="flex gap-4">
            <button
              @click="togglePlay"
              class="flex flex-1 items-center justify-center gap-3 py-4 font-display text-sm font-bold uppercase tracking-widest transition-all active:scale-[0.98]"
              :class="
                isPlaying
                  ? 'bg-accent-coral text-bg-deep'
                  : 'border border-accent-sky text-accent-sky hover:bg-accent-sky hover:text-bg-deep'
              "
            >
              <Icon
                :icon="isPlaying ? 'lucide:square' : 'lucide:play'"
                class="size-6"
                :class="{ 'animate-pulse': isPlaying }"
              />
              {{ isPlaying ? 'Dừng lại' : 'Phát nhạc' }}
            </button>
            <button
              @click="codeInput = ''"
              class="flex items-center justify-center border border-border-default bg-bg-surface px-6 py-4 text-text-dim transition-colors hover:text-text-primary hover:border-text-primary"
            >
              <Icon icon="lucide:trash-2" class="size-6" />
            </button>
          </div>
        </div>

        <!-- Render & Visualizer side -->
        <div class="flex flex-col gap-8 animate-fade-up animate-delay-2">
          <!-- Mapping Info -->
          <div class="grid grid-cols-3 gap-3">
            <div class="border border-border-default bg-bg-surface p-4 text-center">
              <Icon icon="lucide:arrow-big-down" class="mx-auto mb-2 text-accent-coral" />
              <span class="block text-[10px] uppercase tracking-tighter text-text-dim"
                >Keywords</span
              >
              <span class="text-xs font-bold text-accent-coral">808 BASS</span>
            </div>
            <div class="border border-border-default bg-bg-surface p-4 text-center">
              <Icon icon="lucide:star" class="mx-auto mb-2 text-accent-sky" />
              <span class="block text-[10px] uppercase tracking-tighter text-text-dim"
                >Strings</span
              >
              <span class="text-xs font-bold text-accent-sky">BELLS</span>
            </div>
            <div class="border border-border-default bg-bg-surface p-4 text-center">
              <Icon icon="lucide:hash" class="mx-auto mb-2 text-accent-amber" />
              <span class="block text-[10px] uppercase tracking-tighter text-text-dim"
                >Numbers</span
              >
              <span class="text-xs font-bold text-accent-amber">CLICKS</span>
            </div>
          </div>

          <!-- The Visualizer Card -->
          <div
            class="relative flex flex-col border border-border-default bg-bg-surface p-8 overflow-hidden"
          >
            <!-- Background Ordinal -->
            <span
              class="absolute -right-8 -top-4 z-0 font-display text-[15rem] font-bold text-white/[0.01] select-none"
            >
              03
            </span>

            <h3 class="relative z-10 mb-8 font-display text-lg font-bold">// WAVEFORM</h3>

            <div
              class="relative z-10 flex h-[150px] items-end gap-2 border-b border-border-default pb-2"
            >
              <canvas ref="canvasRef" width="400" height="150" class="w-full" />
            </div>

            <!-- Token Highlight Area -->
            <div class="relative z-10 mt-8 min-h-[100px] border-t border-border-default pt-6">
              <div v-if="currentTokenIdx >= 0" class="flex flex-col gap-2">
                <span class="text-[10px] uppercase tracking-widest text-text-dim"
                  >Đang xử lý token:</span
                >
                <div class="flex items-center gap-4">
                  <span
                    class="text-2xl font-bold tracking-tight text-white px-2 py-1"
                    :class="{
                      'bg-accent-coral': tokens[currentTokenIdx]?.type === 'keyword',
                      'bg-accent-sky': tokens[currentTokenIdx]?.type === 'string',
                      'bg-accent-amber': tokens[currentTokenIdx]?.type === 'numeric',
                      'bg-bg-elevated': tokens[currentTokenIdx]?.type === 'other',
                    }"
                  >
                    {{ tokens[currentTokenIdx]?.text }}
                  </span>
                  <span class="text-xs font-mono text-text-secondary uppercase">
                    {{ tokens[currentTokenIdx]?.type }}
                  </span>
                </div>
              </div>
              <div v-else class="flex flex-col items-center justify-center py-4 opacity-20">
                <p class="text-sm">Nhấn Phát nhạc để bộ giải mã code bắt đầu hoạt động</p>
              </div>
            </div>
          </div>

          <!-- Highlight Preview (Optional Vibe) -->
          <div class="flex-1 border border-border-default bg-bg-surface/50 p-6 overflow-hidden">
            <div
              v-html="highlightedCode"
              class="shiki-preview font-mono text-[11px] opacity-40"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.shiki) {
  background: transparent !important;
  padding: 0;
  margin: 0;
}

:deep(pre) {
  white-space: pre-wrap;
  word-break: break-all;
}

* {
  border-radius: 0 !important;
}

.shiki-preview {
  mask-image: linear-gradient(to bottom, black, transparent);
}
</style>
