/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Earth Scene: The Formation of Our Home
 * Focus: Particles gathering into a planetary sphere and Earth visibility control
 */
export const earthScene = {
  update: (
    positions: Float32Array,
    particlesCount: number,
    time: number,
    progress: number,
    earth?: any,
    gsap?: any,
  ) => {
    // Stage: Earth Gathering (33.0 to 55.0)

    // Handle Earth/Clouds/Atmosphere Visibility Life Cycle
    if (earth && gsap) {
      // 1. Fade In (33.0 -> 45.0)
      const fadeIn = Math.min(Math.max((progress - 33.0) / 12.0, 0), 1)
      // 2. Fade Out (50.5 -> 56.0)
      const fadeOut = Math.min(Math.max((progress - 50.5) / 5.5, 0), 1)

      const earthOpacity = fadeIn * (1.0 - fadeOut)
      const clampedOpacity = Math.min(Math.max(earthOpacity, 0), 1)

      gsap.to(earth.material, { opacity: clampedOpacity, duration: 1.0, overwrite: 'auto' })

      const clouds = earth.children.find((c: any) => c.name === 'clouds')
      if (clouds) {
        gsap.to(clouds.material, {
          opacity: clampedOpacity * 0.5,
          duration: 1.0,
          overwrite: 'auto',
        })
      }

      const atmosphere = earth.children.find((c: any) => c.name === 'atmosphere')
      if (atmosphere && atmosphere.material.uniforms) {
        gsap.to(atmosphere.material.uniforms.uIntensity, {
          value: clampedOpacity,
          duration: 1.0,
          overwrite: 'auto',
        })
      }

      // 3. Rotation
      earth.rotation.y += 0.0005
      if (clouds) clouds.rotation.y += 0.0007
    }

    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3
      if (i3 + 2 >= positions.length) break

      const x = positions[i3] ?? 0
      const y = positions[i3 + 1] ?? 0
      const z = positions[i3 + 2] ?? 0

      // --- EARTH FORMATION ---
      // Particles finish gathering by 45.0
      const formationProgress = Math.min(Math.max((progress - 33.0) / 12.0, 0), 1)
      const targetRadius = 7.0 // Larger than Earth (6.5) and Atmosphere (6.65)

      // Target Sphere coordinates (seeded by index)
      const stride = i * 0.1337
      const t = stride + time * 0.1
      const p = Math.acos(Math.sin(stride * 0.77))

      const tx = targetRadius * Math.sin(p) * Math.cos(t)
      const ty = targetRadius * Math.sin(p) * Math.sin(t)
      const tz = targetRadius * Math.cos(p)

      // Interpolate current to target
      positions[i3] = x + (tx - x) * 0.02 * formationProgress
      positions[i3 + 1] = y + (ty - y) * 0.02 * formationProgress
      positions[i3 + 2] = z + (tz - z) * 0.02 * formationProgress

      // Particles start to drift away after 50.5
      if (progress > 50.5) {
        const driftForce = (progress - 50.5) * 0.05
        positions[i3] = (positions[i3] ?? 0) + Math.sin(time + i) * driftForce
        positions[i3 + 1] = (positions[i3 + 1] ?? 0) + Math.cos(time + i) * driftForce
        positions[i3 + 2] = (positions[i3 + 2] ?? 0) + Math.sin(time * 0.5 + i) * driftForce
      }
    }
  },
}
