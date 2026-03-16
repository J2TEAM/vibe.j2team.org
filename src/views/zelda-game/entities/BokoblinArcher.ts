import type { Vec2, TileMap, ProjectileSpawnRequest, PatrolRoute } from '../utils/types'
import {
  ENEMY_SIZE,
  ENEMY_SPEED,
  ENEMY_SPRITE_SIZE,
  BOKOBLIN_HP,
  ARCHER_FIRE_INTERVAL,
  ARCHER_ARROW_SPEED,
  ARCHER_ARROW_DAMAGE,
  ARCHER_DETECTION_RANGE,
} from '../utils/constants'
import { Enemy } from './Enemy'
import { AnimationController } from '../engine/AnimationController'
import { getBokoblinArcherAnimations, drawDeathPoof } from '../utils/sprites'
import type { Player } from './Player'

export class BokoblinArcher extends Enemy {
  private fireTimer = ARCHER_FIRE_INTERVAL
  private pendingProjectile: ProjectileSpawnRequest | null = null
  private wasInRange = false

  // Pre-allocated to avoid GC pressure per frame
  private readonly spawnRequest: ProjectileSpawnRequest = {
    x: 0,
    y: 0,
    dirX: 0,
    dirY: 0,
    damage: ARCHER_ARROW_DAMAGE,
    speed: ARCHER_ARROW_SPEED,
    source: 'enemy',
  }

  constructor(spawnPos: Vec2, patrolRoute: PatrolRoute = []) {
    super(spawnPos, patrolRoute, ENEMY_SPEED, BOKOBLIN_HP, { x: ENEMY_SIZE, y: ENEMY_SIZE })
    // RT#2: animation MUST be assigned in constructor (definite assignment assertion)
    this.animation = new AnimationController(getBokoblinArcherAnimations(), 'idle', 'down')
  }

  updateAI(dt: number, player: Player, map: TileMap): void {
    this.pendingProjectile = null

    // Death animation
    if (this.deathState !== 'alive') {
      this.updateDeathTimer(dt)
      return
    }

    // Face the player
    const dx = player.pos.x - this.pos.x
    const dy = player.pos.y - this.pos.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    // RT#6: division-by-zero guard — still tick timers/animation before returning
    if (dist < 0.001) {
      this.updateInvulnerability(dt)
      this.animation.update(dt)
      return
    }

    // Determine facing direction toward player
    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? 'right' : 'left'
    } else {
      this.direction = dy > 0 ? 'down' : 'up'
    }
    this.animation.play('idle', this.direction)

    // When out of firing range — chase the player
    const inRange = dist <= ARCHER_DETECTION_RANGE
    if (!inRange) {
      this.wasInRange = false
      // Force chase so archer pursues Link instead of patrolling
      this.aiState = 'chase'
      super.updateAI(dt, player, map)
      return
    }
    if (!this.wasInRange) {
      this.wasInRange = true
    }

    // In range: override base AI — stand still, face player, and shoot
    this.aiState = 'patrol' // Reset state so base won't chase when we return out of range

    // Countdown fire timer
    this.fireTimer -= dt
    if (this.fireTimer <= 0) {
      this.fireTimer = ARCHER_FIRE_INTERVAL

      // Normalized direction to player
      const nx = dx / dist
      const ny = dy / dist

      // Populate pre-allocated spawn request
      const center = this.getCenter()
      this.spawnRequest.x = center.x
      this.spawnRequest.y = center.y
      this.spawnRequest.dirX = nx
      this.spawnRequest.dirY = ny
      this.pendingProjectile = this.spawnRequest
    }

    this.updateInvulnerability(dt)
    this.animation.update(dt)
  }

  /** Called by Stage2 to retrieve pending arrow spawn request. RT#9: returns a clone. */
  getProjectileRequest(): ProjectileSpawnRequest | null {
    const req = this.pendingProjectile
    this.pendingProjectile = null
    if (!req) return null
    return {
      x: req.x,
      y: req.y,
      dirX: req.dirX,
      dirY: req.dirY,
      damage: req.damage,
      speed: req.speed,
      source: req.source,
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.isFullyDead()) return

    // Death animation
    if (this.isDying()) {
      const progress = this.getDeathProgress()
      ctx.save()
      ctx.globalAlpha = Math.max(0, 1 - progress)
      this.drawSprite(ctx)
      ctx.restore()

      const c = this.getCenter()
      drawDeathPoof(ctx, c.x, c.y, progress)
      return
    }

    this.drawWithBlink(ctx, (c) => {
      this.drawSprite(c)
    })
  }

  private drawSprite(ctx: CanvasRenderingContext2D): void {
    const frame = this.animation.getCurrentFrame()
    if (!frame) return
    const offset = (ENEMY_SPRITE_SIZE - ENEMY_SIZE) / 2
    frame.draw(ctx, this.pos.x - offset, this.pos.y - offset, ENEMY_SPRITE_SIZE, this.direction)
  }
}
