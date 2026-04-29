import { ref, type Ref, onUnmounted } from 'vue'
import type { Zombie } from '../types'

const DAMAGE_PER_HIT = 8
const DAMAGE_COOLDOWN_MS = 600
const TOUCH_RADIUS = 0.00006
const HIT_FLASH_MS = 300
/** Throttle collision check — damage cooldown 600ms nên 30fps là quá đủ */
const TICK_MS = 1000 / 30

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
  const isHit = ref(false)
  let lastDamageTime = 0
  let lastTickTime = 0
  let hitFlashId: ReturnType<typeof setTimeout> | null = null

  let rafId: number
  const tick = () => {
    if (hp.value <= 0) {
      rafId = requestAnimationFrame(tick)
      return
    }
    const now = Date.now()
    if (now - lastTickTime < TICK_MS) {
      rafId = requestAnimationFrame(tick)
      return
    }
    lastTickTime = now
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
        isHit.value = true
        if (hitFlashId) clearTimeout(hitFlashId)
        hitFlashId = setTimeout(() => {
          isHit.value = false
        }, HIT_FLASH_MS)
        break
      }
    }
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)

  onUnmounted(() => {
    cancelAnimationFrame(rafId)
    if (hitFlashId) clearTimeout(hitFlashId)
  })

  return { hp, maxHp: max, isHit }
}
