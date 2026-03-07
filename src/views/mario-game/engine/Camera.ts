export class Camera {
  x = 0
  y = 0
  width: number
  height: number

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
  }

  follow(targetX: number, targetY: number, levelWidth: number, levelHeight: number) {
    this.x = targetX - this.width / 2 + 16
    this.y = targetY - this.height / 2

    // Clamp to level bounds
    if (this.x < 0) this.x = 0
    if (this.y < 0) this.y = 0
    if (this.x + this.width > levelWidth) this.x = levelWidth - this.width
    if (this.y + this.height > levelHeight) this.y = levelHeight - this.height
  }
}
