/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Project 42 - Hybrid DNA Union Scene
 * The fusion of Bio-DNA (organic curves) and Digital-DNA (structured ladder).
 */

export const hybridScene = {
  update: (
    positions: Float32Array,
    particlesCount: number,
    time: number,
    progress: number,
    points?: any,
  ) => {
    // Range: 510.0 -> 1320.0 (Extended timeline)
    const unionStart = 515.0 // Gathering shards
    const ascentStart = 665.0 // Ascent begins
    const dissolutionStart = 665.0 // "Vừa kéo lên vừa rã nhẹ"

    const unionProgress = Math.min(1.0, Math.max(0, (progress - unionStart) / 80.0))
    const ascentProgress = Math.min(1.0, Math.max(0, (progress - ascentStart) / 655.0))
    const aliveProgress = Math.min(1.0, Math.max(0, (progress - dissolutionStart) / 655.0))

    const yDescent = ascentProgress * -85.0 // Sinking the structure so the viewer "rises" to the peak

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

      // --- 1. GEOMETRY PARAMETERS ---
      const hHeight = 85.0
      const hTwists = 10.0 * Math.PI
      const hRad = 7.5
      // The hybrid DNA now rotates as a single unit
      const hAng = pRatio * hTwists + time * 0.4

      // --- 2. THE THREE SOULS ---
      const isRung = i % 5 === 0
      const isBioStrand = strand === 1.0 && !isRung
      const isDigitalStrand = strand === -1.0 && !isRung

      let tx = 0,
        ty = 0,
        tz = 0
      const base_y = (pRatio - 0.5) * hHeight

      if (isDigitalStrand) {
        // DIGITAL: Sharp, structured with character-box feel
        const chipU = ((i % 10) / 10.0 - 0.5) * 1.5
        const chipV = ((Math.floor(i / 10) % 10) / 10.0 - 0.5) * 1.5
        tx = Math.cos(hAng) * hRad * strand + chipU
        ty = base_y + chipV
        tz = Math.sin(hAng) * hRad * strand
      } else if (isBioStrand) {
        // BIOLOGICAL: Organic, thicker, wavy stardust feel
        const organicWarp = Math.sin(time * 0.5 + pRatio * 15.0) * 0.8
        const orbitU = Math.sin(i * 0.5) * 1.2
        const orbitV = Math.cos(i * 0.3) * 1.2
        tx = Math.cos(hAng) * (hRad + organicWarp) * strand + orbitU
        ty = base_y + orbitV
        tz = Math.sin(hAng) * (hRad + organicWarp) * strand
      } else {
        // RUNGS: The bridge connecting both
        const rungRatio = Math.floor(pRatio * 20.0) / 20.0
        const rungAng = rungRatio * hTwists + time * 0.4 // Sync with strand rotation
        const barPos = ((i % 100) / 100.0) * 2.0 - 1.0

        // X spans between Digital side (-hRad) and Bio side (+hRad)
        const dX = -Math.cos(rungAng) * hRad
        const bX = Math.cos(rungAng) * hRad
        tx = dX + (bX - dX) * ((barPos + 1.0) * 0.5)
        ty = (rungRatio - 0.5) * hHeight
        tz = Math.sin(rungAng) * hRad * barPos
      }

      // --- 3. SOURCE: Chaos from Collision ---
      const seed = i * 0.456
      const sx = tx + Math.sin(seed * 22.1) * 40.0 * (1.0 - unionProgress)
      const sy = ty + Math.cos(seed * 31.4) * 40.0 * (1.0 - unionProgress)
      const sz = tz + Math.sin(seed * 11.2) * 40.0 * (1.0 - unionProgress)

      // --- 4. FINAL POSITIONING ---
      let fx = sx + (tx - sx) * unionProgress
      let fy = sy + (ty - sy) * unionProgress + yDescent
      const fz = sz + (tz - sz) * unionProgress

      // Dissolution (Gentle drift upwards as we reach the peak)
      const isEcho = i % 15 === 0
      if (aliveProgress > 0) {
        // "Rã nhẹ nhàng" - non-linear power curve for very slow start
        const flowFactor = Math.pow(aliveProgress, 2.2)
        if (!isEcho) {
          fy += flowFactor * 85.0
          fx += Math.sin(time * 0.2 + i * 0.1) * 20.0 * flowFactor
        } else {
          const s = i * 1.2
          fx += (Math.sin(time * 0.2 + s) * 45.0 - fx) * flowFactor
          fy += (Math.cos(time * 0.3 + s) * 55.0 - fy) * flowFactor
        }
      }

      const curX = positions[i3] ?? 0
      const curY = positions[i3 + 1] ?? 0
      const curZ = positions[i3 + 2] ?? 0
      const lerp = 0.08 + unionProgress * 0.04

      positions[i3] = curX + (fx - curX) * lerp
      positions[i3 + 1] = curY + (fy - curY) * lerp
      positions[i3 + 2] = curZ + (fz - curZ) * lerp

      // --- 5. COLOR: THE MASTER HYBRID ---
      if (colors && i3 + 2 < colors.length) {
        let fr = 0,
          fg = 0,
          fb = 0

        if (isDigitalStrand) {
          fr = skyBlue.r
          fg = skyBlue.g
          fb = skyBlue.b
        } else if (isBioStrand) {
          const cTarget = i % 4 < 2 ? coral : amber
          fr = cTarget.r
          fg = cTarget.g
          fb = cTarget.b
        } else {
          // Rungs blend across the bridge
          const barP = (i % 100) / 100.0 // 0 (Digital side) to 1 (Bio side)
          const cTarget = i % 4 < 2 ? coral : amber
          fr = skyBlue.r + (cTarget.r - skyBlue.r) * barP
          fg = skyBlue.g + (cTarget.g - skyBlue.g) * barP
          fb = skyBlue.b + (cTarget.b - skyBlue.b) * barP
        }

        if (!isEcho && aliveProgress > 0) {
          // Slow color fade
          const f = Math.max(0, 1.0 - Math.pow(aliveProgress, 1.8) * 1.5)
          fr *= f
          fg *= f
          fb *= f
        }
        colors[i3] = fr
        colors[i3 + 1] = fg
        colors[i3 + 2] = fb
      }
    }
    if (colorAttr) colorAttr.needsUpdate = true
  },
}
