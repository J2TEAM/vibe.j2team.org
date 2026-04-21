export type GameMode = 'single' | 'hotseat'

export type GamePhase = 'setup' | 'running' | 'turn-summary' | 'match-summary'

export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export interface Obstacle {
  id: number
  baseX: number
  x: number
  y: number
  radius: number
  speed: number
  sway: number
  phase: number
}

export interface Whirlpool {
  id: number
  x: number
  y: number
  radius: number
  strength: number
  spinOffset: number
}

export interface TrailPoint {
  id: number
  x: number
  y: number
  life: number
}

export interface Point {
  x: number
  y: number
}

export interface BoatState {
  x: number
  y: number
  vx: number
  vy: number
  hits: number
}

export interface WindState {
  x: number
  y: number
}
