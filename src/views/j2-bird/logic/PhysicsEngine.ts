// ---------------------------------------------------------------------------
// PhysicsEngine.ts — pure functions, no Vue, no side effects
// ---------------------------------------------------------------------------

// ---- Constants ---------------------------------------------------------------
export const GRAVITY        = 0.45
export const FLAP_FORCE     = -8.5
export const PIPE_SPEED_BASE = 2.8
export const PIPE_GAP        = 160   // px between top/bottom firewall
export const PIPE_WIDTH      = 64
export const PIPE_INTERVAL   = 95    // frames between spawns
export const BIRD_RADIUS     = 18
export const POWERUP_RADIUS  = 16
export const POWERUP_DURATION = 5000 // ms
export const CANVAS_H        = 560

// ---- Types -------------------------------------------------------------------
export interface Bird {
  x: number
  y: number
  vel: number
  invincible: boolean
  invincibleUntil: number
}

export interface Firewall {
  id: number
  x: number
  gapY: number   // Y of gap center
  passed: boolean
  errorCode: string
}

export interface PowerUp {
  id: number
  x: number
  y: number
  collected: boolean
  angle: number
}

// ---- Factory functions -------------------------------------------------------
const ERROR_CODES = ['ERR_403', 'ERR_404', 'ERR_500', 'ERR_503', 'BLOCKED', 'DENIED']

export function createBird(birdX: number): Bird {
  return { x: birdX, y: CANVAS_H / 2, vel: -2, invincible: false, invincibleUntil: 0 }
}

export function createFirewall(id: number, canvasW: number): Firewall {
  const margin = 80
  const gapY = margin + PIPE_GAP / 2 + Math.random() * (CANVAS_H - margin * 2 - PIPE_GAP)
  const code  = ERROR_CODES[Math.floor(Math.random() * ERROR_CODES.length)] ?? 'ERR_404'
  return { id, x: canvasW + 10, gapY, passed: false, errorCode: code }
}

export function createPowerUp(id: number, canvasW: number): PowerUp {
  return {
    id,
    x: canvasW + 50,
    y: 90 + Math.random() * (CANVAS_H - 180),
    collected: false,
    angle: 0,
  }
}

// ---- Physics update ---------------------------------------------------------
export function applyGravity(bird: Bird): Bird {
  return {
    ...bird,
    vel: Math.min(bird.vel + GRAVITY, 12),
    y: bird.y + bird.vel,
  }
}

export function flap(bird: Bird): Bird {
  return { ...bird, vel: FLAP_FORCE }
}

export function getPipeSpeed(score: number): number {
  return PIPE_SPEED_BASE + Math.floor(score / 10) * 0.25
}

// ---- Collision ----------------------------------------------------------------
export function checkCollision(
  bird: Bird,
  firewalls: Firewall[],
  now: number,
): boolean {
  // Floor / ceiling
  if (bird.y - BIRD_RADIUS < 0 || bird.y + BIRD_RADIUS > CANVAS_H) return true
  // Invincible → skip pipe collision
  if (bird.invincible && now < bird.invincibleUntil) return false

  return firewalls.some(fw => {
    // x overlap?
    if (bird.x + BIRD_RADIUS - 4 < fw.x || bird.x - BIRD_RADIUS + 4 > fw.x + PIPE_WIDTH) return false
    // y gap check
    const gapTop    = fw.gapY - PIPE_GAP / 2
    const gapBottom = fw.gapY + PIPE_GAP / 2
    return bird.y - BIRD_RADIUS + 4 < gapTop || bird.y + BIRD_RADIUS - 4 > gapBottom
  })
}

// ---- Power-up collection -----------------------------------------------------
export function collectPowerUps(bird: Bird, powerUps: PowerUp[]): number[] {
  return powerUps
    .filter(p => !p.collected)
    .filter(p => {
      const dx = bird.x - p.x
      const dy = bird.y - p.y
      return Math.sqrt(dx * dx + dy * dy) < BIRD_RADIUS + POWERUP_RADIUS + 6
    })
    .map(p => p.id)
}
