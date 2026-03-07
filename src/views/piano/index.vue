<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'

// ─── Types ──────────────────────────────────────────────────────────
interface PianoKey {
  note: string
  frequency: number
  isBlack: boolean
  keyBind: string
  label: string
}

interface RecordedNote {
  note: string
  frequency: number
  time: number
  duration: number
}

// ─── Piano Note Definitions ─────────────────────────────────────────
// Equal temperament: f = 440 * 2^((n-49)/12) where n is key number (A4 = 49)
const NOTES: PianoKey[] = [
  // Octave 4
  { note: 'C4', frequency: 261.63, isBlack: false, keyBind: 'a', label: 'A' },
  { note: 'C#4', frequency: 277.18, isBlack: true, keyBind: 'w', label: 'W' },
  { note: 'D4', frequency: 293.66, isBlack: false, keyBind: 's', label: 'S' },
  { note: 'D#4', frequency: 311.13, isBlack: true, keyBind: 'e', label: 'E' },
  { note: 'E4', frequency: 329.63, isBlack: false, keyBind: 'd', label: 'D' },
  { note: 'F4', frequency: 349.23, isBlack: false, keyBind: 'f', label: 'F' },
  { note: 'F#4', frequency: 369.99, isBlack: true, keyBind: 't', label: 'T' },
  { note: 'G4', frequency: 392.0, isBlack: false, keyBind: 'g', label: 'G' },
  { note: 'G#4', frequency: 415.3, isBlack: true, keyBind: 'y', label: 'Y' },
  { note: 'A4', frequency: 440.0, isBlack: false, keyBind: 'h', label: 'H' },
  { note: 'A#4', frequency: 466.16, isBlack: true, keyBind: 'u', label: 'U' },
  { note: 'B4', frequency: 493.88, isBlack: false, keyBind: 'j', label: 'J' },
  // Octave 5
  { note: 'C5', frequency: 523.25, isBlack: false, keyBind: 'k', label: 'K' },
  { note: 'C#5', frequency: 554.37, isBlack: true, keyBind: 'o', label: 'O' },
  { note: 'D5', frequency: 587.33, isBlack: false, keyBind: 'l', label: 'L' },
  { note: 'D#5', frequency: 622.25, isBlack: true, keyBind: 'p', label: 'P' },
  { note: 'E5', frequency: 659.26, isBlack: false, keyBind: ';', label: ';' },
  { note: 'F5', frequency: 698.46, isBlack: false, keyBind: 'z', label: 'Z' },
  { note: 'F#5', frequency: 739.99, isBlack: true, keyBind: 'x', label: 'X' },
  { note: 'G5', frequency: 783.99, isBlack: false, keyBind: 'c', label: 'C' },
  { note: 'G#5', frequency: 830.61, isBlack: true, keyBind: 'v', label: 'V' },
  { note: 'A5', frequency: 880.0, isBlack: false, keyBind: 'b', label: 'B' },
  { note: 'A#5', frequency: 932.33, isBlack: true, keyBind: 'n', label: 'N' },
  { note: 'B5', frequency: 987.77, isBlack: false, keyBind: 'm', label: 'M' },
]

const whiteKeys = NOTES.filter((n) => !n.isBlack)
const blackKeys = NOTES.filter((n) => n.isBlack)

// ─── Audio ──────────────────────────────────────────────────────────
let audioCtx: AudioContext | null = null

function ensureAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

// Active oscillators map
const activeOscillators = new Map<
  string,
  { oscillators: OscillatorNode[]; gainNode: GainNode; startTime: number }
>()

