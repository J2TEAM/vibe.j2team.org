export interface Tank {
  x: number
  y: number
  width: number
  height: number
  color: string
  barrelColor: string
  angle: number // radians
  facingRight: boolean // true if facing right
  hp: number
}

export interface Projectile {
  x: number
  y: number
  vx: number
  vy: number
  trail: { x: number; y: number }[]
  active: boolean
  damageMultiplier: number
  explosionRadiusMultiplier: number
  weaponId: string
}

export interface Weapon {
  id: string
  name: string
  staminaCost: number
  damageMultiplier: number
  explosionRadiusMultiplier: number
  projectilesCount: number
  shotsPerTurn: number
  spreadAngle: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

export interface Star {
  x: number
  y: number
  size: number
  brightness: number
}

export interface Difficulty {
  id: string
  label: string
  icon: string
  accuracy: number // 0~1, how close bot aims
}

export interface GameStats {
  totalShots: number
  totalHits: number
}

export type GameState = 'menu' | 'playing' | 'gameover'
export type Turn = 'player' | 'bot'
export type Winner = 'player' | 'bot'
