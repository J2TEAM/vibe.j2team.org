/** Format a VND amount with thousand separators and đ suffix. */
export function formatMoneyVn(amount: number): string {
  return Math.round(amount).toLocaleString('vi-VN') + 'đ'
}

/**
 * Format a fuel price given in cents per liter.
 * `25840` → `"25,840đ"`
 */
export function formatPrice(cents: number): string {
  return formatMoneyVn(cents)
}

/**
 * Format a volume in litres with appropriate decimal places.
 * @param liters - volume to format
 * @param decimals - fractional digits (default 2)
 */
export function formatVolume(liters: number, decimals = 2): string {
  return liters.toFixed(decimals)
}

/**
 * Format a duration in milliseconds to a human-readable string.
 * `0–59999` → `"32s"`, `60000+` → `"1m 5s"`, `3600000+` → `"1h 5m"`
 */
export function formatDuration(ms: number): string {
  if (ms < 1_000) return `${Math.round(ms)}ms`
  const totalSec = Math.round(ms / 1_000)
  if (totalSec < 60) return `${totalSec}s`
  const h = Math.floor(totalSec / 3_600)
  const m = Math.floor((totalSec % 3_600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${s}s`
}