function playNote(key: PianoKey) {
  if (activeOscillators.has(key.note)) return

  const ctx = ensureAudioCtx()
  const now = ctx.currentTime

  // Master gain for this note
  const masterGain = ctx.createGain()
  masterGain.gain.setValueAtTime(0, now)
  masterGain.gain.linearRampToValueAtTime(0.3, now + 0.01) // Attack
  masterGain.gain.exponentialRampToValueAtTime(0.15, now + 0.2) // Decay to sustain
  masterGain.connect(ctx.destination)

  const oscillators: OscillatorNode[] = []

  // Fundamental
  const osc1 = ctx.createOscillator()
  osc1.type = 'triangle'
  osc1.frequency.setValueAtTime(key.frequency, now)
  const gain1 = ctx.createGain()
  gain1.gain.setValueAtTime(0.6, now)
  osc1.connect(gain1).connect(masterGain)
  osc1.start(now)
  oscillators.push(osc1)

  // 2nd harmonic (softer)
  const osc2 = ctx.createOscillator()
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(key.frequency * 2, now)
  const gain2 = ctx.createGain()
  gain2.gain.setValueAtTime(0.15, now)
  osc2.connect(gain2).connect(masterGain)
  osc2.start(now)
  oscillators.push(osc2)

  // 3rd harmonic (very soft)
  const osc3 = ctx.createOscillator()
  osc3.type = 'sine'
  osc3.frequency.setValueAtTime(key.frequency * 3, now)
  const gain3 = ctx.createGain()
  gain3.gain.setValueAtTime(0.05, now)
  osc3.connect(gain3).connect(masterGain)
  osc3.start(now)
  oscillators.push(osc3)

  activeOscillators.set(key.note, {
    oscillators,
    gainNode: masterGain,
    startTime: Date.now(),
  })

  // Visual feedback
  pressedKeys.add(key.note)

  // Recording
  if (isRecording.value) {
    recordingStartTimes.set(key.note, Date.now())
  }
}

function stopNote(key: PianoKey) {
  const active = activeOscillators.get(key.note)
  if (!active) return

  const ctx = ensureAudioCtx()
  const now = ctx.currentTime

  // Release envelope
  if (sustainMode.value) {
    active.gainNode.gain.setTargetAtTime(0, now, 0.8)
    setTimeout(() => {
      active.oscillators.forEach((osc) => {
        try {
          osc.stop()
        } catch {
          /* already stopped */
        }
      })
    }, 3000)
  } else {
    active.gainNode.gain.setTargetAtTime(0, now, 0.08)
    setTimeout(() => {
      active.oscillators.forEach((osc) => {
        try {
          osc.stop()
        } catch {
          /* already stopped */
        }
      })
    }, 500)
  }

  activeOscillators.delete(key.note)

  // Visual feedback
  pressedKeys.delete(key.note)

  // Recording
  if (isRecording.value && recordingStartTimes.has(key.note)) {
    const startMs = recordingStartTimes.get(key.note)!
    const nowMs = Date.now()
    recordedNotes.push({
      note: key.note,
      frequency: key.frequency,
      time: startMs - (recordStartTime.value ?? startMs),
      duration: nowMs - startMs,
    })
    recordingStartTimes.delete(key.note)
  }
}

// ─── Visual State ───────────────────────────────────────────────────
const pressedKeys = reactive(new Set<string>())

// ─── Sustain ────────────────────────────────────────────────────────
const sustainMode = ref(false)

// ─── Recording ──────────────────────────────────────────────────────
const isRecording = ref(false)
const isPlaying = ref(false)
const recordedNotes = reactive<RecordedNote[]>([])
const recordStartTime = ref<number | null>(null)
const recordingStartTimes = new Map<string, number>()
let playbackTimeouts: ReturnType<typeof setTimeout>[] = []

function toggleRecording() {
  if (isRecording.value) {
    // Stop recording
    isRecording.value = false
  } else {
    // Start recording — clear previous
    recordedNotes.splice(0, recordedNotes.length)
    recordStartTime.value = Date.now()
    isRecording.value = true
  }
}

