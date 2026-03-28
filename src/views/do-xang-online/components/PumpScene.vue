<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useId, watch } from 'vue'
import type { DropSeed, FillPhaseCode, VehicleBodyType, VehicleOption } from '../types'
import {
  SESSION_COUPLE_MS,
  SESSION_PREP_MS,
  SESSION_WALK_MS as DEFAULT_SESSION_WALK_MS,
} from '../sessionConstants'
import { previewSrcForBodyType } from '../data/vehicleCatalog'

type FuelPick = {
  label: string
  pricePerLiter: number
}

const props = defineProps<{
  vehicle: VehicleOption
  canPump: boolean
  fuel: FuelPick
  fillingState: 'idle' | 'filling' | 'complete'
  sessionWalkMs?: number
  sessionElapsedMs?: number
  hoseSessionKey: number
  attendantAtVehicle: boolean
  fillPhaseCode: FillPhaseCode
  hoseLinePercent: number
  progressPercent: number
  litersText: string
  totalCostText: string
  stationStateLabel: string
  pulseArmed: boolean
  prefersReducedMotion: boolean
  dropSeeds: DropSeed[]
  isUsingFallback: boolean
  litersOdometerKey: string
  costOdometerKey: string
}>()

const emit = defineEmits<{
  startFill: []
  stopFill: []
  resetFill: []
}>()

const sessionWalkMsResolved = computed(() => props.sessionWalkMs ?? DEFAULT_SESSION_WALK_MS)

const hoseGradId = `hose-grad-${useId()}`
const hoseStrokePaint = computed(() => `url(#${hoseGradId})`)

/** Mỗi lần đổ (`hoseSessionKey`) đổi layout đường ống rõ rệt */
function hoseJitter(id: string, slot: number, span: number, sessionSalt: number): number {
  let h = 2166136261 ^ (sessionSalt * 1103515245)
  h ^= sessionSalt * 2654435769
  h ^= (id.length + slot * 17) * 1597334677
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  h ^= sessionSalt * (slot + 7) * 2246822519
  const t = ((h >>> ((slot * 5) % 20)) & 4095) / 4095
  return t * span
}

type HosePoint = { x: number; y: number }

type HoseGeom = {
  pump: HosePoint
  hand: HosePoint
  c1: HosePoint
  c2: HosePoint
  c3: HosePoint
  c4: HosePoint
  end: HosePoint
}

/** Giữ ống thấp (eo/tay) — tránh vòng Bézier lên vùng như đầu/ngực khi xem overlay */
function clampHoseGeomLow(g: HoseGeom): HoseGeom {
  const { pump, hand, end } = g
  const c1 = {
    x: g.c1.x,
    y: Math.max(g.c1.y, pump.y + 5),
  }
  const c2 = {
    x: g.c2.x,
    y: Math.max(g.c2.y, pump.y + 9, hand.y - 7),
  }
  const mid = Math.min(hand.y, end.y)
  const c3 = {
    x: g.c3.x,
    y: Math.max(g.c3.y, mid + 2),
  }
  const c4 = {
    x: g.c4.x,
    y: Math.max(g.c4.y, end.y - 3),
  }
  return { pump, hand, c1, c2, c3, c4, end }
}

function computeHoseGeom(body: VehicleBodyType, vehicleId: string, sessionSalt: number): HoseGeom {
  const pump = { x: 78, y: 38 }
  const hand = {
    x: 56 + hoseJitter(vehicleId, 8, 12, sessionSalt),
    y: 55 + hoseJitter(vehicleId, 9, 7, sessionSalt),
  }

  const ex0 = body === 'car' ? 24 : 12
  const ex1 = body === 'car' ? 38 : 24
  const ey0 = body === 'car' ? 46 : 58
  const ey1 = body === 'car' ? 56 : 70
  const ex = ex0 + hoseJitter(vehicleId, 1, ex1 - ex0, sessionSalt)
  const ey = ey0 + hoseJitter(vehicleId, 2, ey1 - ey0, sessionSalt)

  const c1x = 73 + hoseJitter(vehicleId, 3, 6, sessionSalt)
  const c1y = 44 + hoseJitter(vehicleId, 4, 6, sessionSalt)
  const c2x = 66 + hoseJitter(vehicleId, 5, 8, sessionSalt)
  const c2y = 51 + hoseJitter(vehicleId, 6, 6, sessionSalt)
  const c3x = 44 + hoseJitter(vehicleId, 12, 10, sessionSalt)
  const c3y = 60 + hoseJitter(vehicleId, 13, 6, sessionSalt)
  const c4x = Math.min(hand.x - 4, ex + (body === 'car' ? 15 : 11))
  const c4y = ey - (body === 'car' ? 3 : 2)

  return clampHoseGeomLow({
    pump,
    hand,
    c1: { x: c1x, y: c1y },
    c2: { x: c2x, y: c2y },
    c3: { x: c3x, y: c3y },
    c4: { x: c4x, y: c4y },
    end: { x: ex, y: ey },
  })
}

function buildHosePathFullFromGeom(g: HoseGeom): string {
  const { pump, hand, c1, c2, c3, c4, end } = g
  return `M ${pump.x} ${pump.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${hand.x} ${hand.y} C ${c3.x} ${c3.y}, ${c4.x} ${c4.y}, ${end.x.toFixed(2)} ${end.y.toFixed(2)}`
}

