import type { BoundingBox, CachedResponse, FlightApiResponse } from '../types'
import { API_BASE_URL, CACHE_KEY, CACHE_TTL } from '../types'
import { parseApiState } from './flight-format-helpers'

/** Get today's date string for daily credit tracking */
function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Create a cache key that includes the bbox so different regions don't share cache */
function getCacheKey(bbox: BoundingBox): string {
  return `${CACHE_KEY}-${bbox.lamin}-${bbox.lomin}-${bbox.lamax}-${bbox.lomax}`
}

/** Read cached response from localStorage */
function readCache(bbox: BoundingBox): CachedResponse | null {
  try {
    const raw = localStorage.getItem(getCacheKey(bbox))
    if (!raw) return null
    return JSON.parse(raw) as CachedResponse
  } catch {
    return null
  }
}

/** Write response to localStorage cache */
function writeCache(bbox: BoundingBox, data: FlightApiResponse, cached: CachedResponse | null): void {
  const today = getTodayKey()
  const prevCount = cached?.dailyDate === today ? cached.dailyCount : 0
  const key = getCacheKey(bbox)
  const entry: CachedResponse = {
    data,
    timestamp: Date.now(),
    dailyCount: prevCount + 1,
    dailyDate: today,
  }
  try {
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // localStorage full — clear and retry once
    localStorage.removeItem(key)
    localStorage.setItem(key, JSON.stringify(entry))
  }
}

/** Estimate credits used per request based on bbox area */
function estimateCredits(bbox: BoundingBox): number {
  const area = Math.abs(bbox.lamax - bbox.lamin) * Math.abs(bbox.lomax - bbox.lomin)
  if (area <= 25) return 1
  if (area <= 100) return 2
  if (area <= 400) return 3
  return 4
}

/**
 * Fetch flight states from OpenSky API with localStorage caching.
 * Returns cached data if within TTL. Tracks daily credit usage.
 */
export async function fetchFlights(bbox: BoundingBox): Promise<{
  response: FlightApiResponse
  fromCache: boolean
  dailyCreditsUsed: number
}> {
  const cached = readCache(bbox)

  // Return cached if fresh enough
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return {
      response: cached.data,
      fromCache: true,
      dailyCreditsUsed: cached.dailyDate === getTodayKey() ? cached.dailyCount * estimateCredits(bbox) : 0,
    }
  }

  // Fetch from API
  const params = new URLSearchParams({
    lamin: String(bbox.lamin),
    lomin: String(bbox.lomin),
    lamax: String(bbox.lamax),
    lomax: String(bbox.lomax),
    extended: '1',
  })

  const res = await fetch(`${API_BASE_URL}/states/all?${params}`)

  if (!res.ok) {
    // On error, serve stale cache if available
    if (cached) {
      return {
        response: cached.data,
        fromCache: true,
        dailyCreditsUsed: cached.dailyDate === getTodayKey() ? cached.dailyCount * estimateCredits(bbox) : 0,
      }
    }
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }

  const json = await res.json()
  const parsed: FlightApiResponse = {
    time: json.time,
    states: (json.states ?? []).map((s: unknown[]) => parseApiState(s)),
  }

  writeCache(bbox, parsed, cached)

  const credits = cached?.dailyDate === getTodayKey() ? (cached.dailyCount + 1) * estimateCredits(bbox) : estimateCredits(bbox)

  return { response: parsed, fromCache: false, dailyCreditsUsed: credits }
}
