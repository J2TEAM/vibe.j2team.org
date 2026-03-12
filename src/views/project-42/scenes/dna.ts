/* eslint-disable @typescript-eslint/no-explicit-any */
export const dnaScene = {
  update: (
    positions: Float32Array,
    particlesCount: number,
    time: number,
    progress: number,
    earth?: any,
    gsap?: any,
    points?: any,
  ) => {
    // DNA helix: appears 56.0 -> 95.0 (Extended duration for majestic formation)
    const helixProgress = Math.min(1.0, Math.max(0, (progress - 56.0) / 39.0))

    const colorAttr = points?.geometry?.attributes?.aColor
    const colors = colorAttr?.array as Float32Array | undefined

    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3
      if (i3 + 2 >= positions.length) break

      const currentX = positions[i3] ?? 0
      const currentY = positions[i3 + 1] ?? 0
      const currentZ = positions[i3 + 2] ?? 0
      const side = i % 2 === 0 ? 1 : -1

      const baseHelixY = (i / particlesCount) * 46 - 23
      const helixAngle = baseHelixY * 0.48 + time * 0.8
      const helixRadius = 5.4

      const tx = Math.cos(helixAngle) * helixRadius * side + Math.sin(time * 0.5 + i) * 0.15
      const ty = baseHelixY + Math.cos(time * 0.3 + i) * 0.12
      const tz = Math.sin(helixAngle) * helixRadius * side + Math.cos(time * 0.4 + i) * 0.15

      const show = Math.min(helixProgress * 1.5, 1.0)

      if (show > 0) {
        const speed = 0.22 * show
        positions[i3] = currentX + (tx - currentX) * speed
        positions[i3 + 1] = currentY + (ty - currentY) * speed
        positions[i3 + 2] = currentZ + (tz - currentZ) * speed

        if (colors && i3 + 2 < colors.length) {
          const r = colors[i3] ?? 1.0
          const g = colors[i3 + 1] ?? 1.0
          const b = colors[i3 + 2] ?? 1.0
          const tR = side === 1 ? 1.0 : 1.0
          const tG = side === 1 ? 0.42 : 0.72
          const tB = side === 1 ? 0.29 : 0.19
          colors[i3] = r + (tR - r) * 0.1 * show
          colors[i3 + 1] = g + (tG - g) * 0.1 * show
          colors[i3 + 2] = b + (tB - b) * 0.1 * show
        }
      }
    }
    if (colorAttr) colorAttr.needsUpdate = true
  },
}
