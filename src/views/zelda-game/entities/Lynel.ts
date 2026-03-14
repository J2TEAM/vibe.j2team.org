import type { Vec2, LynelPhase, LynelAIState, FireTile, TileMap, AABB } from '../utils/types'
import type { Player } from './Player'
import { Enemy } from './Enemy'
import { AnimationController } from '../engine/AnimationController'
import { Physics } from '../engine/Physics'
import {
  getLynelAnimations,
  drawChargeWindup,
  drawFireBreathCone,
  drawFireTile,
} from '../utils/sprites'
import {
  LYNEL_HP,
  LYNEL_SIZE,
  LYNEL_SPEED,
  LYNEL_BERSERK_SPEED,
  LYNEL_CHARGE_WINDUP_P1,
  LYNEL_CHARGE_WINDUP_P2,
  LYNEL_CHARGE_SPEED,
  LYNEL_STUN_DURATION,
  LYNEL_SLASH_DAMAGE,
  LYNEL_SLASH_RANGE,
  LYNEL_BERSERK_DAMAGE,
  LYNEL_SLASH_COOLDOWN,
  LYNEL_FIRE_CONE_RANGE,
  FIRE_TILE_DURATION,
  LYNEL_PHASE2_HP,
  LYNEL_PHASE3_HP,
  BOSS_ARENA_LEFT,
  BOSS_ARENA_RIGHT,
  TILE_SIZE,
  LYNEL_SPRITE_SIZE,
} from '../utils/constants'

// Pre-computed half-angle for fire cone (30° = π/6)
const FIRE_CONE_HALF_ANGLE = Math.PI / 6

// Action decision intervals
const PACE_DECISION_MIN = 2.0
const PACE_DECISION_MAX = 3.0
const FIRE_BREATH_DURATION = 0.5
const PHASE_TRANSITION_PAUSE = 0.5
const INITIAL_ACTION_DELAY = 1.5
const MAX_FIRE_TILES = 30

// Slash animation duration
const SLASH_DURATION = 0.25

export class Lynel extends Enemy {
  // Lynel uses its own AI state, completely overriding Enemy's patrol/chase/alert AI
  private _ai: LynelAIState = 'idle'
  private phase: LynelPhase = 'charge'
  private prevPhase: LynelPhase = 'charge'

  // Timers (all delta-time based)
  private paceTimer = 0
  private paceDir: Vec2 = { x: 1, y: 0 }
  private chargeWindupTimer = 0
  private chargeWindupDuration = LYNEL_CHARGE_WINDUP_P1
  private stunTimer = 0
  private slashCooldown = 0
  private slashTimer = 0
  private actionCooldown = INITIAL_ACTION_DELAY
  private fireBreathTimer = 0
  private phaseTransitionTimer = 0

  // Charge state
  private chargeDir: Vec2 = { x: 0, y: 0 }

  // Fire breath
  private fireTiles: FireTile[] = []
  private fireSpawned = false

  // Arena bounds
  private arenaLeft: number
  private arenaRight: number
  private arenaTop: number
  private arenaBottom: number

  // Slash hitbox (pre-allocated)
  private slashHitbox: AABB = { x: 0, y: 0, width: 0, height: 0 }
  private pendingSlashDamage = 0

  // Berserk alternation tracker
  private lastBerserkAction: 'charge' | 'fire' = 'fire'

  constructor(spawnPos: Vec2, arenaTop: number, arenaBottom: number) {
    super(spawnPos, [], LYNEL_SPEED, LYNEL_HP, { x: LYNEL_SIZE, y: LYNEL_SIZE })
    this.arenaLeft = BOSS_ARENA_LEFT
    this.arenaRight = BOSS_ARENA_RIGHT
    this.arenaTop = arenaTop
    this.arenaBottom = arenaBottom
    // [RT#2] Animation MUST be set in constructor — definite assignment from BaseEntity
    this.animation = new AnimationController(getLynelAnimations(), 'idle', 'down')
  }

  // ─── Phase Determination ──────────────────────────────────────────

  /** [RT#8] Strict greater-than to avoid off-by-one at boundaries */
  private getPhase(): LynelPhase {
    if (this.health > LYNEL_PHASE2_HP) return 'charge'
    if (this.health > LYNEL_PHASE3_HP) return 'fire_breath'
    return 'berserk'
  }

  get currentAIState(): LynelAIState {
    return this._ai
  }

  get currentPhase(): LynelPhase {
    return this.phase
  }

