import { ref, computed, onUnmounted } from 'vue'

export type Clef = 'treble' | 'bass'
export type Difficulty = 'easy' | 'medium' | 'hard' | 'custom'
export type AccidentalMode = 'natural' | 'sharp' | 'flat' | 'all'
export type GameScreen = 'setting' | 'playing'

export interface NoteInfo {
  name: string
  octave: number
  accidental: '' | '#' | 'b'
  fullName: string
  frequency: number
  midiNumber: number
}

export interface SessionStats {
  correct: number
  incorrect: number
  total: number
  accuracy: number
  durationSeconds: number
  timestamp: number
}

const LS_KEY = 'learn-note-history'

export function loadHistory(): SessionStats[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SessionStats[]
  } catch {
    return []
  }
}

function saveHistory(stats: SessionStats) {
  const history = loadHistory()
  history.push(stats)
  localStorage.setItem(LS_KEY, JSON.stringify(history))
}

const NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

const SHARP_NOTES: { name: string; accidental: '' | '#' | 'b'; semitone: number }[] = [
  { name: 'C', accidental: '', semitone: 0 },
  { name: 'C', accidental: '#', semitone: 1 },
  { name: 'D', accidental: '', semitone: 2 },
  { name: 'D', accidental: '#', semitone: 3 },
  { name: 'E', accidental: '', semitone: 4 },
  { name: 'F', accidental: '', semitone: 5 },
  { name: 'F', accidental: '#', semitone: 6 },
  { name: 'G', accidental: '', semitone: 7 },
  { name: 'G', accidental: '#', semitone: 8 },
  { name: 'A', accidental: '', semitone: 9 },
  { name: 'A', accidental: '#', semitone: 10 },
  { name: 'B', accidental: '', semitone: 11 },
]

const FLAT_NOTES: { name: string; accidental: '' | '#' | 'b'; semitone: number }[] = [
  { name: 'C', accidental: '', semitone: 0 },
  { name: 'D', accidental: 'b', semitone: 1 },
  { name: 'D', accidental: '', semitone: 2 },
  { name: 'E', accidental: 'b', semitone: 3 },
  { name: 'E', accidental: '', semitone: 4 },
  { name: 'F', accidental: '', semitone: 5 },
  { name: 'G', accidental: 'b', semitone: 6 },
  { name: 'G', accidental: '', semitone: 7 },
  { name: 'A', accidental: 'b', semitone: 8 },
  { name: 'A', accidental: '', semitone: 9 },
  { name: 'B', accidental: 'b', semitone: 10 },
  { name: 'B', accidental: '', semitone: 11 },
]

function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

function noteToMidi(name: string, accidental: '' | '#' | 'b', octave: number): number {
  const noteIndex = NOTE_NAMES.indexOf(name)
  const semitones = [0, 2, 4, 5, 7, 9, 11]
  const base = semitones[noteIndex] ?? 0
  const acc = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0
  return (octave + 1) * 12 + base + acc
}

function buildNote(name: string, accidental: '' | '#' | 'b', octave: number): NoteInfo {
  const midi = noteToMidi(name, accidental, octave)
  return {
    name,
    octave,
    accidental,
    fullName: `${name}${accidental}${octave}`,
    frequency: midiToFrequency(midi),
    midiNumber: midi,
  }
}

export const DIFFICULTY_RANGES: Record<
  Exclude<Difficulty, 'custom'>,
  Record<'treble' | 'bass', { low: NoteInfo; high: NoteInfo }>
> = {
  easy: {
    treble: { low: buildNote('C', '', 4), high: buildNote('B', '', 4) },
    bass: { low: buildNote('G', '', 2), high: buildNote('A', '', 3) },
  },
  medium: {
    treble: { low: buildNote('C', '', 4), high: buildNote('B', '', 5) },
    bass: { low: buildNote('E', '', 2), high: buildNote('C', '', 4) },
  },
  hard: {
    treble: { low: buildNote('C', '', 3), high: buildNote('B', '', 5) },
    bass: { low: buildNote('C', '', 2), high: buildNote('E', '', 4) },
  },
}

