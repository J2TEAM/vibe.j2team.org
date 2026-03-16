import type { Vec2, Direction, InputState, TileMap, CombatResult, WeaponType } from '../utils/types'
import {
  PLAYER_SPEED,
  PLAYER_SIZE,
  PLAYER_MAX_HEALTH,
  SPRITE_SIZE,
  SHIELD_FLAT_BLOCK,
} from '../utils/constants'
import { BaseEntity } from './BaseEntity'
import { AnimationController } from '../engine/AnimationController'
import { Physics } from '../engine/Physics'
import { getPlayerAnimations, drawShieldIndicator } from '../utils/sprites'
import { Combat } from '../systems/Combat'
import { Inventory } from '../systems/Inventory'
import { audio } from '../engine/Audio'

const SQRT2_INV = 1 / Math.sqrt(2)
const SPRITE_OFFSET = (SPRITE_SIZE - PLAYER_SIZE) / 2

export class Player extends BaseEntity {
  private combat: Combat
  private inventory: Inventory
  private lastCombatResult: CombatResult | null = null

  constructor(spawnPos: Vec2) {
    super(spawnPos, { x: PLAYER_SIZE, y: PLAYER_SIZE }, PLAYER_MAX_HEALTH, PLAYER_SPEED)
    this.animation = new AnimationController(getPlayerAnimations(), 'idle', 'down')
    this.combat = new Combat()
    this.inventory = new Inventory()
  }

  hasWeapon(type: WeaponType): boolean {
    return this.inventory.has(type)
  }

  getCooldownRatios(): { sword: number; bow: number } {
    return {
      sword: this.combat.getSwordCooldownRatio(),
      bow: this.combat.getBowCooldownRatio(),
    }
  }

  update(dt: number, input: InputState, map: TileMap): void {
    if (!this.alive) return

    // Lock direction and movement while a sword swing is in progress
    const wasAttacking = this.combat.getState() === 'attacking'

    let dx = 0
    let dy = 0
    if (!wasAttacking) {
      if (input.up) dy -= 1
      if (input.down) dy += 1
      if (input.left) dx -= 1
      if (input.right) dx += 1

      if (dx !== 0 && dy !== 0) {
        dx *= SQRT2_INV
        dy *= SQRT2_INV
      }

      const moving = dx !== 0 || dy !== 0

      if (moving) {
        let newDir: Direction
        if (Math.abs(dx) > Math.abs(dy)) {
          newDir = dx > 0 ? 'right' : 'left'
        } else {
          newDir = dy > 0 ? 'down' : 'up'
        }
        this.direction = newDir
        this.animation.setDirection(newDir)
      }
    }

    const moving = dx !== 0 || dy !== 0

    this.lastCombatResult = this.combat.update(
      dt,
      input,
      this.inventory,
      this.pos,
      this.size,
      this.direction,
    )
    const speedMultiplier = this.lastCombatResult.speedMultiplier
    const isAttacking = this.lastCombatResult.state === 'attacking'

    if (!wasAttacking && isAttacking) {
      audio.playSwordSwing()
    }

    if (isAttacking) {
      this.animation.play('attack')
    } else if (this.lastCombatResult.state === 'shooting') {
      this.animation.play('shoot')
    } else if (moving) {
      this.animation.play('walk')
    } else {
      this.animation.play('idle')
    }

    if (moving && !isAttacking) {
      const desiredPos: Vec2 = {
        x: this.pos.x + dx * this.speed * speedMultiplier * dt,
        y: this.pos.y + dy * this.speed * speedMultiplier * dt,
      }
      const resolved = Physics.resolveMovement(map, this.pos, desiredPos, this.size)
      this.pos.x = resolved.x
      this.pos.y = resolved.y
    }

    this.updateInvulnerability(dt)
    this.animation.update(dt)
  }

  override takeDamage(amount: number, skipShieldReduction = false): boolean {
    if (!skipShieldReduction && this.combat.isBlocking()) {
      const reduced = Math.max(0, amount - SHIELD_FLAT_BLOCK)
      if (reduced === 0) {
        audio.playBlock()
        return false // fully blocked
      }
      const hit = super.takeDamage(reduced)
      if (hit) audio.playPlayerDamage()
      return hit
    } else {
      const hit = super.takeDamage(amount)
      if (hit) audio.playPlayerDamage()
      return hit
    }
  }

  isBlocking(): boolean {
    return this.combat.isBlocking()
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) return

    this.drawWithBlink(ctx, () => {
      const frame = this.animation.getCurrentFrame()
      if (!frame) return
      const drawX = this.pos.x - SPRITE_OFFSET
      const drawY = this.pos.y - SPRITE_OFFSET
      frame.draw(ctx, drawX, drawY, SPRITE_SIZE, this.direction)
    })

    if (this.combat.isBlocking()) {
      drawShieldIndicator(ctx, this.pos.x, this.pos.y, this.size.x, this.size.y, this.direction)
    }
  }

  /** Upgrade max health between stages */
  setMaxHealth(hearts: number): void {
    this.maxHealth = hearts
    this.health = hearts // full heal on upgrade
  }

  reset(spawnPos: Vec2): void {
    super.reset(spawnPos)
    this.animation = new AnimationController(getPlayerAnimations(), 'idle', 'down')
    this.combat.reset()
    this.inventory.reset()
    this.lastCombatResult = null
  }

  getCombatResult(): CombatResult | null {
    return this.lastCombatResult
  }

  refundBowCooldown(): void {
    this.combat.refundBowCooldown()
  }

  unlockWeapons(): void {
    this.inventory.unlockAll()
  }

  /** Tick timers (invulnerability, combat cooldowns, animation) without processing input or movement.
   *  Call this during dialog pause to prevent stale timer state after dialog ends. */
  updateTimersOnly(dt: number): void {
    if (!this.alive) return
    this.updateInvulnerability(dt)
    this.combat.updateCooldownsOnly(dt)
    this.animation.update(dt)
  }
}
