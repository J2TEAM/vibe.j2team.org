<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'

const props = defineProps<{
  names: string[]
}>()

const emit = defineEmits<{
  winner: [name: string]
}>()

// ── Duck costume definitions ───────────────────────────
// Each costume has a body color, beak color, eye style, and an SVG overlay
// for the hat/accessory — inspired by movies & celebrities
interface Costume {
  id: string
  label: string
  bodyColor: string
  bellyColor: string
  beakColor: string
  // SVG string rendered inside the duck's coordinate space (viewBox "0 0 60 60")
  hatSvg: string
  // Feature override: glasses, blush, etc.
  extras?: string
}

const COSTUMES: readonly Costume[] = [
  {
    id: 'wizard',
    label: 'Wizard',
    bodyColor: '#7209B7',
    bellyColor: '#C77DFF',
    beakColor: '#FFB830',
    hatSvg: `
      <polygon points="30,4 22,22 38,22" fill="#4B0082" stroke="#9B59B6" stroke-width="1"/>
      <rect x="18" y="22" width="24" height="4" rx="1" fill="#6A0DAD"/>
      <circle cx="30" cy="9" r="2" fill="#FFD700"/>
    `,
  },
  {
    id: 'cowboy',
    label: 'Cowboy',
    bodyColor: '#8B4513',
    bellyColor: '#D2A679',
    beakColor: '#E88A2E',
    hatSvg: `
      <ellipse cx="30" cy="23" rx="16" ry="3" fill="#5C3317"/>
      <rect x="22" y="10" width="16" height="14" rx="3" fill="#7B4A28"/>
      <rect x="23" y="20" width="14" height="3" rx="1" fill="#4A2810"/>
    `,
  },
  {
    id: 'detective',
    label: 'Detective',
    bodyColor: '#2D3436',
    bellyColor: '#636E72',
    beakColor: '#FDCB6E',
    hatSvg: `
      <rect x="20" y="12" width="20" height="14" rx="1" fill="#1A1A1A"/>
      <rect x="17" y="24" width="26" height="3" fill="#111"/>
      <rect x="24" y="22" width="12" height="3" fill="#333"/>
    `,
    extras: `<rect x="19" y="32" width="22" height="3" rx="1" fill="#636E72" opacity="0.6"/>`,
  },
  {
    id: 'chef',
    label: 'Chef',
    bodyColor: '#FFFFFF',
    bellyColor: '#F0F0F0',
    beakColor: '#FF8C00',
    hatSvg: `
      <rect x="22" y="16" width="16" height="12" rx="1" fill="#FFFFFF" stroke="#DDD" stroke-width="1"/>
      <ellipse cx="30" cy="14" rx="9" ry="5" fill="#FFFFFF" stroke="#DDD" stroke-width="1"/>
      <rect x="22" y="26" width="16" height="2" fill="#E0E0E0"/>
    `,
    extras: `<line x1="27" y1="35" x2="27" y2="38" stroke="#AAA" stroke-width="1.5"/>
             <line x1="30" y1="35" x2="30" y2="38" stroke="#AAA" stroke-width="1.5"/>
             <line x1="33" y1="35" x2="33" y2="38" stroke="#AAA" stroke-width="1.5"/>`,
  },
  {
    id: 'pirate',
    label: 'Pirate',
    bodyColor: '#1A1A2E',
    bellyColor: '#E94560',
    beakColor: '#FFB230',
    hatSvg: `
      <path d="M18 24 L22 12 L30 10 L38 12 L42 24 Z" fill="#0D0D0D"/>
      <rect x="18" y="23" width="24" height="3" rx="1" fill="#1A1A1A"/>
      <rect x="27" y="12" width="6" height="8" fill="#FFFFFF"/>
      <line x1="30" y1="12" x2="30" y2="20" stroke="#111" stroke-width="1.5"/>
      <line x1="27" y1="16" x2="33" y2="16" stroke="#111" stroke-width="1.5"/>
    `,
    extras: `<circle cx="38" cy="33" r="3" fill="#0D0D0D" stroke="#444" stroke-width="1"/>`,
  },
  {
    id: 'ninja',
    label: 'Ninja',
    bodyColor: '#1A1A1A',
    bellyColor: '#333333',
    beakColor: '#CC0000',
    hatSvg: `
      <rect x="16" y="22" width="28" height="6" rx="1" fill="#111"/>
      <rect x="13" y="24" width="34" height="3" rx="1" fill="#0A0A0A"/>
    `,
    extras: `<rect x="16" y="30" width="28" height="5" rx="1" fill="#111"/>`,
  },
  {
    id: 'astronaut',
    label: 'Astronaut',
    bodyColor: '#ECEFF1',
    bellyColor: '#CFD8DC',
    beakColor: '#FFAB40',
    hatSvg: `
      <ellipse cx="30" cy="18" rx="14" ry="12" fill="#ECEFF1" stroke="#B0BEC5" stroke-width="1.5"/>
      <ellipse cx="30" cy="16" rx="9" ry="7" fill="#81D4FA" opacity="0.7"/>
      <rect x="27" y="13" width="6" height="2" fill="#FFFFFF" opacity="0.6"/>
    `,
    extras: `<rect x="23" y="34" width="14" height="3" rx="1" fill="#B0BEC5"/>
             <rect x="26" y="33" width="8" height="1.5" rx="0.5" fill="#CC0000"/>`,
  },
  {
    id: 'viking',
    label: 'Viking',
    bodyColor: '#5C3317',
    bellyColor: '#C19A6B',
    beakColor: '#E07B3C',
    hatSvg: `
      <path d="M16 24 Q30 8 44 24" fill="#555" stroke="#777" stroke-width="1"/>
      <path d="M16 24 Q14 28 12 26 Q10 20 16 24" fill="#888"/>
      <path d="M44 24 Q46 28 48 26 Q50 20 44 24" fill="#888"/>
    `,
  },
  {
    id: 'vampire',
    label: 'Vampire',
    bodyColor: '#1A0A2E',
    bellyColor: '#4A1040',
    beakColor: '#CC0000',
    hatSvg: `
      <path d="M20 24 L22 10 L30 6 L38 10 L40 24 Z" fill="#0D0019"/>
      <rect x="20" y="23" width="20" height="3" fill="#1A0A2E"/>
    `,
    extras: `<rect x="24" y="31" width="12" height="6" rx="2" fill="#2D0A3A"/>
             <path d="M28 34 L30 36 L32 34" fill="#CC0000"/>`,
  },
  {
    id: 'princess',
    label: 'Princess',
    bodyColor: '#FF85C0',
    bellyColor: '#FFD6EC',
    beakColor: '#FF6B9D',
    hatSvg: `
      <path d="M22 22 L30 6 L38 22 Z" fill="#E91E8C" stroke="#FF85C0" stroke-width="1"/>
      <ellipse cx="30" cy="22" rx="11" ry="3" fill="#E91E8C"/>
      <circle cx="30" cy="6" r="2.5" fill="#FFD700"/>
      <circle cx="22" cy="19" r="1.5" fill="#FFD700"/>
      <circle cx="38" cy="19" r="1.5" fill="#FFD700"/>
    `,
  },
  {
    id: 'robot',
    label: 'Robot',
    bodyColor: '#78909C',
    bellyColor: '#B0BEC5',
    beakColor: '#FFD600',
    hatSvg: `
      <rect x="20" y="12" width="20" height="14" rx="2" fill="#455A64" stroke="#607D8B" stroke-width="1"/>
      <rect x="22" y="14" width="16" height="8" rx="1" fill="#263238"/>
      <circle cx="26" cy="18" r="2.5" fill="#00E5FF"/>
      <circle cx="34" cy="18" r="2.5" fill="#00E5FF"/>
      <rect x="29" y="10" width="2" height="4" fill="#607D8B"/>
      <circle cx="30" cy="9" r="2" fill="#FF1744"/>
    `,
  },
  {
    id: 'samurai',
    label: 'Samurai',
    bodyColor: '#B71C1C',
    bellyColor: '#EF9A9A',
    beakColor: '#FF6F00',
    hatSvg: `
      <ellipse cx="30" cy="22" rx="16" ry="4" fill="#1A1A1A"/>
      <ellipse cx="30" cy="20" rx="10" ry="8" fill="#212121"/>
      <ellipse cx="30" cy="14" rx="5" ry="3" fill="#1A1A1A"/>
    `,
    extras: `<rect x="28" y="31" width="4" height="8" rx="1" fill="#B71C1C" transform="rotate(-10 30 35)"/>`,
  },
  {
    id: 'jedi',
    label: 'Jedi',
    bodyColor: '#795548',
    bellyColor: '#D7CCC8',
    beakColor: '#E6B830',
    hatSvg: `
      <path d="M20 24 Q22 10 30 8 Q38 10 40 24 Z" fill="#4E342E"/>
      <path d="M20 24 Q30 28 40 24" fill="none" stroke="#4E342E" stroke-width="2"/>
    `,
    extras: `<rect x="28" y="32" width="3" height="10" rx="1.5" fill="#00E5FF" opacity="0.9"/>`,
  },
  {
    id: 'zombie',
    label: 'Zombie',
    bodyColor: '#4CAF50',
    bellyColor: '#81C784',
    beakColor: '#9E9D24',
    hatSvg: `
      <rect x="21" y="12" width="18" height="13" rx="1" fill="#1B5E20"/>
      <rect x="18" y="23" width="24" height="3" fill="#1A4A1A"/>
      <path d="M24 16 L28 16" stroke="#FF5252" stroke-width="2"/>
      <path d="M32 16 L36 16" stroke="#FF5252" stroke-width="2"/>
    `,
    extras: `<circle cx="24" cy="33" r="2" fill="#FF5252" opacity="0.6"/>
             <circle cx="36" cy="35" r="1.5" fill="#FF5252" opacity="0.6"/>`,
  },
  {
    id: 'santa',
    label: 'Santa',
    bodyColor: '#CC0000',
    bellyColor: '#FF6B6B',
    beakColor: '#FF8C00',
    hatSvg: `
      <path d="M20 22 L26 8 L30 6 L34 8 L40 22 Z" fill="#CC0000"/>
      <rect x="18" y="22" width="24" height="4" rx="2" fill="#FFFFFF"/>
      <circle cx="33" cy="7" r="3" fill="#FFFFFF"/>
    `,
    extras: `<ellipse cx="30" cy="36" rx="8" ry="3" fill="#FFFFFF"/>`,
  },
  {
    id: 'clown',
    label: 'Clown',
    bodyColor: '#FF4081',
    bellyColor: '#FFEB3B',
    beakColor: '#FF1744',
    hatSvg: `
      <path d="M22 22 L30 4 L38 22 Z" fill="#3F51B5"/>
      <ellipse cx="30" cy="22" rx="11" ry="3" fill="#3F51B5"/>
      <circle cx="30" cy="4" r="3" fill="#FF1744"/>
      <circle cx="25" cy="18" r="1.5" fill="#FFEB3B"/>
      <circle cx="35" cy="18" r="1.5" fill="#FFEB3B"/>
    `,
    extras: `<circle cx="30" cy="35" r="3.5" fill="#FF1744"/>`,
  },
  {
    id: 'pharaoh',
    label: 'Pharaoh',
    bodyColor: '#F9A825',
    bellyColor: '#FFF176',
    beakColor: '#FF8F00',
    hatSvg: `
      <rect x="24" y="10" width="12" height="16" fill="#1565C0"/>
      <rect x="20" y="10" width="20" height="4" fill="#FFD600"/>
      <path d="M18 26 L24 10 L20 10 L14 26 Z" fill="#1565C0"/>
      <rect x="22" y="14" width="16" height="2" fill="#FFD600"/>
      <rect x="22" y="18" width="16" height="2" fill="#FFD600"/>
      <rect x="22" y="22" width="16" height="2" fill="#FFD600"/>
    `,
  },
  {
    id: 'knight',
    label: 'Knight',
    bodyColor: '#B0BEC5',
    bellyColor: '#ECEFF1',
    beakColor: '#FF8F00',
    hatSvg: `
      <rect x="20" y="10" width="20" height="16" rx="2" fill="#78909C" stroke="#546E7A" stroke-width="1"/>
      <rect x="22" y="14" width="16" height="7" rx="1" fill="#546E7A"/>
      <rect x="28" y="14" width="4" height="7" fill="#90A4AE"/>
      <rect x="20" y="10" width="4" height="5" fill="#546E7A"/>
      <rect x="36" y="10" width="4" height="5" fill="#546E7A"/>
    `,
  },
  {
    id: 'hacker',
    label: 'Hacker',
    bodyColor: '#0A0A0A',
    bellyColor: '#1A1A1A',
    beakColor: '#00FF41',
    hatSvg: `
      <rect x="20" y="12" width="20" height="13" rx="1" fill="#0A0A0A" stroke="#00FF41" stroke-width="1"/>
      <text x="23" y="22" font-size="7" fill="#00FF41" font-family="monospace">01</text>
      <text x="30" y="18" font-size="6" fill="#00FF41" font-family="monospace">10</text>
    `,
    extras: `<rect x="21" y="31" width="18" height="4" rx="1" fill="#00FF41" opacity="0.2" stroke="#00FF41" stroke-width="0.5"/>`,
  },
  {
    id: 'disco',
    label: 'Disco',
    bodyColor: '#FF6D00',
    bellyColor: '#FFCA28',
    beakColor: '#FF3D00',
    hatSvg: `
      <ellipse cx="30" cy="22" rx="13" ry="3" fill="#F50057"/>
      <ellipse cx="30" cy="18" rx="8" ry="6" fill="#F50057"/>
      <ellipse cx="30" cy="13" rx="5" ry="4" fill="#D500F9"/>
      <circle cx="30" cy="10" r="2.5" fill="#FFFFFF"/>
      <circle cx="26" cy="16" r="1" fill="#FFEA00"/>
      <circle cx="34" cy="16" r="1" fill="#00E5FF"/>
      <circle cx="28" cy="20" r="1" fill="#76FF03"/>
      <circle cx="32" cy="20" r="1" fill="#FF1744"/>
    `,
  },
]

