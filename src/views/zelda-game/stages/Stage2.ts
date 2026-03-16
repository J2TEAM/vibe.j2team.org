import type { Camera } from '../engine/Camera'
import type {
  TileMap,
  InputState,
  StageObjective,
  Vec2,
  HeartPickup,
  ProjectileSpawnRequest,
} from '../utils/types'
import {
  TILE_SIZE,
  WAVE_BREATHER_TIME,
  HEART_HEAL_AMOUNT,
  HEART_PICKUP_RADIUS,
  FIRE_DAMAGE_PER_TICK,
  FIRE_TICK_INTERVAL,
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
  WAVE_FLASH_DURATION,
  DUST_COLORS,
  FIRE_COLORS,
  LYNEL_DEATH_PARTICLE_COUNT,
  LYNEL_DEATH_PARTICLE_SPEED,
  LYNEL_DEATH_PARTICLE_LIFE,
  LYNEL_DEATH_PARTICLE_SIZE,
  SPAWN_SMOKE_COUNT,
  SPAWN_SMOKE_SPEED,
  SPAWN_SMOKE_LIFE,
  SPAWN_SMOKE_SIZE,
  HAPTIC_PLAYER_DAMAGE,
  HAPTIC_BOSS_HIT,
  AMBIENT_DUST_COUNT,
  AMBIENT_DRIFT_SPEED,
} from '../utils/constants'
import { Input } from '../engine/Input'
import { Bokoblin } from '../entities/Bokoblin'
import type { Effects } from '../engine/Effects'
import { BokoblinArcher } from '../entities/BokoblinArcher'
import { Lynel } from '../entities/Lynel'
import { Physics } from '../engine/Physics'
import type { Renderer } from '../engine/Renderer'
import type { Player } from '../entities/Player'
import type { Enemy } from '../entities/Enemy'
import {
  BRIDGE_PLAYER_SPAWN,
  BRIDGE_BOSS_SPAWN,
  generateRandomWaveConfigs,
  generateWaveSpawnPositions,
  generateArcherPatrolRoute,
} from '../maps/bridge'
import { drawHeartPickup, drawBossHealthBar } from '../utils/sprites'
import type { IStage } from './IStage'
import { audio } from '../engine/Audio'

// Boss arena vertical bounds (bridge corridor rows 5-13)
const BOSS_ARENA_TOP = 5 * TILE_SIZE // 160
const BOSS_ARENA_BOTTOM = 14 * TILE_SIZE // 448

// Boss intro display time
const BOSS_INTRO_TIME = 3.0
// Victory celebration time
const BOSS_DEFEATED_TIME = 2.0

export class Stage2 implements IStage {
  // --- Wave state (V3 simplified 3-counter) ---
  private totalEnemiesDefeated = 0
  private waveIndex = 0
  private waveState: 'idle' | 'spawning' | 'fighting' | 'breather' = 'idle'
  private bossState: 'not_started' | 'intro' | 'fighting' | 'defeated' | 'completed' = 'not_started'
  private stateTimer = 0
  private waveTriggered: boolean[] = [false, false, false]

  // --- Randomized wave configs (generated each game start) ---
  private waveConfigs = generateRandomWaveConfigs()

  // --- Entities ---
  private enemies: Enemy[] = []
  private lynel: Lynel | null = null
  private heartPickups: HeartPickup[] = []

  // --- Boss intro ---
  private bossIntroActive = false
  private bossIntroTimer = 0
  private bossIntroPlayed = false

  // --- Fire damage tracking ---
  private fireDamageTimer = 0

  // --- Phase 4: Spawn smoke + Lynel death ---
  private pendingSpawnEffects: Vec2[] = []
  private lynelDeathEmitted = false

  // --- Objectives ---
  private objectives: StageObjective[] = [
    { id: 'wave1', description: 'Vượt qua đợt tấn công 1', completed: false },
    { id: 'wave2', description: 'Vượt qua đợt tấn công 2', completed: false },
    { id: 'wave3', description: 'Vượt qua đợt tấn công 3', completed: false },
    { id: 'boss', description: 'Đánh bại Lynel', completed: false },
  ]

