/**
 * Low-level pixel / geometry helpers for destructible terrain.
 * These operate on raw ImageData — no Vue, no canvas refs.
 */

/** Set all pixels in a circle to transparent (alpha=0) on the given ImageData */
export function eraseCircle(imageData: ImageData, cx: number, cy: number, radius: number): void {
  const { data, width, height } = imageData
  const r2 = radius * radius

  const x0 = Math.max(0, Math.floor(cx - radius))
  const x1 = Math.min(width - 1, Math.ceil(cx + radius))
  const y0 = Math.max(0, Math.floor(cy - radius))
  const y1 = Math.min(height - 1, Math.ceil(cy + radius))

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx
      const dy = y - cy
      if (dx * dx + dy * dy <= r2) {
        const idx = (y * width + x) * 4
        data[idx + 3] = 0 // alpha = 0 → empty
      }
    }
  }
}

/** Returns true if the pixel at (x, y) is solid (alpha > 128) */
export function isSolidPixel(imageData: ImageData, x: number, y: number): boolean {
  const { data, width, height } = imageData
  const px = Math.floor(x)
  const py = Math.floor(y)
  if (px < 0 || px >= width || py < 0 || py >= height) return false
  const idx = (py * width + px) * 4
  return (data[idx + 3] ?? 0) > 128
}

/**
 * Sample N points along the bottom edge of a character bounding box
 * and return true if any is solid → character is grounded.
 */
export function isGrounded(
  imageData: ImageData,
  charX: number,
  charY: number,
  charW: number,
  charH: number,
): boolean {
  const bottom = charY + charH / 2 + 2 // 2px below feet
  const steps = 4
  for (let i = 0; i <= steps; i++) {
    const sx = charX - charW / 2 + (charW * i) / steps
    if (isSolidPixel(imageData, sx, bottom)) return true
  }
  return false
}

/**
 * Find the topmost solid Y at column x, searching from y down to maxY.
 * Returns -1 if no solid pixel found.
 */
export function findGroundY(imageData: ImageData, x: number, fromY: number, maxY: number): number {
  const px = Math.floor(x)
  const { data, width, height } = imageData
  if (px < 0 || px >= width) return -1

  for (let y = Math.floor(fromY); y <= Math.min(maxY, height - 1); y++) {
    const idx = (y * width + px) * 4
    if ((data[idx + 3] ?? 0) > 128) return y
  }
  return -1
}

/** Generate an array of terrain heights for a "hills" map profile */
export function generateHillsProfile(
  width: number,
  baseY: number,
  amplitude: number,
  seed: number,
): number[] {
  const heights: number[] = []
  for (let x = 0; x < width; x++) {
    const noise =
      Math.sin((x / width) * Math.PI * 4 + seed) * amplitude * 0.5 +
      Math.sin((x / width) * Math.PI * 7 + seed * 1.3) * amplitude * 0.3 +
      Math.sin((x / width) * Math.PI * 15 + seed * 2.1) * amplitude * 0.2
    heights.push(baseY + noise)
  }
  return heights
}

/** Fill terrain on a canvas context using a heights array */
export function drawTerrainFromProfile(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  heights: number[],
  canvasHeight: number,
  color: string,
): void {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, heights[0] ?? canvasHeight)
  for (let x = 1; x < heights.length; x++) {
    ctx.lineTo(x, heights[x] ?? canvasHeight)
  }
  ctx.lineTo(heights.length - 1, canvasHeight)
  ctx.lineTo(0, canvasHeight)
  ctx.closePath()
  ctx.fill()
}
