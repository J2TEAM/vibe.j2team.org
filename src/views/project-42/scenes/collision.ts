/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Project 42 - The Great Collision Scene
 * Digital-DNA (Static) meets Bio-DNA (Incoming) and they SHATTER.
 */

export const collisionScene = {
  update: (
    positions: Float32Array,
    particlesCount: number,
    time: number,
    progress: number,
    points?: any,
  ) => {
    // Range: 510.0 -> 585.0
    // Stage 1: Incoming (510 -> 535)
    // Stage 2: Shatter/Explode (535 -> 585)

    const incomingProgress = Math.min(1.0, Math.max(0, (progress - 510.0) / 25.0))
    const shatterProgress = Math.min(1.0, Math.max(0, (progress - 535.0) / 50.0))

    const colorAttr = points?.geometry?.attributes?.aColor
    const colors = colorAttr?.array as Float32Array | undefined
    const skyBlue = { r: 0.22, g: 0.74, b: 0.97 }
    const coral = { r: 1.0, g: 0.42, b: 0.29 }
    const amber = { r: 1.0, g: 0.78, b: 0.22 }

    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3
      if (i3 + 2 >= positions.length) break

      const pRatio = i / particlesCount
      const strand = i % 2 === 0 ? 1.0 : -1.0
      const isBioSide = strand === 1.0

      // Helix Geometry Base
      const hHeight = 85.0
      const hTwists = 10.0 * Math.PI
      const hRad = 7.5
      const baseAng = pRatio * hTwists + time * 0.5 // Slow rotation during collision

      // Digital side starts from split pos (-15) and moves to center
      // Bio side starts from split pos (+15) then sweeps in from far left (-80)
      const splitStart = strand * 15.0
      let offsetX = 0
      if (isBioSide) {
        offsetX = splitStart - 80.0 * (1.0 - incomingProgress)
      } else {
        offsetX = splitStart * (1.0 - incomingProgress)
      }

      // Position targets
      let tx = Math.cos(baseAng) * hRad * strand + offsetX
      let ty = (pRatio - 0.5) * hHeight
      let tz = Math.sin(baseAng) * hRad * strand

      // --- SHATTER LOGIC (Văng tung tóe) ---
      // Powerful explosive energy from center
      const seed = i * 0.123
      const ex = Math.sin(seed * 43.1) * 50.0 * shatterProgress
      const ey = Math.cos(seed * 27.4) * 50.0 * shatterProgress
      const ez = Math.cos(seed * 11.2) * 50.0 * shatterProgress

      tx += ex
      ty += ey
      tz += ez - 5.0

      const curX = positions[i3] ?? 0
      const curY = positions[i3 + 1] ?? 0
      const curZ = positions[i3 + 2] ?? 0
      const lerp = 0.08

      positions[i3] = curX + (tx - curX) * lerp
      positions[i3 + 1] = curY + (ty - curY) * lerp
      positions[i3 + 2] = curZ + (tz - curZ) * lerp

      // Color Morph: Bio side stays SkyBlue initially then turns coral upon arrival
      if (colors && i3 + 2 < colors.length) {
        let fr = skyBlue.r,
          fg = skyBlue.g,
          fb = skyBlue.b
        if (isBioSide) {
          const cTarget = i % 4 < 2 ? coral : amber
          fr = skyBlue.r + (cTarget.r - skyBlue.r) * incomingProgress
          fg = skyBlue.g + (cTarget.g - skyBlue.g) * incomingProgress
          fb = skyBlue.b + (cTarget.b - skyBlue.b) * incomingProgress
        }
        colors[i3] = fr
        colors[i3 + 1] = fg
        colors[i3 + 2] = fb
      }
    }
    if (colorAttr) colorAttr.needsUpdate = true
  },
}