// ── Types ─────────────────────────────────────────────

// A timed speed event: when normalizedRaceTime ∈ [start, end],
// the duck's speed is multiplied by `factor`.
interface SpeedEvent {
  start: number // 0–1 of raceDuration
  end: number
  factor: number // >1 sprint, <1 stumble
}

interface Duck {
  name: string
  costume: Costume
  lane: number
  progress: number // 0–1 across the track
  baseSpeed: number // progress per second at factor 1.0
  events: SpeedEvent[]
  eventStatus: '' | 'sprint' | 'stumble'
  boostFactor: number // photo-finish surge multiplier
  boostEnd: number // normalizedTime when boost expires
  wobble: number
  wobblePhase: number
  finished: boolean
  rank: number // 1-based finish order (0 = still racing)
}

// ── Track constants ────────────────────────────────────
const LANE_HEIGHT = 74
const DUCK_SIZE = 58
const TRACK_PADDING_LEFT = 96
const TRACK_PADDING_RIGHT = 80
const MIN_DUCKS = 2
const FINISH_LABEL_WIDTH = 58

// ── User settings ──────────────────────────────────────
const raceDuration = ref(15) // seconds, configurable by user

// ── Race state ─────────────────────────────────────────
const ducks = ref<Duck[]>([])
const phase = ref<'idle' | 'racing' | 'done'>('idle')
const finishOrder = ref<string[]>([])
let animId = 0
let lastTs = 0
let raceStartTs = 0
let photoFinishApplied = false
const trackEl = ref<HTMLDivElement | null>(null)
const trackWidth = ref(600)

