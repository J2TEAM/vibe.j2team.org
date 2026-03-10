/* eslint-disable @typescript-eslint/no-explicit-any */
export const matrixScene = {
  update: (
    positions: Float32Array,
    particlesCount: number,
    time: number,
    progress: number,
    points?: any,
  ) => {
    // Initial appearance (0 1 rain)
    const settleProgress = Math.min(1.0, Math.max(0, (progress - 260.0) / 15.0))

    // "two symbols" - Closing in (275.0 -> 315.0)
    const compressProgress = Math.min(1.0, Math.max(0, (progress - 275.0) / 40.0))

    const colorAttr = points?.geometry?.attributes?.aColor
    const colors = colorAttr?.array as Float32Array | undefined

    const colCount = Math.floor(particlesCount / 50)
    const colSpacing = 0.7 - compressProgress * 0.45 // Xích lại gần nhau hơn x0.25 dày đặc

    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3
      if (i3 + 2 >= positions.length) break

      const colIdx = i % colCount
      const rowIdx = Math.floor(i / colCount)

      const layer = Math.floor(colIdx / 4) % 3
      const direction = colIdx % 2 === 0 ? 1 : -1

      // X: Organizing into a dense wall
      const targetX = (colIdx - colCount / 2) * colSpacing

      // Vertical speed slows down during compression (anticipation)
      const stopSpeed = 1.0 - compressProgress * 0.92
      const baseSpeed =
        (layer === 0
          ? 1.4 + (colIdx % 8) * 0.12
          : layer === 1
            ? 0.8 + (colIdx % 8) * 0.09
            : 0.4 + (colIdx % 8) * 0.06) * stopSpeed

      const vSpace = 80.0
      const vOff = rowIdx * 1.0

      // Keep it moving with scroll even when time-speed is low
      const scrollDrift = (progress - 260.0) * 1.5

      const targetY =
        direction === 1
          ? 40.0 - ((time * baseSpeed * 12.0 + scrollDrift + vOff) % vSpace)
          : -40.0 + ((time * baseSpeed * 12.0 + scrollDrift + vOff) % vSpace)

      // Z: Pulling the layers together into a flat slab
      const startZ = layer === 0 ? 8.0 : layer === 1 ? -10.0 : -28.0
      const targetZ = startZ + (0 - startZ) * compressProgress * 0.8

      const brightness =
        (layer === 0 ? 1.0 : layer === 1 ? 0.55 : 0.25) * (1.0 + compressProgress * 0.5)

      const curX = positions[i3] ?? 0
      const curY = positions[i3 + 1] ?? 0
      const curZ = positions[i3 + 2] ?? 0

      // Faster lerp during "two symbols" to ensure organization
      const lerp = (0.04 + settleProgress * 0.1) * (1.0 + compressProgress * 0.5)

      positions[i3] = curX + (targetX - curX) * lerp
      positions[i3 + 1] = curY + (targetY - curY) * lerp
      positions[i3 + 2] = curZ + (targetZ - curZ) * lerp

      if (colors && i3 + 2 < colors.length) {
        colors[i3] = 0.22 * brightness
        colors[i3 + 1] = 0.74 * brightness
        colors[i3 + 2] = 0.97 * brightness
      }
    }

    if (colorAttr) colorAttr.needsUpdate = true
  },
}
