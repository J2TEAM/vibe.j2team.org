import { reactive } from 'vue'
import type { DamageEvent, Explosion, Projectile, Weapon } from '../types'
import { initialVelocity, stepProjectile, toDeg, TRIDENT_OFFSETS } from '../utils/ballistics'

const STEPS_PER_FRAME = 4 // sub-steps per render frame
const CHAR_HIT_RADIUS = 24 // px

export function usePhysics() {
  const projectiles = reactive<Projectile[]>([])
  const explosions = reactive<Explosion[]>([])
  const damageEvents = reactive<DamageEvent[]>([])

  function fireProjectile(
    x: number,
    y: number,
    angleDeg: number,
    power: number,
    wind: number,
    facingRight: boolean,
    weapon: Weapon,
    ownerId: number,
    buffCoeff: number,
    shotCount: number,
    isTrident: boolean,
    isTeleport: boolean,
  ) {
    projectiles.splice(0) // one active shot at a time
    explosions.splice(0)
    damageEvents.splice(0)

    if (isTrident) {
      TRIDENT_OFFSETS.forEach((offset) => {
        const adjustedDeg = angleDeg + toDeg(offset) * (facingRight ? 1 : 1)
        const vel = initialVelocity(adjustedDeg, power, facingRight)
        projectiles.push({
          x,
          y,
          vx: vel.x,
          vy: vel.y,
          ownerId,
          weapon,
          buffCoeff,
          spreadOffset: offset,
          active: true,
          isTeleport,
        })
      })
    } else {
      for (let i = 0; i < shotCount; i++) {
        const jitter = shotCount > 1 ? (i - (shotCount - 1) / 2) * 3 : 0
        const vel = initialVelocity(angleDeg + jitter, power, facingRight)
        projectiles.push({
          x,
          y,
          vx: vel.x,
          vy: vel.y,
          ownerId,
          weapon,
          buffCoeff,
          spreadOffset: 0,
          active: true,
          isTeleport,
        })
      }
    }
  }

  /**
   * Advance all active projectiles.
   * Returns list of {x,y,radius,ownerId} for each explosion that occurred.
   */
  function tickProjectiles(
    wind: number,
    mapWidth: number,
    mapHeight: number,
    checkSolid: (x: number, y: number) => boolean,
    characters: Array<{ id: number; x: number; y: number; alive: boolean }>,
    dt: number,
  ): Array<{
    x: number
    y: number
    radius: number
    ownerId: number
    weapon: Weapon
    buffCoeff: number
    isTeleport: boolean
  }> {
    const newExplosions: Array<{
      x: number
      y: number
      radius: number
      ownerId: number
      weapon: Weapon
      buffCoeff: number
      isTeleport: boolean
    }> = []

    for (const proj of projectiles) {
      if (!proj.active) continue

      // Sub-step integration
      const steps = Math.round((STEPS_PER_FRAME * dt) / (1 / 60))
      const subDt = dt / Math.max(1, steps)

      for (let step = 0; step < Math.max(1, steps); step++) {
        const result = stepProjectile(
          { x: proj.x, y: proj.y },
          { x: proj.vx, y: proj.vy },
          wind,
          subDt,
        )

        proj.x = result.pos.x
        proj.y = result.pos.y
        proj.vx = result.vel.x
        proj.vy = result.vel.y

        // Out of bounds
        if (proj.x < 0 || proj.x > mapWidth || proj.y > mapHeight) {
          proj.active = false
          break
        }
        if (proj.y < -200) {
          // Very high — keep going
          continue
        }

        // Terrain collision
        if (proj.y >= 0 && checkSolid(proj.x, proj.y)) {
          proj.active = false
          newExplosions.push({
            x: proj.x,
            y: proj.y,
            radius: proj.weapon.explosionRadius,
            ownerId: proj.ownerId,
            weapon: proj.weapon,
            buffCoeff: proj.buffCoeff,
            isTeleport: proj.isTeleport,
          })
          // Only show explosion animation for non-teleport projectiles
          if (!proj.isTeleport) {
            explosions.push({
              x: proj.x,
              y: proj.y,
              radius: proj.weapon.explosionRadius,
              progress: 0,
            })
          }
          break
        }

        // Character hit — teleport projectiles pass through characters
        if (!proj.isTeleport) {
          for (const char of characters) {
            if (!char.alive || char.id === proj.ownerId) continue
            const dx = char.x - proj.x
            const dy = char.y - proj.y
            if (dx * dx + dy * dy < CHAR_HIT_RADIUS * CHAR_HIT_RADIUS) {
              proj.active = false
              newExplosions.push({
                x: proj.x,
                y: proj.y,
                radius: proj.weapon.explosionRadius,
                ownerId: proj.ownerId,
                weapon: proj.weapon,
                buffCoeff: proj.buffCoeff,
                isTeleport: false,
              })
              explosions.push({
                x: proj.x,
                y: proj.y,
                radius: proj.weapon.explosionRadius,
                progress: 0,
              })
              break
            }
          }
        }
        if (!proj.active) break
      }
    }

    return newExplosions
  }

  /** Advance explosion animations. Returns true if any explosions still active. */
  function tickExplosions(dt: number): boolean {
    let any = false
    for (const ex of explosions) {
      ex.progress = Math.min(1, ex.progress + dt * 2)
      if (ex.progress < 1) any = true
    }
    // Remove finished
    const toRemove: number[] = []
    explosions.forEach((ex, i) => {
      if (ex.progress >= 1) toRemove.unshift(i)
    })
    toRemove.forEach((i) => explosions.splice(i, 1))
    return any
  }

  /** Tick damage event ttl (floating numbers) */
  function tickDamageEvents(dt: number) {
    const toRemove: number[] = []
    damageEvents.forEach((ev, i) => {
      ev.ttl -= dt
      if (ev.ttl <= 0) toRemove.unshift(i)
    })
    toRemove.forEach((i) => damageEvents.splice(i, 1))
  }

  function addDamageEvent(event: DamageEvent) {
    damageEvents.push(event)
  }

  function hasActiveProjectiles(): boolean {
    return projectiles.some((p) => p.active)
  }

  function clearAll() {
    projectiles.splice(0)
    explosions.splice(0)
    damageEvents.splice(0)
  }

  return {
    projectiles,
    explosions,
    damageEvents,
    fireProjectile,
    tickProjectiles,
    tickExplosions,
    tickDamageEvents,
    addDamageEvent,
    hasActiveProjectiles,
    clearAll,
  }
}
