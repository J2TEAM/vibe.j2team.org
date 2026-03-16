/* eslint-disable @typescript-eslint/no-explicit-any */
export const atgcScene = {
  update: (
    positions: Float32Array,
    particlesCount: number,
    time: number,
    progress: number,
    points?: any,
  ) => {
    // Cinematic: letters breathe (72.0 -> 93.0), then digital shift (93.0 -> 97.0)
    const letterProgress = 1.0 // Already formed by dnaToAtgc scene
    const breathe = Math.sin(time * 1.2) * 0.04 + 1.0

    const colorAttr = points?.geometry?.attributes?.aColor
    const pColors = colorAttr?.array as Float32Array | undefined

    // Slow Cooling Transition: Amber/Coral -> Sky Blue (180.0 -> 215.0)
    const isDigitalTransition = progress >= 180.0
    const digitalRatio = Math.min(1.0, Math.max(0, (progress - 180.0) / 35.0))

    // Shatter Logic (230.0 -> 285.0)
    const isShattering = progress >= 230.0
    const shatterRatio = Math.min(1.0, Math.max(0, (progress - 230.0) / 55.0))

    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3
      if (i3 + 2 >= positions.length) break

      const currentX = positions[i3] ?? 0
      const currentY = positions[i3 + 1] ?? 0
      const currentZ = positions[i3 + 2] ?? 0

      // ATGC LETTERS (Target positions)
      let codeX = 0,
        codeY = 0
      const bucket = i % 4
      const pIdx = Math.floor(i / 4)
      const ratio = pIdx / (particlesCount / 4)

      const thickSeed = Math.sin(i * 127.1 + bucket * 43.7) * 0.5 + 0.5
      const thick = (thickSeed - 0.5) * 2.8
      const thickP = Math.cos(i * 311.7) * 1.5

      const isPortrait = window.innerHeight > window.innerWidth
      const adaptiveGap = isPortrait ? 5.2 : 8.2
      const gap = adaptiveGap
      const totalWidth = gap * 3

      let extraOff = 0
      if (bucket === 0) extraOff = 0.8 * (isPortrait ? 0.6 : 1.0)
      if (bucket === 2) extraOff = 1.0 * (isPortrait ? 0.6 : 1.0)
      if (bucket === 3) extraOff = 3.2 * (isPortrait ? 0.6 : 1.0)

      const startX = -(totalWidth / 2) + bucket * gap + extraOff - (isPortrait ? 1.0 : 2.0)
      const scale = (isPortrait ? 2.2 : 3.6) * breathe

      if (bucket === 0) {
        // A
        if (ratio < 0.38) {
          const t = ratio / 0.38
          codeX = startX - scale * 0.6 + t * scale * 0.6 + thick * 0.45
          codeY = -scale + t * scale * 2.0 + thickP * 0.35
        } else if (ratio < 0.76) {
          const t = (ratio - 0.38) / 0.38
          codeX = startX + t * scale * 0.6 + thick * 0.45
          codeY = scale - t * scale * 2.0 + thickP * 0.35
        } else {
          const t = (ratio - 0.76) / 0.24
          codeX = startX - scale * 0.3 + t * scale * 0.6 + thick * 0.35
          codeY = -scale * 0.15 + thickP * 0.4
        }
      } else if (bucket === 1) {
        // T
        if (ratio < 0.35) {
          const t = ratio / 0.35
          codeX = startX - scale * 0.65 + t * scale * 1.3 + thick * 0.35
          codeY = scale + thickP * 0.35
        } else {
          const t = (ratio - 0.35) / 0.65
          codeX = startX + thick * 0.45
          codeY = scale - t * scale * 2.0 + thickP * 0.3
        }
      } else if (bucket === 2) {
        // G
        if (ratio < 0.68) {
          const ang = (ratio / 0.68) * 1.7 * Math.PI + 0.5
          const r = scale * 0.95 + thick * 0.35
          codeX = startX + Math.cos(ang) * r
          codeY = Math.sin(ang) * scale * 0.95 + thickP * 0.3
        } else {
          const t = (ratio - 0.68) / 0.32
          codeX = startX + scale * 0.2 + (1 - t) * scale * 0.7 + thick * 0.35
          codeY = -scale * 0.05 + thickP * 0.35
        }
      } else {
        // C
        const ang = 0.8 + ratio * 4.7
        const r = scale * 0.95 + thick * 0.4
        codeX = startX + Math.cos(ang) * r - scale * 0.05
        codeY = Math.sin(ang) * scale * 1.0 + thickP * 0.25
      }

      // Final Target with Shatter/Dissolve
      const tx = codeX
      const ty = codeY

      const seed = i * 0.123
      const driftX = Math.sin(seed * 43.1 + time * 0.5) * 12.0 * shatterRatio
      const driftY = Math.cos(seed * 31.7 + time * 0.4) * 8.0 * shatterRatio
      const driftZ = Math.sin(seed * 27.5 + time * 0.3) * 15.0 * shatterRatio

      const jitterAmp = 0.008 + shatterRatio * 0.1
      const jitter = jitterAmp * Math.sin(time * 50.0 + i)

      const targetX = tx + jitter + Math.sin(time * 0.4 + i) * 0.02 + driftX
      const targetY = ty + jitter + Math.cos(time * 0.3 + i) * 0.02 + driftY
      const targetZ = driftZ // Dissolve depth

      const speed = isShattering ? 0.05 : 0.25

      positions[i3] = currentX + (targetX - currentX) * speed
      positions[i3 + 1] = currentY + (targetY - currentY) * speed
      positions[i3 + 2] = currentZ + (targetZ - currentZ) * speed

      // COLORS — Vivid Biological -> Digital Blue Shift
      if (pColors && i3 + 2 < pColors.length) {
        let tr = 1.0,
          tg = 1.0,
          tb = 1.0

        if (letterProgress > 0.1) {
          const lp = Math.min(1, (letterProgress - 0.1) / 0.5)
          let gr = 1.0,
            gg = 0.42,
            gb = 0.29
          if (bucket === 0) {
            gr = 1.0
            gg = 0.42
            gb = 0.29
          } // A → Coral
          if (bucket === 1) {
            gr = 1.0
            gg = 0.78
            gb = 0.22
          } // T → Amber
          if (bucket === 2) {
            gr = 0.25
            gg = 0.78
            gb = 1.0
          } // G → Sky
          if (bucket === 3) {
            gr = 1.0
            gg = 0.5
            gb = 0.4
          } // C → Warm Coral

          tr = 1.0 + (gr - 1.0) * lp
          tg = 1.0 + (gg - 1.0) * lp
          tb = 1.0 + (gb - 1.0) * lp

          // DIGITAL SHIFT (Coral/Amber -> Sky Blue #38BDF8)
          if (isDigitalTransition) {
            const targetSkyR = 0.22
            const targetSkyG = 0.74
            const targetSkyB = 0.97
            tr = tr + (targetSkyR - tr) * digitalRatio
            tg = tg + (targetSkyG - tg) * digitalRatio
            tb = tb + (targetSkyB - tb) * digitalRatio

            // Fade out as it shatters to give air for 0 1
            if (isShattering) {
              const fade = 1.0 - shatterRatio * 0.8
              tr *= fade
              tg *= fade
              tb *= fade
            }
          }
        }

        pColors[i3] = tr
        pColors[i3 + 1] = tg
        pColors[i3 + 2] = tb
      }
    }
    if (colorAttr) colorAttr.needsUpdate = true
  },
}
