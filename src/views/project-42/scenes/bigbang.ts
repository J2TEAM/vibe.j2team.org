/**
 * Big Bang Scene: The Singularity and the Great Explosion
 * Focus: High-intensity elliptical compression and omnidirectional blast
 */
export const bigBangScene = {
  update: (positions: Float32Array, particlesCount: number, time: number, progress: number) => {
    // Stage: Compression (17.0 to 24.0) -> "pressure beyond measure"
    // Stage: Explosion (Starts at exactly 24.0, matching "until it wasn't")

    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3
      if (i3 + 2 >= positions.length) break

      if (progress < 24.0) {
        // --- THE SINGULARITY (Centered Elliptical Disc) ---
        // Maps 17.0 -> 24.0 (Gap = 7.0) to a tightening scalar [0, 1]
        const pNormalized = Math.min(Math.max((progress - 17.0) / 7.0, 0), 1)
        const intensity = Math.pow(pNormalized, 4.0)
        const x = positions[i3] ?? 0
        const y = positions[i3 + 1] ?? 0
        const z = positions[i3 + 2] ?? 0

        // Front-Facing XY Rotation (Spins faster as pressure builds)
        const rotS = 0.04 + intensity * 0.1
        const cosR = Math.cos(rotS)
        const sinR = Math.sin(rotS)
        const rx = x * cosR - y * sinR
        const ry = x * sinR + y * cosR

        // Gentle pull & vertical squeeze for Ellipse
        const pull = 1.0 - 0.02 * intensity
        const flattenY = 1.0 - 0.15 * intensity

        positions[i3] = rx * pull
        positions[i3 + 1] = ry * pull * flattenY
        positions[i3 + 2] = z * pull

        // Anti-drift Jitter (Trembling under pressure)
        const wave = Math.sin(time * 15.0 + i) * 1.5 * intensity
        positions[i3] = (positions[i3] ?? 0) + wave
        positions[i3 + 1] = (positions[i3 + 1] ?? 0) + wave * 0.3
        positions[i3 + 2] = (positions[i3 + 2] ?? 0) + wave * 0.6
      } else {
        // --- THE EXPLOSION (Văng tung tóe & Lơ lửng) ---
        const age = Math.max(0, progress - 24.0)

        // Seed-based randomness for individual particle behavior
        const seed = i * 0.1234
        const variant = (Math.sin(seed * 43.1) + 1.0) * 0.5 // [0, 1]

        // Burst Force: Some are super fast, some are slow (debris)
        const initialPush = 2.5 + variant * 3.5
        const speed = initialPush / (age * 0.8 + 0.4)

        // Spherical distribution with slight deterministic jitter (noise)
        const phi = Math.acos(-1.0 + (2.0 * i) / particlesCount)
        const theta = Math.sqrt(particlesCount * Math.PI) * phi

        const noiseX = Math.sin(seed * 11.2 + time) * 0.2
        const noiseY = Math.cos(seed * 27.5 + time) * 0.2
        const noiseZ = Math.sin(seed * 31.4 + time) * 0.2

        const dirX = Math.cos(theta) * Math.sin(phi) + noiseX
        const dirY = Math.sin(theta) * Math.sin(phi) + noiseY
        const dirZ = Math.cos(phi) + noiseZ

        // Apply force + drift
        positions[i3] = (positions[i3] ?? 0) + dirX * speed * 0.15
        positions[i3 + 1] = (positions[i3 + 1] ?? 0) + dirY * speed * 0.15
        positions[i3 + 2] = (positions[i3 + 2] ?? 0) + dirZ * speed * 0.15

        // Extra "Debris" Linger: Add very light floating motion
        const floatProgress = Math.min(1.0, age / 9.0)
        positions[i3] = (positions[i3] ?? 0) + Math.sin(time * 0.5 + seed) * 0.02 * floatProgress
        positions[i3 + 1] =
          (positions[i3 + 1] ?? 0) + Math.cos(time * 0.6 + seed) * 0.02 * floatProgress
        positions[i3 + 2] =
          (positions[i3 + 2] ?? 0) + Math.sin(time * 0.4 + seed) * 0.02 * floatProgress
      }
    }
  },
}