export const ALL_NOTES_FOR_PIANO: NoteInfo[] = (() => {
  const notes: NoteInfo[] = []
  for (let octave = 3; octave <= 5; octave++) {
    for (const { name, accidental } of SHARP_NOTES) {
      notes.push(buildNote(name, accidental, octave))
    }
  }
  return notes
})()

export const NATURAL_NOTES_FOR_PIANO: NoteInfo[] = ALL_NOTES_FOR_PIANO.filter(
  (n) => n.accidental === '',
)

function buildNotePool(
  lowMidi: number,
  highMidi: number,
  accidentalMode: AccidentalMode,
): NoteInfo[] {
  const pool: NoteInfo[] = []
  const template = accidentalMode === 'flat' ? FLAT_NOTES : SHARP_NOTES

  for (let octave = 0; octave <= 8; octave++) {
    for (const { name, accidental, semitone } of template) {
      if (accidentalMode === 'natural' && accidental !== '') continue
      if (accidentalMode === 'sharp' && accidental === 'b') continue
      if (accidentalMode === 'flat' && accidental === '#') continue

      const midi = (octave + 1) * 12 + semitone
      if (midi < lowMidi || midi > highMidi) continue
      pool.push(buildNote(name, accidental, octave))
    }
  }
  return pool
}

let audioCtx: AudioContext | null = null

// Master volume multiplier (1 = unchanged). Can be adjusted by UI or page code.
export let MASTER_VOLUME = 1
export function setMasterVolume(v: number) {
  MASTER_VOLUME = Math.max(0, v)
}

function ensureAudioCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

