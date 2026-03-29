import { onUnmounted, ref, type Ref } from 'vue'

export type UseParkingAnimationOptions = {
  prefersReducedMotion: Ref<boolean>
  defaultDurationMs?: number
}

export function useParkingAnimation(opts: UseParkingAnimationOptions) {
  const defaultDurationMs = opts.defaultDurationMs ?? 780
  const isParked = ref(false)
  const isParking = ref(false)
  const parkingProgress01 = ref(0)
  let rafId = 0
  let startTs = 0

  function cancelParkingRaf() {
    if (rafId !== 0) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
  }

  function resetParking() {
    cancelParkingRaf()
    isParking.value = false
    isParked.value = false
    parkingProgress01.value = 0
  }

  function beginParking(durationMs = defaultDurationMs) {
    if (isParking.value || isParked.value) return
    if (opts.prefersReducedMotion.value) {
      parkingProgress01.value = 1
      isParked.value = true
      return
    }
    isParking.value = true
    parkingProgress01.value = 0
    startTs = performance.now()

    const tick = (now: number) => {
      const raw = Math.min(1, (now - startTs) / durationMs)
      const eased = raw * raw * (3 - 2 * raw)
      parkingProgress01.value = eased
      if (raw < 1) {
        rafId = requestAnimationFrame(tick)
      } else {
        isParking.value = false
        isParked.value = true
        rafId = 0
      }
    }
    rafId = requestAnimationFrame(tick)
  }

  onUnmounted(() => {
    cancelParkingRaf()
  })

  return {
    isParked,
    isParking,
    parkingProgress01,
    beginParking,
    resetParking,
  }
}
