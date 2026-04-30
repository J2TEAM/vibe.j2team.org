/**
 * IEC 60063 E12 / E24 standard preferred values, used to suggest the
 * nearest physically-purchasable resistor / capacitor value.
 *
 * Distance is computed in log space because E-series values are
 * geometrically (not arithmetically) spaced.
 */

const E12: ReadonlyArray<number> = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2]

const E24: ReadonlyArray<number> = [
  1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6,
  6.2, 6.8, 7.5, 8.2, 9.1,
]

export type ESeriesName = 'E12' | 'E24'

export function nearestESeriesValue(value: number, series: ESeriesName): number {
  if (!Number.isFinite(value) || value <= 0) return value
  const list = series === 'E12' ? E12 : E24

  const decade = Math.floor(Math.log10(value))
  const mantissa = value / 10 ** decade

  let best = list[0]
  if (best === undefined) return value
  let bestLogDist = Math.abs(Math.log10(mantissa) - Math.log10(best))

  for (const candidate of list) {
    const dist = Math.abs(Math.log10(mantissa) - Math.log10(candidate))
    if (dist < bestLogDist) {
      bestLogDist = dist
      best = candidate
    }
  }

  // Wrap-around: if the mantissa is closer to 10 than to any tabulated
  // mantissa, pick the first entry of the next decade.
  const wrapDist = Math.abs(Math.log10(mantissa) - Math.log10(10))
  if (wrapDist < bestLogDist) {
    return 10 ** (decade + 1)
  }

  return best * 10 ** decade
}

/** Relative error in percent of the snapped value vs the ideal value. */
export function eSeriesErrorPercent(idealValue: number, snappedValue: number): number {
  if (!Number.isFinite(idealValue) || idealValue === 0) return 0
  return ((snappedValue - idealValue) / idealValue) * 100
}
