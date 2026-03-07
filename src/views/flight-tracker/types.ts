/** Single aircraft state from OpenSky API */
export interface FlightState {
  icao24: string
  callsign: string | null
  originCountry: string
  timePosition: number | null
  lastContact: number
  longitude: number | null
  latitude: number | null
  baroAltitude: number | null
  onGround: boolean
  velocity: number | null
  trueTrack: number | null
  verticalRate: number | null
  sensors: number[] | null
  geoAltitude: number | null
  squawk: string | null
  spi: boolean
  positionSource: number
  category: number
}

/** API response shape */
export interface FlightApiResponse {
  time: number
  states: FlightState[]
}

/** Geographic bounding box for API queries */
export interface BoundingBox {
  lamin: number
  lomin: number
  lamax: number
  lomax: number
}

/** Predefined region with name and bbox */
export interface Region {
  name: string
  label: string
  bbox: BoundingBox
}

/** Unit system for display */
export type UnitSystem = 'metric' | 'aviation'

/** Cached API response in localStorage */
export interface CachedResponse {
  data: FlightApiResponse
  timestamp: number
  dailyCount: number
  dailyDate: string
}

// -- Constants --

export const API_BASE_URL = 'https://opensky-network.org/api'

export const POLL_INTERVAL = 30_000 // 30 seconds

export const CACHE_TTL = 300_000 // 5 minutes

export const CACHE_KEY = 'flight-tracker-cache'

export const VIETNAM_BBOX: BoundingBox = {
  lamin: 8.18,
  lomin: 102.14,
  lamax: 23.39,
  lomax: 109.46,
}

export const REGIONS: Region[] = [
  { name: 'vietnam', label: 'Việt Nam', bbox: VIETNAM_BBOX },
  {
    name: 'southeast-asia',
    label: 'Đông Nam Á',
    bbox: { lamin: -11, lomin: 92, lamax: 28, lomax: 141 },
  },
  {
    name: 'east-asia',
    label: 'Đông Á',
    bbox: { lamin: 20, lomin: 100, lamax: 50, lomax: 145 },
  },
  {
    name: 'europe',
    label: 'Châu Âu',
    bbox: { lamin: 35, lomin: -10, lamax: 60, lomax: 40 },
  },
  {
    name: 'north-america',
    label: 'Bắc Mỹ',
    bbox: { lamin: 15, lomin: -130, lamax: 55, lomax: -60 },
  },
  {
    name: 'middle-east',
    label: 'Trung Đông',
    bbox: { lamin: 12, lomin: 35, lamax: 42, lomax: 60 },
  },
  {
    name: 'global',
    label: 'Toàn cầu',
    bbox: { lamin: -90, lomin: -180, lamax: 90, lomax: 180 },
  },
]

/** Position source labels */
export const POSITION_SOURCES = ['ADS-B', 'ASTERIX', 'MLAT', 'FLARM'] as const
