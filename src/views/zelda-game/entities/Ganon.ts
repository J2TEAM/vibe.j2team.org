import type { Vec2, GanonPhase, GanonAIState, DarkOrb, TileMap, AABB } from '../utils/types'
import type { Player } from './Player'
import { Enemy } from './Enemy'
import { AnimationController } from '../engine/AnimationController'
import { Physics } from '../engine/Physics'
import { getBokoblinAnimations } from '../utils/sprites'
import {
  GANON_HP,
  GANON_SIZE,
  GANON_SPEED,
  GANON_SPRITE_SIZE,
  GANON_PHASE2_HP,
  GANON_PHASE3_HP,
  GANON_PHASE4_HP,
  DARK_ORB_SPEED,
  DARK_ORB_FAST_SPEED,
  DARK_ORB_HOMING_DURATION,
  DARK_ORB_CAST_COOLDOWN,
  DARK_ORB_SIZE,
  MAX_DARK_ORBS,
  GANON_TELEPORT_DURATION,
  GANON_VULNERABLE_WINDOW,
  GANON_DARK_SLASH_DAMAGE,
  GANON_DARK_SLASH_RANGE,
  GANON_DARK_SLASH_DURATION,
  TRIPLE_ORB_SPEED,
  TRIPLE_ORB_SPREAD,
  GROUND_SLAM_CHARGE_TIME,
  GROUND_SLAM_RADIUS,
  GROUND_SLAM_STUN_TIME,
  FINAL_STAND_STUN_TIME,
  FINAL_STAND_CYCLE_SPEED,
  MINION_SUMMON_INTERVAL,
  MINION_COUNT,
  MINION_RESUMMON_DELAY,
  MINION_PHASE_CONFIG,
  TILE_SIZE,
} from '../utils/constants'

// Action decision intervals
const PACE_DECISION_MIN = 2.0
const PACE_DECISION_MAX = 3.0
const PHASE_TRANSITION_PAUSE = 0.5
const _INITIAL_ACTION_DELAY = 1.5
const IDLE_MIN_DURATION = 0.3
const IDLE_MAX_DURATION = 0.8
const SUMMONING_DURATION = 1.0
const SLAM_IMPACT_DURATION = 0.3

// Dark slash animation sub-phases
const DARK_SLASH_WINDUP = 0.2
const DARK_SLASH_RECOVERY = 0.2

// Teleport sub-phase durations (total = GANON_TELEPORT_DURATION)
const TELEPORT_FADE_OUT = 0.5
const TELEPORT_INVISIBLE = 0.5
const TELEPORT_FADE_IN = 0.5

// Minimum distance from player for teleport destination
const TELEPORT_MIN_PLAYER_DIST = 3 * TILE_SIZE

// Phase 4 fixed cycle pattern
const PHASE4_CYCLE: GanonAIState[] = ['dark_slash', 'triple_orb', 'ground_slam_charge', 'stunned']

// Orb spread angle for standard cast
const ORB_SPREAD_ANGLE = 15 * (Math.PI / 180)

export class Ganon extends Enemy {
  // Ganon uses its own AI state, completely overriding Enemy's patrol/chase/alert AI
  private _ai: GanonAIState = 'idle'
  private phase: GanonPhase = 'dark_sorcery'
  private prevPhase: GanonPhase = 'dark_sorcery'
  phaseJustChanged = false

  // Timers (all delta-time based)
  private paceTimer = 0
  private paceDir: Vec2 = { x: 1, y: 0 }
  private actionTimer = 0
  private phaseTransitionTimer = 0

  // Teleport state
  private postTeleportAction: GanonAIState = 'idle'
  private teleportTarget: Vec2 = { x: 0, y: 0 }
  private teleportElapsed = 0
  teleportProgress = 0

  // Phase 4 cycle
  private cycleStep = 0

  // Dark orbs
  private darkOrbs: DarkOrb[] = []
  private orbCastCooldown = 0

  // Slash state
  private slashPhase: 'windup' | 'active' | 'recovery' = 'windup'
  private slashTimer = 0
  private slashHitbox: AABB = { x: 0, y: 0, width: 0, height: 0 }
  private slashActive = false

  // Ground slam
  private slamChargeProgress = 0
  private slamCenter: Vec2 = { x: 0, y: 0 }
  private slamActive = false
  private slamTimer = 0

  // Stunned
  private stunTimer = 0

  // Minion management
  private minionTimer = MINION_SUMMON_INTERVAL
  private minionResummonTimer = -1
  private _shouldSummon = false
  private minionPositions: Vec2[] = []
  private summonTimer = 0

  // Arena bounds
  private arenaLeft: number
  private arenaRight: number
  private arenaTop: number
  private arenaBottom: number

  // Visual state
  isTransparent = false
  private castAnimTimer = 0

