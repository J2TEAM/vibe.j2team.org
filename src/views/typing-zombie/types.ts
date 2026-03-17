export interface Zombie {
  id: string
  word: string
  /** Horizontal position in % (100 = right edge, 0 = player/left edge) */
  x: number
  /** Vertical position in % from top */
  y: number
  /** Pixels per frame to move left */
  speed: number
  /** Whether this zombie is the active target (word partially matched) */
  active: boolean
}

export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover'

export interface PixelEffect {
  id: string
  x: number
  y: number
  kind: 'explode'
}

export interface GameState {
  score: number
  health: number
  maxHealth: number
  zombies: Zombie[]
  effects: PixelEffect[]
  typedText: string
  status: GameStatus
  difficulty: number
  highScore: number
}
