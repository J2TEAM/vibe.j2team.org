export type ZombieType = 'normal' | 'fast' | 'tank' | 'boss'
export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover'
export type PowerUpType = 'slow' | 'auto' | 'bomb' | 'double'

export type EffectKind = 'explode' | 'score' | 'combo' | 'powerup' | 'streak'

export interface Zombie {
  id: string
  type: ZombieType
  x: number
  y: number
  speed: number // % per second
  size: number
  active: boolean
  word: string
  remainingWords: string[] // tank/boss: queue of next words after `word`
  maxWords: number // for UI progress
  rewardBase: number // before combo/double-score
}

export interface PixelEffect {
  id: string
  x: number
  y: number
  kind: EffectKind
  value?: string
}

export interface GameStateSnapshot {
  score: number
  health: number
  maxHealth: number
  shield: number
  status: GameStatus
  level: number
  difficulty: number
  combo: number
  multiplier: number
  highestCombo: number
  streak: string
  powerUps: PowerUpType[]
  powerUpActive: PowerUpType | null
  highScore: number
}
