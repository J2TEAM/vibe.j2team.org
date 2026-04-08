import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import type { FlightState } from '../types'

export interface FlightFilters {
  country: string
  minAlt: number
  maxAlt: number
  showGround: boolean
}

const DEFAULT_FILTERS: FlightFilters = {
  country: '',
  minAlt: 0,
  maxAlt: 15000,
  showGround: true,
}

/**
 * Composable for client-side flight search and filtering.
 * Filters are applied on top of the full flight list.
 */
export function useFlightFilter(flights: Ref<FlightState[]>) {
  const searchQuery = ref('')
  const filters = ref<FlightFilters>({ ...DEFAULT_FILTERS })

  const filteredFlights = computed(() => {
    let result = flights.value
    const query = searchQuery.value.trim().toLowerCase()

    // Text search: callsign or ICAO24
    if (query) {
      result = result.filter(
        (f) =>
          f.icao24.toLowerCase().includes(query) ||
          (f.callsign && f.callsign.toLowerCase().includes(query)),
      )
    }

    // Country filter
    if (filters.value.country) {
      const country = filters.value.country.toLowerCase()
      result = result.filter((f) => f.originCountry.toLowerCase().includes(country))
    }

    // Ground filter
    if (!filters.value.showGround) {
      result = result.filter((f) => !f.onGround)
    }

    // Altitude filter (only for airborne)
    result = result.filter((f) => {
      if (f.onGround) return true // don't filter grounded by altitude
      const alt = f.baroAltitude ?? f.geoAltitude ?? 0
      return alt >= filters.value.minAlt && alt <= filters.value.maxAlt
    })

    return result
  })

  const matchCount = computed(() => filteredFlights.value.length)

  /** Get unique countries from current flights (for filter dropdown) */
  const availableCountries = computed(() => {
    const countries = new Set(flights.value.map((f) => f.originCountry))
    return [...countries].sort()
  })

  function resetFilters() {
    searchQuery.value = ''
    filters.value = { ...DEFAULT_FILTERS }
  }

  return {
    searchQuery,
    filters,
    filteredFlights,
    matchCount,
    availableCountries,
    resetFilters,
  }
}
