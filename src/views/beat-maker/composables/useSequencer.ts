import { ref, computed } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { useAudioEngine } from './useAudioEngine'
import type { Pattern, Track, StepCell, PianoNote } from '../types'
import { INSTRUMENT_LIBRARY } from '../types'

const { playSound, playMetronome, audioCtx, initAudio } = useAudioEngine()

let trackIdCounter = 0
let patternIdCounter = 0
let noteIdCounter = 0

function makeSteps(count: number): StepCell[] {
  return Array.from({ length: count }, () => ({ active: false, velocity: 100 }))
}

function makeTrack(instrumentId: string, stepCount: number): Track {
  const def = INSTRUMENT_LIBRARY.find((d) => d.id === instrumentId)
  return {
    id: `track-${++trackIdCounter}`,
    instrumentId,
    name: def?.name ?? instrumentId,
    icon: def?.icon ?? 'lucide:music',
    type: def?.type ?? 'drum',
    steps: makeSteps(stepCount),
    pianoNotes: [],
    volume: 0.8,
    pan: 0,
    filterFreq: 8000,
    muted: false,
    solo: false,
    color: def?.color ?? '#ff6b6b',
  }
}

function makePattern(name: string, stepCount: 16 | 32 | 64 = 16): Pattern {
  return {
    id: `pat-${++patternIdCounter}`,
    name,
    stepCount,
    tracks: [
      makeTrack('kick', stepCount),
      makeTrack('snare', stepCount),
      makeTrack('hihat', stepCount),
      makeTrack('bass', stepCount),
    ],
  }
}

// -- Singleton reactive State (shared across the page) --
const patterns = ref<Pattern[]>([makePattern('Pattern 1')])
const activePatternId = ref(patterns.value[0]!.id)
const bpm = ref(120)
const isPlaying = ref(false)
const currentStep = ref(-1)
const metronomeEnabled = ref(false)
const masterVolume = ref(0.8)

const activePattern = computed(() => patterns.value.find((p) => p.id === activePatternId.value)!)

// Apply default preset to kick
const firstKick = activePattern.value?.tracks[0]
if (firstKick)
  [0, 4, 8, 12].forEach((i) => {
    if (firstKick.steps[i]) firstKick.steps[i]!.active = true
  })

const stepDurationMs = computed(() => 60_000 / bpm.value / 4)

const hasSoloTrack = computed(() => activePattern.value?.tracks.some((t) => t.solo) ?? false)

const { pause: pauseInterval, resume: resumeInterval } = useIntervalFn(
  () => {
    const pat = activePattern.value
    if (!pat) return
    currentStep.value = (currentStep.value + 1) % pat.stepCount
    const ctx = initAudio()
    const time = ctx.currentTime

    // Metronome tick
    if (metronomeEnabled.value && currentStep.value % 4 === 0) {
      playMetronome(ctx, time, currentStep.value === 0)
    }

    pat.tracks.forEach((track) => {
      const effectiveMuted = track.muted || (hasSoloTrack.value && !track.solo)
      if (effectiveMuted) return

      if (track.type === 'drum') {
        const cell = track.steps[currentStep.value]
        if (cell?.active) {
          playSound(track.instrumentId, time, {
            velocity: cell.velocity,
            pan: track.pan,
            filterFreq: track.filterFreq,
          })
        }
      } else {
        // Play piano notes that start on this step
        const stepDurationSec = stepDurationMs.value / 1000
        track.pianoNotes
          .filter((n) => n.startStep === currentStep.value)
          .forEach((note) => {
            playSound(track.instrumentId, time, {
              velocity: note.velocity,
              pan: track.pan,
              filterFreq: track.filterFreq,
              pitch: note.pitch,
              duration: note.duration * stepDurationSec,
            })
          })
      }
    })
  },
  stepDurationMs,
  { immediate: false },
)

const togglePlay = () => {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    resumeInterval()
  } else {
    pauseInterval()
    currentStep.value = -1
  }
}

// Patterns
const addPattern = () => {
  const pat = makePattern(`Pattern ${patterns.value.length + 1}`)
  patterns.value.push(pat)
  activePatternId.value = pat.id
}

const removePattern = (id: string) => {
  if (patterns.value.length <= 1) return
  const idx = patterns.value.findIndex((p) => p.id === id)
  patterns.value.splice(idx, 1)
  if (activePatternId.value === id) {
    activePatternId.value = patterns.value[Math.max(0, idx - 1)]!.id
  }
}

const duplicatePattern = (id: string) => {
  const src = patterns.value.find((p) => p.id === id)
  if (!src) return
  const clone: Pattern = JSON.parse(JSON.stringify(src))
  clone.id = `pat-${++patternIdCounter}`
  clone.name = `${src.name} Copy`
  patterns.value.push(clone)
  activePatternId.value = clone.id
}

const renamePattern = (id: string, name: string) => {
  const pat = patterns.value.find((p) => p.id === id)
  if (pat) pat.name = name
}

// Tracks
const addTrack = (instrumentId: string) => {
  const pat = activePattern.value
  if (!pat) return
  pat.tracks.push(makeTrack(instrumentId, pat.stepCount))
}

const removeTrack = (trackId: string) => {
  const pat = activePattern.value
  if (!pat) return
  const idx = pat.tracks.findIndex((t) => t.id === trackId)
  if (idx !== -1) pat.tracks.splice(idx, 1)
}

const toggleStep = (trackId: string, step: number) => {
  const pat = activePattern.value
  if (!pat) return
  const cell = pat.tracks.find((t) => t.id === trackId)?.steps[step]
  if (cell) cell.active = !cell.active
}

const setVelocity = (trackId: string, step: number, velocity: number) => {
  const pat = activePattern.value
  if (!pat) return
  const cell = pat.tracks.find((t) => t.id === trackId)?.steps[step]
  if (cell) cell.velocity = Math.max(1, Math.min(127, velocity))
}

// Piano Roll
const addPianoNote = (
  trackId: string,
  pitch: number,
  startStep: number,
  duration: number = 1,
  velocity: number = 100,
) => {
  const pat = activePattern.value
  if (!pat) return
  const track = pat.tracks.find((t) => t.id === trackId)
  if (!track) return
  const note: PianoNote = { id: `note-${++noteIdCounter}`, pitch, startStep, duration, velocity }
  track.pianoNotes.push(note)
}

const removePianoNote = (trackId: string, noteId: string) => {
  const pat = activePattern.value
  if (!pat) return
  const track = pat.tracks.find((t) => t.id === trackId)
  if (!track) return
  track.pianoNotes = track.pianoNotes.filter((n) => n.id !== noteId)
}

// Clear
const clearPattern = () => {
  const pat = activePattern.value
  if (!pat) return
  pat.tracks.forEach((track) => {
    track.steps = makeSteps(pat.stepCount)
    track.pianoNotes = []
  })
}

export function useSequencer() {
  return {
    patterns,
    activePatternId,
    activePattern,
    bpm,
    isPlaying,
    currentStep,
    metronomeEnabled,
    masterVolume,
    audioCtx,
    // transport
    togglePlay,
    // patterns
    addPattern,
    removePattern,
    duplicatePattern,
    renamePattern,
    // tracks
    addTrack,
    removeTrack,
    toggleStep,
    setVelocity,
    // piano roll
    addPianoNote,
    removePianoNote,
    // utils
    clearPattern,
    makeSteps,
  }
}