function smoothstep01(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function buildHosePathProgressive(g: HoseGeom, walkT: number, coupleT: number): string {
  const { pump, hand, c1, c2, c3, c4, end } = g
  const handWalkStart = { x: 77, y: 40 }
  const w = smoothstep01(walkT)
  const handNow = {
    x: lerp(handWalkStart.x, hand.x, w),
    y: lerp(handWalkStart.y, hand.y, w),
  }
  const c1w = {
    x: lerp(pump.x, c1.x, Math.max(0.35, w)),
    y: lerp(pump.y, c1.y, Math.max(0.35, w)),
  }
  const c2w = {
    x: lerp(handWalkStart.x, c2.x, w),
    y: lerp(handWalkStart.y, c2.y, w),
  }

  /* Trước đây dùng w < 0.995 → đổi sớm sang path 2 đoạn, c1/c2 nhảy so với c1w/c2w = “bụp”. Chỉ gắn đoạn couple khi walk thật sự xong (w → 1). */
  if (w < 1 - 1e-5) {
    return `M ${pump.x} ${pump.y} C ${c1w.x} ${c1w.y}, ${c2w.x} ${c2w.y}, ${handNow.x} ${handNow.y}`
  }

  const u = smoothstep01(coupleT)
  const endNow = {
    x: lerp(hand.x, end.x, u),
    y: lerp(hand.y, end.y, u),
  }
  const c3u = {
    x: lerp(hand.x, c3.x, 0.25 + 0.75 * u),
    y: lerp(hand.y, c3.y, 0.25 + 0.75 * u),
  }
  const c4u = {
    x: lerp(c4.x, endNow.x, u),
    y: lerp(c4.y, endNow.y, u),
  }
  return `M ${pump.x} ${pump.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${hand.x} ${hand.y} C ${c3u.x} ${c3u.y}, ${c4u.x} ${c4u.y}, ${endNow.x} ${endNow.y}`
}

const hoseGeometry = computed(() =>
  computeHoseGeom(props.vehicle.bodyType, props.vehicle.id, props.hoseSessionKey),
)

const sessionElapsedResolved = computed(() => props.sessionElapsedMs ?? 0)

/**
 * Chỉ theo đồng hồ session — KHÔNG gating theo fillPhaseCode.
 * Phase được applyFillingTick (80ms) cập nhật chậm hơn sessionElapsedMs (rAF);
 * nếu gating theo phase, walk có đoạn ~0–80ms vẫn prep nhưng elapsed đã > prep → tiến độ kẹt 0.
 */
const walkProgress01 = computed(() => {
  if (props.prefersReducedMotion) return 1
  if (props.fillingState !== 'filling') return 0
  const w = sessionWalkMsResolved.value
  if (w <= 0) return 1
  const t = sessionElapsedResolved.value - SESSION_PREP_MS
  if (t < 0) return 0
  if (t >= w) return 1
  return t / w
})

const coupleProgress01 = computed(() => {
  if (props.prefersReducedMotion) return 1
  if (props.fillingState !== 'filling') return 0
  const walkMs = sessionWalkMsResolved.value
  const t0 = sessionElapsedResolved.value - SESSION_PREP_MS - walkMs
  if (t0 < 0) return 0
  if (SESSION_COUPLE_MS <= 0) return 1
  if (t0 >= SESSION_COUPLE_MS) return 1
  return t0 / SESSION_COUPLE_MS
})

/** Đường ống Bézier dần dần: theo thời gian thật đến hết couple, không theo nhãn phase */
const hosePathProgressiveActive = computed(() => {
  if (props.fillingState !== 'filling') return false
  if (props.prefersReducedMotion) return false
  const e = sessionElapsedResolved.value
  const end = SESSION_PREP_MS + sessionWalkMsResolved.value + SESSION_COUPLE_MS
  return e < end
})

const hosePathD = computed(() => {
  const g = hoseGeometry.value
  if (props.fillingState === 'idle' || props.fillingState === 'complete') {
    return buildHosePathFullFromGeom(g)
  }
  if (props.fillingState === 'filling') {
    if (hosePathProgressiveActive.value) {
      return buildHosePathProgressive(g, walkProgress01.value, coupleProgress01.value)
    }
    return buildHosePathFullFromGeom(g)
  }
  return buildHosePathFullFromGeom(g)
})

const hoseVisualFillPercent = computed(() => {
  if (props.fillingState === 'complete') return 100
  if (props.fillingState !== 'filling') return 0
  if (props.fillPhaseCode === 'prep') return 0
  if (props.fillPhaseCode === 'tank' || props.fillPhaseCode === 'done') return 100
  if (props.fillPhaseCode === 'hose') return props.hoseLinePercent
  /* Một đường 0→100 theo thời gian prep→hết couple — tránh nhảy 100→35 khi w qua 1 */
  if (hosePathProgressiveActive.value) {
    const walkMs = sessionWalkMsResolved.value
    const span = walkMs + SESSION_COUPLE_MS
    if (span <= 0) return 0
    const t = sessionElapsedResolved.value - SESSION_PREP_MS
    return Math.min(100, Math.max(0, (t / span) * 100))
  }
  if (props.fillPhaseCode === 'walk') {
    return Math.min(100, walkProgress01.value * 100)
  }
  if (props.fillPhaseCode === 'couple') {
    return Math.min(100, 35 + coupleProgress01.value * 65)
  }
  return 0
})

const progressHero = computed(() => {
  if (props.fillingState === 'idle') {
    return { mode: 'percent' as const, value: 0, label: 'Tiến độ' }
  }
  if (props.fillingState === 'complete') {
    return { mode: 'percent' as const, value: 100, label: 'Hoàn tất' }
  }
  switch (props.fillPhaseCode) {
    case 'prep':
    case 'walk':
    case 'couple':
      return { mode: 'phase' as const, value: null, label: 'Chuẩn bị' }
    case 'hose':
      return {
        mode: 'percent' as const,
        value: Math.round(props.hoseLinePercent),
        label: 'Ống dẫn',
      }
    case 'tank':
      return {
        mode: 'percent' as const,
        value: Math.round(props.progressPercent),
        label: 'Bình xe',
      }
    case 'done':
      return { mode: 'percent' as const, value: 100, label: 'Hoàn tất' }
    default:
      return { mode: 'percent' as const, value: 0, label: 'Tiến độ' }
  }
})

const progressHeroKey = computed(
  () =>
    `${props.fillPhaseCode}-${progressHero.value.mode}-${progressHero.value.mode === 'percent' ? progressHero.value.value : 'x'}`,
)

const pulseHero = computed(
  () =>
    props.fillingState === 'filling' &&
    props.pulseArmed &&
    (props.fillPhaseCode === 'hose' || props.fillPhaseCode === 'tank'),
)

const hosePathRef = ref<SVGPathElement | null>(null)
const hoseLength = ref(120)

function measureHoseLength() {
  nextTick(() => {
    const el = hosePathRef.value
    if (el && typeof el.getTotalLength === 'function') {
      const len = el.getTotalLength()
      if (len > 0) hoseLength.value = len
    }
  })
}

watch(hosePathD, () => measureHoseLength())

/**
 * 0 = đứng tại trụ, 1 = đã tới xe — khớp tiến độ walk (cùng nguồn với ống kéo).
 * Không dùng transition CSS một lần (dễ lệch với lớp ống chỉ Transition ~0.4s).
 */
/** Cùng walkProgress01 (thời gian thật); prep = elapsed < SESSION_PREP_MS → walkProgress 0 */
const attendantWalkBlend01 = computed(() => {
  if (props.prefersReducedMotion) {
    if (props.fillingState === 'idle') return 0
    if (props.fillingState === 'complete') return 1
    if (props.fillPhaseCode === 'prep') return 0
    return 1
  }
  if (props.fillingState === 'idle') return 0
  if (props.fillingState === 'complete') return 1
  return walkProgress01.value
})

/**
 * Chuỗi trong prep: trụ bơm trước → nhân viên sau (theo sessionElapsed), không bật hết một lượt.
 */
const prepSceneReveal = computed(() => {
  if (props.prefersReducedMotion) return { pump: 1, attendant: 1 }
  if (props.fillingState !== 'filling') return { pump: 1, attendant: 1 }
  if (props.fillPhaseCode !== 'prep') return { pump: 1, attendant: 1 }
  const e = sessionElapsedResolved.value
  return {
    pump: smoothstep01(Math.max(0, e - 40) / 260),
    attendant: smoothstep01(Math.max(0, e - 180) / 300),
  }
})

/**
 * Dịch ngang responsive giống cũ (clamp -180px / -42vw / -96px), không cần đo viewport JS.
 * Dùng calc(blend * clamp(...)) để khớp mọi breakpoint.
 */
const attendantOuterStyle = computed(() => {
  const b = attendantWalkBlend01.value
  const r = prepSceneReveal.value.attendant
  const ty = (1 - r) * 12
  return {
    opacity: r,
    transform: `translate3d(calc(${b} * clamp(-180px, -42vw, -96px)), ${ty}px, 0)`,
  }
})

const pumpIslandSceneStyle = computed((): Record<string, string | number> => {
  const p = prepSceneReveal.value.pump
  const y = (1 - p) * 14
  return {
    opacity: p,
    transform: `translateY(${y}px)`,
  }
})

/** Lớp ống: fade-in ngay sau mốc walk — không phụ thuộc showHoseInScene (khai báo sau file) */
const hoseLayerWrapStyle = computed((): Record<string, string | number> => {
  if (props.fillingState === 'complete') return { opacity: 1 }
  if (props.fillingState !== 'filling') return { opacity: 0 }
  if (props.prefersReducedMotion) {
    return props.fillPhaseCode === 'prep' ? { opacity: 0 } : { opacity: 1 }
  }
  const e = sessionElapsedResolved.value
  if (e < SESSION_PREP_MS) return { opacity: 0 }
  return { opacity: smoothstep01(Math.max(0, e - SESSION_PREP_MS) / 320) }
})

/**
 * Trượt phải→trái liên tục: hết walk còn 16px rồi couple kéo về 0 — không nhảy 0↔16 tại w=1.
 * slide = 64*(1-w) + 16*w*(1-c)
 */
const hoseLayerMotionStyle = computed((): Record<string, string> => {
  if (props.prefersReducedMotion) return {}
  if (props.fillingState === 'complete') return { transform: 'translate3d(0, 0, 0)' }
  if (props.fillingState !== 'filling') return {}
  if (!hosePathProgressiveActive.value) return { transform: 'translate3d(0, 0, 0)' }
  const w = walkProgress01.value
  const c = coupleProgress01.value
  const px = 64 * (1 - w) + 16 * w * (1 - c)
  return { transform: `translate3d(${px}px, 0, 0)` }
})

/** Nhịp nhân viên theo pha — tránh một animation cho mọi trạng thái */
const attendantInnerMotionClass = computed(() => {
  if (props.prefersReducedMotion || props.fillingState !== 'filling') return ''
  switch (props.fillPhaseCode) {
    case 'prep':
      return 'attendantInner--prep'
    case 'walk':
      return 'attendantInner--walk'
    case 'couple':
      return 'attendantInner--couple'
    case 'hose':
    case 'tank':
      return 'attendantInner--vehicle'
    default:
      return ''
  }
})

const hoseStrokeMotionClass = computed(() => {
  if (props.prefersReducedMotion) return ''
  if (props.fillPhaseCode === 'hose' && props.hoseLinePercent > 4) {
    return 'hoseStroke--streaming'
  }
  return ''
})

const hoseColoredPathStyle = computed(() => {
  const len = hoseLength.value
  const p = Math.max(0, Math.min(100, hoseVisualFillPercent.value))
  const dashOff = len * (1 - p / 100)
  const stream =
    !props.prefersReducedMotion && props.fillPhaseCode === 'hose' && props.hoseLinePercent > 4
  const style: Record<string, string | number> = {
    strokeDasharray: len,
    strokeDashoffset: dashOff,
    opacity: p > 0.08 ? 1 : 0,
  }
  if (!stream) {
    if (props.fillPhaseCode === 'tank' && p > 95) {
      style.filter = 'drop-shadow(0 0 10px rgba(56,189,248,0.45))'
    } else if (p > 2) {
      style.filter = 'drop-shadow(0 0 7px rgba(255,184,48,0.6))'
    } else {
      style.filter = 'none'
    }
  }
  return style
})

const attendantWalking = computed(
  () =>
    props.fillingState === 'filling' && !props.attendantAtVehicle && !props.prefersReducedMotion,
)

/** Theo thời gian — tránh v-if chờ phase 80ms rồi ống “bụp” xuất hiện */
const showHoseInScene = computed(() => {
  if (props.fillingState === 'complete') return true
  if (props.fillingState !== 'filling') return false
  if (props.prefersReducedMotion) return props.fillPhaseCode !== 'prep'
  return sessionElapsedResolved.value >= SESSION_PREP_MS
})

const showAttendantGrayCoil = computed(
  () =>
    props.fillingState === 'idle' ||
    props.fillingState === 'complete' ||
    props.fillPhaseCode === 'prep',
)

watch(showHoseInScene, (show) => {
  if (show) measureHoseLength()
})

const spiralMeterPercent = computed(() => {
  if (props.fillingState === 'idle') return 0
  if (props.fillingState === 'complete') return 100
  switch (props.fillPhaseCode) {
    case 'prep':
    case 'walk':
    case 'couple':
      return 0
    case 'hose':
      return props.hoseLinePercent
    case 'tank':
      return props.progressPercent
    case 'done':
      return 100
    default:
      return 0
  }
})

function buildSpiralPath(cx: number, cy: number, turns: number, maxR: number): string {
  const steps = 96
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * turns * 2 * Math.PI
    const r = (maxR * i) / steps
    const x = cx + r * Math.cos(t)
    const y = cy + r * Math.sin(t)
    d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2) + ' '
  }
  return d.trim()
}

