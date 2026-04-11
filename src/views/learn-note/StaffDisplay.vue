<script setup lang="ts">
import { computed } from "vue";
import type { NoteInfo, Clef } from "./useLearnNote";

const props = defineProps<{
  note: NoteInfo | null;
  clef: Clef;
  feedback: boolean | null;
}>();

// ─── Staff layout constants ───────────────────────────────────────────
// SVG viewBox: width=280, height=180
// 5 staff lines, spaced STEP apart
// Lines at y = LINE_Y[0..4]
const STEP = 10; // half-step distance between adjacent note positions
const STAFF_LEFT = 60; // x where staff lines start
const STAFF_RIGHT = 260;
const NOTE_X = 170; // x position of the note head
const LINE_Y = [55, 65, 75, 85, 95]; // y of staff lines (top to bottom)

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
};

// Reference note for treble clef: bottom line = E4 → diatonic position = E4
// diatonicPos = octave * 7 + DIATONIC_INDEX[name]
function diatonicPos(note: NoteInfo): number {
  return note.octave * 7 + (DIATONIC_INDEX[note.name] ?? 0);
}

// Treble clef: bottom line (line1) = E4 → diatonicPos(E4) = 4*7+2 = 30
// Bass clef:   bottom line (line1) = G2 → diatonicPos(G2) = 2*7+4 = 18
const CLEF_BOTTOM_LINE_POS: Record<Clef, number> = {
  treble: 4 * 7 + 2, // E4 = 30
  bass: 2 * 7 + 4, // G2 = 18
};

// Bottom staff line in SVG is LINE_Y[4] = 95
// Each diatonic step UP = STEP/2 = 5px UP in SVG
function noteY(note: NoteInfo, clef: Clef): number {
  const bottomPos = CLEF_BOTTOM_LINE_POS[clef];
  const notePos = diatonicPos(note);
  const stepsFromBottom = notePos - bottomPos;
  return LINE_Y[4]! - (stepsFromBottom * STEP) / 2;
}

// ─── Ledger lines ──────────────────────────────────────────────────────
// We need ledger lines when the note is above or below the staff
// Staff spans from line 1 (y=40) to line 5 (y=80)
// Positions on/between lines within staff: steps 0..8 from bottom line
// step 0 = bottom line (line 1), step 8 = top line (line 5)
// ledger line needed every even step outside [0..8]

function ledgerLines(note: NoteInfo, clef: Clef): number[] {
  const bottomPos = CLEF_BOTTOM_LINE_POS[clef];
  const notePos = diatonicPos(note);
  const steps = notePos - bottomPos; // steps from bottom line
  const ys: number[] = [];

  if (steps < 0) {
    // below staff: ledger lines at steps -2, -4, -6, ... down to steps
    for (let s = -2; s >= steps; s -= 2) {
      ys.push(LINE_Y[4]! - (s * STEP) / 2);
    }
  } else if (steps > 8) {
    // above staff: ledger lines at steps 10, 12, ... up to steps
    for (let s = 10; s <= steps; s += 2) {
      ys.push(LINE_Y[4]! - (s * STEP) / 2);
    }
  }

  // middle C ledger line: for treble C4 (steps=-2) or bass C4 (steps=10)
  // already covered above

  return ys;
}

// ─── Computed ──────────────────────────────────────────────────────────
const ny = computed(() => (props.note ? noteY(props.note, props.clef) : 60));
const ledgers = computed(() => (props.note ? ledgerLines(props.note, props.clef) : []));

const noteColor = computed(() => {
  if (props.feedback === null) return "#F0EDE6";
  return props.feedback ? "#38BDF8" : "#FF6B4A";
});

// Note: on/off line detection for stem direction
// If note is above middle line (B4 treble / D3 bass), stem goes down; else up
const MIDDLE_LINE_POS: Record<Clef, number> = {
  treble: 4 * 7 + 6, // B4 = 34
  bass: 3 * 7 + 1, // D3 = 22
};

const stemDown = computed(() => {
  if (!props.note) return false;
  const mid = MIDDLE_LINE_POS[props.clef];
  return diatonicPos(props.note) >= mid;
});

const stemX = computed(() => (stemDown.value ? NOTE_X + 6 : NOTE_X - 6));
const stemY1 = computed(() => ny.value + (stemDown.value ? 5 : -5));
const stemY2 = computed(() => (stemDown.value ? ny.value + 32 : ny.value - 32));