export function playNoteSound(frequency: number, duration = 0.9) {
  const ctx = ensureAudioCtx()
  const now = ctx.currentTime

  // Master gain controls overall loudness. Increase the peak so phones
  // sound louder, and extend the tail slightly so the note rings longer.
  const masterGain = ctx.createGain()
  masterGain.gain.setValueAtTime(0, now)
  // quick attack to a higher peak
  // Detect mobile early — we use this to choose different levels for phones
  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  // Boost peak slightly more for low-frequency (bass) notes so small
  // speakers reproduce them more audibly. If user requested "50% bass",
  // we set the master peak for mobile bass to 0.5 (50%). Desktop keeps richer levels.
  const isBass = frequency < 250 // ~D4/E4 cutoff — conservative bass threshold (tuned)
  const masterPeak = isBass && isMobile ? 0.5 * MASTER_VOLUME : isBass ? 1.0 * MASTER_VOLUME : 0.9 * MASTER_VOLUME
  masterGain.gain.linearRampToValueAtTime(masterPeak, now + 0.01)
  // smooth exponential decay to near-silence slightly after `duration`
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.06)

  // On mobile, small speakers cannot reproduce deep bass well. Instead of
  // relying only on sub‑frequencies, add a small peaking filter to lift the
  // mid-bass band and route harmonics that phones can actually play.
  let bassFilter: BiquadFilterNode | null = null
  if (isMobile && isBass) {
    bassFilter = ctx.createBiquadFilter()
    bassFilter.type = 'peaking'
    // boost around 180-250Hz where many phone speakers can still produce energy
    bassFilter.frequency.setValueAtTime(200, now)
    bassFilter.Q.setValueAtTime(0.9, now)
    bassFilter.gain.setValueAtTime(4, now) // +4 dB (tuned down for less boom)
    masterGain.connect(bassFilter)
    bassFilter.connect(ctx.destination)
  } else {
    masterGain.connect(ctx.destination)
  }

  // Primary oscillator (body)
  const osc1 = ctx.createOscillator()
  osc1.type = 'triangle'
  osc1.frequency.setValueAtTime(frequency, now)
  const g1 = ctx.createGain()
  // primary gain: for mobile bass we aim for a clear 50% level; on desktop keep the
  // stronger body so laptops remain full. Values tuned for perceived loudness.
  if (isBass && isMobile) {
    g1.gain.setValueAtTime(0.5 * MASTER_VOLUME, now) // 50% primary body on mobile
  } else {
    g1.gain.setValueAtTime((isBass ? 1.4 : 1.0) * MASTER_VOLUME, now)
  }
  osc1.connect(g1).connect(masterGain)
  osc1.start(now)
  osc1.stop(now + duration + 0.06)

  // Octave harmonic
  const osc2 = ctx.createOscillator()
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(frequency * 2, now)
  const g2 = ctx.createGain()
  // keep octave harmonic present but slightly reduced for boosted bass
  g2.gain.setValueAtTime((isBass && isMobile ? 0.25 : isBass ? 0.3 : 0.4) * MASTER_VOLUME, now)
  osc2.connect(g2).connect(masterGain)
  osc2.start(now)
  osc2.stop(now + duration + 0.06)

  // Higher harmonic (adds brightness)
  const osc3 = ctx.createOscillator()
  osc3.type = 'sine'
  osc3.frequency.setValueAtTime(frequency * 3, now)
  const g3 = ctx.createGain()
  // On mobile, emphasise higher harmonics for bass so it's audible on small
  // speakers (these harmonics are within the speakers' operating range).
  g3.gain.setValueAtTime((isBass && isMobile ? 0.25 : isBass ? 0.08 : 0.12) * MASTER_VOLUME, now)
  osc3.connect(g3).connect(masterGain)
  osc3.start(now)
  osc3.stop(now + duration + 0.06)

  // Sub-octave for low notes: adds weight so bass is audible on small
  // speakers. Only add for frequencies in the bass range.
  if (isBass) {
    const sub = ctx.createOscillator()
    sub.type = 'sine'
    sub.frequency.setValueAtTime(Math.max(20, frequency / 2), now)
    const gsub = ctx.createGain()
    // Keep sub modest on mobile (often inaudible) and stronger on desktop.
    // User requested a 50% bump for bass on mobile, so raise sub to 50% there.
    gsub.gain.setValueAtTime((isBass && isMobile ? 0.5 : isMobile ? 0.25 : 0.6) * MASTER_VOLUME, now)
    sub.connect(gsub).connect(masterGain)
    sub.start(now)
    sub.stop(now + duration + 0.06)
  }

  // Add an extra higher-odd harmonic for mobile bass enhancement
  if (isBass && isMobile) {
    const osc5 = ctx.createOscillator()
    osc5.type = 'sine'
    osc5.frequency.setValueAtTime(frequency * 5, now)
    const g5 = ctx.createGain()
    g5.gain.setValueAtTime((isMobile ? 0.08 : 0.06) * MASTER_VOLUME, now)
    osc5.connect(g5).connect(masterGain)
    osc5.start(now)
    osc5.stop(now + duration + 0.06)
  }
}

