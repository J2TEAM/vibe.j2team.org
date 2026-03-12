import { ref, type Ref, onUnmounted } from 'vue'
import type { Zombie } from '../types'

const DAMAGE_PER_HIT = 8
const DAMAGE_COOLDOWN_MS = 600
const TOUCH_RADIUS = 0.00006

export type UsePlayerHPOptions = {
  maxHp?: number
  damagePerHit?: number
  damageCooldownMs?: number
  touchRadius?: number
}

export function usePlayerHP(
  playerPosition: Ref<{ lat: number; lng: number }>,
  zombies: Ref<Zombie[]>,
  options?: UsePlayerHPOptions,
) {
  const {
    maxHp: max = 100,
    damagePerHit = DAMAGE_PER_HIT,
    damageCooldownMs = DAMAGE_COOLDOWN_MS,
    touchRadius = TOUCH_RADIUS,
  } = options ?? {}

  const hp = ref(max)
  let lastDamageTime = 0

  let rafId: number
  const tick = () => {
    if (hp.value <= 0) {
      rafId = requestAnimationFrame(tick)
      return
    }
    const now = Date.now()
    const pos = playerPosition.value
    const r2 = touchRadius * touchRadius

    for (const z of zombies.value) {
      if (z.state !== 'alive') continue
      const dLat = z.lat - pos.lat
      const dLng = z.lng - pos.lng
      const dist2 = dLat * dLat + dLng * dLng
      if (dist2 < r2 && now - lastDamageTime >= damageCooldownMs) {
        hp.value = Math.max(0, hp.value - damagePerHit)
        lastDamageTime = now
        break
      }
    }
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)
  onUnmounted(() => cancelAnimationFrame(rafId))

  return { hp, maxHp: max }
}
