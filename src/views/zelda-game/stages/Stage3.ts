import type { TileMap, InputState, StageObjective, Vec2, HeartPickup, DestructiblePillar, GanonPhase } from '../utils/types'
import {
  TILE_SIZE,
  HEART_HEAL_AMOUNT,
  HEART_PICKUP_RADIUS,
  DARK_ORB_DAMAGE,
  DARK_ORB_REFLECT_DAMAGE,
  DARK_ORB_SIZE,
  GROUND_SLAM_DAMAGE,
  VICTORY_SEQUENCE_DURATION,
  CRYSTAL_SHATTER_DURATION,
  GANON_HP,
} from '../utils/constants'
import { Ganon } from '../entities/Ganon'
import { Bokoblin } from '../entities/Bokoblin'
import { Physics } from '../engine/Physics'
import type { Renderer } from '../engine/Renderer'
import type { Player } from '../entities/Player'
import type { Enemy } from '../entities/Enemy'
import {
  CASTLE_PLAYER_SPAWN,
  CASTLE_GANON_SPAWN,
  CASTLE_ZELDA_POSITION,
  CASTLE_PILLAR_POSITIONS,
  createCastleMap,
  destroyPillar,
} from '../maps/castle'
import { drawHeartPickup, drawBossHealthBar } from '../utils/sprites'
import type { IStage } from './IStage'

// Boss intro overlay timing
const BOSS_INTRO_TIME = 3.0
const INTRO_FADE_SPEED = 1.5

// Victory dialog
const DIALOG_LINES = [
  'Link... anh đã đến vì em.',
  'Hyrule đã được cứu.',
  'Cảm ơn anh, người anh hùng.',
  'Hãy cùng trở về nhà.',
]
const DIALOG_LINE_DELAY = 2.5

// Phase display names
const PHASE_NAMES: Record<GanonPhase, string> = {
  dark_sorcery: 'Hắc Thuật',
  teleportation: 'Dịch Chuyển',
  calamity: 'Đại Tai Họa',
  final_stand: 'Trận Chiến Cuối',
}

// Pillar HP for player-destructible pillars
const PILLAR_HP = 3

type BossState = 'intro' | 'fighting' | 'defeated' | 'victory_dialog' | 'victory_stats' | 'completed'

export class Stage3 implements IStage {
  // ─── IStage ──────────────────────────────────────────────────────
  get playerSpawn(): Vec2 {
    return { ...CASTLE_PLAYER_SPAWN }
  }

  // ─── State Machine ───────────────────────────────────────────────
  private bossState: BossState = 'intro'
  private stateTimer = BOSS_INTRO_TIME

  // ─── Entities ────────────────────────────────────────────────────
  private ganon: Ganon | null = null
  private minions: Enemy[] = []
  private pillars: DestructiblePillar[] = []
  private heartPickups: HeartPickup[] = []

  // ─── Stats Tracking ──────────────────────────────────────────────
  private startTime = 0
  private totalEnemiesDefeated = 0
  private totalDamageTaken = 0
  private playerMaxHealthSeen = 0

  // ─── Objectives ──────────────────────────────────────────────────
  private objectives: StageObjective[] = [
    { id: 'defeat_ganon', description: 'Đánh bại Ganon', completed: false },
  ]

  // ─── Intro / Victory Visuals ─────────────────────────────────────
  private introOpacity = 1
  private defeatTimer = 0
  private crystalShatterProgress = 0
  private victoryAction: 'play_again' | 'home' | null = null
  private dialogIndex = 0
  private dialogTimer = 0

  // ─── Phase Tracking ──────────────────────────────────────────────
  private lastKnownPhase: GanonPhase = 'dark_sorcery'
  private vignetteIntensity = 0

  // ─── Slam hit dedup ──────────────────────────────────────────────
  private slamHitThisSlam = false
  private slamShakeTriggered = false

  // ─── Camera shake request ─────────────────────────────────────────
  private pendingShakeIntensity = 0
  private pendingShakeDuration = 0

  // ─── Slash hit dedup ─────────────────────────────────────────────
  private lastSlashHitFrame = -1
  private frameCounter = 0

