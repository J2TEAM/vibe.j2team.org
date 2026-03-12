<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'

const props = defineProps<{
  names: string[]
}>()

const emit = defineEmits<{
  winner: [name: string]
}>()

// ── Constants ───────────────────────────────────────────
const MIN_KONGS = 2
const BUILDING_FLOORS = 24
// Duration of the race in seconds (base — actual speed varies by random events)
const BASE_RACE_DURATION = ref(12)

// Warm palette — no purple, no cold grays
const KONG_COLORS: readonly string[] = [
  '#FF6B4A', // coral
  '#FFB830', // amber
  '#38BDF8', // sky
  '#F77F00', // orange
  '#06D6A0', // teal
  '#EF476F', // pink-red
  '#4CC9F0', // light blue
  '#52B788', // sage green
  '#E9C46A', // golden
  '#F4A261', // sandy orange
  '#118AB2', // deep sky
  '#2A9D8F', // sea green
]

// ── Types ───────────────────────────────────────────────
type KongState = 'climbing' | 'fighting' | 'falling' | 'fallen' | 'winner'

interface FightEvent {
  startNorm: number // normalized race time 0–1 when fight starts
  endNorm: number
  attackerIdx: number // index into ducks array
  defenderIdx: number
}

interface SpeedPhase {
  startNorm: number
  endNorm: number
  factor: number // >1 sprint, <1 slow
}

interface Kong {
  id: number
  name: string
  color: string
  progress: number // 0 = ground, 1 = top
  baseSpeed: number // floors-per-second at factor 1
  hp: number // starts at 3; reaches 0 → falls
  state: KongState
  fightTimer: number // countdown seconds while fighting
  fallProgress: number // increases while falling, used for fall animation
  speedPhases: SpeedPhase[]
  rank: number // finish rank (0 = still climbing)
  swayPhase: number // offset for body sway animation
  fightFlashTimer: number // brief visual flash when punching
}

// ── State ────────────────────────────────────────────────
const kongs = ref<Kong[]>([])
const phase = ref<'idle' | 'racing' | 'done'>('idle')
const finishOrder = ref<string[]>([])
const eventLog = ref<string[]>([])
const logEl = ref<HTMLDivElement | null>(null)

let animId = 0
let lastTs = 0
let raceStartTs = 0
let nextKongId = 0

// ── Track dimensions ─────────────────────────────────────
// Building is displayed as a fixed-width SVG; each Kong gets a column
const BUILDING_W = 70 // pixels per kong column in the building (wider for gorilla silhouette)
const BUILDING_H = 480 // total building height in px (SVG units)
const FLOOR_H = BUILDING_H / BUILDING_FLOORS
const BEAUTY_H = 80 // taller to fit detailed beauty figure

// Responsive container
const containerEl = ref<HTMLDivElement | null>(null)
const containerWidth = ref(600)

function updateWidth(): void {
  if (containerEl.value) containerWidth.value = containerEl.value.clientWidth
}

let resizeObs: ResizeObserver | null = null
watch(containerEl, (el) => {
  resizeObs?.disconnect()
  if (!el) return
  updateWidth()
  resizeObs = new ResizeObserver(updateWidth)
  resizeObs.observe(el)
})
onUnmounted(() => resizeObs?.disconnect())

// ── Building SVG dimensions ───────────────────────────────
const buildingWidth = computed(() => {
  const n = Math.max(props.names.length, MIN_KONGS)
  return Math.max(n * BUILDING_W + 40, 180)
})
const svgWidth = computed(() => buildingWidth.value)
const svgHeight = computed(() => BUILDING_H + BEAUTY_H + 28) // extra space for roof + beauty

// padding-left of the building columns
const BLDG_OFFSET_X = 20
const BLDG_OFFSET_Y = BEAUTY_H + 4 // top of the building in SVG coords

// ── Helpers ──────────────────────────────────────────────
function kongColumnX(idx: number): number {
  return BLDG_OFFSET_X + idx * BUILDING_W + BUILDING_W / 2
}

// progress 0–1 → Y in SVG (0=top of building, 1=bottom)
function kongY(progress: number): number {
  return BLDG_OFFSET_Y + BUILDING_H - progress * BUILDING_H
}

function shuffled<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

function generateSpeedPhases(): SpeedPhase[] {
  const count = 5 + Math.floor(Math.random() * 4)
  return Array.from({ length: count }, (_, i) => {
    const start = i / count + Math.random() * 0.04
    const end = start + 0.06 + Math.random() * 0.1
    const factor = Math.random() < 0.4 ? 0.25 + Math.random() * 0.3 : 1.5 + Math.random() * 2.0
    return { startNorm: Math.min(start, 0.95), endNorm: Math.min(end, 1.0), factor }
  }).sort((a, b) => a.startNorm - b.startNorm)
}

function generateFightEvents(n: number): FightEvent[] {
  if (n < 2) return []
  const events: FightEvent[] = []
  // randomly schedule 2–4 fights across the race
  const count = 2 + Math.floor(Math.random() * 3)
  for (let i = 0; i < count; i++) {
    const startNorm = 0.1 + Math.random() * 0.7
    const endNorm = startNorm + 0.04 + Math.random() * 0.04
    const attackerIdx = Math.floor(Math.random() * n)
    let defenderIdx = Math.floor(Math.random() * n)
    if (defenderIdx === attackerIdx) defenderIdx = (defenderIdx + 1) % n
    events.push({ startNorm, endNorm: Math.min(endNorm, 0.95), attackerIdx, defenderIdx })
  }
  return events.sort((a, b) => a.startNorm - b.startNorm)
}

