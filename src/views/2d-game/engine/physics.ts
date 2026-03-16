import type { Platform } from '../types'
import { GRAVITY, GROUND_Y, MAX_FALL_SPEED, FRICTION } from './constants'

export interface PhysicsBody {
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  onGround: boolean
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** AABB collision detection */
export function rectCollide(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

/** Apply gravity, friction, and platform collision to a physics body */
export function resolveGravity(e: PhysicsBody, platforms: Platform[]): void {
  e.vy += GRAVITY
  if (e.vy > MAX_FALL_SPEED) e.vy = MAX_FALL_SPEED
  e.x += e.vx
  e.y += e.vy
  e.vx *= FRICTION
  e.onGround = false

  // Ground collision
  if (e.y + e.h >= GROUND_Y) {
    e.y = GROUND_Y - e.h
    e.vy = 0
    e.onGround = true
  }

  // Platform collision (top only - one-way platforms)
  for (const p of platforms) {
    if (
      e.vy >= 0 &&
      e.x + e.w > p.x &&
      e.x < p.x + p.w &&
      e.y + e.h >= p.y &&
      e.y + e.h <= p.y + p.h + 6
    ) {
      e.y = p.y - e.h
      e.vy = 0
      e.onGround = true
    }
  }
}
