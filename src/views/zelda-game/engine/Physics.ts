import { TILE_SIZE } from '../utils/constants'
import type { AABB, Vec2, TileMap, TileType, Direction } from '../utils/types'

/** Tiles that entities can walk on */
const WALKABLE_TILES: Set<TileType> = new Set(['empty', 'ground', 'bush'] as const)

export class Physics {
  /** Check if two AABBs overlap */
  static overlaps(a: AABB, b: AABB): boolean {
    return (
      a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
    )
  }

  /** Check if a tile at grid position is walkable */
  static isTileWalkable(map: TileMap, col: number, row: number): boolean {
    if (col < 0 || col >= map.width || row < 0 || row >= map.height) return false
    const tile = map.tiles[row]?.[col]
    return tile !== undefined && WALKABLE_TILES.has(tile)
  }

  /** Check if an AABB can occupy a position without hitting impassable tiles */
  static canMoveTo(map: TileMap, aabb: AABB): boolean {
    // Check all tile corners the AABB touches
    const left = Math.floor(aabb.x / TILE_SIZE)
    const right = Math.floor((aabb.x + aabb.width - 0.01) / TILE_SIZE)
    const top = Math.floor(aabb.y / TILE_SIZE)
    const bottom = Math.floor((aabb.y + aabb.height - 0.01) / TILE_SIZE)

    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        if (!Physics.isTileWalkable(map, col, row)) {
          return false
        }
      }
    }
    return true
  }

  /**
   * Resolve movement with wall sliding.
   * Try full movement first. If blocked, try X-only, then Y-only.
   * Returns the resolved position.
   */
  static resolveMovement(map: TileMap, currentPos: Vec2, desiredPos: Vec2, size: Vec2): Vec2 {
    const result = { x: currentPos.x, y: currentPos.y }

    // Try full movement
    const fullAABB: AABB = { x: desiredPos.x, y: desiredPos.y, width: size.x, height: size.y }
    if (Physics.canMoveTo(map, fullAABB)) {
      return desiredPos
    }

    // Try X axis only
    const xAABB: AABB = { x: desiredPos.x, y: currentPos.y, width: size.x, height: size.y }
    if (Physics.canMoveTo(map, xAABB)) {
      result.x = desiredPos.x
    }

    // Try Y axis only
    const yAABB: AABB = { x: result.x, y: desiredPos.y, width: size.x, height: size.y }
    if (Physics.canMoveTo(map, yAABB)) {
      result.y = desiredPos.y
    }

    return result
  }

  /** Get tile type at a world position */
  static getTileAt(map: TileMap, worldX: number, worldY: number): TileType {
    const col = Math.floor(worldX / TILE_SIZE)
    const row = Math.floor(worldY / TILE_SIZE)
    if (col < 0 || col >= map.width || row < 0 || row >= map.height) return 'empty'
    return map.tiles[row]?.[col] ?? 'empty'
  }

  /** Find all entities within radius of a point */
  static findEntitiesInRadius(entities: AABB[], center: Vec2, radius: number): number[] {
    const indices: number[] = []
    const r2 = radius * radius
    for (let i = 0; i < entities.length; i++) {
      const e = entities[i]
      if (!e) continue
      const cx = e.x + e.width / 2
      const cy = e.y + e.height / 2
      const dx = cx - center.x
      const dy = cy - center.y
      if (dx * dx + dy * dy <= r2) {
        indices.push(i)
      }
    }
    return indices
  }

  /** Convert a Direction to an angle in radians (right=0, down=π/2, left=π, up=3π/2) */
  static directionToAngle(direction: Direction): number {
    const map: Record<Direction, number> = {
      right: 0,
      down: Math.PI / 2,
      left: Math.PI,
      up: Math.PI * 1.5,
    }
    return map[direction]
  }

  /**
   * Test if a point lies within a vision cone.
   * Uses squared distance (no sqrt) + angular check via atan2.
   */
  static isPointInCone(
    point: Vec2,
    coneCenter: Vec2,
    facingAngleRad: number,
    radiusPx: number,
    halfWidthRad: number = Math.PI / 6,
  ): boolean {
    const dx = point.x - coneCenter.x
    const dy = point.y - coneCenter.y
    const distSq = dx * dx + dy * dy
    if (distSq > radiusPx * radiusPx) return false
    if (distSq === 0) return true
    const pointAngle = Math.atan2(dy, dx)
    let angleDiff = pointAngle - facingAngleRad
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI
    return Math.abs(angleDiff) <= halfWidthRad
  }

  /**
   * Ray march from (x0,y0) to (x1,y1) checking for blocking tiles.
   * Uses 4px steps. Walls and trees block LOS; bushes do NOT.
   */
  static isLineOfSightClear(map: TileMap, x0: number, y0: number, x1: number, y1: number): boolean {
    const STEP = 4
    const dx = x1 - x0
    const dy = y1 - y0
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist === 0) return true
    const steps = Math.ceil(dist / STEP)
    const stepX = dx / steps
    const stepY = dy / steps
    for (let i = 1; i < steps; i++) {
      const tile = Physics.getTileAt(map, x0 + stepX * i, y0 + stepY * i)
      if (tile === 'wall' || tile === 'tree') return false
    }
    return true
  }
}
