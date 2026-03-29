import { computed, onUnmounted, ref, watch, type ComputedRef, type Ref } from 'vue'
import { useIntervalFn, useRafFn } from '@vueuse/core'
import type { FillPhaseCode } from '../types'
import {
  SESSION_COUPLE_MS,
  SESSION_HOSE_PRIME_MS,
  SESSION_PREP_MS,
  SESSION_WALK_MS,
} from '../sessionConstants'

export type UseRefuelSessionOptions = {
  capacityLiters: ComputedRef<number>
  prefersReducedMotion: Ref<boolean>
  minFillMs?: number
  maxFillMs?: number
}

export function useRefuelSession(opts: UseRefuelSessionOptions) {
  const minFillMs = opts.minFillMs ?? 5000
  const maxFillMs = opts.maxFillMs ?? 10000

  const hoseSessionKey = ref(0)
  const fillingState = ref<'idle' | 'filling' | 'complete'>('idle')
  const liters = ref(0)
  const displayedLiters = ref(0)
  const pulseArmed = ref(false)
  const sessionStartedAt = ref<number | null>(null)
  const sessionElapsedMs = ref(0)
  const hoseLinePercent = ref(0)
  const attendantAtVehicle = ref(false)
  const fillPhaseCode = ref<FillPhaseCode>('idle')

  const sessionPreTankMs = computed(() => {
    if (opts.prefersReducedMotion.value) return 0
    return SESSION_PREP_MS + SESSION_WALK_MS + SESSION_COUPLE_MS + SESSION_HOSE_PRIME_MS
  })

  const fillDurationMs = computed(() => {
    const cap = opts.capacityLiters.value
    if (cap <= 0) return minFillMs
    const ms = 4000 + cap * 120
    return Math.max(minFillMs, Math.min(maxFillMs, ms))
  })

  let pauseTick: () => void = () => {}

  function applyFillingTick() {
    if (fillingState.value !== 'filling') return
    if (sessionStartedAt.value === null) return

    const cap = opts.capacityLiters.value
    if (cap <= 0) return

    const now = performance.now()
    const t = now - sessionStartedAt.value
    const pre = sessionPreTankMs.value

    if (opts.prefersReducedMotion.value) {
      attendantAtVehicle.value = true
      hoseLinePercent.value = 100
      fillPhaseCode.value = 'tank'
    } else if (t < SESSION_PREP_MS) {
      attendantAtVehicle.value = false
      hoseLinePercent.value = 0
      fillPhaseCode.value = 'prep'
      liters.value = 0
      return
    } else if (t < SESSION_PREP_MS + SESSION_WALK_MS) {
      attendantAtVehicle.value = false
      hoseLinePercent.value = 0
      fillPhaseCode.value = 'walk'
      liters.value = 0
      return
    } else if (t < SESSION_PREP_MS + SESSION_WALK_MS + SESSION_COUPLE_MS) {
      attendantAtVehicle.value = true
      hoseLinePercent.value = 0
      fillPhaseCode.value = 'couple'
      liters.value = 0
      return
    } else {
      attendantAtVehicle.value = true
      const hoseStart = SESSION_PREP_MS + SESSION_WALK_MS + SESSION_COUPLE_MS
      if (t < pre) {
        fillPhaseCode.value = 'hose'
        const u = Math.max(0, Math.min(1, (t - hoseStart) / SESSION_HOSE_PRIME_MS))
        const eased = u * u * (3 - 2 * u)
        hoseLinePercent.value = Math.min(100, eased * 100)
        liters.value = 0
        return
      }
      hoseLinePercent.value = 100
      fillPhaseCode.value = 'tank'
    }

    const tankElapsed = t - pre
    const ratio = Math.max(0, Math.min(1, tankElapsed / fillDurationMs.value))
    liters.value = cap * ratio

    if (ratio >= 1) {
      pauseTick()
      fillingState.value = 'complete'
      fillPhaseCode.value = 'done'
    }
  }

  const tickCtl = useIntervalFn(applyFillingTick, 80, { immediate: false })
  pauseTick = tickCtl.pause
  const resumeTick = tickCtl.resume

  const { pause: pauseDisplay, resume: resumeDisplay } = useRafFn(
    ({ delta }) => {
      if (fillingState.value === 'filling' && sessionStartedAt.value !== null) {
        sessionElapsedMs.value = performance.now() - sessionStartedAt.value
      } else if (fillingState.value !== 'filling') {
        sessionElapsedMs.value = 0
      }

      if (opts.prefersReducedMotion.value) return
      if (fillingState.value !== 'filling') return

      if (!pulseArmed.value && sessionStartedAt.value !== null) {
        const now = performance.now()
        const t = now - sessionStartedAt.value
        if (t >= sessionPreTankMs.value + 400) pulseArmed.value = true
      }

      const cap = opts.capacityLiters.value
      const target = Math.min(liters.value, cap)
      const diff = target - displayedLiters.value

      if (Math.abs(diff) < 0.0005) {
        displayedLiters.value = target
        return
      }

      const alpha = 1 - Math.exp(-delta / 180)
      displayedLiters.value += diff * alpha
    },
    { immediate: false },
  )

  watch(
    fillingState,
    (state) => {
      if (opts.prefersReducedMotion.value) {
        pauseDisplay()
        displayedLiters.value = state === 'complete' ? opts.capacityLiters.value : liters.value
        return
      }

      if (state === 'filling') {
        resumeDisplay()
        return
      }

      pauseDisplay()
      displayedLiters.value = state === 'complete' ? opts.capacityLiters.value : liters.value
    },
    { immediate: true },
  )

  watch(liters, (value) => {
    if (!opts.prefersReducedMotion.value) return
    if (fillingState.value !== 'filling') return
    displayedLiters.value = value
  })

  function resetSessionCore() {
    pauseTick()
    liters.value = 0
    displayedLiters.value = 0
    fillingState.value = 'idle'
    pulseArmed.value = false
    sessionStartedAt.value = null
    sessionElapsedMs.value = 0
    hoseLinePercent.value = 0
    attendantAtVehicle.value = false
    fillPhaseCode.value = 'idle'
  }

  function startFill() {
    if (opts.capacityLiters.value <= 0) return
    if (fillingState.value === 'complete') return
    if (fillingState.value === 'idle') {
      liters.value = 0
      displayedLiters.value = 0
    }

    hoseSessionKey.value += 1

    const now = performance.now()
    sessionStartedAt.value = now
    pulseArmed.value = false
    if (opts.prefersReducedMotion.value) {
      attendantAtVehicle.value = true
      hoseLinePercent.value = 100
      fillPhaseCode.value = 'tank'
      pulseArmed.value = true
    } else {
      attendantAtVehicle.value = false
      hoseLinePercent.value = 0
      fillPhaseCode.value = 'prep'
    }
    fillingState.value = 'filling'
    resumeTick()
    applyFillingTick()
  }

  function stopFill() {
    if (fillingState.value !== 'filling') return
    pauseTick()
    fillingState.value = 'idle'
    displayedLiters.value = liters.value
    pulseArmed.value = false
    sessionStartedAt.value = null
    sessionElapsedMs.value = 0
    hoseLinePercent.value = 0
    attendantAtVehicle.value = false
    fillPhaseCode.value = 'idle'
  }

  function resetFill() {
    resetSessionCore()
  }

  onUnmounted(() => {
    pauseTick()
    pauseDisplay()
  })

  return {
    hoseSessionKey,
    fillingState,
    liters,
    displayedLiters,
    pulseArmed,
    sessionStartedAt,
    sessionElapsedMs,
    hoseLinePercent,
    attendantAtVehicle,
    fillPhaseCode,
    sessionPreTankMs,
    fillDurationMs,
    startFill,
    stopFill,
    resetFill,
    resetSessionCore,
  }
}