const spiralPathD = buildSpiralPath(24, 24, 2.4, 14)
const spiralPathRef = ref<SVGPathElement | null>(null)
const spiralLength = ref(180)

function measureSpiral() {
  nextTick(() => {
    const el = spiralPathRef.value
    if (el && typeof el.getTotalLength === 'function') {
      const len = el.getTotalLength()
      if (len > 0) spiralLength.value = len
    }
  })
}

watch(
  () => props.fillingState,
  (s) => {
    if (s === 'filling' || s === 'complete') measureSpiral()
  },
)

const spiralDashOffset = computed(() => {
  const len = spiralLength.value
  const p = Math.max(0, Math.min(100, spiralMeterPercent.value)) / 100
  return len * (1 - p)
})

const isCar = computed(() => props.vehicle.bodyType === 'car')
/** Luôn theo `bodyType` — khớp picker, tránh lệch ảnh */
const vehicleImageSrc = computed(() => previewSrcForBodyType(props.vehicle.bodyType))

onMounted(() => {
  measureHoseLength()
  measureSpiral()
})
</script>

<template>
  <section class="relative" aria-labelledby="pump-heading">
    <h2 id="pump-heading" class="sr-only">Khu vực trụ bơm</h2>

    <div class="relative border border-border-default bg-bg-surface overflow-hidden">
      <div class="pointer-events-none absolute inset-0 opacity-90" aria-hidden="true">
        <div
          class="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-20%,rgba(255,107,74,0.14),transparent_55%),radial-gradient(ellipse_70%_45%_at_100%_0%,rgba(56,189,248,0.08),transparent_50%)]"
        />
        <div
          class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border-default to-transparent"
        />
      </div>

      <div
        class="relative z-10 flex flex-col lg:flex-row gap-0 lg:min-h-[280px] xl:min-h-[320px] min-h-0"
      >
        <div
          class="lg:w-[38%] border-b border-border-default lg:border-b-0 lg:border-r border-border-default p-4 sm:p-5 flex flex-col justify-between gap-4 sm:gap-6 bg-bg-deep/30 shrink-0"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div class="min-w-0">
              <div class="font-display text-xs tracking-widest text-accent-coral">
                {{ progressHero.label }}
              </div>
              <div
                v-if="progressHero.mode === 'phase'"
                :key="progressHeroKey"
                class="mt-1 font-display text-3xl sm:text-4xl font-bold text-text-secondary tabular-nums leading-none"
                aria-hidden="true"
              >
                …
              </div>
              <div
                v-else
                :key="progressHeroKey"
                class="odometerNumber mt-1 font-display text-3xl min-[400px]:text-4xl lg:text-5xl font-bold text-text-primary tabular-nums leading-none"
                :class="pulseHero ? 'progressPulse' : ''"
              >
                {{ progressHero.value
                }}<span class="text-lg min-[400px]:text-xl sm:text-2xl text-text-secondary">%</span>
              </div>
            </div>
            <div class="text-left sm:text-right sm:max-w-[min(100%,12rem)] sm:shrink-0">
              <div class="font-display text-xs text-text-dim tracking-widest">Trạng thái</div>
              <div class="font-display text-sm text-text-secondary mt-1 leading-snug break-words">
                {{ stationStateLabel }}
              </div>
            </div>
          </div>

          <div class="space-y-3 border border-border-default bg-bg-elevated/80 p-3 sm:p-4">
            <div class="flex items-center justify-between gap-2 sm:gap-3 text-sm min-w-0">
              <span class="text-text-dim shrink-0">Lít</span>
              <span
                :key="litersOdometerKey"
                class="odometerNumber font-display font-bold text-accent-sky tabular-nums text-base sm:text-lg text-right truncate"
              >
                {{ litersText }} L
              </span>
            </div>
            <div class="flex items-center justify-between gap-2 sm:gap-3 text-sm min-w-0">
              <span class="text-text-dim shrink-0">Tạm tính</span>
              <span
                :key="costOdometerKey"
                class="odometerNumber font-display font-bold text-accent-amber tabular-nums text-base sm:text-lg text-right truncate"
              >
                {{ totalCostText }}
              </span>
            </div>
          </div>

          <p class="text-xs text-text-secondary leading-relaxed">
            <span class="text-accent-amber font-display font-semibold">Lưu ý:</span>
            Web giải trí — xăng thật vẫn phải ra trạm.
          </p>
        </div>

        <div class="flex-1 min-h-0 p-3 sm:p-4 md:p-5 flex flex-col">
          <div
            class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3 mb-3 min-w-0"
          >
            <div class="font-display text-sm tracking-widest text-accent-amber min-w-0">
              <span class="block truncate">{{ vehicle.name }}</span>
              <span v-if="canPump" class="text-text-dim text-xs block sm:inline"
                >· {{ isCar ? 'minh họa ô tô' : 'minh họa xe máy' }} · bình
                {{ vehicle.capacityLiters }}L</span
              >
              <span v-else class="text-accent-amber text-xs block sm:inline"
                >· chọn đủ phiên bản xe</span
              >
            </div>
            <div
              class="font-display text-xs text-text-dim sm:text-right sm:max-w-[40%] sm:shrink-0 leading-snug"
            >
              {{ fuel.label }}
            </div>
          </div>

          <div
            class="pumpSceneStage relative flex-1 min-h-[240px] min-[400px]:min-h-[280px] sm:min-h-[300px] md:min-h-[320px] bg-bg-deep/60 border border-border-default overflow-hidden transition-[min-height] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[min-height]"
            :data-body="vehicle.bodyType"
          >
            <div
              class="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-bg-elevated/80 via-bg-elevated/40 to-transparent border-t border-border-default transition-opacity duration-300"
              aria-hidden="true"
            />
            <div
              class="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border-default to-transparent opacity-70"
              aria-hidden="true"
            />

            <div
              class="vehicleSlot absolute bottom-6 origin-bottom transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform z-[3]"
              :class="
                isCar
                  ? 'left-[1%] sm:left-[2%] w-[58%] max-w-[320px] min-h-[100px] sm:min-h-[120px] scale-[0.92] sm:scale-100'
                  : 'left-[2%] sm:left-[4%] w-[46%] max-w-[240px] min-h-[88px] sm:min-h-[104px] scale-95 sm:scale-100'
              "
            >
              <img
                :key="`${vehicle.id}-${vehicle.bodyType}-${vehicleImageSrc}`"
                :src="vehicleImageSrc"
                :alt="`Minh họa ${isCar ? 'ô tô' : 'xe máy'} ${vehicle.modelLine}, đời ${vehicle.yearLabel}`"
                class="w-full h-auto min-h-[5rem] object-contain select-none pointer-events-none drop-shadow-[0_14px_36px_rgba(0,0,0,0.5)] transition-opacity duration-300"
                :class="canPump ? 'opacity-100' : 'opacity-40'"
                :width="isCar ? 360 : 260"
                :height="isCar ? 160 : 120"
                :loading="canPump ? 'eager' : 'lazy'"
                decoding="async"
              />
            </div>

            <div
              class="attendantOuter sceneSeqLayer absolute z-[4] bottom-5 right-[14%] sm:right-[16%] will-change-transform pointer-events-none"
              :style="attendantOuterStyle"
              aria-hidden="true"
            >
              <div class="attendantInner origin-bottom" :class="attendantInnerMotionClass">
                <svg
                  class="block text-text-primary overflow-visible"
                  width="64"
                  height="76"
                  viewBox="0 0 64 76"
                  aria-hidden="true"
                >
                  <path
                    v-if="showAttendantGrayCoil"
                    d="M56 46 C52 45 48 44 42 44 C36 44 30 44 24 45"
                    stroke="rgba(56,56,56,.55)"
                    stroke-width="4"
                    fill="none"
                    stroke-linecap="round"
                  />
                  <ellipse cx="32" cy="18" rx="11" ry="11" fill="#253549" />
                  <ellipse
                    cx="32"
                    cy="14"
                    rx="12"
                    ry="5"
                    fill="#162232"
                    stroke="rgba(255,184,48,.35)"
                    stroke-width="0.75"
                  />
                  <rect x="21" y="26" width="22" height="24" fill="#FFB830" opacity=".92" />
                  <rect x="25" y="30" width="14" height="16" fill="#FF6B4A" opacity=".88" />
                  <rect
                    x="23"
                    y="33"
                    width="18"
                    height="2.2"
                    fill="rgba(232,244,255,.92)"
                    opacity=".95"
                  />
                  <rect
                    x="23"
                    y="39"
                    width="18"
                    height="1.8"
                    fill="rgba(232,244,255,.55)"
                    opacity=".9"
                  />
                  <path
                    stroke="currentColor"
                    stroke-opacity=".25"
                    stroke-width="1"
                    d="M16 32h7M41 32h7"
                  />
                  <rect x="23" y="50" width="7" height="21" fill="#253549" />
                  <rect x="34" y="50" width="7" height="21" fill="#253549" />
                  <path
                    d="M22 44 C17 46 14 48 10 50"
                    stroke="rgba(255,184,48,.88)"
                    stroke-width="3.2"
                    fill="none"
                    stroke-linecap="round"
                  />
                  <path
                    v-if="attendantWalking"
                    d="M10 50 C2 47.8 -5 45.5 -13 43"
                    stroke="rgba(255,184,48,.82)"
                    stroke-width="2.9"
                    fill="none"
                    stroke-linecap="round"
                  />
                  <circle
                    cx="10"
                    cy="50"
                    r="4.2"
                    fill="#162232"
                    stroke="rgba(255,184,48,.85)"
                    stroke-width="1.2"
                  />
                </svg>
              </div>
            </div>

            <div
              v-if="showHoseInScene"
              key="hose-layer"
              class="hoseSceneLayer sceneSeqLayer absolute inset-0 z-[1] pointer-events-none flex items-center justify-center"
              :style="hoseLayerWrapStyle"
            >
              <div
                class="hoseSceneMotion flex h-full w-full items-center justify-center will-change-transform"
                :style="hoseLayerMotionStyle"
              >
                <svg
                  class="max-h-full max-w-full h-full w-auto aspect-square shrink-0"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="xMidYMid meet"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient :id="hoseGradId" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stop-color="#FFB830" />
                      <stop offset="55%" stop-color="#FF6B4A" />
                      <stop offset="100%" stop-color="#38BDF8" />
                    </linearGradient>
                  </defs>
                  <path
                    :d="hosePathD"
                    fill="none"
                    stroke="rgba(255,255,255,0.14)"
                    stroke-width="1.35"
                    stroke-linecap="round"
                  />
                  <path
                    ref="hosePathRef"
                    :d="hosePathD"
                    fill="none"
                    :stroke="hoseStrokePaint"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    :class="[
                      'hoseGlow',
                      'hoseFlowDash',
                      'transition-[stroke-opacity]',
                      'duration-300',
                      hoseStrokeMotionClass,
                    ]"
                    :style="hoseColoredPathStyle"
                  />
                  <circle
                    cx="78"
                    cy="38"
                    r="1.8"
                    fill="#162232"
                    stroke="rgba(255,255,255,0.15)"
                    stroke-width="0.35"
                    :class="
                      fillingState === 'filling' && hoseVisualFillPercent > 3
                        ? 'hoseNozzleDot--live'
                        : ''
                    "
                  />
                </svg>
              </div>
            </div>

            <div
              class="pumpIsland sceneSeqLayer absolute right-[5%] sm:right-[7%] bottom-6 w-[32%] max-w-[158px] z-[5] transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform"
              :style="pumpIslandSceneStyle"
              :class="
                fillingState === 'filling' && pulseArmed && hoseLinePercent >= 99.5
                  ? 'pumpVibrate'
                  : ''
              "
            >
              <div
                class="relative mx-auto w-[72%] min-h-[158px] h-auto pb-2 border border-border-default bg-gradient-to-b from-bg-elevated to-bg-surface shadow-[0_16px_0_rgba(0,0,0,0.25)]"
              >
                <div
                  class="absolute inset-x-2 top-2 h-12 border border-border-default bg-bg-deep/80 flex items-center justify-center overflow-hidden"
                >
                  <svg class="spiralFace" width="76" height="44" viewBox="0 0 48 48">
                    <defs>
                      <linearGradient id="pumpSpiralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#FFB830" />
                        <stop offset="55%" stop-color="#FF6B4A" />
                        <stop offset="100%" stop-color="#38BDF8" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      stroke-width="1"
                    />
                    <path
                      ref="spiralPathRef"
                      :d="spiralPathD"
                      fill="none"
                      stroke="rgba(255,184,48,0.22)"
                      stroke-width="1.4"
                      stroke-linecap="round"
                    />
                    <path
                      :d="spiralPathD"
                      fill="none"
                      stroke="url(#pumpSpiralGrad)"
                      stroke-width="1.75"
                      stroke-linecap="round"
                      :style="{
                        strokeDasharray: spiralLength,
                        strokeDashoffset: spiralDashOffset,
                        opacity: spiralMeterPercent > 0.5 ? 0.95 : 0,
                      }"
                    />
                  </svg>
                </div>
                <div
                  class="absolute left-1/2 top-16 -translate-x-1/2 w-14 h-20 border border-border-default bg-bg-surface"
                >
                  <div
                    class="absolute left-1/2 top-2 -translate-x-1/2 w-8 h-12 border border-border-default bg-bg-elevated flex items-start justify-center pt-1"
                  >
                    <div
                      class="w-6 h-7 border border-border-default bg-accent-coral/15"
                      :class="
                        fillingState === 'filling' && pulseArmed && hoseLinePercent >= 99.5
                          ? 'nozzleGlow'
                          : ''
                      "
                    />
                  </div>
                  <div
                    v-if="
                      fillingState === 'filling' &&
                      pulseArmed &&
                      hoseLinePercent >= 99.5 &&
                      !prefersReducedMotion
                    "
                    class="nozzleStream nozzleStream--scene"
                  />
                </div>
                <div
                  class="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-3 bg-bg-elevated border border-t border-border-default"
                />
              </div>
              <template
                v-if="
                  fillingState === 'filling' && hoseLinePercent >= 99.5 && !prefersReducedMotion
                "
              >
                <div
                  v-for="d in dropSeeds"
                  :key="d.key"
                  class="drop drop--scene"
                  :style="{
                    left: `${d.left}%`,
                    animationDelay: `${d.delay}s`,
                    animationDuration: `${d.duration}s`,
                  }"
                />
              </template>
            </div>

            <div
              class="absolute left-2 top-2 sm:left-3 text-[10px] sm:text-[11px] font-display tracking-widest text-text-dim max-w-[min(52%,11rem)] sm:max-w-[45%] z-[6] pointer-events-none leading-tight"
            >
              {{ fuel.label }}
            </div>
          </div>

          <div
            class="mt-3 sm:mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="flex flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <button
                v-if="fillingState === 'idle'"
                type="button"
                class="min-h-11 min-w-0 flex-1 sm:flex-initial sm:min-w-[7.5rem] bg-accent-coral text-bg-deep font-display font-bold px-4 sm:px-5 py-2.5 transition-colors hover:bg-accent-amber active:scale-[0.98] cursor-pointer touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-accent-coral"
                :disabled="!canPump"
                @click="emit('startFill')"
              >
                Bắt đầu đổ
              </button>
              <button
                v-if="fillingState === 'filling'"
                type="button"
                class="min-h-11 min-w-0 flex-1 sm:flex-initial sm:min-w-[7.5rem] bg-accent-amber text-bg-deep font-display font-bold px-4 sm:px-5 py-2.5 transition-colors hover:bg-accent-coral active:scale-[0.98] cursor-pointer touch-manipulation"
                @click="emit('stopFill')"
              >
                Dừng
              </button>
              <button
                type="button"
                class="min-h-11 min-w-0 flex-1 sm:flex-initial sm:min-w-[7.5rem] border border-border-default bg-bg-surface text-text-primary font-display font-bold px-4 sm:px-5 py-2.5 transition-colors hover:border-accent-coral hover:bg-bg-elevated active:scale-[0.98] cursor-pointer touch-manipulation"
                @click="emit('resetFill')"
              >
                Reset
              </button>
            </div>
            <div class="text-text-dim text-sm sm:text-right w-full sm:w-auto pt-0.5 sm:pt-0">
              <span class="text-text-dim">Giá áp dụng:</span>
              <span class="text-accent-amber font-display font-bold tabular-nums">
                {{ fuel.pricePerLiter.toLocaleString('vi-VN') }}đ </span
              >/L
              <span v-if="isUsingFallback" class="block text-xs text-text-dim mt-0.5">Giá mẫu</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pumpIsland {
  transform-origin: bottom center;
}