  get playerSpawn(): Vec2 {
    return { ...BRIDGE_PLAYER_SPAWN }
  }

  // ─── Main Update ───────────────────────────────────────────────────

  update(
    dt: number,
    player: Player,
    map: TileMap,
    input: InputState,
    effects: Effects,
    camera: Camera,
  ): void {
    // Update wave/boss state machine
    this.updateWaveSystem(dt, player, input, effects, camera)

    // Process player sword attacks against all enemies (including Lynel via getEnemies)
    const combatResult = player.getCombatResult()
    if (combatResult?.hitbox) {
      this.processPlayerAttack(combatResult, player, map, effects, camera)
    }

    // Update enemy AI (including dying enemies for death animation)
    for (const enemy of this.enemies) {
      if (!enemy.isFullyDead()) {
        const wasInvuln = player.isInvulnerable()
        enemy.updateAI(dt, player, map)
        if (!wasInvuln && player.isInvulnerable()) {
          effects.screenFlash('rgba(255, 0, 0, 0.3)', SCREEN_FLASH_DURATION)
          camera.addShake(PLAYER_DAMAGE_SHAKE_INTENSITY, PLAYER_DAMAGE_SHAKE_DURATION)
          effects.spawnPopup(player.pos.x + player.size.x / 2, player.pos.y, '-1', '#FF4444')
          Input.vibrate(HAPTIC_PLAYER_DAMAGE)
        }
      }
    }

    // Update Lynel separately (uses its own update override)
    if (this.lynel && !this.lynel.isFullyDead()) {
      if (this.bossState === 'fighting') {
        this.lynel.update(dt, player, map)
      } else if (this.lynel.isDying()) {
        this.lynel.updateDeathTimer(dt)
      }
    }

    // Lynel death particle burst — emit once when Lynel enters dying state
    if (this.lynel && this.lynel.isDying() && !this.lynelDeathEmitted) {
      this.lynelDeathEmitted = true
      effects.emit({
        x: this.lynel.pos.x + this.lynel.size.x / 2,
        y: this.lynel.pos.y + this.lynel.size.y / 2,
        count: LYNEL_DEATH_PARTICLE_COUNT,
        speed: LYNEL_DEATH_PARTICLE_SPEED,
        life: LYNEL_DEATH_PARTICLE_LIFE,
        size: LYNEL_DEATH_PARTICLE_SIZE,
        colors: FIRE_COLORS,
        gravity: -20,
      })
      camera.addShake(6, 0.4)
    }

    // Flush pending spawn smoke (collected by spawnWave)
    for (const pos of this.pendingSpawnEffects) {
      effects.emit({
        x: pos.x,
        y: pos.y,
        count: SPAWN_SMOKE_COUNT,
        speed: SPAWN_SMOKE_SPEED,
        life: SPAWN_SMOKE_LIFE,
        size: SPAWN_SMOKE_SIZE,
        colors: DUST_COLORS,
        gravity: -10,
      })
    }
    this.pendingSpawnEffects.length = 0

    // Cleanup fully dead enemies — count newly dead for cross-stage kill tracking
    const deadCount = this.enemies.filter((e) => e.isFullyDead()).length
    this.totalEnemiesDefeated += deadCount
    this.enemies = this.enemies.filter((e) => !e.isFullyDead())

    // Update heart pickups
    this.updateHeartPickups(dt, player)

    // Ambient bridge dust particles — drifting sand/debris for visual atmosphere
    effects.emitAmbient(camera, DUST_COLORS, AMBIENT_DUST_COUNT, {
      speed: AMBIENT_DRIFT_SPEED,
      life: 4,
      size: 1.5,
      gravity: 5,
    })
  }

  // ─── Wave System (V3 if-chain) ─────────────────────────────────────

