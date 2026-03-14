import type { Camera } from '../engine/Camera'
import type {
  TileMap,
  InputState,
  StageObjective,
  Vec2,
  HeartPickup,
  DestructiblePillar,
  GanonPhase,
  DialogLine,
  ProjectileSpawnRequest,
} from '../utils/types'
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
  HIT_SPARK_COUNT,
  HIT_SPARK_SPEED,
  HIT_SPARK_LIFE,
  HIT_SPARK_SIZE,
  SPARK_COLORS,
  BOSS_DAMAGE_SHAKE_INTENSITY,
  BOSS_DAMAGE_SHAKE_DURATION,
  PLAYER_DAMAGE_SHAKE_INTENSITY,
  PLAYER_DAMAGE_SHAKE_DURATION,
  SCREEN_FLASH_DURATION,
  BOSS_INTRO_DARKEN,
  CASTLE_DUST_COLORS,
  AMBIENT_DUST_COUNT,
  REFLECT_COLORS,
  REFLECT_SPARK_COUNT,
  REFLECT_SPARK_SPEED,
  REFLECT_SPARK_LIFE,
  REFLECT_SPARK_SIZE,
  HAPTIC_PLAYER_DAMAGE,
  HAPTIC_BOSS_HIT,
} from '../utils/constants'
import { Input } from '../engine/Input'
import { Ganon } from '../entities/Ganon'
import { Bokoblin } from '../entities/Bokoblin'
import { BokoblinArcher } from '../entities/BokoblinArcher'
import type { Effects } from '../engine/Effects'
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
import { audio } from '../engine/Audio'

// Boss intro overlay timing
const BOSS_INTRO_TIME = 3.0
const INTRO_FADE_SPEED = 1.5

// Victory dialog lines
const VICTORY_DIALOG_LINES: DialogLine[] = [
  { speaker: 'Zelda', text: 'Link... anh đã đến vì em.' },
  { speaker: 'Zelda', text: 'Hyrule đã được cứu.' },
  { speaker: 'Zelda', text: 'Cảm ơn anh, người anh hùng.' },
  { speaker: 'Zelda', text: 'Hãy cùng trở về nhà.' },
]

// Phase display names
const PHASE_NAMES: Record<GanonPhase, string> = {
  dark_sorcery: 'Hắc Thuật',
  teleportation: 'Dịch Chuyển',
  calamity: 'Đại Tai Họa',
  final_stand: 'Trận Chiến Cuối',
}

// Pillar HP for player-destructible pillars
const PILLAR_HP = 3

type BossState =
  | 'intro'
  | 'fighting'
  | 'defeated'
  | 'victory_dialog'
  | 'victory_stats'
  | 'completed'

export class Stage3 implements IStage {
  private victoryScreenEnabled = true
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
  private finalTimeSeconds: number | null = null
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
  private bossIntroPlayed = false

  // Dialog callback injected by Game (avoids circular dependency)
  private dialogCallback: ((lines: DialogLine[], onComplete?: () => void) => void) | null = null

  // ─── Phase Tracking ──────────────────────────────────────────────
  private lastKnownPhase: GanonPhase = 'dark_sorcery'
  private vignetteIntensity = 0

  // ─── Slam hit dedup ──────────────────────────────────────────────
  private slamHitThisSlam = false
  private slamShakeTriggered = false

  // ─── Phase 4: Ganon effects migration ────────────────────────────
  private wispTimer = 0
  private teleportSmokeTimer = 0
  private prevSlamActive = false
  private crystalShatterEmitted = false

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

