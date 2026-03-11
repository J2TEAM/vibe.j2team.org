/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Project 42 - Final Secret Scene (Cat Morph)
 */

export const catScene = {
  update: (
    positions: Float32Array,
    particlesCount: number,
    time: number,
    progress: number,
    catTargets: Float32Array | null,
    points?: any,
  ) => {
    // Range: 1320.0 (Starting after "meow" credits)
    const morphStart = 1320.0
    const catProgress = Math.min(1.0, Math.max(0, (progress - morphStart) / 30.0))

    if (catProgress <= 0 || !catTargets) return

    const colorAttr = points?.geometry?.attributes?.aColor
    const colors = colorAttr?.array as Float32Array | undefined

    // --- Phase 1: Cat Silhouette (Particles 0 - 7999) ---
    const silhouetteLimit = 8000
    const catCenterY = 1.5

    for (let i = 0; i < Math.min(particlesCount, silhouetteLimit, catTargets.length / 3); i++) {
      const i3 = i * 3
      if (i3 + 2 >= positions.length) break

      let tx = catTargets[i3] ?? 0
      let ty = (catTargets[i3 + 1] ?? 0) + catCenterY
      const tz = catTargets[i3 + 2] ?? 0

      // Weightless Floating ('Bồng bềnh') Logic
      if (catProgress > 0.5) {
        // Multi-frequency sine waves for more organic motion
        const floatWave =
          Math.sin(time * 1.5 + i * 0.05) * 0.12 + Math.cos(time * 0.5 + i * 0.1) * 0.05
        const driftX = Math.cos(time * 0.8 + i * 0.02) * 0.15
        const driftY = Math.sin(time * 1.2 + i * 0.03) * 0.15

        tx += driftX * catProgress
        ty += (driftY + floatWave) * catProgress
      }

      const curX = positions[i3] ?? 0
      const curY = positions[i3 + 1] ?? 0
      const curZ = positions[i3 + 2] ?? 0
      const factor = 0.05 + catProgress * 0.18

      positions[i3] = curX + (tx - curX) * factor
      positions[i3 + 1] = curY + (ty - curY) * factor
      positions[i3 + 2] = curZ + (tz - curZ) * factor

      // --- Digital Blue Color Convergence ---
      if (colors && i3 + 2 < colors.length) {
        const targetR = 0.22,
          targetG = 0.74,
          targetB = 0.97
        const cf = 0.08 * catProgress
        const r = colors[i3] ?? 0
        const g = colors[i3 + 1] ?? 0
        const b = colors[i3 + 2] ?? 0
        colors[i3] = r + (targetR - r) * cf
        colors[i3 + 1] = g + (targetG - g) * cf
        colors[i3 + 2] = b + (targetB - b) * cf
      }
    }

    // --- Phase 2: Radiating Aura ('Tỏa ra') ---
    // Use particles 8000-10000 to create an ethereal cloud around the cat.
    for (let i = silhouetteLimit; i < particlesCount; i++) {
      const i3 = i * 3
      if (i3 + 2 >= positions.length) break

      const seed = i * 0.123
      const phi = Math.acos(-1.0 + (2.0 * i) / particlesCount)
      const theta = Math.sqrt(particlesCount * Math.PI) * phi + time * 0.2

      // Target: Spherical shell expanding around the cat
      const radius = 8.0 + Math.sin(seed * 43.1 + time) * 3.0
      const tx = Math.cos(theta) * Math.sin(phi) * radius
      const ty = Math.sin(theta) * Math.sin(phi) * radius + catCenterY
      const tz = Math.cos(phi) * radius

      const curX = positions[i3] ?? 0
      const curY = positions[i3 + 1] ?? 0
      const curZ = positions[i3 + 2] ?? 0

      // Slower approach for a foggy/cloudy look
      positions[i3] = curX + (tx - curX) * 0.03
      positions[i3 + 1] = curY + (ty - curY) * 0.03
      positions[i3 + 2] = curZ + (tz - curZ) * 0.03

      if (colors && i3 + 2 < colors.length) {
        // Subtle azure glow for the aura
        colors[i3] = 0.22 * 0.5
        colors[i3 + 1] = 0.74 * 0.5
        colors[i3 + 2] = 0.97 * 0.5
      }
    }

    if (colorAttr) colorAttr.needsUpdate = true
  },
}