.attendantOuter {
  transform-origin: bottom center;
}

.attendantInner {
  transform-origin: bottom center;
}

/* Chuỗi xuất hiện prep / fade ống — opacity + transform mượt */
.sceneSeqLayer {
  transition:
    opacity 380ms ease-out,
    transform 450ms cubic-bezier(0.33, 1, 0.55, 1);
}

/* Nhân viên: một pha — một nhịp (transform-only) */
.attendantInner--prep {
  animation: attendantPrepBreath 2.6s ease-in-out infinite;
}

@keyframes attendantPrepBreath {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-2px) scale(1.01);
  }
}

.attendantInner--walk {
  animation: attendantWalkStep 1.08s ease-in-out infinite;
}

@keyframes attendantWalkStep {
  0%,
  100% {
    transform: translateY(0) translateX(0) rotate(0deg);
  }
  25% {
    transform: translateY(-2.5px) translateX(-3px) rotate(-0.65deg);
  }
  50% {
    transform: translateY(-1px) translateX(-1.5px) rotate(0.3deg);
  }
  75% {
    transform: translateY(-3px) translateX(-4px) rotate(-0.45deg);
  }
}

.attendantInner--couple {
  animation: attendantCoupleLean 1.2s ease-in-out infinite alternate;
}

@keyframes attendantCoupleLean {
  0% {
    transform: translateX(0) rotate(0deg);
  }
  100% {
    transform: translateX(-3px) rotate(-1.8deg);
  }
}