  // ─── Pillar HP map ───────────────────────────────────────────────
  private pillarHp: Map<string, number> = new Map()
  private lastPillarSwingID = -1

  // ────────────────────────────────────────────────────────────────
  // Main Update
  // ────────────────────────────────────────────────────────────────

  update(dt: number, player: Player, map: TileMap, input: InputState): void {
    this.frameCounter++

    // Track max health
    if (player.maxHealth > this.playerMaxHealthSeen) {
      this.playerMaxHealthSeen = player.maxHealth
    }

    switch (this.bossState) {
      case 'intro':
        this.updateIntro(dt, player, map, input)
        break
      case 'fighting':
        this.updateFighting(dt, player, map)
        break
      case 'defeated':
        this.updateDefeated(dt)
        break
      case 'victory_dialog':
        this.updateVictoryDialog(dt, input)
        break
      case 'victory_stats':
        this.updateVictoryStats(input)
        break
    }

    // Update heart pickups (always)
    this.updateHeartPickups(dt, player)
  }

  // ────────────────────────────────────────────────────────────────
  // Intro State
  // ────────────────────────────────────────────────────────────────

  private updateIntro(dt: number, player: Player, map: TileMap, input: InputState): void {
    this.stateTimer -= dt

    if (this.stateTimer <= 0 || input.interactJustPressed) {
      this.bossState = 'fighting'
      this.introOpacity = 0

      // Create the arena map
      const castleMap = createCastleMap()
      map.width = castleMap.width
      map.height = castleMap.height
      map.tiles = castleMap.tiles
      map.theme = castleMap.theme

      // Init pillars
      this.pillars = CASTLE_PILLAR_POSITIONS.map(p => ({ ...p }))
      for (const pillar of this.pillars) {
        this.pillarHp.set(`${pillar.col},${pillar.row}`, PILLAR_HP)
      }

      // Spawn Ganon
      const arenaBounds = {
        minX: 1 * TILE_SIZE,
        minY: 1 * TILE_SIZE,
        maxX: (map.width - 1) * TILE_SIZE,
        maxY: (map.height - 1) * TILE_SIZE,
      }
      this.ganon = new Ganon(CASTLE_GANON_SPAWN, arenaBounds)

      // Move player to spawn
      player.pos.x = CASTLE_PLAYER_SPAWN.x - player.size.x / 2
      player.pos.y = CASTLE_PLAYER_SPAWN.y - player.size.y / 2

      this.startTime = Date.now()
      return
    }

    // Fade intro overlay
    if (this.stateTimer < 1) {
      this.introOpacity = Math.max(0, this.introOpacity - dt * INTRO_FADE_SPEED)
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Fighting State
  // ────────────────────────────────────────────────────────────────

  private updateFighting(dt: number, player: Player, map: TileMap): void {
    // Death check FIRST — prevents victory/death same-frame race
    if (!player.isAlive()) return

    if (!this.ganon || !this.ganon.isAlive()) {
      if (this.ganon && !this.ganon.isAlive() && this.bossState === 'fighting') {
        this.onGanonDefeated()
      }
      return
    }

    // 1. Update Ganon AI
    this.ganon.update(dt, player, map)

    // 2. Detect phase transitions → pillar destruction
    const currentPhase = this.ganon.getPhase()
    if (currentPhase !== this.lastKnownPhase) {
      this.handlePhaseTransition(currentPhase, map)
      this.lastKnownPhase = currentPhase
    }

    // 3. Process player attacks on Ganon
    if (!this.ganon.isIntangible()) {
      this.processPlayerAttackOnBoss(player, map)
    }

    // 4. Dark orb collisions (shield-reflect)
    this.updateDarkOrbCollisions(player)

    // 5. Ganon's dark slash → player damage
    this.checkDarkSlashHit(player)

    // 6. Ground slam AoE → player damage
    this.checkGroundSlamHit(player)

    // 7. Minion management
    this.updateMinions(dt, player, map)

    // 8. Handle minion summoning signal
    if (this.ganon.shouldSummonMinions()) {
      this.spawnMinions()
    }

    // 9. Process player attacks on minions
    this.processPlayerAttackOnMinions(player, map)

    // 10. Process player attacks on pillars
    this.processPlayerAttackOnPillars(player, map)

    // 11. Check Ganon defeated
    if (!this.ganon.isAlive()) {
      this.onGanonDefeated()
    }

    // 12. Update vignette for Phase 3+
    if (currentPhase === 'calamity' || currentPhase === 'final_stand') {
      this.vignetteIntensity = Math.min(1, this.vignetteIntensity + dt * 0.5)
    }

    // Track damage
    const prevHealth = player.health
    // Note: damage tracking is done in checkDarkSlashHit, checkGroundSlamHit, updateDarkOrbCollisions
    void prevHealth
  }

  // ────────────────────────────────────────────────────────────────
  // Player Attack on Boss
  // ────────────────────────────────────────────────────────────────

  private processPlayerAttackOnBoss(player: Player, map: TileMap): void {
    if (!this.ganon || !this.ganon.isAlive()) return
    const combat = player.getCombatResult()
    if (!combat?.hitbox) return

    // Sword attack (dedup via lastHitSwingID)
    if (combat.swingID !== this.ganon.lastHitSwingID) {
      if (Physics.overlaps(combat.hitbox.aabb, this.ganon.getAABB())) {
        this.ganon.takeDamage(combat.hitbox.damage)
        this.ganon.lastHitSwingID = combat.swingID

        // Knockback
        const ec = this.ganon.getCenter()
        const pc = player.getCenter()
        const dx = ec.x - pc.x
        const dy = ec.y - pc.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 0) {
          const kbForce = combat.hitbox.knockback
          const pushed = Physics.resolveMovement(
            map,
            this.ganon.pos,
            { x: this.ganon.pos.x + (dx / dist) * kbForce, y: this.ganon.pos.y + (dy / dist) * kbForce },
            this.ganon.size,
          )
          this.ganon.pos.x = pushed.x
          this.ganon.pos.y = pushed.y
        }
      }
    }
    // Bow projectile hits handled by ProjectileManager → getEnemies()
  }

  // ────────────────────────────────────────────────────────────────
  // Dark Orb Collision + Shield Reflect
  // ────────────────────────────────────────────────────────────────

  private updateDarkOrbCollisions(player: Player): void {
    if (!this.ganon) return
    const orbs = this.ganon.getDarkOrbs()
    const playerAABB = player.getAABB()
    const ganonAABB = this.ganon.getAABB()

    for (let i = 0; i < orbs.length; i++) {
      const orb = orbs[i]!
      if (!orb.active) continue

      const orbAABB = {
        x: orb.x - DARK_ORB_SIZE / 2,
        y: orb.y - DARK_ORB_SIZE / 2,
        width: DARK_ORB_SIZE,
        height: DARK_ORB_SIZE,
      }

      // Check reflected orb hitting Ganon
      if (!orb.reflectable && Physics.overlaps(orbAABB, ganonAABB)) {
        this.ganon.takeDamage(DARK_ORB_REFLECT_DAMAGE)
        this.ganon.deactivateOrb(i)
        continue
      }

      // Check orb hitting player
      if (Physics.overlaps(orbAABB, playerAABB)) {
        if (orb.reflectable && player.isBlocking()) {
          // Shield reflect
          this.ganon.reflectOrb(i)
        } else if (orb.reflectable) {
          // Direct hit on player
          if (!player.isInvulnerable()) {
            player.takeDamage(DARK_ORB_DAMAGE)
            this.totalDamageTaken += DARK_ORB_DAMAGE
          }
          this.ganon.deactivateOrb(i)
        }
      }
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Dark Slash Check
  // ────────────────────────────────────────────────────────────────

  private checkDarkSlashHit(player: Player): void {
    if (!this.ganon) return
    const slash = this.ganon.getSlashHitbox()
    if (!slash) return
    // Dedup: only hit once per slash activation
    if (this.lastSlashHitFrame === this.frameCounter) return
    if (!player.isInvulnerable()) {
      if (Physics.overlaps(slash.aabb, player.getAABB())) {
        player.takeDamage(slash.damage)
        this.totalDamageTaken += slash.damage
        this.lastSlashHitFrame = this.frameCounter
      }
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Ground Slam Check
  // ────────────────────────────────────────────────────────────────

  private checkGroundSlamHit(player: Player): void {
    if (!this.ganon) return
    const slamInfo = this.ganon.getSlamInfo()
    if (!slamInfo.active) {
      this.slamHitThisSlam = false
      this.slamShakeTriggered = false
      return
    }
    // Trigger camera shake once per slam
    if (!this.slamShakeTriggered) {
      this.pendingShakeIntensity = Math.max(this.pendingShakeIntensity, 10)
      this.pendingShakeDuration = Math.max(this.pendingShakeDuration, 0.5)
      this.slamShakeTriggered = true
    }
    // Only hit once per slam
    if (this.slamHitThisSlam) return

    const playerCenter = player.getCenter()
    const dx = playerCenter.x - slamInfo.center.x
    const dy = playerCenter.y - slamInfo.center.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist <= slamInfo.radius) {
      // Ground slam is UNBLOCKABLE — bypass takeDamage shield check
      player.takeDamage(GROUND_SLAM_DAMAGE)
      this.totalDamageTaken += GROUND_SLAM_DAMAGE
      this.slamHitThisSlam = true
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Minion Management
  // ────────────────────────────────────────────────────────────────

  private spawnMinions(): void {
    if (!this.ganon) return
    const positions = this.ganon.getMinionSpawnPositions()
    for (const pos of positions) {
      const minion = new Bokoblin({ ...pos }, [])
      minion.setAggressive()
      this.minions.push(minion)
    }
  }

  private updateMinions(dt: number, player: Player, map: TileMap): void {
    const toRemove: number[] = []
    for (let i = 0; i < this.minions.length; i++) {
      const minion = this.minions[i]!
      if (!minion.isFullyDead()) {
        minion.updateAI(dt, player, map)
      }
      if (minion.isFullyDead()) {
        this.totalEnemiesDefeated++
        this.spawnHeartPickup(minion.pos.x + minion.size.x / 2, minion.pos.y + minion.size.y / 2)
        toRemove.push(i)
      }
    }
    // Remove dead minions (reverse order to preserve indices)
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.minions.splice(toRemove[i]!, 1)
    }
    // Signal Ganon when all minions are defeated so resummon timer starts
    if (toRemove.length > 0 && this.minions.length === 0 && this.ganon) {
      this.ganon.onMinionsDefeated()
    }
  }

  private processPlayerAttackOnMinions(player: Player, map: TileMap): void {
    const combat = player.getCombatResult()
    if (!combat?.hitbox) return

    for (const minion of this.minions) {
      if (!minion.isAlive() || minion.isDying()) continue
      if (combat.swingID !== minion.lastHitSwingID) {
        if (Physics.overlaps(combat.hitbox.aabb, minion.getAABB())) {
          minion.takeDamage(combat.hitbox.damage)
          minion.lastHitSwingID = combat.swingID

          // Knockback
          const ec = minion.getCenter()
          const pc = player.getCenter()
          const dx = ec.x - pc.x
          const dy = ec.y - pc.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > 0) {
            const kbForce = combat.hitbox.knockback
            const pushed = Physics.resolveMovement(
              map,
              minion.pos,
              { x: minion.pos.x + (dx / dist) * kbForce, y: minion.pos.y + (dy / dist) * kbForce },
              minion.size,
            )
            minion.pos.x = pushed.x
            minion.pos.y = pushed.y
          }
        }
      }
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Pillar Destruction
  // ────────────────────────────────────────────────────────────────

  private handlePhaseTransition(newPhase: GanonPhase, map: TileMap): void {
    // Trigger camera shake on every phase transition
    this.pendingShakeIntensity = Math.max(this.pendingShakeIntensity, 14)
    this.pendingShakeDuration = Math.max(this.pendingShakeDuration, 0.7)
    switch (newPhase) {
      case 'teleportation':
        this.destroyRandomPillars(1, map)
        break
      case 'calamity':
        this.destroyRandomPillars(2, map)
        break
      case 'final_stand':
        break
    }
  }

  private destroyRandomPillars(count: number, map: TileMap): void {
    const available = this.pillars.filter(p => !p.destroyed)
    const toDestroy = available.slice(0, count)
    for (const pillar of toDestroy) {
      if (
        pillar.row >= 0 && pillar.row < map.tiles.length &&
        pillar.col >= 0 && pillar.col < map.tiles[0]!.length
      ) {
        const pillarPixelX = pillar.col * TILE_SIZE
        const pillarPixelY = pillar.row * TILE_SIZE
        destroyPillar(map, pillar)
        this.spawnHeartPickup(pillarPixelX + TILE_SIZE / 2, pillarPixelY + TILE_SIZE / 2)
      }
    }
  }

  private processPlayerAttackOnPillars(player: Player, map: TileMap): void {
    const combat = player.getCombatResult()
    if (!combat?.hitbox) return
    // Dedup: only process once per swing
    if (combat.swingID === this.lastPillarSwingID) return

    let hitAny = false
    for (const pillar of this.pillars) {
      if (pillar.destroyed) continue
      const pillarPixelX = pillar.col * TILE_SIZE
      const pillarPixelY = pillar.row * TILE_SIZE
      const pillarAABB = { x: pillarPixelX, y: pillarPixelY, width: TILE_SIZE, height: TILE_SIZE }
      if (Physics.overlaps(combat.hitbox.aabb, pillarAABB)) {
        const key = `${pillar.col},${pillar.row}`
        const hp = (this.pillarHp.get(key) ?? PILLAR_HP) - 1
        this.pillarHp.set(key, hp)
        hitAny = true
        if (hp <= 0) {
          destroyPillar(map, pillar)
          this.spawnHeartPickup(pillarPixelX + TILE_SIZE / 2, pillarPixelY + TILE_SIZE / 2)
        }
      }
    }
    if (hitAny) {
      this.lastPillarSwingID = combat.swingID
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Heart Pickups
  // ────────────────────────────────────────────────────────────────

  private spawnHeartPickup(x: number, y: number): void {
    this.heartPickups.push({ x, y, active: true, floatTimer: 0 })
  }

  private updateHeartPickups(dt: number, player: Player): void {
    const playerCenter = player.getCenter()
    for (const heart of this.heartPickups) {
      if (!heart.active) continue
      heart.floatTimer += dt
      const dx = playerCenter.x - heart.x
      const dy = playerCenter.y - heart.y
      if (dx * dx + dy * dy < HEART_PICKUP_RADIUS * HEART_PICKUP_RADIUS) {
        heart.active = false
        player.heal(HEART_HEAL_AMOUNT)
      }
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Defeat + Victory
  // ────────────────────────────────────────────────────────────────

  private onGanonDefeated(): void {
    this.bossState = 'defeated'
    this.defeatTimer = VICTORY_SEQUENCE_DURATION
    this.crystalShatterProgress = 0
    this.totalEnemiesDefeated++ // Count Ganon

    // Kill all remaining minions
    for (const minion of this.minions) {
      if (minion.isAlive()) {
        minion.takeDamage(9999)
        this.totalEnemiesDefeated++
      }
    }

    // Clear dark orbs
    if (this.ganon) {
      this.ganon.clearDarkOrbs()
    }

    this.objectives[0]!.completed = true
  }

  private updateDefeated(dt: number): void {
    this.defeatTimer -= dt
    this.crystalShatterProgress = Math.min(1, this.crystalShatterProgress + dt / CRYSTAL_SHATTER_DURATION)

    // Update dying entities
    if (this.ganon && this.ganon.isDying()) {
      this.ganon.updateDeathTimer(dt)
    }
    for (const minion of this.minions) {
      if (minion.isDying()) {
        minion.updateDeathTimer(dt)
      }
    }

    if (this.defeatTimer <= 0) {
      this.bossState = 'victory_dialog'
      this.dialogIndex = 0
      this.dialogTimer = DIALOG_LINE_DELAY
    }
  }

  private updateVictoryDialog(dt: number, input: InputState): void {
    this.dialogTimer -= dt
    if (this.dialogTimer <= 0 || input.interactJustPressed) {
      this.dialogIndex++
      this.dialogTimer = DIALOG_LINE_DELAY
      if (this.dialogIndex >= DIALOG_LINES.length) {
        this.bossState = 'victory_stats'
        this.victoryAction = null
      }
    }
  }

  private updateVictoryStats(input: InputState): void {
    // Navigate between buttons
    if (input.interactJustPressed || input.attackJustPressed) {
      if (this.victoryAction === null) {
        this.victoryAction = 'play_again'
      } else {
        this.bossState = 'completed'
      }
    }
    // Allow switching between options
    if (input.left || input.right) {
      if (this.victoryAction === 'play_again') {
        this.victoryAction = 'home'
      } else if (this.victoryAction === 'home') {
        this.victoryAction = 'play_again'
      }
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Draw
  // ────────────────────────────────────────────────────────────────

  draw(ctx: CanvasRenderingContext2D, _renderer: Renderer, _map: TileMap): void {
    switch (this.bossState) {
      case 'intro':
        this.drawIntroOverlay(ctx)
        break
      case 'fighting':
        this.drawFighting(ctx)
        break
      case 'defeated':
        this.drawDefeatedSequence(ctx)
        break
      case 'victory_dialog':
        this.drawVictoryDialog(ctx)
        break
      case 'victory_stats':
        this.drawVictoryStats(ctx)
        break
    }
  }

  // ─── Intro Overlay ─────────────────────────────────────────────

  private drawIntroOverlay(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0.6, this.introOpacity)})`
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    const cx = ctx.canvas.width / 2
    const cy = ctx.canvas.height / 2

    ctx.textAlign = 'center'
    ctx.fillStyle = '#8B00FF'
    ctx.font = 'bold 28px monospace'
    ctx.fillText('⚔️ GANON ⚔️', cx, cy - 30)

    ctx.fillStyle = '#F0EDE6'
    ctx.font = '15px monospace'
    ctx.fillText('Vua quỷ của bóng tối', cx, cy + 5)

    ctx.fillStyle = '#CC4444'
    ctx.font = '13px monospace'
    ctx.fillText('Trận chiến cuối cùng bắt đầu...', cx, cy + 30)

    if (this.stateTimer <= 0) {
      ctx.fillStyle = '#8B9DB5'
      ctx.font = '13px monospace'
      ctx.fillText('Nhấn F để tiếp tục', cx, cy + 60)
    }

    ctx.textAlign = 'start'
    ctx.restore()
  }

  // ─── Fighting Draw ─────────────────────────────────────────────

  private drawFighting(ctx: CanvasRenderingContext2D): void {
    // 1. Draw Zelda crystal
    this.drawZeldaCrystal(ctx)

    // 2. Draw minions
    for (const minion of this.minions) {
      if (!minion.isFullyDead()) {
        minion.draw(ctx)
      }
    }

    // 3. Draw Ganon (has its own draw with dark orbs, slash, slam telegraph)
    if (this.ganon && !this.ganon.isFullyDead()) {
      this.ganon.draw(ctx)
    }

    // 4. Draw heart pickups
    for (const heart of this.heartPickups) {
      if (!heart.active) continue
      const floatOffset = Math.sin(heart.floatTimer * 3) * 4
      drawHeartPickup(ctx, heart.x, heart.y, floatOffset)
    }

    // 5. Draw boss health bar (HUD)
    if (this.ganon && this.ganon.isAlive()) {
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      drawBossHealthBar(ctx, this.ganon.health, GANON_HP, 'GANON')

      // Phase indicator
      const phase = this.ganon.getPhase()
      ctx.fillStyle = '#8B00FF'
      ctx.font = '11px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(PHASE_NAMES[phase], ctx.canvas.width / 2, 44)
      ctx.textAlign = 'start'
      ctx.restore()
    }

    // 6. Vignette overlay for Phase 3+
    if (this.vignetteIntensity > 0) {
      this.drawVignette(ctx)
    }
  }

  // ─── Zelda Crystal ─────────────────────────────────────────────

  private drawZeldaCrystal(ctx: CanvasRenderingContext2D): void {
    const { x, y } = CASTLE_ZELDA_POSITION
    const t = Date.now() * 0.002

    ctx.save()

    // Crystal glow
    ctx.shadowColor = '#00BFFF'
    ctx.shadowBlur = 15 + Math.sin(t) * 5

    // Crystal body (diamond shape)
    ctx.fillStyle = 'rgba(0, 191, 255, 0.4)'
    ctx.beginPath()
    ctx.moveTo(x, y - 16)
    ctx.lineTo(x + 10, y)
    ctx.lineTo(x, y + 16)
    ctx.lineTo(x - 10, y)
    ctx.closePath()
    ctx.fill()

    // Inner glow
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  // ─── Vignette ──────────────────────────────────────────────────

  private drawVignette(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    const w = ctx.canvas.width
    const h = ctx.canvas.height
    const gradient = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.8)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    gradient.addColorStop(1, `rgba(40, 0, 60, ${0.4 * this.vignetteIntensity})`)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)
    ctx.restore()
  }

  // ─── Defeated Sequence ─────────────────────────────────────────

  private drawDefeatedSequence(ctx: CanvasRenderingContext2D): void {
    // Keep drawing Ganon dissolve
    if (this.ganon && !this.ganon.isFullyDead()) {
      this.ganon.draw(ctx)
    }

    // Crystal shatter effect
    if (this.crystalShatterProgress > 0) {
      this.drawCrystalShatter(ctx)
    }

    // Overlay
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    const cx = ctx.canvas.width / 2
    const cy = ctx.canvas.height / 2
    const alpha = Math.min(0.5, this.crystalShatterProgress * 0.8)
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    ctx.textAlign = 'center'
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 22px monospace'
    ctx.fillText('✨ Chiến thắng! ✨', cx, cy - 10)
    ctx.fillStyle = '#F0EDE6'
    ctx.font = '15px monospace'
    ctx.fillText('Ganon đã bị phong ấn!', cx, cy + 18)
    ctx.textAlign = 'start'
    ctx.restore()
  }

  private drawCrystalShatter(ctx: CanvasRenderingContext2D): void {
    const { x, y } = CASTLE_ZELDA_POSITION
    const progress = this.crystalShatterProgress

    ctx.save()
    ctx.globalAlpha = 1 - progress

    // Expanding shatter particles
    const particleCount = 8
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const dist = progress * 40
      const px = x + Math.cos(angle) * dist
      const py = y + Math.sin(angle) * dist

      ctx.fillStyle = '#00BFFF'
      ctx.shadowColor = '#00BFFF'
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.arc(px, py, 3 * (1 - progress), 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  // ─── Victory Dialog ────────────────────────────────────────────

  private drawVictoryDialog(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    // Background overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    const cx = ctx.canvas.width / 2
    const cy = ctx.canvas.height / 2

    // Zelda icon
    ctx.fillStyle = '#00BFFF'
    ctx.font = '24px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('👸', cx, cy - 50)

    // Speaker name
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 16px monospace'
    ctx.fillText('Zelda', cx, cy - 25)

    // Current dialog line
    if (this.dialogIndex < DIALOG_LINES.length) {
      ctx.fillStyle = '#F0EDE6'
      ctx.font = '14px monospace'
      ctx.fillText(DIALOG_LINES[this.dialogIndex]!, cx, cy + 5)
    }

    // Continue prompt
    ctx.fillStyle = '#8B9DB5'
    ctx.font = '12px monospace'
    ctx.fillText('Nhấn F để tiếp tục', cx, cy + 40)

    // Progress indicator
    ctx.fillStyle = '#555'
    ctx.font = '11px monospace'
    ctx.fillText(`${this.dialogIndex + 1}/${DIALOG_LINES.length}`, cx, cy + 60)

    ctx.textAlign = 'start'
    ctx.restore()
  }

  // ─── Victory Stats ─────────────────────────────────────────────

  private drawVictoryStats(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    const cx = ctx.canvas.width / 2
    let y = ctx.canvas.height / 2 - 90

    // Title
    ctx.textAlign = 'center'
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 22px monospace'
    ctx.fillText('🏆 Kết quả 🏆', cx, y)
    y += 40

    // Time
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000)
    const minutes = Math.floor(elapsed / 60)
    const seconds = elapsed % 60
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`
    ctx.fillStyle = '#F0EDE6'
    ctx.font = '15px monospace'
    ctx.fillText(`⏱ Thời gian: ${timeStr}`, cx, y)
    y += 28

    // Enemies defeated
    ctx.fillText(`⚔️ Kẻ địch bị hạ: ${this.totalEnemiesDefeated}`, cx, y)
    y += 28

    // Damage taken
    ctx.fillText(`💔 Sát thương nhận: ${this.totalDamageTaken}`, cx, y)
    y += 50

    // Buttons
    const btnWidth = 120
    const btnHeight = 32
    const btnGap = 20
    const btn1X = cx - btnWidth - btnGap / 2
    const btn2X = cx + btnGap / 2
    const btnY = y

    // "Chơi lại" button
    ctx.fillStyle = this.victoryAction === 'play_again' ? '#FFD700' : '#555'
    ctx.fillRect(btn1X, btnY, btnWidth, btnHeight)
    ctx.fillStyle = this.victoryAction === 'play_again' ? '#000' : '#F0EDE6'
    ctx.font = 'bold 14px monospace'
    ctx.fillText('Chơi lại', btn1X + btnWidth / 2, btnY + 21)

    // "Trang chủ" button
    ctx.fillStyle = this.victoryAction === 'home' ? '#FFD700' : '#555'
    ctx.fillRect(btn2X, btnY, btnWidth, btnHeight)
    ctx.fillStyle = this.victoryAction === 'home' ? '#000' : '#F0EDE6'
    ctx.fillText('Trang chủ', btn2X + btnWidth / 2, btnY + 21)

    // Instructions
    ctx.fillStyle = '#8B9DB5'
    ctx.font = '12px monospace'
    ctx.fillText('← → chọn, F xác nhận', cx, btnY + btnHeight + 25)

    ctx.textAlign = 'start'
    ctx.restore()
  }

  // ────────────────────────────────────────────────────────────────
  // IStage Public API
  // ────────────────────────────────────────────────────────────────

  drawPrompts(ctx: CanvasRenderingContext2D, renderer: Renderer, playerCenter: Vec2): void {
    if (this.bossState === 'intro' && this.stateTimer <= 0) {
      renderer.drawInteractPrompt(ctx, playerCenter, 'Nhấn F để tiếp tục')
    }
  }

  isComplete(): boolean {
    return this.bossState === 'completed'
  }

  getEnemies(): Enemy[] {
    const enemies: Enemy[] = []
    if (this.ganon && this.ganon.isAlive()) {
      enemies.push(this.ganon)
    }
    for (const m of this.minions) {
      if (m.isAlive()) enemies.push(m)
    }
    return enemies
  }

  getStatus(): Record<string, unknown> {
    return {
      bossState: this.bossState,
      ganonPhase: this.lastKnownPhase,
      ganonHealth: this.ganon?.health ?? 0,
      minionCount: this.minions.filter(m => m.isAlive()).length,
      pillarsRemaining: this.pillars.filter(p => !p.destroyed).length,
      enemiesDefeated: this.totalEnemiesDefeated,
      damageTaken: this.totalDamageTaken,
      objectives: this.objectives,
    }
  }

  isItemGetActive(): boolean {
    return this.bossState === 'intro'
  }

  /** Consume any pending camera shake request (call once per frame in Game.ts) */
  consumeCameraShakeRequest(): { intensity: number; duration: number } | null {
    if (this.pendingShakeIntensity <= 0) return null
    const req = { intensity: this.pendingShakeIntensity, duration: this.pendingShakeDuration }
    this.pendingShakeIntensity = 0
    this.pendingShakeDuration = 0
    return req
  }

  getVictoryAction(): 'play_again' | 'home' | null {
    return this.victoryAction
  }
}