// Pre-computed fight events for this race
let fightEvents: FightEvent[] = []
const fightEventUsed = new Set<number>()

// ── Init ─────────────────────────────────────────────────
function initKongs(): void {
  cancelAnimationFrame(animId)
  const colors = shuffled(KONG_COLORS)
  kongs.value = props.names.map((name, i) => ({
    id: nextKongId++,
    name,
    color: colors[i % colors.length]!,
    progress: 0,
    baseSpeed: (1 + Math.random() * 0.2) / BASE_RACE_DURATION.value,
    hp: 3,
    state: 'climbing',
    fightTimer: 0,
    fallProgress: 0,
    speedPhases: generateSpeedPhases(),
    rank: 0,
    swayPhase: Math.random() * Math.PI * 2,
    fightFlashTimer: 0,
  }))
  finishOrder.value = []
  eventLog.value = []
  fightEvents = generateFightEvents(props.names.length)
  fightEventUsed.clear()
  phase.value = 'idle'
}

watch(() => props.names, initKongs, { immediate: true })

// ── Leader ─────────────────────────────────────────────
const raceLeader = computed(() => {
  if (finishOrder.value.length > 0) return finishOrder.value[0] ?? ''
  const climbing = kongs.value.filter((k) => k.state === 'climbing')
  if (climbing.length === 0) return ''
  return climbing.reduce((best, k) => (k.progress > best.progress ? k : best), climbing[0]!).name
})

// ── Race loop ─────────────────────────────────────────────
function startRace(): void {
  if (phase.value === 'racing' || kongs.value.length < MIN_KONGS) return

  // Reset then go
  initKongs()
  phase.value = 'racing'
  lastTs = 0
  raceStartTs = 0
  animId = requestAnimationFrame(tick)
}

function addLog(msg: string): void {
  eventLog.value.unshift(msg)
  if (eventLog.value.length > 30) eventLog.value.pop()
}

function tick(ts: number): void {
  if (lastTs === 0) {
    lastTs = ts
    raceStartTs = ts
  }
  const dt = Math.min((ts - lastTs) / 1000, 0.05)
  lastTs = ts
  const normTime = (ts - raceStartTs) / 1000 / BASE_RACE_DURATION.value

  // ── Process scheduled fight events ─────────────────────
  for (let fi = 0; fi < fightEvents.length; fi++) {
    if (fightEventUsed.has(fi)) continue
    const fe = fightEvents[fi]!
    if (normTime < fe.startNorm) continue
    if (normTime > fe.endNorm) {
      fightEventUsed.add(fi)
      continue
    }

    const attacker = kongs.value[fe.attackerIdx]
    const defender = kongs.value[fe.defenderIdx]
    if (!attacker || !defender) continue
    if (attacker.state !== 'climbing' || defender.state !== 'climbing') continue
    // Only fight when close enough in the building
    if (Math.abs(attacker.progress - defender.progress) > 0.15) continue

    if (normTime >= fe.startNorm && normTime <= fe.startNorm + 0.01) {
      // Trigger the fight exactly once
      attacker.state = 'fighting'
      defender.state = 'fighting'
      attacker.fightTimer = 0.65
      defender.fightTimer = 0.65
      attacker.fightFlashTimer = 0.25
      defender.fightFlashTimer = 0.25

      // Defender loses HP
      defender.hp -= 1
      addLog(`🦍 ${attacker.name} punches ${defender.name}! (❤️ ${defender.hp} HP left)`)

      if (defender.hp <= 0) {
        addLog(`💥 ${defender.name} loses the grip and FALLS!`)
        defender.state = 'falling'
        defender.fallProgress = 0
      }
      fightEventUsed.add(fi)
    }
  }

  // ── Update each kong ────────────────────────────────────
  let finishRank = finishOrder.value.length + 1

  for (const kong of kongs.value) {
    if (kong.state === 'fallen') continue

    if (kong.state === 'falling') {
      kong.fallProgress += dt * 1.5
      if (kong.fallProgress >= 1) {
        kong.state = 'fallen'
        kong.rank = -1
        addLog(`💀 ${kong.name} has fallen off the building!`)
      }
      continue
    }

    if (kong.state === 'fighting') {
      kong.fightTimer -= dt
      kong.fightFlashTimer -= dt
      if (kong.fightTimer <= 0) {
        if (kong.state === 'fighting') kong.state = 'climbing'
        kong.fightTimer = 0
      }
      continue
    }

    if (kong.state === 'winner') continue

    // climbing
    kong.swayPhase += dt * 3.5

    // Determine current speed factor from phases
    let factor = 1.0
    for (const ph of kong.speedPhases) {
      if (normTime >= ph.startNorm && normTime <= ph.endNorm) {
        factor = ph.factor
        break
      }
    }

    kong.progress = Math.min(kong.progress + kong.baseSpeed * factor * dt, 1)

    if (kong.progress >= 1) {
      kong.state = 'winner'
      kong.rank = finishRank++
      finishOrder.value.push(kong.name)
      addLog(`🏆 ${kong.name} reaches the TOP! The beauty awaits! 🌟`)
      emit('winner', kong.name)
      phase.value = 'done'
      break
    }
  }

  // ── Check if only one kong left climbing ───────────────
  const stillActive = kongs.value.filter((k) => k.state === 'climbing' || k.state === 'fighting')

  if (phase.value !== 'done' && stillActive.length === 1) {
    const last = stillActive[0]!
    last.state = 'winner'
    last.rank = finishRank
    finishOrder.value.push(last.name)
    addLog(`🏆 ${last.name} is the last Kong standing! The beauty awaits!`)
    emit('winner', last.name)
    phase.value = 'done'
  } else if (phase.value !== 'done' && stillActive.length === 0 && kongs.value.length >= 2) {
    // All fell somehow — pick highest progress as winner
    const highest = kongs.value.reduce(
      (best, k) => (k.progress > best.progress ? k : best),
      kongs.value[0]!,
    )
    highest.state = 'winner'
    highest.rank = 1
    finishOrder.value.push(highest.name)
    addLog(`🏆 ${highest.name} wins by survival!`)
    emit('winner', highest.name)
    phase.value = 'done'
  }

  if (phase.value !== 'done') {
    animId = requestAnimationFrame(tick)
  }
}