.attendantInner--vehicle {
  animation: attendantVehicleIdle 3.2s ease-in-out infinite;
}

@keyframes attendantVehicleIdle {
  0%,
  100% {
    transform: translateY(0) translateX(0);
  }
  50% {
    transform: translateY(-1.5px) translateX(-1px);
  }
}

/* Lớp ống: transform do hoseLayerMotionStyle (đồng bộ walk/couple), không Transition ngắn */
.hoseSceneLayer {
  backface-visibility: hidden;
}

.hoseSceneMotion {
  transform-origin: right center;
}

.hoseFlowDash {
  transition: stroke-dashoffset 0.55s ease-out;
}

.hoseStroke--streaming {
  animation: hoseStreamGlow 1.75s ease-in-out infinite;
}

@keyframes hoseStreamGlow {
  0%,
  100% {
    filter: drop-shadow(0 0 6px rgba(255, 184, 48, 0.55));
  }
  50% {
    filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.42));
  }
}

.drop {
  position: absolute;
  top: 58px;
  width: 8px;
  height: 10px;
  background: rgba(255, 184, 48, 0.95);
  border: 1px solid rgba(255, 184, 48, 0.8);
  border-radius: 2px;
  transform: translateY(-10px);
  opacity: 0;
  animation-name: fuelDrop;
  animation-timing-function: ease-in;
  animation-iteration-count: infinite;
  will-change: transform, opacity;
}