// Accidental symbol offset
const accidentalText = computed(() => {
  if (!props.note) return "";
  if (props.note.accidental === "#") return "♯";
  if (props.note.accidental === "b") return "♭";
  return "";
});
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
    <svg
      v-if="clef === 'treble'"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      version="1.1"
      id="Capa_1"
      viewBox="0 0 459.889 459.889"
      xml:space="preserve"
      class="mdl-js"
      fill="#4a6180"
      height="55px"
      width="55px"
      x="48"
      y="51"
    >
      <path
        id="XMLID_1281_"
        d="M310.138,274.839c0.197-18.678-5.973-35.675-16.929-46.63c-14.351-14.351-36.018-17.934-56.75-11.495  c-4.476-19.904-9.113-39.879-13.671-59.445c3.706-4.763,7.307-9.278,10.782-13.634c24.694-30.958,42.536-53.327,38.402-92.602  c-3.566-33.879-15.748-45.525-25.339-49.33c-9.226-3.661-19.637-1.357-28.558,6.321c-20.27,17.447-35.488,64.636-21,127.011  c1.346,5.795,2.711,11.657,4.089,17.571c-8.521,11.282-17.693,24.235-26.945,39.363c-28.073,45.896-26.966,79.653-21.094,99.891  c5.945,20.491,19.521,37.243,37.244,45.959c17.589,8.65,35.056,12.09,51.405,10.454c2.894,19.703,4.808,37.689,5.328,53.007  c-5.372-2.577-11.572-4.057-18.175-4.057c-20.402,0-37,14.056-37,31.333c0,17.277,16.598,31.333,37,31.333  c19.905,0,34.485-13.283,36.596-26.11c3.518-21.373,1.309-53.042-4.184-90.106c10.505-3.993,20.278-10.368,28.993-19.083  C302.716,312.209,309.934,294.075,310.138,274.839z M231.124,23.182c1.796-1.546,4.242-3.184,6.544-3.184  c0.542,0,1.076,0.091,1.592,0.295c4.51,1.789,10.573,11.46,12.822,32.833c3.276,31.12-10.81,48.779-34.147,78.036  c-0.314,0.395-0.631,0.791-0.949,1.191c-0.143-0.615-0.286-1.229-0.428-1.842C203.191,72.96,218.399,34.136,231.124,23.182z   M199.197,319.871c-12.503-6.149-22.545-18.704-26.863-33.585c-6.811-23.475-0.259-52.48,18.948-83.882  c5.385-8.804,10.688-16.774,15.862-24.109c3.581,15.446,7.216,31.268,10.761,47.138c-4.702,3.035-9.2,6.646-13.377,10.822  c-3.905,3.905-3.905,10.237,0,14.142c3.906,3.906,10.236,3.906,14.143,0c1.275-1.276,2.59-2.482,3.935-3.618  c6.114,28.214,11.741,56.122,16.068,81.861C226.39,329.63,213.119,326.718,199.197,319.871z M228.929,439.889  c-9.056,0-17-5.296-17-11.333c0-6.037,7.944-11.333,17-11.333s17,5.296,17,11.333C245.929,434.594,237.985,439.889,228.929,439.889z   M276.192,310.449c-5.612,5.612-11.656,9.945-18.074,12.99c-4.641-27.383-10.698-57.018-17.317-87.194  c14.282-5.016,28.927-3.234,38.267,6.106C293.442,256.725,294.97,291.67,276.192,310.449z"
      />
    </svg>

    <!-- Bass Clef: curve spans line5(y=55) to line1(y=95), dots between line4(y=65) and line5(y=55) -->
    <!-- Using absolute SVG coordinates, no scale transform needed -->
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      fill="#4a6180"
      height="30px"
      width="30px"
      x="62"
      y="55"
      version="1.1"
      id="Capa_1"
      viewBox="0 0 400.124 400.124"
      xml:space="preserve"
      class="mdl-js"
    >
      <g id="XMLID_1163_">
        <path
          id="XMLID_1168_"
          d="M333.266,100.068c17.506,0,31.749-14.243,31.749-31.749S350.772,36.57,333.266,36.57   s-31.749,14.243-31.749,31.749S315.759,100.068,333.266,100.068z M333.266,56.57c6.479,0,11.749,5.271,11.749,11.749   s-5.271,11.749-11.749,11.749c-6.478,0-11.749-5.271-11.749-11.749S326.788,56.57,333.266,56.57z"
        />
        <path
          id="XMLID_1231_"
          d="M333.266,146.57c-17.506,0-31.749,14.243-31.749,31.749s14.242,31.749,31.749,31.749   s31.749-14.243,31.749-31.749S350.772,146.57,333.266,146.57z M333.266,190.068c-6.478,0-11.749-5.271-11.749-11.749   s5.271-11.749,11.749-11.749c6.479,0,11.749,5.271,11.749,11.749S339.744,190.068,333.266,190.068z"
        />
        <path
          id="XMLID_1234_"
          d="M230.441,23.283C203.265,3.889,170.16-3.763,137.229,1.74c-23.424,3.914-45.115,14.323-62.726,30.101   c-15.707,14.072-44.876,41.496-38.496,81.518c4.473,28.057,31.287,47.012,59.314,42.331c28.023-4.683,47.013-31.292,42.33-59.314   c-4.555-27.261-29.862-45.964-57.03-42.653c15.472-16.793,36.311-28.313,59.903-32.255c27.663-4.623,55.469,1.804,78.298,18.096   s37.947,40.499,42.569,68.161c9.359,56.01-15.41,99.842-58.407,152.409C165.654,305.771,91.157,382.38,90.408,383.149   c-3.852,3.958-3.767,10.289,0.19,14.141c1.944,1.892,4.46,2.834,6.975,2.834c2.604,0,5.206-1.011,7.166-3.024   c0.754-0.774,75.848-77.996,113.727-124.305c36.474-44.591,74.403-98.053,62.653-168.368   C275.616,71.496,257.619,42.678,230.441,23.283z M86.847,73.336c15.118,0,28.506,10.939,31.079,26.334   c2.865,17.146-8.754,33.427-25.9,36.292c-17.146,2.87-33.681-8.713-36.292-25.9C52.127,86.318,69.877,73.336,86.847,73.336z"
        />
      </g>
    </svg>

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
        {{ feedback ? "✓ ĐÚNG" : "✗ SAI" }}
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