// ── Expose ───────────────────────────────────────────────
defineExpose({ spin: startRace })

onUnmounted(() => cancelAnimationFrame(animId))

// ── SVG helpers for rendering ────────────────────────────

// Kong SVG at cx, cy with given color and state
function kongSvgTransform(kong: Kong, idx: number): string {
  const cx = kongColumnX(idx)
  if (kong.state === 'falling') {
    // fall down by fallProgress amount, also fade out handled via opacity
    const fallY = kongY(kong.progress) + kong.fallProgress * BUILDING_H * 0.8
    return `translate(${cx}, ${fallY})`
  }
  const baseY = kongY(kong.progress)
  // body sway
  const sway = kong.state === 'climbing' ? Math.sin(kong.swayPhase) * 2 : 0
  return `translate(${cx + sway}, ${baseY})`
}

function kongOpacity(kong: Kong): number {
  if (kong.state === 'fallen') return 0
  if (kong.state === 'falling') return Math.max(0, 1 - kong.fallProgress)
  return 1
}

// which index does each Kong occupy (positional, not array index)
const kongIndexMap = computed(() => {
  return kongs.value.map((_, i) => i)
})
</script>

<template>
  <div ref="containerEl" class="flex w-full flex-col gap-5">
    <!-- Race duration picker -->
    <div class="flex items-center justify-end gap-2">
      <span class="font-display text-xs tracking-widest text-text-dim">SPEED</span>
      <button
        v-for="s in [8, 12, 18]"
        :key="s"
        class="font-display border px-2.5 py-1 text-[10px] tracking-wide transition"
        :class="
          BASE_RACE_DURATION === s
            ? 'border-accent-amber text-accent-amber'
            : 'border-border-default text-text-dim hover:border-text-secondary hover:text-text-secondary'
        "
        type="button"
        @click="BASE_RACE_DURATION = s"
      >
        {{ s === 8 ? 'FAST' : s === 12 ? 'NORMAL' : 'SLOW' }}
      </button>
    </div>

    <!-- ── Building scene ── -->
    <div class="relative w-full overflow-x-auto">
      <svg
        :width="svgWidth"
        :height="svgHeight"
        :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
        class="mx-auto block"
        aria-hidden="true"
      >
        <!-- Night sky gradient -->
        <defs>
          <linearGradient id="kb-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#060D16" />
            <stop offset="100%" stop-color="#0F1923" />
          </linearGradient>
          <linearGradient id="kb-building" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#1A2A3A" />
            <stop offset="50%" stop-color="#1E2F42" />
            <stop offset="100%" stop-color="#1A2A3A" />
          </linearGradient>
          <filter id="kb-glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="kb-glow-strong">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- Sky background -->
        <rect width="100%" height="100%" fill="url(#kb-sky)" />

        <!-- Stars backdrop -->
        <circle
          v-for="i in 28"
          :key="`star-${i}`"
          :cx="(i * 137.5) % svgWidth"
          :cy="((i * 79.3) % (BLDG_OFFSET_Y + 24)) + 4"
          :r="i % 3 === 0 ? 1.2 : 0.7"
          fill="white"
          :opacity="0.3 + (i % 5) * 0.12"
        />

        <!-- Moon -->
        <circle :cx="svgWidth - 34" cy="20" r="14" fill="#F0EDE6" opacity="0.9" />
        <circle :cx="svgWidth - 28" cy="16" r="11" fill="#060D16" opacity="0.9" />

        <!-- ── Building body ── -->
        <rect
          :x="BLDG_OFFSET_X"
          :y="BLDG_OFFSET_Y"
          :width="buildingWidth - 40"
          :height="BUILDING_H"
          fill="url(#kb-building)"
          stroke="#253549"
          stroke-width="1.5"
        />

        <!-- Floor lines -->
        <line
          v-for="f in BUILDING_FLOORS - 1"
          :key="`floor-${f}`"
          :x1="BLDG_OFFSET_X"
          :y1="BLDG_OFFSET_Y + f * FLOOR_H"
          :x2="BLDG_OFFSET_X + buildingWidth - 40"
          :y2="BLDG_OFFSET_Y + f * FLOOR_H"
          stroke="#253549"
          stroke-width="0.5"
          opacity="0.6"
        />

        <!-- Windows — lit amber & unlit -->
        <template v-for="f in BUILDING_FLOORS" :key="`win-row-${f}`">
          <template
            v-for="col in Math.max(1, Math.floor((buildingWidth - 60) / 20))"
            :key="`win-${f}-${col}`"
          >
            <rect
              :x="BLDG_OFFSET_X + 6 + (col - 1) * 20"
              :y="BLDG_OFFSET_Y + (f - 1) * FLOOR_H + 4"
              width="8"
              height="6"
              :fill="(f * 7 + col * 13) % 5 !== 0 ? '#FFB830' : '#0F1923'"
              :opacity="(f * 7 + col * 13) % 5 !== 0 ? 0.55 : 0.3"
              rx="1"
            />
          </template>
        </template>

        <!-- Antenna -->
        <line
          :x1="BLDG_OFFSET_X + (buildingWidth - 40) / 2"
          :y1="BLDG_OFFSET_Y"
          :x2="BLDG_OFFSET_X + (buildingWidth - 40) / 2"
          :y2="BLDG_OFFSET_Y - 28"
          stroke="#253549"
          stroke-width="2"
        />
        <!-- Blinking red light on antenna -->
        <circle
          :cx="BLDG_OFFSET_X + (buildingWidth - 40) / 2"
          :cy="BLDG_OFFSET_Y - 28"
          r="3"
          fill="#EF476F"
          class="kb-blink"
          filter="url(#kb-glow)"
        />

        <!-- ── Beauty on top ── -->
        <g
          :transform="`translate(${BLDG_OFFSET_X + (buildingWidth - 40) / 2}, ${BLDG_OFFSET_Y - 6})`"
        >
          <!-- gown / skirt — wide flowing silhouette -->
          <path
            d="M -14 0 Q -18 -16 0 -18 Q 18 -16 14 0 Q 8 4 0 4 Q -8 4 -14 0 Z"
            fill="#EF476F"
            opacity="0.95"
          />
          <!-- gown highlight crease -->
          <path
            d="M -4 -17 Q -2 -8 -3 0"
            fill="none"
            stroke="#F0EDE6"
            stroke-width="0.8"
            opacity="0.3"
          />
          <path
            d="M 4 -17 Q 2 -8 3 0"
            fill="none"
            stroke="#F0EDE6"
            stroke-width="0.8"
            opacity="0.3"
          />
          <!-- waist band -->
          <rect x="-7" y="-20" width="14" height="3" rx="1.5" fill="#FFB830" opacity="0.9" />
          <!-- torso / bodice -->
          <path d="M -6 -20 C -7 -30 -5 -34 0 -34 C 5 -34 7 -30 6 -20 Z" fill="#F0EDE6" />
          <!-- neckline V -->
          <path d="M -4 -34 L 0 -31 L 4 -34" fill="none" stroke="#E0D8CE" stroke-width="0.8" />
          <!-- bare shoulders -->
          <ellipse cx="-8" cy="-33" rx="3" ry="2" fill="#F0EDE6" />
          <ellipse cx="8" cy="-33" rx="3" ry="2" fill="#F0EDE6" />
          <!-- neck -->
          <rect x="-2.5" y="-39" width="5" height="6" rx="2" fill="#F0EDE6" />
          <!-- head — slightly oval -->
          <ellipse cx="0" cy="-46" rx="8" ry="9" fill="#F0EDE6" />
          <!-- jaw / chin shadow -->
          <ellipse cx="0" cy="-40" rx="5.5" ry="2.5" fill="rgba(0,0,0,0.07)" />
          <!-- long flowing hair — back layer -->
          <path
            d="M -8 -52 C -14 -46 -15 -36 -13 -24"
            fill="none"
            stroke="#D4950A"
            stroke-width="5"
            stroke-linecap="round"
            opacity="0.7"
          />
          <path
            d="M 8 -52 C 14 -46 15 -36 13 -24"
            fill="none"
            stroke="#D4950A"
            stroke-width="5"
            stroke-linecap="round"
            opacity="0.7"
          />
          <!-- hair top -->
          <ellipse cx="0" cy="-53" rx="9" ry="6" fill="#FFB830" />
          <!-- side hair strands -->
          <path
            d="M -8 -50 C -12 -44 -11 -38 -9 -32"
            fill="none"
            stroke="#FFB830"
            stroke-width="3"
            stroke-linecap="round"
          />
          <path
            d="M 8 -50 C 12 -44 11 -38 9 -32"
            fill="none"
            stroke="#FFB830"
            stroke-width="3"
            stroke-linecap="round"
          />
          <!-- highlight on hair -->
          <ellipse cx="2" cy="-55" rx="4" ry="2" fill="#F0C040" opacity="0.5" />
          <!-- eyebrows -->
          <path
            d="M -5 -49 Q -3 -51 -1 -49"
            fill="none"
            stroke="#8B6914"
            stroke-width="1.2"
            stroke-linecap="round"
          />
          <path
            d="M 1 -49 Q 3 -51 5 -49"
            fill="none"
            stroke="#8B6914"
            stroke-width="1.2"
            stroke-linecap="round"
          />
          <!-- eyes — almond shaped -->
          <ellipse cx="-3.5" cy="-47" rx="2.8" ry="2" fill="white" />
          <ellipse cx="3.5" cy="-47" rx="2.8" ry="2" fill="white" />
          <circle cx="-3.2" cy="-47" r="1.5" fill="#3D2000" />
          <circle cx="3.2" cy="-47" r="1.5" fill="#3D2000" />
          <!-- eye shine -->
          <circle cx="-2.6" cy="-47.6" r="0.5" fill="white" />
          <circle cx="3.8" cy="-47.6" r="0.5" fill="white" />
          <!-- lashes top -->
          <path
            d="M -6 -48.5 C -5 -50 -3 -50 -1 -48.8"
            fill="none"
            stroke="#2A1500"
            stroke-width="0.8"
          />
          <path
            d="M 1 -48.8 C 3 -50 5 -50 6 -48.5"
            fill="none"
            stroke="#2A1500"
            stroke-width="0.8"
          />
          <!-- nose -->
          <path
            d="M -1.2 -44 Q 0 -43 1.2 -44"
            fill="none"
            stroke="#C4A882"
            stroke-width="1"
            stroke-linecap="round"
          />
          <!-- lips -->
          <path d="M -3 -41.5 Q 0 -43 3 -41.5 Q 2 -40 0 -40.2 Q -2 -40 -3 -41.5 Z" fill="#EF476F" />
          <!-- upper lip bow -->
          <path
            d="M -3 -41.5 Q -1.5 -42.5 0 -41.8 Q 1.5 -42.5 3 -41.5"
            fill="none"
            stroke="#C0364E"
            stroke-width="0.5"
          />
          <!-- earings -->
          <circle cx="-8.5" cy="-45" r="1.5" fill="#FFB830" />
          <circle cx="8.5" cy="-45" r="1.5" fill="#FFB830" />
          <!-- left arm waving -->
          <path
            d="M -6 -30 C -10 -32 -15 -36 -18 -40"
            fill="none"
            stroke="#F0EDE6"
            stroke-width="3"
            stroke-linecap="round"
            :class="phase === 'done' ? 'kb-wave-left' : ''"
          />
          <!-- left hand -->
          <circle
            cx="-18"
            cy="-40"
            r="3"
            fill="#F0EDE6"
            :class="phase === 'done' ? 'kb-wave-left' : ''"
          />
          <!-- right arm waving -->
          <path
            d="M 6 -30 C 10 -32 15 -36 18 -40"
            fill="none"
            stroke="#F0EDE6"
            stroke-width="3"
            stroke-linecap="round"
            :class="phase === 'done' ? 'kb-wave-right' : ''"
          />
          <!-- right hand -->
          <circle
            cx="18"
            cy="-40"
            r="3"
            fill="#F0EDE6"
            :class="phase === 'done' ? 'kb-wave-right' : ''"
          />
          <!-- tiara / crown -->
          <path
            d="M -6 -58 L -4 -63 L 0 -60 L 4 -63 L 6 -58"
            fill="none"
            stroke="#FFB830"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
          <circle cx="0" cy="-60" r="1.2" fill="#38BDF8" />
          <circle cx="-4" cy="-63" r="1" fill="#FF6B4A" />
          <circle cx="4" cy="-63" r="1" fill="#FF6B4A" />
          <!-- sparkles around beauty when game done -->
          <template v-if="phase === 'done'">
            <circle
              cx="-24"
              cy="-46"
              r="2"
              fill="#FFB830"
              class="kb-sparkle"
              filter="url(#kb-glow)"
            />
            <circle
              cx="24"
              cy="-42"
              r="2.5"
              fill="#FF6B4A"
              class="kb-sparkle"
              style="animation-delay: 0.2s"
              filter="url(#kb-glow)"
            />
            <circle
              cx="-16"
              cy="-60"
              r="1.8"
              fill="#38BDF8"
              class="kb-sparkle"
              style="animation-delay: 0.4s"
              filter="url(#kb-glow)"
            />
            <circle
              cx="16"
              cy="-60"
              r="2"
              fill="#FFB830"
              class="kb-sparkle"
              style="animation-delay: 0.6s"
              filter="url(#kb-glow)"
            />
            <circle
              cx="0"
              cy="-66"
              r="1.5"
              fill="#EF476F"
              class="kb-sparkle"
              style="animation-delay: 0.15s"
              filter="url(#kb-glow)"
            />
          </template>
        </g>

        <!-- ── Building roof ledge ── -->
        <rect
          :x="BLDG_OFFSET_X - 4"
          :y="BLDG_OFFSET_Y"
          :width="buildingWidth - 32"
          height="6"
          fill="#253549"
          stroke="#38BDF8"
          stroke-width="0.5"
          opacity="0.7"
        />

        <!-- ── Kong characters ── -->
        <g
          v-for="(kong, kongIdx) in kongs"
          :key="kong.id"
          :transform="kongSvgTransform(kong, kongIndexMap[kongIdx]!)"
          :opacity="kongOpacity(kong)"
        >
          <!-- Winner aura glow -->
          <circle
            v-if="kong.state === 'winner'"
            cx="0"
            cy="-4"
            r="28"
            :fill="kong.color"
            opacity="0.15"
            filter="url(#kb-glow-strong)"
          />

          <!-- ── KONG BODY ── -->
          <!-- Shadow/ground contact -->
          <ellipse cx="0" cy="20" rx="12" ry="3" fill="rgba(0,0,0,0.35)" />

          <!-- Tail (stubby) -->
          <path
            d="M 9 14 Q 16 18 14 24"
            fill="none"
            :stroke="kong.color"
            stroke-width="3"
            stroke-linecap="round"
            opacity="0.7"
          />

          <!-- Massive torso — barrel chest -->
          <ellipse
            cx="0"
            cy="4"
            rx="15"
            ry="16"
            :fill="kong.color"
            :stroke="
              kong.state === 'fighting' && kong.fightFlashTimer > 0 ? '#FFB830' : 'rgba(0,0,0,0.5)'
            "
            :stroke-width="kong.state === 'fighting' && kong.fightFlashTimer > 0 ? 2.5 : 1"
            :class="kong.state === 'fighting' ? 'kb-fight-shake' : ''"
          />

          <!-- Chest / belly lighter fur patch -->
          <ellipse cx="0" cy="6" rx="9" ry="11" fill="rgba(255,255,255,0.18)" />
          <!-- Chest muscle definition lines -->
          <path d="M -4 -2 Q 0 1 4 -2" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="1" />
          <path d="M -6 4 Q 0 7 6 4" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="1" />

          <!-- ── HEAD ── -->
          <!-- Sagittal crest (top of skull ridge) -->
          <ellipse
            cx="0"
            cy="-22"
            rx="10"
            ry="6"
            :fill="kong.color"
            stroke="rgba(0,0,0,0.3)"
            stroke-width="1"
          />
          <!-- Main head -->
          <ellipse
            cx="0"
            cy="-17"
            rx="12"
            ry="11"
            :fill="kong.color"
            stroke="rgba(0,0,0,0.3)"
            stroke-width="1"
          />
          <!-- Prominent brow ridge (very flat & protruding) -->
          <path
            d="M -11 -20 Q 0 -25 11 -20"
            fill="none"
            :stroke="kong.color"
            stroke-width="5"
            stroke-linecap="round"
          />
          <path d="M -11 -20 Q 0 -24 11 -20" fill="rgba(0,0,0,0.4)" />
          <!-- cheek bones / jowls -->
          <ellipse cx="-11" cy="-14" rx="4" ry="3.5" :fill="kong.color" opacity="0.85" />
          <ellipse cx="11" cy="-14" rx="4" ry="3.5" :fill="kong.color" opacity="0.85" />

          <!-- ── FACE ── -->
          <!-- Deep-set eyes under brow -->
          <circle cx="-4.5" cy="-20" r="3" fill="rgba(0,0,0,0.5)" />
          <circle cx="4.5" cy="-20" r="3" fill="rgba(0,0,0,0.5)" />
          <circle cx="-4.5" cy="-20" r="2.2" fill="#F0EDE6" />
          <circle cx="4.5" cy="-20" r="2.2" fill="#F0EDE6" />
          <circle
            cx="-4.2"
            cy="-20"
            r="1.4"
            fill="#0A0A0A"
            :class="kong.state === 'fighting' ? 'kb-angry-eyes' : ''"
          />
          <circle
            cx="4.8"
            cy="-20"
            r="1.4"
            fill="#0A0A0A"
            :class="kong.state === 'fighting' ? 'kb-angry-eyes' : ''"
          />
          <!-- Eye shine -->
          <circle cx="-3.6" cy="-20.6" r="0.5" fill="white" opacity="0.9" />
          <circle cx="5.4" cy="-20.6" r="0.5" fill="white" opacity="0.9" />

          <!-- Angry brow V when fighting -->
          <template v-if="kong.state === 'fighting'">
            <path
              d="M -8 -24 L -3 -22"
              stroke="rgba(0,0,0,0.7)"
              stroke-width="1.8"
              stroke-linecap="round"
            />
            <path
              d="M 8 -24 L 3 -22"
              stroke="rgba(0,0,0,0.7)"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </template>

          <!-- Flat broad nose -->
          <ellipse cx="0" cy="-15" rx="4.5" ry="3" fill="rgba(0,0,0,0.35)" />
          <circle cx="-2.5" cy="-14.5" r="1.4" fill="rgba(0,0,0,0.5)" />
          <circle cx="2.5" cy="-14.5" r="1.4" fill="rgba(0,0,0,0.5)" />

          <!-- Mouth / muzzle area -->
          <ellipse cx="0" cy="-11" rx="6" ry="4" fill="rgba(0,0,0,0.2)" />
          <!-- Roar mouth when fighting -->
          <path
            v-if="kong.state === 'fighting'"
            d="M -5 -12 Q 0 -8 5 -12"
            fill="none"
            stroke="#0A0A0A"
            stroke-width="2"
            stroke-linecap="round"
          />
          <!-- Teeth when fighting -->
          <template v-if="kong.state === 'fighting'">
            <rect x="-3" y="-12" width="2.5" height="3" rx="0.5" fill="#F0EDE6" />
            <rect x="0.5" y="-12" width="2.5" height="3" rx="0.5" fill="#F0EDE6" />
          </template>
          <!-- Relaxed smile -->
          <path
            v-if="kong.state !== 'fighting'"
            d="M -4 -11 Q 0 -9 4 -11"
            fill="none"
            stroke="rgba(0,0,0,0.4)"
            stroke-width="1.2"
            stroke-linecap="round"
          />

          <!-- Big ears -->
          <ellipse
            cx="-13"
            cy="-18"
            rx="3.5"
            ry="4"
            :fill="kong.color"
            stroke="rgba(0,0,0,0.3)"
            stroke-width="1"
          />
          <ellipse cx="-13" cy="-18" rx="2" ry="2.5" fill="rgba(0,0,0,0.2)" />
          <ellipse
            cx="13"
            cy="-18"
            rx="3.5"
            ry="4"
            :fill="kong.color"
            stroke="rgba(0,0,0,0.3)"
            stroke-width="1"
          />
          <ellipse cx="13" cy="-18" rx="2" ry="2.5" fill="rgba(0,0,0,0.2)" />

          <!-- ── ARMS ── thick gorilla arms -->
          <!-- Upper left arm -->
          <path
            :d="
              kong.state === 'fighting'
                ? 'M -14 -2 C -20 -6 -24 -12 -22 -18'
                : 'M -14 0 C -20 4 -24 12 -22 18'
            "
            fill="none"
            :stroke="kong.color"
            stroke-width="8"
            stroke-linecap="round"
          />
          <!-- Left forearm -->
          <path
            :d="
              kong.state === 'fighting'
                ? 'M -22 -18 C -26 -22 -28 -20 -27 -16'
                : 'M -22 18 C -26 20 -27 22 -25 24'
            "
            fill="none"
            :stroke="kong.color"
            stroke-width="6"
            stroke-linecap="round"
          />
          <!-- Left hand/knuckles -->
          <ellipse
            :cx="kong.state === 'fighting' ? -27 : -25"
            :cy="kong.state === 'fighting' ? -16 : 24"
            rx="5"
            ry="3.5"
            :fill="kong.color"
            stroke="rgba(0,0,0,0.4)"
            stroke-width="1"
          />
          <!-- knuckle dots left -->
          <circle
            :cx="kong.state === 'fighting' ? -29 : -27"
            :cy="kong.state === 'fighting' ? -16 : 24"
            r="1"
            fill="rgba(0,0,0,0.3)"
          />
          <circle
            :cx="kong.state === 'fighting' ? -27 : -25"
            :cy="kong.state === 'fighting' ? -17.5 : 22.5"
            r="1"
            fill="rgba(0,0,0,0.3)"
          />
          <circle
            :cx="kong.state === 'fighting' ? -25 : -23"
            :cy="kong.state === 'fighting' ? -16 : 24"
            r="1"
            fill="rgba(0,0,0,0.3)"
          />

          <!-- Upper right arm -->
          <path
            :d="
              kong.state === 'fighting'
                ? 'M 14 -2 C 20 -6 24 -12 22 -18'
                : 'M 14 0 C 20 4 24 12 22 18'
            "
            fill="none"
            :stroke="kong.color"
            stroke-width="8"
            stroke-linecap="round"
          />
          <!-- Right forearm -->
          <path
            :d="
              kong.state === 'fighting'
                ? 'M 22 -18 C 26 -22 28 -20 27 -16'
                : 'M 22 18 C 26 20 27 22 25 24'
            "
            fill="none"
            :stroke="kong.color"
            stroke-width="6"
            stroke-linecap="round"
          />
          <!-- Right hand/knuckles -->
          <ellipse
            :cx="kong.state === 'fighting' ? 27 : 25"
            :cy="kong.state === 'fighting' ? -16 : 24"
            rx="5"
            ry="3.5"
            :fill="kong.color"
            stroke="rgba(0,0,0,0.4)"
            stroke-width="1"
          />
          <!-- knuckle dots right -->
          <circle
            :cx="kong.state === 'fighting' ? 25 : 23"
            :cy="kong.state === 'fighting' ? -16 : 24"
            r="1"
            fill="rgba(0,0,0,0.3)"
          />
          <circle
            :cx="kong.state === 'fighting' ? 27 : 25"
            :cy="kong.state === 'fighting' ? -17.5 : 22.5"
            r="1"
            fill="rgba(0,0,0,0.3)"
          />
          <circle
            :cx="kong.state === 'fighting' ? 29 : 27"
            :cy="kong.state === 'fighting' ? -16 : 24"
            r="1"
            fill="rgba(0,0,0,0.3)"
          />

          <!-- ── LEGS (stubby gorilla legs gripping building) ── -->
          <path
            d="M -8 16 C -10 22 -12 24 -10 28"
            fill="none"
            :stroke="kong.color"
            stroke-width="7"
            stroke-linecap="round"
          />
          <ellipse
            cx="-10"
            cy="28"
            rx="5"
            ry="3"
            :fill="kong.color"
            stroke="rgba(0,0,0,0.3)"
            stroke-width="1"
          />
          <path
            d="M 8 16 C 10 22 12 24 10 28"
            fill="none"
            :stroke="kong.color"
            stroke-width="7"
            stroke-linecap="round"
          />
          <ellipse
            cx="10"
            cy="28"
            rx="5"
            ry="3"
            :fill="kong.color"
            stroke="rgba(0,0,0,0.3)"
            stroke-width="1"
          />

          <!-- Name label -->
          <text
            x="0"
            y="40"
            text-anchor="middle"
            dominant-baseline="middle"
            font-family="'Be Vietnam Pro', sans-serif"
            font-size="8"
            font-weight="700"
            :fill="kong.color"
            class="select-none"
          >
            {{ kong.name.length > 7 ? kong.name.slice(0, 6) + '…' : kong.name }}
          </text>

          <!-- HP hearts -->
          <text
            x="0"
            y="51"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="7"
            class="select-none"
          >
            {{ '❤️'.repeat(Math.max(0, kong.hp)) }}
          </text>

          <!-- Crown for winner -->
          <text
            v-if="kong.state === 'winner'"
            x="0"
            y="-34"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="16"
            class="kb-bounce select-none"
          >
            👑
          </text>

          <!-- Chest beat effect when fighting -->
          <g v-if="kong.state === 'fighting' && kong.fightFlashTimer > 0">
            <ellipse
              cx="0"
              cy="2"
              rx="16"
              ry="17"
              fill="none"
              :stroke="kong.color"
              stroke-width="2"
              class="kb-pulse-ring"
              opacity="0.6"
            />
          </g>

          <!-- Fight punch flash sparks -->
          <g v-if="kong.state === 'fighting' && kong.fightFlashTimer > 0">
            <circle cx="24" cy="-18" r="4" fill="#FFB830" class="kb-spark" filter="url(#kb-glow)" />
            <circle
              cx="-24"
              cy="-18"
              r="3"
              fill="#FF6B4A"
              class="kb-spark"
              style="animation-delay: 0.05s"
              filter="url(#kb-glow)"
            />
            <circle
              cx="0"
              cy="-28"
              r="3"
              fill="#F0EDE6"
              class="kb-spark"
              style="animation-delay: 0.1s"
              filter="url(#kb-glow)"
            />
            <!-- BANG text -->
            <text
              x="20"
              y="-25"
              font-size="8"
              font-weight="900"
              fill="#FFB830"
              class="kb-spark"
              font-family="'Anybody', sans-serif"
            >
              POW!
            </text>
          </g>
        </g>

        <!-- Column dividers inside building (visual lane separators) -->
        <line
          v-for="i in Math.max(0, kongs.length - 1)"
          :key="`div-${i}`"
          :x1="BLDG_OFFSET_X + i * BUILDING_W"
          :y1="BLDG_OFFSET_Y"
          :x2="BLDG_OFFSET_X + i * BUILDING_W"
          :y2="BLDG_OFFSET_Y + BUILDING_H"
          stroke="#253549"
          stroke-width="0.75"
          opacity="0.5"
        />

        <!-- Floor number labels on left side (every 4 floors) -->
        <text
          v-for="f in Math.ceil(BUILDING_FLOORS / 4)"
          :key="`lbl-${f}`"
          :x="BLDG_OFFSET_X - 4"
          :y="BLDG_OFFSET_Y + BUILDING_H - (f * 4 - 1) * FLOOR_H"
          text-anchor="end"
          dominant-baseline="middle"
          font-family="'Be Vietnam Pro', sans-serif"
          font-size="7"
          fill="#4A6180"
          class="select-none"
        >
          {{ f * 4 }}F
        </text>
      </svg>
    </div>

    <!-- ── Leader board strip ── -->
    <div class="flex items-center gap-3 border border-border-default bg-bg-surface px-4 py-2.5">
      <span class="font-display text-xs tracking-widest text-text-dim flex-shrink-0">LEADER</span>
      <span class="font-display text-sm font-semibold text-accent-amber truncate">
        {{ phase === 'idle' ? '—' : raceLeader }}
      </span>
      <div class="ml-auto flex items-center gap-2 flex-shrink-0">
        <span
          v-for="kong in kongs"
          :key="kong.id"
          class="inline-block size-3 rounded-full"
          :style="{ backgroundColor: kong.color, opacity: kong.state === 'fallen' ? 0.2 : 1 }"
          :title="kong.name"
        />
      </div>
    </div>

    <!-- ── Event log ── -->
    <div
      ref="logEl"
      class="h-28 overflow-y-auto border border-border-default bg-bg-surface p-3 space-y-1"
    >
      <p v-if="eventLog.length === 0" class="text-xs text-text-dim italic">
        Events will appear here during the race…
      </p>
      <p
        v-for="(msg, i) in eventLog"
        :key="i"
        class="text-xs text-text-secondary"
        :class="i === 0 ? 'text-accent-amber' : ''"
      >
        {{ msg }}
      </p>
    </div>

    <!-- ── Start button ── -->
    <button
      :disabled="phase === 'racing' || names.length < MIN_KONGS"
      class="bg-accent-coral font-display w-full py-4 text-base font-bold tracking-[0.15em] text-bg-deep transition-all hover:bg-accent-amber active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      type="button"
      @click="startRace"
    >
      {{ phase === 'racing' ? 'CLIMBING…' : phase === 'done' ? 'CLIMB AGAIN' : 'START CLIMB' }}
    </button>
  </div>
