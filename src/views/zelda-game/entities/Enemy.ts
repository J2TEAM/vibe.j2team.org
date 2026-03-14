import type { Vec2, TileMap, AlertState, PatrolRoute } from '../utils/types'
import { VISION_RANGE, VISION_HALF_ANGLE_RAD, ALERT_TRANSITION_TIME, CHASE_TIMEOUT,
  VISION_CHECK_INTERVAL, TILE_SIZE, PATROL_PAUSE_TIME } from '../utils/constants'
import { BaseEntity } from './BaseEntity'
import { Physics } from '../engine/Physics'
import type { Player } from './Player'

const HOME_ZONE_RADIUS = 8 * TILE_SIZE // 256px — enemies won't chase beyond this from spawn
const SNAP_DIST_SQ = (TILE_SIZE / 4) ** 2

export abstract class Enemy extends BaseEntity {
  patrolRoute: PatrolRoute
  currentWaypointIdx = 0
  aiState: AlertState = 'patrol'
  alertTimer = 0
  chaseTimer = 0
  lastKnownPlayerPos: Vec2 | null = null
  visionCheckCounter = Math.floor(Math.random() * VISION_CHECK_INTERVAL)
  spawnPos: Vec2
  waypointPauseTimer = 0
  lastHitSwingID = -1  // prevents double-hit from the same sword swing
  isAggressive = false

  constructor(spawnPos: Vec2, patrolRoute: PatrolRoute, speed: number, maxHealth: number, size: Vec2) {
    super(spawnPos, size, maxHealth, speed)
    this.spawnPos = { ...spawnPos }
    this.patrolRoute = patrolRoute
  }

  update(dt: number, ...args: unknown[]): void {
    this.updateAI(dt, args[0] as Player, args[1] as TileMap)
  }

  /** Properly typed AI update — Stage1 should call this directly */
  updateAI(dt: number, player: Player, map: TileMap): void {
    // If dying or dead, just update the death timer and stop AI
    if (this.deathState !== 'alive') {
      this.updateDeathTimer(dt)
      return
    }

    this.visionCheckCounter++

    // Aggressive mode: always chase, skip patrol/alert
    if (this.isAggressive) {
      this.aiState = 'chase'
      this.updateChase(dt, player, map)
    } else {
      switch (this.aiState) {
        case 'patrol': this.updatePatrol(dt, map, player); break
        case 'alert': this.updateAlert(dt, player); break
        case 'chase': this.updateChase(dt, player, map); break
      }
    }

    this.updateInvulnerability(dt)
    this.animation.update(dt)
  }

  setAggressive(): void {
    this.isAggressive = true
    this.aiState = 'chase'
  }

  private enterAlert(player: Player): void {
    this.aiState = 'alert'
    this.alertTimer = ALERT_TRANSITION_TIME
    this.lastKnownPlayerPos = { ...player.getCenter() }
  }

  private returnToPatrol(): void {
    this.aiState = 'patrol'
    this.currentWaypointIdx = this.findNearestWaypoint()
    this.lastKnownPlayerPos = null
  }

  private updatePatrol(dt: number, map: TileMap, player: Player): void {
    if (this.waypointPauseTimer > 0) {
      this.waypointPauseTimer -= dt
      this.animation.play('idle', this.direction)
      if (this.checkVision(player, map)) this.enterAlert(player)
      return
    }
    if (this.patrolRoute.length > 0) {
      const wp = this.patrolRoute[this.currentWaypointIdx]!
      const stuck = this.moveToward(wp, dt, map)
      const dx = wp.x - this.pos.x, dy = wp.y - this.pos.y
      if (stuck || dx * dx + dy * dy < SNAP_DIST_SQ) {
        this.currentWaypointIdx = (this.currentWaypointIdx + 1) % this.patrolRoute.length
        this.waypointPauseTimer = PATROL_PAUSE_TIME
      }
    }
    if (this.checkVision(player, map)) this.enterAlert(player)
  }

  private updateAlert(dt: number, player: Player): void {
    this.alertTimer -= dt
    this.lastKnownPlayerPos = { ...player.getCenter() }
    // Face player, stay still
    const pc = player.getCenter(), mc = this.getCenter()
    const dx = pc.x - mc.x, dy = pc.y - mc.y
    this.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')
    this.animation.play('idle', this.direction)
    if (this.alertTimer <= 0) {
      this.aiState = 'chase'
      this.chaseTimer = CHASE_TIMEOUT
    }
  }

