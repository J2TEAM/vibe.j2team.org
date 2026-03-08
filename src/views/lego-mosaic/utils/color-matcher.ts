import { LEGO_COLORS, COLOR_RGB_FLAT, type LegoColor } from './lego-colors'

// ─── Perceptual distance (redmean formula) ────────────────────────────────────
// Significantly better than plain Euclidean for RGB color matching.
// See: https://www.compuphase.com/cmetric.htm
function redmeanDistSq(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
): number {
  const rMean = (r1 + r2) >> 1
  const dr = r1 - r2
  const dg = g1 - g2
  const db = b1 - b2
  return (((512 + rMean) * dr * dr) >> 8) + 4 * dg * dg + (((767 - rMean) * db * db) >> 8)
}

// ─── Precomputed 5-bit LUT (32³ = 32 768 entries) ────────────────────────────
// Built once at module load; thereafter every lookup is O(1).
// 5-bit precision → quantize each 8-bit channel by >> 3 (8 values per bin).
// Max error per channel: ±4 — visually negligible for LEGO-scale blocks.

const LUT_BITS = 5
const LUT_LEVELS = 1 << LUT_BITS // 32
const LUT_STEP = 256 / LUT_LEVELS // 8
const LUT_SIZE = LUT_LEVELS ** 3 // 32 768

/** Maps quantized (r,g,b) → index into LEGO_COLORS */
const lut = new Uint8Array(LUT_SIZE)

;(function buildLUT() {
  const n = LEGO_COLORS.length
  for (let ri = 0; ri < LUT_LEVELS; ri++) {
    // Use midpoint of the bin for better representativeness
    const r = Math.min(255, Math.round(ri * LUT_STEP + LUT_STEP / 2))
    for (let gi = 0; gi < LUT_LEVELS; gi++) {
      const g = Math.min(255, Math.round(gi * LUT_STEP + LUT_STEP / 2))
      for (let bi = 0; bi < LUT_LEVELS; bi++) {
        const b = Math.min(255, Math.round(bi * LUT_STEP + LUT_STEP / 2))

        let minDist = Infinity
        let bestIdx = 0
        for (let ci = 0; ci < n; ci++) {
          const fi = ci * 3
          const d = redmeanDistSq(
            r,
            g,
            b,
            COLOR_RGB_FLAT[fi]!,
            COLOR_RGB_FLAT[fi + 1]!,
            COLOR_RGB_FLAT[fi + 2]!,
          )
          if (d < minDist) {
            minDist = d
            bestIdx = ci
          }
        }

        lut[ri * LUT_LEVELS * LUT_LEVELS + gi * LUT_LEVELS + bi] = bestIdx
      }
    }
  }
})()

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the closest LEGO color object for the given sRGB triple.
 * O(1) via precomputed LUT.
 */
export function findClosestLegoColor(r: number, g: number, b: number): LegoColor {
  return LEGO_COLORS[findClosestLegoColorIndex(r, g, b)]!
}

/**
 * Returns the index into LEGO_COLORS for the given sRGB triple.
 * O(1) via precomputed LUT. Use this when you need the index for typed-array storage.
 */
export function findClosestLegoColorIndex(r: number, g: number, b: number): number {
  const ri = r >> (8 - LUT_BITS)
  const gi = g >> (8 - LUT_BITS)
  const bi = b >> (8 - LUT_BITS)
  return lut[ri * LUT_LEVELS * LUT_LEVELS + gi * LUT_LEVELS + bi]!
}
