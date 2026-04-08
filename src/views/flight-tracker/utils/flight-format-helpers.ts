import type { FlightState, UnitSystem } from '../types'

/** Convert meters to feet */
export function metersToFeet(m: number): number {
  return m * 3.28084
}

/** Convert m/s to knots */
export function msToKnots(ms: number): number {
  return ms * 1.94384
}

/** Convert m/s to km/h */
export function msToKmh(ms: number): number {
  return ms * 3.6
}

/** Format altitude with unit */
export function formatAltitude(m: number | null, unit: UnitSystem): string {
  if (m === null) return 'N/A'
  if (unit === 'aviation') return `${Math.round(metersToFeet(m)).toLocaleString()} ft`
  return `${Math.round(m).toLocaleString()} m`
}

/** Format speed with unit */
export function formatSpeed(ms: number | null, unit: UnitSystem): string {
  if (ms === null) return 'N/A'
  if (unit === 'aviation') return `${Math.round(msToKnots(ms))} kts`
  return `${Math.round(msToKmh(ms))} km/h`
}

/** Format vertical rate with unit */
export function formatVerticalRate(ms: number | null, unit: UnitSystem): string {
  if (ms === null) return 'N/A'
  if (unit === 'aviation') return `${Math.round(metersToFeet(ms) * 60)} ft/min`
  return `${ms.toFixed(1)} m/s`
}

/** Format heading degrees */
export function formatHeading(deg: number | null): string {
  if (deg === null) return 'N/A'
  return `${Math.round(deg)}°`
}

/**
 * Get tailwind color class based on flight vertical state.
 * Uses design system: sky=climbing, amber=level, coral=descending, dim=ground
 */
export function getFlightColorClass(verticalRate: number | null, onGround: boolean): string {
  if (onGround) return 'text-text-dim'
  if (verticalRate === null) return 'text-accent-amber'
  if (verticalRate > 0.5) return 'text-accent-sky'
  if (verticalRate < -0.5) return 'text-accent-coral'
  return 'text-accent-amber'
}

/**
 * Get hex color for map markers based on vertical state.
 * Matches design system tokens.
 */
export function getFlightMarkerColor(verticalRate: number | null, onGround: boolean): string {
  if (onGround) return '#4A6180' // text-dim
  if (verticalRate === null) return '#FFB830' // amber
  if (verticalRate > 0.5) return '#38BDF8' // sky
  if (verticalRate < -0.5) return '#FF6B4A' // coral
  return '#FFB830' // amber
}

/**
 * Parse raw API state array (18 fields) into typed FlightState object.
 * See: https://openskynetwork.github.io/opensky-api/rest.html
 */
export function parseApiState(raw: unknown[]): FlightState {
  return {
    icao24: raw[0] as string,
    callsign: raw[1] ? (raw[1] as string).trim() : null,
    originCountry: raw[2] as string,
    timePosition: raw[3] as number | null,
    lastContact: raw[4] as number,
    longitude: raw[5] as number | null,
    latitude: raw[6] as number | null,
    baroAltitude: raw[7] as number | null,
    onGround: raw[8] as boolean,
    velocity: raw[9] as number | null,
    trueTrack: raw[10] as number | null,
    verticalRate: raw[11] as number | null,
    sensors: raw[12] as number[] | null,
    geoAltitude: raw[13] as number | null,
    squawk: raw[14] as string | null,
    spi: raw[15] as boolean,
    positionSource: raw[16] as number,
    category: (raw[17] as number) ?? 0,
  }
}

/** Format Unix timestamp to locale time string */
export function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString('vi-VN')
}
