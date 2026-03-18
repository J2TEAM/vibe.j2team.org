/**
 * Pure ballistics math — no Vue, no side effects.
 * All angles in DEGREES, converted internally for Math trig.
 */

export const GRAVITY = 400 // px/s² (game units)
export const WIND_ACCEL_SCALE = 25 // px/s² per wind unit
export const POWER_SCALE = 12 // max px/s velocity at power=100

/** Convert degrees to radians */
export function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Convert radians to degrees */
export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI
}

export interface BallisticsParams {
  x0: number
  y0: number
  /** degrees, 0 = horizontal right, positive = up */
  angleDeg: number
  /** 0–100 */
  power: number
  /** positive = rightward; accelerates bullet horizontally */
  wind: number
  facingRight: boolean
}

export interface Vec2 {
  x: number
  y: number
}

/** Compute initial velocity vector */
export function initialVelocity(angleDeg: number, power: number, facingRight: boolean): Vec2 {
  const speed = power * POWER_SCALE
  const rad = toRad(angleDeg)
  const dir = facingRight ? 1 : -1
  return {
    x: Math.cos(rad) * speed * dir,
    y: -Math.sin(rad) * speed, // negative because canvas Y grows down
  }
}

/** Step a projectile by dt seconds — Euler integration */
export function stepProjectile(
  pos: Vec2,
  vel: Vec2,
  wind: number,
  dt: number,
): { pos: Vec2; vel: Vec2 } {
  const ax = wind * WIND_ACCEL_SCALE
  const ay = GRAVITY

  const newVx = vel.x + ax * dt
  const newVy = vel.y + ay * dt // gravity pulls down (+y)

  const newX = pos.x + vel.x * dt + 0.5 * ax * dt * dt
  const newY = pos.y + vel.y * dt + 0.5 * ay * dt * dt

  return {
    pos: { x: newX, y: newY },
    vel: { x: newVx, y: newVy },
  }
}

/**
 * Compute an approximate aiming angle (degrees) for a given target distance.
 * Classic Gunny 65° rule: adjust angle ≈ 65 ± wind * 2.
 * Returns angle clamped to [minAngle, maxAngle].
 */
export function estimateAngle(
  wind: number,
  isTailwind: boolean,
  minAngle: number,
  maxAngle: number,
): number {
  const base = 65
  const adjustment = isTailwind ? wind * 2 : -wind * 2
  return Math.max(minAngle, Math.min(maxAngle, base + adjustment))
}

/**
 * Estimate required power to hit a target at `dx` horizontal distance
 * with a fixed angle, accounting for wind.
 *
 * Derivation (flat terrain, same start/end height):
 *   Time of flight:  T = 2·v₀·sin(θ) / g
 *   Horizontal:      dx = v₀·cos(θ)·dir·T + ½·W·T²
 *                       = 2·v₀²·s·( c·dir/g  +  W·s/g² )
 *   Solve for v₀²:   v₀² = dx / [ 2·s·( c·dir/g  +  W·s/g² ) ]
 *
 * Where W = wind * WIND_ACCEL_SCALE, s = sin(θ), c = cos(θ), dir = ±1.
 * Returns power clamped 10–95.
 */
export function estimatePower(
  dx: number,
  angleDeg: number,
  facingRight: boolean,
  wind: number = 0,
): number {
  const dir = facingRight ? 1 : -1
  const targetDir = dx > 0 ? 1 : -1
  const rad = toRad(angleDeg)
  const s = Math.sin(rad)
  const c = Math.cos(rad)

  if (s < 0.01) return 50

  const W = wind * WIND_ACCEL_SCALE
  // denominator from the wind-corrected range formula
  const denom = 2 * s * ((c * dir) / GRAVITY + (W * s) / (GRAVITY * GRAVITY))

  if (Math.abs(denom) < 1e-6) return 50

  const v0Sq = dx / denom
  if (v0Sq <= 0) {
    // Target unreachable with this angle + facing combination
    return targetDir !== dir ? 50 : 50
  }

  const v0 = Math.sqrt(v0Sq)
  const power = v0 / POWER_SCALE
  const clamped = Math.max(10, Math.min(95, power))

  if (targetDir !== dir) return Math.min(clamped, 80)
  return clamped
}

/** Trident spread offsets in radians (3 projectiles) */
export const TRIDENT_OFFSETS = [-toRad(10), 0, toRad(10)]