.drop--scene {
  left: 50%;
  margin-left: -4px;
  top: 48px;
}

.hoseNozzleDot--live {
  filter: drop-shadow(0 0 7px rgba(255, 184, 48, 0.75));
}

.spiralFace {
  display: block;
}

@keyframes fuelDrop {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  12% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(92px);
  }
}

.nozzleGlow {
  animation: nozzleGlow 0.7s ease-in-out infinite;
}

@keyframes nozzleGlow {
  0% {
    box-shadow: 0 0 0 rgba(255, 107, 74, 0);
  }
  50% {
    box-shadow: 0 0 22px rgba(255, 107, 74, 0.55);
  }
  100% {
    box-shadow: 0 0 0 rgba(255, 107, 74, 0);
  }
}

.pumpVibrate {
  animation: pumpVibrate 0.25s ease-in-out infinite;
  transform-origin: center;
}

@keyframes pumpVibrate {
  0% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-1.5px);
  }
  100% {
    transform: translateX(0);
  }
}

.nozzleStream {
  position: absolute;
  left: 50%;
  top: 10px;
  width: 2px;
  height: 70px;
  transform: translateX(-50%);
  background: linear-gradient(to bottom, rgba(255, 107, 74, 0.85), rgba(56, 189, 248, 0.35));
  border-radius: 2px;
  opacity: 0.95;
  filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.25));
  animation: nozzleStreamFlow 0.18s ease-in-out infinite;
  will-change: transform, opacity;
}