function updateTrackWidth(): void {
  if (trackEl.value) trackWidth.value = trackEl.value.clientWidth
}

// ── Helpers ────────────────────────────────────────────
function shuffled<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

// Generate 4–6 randomised speed events spread across the race timeline.
// Each event is either a sprint (2.4–4×) or stumble (0.08–0.35×),
// ensuring unpredictable lead changes.
function generateEvents(): SpeedEvent[] {
  const count = 4 + Math.floor(Math.random() * 3)
  return Array.from({ length: count }, (_, i) => {
    const windowStart = 0.08 + (i / count) * 0.76
    const start = windowStart + Math.random() * (0.65 / count)
    const dur = 0.05 + Math.random() * 0.12
    const isSprint = Math.random() > 0.42
    return {
      start: Math.min(start, 0.87),
      end: Math.min(start + dur, 0.93),
      factor: isSprint
        ? 2.4 + Math.random() * 1.6 // 2.4–4.0× sprint
        : 0.08 + Math.random() * 0.27, // 0.08–0.35× stumble
    }
  }).sort((a, b) => a.start - b.start)
}

// ── Duck initialisation ───────────────────────────────
function initDucks(): void {
  cancelAnimationFrame(animId)
  const costumes = shuffled(COSTUMES)
  ducks.value = props.names.map((name, i) => ({
    name,
    costume: costumes[i % costumes.length]!,
    lane: i,
    progress: 0,
    // Base speed calibrated so an average duck finishes in ~raceDuration s.
    // Factor 1.3 gives headroom for stumble events.
    baseSpeed: (1 / (raceDuration.value * 1.3)) * (0.88 + Math.random() * 0.24),
    events: generateEvents(),
    eventStatus: '' as const,
    boostFactor: 1,
    boostEnd: 0,
    wobble: 0,
    wobblePhase: Math.random() * Math.PI * 2,
    finished: false,
    rank: 0,
  }))
  finishOrder.value = []
  phase.value = 'idle'
}

