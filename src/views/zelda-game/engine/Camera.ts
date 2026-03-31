import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, CAMERA_LERP_FACTOR } from '../utils/constants'
import type { Vec2, Viewport, TileMap } from '../utils/types'

export class Camera {
  viewport: Viewport = { x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT }

  private shakeIntensity = 0
  private shakeDuration = 0
  private shakeOffsetX = 0
  private shakeOffsetY = 0

  /** Trigger a camera shake with given intensity (pixels) and duration (seconds) */
  addShake(intensity: number, duration: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity)
    this.shakeDuration = Math.max(this.shakeDuration, duration)
  }

  /** Advance the shake timer and randomize offset; call once per game update */
  updateShake(dt: number): void {
    if (this.shakeDuration <= 0) {
      this.shakeOffsetX = 0
      this.shakeOffsetY = 0
      return
    }
    this.shakeDuration -= dt
    const decay = Math.max(0, this.shakeDuration / 0.5)
    const amplitude = this.shakeIntensity * Math.min(1, decay)
    this.shakeOffsetX = (Math.random() - 0.5) * 2 * amplitude
    this.shakeOffsetY = (Math.random() - 0.5) * 2 * amplitude
    if (this.shakeDuration <= 0) {
      this.shakeIntensity = 0
      this.shakeOffsetX = 0
      this.shakeOffsetY = 0
    }
  }

  /** Get current shake offset (zero when not shaking) */
  getShakeOffset(): Vec2 {
    return { x: this.shakeOffsetX, y: this.shakeOffsetY }
  }

  private lerpEnabled = true

  /** Disable lerp for the next follow() call — snaps instantly (use on stage load) */
  snapNext(): void {
    this.lerpEnabled = false
  }

  /** Update camera to smoothly follow target, clamped to map bounds.
   *  Uses dt-compensated lerp (Red Team #11) so feel is consistent at any framerate. */
  follow(target: Vec2, map: TileMap, dt = 0): void {
    const mapPixelW = map.width * TILE_SIZE
    const mapPixelH = map.height * TILE_SIZE

    const targetX = Math.max(0, Math.min(target.x - CANVAS_WIDTH / 2, mapPixelW - CANVAS_WIDTH))
    const targetY = Math.max(0, Math.min(target.y - CANVAS_HEIGHT / 2, mapPixelH - CANVAS_HEIGHT))

    if (this.lerpEnabled && dt > 0) {
      // Frame-rate independent lerp (Red Team #11): same feel at 30fps and 120fps
      const alpha = 1 - Math.pow(1 - CAMERA_LERP_FACTOR, dt * 60)
      this.viewport.x += (targetX - this.viewport.x) * alpha
      this.viewport.y += (targetY - this.viewport.y) * alpha
    } else {
      // Snap: instant position (stage loads, first frame)
      this.viewport.x = targetX
      this.viewport.y = targetY
      this.lerpEnabled = true // Re-enable after snap
    }
  }

  /** Apply camera transform to canvas context (includes shake offset) */
  apply(ctx: CanvasRenderingContext2D): void {
    ctx.translate(-this.viewport.x + this.shakeOffsetX, -this.viewport.y + this.shakeOffsetY)
  }

  /** Convert world coords to screen coords */
  worldToScreen(pos: Vec2): Vec2 {
    return {
      x: pos.x - this.viewport.x,
      y: pos.y - this.viewport.y,
    }
  }

  /** Convert screen coords to world coords */
  screenToWorld(pos: Vec2): Vec2 {
    return {
      x: pos.x + this.viewport.x,
      y: pos.y + this.viewport.y,
    }
  }

  /** Get visible tile range for culling */
  getVisibleTileRange(map: TileMap): {
    startCol: number
    endCol: number
    startRow: number
    endRow: number
  } {
    return {
      startCol: Math.max(0, Math.floor(this.viewport.x / TILE_SIZE)),
      endCol: Math.min(map.width, Math.ceil((this.viewport.x + CANVAS_WIDTH) / TILE_SIZE)),
      startRow: Math.max(0, Math.floor(this.viewport.y / TILE_SIZE)),
      endRow: Math.min(map.height, Math.ceil((this.viewport.y + CANVAS_HEIGHT) / TILE_SIZE)),
    }
  }
}