</template>

<style scoped>
/* Antenna blink */
@keyframes kb-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.1;
  }
}
.kb-blink {
  animation: kb-blink 1.4s ease-in-out infinite;
}

/* Beauty wave arms */
@keyframes kb-wave {
  0%,
  100% {
    transform: rotate(0deg);
    transform-origin: bottom center;
  }
  40% {
    transform: rotate(-20deg);
    transform-origin: bottom center;
  }
}
.kb-wave-left {
  animation: kb-wave 0.8s ease-in-out infinite;
}
.kb-wave-right {
  animation: kb-wave 0.8s ease-in-out infinite reverse;
}

/* Beauty sparkles */
@keyframes kb-sparkle-pulse {
  0%,
  100% {
    opacity: 0.2;
    r: 2;
  }
  50% {
    opacity: 1;
    r: 3.5;
  }
}
.kb-sparkle {
  animation: kb-sparkle-pulse 0.9s ease-in-out infinite;
}

/* Fight shake */
@keyframes kb-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-3px);
  }
  75% {
    transform: translateX(3px);
  }
}
.kb-fight-shake {
  animation: kb-shake 0.15s linear infinite;
}

/* Punch sparks */
@keyframes kb-spark-pop {
  0% {
    opacity: 1;
    transform: scale(0.5);
  }
  60% {
    opacity: 0.8;
    transform: scale(1.8);
  }
  100% {
    opacity: 0;
    transform: scale(0.2);
  }
}
.kb-spark {
  animation: kb-spark-pop 0.3s ease-out forwards;
}

/* Winner crown bounce */
@keyframes kb-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}
.kb-bounce {
  animation: kb-bounce 0.7s ease-in-out infinite;
}

/* Angry eye pulse (red tint not possible in SVG fill via CSS directly, handled in template) */
@keyframes kb-angry {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
}
.kb-angry-eyes {
  animation: kb-angry 0.25s linear infinite;
}

/* Chest beat pulse ring when fighting */
@keyframes kb-pulse-ring {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  70% {
    transform: scale(1.6);
    opacity: 0;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}
.kb-pulse-ring {
  animation: kb-pulse-ring 0.4s ease-out forwards;
  transform-origin: center;
}
</style>
