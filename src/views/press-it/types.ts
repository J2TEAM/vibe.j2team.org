export type GamePhase = 'idle' | 'tutorial' | 'countdown' | 'playing' | 'paused' | 'dead'
export type HitResult = 'perfect' | 'good' | 'miss'
export type GameMode = 'basic' | 'medium' | 'hard' | 'asian' | 'customized'
export type KeyButton = 'A' | 'W' | 'S' | 'D'

export interface BeatChallenge {
  keys: KeyButton[]
  mouse: boolean
  holdDuration: number // 0 = no hold; >0 = seconds to hold (asian mode)
}

export interface CustomConfig {
  useMouse: boolean
  useKeys: boolean
  maxKeys: number // 1-4
  useHold: boolean
  maxHoldTime: number // seconds
}

export interface Meme {
  id: number
  emoji: string
  text: string
  subtext: string
}
