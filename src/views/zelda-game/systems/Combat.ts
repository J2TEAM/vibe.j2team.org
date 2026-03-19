import type {
  CombatState,
  CombatResult,
  Hitbox,
  ProjectileSpawnRequest,
  InputState,
  Vec2,
  Direction,
} from '../utils/types'
import {
  SWORD_DAMAGE,
  SWORD_COOLDOWN,
  SWORD_SWING_DURATION,
  SWORD_RANGE,
  SWORD_ARC_WIDTH,
  SHIELD_SPEED_MULTIPLIER,
  SHIELD_FLAT_BLOCK,
  BOW_DAMAGE,
  BOW_COOLDOWN,
  BOW_SHOOT_DURATION,
  ARROW_SPEED,
  PLAYER_KNOCKBACK_FORCE,
} from '../utils/constants'
import type { Inventory } from './Inventory'

export class Combat {
  getSwordCooldownRatio(): number {
    return this.swordCooldown / SWORD_COOLDOWN
  }

  getBowCooldownRatio(): number {
    return this.bowCooldown / BOW_COOLDOWN
  }

  private state: CombatState = 'idle'
  private swordCooldown = 0
  private bowCooldown = 0
  private attackTimer = 0
  private shootTimer = 0
  private currentSwingID = 0

  // Pre-allocated hitbox to avoid per-frame GC
  private readonly hitboxResult: Hitbox = {
    aabb: { x: 0, y: 0, width: 0, height: 0 },
    damage: 0,
    knockback: 0,
    source: 'player',
  }

  // Pre-allocated result object — mutated each frame
  private readonly result: CombatResult = {
    state: 'idle',
    hitbox: null,
    swingID: 0,
    projectileRequest: null,
    speedMultiplier: 1,
    damageReduction: 0,
  }

  update(
    dt: number,
    input: InputState,
    inventory: Inventory,
    playerPos: Vec2,
    playerSize: Vec2,
    playerDirection: Direction,
  ): CombatResult {
    // Tick cooldowns
    this.swordCooldown = Math.max(0, this.swordCooldown - dt)
    this.bowCooldown = Math.max(0, this.bowCooldown - dt)

    // Reset per-frame outputs
    this.result.hitbox = null
    this.result.projectileRequest = null
    this.result.speedMultiplier = 1
    this.result.damageReduction = 0

    if (this.state === 'attacking') {
      this.attackTimer -= dt
      this.result.hitbox = this.buildSwordHitbox(playerPos, playerSize, playerDirection)
      this.result.hitCenter = {
        x: this.hitboxResult.aabb.x + this.hitboxResult.aabb.width / 2,
        y: this.hitboxResult.aabb.y + this.hitboxResult.aabb.height / 2,
      }
      this.result.swingID = this.currentSwingID
      if (this.attackTimer <= 0) {
        this.state = 'idle'
      }
    } else if (this.state === 'shooting') {
      this.shootTimer -= dt
      if (this.shootTimer <= 0) {
        this.result.projectileRequest = this.buildProjectileRequest(
          playerPos,
          playerSize,
          playerDirection,
        )
        this.state = 'idle'
      }
    } else if (this.state === 'blocking') {
      if (!input.block) {
        this.state = 'idle'
      } else {
        this.result.speedMultiplier = SHIELD_SPEED_MULTIPLIER
        this.result.damageReduction = SHIELD_FLAT_BLOCK
      }
    } else {
      // idle — check for new actions
      if (input.attackJustPressed && inventory.has('sword') && this.swordCooldown <= 0) {
        this.state = 'attacking'
        this.attackTimer = SWORD_SWING_DURATION
        this.swordCooldown = SWORD_COOLDOWN
        this.currentSwingID++
        // Return hitbox immediately on first frame
        this.result.hitbox = this.buildSwordHitbox(playerPos, playerSize, playerDirection)
        this.result.hitCenter = {
          x: this.hitboxResult.aabb.x + this.hitboxResult.aabb.width / 2,
          y: this.hitboxResult.aabb.y + this.hitboxResult.aabb.height / 2,
        }
        this.result.swingID = this.currentSwingID
      } else if (input.block && inventory.has('shield')) {
        this.state = 'blocking'
        this.result.speedMultiplier = SHIELD_SPEED_MULTIPLIER
        this.result.damageReduction = SHIELD_FLAT_BLOCK
      } else if (input.rangedJustPressed && inventory.has('bow') && this.bowCooldown <= 0) {
        this.state = 'shooting'
        this.shootTimer = BOW_SHOOT_DURATION
        this.bowCooldown = BOW_COOLDOWN
      }
    }

    this.result.state = this.state
    return this.result
  }