function playRecording() {
  if (recordedNotes.length === 0 || isPlaying.value) return

  isPlaying.value = true

  // Schedule all notes
  for (const rn of recordedNotes) {
    const key = NOTES.find((k) => k.note === rn.note)
    if (!key) continue

    const startTimeout = setTimeout(() => {
      playNote(key)
    }, rn.time)
    playbackTimeouts.push(startTimeout)

    const stopTimeout = setTimeout(() => {
      stopNote(key)
    }, rn.time + rn.duration)
    playbackTimeouts.push(stopTimeout)
  }

  // Find total duration
  const maxEnd = Math.max(...recordedNotes.map((rn) => rn.time + rn.duration))
  const endTimeout = setTimeout(() => {
    isPlaying.value = false
  }, maxEnd + 100)
  playbackTimeouts.push(endTimeout)
}

function stopPlayback() {
  playbackTimeouts.forEach(clearTimeout)
  playbackTimeouts = []
  isPlaying.value = false
  // Stop all active notes
  for (const [, active] of activeOscillators) {
    active.oscillators.forEach((osc) => {
      try {
        osc.stop()
      } catch {
        /* already stopped */
      }
    })
  }
  activeOscillators.clear()
  pressedKeys.clear()
}

// ─── Keyboard Events ────────────────────────────────────────────────
const keyboardMap = new Map<string, PianoKey>()
for (const key of NOTES) {
  keyboardMap.set(key.keyBind.toLowerCase(), key)
}

const heldPhysicalKeys = new Set<string>()

function onKeyDown(e: KeyboardEvent) {
  if (e.repeat) return
  const lowerKey = e.key.toLowerCase()
  if (heldPhysicalKeys.has(lowerKey)) return

  const pianoKey = keyboardMap.get(lowerKey)
  if (pianoKey) {
    e.preventDefault()
    heldPhysicalKeys.add(lowerKey)
    playNote(pianoKey)
  }
}

function onKeyUp(e: KeyboardEvent) {
  const lowerKey = e.key.toLowerCase()
  heldPhysicalKeys.delete(lowerKey)

  const pianoKey = keyboardMap.get(lowerKey)
  if (pianoKey) {
    e.preventDefault()
    stopNote(pianoKey)
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  stopPlayback()
  if (audioCtx) {
    audioCtx.close()
    audioCtx = null
  }
})

// ─── Mouse / Touch Helpers ──────────────────────────────────────────
function onPointerDown(key: PianoKey) {
  playNote(key)
}

function onPointerUp(key: PianoKey) {
  stopNote(key)
}

function onPointerLeave(key: PianoKey) {
  if (pressedKeys.has(key.note)) {
    stopNote(key)
  }
}

// ─── Black Key Positioning ──────────────────────────────────────────
// Returns the left offset (%) for a black key relative to the piano container
function blackKeyStyle(key: PianoKey): Record<string, string> {
  const noteIndex = NOTES.indexOf(key)
  // Count how many white keys precede this black key
  let whiteCount = 0
  for (let i = 0; i < noteIndex; i++) {
    const n = NOTES[i]
    if (n && !n.isBlack) whiteCount++
  }
  // Position the black key between the two surrounding white keys
  const whiteKeyWidthPercent = 100 / whiteKeys.length
  const leftPercent = whiteCount * whiteKeyWidthPercent - whiteKeyWidthPercent * 0.3
  return {
    left: `${leftPercent}%`,
    width: `${whiteKeyWidthPercent * 0.6}%`,
  }
}