  // ─── Core Update ──────────────────────────────────────────────────

  override update(dt: number, ...args: unknown[]): void {
    const player = args[0] as Player
    const map = args[1] as TileMap

    if (this.deathState !== 'alive') {
      this.updateDeathTimer(dt)
      return
    }

    // Determine phase from HP
    const newPhase = this.getPhase()
    if (newPhase !== this.phase) {
      this.prevPhase = this.phase
      this.phase = newPhase
      // Brief pause on phase transition ("roar")
      this.phaseTransitionTimer = PHASE_TRANSITION_PAUSE
      this._ai = 'idle'
    }

    // Update fire tiles (decrement timers, remove expired)
    this.updateFireTiles(dt)

    // Update invulnerability
    this.updateInvulnerability(dt)

    // Decrement slash cooldown
    if (this.slashCooldown > 0) this.slashCooldown -= dt

    // Reset pending damage each frame
    this.pendingSlashDamage = 0

    // Phase transition pause
    if (this.phaseTransitionTimer > 0) {
      this.phaseTransitionTimer -= dt
      this.animation.play('idle', this.direction)
      this.animation.update(dt)
      return
    }

    const speed = this.phase === 'berserk' ? LYNEL_BERSERK_SPEED : LYNEL_SPEED

    // AI State machine
    switch (this._ai) {
      case 'idle':
        this.updateIdle(dt)
        break
      case 'pacing':
        this.updatePacing(dt, player, speed)
        break
      case 'charge_windup':
        this.updateChargeWindup(dt, player)
        break
      case 'charging':
        this.updateCharging(dt, player, map)
        break
      case 'stunned':
        this.updateStunned(dt)
        break
      case 'slashing':
        this.updateSlashing(dt, player, map)
        break
      case 'fire_breathing':
        this.updateFireBreathing(dt, player)
        break
    }

    this.animation.update(dt)
  }

  // ─── AI States ────────────────────────────────────────────────────

  private updateIdle(dt: number): void {
    this.actionCooldown -= dt
    this.animation.play('idle', this.direction)
    if (this.actionCooldown <= 0) {
      this._ai = 'pacing'
      this.paceTimer = PACE_DECISION_MIN + Math.random() * (PACE_DECISION_MAX - PACE_DECISION_MIN)
      this.pickPaceDirection()
    }
  }

  private updatePacing(dt: number, player: Player, speed: number): void {
    this.paceTimer -= dt

    // Move in pacing direction
    this.pos.x += this.paceDir.x * speed * dt
    this.pos.y += this.paceDir.y * speed * dt
    this.clampToArena()

    // Update facing direction based on movement
    if (Math.abs(this.paceDir.x) > Math.abs(this.paceDir.y)) {
      this.direction = this.paceDir.x > 0 ? 'right' : 'left'
    } else if (this.paceDir.y !== 0) {
      this.direction = this.paceDir.y > 0 ? 'down' : 'up'
    }
    this.animation.play('walk', this.direction)

    // Reverse direction if hitting arena edge during pacing
    if (this.isAtArenaEdge()) {
      this.paceDir.x = -this.paceDir.x
      this.paceDir.y = -this.paceDir.y
    }

    if (this.paceTimer <= 0) {
      this.decideNextAction(player)
    }
  }

