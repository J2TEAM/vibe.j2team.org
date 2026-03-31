export type TrackType = 'drum' | 'melodic'

export interface StepCell {
  active: boolean
  velocity: number // 0–127
}

export interface PianoNote {
  id: string
  pitch: number // MIDI note number, e.g. 60 = C4
  startStep: number // in 16th notes
  duration: number // in 16th notes
  velocity: number // 0–127
}

export interface Track {
  id: string
  instrumentId: string
  name: string
  icon: string
  type: TrackType
  steps: StepCell[]
  pianoNotes: PianoNote[]
  volume: number // 0–1
  pan: number // -1 to 1
  filterFreq: number // 20–20000 Hz
  muted: boolean
  solo: boolean
  color: string
}

export interface Pattern {
  id: string
  name: string
  tracks: Track[]
  stepCount: 16 | 32 | 64
}

export interface PlaylistSlot {
  id: string
  patternId: string
  startBar: number
  row: number
}

export interface InstrumentDef {
  id: string
  name: string
  icon: string
  type: TrackType
  category: 'drums' | 'bass' | 'melodic' | 'strings' | 'guitar'
  color: string
}

export const INSTRUMENT_LIBRARY: InstrumentDef[] = [
  // ── Drums ────────────────────────────────────────────────────────
  {
    id: 'kick',
    name: 'Kick',
    icon: 'mdi:speaker',
    type: 'drum',
    category: 'drums',
    color: '#ff6b6b',
  },
  {
    id: 'snare',
    name: 'Snare',
    icon: 'mdi:circle-outline',
    type: 'drum',
    category: 'drums',
    color: '#ff6b6b',
  },
  {
    id: 'hihat',
    name: 'Hi-Hat',
    icon: 'mdi:wave',
    type: 'drum',
    category: 'drums',
    color: '#ff6b6b',
  },
  {
    id: 'openhat',
    name: 'Open HH',
    icon: 'mdi:waves',
    type: 'drum',
    category: 'drums',
    color: '#ff6b6b',
  },
  { id: 'tom', name: 'Tom', icon: 'mdi:circle', type: 'drum', category: 'drums', color: '#ff6b6b' },
  {
    id: 'clap',
    name: 'Clap',
    icon: 'mdi:hand-wave',
    type: 'drum',
    category: 'drums',
    color: '#ff6b6b',
  },
  {
    id: 'cowbell',
    name: 'Cowbell',
    icon: 'mdi:bell',
    type: 'drum',
    category: 'drums',
    color: '#ff6b6b',
  },
  {
    id: 'rimshot',
    name: 'Rim Shot',
    icon: 'mdi:record-circle-outline',
    type: 'drum',
    category: 'drums',
    color: '#ff6b6b',
  },
  // ── Bass ─────────────────────────────────────────────────────────
  {
    id: 'bass',
    name: 'Bass Synth',
    icon: 'lucide:music-2',
    type: 'melodic',
    category: 'bass',
    color: '#ffd93d',
  },
  {
    id: 'subbass',
    name: 'Sub Bass',
    icon: 'lucide:arrow-down-to-line',
    type: 'melodic',
    category: 'bass',
    color: '#ffd93d',
  },
  {
    id: 'slapbass',
    name: 'Slap Bass',
    icon: 'lucide:hand',
    type: 'melodic',
    category: 'bass',
    color: '#ffd93d',
  },
  {
    id: 'fretless',
    name: 'Fretless',
    icon: 'lucide:guitar',
    type: 'melodic',
    category: 'bass',
    color: '#ffd93d',
  },
  // ── Melodic ──────────────────────────────────────────────────────
  {
    id: 'synth',
    name: 'Synth Lead',
    icon: 'lucide:zap',
    type: 'melodic',
    category: 'melodic',
    color: '#6bcaff',
  },
  {
    id: 'pad',
    name: 'Synth Pad',
    icon: 'lucide:layers',
    type: 'melodic',
    category: 'melodic',
    color: '#6bcaff',
  },
  {
    id: 'epiano',
    name: 'E. Piano',
    icon: 'lucide:piano',
    type: 'melodic',
    category: 'melodic',
    color: '#6bcaff',
  },
  {
    id: 'organ',
    name: 'Organ',
    icon: 'mdi:organ',
    type: 'melodic',
    category: 'melodic',
    color: '#6bcaff',
  },
  {
    id: 'marimba',
    name: 'Marimba',
    icon: 'mdi:music-note-sixteenth',
    type: 'melodic',
    category: 'melodic',
    color: '#6bcaff',
  },
  {
    id: 'bells',
    name: 'Bells',
    icon: 'lucide:bell',
    type: 'melodic',
    category: 'melodic',
    color: '#6bcaff',
  },
  {
    id: 'piano',
    name: 'Piano Cổ Điển',
    icon: 'lucide:piano',
    type: 'melodic',
    category: 'melodic',
    color: '#a78bfa',
  },
  // ── Strings ──────────────────────────────────────────────────────
  {
    id: 'violin',
    name: 'Violin',
    icon: 'mdi:violin',
    type: 'melodic',
    category: 'strings',
    color: '#f97316',
  },
  // ── Guitar ───────────────────────────────────────────────────────
  {
    id: 'bassgtr',
    name: 'Bass Guitar',
    icon: 'mdi:guitar-electric',
    type: 'melodic',
    category: 'bass',
    color: '#ffd93d',
  },
  {
    id: 'elecgtr',
    name: 'Electric Gtr',
    icon: 'mdi:guitar-electric',
    type: 'melodic',
    category: 'guitar',
    color: '#4ade80',
  },
  {
    id: 'classgtr',
    name: 'Classical Gtr',
    icon: 'mdi:guitar-acoustic',
    type: 'melodic',
    category: 'guitar',
    color: '#4ade80',
  },
  {
    id: 'acoustgtr',
    name: 'Acoustic Gtr',
    icon: 'mdi:guitar-acoustic',
    type: 'melodic',
    category: 'guitar',
    color: '#4ade80',
  },
]
