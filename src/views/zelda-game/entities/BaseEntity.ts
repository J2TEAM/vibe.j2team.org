import type { Vec2, Direction, AABB } from '../utils/types'
import type { AnimationController } from '../engine/AnimationController'
import {
  PLAYER_INVULN_DURATION,
  PLAYER_BLINK_RATE,
  DAMAGE_FLASH_DURATION,
  DEATH_ANIM_DURATION,
} from '../utils/constants'

export abstract class BaseEntity {
  pos: Vec2
  size: Vec2
  direction: Direction = 'down'
  health: number
  maxHealth: number
  speed: number
  invulnerable = false
  invulnTimer = 0
  blinkVisible = true
  blinkTimer = 0
  alive = true
  damageFlashTimer = 0
  deathState: 'alive' | 'dying' | 'dead' = 'alive'
  deathTimer = 0
  animation!: AnimationController

  constructor(spawnPos: Vec2, size: Vec2, maxHealth: number, speed: number) {
    this.pos = { ...spawnPos }
    this.size = { ...size }
    this.health = maxHealth
    this.maxHealth = maxHealth
    this.speed = speed
  }

  abstract update(dt: number, ...args: unknown[]): void
  abstract draw(ctx: CanvasRenderingContext2D): void

  takeDamage(amount: number): boolean {
    if (this.invulnerable || !this.alive) return false
    this.health = Math.max(0, this.health - amount)

    // Trigger visual damage flash
    this.damageFlashTimer = DAMAGE_FLASH_DURATION

    if (this.health <= 0) {
      this.alive = false
      this.deathState = 'dying'
      this.deathTimer = DEATH_ANIM_DURATION
      return true
    }

    this.invulnerable = true
    this.invulnTimer = PLAYER_INVULN_DURATION
    this.blinkTimer = 0
    this.blinkVisible = true
    return true
  }

  heal(amount: number): void {
    if (!this.alive) return
    this.health = Math.min(this.maxHealth, this.health + amount)
  }

  updateDeathTimer(dt: number): void {
    if (this.deathState === 'dying') {
      this.deathTimer -= dt
      if (this.deathTimer <= 0) {
        this.deathState = 'dead'
      }
    }
    if (this.damageFlashTimer > 0) {
      this.damageFlashTimer -= dt
    }
  }

  updateInvulnerability(dt: number): void {
    if (!this.invulnerable) return
    this.invulnTimer -= dt
    if (this.invulnTimer <= 0) {
      this.invulnerable = false
      this.invulnTimer = 0
      this.blinkVisible = true
      this.blinkTimer = 0
      return
    }
    this.blinkTimer += dt
    if (this.blinkTimer >= PLAYER_BLINK_RATE) {
      this.blinkTimer -= PLAYER_BLINK_RATE
      this.blinkVisible = !this.blinkVisible
    }
  }

  drawWithBlink(
    ctx: CanvasRenderingContext2D,
    drawFn: (ctx: CanvasRenderingContext2D) => void,
  ): void {
    if (this.invulnerable && !this.blinkVisible) return
    drawFn(ctx)
  }

  getAABB(): AABB {
    return { x: this.pos.x, y: this.pos.y, width: this.size.x, height: this.size.y }
  }

  getCenter(): Vec2 {
    return { x: this.pos.x + this.size.x / 2, y: this.pos.y + this.size.y / 2 }
  }

  isAlive(): boolean {
    return this.alive
  }

  isDying(): boolean {
    return this.deathState === 'dying'
  }

  isFullyDead(): boolean {
    return this.deathState === 'dead'
  }

  isInvulnerable(): boolean {
    return this.invulnerable
  }

  getDeathProgress(): number {
    return this.deathState === 'dying'
      ? 1 - Math.max(0, this.deathTimer) / DEATH_ANIM_DURATION
      : this.deathState === 'dead'
        ? 1
        : 0
  }

  getDamageFlashProgress(): number {
    return this.damageFlashTimer > 0 ? this.damageFlashTimer / DAMAGE_FLASH_DURATION : 0
  }

  reset(spawnPos: Vec2): void {
    this.pos.x = spawnPos.x
    this.pos.y = spawnPos.y
    this.health = this.maxHealth
    this.alive = true
    this.invulnerable = false
    this.invulnTimer = 0
    this.blinkVisible = true
    this.blinkTimer = 0
    this.direction = 'down'
    this.damageFlashTimer = 0
    this.deathState = 'alive'
    this.deathTimer = 0
  }
}
