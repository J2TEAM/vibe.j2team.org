import type { Camera } from '../engine/Camera'
import type {
  TileMap,
  InputState,
  StageObjective,
  Vec2,
  ProjectileSpawnRequest,
} from '../utils/types'
import {
  INTERACT_RADIUS,
  TILE_SIZE,
  HIT_SPARK_COUNT,
  HIT_SPARK_SPEED,
  HIT_SPARK_LIFE,
  HIT_SPARK_SIZE,
  SPARK_COLORS,
  SCREEN_FLASH_DURATION,
  PLAYER_DAMAGE_SHAKE_INTENSITY,
  PLAYER_DAMAGE_SHAKE_DURATION,
  LEAF_COLORS,
  AMBIENT_LEAF_COUNT,
  AMBIENT_DRIFT_SPEED,
  HAPTIC_PLAYER_DAMAGE,
} from '../utils/constants'
import { Input } from '../engine/Input'
import { Bokoblin } from '../entities/Bokoblin'
import { BokoblinArcher } from '../entities/BokoblinArcher'
import { Physics } from '../engine/Physics'
import { Renderer } from '../engine/Renderer'
import type { Player } from '../entities/Player'
import type { Enemy } from '../entities/Enemy'
import type { Effects } from '../engine/Effects'
import {
  PLAYER_SPAWN,
  BOKOBLIN_SPAWN_POSITIONS,
  ARCHER_SPAWN_POSITIONS,
  CHEST_POS,
  generateRandomPatrolRoute,
  getRandomKeyPosition,
  createForestMap,
} from '../maps/forest'
import type { IStage } from './IStage'
import { audio } from '../engine/Audio'

export class Stage1 implements IStage {
  enemies: Enemy[] = []
  private keyBokoblin: Bokoblin | null = null
  private totalEnemiesDefeated = 0
  keyCollected = false
  chestOpened = false
  gateOpen = false
  itemGetTimer = 0
  itemGetActive = false
  combatPhaseActive = false
  combatEnemyCount = 0
  objectives: StageObjective[] = [
    { id: 'key', description: 'Lấy chìa khóa từ Bokoblin đang ngủ', completed: false },
    { id: 'gate', description: 'Mở cổng bằng chìa khóa', completed: false },
    { id: 'chest', description: 'Mở rương kho báu', completed: false },
    { id: 'clear', description: 'Tiêu diệt tất cả Bokoblin', completed: false },
  ]

  constructor() {
    // Generate map to get walkable tiles for random route generation
    const map = createForestMap()
    this.spawnEnemies(map)
  }

  private spawnEnemies(map: TileMap): void {
    // Spawn melee Bokoblins with randomized patrol routes
    for (const spawnPos of BOKOBLIN_SPAWN_POSITIONS) {
      const route = generateRandomPatrolRoute(spawnPos, map)
      this.enemies.push(new Bokoblin({ ...spawnPos }, route))
    }

    // Spawn archers with randomized routes (inactive until combat phase)
    for (const spawnPos of ARCHER_SPAWN_POSITIONS) {
      const route = generateRandomPatrolRoute(spawnPos, map, 3)
      this.enemies.push(new BokoblinArcher({ ...spawnPos }, route))
    }

    // Spawn key Bokoblin at a random position
    const keyPos = getRandomKeyPosition(map)
    const keyBok = new Bokoblin(keyPos, [], true)
    this.keyBokoblin = keyBok
    this.enemies.push(keyBok)
  }

  get playerSpawn(): Vec2 {
    return { ...PLAYER_SPAWN }
  }

