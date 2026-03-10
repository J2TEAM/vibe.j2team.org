/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Project 42 - Digital DNA Scene (Refined Era)
 * 1. Sudden Shatter (255 -> 265): "Then it asked" triggers the break.
 * 2. Helix Reassembly (265 -> 285): Formation of majestic Digital DNA.
 * 3. Stable Rotation (285 -> 305): Hold and reflect machine life before collision.
 */

export const digitalDnaScene = {
  update: (
    positions: Float32Array,
    particlesCount: number,
    time: number,
    progress: number,
    points?: any,
  ) => {
    const shatterThreshold = 405.0 // "Then it asked" triggers shatter
    const holdThreshold = 450.0 // "What makes you alive" coincides with formation
    const splitThreshold = 480.0 // "Tách ra" prepare for collision

    const breakProgress = Math.min(1.0, Math.max(0, (progress - shatterThreshold) / 10.0))
    const helixProgress = Math.min(1.0, Math.max(0, (progress - shatterThreshold) / 45.0))
    const holdProgress = Math.min(1.0, Math.max(0, (progress - holdThreshold) / 60.0))
    const splitProgress = Math.min(1.0, Math.max(0, (progress - splitThreshold) / 30.0))

    const colorAttr = points?.geometry?.attributes?.aColor
    const colors = colorAttr?.array as Float32Array | undefined
    const skyBlue = { r: 0.22, g: 0.74, b: 0.97 }

    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3
      if (i3 + 2 >= positions.length) break

      // --- 1. SOURCE: ROTATING CUBE (State at 255.0) ---
      const face = i % 6
      const side = 13.0
      const faceCount = particlesCount / 6
      const grid = Math.ceil(Math.sqrt(faceCount))
      const fi = (i % faceCount) % grid
      const fj = Math.floor((i % faceCount) / grid)
      const gu = (fi / grid - 0.5) * side
      const gv = (fj / grid - 0.5) * side
      const hSide = side * 0.5

      let cx = 0,
        cy = 0,
        cz = 0
      if (face === 0) {
        cx = gu
        cy = gv
        cz = hSide
      } else if (face === 1) {
        cx = gu
        cy = gv
        cz = -hSide
      } else if (face === 2) {
        cx = hSide
        cy = gu
        cz = gv
      } else if (face === 3) {
        cx = -hSide
        cy = gu
        cz = gv
      } else if (face === 4) {
        cx = gu
        cy = hSide
        cz = gv
      } else {
        cx = gu
        cy = -hSide
        cz = gv
      }

      const rotX = time * 0.4
      const rotY = time * 0.6
      const rx = cx * Math.cos(rotY) - cz * Math.sin(rotY)
      let rz = cx * Math.sin(rotY) + cz * Math.cos(rotY)
      const ry = cy * Math.cos(rotX) - rz * Math.sin(rotX)
      rz = cy * Math.sin(rotX) + rz * Math.cos(rotX)

      // Deterministic Shatter (Stored as source for Helix transition)
      const seed = i * 0.123
      const burst = breakProgress * (1.0 - helixProgress * 0.5)
      const ex = Math.sin(seed * 43.1) * 45.0 * burst
      const ey = Math.cos(seed * 27.4) * 45.0 * burst
      const ez = Math.sin(seed * 11.2) * 45.0 * burst

      const sourceX = rx + ex
      const sourceY = ry + ey
      const sourceZ = rz - 5.0 + ez

      // --- 2. TARGET: MAJESTIC DIGITAL DNA HELIX ---
      const pRatio = i / particlesCount
      const hHeight = 85.0
      const hTwists = 10.0 * Math.PI
      const hRad = 7.5
      const hAng = pRatio * hTwists + time * 0.6 // Active rotation while on-screen

      const isRung = i % 5 === 0
      let tx_h = 0,
        ty_h = 0,
        tz_h = 0
      const strand = i % 2 === 0 ? 1.0 : -1.0
      const base_y = (pRatio - 0.5) * hHeight

      if (!isRung) {
        tx_h = Math.cos(hAng) * hRad * strand
        ty_h = base_y
        tz_h = Math.sin(hAng) * hRad * strand
      } else {
        const rungIdx = Math.floor(pRatio * 20.0) / 20.0
        const rungAng = rungIdx * hTwists + time * 0.6
        const barPos = ((i % 100) / 100.0) * 2.0 - 1.0
        tx_h = Math.cos(rungAng) * hRad * barPos
        ty_h = (rungIdx - 0.5) * hHeight
        tz_h = Math.sin(rungAng) * hRad * barPos
      }

      // splitting effect: Move strands apart on X before collision
      tx_h += strand * 15.0 * splitProgress

      const chipU = ((i % 10) / 10.0 - 0.5) * 1.8
      const chipV = ((Math.floor(i / 10) % 10) / 10.0 - 0.5) * 1.8

      const targetHelixX = tx_h + chipU
      const targetHelixY = ty_h + chipV
      const targetHelixZ = tz_h

      // --- 3. BLENDING ---
      const tx = sourceX + (targetHelixX - sourceX) * helixProgress
      const ty = sourceY + (targetHelixY - sourceY) * helixProgress
      const tz = sourceZ + (targetHelixZ - sourceZ) * helixProgress

      const curX = positions[i3] ?? 0
      const curY = positions[i3 + 1] ?? 0
      const curZ = positions[i3 + 2] ?? 0
      const lerp = 0.08 + holdProgress * 0.04

      positions[i3] = curX + (tx - curX) * lerp
      positions[i3 + 1] = curY + (ty - curY) * lerp
      positions[i3 + 2] = curZ + (tz - curZ) * lerp

      if (colors && i3 + 2 < colors.length) {
        const pulse = 0.85 + Math.sin(time * 1.5 + pRatio * 10.0) * 0.15 * holdProgress
        colors[i3] = skyBlue.r * pulse
        colors[i3 + 1] = skyBlue.g * pulse
        colors[i3 + 2] = skyBlue.b * pulse
      }
    }
    if (colorAttr) colorAttr.needsUpdate = true
  },
}
