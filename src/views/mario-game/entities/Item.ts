import { TILE_SIZE, type AABB } from '../engine/Physics'

export type ItemType = 'coin'

export class Item {
  x: number
  y: number
  width = 20
  height = 20
  type: ItemType
  active = true
  animFrame = 0
  animTimer = 0
  floatOffset = 0

  constructor(type: ItemType, x: number, y: number) {
    this.type = type
    this.x = x * TILE_SIZE + 6
    this.y = y * TILE_SIZE + 6
  }

  get aabb(): AABB {
    return {
      x: this.x,
      y: this.y + Math.sin(this.floatOffset) * 3,
      width: this.width,
      height: this.height,
    }
  }

  update() {
    if (!this.active) return
    this.floatOffset += 0.05
    this.animTimer++
    if (this.animTimer > 15) {
      this.animTimer = 0
      this.animFrame = (this.animFrame + 1) % 4
    }
  }

  collect(): number {
    this.active = false
    if (this.type === 'coin') return 100
    return 0
  }
}
