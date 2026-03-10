<script setup lang="ts">
import { computed } from 'vue'
import type { NoteInfo, Clef } from './useLearnNote'

const props = defineProps<{
  note: NoteInfo | null
  clef: Clef
  feedback: boolean | null
}>()

// ─── Staff layout constants ───────────────────────────────────────────
// SVG viewBox: width=280, height=180
// 5 staff lines, spaced STEP apart
// Lines at y = LINE_Y[0..4]
const STEP = 10 // half-step distance between adjacent note positions
const STAFF_LEFT = 60 // x where staff lines start
const STAFF_RIGHT = 260
const NOTE_X = 170 // x position of the note head
const LINE_Y = [55, 65, 75, 85, 95] // y of staff lines (top to bottom)

// ─── Position mapping ──────────────────────────────────────────────────
// For treble clef: the 5 lines (bottom to top) = E4 F4 G4 A4 B4 in standard
// but we extend: lines from top to bottom in SVG
// Line positions (diatonic step from B4 upward):
// treble clef: bottom line = E4 (step 0 from bottom)
//   line 1 (bottom) = E4
//   space 1         = F4
//   line 2          = G4
//   space 2         = A4
//   line 3 (middle) = B4
//   space 3         = C5
//   line 4          = D5
//   space 4         = E5
//   line 5 (top)    = F5
//
// bass clef:
//   line 1 (bottom) = G2
//   space 1         = A2
//   line 2          = B2
//   space 2         = C3
//   line 3 (middle) = D3
//   space 3         = E3
//   line 4          = F3
//   space 4         = G3
//   line 5 (top)    = A3

// Diatonic note order: C=0, D=1, E=2, F=3, G=4, A=5, B=6
const DIATONIC_INDEX: Record<string, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
}

// Reference note for treble clef: bottom line = E4 → diatonic position = E4
// diatonicPos = octave * 7 + DIATONIC_INDEX[name]
function diatonicPos(note: NoteInfo): number {
  return note.octave * 7 + (DIATONIC_INDEX[note.name] ?? 0)
}

// Treble clef: bottom line (line1) = E4 → diatonicPos(E4) = 4*7+2 = 30
// Bass clef:   bottom line (line1) = G2 → diatonicPos(G2) = 2*7+4 = 18
const CLEF_BOTTOM_LINE_POS: Record<Clef, number> = {
  treble: 4 * 7 + 2, // E4 = 30
  bass: 2 * 7 + 4, // G2 = 18
}

// Bottom staff line in SVG is LINE_Y[4] = 95
// Each diatonic step UP = STEP/2 = 5px UP in SVG
function noteY(note: NoteInfo, clef: Clef): number {
  const bottomPos = CLEF_BOTTOM_LINE_POS[clef]
  const notePos = diatonicPos(note)
  const stepsFromBottom = notePos - bottomPos
  return LINE_Y[4]! - (stepsFromBottom * STEP) / 2
}

// ─── Ledger lines ──────────────────────────────────────────────────────
// We need ledger lines when the note is above or below the staff
// Staff spans from line 1 (y=40) to line 5 (y=80)
// Positions on/between lines within staff: steps 0..8 from bottom line
// step 0 = bottom line (line 1), step 8 = top line (line 5)
// ledger line needed every even step outside [0..8]

function ledgerLines(note: NoteInfo, clef: Clef): number[] {
  const bottomPos = CLEF_BOTTOM_LINE_POS[clef]
  const notePos = diatonicPos(note)
  const steps = notePos - bottomPos // steps from bottom line
  const ys: number[] = []

  if (steps < 0) {
    // below staff: ledger lines at steps -2, -4, -6, ... down to steps
    for (let s = -2; s >= steps; s -= 2) {
      ys.push(LINE_Y[4]! - (s * STEP) / 2)
    }
  } else if (steps > 8) {
    // above staff: ledger lines at steps 10, 12, ... up to steps
    for (let s = 10; s <= steps; s += 2) {
      ys.push(LINE_Y[4]! - (s * STEP) / 2)
    }
  }

  // middle C ledger line: for treble C4 (steps=-2) or bass C4 (steps=10)
  // already covered above

  return ys
}

// ─── Computed ──────────────────────────────────────────────────────────
const ny = computed(() => (props.note ? noteY(props.note, props.clef) : 60))
const ledgers = computed(() => (props.note ? ledgerLines(props.note, props.clef) : []))

const noteColor = computed(() => {
  if (props.feedback === null) return '#F0EDE6'
  return props.feedback ? '#38BDF8' : '#FF6B4A'
})

// Note: on/off line detection for stem direction
// If note is above middle line (B4 treble / D3 bass), stem goes down; else up
const MIDDLE_LINE_POS: Record<Clef, number> = {
  treble: 4 * 7 + 6, // B4 = 34
  bass: 3 * 7 + 1, // D3 = 22
}

const stemDown = computed(() => {
  if (!props.note) return false
  const mid = MIDDLE_LINE_POS[props.clef]
  return diatonicPos(props.note) >= mid
})

