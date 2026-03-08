export type GamePhase = 'idle' | 'countdown' | 'playing' | 'dead'

export type HitResult = 'perfect' | 'good' | 'miss'

export interface Meme {
  id: number
  emoji: string
  text: string
  subtext: string
}
