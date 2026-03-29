<script setup lang="ts">
import { computed, nextTick, onMounted, ref, unref, useId, watch } from 'vue'
import type { DropSeed, FillPhaseCode, VehicleOption } from '../types'
import {
  SESSION_COUPLE_MS,
  SESSION_PREP_MS,
  SESSION_WALK_MS as DEFAULT_SESSION_WALK_MS,
} from '../sessionConstants'
import {
  buildHosePathFullFromGeom,
  buildHosePathProgressive,
  computeHoseGeom,
  smoothstep01,
} from '../utils/hose'
import { previewSrcForBodyType } from '../data/vehicleCatalog'
import FuelAttendant from './FuelAttendant.vue'
import CarView from './CarView.vue'
import FuelHose from './FuelHose.vue'
import FuelPump from './FuelPump.vue'
import ParkButton from './ParkButton.vue'
import RefuelButton from './RefuelButton.vue'
import RefuelProgress from './RefuelProgress.vue'
import StationButton from './ui/StationButton.vue'

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
  isParked: boolean
  isParking: boolean
  parkingProgress01: number
}>()

const emit = defineEmits<{
  park: []
  startRefuel: []
  stopFill: []
  resetFill: []
}>()

const sessionWalkMsResolved = computed(() => props.sessionWalkMs ?? DEFAULT_SESSION_WALK_MS)

const hoseGradId = `hose-grad-${useId()}`
const hoseStrokePaint = computed(() => `url(#${hoseGradId})`)

const hoseGeometry = computed(() =>
  computeHoseGeom(props.vehicle.bodyType, props.vehicle.id, props.hoseSessionKey),
)

const sessionElapsedResolved = computed(() => props.sessionElapsedMs ?? 0)

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
    if (!props.isParked) {
      return { mode: 'phase' as const, value: null, label: 'Tiến độ' }
    }
    return { mode: 'percent' as const, value: 0, label: 'Bình xe' }
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
    `${props.fillPhaseCode}-${progressHero.value.mode}-${progressHero.value.mode === 'percent' ? progressHero.value.value : 'x'}-${props.isParked}`,
)

const pulseHero = computed(
  () =>
    props.fillingState === 'filling' &&
    props.pulseArmed &&
    (props.fillPhaseCode === 'hose' || props.fillPhaseCode === 'tank'),
)

const hoseLength = ref(120)
const fuelHoseRef = ref<InstanceType<typeof FuelHose> | null>(null)

function measureHoseLength() {
  nextTick(() => {
    const inst = fuelHoseRef.value
    const el = inst && unref(inst.pathRef)
    if (el && typeof el.getTotalLength === 'function') {
      const len = el.getTotalLength()
      if (len > 0) hoseLength.value = len
    }
  })
}

watch(hosePathD, () => measureHoseLength())

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
const fuelPumpRef = ref<InstanceType<typeof FuelPump> | null>(null)
const spiralLength = ref(180)

function measureSpiral() {
  nextTick(() => {
    const inst = fuelPumpRef.value
    const el = inst && unref(inst.spiralPathRef)
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
const vehicleImageSrc = computed(() => previewSrcForBodyType(props.vehicle.bodyType))

const pumpVibrate = computed(
  () => props.fillingState === 'filling' && props.pulseArmed && props.hoseLinePercent >= 99.5,
)

const nozzleGlow = computed(
  () => props.fillingState === 'filling' && props.pulseArmed && props.hoseLinePercent >= 99.5,
)

const showNozzleStream = computed(
  () =>
    props.fillingState === 'filling' &&
    props.pulseArmed &&
    props.hoseLinePercent >= 99.5 &&
    !props.prefersReducedMotion,
)

const showDrops = computed(
  () =>
    props.fillingState === 'filling' &&
    props.hoseLinePercent >= 99.5 &&
    !props.prefersReducedMotion,
)

const refuelHelper = computed(() => {
  if (props.fillingState !== 'idle') return undefined
  if (!props.canPump) return undefined
  if (!props.isParked && !props.isParking) {
    return 'Bấm «Đậu xe» để vào vị trí đổ, rồi chọn «Đổ xăng».'
  }
  return undefined
})

const showTankBar = computed(
  () =>
    props.fillingState === 'filling' &&
    (props.fillPhaseCode === 'tank' || props.fillPhaseCode === 'hose'),
)

const tankBarId = `tank-bar-${useId()}`

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
        <RefuelProgress
          :progress-hero-label="progressHero.label"
          :progress-hero-mode="progressHero.mode"
          :progress-hero-value="progressHero.mode === 'percent' ? progressHero.value : null"
          :progress-hero-key="progressHeroKey"
          :pulse-hero="pulseHero"
          :station-state-label="stationStateLabel"
          :status-helper="refuelHelper"
          :liters-text="litersText"
          :total-cost-text="totalCostText"
          :liters-odometer-key="litersOdometerKey"
          :cost-odometer-key="costOdometerKey"
          :show-tank-bar="showTankBar"
          :tank-bar-percent="progressPercent"
          :tank-bar-id="tankBarId"
        />

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
            class="pumpSceneStage relative flex-1 min-h-[240px] min-[400px]:min-h-[280px] sm:min-h-[300px] md:min-h-[320px] max-[359px]:scale-[0.92] max-[359px]:origin-top bg-bg-deep/60 border border-border-default overflow-hidden transition-[min-height] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[min-height]"
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

            <CarView
              :vehicle="vehicle"
              :can-pump="canPump"
              :vehicle-image-src="vehicleImageSrc"
              :is-car="isCar"
              :parking-progress01="parkingProgress01"
              :prefers-reduced-motion="prefersReducedMotion"
            />

            <FuelAttendant
              :outer-style="attendantOuterStyle"
              :inner-class="attendantInnerMotionClass"
              :show-gray-coil="showAttendantGrayCoil"
              :walking="attendantWalking"
            />

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
                <FuelHose
                  ref="fuelHoseRef"
                  :hose-grad-id="hoseGradId"
                  :hose-stroke-paint="hoseStrokePaint"
                  :hose-path-d="hosePathD"
                  :hose-colored-path-style="hoseColoredPathStyle"
                  :hose-stroke-motion-class="hoseStrokeMotionClass"
                  :nozzle-dot-live="fillingState === 'filling' && hoseVisualFillPercent > 3"
                />
              </div>
            </div>

            <FuelPump
              ref="fuelPumpRef"
              :island-style="pumpIslandSceneStyle"
              :pump-vibrate="pumpVibrate"
              :spiral-path-d="spiralPathD"
              :spiral-length="spiralLength"
              :spiral-dash-offset="spiralDashOffset"
              :spiral-meter-percent="spiralMeterPercent"
              :nozzle-glow="nozzleGlow"
              :show-nozzle-stream="showNozzleStream"
              :show-drops="showDrops"
              :drop-seeds="dropSeeds"
            />

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
              <ParkButton
                v-if="fillingState === 'idle' && !isParked"
                :disabled="!canPump || isParking"
                :busy="isParking"
                @park="emit('park')"
              />
              <RefuelButton
                v-if="fillingState === 'idle' && isParked"
                :disabled="!canPump"
                @start-refuel="emit('startRefuel')"
              />
              <StationButton
                v-if="fillingState === 'filling'"
                variant="secondary"
                @click="emit('stopFill')"
              >
                Dừng
              </StationButton>
              <StationButton variant="ghost" @click="emit('resetFill')"> Reset </StationButton>
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

.sceneSeqLayer {
  transition:
    opacity 380ms ease-out,
    transform 450ms cubic-bezier(0.33, 1, 0.55, 1);
}

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
