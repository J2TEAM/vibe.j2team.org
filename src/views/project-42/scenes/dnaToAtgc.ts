/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Scene: DNA Transition to ATGC
 * Range: 61.0 -> 72.0
 * Logic: Shatter DNA Helix -> Free Drift -> Initial Organization
 */
export const dnaToAtgcScene = {
  update: (
    positions: Float32Array,
    particlesCount: number,
    time: number,
    progress: number,
    points?: any,
  ) => {
    // 95.0 -> 105.0: Shatter Helix
    // 105.0 -> 115.0: Free Drift (Void/Silence)
    // 115.0 -> 145.0: Organizing towards 4 buckets (Blobs)

    const shatterProgress = Math.min(1.0, Math.max(0, (progress - 95.0) / 10.0))
    const driftProgress = Math.min(1.0, Math.max(0, (progress - 105.0) / 10.0))
    const organizeProgress = Math.min(1.0, Math.max(0, (progress - 115.0) / 30.0))

    const colorAttr = points?.geometry?.attributes?.aColor
    const colors = colorAttr?.array as Float32Array | undefined

    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3
      if (i3 + 2 >= positions.length) break

      let x = positions[i3]!
      let y = positions[i3 + 1]!
      let z = positions[i3 + 2]!

      // 1. Initial State: Small drift/noise
      const noiseX = Math.sin(time * 0.4 + i) * 0.05
      const noiseY = Math.cos(time * 0.3 + i) * 0.05
      const noiseZ = Math.sin(time * 0.5 + i) * 0.05

      if (shatterProgress > 0 && driftProgress === 0) {
        // Shattering: Push away from center helix
        const pushForce = shatterProgress * 0.5
        x += (x / (Math.abs(x) + 1.0)) * pushForce
        z += (z / (Math.abs(z) + 1.0)) * pushForce
      }

      if (driftProgress > 0 && organizeProgress === 0) {
        // Floating freely in the void
        x += Math.sin(time * 0.2 + i * 0.1) * 0.02
        y += Math.cos(time * 0.2 + i * 0.1) * 0.02
        z += Math.sin(time * 0.1 + i * 0.1) * 0.02
      }

      if (organizeProgress > 0) {
        const isPortrait = window.innerHeight > window.innerWidth
        const bucket = i % 4
        const targetX = (bucket - 1.5) * (isPortrait ? 4.5 : 8.0)
        const targetY = Math.sin(time + i * 0.1) * 2.0
        const targetZ = Math.cos(time + i * 0.1) * 2.0

        const speed = organizeProgress * 0.05
        x += (targetX - x!) * speed
        y += (targetY - y!) * speed
        z += (targetZ - z!) * speed
      }

      positions[i3] = x + noiseX
      positions[i3 + 1] = y + noiseY
      positions[i3 + 2] = z + noiseZ

      // Keep colors as Coral/Amber during this transition
      if (colors && i3 + 2 < colors.length) {
        const bucket = i % 4
        let tr = 1.0,
          tg = 0.5,
          tb = 0.3 // Default Coral
        if (bucket === 1) {
          tg = 0.7
          tb = 0.2
        } // Amber
        if (bucket === 2) {
          tr = 0.4
          tg = 0.8
        } // Greenish/Cyan hint

        const curR = colors[i3] ?? 0
        const curG = colors[i3 + 1] ?? 0
        const curB = colors[i3 + 2] ?? 0
        colors[i3] = curR + (tr - curR) * 0.05
        colors[i3 + 1] = curG + (tg - curG) * 0.05
        colors[i3 + 2] = curB + (tb - curB) * 0.05
      }
    }

    if (colorAttr) colorAttr.needsUpdate = true
  },
}
