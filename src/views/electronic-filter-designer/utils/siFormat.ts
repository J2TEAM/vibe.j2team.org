/**
 * SI prefix parser/formatter for component-value text input.
 *
 * Accepts inputs like "10k", "10kΩ", "100n", "2.2nF", "1.5M", "1µ", "1u",
 * "47", "1.59kHz". Lowercase "m" is milli, uppercase "M" is mega
 * (engineering convention; we deliberately do NOT auto-correct that).
 */

const PREFIX_FACTORS: Record<string, number> = {
  f: 1e-15,
  p: 1e-12,
  n: 1e-9,
  u: 1e-6,
  µ: 1e-6,
  m: 1e-3,
  '': 1,
  k: 1e3,
  K: 1e3,
  M: 1e6,
  G: 1e9,
  T: 1e12,
}

/** Returns null on parse failure or non-finite result. */
export function parseSiNumber(input: string): number | null {
  const trimmed = input.trim()
  if (trimmed.length === 0) return null

  const match = /^(-?\d+(?:\.\d+)?)\s*([fpnuµmkKMGT]?)\s*([a-zA-ZΩ°/%]*)$/.exec(trimmed)
  if (match === null) return null

  const mantissaStr = match[1]
  if (mantissaStr === undefined) return null
  const mantissa = Number(mantissaStr)
  if (!Number.isFinite(mantissa)) return null

  const prefix = match[2] ?? ''
  const factor = PREFIX_FACTORS[prefix] ?? 1
  return mantissa * factor
}

const FORMAT_PREFIXES: ReadonlyArray<readonly [string, number]> = [
  ['T', 1e12],
  ['G', 1e9],
  ['M', 1e6],
  ['k', 1e3],
  ['', 1],
  ['m', 1e-3],
  ['µ', 1e-6],
  ['n', 1e-9],
  ['p', 1e-12],
  ['f', 1e-15],
]

/** Format a value with the SI prefix that gives a 1..1000 mantissa. */
export function formatSiValue(value: number, unit = '', sigDigits = 3): string {
  if (!Number.isFinite(value)) return 'N/A'
  if (value === 0) return unit.length > 0 ? `0 ${unit}` : '0'

  const abs = Math.abs(value)
  for (const entry of FORMAT_PREFIXES) {
    const prefix = entry[0]
    const factor = entry[1]
    if (abs >= factor || prefix === 'f') {
      const scaled = value / factor
      const formatted = scaled.toPrecision(sigDigits)
      const trimmed = trimTrailingZeros(formatted)
      const tail = `${prefix}${unit}`
      return tail.length > 0 ? `${trimmed} ${tail}` : trimmed
    }
  }
  // Unreachable because the loop covers down to 'f'.
  return `${value} ${unit}`.trim()
}

function trimTrailingZeros(formatted: string): string {
  if (!formatted.includes('.') && !formatted.toLowerCase().includes('e')) {
    return formatted
  }
  if (formatted.toLowerCase().includes('e')) {
    return formatted
  }
  return formatted.replace(/\.?0+$/, '')
}

/** Format a frequency value in Hz with the most readable unit. */
export function formatFrequency(hz: number, sigDigits = 4): string {
  return formatSiValue(hz, 'Hz', sigDigits)
}
