/**
 * Prologue Scene: Star Dust and Big Bang Gravity
 * Focus: Slow drift matching the "13.8 billion years ago... everything was nothing" period.
 */
export const prologueScene = {
  update: (positions: Float32Array, particlesCount: number, time: number, progress: number) => {
    // Normalizing 0.0 to 17.0 exactly to match scene length
    const p = Math.min(Math.max(progress / 17.0, 0), 1)

    // In Prologue (Drift), gravity is extremely low but builds toward the bang.
    const gravityStrength = 0.0001 + p * 0.0006

    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3
      if (i3 + 2 >= positions.length) break

      let x = positions[i3]!
      let y = positions[i3 + 1]!
      let z = positions[i3 + 2]!

      // 1. Vortex Swirl (Strictly around Z-axis for a "straight-on" look)
      // Faster rotation closer to center (Whirlpool effect)
      const dist2D = Math.sqrt(x * x + y * y)
      const swirlSpeed = (0.003 + p * 0.005) * (5.0 / (dist2D + 2.0))

      const cosA = Math.cos(swirlSpeed)
      const sinA = Math.sin(swirlSpeed)

      const rotatedX = x * cosA - y * sinA
      const rotatedY = x * sinA + y * cosA

      x = rotatedX
      y = rotatedY

      // 2. Gravitational pull towards a central "Singularity" point
      // Slightly deeper than 0 to create a tunnel feel (looking into the screen)
      const targetZ = -5.0
      const dx = -x
      const dy = -y
      const dz = targetZ - z
      const dist3D = Math.sqrt(x * x + y * y + dz * dz)

      // Respawn logic: If it reaches the center, throw it back far away
      if (dist3D < 1.0) {
        const radius = 25 + Math.random() * 15
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(Math.random() * 2 - 1)

        x = radius * Math.sin(phi) * Math.cos(theta)
        y = radius * Math.sin(phi) * Math.sin(theta)
        // Start them from the sides and front to let them be pulled "in"
        z = 10 + Math.random() * 20
      } else {
        const force = gravityStrength * (1.5 + 2.0 / (dist3D + 0.5))

        x += (dx / dist3D) * force
        y += (dy / dist3D) * force
        z += (dz / dist3D) * force

        // Semi-free floating noise
        x += Math.sin(time * 0.3 + i * 0.1) * 0.005
        y += Math.cos(time * 0.4 + i * 0.1) * 0.005
        z += Math.sin(time * 0.2 + i * 0.1) * 0.005
      }

      positions[i3] = x
      positions[i3 + 1] = y
      positions[i3 + 2] = z
    }
  },
}