watch(() => props.names, initDucks, { immediate: true })

// ── Computed geometry ──────────────────────────────────
const trackHeight = computed(() => Math.max(props.names.length, MIN_DUCKS) * LANE_HEIGHT + 16)
const raceWidth = computed(
  () => trackWidth.value - TRACK_PADDING_LEFT - TRACK_PADDING_RIGHT - FINISH_LABEL_WIDTH,
)

// Live leader: highest-progress duck
const raceLeader = computed(() => {
  if (finishOrder.value.length > 0) return finishOrder.value[0]
  if (ducks.value.length === 0) return ''
  return ducks.value.reduce((best, d) => (d.progress > best.progress ? d : best), ducks.value[0]!)
    .name
})

function duckX(duck: Duck): number {
  return TRACK_PADDING_LEFT + duck.progress * raceWidth.value
}
function laneY(lane: number): number {
  return lane * LANE_HEIGHT + LANE_HEIGHT / 2
}

// ── Race loop ──────────────────────────────────────────
function startRace(): void {
  if (phase.value === 'racing' || ducks.value.length < MIN_DUCKS) return

  photoFinishApplied = false
  const costumes = shuffled(COSTUMES)
  for (let i = 0; i < ducks.value.length; i++) {
    const d = ducks.value[i]!
    d.costume = costumes[i % costumes.length]!
    d.progress = 0
    d.baseSpeed = (1 / (raceDuration.value * 1.3)) * (0.88 + Math.random() * 0.24)
    d.events = generateEvents()
    d.eventStatus = ''
    d.boostFactor = 1
    d.boostEnd = 0
    d.finished = false
    d.rank = 0
    d.wobblePhase = Math.random() * Math.PI * 2
  }
  finishOrder.value = []
  phase.value = 'racing'
  lastTs = 0
  raceStartTs = 0
  animId = requestAnimationFrame(tick)
}