  private updateWaveSystem(
    dt: number,
    player: Player,
    input: InputState,
    effects: Effects,
    camera: Camera,
  ): void {
    // Boss fight takes priority
    if (this.bossState !== 'not_started') {
      this.updateBossFight(dt, player, input, effects, camera)
      return
    }

    // Wave idle → check trigger
    if (this.waveState === 'idle' && this.waveIndex < 3 && !this.waveTriggered[this.waveIndex]) {
      if (player.pos.x > this.waveConfigs[this.waveIndex]!.triggerX) {
        this.spawnWave(this.waveIndex)
        this.waveTriggered[this.waveIndex] = true
        this.waveState = 'fighting'
      }
      return
    }

    // Wave fighting → check all dead
    if (this.waveState === 'fighting' && this.allEnemiesDead()) {
      this.objectives[this.waveIndex]!.completed = true
      this.waveState = 'breather'
      this.stateTimer = WAVE_BREATHER_TIME
      effects.screenFlash('rgba(255, 255, 255, 0.4)', WAVE_FLASH_DURATION)
      this.spawnHeartPickup(player)
      return
    }

    // Breather → countdown, then next wave or boss
    if (this.waveState === 'breather') {
      this.stateTimer -= dt
      if (this.stateTimer <= 0) {
        this.waveIndex++
        if (this.waveIndex >= 3) {
          this.bossState = 'intro'
          this.bossIntroActive = true
          this.bossIntroTimer = BOSS_INTRO_TIME
          // Lynel boss intro cinematic: ground shake + dust burst
          if (!this.bossIntroPlayed) {
            this.bossIntroPlayed = true
            camera.addShake(6, 0.4)
            effects.emit({
              x: BRIDGE_BOSS_SPAWN.x,
              y: BRIDGE_BOSS_SPAWN.y,
              count: 12,
              speed: 40,
              life: 0.4,
              size: 3,
              colors: DUST_COLORS,
              gravity: 60,
              spread: Math.PI,
              baseAngle: -Math.PI / 2,
            })
          }
        } else {
          this.waveState = 'idle'
        }
      }
    }
  }

  // ─── Wave Spawning ─────────────────────────────────────────────────

  private spawnWave(waveIndex: number): void {
    const config = this.waveConfigs[waveIndex]!
    const totalCount = config.bokoblins + config.archers
    const spawnPositions = generateWaveSpawnPositions(waveIndex, totalCount)

    for (let i = 0; i < config.bokoblins; i++) {
      const pos = spawnPositions[i]!
      const bok = new Bokoblin({ ...pos }, [])
      bok.setAggressive()
      this.enemies.push(bok)
      this.pendingSpawnEffects.push({ x: pos.x + TILE_SIZE / 2, y: pos.y + TILE_SIZE / 2 })
    }

    for (let i = 0; i < config.archers; i++) {
      const pos = spawnPositions[config.bokoblins + i]!
      const patrolRoute = generateArcherPatrolRoute(pos, waveIndex)
      const archer = new BokoblinArcher({ ...pos }, patrolRoute)
      this.enemies.push(archer)
      this.pendingSpawnEffects.push({ x: pos.x + TILE_SIZE / 2, y: pos.y + TILE_SIZE / 2 })
    }
  }

  private allEnemiesDead(): boolean {
    return this.enemies.length === 0 || this.enemies.every((e) => !e.isAlive())
  }

  // ─── Boss Fight ────────────────────────────────────────────────────

  private updateBossFight(
    dt: number,
    player: Player,
    input: InputState,
    effects: Effects,
    camera: Camera,
  ): void {
    if (this.bossState === 'intro') {
      this.bossIntroTimer -= dt
      // [RT#13] OR logic: timer expired OR interact pressed — prevents softlock
      if (this.bossIntroTimer <= 0 || input.interactJustPressed) {
        this.bossState = 'fighting'
        this.bossIntroActive = false
        this.lynel = new Lynel(BRIDGE_BOSS_SPAWN, BOSS_ARENA_TOP, BOSS_ARENA_BOTTOM)
      }
      return
    }

    if (this.bossState === 'fighting' && this.lynel) {
      // [RT#4] Death check MUST run before boss completion logic
      if (!player.isAlive()) return

      // Check Lynel slash hitbox against player
      const slash = this.lynel.getSlashHitbox()
      if (slash && !player.isInvulnerable()) {
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
            Input.vibrate(HAPTIC_PLAYER_DAMAGE)
          }
        }
      }