// ─── Show keyboard hint ────────────────────────────────────────────
const showHints = ref(true)
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col">
    <!-- Top Nav -->
    <nav
      class="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-2 animate-fade-up"
    >
      <div class="flex items-center justify-between gap-3">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-3 sm:px-4 py-2 text-xs sm:text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          &larr; Về trang chủ
        </RouterLink>
        <button
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-3 sm:px-4 py-2 text-xs sm:text-sm text-text-secondary transition hover:border-accent-sky hover:text-text-primary select-none"
          @click="showHints = !showHints"
        >
          <span class="text-sm sm:text-base">⌨</span>
          {{ showHints ? 'Ẩn phím tắt' : 'Hiện phím tắt' }}
        </button>
      </div>
    </nav>

    <!-- Header -->
    <header
      class="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-3 sm:pt-4 pb-3 sm:pb-4 animate-fade-up animate-delay-1"
    >
      <h1 class="font-display text-2xl min-[375px]:text-3xl sm:text-4xl md:text-5xl font-bold text-accent-coral">
        🎹 Piano ảo
      </h1>
      <p class="mt-1.5 sm:mt-2 text-text-secondary text-xs sm:text-sm md:text-base">
        Chơi đàn piano ngay trên trình duyệt — dùng chuột hoặc bàn phím máy tính
      </p>
    </header>

    <!-- Controls -->
    <div
      class="w-full max-w-5xl mx-auto px-4 sm:px-6 mb-4 sm:mb-6 animate-fade-up animate-delay-2"
    >
      <div class="grid grid-cols-3 gap-2 sm:gap-3">
        <!-- Sustain -->
        <button
          class="flex items-center justify-center gap-1.5 sm:gap-2 border px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm transition select-none"
          :class="
            sustainMode
              ? 'border-accent-amber bg-accent-amber/10 text-accent-amber'
              : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-amber hover:text-text-primary'
          "
          @click="sustainMode = !sustainMode"
        >
          <span class="text-sm sm:text-base">🎵</span>
          <span>Sustain {{ sustainMode ? 'BẬT' : 'TẮT' }}</span>
        </button>

        <!-- Record -->
        <button
          class="flex items-center justify-center gap-1.5 sm:gap-2 border px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm transition select-none"
          :class="
            isRecording
              ? 'border-accent-coral bg-accent-coral/10 text-accent-coral animate-pulse'
              : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-coral hover:text-text-primary'
          "
          @click="toggleRecording"
        >
          <span class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0" :class="isRecording ? 'bg-accent-coral' : 'bg-text-dim'" />
          <span>{{ isRecording ? 'Đang ghi...' : 'Ghi âm' }}</span>
        </button>

        <!-- Play -->
        <button
          class="flex items-center justify-center gap-1.5 sm:gap-2 border px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm transition select-none"
          :class="
            isPlaying
              ? 'border-accent-sky bg-accent-sky/10 text-accent-sky'
              : recordedNotes.length === 0
                ? 'border-border-default bg-bg-surface text-text-dim cursor-not-allowed'
                : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-sky hover:text-text-primary'
          "
          :disabled="recordedNotes.length === 0 && !isPlaying"
          @click="isPlaying ? stopPlayback() : playRecording()"
        >
          <span class="text-sm sm:text-base">{{ isPlaying ? '⏹' : '▶' }}</span>
          <span>{{ isPlaying ? 'Dừng phát' : `Phát lại${recordedNotes.length ? ` (${recordedNotes.length})` : ''}` }}</span>
        </button>
      </div>
    </div>

    <!-- Piano -->
    <div
      class="flex-1 flex items-center justify-center px-2 sm:px-4 pb-4 sm:pb-8 animate-fade-up animate-delay-3"
    >
      <div class="w-full max-w-5xl">
        <div class="relative select-none" style="min-height: 120px; aspect-ratio: 5 / 1">
          <!-- White Keys -->
          <div class="flex h-full relative z-0">
            <button
              v-for="key in whiteKeys"
              :key="key.note"
              class="relative flex-1 border border-border-default flex flex-col items-center justify-end pb-1 sm:pb-4 transition-all duration-100 cursor-pointer"
              :class="
                pressedKeys.has(key.note)
                  ? 'bg-accent-coral/90 border-accent-coral shadow-lg shadow-accent-coral/20'
                  : 'bg-text-primary hover:bg-gray-200'
              "
              @pointerdown.prevent="onPointerDown(key)"
              @pointerup.prevent="onPointerUp(key)"
              @pointerleave="onPointerLeave(key)"
            >
              <span
                v-if="showHints"
                class="text-[8px] min-[375px]:text-[10px] sm:text-xs font-display font-semibold select-none"
                :class="pressedKeys.has(key.note) ? 'text-white' : 'text-text-dim'"
              >
                {{ key.label }}
              </span>
              <span
                class="text-[6px] min-[375px]:text-[8px] sm:text-[10px] font-display select-none mt-0.5"
                :class="pressedKeys.has(key.note) ? 'text-white/70' : 'text-text-dim/60'"
              >
                {{ key.note }}
              </span>
            </button>
          </div>

          <!-- Black Keys -->
          <button
            v-for="key in blackKeys"
            :key="key.note"
            class="absolute top-0 z-10 flex flex-col items-center justify-end pb-0.5 sm:pb-3 transition-all duration-100 cursor-pointer border border-bg-elevated"
            :class="
              pressedKeys.has(key.note)
                ? 'bg-accent-amber border-accent-amber shadow-lg shadow-accent-amber/30'
                : 'bg-bg-deep hover:bg-bg-elevated'
            "
            :style="{ ...blackKeyStyle(key), height: '62%' }"
            @pointerdown.prevent="onPointerDown(key)"
            @pointerup.prevent="onPointerUp(key)"
            @pointerleave="onPointerLeave(key)"
          >
            <span
              v-if="showHints"
              class="text-[6px] min-[375px]:text-[8px] sm:text-[10px] font-display font-semibold select-none"
              :class="pressedKeys.has(key.note) ? 'text-bg-deep' : 'text-text-dim'"
            >
              {{ key.label }}
            </span>
          </button>
        </div>

        <!-- Octave Labels -->
        <div class="flex mt-1.5 sm:mt-2">
          <div class="flex-1 text-center">
            <span class="font-display text-[10px] sm:text-xs tracking-widest text-accent-coral">// Octave 4</span>
          </div>
          <div class="flex-1 text-center">
            <span class="font-display text-[10px] sm:text-xs tracking-widest text-accent-amber">// Octave 5</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Keyboard Guide -->
    <div
      class="w-full max-w-5xl mx-auto px-4 sm:px-6 pb-4 sm:pb-8 animate-fade-up animate-delay-3"
    >
      <div class="border border-border-default bg-bg-surface p-3 sm:p-6">
        <h2 class="font-display text-base sm:text-lg font-semibold text-text-primary mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
          <span class="text-accent-sky font-display text-xs sm:text-sm tracking-widest">//</span>
          Hướng dẫn
        </h2>
        <div class="grid gap-2 sm:gap-3 sm:grid-cols-2 text-xs sm:text-sm text-text-secondary">
          <div class="flex items-start gap-2">
            <span class="text-accent-coral font-display font-bold shrink-0">⌨</span>
            <span>
              <strong class="text-text-primary">Phím trắng:</strong>
              A S D F G H J (Octave 4) · K L ; Z C B M (Octave 5)
            </span>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-accent-amber font-display font-bold shrink-0">⌨</span>
            <span>
              <strong class="text-text-primary">Phím đen:</strong>
              W E T Y U (Octave 4) · O P X V N (Octave 5)
            </span>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-accent-sky font-display font-bold shrink-0">🖱</span>
            <span>Click hoặc chạm trực tiếp vào phím piano để chơi</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-accent-coral font-display font-bold shrink-0">🎵</span>
            <span>Bật <strong class="text-text-primary">Sustain</strong> để giữ nốt vang dài hơn</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="text-center py-4 text-text-dim text-xs font-display tracking-wide animate-fade-up animate-delay-4">
      Được tạo bởi cộng đồng J2TEAM 🎶
    </footer>
  </div>
</template>