function tick(ts: number): void {
  if (lastTs === 0) {
    lastTs = ts
    raceStartTs = ts
  }
  const dt = Math.min((ts - lastTs) / 1000, 0.05)
  lastTs = ts
  const normalizedTime = (ts - raceStartTs) / 1000 / raceDuration.value

  // Photo-finish surge: when the leader hits 90%, boost close contenders
  // so the final stretch becomes a nail-biter.
  if (!photoFinishApplied) {
    const maxProg = Math.max(...ducks.value.map((d) => d.progress))
    if (maxProg >= 0.9) {
      photoFinishApplied = true
      for (const d of ducks.value) {
        if (!d.finished && maxProg - d.progress <= 0.15) {
          d.boostFactor = 1.7 + Math.random() * 1.0
          d.boostEnd = normalizedTime + 0.14
        }
      }
    }
  }

  for (const duck of ducks.value) {
    if (duck.finished) continue

    // Expire photo-finish boost
    if (duck.boostFactor > 1 && normalizedTime > duck.boostEnd) duck.boostFactor = 1

    // Find active speed event
    let eventFactor = 1.0
    duck.eventStatus = ''
    for (const ev of duck.events) {
      if (normalizedTime >= ev.start && normalizedTime <= ev.end) {
        eventFactor = ev.factor
        duck.eventStatus = eventFactor > 1 ? 'sprint' : 'stumble'
        break
      }
    }

    const effective = eventFactor * duck.boostFactor
    const jitter = 1 + (Math.random() - 0.5) * 0.08
    duck.progress = Math.min(duck.progress + duck.baseSpeed * effective * jitter * dt, 1)

    // More frantic wobble when sprinting
    duck.wobblePhase += dt * (effective > 1.8 ? 9 : 4.5)
    duck.wobble = Math.sin(duck.wobblePhase) * (effective > 1.8 ? 7 : 3)

    if (duck.progress >= 1) {
      duck.finished = true
      duck.progress = 1
      duck.wobble = 0
      duck.eventStatus = ''
      duck.rank = finishOrder.value.length + 1
      finishOrder.value.push(duck.name)
    }
  }

  if (ducks.value.every((d) => d.finished)) {
    phase.value = 'done'
    emit('winner', finishOrder.value[0] ?? '')
    return
  }

  animId = requestAnimationFrame(tick)
}

