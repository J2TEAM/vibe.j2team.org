import type { Projectile, ProjectileSpawnRequest, TileMap, AABB, Direction } from '../utils/types'
import type { Enemy } from '../entities/Enemy'
import type { Player } from '../entities/Player'
import { Physics } from '../engine/Physics'
import { ARROW_SIZE, TILE_SIZE, SHIELD_FLAT_BLOCK } from '../utils/constants'
import { drawArrowSprite } from '../utils/sprites'

const MAX_PROJECTILES = 8

export class ProjectileManager {
  private pool: Projectile[]
  public onPlayerHit?: (damage: number) => void
  public onBlock?: (x: number, y: number) => void

  constructor() {
    this.pool = Array.from({ length: MAX_PROJECTILES }, () => ({
      active: false,
      x: 0,
      y: 0,
      dirX: 0,
      dirY: 0,
      speed: 0,
      damage: 0,
      size: ARROW_SIZE,
      source: 'player' as const,
    }))
  }

  spawn(request: ProjectileSpawnRequest): boolean {
    const p = this.pool.find((proj) => !proj.active)
    if (!p) return false
    p.active = true
    p.x = request.x
    p.y = request.y
    p.dirX = request.dirX
    p.dirY = request.dirY
    p.speed = request.speed
    p.damage = request.damage
    p.size = ARROW_SIZE
    p.source = request.source ?? 'player'
    return true
  }

  update(dt: number, map: TileMap, enemies: Enemy[], player?: Player): void {
    for (const p of this.pool) {
      if (!p.active) continue

      p.x += p.dirX * p.speed * dt
      p.y += p.dirY * p.speed * dt

      // Wall collision: check leading edge in direction of travel
      const leadX = p.x + (p.dirX > 0 ? p.size : p.dirX < 0 ? 0 : p.size / 2)
      const leadY = p.y + (p.dirY > 0 ? p.size : p.dirY < 0 ? 0 : p.size / 2)
      const tile = Physics.getTileAt(map, leadX, leadY)
      if (tile === 'wall' || tile === 'tree' || tile === 'pillar') {
        p.active = false
        continue
      }

      // Bounds check
      if (p.x < 0 || p.y < 0 || p.x > map.width * TILE_SIZE || p.y > map.height * TILE_SIZE) {
        p.active = false
        continue
      }

      // Enemy collision (player projectiles only — no friendly fire)
      if (p.source === 'player') {
        const pAABB = { x: p.x, y: p.y, width: p.size, height: p.size }
        for (const enemy of enemies) {
          if (!enemy.isAlive()) continue
          if (Physics.overlaps(pAABB, enemy.getAABB())) {
            enemy.takeDamage(p.damage)
            // Apply knockback in arrow direction
            const kbForce = 15
            const pushed = Physics.resolveMovement(
              map,
              enemy.pos,
              { x: enemy.pos.x + p.dirX * kbForce, y: enemy.pos.y + p.dirY * kbForce },
              enemy.size,
            )
            enemy.pos.x = pushed.x
            enemy.pos.y = pushed.y
            p.active = false
            break
          }
        }
      }

      // Player collision (enemy projectiles only)
      if (
        p.active &&
        p.source === 'enemy' &&
        player &&
        player.isAlive() &&
        !player.isInvulnerable()
      ) {
        const playerAABB = player.getAABB()
        if (this.projectileHitsAABB(p, playerAABB)) {
          if (player.isBlocking() && this.isFacingProjectile(player.direction, p)) {
            // Directional shield block — apply flat reduction here; pass skipShieldReduction=true
            // to Player.takeDamage so it does not reduce again (avoids double-reduction).
            const blocked = Math.max(0, p.damage - SHIELD_FLAT_BLOCK)
            this.onBlock?.(p.x, p.y)
            if (blocked > 0) {
              if (player.takeDamage(blocked, true)) {
                this.onPlayerHit?.(blocked)
              }
            }
          } else {
            // Direct hit — full damage (Player.takeDamage handles any non-directional block reduction)
            if (player.takeDamage(p.damage)) {
              this.onPlayerHit?.(p.damage)
            }
          }
          p.active = false
        }
      }
    }
  }

  private projectileHitsAABB(proj: Projectile, aabb: AABB): boolean {
    return (
      proj.x < aabb.x + aabb.width &&
      proj.x + proj.size > aabb.x &&
      proj.y < aabb.y + aabb.height &&
      proj.y + proj.size > aabb.y
    )
  }

  /** Player must face OPPOSITE to projectile travel direction to block (V5).
   *  e.g. projectile moves right → player faces left (shield faces right). */
  private isFacingProjectile(playerDir: Direction, proj: Projectile): boolean {
    if (proj.dirX > 0.5 && playerDir === 'left') return true
    if (proj.dirX < -0.5 && playerDir === 'right') return true
    if (proj.dirY > 0.5 && playerDir === 'up') return true
    if (proj.dirY < -0.5 && playerDir === 'down') return true
    return false
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.pool) {
      if (!p.active) continue
      drawArrowSprite(ctx, p.x, p.y, p.dirX, p.dirY, p.source)
    }
  }

  /** Returns a readonly view of the active projectile pool — for trail particles (Game.ts) */
  getActivePool(): ReadonlyArray<Readonly<Projectile>> {
    return this.pool
  }

  reset(): void {
    for (const p of this.pool) p.active = false
  }
}