  constructor(
    spawnPos: Vec2,
    arenaBounds: { minX: number; minY: number; maxX: number; maxY: number },
  ) {
    super(spawnPos, [], GANON_SPEED, GANON_HP, { x: GANON_SIZE, y: GANON_SIZE })
    this.arenaLeft = arenaBounds.minX
    this.arenaRight = arenaBounds.maxX
    this.arenaTop = arenaBounds.minY
    this.arenaBottom = arenaBounds.maxY
    // Use Bokoblin animations as placeholder; Ganon draws procedurally over them
    this.animation = new AnimationController(getBokoblinAnimations(), 'idle', 'down')
  }

  // ─── Phase Determination ──────────────────────────────────────────

  /** Pure function: HP → phase (strict greater-than avoids off-by-one) */
  getPhase(): GanonPhase {
    if (this.health > GANON_PHASE2_HP) return 'dark_sorcery'
    if (this.health > GANON_PHASE3_HP) return 'teleportation'
    if (this.health > GANON_PHASE4_HP) return 'calamity'
    return 'final_stand'
  }

  get currentAIState(): GanonAIState {
    return this._ai
  }

  get currentPhase(): GanonPhase {
    return this.phase
  }

  // ─── Phase Transitions ────────────────────────────────────────────

  private handlePhaseTransition(): void {
    const newPhase = this.getPhase()
    if (newPhase !== this.phase) {
      this.prevPhase = this.phase
      this.phase = newPhase
      this.phaseJustChanged = true
      this.phaseTransitionTimer = PHASE_TRANSITION_PAUSE
      this._ai = 'idle'
      this.actionTimer = 0

      // Phase-specific setup
      if (newPhase === 'final_stand') {
        this.isTransparent = true
        this.cycleStep = 0
      } else {
        this.isTransparent = false
      }

      // Reset minion timers on phase transition to prevent stale summons
      this.minionResummonTimer = -1
      this.minionTimer = MINION_SUMMON_INTERVAL
      this._shouldSummon = false
    } else {
      this.phaseJustChanged = false
    }
  }

  // ─── Core Update ──────────────────────────────────────────────────

  override update(dt: number, ...args: unknown[]): void {
    const player = args[0] as Player
    const map = args[1] as TileMap

    if (this.deathState !== 'alive') {
      this.updateDeathTimer(dt)
      return
    }

    // Phase transition detection
    this.handlePhaseTransition()

    // Update dark orbs every frame
    this.updateDarkOrbs(dt, player, map)

    // Update invulnerability blink
    this.updateInvulnerability(dt)

    // Update minion timers
    this.updateMinionTimers(dt)

    // Orb cast cooldown
    if (this.orbCastCooldown > 0) this.orbCastCooldown -= dt

    // Reset per-frame state
    this.slashActive = false

    // Phase transition pause
    if (this.phaseTransitionTimer > 0) {
      this.phaseTransitionTimer -= dt
      this.animation.play('idle', this.direction)
      this.animation.update(dt)
      return
    }

    // AI state machine dispatch
    switch (this._ai) {
      case 'idle':
        this.updateIdle(dt, player)
        break
      case 'pacing':
        this.updatePacing(dt, player)
        break
      case 'casting_orbs':
        this.updateCastingOrbs(dt, player)
        break
      case 'teleporting':
        this.updateTeleporting(dt)
        break
      case 'dark_slash':
        this.updateDarkSlash(dt, player)
        break
      case 'triple_orb':
        this.updateTripleOrb(dt, player)
        break
      case 'ground_slam_charge':
        this.updateGroundSlamCharge(dt)
        break
      case 'ground_slam':
        this.updateGroundSlam(dt)
        break
      case 'stunned':
        this.updateStunned(dt)
        break
      case 'summoning':
        this.updateSummoning(dt)
        break
    }

    this.clampToArena()
    this.animation.update(dt)
  }

  // ─── AI States ────────────────────────────────────────────────────

  private updateIdle(dt: number, player: Player): void {
    this.actionTimer -= dt
    this.animation.play('idle', this.direction)
    if (this.actionTimer <= 0) {
      this.decideNextAction(player)
    }
  }

  private updatePacing(dt: number, player: Player): void {
    this.paceTimer -= dt

    // Move in pacing direction
    this.pos.x += this.paceDir.x * GANON_SPEED * dt
    this.pos.y += this.paceDir.y * GANON_SPEED * dt
    this.clampToArena()

    // Update facing direction based on movement
    if (Math.abs(this.paceDir.x) > Math.abs(this.paceDir.y)) {
      this.direction = this.paceDir.x > 0 ? 'right' : 'left'
    } else if (this.paceDir.y !== 0) {
      this.direction = this.paceDir.y > 0 ? 'down' : 'up'
    }
    this.animation.play('walk', this.direction)

    // Reverse direction if hitting arena edge
    if (this.isAtArenaEdge()) {
      this.paceDir.x = -this.paceDir.x
      this.paceDir.y = -this.paceDir.y
    }

    if (this.paceTimer <= 0) {
      this.decideNextAction(player)
    }
  }