export function useLearnNote() {
  const screen = ref<GameScreen>('setting')

  const selectedDuration = ref<number>(3)
  const selectedDifficulty = ref<Difficulty>('easy')
  const selectedClef = ref<Clef>('treble')
  const selectedAccidental = ref<AccidentalMode>('natural')

  const customLowNote = ref<NoteInfo>(buildNote('C', '', 4))
  const customHighNote = ref<NoteInfo>(buildNote('B', '', 4))

  const timeLeft = ref(0)
  const totalTime = ref(0)
  const correctCount = ref(0)
  const incorrectCount = ref(0)

  const currentNote = ref<NoteInfo | null>(null)
  const lastAnswerCorrect = ref<boolean | null>(null)
  const lastAnsweredNote = ref<NoteInfo | null>(null)
  const sessionStats = ref<SessionStats | null>(null)
  const history = ref<SessionStats[]>(loadHistory())

  let timer: ReturnType<typeof setInterval> | null = null
  let notePool: NoteInfo[] = []
  let lastNoteMidi = -1

  const progressPercent = computed(() => {
    if (totalTime.value === 0) return 0
    return ((totalTime.value - timeLeft.value) / totalTime.value) * 100
  })

  const timerColor = computed(() => {
    if (timeLeft.value > totalTime.value * 0.4) return 'text-accent-sky'
    if (timeLeft.value > totalTime.value * 0.2) return 'text-accent-amber'
    return 'text-accent-coral'
  })

  const accuracy = computed(() => {
    const total = correctCount.value + incorrectCount.value
    if (total === 0) return 0
    return Math.round((correctCount.value / total) * 100)
  })

  function buildPool() {
    let lowMidi: number
    let highMidi: number

    if (selectedDifficulty.value === 'custom') {
      lowMidi = customLowNote.value.midiNumber
      highMidi = customHighNote.value.midiNumber
    } else {
      const range = DIFFICULTY_RANGES[selectedDifficulty.value][selectedClef.value]
      lowMidi = range.low.midiNumber
      highMidi = range.high.midiNumber
    }

    notePool = buildNotePool(lowMidi, highMidi, selectedAccidental.value)
    if (notePool.length === 0) {
      notePool = buildNotePool(
        buildNote('C', '', 4).midiNumber,
        buildNote('B', '', 4).midiNumber,
        'natural',
      )
    }
  }

  function randomNote() {
    if (notePool.length === 0) return
    if (notePool.length === 1) {
      currentNote.value = notePool[0] ?? null
      return
    }
    let candidates = notePool.filter((n) => n.midiNumber !== lastNoteMidi)
    if (candidates.length === 0) candidates = notePool
    const idx = Math.floor(Math.random() * candidates.length)
    const note = candidates[idx]
    if (note) {
      currentNote.value = note
      lastNoteMidi = note.midiNumber
    }
  }

  function startSession() {
    buildPool()
    totalTime.value = selectedDuration.value * 60
    timeLeft.value = selectedDuration.value * 60
    correctCount.value = 0
    incorrectCount.value = 0
    lastAnswerCorrect.value = null
    lastAnsweredNote.value = null
    sessionStats.value = null
    lastNoteMidi = -1
    randomNote()
    screen.value = 'playing'

    timer = setInterval(() => {
      timeLeft.value--
      if (timeLeft.value <= 0) endSession()
    }, 1000)
  }

  function endSession() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    sessionStats.value = {
      correct: correctCount.value,
      incorrect: incorrectCount.value,
      total: correctCount.value + incorrectCount.value,
      accuracy: accuracy.value,
      durationSeconds: totalTime.value,
      timestamp: Date.now(),
    }
    saveHistory(sessionStats.value)
    history.value = loadHistory()
    screen.value = 'setting'
  }

  function cancelSession() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    sessionStats.value = null
    screen.value = 'setting'
  }

  function answerNote(answered: NoteInfo) {
    if (!currentNote.value) return

    const isCorrect =
      answered.name === currentNote.value.name &&
      answered.accidental === currentNote.value.accidental
    lastAnswerCorrect.value = isCorrect
    lastAnsweredNote.value = answered

    playNoteSound(currentNote.value.frequency)

    if (isCorrect) {
      correctCount.value++
      setTimeout(() => {
        lastAnswerCorrect.value = null
        lastAnsweredNote.value = null
        randomNote()
      }, 700)
    } else {
      incorrectCount.value++
      setTimeout(() => {
        lastAnswerCorrect.value = null
        lastAnsweredNote.value = null
      }, 900)
    }
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  onUnmounted(() => {
    if (timer) clearInterval(timer)
    if (audioCtx) {
      audioCtx.close()
      audioCtx = null
    }
  })

  return {
    screen,
    selectedDuration,
    selectedDifficulty,
    selectedClef,
    selectedAccidental,
    customLowNote,
    customHighNote,
    timeLeft,
    totalTime,
    correctCount,
    incorrectCount,
    currentNote,
    lastAnswerCorrect,
    lastAnsweredNote,
    sessionStats,
    history,
    progressPercent,
    timerColor,
    accuracy,
    startSession,
    endSession,
    cancelSession,
    answerNote,
    formatTime,
    NOTE_NAMES,
  }
}
