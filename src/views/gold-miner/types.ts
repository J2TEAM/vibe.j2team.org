export interface Position {
  x: number
  y: number
}

export type ItemType = 'gold' | 'stone' | 'diamond' | 'tnt' | 'mystery'

export interface GameItem {
  id: string
  type: ItemType
  x: number
  y: number
  radius: number
  value: number
  weight: number // Affects pulling speed
  isCollected: boolean
}

export type HookState = 'IDLE' | 'SHOOTING' | 'RETRACTING'

export type GameMode = 'classic' | 'level'

export interface GameState {
  mode: GameMode
  score: number
  time: number
  level: number
  targetScore: number
  lives: number
  isGameOver: boolean
  isLevelComplete: boolean
  isPaused: boolean
  isBroken: boolean // For line breaking
}