  private updateCastingOrbs(dt: number, player: Player): void {
    this.castAnimTimer -= dt
    this.animation.play('idle', this.direction)
    this.facePlayer(player)

    // Spawn orbs at midpoint of cast animation
    if (
      this.castAnimTimer <= DARK_ORB_CAST_COOLDOWN * 0.25 &&
      this.castAnimTimer + dt > DARK_ORB_CAST_COOLDOWN * 0.25
    ) {
      const pc = player.getCenter()
      this.spawnDarkOrbs(pc.x, pc.y)
    }

    if (this.castAnimTimer <= 0) {
      this.orbCastCooldown = DARK_ORB_CAST_COOLDOWN
      this.enterIdle(GANON_VULNERABLE_WINDOW)
    }
  }

  private updateTeleporting(dt: number): void {
    this.teleportElapsed += dt
    const totalDuration = GANON_TELEPORT_DURATION

    if (this.teleportElapsed < TELEPORT_FADE_OUT) {
      // Phase 1: fade out (0 → 1)
      this.teleportProgress = this.teleportElapsed / TELEPORT_FADE_OUT
    } else if (this.teleportElapsed < TELEPORT_FADE_OUT + TELEPORT_INVISIBLE) {
      // Phase 2: invisible — move to target
      this.teleportProgress = 1
      this.pos.x = this.teleportTarget.x
      this.pos.y = this.teleportTarget.y
    } else if (this.teleportElapsed < totalDuration) {
      // Phase 3: fade in (1 → 0)
      const fadeInElapsed = this.teleportElapsed - TELEPORT_FADE_OUT - TELEPORT_INVISIBLE
      this.teleportProgress = 1 - fadeInElapsed / TELEPORT_FADE_IN
    } else {
      // Teleport complete — execute post-teleport action
      this.teleportProgress = 0
      this._ai = this.postTeleportAction
      // Set up the post-teleport action state
      this.initPostTeleportAction()
    }

    this.animation.play('idle', this.direction)
  }

  private initPostTeleportAction(): void {
    switch (this._ai) {
      case 'dark_slash':
        this.slashPhase = 'windup'
        this.slashTimer = DARK_SLASH_WINDUP
        break
      case 'triple_orb':
        this.castAnimTimer = 0.5
        break
      case 'ground_slam_charge':
        this.slamChargeProgress = 0
        this.slamCenter.x = this.pos.x + this.size.x / 2
        this.slamCenter.y = this.pos.y + this.size.y / 2
        break
      case 'stunned':
        this.stunTimer =
          this.phase === 'final_stand' ? FINAL_STAND_STUN_TIME : GROUND_SLAM_STUN_TIME
        break
      default:
        this.actionTimer = IDLE_MIN_DURATION
        break
    }
  }

  private updateDarkSlash(dt: number, player: Player): void {
    const speedMul = this.phase === 'final_stand' ? FINAL_STAND_CYCLE_SPEED : 1
    this.slashTimer -= dt * speedMul

    switch (this.slashPhase) {
      case 'windup':
        this.facePlayer(player)
        this.animation.play('idle', this.direction)
        if (this.slashTimer <= 0) {
          this.slashPhase = 'active'
          this.slashTimer = GANON_DARK_SLASH_DURATION
        }
        break

      case 'active': {
        this.animation.play('idle', this.direction)
        // Build slash hitbox based on facing direction
        const center = this.getCenter()
        const reach = GANON_DARK_SLASH_RANGE
        const width = GANON_SIZE

        switch (this.direction) {
          case 'right':
            this.slashHitbox = { x: center.x, y: center.y - width / 2, width: reach, height: width }
            break
          case 'left':
            this.slashHitbox = {
              x: center.x - reach,
              y: center.y - width / 2,
              width: reach,
              height: width,
            }
            break
          case 'down':
            this.slashHitbox = { x: center.x - width / 2, y: center.y, width: width, height: reach }
            break
          case 'up':
            this.slashHitbox = {
              x: center.x - width / 2,
              y: center.y - reach,
              width: width,
              height: reach,
            }
            break
        }
        this.slashActive = true

        if (this.slashTimer <= 0) {
          this.slashPhase = 'recovery'
          this.slashTimer = DARK_SLASH_RECOVERY
        }
        break
      }

      case 'recovery':
        this.animation.play('idle', this.direction)
        if (this.slashTimer <= 0) {
          this.enterIdle(GANON_VULNERABLE_WINDOW)
        }
        break
    }
  }

  private updateTripleOrb(dt: number, player: Player): void {
    this.castAnimTimer -= dt
    this.animation.play('idle', this.direction)
    this.facePlayer(player)

    // Spawn orbs at midpoint
    if (this.castAnimTimer <= 0.25 && this.castAnimTimer + dt > 0.25) {
      this.spawnTripleOrbs(player)
    }

    if (this.castAnimTimer <= 0) {
      this.enterIdle(GANON_VULNERABLE_WINDOW)
    }
  }

