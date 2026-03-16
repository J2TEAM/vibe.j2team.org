import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants'

interface Star {
  x: number
  initialY: number
  size: number
  speed: number
  phase: number
}

/** Animated starfield: twinkling stars with slow downward drift. */
export class StarfieldBackground {
  private stars: Star[]

  constructor(count = 80) {
    this.stars = Array.from({ length: count }, () => ({
      x: Math.random() * CANVAS_WIDTH,
      initialY: Math.random() * CANVAS_HEIGHT,
      size: 0.5 + Math.random() * 1.5,
      speed: 5 + Math.random() * 10,
      phase: Math.random() * Math.PI * 2,
    }))
  }

  /** Draw all stars. `t` is elapsed time in seconds. */
  draw(ctx: CanvasRenderingContext2D, t: number): void {
    for (const s of this.stars) {
      // Time-based position: no mutable state, deterministic from t
      const y = (s.initialY + t * s.speed) % CANVAS_HEIGHT
      // Twinkling: alpha oscillates between 0.4 and 1.0
      const alpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.2 + s.phase))
      ctx.fillStyle = `rgba(240, 237, 230, ${alpha.toFixed(3)})`
      const px = s.size > 1 ? 2 : 1
      ctx.fillRect(Math.round(s.x), Math.round(y), px, px)
    }
  }
}
