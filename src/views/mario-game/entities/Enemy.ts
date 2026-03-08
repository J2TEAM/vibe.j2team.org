import { TILE_SIZE, type AABB, overlaps } from '../engine/Physics'
import type { Level } from '../world/Level'

export type EnemyType = 'goomba' | 'koopa'
export type EnemyState = 'walking' | 'stomped' | 'shell' | 'shell_moving' | 'dead'

export class Enemy {
  x: number
  y: number
  vx: number
  vy = 0
  width = 28
  height = 28
  type: EnemyType
  state: EnemyState = 'walking'
  facing: 'left' | 'right' = 'left'
  animFrame = 0
  animTimer = 0
  stompTimer = 0
  active = true

  constructor(type: EnemyType, x: number, y: number) {
    this.type = type
    this.x = x * TILE_SIZE + 2
    this.y = y * TILE_SIZE + (TILE_SIZE - 28)
    this.vx = type === 'koopa' ? -1.2 : -1
  }

  get aabb(): AABB {
    return { x: this.x, y: this.y, width: this.width, height: this.height }
  }

  stomp(): number {
    if (this.type === 'goomba') {
      this.state = 'stomped'
      this.stompTimer = 30
      this.vx = 0
      return 100
    }
    // Koopa -> shell
    if (this.state === 'walking') {
      this.state = 'shell'
      this.vx = 0
      this.height = 20
      this.y += 8
      return 100
    }
    if (this.state === 'shell') {
      this.state = 'shell_moving'
      this.vx = 6
      return 100
    }
    if (this.state === 'shell_moving') {
      this.state = 'shell'
      this.vx = 0
      return 0
    }
    return 0
  }

  kickShell(fromLeft: boolean) {
    this.state = 'shell_moving'
    this.vx = fromLeft ? 6 : -6
  }

  kill() {
    this.state = 'dead'
    this.active = false
  }

  isDangerous(): boolean {
    return this.state === 'walking' || this.state === 'shell_moving'
  }

  update(level: Level) {
    if (!this.active) return

    if (this.state === 'stomped') {
      this.stompTimer--
      if (this.stompTimer <= 0) {
        this.active = false
      }
      return
    }

    if (this.state === 'dead') return

    // Gravity
    this.vy += 0.5
    if (this.vy > 10) this.vy = 10

    // Move X
    this.x += this.vx
    this.facing = this.vx < 0 ? 'left' : 'right'

    // Wall collision
    const box = this.aabb
    const left = Math.floor(box.x / TILE_SIZE)
    const right = Math.floor((box.x + box.width - 1) / TILE_SIZE)
    const top = Math.floor(box.y / TILE_SIZE)
    const bottom = Math.floor((box.y + box.height - 1) / TILE_SIZE)

    for (let row = top; row <= bottom; row++) {
      if (level.isSolidAt(left, row) && this.vx < 0) {
        this.x = (left + 1) * TILE_SIZE
        this.vx = -this.vx
      }
      if (level.isSolidAt(right, row) && this.vx > 0) {
        this.x = right * TILE_SIZE - this.width
        this.vx = -this.vx
      }
    }

    // Move Y
    this.y += this.vy

    // Floor collision
    const footRow = Math.floor((this.y + this.height) / TILE_SIZE)
    const footLeft = Math.floor(this.x / TILE_SIZE)
    const footRight = Math.floor((this.x + this.width - 1) / TILE_SIZE)

    for (let col = footLeft; col <= footRight; col++) {
      if (level.isSolidAt(col, footRow)) {
        this.y = footRow * TILE_SIZE - this.height
        this.vy = 0
      }
    }

    // Lethal tile check
    const cx = Math.floor((this.x + this.width / 2) / TILE_SIZE)
    const cy = Math.floor((this.y + this.height) / TILE_SIZE)
    if (level.isLethalAt(cx, cy)) {
      this.kill()
    }

    // Fall off screen
    if (this.y > level.pixelHeight + 100) {
      this.active = false
    }

    // Turn at edges (only walking enemies, not shells)
    if (this.state === 'walking') {
      const aheadCol = this.vx < 0 ? footLeft : footRight
      const belowAhead = footRow
      if (!level.isSolidAt(aheadCol, belowAhead) && this.vy === 0) {
        this.vx = -this.vx
      }
    }

    // Animation
    this.animTimer++
    if (this.animTimer > 10) {
      this.animTimer = 0
      this.animFrame = (this.animFrame + 1) % 2
    }
  }

  static checkShellCollisions(enemies: Enemy[]) {
    for (const e of enemies) {
      if (e.state !== 'shell_moving' || !e.active) continue
      for (const other of enemies) {
        if (other === e || !other.active || other.state === 'dead' || other.state === 'stomped')
          continue
        if (overlaps(e.aabb, other.aabb)) {
          other.kill()
        }
      }
    }
  }
}