.nozzleStream--scene {
  top: 22px;
  height: 52px;
}

@keyframes nozzleStreamFlow {
  0%,
  100% {
    transform: translateX(-50%) scaleY(1);
  }
  50% {
    transform: translateX(-50%) scaleY(0.85);
    opacity: 0.7;
  }
}

.odometerNumber {
  display: inline-block;
  animation: odometerFlip 0.28s ease-out;
}

@keyframes odometerFlip {
  0% {
    transform: translateY(6px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

.progressPulse {
  animation: progressPulse 0.9s ease-in-out infinite;
  transform-origin: center;
}

@keyframes progressPulse {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-2px) scale(1.03);
  }
}

@media (prefers-reduced-motion: reduce) {
  .progressPulse,
  .pumpVibrate,
  .nozzleStream,
  .odometerNumber,
  .attendantInner--prep,
  .attendantInner--walk,
  .attendantInner--couple,
  .attendantInner--vehicle,
  .hoseStroke--streaming {
    animation: none !important;
  }

  .sceneSeqLayer {
    transition: none !important;
  }

  .pumpSceneStage,
  .vehicleSlot,
  .pumpIsland,
  .attendantOuter {
    transition: none !important;
  }

  .hoseFlowDash {
    transition: none !important;
  }
}
</style>