  private updateGroundSlamCharge(dt: number): void {
    const speedMul = this.phase === 'final_stand' ? FINAL_STAND_CYCLE_SPEED : 1
    this.slamChargeProgress += (dt * speedMul) / GROUND_SLAM_CHARGE_TIME

    // Move toward center during charge
    const centerX = (this.arenaLeft + this.arenaRight) / 2 - this.size.x / 2
    const centerY = (this.arenaTop + this.arenaBottom) / 2 - this.size.y / 2
    const moveSpeed = GANON_SPEED * 2 * dt
    const dx = centerX - this.pos.x
    const dy = centerY - this.pos.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > moveSpeed) {
      this.pos.x += (dx / dist) * moveSpeed
      this.pos.y += (dy / dist) * moveSpeed
    } else {
      this.pos.x = centerX
      this.pos.y = centerY
    }

    this.slamCenter.x = this.pos.x + this.size.x / 2
    this.slamCenter.y = this.pos.y + this.size.y / 2
    this.animation.play('idle', this.direction)

    if (this.slamChargeProgress >= 1) {
      this.slamChargeProgress = 1
      this._ai = 'ground_slam'
      this.slamTimer = SLAM_IMPACT_DURATION
      this.slamActive = true
    }
  }

  private updateGroundSlam(dt: number): void {
    this.slamTimer -= dt
    this.animation.play('idle', this.direction)

    if (this.slamTimer <= 0) {
      this.slamActive = false
      this._ai = 'stunned'
      this.stunTimer = this.phase === 'final_stand' ? FINAL_STAND_STUN_TIME : GROUND_SLAM_STUN_TIME
    }
  }

  private updateStunned(dt: number): void {
    this.stunTimer -= dt
    this.animation.play('idle', this.direction)

    if (this.stunTimer <= 0) {
      this._ai = 'idle'
      this.actionTimer = IDLE_MIN_DURATION
    }
  }

  private updateSummoning(dt: number): void {
    this.summonTimer -= dt
    this.animation.play('idle', this.direction)

    if (this.summonTimer <= 0) {
      this._shouldSummon = true
      this.minionTimer = MINION_SUMMON_INTERVAL
      this.enterIdle(GANON_VULNERABLE_WINDOW)
    }
  }

  // ─── Action Decision ──────────────────────────────────────────────

  private decideNextAction(player: Player): void {
    const phase = this.getPhase()
    const center = this.getCenter()
    const pc = player.getCenter()
    const dx = pc.x - center.x
    const dy = pc.y - center.y
    const distToPlayer = Math.sqrt(dx * dx + dy * dy)

    switch (phase) {
      case 'dark_sorcery':
        this.decidePhase1(player, distToPlayer)
        break
      case 'teleportation':
        this.decidePhase2(player)
        break
      case 'calamity':
        this.decidePhase3(player)
        break
      case 'final_stand':
        this.decidePhase4()
        break
    }
  }

  /** Check if summoning is ready (shared across all phases) */
  private shouldStartSummoning(): boolean {
    return (
      this.minionTimer <= 0 || (this.minionResummonTimer <= 0 && this.minionResummonTimer !== -1)
    )
  }

  private decidePhase1(player: Player, distToPlayer: number): void {
    // Check if summoning is ready
    if (this.shouldStartSummoning()) {
      this.startSummoning(player)
      return
    }

    // Close range → pacing; otherwise → cast orbs
    if (distToPlayer < GANON_DARK_SLASH_RANGE * 1.5) {
      this.startPacing()
    } else if (this.orbCastCooldown <= 0) {
      this.startCastingOrbs(player)
    } else {
      this.startPacing()
    }
  }

  private decidePhase2(_player: Player): void {
    // Check if summoning is ready
    if (this.shouldStartSummoning()) {
      this.startSummoning(_player)
      return
    }
    // Always teleport first, then pick dark_slash or triple_orb
    this.postTeleportAction = Math.random() < 0.5 ? 'dark_slash' : 'triple_orb'
    this.startTeleport(_player)
  }

  private decidePhase3(player: Player): void {
    // Check if summoning is ready
    if (this.shouldStartSummoning()) {
      this.startSummoning(player)
      return
    }
    // Teleport → weighted random attack
    const roll = Math.random()
    if (roll < 0.35) {
      this.postTeleportAction = 'dark_slash'
    } else if (roll < 0.7) {
      this.postTeleportAction = 'triple_orb'
    } else {
      this.postTeleportAction = 'ground_slam_charge'
    }
    this.startTeleport(player)
  }

  private decidePhase4(): void {
    // Phase 4 still follows fixed cycle but can summon between cycles
    if (this.shouldStartSummoning()) {
      // Use a dummy player position for summoning — positions calculated relative to Ganon
      this.startSummoningNoPlayer()
      return
    }
    // Fixed cycle: dark_slash → triple_orb → ground_slam_charge → stunned
    const action = PHASE4_CYCLE[this.cycleStep]!
    this.cycleStep = (this.cycleStep + 1) % PHASE4_CYCLE.length

    if (action === 'stunned') {
      // Direct stun — no teleport
      this._ai = 'stunned'
      this.stunTimer = FINAL_STAND_STUN_TIME
    } else {
      this.postTeleportAction = action
      this.startTeleportToRandom()
    }
  }

  // ─── Action Starters ──────────────────────────────────────────────

  private enterIdle(duration: number): void {
    this._ai = 'idle'
    this.actionTimer =
      duration > 0
        ? duration
        : IDLE_MIN_DURATION + Math.random() * (IDLE_MAX_DURATION - IDLE_MIN_DURATION)
  }

  private startPacing(): void {
    this._ai = 'pacing'
    this.paceTimer = PACE_DECISION_MIN + Math.random() * (PACE_DECISION_MAX - PACE_DECISION_MIN)
    this.pickPaceDirection()
  }

  private startCastingOrbs(player: Player): void {
    this._ai = 'casting_orbs'
    this.castAnimTimer = 0.5
    this.facePlayer(player)
  }

  private startTeleport(player: Player): void {
    this._ai = 'teleporting'
    this.teleportElapsed = 0
    this.teleportProgress = 0
    this.teleportToRandom(player)
  }

  private startTeleportToRandom(): void {
    this._ai = 'teleporting'
    this.teleportElapsed = 0
    this.teleportProgress = 0
    // Pick random position within arena
    this.teleportTarget.x =
      this.arenaLeft + Math.random() * (this.arenaRight - this.arenaLeft - this.size.x)
    this.teleportTarget.y =
      this.arenaTop + Math.random() * (this.arenaBottom - this.arenaTop - this.size.y)
  }

  private startSummoning(player: Player): void {
    this._ai = 'summoning'
    this.summonTimer = SUMMONING_DURATION
    this.facePlayer(player)
    this._shouldSummon = false
    // Reset resummon timer so it doesn't re-trigger immediately after this summon
    this.minionResummonTimer = -1
    // Pre-calculate spawn positions near Ganon
    this.minionPositions = this.calculateMinionPositions(player)
  }

  /** Phase 4 variant — no player reference needed for facing */
  private startSummoningNoPlayer(): void {
    this._ai = 'summoning'
    this.summonTimer = SUMMONING_DURATION
    this._shouldSummon = false
    this.minionResummonTimer = -1
    // Spawn positions around Ganon (spread evenly)
    this.minionPositions = this.calculateMinionPositionsAroundSelf()
  }

  // ─── Dark Orb Management ──────────────────────────────────────────

  private spawnDarkOrbs(targetX: number, targetY: number): void {
    const activeCount = this.darkOrbs.filter((o) => o.active).length
    if (activeCount >= MAX_DARK_ORBS) return

    const cx = this.pos.x + this.size.x / 2
    const cy = this.pos.y + this.size.y / 2
    const baseAngle = Math.atan2(targetY - cy, targetX - cx)
    const speed =
      this.phase === 'calamity' || this.phase === 'final_stand'
        ? DARK_ORB_FAST_SPEED
        : DARK_ORB_SPEED

    for (let i = -1; i <= 1; i++) {
      if (this.darkOrbs.filter((o) => o.active).length >= MAX_DARK_ORBS) break

      const angle = baseAngle + i * ORB_SPREAD_ANGLE
      this.darkOrbs.push({
        x: cx,
        y: cy,
        dirX: Math.cos(angle),
        dirY: Math.sin(angle),
        speed,
        homingTimer: DARK_ORB_HOMING_DURATION,
        active: true,
        reflectable: true,
        reflectFlashTimer: 0,
      })
    }
  }

  private spawnTripleOrbs(player: Player): void {
    const activeCount = this.darkOrbs.filter((o) => o.active).length
    if (activeCount >= MAX_DARK_ORBS) return

    const cx = this.pos.x + this.size.x / 2
    const cy = this.pos.y + this.size.y / 2
    const pc = player.getCenter()
    const baseAngle = Math.atan2(pc.y - cy, pc.x - cx)
    const spreadRad = TRIPLE_ORB_SPREAD * (Math.PI / 180)

    // Phase 2: non-homing; Phase 3+: homing
    const homing =
      this.phase === 'calamity' || this.phase === 'final_stand' ? DARK_ORB_HOMING_DURATION : 0

    for (let i = -1; i <= 1; i++) {
      if (this.darkOrbs.filter((o) => o.active).length >= MAX_DARK_ORBS) break

      const angle = baseAngle + i * spreadRad
      this.darkOrbs.push({
        x: cx,
        y: cy,
        dirX: Math.cos(angle),
        dirY: Math.sin(angle),
        speed: TRIPLE_ORB_SPEED,
        homingTimer: homing,
        active: true,
        reflectable: true,
        reflectFlashTimer: 0,
      })
    }
  }

  private updateDarkOrbs(dt: number, player: Player, map: TileMap): void {
    for (const orb of this.darkOrbs) {
      if (!orb.active) continue

      // Homing phase: only track player if not reflected
      if (orb.homingTimer > 0 && orb.reflectable) {
        const targetX = player.pos.x + player.size.x / 2
        const targetY = player.pos.y + player.size.y / 2
        const dx = targetX - orb.x
        const dy = targetY - orb.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist >= 1) {
          orb.dirX = dx / dist
          orb.dirY = dy / dist
        }
        orb.homingTimer -= dt
      }

      // Update reflect flash timer
      if (orb.reflectFlashTimer > 0) {
        orb.reflectFlashTimer -= dt
      }

      orb.x += orb.dirX * orb.speed * dt
      orb.y += orb.dirY * orb.speed * dt

      // Wall/pillar collision: deactivate on solid tile
      const tileCol = Math.floor(orb.x / TILE_SIZE)
      const tileRow = Math.floor(orb.y / TILE_SIZE)
      if (tileRow >= 0 && tileRow < map.height && tileCol >= 0 && tileCol < map.width) {
        const tile = map.tiles[tileRow]![tileCol]
        if (tile === 'wall' || tile === 'pillar') {
          orb.active = false
          continue
        }
      }

      // Deactivate if out of arena bounds (with margin)
      const margin = TILE_SIZE * 3
      if (
        orb.x < this.arenaLeft - margin ||
        orb.x > this.arenaRight + margin ||
        orb.y < this.arenaTop - margin ||
        orb.y > this.arenaBottom + margin
      ) {
        orb.active = false
      }
    }

    // Clean up inactive orbs when array grows beyond cap
    if (this.darkOrbs.length > MAX_DARK_ORBS) {
      this.darkOrbs = this.darkOrbs.filter((o) => o.active)
    }
  }

  /** Exposed for Stage3 collision handling */
  getDarkOrbs(): readonly DarkOrb[] {
    return this.darkOrbs
  }

  /** Reverse orb direction (shield deflect) */
  reflectOrb(index: number): void {
    const orb = this.darkOrbs[index]
    if (orb) {
      orb.dirX = -orb.dirX
      orb.dirY = -orb.dirY
      orb.reflectable = false
      orb.homingTimer = 0
      orb.reflectFlashTimer = 0.15 // brief white flash on reflect
    }
  }

  /** Remove orb */
  deactivateOrb(index: number): void {
    if (this.darkOrbs[index]) {
      this.darkOrbs[index]!.active = false
    }
  }

  /** Clear all dark orbs (e.g., on death) */
  clearDarkOrbs(): void {
    this.darkOrbs = []
  }

  // ─── Slash Hitbox ─────────────────────────────────────────────────

  /** Returns slash hitbox if actively slashing, null otherwise */
  getSlashHitbox(): { aabb: AABB; damage: number } | null {
    if (this.slashActive) {
      return { aabb: this.slashHitbox, damage: GANON_DARK_SLASH_DAMAGE }
    }
    return null
  }

  // ─── Ground Slam Info ─────────────────────────────────────────────

  /** Returns slam AoE info for Stage3 to check */
  getSlamInfo(): { center: Vec2; radius: number; active: boolean } {
    return {
      center: { x: this.slamCenter.x, y: this.slamCenter.y },
      radius: GROUND_SLAM_RADIUS,
      active: this.slamActive,
    }
  }

  /** Current charge progress for visual telegraph (0→1) */
  getSlamChargeProgress(): number {
    return this._ai === 'ground_slam_charge' ? this.slamChargeProgress : 0
  }

  // ─── Minion Management ────────────────────────────────────────────

  private updateMinionTimers(dt: number): void {
    // Summon minions in all phases
    if (this.minionTimer > 0) {
      this.minionTimer -= dt
    }
    if (this.minionResummonTimer > 0) {
      this.minionResummonTimer -= dt
    }
  }

  /** Whether to spawn minions this frame (consumed by Stage3) */
  shouldSummonMinions(): boolean {
    if (this._shouldSummon) {
      this._shouldSummon = false
      return true
    }
    return false
  }

  /** Where to spawn minions near Ganon */
  getMinionSpawnPositions(): Vec2[] {
    return this.minionPositions
  }

  /** Get per-phase minion configuration */
  getMinionConfig(): { melee: number; archers: number } {
    return MINION_PHASE_CONFIG[this.phase] ?? { melee: MINION_COUNT, archers: 0 }
  }

  /** Signal that minions have been killed, start resummon timer */
  onMinionsDefeated(): void {
    this.minionResummonTimer = MINION_RESUMMON_DELAY
  }

  private calculateMinionPositions(player: Player): Vec2[] {
    const config = MINION_PHASE_CONFIG[this.phase] ?? { melee: MINION_COUNT, archers: 0 }
    const totalCount = config.melee + config.archers
    const positions: Vec2[] = []
    const center = this.getCenter()
    const pc = player.getCenter()

    for (let i = 0; i < totalCount; i++) {
      // Spawn minions on the opposite side of Ganon from the player
      const angle =
        Math.atan2(center.y - pc.y, center.x - pc.x) + (i - (totalCount - 1) / 2) * Math.PI * 0.4
      let spawnX = center.x + Math.cos(angle) * TILE_SIZE * 3
      let spawnY = center.y + Math.sin(angle) * TILE_SIZE * 3

      // Clamp within arena
      spawnX = Math.max(
        this.arenaLeft + TILE_SIZE,
        Math.min(this.arenaRight - TILE_SIZE * 2, spawnX),
      )
      spawnY = Math.max(
        this.arenaTop + TILE_SIZE,
        Math.min(this.arenaBottom - TILE_SIZE * 2, spawnY),
      )

      positions.push({ x: spawnX, y: spawnY })
    }

    return positions
  }

  /** Spread positions evenly around Ganon (used when no player reference) */
  private calculateMinionPositionsAroundSelf(): Vec2[] {
    const config = MINION_PHASE_CONFIG[this.phase] ?? { melee: MINION_COUNT, archers: 0 }
    const totalCount = config.melee + config.archers
    const positions: Vec2[] = []
    const center = this.getCenter()

    for (let i = 0; i < totalCount; i++) {
      const angle = (i / totalCount) * Math.PI * 2
      let spawnX = center.x + Math.cos(angle) * TILE_SIZE * 3
      let spawnY = center.y + Math.sin(angle) * TILE_SIZE * 3

      spawnX = Math.max(
        this.arenaLeft + TILE_SIZE,
        Math.min(this.arenaRight - TILE_SIZE * 2, spawnX),
      )
      spawnY = Math.max(
        this.arenaTop + TILE_SIZE,
        Math.min(this.arenaBottom - TILE_SIZE * 2, spawnY),
      )

      positions.push({ x: spawnX, y: spawnY })
    }

    return positions
  }

  // ─── Intangibility ────────────────────────────────────────────────

  /** True during teleport invisible phase (Stage3 skips damage) */
  isIntangible(): boolean {
    if (this._ai !== 'teleporting') return false
    // Intangible during the invisible portion of teleport
    return this.teleportProgress >= 0.9
  }

  // ─── Arena Bounds ─────────────────────────────────────────────────

  private clampToArena(): void {
    this.pos.x = Math.max(this.arenaLeft, Math.min(this.arenaRight - this.size.x, this.pos.x))
    this.pos.y = Math.max(this.arenaTop, Math.min(this.arenaBottom - this.size.y, this.pos.y))
  }

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
    this.paceDir.x = Math.random() > 0.5 ? 1 : -1
    this.paceDir.y = (Math.random() - 0.5) * 0.5
    const len = Math.sqrt(this.paceDir.x * this.paceDir.x + this.paceDir.y * this.paceDir.y)
    if (len > 0) {
      this.paceDir.x /= len
      this.paceDir.y /= len
    }
  }

  private teleportToRandom(player: Player): void {
    const pc = player.getCenter()
    // Try up to 10 times to find a position far enough from player
    for (let attempt = 0; attempt < 10; attempt++) {
      const x = this.arenaLeft + Math.random() * (this.arenaRight - this.arenaLeft - this.size.x)
      const y = this.arenaTop + Math.random() * (this.arenaBottom - this.arenaTop - this.size.y)
      const dx = x + this.size.x / 2 - pc.x
      const dy = y + this.size.y / 2 - pc.y
      if (dx * dx + dy * dy >= TELEPORT_MIN_PLAYER_DIST * TELEPORT_MIN_PLAYER_DIST) {
        this.teleportTarget.x = x
        this.teleportTarget.y = y
        return
      }
    }
    // Fallback: just pick any position
    this.teleportTarget.x =
      this.arenaLeft + Math.random() * (this.arenaRight - this.arenaLeft - this.size.x)
    this.teleportTarget.y =
      this.arenaTop + Math.random() * (this.arenaBottom - this.arenaTop - this.size.y)
  }

  // ─── Drawing ──────────────────────────────────────────────────────

  override draw(ctx: CanvasRenderingContext2D): void {
    if (this.isFullyDead()) return

    // Draw charge circle telegraph during ground_slam_charge
    if (this._ai === 'ground_slam_charge') {
      this.drawSlamChargeTelegraph(ctx)
    }

    // Slam impact visual — now handled by Stage3 via effects.emit() (migrated Phase 4)

    // Teleport: become invisible at full progress — smoke handled by Stage3 via effects.emit()
    if (this._ai === 'teleporting' && this.teleportProgress >= 0.9) return

    this.drawWithBlink(ctx, () => {
      ctx.save()

      // Phase 4 semi-transparency
      if (this.isTransparent) {
        ctx.globalAlpha = 0.7
      }

      // Teleport fading
      if (this._ai === 'teleporting') {
        ctx.globalAlpha = Math.min(ctx.globalAlpha, 1 - this.teleportProgress)
      }

      // Death animation — fade out
      if (this.isDying()) {
        ctx.globalAlpha = 1 - this.getDeathProgress()
      }

      // Stunned visual — pulsing transparency
      if (this._ai === 'stunned') {
        ctx.globalAlpha = Math.min(ctx.globalAlpha, 0.5 + Math.sin(Date.now() * 0.01) * 0.2)
      }

      // Phase 3+ dark energy glow
      if (this.phase === 'calamity' || this.phase === 'final_stand') {
        ctx.shadowColor = '#8B00FF'
        ctx.shadowBlur = 20
      }

      // Draw Ganon body (procedural — dark armored figure)
      this.drawGanonBody(ctx)

      ctx.restore()
    })

    // Draw dark slash arc effect
    if (this._ai === 'dark_slash' && this.slashPhase === 'active') {
      this.drawDarkSlashEffect(ctx)
    }

    // Draw dark orbs
    this.drawDarkOrbs(ctx)
  }

  /** Render all active dark orbs — called from draw() */
  private drawDarkOrbs(ctx: CanvasRenderingContext2D): void {
    for (const orb of this.darkOrbs) {
      if (!orb.active) continue

      const radius = DARK_ORB_SIZE / 2
      ctx.save()

      if (orb.reflectFlashTimer > 0) {
        // Reflect flash: bright white glow
        ctx.shadowColor = '#FFFFFF'
        ctx.shadowBlur = 16
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, radius + 2, 0, Math.PI * 2)
        ctx.fill()
      } else if (!orb.reflectable) {
        // Reflected orb: golden glow (heading back to Ganon)
        ctx.shadowColor = '#FFD700'
        ctx.shadowBlur = 12
        ctx.fillStyle = '#FFD700'
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, radius, 0, Math.PI * 2)
        ctx.fill()
      } else {
        // Normal dark orb: purple-black
        ctx.shadowColor = '#8B00FF'
        ctx.shadowBlur = 10
        ctx.fillStyle = '#2D0050'
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, radius, 0, Math.PI * 2)
        ctx.fill()
        // Inner glow
        ctx.fillStyle = '#6B00B3'
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, radius * 0.5, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
    }
  }

  private drawGanonBody(ctx: CanvasRenderingContext2D): void {
    const x = this.pos.x
    const y = this.pos.y
    const s = GANON_SPRITE_SIZE

    // Dark cape/body
    ctx.fillStyle = '#1A0A2E'
    ctx.fillRect(x + s * 0.15, y + s * 0.2, s * 0.7, s * 0.7)

    // Armor shoulders
    ctx.fillStyle = '#2D1B4E'
    ctx.fillRect(x + s * 0.08, y + s * 0.25, s * 0.84, s * 0.2)

    // Dark face/helmet
    ctx.fillStyle = '#0D0D1A'
    ctx.fillRect(x + s * 0.25, y + s * 0.05, s * 0.5, s * 0.25)

    // Glowing eyes
    const eyeY = y + s * 0.15
    if (this.direction === 'left' || this.direction === 'down' || this.direction === 'up') {
      ctx.fillStyle = '#FF4400'
      ctx.fillRect(x + s * 0.3, eyeY, s * 0.08, s * 0.06)
    }
    if (this.direction === 'right' || this.direction === 'down' || this.direction === 'up') {
      ctx.fillStyle = '#FF4400'
      ctx.fillRect(x + s * 0.62, eyeY, s * 0.08, s * 0.06)
    }

    // Gold trim on armor
    ctx.fillStyle = '#B8860B'
    ctx.fillRect(x + s * 0.35, y + s * 0.3, s * 0.3, s * 0.04)

    // Dark energy wisps are now emitted via effects system in Stage3 (Phase 4 migration)
  }

  private drawDarkSlashEffect(ctx: CanvasRenderingContext2D): void {
    const center = this.getCenter()
    const reach = GANON_DARK_SLASH_RANGE * 0.9
    const angle = Physics.directionToAngle(this.direction)

    ctx.save()
    ctx.globalAlpha = 0.6
    ctx.strokeStyle = '#8B00FF'
    ctx.lineWidth = 4
    ctx.shadowColor = '#8B00FF'
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.arc(center.x, center.y, reach, angle - 1.0, angle + 1.0)
    ctx.stroke()
    // Inner arc
    ctx.strokeStyle = '#FF00FF'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(center.x, center.y, reach * 0.7, angle - 0.8, angle + 0.8)
    ctx.stroke()
    ctx.restore()
  }

  private drawSlamChargeTelegraph(ctx: CanvasRenderingContext2D): void {
    const cx = this.slamCenter.x
    const cy = this.slamCenter.y
    const radius = GROUND_SLAM_RADIUS * this.slamChargeProgress

    ctx.save()
    ctx.globalAlpha = 0.2 + this.slamChargeProgress * 0.3
    ctx.strokeStyle = '#FF4400'
    ctx.lineWidth = 3
    ctx.setLineDash([8, 4])
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.stroke()

    // Inner pulsing circle
    ctx.setLineDash([])
    ctx.globalAlpha = 0.15
    ctx.fillStyle = '#FF2200'
    ctx.beginPath()
    ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}
