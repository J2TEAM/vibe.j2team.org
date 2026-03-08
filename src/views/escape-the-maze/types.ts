export type Difficulty = 'noob' | 'medium' | 'hard' | 'asian'

export type GameState = 'idle' | 'playing' | 'finished'

export interface Cell {
  x: number
  y: number
  visited: boolean
  walls: {
    top: boolean
    right: boolean
    bottom: boolean
    left: boolean
  }
}

export interface Position {
  x: number
  y: number
}

export interface GameStats {
  time: number
  steps: number
  efficiency: number
  optimalSteps: number
}

export interface BestRecord {
  time: number
  steps: number
  efficiency: number
  date: string
}
