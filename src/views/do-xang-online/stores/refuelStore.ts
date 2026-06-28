import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useIntervalFn, useRafFn } from '@vueuse/core'
import type { FuelId, LiveFuelPrice } from '../composables/useFuelRetailPrices'
import type { FillPhaseCode } from '../types'
import { resolveVehicle } from '../data/vehicleCatalog'
import { calculateCost } from '../domain/sessionEngine'
import { smoothstep } from '../utils/math'
import {
  SESSION_COUPLE_MS,
  SESSION_HOSE_PRIME_MS,
  SESSION_PREP_MS,
  SESSION_WALK_MS,
} from '../sessionConstants'

type FillingState = 'idle' | 'filling' | 'complete'

export const useRefuelSessionStore = defineStore('refuelSession', () => {
  const selectedFuelId = ref<FuelId>('ron95')
  const livePrices = ref<LiveFuelPrice[]>([])
  const pricesLoading = ref(false)
  const selectedVehicleId = ref<string>('')
  const prefersReducedMotion = ref(false)
  const fillingState = ref<FillingState>('idle')
  const liters = ref(0)
  const displayedLiters = ref(0)
  const pulseArmed = ref(false)
  const sessionStartedAt = ref<number | null>(null)
  const sessionElapsedMs = ref(0)
  const hoseLinePercent = ref(0)
  const attendantAtVehicle = ref(false)
  const fillPhaseCode = ref<FillPhaseCode>('idle')
  const hoseSessionKey = ref(0)

  const currentVehicle = computed(() => resolveVehicle(selectedVehicleId.value))
  const fuelPricePerLiter = computed(() => livePrices.value.find((p) => p.id === selectedFuelId.value)?.pricePerLiter ?? 0)
  const totalCost = computed(() => calculateCost(liters.value, fuelPricePerLiter.value))
  const progressPercent = computed(() => {
    const cap = currentVehicle.value.capacityLiters
    return cap <= 0 ? 0 : Math.max(0, Math.min(100, (displayedLiters.value / cap) * 100))
  })
  const canPump = computed(() => selectedVehicleId.value !== '' && currentVehicle.value.capacityLiters > 0)
  const fillDurationMs = computed(() => {
    const min = SESSION_PREP_MS + SESSION_WALK_MS + SESSION_COUPLE_MS
    return Math.max(min, Math.min(min + SESSION_HOSE_PRIME_MS, 4000 + currentVehicle.value.capacityLiters * 120))
  })

  const findCurrentPhase = (): FillPhaseCode => {
    const t = sessionElapsedMs.value
    if (t < SESSION_PREP_MS) return 'prep'
    if (t < SESSION_PREP_MS + SESSION_WALK_MS) return 'walk'
    if (t < SESSION_PREP_MS + SESSION_WALK_MS + SESSION_COUPLE_MS) return 'couple'
    if (t < SESSION_PREP_MS + SESSION_WALK_MS + SESSION_COUPLE_MS + SESSION_HOSE_PRIME_MS) return 'hose'
    return 'tank'
  }

  const { pause: pauseTimer, resume: resumeTimer } = useIntervalFn(() => {
    if (!sessionStartedAt.value) return
    sessionElapsedMs.value = Date.now() - sessionStartedAt.value
    const phase = findCurrentPhase()
    fillPhaseCode.value = phase

    if (phase === 'prep') {
      hoseLinePercent.value = 0; liters.value = 0; attendantAtVehicle.value = false
    } else if (phase === 'walk') {
      hoseLinePercent.value = Math.min(1, (sessionElapsedMs.value - SESSION_PREP_MS) / SESSION_WALK_MS) * 100
      liters.value = 0; attendantAtVehicle.value = false
    } else if (phase === 'couple') {
      hoseLinePercent.value = 35 + Math.min(1, (sessionElapsedMs.value - SESSION_PREP_MS - SESSION_WALK_MS) / SESSION_COUPLE_MS) * 65
      liters.value = 0; attendantAtVehicle.value = true
    } else if (phase === 'hose') {
      hoseLinePercent.value = Math.min(100, smoothstep(Math.min(1, (sessionElapsedMs.value - SESSION_PREP_MS - SESSION_WALK_MS - SESSION_COUPLE_MS) / SESSION_HOSE_PRIME_MS)) * 100)
      liters.value = 0; attendantAtVehicle.value = true
    } else {
      const tankStart = SESSION_PREP_MS + SESSION_WALK_MS + SESSION_COUPLE_MS + SESSION_HOSE_PRIME_MS
      const ratio = Math.max(0, Math.min(1, (sessionElapsedMs.value - tankStart) / fillDurationMs.value))
      hoseLinePercent.value = 100; attendantAtVehicle.value = true
      liters.value = currentVehicle.value.capacityLiters * ratio
      if (ratio >= 1) {
        pauseTimer()
        fillingState.value = 'complete'
        fillPhaseCode.value = 'done'
      }
    }
  }, 50, { immediate: false })

  const { pause: pauseDisplay, resume: resumeDisplay } = useRafFn(() => {
    if (!sessionStartedAt.value || fillingState.value !== 'filling') return
    const diff = liters.value - displayedLiters.value
    if (Math.abs(diff) < 0.001) { displayedLiters.value = liters.value; return }
    displayedLiters.value += diff * 0.15
  }, { immediate: false })

  function selectFuel(id: FuelId) { selectedFuelId.value = id }
  function selectVehicle(id: string) { selectedVehicleId.value = id }
  function setLivePrices(prices: LiveFuelPrice[]) { livePrices.value = prices }
  function setPricesLoading(v: boolean) { pricesLoading.value = v }
  function setReducedMotion(v: boolean) { prefersReducedMotion.value = v }

  function startFill() {
    if (!canPump.value) return
    pulseArmed.value = true
    fillingState.value = 'filling'
    sessionStartedAt.value = Date.now()
    fillPhaseCode.value = 'prep'
    hoseLinePercent.value = 0; liters.value = 0; displayedLiters.value = 0
    attendantAtVehicle.value = false
    hoseSessionKey.value += 1
    resumeTimer(); resumeDisplay()
  }

  function stopFill() {
    if (fillingState.value !== 'filling') return
    pauseTimer(); pauseDisplay()
    fillingState.value = 'idle'
    displayedLiters.value = liters.value
    pulseArmed.value = false; sessionStartedAt.value = null
    sessionElapsedMs.value = 0; hoseLinePercent.value = 0
    attendantAtVehicle.value = false; fillPhaseCode.value = 'idle'
  }

  function resetSessionCore() {
    stopFill(); fillPhaseCode.value = 'idle'
    hoseLinePercent.value = 0; attendantAtVehicle.value = false
    pulseArmed.value = false
  }

  function resetFill() { resetSessionCore() }

  return {
    selectedFuelId, livePrices, pricesLoading,
    selectedVehicleId, prefersReducedMotion, fillingState,
    liters, displayedLiters, pulseArmed,
    sessionStartedAt, sessionElapsedMs, hoseLinePercent,
    attendantAtVehicle, fillPhaseCode, hoseSessionKey,
    currentVehicle, fuelPricePerLiter, totalCost, progressPercent, canPump, fillDurationMs,
    selectFuel, selectVehicle, setLivePrices, setPricesLoading, setReducedMotion,
    startFill, stopFill, resetFill, resetSessionCore,
  }
})
