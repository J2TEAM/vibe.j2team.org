import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { Ref } from 'vue'
import type { FlightState, Region } from '../types'
import { REGIONS, POLL_INTERVAL } from '../types'
import { fetchFlights } from '../utils/flight-api-client'

/**
 * Composable for flight data fetching, polling, and caching.
 * Auto-polls every 15s, pauses when tab hidden.
 */
export function useFlightData() {
  const flights: Ref<FlightState[]> = ref([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<number | null>(null)
  const fromCache = ref(false)
  const dailyCreditsUsed = ref(0)
  const countdown = ref(0)
  const selectedRegion = ref<Region>(REGIONS[0]!)

  let pollTimer: ReturnType<typeof setInterval> | null = null
  let countdownTimer: ReturnType<typeof setInterval> | null = null

  async function refresh() {
    loading.value = true
    error.value = null
    try {
      const result = await fetchFlights(selectedRegion.value.bbox)
      flights.value = result.response.states
      lastUpdated.value = result.response.time
      fromCache.value = result.fromCache
      dailyCreditsUsed.value = result.dailyCreditsUsed
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Lỗi không xác định'
    } finally {
      loading.value = false
      countdown.value = POLL_INTERVAL / 1000
    }
  }

  function startPolling() {
    stopPolling()
    // Countdown timer (1s interval)
    countdownTimer = setInterval(() => {
      if (countdown.value > 0) countdown.value--
    }, 1000)
    // Polling timer
    pollTimer = setInterval(() => {
      if (!document.hidden) refresh()
    }, POLL_INTERVAL)
  }

  function stopPolling() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
  }

  // Pause/resume on visibility change
  function handleVisibility() {
    if (document.hidden) {
      stopPolling()
    } else {
      refresh()
      startPolling()
    }
  }

  // Re-fetch when region changes
  watch(selectedRegion, () => {
    refresh()
  })

  onMounted(() => {
    refresh()
    startPolling()
    document.addEventListener('visibilitychange', handleVisibility)
  })

  onUnmounted(() => {
    stopPolling()
    document.removeEventListener('visibilitychange', handleVisibility)
  })

  return {
    flights,
    loading,
    error,
    lastUpdated,
    fromCache,
    dailyCreditsUsed,
    countdown,
    selectedRegion,
    refresh,
  }
}