  private buildSwordHitbox(playerPos: Vec2, playerSize: Vec2, direction: Direction): Hitbox {
    const centerY = playerPos.y + playerSize.y / 2
    const centerX = playerPos.x + playerSize.x / 2

    const aabb = this.hitboxResult.aabb
    switch (direction) {
      case 'right':
        aabb.x = playerPos.x + playerSize.x
        aabb.y = centerY - SWORD_ARC_WIDTH / 2
        aabb.width = SWORD_RANGE
        aabb.height = SWORD_ARC_WIDTH
        break
      case 'left':
        aabb.x = playerPos.x - SWORD_RANGE
        aabb.y = centerY - SWORD_ARC_WIDTH / 2
        aabb.width = SWORD_RANGE
        aabb.height = SWORD_ARC_WIDTH
        break
      case 'down':
        aabb.x = centerX - SWORD_ARC_WIDTH / 2
        aabb.y = playerPos.y + playerSize.y
        aabb.width = SWORD_ARC_WIDTH
        aabb.height = SWORD_RANGE
        break
      case 'up':
        aabb.x = centerX - SWORD_ARC_WIDTH / 2
        aabb.y = playerPos.y - SWORD_RANGE
        aabb.width = SWORD_ARC_WIDTH
        aabb.height = SWORD_RANGE
        break
    }

    this.hitboxResult.damage = SWORD_DAMAGE
    this.hitboxResult.knockback = PLAYER_KNOCKBACK_FORCE
    this.hitboxResult.source = 'player'
    return this.hitboxResult
  }

  private buildProjectileRequest(
    playerPos: Vec2,
    playerSize: Vec2,
    direction: Direction,
  ): ProjectileSpawnRequest {
    const centerX = playerPos.x + playerSize.x / 2
    const centerY = playerPos.y + playerSize.y / 2

    let dirX = 0
    let dirY = 0
    switch (direction) {
      case 'right':
        dirX = 1
        break
      case 'left':
        dirX = -1
        break
      case 'down':
        dirY = 1
        break
      case 'up':
        dirY = -1
        break
    }

    return {
      x: centerX,
      y: centerY,
      dirX,
      dirY,
      damage: BOW_DAMAGE,
      speed: ARROW_SPEED,
    }
  }

  getSwingID(): number {
    return this.currentSwingID
  }

  getState(): CombatState {
    return this.state
  }

  isBlocking(): boolean {
    return this.state === 'blocking'
  }

  /** Called if ProjectileManager.spawn() fails — refund cooldown */
  refundBowCooldown(): void {
    this.bowCooldown = 0
  }

  /** Tick cooldown timers without processing input — used during dialog pause */
  updateCooldownsOnly(dt: number): void {
    this.swordCooldown = Math.max(0, this.swordCooldown - dt)
    this.bowCooldown = Math.max(0, this.bowCooldown - dt)
    if (this.state === 'attacking') {
      this.attackTimer -= dt
      if (this.attackTimer <= 0) this.state = 'idle'
    } else if (this.state === 'shooting') {
      this.shootTimer -= dt
      if (this.shootTimer <= 0) this.state = 'idle'
    }
  }

  reset(): void {
    this.state = 'idle'
    this.swordCooldown = 0
    this.bowCooldown = 0
    this.attackTimer = 0
    this.shootTimer = 0
    this.currentSwingID = 0
  }
}