  private updateChargeWindup(dt: number, player: Player): void {
    this.chargeWindupTimer -= dt
    this.animation.play('idle', this.direction)

    // Face the player during windup
    this.facePlayer(player)

    if (this.chargeWindupTimer <= 0) {
      // Lock charge direction toward player at end of windup
      const center = this.getCenter()
      const pc = player.getCenter()
      const dx = pc.x - center.x
      const dy = pc.y - center.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 0) {
        this.chargeDir.x = dx / dist
        this.chargeDir.y = dy / dist
      } else {
        // Default: charge in facing direction
        this.chargeDir.x = this.direction === 'right' ? 1 : this.direction === 'left' ? -1 : 0
        this.chargeDir.y = this.direction === 'down' ? 1 : this.direction === 'up' ? -1 : 0
      }
      this._ai = 'charging'
    }
  }

  /** [RT#5] Charge sub-stepping to prevent skip-through */
  private updateCharging(dt: number, player: Player, map: TileMap): void {
    const totalDist = LYNEL_CHARGE_SPEED * dt
    const stepSize = 4
    const steps = Math.ceil(totalDist / stepSize)

    this.animation.play('walk', this.direction)

    for (let i = 0; i < steps; i++) {
      this.pos.x += this.chargeDir.x * stepSize
      this.pos.y += this.chargeDir.y * stepSize

      // Check player collision at each step
      if (!player.isInvulnerable() && Physics.overlaps(this.getAABB(), player.getAABB())) {
        const dmg = this.phase === 'berserk' ? LYNEL_BERSERK_DAMAGE : LYNEL_SLASH_DAMAGE
        player.takeDamage(dmg)
        // Knockback player away from charge direction
        this.knockbackPlayer(player, map)
        break
      }

      // Check arena edge at each step
      if (this.isAtArenaEdge()) {
        this.clampToArena()
        this._ai = 'stunned'
        this.stunTimer = LYNEL_STUN_DURATION
        this.animation.play('idle', this.direction)
        return
      }
    }
  }

  private updateStunned(dt: number): void {
    this.stunTimer -= dt
    this.animation.play('idle', this.direction)
    if (this.stunTimer <= 0) {
      this._ai = 'pacing'
      this.paceTimer = PACE_DECISION_MIN + Math.random() * (PACE_DECISION_MAX - PACE_DECISION_MIN)
      this.pickPaceDirection()
      this.actionCooldown = 0
    }
  }

  private updateSlashing(dt: number, player: Player, map: TileMap): void {
    this.slashTimer -= dt

    if (this.slashTimer > 0) {
      // Active slash — build hitbox in front of Lynel
      const center = this.getCenter()
      const reach = LYNEL_SLASH_RANGE
      const width = LYNEL_SIZE

      switch (this.direction) {
        case 'right':
          this.slashHitbox.x = center.x
          this.slashHitbox.y = center.y - width / 2
          this.slashHitbox.width = reach
          this.slashHitbox.height = width
          break
        case 'left':
          this.slashHitbox.x = center.x - reach
          this.slashHitbox.y = center.y - width / 2
          this.slashHitbox.width = reach
          this.slashHitbox.height = width
          break
        case 'down':
          this.slashHitbox.x = center.x - width / 2
          this.slashHitbox.y = center.y
          this.slashHitbox.width = width
          this.slashHitbox.height = reach
          break
        case 'up':
          this.slashHitbox.x = center.x - width / 2
          this.slashHitbox.y = center.y - reach
          this.slashHitbox.width = width
          this.slashHitbox.height = reach
          break
      }

      const dmg = this.phase === 'berserk' ? LYNEL_BERSERK_DAMAGE : LYNEL_SLASH_DAMAGE
      this.pendingSlashDamage = dmg

      // Check if slash hits player
      if (!player.isInvulnerable() && Physics.overlaps(this.slashHitbox, player.getAABB())) {
        player.takeDamage(dmg)
        this.knockbackPlayer(player, map)
      }
    } else {
      // Slash finished
      this.slashCooldown = LYNEL_SLASH_COOLDOWN
      this._ai = 'pacing'
      this.paceTimer = PACE_DECISION_MIN + Math.random() * (PACE_DECISION_MAX - PACE_DECISION_MIN)
      this.pickPaceDirection()
    }
  }

  private updateFireBreathing(dt: number, player: Player): void {
    this.fireBreathTimer -= dt
    this.animation.play('idle', this.direction)

    // Spawn fire tiles once at the start of the breath
    if (!this.fireSpawned) {
      const pc = player.getCenter()
      this.spawnFireTiles(pc.x, pc.y)
      this.fireSpawned = true
    }

    if (this.fireBreathTimer <= 0) {
      this._ai = 'pacing'
      this.paceTimer = PACE_DECISION_MIN + Math.random() * (PACE_DECISION_MAX - PACE_DECISION_MIN)
      this.pickPaceDirection()
    }
  }

  // ─── Action Decision ──────────────────────────────────────────────

  private decideNextAction(player: Player): void {
    const center = this.getCenter()
    const pc = player.getCenter()
    const dx = pc.x - center.x
    const dy = pc.y - center.y
    const distToPlayer = Math.sqrt(dx * dx + dy * dy)
    const inMeleeRange = distToPlayer < LYNEL_SLASH_RANGE

    switch (this.phase) {
      case 'charge': {
        // Phase 1: charge (70%) or slash if close (30%)
        if (inMeleeRange && this.slashCooldown <= 0 && Math.random() < 0.3) {
          this.startSlash(player)
        } else {
          this.startChargeWindup(player)
        }
        break
      }
      case 'fire_breath': {
        // Phase 2: charge (40%), fire breath (40%), slash if close (20%)
        const roll = Math.random()
        if (inMeleeRange && this.slashCooldown <= 0 && roll < 0.2) {
          this.startSlash(player)
        } else if (roll < 0.6) {
          this.startFireBreath(player)
        } else {
          this.startChargeWindup(player)
        }
        break
      }
      case 'berserk': {
        // Phase 3: rapid alternation — charge → fire → charge → fire
        if (this.lastBerserkAction === 'fire') {
          this.startChargeWindup(player)
          this.lastBerserkAction = 'charge'
        } else {
          this.startFireBreath(player)
          this.lastBerserkAction = 'fire'
        }
        break
      }
    }
  }

  private startChargeWindup(player: Player): void {
    this._ai = 'charge_windup'
    this.chargeWindupDuration =
      this.phase === 'charge' ? LYNEL_CHARGE_WINDUP_P1 : LYNEL_CHARGE_WINDUP_P2
    this.chargeWindupTimer = this.chargeWindupDuration
    this.facePlayer(player)
  }

  private startSlash(player: Player): void {
    this._ai = 'slashing'
    this.slashTimer = SLASH_DURATION
    this.facePlayer(player)
  }

  private startFireBreath(player: Player): void {
    this._ai = 'fire_breathing'
    this.fireBreathTimer = FIRE_BREATH_DURATION
    this.fireSpawned = false
    this.facePlayer(player)
  }

  // ─── Fire Tile Management ─────────────────────────────────────────

  private updateFireTiles(dt: number): void {
    for (let i = this.fireTiles.length - 1; i >= 0; i--) {
      this.fireTiles[i]!.timer -= dt
      if (this.fireTiles[i]!.timer <= 0) {
        this.fireTiles.splice(i, 1)
      }
    }
  }

  /** [RT#11] Hard cap on fire tiles + [RT#6] division by zero guard */
  private spawnFireTiles(targetX: number, targetY: number): void {
    if (this.fireTiles.length >= MAX_FIRE_TILES) return

    const center = this.getCenter()
    const dx = targetX - center.x
    const dy = targetY - center.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 0.001) return

    const nx = dx / dist
    const ny = dy / dist

    // Place fire tiles along the cone direction every TILE_SIZE
    for (let d = TILE_SIZE; d < LYNEL_FIRE_CONE_RANGE; d += TILE_SIZE) {
      if (this.fireTiles.length >= MAX_FIRE_TILES) break

      const fx = center.x + nx * d
      const fy = center.y + ny * d

      // Center tile
      this.fireTiles.push({ x: fx, y: fy, timer: FIRE_TILE_DURATION })

      // Spread tiles (±1 tile perpendicular)
      if (this.fireTiles.length < MAX_FIRE_TILES) {
        this.fireTiles.push({
          x: fx - ny * TILE_SIZE * 0.5,
          y: fy + nx * TILE_SIZE * 0.5,
          timer: FIRE_TILE_DURATION,
        })
      }
      if (this.fireTiles.length < MAX_FIRE_TILES) {
        this.fireTiles.push({
          x: fx + ny * TILE_SIZE * 0.5,
          y: fy - nx * TILE_SIZE * 0.5,
          timer: FIRE_TILE_DURATION,
        })
      }
    }
  }

  /** Exposed for Stage2 to check player fire damage */
  getFireTiles(): readonly FireTile[] {
    return this.fireTiles
  }

  // ─── Slash Hitbox ─────────────────────────────────────────────────

  /** Returns slash hitbox if actively slashing, null otherwise */
  getSlashHitbox(): { aabb: AABB; damage: number } | null {
    if (this.pendingSlashDamage > 0) {
      return { aabb: this.slashHitbox, damage: this.pendingSlashDamage }
    }
    return null
  }

  // ─── Arena Bounds ─────────────────────────────────────────────────

  private clampToArena(): void {
    this.pos.x = Math.max(this.arenaLeft, Math.min(this.arenaRight - this.size.x, this.pos.x))
    this.pos.y = Math.max(this.arenaTop, Math.min(this.arenaBottom - this.size.y, this.pos.y))
  }

  /** [RT#14] Velocity-aware edge detection */
  private isAtArenaEdge(): boolean {
    const buffer = Math.max(4, this.speed * 0.033 * 2)
    return (
      this.pos.x <= this.arenaLeft + buffer ||
      this.pos.x >= this.arenaRight - this.size.x - buffer ||
      this.pos.y <= this.arenaTop + buffer ||
      this.pos.y >= this.arenaBottom - this.size.y - buffer
    )
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  private facePlayer(player: Player): void {
    const mc = this.getCenter()
    const pc = player.getCenter()
    const dx = pc.x - mc.x
    const dy = pc.y - mc.y
    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? 'right' : 'left'
    } else {
      this.direction = dy > 0 ? 'down' : 'up'
    }
  }

  private pickPaceDirection(): void {
    // Random horizontal movement within arena
    this.paceDir.x = Math.random() > 0.5 ? 1 : -1
    this.paceDir.y = (Math.random() - 0.5) * 0.5
    const len = Math.sqrt(this.paceDir.x * this.paceDir.x + this.paceDir.y * this.paceDir.y)
    if (len > 0) {
      this.paceDir.x /= len
      this.paceDir.y /= len
    }
  }

  private knockbackPlayer(player: Player, map: TileMap): void {
    const ec = this.getCenter()
    const pc = player.getCenter()
    const kx = pc.x - ec.x
    const ky = pc.y - ec.y
    const kDist = Math.sqrt(kx * kx + ky * ky)
    if (kDist > 0) {
      const kb = TILE_SIZE * 0.75
      const newPos = {
        x: player.pos.x + (kx / kDist) * kb,
        y: player.pos.y + (ky / kDist) * kb,
      }
      const resolved = Physics.resolveMovement(map, player.pos, newPos, player.size)
      player.pos.x = resolved.x
      player.pos.y = resolved.y
    }
  }

  // ─── Drawing ──────────────────────────────────────────────────────

  override draw(ctx: CanvasRenderingContext2D): void {
    if (this.isFullyDead()) return

    // Draw fire tiles first (below entity)
    this.drawFireTiles(ctx)

    // Draw charge windup telegraph
    if (this._ai === 'charge_windup') {
      const progress = 1 - this.chargeWindupTimer / this.chargeWindupDuration
      const center = this.getCenter()
      drawChargeWindup(ctx, center.x, center.y, progress)
    }

    // Draw fire breath cone while breathing
    if (this._ai === 'fire_breathing') {
      const center = this.getCenter()
      const angle = Physics.directionToAngle(this.direction)
      drawFireBreathCone(
        ctx,
        center.x,
        center.y,
        angle,
        LYNEL_FIRE_CONE_RANGE,
        FIRE_CONE_HALF_ANGLE,
      )
    }

    this.drawWithBlink(ctx, () => {
      ctx.save()

      // Berserk red glow
      if (this.phase === 'berserk') {
        ctx.shadowColor = '#FF0000'
        ctx.shadowBlur = 15
      }

      // Death animation — fade out
      if (this.isDying()) {
        ctx.globalAlpha = 1 - this.getDeathProgress()
      }

      // Stunned visual — slight transparency
      if (this._ai === 'stunned') {
        ctx.globalAlpha = Math.min(ctx.globalAlpha, 0.6 + Math.sin(Date.now() * 0.01) * 0.2)
      }

      // Draw sprite
      const frame = this.animation.getCurrentFrame()
      if (frame) {
        frame.draw(ctx, this.pos.x, this.pos.y, LYNEL_SPRITE_SIZE, this.direction)
      }

      ctx.restore()
    })

    // Draw slash hitbox visual (debug-style feedback)
    if (this._ai === 'slashing' && this.slashTimer > 0) {
      this.drawSlashEffect(ctx)
    }
  }

  private drawFireTiles(ctx: CanvasRenderingContext2D): void {
    for (const tile of this.fireTiles) {
      const progress = 1 - tile.timer / FIRE_TILE_DURATION
      drawFireTile(ctx, tile.x - TILE_SIZE / 2, tile.y - TILE_SIZE / 2, progress)
    }
  }

  private drawSlashEffect(ctx: CanvasRenderingContext2D): void {
    const center = this.getCenter()
    const reach = LYNEL_SLASH_RANGE * 0.8
    const angle = Physics.directionToAngle(this.direction)

    ctx.save()
    ctx.globalAlpha = 0.5
    ctx.strokeStyle = '#FFB830'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(center.x, center.y, reach, angle - 0.6, angle + 0.6)
    ctx.stroke()
    ctx.restore()
  }
}