  private updateChase(dt: number, player: Player, map: TileMap): void {
    // Home zone check — skip when aggressive
    if (!this.isAggressive) {
      const sdx = this.pos.x - this.spawnPos.x, sdy = this.pos.y - this.spawnPos.y
      if (sdx * sdx + sdy * sdy > HOME_ZONE_RADIUS * HOME_ZONE_RADIUS) {
        this.returnToPatrol(); return
      }
    }
    const playerCenter = player.getCenter()
    this.moveToward({ x: playerCenter.x - this.size.x / 2, y: playerCenter.y - this.size.y / 2 }, dt, map)
    // Collision damage + knockback
    if (Physics.overlaps(this.getAABB(), player.getAABB()) && !player.isInvulnerable()) {
      player.takeDamage(1)
      const ec = this.getCenter(), pc = player.getCenter()
      const kx = pc.x - ec.x, ky = pc.y - ec.y
      const kDist = Math.sqrt(kx * kx + ky * ky)
      if (kDist > 0) {
        const kb = Math.min(20, TILE_SIZE / 2)
        const pushed = Physics.resolveMovement(map, player.pos,
          { x: player.pos.x + (kx / kDist) * kb, y: player.pos.y + (ky / kDist) * kb }, player.size)
        const mw = map.width * TILE_SIZE, mh = map.height * TILE_SIZE
        player.pos.x = Math.max(0, Math.min(mw - player.size.x, pushed.x))
        player.pos.y = Math.max(0, Math.min(mh - player.size.y, pushed.y))
      }
    }
    // LOS refresh or timeout — skip when aggressive (always track player)
    if (this.isAggressive) {
      this.lastKnownPlayerPos = { ...playerCenter }
    } else {
      if (this.checkVision(player, map)) {
        this.chaseTimer = CHASE_TIMEOUT
        this.lastKnownPlayerPos = { ...playerCenter }
      } else {
        this.chaseTimer -= dt
        if (this.chaseTimer <= 0) this.returnToPatrol()
      }
    }
  }

  checkVision(player: Player, map: TileMap): boolean {
    if (this.visionCheckCounter % VISION_CHECK_INTERVAL !== 0) return false
    const mc = this.getCenter(), pc = player.getCenter()
    const dx = pc.x - mc.x, dy = pc.y - mc.y
    if (dx * dx + dy * dy > VISION_RANGE * VISION_RANGE) return false
    // Bush hiding: hidden if ANY AABB corner is on a bush tile
    const a = player.getAABB()
    const corners: Vec2[] = [
      { x: a.x, y: a.y }, { x: a.x + a.width, y: a.y },
      { x: a.x, y: a.y + a.height }, { x: a.x + a.width, y: a.y + a.height },
    ]
    if (corners.some((c) => Physics.getTileAt(map, c.x, c.y) === 'bush')) return false
    // Cone + LOS
    const angle = Physics.directionToAngle(this.direction)
    if (!Physics.isPointInCone(pc, mc, angle, VISION_RANGE, VISION_HALF_ANGLE_RAD)) return false
    return Physics.isLineOfSightClear(map, mc.x, mc.y, pc.x, pc.y)
  }

  private moveToward(target: Vec2, dt: number, map: TileMap): boolean {
    const dx = target.x - this.pos.x, dy = target.y - this.pos.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 1) return false
    const desired = { x: this.pos.x + (dx / dist) * this.speed * dt, y: this.pos.y + (dy / dist) * this.speed * dt }
    const resolved = Physics.resolveMovement(map, this.pos, desired, this.size)
    const stuck = Math.abs(resolved.x - this.pos.x) + Math.abs(resolved.y - this.pos.y) < 0.1
    this.pos.x = resolved.x
    this.pos.y = resolved.y
    this.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')
    this.animation.play('walk', this.direction)
    return stuck
  }

  private findNearestWaypoint(): number {
    let bestIdx = 0, bestDist = Infinity
    for (let i = 0; i < this.patrolRoute.length; i++) {
      const wp = this.patrolRoute[i]!
      const dx = wp.x - this.pos.x, dy = wp.y - this.pos.y
      const d = dx * dx + dy * dy
      if (d < bestDist) { bestDist = d; bestIdx = i }
    }
    return bestIdx
  }

  getVisionConeParams(): { center: Vec2; angle: number; range: number; halfAngle: number; state: AlertState } {
    return {
      center: this.getCenter(), angle: Physics.directionToAngle(this.direction),
      range: VISION_RANGE, halfAngle: VISION_HALF_ANGLE_RAD, state: this.aiState,
    }
  }
}