function reset(): void {
  cancelAnimationFrame(animId)
  initDucks()
}

onUnmounted(() => cancelAnimationFrame(animId))

// ── Expose so parent can trigger spin/start ───────────
defineExpose({ spin: startRace })

// ── ResizeObserver for responsive track width ─────────
let resizeObs: ResizeObserver | null = null
watch(trackEl, (el) => {
  resizeObs?.disconnect()
  if (!el) return
  updateTrackWidth()
  resizeObs = new ResizeObserver(updateTrackWidth)
  resizeObs.observe(el)
})
onUnmounted(() => resizeObs?.disconnect())
</script>

<template>
  <div class="flex w-full flex-col gap-5">
    <!-- Track area -->
    <div
      ref="trackEl"
      class="relative w-full overflow-hidden border border-border-default bg-bg-surface"
      :style="{ height: `${trackHeight}px` }"
    >
      <!-- Water lanes -->
      <div
        v-for="(_, i) in ducks"
        :key="`lane-${i}`"
        class="absolute w-full"
        :style="{
          top: `${i * LANE_HEIGHT}px`,
          height: `${LANE_HEIGHT}px`,
        }"
      >
        <!-- Alternating water rows -->
        <div
          class="absolute inset-0"
          :style="{
            background:
              i % 2 === 0
                ? 'linear-gradient(180deg, #0E2A45 0%, #0A2035 100%)'
                : 'linear-gradient(180deg, #0A2035 0%, #081828 100%)',
          }"
        />
        <!-- Wave lines -->
        <svg
          class="absolute inset-0 w-full opacity-20"
          :height="LANE_HEIGHT"
          preserveAspectRatio="none"
          viewBox="0 0 400 68"
        >
          <path
            d="M0 34 Q50 26 100 34 Q150 42 200 34 Q250 26 300 34 Q350 42 400 34"
            fill="none"
            stroke="#38BDF8"
            stroke-width="1.5"
          />
          <path
            d="M0 44 Q50 36 100 44 Q150 52 200 44 Q250 36 300 44 Q350 52 400 44"
            fill="none"
            stroke="#38BDF8"
            stroke-width="1"
            opacity="0.5"
          />
        </svg>
        <!-- Lane name label on the left -->
        <div
          class="absolute left-0 flex h-full items-center"
          :style="{ width: `${TRACK_PADDING_LEFT}px` }"
        >
          <div class="pl-2 min-w-0" :style="{ maxWidth: `${TRACK_PADDING_LEFT - 6}px` }">
            <span
              class="block truncate font-display text-xs font-semibold text-text-secondary leading-tight"
              :title="ducks[i]?.name"
            >
              {{ ducks[i]?.name }}
            </span>
            <span
              v-if="ducks[i]?.eventStatus === 'sprint'"
              class="text-[9px] font-bold leading-tight text-accent-amber"
              >⚡ SPRINT</span
            >
            <span
              v-else-if="ducks[i]?.eventStatus === 'stumble'"
              class="text-[9px] leading-tight text-accent-sky"
              >💧 SLOW</span
            >
            <span
              v-else-if="ducks[i]?.rank === 1"
              class="text-[9px] font-bold leading-tight text-accent-amber"
              >🥇 WON!</span
            >
            <span
              v-else-if="ducks[i]?.rank && ducks[i]!.rank > 1"
              class="text-[9px] leading-tight text-text-dim"
              >#{{ ducks[i]?.rank }}</span
            >
          </div>
        </div>
      </div>

      <!-- Finish line -->
      <div
        class="absolute top-0 bottom-0 flex flex-col items-center justify-center"
        :style="{
          left: `${TRACK_PADDING_LEFT + raceWidth}px`,
          width: `${FINISH_LABEL_WIDTH}px`,
        }"
      >
        <div
          class="absolute top-0 bottom-0 left-0 w-0.5 border-l-2 border-dashed border-accent-coral opacity-70"
        />
        <span
          class="font-display z-10 rotate-90 whitespace-nowrap bg-bg-surface px-1.5 text-[10px] font-bold tracking-widest text-accent-coral"
        >
          FINISH
        </span>
      </div>

      <!-- Ducks (SVG-rendered) -->
      <div
        v-for="duck in ducks"
        :key="duck.name"
        class="pointer-events-none absolute"
        :style="{
          left: `${duckX(duck)}px`,
          top: `${laneY(duck.lane) - DUCK_SIZE / 2 + duck.wobble}px`,
          width: `${DUCK_SIZE}px`,
          height: `${DUCK_SIZE}px`,
          transition: phase === 'idle' ? 'none' : undefined,
          willChange: 'transform',
          transform: duck.finished ? 'scaleX(1)' : 'scaleX(1)', // facing right always
        }"
      >
        <svg
          :viewBox="`0 0 60 60`"
          :width="DUCK_SIZE"
          :height="DUCK_SIZE"
          xmlns="http://www.w3.org/2000/svg"
          :aria-label="duck.name"
        >
          <!-- Speed aura glow (drawn first, behind body) -->
          <ellipse
            v-if="duck.eventStatus === 'sprint'"
            cx="32"
            cy="34"
            rx="25"
            ry="20"
            fill="#FFD700"
            opacity="0.16"
          />
          <ellipse
            v-else-if="duck.eventStatus === 'stumble'"
            cx="32"
            cy="34"
            rx="25"
            ry="20"
            fill="#93C5FD"
            opacity="0.20"
          />

          <!-- Body -->
          <ellipse cx="30" cy="38" rx="18" ry="13" :fill="duck.costume.bodyColor" />
          <!-- Belly -->
          <ellipse cx="30" cy="39" rx="11" ry="8" :fill="duck.costume.bellyColor" />
          <!-- Tail (LEFT side — duck faces RIGHT) -->
          <path d="M12 35 Q4 30 6 42 Q10 44 14 40 Z" :fill="duck.costume.bodyColor" />
          <!-- Wing -->
          <ellipse
            cx="30"
            cy="38"
            rx="10"
            ry="6"
            :fill="duck.costume.bodyColor"
            opacity="0.6"
            transform="rotate(15 30 38)"
          />
          <!-- Neck -->
          <ellipse cx="42" cy="30" rx="7" ry="9" :fill="duck.costume.bodyColor" />
          <!-- Head -->
          <circle cx="45" cy="22" r="10" :fill="duck.costume.bodyColor" />
          <!-- Eye white -->
          <circle cx="48" cy="20" r="3.5" fill="#FFFFFF" />
          <!-- Pupil -->
          <circle cx="49" cy="20" r="1.8" fill="#1A1A1A" />
          <!-- Eye shine -->
          <circle cx="49.5" cy="19.2" r="0.8" fill="#FFFFFF" />
          <!-- Beak (pointing RIGHT) -->
          <path d="M55 22 L60 24 L55 26 Z" :fill="duck.costume.beakColor" />

          <!-- Hat / costume overlay
               translate(15, -8): hat-space (30,30) → duck-space (45,22) = head centre -->
          <g :transform="`translate(${45 - 30}, ${22 - 30})`">
            <!-- eslint-disable vue/no-v-html -->
            <g v-html="duck.costume.hatSvg" />
            <g v-if="duck.costume.extras" v-html="duck.costume.extras" />
            <!-- eslint-enable vue/no-v-html -->
          </g>

          <!-- Sprint lightning bolt indicator (top-left, away from costume) -->
          <g v-if="duck.eventStatus === 'sprint'">
            <polygon points="12,2 8,9 11,9 7,18 15,7 12,7" fill="#FFD700" opacity="0.95" />
          </g>

          <!-- Rank badge (top-left corner) -->
          <g v-if="duck.rank > 0">
            <circle
              cx="8"
              cy="8"
              r="7"
              :fill="
                duck.rank === 1
                  ? '#FFD700'
                  : duck.rank === 2
                    ? '#C0C0C0'
                    : duck.rank === 3
                      ? '#CD7F32'
                      : '#253549'
              "
              stroke="#0F1923"
              stroke-width="1"
            />
            <text
              x="8"
              y="8"
              text-anchor="middle"
              dominant-baseline="central"
              font-size="7"
              font-weight="bold"
              font-family="'Anybody', sans-serif"
              :fill="duck.rank <= 3 ? '#0F1923' : '#8B9DB5'"
            >
              {{ duck.rank }}
            </text>
          </g>
        </svg>
      </div>
    </div>

    <!-- Controls ──────────────────────────────────────── -->
    <div class="flex flex-wrap items-center gap-4">
      <!-- Start / Race Again button -->
      <button
        v-if="phase !== 'racing'"
        :disabled="ducks.length < MIN_DUCKS"
        class="bg-accent-coral font-display px-10 py-3.5 text-sm font-bold tracking-[0.15em] text-bg-deep transition-all hover:bg-accent-amber active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        type="button"
        @click="phase === 'done' ? reset() : startRace()"
      >
        {{ phase === 'done' ? 'RACE AGAIN' : 'START RACE' }}
      </button>

      <!-- Racing indicator -->
      <div v-else class="font-display flex items-center gap-2 text-sm font-bold text-accent-amber">
        <span class="inline-block h-2 w-2 animate-ping rounded-full bg-accent-amber" />
        RACING…
      </div>

      <!-- Race duration input (hidden while racing) -->
      <label
        v-if="phase !== 'racing'"
        class="font-display flex items-center gap-2 text-xs text-text-secondary"
      >
        <span class="text-text-dim">Duration</span>
        <input
          v-model.number="raceDuration"
          type="number"
          min="5"
          max="120"
          step="5"
          class="w-16 border border-border-default bg-bg-deep px-2 py-1.5 text-center text-sm text-text-primary outline-none focus:border-accent-coral"
        />
        <span class="text-text-dim">sec</span>
      </label>

      <!-- Live leader while racing -->
      <div v-if="phase === 'racing' && raceLeader" class="font-display text-xs text-text-secondary">
        <span class="font-bold text-accent-coral">★ LEAD: </span>
        <span class="font-bold text-text-primary">{{ raceLeader }}</span>
      </div>

      <!-- Podium strip after race -->
      <div v-if="phase === 'done' && finishOrder.length > 0" class="flex flex-wrap gap-2">
        <span
          v-for="(name, idx) in finishOrder.slice(0, 3)"
          :key="name"
          class="font-display inline-flex items-center gap-1 border px-2.5 py-1 text-xs font-semibold"
          :class="[
            idx === 0
              ? 'border-accent-amber text-accent-amber'
              : idx === 1
                ? 'border-text-secondary text-text-secondary'
                : 'border-text-dim text-text-dim',
          ]"
        >
          {{ idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉' }}
          {{ name }}
        </span>
      </div>
    </div>
  </div>
</template>
