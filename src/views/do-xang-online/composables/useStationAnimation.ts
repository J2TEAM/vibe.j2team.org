import { computed, type ComputedRef } from 'vue'
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

type FuelPick = {
  label: string
  pricePerLiter: number
}

type Props = {
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
  pulseArmed: boolean
  prefersReducedMotion: boolean
  dropSeeds: DropSeed[]
  isUsingFallback: boolean
  isParked: boolean
  isParking: boolean
  parkingProgress01: number
}

export type UseStationAnimationReturn = {
  sessionWalkMsResolved: ComputedRef<number>
  sessionElapsedResolved: ComputedRef<number>
  hoseGeometry: ComputedRef<ReturnType<typeof computeHoseGeom>>
  hosePathProgressiveActive: ComputedRef<boolean>
  walkProgress01: ComputedRef<number>
  coupleProgress01: ComputedRef<number>
  hosePathD: ComputedRef<string>
  hoseVisualFillPercent: ComputedRef<number>
  progressHero: ComputedRef<{ mode: 'phase' | 'percent'; value: number | null; label: string }>
  pulseHero: ComputedRef<boolean>
  prepSceneReveal: ComputedRef<{ pump: number; attendant: number }>
  attendantWalkBlend01: ComputedRef<number>
  attendantOuterStyle: ComputedRef<Record<string, string | number>>
  pumpIslandSceneStyle: ComputedRef<Record<string, string | number>>
  hoseLayerWrapStyle: ComputedRef<Record<string, string | number>>
  hoseLayerMotionStyle: ComputedRef<Record<string, string>>
  attendantInnerMotionClass: ComputedRef<string>
  hoseStrokeMotionClass: ComputedRef<string>
  attendantWalking: ComputedRef<boolean>
  showHoseInScene: ComputedRef<boolean>
  showAttendantGrayCoil: ComputedRef<boolean>
  spiralMeterPercent: ComputedRef<number>
  isCar: ComputedRef<boolean>
  vehicleImageSrc: ComputedRef<string>
  pumpVibrate: ComputedRef<boolean>
  nozzleGlow: ComputedRef<boolean>
  showNozzleStream: ComputedRef<boolean>
  showDrops: ComputedRef<boolean>
  refuelHelper: ComputedRef<string | undefined>
  showTankBar: ComputedRef<boolean>
  stationStateLabel: ComputedRef<string>
  progressHeroKey: ComputedRef<string>
}

export function useStationAnimation(props: Props): UseStationAnimationReturn {
  const sessionWalkMsResolved = computed(() => props.sessionWalkMs ?? DEFAULT_SESSION_WALK_MS)

  const sessionElapsedResolved = computed(() => props.sessionElapsedMs ?? 0)

  const hoseGeometry = computed(() =>
    computeHoseGeom(props.vehicle.bodyType, props.vehicle.id, props.hoseSessionKey),
  )

  const hosePathProgressiveActive = computed(() => {
    if (props.fillingState !== 'filling') return false
    if (props.prefersReducedMotion) return false
    const e = sessionElapsedResolved.value
    const end = SESSION_PREP_MS + sessionWalkMsResolved.value + SESSION_COUPLE_MS
    return e < end
  })

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

  const pulseHero = computed(
    () =>
      props.fillingState === 'filling' &&
      props.pulseArmed &&
      (props.fillPhaseCode === 'hose' || props.fillPhaseCode === 'tank'),
  )

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

  const attendantWalking = computed(
    () =>
      props.fillingState === 'filling' &&
      !props.attendantAtVehicle &&
      !props.prefersReducedMotion,
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

  const stationStateLabel = computed(() => {
    if (props.fillingState === 'idle') return 'Sẵn sàng'
    if (props.fillingState === 'complete') return 'Hoàn tất'
    switch (props.fillPhaseCode) {
      case 'prep': return 'Chuẩn bị'
      case 'walk': return 'Đang đến'
      case 'couple': return 'Cắm ống'
      case 'hose':
      case 'tank': return 'Đổ xăng'
      case 'done': return 'Hoàn tất'
      default: return 'Sẵn sàng'
    }
  })

  const progressHeroKey = computed(
    () =>
      `${props.fillPhaseCode}-${progressHero.value.mode}-${progressHero.value.mode === 'percent' ? progressHero.value.value : 'x'}-${props.isParked}`,
  )

  return {
    sessionWalkMsResolved,
    sessionElapsedResolved,
    hoseGeometry,
    hosePathProgressiveActive,
    walkProgress01,
    coupleProgress01,
    hosePathD,
    hoseVisualFillPercent,
    progressHero,
    pulseHero,
    prepSceneReveal,
    attendantWalkBlend01,
    attendantOuterStyle,
    pumpIslandSceneStyle,
    hoseLayerWrapStyle,
    hoseLayerMotionStyle,
    attendantInnerMotionClass,
    hoseStrokeMotionClass,
    attendantWalking,
    showHoseInScene,
    showAttendantGrayCoil,
    spiralMeterPercent,
    isCar,
    vehicleImageSrc,
    pumpVibrate,
    nozzleGlow,
    showNozzleStream,
    showDrops,
    refuelHelper,
    showTankBar,
    stationStateLabel,
    progressHeroKey,
  }
}
