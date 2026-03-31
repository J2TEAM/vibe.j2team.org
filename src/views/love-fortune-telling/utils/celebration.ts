import type { FireworkBurst, FireworkParticle } from '../types'

export const CELEBRATION_DURATION_MS = 5200

const FIREWORK_COLORS = ['bg-accent-coral', 'bg-accent-amber', 'bg-accent-sky']

export const createFireworks = (): FireworkBurst[] => {
  const burstCount = 12
  const particlesPerBurst = 30

  return Array.from({ length: burstCount }, (_, burstIndex) => {
    const particles: FireworkParticle[] = Array.from(
      { length: particlesPerBurst },
      (_, particleIndex) => {
        const angle = (particleIndex / particlesPerBurst) * Math.PI * 2
        const distance = 70 + Math.random() * 140

        return {
          id: `p-${burstIndex}-${particleIndex}`,
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance,
          size: 4 + Math.random() * 8,
          colorClass: FIREWORK_COLORS[particleIndex % FIREWORK_COLORS.length]!,
          delay: Math.random() * 0.28,
          duration: 1.3 + Math.random() * 1.1,
        }
      },
    )

    return {
      id: `b-${burstIndex}`,
      x: 10 + Math.random() * 80,
      y: 8 + Math.random() * 45,
      delay: burstIndex * 0.14,
      particles,
    }
  })
}