      // Check fire tile damage on player
      this.updateFireDamage(dt, player, effects, camera)

      // Check Lynel defeated
      if (this.lynel.isFullyDead()) {
        this.totalEnemiesDefeated++ // Count Lynel kill
        this.bossState = 'defeated'
        this.stateTimer = BOSS_DEFEATED_TIME
        this.objectives[3]!.completed = true
        player.heal(player.maxHealth)
      }
      return
    }

    if (this.bossState === 'defeated') {
      this.stateTimer -= dt
      // Keep updating Lynel death animation
      if (this.lynel && this.lynel.isDying()) {
        this.lynel.updateDeathTimer(dt)
      }
      if (this.stateTimer <= 0) {
        this.bossState = 'completed'
      }
    }
  }

  // ─── Fire Damage Tick ──────────────────────────────────────────────

  private updateFireDamage(dt: number, player: Player, effects: Effects, camera: Camera): void {
    if (!this.lynel || player.isInvulnerable()) return
    const fireTiles = this.lynel.getFireTiles()
    if (fireTiles.length === 0) return

    const playerCenter = player.getCenter()
    const halfTile = TILE_SIZE / 2

    for (const tile of fireTiles) {
      const dx = playerCenter.x - tile.x
      const dy = playerCenter.y - tile.y
      if (Math.abs(dx) < halfTile && Math.abs(dy) < halfTile) {
        this.fireDamageTimer -= dt
        if (this.fireDamageTimer <= 0) {
          if (player.takeDamage(FIRE_DAMAGE_PER_TICK)) {
            effects.screenFlash('rgba(255, 0, 0, 0.3)', SCREEN_FLASH_DURATION)
            camera.addShake(PLAYER_DAMAGE_SHAKE_INTENSITY, PLAYER_DAMAGE_SHAKE_DURATION)
            effects.spawnPopup(
              player.pos.x + player.size.x / 2,
              player.pos.y,
              `-${FIRE_DAMAGE_PER_TICK}`,
              '#FF4444',
            )
            Input.vibrate(HAPTIC_PLAYER_DAMAGE)
          }
          this.fireDamageTimer = FIRE_TICK_INTERVAL
        }
        return
      }
    }
    // Not on any fire tile — reset timer
    this.fireDamageTimer = 0
  }

  // ─── Heart Pickups ─────────────────────────────────────────────────

  private spawnHeartPickup(player: Player): void {
    this.heartPickups.push({
      x: player.pos.x + 3 * TILE_SIZE,
      y: player.pos.y,
      active: true,
      floatTimer: 0,
    })
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

  // ─── Combat Processing ─────────────────────────────────────────────

  private processPlayerAttack(
    combatResult: NonNullable<ReturnType<Player['getCombatResult']>>,
    player: Player,
    map: TileMap,
    effects: Effects,
    camera: Camera,
  ): void {
    if (!combatResult.hitbox) return

    // Check all wave enemies
    for (const enemy of this.enemies) {
      if (!enemy.isAlive() || enemy.isDying()) continue
      if (enemy.lastHitSwingID === combatResult.swingID) continue
      if (Physics.overlaps(combatResult.hitbox.aabb, enemy.getAABB())) {
        if (enemy.takeDamage(combatResult.hitbox.damage)) {
          effects.emit({
            x: enemy.pos.x + enemy.size.x / 2,
            y: enemy.pos.y + enemy.size.y / 2,
            count: HIT_SPARK_COUNT,
            speed: HIT_SPARK_SPEED,
            life: HIT_SPARK_LIFE,
            size: HIT_SPARK_SIZE,
            colors: SPARK_COLORS,
          })
          effects.hitFreeze()
          effects.spawnPopup(
            enemy.pos.x + enemy.size.x / 2,
            enemy.pos.y - 10,
            `-${combatResult.hitbox.damage}`,
            '#fff',
          )
          audio.playHit()
          if (!enemy.isAlive()) audio.playEnemyDeath()
        }
        enemy.lastHitSwingID = combatResult.swingID
        // Apply knockback away from player
        const ec = enemy.getCenter()
        const pc = player.getCenter()
        const dx = ec.x - pc.x
        const dy = ec.y - pc.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 0) {
          const kbForce = combatResult.hitbox.knockback
          const pushed = Physics.resolveMovement(
            map,
            enemy.pos,
            { x: enemy.pos.x + (dx / dist) * kbForce, y: enemy.pos.y + (dy / dist) * kbForce },
            enemy.size,
          )
          enemy.pos.x = pushed.x
          enemy.pos.y = pushed.y
        }
      }
    }

    // [RT#7] Check Lynel — included as a standard enemy for sword collision
    if (this.lynel && this.lynel.isAlive() && !this.lynel.isDying()) {
      if (this.lynel.lastHitSwingID !== combatResult.swingID) {
        if (Physics.overlaps(combatResult.hitbox.aabb, this.lynel.getAABB())) {
          if (this.lynel.takeDamage(combatResult.hitbox.damage)) {
            effects.emit({
              x: this.lynel.pos.x + this.lynel.size.x / 2,
              y: this.lynel.pos.y + this.lynel.size.y / 2,
              count: HIT_SPARK_COUNT,
              speed: HIT_SPARK_SPEED,
              life: HIT_SPARK_LIFE,
              size: HIT_SPARK_SIZE,
              colors: SPARK_COLORS,
            })
            effects.hitFreeze()
            effects.spawnPopup(
              this.lynel.pos.x + this.lynel.size.x / 2,
              this.lynel.pos.y - 10,
              `-${combatResult.hitbox.damage}`,
              '#fff',
            )
            camera.addShake(BOSS_DAMAGE_SHAKE_INTENSITY, BOSS_DAMAGE_SHAKE_DURATION)
            audio.playHit()
            if (!this.lynel.isAlive()) audio.playEnemyDeath()
            Input.vibrate(HAPTIC_BOSS_HIT)
          }
          this.lynel.lastHitSwingID = combatResult.swingID
        }
      }
    }
  }

  // ─── Archer Projectile Requests ────────────────────────────────────

  getArcherProjectileRequests(): ProjectileSpawnRequest[] {
    const requests: ProjectileSpawnRequest[] = []
    for (const enemy of this.enemies) {
      if (enemy instanceof BokoblinArcher && enemy.isAlive()) {
        const req = enemy.getProjectileRequest()
        if (req) requests.push(req)
      }
    }
    return requests
  }

  // ─── Draw ──────────────────────────────────────────────────────────

  draw(
    ctx: CanvasRenderingContext2D,
    _renderer: Renderer,
    _map: TileMap,
    _effects: Effects,
    _camera: Camera,
  ): void {
    // 1. Draw wave enemies (including dying ones)
    for (const enemy of this.enemies) {
      if (!enemy.isFullyDead()) {
        enemy.draw(ctx)
      }
    }

    // 2. Draw Lynel (has its own draw with fire tiles)
    if (this.lynel && !this.lynel.isFullyDead()) {
      this.lynel.draw(ctx)
    }

    // 3. Draw heart pickups
    for (const heart of this.heartPickups) {
      if (!heart.active) continue
      const floatOffset = Math.sin(heart.floatTimer * 3) * 4
      drawHeartPickup(ctx, heart.x, heart.y, floatOffset)
    }

    // 4. Draw wave indicator HUD — only after first wave is triggered
    if (
      this.bossState === 'not_started' &&
      this.waveState === 'fighting' &&
      this.waveTriggered[this.waveIndex]
    ) {
      this.drawWaveIndicator(ctx)
    }

    // 5. Draw boss health bar
    if (this.bossState === 'fighting' && this.lynel && this.lynel.isAlive()) {
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      drawBossHealthBar(ctx, this.lynel.health, this.lynel.maxHealth, 'LYNEL')
      ctx.restore()
    }

    // 6. Draw boss intro overlay
    if (this.bossState === 'intro' && this.bossIntroActive) {
      this.drawBossIntroOverlay(ctx)
    }

    // 7. Draw boss defeated overlay
    if (this.bossState === 'defeated') {
      this.drawBossDefeatedOverlay(ctx)
    }
  }

  private drawWaveIndicator(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    const text = `Đợt ${this.waveIndex + 1}/3`
    ctx.font = 'bold 16px monospace'
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(ctx.canvas.width / 2 - 60, 8, 120, 28)
    ctx.fillStyle = '#FFB830'
    ctx.fillText(text, ctx.canvas.width / 2, 28)

    ctx.textAlign = 'start'
    ctx.restore()
  }

  private drawBossIntroOverlay(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    const cx = ctx.canvas.width / 2
    const cy = ctx.canvas.height / 2

    ctx.textAlign = 'center'
    ctx.fillStyle = '#FF4444'
    ctx.font = 'bold 24px monospace'
    ctx.fillText('⚔️ LYNEL ⚔️', cx, cy - 20)

    ctx.fillStyle = '#F0EDE6'
    ctx.font = '15px monospace'
    ctx.fillText('Kẻ canh giữ cây cầu Hyrule', cx, cy + 10)

    if (this.bossIntroTimer <= 0) {
      ctx.fillStyle = '#8B9DB5'
      ctx.font = '13px monospace'
      ctx.fillText('Nhấn F để tiếp tục', cx, cy + 40)
    }

    ctx.textAlign = 'start'
    ctx.restore()
  }

  private drawBossDefeatedOverlay(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    const cx = ctx.canvas.width / 2
    const cy = ctx.canvas.height / 2

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    ctx.textAlign = 'center'
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 22px monospace'
    ctx.fillText('✨ Chiến thắng! ✨', cx, cy - 10)

    ctx.fillStyle = '#F0EDE6'
    ctx.font = '15px monospace'
    ctx.fillText('Lynel đã bị đánh bại!', cx, cy + 18)

    ctx.textAlign = 'start'
    ctx.restore()
  }

  // ─── IStage Public API ─────────────────────────────────────────────

  // [RT#3] drawPrompts — show interact prompt during boss intro
  drawPrompts(ctx: CanvasRenderingContext2D, renderer: Renderer, playerCenter: Vec2): void {
    if (this.bossIntroActive && this.bossIntroTimer <= 0) {
      renderer.drawInteractPrompt(ctx, playerCenter, 'Nhấn F để tiếp tục')
    }
  }

  isComplete(): boolean {
    return this.bossState === 'completed'
  }

  // [RT#7] Include Lynel in getEnemies() since it extends Enemy
  getEnemies(): Enemy[] {
    const allEnemies: Enemy[] = [...this.enemies]
    if (this.lynel && !this.lynel.isFullyDead()) {
      allEnemies.push(this.lynel)
    }
    return allEnemies
  }

  getStatus(): Record<string, unknown> {
    return {
      waveIndex: this.waveIndex,
      waveState: this.waveState,
      bossState: this.bossState,
      enemyCount: this.enemies.length + (this.lynel?.isAlive() ? 1 : 0),
      objectives: this.objectives,
    }
  }

  isItemGetActive(): boolean {
    return false
  }

  getStats(): { enemiesDefeated: number; damageTaken: number } {
    return { enemiesDefeated: this.totalEnemiesDefeated, damageTaken: 0 }
  }
}