const stemX = computed(() => (stemDown.value ? NOTE_X + 6 : NOTE_X - 6))
const stemY1 = computed(() => ny.value + (stemDown.value ? 5 : -5))
const stemY2 = computed(() => (stemDown.value ? ny.value + 32 : ny.value - 32))

// Accidental symbol offset
const accidentalText = computed(() => {
  if (!props.note) return ''
  if (props.note.accidental === '#') return '♯'
  if (props.note.accidental === 'b') return '♭'
  return ''
})
</script>

<template>
  <svg
    viewBox="0 0 280 180"
    xmlns="http://www.w3.org/2000/svg"
    class="w-full"
    style="max-height: 180px"
  >
    <!-- Staff lines -->
    <line
      v-for="(ly, i) in LINE_Y"
      :key="i"
      :x1="STAFF_LEFT"
      :y1="ly"
      :x2="STAFF_RIGHT"
      :y2="ly"
      stroke="#253549"
      stroke-width="1.5"
    />

    <!-- Treble Clef: absolute coords. G4 line = y=85, staff spans y=55-95 -->
    <g v-if="clef === 'treble'">
      <!-- Body: vertical stroke from top to bottom -->
      <path
        d="M 75 32 C 75 32 71 42 71 55 C 71 69 81 77 81 85 C 81 97 73 103 73 103"
        fill="none"
        stroke="#8B9DB5"
        stroke-width="3"
        stroke-linecap="round"
      />
      <!-- Circle around G4 line (y=85) -->
      <ellipse cx="79" cy="87" rx="8" ry="6" fill="none" stroke="#8B9DB5" stroke-width="2.5" />
      <!-- Top curl -->
      <path
        d="M 75 32 C 87 27 94 37 94 47 C 94 59 84 65 75 63"
        fill="none"
        stroke="#8B9DB5"
        stroke-width="3"
        stroke-linecap="round"
      />
      <!-- Bottom tail -->
      <path
        d="M 73 103 C 69 109 69 117 75 119 C 83 121 89 115 87 109"
        fill="none"
        stroke="#8B9DB5"
        stroke-width="2.5"
        stroke-linecap="round"
      />
    </g>

    <!-- Bass Clef: curve spans line5(y=55) to line1(y=95), dots between line4(y=65) and line5(y=55) -->
    <!-- Using absolute SVG coordinates, no scale transform needed -->
    <g v-else>
      <!-- Main curve: starts near top line, curves right then down to bottom line -->
      <path
        d="M 68 57 C 68 57 84 63 84 75 C 84 87 70 93 70 93"
        fill="none"
        stroke="#8B9DB5"
        stroke-width="3"
        stroke-linecap="round"
      />
      <path
        d="M 68 57 C 80 53 90 63 90 73 C 90 85 80 91 70 93"
        fill="none"
        stroke="#8B9DB5"
        stroke-width="3"
        stroke-linecap="round"
      />
      <!-- Two dots: between line4(y=65) and line5(y=55) -->
      <circle cx="96" cy="62" r="3" fill="#8B9DB5" />
      <circle cx="96" cy="72" r="3" fill="#8B9DB5" />
    </g>

    <!-- Bar line at start -->
    <line :x1="STAFF_LEFT" y1="55" :x2="STAFF_LEFT" y2="95" stroke="#253549" stroke-width="2" />

    <!-- Ledger lines -->
    <line
      v-for="(ly, i) in ledgers"
      :key="'ledger-' + i"
      :x1="NOTE_X - 14"
      :y1="ly"
      :x2="NOTE_X + 14"
      :y2="ly"
      :stroke="noteColor"
      stroke-width="1.5"
      stroke-opacity="0.6"
    />

    <!-- Note -->
    <g v-if="note">
      <!-- Stem -->
      <line
        :x1="stemX"
        :y1="stemY1"
        :x2="stemX"
        :y2="stemY2"
        :stroke="noteColor"
        stroke-width="1.8"
      />

      <!-- Note head (filled ellipse) -->
      <ellipse
        :cx="NOTE_X"
        :cy="ny"
        rx="7"
        ry="5"
        :fill="noteColor"
        :style="{ transition: 'cy 0.25s ease, fill 0.2s ease' }"
      />

      <!-- Accidental -->
      <text
        v-if="accidentalText"
        :x="NOTE_X - 16"
        :y="ny + 5"
        font-size="14"
        :fill="noteColor"
        font-family="serif"
        text-anchor="middle"
      >
        {{ accidentalText }}
      </text>

      <!-- Feedback label -->
      <text
        v-if="feedback !== null"
        :x="NOTE_X"
        y="165"
        font-size="11"
        :fill="noteColor"
        font-family="'Anybody', sans-serif"
        text-anchor="middle"
        font-weight="700"
        letter-spacing="1"
      >
        {{ feedback ? '✓ ĐÚNG' : '✗ SAI' }}
      </text>
    </g>

    <!-- Placeholder text when no note -->
    <text
      v-else
      x="170"
      y="80"
      font-size="11"
      fill="#4A6180"
      font-family="'Be Vietnam Pro', sans-serif"
      text-anchor="middle"
    >
      Sẵn sàng...
    </text>
  </svg>
</template>
