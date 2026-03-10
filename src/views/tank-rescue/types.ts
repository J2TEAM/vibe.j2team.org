export type Direction = 'up' | 'down' | 'left' | 'right'
export type GameState = 'menu' | 'playing' | 'paused' | 'won' | 'lost' | 'level_transition'

export interface Position {
  x: number
  y: number
}

export interface Bullet {
  x: number
  y: number
  dx: number
  dy: number
  owner: 'player' | 'enemy'
}

export interface Tank {
  x: number
  y: number
  width: number
  height: number
  direction: Direction
  speed: number
  health: number
  maxHealth: number
  lastShot: number
  shotInterval: number
}

export interface EnemyTank extends Tank {
  id: number
  alive: boolean
  pathTimer: number
  type: 'scout' | 'heavy' | 'sniper'
  flashTimer: number
}

export interface Particle {
  x: number
  y: number
  dx: number
  dy: number
  life: number
  maxLife: number
  color: string
  size: number
}

export interface PowerUp {
  x: number
  y: number
  type: 'health' | 'rapid_fire' | 'shield'
  timer: number
}

export interface Wall {
  x: number
  y: number
  width: number
  height: number
  destructible: boolean
  health: number
}

export interface LevelConfig {
  name: string
  enemies: Array<{ x: number; y: number; type: EnemyTank['type'] }>
  princessPos: Position
  playerPos: Position
}

export interface GameStats {
  score: number
  enemiesKilled: number
  shotsFired: number
  timePlayed: number
}