  update(
    dt: number,
    player: Player,
    map: TileMap,
    input: InputState,
    effects: Effects,
    camera: Camera,
  ): void {
    this.frameCounter++

    // Track max health
    if (player.maxHealth > this.playerMaxHealthSeen) {
      this.playerMaxHealthSeen = player.maxHealth
    }

    switch (this.bossState) {
      case 'intro':
        this.updateIntro(dt, player, map, input, effects, camera)
        break
      case 'fighting':
        this.updateFighting(dt, player, map, effects, camera)
        break
      case 'defeated':
        this.updateDefeated(dt)
        break
      case 'victory_dialog':
        // Dialog handled by Dialog system in Game — no update needed here
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

  private updateIntro(
    dt: number,
    player: Player,
    map: TileMap,
    input: InputState,
    effects: Effects,
    camera: Camera,
  ): void {
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
      this.pillars = CASTLE_PILLAR_POSITIONS.map((p) => ({ ...p }))
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

      // Ganon boss intro cinematic — screen darken + shake + dark particle burst
      if (!this.bossIntroPlayed) {
        this.bossIntroPlayed = true
        effects.screenFlash('rgba(0, 0, 0, 0.6)', BOSS_INTRO_DARKEN)
        camera.addShake(5, 0.5)
        effects.emit({
          x: CASTLE_GANON_SPAWN.x,
          y: CASTLE_GANON_SPAWN.y,
          count: 10,
          speed: 50,
          life: 0.5,
          size: 4,
          colors: ['#4B0082', '#1a0033', '#330066'],
        })
      }

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

  private updateFighting(
    dt: number,
    player: Player,
    map: TileMap,
    effects: Effects,
    camera: Camera,
  ): void {
    // Death check FIRST — prevents victory/death same-frame race
    if (!player.isAlive()) return

    if (!this.ganon || !this.ganon.isAlive()) {
      if (this.ganon && !this.ganon.isAlive() && this.bossState === 'fighting') {
        this.onGanonDefeated(effects)
      }
      return
    }

    // 1. Update Ganon AI
    this.ganon.update(dt, player, map)

    // 2. Detect phase transitions → pillar destruction
    const currentPhase = this.ganon.getPhase()
    if (currentPhase !== this.lastKnownPhase) {
      this.handlePhaseTransition(currentPhase, map, camera)
      this.lastKnownPhase = currentPhase
    }

    // 3. Process player attacks on Ganon
    if (!this.ganon.isIntangible()) {
      this.processPlayerAttackOnBoss(player, map, effects, camera)
    }

    // 4. Dark orb collisions (shield-reflect)
    this.updateDarkOrbCollisions(player, effects, camera)

    // 5. Ganon's dark slash → player damage
    this.checkDarkSlashHit(player, effects, camera)

    // 6. Ground slam AoE → player damage
    this.checkGroundSlamHit(player, effects, camera)

    // 7. Minion management
    this.updateMinions(dt, player, map)

    // 8. Handle minion summoning signal
    if (this.ganon.shouldSummonMinions()) {
      this.spawnMinions()
    }

    // 9. Process player attacks on minions
    this.processPlayerAttackOnMinions(player, map, effects)

    // 10. Process player attacks on pillars
    this.processPlayerAttackOnPillars(player, map)

    // 11. Check Ganon defeated
    if (!this.ganon.isAlive()) {
      this.onGanonDefeated(effects)
    }

    // 12. Update vignette for Phase 3+
    if (currentPhase === 'calamity' || currentPhase === 'final_stand') {
      this.vignetteIntensity = Math.min(1, this.vignetteIntensity + dt * 0.5)
    }

    // 13. Ganon effects migration — emit particles from Stage3 (Ganon has no Effects access)

    // Teleport smoke: emit every 0.2s while teleporting and invisible
    if (this.ganon.teleportProgress > 0.5) {
      this.teleportSmokeTimer -= dt
      if (this.teleportSmokeTimer <= 0) {
        this.teleportSmokeTimer = 0.2
        const cx = this.ganon.pos.x + TILE_SIZE * 0.75
        const cy = this.ganon.pos.y + TILE_SIZE * 0.75
        effects.emit({
          x: cx,
          y: cy,
          count: 5,
          speed: 40,
          life: 0.8,
          size: 6,
          colors: ['#2D1B4E', '#3D2B5E', '#1A0A2E'],
          spread: Math.PI * 2,
        })
      }
    } else {
      this.teleportSmokeTimer = 0
    }

    // Slam impact: one-shot burst + screen flash when slamActive transitions to true
    const slamInfo = this.ganon.getSlamInfo()
    if (slamInfo.active && !this.prevSlamActive) {
      effects.emit({
        x: slamInfo.center.x,
        y: slamInfo.center.y,
        count: 12,
        speed: 120,
        life: 0.3,
        size: 4,
        colors: ['#FF6600', '#8B00FF', '#FF4400'],
        gravity: 200,
      })
      effects.screenFlash('rgba(255,100,0,0.3)', 0.2)
    }
    this.prevSlamActive = slamInfo.active

    // Dark energy wisps: 1 wisp every ~0.3s during Phase 2+
    if (currentPhase !== 'dark_sorcery') {
      this.wispTimer -= dt
      if (this.wispTimer <= 0) {
        this.wispTimer = 0.3
        const time = Date.now() * 0.003
        const wispIndex = Math.floor(Math.random() * 3)
        const s = 48 // GANON_SPRITE_SIZE
        const wx = this.ganon.pos.x + s * 0.5 + Math.sin(time + wispIndex * 2) * s * 0.3
        const wy = this.ganon.pos.y + s * 0.4 + Math.cos(time + wispIndex * 1.5) * s * 0.2
        effects.emit({
          x: wx,
          y: wy,
          count: 1,
          speed: 10,
          life: 0.5,
          size: 3,
          colors: ['#8B00FF', '#6600CC'],
        })
      }
    }

    // Castle dust ambient particles
    effects.emitAmbient(camera, CASTLE_DUST_COLORS, AMBIENT_DUST_COUNT, {
      speed: 8,
      life: 6,
      size: 1.5,
      gravity: -3, // slight upward float = rising dust
    })

    // Track damage
    const prevHealth = player.health
    // Note: damage tracking is done in checkDarkSlashHit, checkGroundSlamHit, updateDarkOrbCollisions
    void prevHealth
  }

  // ────────────────────────────────────────────────────────────────
  // Player Attack on Boss
  // ────────────────────────────────────────────────────────────────

  private processPlayerAttackOnBoss(
    player: Player,
    map: TileMap,
    effects: Effects,
    camera: Camera,
  ): void {
    if (!this.ganon || !this.ganon.isAlive()) return
    const combat = player.getCombatResult()
    if (!combat?.hitbox) return

    // Sword attack (dedup via lastHitSwingID)
    if (combat.swingID !== this.ganon.lastHitSwingID) {
      if (Physics.overlaps(combat.hitbox.aabb, this.ganon.getAABB())) {
        if (this.ganon.takeDamage(combat.hitbox.damage)) {
          effects.emit({
            x: this.ganon.pos.x + this.ganon.size.x / 2,
            y: this.ganon.pos.y + this.ganon.size.y / 2,
            count: HIT_SPARK_COUNT,
            speed: HIT_SPARK_SPEED,
            life: HIT_SPARK_LIFE,
            size: HIT_SPARK_SIZE,
            colors: SPARK_COLORS,
          })
          effects.hitFreeze()
          effects.spawnPopup(
            this.ganon.pos.x + this.ganon.size.x / 2,
            this.ganon.pos.y - 10,
            `-${combat.hitbox.damage}`,
            '#fff',
          )
          camera.addShake(BOSS_DAMAGE_SHAKE_INTENSITY, BOSS_DAMAGE_SHAKE_DURATION)
          audio.playHit()
          Input.vibrate(HAPTIC_BOSS_HIT)
        }
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
            {
              x: this.ganon.pos.x + (dx / dist) * kbForce,
              y: this.ganon.pos.y + (dy / dist) * kbForce,
            },
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

  private updateDarkOrbCollisions(player: Player, effects: Effects, camera: Camera): void {
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
        if (this.ganon.takeDamage(DARK_ORB_REFLECT_DAMAGE)) {
          effects.emit({
            x: this.ganon.pos.x + this.ganon.size.x / 2,
            y: this.ganon.pos.y + this.ganon.size.y / 2,
            count: HIT_SPARK_COUNT,
            speed: HIT_SPARK_SPEED,
            life: HIT_SPARK_LIFE,
            size: HIT_SPARK_SIZE,
            colors: SPARK_COLORS,
          })
          effects.spawnPopup(
            this.ganon.pos.x + this.ganon.size.x / 2,
            this.ganon.pos.y - 10,
            `-${DARK_ORB_REFLECT_DAMAGE}`,
            '#fff',
          )
          camera.addShake(BOSS_DAMAGE_SHAKE_INTENSITY, BOSS_DAMAGE_SHAKE_DURATION)
          Input.vibrate(HAPTIC_BOSS_HIT)
        }
        this.ganon.deactivateOrb(i)
        continue
      }

      // Check orb hitting player
      if (Physics.overlaps(orbAABB, playerAABB)) {
        if (orb.reflectable && player.isBlocking()) {
          // Shield reflect
          this.ganon.reflectOrb(i)
          // Sparkle burst at reflection point
          effects.emit({
            x: orb.x,
            y: orb.y,
            count: REFLECT_SPARK_COUNT,
            speed: REFLECT_SPARK_SPEED,
            life: REFLECT_SPARK_LIFE,
            size: REFLECT_SPARK_SIZE,
            colors: REFLECT_COLORS,
          })
        } else if (orb.reflectable) {
          // Direct hit on player
          if (!player.isInvulnerable()) {
            if (player.takeDamage(DARK_ORB_DAMAGE)) {
              effects.screenFlash('rgba(255, 0, 0, 0.3)', SCREEN_FLASH_DURATION)
              camera.addShake(PLAYER_DAMAGE_SHAKE_INTENSITY, PLAYER_DAMAGE_SHAKE_DURATION)
              effects.spawnPopup(
                player.pos.x + player.size.x / 2,
                player.pos.y,
                `-${DARK_ORB_DAMAGE}`,
                '#FF4444',
              )
              this.totalDamageTaken += DARK_ORB_DAMAGE
              Input.vibrate(HAPTIC_PLAYER_DAMAGE)
            }
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

  private checkDarkSlashHit(player: Player, effects: Effects, camera: Camera): void {
    if (!this.ganon) return
    const slash = this.ganon.getSlashHitbox()
    if (!slash) return
    // Dedup: only hit once per slash activation
    if (this.lastSlashHitFrame === this.frameCounter) return
    if (!player.isInvulnerable()) {
      if (Physics.overlaps(slash.aabb, player.getAABB())) {
        if (player.takeDamage(slash.damage)) {
          effects.screenFlash('rgba(255, 0, 0, 0.3)', SCREEN_FLASH_DURATION)
          camera.addShake(PLAYER_DAMAGE_SHAKE_INTENSITY, PLAYER_DAMAGE_SHAKE_DURATION)
          effects.spawnPopup(
            player.pos.x + player.size.x / 2,
            player.pos.y,
            `-${slash.damage}`,
            '#FF4444',
          )
          this.totalDamageTaken += slash.damage
          Input.vibrate(HAPTIC_PLAYER_DAMAGE)
        }
        this.totalDamageTaken += slash.damage
        this.lastSlashHitFrame = this.frameCounter
      }
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Ground Slam Check
  // ────────────────────────────────────────────────────────────────

  private checkGroundSlamHit(player: Player, effects: Effects, camera: Camera): void {
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
      if (player.takeDamage(GROUND_SLAM_DAMAGE)) {
        effects.screenFlash('rgba(255, 0, 0, 0.3)', SCREEN_FLASH_DURATION)
        camera.addShake(PLAYER_DAMAGE_SHAKE_INTENSITY + 2, PLAYER_DAMAGE_SHAKE_DURATION + 0.1)
        effects.spawnPopup(
          player.pos.x + player.size.x / 2,
          player.pos.y,
          `-${GROUND_SLAM_DAMAGE}`,
          '#FF4444',
        )
        this.totalDamageTaken += GROUND_SLAM_DAMAGE
        Input.vibrate(HAPTIC_PLAYER_DAMAGE)
      }
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
    const config = this.ganon.getMinionConfig()

    // Spawn melee Bokoblins first, then archers
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i]!
      if (i < config.melee) {
        const minion = new Bokoblin({ ...pos }, [])
        minion.setAggressive()
        this.minions.push(minion)
      } else {
        const archer = new BokoblinArcher({ ...pos }, [])
        this.minions.push(archer)
      }
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

  private processPlayerAttackOnMinions(player: Player, map: TileMap, effects: Effects): void {
    const combat = player.getCombatResult()
    if (!combat?.hitbox) return

    for (const minion of this.minions) {
      if (!minion.isAlive() || minion.isDying()) continue
      if (combat.swingID !== minion.lastHitSwingID) {
        if (Physics.overlaps(combat.hitbox.aabb, minion.getAABB())) {
          if (minion.takeDamage(combat.hitbox.damage)) {
            effects.emit({
              x: minion.pos.x + minion.size.x / 2,
              y: minion.pos.y + minion.size.y / 2,
              count: HIT_SPARK_COUNT,
              speed: HIT_SPARK_SPEED,
              life: HIT_SPARK_LIFE,
              size: HIT_SPARK_SIZE,
              colors: SPARK_COLORS,
            })
            effects.hitFreeze()
            effects.spawnPopup(
              minion.pos.x + minion.size.x / 2,
              minion.pos.y - 10,
              `-${combat.hitbox.damage}`,
              '#fff',
            )
            audio.playHit()
            if (!minion.isAlive()) audio.playEnemyDeath()
          }
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

  private handlePhaseTransition(newPhase: GanonPhase, map: TileMap, camera: Camera): void {
    camera.addShake(14, 0.7)
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
    const available = this.pillars.filter((p) => !p.destroyed)
    const toDestroy = available.slice(0, count)
    for (const pillar of toDestroy) {
      if (
        pillar.row >= 0 &&
        pillar.row < map.tiles.length &&
        pillar.col >= 0 &&
        pillar.col < map.tiles[0]!.length
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

  private onGanonDefeated(effects: Effects): void {
    if (this.bossState === 'defeated') return // guard against double-call
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

    // Crystal shatter particle burst at Zelda's position
    if (!this.crystalShatterEmitted) {
      this.crystalShatterEmitted = true
      effects.emit({
        x: CASTLE_ZELDA_POSITION.x,
        y: CASTLE_ZELDA_POSITION.y,
        count: 8,
        speed: 80,
        life: 1.5,
        size: 5,
        colors: ['#00BFFF', '#FFFFFF', '#66CCFF'],
      })
      // Victory white flash overlay via effects system
      effects.screenFade('#FFFFFF', CRYSTAL_SHATTER_DURATION)
    }
  }

  private updateDefeated(dt: number): void {
    this.defeatTimer -= dt
    this.crystalShatterProgress = Math.min(
      1,
      this.crystalShatterProgress + dt / CRYSTAL_SHATTER_DURATION,
    )

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
      this.dialogCallback?.(VICTORY_DIALOG_LINES, () => {
        this.finalTimeSeconds = Math.floor((Date.now() - this.startTime) / 1000)
        this.bossState = 'victory_stats'
        this.victoryAction = null
      })
    }
  }

  private updateVictoryStats(input: InputState): void {
    if (!this.victoryScreenEnabled) return

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

  draw(
    ctx: CanvasRenderingContext2D,
    _renderer: Renderer,
    _map: TileMap,
    _effects: Effects,
    _camera: Camera,
  ): void {
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
        // Show the arena; Dialog system draws the dialog box overlay
        this.drawFighting(ctx)
        break
      case 'victory_stats':
        if (this.victoryScreenEnabled) {
          this.drawVictoryStats(ctx)
        } else {
          this.drawFighting(ctx)
        }
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

    // Victory text — crystal shatter particles and white overlay are handled by effects system
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    const cx = ctx.canvas.width / 2
    const cy = ctx.canvas.height / 2

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
    const elapsed = this.finalTimeSeconds ?? Math.floor((Date.now() - this.startTime) / 1000)
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

  /** Inject dialog callback from Game to trigger the Dialog system without circular dependency */
  setDialogCallback(callback: (lines: DialogLine[], onComplete?: () => void) => void): void {
    this.dialogCallback = callback
  }

  drawPrompts(ctx: CanvasRenderingContext2D, renderer: Renderer, playerCenter: Vec2): void {
    if (this.bossState === 'intro' && this.stateTimer <= 0) {
      renderer.drawInteractPrompt(ctx, playerCenter, 'Nhấn F để tiếp tục')
    }
  }

  isComplete(): boolean {
    return (
      this.bossState === 'completed' ||
      (!this.victoryScreenEnabled && this.bossState === 'victory_stats')
    )
  }

  /** Returns true when the Ganon dissolve + crystal shatter animations are fully complete. */
  isVictoryAnimationComplete(): boolean {
    return this.bossState !== 'defeated'
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
      minionCount: this.minions.filter((m) => m.isAlive()).length,
      pillarsRemaining: this.pillars.filter((p) => !p.destroyed).length,
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

  setVictoryScreenEnabled(enabled: boolean): void {
    this.victoryScreenEnabled = enabled
  }

  getStats(): { enemiesDefeated: number; damageTaken: number } {
    return {
      enemiesDefeated: this.totalEnemiesDefeated,
      damageTaken: this.totalDamageTaken,
    }
  }

  /** Collect pending archer projectile requests from minion archers */
  getArcherProjectileRequests(): ProjectileSpawnRequest[] {
    const requests: ProjectileSpawnRequest[] = []
    for (const minion of this.minions) {
      if (minion instanceof BokoblinArcher && minion.isAlive()) {
        const req = minion.getProjectileRequest()
        if (req) requests.push(req)
      }
    }
    return requests
  }
}