  update(
    dt: number,
    player: Player,
    map: TileMap,
    input: InputState,
    effects: Effects,
    camera: Camera,
  ): void {
    if (this.itemGetActive) {
      this.itemGetTimer -= dt
      if (this.itemGetTimer <= 0) {
        this.itemGetActive = false
      }
      return
    }

    // Trigger combat phase: chest opened + item-get animation done + not yet activated
    if (this.chestOpened && !this.itemGetActive && !this.combatPhaseActive) {
      this.combatPhaseActive = true
      // Record enemy count at combat start to prevent instant victory on 0-enemy edge case
      this.combatEnemyCount = this.enemies.filter((e) => e.isAlive()).length
      for (const enemy of this.enemies) {
        if (enemy.isAlive()) {
          enemy.setAggressive()
        }
      }
    }

    // Process sword hitbox from player's previous frame (1-frame delay, imperceptible at 60fps)
    const combatResult = player.getCombatResult()
    if (combatResult?.hitbox) {
      for (const enemy of this.enemies) {
        // Skip dying/dead enemies and protected key carrier
        if (!enemy.isAlive() || enemy.isDying()) continue
        if (enemy === this.keyBokoblin && !this.keyCollected) continue

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
    }

    // Update enemies (including dying ones for animation timer)
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

    // Cleanup dead enemies — count newly dead for cross-stage kill tracking
    const deadCount = this.enemies.filter((e) => e.isFullyDead()).length
    this.totalEnemiesDefeated += deadCount
    this.enemies = this.enemies.filter((e) => !e.isFullyDead())

    // Mark clear objective when all enemies defeated (defensive; isComplete() also marks it)
    if (this.combatPhaseActive && !this.objectives[3]!.completed) {
      if (this.enemies.every((e) => !e.isAlive())) {
        this.objectives[3]!.completed = true
      }
    }

    this.handleInteraction(player, input, map)

    // Ambient forest leaf particles — floating leaves through viewport
    effects.emitAmbient(camera, LEAF_COLORS, AMBIENT_LEAF_COUNT, {
      speed: AMBIENT_DRIFT_SPEED,
      life: 5,
      size: 2,
      gravity: 5, // slight downward drift = falling leaves
    })
  }

  private handleInteraction(player: Player, input: InputState, map: TileMap): void {
    const playerCenter = player.getCenter()

    // 1. Collect key from sleeping Bokoblin
    if (!this.keyCollected && this.keyBokoblin && input.interactJustPressed) {
      const keyCenter = this.keyBokoblin.getCenter()
      const dx = playerCenter.x - keyCenter.x
      const dy = playerCenter.y - keyCenter.y
      if (dx * dx + dy * dy <= INTERACT_RADIUS * INTERACT_RADIUS) {
        this.keyCollected = true
        this.objectives[0]!.completed = true
        this.enemies = this.enemies.filter((e) => e !== this.keyBokoblin)
        this.keyBokoblin = null
      }
    }

    // 2. Open gate (automatic when player touches a gate tile from any side)
    if (this.keyCollected && !this.gateOpen) {
      const aabb = player.getAABB()
      const touchesGate = [
        { x: playerCenter.x, y: aabb.y - 1 }, // tile above
        { x: playerCenter.x, y: aabb.y + aabb.height + 1 }, // tile below
        { x: aabb.x - 1, y: playerCenter.y }, // tile left
        { x: aabb.x + aabb.width + 1, y: playerCenter.y }, // tile right
      ].some((pt) => Physics.getTileAt(map, pt.x, pt.y) === 'gate')
      if (touchesGate) {
        this.gateOpen = true
        this.objectives[1]!.completed = true
        for (let row = 0; row < map.height; row++) {
          const tileRow = map.tiles[row]
          if (!tileRow) continue
          for (let col = 0; col < map.width; col++) {
            if (tileRow[col] === 'gate') {
              tileRow[col] = 'ground'
            }
          }
        }
      }
    }

    // 3. Open chest
    if (this.gateOpen && !this.chestOpened && input.interactJustPressed) {
      const chestCenter = { x: CHEST_POS.x + TILE_SIZE / 2, y: CHEST_POS.y + TILE_SIZE / 2 }
      const dx = playerCenter.x - chestCenter.x
      const dy = playerCenter.y - chestCenter.y
      if (dx * dx + dy * dy <= INTERACT_RADIUS * INTERACT_RADIUS) {
        this.chestOpened = true
        this.objectives[2]!.completed = true
        this.itemGetActive = true
        this.itemGetTimer = 1.5
        player.unlockWeapons()
      }
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    renderer: Renderer,
    map: TileMap,
    _effects: Effects,
    _camera: Camera,
  ): void {
    // 1. Draw vision cones (under entities) — hidden during combat phase
    if (!this.combatPhaseActive) {
      for (const enemy of this.enemies) {
        if (!enemy.isAlive()) continue
        const cone = enemy.getVisionConeParams()
        renderer.drawVisionCone(
          ctx,
          cone.center,
          cone.angle,
          cone.range,
          cone.halfAngle,
          cone.state,
          map,
        )
      }
    }

    // 2. Draw enemies (including dying ones)
    for (const enemy of this.enemies) {
      if (!enemy.isFullyDead()) {
        enemy.draw(ctx)
      }
    }

    // 3. Draw alert indicators (over entities)
    for (const enemy of this.enemies) {
      if (!enemy.isAlive()) continue
      const cone = enemy.getVisionConeParams()
      renderer.drawAlertIndicator(ctx, { x: cone.center.x, y: cone.center.y - 20 }, cone.state)
    }

    // 4. Draw floating key icon above key Bokoblin
    if (this.keyBokoblin !== null && this.keyBokoblin.isAlive()) {
      const kc = this.keyBokoblin.getCenter()
      renderer.drawFloatingIcon(ctx, kc, 'key', (this.keyBokoblin as Bokoblin).floatTimer)
    }

    // 5. Draw item-get overlay
    if (this.itemGetActive) {
      this.drawItemGetOverlay(ctx)
    }
  }

  private drawItemGetOverlay(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    const cx = ctx.canvas.width / 2
    const cy = ctx.canvas.height / 2

    ctx.textAlign = 'center'
    ctx.fillStyle = '#FFB830'
    ctx.font = 'bold 20px monospace'
    ctx.fillText('✨ Bạn tìm thấy vũ khí huyền thoại! ✨', cx, cy - 16)

    ctx.fillStyle = '#F0EDE6'
    ctx.font = '15px monospace'
    ctx.fillText('Space: Kiếm   Shift: Khiên   E: Cung', cx, cy + 16)

    ctx.fillStyle = '#8B9DB5'
    ctx.font = '13px monospace'
    ctx.fillText('(hoặc nút ⚔️ 🛡️ 🏹 trên màn hình cảm ứng)', cx, cy + 40)

    ctx.textAlign = 'start'
    ctx.restore()
  }

  drawPrompts(ctx: CanvasRenderingContext2D, renderer: Renderer, playerCenter: Vec2): void {
    if (!this.keyCollected && this.keyBokoblin) {
      const kc = this.keyBokoblin.getCenter()
      const dx = playerCenter.x - kc.x
      const dy = playerCenter.y - kc.y
      if (dx * dx + dy * dy <= INTERACT_RADIUS * INTERACT_RADIUS) {
        renderer.drawInteractPrompt(ctx, { x: kc.x, y: kc.y - 24 }, 'Nhấn F')
      }
    }

    if (this.gateOpen && !this.chestOpened) {
      const cc = { x: CHEST_POS.x + TILE_SIZE / 2, y: CHEST_POS.y + TILE_SIZE / 2 }
      const dx = playerCenter.x - cc.x
      const dy = playerCenter.y - cc.y
      if (dx * dx + dy * dy <= INTERACT_RADIUS * INTERACT_RADIUS) {
        renderer.drawInteractPrompt(ctx, { x: cc.x, y: cc.y - 8 }, 'Nhấn F')
      }
    }
  }

  getStatus(): {
    keyCollected: boolean
    chestOpened: boolean
    gateOpen: boolean
    enemyCount: number
    alertCount: number
  } {
    return {
      keyCollected: this.keyCollected,
      chestOpened: this.chestOpened,
      gateOpen: this.gateOpen,
      enemyCount: this.enemies.filter((e) => e.isAlive()).length,
      alertCount: this.enemies.filter((e) => e.isAlive() && e.aiState !== 'patrol').length,
    }
  }

  isComplete(): boolean {
    if (!this.combatPhaseActive || this.combatEnemyCount === 0) return false
    const allDead = this.enemies.every((e) => !e.isAlive())
    if (allDead && !this.objectives[3]!.completed) {
      this.objectives[3]!.completed = true
    }
    return allDead
  }

  isItemGetActive(): boolean {
    return this.itemGetActive
  }

  getStats(): { enemiesDefeated: number; damageTaken: number } {
    return { enemiesDefeated: this.totalEnemiesDefeated, damageTaken: 0 }
  }

  /** Collect pending archer projectile requests for ProjectileManager */
  getArcherProjectileRequests(): ProjectileSpawnRequest[] {
    // Only spawn archer projectiles during combat phase
    if (!this.combatPhaseActive) return []
    const requests: ProjectileSpawnRequest[] = []
    for (const enemy of this.enemies) {
      if (enemy instanceof BokoblinArcher && enemy.isAlive()) {
        const req = enemy.getProjectileRequest()
        if (req) requests.push(req)
      }
    }
    return requests
  }

  getEnemies(): Enemy[] {
    return this.enemies
  }
}
